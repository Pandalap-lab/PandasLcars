using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
namespace PandaLcarsTactical.Lightning;
public sealed class EumetsatClient : IDisposable
{
    private readonly HttpClient http;
    private readonly Func<EumetsatCredentials?> credentials;
    private readonly SemaphoreSlim gate = new(1, 1);
    private string? token; private DateTimeOffset expires, nextAttempt;
    private LightningFrame? cached;
    public EumetsatClient(Func<EumetsatCredentials?> credentials, HttpMessageHandler? handler = null) {
        this.credentials = credentials;
        http = new(handler ?? new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(60) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("PandasLcars/0.6.10");
    }
    public void Reset() { token = null; expires = default; nextAttempt = default; cached = null; }
    private static Uri Trusted(string url) {
        var uri = new Uri(url);
        if (uri.Scheme != "https" || uri.Host != "api.eumetsat.int" || !uri.IsDefaultPort) throw new InvalidDataException("Unzulässiger Datenlink.");
        return uri;
    }
    private async Task<byte[]> Read(HttpResponseMessage response, int limit, CancellationToken ct) {
        if (!response.IsSuccessStatusCode) throw new IOException("EUMETSAT antwortet HTTP " + (int)response.StatusCode + ".");
        if (response.Content.Headers.ContentLength > limit) throw new IOException("Datenpaket zu groß.");
        using var input = await response.Content.ReadAsStreamAsync(ct); using var output = new MemoryStream(); var buffer = new byte[32768];
        int n; while ((n = await input.ReadAsync(buffer, ct)) > 0) { if (output.Length + n > limit) throw new IOException("Datenpaket zu groß."); output.Write(buffer, 0, n); }
        return output.ToArray();
    }
    private async Task<string> Token(CancellationToken ct) {
        if (token is not null && expires > DateTimeOffset.UtcNow.AddMinutes(2)) return token;
        var keys = credentials() ?? throw new InvalidOperationException("EUMETSAT-Zugang unter SETTINGS einrichten.");
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.eumetsat.int/token");
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(keys.Key + ":" + keys.Secret)));
        req.Content = new FormUrlEncodedContent(new Dictionary<string,string>{{"grant_type", "client_credentials"}});
        using var response = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!response.IsSuccessStatusCode) throw new IOException("EUMETSAT-Anmeldung antwortet HTTP " + (int)response.StatusCode + ".");
        using var doc = JsonDocument.Parse(await Read(response, 65536, ct));
        token = doc.RootElement.GetProperty("access_token").GetString() ?? throw new IOException("Kein Zugriffstoken erhalten.");
        expires = DateTimeOffset.UtcNow.AddSeconds(doc.RootElement.GetProperty("expires_in").GetInt32()); return token;
    }
    private async Task<JsonDocument> Json(string url, CancellationToken ct) {
        using var response = await http.GetAsync(Trusted(url), HttpCompletionOption.ResponseHeadersRead, ct);
        return JsonDocument.Parse(await Read(response, 8 * 1024 * 1024, ct));
    }
    public async Task<LightningFrame> GetAsync(CancellationToken ct = default) {
        await gate.WaitAsync(ct);
        try {
            if (DateTimeOffset.UtcNow < nextAttempt) return cached ?? throw new IOException("Abrufpause nach Fehler; in wenigen Minuten erneut versuchen.");
            nextAttempt = DateTimeOffset.UtcNow.AddMinutes(2);
            var access = await Token(ct);
            JsonElement? latest = null;
            for (int day = 0; day < 2 && latest is null; day++) {
                var date = DateTimeOffset.UtcNow.AddDays(-day);
                using var list = await Json($"https://api.eumetsat.int/data/browse/1.0.0/collections/EO%3AEUM%3ADAT%3A0691/dates/{date.ToString("yyyy/MM/dd", System.Globalization.CultureInfo.InvariantCulture)}/products?format=json", ct);
                latest = list.RootElement.GetProperty("products").EnumerateArray().OrderByDescending(p => p.GetProperty("date").GetString()).Select(p => (JsonElement?)p.Clone()).FirstOrDefault();
            }
            if (latest is null) throw new IOException("Keine aktuellen Blitzprodukte verfügbar.");
            var p = latest.Value; var id = p.GetProperty("id").GetString()!;
            if (cached?.Product == id) { nextAttempt = DateTimeOffset.UtcNow.AddMinutes(5); return cached; }
            var detailUrl = p.GetProperty("links").EnumerateArray().First(l => l.GetProperty("rel").GetString() == "product/details").GetProperty("href").GetString()!;
            using var detail = await Json(detailUrl, ct); var props = detail.RootElement.GetProperty("properties");
            var url = props.GetProperty("links").GetProperty("data")[0].GetProperty("href").GetString()!;
            byte[] bytes = Array.Empty<byte>();
            for (int attempt = 0; attempt < 2; attempt++) {
                using var request = new HttpRequestMessage(HttpMethod.Get, Trusted(url)); request.Headers.Authorization = new("Bearer", access);
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                if (response.StatusCode == HttpStatusCode.Unauthorized && attempt == 0) { token = null; access = await Token(ct); continue; }
                bytes = await Read(response, 32 * 1024 * 1024, ct); break;
            }
            var range = props.GetProperty("date").GetString()!.Split('/');
            cached = LightningDecoder.Decode(bytes, id, DateTimeOffset.Parse(range[0]), DateTimeOffset.Parse(range[1]));
            nextAttempt = DateTimeOffset.UtcNow.AddMinutes(5); return cached;
        } finally { gate.Release(); }
    }
    public void Dispose() { http.Dispose(); }
}

