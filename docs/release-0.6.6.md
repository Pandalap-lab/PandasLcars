# PandasLcars 0.6.6

Die neuen LCARS-Aufgaben vom 07.10.2026 aus Notion sind umgesetzt, ohne PANDAsPrivatKI.

- Internetstatus beim Start: aktive WLAN-/Netzwerkschnittstelle und tatsächliche Erreichbarkeit getrennt prüfen. Ein angemeldetes WLAN oder eine Anmeldeseite allein gilt nicht als funktionierendes Internet. Anzeige INTERNET OFFLINE / INTERNET VERBUNDEN.
- Automatisch erneut prüfen: zunächst alle 10 Sekunden, nach sechs fehlgeschlagenen Prüfungen alle 30 Sekunden; bei bestehender Verbindung alle 30 Sekunden. Browser-Netzwerkereignisse können eine Prüfung anstoßen. Keine überlappenden Prüfungen, begrenzte Laufzeit, Abbruch beim Schließen.
- Nach Wiederverbindung werden Wetter/Vorhersage einschließlich Sonne/Mond, aktive Radaransicht, fehlgeschlagene Detailkarten, fehlende Quicklaunch-Icons, ISS-Daten in EARTH ON, Updateprüfung und eine zuvor fehlgeschlagene Tactical-Web-Navigation erneut geladen. Kameraposition, Ziel und Einstellungen bleiben erhalten. Ein einzelner Wetterdienst-Ausfall überschreibt den Internetstatus nicht.
- Tag/Nacht: Sonnenlicht ausdrücklich festgelegt; der Beleuchtungszustand folgt ausschließlich dem Earth-Modus. Der Radar-Layer hat ausdrücklich denselben Alpha-Faktor auf Tages- und Nachtseite. Nachttextur bleibt auf die Nachtseite beschränkt. Ein-/Ausschalten von Radar verändert weder Uhrzeit noch Earth-Modus.

## Nachweise und Grenzen

Die gemeldete vollständige Verdunkelung durch Radar ließ sich im kontrollierten Vergleich nicht reproduzieren. Der Beleuchtungszustand ist jetzt ausdrücklich abgesichert. Ein neuer Bildtest prüft tatsächliche gerenderte Pixel mit einer Original-RainViewer-Kachel: Tagesseite bleibt hell, gegenüberliegende Nachtseite bleibt dunkel. Dieser Test läuft auch gegen die fertigen Build-Dateien. Die Erde kann je nach Kamerarichtung überwiegend ihre Nachtseite zeigen.

Die neuen Netzwerktests simulieren Offline-Start, verbundenes WLAN ohne Internet, Anmeldeseite, Wiederverbindung, Ausfall eines Prüfservers, erneuten Verbindungsverlust und Abbruch. Windows-WLAN und Norton wurden dafür nicht abgeschaltet. Die Prüfung nutzt https://www.msftconnecttest.com/connecttest.txt, bei Bedarf den bereits verwendeten öffentlichen RainViewer-Endpunkt. Es werden keine persönlichen Daten in den Prüfanfragen übertragen.

Vor Veröffentlichung: Kern- und Oberflächentests, zweiter Durchlauf gegen veröffentlichbare Assets, Installer-/Upgrade-Test aus 0.6.5, Datenerhalt und Deinstallation. Die echte WLAN-Verzögerung beim nächsten Windows-Start bleibt ein Gerätetest; externe Dienste können unabhängig vom Internetzugang ausfallen.

## Installation

Über „Updates suchen“ → „Update laden“ oder PandasLcars-Setup.exe. Keine vorherige Deinstallation nötig. Bei Norton-Prüfung warten und kein zweites Setup starten. Die vorhandene Installation wird nicht automatisch durch den lokalen Testbuild ersetzt.
