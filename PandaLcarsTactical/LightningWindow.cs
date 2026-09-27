using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using PandaLcarsTactical.Weather;
namespace PandaLcarsTactical;
// Separate browser for the original website; no iframe, scraping or data proxy.
public sealed class LightningWindow : Window
{
    private readonly WebView2 browser = new();
    private bool initialized, closed;
    public LightningWindow(GeoPlace place)
    {
        Title = "LightningMaps.org · Original-Liveansicht";
        AppWindow.SetIcon(Path.Combine(AppContext.BaseDirectory, "Assets", "panda-spock.ico"));
        AppWindow.Resize(new Windows.Graphics.SizeInt32(1120, 800));
        var root = new Grid(); root.Children.Add(browser); Content = root;
        root.Loaded += async (_, _) =>
        {
            if (initialized) return;
            initialized = true;
            try
            {
                string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "LightningBrowser");
                await browser.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateWithOptionsAsync(null, profile, null));
                if (closed) return;
                Browser.MapRequestPolicy.Apply(browser.CoreWebView2, () => browser.CoreWebView2.Source);
                // Old 403 error tiles can be cached as images in the existing profile.
                var cacheMigration = Path.Combine(profile, "map-headers-v060");
                if (!File.Exists(cacheMigration))
                {
                    await browser.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.DiskCache);
                    File.WriteAllText(cacheMigration, "1");
                }
                browser.CoreWebView2.NewWindowRequested += (_, e) => e.Handled = true;
                browser.CoreWebView2.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
                browser.CoreWebView2.Navigate(FormattableString.Invariant($"https://www.lightningmaps.org/?lang=de#m=oss;t=3;s=0;z=7;y={place.Latitude};x={place.Longitude};"));
            }
            catch { if (!closed) root.Children.Add(new TextBlock { Text = "LightningMaps konnte nicht geöffnet werden. Bitte Internet und WebView2 prüfen.", TextWrapping = TextWrapping.Wrap }); }
        };
        Closed += (_, _) => { closed = true; browser.Close(); };
    }
}
