# PandasLcars 0.6.16 – SpaceX-Board im freigegebenen LCARS-Stil

## Gestaltung

Dieses Update überarbeitet ausschließlich die Ansicht **05 DATA · SpaceX** nach dem freigegebenen Mockup.

- Größere, besser lesbare Schrift für Missionsnamen, Startzeiten und wichtige Angaben.
- Vier große Countdown-Felder für **Tage, Stunden, Minuten und Sekunden**. Bei HOLD, unbestätigter Startzeit, veralteten Daten oder erreichtem Termin erscheint der jeweilige Zustand anstelle laufender Ziffern.
- Ein lokal mitgeliefertes NASA-Archivbild eines Raketenstarts ergänzt die nächste Mission. Es ist ausdrücklich als Archivbild gekennzeichnet und kein Livebild der ausgewählten Mission.
- Markante LCARS-Rundungen und Rahmen in Orange, Violett und Cyan, klar gegliederte Bereiche und eine lesbare Startliste.
- Weniger doppelte Angaben: Bei Auswahl des nächsten Starts ergänzt der Detailbereich Status und Missionsbeschreibung. Bei Auswahl einer anderen Mission stehen deren vollständige Angaben zur Verfügung.

Die bestehenden Startdaten, Wiener Zeitumrechnung, zehn Kalenderplätze, offiziellen Streams und die Starship-Telemetrieanbindung werden weiterverwendet. Hauptdashboard und Sonnensystem erhalten keine gestalterischen Änderungen. Die Versionsanzeige zeigt 0.6.16.

## Bedienung und Daten

**05 DATA · SpaceX** öffnet das Board. **ZURÜCK** oder Escape führt zum Dashboard zurück. Der Startkalender wählt die Mission für Details und Übertragung; der nächste geplante Start bleibt separat sichtbar.

Countdown und Starship-Messwerte behalten ihre bisherigen Alters- und Statusprüfungen. Ein geplanter Starttermin wird nicht als beobachteter Start ausgegeben. Fehlende Messwerte bleiben als nicht verfügbar erkennbar. Das Archivmotiv wird nicht als aktuelle Missionsaufnahme verwendet. [Bildquelle und Rechte](design/spacex-launch-source.md).

## Update und Prüfung

Update wie bisher: **UPDATES SUCHEN → 77852 · UPDATE LADEN → Installation bestätigen**.

Die Designvorschau wird in Edge mit den tatsächlichen Boarddateien geprüft, einschließlich **1280 × 720**, zehn Kalenderzeilen, Countdown-Zuständen, Missionsauswahl, Telemetrie und Tastaturbedienung. Vor Veröffentlichung folgen der vollständige Windows-Build, die vorhandenen Regressionstests vor und nach dem Build sowie Installer-/Upgrade-Prüfungen von **0.6.15** mit Datenerhalt.

Release-Dateien: **PandasLcars-Setup.exe**, **PandasLcars-Windows-x64.zip** und **SHA256SUMS.txt**. Der bestehende Updater prüft Version und SHA-256 und startet die Installation nach Bestätigung.

Die vorhandenen [Datenquellen und fachlichen Grenzen aus 0.6.15](release-0.6.15.md) gelten weiterhin.
