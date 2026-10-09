using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PandaLcarsTactical.QuickLaunch;

public sealed class SiteIconService
{
    private readonly HttpClient http;
    private readonly string directory;
    private readonly SemaphoreSlim gate = new(3);
    private readonly Dictionary<string, (DateTimeOffset At, string? Data)> memory = new();
    public SiteIconService(string? cacheDirectory = null, HttpMessageHandler? handler = null)
    {
        directory = cacheDirectory ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "SiteIcons");
        http = new HttpClient(handler ?? new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false }) { Timeout = TimeSpan.FromSeconds(12) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("PandasLcars/0.6.7 (+https://github.com/Pandalap-lab/PandasLcars)");
    }
    public static bool PublicAddress(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        if (IPAddress.IsLoopback(address)) return false;
        var b = address.GetAddressBytes();
        if (b.Length == 16) return !address.IsIPv6LinkLocal && !address.IsIPv6Multicast && !address.Equals(IPAddress.IPv6Any) && (b[0] & 0xfe) != 0xfc;
        return b[0] is not (0 or 10 or 127) && b[0] < 224 && !(b[0] == 169 && b[1] == 254) && !(b[0] == 172 && b[1] >= 16 && b[1] <= 31) && !(b[0] == 192 && b[1] == 168) && !(b[0] == 100 && b[1] >= 64 && b[1] <= 127);
    }
    private async Task<(byte[] Data, Uri Final)> ReadAsync(Uri uri, int limit, bool truncate)
    {
        for (int redirects = 0; redirects < 5; redirects++)
        {
            if (uri.Scheme != "https" || !string.IsNullOrEmpty(uri.UserInfo) || !uri.IsDefaultPort) throw new IOException("Only public HTTPS icons.");
            var addresses = await Dns.GetHostAddressesAsync(uri.DnsSafeHost);
            if (addresses.Length == 0 || addresses.Any(a => !PublicAddress(a))) throw new IOException("Non-public icon host.");
            using var response = await http.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
            if ((int)response.StatusCode is >= 300 and < 400 && response.Headers.Location is { } location) { uri = new Uri(uri, location); continue; }
            response.EnsureSuccessStatusCode();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(12));
            await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var bytes = new MemoryStream(); var buffer = new byte[8192];
            while (bytes.Length <= limit)
            {
                var n = await stream.ReadAsync(buffer, timeout.Token); if (n == 0) break;
                bytes.Write(buffer, 0, n);
            }
            if (bytes.Length > limit && !truncate) throw new IOException("Icon too large.");
            return (bytes.ToArray().Take(limit).ToArray(), uri);
        }
        throw new IOException("Too many icon redirects.");
    }
    public static IReadOnlyList<Uri> Candidates(string html, Uri page)
    {
        var result = new List<Uri>();
        foreach (Match tag in Regex.Matches(html, "<link\\b[^>]*>", RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1)))
        {
            var attrs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (Match a in Regex.Matches(tag.Value, "([\\w-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", RegexOptions.None, TimeSpan.FromSeconds(1)))
                attrs[a.Groups[1].Value] = WebUtility.HtmlDecode(a.Groups[2].Success ? a.Groups[2].Value : a.Groups[3].Success ? a.Groups[3].Value : a.Groups[4].Value);
            if (!attrs.TryGetValue("rel", out var rel) || !rel.Split(' ', StringSplitOptions.RemoveEmptyEntries).Any(r => r.Equals("icon", StringComparison.OrdinalIgnoreCase) || r.Equals("apple-touch-icon", StringComparison.OrdinalIgnoreCase))) continue;
            if (attrs.TryGetValue("href", out var href) && Uri.TryCreate(page, href, out var icon) && icon.Scheme == "https") result.Add(icon);
        }
        result.Add(new Uri(page, "/favicon.ico")); result.Add(new Uri(page, "/favicon.svg")); result.Add(new Uri(page, "/apple-touch-icon.png"));
        return result.Distinct().Take(12).ToList();
    }
    public static string? ImageData(byte[] bytes)
    {
        string? mime = bytes.Length > 8 && bytes.Take(8).SequenceEqual(new byte[] {137,80,78,71,13,10,26,10}) ? "image/png" :
            bytes.Length > 4 && bytes[0] == 0 && bytes[1] == 0 && bytes[2] == 1 && bytes[3] == 0 ? "image/x-icon" :
            bytes.Length > 3 && bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255 ? "image/jpeg" :
            bytes.Length > 6 && Encoding.ASCII.GetString(bytes,0,3) == "GIF" ? "image/gif" :
            Regex.IsMatch(Encoding.UTF8.GetString(bytes), "^\\s*(?:<\\?xml[^>]*>\\s*)?(?:<!--.*?-->\\s*)*<svg\\b", RegexOptions.Singleline, TimeSpan.FromSeconds(1)) ? "image/svg+xml" : null;
        return mime is null ? null : "data:" + mime + ";base64," + Convert.ToBase64String(bytes);
    }
    public void RetryFailed() { lock(memory) foreach(var key in memory.Where(x => x.Value.Data is null).Select(x => x.Key).ToArray()) memory.Remove(key); }
    public async Task<string?> GetAsync(string url)
    {
        var key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(url)));
        await gate.WaitAsync();
        try
        {
            lock(memory) if(memory.TryGetValue(key,out var entry) && DateTimeOffset.UtcNow-entry.At < TimeSpan.FromMinutes(entry.Data is null ? 5 : 1440)) return entry.Data;
            var path = Path.Combine(directory,key+".json");
            try { if (File.Exists(path) && DateTime.UtcNow-File.GetLastWriteTimeUtc(path)<TimeSpan.FromDays(7)) { var saved=JsonSerializer.Deserialize<string>(await File.ReadAllTextAsync(path)); if(saved?.StartsWith("data:image/",StringComparison.Ordinal)==true) return saved; } } catch { }
            var page = new Uri(url); page = new UriBuilder(page) { Scheme="https", Port=-1, Fragment="" }.Uri;
            IReadOnlyList<Uri> candidates;
            try { var document=await ReadAsync(page,512*1024,true); candidates=Candidates(Encoding.UTF8.GetString(document.Data),document.Final); }
            catch { candidates=Candidates("",page); }
            var known = page.Host.Replace("www.", "", StringComparison.OrdinalIgnoreCase) switch
            {
                "derstandard.at" => "https://b.staticfiles.at/s/icons/nachrichten/apple-touch-icon-57x57.png",
                "oe24.at" => "https://www.oe24.at/images/favicon-96x96.png",
                "argosatlas.com" => "https://argosatlas.com/favicon.svg",
                _ => null
            };
            if (known is not null) candidates = new[] { new Uri(known) }.Concat(candidates).Distinct().ToList();
            foreach(var icon in candidates)
            {
                try
                {
                    var result=await ReadAsync(icon,512*1024,false); var data=ImageData(result.Data); if(data is null)continue;
                    Directory.CreateDirectory(directory); await File.WriteAllTextAsync(path,JsonSerializer.Serialize(data));
                    lock(memory)memory[key]=(DateTimeOffset.UtcNow,data); return data;
                }
                catch { }
            }
            lock(memory)memory[key]=(DateTimeOffset.UtcNow,null); return null;
        }
        finally { gate.Release(); }
    }
}
