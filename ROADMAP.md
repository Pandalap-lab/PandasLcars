# Stand 0.6.3

Die Nutzerliste vom 29.09.2026 und der Norton-Wartehinweis sind implementiert. Details und verbleibende Geräteprüfungen: [Release 0.6.3](docs/release-0.6.3.md). Die folgenden Abschnitte enthalten den bisherigen Planungsverlauf.

# Stand 0.6.2

## Aktuelle Nutzerliste vom 29.09.2026
Maßgebliche nächste Arbeitspakete und Statusabgleich: [12-Punkte-Updateplan](docs/update-plan-2026-09-29.md). ARGOS ATLAS ausschließlich im Quicklaunch und im Tactical-Browser. Der Norton-Wartehinweis bleibt zusätzlich vorgemerkt.

## Nächstes Update: Wartephase beim Installerstart
- Nutzerbeobachtung: Norton prüft den Installer zunächst; nach Abschluss funktioniert das Update.
- Nach dem Start anzeigen: „Installer gestartet – die Sicherheitsprüfung kann einen Moment dauern. Bitte warten.“
- Erneutes Starten desselben Updates während der Übergabe an das Setup verhindern; Update-Taste entsprechend sperren.
- Ohne Nachweis keinen laufenden Norton-Scan behaupten. Bei Startfehlern verständliche Rückmeldung und erneuten Versuch ermöglichen.
- Norton und andere Schutzfunktionen bleiben aktiv. Vorgemerkt, noch nicht implementiert.

Die nachstehenden freigegebenen UI-, EARTH-, Astronomie- und Fensteränderungen sind implementiert. Aktueller Umfang und verbleibende Geräteprüfungen: [Release 0.6.2](docs/release-0.6.2.md). Die folgenden Abschnitte dokumentieren die ursprünglichen Anforderungen.

# Noch offene Integrationen

## v0.6.0 umgesetzt
- Menü 04 WEB öffnet Firefox; 07 OUTLOOK öffnet weiterhin Outlook-Kalender (Kalender/E-Mail).
- Monitorwahl mit dauerhaft gespeicherter Gerätekennung, Vollbild und Hauptmonitor-Fallback; eine Minute Erkennung beim Start.
- Autostart als Installer-Option und in Settings.
- Update-Tasten: GitHub-Release prüfen, Installer laden, SHA-256 prüfen, Installation ausdrücklich bestätigen.
- Ursprünglicher LCARS-Kopf und Kompass in der Navigation-Kachel, echte Zielkoordinaten statt erfundener GPS-Messwerte.
- Quicklaunch mit Webseiten-Favicons und Text, Initialen bei nicht erreichbarem Icon.
- Linkes Menü 01/02/03/05/06/07/08/09/10 angebunden, Power mit zweifacher Bestätigung.
- Kennung NCC-080470 über dem unveränderten Referenzbild.
- OSM-Anfragen mit App-Kennung und tatsächlichem Seitenursprung. Externe Filter können Header weiterhin entfernen.
- Atomare lokale Speicherung mit begrenzter Wiederholung bei kurzfristigen Dateisperren.

## Externe Voraussetzungen / offen
- Kontoverknüpfung auf Nutzerwunsch verworfen. Dienste sind Browserlinks ohne Kontostatus; keine Client-IDs nötig.
- Signierung: kein kostenpflichtiger Dienst und keine Store-Veröffentlichung gewünscht. Installer bleibt unsigniert.
- Ein vollständiger Windows-Neustart und Prüfung während der Anmeldung ist separat nötig.

## Vom Nutzer geprüft (27.09.2026)
- 02 System: Windows-Einstellungen, 03 Navigation: Maps, 05 Data: Explorer, 06 Media: Google Fotos erfolgreich.
- 07 Outlook-Kalender öffnet erfolgreich in Firefox.
- 10 Power: Menü scheint korrekt; Neustart/Herunterfahren nicht ausgeführt.
- Norton-Prüfung auf Wunsch zurückgestellt bis eine neue Meldung mit Dateidetails vorliegt.

