using System.Globalization;
using System.Net.Http;
using System.Text.Json;
namespace PandaLcarsTactical.Weather;
public sealed class OpenMeteoProvider(HttpClient client) : IWeatherProvider
{
    public string Name => "Open-Meteo";
    public WeatherLayers SupportedLayers => WeatherLayers.Temperature | WeatherLayers.Clouds | WeatherLayers.Precipitation;
    public async Task<WeatherReport> GetAsync(GeoPlace place, CancellationToken token)
    {
        place.Validate();
        var url = FormattableString.Invariant($"https://api.open-meteo.com/v1/forecast?latitude={place.Latitude}&longitude={place.Longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,pressure_msl,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timeformat=iso8601&timezone=auto");
        using var response = await client.GetAsync(url, token);
        response.EnsureSuccessStatusCode();
        using var stream = await response.Content.ReadAsStreamAsync(token);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: token);
        return Parse(json.RootElement, place);
    }
    public static WeatherReport Parse(JsonElement root, GeoPlace place)
    {
        place.Validate();
        var current = root.GetProperty("current");
        static double Number(JsonElement value, double min, double max)
        {
            var number = value.GetDouble();
            if (!double.IsFinite(number) || number < min || number > max) throw new JsonException("Ungültiger Wetterwert.");
            return number;
        }
        double Read(string key, double min, double max) => Number(current.GetProperty(key), min, max);
        var offset = TimeSpan.FromSeconds(root.GetProperty("utc_offset_seconds").GetInt32());
        var local = DateTime.Parse(current.GetProperty("time").GetString()!, CultureInfo.InvariantCulture);
        var time = new DateTimeOffset(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), offset);
        var sample = new WeatherSample(time, Read("temperature_2m", -100, 70), Read("cloud_cover", 0, 100),
            Read("precipitation", 0, 1000), Read("wind_speed_10m", 0, 500), Read("relative_humidity_2m", 0, 100),
            Read("pressure_msl", 800, 1200), Read("interval", 1, 86400) / 60, "Open-Meteo");
        var daily = root.GetProperty("daily");
        var dates = daily.GetProperty("time"); var lows = daily.GetProperty("temperature_2m_min");
        var highs = daily.GetProperty("temperature_2m_max"); var codes = daily.GetProperty("weather_code");
        if (dates.GetArrayLength() < 3 || lows.GetArrayLength() != dates.GetArrayLength() ||
            highs.GetArrayLength() != dates.GetArrayLength() || codes.GetArrayLength() != dates.GetArrayLength())
            throw new JsonException("Unvollständige Dreitagesvorhersage.");
        var forecast = new List<ForecastDay>();
        for (int i = 0; i < 3; i++)
        {
            var date = DateOnly.ParseExact(dates[i].GetString()!, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            double low = Number(lows[i], -100, 70), high = Number(highs[i], -100, 70);
            if (low > high || (i > 0 && date != forecast[i - 1].Date.AddDays(1))) throw new JsonException("Ungültige Vorhersage.");
            forecast.Add(new(date, low, high, codes[i].GetInt32()));
        }
        var timezone = root.GetProperty("timezone").GetString() ?? "UTC";
        CelestialDay? celestial = null;
        try { celestial = CelestialTimes.Calculate(place, forecast[0].Date, timezone); }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException or ArgumentException) { }
        return new(place, sample, forecast, timezone, celestial);
    }
}
