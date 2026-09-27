using System.Net.Http;
using System.Text.Json;
namespace PandaLcarsTactical.Weather;
public sealed class PlaceSearch(HttpClient client)
{
    public async Task<IReadOnlyList<GeoPlace>> SearchAsync(string query, CancellationToken token)
    {
        query = query.Trim();
        if (query.Length is < 2 or > 100) throw new ArgumentException("Bitte 2–100 Zeichen eingeben.");
        using var response = await client.GetAsync("https://geocoding-api.open-meteo.com/v1/search?count=8&language=de&format=json&name=" + Uri.EscapeDataString(query), token);
        response.EnsureSuccessStatusCode();
        using var stream = await response.Content.ReadAsStreamAsync(token);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: token);
        if (!doc.RootElement.TryGetProperty("results", out var results)) return [];
        return results.EnumerateArray().Select(item =>
        {
            string Text(string key) => item.TryGetProperty(key, out var value) ? value.GetString() ?? "" : "";
            var place = new GeoPlace(Text("name"), item.GetProperty("latitude").GetDouble(), item.GetProperty("longitude").GetDouble(), Text("country"), Text("admin1"));
            place.Validate(); return place;
        }).ToArray();
    }
}
