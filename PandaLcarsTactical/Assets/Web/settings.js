"use strict";
(() => {
 const $ = id => document.getElementById(id);
 const send = (type, data = {}) => window.chrome?.webview?.postMessage({type, ...data});
 const dialog = $("appSettings");
 for (const id of ["openAppSettings", "serviceSummary"]) $(id).onclick = () => { dialog.showModal(); send("services"); };
 $("closeAppSettings").onclick = () => dialog.close();
 $("weatherSettings").onclick = () => { dialog.close(); send("settings"); };
 window.chrome?.webview?.addEventListener("message", ({data:m}) => {
  if (m.type === "serviceError") { $("serviceWarning").textContent = m.message; return; }
  if (m.type !== "services") return;
  $("serviceRows").replaceChildren();
  const active = m.data.filter(s => s.enabled);
  $("serviceSummary").textContent = active.length ? "DIENSTE · " + active.length + " IM BROWSER · STATUS ?" : "DIENSTE · NICHT EINGERICHTET";
  $("serviceWarning").textContent = m.warning ?? "";
  for (const s of m.data) {
   const row = document.createElement("section"); row.className = "service-row";
   const title = document.createElement("strong"); title.textContent = s.name;
   const state = document.createElement("small"); state.textContent = s.status;
   const open = document.createElement("button"); open.textContent = s.enabled ? "DIENST / ANMELDUNG ÖFFNEN" : "IM BROWSER EINRICHTEN";
   open.onclick = () => send("serviceOpen", {serviceId:s.id});
   const remove = document.createElement("button"); remove.textContent = "ZUORDNUNG ENTFERNEN"; remove.disabled = !s.enabled;
   remove.onclick = () => send("serviceRemove", {serviceId:s.id});
   row.append(title, state, open, remove); $("serviceRows").append(row);
  }
 });
 send("services");
})();
