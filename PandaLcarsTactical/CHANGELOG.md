# PandasLcars 0.6.2

Alle freigegebenen Änderungen aus dem lokalen 0.6.1-Teststand einschließlich der letzten Korrekturen sind enthalten. 0.6.1 wurde nicht öffentlich veröffentlicht.

- Schmale Kopfzeile „PANDAs LCARS“ mit kleinerem „TACTICAL“, angepasste WEB/FIREFOX- und COMMUNICATION/CALENDAR-Beschriftung, BACK in der Webansicht.
- Navigation und Wetter mit gleichen orangen Kopfzeilen; Targets und Quick Launch bündig zu Karte bzw. Wetter. US-Panda-Bild bleibt erhalten.
- EARTH ON/OFF startet oder stoppt die langsame Drehung. Die Einstellung bleibt gespeichert. Manuelle Bedienung pausiert die Drehung 15 Sekunden; Zielansicht dreht nicht.
- Aktuelle Tag-/Nachtbeleuchtung; statische NASA-Stadtlichter auf der Nachtseite. Kompakter Zielmarker mit roten/blauen Ringen.
- Sonnen- und Mondauf-/untergang für Ort, Datum und Ortszeitzone. Berechnung für freien Horizont auf Meereshöhe; fehlende Ereignisse erscheinen als Gedankenstrich.
- Radar, Wolken, Niederschlag, Temperatur und Wetter ON/OFF bleiben dauerhaft erreichbar; LAYERS blendet sie nicht mehr aus.
- Firefox, Explorer und Windows-Einstellungen werden nach dem Öffnen zum oberen Monitor verschoben; ohne oberen Monitor zum Hauptmonitor. LightningMaps öffnet ein kleines Firefox-Fenster auf dem LCARS-Bildschirm. Persönliche Firefox-Fenster werden nicht geschlossen.

## Installation / Update

In der App „Updates suchen“, anschließend „77852 · Update laden“ wählen. Alternativ PandasLcars-Setup.exe herunterladen und installieren. Eine vorherige Deinstallation ist nicht nötig. Bestehender Installationsordner, eigene Links und Einstellungen bleiben erhalten.

Installer und portable ZIP werden von GitHub Actions gebaut. SHA256SUMS.txt enthält die Prüfsummen. Das Setup bleibt unsigniert; eine Freigabe durch Norton oder Smart App Control kann nicht garantiert werden. Schutzfunktionen müssen für dieses Update nicht deaktiviert werden.

## Prüfung und Grenzen

Automatische Prüfungen: Wetter-/Astronomie-Berechnung einschließlich Sommerzeit, Zoom, EARTH-Schalter, Statuswechsel, Quicklaunch-Verwaltung, sichtbare Wettertasten und Layout einschließlich 1280 × 720. Der Windows-Workflow prüft Installation, Aktualisierung und Deinstallation mit Erhalt von Test-Benutzerdaten.

Der tatsächliche Windows-Neustart/Autostart, Norton sowie die endgültige Position und Darstellung externer Firefox-Fenster auf dem persönlichen Mehrmonitor-Gerät sind nicht vollständig automatisch geprüft. Die Computersteuerung konnte die Firefox-Prüfung wegen einer nicht unterstützten Browser-Sicherheitsprüfung nicht abschließen.


# 0.6.0 – Monitorstart und Bedienung

- 04 WEB öffnet Firefox; 07 OUTLOOK ersetzt CALENDAR bei unverändertem Kalenderlink.
- Quicklaunch-Icons auf 16 × 16 Pixel begrenzt; Installationstest für entfernten Autostart-Eintrag korrigiert.
- Persistente Bildschirmwahl, Vollbild, Windows-Autostart, Hauptmonitor-Fallback.
- Updateprüfung und geprüfter Installer-Download über vorhandene obere Tasten.
- LCARS-Navigation mit Kompass wiederhergestellt; Menüaktionen angebunden.
- Quicklaunch-Favicons, NCC-080470, OSM-Appkennung/Referer ergänzt.
- Dateispeicherung bei vorübergehenden Dateisperren stabilisiert.
- Wetter, Weltkugel, US-Panda-Bild und Spock-Panda-Appsymbol erhalten.
- Kontoverknüpfung auf Nutzerwunsch verworfen: Dienste als Browserlinks ohne Kontostatus und ohne Client-IDs.
# 0.5.1 – Veröffentlichung

