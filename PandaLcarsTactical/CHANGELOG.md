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
