# 0.5.0 – PandasLcars / GitHub-Build

- Produktname, Windows-EXE und Startseite: PandasLcars.
- Persönliche Dienste in Settings: Google Fotos, Outlook Kalender, Facebook.
- Browseranmeldung mit Firefox bevorzugt; lokale Dienst-Auswahl ohne persönliche Kontodaten.
- Startseite zeigt Einrichtung und ausdrücklich unbekannten externen Anmeldestatus.
- GitHub Actions baut x64-App, Installer und portable ZIP; Releases über Versions-Tags.
- Keine integrierte OAuth-Verbindung oder automatische Prüfung externer Browser-Sitzungen.
- Weitere Punkte der bisherigen Update-Planung sind noch offen.

# Änderungen

## 0.4.0 — 27.09.2026

- Auf dem vollständigen Quellprojekt 0.3.1 aufgebaut. LCARS-Layout, U.S.S.-Panda-Raumschiff, Kartenquellen und Wetterdarstellung erhalten.
- Sanfter Mausradzoom: etwa 4,7–4,9 % pro normalisiertem Schritt, weicher Übergang, begrenzte schnelle Eingabefolgen, Höhenbereich 500 m bis 35.000 km. Zoomtasten ebenfalls sanfter. Ziehen und Touch-Pinch bleiben verfügbar.
- Echte Quicklaunch-Kacheln: Kronen Zeitung, DER STANDARD, Heute, Facebook, OE24. Vier Spalten, zwei sichtbare Reihen, weitere Einträge scrollbar.
- „+ WEITERE“ für Name und URL; Verwaltung eigener Links über das Zahnrad. Lokale JSON-Speicherung mit atomarem Dateiaustausch, Eingabevalidierung und sichtbaren Speicherfehlern.
- Tactical-Webansicht innerhalb des Hauptfensters, Zurück, Laden und deutliches Schließen zur Hauptansicht. Eigenes Browserprofil, keine Dashboard-Nachrichtenbrücke für fremde Webseiten.
- Austauschbare Browser-Schnittstelle mit WebView2-Implementierung. Optionale Übergabe an lokal installiertes Firefox. Entscheidung in docs/BROWSER.md.
- Neues freigegebenes Panda-Icon mit Spitzohren und orangefarbenem Ring, ohne Hände/Finger. EXE, Haupt- und Blitzfenster verwenden dasselbe Icon, Größen 16–256 Pixel.
- WORK / STANDBY / WARP neben dem unveränderten Raumschiffbild, Zeitstempel, Auslastung, Inaktivitätsdauer und sanfte Statusanimation. Kein Übertakten oder Verändern der Windows-Energieeinstellungen.
- Regressionstests für Wetter, Radar und Systemwerte sowie neue Tests für Links, Status, Zoom und responsive Quicklaunch-Darstellung.

## 0.3.1

- Kartenquellen ohne grauen Hintergrundbalken; Ortsziele werden gesammelt und lokal gespeichert.

## Nächster möglicher Ausbau

Einmalige Installation und danach Aktualisierung am selben Ort. Ein späterer Update-Dialog benötigt einen festen Veröffentlichungskanal, nachvollziehbare Herausgeber-/Integritätsprüfung und eine Rückfallversion. Version 0.4.0 enthält noch keinen automatischen Updater.
