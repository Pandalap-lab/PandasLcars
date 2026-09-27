# PandasLcars 0.5.1

Windows-11-App für x64 mit C# / WinUI 3 und einer lokal eingebundenen WebView2-Oberfläche. Das LCARS-Mockup bleibt die gestalterische Referenz. Seine statischen Bereiche werden aus dem unveränderten Originalbild zusammengesetzt; echte Bedienflächen ersetzen Karte, Uhr, System Status, Navigation, Wetter, Ziele und Feeds. Das Layout nutzt die verfügbare Fensterbreite.

## Start

Die Windows-x64-ZIP vollständig entpacken und `PandasLcars.exe` starten. Alle Dateien zusammenlassen. Zum Start ist **kein SDK** nötig; .NET und Windows App SDK sind enthalten. Der Microsoft Edge WebView2 Runtime muss vorhanden sein (auf Windows 11 normalerweise bereits installiert). Bei Bedarf: https://developer.microsoft.com/microsoft-edge/webview2/

F11 schaltet Vollbild um, Escape verlässt Vollbild, Alt+F4 beendet die App. Die Anwendung ersetzt nicht die Windows-Shell.

## Bedienung

- **Karte:** echte drehbare Cesium-3D-Erde. Mit Maus ziehen/drehen und Mausrad oder ZOOM + / − hinein- und herauszoomen. CENTER zeigt den gewählten Ort im Detail; EARTH zeigt die Erde aus größerer Entfernung. TRACK bindet die Kamera an das Ziel. SENSORS schaltet die Ortsanzeige, LAYERS die Wetterbedienung um.
- **TARGETS / DESTINATIONS:** Ort suchen und einen Treffer auswählen. Die Erde dreht zum Ziel; aktuelle Wetterwerte, Navigation und Dreitagesvorschau folgen diesem Ort. Entfernungen werden ab Wien berechnet. Neue Suchtreffer werden oben in die bestehende Auswahlliste aufgenommen. Bisherige Ziele bleiben darunter erhalten; doppelte Orte werden zusammengeführt. Ein ausgewählter Ort rückt an die erste Stelle. Die Liste wird lokal gespeichert und beim Neustart wiederhergestellt. Ein leeres Suchfeld oder eine erfolglose Suche löscht keine Ziele.
- **Wetter:** ON zeigt die Wetterinformationen am Kartenpunkt, OFF blendet sie aus. Beide Knöpfe setzen ausdrücklich den bezeichneten Zustand. Die Wetterkachel und Vorhersage bleiben unabhängig davon aktuell. Temperatur, Wolken und Niederschlag steuern die Angaben links in der Karte. Auf dem Globus steht ausschließlich der Stadtname als scharfe Textbeschriftung. RADAR schaltet die tatsächlichen Regenradarflächen von RainViewer ein/aus.
- **Vorhersage:** heute, morgen und übermorgen nach der Zeitzone des gewählten Ortes. Aktuelle Modellwerte und Vorhersage kommen von Open-Meteo; automatische Aktualisierung alle zehn Minuten, zusätzlich über Aktualisieren. Zeitstempel und Datenfehler sind sichtbar. Mehr als 90 Minuten alte aktuelle Werte werden ausgeblendet.
- **BLITZE ON:** öffnet die originale Live-Seite von LightningMaps in einem eigenen App-Fenster beim gewählten Ort. OFF schließt dieses Fenster. Bei einem Zielwechsel wird es geschlossen und kann am neuen Ort erneut eingeschaltet werden. Die Seite steuert ihre Aktualisierung selbst.
- **Uhr und Datum:** laufen nach der Windows-Systemzeit. Jede Ziffer hat eine feste Spaltenbreite, damit beim Sekundenwechsel nichts springt. Der sichtbare F11-Hinweis entfällt; F11/Escape bleiben bedienbar. Tactical Feeds zeigen tatsächliche App-Ereignisse, beispielsweise Wetterabrufe, Zielwechsel und Schalteraktionen; die Liste wird nicht dauerhaft gespeichert.
- **Schlüssel:** Einstellungen im Wetterbereich öffnen den nativen Dialog zum verschlüsselten Speichern oder Löschen des späteren Kachelmann-/Meteologix-Schlüssels.

LightningMaps ist **kein in die Erde eingeblendeter Blitz-Layer**. Der Anbieter untersagt die Einbettung seiner Echtzeitkarte per iframe oder ähnlicher Technik in fremde Webseiten. Die App öffnet daher die unveränderte Originalseite separat. Für einen direkt integrierten Layer wären freigegebene Daten und Nutzungsrechte nötig: https://www.lightningmaps.org/about

