# PandasLcars 0.6.10

EUMETSAT-Wolken und Blitze, GeoSphere-Saharastaub als Kartenoverlay, kleinere Targets und automatische Earth-Rückkehr beim Herauszoomen. Wetterebenen dauerhaft verfügbar; GitHub-Abrufpausen und Installationsbestätigung verbessert. Details und Grenzen: docs/release-0.6.10.md.

# PandasLcars 0.6.9

Detailliertes transparentes Tactical-Target und NASA-Nachtkacheln beim Zoomen. Geprüfte Update-Downloads werden wiederverwendet; Installationsprotokoll ergänzt. Nachtauflösung und Norton-Abnahme bleiben ausdrücklich begrenzt/offen. Details: docs/release-0.6.9.md.

# PandasLcars 0.6.8

Kompakte Browserleiste: eine Zeile, rund 36 Pixel Höhe, kleine Navigationstasten, sichtbare Adresse und direkte Rückkehr zu LCARS. Normale Statusmeldungen ohne zusätzliche Zeile; Fehlerhinweise bleiben sichtbar. Native Ansicht und Rückkehr geprüft. Details: docs/release-0.6.8.md.

# PandasLcars 0.6.7

Originale Hydro-NÖ-Pegelgrafik Donau/Korneuburg ersetzt Quick Launch; gespeicherte Links bleiben unter SETTINGS. Automatischer Abruf alle zehn Minuten, Fehlerstatus und anklickbare Originalquelle. Punkt 04 öffnet pandanuovo.com im Vollbild; Zurück zu LCARS stellt den vorherigen Fenstermodus wieder her. Siehe docs/release-0.6.7.md für Prüfungen und Grenzen.

# PandasLcars 0.6.6

Die neuen LCARS-Aufgaben vom 07.10.2026 aus Notion sind umgesetzt, ohne PANDAsPrivatKI.

- Internetstatus beim Start: aktive WLAN-/Netzwerkschnittstelle und tatsächliche Erreichbarkeit getrennt prüfen. Ein angemeldetes WLAN oder eine Anmeldeseite allein gilt nicht als funktionierendes Internet. Anzeige INTERNET OFFLINE / INTERNET VERBUNDEN.
- Automatisch erneut prüfen: zunächst alle 10 Sekunden, nach sechs fehlgeschlagenen Prüfungen alle 30 Sekunden; bei bestehender Verbindung alle 30 Sekunden. Browser-Netzwerkereignisse können eine Prüfung anstoßen. Keine überlappenden Prüfungen, begrenzte Laufzeit, Abbruch beim Schließen.
- Nach Wiederverbindung werden Wetter/Vorhersage einschließlich Sonne/Mond, aktive Radaransicht, fehlgeschlagene Detailkarten, fehlende Quicklaunch-Icons, ISS-Daten in EARTH ON, Updateprüfung und eine zuvor fehlgeschlagene Tactical-Web-Navigation erneut geladen. Kameraposition, Ziel und Einstellungen bleiben erhalten. Ein einzelner Wetterdienst-Ausfall überschreibt den Internetstatus nicht.
- Tag/Nacht: Sonnenlicht ausdrücklich festgelegt; der Beleuchtungszustand folgt ausschließlich dem Earth-Modus. Der Radar-Layer hat ausdrücklich denselben Alpha-Faktor auf Tages- und Nachtseite. Nachttextur bleibt auf die Nachtseite beschränkt. Ein-/Ausschalten von Radar verändert weder Uhrzeit noch Earth-Modus.

## Nachweise und Grenzen

Die gemeldete vollständige Verdunkelung durch Radar ließ sich im kontrollierten Vergleich nicht reproduzieren. Der Beleuchtungszustand ist jetzt ausdrücklich abgesichert. Ein neuer Bildtest prüft tatsächliche gerenderte Pixel mit einer Original-RainViewer-Kachel: Tagesseite bleibt hell, gegenüberliegende Nachtseite bleibt dunkel. Dieser Test läuft auch gegen die fertigen Build-Dateien. Die Erde kann je nach Kamerarichtung überwiegend ihre Nachtseite zeigen.

