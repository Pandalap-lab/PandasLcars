# PandasLcars 0.6.13

Die Saharastaub-Skala zeigt jetzt den Prognosewert des gewählten Targets mit einem sichtbaren Punkt, Ortsname und mg/m². Targetwechsel und neue Prognosedaten aktualisieren die Anzeige. Nullwerte bleiben gültig; fehlende Werte oder Orte außerhalb der Abdeckung werden als „keine Daten“ gekennzeichnet. Veraltete Prognosen werden ausgeblendet. Der braune Dunst ist kräftiger abgestuft.

Wolken werden beim Hineinzoomen weich transparenter: etwa 7 Prozent maximale Bilddeckkraft im Nahbereich bis etwa 24 Prozent in der Übersicht. Beim Herauszoomen kehrt die Übersichtstransparenz zurück. Die Zeitangaben bleiben rechts; SYSTEM STATUS wird nicht verkleinert.

Die neue Sonnensystem-Kachel ersetzt das große Emblem. Der freigegebene Panda im Starfleet-Outfit bleibt links unten mit U.S.S. PANDA und NCC-080470. Sonne und acht Planeten werden lokal mit Astronomy Engine 2.1.19 berechnet, jede Minute aktualisiert und im festen J2000-Ekliptiksystem angezeigt. Die Entfernungen sind für die Übersicht radial komprimiert, die Planetengrößen symbolisch. Die angezeigten Positionen sind berechnet, keine Satelliten-Livebilder.

- X/Y/Z drehen die Ansicht; Ziehen dreht X/Y, Umschalt+Ziehen dreht X/Z.
- CENTER bzw. Pos1 stellt die zentrierte Draufsicht her.
- Pfeiltasten drehen X/Y, Q/E drehen Z.
- Die Vergrößerung zeigt Planetennamen, Sonnenabstände in AE und die Berechnungszeit in Wiener Ortszeit.

Prüfungen: acht Planeten gegen NASA/JPL Horizons am 13.10.2026 um 12:00 UTC (maximal 0,25 Bogenminuten Richtungsabweichung); Dashboard, Null-/Fehlwerte und Targetwechsel; Live-Wolkenabruf; Kern- und API-Sicherheitstests. Die Release-Pipeline prüft zusätzlich die veröffentlichten Dateien, Installation, zweimaliges Upgrade von 0.6.12 und Erhalt persönlicher Einstellungen und Schlüsseldateien.

Norton/SmartScreen kann den Start weiterhin verzögern oder blockieren. Eine dauerhafte Behebung von Fehler 5 auf dem Nutzergerät ist nicht nachgewiesen. Satellitenblitzereignisse sind keine bestätigten Bodeneinschläge. Keine PrivatKI und keine persönlichen Zugangsdaten enthalten.

Astronomische Quellen: [Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/v2.1.19), [NASA/JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html). Referenzwerte und reproduzierbarer Vergleich liegen in PandaLcarsTactical.Tests/solar-horizons.json und dashboard.test.cjs.
