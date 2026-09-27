"use strict";
const $ = id => document.getElementById(id);
const vienna = {name:"Wien",latitude:48.2082,longitude:16.3738,country:"Österreich",region:""};
let place={...vienna}, report=null, weatherEnabled=true, lightningOn=false, tracking=false, viewer, target, osm, pendingWeather=null, pendingSearch=null, generation=0, forecastTimer;
const selections={heat:true,clouds:false,rain:false};
const defaultTargets=[vienna,{name:"Delhi",latitude:28.6139,longitude:77.209,country:"Indien"},{name:"Pune",latitude:18.5204,longitude:73.8567,country:"Indien"},{name:"Pandharpur",latitude:17.6778,longitude:75.3278,country:"Indien"},{name:"Ahmedabad",latitude:23.0225,longitude:72.5714,country:"Indien"},{name:"Berlin",latitude:52.52,longitude:13.405,country:"Deutschland"}];
const targetKey=p=>[p.name.trim().toLocaleLowerCase("de-AT"),p.latitude.toFixed(5),p.longitude.toFixed(5)].join("|");
function mergeTargets(first,existing){
 const seen=new Set();return [...first,...existing].filter(p=>{const key=targetKey(p);if(seen.has(key))return false;seen.add(key);return true;});
}
function validSavedTarget(p){return p&&typeof p.name==="string"&&p.name.trim().length>0&&p.name.length<=160&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180&&(p.country===undefined||typeof p.country==="string")&&(p.region===undefined||typeof p.region==="string");}
let targetList=[...defaultTargets],targetStorageFailed=false;
try{const stored=JSON.parse(localStorage.getItem("panda.targets.v1")||"[]");if(Array.isArray(stored))targetList=mergeTargets(stored.filter(validSavedTarget),defaultTargets);}catch{targetStorageFailed=true;}
function rememberTargets(results){
 targetList=mergeTargets(results,targetList);
 try{localStorage.setItem("panda.targets.v1",JSON.stringify(targetList));}catch{eventFeed("Zielliste bleibt für diese Sitzung erhalten; dauerhaftes Speichern fehlgeschlagen.",true);}
 renderTargets(targetList);$("destinations").scrollTop=0;
}
const send=(type,data={})=>window.chrome?.webview?.postMessage({type,...data});
const pressed=(id,on)=>$(id).setAttribute("aria-pressed",String(on));
const f=n=>new Intl.NumberFormat("de-AT",{maximumFractionDigits:1}).format(n);
function eventFeed(message,error=false){
 const row=document.createElement("li");if(error)row.className="error";
 const time=document.createElement("time");time.textContent=new Date().toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"});
 const text=document.createElement("span");text.textContent=message;
 row.append(time,text);$("feeds").prepend(row);
 while($("feeds").children.length>60)$("feeds").lastElementChild.remove();
}
function clock(){
 const now=new Date(),digits=now.toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
 if($("clock").children.length!==8){$("clock").replaceChildren(...Array.from({length:8},()=>document.createElement("span")));}
 [...$("clock").children].forEach((cell,i)=>cell.textContent=digits[i]);$("clock").setAttribute("aria-label",digits);
 $("date").textContent=now.toLocaleDateString("de-AT",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
}
function distance(p){
 const r=Math.PI/180,a=vienna.latitude*r,b=p.latitude*r;
 const x=Math.sin((b-a)/2)**2+Math.cos(a)*Math.cos(b)*Math.sin((p.longitude-vienna.longitude)*r/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
function drawArtwork(){
 for(const host of document.querySelectorAll("[data-crop]")){
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox",host.dataset.crop);svg.setAttribute("preserveAspectRatio","none");
  const image=document.createElementNS("http://www.w3.org/2000/svg","image");
  image.setAttribute("href","../tactical-reference.png");image.setAttribute("width","1536");image.setAttribute("height","1024");
  svg.append(image);host.prepend(svg);
 }
}
function renderTargets(results){
 $("destinations").replaceChildren();
 for(const p of results){
  const button=document.createElement("button");button.className="destination";button.type="button";
  const name=document.createElement("span");name.textContent=p.name+(p.country?", "+p.country:"");
  const km=document.createElement("small");km.textContent=Math.round(distance(p)).toLocaleString("de-AT")+" km";
  button.title=[p.name,p.region,p.country].filter(Boolean).join(", ");
  button.append(name,km);button.addEventListener("click",()=>selectPlace(p));$("destinations").append(button);
 }
}
function describePlace(){
 const full=[place.name,place.country].filter(Boolean).join(", ");
 $("sectorName").textContent=full.toUpperCase();$("locationName").textContent=full.toUpperCase();
 $("hudName").textContent=place.name.toUpperCase();$("weatherPlace").textContent=place.name.toUpperCase();
 const coordinates=Math.abs(place.latitude).toFixed(4)+"° "+(place.latitude<0?"S":"N")+"  /  "+Math.abs(place.longitude).toFixed(4)+"° "+(place.longitude<0?"W":"E");
 $("hudCoordinates").textContent=coordinates;$("locationCoords").textContent=coordinates.replace("  /  ","\n");
 $("locationDistance").textContent=Math.round(distance(place)).toLocaleString("de-AT")+" km Luftlinie ab Wien";
}
function selectPlace(p){
 rememberTargets([p]);generation++; pendingWeather=null; send("cancelWeather");place={...p};report=null;describePlace();renderWeather();renderForecast();
 if(viewer){viewer.trackedEntity=undefined;tracking=false;pressed("track",false);target.position=Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude);fly(220000);renderGlobeWeather();}
 eventFeed("Ziel gesetzt: "+p.name);loadWeather();
 if(lightningOn){send("lightning",{on:false});lightningOn=false;syncLightning();eventFeed("Blitzfenster geschlossen: Ziel gewechselt.");}
}
function fly(height){
 if(!viewer)return;
 stopSmoothZoom();
 if(tracking){tracking=false;viewer.trackedEntity=undefined;pressed("track",false);}
 viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(place.longitude,place.latitude,height),orientation:{heading:0,pitch:-Cesium.Math.PI_OVER_TWO,roll:0},duration:1.5});
}
function renderGlobeWeather(){
 const lines=[place.name.toUpperCase()];
 if(weatherEnabled&&report){
  const w=report.current;
  if(selections.heat)lines.push(f(w.temperatureC)+" °C");
  if(selections.clouds)lines.push("Wolken "+f(w.cloudPercent)+" %");
  if(selections.rain)lines.push("Regen "+f(w.precipitationMm)+" mm");
 }
 $("hudWeather").textContent=weatherEnabled?(report?lines.slice(1).join(" · ")||"Keine Wetterebene ausgewählt":"Wetterdaten ausstehend"):"Wetter-Layer OFF";
 if(target){$("cityLabel").textContent=place.name;viewer.scene.requestRender();}
}
function syncSwitches(){
 pressed("weatherOn",weatherEnabled);pressed("weatherOff",!weatherEnabled);
 for(const key of Object.keys(selections)){$(key).disabled=!weatherEnabled;pressed(key,selections[key]);}
 renderGlobeWeather();
}
function setWeather(on){
 if(on===weatherEnabled)return;
 weatherEnabled=on;syncSwitches();syncRadar();eventFeed("Wetter-Layer "+(on?"ON":"OFF"));
}
function syncLightning(){pressed("lightningOn",lightningOn);pressed("lightningOff",!lightningOn);}
function setLightning(on){
 if(on===lightningOn)return;
 lightningOn=on;syncLightning();send("lightning",{on,place});
 eventFeed(on?"LightningMaps: Original-Livefenster geöffnet.":"LightningMaps: Livefenster geschlossen.");
}
function loadWeather(){
 if(pendingWeather)return;
 const id="weather-"+(++generation);pendingWeather=id;
 $("weatherStatus").textContent="Wetter und Vorhersage werden geladen …";
 $("forecastStatus").textContent="Aktualisierung …";
 send("weather",{id,place});
}
function renderWeather(){
 if(!report){$("temperature").textContent="— °C";$("weatherDetails").textContent="Keine aktuellen Werte";renderGlobeWeather();return;}
 const w=report.current;$("temperature").textContent=f(w.temperatureC)+" °C";
 $("weatherDetails").textContent="Wolken "+f(w.cloudPercent)+" % · Regen "+f(w.precipitationMm)+" mm / "+f(w.intervalMinutes)+" Min.\nWind "+f(w.windKmh)+" km/h · Feuchte "+f(w.humidityPercent)+" %\nLuftdruck "+f(w.pressureHpa)+" hPa";
 const stamp=new Date(w.validAt).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit",timeZone:report.timezone});
 $("weatherStatus").textContent="Stand "+stamp+" Ortszeit · Aktualisierung alle 10 Min.";
 renderGlobeWeather();
}
function weatherSymbol(code){
 if(code===0)return ["☀","Klar"];if(code<=3)return ["☁",code===1?"Überwiegend klar":"Bewölkt"];
 if(code<=48)return ["≋","Nebel"];if(code>=95)return ["ϟ","Gewitter"];
 if(code>=71&&code<=77||code===85||code===86)return ["❄","Schnee"];return ["☂","Regen"];
}
function renderForecast(){
 $("forecastRows").replaceChildren();$("forecastPlace").textContent=place.name+" · Ortszeit";
 if(!report){const p=document.createElement("p");p.textContent="Keine aktuelle Vorhersage";$("forecastRows").append(p);return;}
 const currentDate=new Intl.DateTimeFormat("en-CA",{timeZone:report.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 for(let i=0;i<report.daily.length;i++){
  const day=report.daily[i],row=document.createElement("div");row.className="forecast-row";
  const label=document.createElement("span");
  // API dates are local to the selected location, not the Windows time zone.
  const delta=Math.round((Date.parse(day.date+"T12:00:00Z")-Date.parse(currentDate+"T12:00:00Z"))/86400000);
  label.textContent=delta===0?"Heute":delta===1?"Morgen":delta===2?"Übermorgen":day.date;
  const date=document.createElement("small");date.textContent=day.date.slice(8)+"."+day.date.slice(5,7)+".";label.append(date);
  const [symbol,description]=weatherSymbol(day.weatherCode);
  const icon=document.createElement("span");icon.className="weather-icon";icon.textContent=symbol;icon.title=description;icon.setAttribute("aria-label",description);
  const temps=document.createElement("span");temps.className="temps";temps.textContent=Math.round(day.maximumC)+"° / "+Math.round(day.minimumC)+"°";
  row.append(label,icon,temps);$("forecastRows").append(row);
 }
 $("forecastStatus").textContent="Max. / Min. · Open-Meteo · "+report.timezone;
}
window.chrome?.webview?.addEventListener("message",event=>{
 const msg=event.data;
 if(msg.type==="system"){renderSystem(msg.data);return;} 
 if(msg.type==="radar"&&msg.id===pendingRadar){pendingRadar=null;showRadar(msg.data);return;} 
 if(msg.type==="error"&&msg.id===pendingRadar&&pendingRadar){pendingRadar=null;removeRadar();radarStatus("Radar nicht verfügbar · erneut einschalten",true);return;}
 if(msg.type==="weather"&&msg.id===pendingWeather){
  pendingWeather=null;report=msg.data;renderWeather();renderForecast();$("connection").textContent="DATENVERBINDUNG AKTIV";
  eventFeed("Wetter aktualisiert: "+place.name+", "+f(report.current.temperatureC)+" °C.");
 }else if(msg.type==="search"&&msg.id===pendingSearch){
  pendingSearch=null;rememberTargets(msg.data);$("searchStatus").textContent=msg.data.length?msg.data.length+" Treffer oben · bisherige Ziele bleiben erhalten":"Kein neuer Treffer · gespeicherte Ziele bleiben erhalten";
 }else if(msg.type==="error"){
  if(pendingWeather&&msg.id===pendingWeather){pendingWeather=null;report=null;renderWeather();renderForecast();$("weatherStatus").textContent=msg.message;$("forecastStatus").textContent="Keine aktuellen Daten";$("connection").textContent="DATEN NICHT VERFÜGBAR";eventFeed("Wetter: "+msg.message,true);}
  if(pendingSearch&&msg.id===pendingSearch){pendingSearch=null;$("searchStatus").textContent=msg.message;eventFeed("Ortssuche fehlgeschlagen.",true);}
 }else if(msg.type==="lightningClosed"){lightningOn=false;syncLightning();}
});
async function initializeGlobe(){
 try{
  Cesium.Ion.defaultAccessToken="";
  viewer=new Cesium.Viewer("globe",{baseLayer:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,requestRenderMode:true,maximumRenderTimeChange:Infinity});
  viewer.resolutionScale=Math.min(window.devicePixelRatio || 1,2);
  viewer.scene.backgroundColor=Cesium.Color.BLACK;
  viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString("#061b32");
  viewer.scene.screenSpaceCameraController.minimumZoomDistance=500;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=35000000;
  // Remove only the native wheel binding. Pinch and right-drag remain available.
  viewer.scene.screenSpaceCameraController.zoomEventTypes=[Cesium.CameraEventType.RIGHT_DRAG,Cesium.CameraEventType.PINCH];
  viewer.scene.screenSpaceCameraController.inertiaZoom=.35;
  viewer.scene.canvas.addEventListener("wheel",event=>{
   event.preventDefault();
   if(!Number.isFinite(event.deltaY))return;
   beginSmoothZoom(PandaZoom.target(viewer.camera.positionCartographic.height,zoomTarget,event.deltaY,event.deltaMode));
  },{passive:false});
  viewer.scene.canvas.addEventListener("pointerdown",stopSmoothZoom);
  const natural=await Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),{maximumLevel:2});
  const earthLayer=viewer.imageryLayers.addImageryProvider(natural); earthLayer.brightness=.85; earthLayer.saturation=1.15; viewer.scene.globe.showGroundAtmosphere=false;
  osm=viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider({url:"https://tile.openstreetmap.org/",maximumLevel:19,credit:"© OpenStreetMap contributors"}));osm.alpha=0;
  viewer.camera.percentageChanged=.02;
  viewer.camera.changed.addEventListener(()=>{
   const height=viewer.camera.positionCartographic.height;
   // Natural Earth at global scale; detailed roads and place names close up.
   const alpha=Math.max(0,Math.min(1,(2500000-height)/1800000));
   if(Math.abs(osm.alpha-alpha)>.01){osm.alpha=alpha;viewer.scene.requestRender();}
   $("mapScale").textContent=(height>10000?Math.round(height/1000).toLocaleString("de-AT")+" km":Math.round(height).toLocaleString("de-AT")+" m")+" · "+(alpha>.6?"ORTSKARTE":"ERDANSICHT");
  });
  let tileErrorNoted=false;
  osm.imageryProvider.errorEvent.addEventListener(()=>{if(!tileErrorNoted){eventFeed("Detailkarten nicht erreichbar; Weltkarte bleibt verfügbar.",true);tileErrorNoted=true;}});
  target=viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(place.longitude,place.latitude),point:{pixelSize:11,color:Cesium.Color.ORANGE,outlineWidth:2,outlineColor:Cesium.Color.WHITE,disableDepthTestDistance:Number.POSITIVE_INFINITY},
   viewFrom:new Cesium.Cartesian3(0,-150000,180000)});
  const cityLabel=document.createElement("div");cityLabel.id="cityLabel";cityLabel.className="city-label";cityLabel.textContent=place.name;document.querySelector(".map-wrap").append(cityLabel);
  viewer.scene.postRender.addEventListener(()=>{
   const position=target.position.getValue(viewer.clock.currentTime);
   const pixel=Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene,position);
   const visible=pixel&&new Cesium.EllipsoidalOccluder(viewer.scene.globe.ellipsoid,viewer.camera.positionWC).isPointVisible(position);
   cityLabel.hidden=!visible;
   if(visible){cityLabel.style.left=Math.round(pixel.x+14)+"px";cityLabel.style.top=Math.round(pixel.y-28)+"px";}
  });
  viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(place.longitude,place.latitude,globalHeight())});
  renderGlobeWeather();eventFeed("3D-Globus bereit. CENTER zeigt Österreich / Wien.");
  new ResizeObserver(()=>{viewer.resize();viewer.scene.requestRender();}).observe($("globe"));
 }catch(error){$("mapError").hidden=false;eventFeed("3D-Karte konnte nicht gestartet werden.",true);}
}
function globalHeight(){
 if(!viewer)return 26000000;
 return Math.min(34000000,Math.max(13500000,6378137/Math.sin(viewer.camera.frustum.fovy/2)*1.04-6378137));
}
let zoomTarget=null,zoomFrame=0,zoomTime=0;
function stopSmoothZoom(){cancelAnimationFrame(zoomFrame);zoomFrame=0;zoomTarget=null;}
function beginSmoothZoom(height){
 if(!viewer)return;
 viewer.camera.cancelFlight();
 if(tracking){tracking=false;viewer.trackedEntity=undefined;pressed("track",false);}
 zoomTarget=PandaZoom.clamp(height);
 if(!zoomFrame){zoomTime=performance.now();zoomFrame=requestAnimationFrame(advanceZoom);}
}
function advanceZoom(now){
 if(!viewer||zoomTarget===null){zoomFrame=0;return;}
 const camera=viewer.camera,p=camera.positionCartographic;
 let height=PandaZoom.step(p.height,zoomTarget,now-zoomTime);zoomTime=now;
 const done=Math.abs(height-zoomTarget)<Math.max(.05,zoomTarget*.0001);
 if(done)height=zoomTarget;
 camera.setView({destination:Cesium.Cartesian3.fromRadians(p.longitude,p.latitude,height),orientation:{heading:camera.heading,pitch:camera.pitch,roll:camera.roll}});
 viewer.scene.requestRender();
 if(done){zoomFrame=0;zoomTarget=null;}else zoomFrame=requestAnimationFrame(advanceZoom);
}
function zoom(factor){if(viewer)beginSmoothZoom((zoomTarget??viewer.camera.positionCartographic.height)*factor);}
$("zoomIn").onclick=()=>zoom(.88);$("zoomOut").onclick=()=>zoom(1/.88);
$("center").onclick=()=>{fly(160000);eventFeed("Karte auf "+place.name+" zentriert.");};
$("earth").onclick=()=>{fly(globalHeight());eventFeed("Gesamte Weltkugel angezeigt.");};
$("track").onclick=()=>{
 stopSmoothZoom();
 if(!viewer||!target)return;tracking=!tracking;pressed("track",tracking);
 viewer.trackedEntity=tracking?target:undefined;viewer.scene.requestRender();eventFeed("TRACK "+(tracking?"ON: Kamera folgt "+place.name:"OFF: freie Kamera"));
};
$("sensors").onclick=()=>{const on=$("sensors").getAttribute("aria-pressed")!=="true";pressed("sensors",on);$("mapHud").hidden=!on;eventFeed("Ortsinformationen "+(on?"eingeblendet":"ausgeblendet"));};
$("layers").onclick=()=>{const on=$("layers").getAttribute("aria-pressed")!=="true";pressed("layers",on);$("layerTray").hidden=!on;};
$("weatherOn").onclick=()=>setWeather(true);$("weatherOff").onclick=()=>setWeather(false);
$("lightningOn").onclick=()=>setLightning(true);$("lightningOff").onclick=()=>setLightning(false);
for(const key of Object.keys(selections))$(key).onclick=()=>{selections[key]=!selections[key];pressed(key,selections[key]);renderGlobeWeather();};
$("settings").onclick=()=>send("settings");
$("refresh").onclick=()=>{pendingWeather=null;send("cancelWeather");loadWeather();};
$("fullscreen").onclick=()=>send("fullscreen");
$("clearFeeds").onclick=()=>{$("feeds").replaceChildren();eventFeed("Ereignisliste geleert.");};
$("searchForm").onsubmit=e=>{
 e.preventDefault();const query=$("search").value.trim();if(query.length<2)return;
 send("cancelSearch");pendingSearch="search-"+(++generation);$("searchStatus").textContent="Suche läuft …";send("search",{id:pendingSearch,query});
};
$("search").addEventListener("input",()=>{
 if(!$("search").value.trim()){pendingSearch=null;send("cancelSearch");renderTargets(targetList);$("searchStatus").textContent="Ziel wählen · Entfernung ab Wien";}
});

