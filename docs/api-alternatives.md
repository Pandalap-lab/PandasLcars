# API-Alternativen für LCARS – Prüfung 10.10.2026

## GeoSphere Austria: technisch geprüft, noch nicht eingebaut

- Echter anonymer Abruf HTTP 200: Wien/Hohe Warte, Station 11035, Datenzeit 18:40 UTC / 20:40 Wien.
- Temperatur 14,7 °C, Regen 0 mm / 10 Minuten, Wind 4 m/s (=14,4 km/h), Böe 7,5 m/s (=27 km/h), Richtung 250°, Feuchte 80 %, Taupunkt 11,2 °C.
- Stationsdruck 987,7 hPa und reduzierter Druck 1012,2 hPa sind unterschiedliche Größen. Für einen Quellenwechsel Druckdefinition im bestehenden Dashboard beachten.
- Sonnenscheindauer und Globalstrahlung verfügbar. Schneehöhe für diese Station im Test null; keine Nullmessung erfinden.
- Vorhersage-Metadaten nwp-v2-1h-1km real abgerufen: u.a. tcc (Bewölkung %), 2t, 2r, 10u/10v, 10fg, tp. Wettermodell, keine Satelliten-Wolkenmaske. Vorhersagewerte noch nicht live abgerufen.
- Öffentlicher Dataset-Katalog abgerufen: kein expliziter frei zugänglicher Blitzereignis-Datensatz gefunden. GeoSphere-Satellitenportal zeigt ALDIS-Blitze, daraus ergibt sich keine freie Rohdatenfreigabe. Expert-Portal ist ein Angebot auf Anfrage.
- Öffentliche Dataset-API ohne Schlüssel; CC BY 4.0. Limits laut API-Grundlagen: 5 Requests/s und 240/h. Ein gebündelter Abruf alle 10 Minuten ist geeignet.
- Empfehlung: alternative Stationsquelle für Österreich, mit Stationsname/Entfernung und Messzeit. Open-Meteo für weltweite Ortswahl beibehalten. Regenbeschriftung bei GeoSphere auf 10 Minuten ändern; keine 15-Minuten-Werte vortäuschen.

Quellen und Testendpunkte:
- https://dataset.api.hub.geosphere.at/v1/docs/
- https://data.hub.geosphere.at/showcase/api-grundlagen
- https://dataset.api.hub.geosphere.at/v1/datasets
- https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?parameters=TL,RR,FF,FFX,DD,RF,P,PRED,TP,SO,GLOW,SCHNEE&station_ids=11035
- https://dataset.api.hub.geosphere.at/v1/timeseries/forecast/nwp-v2-1h-1km/metadata
- https://www.geosphere.at/de/karten/wetterportal/satellitenbilder-oesterreich
- https://www.geosphere.at/de/daten/services/expert-portal

## Weitere Optionen – recherchiert, nicht zum laufenden Implementierungsumfang hinzugefügt

1. Open-Meteo / CAMS: Luftqualität, PM2.5/PM10, Ozon, NO2, UV und europäische Pollenprognosen. Modellwerte, keine lokale Messstation. Gratiszugang für nichtkommerzielle Nutzung; Attribution an CAMS und Open-Meteo. https://open-meteo.com/en/docs/air-quality-api
2. MeteoAlarm: amtliche europäische Wetterwarnungen, GeoJSON/EDR und Länder-Atomfeeds, CC BY 4.0; Authentifizierung des gewählten Endpunkts vor Umsetzung separat testen. https://api.meteoalarm.org/
3. USGS: Erdbeben als GeoJSON-Ereignisse für die Earth-Karte. https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
4. NOAA SWPC: Weltraumwetter, Sonnenwind und geomagnetische Aktivität, passend für ein LCARS-Space-Panel. https://www.swpc.noaa.gov/products-and-data
5. PEGELONLINE/LHP: deutsche Pegel und Hochwasserlage; kein Ersatz für Korneuburg/Österreich. Für Österreich bleibt Hydro NÖ die bestehende Quelle. https://www.hochwasserzentralen.de/fr/developers/api-docs-stable-swagger

Priorität als spätere Erweiterung: amtliche Warnungen und Luftqualität/Pollen; danach Erdbeben und Weltraumwetter. Keine weiteren Zugänge eingerichtet und keine kostenpflichtigen Dienste bestellt.
