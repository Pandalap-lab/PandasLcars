# Target und Nachtansicht – Umsetzung 10.10.2026

Status: im Quellcode umgesetzt, Kontrollansichten vorhanden; noch kein veröffentlichtes Update und keine Installation.

## Target
- Segmentierte cyan/blaue Ringe, radiale Teilstriche, lange Kreuzachsen und rot/orange leuchtender Mittelpunkt mit hellem Kern.
- Transparente PNG-Darstellung aus versionierter SVG-Vorlage; kein schwarzes Rechteck.
- Transparenter Ortsname mit zwei Koordinatenzeilen; feine Verbindungslinie. Label wechselt bei wenig Platz rechts nach links.
- 96 px auf 1280×720, sonst 112 px. Ziel bleibt geografisch verankert und wird auf der abgewandten Erdseite ausgeblendet.

## Nachtansicht
- NASA GIBS Black Marble 2016 als nachladende Kartenkacheln statt ausschließlich vergrößerter lokaler Welttextur.
- Offizielle GoogleMapsCompatible_Level8-Kachelpyramide, maximale Stufe 8. Quellenangabe in Cesium.
- Lokales Nachtbild bleibt als Ersatz bei nicht erreichbarer Quelle verfügbar; Fehlermeldung im Tactical Feed.
- Tag-/Nachtbeleuchtung und Radar bleiben getrennt; helle OSM-Ortskarte überdeckt bei Earth-Nacht nicht die Stadtlichter. CENTER zeigt weiterhin die normale Ortskarte.
- Reale Begrenzung: Satellitenkomposit von 2016, kein Livebild. Auch diese Quelle zeigt im nahen Ortszoom weiche Stadtlichter; die gezeichnete Schärfe des Referenzmockups wird nicht als erreicht ausgegeben. Es werden keine Straßen-/Lichtdetails erfunden.

## Updateablauf (zusätzlicher Nutzerauftrag)
- Vorhandenes Setup wird gegen die frisch abgerufene SHA-256-Prüfsumme geprüft und bei Übereinstimmung wiederverwendet. Wiederholung verursacht keinen neuen Download.
- Verändertes Setup wird erneut geladen. Temporäre Aufräumfehler verdecken nicht mehr die ursprüngliche Fehlermeldung.
- Installer schreibt installation.log neben die heruntergeladene Setup-Datei.
- Weiter offen: echten Norton-Ablauf beobachten und anhand des Logs prüfen, weshalb dessen Prüfung den ersten Installationsversuch abbrechen lässt. Keine automatische Umgehung oder wiederholte Ausführung einer blockierten Datei. Ein-Start-Installation unter Norton noch nicht bestätigt.

## Kontrolle
- Vollständiger Dashboard-Browsertest bestanden, einschließlich Radar-/Tag-/Nacht-Pixeltest, Transparenz, ISS, Zoom und Layout.
- Live-Test: 72 erfolgreiche NASA-Kachelantworten; Welt, Europa (3.684 km), Ortszoom (220 km) bei 1280×720 gerendert. Zielkoordinaten, Ebenenumschaltung und Rückseiten-Ausblendung geprüft.
- Abschließender Windows-Build erfolgreich ohne Warnungen/Fehler. Alle Kerntests bestanden, einschließlich Wiederverwendung eines geprüften Installers und erneutem Download nach Manipulation.
- Kontrollbilder: ../qa/next-map/europe-1280.png, europe-map.png, global-map.png, local-map.png. Wetter-/Systemwerte fehlen im Browser-Test bewusst, kein Live-Dashboard-Screenshot. Nachtzeit für die Vorschau: 10.10.2026 22:00 UTC.

Quellen: https://nasa-gibs.github.io/gibs-api-docs/ und https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml

Notion: Am 10.10.2026 auf der bestehenden LCARS-Dashboard-Seite ergänzt und zurückgelesen: https://www.notion.so/3f2846adf71081cd8da5cf82ce617922 . Einschließlich offener Norton-Prüfung und Auflösungsgrenze.
