# PandasLcars 0.6.7

- Das frühere Quick-Launch-Feld zeigt die originale Hydro-NÖ-Grafik für Donau/Korneuburg (Station 207241, Wasserstand Prognose, 48 Stunden). Die Darstellung wird vollständig eingepasst; ein Klick öffnet die Originalseite in der Tactical-Ansicht.
- Abruf beim Start, alle zehn Minuten, manuell und nach Internet-Wiederverbindung. Ladefehler werden sichtbar gemeldet. Ein bereits geladenes Bild bleibt bei Fehlern ausdrücklich als nicht aktuell gekennzeichnet. „Abruf“ bezeichnet den Abrufzeitpunkt, nicht den Messzeitpunkt; Mess-/Prognosezeiten stehen in der Originalgrafik. Ungeprüfte Rohdaten und Modellwerte des Anbieters, keine nachgebauten oder erfundenen Messwerte.
- Gespeicherte Quick-Launch-Links bleiben erhalten und sind jetzt unter SETTINGS verfügbar.
- Punkt 04 öffnet https://pandanuovo.com/ innerhalb von LCARS im Vollbild. „ZURÜCK ZU LCARS“ stellt das Dashboard und den vorherigen Fenstermodus wieder her. Die Beschriftung lautet WEB / PANDAs.

## Prüfung und Grenzen

Kernprüfungen und Oberflächenprüfungen gegen Quell- und veröffentlichte Build-Dateien bestanden. Native Windows-Prüfung: Originalgrafik geladen, Portal erreicht Cloudflare Access, Rückkehr sowohl zum Vollbild als auch zum vorherigen normalen Fenster erfolgreich. Keine Anmeldung durchgeführt; die Freigabe der privaten Startseite und Cloudflare-Access-Konfiguration erfolgen separat. Keine Apps migriert, keine Cloudflare-Änderungen.

Die Originalgrafik wird in einer getrennten WebView ohne native Nachrichtenbrücke gerendert. Nur das begrenzte PNG gelangt ins Dashboard. Es wird kein iframe-Schutz umgangen. Falls Hydro NÖ seine Seite oder Canvas-Beschriftung ändert, kann die Einbindung ausfallen; Fehleranzeige und Öffnen der Originalseite bleiben möglich. Die kleine Fläche begrenzt die Lesbarkeit, deshalb ist die Großansicht über einen Klick erreichbar.

Die installierte Anwendung wird durch das Erstellen und Veröffentlichen dieses Releases nicht automatisch ersetzt.
