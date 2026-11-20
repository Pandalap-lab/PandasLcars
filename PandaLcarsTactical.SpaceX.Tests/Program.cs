using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using PandaLcarsTactical.SpaceX;

var passed = 0;
void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
    passed++;
}

JsonObject Mission(string id = "76617033-4dc0-4448-b50c-e5b0d5a18539", string net = "2026-11-21T12:30:00Z") => new()
{
    ["id"] = id, ["name"] = "Falcon 9 | Test mission", ["net"] = net,
    ["net_precision"] = new JsonObject { ["id"] = 1, ["name"] = "Minute" },
    ["status"] = new JsonObject { ["id"] = 1, ["name"] = "Go for Launch", ["abbrev"] = "Go" },
    ["launch_service_provider"] = new JsonObject { ["id"] = 121, ["name"] = "SpaceX" },
    ["rocket"] = new JsonObject { ["configuration"] = new JsonObject { ["full_name"] = "Falcon 9 Block 5" } },
    ["pad"] = new JsonObject { ["name"] = "SLC-40", ["location"] = new JsonObject { ["name"] = "Cape Canaveral" } },
    ["window_start"] = net, ["window_end"] = "2026-11-21T14:30:00Z",
    ["mission"] = new JsonObject { ["description"] = "An actual API-shape fixture; no launch data is treated as telemetry." },
    ["vid_urls"] = new JsonArray(
        new JsonObject { ["url"] = "https://www.youtube.com/watch?v=unofficial", ["type"] = new JsonObject { ["id"] = 3 } },
        new JsonObject { ["url"] = "https://x.com/i/broadcasts/official", ["type"] = new JsonObject { ["id"] = 1 }, ["live"] = true })
};

string Payload(params JsonNode?[] rows) => new JsonObject { ["results"] = new JsonArray(rows) }.ToJsonString();
IReadOnlyList<SpaceXLaunch> Parse(string json)
{
    using var document = JsonDocument.Parse(json);
    return SpaceXService.Normalize(document.RootElement);
}
HttpResponseMessage Response(string json, HttpStatusCode status = HttpStatusCode.OK) => new(status) { Content = new StringContent(json) };

var item = Parse(Payload(Mission())).Single();
Check(item.Rocket == "Falcon 9 Block 5" && item.Location == "Cape Canaveral", "Normalized rocket and launch location.");
Check(item.Precision == "minute" && item.Status.Id == 1, "Preserve launch precision and source status.");
Check(item.StreamUrl == "https://x.com/i/broadcasts/official", "Official webcast wins over first unofficial video.");
Check(item.Net.EndsWith("+00:00"), "NET is normalized to UTC.");

var offset = Mission(net: "2026-11-21T13:30:00+01:00");
Check(Parse(Payload(offset)).Single().Net == item.Net, "Explicit timezone offsets normalize to the same instant.");
var wrongProvider = Mission(); wrongProvider["launch_service_provider"]!["id"] = 88;
var invalidDate = Mission(); invalidDate["net"] = "not a date";
var ambiguousDate = Mission(); ambiguousDate["net"] = "2026-11-21T12:30:00";
Check(Parse(Payload(wrongProvider, invalidDate, ambiguousDate, null, JsonValue.Create(5), Mission(), Mission())).Count == 1,
    "Malformed entries, other providers and duplicate IDs do not break or contaminate a valid result.");
var partial = Mission(); partial.Remove("rocket"); partial.Remove("pad"); partial.Remove("mission"); partial.Remove("status"); partial["net_precision"] = null;
var partialItem = Parse(Payload(partial)).Single();
Check(partialItem.Rocket == "Rakete noch offen" && partialItem.Status.Id == 0 && partialItem.Precision == "unknown", "Partial metadata stays explicitly unknown.");
var held = Mission(); held["status"]!["id"] = 5; held["status"]!["name"] = "On Hold";
Check(Parse(Payload(held)).Single().Status.Id == 5, "Holds remain holds, independent of NET.");
var precise = Mission(); precise["net_precision"]!["id"] = 0;
Check(Parse(Payload(precise)).Single().Precision == "second", "Precision ID zero is not lost as a false value.");

foreach (var unsafeUrl in new[] { "javascript:alert(1)", "http://x.com/a", "https://x.com.attacker.test/a", "https://x.com@attacker.test/a", "https://user:password@x.com/a", "https://x.com:444/a", "https://example.com/a", " https://x.com/a", "https://x.com/a\n" })
    Check(SpaceXService.SafeStreamUrl(unsafeUrl) is null, "Reject unsafe or unsupported stream: " + unsafeUrl);
