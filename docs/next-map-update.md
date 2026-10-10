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

## 3. Regression 0.6.9: Nachtansicht nach Zoom wiederherstellen (Nutzermeldung 10.10.2026)

- [ ] Reproduzieren: In der Nachtansicht hineinzoomen. Laut Nutzer erfolgt ungefähr bei 2.427 km der Wechsel zur hellen Tag-/Ortskarte. Dieser Wechsel ist ausdrücklich akzeptiert.
- [ ] Fehler: Beim anschließenden Herauszoomen bleibt die helle Ansicht erhalten. Erst erneutes Betätigen von EARTH ON stellt die Nachtansicht wieder her.
- [ ] Soll: Beim Herauszoomen automatisch zur zeit- und ortsgerechten Earth-Tag-/Nachtansicht zurückkehren, ohne manuellen EARTH-ON-Schritt. Helle Ortskarte beim Hineinzoomen beibehalten.
- [ ] Ursache prüfen: Zusammenspiel von Zoomübergang, Earth-Modus und Tag-/Nacht-Alpha der Kartenebenen; 2.427 km ist ein beobachteter Näherungswert, noch keine bestätigte feste Schwelle.
- [ ] Regressionstest: Mehrfach zusammenhängend hinein- und herauszoomen (Mausrad und Zoomtasten), insbesondere beiderseits der beobachteten Schwelle; nicht nur unabhängig gesetzte Kameraansichten prüfen. Mit Radar an/aus und pausierter/laufender Erdrotation testen.
- [ ] Abnahme: Nacht kehrt ohne EARTH-Klick zurück; tatsächliche Tagesregionen bleiben tagsüber hell. Prüfung auf Monitor-3-Auflösung 1280×720.

Status: aufgenommen, noch nicht behoben. Diese Rückmeldung ergänzt die bisherigen Einzelansichtsprüfungen um den bislang nicht nachgewiesenen vollständigen Zoom-Rundlauf.

## 4. Target deutlich verkleinern (Nutzermeldung 10.10.2026)

- [ ] Das Target ist in der installierten Ansicht deutlich zu groß. Der Nutzer bestätigt den Stil ausdrücklich als passend.
- [ ] Ringe, Teilstriche, Kreuzachsen und leuchtenden Mittelpunkt proportional verkleinern. Richtwert für die nächste Kontrolle: etwa 50 % der derzeitigen Größe (48 statt 96 px auf 1280×720; 56 statt 112 px auf größeren Ansichten).
- [ ] Ortsname und Koordinaten weiterhin gut lesbar halten; Verbindungslinie und Abstand an das kleinere Symbol anpassen.
- [ ] Transparenz, geografisch exakter Mittelpunkt und Ausblendung hinter der Erde erhalten. Größenwirkung im echten Dashboard beim Welt-, Europa- und Ortszoom kontrollieren.

Status: Größenkorrektur aufgenommen, noch nicht umgesetzt. Die Halbierung ist ein vorgeschlagener Umsetzungsrichtwert; der Stil ist freigegeben.

## 5. Wolkenoverlay über vorhandenen WOLKEN-Button (10.10.2026)

- [ ] Nur die Wolkenüberlagerung ergänzen; Windströmung, Böen, Luftdrucklinien, Schnee und Sichtweite gehören nicht zum freigegebenen Umfang.
- [ ] Den vorhandenen WOLKEN-Button verwenden, keinen zusätzlichen Button anlegen. Einschalten zeigt tatsächliche Satelliten-Wolkenfelder über der Karte; Ausschalten entfernt die Ebene.
- [ ] Die lokale Prozentanzeige der Bewölkung beibehalten; sie ersetzt nicht die räumliche Wolkenüberlagerung.
- [ ] Geeigneten Satelliten-Kartendienst hinsichtlich Nutzungsbedingungen, Abdeckung, Aktualität und Tag-/Nachtverfügbarkeit prüfen. Quelle und Bildzeitpunkt anzeigen; fehlende oder veraltete Bilder ehrlich kennzeichnen.
- [ ] Transparente Darstellung und Zusammenspiel mit Radar, Earth-Tag/Nacht und Zoom-Rückkehr prüfen. Keine Änderung der Beleuchtung durch das Overlay.

Status: für das nächste Update aufgenommen, noch nicht implementiert.