Die neuen Netzwerktests simulieren Offline-Start, verbundenes WLAN ohne Internet, Anmeldeseite, Wiederverbindung, Ausfall eines Prüfservers, erneuten Verbindungsverlust und Abbruch. Windows-WLAN und Norton wurden dafür nicht abgeschaltet. Die Prüfung nutzt https://www.msftconnecttest.com/connecttest.txt, bei Bedarf den bereits verwendeten öffentlichen RainViewer-Endpunkt. Es werden keine persönlichen Daten in den Prüfanfragen übertragen.

Vor Veröffentlichung: Kern- und Oberflächentests, zweiter Durchlauf gegen veröffentlichbare Assets, Installer-/Upgrade-Test aus 0.6.5, Datenerhalt und Deinstallation. Die echte WLAN-Verzögerung beim nächsten Windows-Start bleibt ein Gerätetest; externe Dienste können unabhängig vom Internetzugang ausfallen.

## Installation

Über „Updates suchen“ → „Update laden“ oder PandasLcars-Setup.exe. Keine vorherige Deinstallation nötig. Bei Norton-Prüfung warten und kein zweites Setup starten. Die vorhandene Installation wird nicht automatisch durch den lokalen Testbuild ersetzt.

# PandasLcars 0.6.5

Dieses Update korrigiert die in 0.6.4 gemeldeten Darstellungsfehler und gleicht Wetter und Sonne/Mond an die freigegebene kompakte Anordnung an.

- Wetter: großes Symbol und Temperatur links, zwei Datenzeilen, alle Layer-Tasten gemeinsam darunter. Die Einheit °C hat Abstand zur Trennlinie, auch bei negativen und dreistelligen Werten. Radar-Details sind über STATUS / QUELLEN erreichbar und verändern die Kartenhöhe nicht.
- Sonne/Mond: rechts neben Wetter, feste Zeitspalten mit senkrecht ausgerichteten Pfeilen und Doppelpunkten. Vollständiger Wochentag rechts in der Überschrift; auch das Datum rechts oben im Dashboard verwendet den ausgeschriebenen Wochentag.
- Target und ISS: transparente PNG-Symbole werden als positionsgebundene HTML-Bilder über der Karte dargestellt. Der fehlerhafte WebGL-Bildpfad entfällt. Wien hat ein transparentes Ortslabel mit Verbindungslinie.
- ISS ANZEIGEN richtet die Kamera auf die berechnete Stationsposition. Ist die ISS auf der anderen Erdseite, erklärt der Status dies. Solarpaneele, Bahn und Sichtbarkeit wurden im lokalen Windows-Build geprüft. Die Position ist aus Bahndaten berechnet, keine direkte Live-Telemetrie. Darstellung nur bei EARTH ON.
- Quicklaunch: tatsächliche Icon-Verweise der Website auslesen, relative Adressen auflösen, Bildinhalt prüfen und lokal zwischenspeichern. Nach einer URL-Änderung wird das neue Icon geladen. Das rote kurier.at-Icon wurde mit der echten Website und nach Cache-Neustart geprüft. Vorhandene Standard-Icons bleiben erhalten.
- QUICK LAUNCH und TARGETS haben gleich hohe orangefarbene Überschriften; die Einstellungstaste vergrößert den Balken nicht mehr.

## Prüfung

Kern-, Zoom-, Rotations- und Oberflächentests. Die Oberfläche wird zweimal geprüft: zunächst anhand der Quellen, dann anhand der tatsächlich veröffentlichten Build-Dateien. Prüfungen umfassen transparente Bildpixel, ISS-Bewegung/Ein-Aus, URL-/Icon-Wechsel, Temperaturabstand, senkrechte Zeitspalten und Panelgrößen bei 950, 1200, 1280 und 1920 Pixel Breite. Zusätzlich Sichtprüfung der lokal gebauten Windows-App auf dem rechten 1280×720-Display: Target auf Karte und Erde, sichtbare ISS mit Solarpaneelen, kurier.at-Icon und Tabellen.

