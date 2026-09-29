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
