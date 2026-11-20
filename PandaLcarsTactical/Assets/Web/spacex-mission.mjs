// Release 0.6.15: standalone SpaceX launch data helpers.
// No external network requests are made by this module.
export function parseLaunch(record) {
  if (!record || typeof record !== "object") throw new TypeError("Launch record required");
  const raw = record.net ?? record.date_utc ?? record.launchDate;
  const ms = Date.parse(raw ?? "");
  if (!Number.isFinite(ms)) throw new RangeError("Invalid launch date");
  return {
    id: String(record.id ?? record.name ?? ms),
    name: String(record.name ?? record.mission?.name ?? "Unbekannte Mission"),
    rocket: String(record.rocket?.configuration?.full_name ?? record.rocket_name ?? "Nicht verfügbar"),
    pad: String(record.pad?.name ?? record.launchpad_name ?? "Nicht verfügbar"),
    launchUtc: new Date(ms).toISOString(),
    status: String(record.status?.name ?? record.status ?? "Geplant"),
    streamUrl: safeStreamUrl(record.vidURLs?.[0]?.url ?? record.webcast ?? null)
  };
}
export function safeStreamUrl(url) {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch { return null; }
}
export function viennaLaunchTime(utc) {
  const date = new Date(utc);
  if (!Number.isFinite(date.getTime())) return "Zeit nicht verfügbar";
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna", weekday: "short", day: "2-digit",
    month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date);
}
export function countdown(launchUtc, now = Date.now()) {
  const target = Date.parse(launchUtc);
  if (!Number.isFinite(target)) return null;
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining % 86400 / 3600),
    minutes: Math.floor(remaining % 3600 / 60),
    seconds: remaining % 60,
    elapsed: target <= now
  };
}
export function upcomingLaunches(records, now = Date.now(), limit = 10) {
  return records.map(parseLaunch)
    .filter(x => Date.parse(x.launchUtc) >= now)
    .sort((a,b) => Date.parse(a.launchUtc)-Date.parse(b.launchUtc))
    .slice(0, Math.min(10, Math.max(5, limit)));
}

export function telemetryDisplay(sample, now = Date.now()) {
  if (!sample || sample.verified !== true || !Number.isFinite(sample.timestamp) || now - sample.timestamp > 30000 || sample.timestamp > now + 5000) return {live:false,label:"Keine verifizierte Live-Telemetrie verfügbar"};
  const altitude = Number(sample.altitudeKm), speed = Number(sample.speedKmh);
  if (!Number.isFinite(altitude) || !Number.isFinite(speed) || altitude < 0 || speed < 0) return {live:false,label:"Telemetrie ungültig"};
  return {live:true,label:`Höhe: ${altitude.toFixed(1)} km · Geschwindigkeit: ${speed.toFixed(0)} km/h`,timestamp:sample.timestamp};
}