Die linke Menüleiste bleibt wie bisher ein statischer Bildbereich. Das U.S.S.-Panda-Raumschiff bleibt optisch erhalten; seine Statuswerte und Quicklaunch sind ab 0.4.0 funktional.

## Änderungen 0.3.1

Grauen Hintergrundbalken der Kartenquellen entfernt; Quellenlinks und Logo bleiben lesbar. Zielliste sammelt Suchtreffer oben und behält vorhandene Ziele inklusive der Startziele. Speicherung im lokalen WebView2-Profil; keine Übertragung der gespeicherten Liste.

## Änderungen 0.3 und Regenradar

README, Starthinweise und Prüfbericht werden zusammen mit jeder neuen Lieferung aktualisiert.

**SYSTEM STATUS ist live:** CPU, RAM, belegter Platz auf dem Windows-Laufwerk, GPU, Netzwerk und Akku werden alle zwei Sekunden lokal gemessen. CPU und Netzwerk benötigen zuerst ein Messintervall. Nicht verfügbare Werte heißen **OFFLINE**; dabei geht es um den jeweiligen Sensor, nicht zwingend die Internetverbindung. Akku-Ladezustand und Netzbetrieb kommen von Windows. Ohne Akku bleibt der Akkubalken leer. RAM/Laufwerk zeigen Prozentwerte, Details in GiB über den Tooltip; RAM zusätzlich unten. DISK ist belegter Speicherplatz, keine Laufwerksgeschwindigkeit. GPU entspricht der höchsten gemessenen Engine-Auslastung über die Adapter; bei fehlendem Windows-/Treiberzähler steht OFFLINE. Netzwerk summiert aktive Ethernet-/WLAN-Schnittstellen; virtuelle Ethernet-Adapter können enthalten sein. Keine Hardwarewerte werden an Wetterdienste gesendet.

**RADAR:** RainViewer liefert ohne Registrierung und API-Key die neueste verfügbare Regenradar-Karte für private Nutzung. RADAR schaltet sie an oder aus. Wetter OFF entfernt sie ebenfalls; Wetter ON stellt die ausgewählte Ebene wieder her. Automatische Metadaten-Aktualisierung alle fünf Minuten, Bildstand und Quelle sichtbar. Der Bildstand bezeichnet die Erzeugung des zusammengesetzten Bildes; einzelne Radare können andere Messzeiten haben. Keine Sekunde-für-Sekunde-Livekarte und keine Vorhersage. Transparente Bereiche können auch fehlende Radar-Abdeckung bedeuten und beweisen keinen trockenen Ort.

Kostenloser Stand laut Übergangsdokumentation: historische Bilder, maximale Kachel-Zoomstufe 7, Universal Blue. Beim näheren Kartenzoom werden die Radarflächen entsprechend vergrößert. Tile-Abrufe werden auf höchstens etwa 71 neue Kacheln pro Minute begrenzt; dadurch kann der Aufbau kurz dauern. Die IP-weite Grenze kann durch weitere Anwendungen beeinflusst werden. Fehler und über 90 Minuten alte Bilder werden angezeigt beziehungsweise ausgeblendet. Regenradar startet ausgeschaltet.

Recherche: OpenWeather bietet Wolkenkarten mit Konto/API-Key im kostenlosen Angebot. RainViewer hat Satelliten-IR eingestellt. Auf Wunsch wurde stattdessen das kostenlose **Regenradar** eingebunden; keine zusätzliche Wolkenkarten-Registrierung erforderlich.

- RainViewer API: https://www.rainviewer.com/api.html
- Kacheln/Bildstände: https://www.rainviewer.com/api/weather-maps-api.html
- Einschränkungen ab 2026: https://www.rainviewer.com/api/transition-faq.html
- Alternative Wolkenkarten: https://openweathermap.org/api/weathermaps und https://openweathermap.org/price

## Bauen

Voraussetzungen: Windows 11 x64, .NET 8 SDK x64 und Internetzugriff für NuGet. Für Visual Studio die WinUI-/Windows-Entwicklungswerkzeuge einschließlich Windows SDK installieren. In PowerShell im Projektordner:

```powershell
dotnet publish .\PandaLcarsTactical.csproj -c Release -p:Platform=x64 -o .\dist
.\dist\PandaLcarsTactical.exe
```

