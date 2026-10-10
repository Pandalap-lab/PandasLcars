"use strict";
(()=>{
 const button=document.createElement("button");button.id="lightningToggle";button.textContent="BLITZE";button.setAttribute("aria-pressed","false");
 $("lightningOpen").before(button);
 const status=document.createElement("div");status.id="satelliteStatus";status.setAttribute("role","status");$("radarStatus").after(status);
 const badge=document.createElement("div");badge.id="satelliteBadge";document.querySelector(".map-wrap").append(badge);
 const lightningInfo=document.createElement("div");lightningInfo.id="lightningInfo";document.querySelector('.location').append(lightningInfo);
 const localTime=t=>new Date(t).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
 let received=null;
 let wanted=false,points=null,frame=null,pending=false,next=0,error="";
 let cloud=null,cloudFrame=null,cloudPending=false,cloudNext=0,cloudError="",cloudTime=null;
 const stamp=t=>new Date(t).toLocaleString("de-AT",{timeZone:"Europe/Vienna",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 const stale=(t,minutes)=>!t||Date.now()-new Date(t).getTime()>minutes*60000;
 const earth=()=>typeof viewer!=="undefined"&&viewer&&earthMotion.earth;
 function clearPoints(){if(points&&viewer){viewer.scene.primitives.remove(points);points=null;viewer.scene.requestRender();}}
 function clearCloud(){if(cloud&&viewer){viewer.imageryLayers.remove(cloud,true);cloud=null;viewer.scene.requestRender();}}
 function labels(){
  const lines=[];
  const period=frame?stamp(frame.from)+'–'+localTime(frame.to):'noch keine Daten';
  const update=!wanted?'ausgeschaltet':!earth()?'pausiert · nur Earth':window.pandaInternetOnline===false?'pausiert · offline':document.hidden?'pausiert · Fenster inaktiv':pending?'Abruf läuft …':next>Date.now()?localTime(next):'steht an';
  lightningInfo.textContent='BLITZE · EUMETSAT · Ortszeit Wien\nDaten: '+period+'\nAbruf: '+(received?localTime(received):'—')+' · Nächster: '+update+'\nAlle 5 Min.'+(error?' · '+error:frame&&stale(frame.to,30)?' · Daten veraltet':frame?' · '+frame.points.length.toLocaleString('de-AT')+' Ereignisse':'');
  if(wanted)lines.push(!earth()?"Blitze · nur in Earth-Ansicht":error||(!frame?"Blitze werden geladen …":stale(frame.to,30)?"Blitzdaten veraltet · ausgeblendet":"Blitze · "+stamp(frame.from)+"–"+new Date(frame.to).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"})+" · "+frame.points.length+" Satellitenblitze"+(frame.qualityWarning?" · Qualitätswarnung":"")));
  if(selections.clouds)lines.push(cloudError||(!cloudFrame?"Wolken werden geladen …":stale(cloudFrame.time,90)?"Wolkenbild veraltet · ausgeblendet":"Wolkenmaske · "+stamp(cloudFrame.time)+" · Europa/Afrika"));
  status.textContent=lines.length?lines.join(" | ")+" · EUMETSAT":"";status.hidden=!lines.length||!weatherEnabled;badge.textContent=(window.pandaInternetOnline===false?"OFFLINE · ":"")+lines.join(" | ");badge.hidden=status.hidden;
 }
 function draw(){
  clearPoints();if(!frame||stale(frame.to,30)||!wanted||!weatherEnabled||!earth())return;
  points=viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  for(const p of frame.points){if(!Number.isFinite(p.longitude)||!Number.isFinite(p.latitude))continue;
   points.add({position:Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,1000),pixelSize:4,color:Cesium.Color.fromCssColorString("#ffe56b").withAlpha(.8),outlineColor:Cesium.Color.ORANGE,outlineWidth:1});
  }
  viewer.scene.requestRender();
 }
 function showCloud(data){
  if(!viewer||!weatherEnabled||!selections.clouds||stale(data.time,90))return;
  if(cloud&&cloudTime===data.time)return;clearCloud();cloudTime=data.time;
  // The WMS requires UTC Z notation; DateTimeOffset from the host uses +00:00.
  const wmsTime=new Date(data.time).toISOString().replace('.000Z','Z');
  const provider=new Cesium.WebMapServiceImageryProvider({url:"https://view.eumetsat.int/geoserver/wms",layers:"msg_fes:clm",parameters:{transparent:true,format:"image/png",version:"1.1.1",time:wmsTime},tilingScheme:new Cesium.GeographicTilingScheme(),rectangle:Cesium.Rectangle.fromDegrees(-77,-77,77,77),maximumLevel:6,enablePickFeatures:false,credit:"Wolkenmaske © EUMETSAT"});
  const request=provider.requestImage.bind(provider);
  provider.requestImage=(x,y,level,r)=>{
   const result=request(x,y,level,r);if(!result)return result;
   return Promise.resolve(result).then(img=>{
    const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
    // EUMETSAT msg_clm legend: white=cloud; blue=clear water; green=clear land.
    for(let i=0;i<d.length;i+=4){const white=Math.min(d[i],d[i+1],d[i+2])>220;d[i]=d[i+1]=d[i+2]=235;d[i+3]=white?Math.min(d[i+3],155):0;}
    ctx.putImageData(pixels,0,0);return canvas;
   }).catch(e=>{cloudError="Wolkenkacheln unvollständig oder nicht erreichbar";labels();throw e;});
  };
  provider.errorEvent.addEventListener(()=>{cloudError="Wolkenkacheln unvollständig oder nicht erreichbar";labels();});
  cloud=viewer.imageryLayers.addImageryProvider(provider);cloud.dayAlpha=1;cloud.nightAlpha=1;viewer.scene.requestRender();
 }
 function tick(){
  if(!viewer)return;
  const active=wanted&&weatherEnabled&&earth();
  if(!active||frame&&stale(frame.to,30))clearPoints();else if(frame&&!points)draw();
  if(!selections.clouds||!weatherEnabled||cloudFrame&&stale(cloudFrame.time,90))clearCloud();else if(cloudFrame&&!cloud)showCloud(cloudFrame);
  if(!document.hidden&&window.pandaInternetOnline!==false){
   if(active&&!pending&&Date.now()>=next){pending=true;next=Date.now()+300000;send("lightningData");}
   if(selections.clouds&&weatherEnabled&&!cloudPending&&Date.now()>=cloudNext){cloudPending=true;cloudNext=Date.now()+300000;send("cloudData");}
  }
  labels();
 }
 button.onclick=()=>{wanted=!wanted;pressed(button.id,wanted);tick();};
 $("eumetsatSettings").onclick=()=>{$("appSettings").close();send("eumetsatSettings");};
 window.chrome?.webview?.addEventListener("message",e=>{
  const m=e.data;
  if(m.type==="lightningData"){pending=false;error=m.error||"";if(m.data){frame=m.data;received=Date.now();draw();}}
  if(m.type==="cloudData"){cloudPending=false;cloudError=m.error||"";if(m.data){cloudFrame=m.data;showCloud(m.data);}}
  if(m.type==="lightningReset"){frame=null;clearPoints();pending=false;next=0;error="";}
  tick();
 });
 window.addEventListener("panda-earth-change",tick);setInterval(tick,1000);
 // Recover from a lost host response without flooding the API.
 setInterval(()=>{pending=false;cloudPending=false;},120000);
})();
