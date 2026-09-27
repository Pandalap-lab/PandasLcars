# Browserentscheidung — 0.4.0

Das vorhandene Projekt nutzt WinUI 3 / C# und Microsoft.WindowsAppSDK 1.8. Die Dashboard-Oberfläche verwendet bereits WebView2.

Mozillas dokumentierte GeckoView-Einbettung richtet sich an Android. Es wurde kein offiziell unterstützter GeckoView-Control für WinUI 3 / Windows gefunden. Ein fremdes Firefox-Fenster per Fensterhandle einzuhängen oder veraltete Gecko-Wrapper einzubauen würde Fokus, Lebenszyklus, Updates und Isolation unnötig fragil machen. Solche Verfahren werden nicht verwendet.

Die Entscheidung für dieses Projekt ist daher WebView2 hinter `IEmbeddedBrowser`. Microsoft unterstützt WebView2 direkt in WinUI 3. Eine zukünftige andere Engine kann diese Schnittstelle implementieren, ohne Quicklaunch, Linkverwaltung oder Dashboard umzubauen.

Quellen, geprüft am 27.09.2026:

- Mozilla: [GeckoView Architecture](https://firefox-source-docs.mozilla.org/mobile/android/geckoview/contributor/geckoview-architecture.html)
- Microsoft: [Get started with WebView2 in WinUI 3](https://learn.microsoft.com/en-us/microsoft-edge/webview2/get-started/winui)

## Verhalten

Quicklaunch öffnet eine native Tactical-Ansicht im vorhandenen Hauptfenster. Die Hauptansicht bleibt im Hintergrund erhalten; Schließen zerstört nur den Website-WebView und zeigt das Dashboard wieder. Es gibt keine iframe-Einbettung. Webseiten bleiben Originalseiten einschließlich Cookie-Abfragen, Anmeldung und Anbieterbeschränkungen.

Das Website-Profil `TacticalBrowser` ist von `WebView` (Dashboard) und `LightningBrowser` getrennt. Es gibt weder die lokale Hostzuordnung `panda.local`, noch Hostobjekte oder die WebMessage-Brücke des Dashboards. Nur http/https-Ziele sind zulässig; lokale Dateien, interne App-Adressen, eingebettete Zugangsdaten und ausführbare Schemes werden verworfen. Browser-Sicherheitsprüfungen und Zertifikatsfehler werden nicht umgangen. Kamera, Mikrofon und Standort werden nicht freigegeben.

Bewusst angeklickte neue Fenster werden in derselben Ansicht geöffnet; automatische Popups werden blockiert. Downloads und Sonderfälle wie komplexe Popup-Anmeldungen können über „In Firefox öffnen“ erledigt werden. Der Button startet Firefox ausschließlich auf ausdrücklichen Klick mit getrennten Prozessargumenten. Fehlt Firefox, erscheint ein Hinweis; ein anderer externer Browser wird nicht stillschweigend gestartet. Firefox-Cookies und Anmeldungen werden nicht in die App übernommen.

Cookie-/Login-Flows, Bezahlangebote und dauerhaftes Verhalten aller fremden Websites können sich ändern. Für solche Einschränkungen steht die Firefox-Option bereit.
