namespace PandaLcarsTactical.Weather;

[Flags]
public enum WeatherLayers { None = 0, Temperature = 1, Clouds = 2, Precipitation = 4, Radar = 8 }

public sealed record WeatherSample(DateTimeOffset ValidAt, double TemperatureC,
    double CloudPercent, double PrecipitationMm, double WindKmh,
    double HumidityPercent, double PressureHpa, double IntervalMinutes, string Source);

public sealed record GeoPlace(string Name, double Latitude, double Longitude, string Country = "", string Region = "")
{
    public static GeoPlace Vienna { get; } = new("Wien", 48.2082, 16.3738, "Österreich");
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Name) || Name.Length > 160 || !double.IsFinite(Latitude) ||
            !double.IsFinite(Longitude) || Latitude is < -90 or > 90 || Longitude is < -180 or > 180)
            throw new ArgumentException("Ungültiger Ort.");
    }
}
public sealed record ForecastDay(DateOnly Date, double MinimumC, double MaximumC, int WeatherCode);
public sealed record WeatherReport(GeoPlace Place, WeatherSample Current, IReadOnlyList<ForecastDay> Daily, string Timezone);

// Provider data is independent of UI, secrets and geographic rendering.
public interface IWeatherProvider
{
    string Name { get; }
    WeatherLayers SupportedLayers { get; }
    Task<WeatherReport> GetAsync(GeoPlace place, CancellationToken cancellationToken);
}
