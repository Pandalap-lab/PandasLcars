using System.Net.Http;
using System.Text.Json;

namespace PandaLcarsTactical;

// Only the fixed public ISS endpoint is fetched; remote data is never executed.
internal sealed class IssOrbitService(HttpClient http, string? storagePath = null)
{
    private string? cached;
    private DateTimeOffset fetched, lastAttempt;
    private readonly SemaphoreSlim gate = new(1, 1);
    private readonly string cachePath = storagePath ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "iss-orbit.json");
    public void RetryAfterReconnect() { lastAttempt = DateTimeOffset.MinValue; }
    public async Task<string> GetAsync()
    {
        await gate.WaitAsync();
        try
        {
            var now = DateTimeOffset.UtcNow;
            if (cached is null && File.Exists(cachePath))
            {
                try
                {
                    var saved = await File.ReadAllTextAsync(cachePath);
                    using var parsed = JsonDocument.Parse(saved);
                    if (parsed.RootElement.GetArrayLength() == 1 && parsed.RootElement[0].GetProperty("NORAD_CAT_ID").GetInt32() == 25544)
                    { cached = saved; fetched = new DateTimeOffset(File.GetLastWriteTimeUtc(cachePath)); }
                }
                catch { /* A damaged cache must not stop the next network attempt. */ }
            }
            if (cached is not null && now - fetched < TimeSpan.FromHours(2)) return cached;
            if (now - lastAttempt < TimeSpan.FromMinutes(5)) throw new IOException("ISS-Daten derzeit nicht verfügbar.");
            lastAttempt = now;
            using var response = await http.GetAsync("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            if (json.Length > 32000) throw new IOException("Ungültige ISS-Daten.");
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.GetArrayLength() != 1 || doc.RootElement[0].GetProperty("NORAD_CAT_ID").GetInt32() != 25544)
                throw new IOException("Ungültige ISS-Kennung.");
            cached = json; fetched = now;
            try { Directory.CreateDirectory(Path.GetDirectoryName(cachePath)!); await File.WriteAllTextAsync(cachePath, json); }
            catch (IOException) { } catch (UnauthorizedAccessException) { }
            return json;
        }
        finally { gate.Release(); }
    }
}
