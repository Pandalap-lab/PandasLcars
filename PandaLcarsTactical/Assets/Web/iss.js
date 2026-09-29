"use strict";
// SGP4 positions derived from current OMM elements, not direct spacecraft telemetry.
(() => {
 let record=null,epoch=0,nextFetch=0,pending=false,active=false,entities=[],lastTrail=0;
 const status=document.getElementById("issStatus");
 const mark=document.createElement("div");mark.id="issMarker";mark.className="iss-marker";mark.hidden=true;
 const label=document.createElement("span");label.textContent="ISS";const img=document.createElement("img");img.src="iss.png";img.alt="ISS mit Solarpaneelen";img.width=36;img.height=27;mark.append(label,img);document.querySelector(".map-wrap").append(mark);
 const locate=document.createElement("button");locate.id="issLocate";locate.textContent="ISS ANZEIGEN";locate.hidden=true;document.querySelector(".map-wrap").append(locate);
 locate.onclick=()=>{const p=entities[0]?.position?.getValue(viewer.clock.currentTime);if(!p)return;earthMotion.pause(performance.now());const c=Cesium.Cartographic.fromCartesian(p);viewer.camera.flyTo({destination:Cesium.Cartesian3.fromRadians(c.longitude,c.latitude,12000000),duration:1.2});};
 let projectionInstalled=false;
 function project(){
  const p=entities[0]?.position?.getValue(viewer.clock.currentTime);
  const xy=p&&Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene,p);
  const visible=active&&xy&&new Cesium.EllipsoidalOccluder(viewer.scene.globe.ellipsoid,viewer.camera.positionWC).isPointVisible(p);
  mark.hidden=!visible;if(visible){mark.style.left=(xy.x-18)+"px";mark.style.top=(xy.y-31)+"px";}
 }
 function position(ms){
  const date=new Date(ms),pv=satellite.propagate(record,date);
  if(!pv?.position || !Number.isFinite(pv.position.x))throw Error("Bahn nicht berechenbar");
  const p=satellite.eciToGeodetic(pv.position,satellite.gstime(date));
  if(!Number.isFinite(p.height)||p.height<100||p.height>1000)throw Error("Bahn außerhalb des gültigen Bereichs");
  return Cesium.Cartesian3.fromRadians(p.longitude,p.latitude,p.height*1000);
 }
 function clear(){mark.hidden=true;if(typeof viewer!=="undefined"&&viewer){for(const e of entities)viewer.entities.remove(e);viewer.scene.requestRender();}entities=[];lastTrail=0;}
 function update(){
  const on=typeof viewer!=="undefined"&&viewer&&earthMotion.earth&&earthMotion.enabled&&!document.hidden;
  if(!on){if(active)clear();active=false;status.hidden=true;locate.hidden=true;return;}
  active=true;status.hidden=false;locate.hidden=false;locate.disabled=!record;if(!projectionInstalled){viewer.scene.postRender.addEventListener(project);projectionInstalled=true;}const now=Date.now();
  if(!pending&&now>=nextFetch){pending=true;nextFetch=now+300000;window.chrome?.webview?.postMessage({type:"issOrbit"});setTimeout(()=>{pending=false;},30000);}
  if(!record){status.textContent="ISS · Bahndaten werden geladen / nicht verfügbar";return;}
  const age=now-epoch;
  if(age>7*86400000||age< -86400000){locate.disabled=true;clear();status.textContent="ISS · Bahndaten veraltet – Position ausgeblendet";return;}
  try{
   const p=position(now);
   if(!entities.length){
    entities.push(viewer.entities.add({name:"ISS · berechnete Position",position:p}));
    entities.push(viewer.entities.add({polyline:{positions:[],width:1.5,arcType:Cesium.ArcType.NONE,material:Cesium.Color.CYAN.withAlpha(.6)}}));
    entities.push(viewer.entities.add({polyline:{positions:[],width:1.5,arcType:Cesium.ArcType.NONE,material:new Cesium.PolylineDashMaterialProperty({color:Cesium.Color.CYAN.withAlpha(.6),dashLength:12})}}));
   }
   entities[0].position=p;
   if(now-lastTrail>60000){
    const past=[],future=[];
    for(let i=-45;i<=90;i++){const q=position(now+i*60000);if(i<=0)past.push(q);if(i>=0)future.push(q);}
    entities[1].polyline.positions=past;entities[2].polyline.positions=future;lastTrail=now;
   }
   status.textContent="ISS · berechnet · Bahn −45 / +90 Min."+(mark.hidden?" · außerhalb der Ansicht":"")+(age>2*86400000?" · DATEN ÄLTER ALS 2 TAGE":"");
   status.title="Quelle: CelesTrak · Bahnepoche "+new Date(epoch).toLocaleString("de-AT")+" · gestrichelt: Prognose";
   viewer.scene.requestRender();
  }catch{clear();status.textContent="ISS · Position derzeit nicht berechenbar";}
 }
 window.chrome?.webview?.addEventListener("message",({data:m})=>{
  if(m.type!=="issOrbit")return;pending=false;
  if(m.data){try{const omm=JSON.parse(m.data)[0];epoch=Date.parse(omm.EPOCH+(/[zZ]|[+-]\d\d:\d\d$/.test(omm.EPOCH)?"":"Z"));if(!Number.isFinite(epoch)||omm.NORAD_CAT_ID!==25544)throw Error();record=satellite.json2satrec(omm);nextFetch=Date.now()+2*3600000;clear();}catch{record=null;}}
  update();
 });
 window.addEventListener("panda-earth-change",update);document.addEventListener("visibilitychange",update);setInterval(update,1000);
})();
