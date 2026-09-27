using CosineKitty;

namespace PandaLcarsTactical.Weather;

public sealed record CelestialDay(DateOnly Date, DateTimeOffset? Sunrise, DateTimeOffset? Sunset,
    DateTimeOffset? Moonrise, DateTimeOffset? Moonset);

public static class CelestialTimes
{
    public static CelestialDay Calculate(GeoPlace place, DateOnly date, string timezone)
    {
        place.Validate();
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        // Resolve both midnights separately: DST days can contain 23 or 25 hours.
        DateTime Start(DateOnly day)
        {
            var local = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
            while (zone.IsInvalidTime(local)) local = local.AddMinutes(1);
            if (zone.IsAmbiguousTime(local))
                return new DateTimeOffset(local, zone.GetAmbiguousTimeOffsets(local).Max()).UtcDateTime;
            return TimeZoneInfo.ConvertTimeToUtc(local, zone);
        }
        var start = Start(date);
        var end = Start(date.AddDays(1));
        var observer = new Observer(place.Latitude, place.Longitude, 0);
        DateTimeOffset? Find(Body body, Direction direction)
        {
            var result = Astronomy.SearchRiseSet(body, observer, direction, new AstroTime(start), (end-start).TotalDays);
            if (result is null) return null;
            var utc = result.ToUtcDateTime();
            return utc >= start && utc < end ? TimeZoneInfo.ConvertTime(new DateTimeOffset(utc), zone) : null;
        }
        return new(date, Find(Body.Sun, Direction.Rise), Find(Body.Sun, Direction.Set),
            Find(Body.Moon, Direction.Rise), Find(Body.Moon, Direction.Set));
    }
}
