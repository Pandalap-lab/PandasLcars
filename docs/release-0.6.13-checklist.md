# Release-Prüfung 0.6.13

## Lokal bestanden, 13.10.2026

- Dashboard in Edge: bestehende Funktionen, Versionszustände, ISS, Radar, Zoom/Tag-Nacht-Rückkehr, Wetter-/Quellenabstände und sichtbare Systemwerte bei 950×590 bis 1920×1080.
- Sonnensystem: acht heliozentrische J2000-Ekliptikvektoren gegen NASA/JPL Horizons für 2026-10-13 12:00 UTC. Fehler unter 1 Bogenminute und 0,1 Prozent Abstand; tatsächlich maximal 0,25 Bogenminuten. Äußere Planetenreferenzen sind Systembaryzentren. Fixture solar-horizons.json, reproduzierbarer Test in dashboard.test.cjs.
- X/Y/Z, CENTER/Pos1, Vergrößern/Schließen und geladenes Panda-Bild. Kontrollbilder solar-top.png und solar-perspective.png im lokalen work/qa-Verzeichnis.
- Saharastaub: Marker bei 500 und 750 mg/m², Wechsel zu echtem Nullwert, fehlendem Rasterwert und außerhalb der Abdeckung. Separate Prüfung mit gespeichertem GeoSphere-Raster; veraltete Raster werden entfernt.
- Live-EUMETSAT-WMS: aktuelles verfügbares Bild erfolgreich abgerufen, Wolkenpixel mit Alpha höchstens 60/255, wolkenfreie Pixel transparent. Zoommultiplikator stetig und monoton von 0,3 bis 1.
- Kombinierte Overlay-Kontrollbilder mit realem Wolkenbild und für Darstellungsprüfungen zeitlich versetzten gespeicherten Staub-/Blitzrastern. Wetterwerte sind als Beispielwerte gekennzeichnet; diese Aufnahmen sind kein Beleg für aktuelle Staub-/Blitzmessungen. Externe Detailkarten sind im Test blockiert, lokale Grundkarte bleibt sichtbar.
- .NET-Kerntests und EUMETSAT/NetCDF-Sicherheitstests bestanden; Zoom und Erdrotation bestanden.
- Änderungen und Prüfstand vor Veröffentlichung in Notion LCARS Dashboard eingetragen und zurückgelesen.

## Veröffentlichungsschranken in GitHub Actions

Der Tag-Build wiederholt Kern-, Sicherheits- und Dashboardtests, baut Windows x64, prüft die veröffentlichten Assets erneut, erstellt Installer und ZIP und prüft Installation, zweimaliges Upgrade von 0.6.12, Datenerhalt und Deinstallation. Erst danach veröffentlicht der abhängige Release-Job die Dateien und SHA256SUMS.txt. Es soll nur ein vollständiger Build für diesen Commit laufen.

## Grenzen

Norton/SmartScreen-Abnahme auf dem Nutzergerät bleibt offen. Diese Release verändert keine Sicherheitseinstellungen. Satellitenblitze sind keine bestätigten Bodeneinschläge. Sonnensystem ist eine astronomisch berechnete, maßstäblich angepasste Darstellung. Die kleine Kachel verwendet Nummern; Namen und Sonnenabstände sind über Vergrößern lesbar.
