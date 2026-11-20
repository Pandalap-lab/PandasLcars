import {countdown, viennaLaunchTime} from "./spacex-mission.mjs";
const css=`#spacexBoard{width:min(1200px,96vw);height:min(740px,94vh);background:#050912;color:#c7e8ff;border:3px solid #a69aff;border-radius:24px;padding:16px;font:15px 'Segoe UI',sans-serif}#spacexBoard::backdrop{background:#000d}#spacexBoard header{display:flex;align-items:center;justify-content:space-between;background:#9994ed;color:#07101b;border-radius:16px;padding:8px 18px;font-size:23px;font-weight:bold}#spacexBoard .sxgrid{display:grid;grid-template-columns:1.2fr 1fr .9fr;grid-template-rows:minmax(0,1fr) minmax(0,.8fr);gap:12px;height:calc(100% - 80px);margin-top:12px}#spacexBoard section{border:2px solid #648dbd;border-radius:16px;padding:12px;overflow:auto;min-width:0}#spacexBoard h2{font-size:17px;color:#f6ae66;margin:0 0 12px}#spacexBoard .sxcount{font-size:32px;color:#4ee5ff;font-variant-numeric:tabular-nums}#spacexBoard .sxrows button{display:block;width:100%;white-space:normal;text-align:left;margin-bottom:5px}#spacexBoard .sxmuted{color:#95a8bb}#spacexBoard .sxwide{grid-column:span 2}#spacexBoard button{cursor:pointer}#spacexBoard .sxclose{background:#162b43;color:white;border:0;border-radius:10px;padding:8px 15px}@media(max-width:850px){#spacexBoard .sxgrid{grid-template-columns:1fr 1fr;overflow:auto}#spacexBoard section{min-height:220px}#spacexBoard .sxwide{grid-column:span 2}}`;
const style=document.createElement("style");style.textContent=css;document.head.append(style);
const dialog=document.createElement("dialog");dialog.id="spacexBoard";
dialog.innerHTML=`<header><span>05 DATA — SpaceX / MISSION CONTROL</span><button class="sxclose" id="sxClose">ZURÜCK ×</button></header><div class="sxgrid"><section><h2>NÄCHSTER RAKETENSTART</h2><h3 id="sxName">Daten werden geladen</h3><p id="sxDetails"></p><p class="sxmuted">COUNTDOWN BIS ZUM START</p><div class="sxcount" id="sxCountdown">--:--:--</div></section><section><h2>STARTKALENDER · WIENER ZEIT</h2><div class="sxrows" id="sxCalendar"></div></section><section><h2>LIVE-TELEMETRIE</h2><p id="sxTelemetry">Keine verifizierte Live-Telemetrie verfügbar.</p><h2>LIVESTREAM</h2><a id="sxStream" hidden target="_blank" rel="noopener noreferrer">Offiziellen Stream öffnen</a></section><section class="sxwide"><h2>MISSIONSSTATUS</h2><p id="sxStatus">Noch keine Mission ausgewählt.</p><p class="sxmuted" id="sxUpdated"></p></section><section><h2>DATENQUELLEN</h2><p>Launch Library 2 · The Space Devs</p><p class="sxmuted">Geplante Starttermine können sich kurzfristig ändern. Telemetrie wird niemals simuliert.</p><button id="sxRefresh">AKTUALISIEREN</button></section></div>`;
document.body.append(dialog);
dialog.querySelector("#sxClose").onclick=()=>dialog.close();
let launches=[],selected=null,loadedAt=0;
const el=id=>dialog.querySelector("#"+id);
function render(){
 const l=selected;
 el("sxName").textContent=l?.name??"Keine aktuellen Startdaten";
 el("sxDetails").textContent=l?[l.rocket,l.pad,viennaLaunchTime(l.launchUtc)].join(" · "):"Verbindung prüfen oder später erneut laden";
 el("sxStatus").textContent=l?.status??"Keine aktuellen Daten";
 el("sxCalendar").replaceChildren(...launches.map((item,i)=>{const b=document.createElement("button");b.textContent=`${i+1}. ${item.name} · ${viennaLaunchTime(item.launchUtc)}`;b.onclick=()=>{selected=item;render()};return b}));
 const link=el("sxStream");link.hidden=!l?.streamUrl;if(l?.streamUrl)link.href=l.streamUrl;
 tick();
}
function tick(){const c=selected?countdown(selected.launchUtc):null;el("sxCountdown").textContent=c?(c.elapsed?"STARTZEIT ERREICHT":`${c.days}T ${String(c.hours).padStart(2,"0")}:${String(c.minutes).padStart(2,"0")}:${String(c.seconds).padStart(2,"0")}`):"--:--:--"}
async function load(){
 el("sxUpdated").textContent="Datenabruf läuft …";
 try{
  const response=await fetch("https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=100&mode=detailed",{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("HTTP "+response.status);
  const data=await response.json();
  const parsed=(data.results??[]).filter(x=>/spacex/i.test(String(x.launch_service_provider?.name??""))).map(x=>({
   id:x.id,name:x.name,rocket:x.rocket?.configuration?.full_name??"Unbekannte Rakete",
   pad:[x.pad?.name,x.pad?.location?.name].filter(Boolean).join(", "),
   launchUtc:x.net,status:x.status?.name??"Geplant",
   streamUrl:(x.vidURLs??[]).map(v=>v.url).find(u=>{try{return new URL(u).protocol==="https:"}catch{return false}})??null
  })).filter(x=>Number.isFinite(Date.parse(x.launchUtc))).sort((a,b)=>Date.parse(a.launchUtc)-Date.parse(b.launchUtc)).slice(0,10);
  launches=parsed;selected=launches.find(x=>x.id===selected?.id)??launches[0]??null;loadedAt=Date.now();
  el("sxUpdated").textContent=(launches.length<5?"Weniger als fünf SpaceX-Starts im abgefragten Datenfenster · ":"")+"Letzter erfolgreicher Abruf: "+new Date(loadedAt).toLocaleString("de-AT",{timeZone:"Europe/Vienna"})+" · Wien";
 }catch(err){el("sxUpdated").textContent="Abruf fehlgeschlagen: "+err.message+(loadedAt?" · Vorherige Daten können veraltet sein":"");}
 render();
}
el("sxRefresh").onclick=load;
document.addEventListener("click",e=>{
 const b=e.target.closest?.('[data-action="data"]');
 if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 dialog.showModal();if(Date.now()-loadedAt>15*60*1000)load();
},true);
setInterval(()=>{if(dialog.open)tick()},1000);