Alternativ `./Build.ps1 -Start`. `-DotnetPath` wählt ein SDK; das Skript erkennt auch `.build-tools/dotnet` im übergeordneten Arbeitsordner. Dieses lokale SDK ist nicht im Quellpaket enthalten. Der komplette Ausgabeordner ist die weitergebbare App. Es handelt sich um eine entpackt startbare Desktop-App, noch keinen signierten Installer.

Tests im übergeordneten Ordner:

```powershell
dotnet run --project .\PandaLcarsTactical.Tests
```

## Struktur

| Datei/Ordner | Aufgabe |
| --- | --- |
| MainWindow.xaml / .cs | WinUI-Fenster, WebView2, validierte Nachrichten, Wetterabrufe, Vollbild, Schlüsseldialog |
| LightningWindow.cs | Separates Fenster für die originale LightningMaps-Seite |
| Assets/Web/index.html, dashboard.css, dashboard.js | Lokale responsive LCARS-Oberfläche und Kartenbedienung |
| Assets/Web/Cesium | Gebündeltes Cesium 1.133.0 einschließlich Basiskarte, Worker und Lizenzhinweisen |
| Assets/tactical-reference.png | Unverändertes Originalmockup |
| Weather/IWeatherProvider.cs | Anbieterunabhängige Orts-, Wetter- und Vorhersagemodelle |
| Weather/OpenMeteoProvider.cs | Validierter HTTPS-Abruf für den ausgewählten Ort |
| SystemInfo/SystemMonitor.cs | Native Windows-Messwerte und GPU-Leistungszähler |
| Weather/RainViewerProvider.cs | Validierte Radar-Metadaten; nur freigegebener HTTPS-Host |
| Weather/PlaceSearch.cs | Open-Meteo-Ortssuche |
| Weather/KachelmannProvider.cs | Noch nicht aktivierter Anbieteradapter |
| Security/ApiKeyStore.cs | Windows-DPAPI-Schlüsselablage |
| ../PandaLcarsTactical.Tests | Tests der Wetterdatenvalidierung |
| docs/VERIFICATION.md | Durchgeführte und offene Prüfungen |

## Daten und Sicherheit

Kachelmann-/Meteologix ist noch nicht aktiv. Der Schlüssel wird unter `%LOCALAPPDATA%\PandaLcarsTactical\kachelmann.key` mit Windows DPAPI für den aktuellen Benutzer verschlüsselt. Er wird weder an das Web-Dashboard noch momentan an einen Wetterdienst geschickt. Für die Anbindung müssen vertragliche Endpunkte, Antwortformate und Rechte vorliegen; diese werden nicht geraten. Danach implementiert der Adapter `IWeatherProvider`. Geografische Radarflächen benötigen zusätzlich georeferenzierte Daten und Zeitstempel.

Die lokale Oberfläche erhält ausschließlich Wetter-/Ortsdaten. Die fremde LightningMaps-Seite läuft in einem getrennten WebView2-Fenster ohne die Nachrichtenbrücke des Dashboards. WebView2 speichert seine Profile unter dem lokalen App-Datenordner. Ortsabfragen gehen an Open-Meteo, Detailkarten an OpenStreetMap, aktiviertes Regenradar an RainViewer; LightningMaps wird erst beim Einschalten geöffnet. Die mitgelieferte grobe Erdbasiskarte benötigt kein Netz, aktuelle Werte und detaillierte Karten schon. Ein Cesium-Ion-Schlüssel ist nicht erforderlich.

## Quellen und Lizenzen

- CesiumJS: https://cesium.com/platform/cesiumjs/ — Lizenz und Drittanbieterhinweise in `Assets/Web/Cesium`.
- OpenStreetMap: https://www.openstreetmap.org/copyright — Kartenzuordnung bleibt sichtbar.
- Open-Meteo: https://open-meteo.com/en/docs und https://open-meteo.com/en/terms — Modellwerte, kostenlose API für nichtkommerzielle Nutzung.
- Ortssuche: https://open-meteo.com/en/docs/geocoding-api
- LightningMaps: https://www.lightningmaps.org/about
- Microsoft WinUI: https://learn.microsoft.com/windows/apps/package-and-deploy/unpackage-winui-app



Prüfung 27.09.2026: Version 0.3.1 in der App kontrolliert; Suchziel oben, bestehende Liste erhalten, Speicherung nach Neustart bestätigt, Detailkarte ohne grauen Quellenbalken.



## Neu in 0.4.0

