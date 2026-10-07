using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using PandaLcarsTactical.QuickLaunch;

namespace PandaLcarsTactical.Browser;

// Untrusted sites never share the dashboard mapping, native bridge or profile.
public sealed class WebViewBrowser : IEmbeddedBrowser
{
    private readonly WebView2 web = new();
    private bool disposed, navigationFailed;
    private string? currentUrl;
    public FrameworkElement View => web;
    public string? Source => currentUrl;
    public bool CanGoBack => web.CoreWebView2?.CanGoBack == true;
    public event Action<string>? StatusChanged;
    public async Task InitializeAsync()
    {
        var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "TacticalBrowser");
        await web.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateWithOptionsAsync(null, profile, null));
        if (disposed) return;
        var core = web.CoreWebView2;
        core.Settings.IsWebMessageEnabled = false;
        core.Settings.AreHostObjectsAllowed = false;
        core.Settings.IsStatusBarEnabled = true;
        core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
        core.NavigationStarting += (_, e) =>
        {
            try { currentUrl = LinkStore.NormalizeUrl(e.Uri); StatusChanged?.Invoke("Lädt …"); }
            catch (ArgumentException) { e.Cancel = true; StatusChanged?.Invoke("Diese Adresse wird nicht unterstützt. Bei Bedarf in Firefox öffnen."); }
        };
        core.NewWindowRequested += (_, e) =>
        {
            e.Handled = true;
            if (e.IsUserInitiated)
            {
                try { Navigate(e.Uri); }
                catch (ArgumentException) { StatusChanged?.Invoke("Dieses neue Fenster benötigt einen externen Browser."); }
            }
            else StatusChanged?.Invoke("Automatisches Popup blockiert.");
        };
        core.SourceChanged += (_, _) => StatusChanged?.Invoke("Lädt …");
        core.HistoryChanged += (_, _) => StatusChanged?.Invoke("Navigation bereit");
        core.NavigationCompleted += (_, e) => { navigationFailed = !e.IsSuccess && e.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled; StatusChanged?.Invoke(e.IsSuccess ? "Bereit" : "Seite nicht erreichbar (" + e.WebErrorStatus + "). Erneut laden oder in Firefox öffnen."); };
        core.ProcessFailed += (_, _) => StatusChanged?.Invoke("Browserprozess beendet. Ansicht schließen und erneut öffnen.");
        core.DownloadStarting += (_, e) => { e.Cancel = true; StatusChanged?.Invoke("Downloads bitte über „In Firefox öffnen“ starten."); };
    }
    public void Navigate(string url)
    {
        currentUrl = LinkStore.NormalizeUrl(url);
        web.CoreWebView2.Navigate(currentUrl);
    }
    public void GoBack() { if (CanGoBack) web.CoreWebView2.GoBack(); }
    public void Reload() => web.CoreWebView2?.Reload();
    public void RetryFailedNavigation() { if (navigationFailed && !disposed && currentUrl is not null) { navigationFailed = false; Navigate(currentUrl); } }
    public void Stop() => web.CoreWebView2?.Stop();
    public void Dispose() { disposed = true; web.Close(); }
}
