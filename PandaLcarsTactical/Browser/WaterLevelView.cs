using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using System.Text.Json;

namespace PandaLcarsTactical.Browser;

// Render the provider's original chart in an isolated browser. Never pass remote
// HTML or scripts into the trusted dashboard; only a bounded PNG leaves this view.
public sealed class WaterLevelView : IDisposable
{
    public const string Url = "https://www.noel.gv.at/wasserstand/#/de/Messstellen/Details/207241/WasserstandPrognose/48Stunden";
    public WebView2 View { get; } = new() { Width = 1000, Height = 700, IsHitTestVisible = false, Opacity = 0,
        HorizontalAlignment = HorizontalAlignment.Left, VerticalAlignment = VerticalAlignment.Top };
    private bool disposed, busy, ready;
    private DateTimeOffset lastAttempt;
    private readonly CancellationTokenSource lifetime = new();
    public event Action<object>? Updated;
    public async Task RefreshAsync()
    {
        if (disposed || busy || DateTimeOffset.UtcNow - lastAttempt < TimeSpan.FromSeconds(20)) return;
        busy = true; lastAttempt = DateTimeOffset.UtcNow;
        Updated?.Invoke(new { type = "waterLevel", state = "loading" });
        try
        {
            if (!ready)
            {
                var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "WaterLevel");
                await View.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateWithOptionsAsync(null, profile, null));
                if (disposed) return;
                var core = View.CoreWebView2;
                core.Settings.IsWebMessageEnabled = false;
                core.Settings.AreHostObjectsAllowed = false;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
                core.NewWindowRequested += (_, e) => e.Handled = true;
                core.DownloadStarting += (_, e) => e.Cancel = true;
                core.NavigationStarting += (_, e) => { if (!e.Uri.StartsWith("https://www.noel.gv.at/wasserstand/", StringComparison.Ordinal)) e.Cancel = true; };
                ready = true;
            }
            var navigation = new TaskCompletionSource<bool>();
            void Completed(object? sender, CoreWebView2NavigationCompletedEventArgs e) => navigation.TrySetResult(e.IsSuccess);
            View.CoreWebView2.NavigationCompleted += Completed;
            try
            {
                View.CoreWebView2.Navigate(Url);
                if (!await navigation.Task.WaitAsync(TimeSpan.FromSeconds(35), lifetime.Token)) throw new IOException("Navigation failed");
            }
            finally { if (!disposed) View.CoreWebView2.NavigationCompleted -= Completed; }
            // Angular loads data after navigation. Wait for a stable, nonempty
            // original canvas; no inferred measurements or local chart redraw.
            string? previous = null;
            for (var attempt = 0; attempt < 30; attempt++)
            {
                await Task.Delay(1000, lifetime.Token);
                var json = await View.ExecuteScriptAsync("""
                    (() => {
                      if (!location.href.includes('/207241/WasserstandPrognose/48Stunden')) return null;
                      const c=document.querySelector('canvas[aria-label="Grafik Station Korneuburg - Wasserstand Prognose"]');
                      if (!c || c.width < 100 || c.height < 100 || !document.body.innerText.includes('207241') || document.body.innerText.includes('Daten werden geladen')) return null;
                      const chart=c.parentElement;
                      chart.style.width='900px'; chart.style.height='350px'; chart.style.flex='none';
                      const data=c.toDataURL('image/png');
                      return data.length>10000 && data.length<2000000 ? data : null;
                    })()
                    """);
                var data = JsonSerializer.Deserialize<string>(json);
                if (data is not null && data == previous)
                {
                    Updated?.Invoke(new { type = "waterLevel", state = "ready", data, fetchedAt = DateTimeOffset.UtcNow });
                    return;
                }
                previous = data;
            }
            throw new IOException("Chart unavailable");
        }
        catch (OperationCanceledException) when (disposed) { }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        { if (!disposed) Updated?.Invoke(new { type = "waterLevel", state = "error" }); }
        finally { busy = false; }
    }
    public void Dispose() { disposed = true; lifetime.Cancel(); View.Close(); }
}
