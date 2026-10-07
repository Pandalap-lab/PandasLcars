# PandasLcars

LCARS Tactical Dashboard für Windows x64, C# / WinUI 3 / WebView2.

## Downloads

Veröffentlichte Versionen: https://github.com/Pandalap-lab/PandasLcars/releases

`PandasLcars-Setup.exe` installiert die Anwendung für den aktuellen Windows-Benutzer.
Spätere Installer aktualisieren denselben Ordner. Persönliche Daten bleiben unter
`%LOCALAPPDATA%\PandaLcarsTactical` erhalten. Die portable ZIP ist optional.
Microsoft Edge WebView2 Runtime wird benötigt. Falls sie fehlt, die offizielle
Runtime installieren: https://developer.microsoft.com/microsoft-edge/webview2/

## Persönliche Dienste

Settings bietet Browserlinks zu Google Fotos, Outlook-Kalender und Facebook. Die Dienste öffnen sich bevorzugt in Firefox und verwenden die dort vorhandene Anmeldung. PandasLcars zeigt keinen Kontostatus und benötigt keine OAuth-Appregistrierungen oder Client-IDs. Kontoverknüpfungen sind auf Nutzerwunsch entfallen.

## Build

GitHub Actions prüft Kernfunktionen und Zoom und erstellt Windows-x64-App,
Installer, portable ZIP und SHA-256-Prüfsummen. Push auf `main` erzeugt ein
Build-Artefakt. Ein Tag passend zur Projektversion, z. B. `v0.6.2`, veröffentlicht
nach erfolgreichem Build einen Release. Dafür ist kein persönlicher Token im
Quellcode nötig. Die Dateien sind derzeit **nicht Authenticode-signiert**.

Lokale Entwicklung: .NET 8 SDK und Windows, `dotnet publish
PandaLcarsTactical/PandaLcarsTactical.csproj -c Release -p:Platform=x64`.

Das originale LCARS-Referenzbild und die bisherigen Wetter-/Kartenfunktionen
bleiben erhalten. Weitere Bedienungsdetails stehen in
[der App-Dokumentation](PandaLcarsTactical/README.md).

## Version 0.6.0: Bedienung und Start

Unter Settings können Startbildschirm, Vollbild und Windows-Autostart gewählt werden.
Die Liste zeigt die Reihenfolge der angeschlossenen Bildschirme sowie Windows' interne
DISPLAY-Kennung. Diese kann von der Zahl in Windows' „Identifizieren“ abweichen.
Standard ist der dritte angeschlossene Bildschirm; nach der ersten Auswahl wird
seine Gerätekennung gespeichert. Ohne diesen Monitor erfolgt der Start auf dem
Hauptmonitor. Für langsam verfügbare externe Monitore wird beim Start 60 Sekunden gewartet.

Die obere blaue Taste sucht Updates, die Taste 77852 lädt das verfügbare Update.
Die App prüft beim Start die aktuelle öffentliche GitHub-Veröffentlichung. Downloads
werden mit deren SHA-256-Prüfsumme verglichen. Das schützt vor Übertragungsfehlern,
ersetzt aber keine digitale Herausgeber-Signatur. Installation erfolgt erst nach
Bestätigung; das Setup kann von Windows oder Virenschutz blockiert werden.

Navigation: 02 Windows-Einstellungen, 03 Google Maps im Tactical-Browser, 05 Explorer,
06 Google Fotos und 07 Outlook-Kalender im persönlichen Browser, 08 Desktop,
09 App-Settings, 10 Neustart/Herunterfahren mit Bestätigung. Es werden keine
persönlichen E-Mail-Adressen vorgegeben; der Browser verwendet das angemeldete Konto.
04 WEB öffnet Firefox. Eigene Links behalten die bestehende lokale Speicherung.
Favicons werden direkt von der jeweiligen HTTPS-Website geladen (ohne Referer);
dabei erhält diese Website die üblichen Verbindungsdaten. Fehlende Icons zeigen Initialen.

Das Setup enthält eine Deinstallation. Benutzerdaten bleiben bei Updates und
Deinstallation erhalten; ein vom Setup angelegter Autostart-Eintrag wird entfernt.

### Drittanbieter im Update 0.6.2
- Oswald-Schrift: Copyright 2016 The Oswald Project Authors, SIL Open Font License 1.1; vollständige Lizenz unter Assets/Web/fonts/OFL.txt.
- NASA Earth Observatory / Black Marble 2016: statisches Nachtlichtmosaik, kein Livebild. https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
- Astronomy Engine 2.1.19: Copyright (c) 2019-2022 Don Cross, MIT-Lizenz. https://github.com/cosinekitty/astronomy

Astronomy Engine MIT License:
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Aktuell: 0.6.2

Änderungen, Bedienung und Prüfgrenzen: [Update 0.6.2](docs/release-0.6.2.md).

## Aktuell: 0.6.3

Wettertabellen, NETZ-Diagramm und ARGOS ATLAS: [Änderungen und Prüfgrenzen](docs/release-0.6.3.md). Update über die vorhandenen App-Tasten. Eigene Links und Bildschirmwahl bleiben erhalten.

## Update 0.6.4

Größere Tactical-Karte, kompakte Wetter-/Astronomieansicht nebeneinander, LAYERS-Auswahl, ISS-Symbol mit berechneter Bahn nur bei EARTH ON, aktualisierte Quicklaunch-Icons und verbesserte Installer-Warte-/Fehleranzeige. Details und Prüfgrenzen: [Release 0.6.4](docs/release-0.6.4.md).

## Update 0.6.5

Kompakte Wetteransicht, ausgerichtete Sonne-/Mondzeiten, ausgeschriebener Wochentag, transparente Target-/ISS-Symbole, ISS ANZEIGEN, Website-Icons und gleich hohe Quicklaunch-/Targets-Balken. [Änderungen und Prüfungen](docs/release-0.6.5.md).

## Update 0.6.6

Internetprüfung beim Start und automatische Wiederherstellung der Online-Bereiche; abgesicherte Earth-/Radar-Beleuchtung mit Pixeltests. [Details und Prüfgrenzen](docs/release-0.6.6.md).
