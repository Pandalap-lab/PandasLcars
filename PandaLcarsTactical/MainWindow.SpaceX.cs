using System.Text.Json;
using PandaLcarsTactical.SpaceX;

namespace PandaLcarsTactical;

public sealed partial class MainWindow
{
    private SpaceXService? spaceXService;
    private StarshipTelemetryService? starshipTelemetry;

    private async Task SendStarshipTelemetryAsync(JsonElement message)
    {
        var requestId = message.TryGetProperty("requestId", out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
        if (requestId is { Length: > 100 }) return;
        try
        {
            var result = await (starshipTelemetry ??= new StarshipTelemetryService(http)).GetAsync(lifetime.Token);
            Send(new { type = "spacexTelemetry", requestId, result.Vehicles, result.FetchedAt,
                result.Stale, result.Error, result.Source, result.RetryAt });
        }
        catch (OperationCanceledException) when (closed) { }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            Send(new { type = "spacexTelemetry", requestId, vehicles = Array.Empty<StarshipVehicleTelemetry>(),
                fetchedAt = (DateTimeOffset?)null, stale = true, source = StarshipTelemetryService.SourceName,
                error = "Starship-Telemetrie ist derzeit nicht verfügbar.",
                retryAt = DateTimeOffset.UtcNow.AddMinutes(1) });
        }
    }

    private async Task SendSpaceXLaunchesAsync(JsonElement message)
    {
        var requestId = message.TryGetProperty("requestId", out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
        if (requestId is { Length: > 100 }) return;
        try
        {
            var service = spaceXService ??= new SpaceXService(http,
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical"));
            var result = await service.GetAsync(lifetime.Token);
            Send(new { type = "spacexLaunches", requestId, result.Launches, result.RecentLaunches, result.FetchedAt,
                result.Stale, result.Error, result.RetryAt });
        }
        catch (OperationCanceledException) when (closed) { }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            Send(new { type = "spacexLaunches", requestId, launches = Array.Empty<SpaceXLaunch>(),
                fetchedAt = (DateTimeOffset?)null, stale = true,
                error = "Startdaten sind derzeit nicht verfügbar. Bitte später aktualisieren.",
                retryAt = DateTimeOffset.UtcNow.AddMinutes(5) });
        }
    }

    private async Task OpenSpaceXLinkAsync(JsonElement message)
    {
        if (!message.TryGetProperty("url", out var value) || value.ValueKind != JsonValueKind.String) return;
        var url = value.GetString();
        if (url is null || url.Length > 2048 || url.Any(char.IsControl) ||
            !Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
            !uri.IsDefaultPort || uri.UserInfo.Length != 0) return;
        var source = uri.IdnHost.ToLowerInvariant() is "thespacedevs.com" or "www.thespacedevs.com" or
            "ll.thespacedevs.com" or "ssd.jpl.nasa.gov";
        if (SpaceXService.SafeStreamUrl(url) is null && !source) return;
        var opened = await Windows.System.Launcher.LaunchUriAsync(uri);
        Send(new { type = "spacexLinkResult", opened,
            message = opened ? "Im Browser geöffnet." : "Browser konnte nicht geöffnet werden." });
    }
}
