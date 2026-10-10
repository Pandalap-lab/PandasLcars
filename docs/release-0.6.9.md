# PandasLcars 0.6.9

Das Tactical-Target erhält segmentierte cyan/blaue Ringe, radiale Markierungen, Kreuzachsen und einen rot/orange leuchtenden Mittelpunkt. Ortsname und Koordinaten bleiben transparent; bei Platzmangel rechts wechselt die Beschriftung nach links. Die Anzeige ist auf 1280×720 geprüft.

Die Earth-Nachtansicht lädt höher aufgelöste NASA-GIBS-Kacheln (Black Marble 2016) beim Zoomen nach. Die lokale Nachtkarte bleibt als Ersatz verfügbar. Die helle Ortskarte überdeckt nachts nicht mehr die Stadtlichter; Tag-/Nachtbeleuchtung, Radar und Erdrotation bleiben getrennt. Satellitenkomposit von 2016, kein Livebild: Im nahen Ortszoom bleiben die Lichtdetails durch die Quellauflösung begrenzt und erreichen nicht die gezeichnete Schärfe des Referenzmockups.

Der Updater verwendet bereits geladene Installationsdateien nach erneuter SHA-256-Prüfung wieder und schreibt installation.log neben das Setup. Fehler beim Entfernen einer temporären Datei verdecken nicht mehr den ursprünglichen Fehler. Norton-bedingte Abbrüche beim ersten Start sind damit noch nicht nachweislich behoben; Schutz bleibt eingeschaltet.

Geprüft: Kern- und Dashboardtests, transparente Markierungen, Radar-/Tag-/Nacht-Pixeltest, echte NASA-Kachelabrufe in Welt-, Europa- und Ortsansicht. Die Release-Prüfkette testet zusätzlich das veröffentlichte Anwendungspaket, Upgrade von 0.6.8, Erhalt der Einstellungen, erneute Installation und Deinstallation. Die Veröffentlichung installiert das Update nicht automatisch.
