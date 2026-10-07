using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Text.Json;
namespace PandaLcarsTactical.Connectivity;

public sealed record InternetStatus(bool Connected, bool NetworkAvailable, string Link);
// A connected adapter alone is not proof of Internet access (e.g. captive portals).
public sealed class InternetProbe(HttpClient http, Func<(bool Available, string Link)>? readLink = null)
{
    public static (bool Available, string Link) ReadLink()
    {
        try {
            var adapters = NetworkInterface.GetAllNetworkInterfaces().Where(n => n.OperationalStatus == OperationalStatus.Up && n.NetworkInterfaceType is not NetworkInterfaceType.Loopback and not NetworkInterfaceType.Tunnel).ToArray();
            return (adapters.Length > 0, adapters.Any(n => n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211) ? "WLAN" : adapters.Length > 0 ? "NETZWERK" : "KEIN NETZWERK");
        } catch { return (false, "UNBEKANNT"); }
    }
    public async Task<InternetStatus> CheckAsync(CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        var link = (readLink ?? ReadLink)();
        if (!link.Available) return new(false, false, link.Link);
        foreach (var url in new[] { "https://www.msftconnecttest.com/connecttest.txt", "https://api.rainviewer.com/public/weather-maps.json" })
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(token);
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            try {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.CacheControl = new() { NoCache = true, NoStore = true };
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
                if (response.StatusCode != HttpStatusCode.OK) continue;
                using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
                var bytes = new byte[65537]; int count = 0, read;
                while (count < bytes.Length && (read = await stream.ReadAsync(bytes.AsMemory(count), timeout.Token)) > 0) count += read;
                if (count == bytes.Length) continue;
                var text = System.Text.Encoding.UTF8.GetString(bytes, 0, count);
                bool valid;
                if (url.EndsWith(".txt", StringComparison.Ordinal)) valid = text.Trim() == "Microsoft Connect Test";
                else { using var json = JsonDocument.Parse(text); valid = json.RootElement.ValueKind == JsonValueKind.Object && json.RootElement.TryGetProperty("radar", out var radar) && radar.ValueKind == JsonValueKind.Object && radar.TryGetProperty("past", out var past) && past.ValueKind == JsonValueKind.Array; }
                if (valid) return new(true, true, link.Link);
            } catch (Exception ex) when (ex is HttpRequestException or IOException or JsonException or OperationCanceledException) { token.ThrowIfCancellationRequested(); }
        }
        return new(false, true, link.Link);
    }
}