## Nächstes Update – vorgemerkt, noch nicht umgesetzt
- 04 WEB/FIREFOX: Schriftart und Größe an die ursprünglichen LCARS-Menütasten angleichen.
- 07 OUTLOOK umbenennen in COMMUNICATION, darunter CALENDAR; Outlook-Kalenderlink unverändert lassen. Schrift ebenfalls angleichen.
- Blitzkarte: Nutzer meldet erneut OSM-Sperrkachel wegen fehlendem Referer. Bisheriger WebView2-Header-/Cacheansatz hat das Problem nicht zuverlässig behoben.
- Technisch geprüfte Alternative: LightningMaps mit aktuellem Ziel über Firefox --new-window öffnen. Mozilla dokumentiert diesen Startparameter; normale Browser erfüllen laut OSM grundsätzlich die Header-/Cacheanforderungen. Praktischer Nachweis auf dem Nutzergerät steht aus, mögliche externe Headerfilter bleiben ungeklärt.
- Für externen Browser keinen überwachten ON/OFF-Zustand vortäuschen: bevorzugt Aktion BLITZKARTE ÖFFNEN, Fenster vom Nutzer schließen. Nicht den Firefox-Prozess beenden, da andere persönliche Fenster dazugehören können.
- Quellen: https://firefox-source-docs.mozilla.org/browser/CommandLineParameters.html und https://operations.osmfoundation.org/policies/tiles/

## Freigegebene Kopfzeile für das nächste Update
- Nutzerfreigabe: Mockup docs/design/header-approved.png übernehmen.
- Exakter Text: PANDAs LCARS TACTICAL (kleines s).
- Einheitliche schmale, kräftige LCARS-Schrift wie TACTICAL im linken Panel, saubere Grundlinie und gleichmäßiger Abstand zum Rand.
- Orange Leiste, schwarze Trennungen, violette Endkappe und blaue Linie erhalten. Keine sichtbaren Überdeckungsrechtecke.
- Mockup ist eine Gestaltungsvorlage; Umsetzung als sauber gerenderte UI-Beschriftung, kein Einbau eines kompletten Screenshot-Banners.

## EARTH-Rotation – für nächstes Update freigegeben
- In EARTH-Ansicht Weltkugel langsam und gleichmäßig drehen: etwa eine Umdrehung in 5 Minuten.
- Während Maus-/Touch-Bedienung pausieren; nach 15 Sekunden ohne Eingabe automatisch fortsetzen.
- In Ziel-/Kartenansicht keine automatische Drehung.
- Ein-/Ausschalter in Settings, Auswahl lokal persistent speichern.
- Bestehenden Zoom und manuelle Navigation erhalten; Rotation zeitbasiert und ohne hektische Effekte ausführen.
- EARTH zusätzlich mit aktueller Tag-/Nachtbeleuchtung: helle Tagseite, dunkle Nachtseite mit Stadtlichtern und wandernder Tag-Nacht-Grenze; gemeinsam mit langsamer Erdrotation umsetzen.

## Sonne und Mond – implementiert, noch nicht veröffentlicht
- Vier Auf-/Untergangszeiten für das Datum und die Zeitzone des gewählten Ortes in der Wetterdarstellung.
- Lokale Berechnung mit CosineKitty.AstronomyEngine 2.1.19; Meereshöhe/freier Horizont. Keine zusätzlichen Zugangsdaten.
- Fehlende Ereignisse als Gedankenstrich, Datum und Ortszeitzone sichtbar; Sommerzeitgrenzen berücksichtigt.
- Kern-/Oberflächentests sowie lokaler Windows-Build erfolgreich. Ortszeitformat, Polartag und Sommerzeit geprüft.

## Präzisierung Navigation / Weather – aktuelle Nutzervorlage
- Maßgeblich ist docs/design/panel-header-reference.png (TACTICAL FEEDS), nicht die zuvor generierte segmentierte Mockup-Kopfzeile.
- NAVIGATION und WEATHER · 3 TAGE: durchgehend orange Kopfzeile, links rund, Schriftart/-größe/-gewicht und Innenabstände wie TACTICAL FEEDS.
- Keine blauen/violetten Segmente in diesen beiden Kopfzeilen. LEEREN ist eine Funktion des Feeds und wird nicht kopiert.
- Vorhandene Panelinhalte und äußere LCARS-Rahmen beibehalten; Kompass sauber ausrichten.

## Freigegeben: Ausrichtung Targets / Quick Launch
- Nutzer hat das untere korrigierte Mockup bestätigt: docs/design/targets-quicklaunch-approved.png.
- TARGETS / DESTINATIONS endet rechts exakt bündig mit TACTICAL SITUATION / zentraler Kartenfläche.
- QUICK LAUNCH beginnt links exakt bündig mit WEATHER und endet rechts bündig mit WEATHER.
- Gleicher senkrechter Spaltenabstand oben und unten; gemeinsame Layoutspalten statt unabhängiger Prozentwerte verwenden.
- Nur Breiten/Ausrichtung anpassen, vorhandene Bedienung und kleine Quicklaunch-Icons erhalten. Mockup ist Gestaltungsvorlage, keine Rastergrafik für die Oberfläche.
