# Kompakte Browserleiste – 10.10.2026

Auf Nutzerwunsch die obere Leiste der eingebetteten LCARS-Browseransicht erheblich verkleinert: eine Zeile, 28 Pixel hohe Bedienelemente, rund 36 Pixel bis zum Seiteninhalt statt etwa 136 Pixel. Keine separate große Überschrift. Adresse bleibt sichtbar, Zurück/Neu laden als Symbole, Firefox und Rückkehr zu LCARS weiterhin direkt erreichbar. Meldungszeile nur bei Fehlern oder besonderen Hinweisen; normale Lade-/Bereitmeldungen als Tooltip. Zugängliche Namen für alle Schaltflächen.

Windows-Testbuild unter artifacts/compact-browser erfolgreich kompiliert. Native Sichtprüfung auf 1280×720: PANDAs-Seite geladen, schmale Leiste sichtbar, Rückkehr zu LCARS erfolgreich. Getrenntes Dashboard-Testprofil benutzt, zusätzliche Testinstanz anschließend geschlossen. Kein neuer Release und keine Installation vorgenommen; veröffentlichte Version bleibt 0.6.7.

## Release abgeschlossen

Am 10.10.2026 als v0.6.8 veröffentlicht, Quellcommit cc814fe. GitHub-Lauf 38071880788: Kernprüfungen, beide Oberflächenprüfungen, Build, Installation/Upgrade 0.6.7, Datenerhalt und Deinstallation erfolgreich. Updateangebot für 0.6.0–0.6.7 geprüft. Der erste DownloadProbe meldete beim Verschieben der Datei Zugriff verweigert; der vorhandene heruntergeladene Installer wurde anschließend direkt gegen die veröffentlichte SHA-256 geprüft und stimmt überein (26d6e411c210e2dc2137c74b5b645d53b2b86a8bd5396b60b39f61945408b380). Keine Installation durch den Assistenten.
