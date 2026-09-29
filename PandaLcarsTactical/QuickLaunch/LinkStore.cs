using System.Text.Json;

namespace PandaLcarsTactical.QuickLaunch;

public sealed record LaunchLink(string Id, string Name, string Url, bool Custom = true);

public sealed class LinkStore
{
    private readonly string path;
    public static readonly LaunchLink[] Defaults = [
        new("krone", "Kronen Zeitung", "https://www.krone.at/", false),
        new("standard", "DER STANDARD", "https://www.derstandard.at/", false),
        new("heute", "Heute", "https://www.heute.at/", false),
        new("facebook", "Facebook", "https://www.facebook.com/", false),
        new("oe24", "OE24", "https://www.oe24.at/", false),
        new("argos", "ARGOS ATLAS", "https://argosatlas.com/", false)];
    public IReadOnlyList<LaunchLink> Links { get; private set; } = Defaults.ToArray();
    public string? Warning { get; private set; }
    public LinkStore(string path)
    {
        this.path = path;
        if (!File.Exists(path)) return;
        try
        {
            if (new FileInfo(path).Length > 2_000_000) throw new InvalidDataException();
            var saved = JsonSerializer.Deserialize<List<LaunchLink>>(File.ReadAllText(path)) ?? throw new InvalidDataException();
            if (saved.Any(x => x is null)) throw new InvalidDataException();
            var custom = saved.Where(x => x.Custom).Select(x => new LaunchLink(x.Id, ValidateName(x.Name), NormalizeUrl(x.Url))).ToList();
            if (custom.Count > 500 || custom.Any(x => !Guid.TryParse(x.Id, out _)) || custom.Select(x => x.Id).Distinct().Count() != custom.Count)
                throw new InvalidDataException();
            Links = Defaults.Concat(custom).ToArray();
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException or ArgumentException or InvalidDataException)
        { Warning = "Linkdatei konnte nicht gelesen werden. Standardlinks aktiv; Originaldatei bleibt erhalten. Vor Änderungen Datei sichern."; }
    }
    public static string ValidateName(string? name)
    {
        name = (name ?? "").Trim();
        if (name.Length is < 1 or > 48 || name.Any(char.IsControl)) throw new ArgumentException("Name: 1–48 Zeichen eingeben.");
        return name;
    }
    public static string NormalizeUrl(string? url)
    {
        url = (url ?? "").Trim();
        if (!url.Contains("://") && !url.Contains(':')) url = "https://" + url;
        if (url.Length > 2048 || !Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("https" or "http") || string.IsNullOrWhiteSpace(uri.Host) ||
            uri.Host.Equals("panda.local", StringComparison.OrdinalIgnoreCase) || uri.UserInfo.Length != 0)
            throw new ArgumentException("Bitte eine gültige http/https-Webadresse ohne Zugangsdaten eingeben.");
        return uri.AbsoluteUri;
    }
    public void Save(string? id, string name, string url)
    {
        var next = Links.ToList();
        var link = new LaunchLink(id ?? Guid.NewGuid().ToString(), ValidateName(name), NormalizeUrl(url));
        if (id is null)
        {
            if (next.Count >= 505) throw new ArgumentException("Maximal 500 eigene Links möglich.");
            next.Add(link);
        }
        else
        {
            var index = next.FindIndex(x => x.Id == id && x.Custom);
            if (index < 0) throw new ArgumentException("Nur eigene Links können bearbeitet werden.");
            next[index] = link;
        }
        Commit(next);
    }
    public void Delete(string id)
    {
        var next = Links.ToList();
        if (next.RemoveAll(x => x.Id == id && x.Custom) == 0) throw new ArgumentException("Eigener Link nicht gefunden.");
        Commit(next);
    }
    private void Commit(List<LaunchLink> next)
    {
        if (Warning is not null) throw new IOException(Warning);
        Settings.AtomicFile.Write(path, JsonSerializer.Serialize(next.Where(x => x.Custom), new JsonSerializerOptions { WriteIndented = true }));
        Links = next;
    }
}
