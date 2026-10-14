"use strict";
(()=>{
 const zone='Europe/Vienna',observer=new Astronomy.Observer(48.2082,16.3738,0);
 const dayKey=date=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 function midnight(date){
  const key=dayKey(date),guess=new Date(key+'T00:00:00Z');
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(guess);
  const hour=Number(parts.find(p=>p.type==='hour').value);return new Date(guess.getTime()-hour*3600000);
 }
 function calculate(date){
  const start=midnight(date),next=midnight(new Date(start.getTime()+36*3600000));
  const find=direction=>{const t=Astronomy.SearchRiseSet('Moon',observer,direction,start,(next-start)/86400000);return t&&t.date>=start&&t.date<next?t.date:null;};
  return {phase:Astronomy.MoonPhase(date),fraction:Astronomy.Illumination('Moon',date).phase_fraction,rise:find(1),set:find(-1),full:Astronomy.SearchMoonPhase(180,date,35)?.date,newMoon:Astronomy.SearchMoonPhase(0,date,35)?.date,date:dayKey(date)};
 }
 function name(phase){if(phase<5||phase>355)return 'Neumond';if(Math.abs(phase-180)<5)return 'Vollmond';if(Math.abs(phase-90)<5)return 'Erstes Viertel';if(Math.abs(phase-270)<5)return 'Letztes Viertel';return phase<90?'Zunehmende Sichel':phase<180?'Zunehmender Mond':phase<270?'Abnehmender Mond':'Abnehmende Sichel';}
 const host=document.querySelector('.celestial-panel');
 const root=document.createElement('div');root.id='lunarStatus';root.innerHTML='<canvas id="moonCanvas" width="128" height="128" role="img" aria-label="Berechnete Mondphase"></canvas><div><b id="moonPhase"></b><table class="lunar-table" aria-label="Mondinformationen Wien"><tbody><tr><th>Beleuchtung</th><td id="moonLight" colspan="2"></td></tr><tr><th><i class="full-moon-symbol" aria-hidden="true"></i> Vollmond</th><td id="moonFullDate"></td><td id="moonFullTime"></td></tr><tr><th><i class="new-moon-symbol" aria-hidden="true"></i> Neumond</th><td id="moonNewDate"></td><td id="moonNewTime"></td></tr></tbody></table></div>';host.append(root);
 const texture=new Image();texture.src='moon-lroc.jpg';let pixels=null,state=null,lastDay='';
 const dialog=document.createElement('dialog');dialog.id='lunarDialog';dialog.innerHTML='<h2>LUNAR STATUS · WIEN</h2><p>Berechnete Mondphase · Ortszeit Europe/Vienna</p><small>Oberfläche: NASA Scientific Visualization Studio / LROC · Astronomy Engine</small><p>Nord oben; vereinfachte Ausrichtung ohne Libration. Zeiten für freien Horizont auf Meereshöhe.</p><button>ZURÜCK</button>';document.body.append(dialog);
 dialog.querySelector('p').after(root);
 const heading=host.querySelector('h2>span');heading.textContent='SONNE / ';
 const link=document.createElement('a');link.id='openLunar';link.href='#lunarDialog';link.textContent='MOND';link.title='Mondphase und Mondinformationen öffnen';heading.append(link);
 link.onclick=e=>{e.preventDefault();update();dialog.showModal();};
 dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>link.focus();
 texture.onload=()=>{const c=document.createElement('canvas');c.width=texture.width;c.height=texture.height;const ctx=c.getContext('2d');ctx.drawImage(texture,0,0);pixels=ctx.getImageData(0,0,c.width,c.height);draw();};
 function draw(){
  if(!state)return;const canvas=document.getElementById('moonCanvas'),ctx=canvas.getContext('2d'),n=canvas.width,out=ctx.createImageData(n,n),angle=state.phase*Math.PI/180;
  // North-up near-side sphere. Sun vector yields a right-lit waxing Moon.
  const sx=Math.sin(angle),sz=-Math.cos(angle);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const nx=(x+.5-n/2)/(n/2-2),ny=-(y+.5-n/2)/(n/2-2),r=nx*nx+ny*ny;if(r>=1)continue;
   const nz=Math.sqrt(1-r),light=Math.max(0,nx*sx+nz*sz),gain=.025+.975*Math.pow(light,.65),i=(y*n+x)*4;
   let rgb=[185,183,180];
   if(pixels){const lon=Math.atan2(nx,nz),lat=Math.asin(ny),u=Math.min(pixels.width-1,Math.max(0,Math.floor((.5+lon/(2*Math.PI))*pixels.width))),v=Math.min(pixels.height-1,Math.max(0,Math.floor((.5-lat/Math.PI)*pixels.height))),j=(v*pixels.width+u)*4;rgb=[pixels.data[j],pixels.data[j+1],pixels.data[j+2]];}
   for(let k=0;k<3;k++)out.data[i+k]=Math.min(255,rgb[k]*gain*1.35);out.data[i+3]=255;
  }ctx.putImageData(out,0,0);
  canvas.setAttribute('aria-label',name(state.phase)+' · '+(state.fraction*100).toFixed(1)+' Prozent beleuchtet');
 }
 const time=t=>t?t.toLocaleTimeString('de-AT',{timeZone:zone,hour:'2-digit',minute:'2-digit'}):'—';
 const stamp=t=>t?t.toLocaleString('de-AT',{timeZone:zone,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
 function update(){try{
  const now=new Date();state=calculate(now);lastDay=state.date;
  document.getElementById('moonPhase').textContent=name(state.phase);
  document.getElementById('moonLight').textContent=(state.fraction*100).toLocaleString('de-AT',{maximumFractionDigits:1})+' % · Wien';
  for(const [prefix,event] of [['moonFull',state.full],['moonNew',state.newMoon]]){
   document.getElementById(prefix+'Date').textContent=event?event.toLocaleDateString('de-AT',{timeZone:zone,day:'2-digit',month:'2-digit'}):'—';
   document.getElementById(prefix+'Time').textContent=time(event);
  }
  root.title='Astronomy Engine · Ortszeit Wien · freier Horizont / Meereshöhe. —: kein Ereignis an diesem Tag. Grafik: NASA Scientific Visualization Studio / LROC, Nord oben; vereinfachte Ausrichtung ohne Libration. Berechnung '+stamp(now);draw();
 }catch(e){document.getElementById('moonPhase').textContent='Mondberechnung nicht verfügbar';}}
 update();setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 window.pandaLunar={calculate,midnight,name,get state(){return state;}};
})();
