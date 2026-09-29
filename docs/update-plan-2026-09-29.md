# Nächstes Update – Nutzerliste vom 29.09.2026

Basis: veröffentlichte Version 0.6.2. Diese Liste ersetzt ältere gestalterische Vorgaben für die hier genannten Elemente. Bestehendes LCARS-Layout, Kachelgrößen, Schiff, Wetterfunktion und persönliche Einstellungen erhalten. Zwölf Arbeitspakete; bereits vorhandene Funktionen werden erweitert oder nachgeprüft, nicht als fehlend behandelt.

## A. Wetter und Karte

1. **Transparente Kartenwerte – ändern:** Dunkles Viereck und Rahmen entfernen. WIEN bzw. gewählter Ort, Koordinaten und Temperatur direkt transparent über der Karte.
2. **Wettertabelle – ändern:** Links Wettersymbol und Temperatur. Rechts Zeile 1: Wolken | Regen (15 Min.); Zeile 2: Wind | Feuchte | Luftdruck. Referenz M04_WETTERDATEN_2_Zeilen.png liegt vor; bisherige Wettertasten dauerhaft erreichbar lassen. Tatsächliches Niederschlagsintervall korrekt kennzeichnen.
3. **Sonne/Mond-Tabelle – Darstellung ändern:** Kopf mit Ort, Datum und Ortszeit. Zeile 1: Sonnenaufgang | Sonnenuntergang | Mondaufgang | Monduntergang. Zeile 2: Stand | Aktualisierung alle 10 Min. Bestehende ortsbezogene Berechnung, Zeitzone, Sommerzeit und fehlende Ereignisse beibehalten; Aktualisierungsintervall und Stand mit tatsächlicher Datenaktualisierung abgleichen.
4. **Tactical-Fadenkreuz – ändern:** Cyan/blaue segmentierte Kreise, längere Kreuzachsen, orange/weißer Mittelpunkt. Ortslabel über feine Verbindungslinie. Transparenter Hintergrund. Kleine Zielringe aus früherer Freigabe beibehalten; aktuelle Farb-/Formvorgabe ersetzt den roten Mittelpunkt aus 0.6.2.
5. **Mauszoom – weiter verfeinern:** Bereits weich und begrenzt, aber laut Nutzer noch zu empfindlich. Empfindlichkeit deutlich reduzieren; schnelle Radfolgen, Touchpad und Höhenbegrenzungen prüfen.

## B. System und U.S.S. Panda

6. **NETZ-Diagramm – neu:** Kachelgröße erhalten. NETZ links mit übrigen Bezeichnungen und unten mit Diagramm bündig. Download grün, Upload magenta. Werte rechts in festen Zahl-/Einheitspalten; Mbit/s rechtsbündig. Reale Messhistorie verwenden und Messausfälle kenntlich machen.
7. **Schiffsrahmen – korrigieren:** Durchgehender symmetrischer Rahmen ohne fehlerhafte Übergänge. Schiff, Werte, WARP und Kachelgröße unverändert.
8. **Dynamische Modi – vorhanden, nachprüfen:** WORK bei Aktivität, STANDBY nach längerer Inaktivität, WARP als besonderer Aktivitätsmodus. Bestehende Statuswechsel, Zeitstempel und dynamische Werte am Nutzergerät prüfen; keine unnötige Neuentwicklung.

## C. Quicklaunch und Tactical Browser

9. **Quicklaunch – erweitern:** Bestehende Standardlinks Kronen Zeitung, DER STANDARD, Heute, Facebook, OE24 erhalten. ARGOS ATLAS als Icon/Link hinzufügen. Ausschließlich Quicklaunch, kein eigener Menüpunkt. Bestehende eigene Links, Hinzufügen/Bearbeiten/Löschen und Persistenz erhalten; maximal acht sichtbare Einträge, weitere scrollbar. Vom Nutzer bestätigte Zieladresse: https://argosatlas.com/.
10. **Tactical Browser – vorhanden, ARGOS ergänzen:** Alle Quicklaunch-Ziele einschließlich ARGOS innerhalb der eigenen Tactical-Ansicht öffnen. BACK erhalten. Bestehende Browser-Abstraktion und WebView2-Fallback beibehalten; Firefox bleibt extern verfügbar. Keine unsichere Gecko-Einbettung. Kompatibilität von https://argosatlas.com/ mit der eingebetteten Tactical-Ansicht vor Veröffentlichung prüfen.

## D. Windows und App

11. **App-/Taskleistenicon – bestätigt:** Pandakopf mit Spock-Spitzohren, ohne Hand oder Fingergruß. Nutzer hat am 29.09.2026 die Spitzohren bestätigt. Vorhandenes Motiv beibehalten und konsistente Verwendung als App-, Taskleisten- und Installersymbol prüfen.
12. **Autostart und Monitor – vorhanden, Geräteprüfung offen:** Start mit Windows, persistente Monitorwahl und Hauptmonitor-Fallback nachprüfen. Gewünschter Bildschirm ist der rechte 1280×720-Monitor; nicht blind auf wechselnde DISPLAY-Nummern verlassen. Anmeldung/Neustart und erneutes Anschließen prüfen, ohne ungefragt neu zu starten.

## Zusätzlich bereits vorgemerkt

Norton-Wartephase: Hinweis nach Installerstart und Sperre gegen mehrfaches Starten desselben Updates. Keine behauptete Scanner-Erkennung; Schutzfunktionen bleiben aktiv. Siehe ROADMAP.md.

## Noch benötigte Grundlage

- ARGOS-ATLAS-URL bestätigt: https://argosatlas.com/; technische Einbettungsprüfung noch offen.
- Icon bestätigt: Spock-Spitzohren, ohne Handgruß.
- Referenzpaket vom Nutzer erhalten, entpackt und alle sechs Mockups visuell geprüft. Es fehlt keine der darin angekündigten Bildvorlagen.

Stand: Für Version 0.6.3 implementiert. Bestehende Statusmodi, Monitor-Speicherung und Spitzohren-Icon geprüft bzw. erhalten. Tatsächlicher Windows-Kaltstart und vollständige Interaktion externer Dienste bleiben Geräteprüfungen.

## Zugeordnete Bildreferenzen

Lokal unter references/2026-09-29/LCARS_Work_Referenzpaket im Projektarbeitsbereich abgelegt.

- Punkt 6: M01_SYSTEM_STATUS_NETZ_final.png (M02 ist laut Begleittext die Ausrichtungskorrektur, keine fehlende Bilddatei).
- Punkt 1: M03_WETTERKARTE_transparent.png.
- Punkt 2: M04_WETTERDATEN_2_Zeilen.png.
- Punkt 3: M05_SONNE_MOND_STATUS_2_Zeilen.png.
- Punkt 4: M06_WIEN_TACTICAL_TARGET_space.png; bestehende Karte und kompakte Markergröße erhalten.
- Punkt 7: M07_USS_PANDA_Rahmenkorrektur.png.

Die Bilder und der Begleittext dienen als Referenzmaterial. Die direkte Nutzerentscheidung für Spitzohren ohne Hand bleibt maßgeblich, auch wenn die README allgemein Spock-Gruß nennt. Mockup-Werte sind Beispiele und werden nicht als Livewerte übernommen. Bestehenden GitHub-Updater weiterverwenden.
