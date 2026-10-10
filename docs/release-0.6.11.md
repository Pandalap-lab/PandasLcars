# PandasLcars 0.6.11

Die bisherige rechte Navigation-Kachel wird durch SAHARASTAUB / BLITZE ersetzt. Die Legende verdeckt dadurch keine ISS- oder Karteninformationen mehr.

- Saharastaub: Prognosezeit, Modelllauf, feste Farbskala und GeoSphere-Quelle in der eigenen Kachel. Der transparente braune Dunst bleibt auf der Karte.
- Blitze: Datenzeitraum, letzter erfolgreicher Abruf und nächster geplanter Abruf in Wiener Ortszeit. Automatischer Abruf alle fünf Minuten; ausgeschaltete Ebene, Offlinezustand, laufender Abruf und veraltete Daten werden kenntlich gemacht.
- Wolken: UTC-Zeitformat für EUMETSAT korrigiert. Der vom Windows-Host gelieferte Zeitstempel wird vor der Kartenabfrage normalisiert; echte WMS-Kacheln wurden erfolgreich abgerufen.

Prüfung: Dashboard und Kartenfunktionen, Darstellung des veröffentlichten Builds sowie Installation und zweimaliges Upgrade von 0.6.10 werden vor Veröffentlichung automatisiert geprüft. Persönliche Einstellungen und die verschlüsselte EUMETSAT-Schlüsseldatei müssen erhalten bleiben.

Norton und SmartScreen können weiterhin die Ausführung verzögern oder blockieren. Dieses Update behauptet keine Behebung externer Sicherheitsblockaden. Blitzdaten sind Satellitenereignisse, keine bestätigten Bodeneinschläge.
