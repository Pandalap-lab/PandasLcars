"use strict";
/* GeoSphere Warn API: WGS84 query; returned EPSG:31287 geometry is not plotted. */
(()=>{
 const MIN=60000, NORMAL=60*MIN, ACTIVE=10*MIN;
 const types=['','Wind / Sturm','Starkregen','Schnee','Glatteis','Gewitter','Hitze','Kälte'];
 const isViennaCode=code=>Number.isInteger(Number(code))&&Number(code)>=90101&&Number(code)<=92301&&Number(code)%100===1;
 const candidate=p=>Number.isFinite(p?.latitude)&&Number.isFinite(p?.longitude)&&p.latitude>=48&&p.latitude<=48.4&&p.longitude>=16.1&&p.longitude<=16.65;
 function normalize(data){
  const p=data?.properties,location=p?.location?.properties;
  if(data?.type!=='Feature'||!isViennaCode(location?.gemeindenr)||!Array.isArray(p?.warnings))throw Error('Ortszuordnung oder Antwort ungültig');
  return p.warnings.map(w=>{
   const p=w.properties, raw=p?.rawinfo||p?.rawfinfo;
   // Epoch seconds avoid locale ambiguity and Vienna daylight-saving transitions.
   const start=raw?.start!=null?Number(raw.start)*1000:Date.parse(p?.begin);
   const end=raw?.end!=null?Number(raw.end)*1000:Date.parse(p?.end);
   const level=Number(p?.warnstufeid),type=Number(p?.warntypid);
   if(!Number.isInteger(level)||level<1||level>3||!types[type]||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('Warnung ungültig');
   return {level,type,start,end,text:p.text||'',impact:p.auswirkungen||'',advice:p.empfehlungen||'',description:p.meteotext||''};
  });
 }
 function evaluate(warnings,now){
  const active=warnings.filter(w=>w.start<=now&&now<w.end),future=warnings.filter(w=>w.start>now).sort((a,b)=>a.start-b.start);
  return {active,future,level:Math.max(0,...active.map(w=>w.level)),interval:active.length?ACTIVE:NORMAL};
 }
 const api={normalize,evaluate,NORMAL,ACTIVE,isViennaCode,candidate};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 const tile=document.querySelector('.dust-panel');if(!tile)return;
 const root=document.createElement('section');root.id='weatherAlert';root.setAttribute('aria-label','GeoSphere Wetterwarnungen Wien-Innere Stadt');
 root.innerHTML='<b>WEATHER ALERT · WIEN-INNERE STADT</b><div class="alert-scale" role="img" aria-label="Warnstufen Grün, Gelb, Orange, Rot"><span>GRÜN</span><span>GELB</span><span>ORANGE</span><span>ROT</span><i hidden></i></div><div class="alert-state" role="status"></div><small class="alert-age"></small><details><summary>Warnungen / Zeitraum / Hinweise</summary><div class="alert-details"></div></details><a href="https://data.hub.geosphere.at" target="_blank" rel="noopener">Datenquelle: GeoSphere Austria · CC BY 4.0</a>';
 tile.querySelector('h2').after(root);
 let warnings=[],received=0,error='',pending=false,next=0,retryUntil=0;
 let selected=typeof place==='undefined'?{name:'Wien',latitude:48.2082,longitude:16.3738}:{...place},outside=!candidate(selected),area='',revision=0,controller=null;
 const stamp=t=>new Date(t).toLocaleString('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 function render(){
  root.querySelector('b').textContent='WEATHER ALERT · '+selected.name.toLocaleUpperCase('de-AT');
  root.setAttribute('aria-label','GeoSphere Wetterwarnungen '+selected.name);
  root.title=area?'GeoSphere-Ortszuordnung: '+area:'Gewähltes Target: '+selected.name;
  root.querySelector('.alert-scale').hidden=outside;root.querySelector('.alert-age').hidden=outside;
  if(outside){root.querySelector('i').hidden=true;root.querySelector('.alert-state').textContent='Keine Daten · außerhalb Wien';root.querySelector('.alert-details').textContent='Wetterwarnungen werden nur für Wiener Targets angezeigt.';return;}
  const now=Date.now(),state=evaluate(warnings,now),old=received&&now-received>=state.interval+MIN;
  const valid=received&&!error&&!old;
  const marker=root.querySelector('i');marker.hidden=!valid;marker.style.left=(12.5+state.level*25)+'%';
  root.querySelector('.alert-scale').setAttribute('aria-label',valid?'Höchste aktive Warnstufe: '+['Grün','Gelb','Orange','Rot'][state.level]:'Warnstufe unbekannt – keine aktuellen Daten');
  root.querySelector('.alert-state').textContent=valid?(state.active.length?['','GELB','ORANGE','ROT'][state.level]+' · '+[...new Set(state.active.map(w=>types[w.type]))].join(', '):'Keine aktive Warnung'+(state.future.length?' · Warnung angekündigt':'')):'Keine aktuellen Daten · '+(!navigator.onLine?'offline':error||(received?'Daten veraltet':'Abruf läuft'));
  root.querySelector('.alert-age').textContent='Letzter Erfolg: '+(received?stamp(received):'—')+' · Alter: '+(received?Math.floor((now-received)/MIN)+' Min.':'—')+' · Abruf '+state.interval/MIN+' Min.';
  const details=root.querySelector('.alert-details');details.replaceChildren();
  for(const w of [...state.active,...state.future]){
   const row=document.createElement('p');row.textContent=(w.start>now?'ANGEKÜNDIGT':'AKTIV')+' · '+types[w.type]+' · '+['','Gelb','Orange','Rot'][w.level]+'\n'+stamp(w.start)+' – '+stamp(w.end)+' (Wien)\n'+[w.text,w.description,w.impact,w.advice].filter(Boolean).join('\n');details.append(row);
  }
  if(!details.childNodes.length)details.textContent=valid?'Keine aktive oder angekündigte Warnung für '+(area||selected.name)+'.':'Warnstatus nicht gesichert.';
  if(!valid&&received){const note=document.createElement('p');note.textContent='Letzte erfolgreiche Daten sind veraltet / nicht bestätigt. Abgelaufene Warnungen werden nicht als aktiv angezeigt.';details.prepend(note);}
 }
 async function refresh(){
  if(outside||pending||Date.now()<retryUntil)return;
  const rev=revision,target={...selected};controller=new AbortController();const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);
  pending=true;
  try{
   const query=new URLSearchParams({lon:target.longitude,lat:target.latitude,lang:'de'});
   const response=await fetch('https://warnungen.zamg.at/wsapp/api/getWarningsForCoords?'+query,{signal,cache:'no-store'});
   if(rev!==revision)return;
   if(!response.ok){
    const value=response.headers.get('Retry-After');const seconds=Number(value);
    if(value)retryUntil=Date.now()+Math.max(ACTIVE,Number.isFinite(seconds)?seconds*1000:Date.parse(value)-Date.now()||ACTIVE);
    throw Error('API HTTP '+response.status);
   }
   const data=await response.json();if(rev!==revision)return;
   const location=data?.properties?.location?.properties;
   if(data?.type!=='Feature'||!Number.isInteger(Number(location?.gemeindenr))||!Array.isArray(data?.properties?.warnings))throw Error('Ortszuordnung oder Antwort ungültig');
   area=location.name||selected.name;
   if(!isViennaCode(location.gemeindenr)){outside=true;warnings=[];received=0;error='';window.pandaServiceReachable?.('GeoSphere Warnungen');return;}
   warnings=normalize(data);received=Date.now();error='';retryUntil=0;window.pandaServiceReachable?.('GeoSphere Warnungen');
  }catch(e){if(rev===revision)error=e.name==='TimeoutError'?'Zeitüberschreitung':e.message||'Abruf fehlgeschlagen';}
  finally{if(rev===revision){pending=false;controller=null;next=Math.max(retryUntil,Date.now()+(error?ACTIVE:evaluate(warnings,Date.now()).interval));render();}}
 }
 window.addEventListener('panda-target-change',e=>{
  revision++;controller?.abort();controller=null;pending=false;selected={...e.detail};outside=!candidate(selected);warnings=[];received=0;error='';area='';next=0;render();refresh();
 });
 window.addEventListener('online',()=>{next=0;refresh();});
 window.addEventListener('offline',render);
 setInterval(()=>{render();if(Date.now()>=next||received&&!error&&Date.now()-received>=evaluate(warnings,Date.now()).interval)refresh();},30000);
 render();refresh();
})();
