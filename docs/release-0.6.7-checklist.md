# Abnahme 0.6.7

- [x] Quellstand vor Übernahme mit origin/main abgeglichen (8ff9ca3); vorbereiteter Punkt-04-Patch geprüft und übernommen.
- [x] Originalquelle Station 207241 Korneuburg, Donau, Wasserstand Prognose, 48 Stunden verifiziert.
- [x] Echte Originalgrafik in der nativen Windows-App sichtbar, vollständig eingepasst. Anklicken öffnet die offizielle Detailseite.
- [x] Zehn-Minuten-Timer, manuelles Aktualisieren, Wiederverbindung, Lade- und Fehleranzeige implementiert; begrenzter Abruf, keine Nachrichtenbrücke zur externen Seite.
- [x] Vorhandene eigene Links erhalten; Hinzufügen, Bearbeiten, Löschen und Öffnen unter SETTINGS getestet.
- [x] Punkt 04 öffnet PANDAs im Vollbild bis zur Cloudflare-Access-Anmeldung.
- [x] Rückkehrknopf stellt vorheriges Vollbild beziehungsweise vorherigen normalen Fenstermodus wieder her (nativ geprüft).
- [x] Kernprüfungen und Oberflächenprüfung gegen Quellstand sowie fertige Build-Dateien bestanden.
- [x] GitHub-Build, Installation und Upgrade 0.6.6 → 0.6.7 inklusive Datenerhalt erfolgreich.
- [x] Release veröffentlicht und tatsächlicher Installer-Download per SHA-256 geprüft.

Nicht durchgeführt: Anmeldung hinter Cloudflare Access und Änderung seiner Zugangsregeln; dies bleibt im Startseiten-Chat. Kein automatisches Update der installierten LCARS-Anwendung. Escape/F11 bei Fokus in fremden Webseiten nicht gesondert abgenommen; der native Rückkehrknopf wurde geprüft.

Abschluss 09.10.2026: Quellcommit 147934f, GitHub-Lauf 37967963348 erfolgreich. v0.6.7 veröffentlicht; echter Installer-Download und SHA-256 bestanden. Updateangebot für 0.6.0 bis 0.6.6, kein Update für 0.6.7. Zusätzliche Testinstanzen geschlossen; ursprüngliche installierte Anwendung bleibt 0.6.6.
