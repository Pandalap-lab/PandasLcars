namespace PandaLcarsTactical.Weather;

// Intentionally no guessed API path, tariff or response schema. Enable only after
// checking the user's licensed location endpoint and actual response contract.
public sealed class KachelmannProvider : IWeatherProvider
{
    public string Name => "Kachelmannwetter / Meteologix";
    public WeatherLayers SupportedLayers => WeatherLayers.None;
    public Task<WeatherReport> GetAsync(GeoPlace place, CancellationToken cancellationToken) =>
        Task.FromException<WeatherReport>(new NotSupportedException(
            "Kachelmann-Adapter vorbereitet; Standort-Endpunkt und Datenvertrag fehlen noch."));
}
