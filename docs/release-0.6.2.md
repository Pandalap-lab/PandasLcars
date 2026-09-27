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
