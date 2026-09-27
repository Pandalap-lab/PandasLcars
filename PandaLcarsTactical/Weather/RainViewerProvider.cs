using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
namespace PandaLcarsTactical.Weather;
public sealed record RadarFrame(string Url, DateTimeOffset GeneratedAt);
public sealed class RainViewerProvider(HttpClient http)
{
    public async Task<RadarFrame> GetLatestAsync(CancellationToken token)
    {
        using var response = await http.GetAsync("https://api.rainviewer.com/public/weather-maps.json", token);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(token));
        return Parse(document.RootElement, DateTimeOffset.UtcNow);
    }
    public static RadarFrame Parse(JsonElement root, DateTimeOffset now)
    {
        if (root.GetProperty("host").GetString() != "https://tilecache.rainviewer.com") throw new InvalidDataException("Unbekannter Radarserver.");
        var frames = root.GetProperty("radar").GetProperty("past").EnumerateArray().ToArray();
        if (frames.Length == 0) throw new InvalidDataException("Keine Radarbilder.");
        var newest = frames.MaxBy(frame => frame.GetProperty("time").GetInt64());
        var stamp = DateTimeOffset.FromUnixTimeSeconds(newest.GetProperty("time").GetInt64());
        var path = newest.GetProperty("path").GetString() ?? "";
        if (!Regex.IsMatch(path, @"^/v2/radar/[a-fA-F0-9]{10,64}$") || now - stamp > TimeSpan.FromMinutes(90) || stamp - now > TimeSpan.FromMinutes(15))
            throw new InvalidDataException("Radarbild fehlt oder ist veraltet.");
        return new("https://tilecache.rainviewer.com" + path + "/256/{z}/{x}/{y}/2/1_0.png", stamp);
    }
}

