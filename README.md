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
Build-Artefakt. Ein Tag passend zur Projektversion, z. B. `v0.5.1`, veröffentlicht
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
04 bleibt ohne Zuordnung. Eigene Links behalten die bestehende lokale Speicherung.
Favicons werden direkt von der jeweiligen HTTPS-Website geladen (ohne Referer);
dabei erhält diese Website die üblichen Verbindungsdaten. Fehlende Icons zeigen Initialen.

Das Setup enthält eine Deinstallation. Benutzerdaten bleiben bei Updates und
Deinstallation erhalten; ein vom Setup angelegter Autostart-Eintrag wird entfernt.