QUICK LAUNCH enthält Kronen Zeitung, DER STANDARD, Heute, Facebook und OE24. Ein Klick öffnet die Website innerhalb von PANDA LCARS. „HAUPTANSICHT“ schließt die Webansicht; „ZURÜCK“ folgt dem Webseitenverlauf. „IN FIREFOX ÖFFNEN“ ist eine bewusste optionale Übergabe an Firefox. Die Browserentscheidung und Einschränkungen stehen in [docs/BROWSER.md](docs/BROWSER.md).

„+ WEITERE“ fragt Name und Webadresse ab. Ohne Protokoll wird https ergänzt. Eigene Links können über das Zahnrad im Quicklaunch-Kopf bearbeitet oder nach einem zweiten Löschklick entfernt werden. Die fünf Standardlinks bleiben erhalten. Maximal acht Kacheln stehen gleichzeitig in zwei Reihen; weitere Links sind per Mausrad, Scrollleiste, Tastatur oder Touch erreichbar. Lange Namen erscheinen vollständig im Tooltip.

Die Linkdatei liegt unter `%LOCALAPPDATA%\PandaLcarsTactical\quicklaunch.json`. Programmdateien und Benutzerdaten sind getrennt: Eine neue Programmversion löscht eigene Links, bestehende Ortsziele oder Browserprofile nicht. Beschädigte Linkdateien werden nicht automatisch überschrieben; der Fehler wird angezeigt. Vor einer manuellen Reparatur die Datei sichern. Maximal 500 eigene Links sind möglich.

**U.S.S.-Panda-Status:** WORK bei Windows- oder App-Eingaben; STANDBY nach 180 Sekunden ohne Eingabe. WARP entsteht bei mindestens 75 % CPU oder GPU über zehn Sekunden oder über den WARP-Schalter. Unter 55 % Last geht automatischer WARP nach fünf Sekunden zurück zu WORK; STANDBY hat Vorrang und löscht manuellen WARP. Gemessen wird die aktuelle Windows-Sitzung, ohne Tastaturinhalte oder Mauspositionen aufzuzeichnen. LOAD zeigt den höheren verfügbaren CPU-/GPU-Wert, IDLE die Inaktivität und SINCE den letzten Zustandswechsel. Bei nicht verfügbaren Messwerten wird kein Wert erfunden. WARP ist eine Anzeige und verändert weder Taktraten noch Windows-Energieoptionen.

**Zoom:** Mausradbewegungen werden normalisiert, auf ca. fünf Prozent pro Schritt begrenzt und weich interpoliert. Große Eingabesalven sind zusätzlich begrenzt. Untergrenze 500 m, Obergrenze 35.000 km. Ziehen, Center, Earth und Track unterbrechen den sanften Übergang. Touch-Pinch bleibt die native Cesium-Steuerung.

**Icon:** Der vom Benutzer freigegebene Panda mit Spocks Spitzohren und orangefarbenem Ring ist in EXE, Appfenster und Taskleiste eingebunden. Keine Hand/Finger. Das bisherige Raumschiffbild wurde nicht ersetzt.

## Bauen und prüfen

.NET 8 SDK x64 erforderlich. Im Projektordner `Build.ps1` ausführen; bei portablem SDK `-DotnetPath` angeben. Das Ergebnis liegt in `dist`. Alle Dateien des veröffentlichten Ordners gehören zusammen. `Build-Icon.ps1` ist nur nötig, wenn die freigegebene Icon-PNG geändert wurde.

Tests: `dotnet run --project ../PandaLcarsTactical.Tests -c Release`; Zoom: `node ../PandaLcarsTactical.Tests/zoom.test.cjs`. UI-Regression: `dashboard.test.cjs` benötigt Playwright und installiertes Microsoft Edge; den Playwright-Modulpfad bei Bedarf über `PLAYWRIGHT_MODULE` angeben. Die UI-Regression verwendet eine simulierte native Brücke und prüft die reale Cesium-Oberfläche; die C#-Tests prüfen die tatsächliche Dateispeicherung.

Vollständiges Änderungsprotokoll: [CHANGELOG.md](CHANGELOG.md). Durchgeführte Prüfungen und Grenzen: [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Künftige Updates

Empfohlen: einmalige Installation mit festem Programmordner und Verknüpfungen, danach Installation neuer Versionen am selben Ort. Später kann ein „Nach Updates suchen“-Dialog signierte bzw. verifizierte Pakete von einem festen Downloadort beziehen und eine Rückfallversion behalten. Version 0.4.0 ist noch eine portable Windows-Ausgabe ohne automatischen Updater.
