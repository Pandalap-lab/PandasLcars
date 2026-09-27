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

Settings öffnet persönliche Zugänge zu Google Fotos, Outlook Kalender und Facebook.
Die Anmeldung erfolgt im Browser, bevorzugt Firefox. Gespeichert werden nur die
ausgewählten Dienste, keine E-Mail-Adresse und kein Passwort.
Die Startseite zeigt den Einrichtungsstatus. **Eine externe Browseranmeldung kann
die App nicht verifizieren**; sie zeigt daher ausdrücklich „Status unbekannt“.
Das Entfernen einer Zuordnung meldet nicht aus dem Browser ab.

Eine integrierte OAuth-Kontoanbindung mit geprüftem Verbindungsstatus ist noch
nicht enthalten. Dafür sind eigene registrierte Google-/Microsoft-Anwendungen
und die jeweiligen Zustimmungen erforderlich. Es werden weder fremde Client-IDs
noch Umgehungen für eingebettete Anmeldungen verwendet.

## Build

GitHub Actions prüft Kernfunktionen und Zoom und erstellt Windows-x64-App,
Installer, portable ZIP und SHA-256-Prüfsummen. Push auf `main` erzeugt ein
Build-Artefakt. Ein Tag passend zur Projektversion, z. B. `v0.5.0`, veröffentlicht
nach erfolgreichem Build einen Release. Dafür ist kein persönlicher Token im
Quellcode nötig. Die Dateien sind derzeit **nicht Authenticode-signiert**.

Lokale Entwicklung: .NET 8 SDK und Windows, `dotnet publish
PandaLcarsTactical/PandaLcarsTactical.csproj -c Release -p:Platform=x64`.

Das originale LCARS-Referenzbild und die bisherigen Wetter-/Kartenfunktionen
bleiben erhalten. Weitere Bedienungsdetails stehen in
[der App-Dokumentation](PandaLcarsTactical/README.md).