Check(SpaceXService.SafeStreamUrl("https://youtu.be/example") is not null, "Allow supported HTTPS video hosts.");
var untrustedVideo = Mission(); untrustedVideo["vid_urls"] = new JsonArray(new JsonObject { ["url"] = "https://attacker.test/watch", ["type"] = new JsonObject { ["id"] = 1 } });
Check(Parse(Payload(untrustedVideo)).Single().StreamUrl is null, "Metadata calling itself official does not bypass URL validation.");

var directory = Path.Combine(Path.GetTempPath(), "pandas-spacex-test-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(directory);
try
{
    var now = new DateTimeOffset(2026, 11, 20, 12, 0, 0, TimeSpan.Zero);
    var handler = new FakeHandler();
    handler.Responses.Enqueue(Response(Payload(Mission())));
    using var client = new HttpClient(handler);
    var service = new SpaceXService(client, directory, () => now);
    var first = await service.GetAsync();
    Check(first.Launches.Count == 1 && !first.Stale && first.Error is null, "Successful fetch is fresh.");
    Check(handler.Count == 1 && handler.LastUri == SpaceXService.LaunchesUrl && handler.UserAgent.Contains("PandasLcars"), "Use fixed source endpoint and named client.");
    var cached = await service.GetAsync();
    Check(handler.Count == 1 && cached.FetchedAt == first.FetchedAt, "Repeated opens use cache without requests.");
    var restarted = new SpaceXService(client, directory, () => now);
    Check((await restarted.GetAsync()).Launches.Count == 1 && handler.Count == 1, "Cache and request throttle survive application restart.");

    now = now.AddMinutes(6);
    var limited = Response("{}", HttpStatusCode.TooManyRequests);
    limited.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromMinutes(13));
    handler.Responses.Enqueue(limited);
    var rateLimited = await service.GetAsync();
    Check(rateLimited.Stale && rateLimited.Launches.Count == 1 && rateLimited.Error is not null, "429 retains good data with stale state.");
    Check(rateLimited.RetryAt == now.AddMinutes(13), "Respect server Retry-After.");
    now = now.AddMinutes(6);
    await service.GetAsync();
    Check(handler.Count == 2, "Do not request again during server backoff.");

    now = now.AddMinutes(8);
    handler.Responses.Enqueue(Response("{broken"));
    var malformed = await service.GetAsync();
    Check(malformed.Stale && malformed.Launches.Count == 1 && malformed.FetchedAt == first.FetchedAt, "Malformed response cannot overwrite last good cache.");
    now = now.AddMinutes(6);
    handler.Responses.Enqueue(Response("{\"results\":[]}"));
    Check((await service.GetAsync()).Launches.Count == 1, "Empty results cannot erase last good cache.");
    now = now.AddMinutes(6);
    handler.Responses.Enqueue(Response(Payload(Mission())));
    var recovered = await service.GetAsync();
    Check(!recovered.Stale && recovered.Error is null && recovered.FetchedAt == now, "Recovery replaces stale/error state.");
    using var cancelled = new CancellationTokenSource();
    cancelled.Cancel();
    try { await service.GetAsync(cancelled.Token); throw new Exception("Cancellation not observed."); }
    catch (OperationCanceledException) { passed++; }

    var reloaded = new SpaceXService(client, directory, () => now);
    var parallel = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => reloaded.GetAsync()));
    Check(handler.Count == 5 && parallel.All(x => x.Launches.Count == 1), "Concurrent callers share the persisted cache.");

    var cachePath = Path.Combine(directory, "spacex-cache.json");
    var damaged = JsonNode.Parse(File.ReadAllText(cachePath))!;
    damaged["launches"]![0]!["net"] = null;
    damaged["nextAttempt"] = "2099-01-01T00:00:00Z";
    File.WriteAllText(cachePath, damaged.ToJsonString());
    var repaired = new SpaceXService(client, directory, () => now);
    var damagedState = await repaired.GetAsync();
    Check(damagedState.Launches.Count == 0 && damagedState.RetryAt <= now.AddMinutes(5), "Damaged cache rows and far-future retry times cannot crash or lock out the board.");
    now = now.AddMinutes(6);
    handler.Responses.Enqueue(Response(Payload(Mission())));
    Check((await repaired.GetAsync()).Launches.Count == 1, "A damaged cache recovers through the normal source request.");
}
finally { Directory.Delete(directory, true); }

