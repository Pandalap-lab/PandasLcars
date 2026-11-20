using System.Globalization;
using System.Net;
using System.Text.Json;
using PandaLcarsTactical.Settings;

namespace PandaLcarsTactical.SpaceX;

public sealed record SpaceXStatus(int Id, string Name, string Abbrev);

public sealed record SpaceXLaunch(
    string Id, string Name, string Net, string Precision, SpaceXStatus Status,
    string Rocket, string Pad, string Location, string Description,
    string? StreamUrl, string? WindowStart, string? WindowEnd);

public sealed record SpaceXSnapshot(
    IReadOnlyList<SpaceXLaunch> Launches, DateTimeOffset? FetchedAt,
    bool Stale, string? Error, DateTimeOffset? RetryAt,
    IReadOnlyList<SpaceXLaunch> RecentLaunches);

/// <summary>
/// Public Launch Library 2 data. The native bridge avoids browser CORS and shares
/// a five-minute throttle/cache across all board openings and application restarts.
/// </summary>
public sealed class SpaceXService
{
    // v2.3.0 supports the lsp__id filter; include recent launches so a launch does
    // not vanish as soon as its scheduled NET passes. The board selects the next
    // ten scheduled launches separately from a recent mission in flight.
    public const string LaunchesUrl = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?lsp__id=121&limit=20&mode=detailed&ordering=net";
    public static readonly TimeSpan MinimumInterval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan MaximumFreshAge = TimeSpan.FromMinutes(15);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient http;
    private readonly string cachePath;
    private readonly Func<DateTimeOffset> utcNow;
    private readonly SemaphoreSlim gate = new(1, 1);
    private IReadOnlyList<SpaceXLaunch> launches = Array.Empty<SpaceXLaunch>();
    private DateTimeOffset? fetchedAt;
    private DateTimeOffset nextAttempt;
    private string? lastError;

    public SpaceXService(HttpClient http, string dataDirectory, Func<DateTimeOffset>? utcNow = null)
    {
        this.http = http;
        this.utcNow = utcNow ?? (() => DateTimeOffset.UtcNow);
        cachePath = Path.Combine(dataDirectory, "spacex-cache.json");
        LoadCache();
    }

