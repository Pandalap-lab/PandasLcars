# Korrektur- und Abnahmeliste für 0.6.5

Auftrag und Sammelfreigabe: sämtliche untenstehenden Änderungen, lokale Tests, Windows-Build, GitHub-Upgradeprüfung und Veröffentlichung. Kein Abschalten von Norton, kein erzwungener Windows-Neustart.

## A. Wetter und Astronomie – freigegebenes Mockup
- [x] Wetterüberschrift unverändert oben; darunter links großes Symbol und Temperatur.
- [x] Zwei Datenzeilen: Wolken/Regen sowie Wind/Feuchte/Luftdruck. Messwerte unmittelbar neben Bezeichnungen.
- [x] Temperatur erhält intrinsische Breite und rechten Sicherheitsabstand. Zusätzliche Prüfung mit 18,8 °C, −28,8 °C und 100,0 °C: Einheit darf die Trennlinie nicht berühren.
- [x] Gemeinsame untere Bedienzeile: LAYER, ON, OFF, Aktualisieren, Einstellungen, RADAR, WOLKEN, NIEDERSCHLAG, TEMPERATUR, BLITZKARTE.
- [x] Einzeilige Bedienung bei 1280×720 automatisch geprüft. Unterhalb der Zielauflösung horizontal bedienbare Zeile statt Überlagerung.
- [x] Sonne/Mond rechts daneben; bündige Überschriften, Ortsdatum/-zeit, vier Ereignisse in zwei Zeilen, Zeiten neben den Namen, Datenstand unten.
- [x] Radar-Detailstatus in erreichbarem STATUS/QUELLEN-Dialog. Aktivierung/Statuswechsel dürfen die Kartenhöhe nicht ändern. Open-Meteo-Quelle bleibt sichtbar; RainViewer-Details und Link sind über den Dialog erreichbar.
- [x] Gewonnene Höhe an Karte; übrige Panelgrößen und LCARS-Design erhalten.

- [x] Feste Zeitspalten: Doppelpunkte der Sonnen-/Mondzeiten exakt untereinander. Schrift wieder PandaCondensed wie 0.6.4; Zeiten unmittelbar neben Bezeichnung mit mindestens 6 Pixel Abstand zur Zellentrennlinie, automatisch geprüft. Wochentag rechts ausgeschrieben, sowohl in Sonne/Mond als auch am Dashboard-Datum. Automatischer Spaltenvergleich in allen geprüften Auflösungen.

## B. Karten-Grafiken
- [x] Schwarze Rechtecke bei Target und ISS vermeiden: transparente PNG-Assets aus vorhandenen SVG-Vorlagen; positionsgebundene HTML-Bilder statt WebGL-Billboard-Texturen.
- [x] Target: cyanblaue segmentierte Kreise, Kreuzachsen, orangeweißer Mittelpunkt. Ursprünglicher Entwurf erhalten.
- [x] Ortslabel ohne Rechteck, Rahmen oder gefüllten Hintergrund; dezenter Schatten und cyanfarbene Verbindung bleiben.
- [x] ISS: kleines Stationssymbol mit Solarpaneelen; echte berechnete Position, Flugbahn, Datenstand und Alterprüfung erhalten.
- [x] ISS nur bei EARTH ON. Außer Sicht wird erklärt; ISS ANZEIGEN richtet Kamera auf tatsächliche Position. Keine erfundene Position auf der sichtbaren Seite.
- [x] Pixelprüfung beider PNGs: durchsichtige Ecken und ausreichend sichtbare Farbflächen.
- [x] Windows-Sichtprüfung bei 1280×720: Target in Karte und Erde ohne Rechteck, ISS über ISS ANZEIGEN mit sichtbaren Solarpaneelen, Kurier-Icon und Tabellen.

## C. Quicklaunch
- [x] Icon-Verweise im HTML auswerten, relative URLs auflösen, Redirects begrenzen, öffentliche HTTPS-Adressen prüfen.
- [x] Bildsignaturen prüfen; HTML-Fehlerseiten nicht als Icons übernehmen; Downloadgröße begrenzen.
- [x] Lokaler Cache pro Zieladresse, nach URL-Wechsel neue Ermittlung; veraltete Antworten dürfen neue Links nicht überschreiben.
- [x] Neutraler Platzhalter bei fehlendem Bild; bestehende Standard-Icons erhalten.
- [x] kurier.at: reales rotes K-Icon gefunden, heruntergeladen, nach Service-Neustart aus Cache wiederhergestellt und in Windows-App gesehen.
- [x] QUICK LAUNCH: orangefarbener Balken exakt so hoch wie TARGETS; Einstellungsbutton erhöht ihn nicht mehr. Automatischer Höhenvergleich ergänzt.

## D. Doppelte Prüfung und Release
- [x] Erster Durchlauf gegen Quell-Assets: Funktions-, Pixel-, Temperatur-, Abstands-, Einzeiligkeits- und Größenprüfungen.
- [x] Zweiter Durchlauf gegen veröffentlichbare Dateien in artifacts/v065/Assets erfolgreich.
- [x] CI muss diese zweite Prüfung unmittelbar nach dotnet publish ausführen; bei Fehler keine Veröffentlichung. Screenshots auch bei Erfolg aufbewahren.
- [ ] GitHub: Upgrade von 0.6.4, erneute Installation, Deinstallation, eigene Links und Monitor-Einstellungen erhalten.
- [ ] Echten UpdateClient gegen öffentliche 0.6.5 testen, Installer herunterladen und SHA-256 prüfen.
- [ ] Release veröffentlichen und installierbaren Download bereitstellen. Die vorhandene Installation nicht ungefragt ersetzen.

Gerätegrenzen: Die Sichtprüfung startet einen lokalen Build ohne Installer. Ein späterer echter Windows-Kaltstart sowie Nortons Verhalten beim neuen Setup müssen am Gerät bestätigt werden. Automatische Tests sind dafür kein Ersatz.
