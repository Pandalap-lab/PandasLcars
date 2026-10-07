# LCARS – Notion-Aufgaben 07.10.2026 / Update 0.6.6

Quelle: [LCARS Dashboard in Notion](https://www.notion.so/3f2846adf71081cd8da5cf82ce617922), Abschnitt „Neue To-dos – 07.10.2026“. Per Notion-Desktop gelesen. Die dort erwähnte PANDAsPrivatKI wurde gemäß direkter Nutzeranweisung nicht eingesetzt. Die älteren freigegebenen Gestaltungspunkte sind bereits Bestandteil von 0.6.5.

## Radar / Earth
- [x] Beleuchtung ausdrücklich vom Earth-Modus steuern; Radar ändert weder Uhrzeit noch Modus.
- [x] Tages-/Nacht-Alpha der Nachtkarte und des Radar-Layers ausdrücklich setzen.
- [x] Bildvergleich mit echter Radar-PNG und aktueller Sonnenbeleuchtung: Tagesseite bleibt hell; gegenüberliegende Nachtseite bleibt dunkel.
- [x] Zweite Oberflächenprüfung gegen fertig gebaute Dateien erfolgreich.
- Hinweis: Die vollständige Verdunkelung durch Radar war im kontrollierten Test nicht reproduzierbar. Kein Nachweis einer bestimmten ursprünglichen GPU-/Treiberursache; vorbeugende Zustandskorrektur und Regressionstest implementiert.

## WLAN / Internet
- [x] Netzwerkadapter und Internetzugang getrennt prüfen; Anmeldeseiten nicht als Internet bestätigen.
- [x] Status anzeigen, begrenzte Wiederholungen, keine überlappenden Prüfanfragen, Abbruch beim Schließen.
- [x] Nach Wiederverbindung Wetter, Radar, Detailkarten, ISS, fehlende Icons und Updateprüfung nachladen.
- [x] Fehlgeschlagene Ortssuche und Tactical-Web-Navigation wiederholen; keine Formular-POST-Wiederholung.
- [x] Offline-/Online-Wechsel und einzelne Dienstausfälle automatisch getestet.
- [x] Neuer Windows-Build nativ gestartet: INTERNET VERBUNDEN, Wetter/Forecast/ISS/Icons geladen, Terminatorkante sichtbar. Nach Laden echter Radarkacheln bleiben Tagesseite, Nachtseite und Niederschlagsfarben korrekt sichtbar.
- [ ] GitHub: Installation, Upgrade 0.6.5 → 0.6.6, Datenerhalt, erneute Installation, Deinstallation.
- [ ] Veröffentlichung und echter Installer-Download mit Prüfsumme.

Keine Änderungen an PrivatKI, WLAN-Einstellungen, Norton oder Notion-Aufgabenstatus. Der reale Windows-Kaltstart mit verzögerter WLAN-Anmeldung bleibt eine Prüfung auf dem Laptop.
