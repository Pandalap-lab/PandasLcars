# Noch offene Integrationen

## v0.6.0 umgesetzt
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
- Echte OAuth-Kontoanbindung: eigene Google-/Microsoft-Client-IDs und passende Desktop-Appregistrierungen erforderlich; derzeit nicht vorhanden/verifiziert. Browseranmeldungen bleiben ausdrücklich ungeprüft.
- Menü 04 Communication: vom Nutzer noch keine Aktion festgelegt.
- Signierung: kein kostenpflichtiger Dienst und keine Store-Veröffentlichung gewünscht. Installer bleibt unsigniert.
- Ein vollständiger Windows-Neustart und Prüfung während der Anmeldung ist separat nötig.
