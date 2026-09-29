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