## 6. EUMETSAT-Blitzdaten direkt auf der Earth-Karte (10.10.2026)

- [x] EUMETSAT als gewünschten Anbieter aufnehmen: MTG Lightning Imager, Level 2 Lightning Flashes (LFL), Sammlung EO:EUM:DAT:0691. Eigene Blitzdarstellung statt zusätzlichem Webseitenlink.
- [x] Öffentlichen Katalog real abrufen: Sammlung, Tagesprodukte und Produktmetadaten erreichbar. Datenregelung der Sammlung: NoConditions.
- [x] Aktualitäts-/Formatvorprüfung: Am 10.10.2026 Produkt für 18:00:09–18:10:09 UTC gefunden, Metadaten aktualisiert um 18:10:48.631 UTC. NetCDF-BODY und -TRAIL sowie ZIP-Produktdownload gelistet. Zehnminütige Dateibündel; daraus keine sekundengenaue Live-Verfügbarkeit ableiten.
- [x] Authentifizierten Rohdatenabruf über das angemeldete EUMETSAT-Konto im Data Store testen: echter ZIP-Download erfolgreich, beide NetCDF-Dateien gegen die MD5-Prüfsummen im Manifest geprüft.
- [ ] Automatischen API-Abruf mit persönlichem API Key/Secret separat testen. Keine Zugangsdaten im Quellcode, Installer oder Chat veröffentlichen; sichere lokale Speicherung vorsehen.
- [ ] Einen realen Datensatz dekodieren; Blitzpositionen, Ereigniszeit und Qualitätsinformationen prüfen. Satellitenblitze nicht als exakte Bodeneinschläge bezeichnen.
- [ ] Tatsächliche Abrufverzögerung, Österreich-/Europa-Abdeckung, Datenvolumen und sinnvolles Abrufintervall messen. Datenzeitpunkt und Veraltet-/Offline-Status sichtbar machen.
- [ ] Blitzpunkte auf der bestehenden Earth-Karte integrieren; mit Wolken, Radar, Tag/Nacht und Zoom testen. Vorhandenen Blitzkarten-Link als Ausweichmöglichkeit erhalten.

Zugangsprüfung aktualisiert am 10.10.2026: Authentifizierter Browserdownload erfolgreich. Sammlung zeigt „Free and unrestricted“. Datei für 18:10:09–18:20:09 UTC (20:10–20:20 Uhr Wien), Produktkennung endet auf 0110_0000, ZIP 584.572 Bytes. BODY-NetCDF 1.216.077 Bytes und TRAIL-NetCDF 42.692 Bytes vollständig gelesen; HDF5/NetCDF4-Signaturen korrekt und beide MD5-Prüfsummen stimmen mit manifest.xml überein. ZIP-MD5: 45e970660bb2b1a9e7d56cc86c867405. Datei liegt im Downloads-Ordner. Keine Zugangsdaten ausgelesen oder gespeichert. Dekodierung der Blitzkoordinaten, automatischer API-Abruf und LCARS-Integration noch offen.

Der frühere anonyme Einzeldatei-Download antwortete HTTP 404 (API Gateway: No matching resource), nicht HTTP 401; die Ursache dieses API-Fehlers ist durch den erfolgreichen Browserdownload noch nicht geklärt. Der verlinkte Authentifizierungsleitfaden V2.6 vom 02.09.2026 beschreibt weiterhin Consumer Key/Secret und EUMDAC; der Migrationshinweis allein belegt keine notwendige Kontoänderung.

Quellen:
- https://api.eumetsat.int/data/browse/collections/EO%3AEUM%3ADAT%3A0691?format=html
- https://gitlab.eumetsat.int/eumetlab/data-services/eumdac_data_store
- https://user.eumetsat.int/resources/user-guides/frequently-asked-questions-for-data-store

Lokale Abrufbelege: qa/eumetsat-lightning-collection.json, qa/eumetsat-lightning-product-list.json und qa/eumetsat-lightning-product-details.json (im Projekt-Arbeitsverzeichnis oberhalb des Repositorys).

## 7. Wüstenstaub / Saharastaub von GeoSphere einbauen (Nutzerauftrag 10.10.2026)

Quelle: https://doi.org/10.60669/metr-z617 — Wüstenstaubvorhersage für Europa, chem_dust-v1-1h-0p2deg.

