using System.Text.Json;

namespace PandaLcarsTactical.Settings;

public sealed record ServiceDefinition(string Id, string Name, string Url);
public sealed class PersonalServices
{
    public static readonly ServiceDefinition[] Available =
    [new("photos", "Google Fotos", "https://photos.google.com/"),
     new("calendar", "Outlook Kalender", "https://outlook.live.com/calendar/"),
     new("facebook", "Facebook", "https://www.facebook.com/")];
    private readonly string path;
    private HashSet<string> enabled = [];
    public string? Warning { get; private set; }
    public PersonalServices(string path)
    {
        this.path = path;
        try
        {
            if (File.Exists(path))
            {
                if (new FileInfo(path).Length > 16384) throw new InvalidDataException();
                enabled = (JsonSerializer.Deserialize<string[]>(File.ReadAllText(path)) ?? [])
                    .Where(id => Available.Any(s => s.Id == id)).ToHashSet();
            }
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException or JsonException)
        { Warning = "Dienste-Einstellungen konnten nicht gelesen werden. Die vorhandene Datei bleibt erhalten."; }
    }
    public bool IsEnabled(string id) => enabled.Contains(id);
    public void SetEnabled(string id, bool value)
    {
        if (!Available.Any(s => s.Id == id)) throw new ArgumentException("Unbekannter Dienst.");
        if (Warning is not null) throw new IOException(Warning);
        var next = enabled.ToHashSet();
        if (value) next.Add(id); else next.Remove(id);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path + ".tmp", JsonSerializer.Serialize(next));
        File.Move(path + ".tmp", path, true);
        enabled = next;
    }
    public object Snapshot() => Available.Select(s => new { s.Id, s.Name, enabled = IsEnabled(s.Id),
        status = IsEnabled(s.Id) ? "IM BROWSER · STATUS UNBEKANNT" : "NICHT EINGERICHTET" }).ToArray();
}
