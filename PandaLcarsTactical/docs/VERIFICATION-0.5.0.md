# Prüfung 0.5.0 – PandasLcars

## Lokal geprüft

- C#-Prüfungen für Wetter, Radar, Windows-Messwerte, Quicklaunch, Aktivitätsmodi und die neue Dienst-Auswahl bestanden.
- Dienste-Auswahl bleibt nach erneutem Laden erhalten; Entfernen wird gespeichert; unbekannte Dienst-IDs werden abgelehnt; beschädigte Dateien bleiben erhalten.
- Edge-Oberflächentests: Settings öffnen, Browserzugang anfordern, wahrheitsgemäßer Status, Zuordnung entfernen und zurück; bisherige Quicklaunch-/Zoom-/Layout-Prüfungen bestanden.
- Die auf GitHub erzeugte x64-App wurde heruntergeladen und tatsächlich unter Windows gestartet. Paket-Prüfsummen stimmen mit dem Build überein.
- Produktname und Icon sichtbar, Wetterdaten und Weltkugel funktionieren. Settings über 09 erreichbar; alle drei Dienste sichtbar. Google Fotos startet in Firefox und die lokale Anzeige aktualisiert sich. Rückkehr zur Hauptansicht geprüft.

## Grenzen

- Die Dienste verwenden den externen Browser. Eine echte OAuth-Verbindung, Tokenverwaltung und bestätigter Kontostatus sind nicht implementiert. Dazu fehlen eigene Google-/Microsoft-Appregistrierungen.
- Der Installer wird auf GitHub kompiliert. Eine Installation/Deinstallation auf dem Benutzer-PC wurde nicht ausgeführt. Die getestete App wurde aus der portablen ZIP gestartet.
- Das Setup ist nicht Authenticode-signiert. WebView2 Runtime ist weiterhin Voraussetzung.
- Weitere bisher geplante Funktionen stehen in der Roadmap; diese Version behauptet nicht, sie bereits umzusetzen.
