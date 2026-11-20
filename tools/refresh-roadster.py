#!/usr/bin/env python3
"""Rebuild the offline Roadster ephemeris from NASA/JPL Horizons (one request).

Run from the repository root. No API key is required. The generated JavaScript
contains immutable daily vectors plus the small, reviewed interpolation module.
To reprocess an already downloaded response, pass --input PATH.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "PandaLcarsTactical/Assets/Web"
PARAMETERS = {
    "format": "json", "COMMAND": "'-143205'", "OBJ_DATA": "YES",
    "MAKE_EPHEM": "YES", "EPHEM_TYPE": "VECTORS", "CENTER": "'500@10'",
    "START_TIME": "'2025-01-01'", "STOP_TIME": "'2032-01-01'",
    "STEP_SIZE": "'1 d'", "REF_PLANE": "ECLIPTIC", "REF_SYSTEM": "ICRF",
    "OUT_UNITS": "AU-D", "VEC_TABLE": "2", "VEC_CORR": "NONE",
    "CSV_FORMAT": "YES", "TIME_TYPE": "UT",
}
URL = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urllib.parse.urlencode(PARAMETERS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path)
    args = parser.parse_args()
    if args.input:
        raw = args.input.read_bytes()
    else:
        with urllib.request.urlopen(URL, timeout=60) as response:
            raw = response.read()
    envelope = json.loads(raw)
    output = envelope.get("result", "")
    for text in ("(-143205)", "{source: tesla_s11}", "Center body name: Sun (10)",
                 "Ecliptic of J2000.0", "Output units    : AU-D", "Calendar Date (UT )"):
        if text not in output:
            raise ValueError("Unexpected Horizons metadata: " + text)
    rows = []
    dates = []
    for line in output.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip().splitlines():
        columns = line.split(",")
        dates.append(float(columns[0]))
        rows.append([float(format(float(n), ".14g")) for n in columns[2:8]])
    if len(rows) != 2557 or any(b-a != 1 for a, b in zip(dates, dates[1:])):
        raise ValueError("Expected 2,557 consecutive daily vector samples")
    if dates[0] != 2460676.5 or dates[-1] != 2463232.5:
        raise ValueError("Unexpected ephemeris date range")
    header = {
        "source": "NASA/JPL Horizons", "sourceUrl": URL,
        "apiVersion": envelope.get("signature", {}).get("version"),
        "targetId": -143205, "solution": "tesla_s11 (2025-01-03)",
        "frame": "Ecliptic J2000 / ICRF", "center": "Sun", "units": "AU-D",
        "retrievedOn": dt.datetime.now(dt.timezone.utc).date().isoformat(),
        "validFrom": "2025-01-01T00:00:00.000Z", "validUntil": "2032-01-01T00:00:00.000Z",
        "sampleStepDays": 1, "sampleCount": len(rows),
    }
    template = (ROOT / "tools/roadster-module.js.txt").read_text(encoding="utf-8")
    data = "[\n" + ",\n".join(json.dumps(row, separators=(",", ":")) for row in rows) + "\n]"
    script = template.replace("/*__METADATA__*/", json.dumps(header, ensure_ascii=False, indent=2)).replace("/*__SAMPLES__*/", data)
    (WEB / "roadster.js").write_text(script, encoding="utf-8")
    print(f"Generated {WEB / 'roadster.js'}: {len(rows)} samples, {len(script.encode())} bytes")


if __name__ == "__main__":
    main()
