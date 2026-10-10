# PandasLcars 0.6.10

Dieses Update ergänzt Satellitenwolken, EUMETSAT-Blitzereignisse und GeoSphere-Saharastaub direkt auf der Karte.

- WOLKEN schaltet eine transparente EUMETSAT-Wolkenmaske ein. Bildzeit und Fehlerstatus werden angezeigt.
- BLITZE zeigt Satelliten-Blitzereignisse in der Earth-Ansicht. Persönliche EUMETSAT-Zugangsdaten werden unter SETTINGS ausschließlich mit Windows-Kontoverschlüsselung gespeichert. Der automatische Abruf mit echten Zugangsdaten wurde erfolgreich geprüft. Satellitenereignisse sind keine bestätigten Bodeneinschläge.
- SAHARASTAUB zeigt GeoSphere-Prognosen als braunen transparenten Dunst über Europa/Nordafrika. Legende, Modelllauf, Prognosezeit und Quelle erklären die Staubmasse der Luftsäule in mg/m². Dargestellt wird die aktuelle Prognosestunde.
- LAYER ON/OFF entfällt. Einzelne Ebenen bleiben separat schaltbar.
- Tactical-Target halbiert; der Stil bleibt erhalten. Beim Herauszoomen kehrt die Earth-Tag-/Nachtansicht automatisch zurück.
- GitHub-Sperren werden als Abrufpause angezeigt; wiederholte Update-Anfragen werden während dieser Pause unterdrückt. Ein bereits geprüftes Installationspaket wird wiederverwendet.
- Nach dem Setup wartet LCARS auf die bestätigte installierte Version, statt automatisch einen weiteren Installer zu starten. Norton-/SmartScreen-Prüfungen können weiterhin auftreten; eine externe Sicherheitsprüfung kann die App nicht aufheben.

## Prüfung

Erneute Kern-, Radar-, Wetter-, Zoom-, Earth- und Oberflächentests; UI-Kontrolle zusätzlich auf dem veröffentlichten App-Verzeichnis. Echte EUMETSAT-NetCDF-Dateien mit Prüfsummen, Token-Erneuerung, verschlüsselter lokaler Speicherung und de-AT-Datumsregression geprüft. GeoSphere-Abruf mit 66.000 Rasterwerten erfolgreich; Orientierung, Einheiten, fehlende Werte und Schalter geprüft. GitHub CI prüft Installation, Upgrade von 0.6.9, erneute Installation und Deinstallation sowie Erhalt persönlicher Einstellungen und Schlüsseldatei.

## Dateien

Für das Update PandasLcars-Setup.exe verwenden. Das ZIP ist die portable Ausgabe. SHA256SUMS.txt enthält die Prüfsummen. Persönliche Zugangsdaten sind nicht Bestandteil der Downloads.

GeoSphere-Stationswerte als alternative Wettertabellenquelle und frei auswählbare zukünftige Staub-Prognosezeiten sind noch nicht enthalten. Wolken und Blitze sind zeitverzögert; veraltete Daten werden ausgeblendet. Die Detailauflösung der Nachtkarte bleibt durch die Bildquelle begrenzt.