- Grafik- und Größenänderungstests für virtuelle Windows-Buildrechner stabilisiert.
- 0.5.0 wurde nicht als Download veröffentlicht; 0.5.1 enthält denselben Funktionsumfang.

# 0.5.0 â€“ PandasLcars / GitHub-Build

- Produktname, Windows-EXE und Startseite: PandasLcars.
- PersÃ¶nliche Dienste in Settings: Google Fotos, Outlook Kalender, Facebook.
- Browseranmeldung mit Firefox bevorzugt; lokale Dienst-Auswahl ohne persÃ¶nliche Kontodaten.
- Startseite zeigt Einrichtung und ausdrÃ¼cklich unbekannten externen Anmeldestatus.
- GitHub Actions baut x64-App, Installer und portable ZIP; Releases Ã¼ber Versions-Tags.
- Keine integrierte OAuth-Verbindung oder automatische PrÃ¼fung externer Browser-Sitzungen.
- Weitere Punkte der bisherigen Update-Planung sind noch offen.

# Ã„nderungen

## 0.4.0 â€” 27.09.2026

- Auf dem vollstÃ¤ndigen Quellprojekt 0.3.1 aufgebaut. LCARS-Layout, U.S.S.-Panda-Raumschiff, Kartenquellen und Wetterdarstellung erhalten.
- Sanfter Mausradzoom: etwa 4,7â€“4,9 % pro normalisiertem Schritt, weicher Ãœbergang, begrenzte schnelle Eingabefolgen, HÃ¶henbereich 500 m bis 35.000 km. Zoomtasten ebenfalls sanfter. Ziehen und Touch-Pinch bleiben verfÃ¼gbar.
- Echte Quicklaunch-Kacheln: Kronen Zeitung, DER STANDARD, Heute, Facebook, OE24. Vier Spalten, zwei sichtbare Reihen, weitere EintrÃ¤ge scrollbar.
- â€ž+ WEITEREâ€œ fÃ¼r Name und URL; Verwaltung eigener Links Ã¼ber das Zahnrad. Lokale JSON-Speicherung mit atomarem Dateiaustausch, Eingabevalidierung und sichtbaren Speicherfehlern.
- Tactical-Webansicht innerhalb des Hauptfensters, ZurÃ¼ck, Laden und deutliches SchlieÃŸen zur Hauptansicht. Eigenes Browserprofil, keine Dashboard-NachrichtenbrÃ¼cke fÃ¼r fremde Webseiten.
- Austauschbare Browser-Schnittstelle mit WebView2-Implementierung. Optionale Ãœbergabe an lokal installiertes Firefox. Entscheidung in docs/BROWSER.md.
- Neues freigegebenes Panda-Icon mit Spitzohren und orangefarbenem Ring, ohne HÃ¤nde/Finger. EXE, Haupt- und Blitzfenster verwenden dasselbe Icon, GrÃ¶ÃŸen 16â€“256 Pixel.
- WORK / STANDBY / WARP neben dem unverÃ¤nderten Raumschiffbild, Zeitstempel, Auslastung, InaktivitÃ¤tsdauer und sanfte Statusanimation. Kein Ãœbertakten oder VerÃ¤ndern der Windows-Energieeinstellungen.
- Regressionstests fÃ¼r Wetter, Radar und Systemwerte sowie neue Tests fÃ¼r Links, Status, Zoom und responsive Quicklaunch-Darstellung.

## 0.3.1

- Kartenquellen ohne grauen Hintergrundbalken; Ortsziele werden gesammelt und lokal gespeichert.

## NÃ¤chster mÃ¶glicher Ausbau

Einmalige Installation und danach Aktualisierung am selben Ort. Ein spÃ¤terer Update-Dialog benÃ¶tigt einen festen VerÃ¶ffentlichungskanal, nachvollziehbare Herausgeber-/IntegritÃ¤tsprÃ¼fung und eine RÃ¼ckfallversion. Version 0.4.0 enthÃ¤lt noch keinen automatischen Updater.
