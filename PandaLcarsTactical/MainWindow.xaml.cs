using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.Web.WebView2.Core;
using PandaLcarsTactical.Security;
using PandaLcarsTactical.Weather;
using System.Net.Http;
using System.Text.Json;
using PandaLcarsTactical.Browser;
using PandaLcarsTactical.QuickLaunch;
namespace PandaLcarsTactical;
public sealed partial class MainWindow : Window
{
    private readonly HttpClient http = new() { Timeout = TimeSpan.FromSeconds(25) };
    private readonly IWeatherProvider provider;
    private readonly ApiKeyStore keys = new();
    private readonly Settings.PersonalServices services = new(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "services.json"));
    private readonly SystemInfo.SystemMonitor systemMonitor = new();
    private readonly SemaphoreSlim monitorLock = new(1, 1);
    private CancellationTokenSource? weatherRequest, searchRequest;
    private bool closed, initialized, settingsOpen;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const string Origin = "https://panda.local";
    private readonly LinkStore links = new(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "quicklaunch.json"));
    private readonly SystemInfo.ActivityStatus activity = new();
    private TacticalBrowserView? tacticalBrowser;
    private double? lastCpu, lastGpu;
    private DateTimeOffset lastAppInput = DateTimeOffset.Now, lastSample = DateTimeOffset.MinValue;
    private readonly DispatcherTimer activityTimer = new() { Interval = TimeSpan.FromSeconds(1) };
    private readonly Settings.DisplaySettings display = new();
    private readonly DispatcherTimer displayTimer = new() { Interval = TimeSpan.FromSeconds(2) };
    private int displayAttempts;
    private bool awaitingMonitor;
    private bool initialPresentationApplied;
    private Updates.UpdateRelease? availableUpdate;
    private bool updateBusy;
    public MainWindow()
    {
        InitializeComponent();
        AppWindow.SetIcon(Path.Combine(AppContext.BaseDirectory, "Assets", "panda-spock.ico"));
        Root.PointerMoved += (_, _) => lastAppInput = DateTimeOffset.Now;
        Root.KeyDown += (_, _) => lastAppInput = DateTimeOffset.Now;
        var browserEscape = new KeyboardAccelerator { Key = Windows.System.VirtualKey.Escape };
        browserEscape.Invoked += (_, e) => { if (tacticalBrowser is not null) { CloseTactical(); e.Handled = true; } };
        Root.KeyboardAccelerators.Add(browserEscape);
        var browserFullscreen = new KeyboardAccelerator { Key = Windows.System.VirtualKey.F11 };
        browserFullscreen.Invoked += (_, e) =>
        {
            if (tacticalBrowser is null) return;
            AppWindow.SetPresenter(AppWindow.Presenter.Kind == AppWindowPresenterKind.FullScreen ? AppWindowPresenterKind.Overlapped : AppWindowPresenterKind.FullScreen);
            e.Handled = true;
        };
        Root.KeyboardAccelerators.Add(browserFullscreen);
        activityTimer.Tick += async (_, _) => { await RefreshSystemAsync(); UpdateActivity(); };
        activityTimer.Start();
        provider = new OpenMeteoProvider(http);
        AppWindow.Resize(new Windows.Graphics.SizeInt32(1500, 980));
        displayTimer.Tick += (_, _) => { if (PlaceOnMonitor() || ++displayAttempts >= 30) displayTimer.Stop(); };
        awaitingMonitor = !PlaceOnMonitor();
        Closed += (_, _) =>
        {
            closed = true; weatherRequest?.Cancel(); searchRequest?.Cancel();
            activityTimer.Stop(); displayTimer.Stop(); tacticalBrowser?.Dispose();
            Dashboard.Close(); http.Dispose();
            _ = DisposeMonitorAsync();
        };
    }
    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (initialized) return;
        initialized = true;
        try
        {
            var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "WebView");
            await Dashboard.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateWithOptionsAsync(null, profile, null));
            if (closed) return;
            var core = Dashboard.CoreWebView2 ?? throw new IOException("Browserprofil ist noch belegt. Alle PandasLcars-Fenster schließen und erneut starten.");
            core.SetVirtualHostNameToFolderMapping("panda.local", Path.Combine(AppContext.BaseDirectory, "Assets"), CoreWebView2HostResourceAccessKind.DenyCors);
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsZoomControlEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
            Browser.MapRequestPolicy.Apply(core, () => Origin + "/Web/index.html");
            core.PermissionRequested += (_, args) => args.State = CoreWebView2PermissionState.Deny;
            core.NewWindowRequested += async (_, args) =>
            {
                args.Handled = true;
                if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var link) && link.Scheme == "https" &&
                    new[] { "rainviewer.com", "www.rainviewer.com", "cesium.com", "openstreetmap.org", "www.openstreetmap.org", "open-meteo.com", "www.open-meteo.com" }.Contains(link.Host))
                    await Windows.System.Launcher.LaunchUriAsync(link);
            };
            core.NavigationStarting += (_, args) =>
            {
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri) || uri.Host != "panda.local") args.Cancel = true;
            };
            core.WebMessageReceived += OnMessage;
            core.NavigationCompleted += (_, args) =>
            {
                StartupStatus.Visibility = args.IsSuccess ? Visibility.Collapsed : Visibility.Visible;
                if (args.IsSuccess && !initialPresentationApplied)
                {
                    initialPresentationApplied = true;
                    if (display.Fullscreen) AppWindow.SetPresenter(AppWindowPresenterKind.FullScreen);
                }
                if(args.IsSuccess) Dashboard.Focus(FocusState.Programmatic);
                if (!args.IsSuccess) StartupStatus.Text = "Ansicht konnte nicht geladen werden. Bitte App neu starten.";
            };
            core.Navigate(Origin + "/Web/index.html");
            if (awaitingMonitor) displayTimer.Start();
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            StartupStatus.Text = "WebView2 konnte nicht starten (" + ex.HResult.ToString("X8") + "). " + ex.Message + "\nPandasLcars schließen und erneut starten.";
            try { Settings.AtomicFile.Write(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "startup-error.txt"), ex.ToString()); } catch { }
        }
    }
    private void Send(object payload)
    {
        if (!closed && Dashboard.CoreWebView2 is { } core) core.PostWebMessageAsJson(JsonSerializer.Serialize(payload, Json));
    }
    private async void OnMessage(CoreWebView2 sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (!args.Source.StartsWith(Origin + "/", StringComparison.Ordinal)) return;
        string? id = null;
        string? messageType = null;
        try
        {
            using var document = JsonDocument.Parse(args.WebMessageAsJson);
            var message = document.RootElement;
            id = message.TryGetProperty("id", out var value) ? value.GetString() : null;
            messageType = message.GetProperty("type").GetString();
            switch (messageType)
            {
                case "displaySettings": SendDisplay(); break;
                case "displaySave":
                    var monitorId = message.GetProperty("monitorId").GetString();
                    if (monitorId != "auto" && !Settings.DisplaySettings.Monitors().Any(m => m.Id == monitorId)) throw new ArgumentException("Monitor nicht angeschlossen.");
                    Settings.DisplaySettings.Autostart = message.GetProperty("autostart").GetBoolean();
                    display.Save(monitorId == "auto" ? null : monitorId, message.GetProperty("fullscreen").GetBoolean());
                    displayTimer.Stop(); PlaceOnMonitor(); SendDisplay(); break;
                case "menu": await OpenMenuAsync(message.GetProperty("action").GetString() ?? "", message); break;
                case "updateCheck": await CheckUpdateAsync(); break;
                case "updateDownload": await DownloadUpdateAsync(); break;
                case "services": SendServices(); break;
                case "serviceOpen":
                    var service = Settings.PersonalServices.Available.FirstOrDefault(s => s.Id == message.GetProperty("serviceId").GetString());
                    if (service is null) break;
                    bool launched;
                    if (FirefoxLauncher.Find() is not null) { await OpenFirefoxAsync(service.Url); launched = true; }
                    else launched = await Windows.System.Launcher.LaunchUriAsync(new Uri(service.Url));
                    if (!launched) throw new IOException("Browser konnte nicht geöffnet werden.");
                    SendServices();
                    break;
                case "serviceRemove":
                    services.SetEnabled(message.GetProperty("serviceId").GetString() ?? "", false);
                    SendServices(); break;
                case "links": SendLinks(id); break;
                case "linkSave":
                    try
                    {
                        links.Save(message.TryGetProperty("linkId", out var linkId) && linkId.ValueKind == JsonValueKind.String ? linkId.GetString() : null,
                            message.GetProperty("name").GetString() ?? "", message.GetProperty("url").GetString() ?? "");
                        SendLinks(id);
                    }
                    catch (Exception ex) when (ex is ArgumentException or IOException or UnauthorizedAccessException)
                    { Send(new { type = "linkError", id, message = ex.Message }); }
                    break;
                case "linkDelete":
                    try { links.Delete(message.GetProperty("linkId").GetString() ?? ""); SendLinks(id); }
                    catch (Exception ex) when (ex is ArgumentException or IOException or UnauthorizedAccessException)
                    { Send(new { type = "linkError", id, message = ex.Message }); }
                    break;
                case "linkOpen":
                    var launch = links.Links.FirstOrDefault(x => x.Id == message.GetProperty("linkId").GetString());
                    if (launch is not null) await OpenTacticalAsync(launch);
                    break;
                case "activity": lastAppInput = DateTimeOffset.Now; break;
                case "warp":
                    lastAppInput = DateTimeOffset.Now;
                    activity.WarpRequested = message.GetProperty("on").GetBoolean(); UpdateActivity(); break;
                case "system":
                    await RefreshSystemAsync();
                    break;
                case "radar":
                    Send(new { type = "radar", id, data = await new RainViewerProvider(http).GetLatestAsync(CancellationToken.None) });
                    break;
                case "weather":
                    weatherRequest?.Cancel();
                    using (var current = new CancellationTokenSource())
                    {
                        weatherRequest = current;
                        try
                        {
                            var place = message.GetProperty("place").Deserialize<GeoPlace>(Json) ?? throw new ArgumentException();
                            place.Validate();
                            var report = await provider.GetAsync(place, current.Token);
                            if (current.IsCancellationRequested || weatherRequest != current) return;
                            var age = DateTimeOffset.UtcNow - report.Current.ValidAt;
                            if (age > TimeSpan.FromMinutes(90) || age < TimeSpan.FromMinutes(-15)) throw new InvalidDataException("Wetterdaten nicht aktuell.");
                            Send(new { type = "weather", id, data = report });
                        }
                        finally { if (weatherRequest == current) weatherRequest = null; }
                    }
                    break;
                case "search":
                    searchRequest?.Cancel();
                    using (var current = new CancellationTokenSource())
                    {
                        searchRequest = current;
                        try
                        {
                            var results = await new PlaceSearch(http).SearchAsync(message.GetProperty("query").GetString() ?? "", current.Token);
                            if (!current.IsCancellationRequested && searchRequest == current) Send(new { type = "search", id, data = results });
                        }
                        finally { if (searchRequest == current) searchRequest = null; }
                    }
                    break;
                case "cancelWeather": weatherRequest?.Cancel(); break;
                case "cancelSearch": searchRequest?.Cancel(); break;
                case "fullscreen":
                    AppWindow.SetPresenter(AppWindow.Presenter.Kind == AppWindowPresenterKind.FullScreen ? AppWindowPresenterKind.Overlapped : AppWindowPresenterKind.FullScreen);
                    break;
                case "escape":
                    if (tacticalBrowser is not null) { CloseTactical(); break; }
                    if (AppWindow.Presenter.Kind == AppWindowPresenterKind.FullScreen) AppWindow.SetPresenter(AppWindowPresenterKind.Overlapped);
                    break;
                case "settings": await ShowSettingsAsync(); break;
                case "lightning":
                    var lightningPlace = message.GetProperty("place").Deserialize<GeoPlace>(Json) ?? GeoPlace.Vienna;
                    lightningPlace.Validate();
                    var screen = display.Preferred(Settings.DisplaySettings.Monitors());
                    var lightningUrl=FormattableString.Invariant($"https://www.lightningmaps.org/?lang=de#m=oss;t=3;s=0;z=7;y={lightningPlace.Latitude};x={lightningPlace.Longitude};");
                    bool positioned=await FirefoxLauncher.OpenAsync(lightningUrl,screen ?? Settings.DisplaySettings.Monitors().FirstOrDefault(m=>m.Primary),true);
                    Send(new {type="notice",message=positioned?"Blitzkarte in Firefox geöffnet. Zum Schließen das Firefox-Fenster schließen.":"Blitzkarte geöffnet; Fensterposition bitte prüfen.",error=!positioned});
                    break;
            }
        }
        catch (OperationCanceledException) { if (id is not null) Send(new { type = "error", id, message = "Abfrage abgebrochen oder Zeitüberschreitung." }); }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            if(messageType=="lightning"){Send(new {type="notice",message="Blitzkarte konnte nicht in Firefox geöffnet werden. Firefox und Internetverbindung prüfen.",error=true});return;}
            bool serviceError = messageType?.StartsWith("service", StringComparison.Ordinal) == true;
            Send(new { type = messageType?.StartsWith("display") == true || messageType == "menu" ? "settingsError" : serviceError ? "serviceError" : "error", id, message = serviceError
                ? "Dienst konnte nicht geöffnet oder die Auswahl nicht gespeichert werden. Bitte erneut versuchen."
                : "Dienst nicht erreichbar oder Daten unvollständig. Bitte erneut versuchen." });
        }
    }
    private async Task OpenFirefoxAsync(string url)
    {
        if(!await FirefoxLauncher.OpenAsync(url))Send(new {type="notice",message="Firefox geöffnet; Fensterposition bitte prüfen.",error=true});
    }
    private void SendLinks(string? id) => Send(new { type = "links", id, data = links.Links, warning = links.Warning });
    private void SendServices() => Send(new { type = "services", data = services.Snapshot(), warning = services.Warning });
    private bool PlaceOnMonitor()
    {
        var monitors = Settings.DisplaySettings.Monitors();
        var preferred = display.Preferred(monitors);
        var selected = preferred ?? monitors.FirstOrDefault(m => m.Primary) ?? monitors.FirstOrDefault();
        if (selected is null) return false;
        if (preferred is not null && display.MonitorId is null)
        {
            try { display.Save(preferred.Id, display.Fullscreen); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
        // Only retry when the desired monitor is absent during Windows startup.
        if (displayAttempts == 0 || preferred is not null)
        {
            AppWindow.SetPresenter(AppWindowPresenterKind.Overlapped);
            AppWindow.MoveAndResize(new Windows.Graphics.RectInt32(selected.X, selected.Y, selected.Width, selected.Height));
            if (display.Fullscreen) AppWindow.SetPresenter(AppWindowPresenterKind.FullScreen);
        }
        return preferred is not null;
    }
    private void SendDisplay() => Send(new { type = "displaySettings", monitors = Settings.DisplaySettings.Monitors(),
        monitorId = display.MonitorId ?? "auto", fullscreen = display.Fullscreen, autostart = Settings.DisplaySettings.Autostart, warning = display.Warning });
    private async Task OpenMenuAsync(string action, JsonElement message)
    {
        switch (action)
        {
            case "tactical": CloseTactical(); break;
            case "system":
                if(!await ExternalWindows.LaunchAsync("SystemSettings",async()=>{if(!await Windows.System.Launcher.LaunchUriAsync(new Uri("ms-settings:")))throw new IOException("Windows-Einstellungen konnten nicht geöffnet werden.");}))
                    Send(new {type="notice",message="Windows-Einstellungen geöffnet; Fensterposition bitte prüfen.",error=true});
                break;
            case "web": await OpenFirefoxAsync("about:home"); break;
            case "maps":
                var targetPlace = message.GetProperty("place").Deserialize<GeoPlace>(Json) ?? GeoPlace.Vienna;
                targetPlace.Validate();
                await OpenTacticalAsync(new LaunchLink("maps", "Google Maps", FormattableString.Invariant($"https://www.google.com/maps/search/?api=1&query={targetPlace.Latitude},{targetPlace.Longitude}"), false)); break;
            case "data":
                if(!await ExternalWindows.LaunchAsync("explorer",()=>{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("explorer.exe") { UseShellExecute = true });return Task.CompletedTask;}))
                    Send(new {type="notice",message="Explorer geöffnet; Fensterposition bitte prüfen.",error=true});
                break;
            case "photos": case "calendar":
                var service = Settings.PersonalServices.Available.Single(s => s.Id == action);
                if (FirefoxLauncher.Find() is not null) await OpenFirefoxAsync(service.Url);
                else await Windows.System.Launcher.LaunchUriAsync(new Uri(service.Url));
                break;
            case "desktop": ShowDesktop(); break;
            case "power": await ShowPowerAsync(); break;
        }
    }
    private static void ShowDesktop()
    {
        var type = Type.GetTypeFromProgID("Shell.Application") ?? throw new IOException("Windows-Shell nicht verfügbar.");
        var shell = Activator.CreateInstance(type)!;
        try { type.InvokeMember("MinimizeAll", System.Reflection.BindingFlags.InvokeMethod, null, shell, null); }
        finally { System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shell); }
    }
    private async Task ShowPowerAsync()
    {
        var dialog = new ContentDialog { XamlRoot = Root.XamlRoot, Title = "POWER · Laptop", Content = "Offene Dokumente zuerst speichern. Welche Aktion möchtest du ausführen?", PrimaryButtonText = "Herunterfahren", SecondaryButtonText = "Neustart", CloseButtonText = "Abbrechen", DefaultButton = ContentDialogButton.Close };
        var choice = await dialog.ShowAsync();
        if (choice == ContentDialogResult.None) return;
        var confirm = new ContentDialog { XamlRoot = Root.XamlRoot, Title = "Aktion bestätigen", Content = choice == ContentDialogResult.Primary ? "Laptop jetzt herunterfahren?" : "Laptop jetzt neu starten?", PrimaryButtonText = "Ja, jetzt", CloseButtonText = "Abbrechen", DefaultButton = ContentDialogButton.Close };
        if (await confirm.ShowAsync() != ContentDialogResult.Primary) return;
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(Path.Combine(Environment.SystemDirectory, "shutdown.exe"), choice == ContentDialogResult.Primary ? "/s /t 0" : "/r /t 0") { UseShellExecute = false, CreateNoWindow = true });
    }
    private async Task CheckUpdateAsync()
    {
        if (updateBusy) return;
        updateBusy = true; Send(new { type = "update", state = "checking", message = "UPDATES SUCHEN …" });
        try
        {
            availableUpdate = await new Updates.UpdateClient(http).CheckAsync(new Version("0.6.2"));
            Send(new { type = "update", state = availableUpdate is null ? "current" : "available", message = availableUpdate is null ? "AKTUELL · 0.6.2" : "UPDATE " + availableUpdate.Tag + " VORHANDEN" });
        }
        catch { availableUpdate = null; Send(new { type = "update", state = "error", message = "UPDATEPRÜFUNG FEHLGESCHLAGEN" }); }
        finally { updateBusy = false; }
    }
    private async Task DownloadUpdateAsync()
    {
        if (updateBusy || availableUpdate is null) return;
        updateBusy = true; Send(new { type = "update", state = "downloading", message = "UPDATE WIRD GELADEN …" });
        try
        {
            var installer = await new Updates.UpdateClient(http).DownloadAsync(availableUpdate);
            Send(new { type = "update", state = "available", message = "UPDATE GEPRÜFT · BEREIT" });
            var dialog = new ContentDialog { XamlRoot = Root.XamlRoot, Title = "Update installieren", Content = "Download und SHA-256-Prüfung abgeschlossen. PandasLcars wird geschlossen und das Setup gestartet. Einstellungen bleiben erhalten. Der Installer ist nicht digital signiert; Windows oder Norton können ihn prüfen oder blockieren.", PrimaryButtonText = "Installieren", CloseButtonText = "Später", DefaultButton = ContentDialogButton.Close };
            if (await dialog.ShowAsync() == ContentDialogResult.Primary)
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(installer) { UseShellExecute = true });
                Close();
            }
        }
        catch { Send(new { type = "update", state = "available", message = "UPDATE NICHT GESTARTET · ERNEUT VERSUCHEN" }); }
        finally { updateBusy = false; }
    }
    private async Task RefreshSystemAsync()
    {
        if (closed || DateTimeOffset.Now - lastSample < TimeSpan.FromSeconds(2) || !await monitorLock.WaitAsync(0)) return;
        try
        {
            if (closed) return;
            var sample = await Task.Run(systemMonitor.Read);
            lastCpu = sample.Cpu; lastGpu = sample.Gpu; lastSample = DateTimeOffset.Now;
            Send(new { type = "system", data = sample });
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        { lastCpu = null; lastGpu = null; }
        finally { monitorLock.Release(); }
    }
    private void UpdateActivity()
    {
        var now = DateTimeOffset.Now;
        var idle = Math.Min(SystemInfo.ActivityStatus.ReadIdleSeconds() ?? (now - lastAppInput).TotalSeconds, (now - lastAppInput).TotalSeconds);
        var fresh = now - lastSample < TimeSpan.FromSeconds(10);
        Send(new { type = "activity", data = activity.Update(now, idle, fresh ? lastCpu : null, fresh ? lastGpu : null) });
    }
    private async Task OpenTacticalAsync(LaunchLink link)
    {
        lastAppInput = DateTimeOffset.Now;
        CloseTactical();
        var view = new TacticalBrowserView(new WebViewBrowser(), link.Name);
        tacticalBrowser = view;
        view.CloseRequested += CloseTactical;
        Root.Children.Add(view);
        Dashboard.Visibility = Visibility.Collapsed;
        await view.OpenAsync(link.Url);
    }
    private void CloseTactical()
    {
        if (tacticalBrowser is null) return;
        var view = tacticalBrowser; tacticalBrowser = null;
        view.CloseRequested -= CloseTactical; view.Dispose(); Root.Children.Remove(view);
        Dashboard.Visibility = Visibility.Visible; Dashboard.Focus(FocusState.Programmatic);
    }
    private async Task DisposeMonitorAsync()
    {
        await monitorLock.WaitAsync();
        try { systemMonitor.Dispose(); } finally { monitorLock.Release(); }
    }
    private async Task ShowSettingsAsync()
    {
        if (settingsOpen) return;
        settingsOpen = true;
        var password = new PasswordBox { Header = "Kachelmannwetter / Meteologix API-Key" };
        var saved = new TextBlock { Text = keys.HasKey ? "Schlüssel geschützt gespeichert." : "Noch kein Schlüssel gespeichert.", TextWrapping = TextWrapping.Wrap };
        var panel = new StackPanel { Spacing = 14, Width = 420 };
        panel.Children.Add(new TextBlock { Text = "Aktiv: Open-Meteo. Kachelmann-Adapter vorbereitet. Ein Schlüssel allein aktiviert keine zusätzliche Datenquelle oder Radar-Freigabe.", TextWrapping = TextWrapping.Wrap });
        panel.Children.Add(password); panel.Children.Add(saved);
        var dialog = new ContentDialog { XamlRoot = Root.XamlRoot, Title = "Wetter-Zugang", Content = panel, PrimaryButtonText = "Speichern", SecondaryButtonText = "Schlüssel löschen", CloseButtonText = "Schließen" };
        dialog.PrimaryButtonClick += (_, args) =>
        {
            try { keys.Save(password.Password); password.Password = ""; }
            catch { args.Cancel = true; saved.Text = "Schlüssel konnte nicht gespeichert werden."; }
        };
        dialog.SecondaryButtonClick += (_, args) =>
        {
            try { keys.Delete(); }
            catch { args.Cancel = true; saved.Text = "Schlüssel konnte nicht gelöscht werden."; }
        };
        try { await dialog.ShowAsync(); }
        finally { password.Password = ""; settingsOpen = false; }
    }
}