    public async Task<SpaceXSnapshot> GetAsync(CancellationToken cancellationToken = default)
    {
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var now = utcNow();
            if (now < nextAttempt) return Snapshot(now);

            // Save the deadline before the request, including failed requests.
            // Reopening the application must not turn retry clicks into a burst.
            nextAttempt = now + MinimumInterval;
            SaveCache();
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(15));
                using var request = new HttpRequestMessage(HttpMethod.Get, LaunchesUrl);
                request.Headers.UserAgent.ParseAdd("PandasLcars/0.6.15 (+https://github.com/Pandalap-lab/PandasLcars)");
                request.Headers.Accept.ParseAdd("application/json");
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token).ConfigureAwait(false);
                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    var retry = response.Headers.RetryAfter;
                    var requested = retry?.Date ?? (now + (retry?.Delta ?? TimeSpan.FromHours(1)));
                    if (requested > nextAttempt) nextAttempt = requested;
                    lastError = "Die Startdatenquelle begrenzt derzeit die Abfragen. Gespeicherte Daten werden angezeigt.";
                }
                else if (!response.IsSuccessStatusCode)
                {
                    lastError = "Die Startdatenquelle ist derzeit nicht erreichbar. Gespeicherte Daten werden angezeigt.";
                }
                else
                {
                    var bytes = await ReadLimitedAsync(response, 2 * 1024 * 1024, timeout.Token).ConfigureAwait(false);
                    using var document = JsonDocument.Parse(bytes, new JsonDocumentOptions { MaxDepth = 64 });
                    var normalized = Normalize(document.RootElement);
                    if (normalized.Count == 0)
                        lastError = "Die Quelle hat keine auswertbaren SpaceX-Missionen geliefert. Gespeicherte Daten werden angezeigt.";
                    else
                    {
                        launches = normalized;
                        fetchedAt = utcNow();
                        lastError = null;
                    }
                }
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                lastError = "Die Abfrage der Startdaten hat zu lange gedauert. Gespeicherte Daten werden angezeigt.";
            }
            catch (Exception ex) when (ex is HttpRequestException or JsonException or IOException or InvalidDataException)
            {
                lastError = "Startdaten konnten nicht geladen werden. Gespeicherte Daten werden angezeigt.";
            }
            finally
            {
                SaveCache();
            }
            cancellationToken.ThrowIfCancellationRequested();
            return Snapshot(utcNow());
        }
        finally { gate.Release(); }
    }

    private SpaceXSnapshot Snapshot(DateTimeOffset now)
    {
        var upcoming = launches.Where(x => x.Status.Id is not (3 or 4 or 6 or 7 or 9) &&
            IsUpcoming(x, now)).ToArray();
        var upcomingIds = upcoming.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        var future = upcoming.Take(10).ToArray();
        var recent = launches.Where(x => DateTimeOffset.Parse(x.Net, CultureInfo.InvariantCulture) <= now &&
            DateTimeOffset.Parse(x.Net, CultureInfo.InvariantCulture) >= now.AddDays(-2) && !upcomingIds.Contains(x.Id))
            .OrderByDescending(x => x.Status.Id is 6 or 9)
            .ThenByDescending(x => x.Net, StringComparer.Ordinal).Take(5).ToArray();
        return new(future, fetchedAt,
            fetchedAt is null || now - fetchedAt > MaximumFreshAge || lastError is not null,
            lastError, nextAttempt > now ? nextAttempt : null, recent);
    }

    private static bool IsUpcoming(SpaceXLaunch launch, DateTimeOffset now)
    {
        var net = DateTimeOffset.Parse(launch.Net, CultureInfo.InvariantCulture).ToUniversalTime();
        if (net > now) return true;
        // Coarse NET values are placeholders within a period. Passing midnight
        // on the given day/month must not silently remove an unconfirmed launch.
        var periodStart = launch.Precision switch
        {
            "hour" => new DateTimeOffset(net.Year, net.Month, net.Day, net.Hour, 0, 0, TimeSpan.Zero),
            "day" => new DateTimeOffset(net.Year, net.Month, net.Day, 0, 0, 0, TimeSpan.Zero),
            "month" => new DateTimeOffset(net.Year, net.Month, 1, 0, 0, 0, TimeSpan.Zero),
            "year" => new DateTimeOffset(net.Year, 1, 1, 0, 0, 0, TimeSpan.Zero),
            _ => net
        };
        return launch.Precision switch
        {
            "hour" => now < periodStart.AddHours(1),
            "day" => now < periodStart.AddDays(1),
            "month" => now < periodStart.AddMonths(1),
            "year" => now < periodStart.AddYears(1),
            "unknown" => net >= now.AddDays(-2),
            _ => net > now
        };
    }

    public static IReadOnlyList<SpaceXLaunch> Normalize(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
            throw new JsonException("Launch Library response has no results array.");
        var list = new List<SpaceXLaunch>();
        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in results.EnumerateArray().Take(100))
        {
            if (row.ValueKind != JsonValueKind.Object) continue;
            var provider = Child(row, "launch_service_provider");
            if (Integer(provider, "id") != 121) continue;
            var id = Text(row, "id", 100);
            var name = Text(row, "name", 300);
            var net = IsoDate(Text(row, "net", 100));
            if (!Guid.TryParse(id, out _) || name.Length == 0 || net is null || !ids.Add(id)) continue;
            var status = Child(row, "status");
            var statusId = Integer(status, "id") ?? 0;
            var configuration = Child(Child(row, "rocket"), "configuration");
            var pad = Child(row, "pad");
            list.Add(new SpaceXLaunch(
                id, name, net, Precision(Child(row, "net_precision")),
                new SpaceXStatus(statusId, Or(Text(status, "name", 100), "Status offen"), Text(status, "abbrev", 40)),
                Or(Text(configuration, "full_name", 160), Or(Text(configuration, "name", 160), "Rakete noch offen")),
                Or(Text(pad, "name", 180), "Startplatz noch offen"),
                Or(Text(Child(pad, "location"), "name", 180), "Ort noch offen"),
                Text(Child(row, "mission"), "description", 4000),
                OfficialStream(row), IsoDate(Text(row, "window_start", 100)), IsoDate(Text(row, "window_end", 100))));
        }
        return list.OrderBy(x => DateTimeOffset.Parse(x.Net, CultureInfo.InvariantCulture)).ToArray();
    }

    private static string Precision(JsonElement value) => Integer(value, "id") switch
    {
        0 => "second", 1 => "minute", 2 => "hour", 3 or 4 or 5 => "day", 7 => "month",
        _ => Text(value, "name", 40).Equals("Year", StringComparison.OrdinalIgnoreCase) ? "year" : "unknown"
    };

    private static string? OfficialStream(JsonElement row)
    {
        var videos = Child(row, "vid_urls");
        if (videos.ValueKind != JsonValueKind.Array) return null;
        return videos.EnumerateArray()
            .Where(v => Integer(Child(v, "type"), "id") == 1)
            .OrderByDescending(v => Child(v, "live").ValueKind == JsonValueKind.True)
            .ThenByDescending(v => Integer(v, "priority") ?? 0)
            .Select(v => SafeStreamUrl(Text(v, "url", 2048)))
            .FirstOrDefault(url => url is not null);
    }

    public static string? SafeStreamUrl(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Any(c => c <= ' ' || char.IsControl(c)) ||
            !Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || !uri.IsDefaultPort || uri.UserInfo.Length != 0)
            return null;
        return uri.IdnHost.ToLowerInvariant() is "spacex.com" or "www.spacex.com" or "x.com" or "www.x.com" or
            "twitter.com" or "www.twitter.com" or "youtube.com" or "www.youtube.com" or "m.youtube.com" or "youtu.be"
            ? uri.AbsoluteUri : null;
    }

    private static JsonElement Child(JsonElement parent, string name) =>
        parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(name, out var value) ? value : default;

    private static int? Integer(JsonElement parent, string name) =>
        Child(parent, name) is var value && value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var result) ? result : null;

    private static string Text(JsonElement parent, string name, int limit)
    {
        var value = Child(parent, name);
        if (value.ValueKind != JsonValueKind.String) return "";
        var text = value.GetString()?.Trim() ?? "";
        return text.Length <= limit ? text : text[..limit];
    }

    private static string Or(string value, string fallback) => value.Length == 0 ? fallback : value;

    private static string? IsoDate(string? text)
    {
        // A launch NET without an explicit offset must never inherit the user's
        // Windows timezone or be interpreted as a locale-dependent date.
        if (string.IsNullOrWhiteSpace(text) || !text.Contains('T') || !(text.EndsWith('Z') ||
            (text.Length >= 6 && (text[^6] == '+' || text[^6] == '-') && text[^3] == ':'))) return null;
        return DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var date)
            ? date.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture) : null;
    }

    internal static async Task<byte[]> ReadLimitedAsync(HttpResponseMessage response, int limit, CancellationToken cancellationToken)
    {
        if (response.Content.Headers.ContentLength is long length && length > limit)
            throw new InvalidDataException("Response too large.");
        await using var source = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using var target = new MemoryStream();
        var buffer = new byte[16384];
        int count;
        while ((count = await source.ReadAsync(buffer, cancellationToken).ConfigureAwait(false)) != 0)
        {
            if (target.Length + count > limit) throw new InvalidDataException("Response too large.");
            target.Write(buffer, 0, count);
        }
        return target.ToArray();
    }

    private sealed record StoredCache(int Version, SpaceXLaunch[] Launches, DateTimeOffset? FetchedAt, DateTimeOffset NextAttempt, string? Error);

    private void LoadCache()
    {
        try
        {
            if (!File.Exists(cachePath) || new FileInfo(cachePath).Length > 2 * 1024 * 1024) return;
            var cache = JsonSerializer.Deserialize<StoredCache>(File.ReadAllText(cachePath), JsonOptions);
            var now = utcNow();
            if (cache is null || cache.Version != 1 || cache.FetchedAt > now.AddMinutes(1)) return;
            // A damaged/edited timestamp must not lock out requests indefinitely.
            nextAttempt = cache.NextAttempt > now.AddDays(1) ? now + MinimumInterval : cache.NextAttempt;
            lastError = cache.Error is { Length: <= 500 } ? cache.Error : null;
            if (cache.FetchedAt is null || cache.Launches is null) return;
            launches = cache.Launches.Where(x => x is not null && Guid.TryParse(x.Id, out _) && !string.IsNullOrWhiteSpace(x.Name) &&
                    IsoDate(x.Net) is not null && x.Status is not null)
                .Take(100).Select(x => x with
                {
                    Net = IsoDate(x.Net)!,
                    Name = x.Name[..Math.Min(x.Name.Length, 300)],
                    Precision = x.Precision is "second" or "minute" or "hour" or "day" or "month" or "year" ? x.Precision : "unknown",
                    Rocket = x.Rocket ?? "Rakete noch offen", Pad = x.Pad ?? "Startplatz noch offen", Location = x.Location ?? "Ort noch offen",
                    Description = x.Description ?? "", Status = x.Status with { Name = x.Status.Name ?? "Status offen", Abbrev = x.Status.Abbrev ?? "" },
                    WindowStart = IsoDate(x.WindowStart), WindowEnd = IsoDate(x.WindowEnd), StreamUrl = SafeStreamUrl(x.StreamUrl)
                }).DistinctBy(x => x.Id).OrderBy(x => x.Net, StringComparer.Ordinal).ToArray();
            if (launches.Count > 0) fetchedAt = cache.FetchedAt;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException or ArgumentException) { }
    }

    private void SaveCache()
    {
        try
        {
            AtomicFile.Write(cachePath, JsonSerializer.Serialize(new StoredCache(1, launches.ToArray(), fetchedAt, nextAttempt, lastError), JsonOptions));
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or ArgumentException) { }
    }
}
