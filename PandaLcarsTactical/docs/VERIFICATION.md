# Prüfung Version 0.4.0 — 27.09.2026

## Automatisierte Prüfungen

- Windows-x64-Release mit lokalem .NET SDK 8.0.425 und unveränderten Windows-App-SDK-Paketversionen gebaut. Version von EXE/Assembly: 0.4.0.0.
- 41 C#-Prüfungen bestanden: vorhandene Wetter-, Zeitstempel-, Radar- und Windows-Systemtests; fünf Standardlinks; zwölf Links über erneutes Laden der tatsächlichen JSON-Datei; Bearbeiten/Löschen und erneutes Laden; Ablehnung ungültiger URLs; Schutz der Standardlinks und beschädigter Dateien; WORK/STANDBY/WARP, Zeitstempel und Schalthysterese.
- Zoomtest bestanden: Höhenlimits, gleichmäßige Annäherung, Pixel-/Zeilen-/Seiten-Mausradnormalisierung, weniger als fünf Prozent Änderung pro normalisiertem Schritt und Begrenzung schneller Eingabefolgen.
- Edge/Playwright-Oberflächentest mit echtem lokalem Cesium und simulierter Hostbrücke bestanden: acht sichtbare Kacheln aus zwölf Links, Scrollen und Öffnen des letzten Links, Hinzufügen/Bearbeiten/Löschen über Dialoge, alle drei Statusdarstellungen, tatsächliche Cesium-Höhenänderung unter fünf Prozent je Mausradschritt, keine JavaScript-Laufzeitfehler.
- Layout bei 950×590, 1200×740, 1500×940 und 1920×1080 geprüft. Kompaktes Touchlayout überlappt die Fußleiste nicht. Kleine Touchflächen verwenden eine statt zwei Linkreihen, weiterhin höchstens acht sichtbare Links.

## Laufende Windows-App

- App startet und zeigt das erhaltene LCARS-Layout sowie das ursprüngliche U.S.S.-Panda-Raumschiff.
- Neues freigegebenes Panda-Spitzohren-Icon in Fensterleiste und Windows-Taskleiste gesehen.
- Aktuelle Wetterwerte für Wien, Dreitagesvorhersage und wechselnde Windows-Systemwerte sichtbar. Bestehende gespeicherte Ortsziele aus der vorherigen Version werden weiterhin angezeigt.
- Kronen Zeitung, DER STANDARD, Heute, Facebook und OE24 innerhalb der nativen Tactical-Webansicht geöffnet. Die jeweiligen Originalseiten bzw. Cookie-/Anmeldeseiten wurden geladen. Keine Anmeldung oder Kaufhandlung durch die Prüfung.
- Schließen zur Hauptansicht mehrfach geprüft; Karte und Wetteransicht bleiben erhalten.
- „In Firefox öffnen“ mit OE24 erfolgreich: separates Firefox-Fenster bzw. neuer Tab mit OE24-Titel sichtbar.
- Automatische WORK/WARP-Wechsel und Zeitstempel in der laufenden App gesehen. STANDBY und manuelles WARP wurden in Logik- und Oberflächentests geprüft; kein ungestörter dreiminütiger Leerlauftest, da der Benutzer den Rechner während der Prüfung benutzt hat.

## Grenzen

Die Dateipersistenz wurde mit dem tatsächlichen C#-LinkStore einschließlich erneutem Laden geprüft; der automatisierte Dialogtest verwendet eine simulierte native Brücke. Langzeitsitzungen mit angemeldetem Facebook, Abos, Popup-Authentifizierung, Downloads, Touch-Hardware und andere PCs sind nicht vollständig getestet. Die Firefox-Option steht für solche Website-Sonderfälle bereit. Die bisherige Wetter-/Radarlogik und die Originalgrafik wurden nicht verändert. Live-Radar und Blitzfenster aus 0.3.1 wurden in diesem Durchlauf nicht erneut vollständig bedient; die vorhandenen Radarprüfungen wurden ausgeführt.

Kein automatischer Updater in 0.4.0. Die EXE benötigt die mitgelieferten Dateien im selben Ordner. WebView2 Runtime muss auf dem Zielrechner vorhanden sein.
