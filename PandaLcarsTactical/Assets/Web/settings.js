"use strict";
(() => {
 const $ = id => document.getElementById(id);
 const send = (type, data = {}) => window.chrome?.webview?.postMessage({type, ...data});
 const dialog = $("appSettings");
 for (const id of ["openAppSettings", "serviceSummary"]) $(id).onclick = () => { dialog.showModal(); send("services"); send("displaySettings"); };
 for (const button of document.querySelectorAll("[data-action]")) {
  button.title = button.getAttribute("aria-label");
  button.onclick = () => {
   send("menu", {action:button.dataset.action, place});
  };
 }
 $("saveDisplay").onclick = () => { $("displayStatus").textContent = "Wird gespeichert …"; send("displaySave", {monitorId:$("startMonitor").value, fullscreen:$("startFullscreen").checked, autostart:$("startAutostart").checked}); };
 $("updateCheck").onclick = () => send("updateCheck");
 $("updateDownload").onclick = () => send("updateDownload");
 $("closeAppSettings").onclick = () => dialog.close();
 $("weatherSettings").onclick = () => { dialog.close(); send("settings"); };
 window.chrome?.webview?.addEventListener("message", ({data:m}) => {
  if (m.type === "update") {
   $("updateStatus").textContent = m.message;
   $("updateCheck").disabled = m.state === "checking" || m.state === "downloading";
   $("updateDownload").disabled = m.state !== "available";
   $("updateCheck").textContent = m.state === "available" ? "UPDATE VORHANDEN" : "UPDATES SUCHEN";
   eventFeed(m.message, m.state === "error"); return;
  }
  if (m.type === "settingsError") { $("displayStatus").textContent = m.message; eventFeed(m.message,true); return; }
  if (m.type === "displaySettings") {
   const select = $("startMonitor"); select.replaceChildren(new Option("Automatisch: Monitor 3", "auto"));
   for (const monitor of m.monitors) select.add(new Option(monitor.name + " · " + monitor.width + " × " + monitor.height + (monitor.primary ? " · Hauptmonitor" : ""), monitor.id));
   if (m.monitorId !== "auto" && !m.monitors.some(x => x.id === m.monitorId)) select.add(new Option("Gespeicherter Monitor · nicht angeschlossen",m.monitorId));
   select.value = m.monitorId; $("startFullscreen").checked = m.fullscreen; $("startAutostart").checked = m.autostart;
   $("displayStatus").textContent = m.warning ?? "Aktuelle Einstellungen geladen."; return;
  }
  if (m.type === "serviceError") { $("serviceWarning").textContent = m.message; return; }
  if (m.type !== "services") return;
  $("serviceRows").replaceChildren();
  $("serviceSummary").textContent = "DIENSTE · IM BROWSER ÖFFNEN";
  $("serviceWarning").textContent = m.warning ?? "";
  for (const s of m.data) {
   const row = document.createElement("section"); row.className = "service-row";
   const title = document.createElement("strong"); title.textContent = s.name;
   const open = document.createElement("button"); open.textContent = "IM BROWSER ÖFFNEN";
   open.onclick = () => send("serviceOpen", {serviceId:s.id});
   row.append(title, open); $("serviceRows").append(row);
  }
 });
 send("services");
 send("updateCheck");
})();