var coarseDirectory = Path.Combine(Path.GetTempPath(), "pandas-spacex-coarse-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(coarseDirectory);
try
{
    var coarseNow = new DateTimeOffset(2026, 11, 20, 12, 30, 0, TimeSpan.Zero);
    var dayMission = Mission("76617033-4dc0-4448-b50c-e5b0d5a18539", "2026-11-20T00:00:00Z");
    dayMission["net_precision"]!["id"] = 5;
    var monthMission = Mission("951a341f-236b-42fe-a667-4ab2fcf36eac", "2026-11-01T00:00:00Z");
    monthMission["net_precision"]!["id"] = 7;
    var oldUnknown = Mission("0f867f0c-5422-4d44-93b8-d7faaae7019b", "2026-11-10T00:00:00Z");
    oldUnknown["net_precision"] = null;
    var coarseHandler = new FakeHandler();
    coarseHandler.Responses.Enqueue(Response(Payload(dayMission, monthMission, oldUnknown)));
    using var coarseClient = new HttpClient(coarseHandler);
    var coarseService = new SpaceXService(coarseClient, coarseDirectory, () => coarseNow);
    var coarseSnapshot = await coarseService.GetAsync();
    Check(coarseSnapshot.Launches.Any(x => x.Id == "76617033-4dc0-4448-b50c-e5b0d5a18539"), "Day-precision mission stays upcoming throughout its UTC day.");
    Check(coarseSnapshot.Launches.Any(x => x.Id == "951a341f-236b-42fe-a667-4ab2fcf36eac"), "Month-precision mission stays upcoming throughout its UTC month.");
    Check(coarseSnapshot.RecentLaunches.Count == 0 && coarseSnapshot.Launches.Count == 2, "Coarse upcoming missions are not duplicated as recent; unknown historical dates older than48hours are excluded.");
    coarseNow = new DateTimeOffset(2026, 11, 21, 0, 0, 0, TimeSpan.Zero);
    coarseHandler.Responses.Enqueue(Response("{}", HttpStatusCode.ServiceUnavailable));
    var nextDay = await coarseService.GetAsync();
    Check(nextDay.Launches.Count == 1 && nextDay.Launches[0].Precision == "month" && nextDay.RecentLaunches.Count == 1,
        "Day-precision mission leaves upcoming after its period, while the current month remains.");
}
finally { Directory.Delete(coarseDirectory, true); }

var telemetryNow = new DateTimeOffset(2026, 11, 20, 12, 0, 0, TimeSpan.Zero);
const double currentGps = 1479211218;
JsonObject Telemetry(double gps = currentGps, double? speed = 7600, double? altitude = 200000) => new()
{
    ["metadata"] = new JsonObject { ["generation_time"] = gps, ["trajectory_version"] = 2, ["coordinate_frame"] = "ECEF" },
    ["ship42"] = new JsonObject
    {
        ["current"] = new JsonObject { ["gps_time"] = gps, ["mission_time"] = 600, ["speed"] = speed, ["altitude"] = altitude, ["latitude"] = 5, ["longitude"] = -80 },
        ["trajectory"] = new JsonArray(new JsonObject { ["time"] = gps + 100, ["altitude"] = 300000, ["speed"] = 12345 })
    }
};
IReadOnlyList<StarshipVehicleTelemetry> ParseTelemetry(string json)
{
    using var document = JsonDocument.Parse(json);
    return StarshipTelemetryService.Normalize(document.RootElement, telemetryNow);
}
Check(StarshipTelemetryService.GpsToUtc(1167264018) == new DateTimeOffset(2017, 1, 1, 0, 0, 0, TimeSpan.Zero), "GPS epoch/leap-second conversion at published 2017 transition.");
Check(StarshipTelemetryService.GpsToUtc(currentGps) == telemetryNow, "Current GPS seconds convert to correct UTC, not Unix epoch.");
var telemetry = ParseTelemetry(Telemetry().ToJsonString()).Single();
Check(!telemetry.Stale && telemetry.AltitudeKm == 200 && telemetry.SpeedKmh == 27360 && telemetry.MissionTimeSeconds == 600,
    "Read current altitude metres, speed m/s and sampled mission seconds with correct units; ignore predicted trajectory.");
Check(ParseTelemetry("{}").Count == 0, "Empty official feed means no active telemetry.");
Check(ParseTelemetry(Telemetry(currentGps - 31).ToJsonString()).Single().Stale, "Samples older than30seconds are stale.");
Check(ParseTelemetry(Telemetry(currentGps + 6).ToJsonString()).Single().Stale, "Future timestamps cannot create fresh telemetry.");
var noTimestamp = Telemetry(); noTimestamp["ship42"]!["current"]!["gps_time"] = null;
Check(ParseTelemetry(noTimestamp.ToJsonString()).Single().Stale, "Missing timestamp cannot be replaced with fetch time.");
var missingNumbers = Telemetry(speed: null, altitude: null); missingNumbers["ship42"]!["current"]!["mission_time"] = null;
var missingTelemetry = ParseTelemetry(missingNumbers.ToJsonString()).Single();
Check(missingTelemetry.SpeedKmh is null && missingTelemetry.AltitudeKm is null && missingTelemetry.MissionTimeSeconds is null, "Missing metrics remain null, never synthetic zero.");
var invalidNumbers = Telemetry(); invalidNumbers["ship42"]!["current"]!["speed"] = "NaN"; invalidNumbers["ship42"]!["current"]!["altitude"] = "Infinity";
Check(ParseTelemetry(invalidNumbers.ToJsonString()).Single().SpeedKmh is null && ParseTelemetry(invalidNumbers.ToJsonString()).Single().AltitudeKm is null, "Nonfinite metrics are rejected.");
Check(ParseTelemetry(Telemetry(speed: 0, altitude: 0).ToJsonString()).Single().SpeedKmh == 0, "Actual zero speed on ground remains valid.");
Check(ParseTelemetry(Telemetry(speed: 0).ToJsonString()).Single().SpeedKmh == 0, "Fresh finite source values remain source values even when speed is zero at altitude.");
var archived = Telemetry(1461125597.086668, 0, 198192.894189);
Check(ParseTelemetry(archived.ToJsonString()).Single().Stale, "Official archived ship39 fixture cannot be displayed as live.");

var telemetryHandler = new FakeHandler();
telemetryHandler.Responses.Enqueue(Response(Telemetry().ToJsonString()));
using var telemetryClient = new HttpClient(telemetryHandler);
var telemetryService = new StarshipTelemetryService(telemetryClient, () => telemetryNow);
var live = await telemetryService.GetAsync();
Check(!live.Stale && live.Vehicles.Count == 1, "Native live source fetch normalizes one fresh vehicle.");
await telemetryService.GetAsync();
Check(telemetryHandler.Count == 1 && telemetryHandler.LastUri!.StartsWith(StarshipTelemetryService.FeedUrl + "?t="), "Telemetry shares15second cache and uses current official endpoint.");
telemetryNow = telemetryNow.AddSeconds(16);
telemetryHandler.Responses.Enqueue(Response("{}", HttpStatusCode.ServiceUnavailable));
Check((await telemetryService.GetAsync()).Vehicles.Single().Stale, "Network failure marks last sample stale immediately.");
telemetryNow = telemetryNow.AddSeconds(16);
telemetryHandler.Responses.Enqueue(Response("{\"error\":\"temporarily unavailable\"}"));
var invalidEnvelope = await telemetryService.GetAsync();
Check(invalidEnvelope.Vehicles.Count == 1 && invalidEnvelope.Vehicles.Single().Stale && invalidEnvelope.Error is not null,
    "HTTP200 error envelopes preserve stale samples instead of claiming no active telemetry.");
telemetryNow = telemetryNow.AddSeconds(16);
telemetryHandler.Responses.Enqueue(Response("{}"));
var inactive = await telemetryService.GetAsync();
Check(inactive.Vehicles.Count == 0 && inactive.Error is null, "Empty successful feed clears any prior vehicle sample.");

Console.WriteLine($"SpaceX native checks passed: {passed}");

sealed class FakeHandler : HttpMessageHandler
{
    public Queue<HttpResponseMessage> Responses { get; } = new();
    public int Count { get; private set; }
    public string? LastUri { get; private set; }
    public string UserAgent { get; private set; } = "";
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Count++;
        LastUri = request.RequestUri?.AbsoluteUri;
        UserAgent = request.Headers.UserAgent.ToString();
        if (Responses.Count == 0) throw new InvalidOperationException("Unexpected network request.");
        return Task.FromResult(Responses.Dequeue());
    }
}
