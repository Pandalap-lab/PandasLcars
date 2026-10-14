"use strict";
(()=>{
 const host=document.querySelector('.dust-panel'),summary=document.createElement('div');summary.id='dustLocalSummary';summary.setAttribute('role','status');host.querySelector('#weatherAlert').after(summary);
 const key='panda.dust.vienna.v1';let data=null,pending=false,next=0,error='';
 function valid(d){return d&&Number.isFinite(d.value)&&d.value>=0&&Number.isFinite(d.received)&&d.received<=Date.now()+60000&&Number.isFinite(Date.parse(d.time))&&Number.isFinite(Date.parse(d.run));}
 try{const cached=JSON.parse(localStorage.getItem(key));if(valid(cached))data=cached;}catch{}
 const fresh=()=>valid(data)&&Date.now()-Date.parse(data.time)<2*3600000&&Date.now()-Date.parse(data.run)<48*3600000;
 function render(){
  const suffix=error?' · Abruf fehlgeschlagen':pending?' · aktualisiert …':'';
  summary.textContent=data?'SAHARASTAUB · Wien '+data.value.toLocaleString('de-AT',{maximumFractionDigits:2})+' mg/m²\nPrognose '+new Date(data.time).toLocaleTimeString('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',minute:'2-digit'})+(fresh()?'':' · VERALTET')+suffix:'SAHARASTAUB · '+(error?'keine aktuellen Daten':pending?'Wien wird geladen …':'noch keine Daten');
  summary.title='Nächster Rasterpunkt zu Wien, 0,2° Raster. Staubmenge in der gesamten Luftsäule, keine bodennahe Feinstaubmessung. Datenquelle: GeoSphere Austria · CC BY 4.0. '+(data?'Letzter Abruf '+new Date(data.received).toLocaleString('de-AT',{timeZone:'Europe/Vienna'})+' · Modell '+data.run:'');
 }
 async function refresh(){
  if(pending||Date.now()<next)return;pending=true;render();
  const hour=new Date();hour.setUTCMinutes(0,0,0);const stamp=hour.toISOString().slice(0,16);
  try{
   const response=await fetch('https://dataset.api.hub.geosphere.at/v1/grid/forecast/chem_dust-v1-1h-0p2deg?parameters=dust&bbox=48,16.2,48.4,16.6&start='+stamp+'&end='+stamp,{signal:AbortSignal.timeout(15000),cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const json=await response.json();if(!Array.isArray(json.features)||Date.parse(json.timestamps?.[0])!==hour.getTime())throw Error('Prognosezeit ungültig');
   const features=json.features.filter(f=>f.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates)).sort((a,b)=>Math.hypot(a.geometry.coordinates[0]-16.3738,a.geometry.coordinates[1]-48.2082)-Math.hypot(b.geometry.coordinates[0]-16.3738,b.geometry.coordinates[1]-48.2082));
   const f=features[0],p=f?.properties?.parameters?.dust,value=p?.data?.[0];
   if(p?.unit!=='mg m-2'||!Number.isFinite(value)||value<0||Math.hypot(f.geometry.coordinates[0]-16.3738,f.geometry.coordinates[1]-48.2082)>.3)throw Error('Staubdaten ungültig');
   const result={value,time:json.timestamps[0],run:json.reference_time,received:Date.now()};if(!valid(result)||Date.now()-Date.parse(result.run)>48*3600000)throw Error('Modell veraltet');
   data=result;error='';try{localStorage.setItem(key,JSON.stringify(data));}catch{}
   window.pandaServiceReachable?.('GeoSphere');next=Date.now()+10*60000;
  }catch(e){error=e.message;next=Date.now()+2*60000;}
  finally{pending=false;render();}
 }
 window.addEventListener('online',()=>{next=0;refresh();});window.addEventListener('panda-internet-restored',()=>{next=0;refresh();});
 render();refresh();setInterval(()=>{render();refresh();},30000);
})();
