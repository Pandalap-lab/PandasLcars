"use strict";
(() => {
 const $ = id => document.getElementById(id);
 const send = (type, data = {}) => window.chrome?.webview?.postMessage({type, ...data});
 let links = [], editId = null, sequence = 0, pending = null, mode = null;
 const dialog = $("linkDialog"), manage = $("manageDialog");
 function request(type, data) {
  if (pending) return;
  pending = "link-" + (++sequence);
  $("saveLink").disabled = true;
  send(type, {id:pending, ...data});
 }
 function edit(link) {
  if (pending) return;
  if (manage.open) manage.close();
  editId = link?.id ?? null;
  $("linkDialogTitle").textContent = editId ? "QUICK LAUNCH · LINK BEARBEITEN" : "QUICK LAUNCH · LINK HINZUFÜGEN";
  $("linkName").value = link?.name ?? "";
  $("linkUrl").value = link?.url ?? "";
  $("linkError").textContent = "";
  dialog.showModal(); $("linkName").focus();
 }
 function render() {
  $("quickLinks").replaceChildren();
  for (const link of links) {
   const button = document.createElement("button");
   const badge = document.createElement("span"); badge.className = "link-badge";
   badge.textContent = link.name.slice(0,2).toLocaleUpperCase("de-AT");
   const icon = document.createElement("img"); icon.className = "site-icon"; icon.alt = ""; icon.referrerPolicy = "no-referrer";
   try {
    const url = new URL(link.url), host = url.hostname.replace(/^www\./, "");
    const known = {"argosatlas.com":"https://argosatlas.com/favicon.svg", "oe24.at":"https://www.oe24.at/images/favicon-96x96.png", "derstandard.at":"https://b.staticfiles.at/s/icons/nachrichten/apple-touch-icon-57x57.png"};
    if (url.protocol === "https:") icon.src = known[host] ?? url.origin + "/favicon.ico";
   } catch {}
   icon.onload = () => { badge.hidden = true; }; icon.onerror = () => { icon.hidden = true; badge.hidden = false; };
   const label = document.createElement("span"); label.textContent = link.name;
   button.append(icon, badge, label); button.title = link.name + " · " + link.url;
   button.setAttribute("aria-label", link.name + " in Tactical öffnen");
   button.onclick = () => send("linkOpen", {linkId:link.id});
   $("quickLinks").append(button);
  }
  renderManage(); sizeRows();
 }
 function sizeRows() {
  const grid = $("quickLinks");
  // Up to two complete rows. Small touch screens use one taller row.
  const rows = matchMedia("(pointer:coarse)").matches && grid.clientHeight < 92 ? 1 : 2;
  grid.style.setProperty("--quick-row", Math.max(32, (grid.clientHeight - 4 * (rows - 1)) / rows) + "px");
 }
 function renderManage() {
  $("customLinks").replaceChildren();
  const custom = links.filter(x => x.custom);
  if (!custom.length) $("customLinks").textContent = "Noch keine eigenen Links. Mit + WEITERE einen Link hinzufügen.";
  for (const link of custom) {
   const row = document.createElement("div"); row.className = "manage-row";
   const name = document.createElement("span"); name.textContent = link.name; name.title = link.url;
   const change = document.createElement("button"); change.textContent = "BEARBEITEN"; change.onclick = () => edit(link);
   const remove = document.createElement("button"); remove.textContent = "LÖSCHEN";
   remove.onclick = () => {
    if (remove.dataset.confirm !== "yes") { remove.dataset.confirm = "yes"; remove.textContent = "WIRKLICH LÖSCHEN?"; return; }
    request("linkDelete", {linkId:link.id});
   };
   row.append(name, change, remove); $("customLinks").append(row);
  }
 }
 $("addLink").onclick = () => edit();
 $("manageLinks").onclick = () => { $("manageError").textContent = ""; renderManage(); manage.showModal(); };
 $("closeManage").onclick = () => manage.close();
 $("cancelLink").onclick = () => dialog.close();
 $("linkForm").onsubmit = e => { e.preventDefault(); $("linkError").textContent = ""; request("linkSave", {linkId:editId, name:$("linkName").value, url:$("linkUrl").value}); };
 window.chrome?.webview?.addEventListener("message", ({data:msg}) => {
  if (msg.type === "links") {
   links = msg.data; render();
   if (pending && msg.id === pending) { pending = null; $("saveLink").disabled = false; dialog.close(); eventFeed("Quicklaunch gespeichert."); }
   if (msg.warning) eventFeed(msg.warning, true);
  }
  if (msg.type === "linkError" && msg.id === pending) {
   pending = null; $("saveLink").disabled = false;
   $("linkError").textContent = msg.message; $("manageError").textContent = msg.message;
  }
  if (msg.type === "activity") {
   const s = msg.data;
   if (mode !== s.mode) {
    if (mode) eventFeed("U.S.S. PANDA: " + mode + " → " + s.mode);
    mode = s.mode; $("shipMode").textContent = mode; $("shipMode").dataset.mode = mode;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) $("shipMode").animate([{opacity:.35},{opacity:1}], {duration:700});
   }
   $("shipLoad").textContent = Number.isFinite(s.load) ? Math.round(s.load) + "%" : "—";
   $("shipIdle").textContent = Math.floor(s.idleSeconds) + " s";
   $("shipSince").textContent = new Date(s.since).toLocaleTimeString("de-AT", {hour:"2-digit",minute:"2-digit",second:"2-digit"});
   $("warp").setAttribute("aria-pressed", String(s.warpRequested));
   $("warp").title = s.warpRequested ? "Manuellen WARP-Modus ausschalten" : "WARP einschalten (Statusmodus, kein Übertakten)";
  }
 });
 $("warp").onclick = () => send("warp", {on:$("warp").getAttribute("aria-pressed") !== "true"});
 let lastInput = 0;
 for (const name of ["pointermove", "pointerdown", "keydown", "wheel"])
  document.addEventListener(name, () => { if (Date.now() - lastInput > 1000) { lastInput = Date.now(); send("activity"); } }, {passive:true});
 new ResizeObserver(sizeRows).observe($("quickLinks"));
 send("links");
})();
