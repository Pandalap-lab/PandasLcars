# Nächstes Kartenupdate – Nutzerauftrag 10.10.2026

Diese Punkte sind für das Update nach 0.6.8 vorgemerkt, nicht Bestandteil des laufenden Browserleisten-Releases.

## 1. Tactical-Target nach Bild 1

- [x] Mehrere feine cyan-/blaue, segmentierte Ringe mit radialen Markierungen und Kreuzachsen wie in der Referenz.
- [x] Rot/orange leuchtender Mittelpunkt mit hellem Kern statt des jetzigen kleinen orangefarbenen Symbols.
- [x] Feine Verbindungslinie zum Ortslabel; Ortsname und Koordinaten entsprechend der Referenz anordnen.
- [x] Referenz als Ganzes berücksichtigen; frühere Vorgabe eines transparenten Ortslabels beibehalten, sofern kein neuer Rahmen ausdrücklich bestätigt wird.
- [x] Transparenter Hintergrund; keine schwarzen Rechtecke, keine verdeckten Kartenbedienelemente.
- [x] Position bleibt exakt am gewählten Ort; Größenwirkung bei verschiedenen Zoomstufen und auf Monitor 3 (1280×720) prüfen.

Referenz: [Bild 1 – gewünschtes Target und Nachtbild](references/next-map-update/target-night-reference.png).

## 2. Nachtansicht auch im Zoom verbessern

- [ ] Dunkle, klare Land-/Wasserflächen mit deutlich erkennbaren goldenen Stadtlichtern und feinen Konturen wie in Bild 1.
- [ ] Unscharfe, fleckige Vergrößerung der derzeitigen Nachttextur vermeiden; Bild 2 zeigt die unerwünschte Darstellung bei ca. 3.684 km Höhe.
- [x] Verfügbare höher aufgelöste Nachtkarten, erlaubte Nutzung und zoomabhängige Ebenen prüfen. Keine erfundenen Stadtdetails und keine pauschale Zusage von Detailtreue, die die Quelle nicht liefert.
- [x] Tag-/Nachtgrenze, Erdrotation, Radarüberlagerung und Zielposition erhalten.
- [x] Prüfung in globaler Earth-Ansicht, Europa-/Österreich-Zoom und näherer Ortsansicht; Screenshotvergleich gegen beide Nutzerbilder.
- [x] Vor dem nächsten Build tatsächliche gerenderte Ansicht prüfen, zusätzlich zum automatisierten Test; bei erreichter Auflösungsgrenze transparent benennen.

Fehlerreferenz: [Bild 2 – aktuelle unscharfe Nachtansicht](references/next-map-update/current-night-zoom.png).

Umsetzungsstand und bewusst offene Grenzen: [Prüfbericht vom 10.10.2026](target-night-implementation.md). Kontrollbilder unter ../qa/next-map/. Noch keine neue Release veröffentlicht.
