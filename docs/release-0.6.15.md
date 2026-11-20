# PandasLcars 0.6.15 – SpaceX Mission Control und Roadster

## Bedienung

**05 DATA · SpaceX** öffnet die Missionskontrolle. Die bisherige Explorer-Funktion dieser Taste ist vollständig ersetzt. **ZURÜCK** oder Escape führt zurück ins Dashboard.

- Nächster SpaceX-Start: Mission, Rakete, Startort, Status und Wiener Startzeit. Ein Countdown läuft nur bei bestätigtem Termin mit genauer Uhrzeit und aktuellen Daten. Hold, unbestätigte Planung und veraltete Daten erhalten eigene Anzeigen. Die erreichte Startzeit gilt nicht automatisch als erfolgter Start.
- Kalender: bis zu zehn kommende SpaceX-Missionen. Eine Auswahl öffnet die Missionsdetails und den offiziellen Stream, sofern hinterlegt. Präzise Zeiten werden in **Europe/Vienna** einschließlich Sommer-/Winterzeit umgerechnet. Grobe Tages-/Monatsangaben erhalten keine erfundene Uhrzeit.
- **Starship-Telemetrie**: Höhe, Geschwindigkeit und gemessene Missionszeit aus dem offiziellen SpaceX-Tracker, getrennt nach Fahrzeug. Die Fahrzeugkennung bleibt unabhängig von einer ausgewählten Falcon-Mission. Fehlender Zeitstempel oder mehr als 30 Sekunden alte Werte gelten nicht als live. Leerer Feed, Ausfall und veraltete Messungen sind unterscheidbar; keine Demo-Zahlen im Produktivmodus.
- Offizielle Streams öffnen im Windows-Standardbrowser. Akzeptiert werden nur HTTPS-Adressen auf den vorgesehenen Anbieter-Domains.

Im **Sonnensystem unten links** fliegt der Tesla Roadster als kleines rotes Auto. Ein Klick auf das Auto, **R** im Sonnensystem oder die Vergrößerung öffnet berechnete Geschwindigkeit, Entfernung zur Sonne und Erde, Koordinaten und Quelle. Acht Planeten und CENTER/X/Y/Z bleiben erhalten. **03 Navigation** bleibt Google Maps.

Der schnelle Wechsel von **CENTER zu EARTH** wurde ebenfalls korrigiert: Ein noch laufender Kameraflug wird vor dem neuen Flug beendet, damit dessen Abbruch die neue Erdansicht und ihre Tag-/Nachtbeleuchtung nicht wieder ausschalten kann.

## Quellen und Grenzen

**Startplanung:** [The Space Devs – Launch Library 2](https://thespacedevs.com/llapi), Version 2.3.0, SpaceX-Anbieterfilter 121. Native HTTP-Anbindung, persistenter Cache und mindestens fünf Minuten Abrufabstand; HTTP 429/Retry-After wird berücksichtigt. Abfragen nur bei geöffnetem Board. Ausfälle überschreiben die letzte brauchbare Planung nicht; der Stand wird als veraltet gekennzeichnet. Die alte r-spacex-API und LL2 2.2.0 sind keine Produktionsdatenquellen. LL2 ist eine Community-Datenbank; Starttermine können sich kurzfristig ändern.

**Starship:** [SpaceX-Tracker](https://www.spacex.com/vehicle-tracker), [öffentlicher JSON-Feed](https://content.spacex.com/cms-assets/starship_tracker_public.json). Nur **current**-Messwerte werden verwendet; die prognostizierte **trajectory** wird nicht als gemessene Telemetrie dargestellt. GPS-Sekunden werden nach UTC umgerechnet, Meter in Kilometer, m/s in km/h. Abruf frühestens alle 15 Sekunden, nur bei geöffnetem Board. Außerhalb eines Flugs kann der Feed leer sein. Falcon 9/Falcon Heavy haben in diesem Release keine separat verifizierte numerische Telemetriequelle; dafür bleibt der Missionsstream verfügbar. Max-Q, MECO oder andere Meilensteine werden nicht aus geplanten Zeiten als beobachtete Ereignisse abgeleitet.

**Roadster:** [NASA/JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html), Ziel −143205, Lösung tesla_s11, heliozentrische Ekliptik J2000/ICRF. Tägliche Positions-/Geschwindigkeitsvektoren vom **01.01.2025 bis 01.01.2032** werden lokal interpoliert, auch offline. Außerhalb dieses Bereichs sind Auto und Werte nicht verfügbar. Es handelt sich um berechnete Ephemeriden, keine Live-GPS-Messung. Sieben unabhängig abgefragte Zwischenzeitpunkte prüfen die Interpolation mit einer Grenze von 100 Metern; die gemessene maximale Abweichung zur Ephemeride liegt unter 34 Metern. Das ist keine Aussage über die tatsächliche Ortsunsicherheit. tools/refresh-roadster.py erneuert die Daten reproduzierbar.

## Update wie bisher

**UPDATES SUCHEN → 77852 · UPDATE LADEN → Installation bestätigen.**

Versionsvergleich, SHA-256-Abgleich, verifizierter Download-Cache und einzelner bestätigter Installerstart bleiben erhalten. Entwicklungsbranch und Vorabrelease lösen kein Updateangebot aus. Bildschirmwahl, eigene Links und verschlüsselte Schlüsseldatei bleiben erhalten.

## Prüfungen und Veröffentlichung

Der Release-Workflow prüft Kernfunktionen, neue Daten-/Telemetrieadapter, Wiener Zeitumrechnung, Datenalter, Abfragepausen und unabhängige Roadster-Referenzen. SpaceX-/Roadster-Oberflächen werden in Edge einschließlich **1280 × 720** geprüft. Die bestehenden Erd-/ISS-/Wettertests laufen weiter, zusätzlich erneut gegen die gebauten Windows-Dateien.

Vor Veröffentlichung sind Windows-x64-Build, Installer, zweimaliges Upgrade von **0.6.14**, Datenerhalt und Deinstallation auf dem Windows-Testrechner erforderlich. Dateien: PandasLcars-Setup.exe, PandasLcars-Windows-x64.zip und SHA256SUMS.txt.

Der Testrechner ersetzt keinen Test der persönlichen Windows-/Norton-Konfiguration. Norton und SmartScreen bleiben eingeschaltet; die Installation auf dem Nutzergerät erfolgt über die vorhandenen Update-Tasten.
