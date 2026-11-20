using System.Globalization;
using System.Net;
using System.Text.Json;

namespace PandaLcarsTactical.SpaceX;

public sealed record StarshipVehicleTelemetry(
    string Id, DateTimeOffset? ObservedAt, double? MissionTimeSeconds,
    double? AltitudeKm, double? SpeedKmh, double? Latitude, double? Longitude,
    bool Stale, string? QualityNote);

public sealed record StarshipTelemetrySnapshot(
    IReadOnlyList<StarshipVehicleTelemetry> Vehicles, DateTimeOffset? FetchedAt,
    bool Stale, string? Error, string Source, DateTimeOffset? RetryAt);

/// <summary>
/// Reads the same public feed as SpaceX's vehicle tracker. Only current samples
/// are used: the separate trajectory array is a prediction, not live telemetry.
/// Vehicle IDs are kept independent of launch-calendar selection.
/// </summary>
public sealed class StarshipTelemetryService
{
    public const string FeedUrl = "https://content.spacex.com/cms-assets/starship_tracker_public.json";
    public const string SourceName = "SpaceX · Starship-Tracker";
    public static readonly TimeSpan MaximumSampleAge = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MinimumInterval = TimeSpan.FromSeconds(15);
    private static readonly DateTimeOffset GpsEpoch = new(1980, 1, 6, 0, 0, 0, TimeSpan.Zero);

    // GPS is continuous from 1980-01-06. UTC leap-second dates after that epoch.
    // IERS Bulletin C72 (2026-07-06): no leap second in December 2026; GPS-UTC=18s.
    // https://datacenter.iers.org/data/html/bulletinc-072.html
    private static readonly DateTimeOffset[] LeapTransitions =
    [
        Utc(1981, 7, 1), Utc(1982, 7, 1), Utc(1983, 7, 1), Utc(1985, 7, 1),
        Utc(1988, 1, 1), Utc(1990, 1, 1), Utc(1991, 1, 1), Utc(1992, 7, 1),
        Utc(1993, 7, 1), Utc(1994, 7, 1), Utc(1996, 1, 1), Utc(1997, 7, 1),
        Utc(1999, 1, 1), Utc(2006, 1, 1), Utc(2009, 1, 1), Utc(2012, 7, 1),
        Utc(2015, 7, 1), Utc(2017, 1, 1)
    ];

    private readonly HttpClient http;
    private readonly Func<DateTimeOffset> utcNow;
    private readonly SemaphoreSlim gate = new(1, 1);
    private IReadOnlyList<StarshipVehicleTelemetry> vehicles = Array.Empty<StarshipVehicleTelemetry>();
    private DateTimeOffset? fetchedAt;
    private DateTimeOffset nextAttempt;
    private string? error;

    public StarshipTelemetryService(HttpClient http, Func<DateTimeOffset>? utcNow = null)
    {
        this.http = http;
        this.utcNow = utcNow ?? (() => DateTimeOffset.UtcNow);
    }