window.addEventListener("online",()=>{eventFeed("Netzwerk wieder verfügbar.");loadWeather();});
window.addEventListener("offline",()=>{eventFeed("Netzwerkverbindung unterbrochen.",true);$("connection").textContent="OFFLINE";});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){clock();if(!report||Date.now()-new Date(report.current.validAt).getTime()>600000)loadWeather();}});
drawArtwork();clock();setInterval(clock,1000);describePlace();renderTargets(targetList);syncSwitches();syncLightning();
if(targetStorageFailed)eventFeed("Gespeicherte Ziele konnten nicht gelesen werden.",true);
eventFeed("PANDA LCARS gestartet. Uhrzeit folgt Windows.");loadWeather();initializeGlobe();
forecastTimer=setInterval(loadWeather,600000);
setInterval(()=>{if(report&&Date.now()-new Date(report.current.validAt).getTime()>5400000){report=null;renderWeather();renderForecast();$("weatherStatus").textContent="Daten veraltet · erneut laden";eventFeed("Veraltete Wetterwerte ausgeblendet.",true);}},60000);





let pendingRadar=null,radarWanted=false,radarLayer=null,radarFrame=null,lastRadarRequest=0,lastSystem=Date.now();
let nextRadarTileAt=0;
function renderSystem(s){
 lastSystem=Date.now();
 const percent=n=>Number.isFinite(n)?Math.round(n)+" %":"OFFLINE";
 const gib=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?f(a)+" / "+f(b)+" GiB":"Nicht verfügbar";
 for(const key of ["cpu","ram","disk","gpu","battery"]){
  const value=s[key],bar=$(key+"Bar");bar.value=Number.isFinite(value)?value:0;bar.style.opacity=Number.isFinite(value)?1:.25;
  $(key+"Value").textContent=percent(value);bar.title=percent(value);
 }
 $("ramValue").title=gib(s.ramUsedGb,s.ramTotalGb);$("ramBar").title=$("ramValue").title;
 $("diskValue").title=gib(s.diskUsedGb,s.diskTotalGb);$("diskBar").title=$("diskValue").title;
 $("diskName").textContent="DISK "+s.diskName;
 $("gpuValue").title="Stärkste GPU-Engine über alle Adapter; OFFLINE = Windows-Zähler nicht verfügbar";
 $("networkValue").textContent=Number.isFinite(s.downloadMbps)&&Number.isFinite(s.uploadMbps)?"↓ "+f(s.downloadMbps)+"  ↑ "+f(s.uploadMbps)+" Mbit/s":"Messung …";
 $("batteryValue").title=s.power;
 $("systemStatus").textContent=s.power+" · RAM "+gib(s.ramUsedGb,s.ramTotalGb);
 $("systemStatus").title="Windows · alle 2 Sekunden · "+s.power+" · Systemlaufwerk "+gib(s.diskUsedGb,s.diskTotalGb);
}
function radarStatus(message,error=false){
 const host=$("radarStatus");host.hidden=false;host.replaceChildren(document.createTextNode(message+" · "));
 const link=document.createElement("a");link.href="https://www.rainviewer.com/";link.target="_blank";link.rel="noopener";link.textContent="RainViewer";host.append(link);
 if(error)eventFeed(message,true);
}
function removeRadar(){if(radarLayer&&viewer){viewer.imageryLayers.remove(radarLayer,true);radarLayer=null;viewer.scene.requestRender();}}
function requestRadar(){
 if(!radarWanted||!weatherEnabled||!viewer||pendingRadar)return;
 pendingRadar="radar-"+(++generation);lastRadarRequest=Date.now();radarStatus("Regenradar wird geladen …");send("radar",{id:pendingRadar});
}
function showRadar(frame){
 if(!radarWanted||!weatherEnabled||!viewer)return;
 radarFrame=frame;removeRadar();
 const provider=new Cesium.UrlTemplateImageryProvider({url:frame.url,maximumLevel:7,tilingScheme:new Cesium.WebMercatorTilingScheme(),credit:new Cesium.Credit('<a href="https://www.rainviewer.com/" target="_blank">Weather data by RainViewer</a>')});
 const original=provider.requestImage.bind(provider);
 provider.requestImage=(x,y,level,request)=>{
  if(Date.now()<nextRadarTileAt)return undefined;
  const image=original(x,y,level,request);
  if(image!==undefined)nextRadarTileAt=Date.now()+850; // <= 71 new tile requests/minute across refreshes.
  return image;
 };
 let failed=false;provider.errorEvent.addEventListener(()=>{if(!failed){failed=true;radarStatus("Radarkacheln nicht verfügbar oder unvollständig",true);}});
 radarLayer=viewer.imageryLayers.addImageryProvider(provider);radarLayer.alpha=.7;
 const stamp=new Date(frame.generatedAt).toLocaleString("de-AT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 radarStatus("Regenradar · Bildstand "+stamp+" · Abdeckung regional");viewer.scene.requestRender();eventFeed("Regenradar geladen · "+stamp);
}
function syncRadar(){
 pressed("radar",radarWanted&&weatherEnabled);$("radar").disabled=!weatherEnabled;
 if(!radarWanted||!weatherEnabled){pendingRadar=null;removeRadar();$("radarStatus").hidden=true;return;}
 requestRadar();
}
$("radar").onclick=()=>{radarWanted=!radarWanted;syncRadar();eventFeed("Regenradar "+(radarWanted?"ON":"OFF"));};
send("system");
setInterval(()=>{
 send("system");
 if(Date.now()-lastSystem>10000){for(const key of ["cpu","ram","disk","gpu","battery"]){$(key+"Value").textContent="OFFLINE";$(key+"Bar").value=0;}$("networkValue").textContent="OFFLINE";$("systemStatus").textContent="Systemmessung OFFLINE";}
 if(radarWanted&&weatherEnabled&&viewer){
  viewer.scene.requestRender();
  if(radarFrame&&Date.now()-new Date(radarFrame.generatedAt).getTime()>5400000){removeRadar();radarFrame=null;radarStatus("Radarbild veraltet",true);}
  if(Date.now()-lastRadarRequest>300000)requestRadar();
 }
},2000);

document.addEventListener("keydown",event=>{if(event.key==="F11"){event.preventDefault();send("fullscreen");}else if(event.key==="Escape"&&!document.querySelector("dialog[open]")){event.preventDefault();send("escape");}});


