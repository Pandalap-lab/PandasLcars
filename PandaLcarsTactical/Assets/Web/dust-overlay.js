"use strict";
(()=>{
 const button=document.createElement('button');button.id='dustToggle';button.textContent='SAHARASTAUB';button.setAttribute('aria-pressed','false');$('lightningOpen').parentElement.before(button);
 const legend=document.createElement('div');legend.id='dustLegend';legend.hidden=true;legend.setAttribute('role','status');document.querySelector('.map-wrap').append(legend);
 const details=document.createElement('div');details.id='dustStatus';$('radarStatus').after(details);
 let wanted=false,frame=null,layer=null,pending=false,next=0,revision=0,error='',drawing=false;
 const stamp=t=>new Date(t).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 const stale=()=>!frame||Date.now()-Date.parse(frame.time)>2*3600000||Date.now()-Date.parse(frame.run)>48*3600000;
 function clear(){revision++;drawing=false;if(layer&&viewer){viewer.imageryLayers.remove(layer,true);layer=null;viewer.scene.requestRender();}}
 function labels(){
  legend.hidden=!wanted;details.hidden=!wanted;
  const text=error||(!frame?'Saharastaub wird geladen …':stale()?'Saharastaub veraltet · ausgeblendet':'Prognose '+stamp(frame.time)+' · Modell '+stamp(frame.run));
  legend.replaceChildren();const title=document.createElement('b');title.textContent='SAHARASTAUB · '+text;legend.append(title);
  if(frame&&!stale()){const scale=document.createElement('span');scale.className='dust-scale';scale.textContent='0      100      500      ≥ 1.000 mg/m²';legend.append(scale);}
  const source=document.createElement('a');source.href='https://doi.org/10.60669/metr-z617';source.target='_blank';source.rel='noopener';source.textContent='GeoSphere Austria · CC BY 4.0 · Luftsäule';legend.append(source);
  details.textContent='Saharastaub · '+text+' · Staubmenge in der gesamten Luftsäule (mg/m²), keine bodennahe Feinstaubmessung. Abdeckung: Europa/Nordafrika (20–64°N, 20°W–40°E). GeoSphere Austria · CC BY 4.0.';
 }
 async function draw(){
  if(!wanted||!viewer||stale()||layer||drawing)return;
  drawing=true;const rev=++revision;
  try{
   const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;
   const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height);
   for(let i=0;i<frame.values.length;i++){
    const value=frame.values[i];if(value===null||!Number.isFinite(value)||value<=0)continue;
    // Fixed scale: same mass always has the same opacity; no per-frame normalization.
    const x=i%frame.width,y=Math.floor(i/frame.width);
    const edge=Math.min(1,x/3,y/3,(frame.width-1-x)/3,(frame.height-1-y)/3);
    const alpha=Math.min(170,170*Math.sqrt(value/1000))*Math.max(0,edge);
    pixels.data[i*4]=166;pixels.data[i*4+1]=112;pixels.data[i*4+2]=58;pixels.data[i*4+3]=Math.round(alpha);
   }
   ctx.putImageData(pixels,0,0);
   const provider=await Cesium.SingleTileImageryProvider.fromUrl(canvas.toDataURL(),{rectangle:Cesium.Rectangle.fromDegrees(frame.west,frame.south,frame.east,frame.north),credit:'Saharastaub: GeoSphere Austria · CC BY 4.0'});
   if(rev!==revision||!wanted||stale())return;
   layer=viewer.imageryLayers.addImageryProvider(provider);layer.dayAlpha=1;layer.nightAlpha=1;viewer.scene.requestRender();
  }catch(e){error='Saharastaub konnte nicht dargestellt werden';labels();}finally{if(rev===revision)drawing=false;}
 }
 function tick(){
  if(!wanted){if(layer||drawing)clear();return;}
  if(stale()&&(layer||drawing))clear();
  if(!document.hidden&&window.pandaInternetOnline!==false&&!pending&&Date.now()>=next){pending=true;next=Date.now()+120000;send('dustData');}
  draw();labels();
 }
 button.onclick=()=>{wanted=!wanted;pressed(button.id,wanted);if(!wanted)clear();labels();tick();};
 window.chrome?.webview?.addEventListener('message',e=>{const m=e.data;if(m.type!=='dustData')return;pending=false;error=m.error||'';
  if(m.data){clear();frame=m.data;next=Date.now()+300000;}tick();
 });
 setInterval(()=>{if(pending&&Date.now()>=next)pending=false;tick();},1000);
})();