- [x] Datensatz identifiziert: öffentliches WRF-Chem-Vorhersagemodell, stündliche Zeitschritte, täglicher Modelllauf, Raster 0,2°; Lizenz CC BY 4.0. Quelle: https://data.hub.geosphere.at/dataset/chem_dust-v1-1h-0p2deg
- [ ] Öffentlichen API-/Dateizugang mit echtem Abruf testen; verfügbare Staubparameter, Einheiten, Höhenbezug, fehlende Werte und Downloadvolumen prüfen.
- [ ] Ein-/ausschaltbare transparente Ebene „SAHARASTAUB“ in die Karten-Layer aufnehmen; vorhandene Wetterbedienung kompakt halten.
- [ ] Farbskala mit korrekter Einheit und Legende anzeigen. Bodennahe Konzentration und über die Atmosphäre integrierte Staubmenge nicht verwechseln.
- [ ] Deutlich als Vorhersage kennzeichnen; Modelllauf und gültigen Prognosezeitpunkt mit Ortszeit anzeigen. Prognosezeit auswählbar machen, soweit vom Abruf unterstützt.
- [ ] Tagesweise neue Modellläufe abrufen und zwischenspeichern; bei Ausfall/veralteten Daten Status zeigen. Außerhalb der Abdeckung keine Werte erfinden.
- [ ] GeoSphere Austria als Quelle mit CC-BY-4.0-Nennung verlinken.
- [ ] Zusammenspiel mit Wolken, Radar, Blitzen, Earth-Tag/Nacht und Zoom prüfen; Transparenz, Abschaltung und Lesbarkeit auf 1280×720 kontrollieren.

Status: ausdrücklich zur Umsetzung vorgemerkt; noch nicht eingebaut. Ergänzt den bisherigen Umfang um Wüstenstaub, ohne weitere Wetterebenen pauschal freizugeben.

## 8. GeoSphere-API-Anbindung nach offiziellem Leitfaden (Nutzerauftrag 10.10.2026)

Referenz: https://data.hub.geosphere.at/showcase/api-grundlagen
Dies ist eine technische Anleitung, kein zusätzlicher Wetterdatensatz. Ergänzt die GeoSphere-Wetterprüfung und den Saharastaub-Auftrag aus Punkt 7.

- [ ] Gemeinsame GeoSphere-Anbindung für die freigegebenen Datensätze vorsehen; Endpunkte, Parameter, Einheiten, Stationen und Zeitauflösung aus den jeweiligen Metadaten prüfen.
- [ ] Österreichische Stationswerte als alternative Wetterquelle vorbereiten: Temperatur, Niederschlag, Wind/Böen, Feuchte, Taupunkt und Luftdruck. Messwerte und Vorhersagen eindeutig unterscheiden; Stationsname, Messzeit und Entfernung zum gewählten Ort anzeigen.
- [ ] Regen-Zeitintervall und Druckbezug korrekt beschriften; fehlende Werte nicht als 0 darstellen. Bestehende weltweite Wetterquelle für Orte außerhalb der Abdeckung erhalten.
- [ ] Öffentlichen Zugang ohne API-Key nutzen; keine EUMETSAT-Zugangsdaten an GeoSphere senden.
- [ ] Abrufe bündeln, zwischenspeichern und begrenzen: laut Leitfaden maximal 5 Anfragen pro Sekunde und 240 pro Stunde. Bei HTTP 429 pausieren; keine Endlosschleife.
- [ ] Abfragegröße vorab begrenzen: JSON/CSV maximal 1.000.000 Werte, NetCDF maximal 10.000.000 Werte; Parameter × Zeitschritte × Standorte/Gitterzellen berücksichtigen.
- [ ] Verbindungsfehler, veraltete Daten, fehlende Stationen und ungültige Antworten testen; letzte gültige Daten mit erkennbarem Zeitstempel erhalten.
- [ ] Lizenz und Quellenangabe für jeden tatsächlich eingebundenen Datensatz prüfen und anzeigen.

Status: vorgemerkt. Der frühere echte Testabruf für Wien/Hohe Warte ist in api-alternatives.md dokumentiert; die produktive GeoSphere-Anbindung ist noch nicht umgesetzt. Weitere Datensätze werden durch diesen Grundlagen-Link nicht automatisch Bestandteil des Updates.

### Automatischer EUMETSAT-Abruf erfolgreich geprüft – 10.10.2026