Vor Veröffentlichung muss GitHub Installation, Upgrade von 0.6.4, Wiederholungsinstallation und Deinstallation mit Erhalt der Einstellungen und eigenen Links bestehen. Screenshots werden als Build-Artefakt aufbewahrt. Eine fehlgeschlagene Prüfung verhindert die Veröffentlichung.

## Update installieren

In der bisherigen App „Updates suchen“ und anschließend „77852 · Update laden“ verwenden oder PandasLcars-Setup.exe herunterladen. Keine vorherige Deinstallation nötig. Während Norton prüft, warten und kein zweites Setup starten. Norton bleibt aktiv. Der Installer ist weiterhin unsigniert; dessen Prüfung auf dem Laptop und ein echter Windows-Kaltstart sind durch die automatischen Tests nicht abgedeckt.


# PandasLcars 0.6.4

Die Kartenfläche wird höher, weil Wetter und Sonne/Mond jetzt nebeneinander stehen. Das bestehende LCARS-Design bleibt erhalten.

- Wetterwerte und Ereigniszeiten stehen direkt neben ihren Bezeichnungen. Sonne/Mond liegt rechts von Wetter. Die Karte erhält bei 1280 × 720 rund 90 zusätzliche Pixel Höhe gegenüber 0.6.3.
- Höhenanzeige links, ohne die Kartentasten zu verdecken. LAYERS öffnet eine eigene bedienbare Auswahl mit BACK.
- Kleines ISS-Icon mit Solarpaneelen und berechneter Position. Bahn: zurückliegende 45 Minuten durchgezogen, kommende 90 Minuten gestrichelt. Nur bei EARTH ON; bei OFF werden Darstellung und neue Abrufe pausiert. Kein Video oder Foto.
- ISS-Daten von CelesTrak, lokale SGP4-Berechnung mit satellite.js 6.0.1 (MIT). Abrufe höchstens alle zwei Stunden bei Erfolg, Cache auch über App-Neustarts. Daten älter als zwei Tage werden markiert, älter als sieben Tage ausgeblendet. Verfügbarkeit der externen Quelle ist nicht garantiert; keine direkte Live-Telemetrie.
- Quicklaunch lädt das Website-Icon anhand der aktuellen Zieladresse neu, auch nach Bearbeitung. Mehrere übliche Icon-Adressen werden versucht, sonst neutraler Platzhalter. Keine fremde Icon-Suchmaschine; URL-Inhalte werden nicht an einen solchen Dienst geschickt.
- Update-Wartehinweis bereits beim Download. Update-Tasten bleiben bis zum Ende des Installeraufrufs gesperrt. Bei Abbruch bleibt ein Hinweis mit erneutem Versuch. Ein Zugriff-verweigert-Fehler wird nicht automatisch Norton zugeschrieben. Schutz bleibt eingeschaltet.
- Einstellungen, eigene Links, vorhandenes Spitzohren-Appicon und Monitorzuordnung werden beibehalten.

## Installation

In der bisherigen App „Updates suchen“ und „77852 · Update laden“ verwenden oder PandasLcars-Setup.exe laden. Keine Deinstallation nötig. Während einer Norton-Prüfung warten und kein zweites Setup starten. Die verbesserte Update-Steuerung ist Bestandteil von 0.6.4 und greift beim nächsten Update aus dieser Version; der Übergang aus 0.6.3 verwendet noch deren bisherige Steuerung.

## Prüfung und Grenzen

Kern-, Zoom-, Erdrotation- und Edge-Oberflächentests einschließlich 1280 × 720, LAYERS-Bedienung, URL-/Icon-Wechsel, ISS-Bewegung, OFF-Ausblendung und veralteten Daten. GitHub prüft Installation, Upgrade von 0.6.3, Wiederholungsinstallation und Deinstallation mit Erhalt der Test-Einstellungen und eigenen Links. Installer und portable Version werden mit SHA-256-Prüfsummen veröffentlicht.

