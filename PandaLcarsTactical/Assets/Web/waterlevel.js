"use strict";
(() => {
 const image=document.getElementById('waterImage'),status=document.getElementById('waterStatus');
 const send=type=>window.chrome?.webview?.postMessage({type});
 let fetched=null;
 const stamp=()=>fetched?new Date(fetched).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'}):'';
 window.chrome?.webview?.addEventListener('message',({data:m})=>{
  if(m.type==='connectivity'&&!m.connected){status.textContent=fetched?'OFFLINE · Abruf '+stamp():'OFFLINE · keine Grafik';return;}
  if(m.type!=='waterLevel')return;
  if(m.state==='ready'&&typeof m.data==='string'&&m.data.startsWith('data:image/png;base64,')&&m.data.length<2000000){
   image.onload=()=>{image.hidden=false;fetched=m.fetchedAt;status.textContent='Hydro NÖ · Abruf '+stamp()+' · 10 Min.';};
   image.onerror=()=>{status.textContent='Grafik nicht lesbar · Quelle öffnen';};
   image.src=m.data;
  }else if(m.state==='loading')status.textContent=fetched?'Aktualisierung · letzter Abruf '+stamp():'Originalgrafik wird geladen …';
  else if(m.state==='error')status.textContent=fetched?'NICHT AKTUELL · Abruf '+stamp():'Grafik nicht verfügbar · Quelle öffnen';
 });
 document.getElementById('waterRefresh').onclick=()=>send('waterLevel');
 document.getElementById('waterOpen').onclick=()=>window.chrome?.webview?.postMessage({type:'menu',action:'water'});
 window.addEventListener('panda-internet-restored',()=>send('waterLevel'));
 send('waterLevel');
})();