Dieser Prüfstand ersetzt die oben noch als offen bezeichnete API-/Dekodierungsprüfung:
- Verschlüsselte Schlüsseldatei unter dem tatsächlichen Windows-Konto erfolgreich gelesen; Token-Endpunkt HTTP 200. Keine Schlüssel oder Tokens protokolliert.
- Vollständiger automatischer Produktabruf und NetCDF-Dekodierung erfolgreich: Produkt endet auf 0113_0000, Zeitraum 18:40:09–18:50:09 UTC (20:40:09–20:50:09 Wien).
- 30.875 Blitzereignisse im Produkt, davon 2.347 im Testausschnitt Europa (15°W–40°E, 30°N–65°N); 0 verworfene Koordinaten, keine vom Decoder erkannte Qualitätswarnung. Das sind Satelliten-Blitzereignisse, keine bestätigten Bodeneinschläge.
- Zweiter Abruf desselben Clients erfolgreich aus dem Zwischenspeicher.
- Fehler behoben: de-AT ersetzte Datumstrenner in der Katalogadresse durch Punkte (HTTP 400). Die Anfrage nutzt nun kulturunabhängiges Format yyyy/MM/dd.
- Regressionstest mit de-AT und strikter Prüfung der Datumsadresse erfolgreich; bestehende Prüfsummen-, Token-Erneuerungs- und Fremdhost-Tests ebenfalls erfolgreich.
- Korrektur im Quellcode und Testprogramm enthalten; abschließender App-Build/Installer und Release stehen noch aus. Kein Dauerbetriebstest damit behauptet.

### GeoSphere-Kartenoverlay umgesetzt – 10.10.2026

- Nutzerauftrag: LAYER ON/OFF entfällt, Wetter grundsätzlich aktiv. Die einzelnen Ebenen bleiben separat schaltbar. Neue Buttons BLITZE und SAHARASTAUB stehen in der bestehenden Zeile; LAYERS-Auswahldialog enthält beide.
- Saharastaub wird aus dem echten GeoSphere-Grid chem_dust-v1-1h-0p2deg geladen: 66.000 Rasterzellen, aktueller Stundenwert, Europa/Nordafrika 20–64°N / 20°W–40°E. Anonymer produktiver Abruf erfolgreich; Referenzlauf 10.10.2026 00:00 UTC, erster Prüfstundenwert 18:00 UTC. Maximalwert 3471,25 mg/m².
- Transparenter brauner Dunst: feste Wurzel-Skala 0–1000 mg/m² mit maximal 170/255 Deckkraft; höhere Werte bleiben gesättigt. Ränder der begrenzten Abdeckung weich ausgeblendet. Nullwerte und fehlende Werte bleiben transparent; keine synthetischen Staubfelder.
- Die Größe ist die Staubmasse der gesamten Luftsäule, nicht bodennaher Feinstaub. Legende zeigt Einheit, Gültigkeitszeit, Modelllauf und GeoSphere/CC-BY-Quelle. Die Zeit wird lokal angezeigt.
- Stundenwerte werden im Speicher gecacht. UI fragt alle fünf Minuten nach, neue Datenpakete werden erst bei neuer Stunde geladen. Fehlerpause zwei Minuten, Download maximal 32 MiB, veraltete Werte nach zwei Stunden bzw. Modelllauf nach 48 Stunden ausgeblendet.
- Kompilation erfolgreich. Tests: echtes Raster dargestellt, Schalter an/aus, stale-Ausblendung, kein globales ON/OFF mehr, 1280px-Buttonabstände, LAYERS-Dialog, keine JS-Fehler. Bestehende Dashboard-Suite inkl. 950/1200/1280/1920px ebenfalls bestanden. Decoder prüft Einheit, Orientierung, Nullwerte und fehlende Werte.
- Kontrollbilder: ../../qa/geosphere-control-1280.png und ../../qa/geosphere-control-detail.png. Echte Staubdaten; übrige Wetterwerte sind gekennzeichnete UI-Beispiele, System-/Pegelwerte werden im Browser-Prüfaufbau nicht live gespeist.
- Noch offen aus der allgemeinen GeoSphere-Liste: Stationsquelle für Wettertabellen und frei wählbare zukünftige Prognosezeit. Dieses Overlay zeigt jeweils die aktuelle Prognosestunde. Kein neuer Installer veröffentlicht.