Auf dem Nutzergerät wurden die installierte Version 0.6.3, LCARS-Autostarteintrag und gespeicherte Vollbild-/Monitor-Einstellung gelesen; die drei Displays einschließlich des rechten 1280 × 720-Geräts wurden erkannt. Ein echter Windows-Kaltstart und Nortons Verhalten mit dem neuen Installer bleiben Geräteprüfungen. Die neue Version wird nicht ungefragt über die laufende App installiert. Der Installer bleibt unsigniert.


# PandasLcars 0.6.3

Das Update setzt das Referenzpaket vom 29.09.2026 um und verwendet den bestehenden GitHub-Updater.

- Wetterwerte direkt transparent auf der Karte, ohne dunkle Fläche oder Rahmen.
- Zweizeilige Wettertabelle: Symbol und Temperatur links; Wolken und Regen oben, Wind, Feuchte und Luftdruck darunter. Niederschlagsintervall aus den Wetterdaten.
- Sonne-/Mondtabelle mit Ortsdatum und Zeitzone, vier Ereigniszeiten sowie Datenstand und 10-Minuten-Aktualisierung. Beispielwerte der Mockups werden nicht als Messdaten übernommen.
- Kleines cyanblaues Tactical-Fadenkreuz mit segmentierten Ringen, längeren Achsen, orangeweißem Mittelpunkt und Verbindung zum Ortslabel.
- Feinerer Mausradzoom: etwa 1,45 % statt 4,9 % je vollem Schritt, mit weichem Übergang und begrenzten schnellen Radfolgen.
- NETZ-Liniendiagramm aus bis zu 60 tatsächlichen Messpunkten: Download grün, Upload magenta, gemeinsame automatische Skala. Ausfälle unterbrechen die Linien. Werte und Mbit/s stehen in getrennten, rechtsbündigen Spalten.
- Durchgehender Schiffsrahmen; Schiff, Kachelgröße, dynamische Modi und WARP bleiben erhalten.
- ARGOS ATLAS als sechster Standardlink mit Webseiten-Icon im Quicklaunch. Öffnung in der internen Tactical-Webansicht, kein neuer Hauptmenüpunkt. Eigene Links bleiben erhalten; maximal acht Einträge gleichzeitig sichtbar.
- Wartehinweis beim Installerstart; Update-Tasten sind während der Übergabe gesperrt. Die App bleibt während des Startaufrufs ansprechbar. Sicherheitsprüfungen werden nicht umgangen.
- Panda-Icon mit Spitzohren unverändert als App-/Taskleistensymbol; gespeicherter Zielmonitor und Windows-Autostart bleiben erhalten.

## Update

„Updates suchen“ und anschließend „77852 · Update laden“ verwenden. Das Setup aktualisiert den bestehenden Installationsordner. Vorherige Deinstallation ist nicht erforderlich. Einstellungen und eigene Links werden beibehalten.

## Prüfung

Automatische Kern- und Oberflächentests einschließlich 1280 × 720, Wetter-/Astronomietabellen, Netzwerkmesslücken, Quicklaunch/ARGOS-Routing, Statuswechsel, Bildschirmwahl und Zoom. GitHub baut Installer/ZIP und prüft den tatsächlichen Wechsel von 0.6.2 auf 0.6.3, erneute Installation und Deinstallation mit Erhalt von Test-Benutzerdaten.

ARGOS-Startseite und Karte sind im Browser erreichbar; die vollständige Interaktion aller externen Dienste innerhalb des installierten WebView2 ist kein automatisierter End-to-End-Test. WebView2 bleibt die stabile eingebettete Komponente; Firefox ist optional extern verfügbar. Kein unsicherer Gecko-Einbettungstrick.

Ein echter Windows-Neustart/Autostart sowie Norton-Freigaben wurden nicht automatisiert. Der Installer bleibt unsigniert; Norton kann den Start während seiner Prüfung verzögern. Nicht mehrfach starten, sondern die Prüfung abwarten.


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
