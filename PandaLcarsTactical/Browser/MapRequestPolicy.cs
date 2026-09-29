using Microsoft.Web.WebView2.Core;

namespace PandaLcarsTactical.Browser;

public static class MapRequestPolicy
{
    // Identify this app without impersonating another website or bypassing tile limits.
    public static void Apply(CoreWebView2 core, Func<string> documentUrl)
    {
        core.AddWebResourceRequestedFilter("https://*.tile.openstreetmap.org/*", CoreWebView2WebResourceContext.All);
        core.AddWebResourceRequestedFilter("https://tile.openstreetmap.org/*", CoreWebView2WebResourceContext.All);
        core.WebResourceRequested += (_, e) =>
        {
            if (!Uri.TryCreate(e.Request.Uri, UriKind.Absolute, out var target) ||
                !(target.Host == "tile.openstreetmap.org" || target.Host.EndsWith(".tile.openstreetmap.org", StringComparison.OrdinalIgnoreCase))) return;
            e.Request.Headers.SetHeader("X-Requested-With", "Pandalap-lab.PandasLcars");
            e.Request.Headers.SetHeader("User-Agent", core.Settings.UserAgent + " PandasLcars/0.6.3 (+https://github.com/Pandalap-lab/PandasLcars)");
            if (!e.Request.Headers.Contains("Referer") && Uri.TryCreate(documentUrl(), UriKind.Absolute, out var source) && source.Scheme == "https")
                e.Request.Headers.SetHeader("Referer", source.GetLeftPart(UriPartial.Authority) + "/");
        };
    }
}
