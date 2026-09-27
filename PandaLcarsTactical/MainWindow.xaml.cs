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
    private LightningWindow? lightning;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const string Origin = "https://panda.local";
    private readonly LinkStore links = new(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "quicklaunch.json"));
    private readonly SystemInfo.ActivityStatus activity = new();
    private TacticalBrowserView? tacticalBrowser;
    private double? lastCpu, lastGpu;
    private DateTimeOffset lastAppInput = DateTimeOffset.Now, lastSample = DateTimeOffset.MinValue;
    private readonly DispatcherTimer activityTimer = new() { Interval = TimeSpan.FromSeconds(1) };
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
        Closed += (_, _) =>
        {
            closed = true; weatherRequest?.Cancel(); searchRequest?.Cancel();
            activityTimer.Stop(); tacticalBrowser?.Dispose();
            lightning?.Close(); Dashboard.Close(); http.Dispose();
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
            var core = Dashboard.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping("panda.local", Path.Combine(AppContext.BaseDirectory, "Assets"), CoreWebView2HostResourceAccessKind.DenyCors);
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsZoomControlEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
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
                if(args.IsSuccess) Dashboard.Focus(FocusState.Programmatic);
                if (!args.IsSuccess) StartupStatus.Text = "Ansicht konnte nicht geladen werden. Bitte App neu starten.";
            };
            core.Navigate(Origin + "/Web/index.html");
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            StartupStatus.Text = "WebView2 konnte nicht starten. Microsoft Edge WebView2 Runtime installieren und erneut starten.";
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
        try
        {
            using var document = JsonDocument.Parse(args.WebMessageAsJson);
            var message = document.RootElement;
            id = message.TryGetProperty("id", out var value) ? value.GetString() : null;
            switch (message.GetProperty("type").GetString())
            {
                case "services": SendServices(); break;
                case "serviceOpen":
                    var service = Settings.PersonalServices.Available.FirstOrDefault(s => s.Id == message.GetProperty("serviceId").GetString());
                    if (service is null) break;
                    bool launched;
                    if (FirefoxLauncher.Find() is not null) { FirefoxLauncher.Open(service.Url); launched = true; }
                    else launched = await Windows.System.Launcher.LaunchUriAsync(new Uri(service.Url));
                    if (!launched) throw new IOException("Browser konnte nicht geöffnet werden.");
                    services.SetEnabled(service.Id, true);
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
                    if (message.GetProperty("on").GetBoolean())
                    {
                        var place = message.GetProperty("place").Deserialize<GeoPlace>(Json) ?? GeoPlace.Vienna;
                        place.Validate();
                        if (lightning is null)
                        {
                            lightning = new LightningWindow(place);
                            lightning.Closed += (_, _) => { lightning = null; Send(new { type = "lightningClosed" }); };
                        }
                        lightning.Activate();
                    }
                    else lightning?.Close();
                    break;
            }
        }
        catch (OperationCanceledException) { if (id is not null) Send(new { type = "error", id, message = "Abfrage abgebrochen oder Zeitüberschreitung." }); }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        { Send(new { type = "error", id, message = "Dienst nicht erreichbar oder Daten unvollständig. Bitte erneut versuchen." }); }
    }
    private void SendLinks(string? id) => Send(new { type = "links", id, data = links.Links, warning = links.Warning });
    private void SendServices() => Send(new { type = "services", data = services.Snapshot(), warning = services.Warning });
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






