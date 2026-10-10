"use strict";
(()=>{
 const button=document.createElement("button");button.id="lightningToggle";button.textContent="BLITZE";button.setAttribute("aria-pressed","false");
 $("lightningOpen").before(button);
 const status=document.createElement("div");status.id="satelliteStatus";status.setAttribute("role","status");$("radarStatus").after(status);
 const badge=document.createElement("div");badge.id="satelliteBadge";document.querySelector(".location").append(badge);
 const lightningInfo=document.createElement("div");lightningInfo.id="lightningInfo";document.querySelector('.location').append(lightningInfo);
 const localTime=t=>new Date(t).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'});
 let received=null;
 let wanted=false,points=null,frame=null,pending=false,next=0,error="";
 let cloud=null,cloudFrame=null,cloudPending=false,cloudNext=0,cloudError="",cloudTime=null,cloudLoading=false,cloudRevision=0;
 const stamp=t=>new Date(t).toLocaleString("de-AT",{timeZone:"Europe/Vienna",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 const stale=(t,minutes)=>!t||Date.now()-new Date(t).getTime()>minutes*60000;
 const earth=()=>typeof viewer!=="undefined"&&viewer&&earthMotion.earth;
 function clearPoints(){if(points&&viewer){viewer.scene.primitives.remove(points);points=null;viewer.scene.requestRender();}}
 function clearCloud(){cloudRevision++;cloudLoading=false;if(cloud&&viewer){viewer.imageryLayers.remove(cloud,true);cloud=null;viewer.scene.requestRender();}}
 function labels(){
  const lines=[];
  const period=frame?stamp(frame.from)+'–'+localTime(frame.to):'noch keine Daten';
  const update=!wanted?'ausgeschaltet':!earth()?'pausiert · nur Earth':window.pandaInternetOnline===false?'pausiert · offline':document.hidden?'pausiert · Fenster inaktiv':pending?'Abruf läuft …':next>Date.now()?localTime(next):'steht an';
  lightningInfo.textContent='BLITZE · EUMETSAT · Ortszeit Wien\nDaten: '+period+'\nAbruf: '+(received?localTime(received):'—')+' · Nächster: '+update+'\nAlle 5 Min.'+(error?' · '+error:frame&&stale(frame.to,30)?' · Daten veraltet':frame?' · '+frame.points.length.toLocaleString('de-AT')+' Ereignisse':'');
  if(wanted)lines.push(!earth()?"Blitze · nur in Earth-Ansicht":error||(!frame?"Blitze werden geladen …":stale(frame.to,30)?"Blitzdaten veraltet · ausgeblendet":"Blitze · "+stamp(frame.from)+"–"+new Date(frame.to).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"})+" · "+frame.points.length+" Satellitenblitze"+(frame.qualityWarning?" · Qualitätswarnung":"")));
  if(selections.clouds)lines.push(cloudError||(!cloudFrame?"Wolken werden geladen …":stale(cloudFrame.time,90)?"Wolkenbild veraltet · ausgeblendet":"Wolkenmaske · "+stamp(cloudFrame.time)+" · Europa/Afrika"));
  status.textContent=lines.length?lines.join(" | ")+" · EUMETSAT":"";status.hidden=!lines.length||!weatherEnabled;badge.textContent=selections.clouds?(cloudError||(!cloudFrame?"WOLKEN · werden geladen …":"WOLKEN · Bild "+stamp(cloudFrame.time)+" · Wien"+(stale(cloudFrame.time,90)?" · veraltet":""))):"WOLKEN · ausgeschaltet";badge.hidden=false;
 }
 function draw(){
  clearPoints();if(!frame||stale(frame.to,30)||!wanted||!weatherEnabled||!earth())return;
  points=viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  for(const p of frame.points){if(!Number.isFinite(p.longitude)||!Number.isFinite(p.latitude))continue;
   points.add({position:Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,1000),pixelSize:4,color:Cesium.Color.fromCssColorString("#ffe56b").withAlpha(.8),outlineColor:Cesium.Color.ORANGE,outlineWidth:1});
  }
  viewer.scene.requestRender();
 }
 async function showCloud(data){
  if(!viewer||!weatherEnabled||!selections.clouds||stale(data.time,90))return;
  if((cloud||cloudLoading)&&cloudTime===data.time)return;clearCloud();cloudTime=data.time;cloudLoading=true;const revision=cloudRevision;
  // The WMS requires UTC Z notation; DateTimeOffset from the host uses +00:00.
  const wmsTime=new Date(data.time).toISOString().replace('.000Z','Z');
  try{
    const query=new URLSearchParams({service:'WMS',request:'GetMap',version:'1.1.1',layers:'msg_fes:clm',styles:'',format:'image/png',transparent:'true',srs:'EPSG:4326',bbox:'-77,-77,77,77',width:'2048',height:'2048',time:wmsTime});
    const response=await fetch('https://view.eumetsat.int/geoserver/wms?'+query,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('Cloud image unavailable');
    const img=await createImageBitmap(await response.blob());
    const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
    // Fade the valid footprint towards missing pixels, without fading tile edges.
    const w=canvas.width,h=canvas.height,dist=new Float32Array(w*h);
    for(let i=0;i<dist.length;i++){const k=i*4;dist[i]=d[k+3]===0||Math.max(d[k],d[k+1],d[k+2])<10?0:10000;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)dist[i]=Math.min(dist[i],dist[i-1]+1);if(y)dist[i]=Math.min(dist[i],dist[i-w]+1);}
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x<w-1)dist[i]=Math.min(dist[i],dist[i+1]+1);if(y<h-1)dist[i]=Math.min(dist[i],dist[i+w]+1);}
    // EUMETSAT msg_clm legend: white=cloud; blue=clear water; green=clear land.
    for(let i=0;i<d.length;i+=4){const white=Math.min(d[i],d[i+1],d[i+2])>220;d[i]=210;d[i+1]=224;d[i+2]=235;d[i+3]=white?Math.round(Math.min(d[i+3],60)*Math.min(1,dist[i/4]/6)):0;}
    ctx.putImageData(pixels,0,0);img.close();
    const provider=await Cesium.SingleTileImageryProvider.fromUrl(canvas.toDataURL(),{rectangle:Cesium.Rectangle.fromDegrees(-77,-77,77,77),credit:'Wolkenmaske © EUMETSAT'});
    if(revision!==cloudRevision)return;
    cloud=viewer.imageryLayers.addImageryProvider(provider);cloud.dayAlpha=1;cloud.nightAlpha=1;viewer.scene.requestRender();
  }catch(e){if(revision===cloudRevision){cloudError='Wolkenbild nicht erreichbar';cloudNext=Date.now()+300000;labels();}}
  finally{if(revision===cloudRevision)cloudLoading=false;}
 }
 function tick(){
  if(!viewer)return;
  const active=wanted&&weatherEnabled&&earth();
  if(!active||frame&&stale(frame.to,30))clearPoints();else if(frame&&!points)draw();
  if(!selections.clouds||!weatherEnabled||cloudFrame&&stale(cloudFrame.time,90))clearCloud();else if(cloudFrame&&!cloud&&!cloudLoading&&!cloudError)showCloud(cloudFrame);
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