    public async Task<StarshipTelemetrySnapshot> GetAsync(CancellationToken cancellationToken = default)
    {
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var now = utcNow();
            if (now < nextAttempt) return Snapshot(now);
            nextAttempt = now + MinimumInterval;
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(8));
                // SpaceX's own tracker adds a timestamp. Without it the CDN can
                // serve this file with a ten-minute cache lifetime.
                var url = FeedUrl + "?t=" + (now.ToUnixTimeSeconds() / 15).ToString(CultureInfo.InvariantCulture);
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.ParseAdd("PandasLcars/0.6.15 (+https://github.com/Pandalap-lab/PandasLcars)");
                request.Headers.Accept.ParseAdd("application/json");
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token).ConfigureAwait(false);
                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    var retry = response.Headers.RetryAfter;
                    var requested = retry?.Date ?? now + (retry?.Delta ?? TimeSpan.FromMinutes(1));
                    if (requested > nextAttempt) nextAttempt = requested;
                    error = "SpaceX begrenzt die Abfragen. Telemetrie ist vorübergehend nicht verfügbar.";
                }
                else
                {
                    response.EnsureSuccessStatusCode();
                    var bytes = await SpaceXService.ReadLimitedAsync(response, 1024 * 1024, timeout.Token).ConfigureAwait(false);
                    using var document = JsonDocument.Parse(bytes, new JsonDocumentOptions { MaxDepth = 32 });
                    vehicles = Normalize(document.RootElement, utcNow());
                    fetchedAt = utcNow();
                    error = null;
                }
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                error = "SpaceX-Telemetrie antwortet derzeit nicht.";
            }
            catch (Exception ex) when (ex is HttpRequestException or JsonException or IOException or InvalidDataException)
            {
                error = "SpaceX-Telemetrie ist derzeit nicht verfügbar.";
            }
            cancellationToken.ThrowIfCancellationRequested();
            return Snapshot(utcNow());
        }
        finally { gate.Release(); }
    }

    private StarshipTelemetrySnapshot Snapshot(DateTimeOffset now)
    {
        var current = vehicles.Select(v => v with
        {
            Stale = v.Stale || error is not null || !IsFresh(v.ObservedAt, now)
        }).ToArray();
        return new(current, fetchedAt,
            error is not null || (current.Length > 0 && current.All(v => v.Stale)),
            error, SourceName, nextAttempt > now ? nextAttempt : null);
    }

    public static IReadOnlyList<StarshipVehicleTelemetry> Normalize(JsonElement root, DateTimeOffset now)
    {
        if (root.ValueKind != JsonValueKind.Object) throw new JsonException("Starship feed root must be an object.");
        var result = new List<StarshipVehicleTelemetry>();
        var metadata = Child(root, "metadata");
        var generation = GpsToUtc(Number(metadata, "generation_time"));
        foreach (var property in root.EnumerateObject().Take(20))
        {
            if (property.Name == "metadata" || property.Name.Length > 48 ||
                !property.Name.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_')) continue;
            var current = Child(property.Value, "current");
            if (current.ValueKind != JsonValueKind.Object) continue;
            var observed = GpsToUtc(Number(current, "gps_time"));
            var missionTime = Range(Number(current, "mission_time"), -86400, 365 * 86400);
            var altitudeMetres = Range(Number(current, "altitude"), -1000, 100000000);
            var speedMetresPerSecond = Range(Number(current, "speed"), 0, 200000);
            var latitude = Range(Number(current, "latitude"), -90, 90);
            var longitude = Range(Number(current, "longitude"), -180, 180);
            var stale = !IsFresh(observed, now) || (generation is not null && !IsFresh(generation, now));
            result.Add(new(property.Name, observed, missionTime, altitudeMetres / 1000,
                speedMetresPerSecond * 3.6, latitude, longitude, stale, null));
        }
        // Only the observed empty-object contract means "no active vehicles".
        // An error envelope or a changed schema must not clear a good sample.
        if (result.Count == 0 && root.EnumerateObject().Any())
            throw new JsonException("Starship feed contains no recognized current vehicle samples.");
        return result.OrderBy(v => v.Stale).ThenBy(v => v.Id, StringComparer.Ordinal).ToArray();
    }

    public static DateTimeOffset? GpsToUtc(double? seconds)
    {
        if (seconds is null || !double.IsFinite(seconds.Value) || seconds < 0 || seconds > 10_000_000_000) return null;
        var offset = 0;
        for (var index = 0; index < LeapTransitions.Length; index++)
        {
            if (seconds >= (LeapTransitions[index] - GpsEpoch).TotalSeconds + index + 1) offset = index + 1;
        }
        try { return GpsEpoch.AddSeconds(seconds.Value - offset); }
        catch (ArgumentOutOfRangeException) { return null; }
    }

    public static bool IsFresh(DateTimeOffset? observedAt, DateTimeOffset now) =>
        observedAt is not null && observedAt <= now.AddSeconds(5) && now - observedAt <= MaximumSampleAge;

    private static DateTimeOffset Utc(int year, int month, int day) => new(year, month, day, 0, 0, 0, TimeSpan.Zero);
    private static JsonElement Child(JsonElement root, string name) =>
        root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var value) ? value : default;

    private static double? Number(JsonElement root, string name)
    {
        var value = Child(root, name);
        double parsed;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out parsed) && double.IsFinite(parsed)) return parsed;
        if (value.ValueKind == JsonValueKind.String &&
            double.TryParse(value.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out parsed) && double.IsFinite(parsed)) return parsed;
        return null;
    }
    private static double? Range(double? value, double minimum, double maximum) => value >= minimum && value <= maximum ? value : null;
}
