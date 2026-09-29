# PandasLcars 0.6.5

Dieses Update korrigiert die in 0.6.4 gemeldeten Darstellungsfehler und gleicht Wetter und Sonne/Mond an die freigegebene kompakte Anordnung an.

- Wetter: großes Symbol und Temperatur links, zwei Datenzeilen, alle Layer-Tasten gemeinsam darunter. Die Einheit °C hat Abstand zur Trennlinie, auch bei negativen und dreistelligen Werten. Radar-Details sind über STATUS / QUELLEN erreichbar und verändern die Kartenhöhe nicht.
- Sonne/Mond: rechts neben Wetter, feste Zeitspalten mit senkrecht ausgerichteten Pfeilen und Doppelpunkten, unmittelbar neben der Bezeichnung und mit Abstand zur Trennlinie. Wieder die Schrift aus 0.6.4. Vollständiger Wochentag rechts in der Überschrift; auch das Datum rechts oben im Dashboard verwendet den ausgeschriebenen Wochentag.
- Target und ISS: transparente PNG-Symbole werden als positionsgebundene HTML-Bilder über der Karte dargestellt. Der fehlerhafte WebGL-Bildpfad entfällt. Wien hat ein transparentes Ortslabel mit Verbindungslinie.
- ISS ANZEIGEN richtet die Kamera auf die berechnete Stationsposition. Ist die ISS auf der anderen Erdseite, erklärt der Status dies. Solarpaneele, Bahn und Sichtbarkeit wurden im lokalen Windows-Build geprüft. Die Position ist aus Bahndaten berechnet, keine direkte Live-Telemetrie. Darstellung nur bei EARTH ON.
- Quicklaunch: tatsächliche Icon-Verweise der Website auslesen, relative Adressen auflösen, Bildinhalt prüfen und lokal zwischenspeichern. Nach einer URL-Änderung wird das neue Icon geladen. Das rote kurier.at-Icon wurde mit der echten Website und nach Cache-Neustart geprüft. Vorhandene Standard-Icons bleiben erhalten.
- QUICK LAUNCH und TARGETS haben gleich hohe orangefarbene Überschriften; die Einstellungstaste vergrößert den Balken nicht mehr.

## Prüfung

Kern-, Zoom-, Rotations- und Oberflächentests. Die Oberfläche wird zweimal geprüft: zunächst anhand der Quellen, dann anhand der tatsächlich veröffentlichten Build-Dateien. Prüfungen umfassen transparente Bildpixel, ISS-Bewegung/Ein-Aus, URL-/Icon-Wechsel, Temperaturabstand, senkrechte Zeitspalten und Panelgrößen bei 950, 1200, 1280 und 1920 Pixel Breite. Zusätzlich Sichtprüfung der lokal gebauten Windows-App auf dem rechten 1280×720-Display: Target auf Karte und Erde, sichtbare ISS mit Solarpaneelen, kurier.at-Icon und Tabellen.

Vor Veröffentlichung muss GitHub Installation, Upgrade von 0.6.4, Wiederholungsinstallation und Deinstallation mit Erhalt der Einstellungen und eigenen Links bestehen. Screenshots werden als Build-Artefakt aufbewahrt. Eine fehlgeschlagene Prüfung verhindert die Veröffentlichung.

## Update installieren

In der bisherigen App „Updates suchen“ und anschließend „77852 · Update laden“ verwenden oder PandasLcars-Setup.exe herunterladen. Keine vorherige Deinstallation nötig. Während Norton prüft, warten und kein zweites Setup starten. Norton bleibt aktiv. Der Installer ist weiterhin unsigniert; dessen Prüfung auf dem Laptop und ein echter Windows-Kaltstart sind durch die automatischen Tests nicht abgedeckt.
