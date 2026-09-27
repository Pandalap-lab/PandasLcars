using System.Net.Http;
using System.Security.Cryptography;
using System.Text.Json;

namespace PandaLcarsTactical.Updates;

public sealed record UpdateRelease(string Tag, string Installer, string Checksums);
public sealed class UpdateClient
{
    private const string Repository = "https://github.com/Pandalap-lab/PandasLcars/releases/download/";
    private readonly HttpClient http;
    public UpdateClient(HttpClient http) => this.http = http;
    public static UpdateRelease? Parse(string json, Version current)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        if (root.GetProperty("draft").GetBoolean() || root.GetProperty("prerelease").GetBoolean()) return null;
        var tag = root.GetProperty("tag_name").GetString() ?? "";
        if (!Version.TryParse(tag.TrimStart('v'), out var version) || version <= current) return null;
        string Asset(string name)
        {
            var url = root.GetProperty("assets").EnumerateArray().First(a => a.GetProperty("name").GetString() == name).GetProperty("browser_download_url").GetString()!;
            if (url != Repository + tag + "/" + name) throw new InvalidDataException("Ungültige Update-Adresse.");
            return url;
        }
        return new(tag, Asset("PandasLcars-Setup.exe"), Asset("SHA256SUMS.txt"));
    }
    public async Task<UpdateRelease?> CheckAsync(Version current)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/repos/Pandalap-lab/PandasLcars/releases/latest");
        request.Headers.UserAgent.ParseAdd("PandasLcars/" + current);
        using var response = await http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return Parse(await response.Content.ReadAsStringAsync(), current);
    }
    public static bool Verify(string expected, byte[] hash) => expected.Length == 64 &&
        expected.Equals(Convert.ToHexString(hash), StringComparison.OrdinalIgnoreCase);
    public async Task<string> DownloadAsync(UpdateRelease release)
    {
        var sums = await http.GetStringAsync(release.Checksums);
        var line = sums.Split('\n').Select(l => l.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Single(l => l.Length == 2 && l[1].TrimStart('*') == "PandasLcars-Setup.exe");
        var directory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "Updates", release.Tag);
        Directory.CreateDirectory(directory);
        var target = Path.Combine(directory, "PandasLcars-Setup.exe");
        var partial = target + ".partial";
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(10));
            using var response = await http.GetAsync(release.Installer, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            response.EnsureSuccessStatusCode();
            await using (var input = await response.Content.ReadAsStreamAsync(timeout.Token))
            await using (var output = File.Create(partial))
            {
                var buffer = new byte[81920]; long total = 0; int count;
                while ((count = await input.ReadAsync(buffer, timeout.Token)) != 0)
                {
                    total += count;
                    if (total > 512L * 1024 * 1024) throw new InvalidDataException("Update ist unerwartet groß.");
                    await output.WriteAsync(buffer.AsMemory(0, count), timeout.Token);
                }
            }
            await using (var file = File.OpenRead(partial))
                if (!Verify(line[0], await SHA256.HashDataAsync(file))) throw new InvalidDataException("Prüfsumme stimmt nicht überein. Update verworfen.");
            File.Move(partial, target, true);
            return target;
        }
        finally { if (File.Exists(partial)) File.Delete(partial); }
    }
}
