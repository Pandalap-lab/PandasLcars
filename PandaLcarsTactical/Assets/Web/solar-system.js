"use strict";
(() => {
 const host=document.querySelector('.insignia');
 if(!host) return;
 host.classList.remove('art');host.removeAttribute('data-crop');host.setAttribute('aria-label','Sonnensystem mit Tesla Roadster');
 host.innerHTML=`<h2>SONNENSYSTEM <button id="solarExpand" title="Sonnensystem vergrößern">⤢</button></h2>
  <div class="solar-stage"><canvas id="solarCanvas" tabindex="0" aria-label="Sonnensystem: Ziehen zum Drehen, Pfeiltasten für X/Y, Q/E für Z, R für Roadster-Details"></canvas></div>
  <div class="solar-tools"><div><button id="solarCenter" title="Zentrierte Draufsicht">CENTER</button><button id="solarX" aria-label="Um X drehen">X ↻</button><button id="solarY" aria-label="Um Y drehen">Y ↻</button><button id="solarZ" aria-label="Um Z drehen">Z ↻</button></div><small id="solarTime"></small><small>Größen / Abstände angepasst · rotes Auto: Roadster</small><button id="solarClose" hidden>ZURÜCK</button></div>
  <div id="solarDetails"></div>
  <section id="roadsterDetails" class="roadster-details" aria-labelledby="roadsterTitle" tabindex="-1">
   <div class="roadster-heading"><svg viewBox="0 0 58 28" aria-hidden="true"><path d="M4 19v-7l11-2 9-8h17l9 10 5 3v7H4Z" fill="#f45e66"/><path d="m22 6-6 6h27l-6-6Z" fill="#bde8f3"/><circle cx="15" cy="22" r="5" fill="#131d28" stroke="#acc0d0"/><circle cx="45" cy="22" r="5" fill="#131d28" stroke="#acc0d0"/></svg><h3 id="roadsterTitle">TESLA ROADSTER</h3></div>
   <p class="roadster-model">BERECHNETE POSITION</p><p id="roadsterStatus" role="status"></p>
   <dl><div><dt>Entfernung zur Sonne</dt><dd id="roadsterSun">—</dd></div><div><dt>Entfernung zur Erde</dt><dd id="roadsterEarth">—</dd></div><div><dt>Geschwindigkeit zur Sonne</dt><dd id="roadsterSpeed">—</dd></div></dl>
   <p id="roadsterCoordinates"></p><p class="roadster-provenance" id="roadsterSource"></p>
  </section>`;
 const dialog=document.createElement('dialog');dialog.id='solarDialog';dialog.setAttribute('aria-label','Sonnensystem und Roadster-Details');document.body.append(dialog);
 const home=document.createComment('solar home');host.before(home);
 const bodies=[['Mercury','Merkur','#c7b5aa',87.969],['Venus','Venus','#e6c78c',224.701],['Earth','Erde','#67caff',365.256],['Mars','Mars','#ec8971',686.980],['Jupiter','Jupiter','#ffbb7d',4332.59],['Saturn','Saturn','#efd697',10759.22],['Uranus','Uranus','#8bdce6',30688.5],['Neptune','Neptun','#a69aef',60182]];
 const canvas=document.getElementById('solarCanvas'),ctx=canvas.getContext('2d');
 const rotation=Astronomy.Rotation_EQJ_ECL(),number=new Intl.NumberFormat('de-AT',{maximumFractionDigits:0});
 let angle=[.85,0,-.3],points=[],orbits=[],calculated=null,orbitTime=0,drag=null;
 let roadster=null,roadsterOrbit=[],roadsterScreen=null;
 function position(body,date){const v=Astronomy.RotateVector(rotation,Astronomy.HelioVector(body,date));return [v.x,v.y,v.z];}
 function compress(v){const r=Math.hypot(...v);if(!r)return [0,0,0];const scale=Math.log1p(r*3)/Math.log1p(31*3)/r;return v.map(x=>x*scale);}
 function renderRoadster(){
  const source=window.PandaRoadster?.metadata,status=document.getElementById('roadsterStatus');
  if(!roadster){
   status.textContent=source?'Außerhalb der gespeicherten Ephemeride. Roadster-Position nicht verfügbar.':'Roadster-Ephemeride nicht verfügbar.';
   ['roadsterSun','roadsterEarth','roadsterSpeed'].forEach(id=>document.getElementById(id).textContent='—');document.getElementById('roadsterCoordinates').textContent='';
  }else{
   status.textContent='Flugbahn aus NASA/JPL-Ephemeriden · keine Live-Telemetrie';
   const earthDistance=Math.hypot(...roadster.positionAu.map((v,i)=>v-points[2][i]));
   const distance=au=>`${au.toLocaleString('de-AT',{minimumFractionDigits:3,maximumFractionDigits:3})} AE · ${number.format(au*window.PandaRoadster.AU_KM/1e6)} Mio. km`;
   document.getElementById('roadsterSun').textContent=distance(roadster.sunDistanceAu);document.getElementById('roadsterEarth').textContent=distance(earthDistance);
   document.getElementById('roadsterSpeed').textContent=number.format(roadster.speedKmh)+' km/h';
   document.getElementById('roadsterCoordinates').textContent='Heliozentrisch · J2000\n'+roadster.positionAu.map((v,i)=>'XYZ'[i]+' '+v.toLocaleString('de-AT',{minimumFractionDigits:4,maximumFractionDigits:4,signDisplay:'always'})+' AE').join('  ');
  }
  document.getElementById('roadsterSource').textContent=source?`Quelle: NASA/JPL Horizons · Bahnlösung 11\nBahnlösung: 03.01.2025 · Abruf: ${source.retrievedOn.split('-').reverse().join('.')}\nZeitraum: 01.01.2025–01.01.2032 · offline verfügbar`:'Quelle: NASA/JPL Horizons';
 }
 function update(){
  const now=new Date();points=bodies.map(b=>position(b[0],now));roadster=window.PandaRoadster?.at(now)??null;
  // Planetary positions and Roadster vectors share the fixed J2000 ecliptic.
  if(Math.abs(now-orbitTime)>86400000){
   orbits=bodies.map(b=>Array.from({length:181},(_,i)=>compress(position(b[0],new Date(now.getTime()+b[3]*86400000*(i/180-.5))))));
   roadsterOrbit=(window.PandaRoadster?.trajectory(now)??[]).map(compress);orbitTime=now.getTime();
  }
  calculated=now;document.getElementById('solarTime').textContent=now.toLocaleString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'})+' · Wien';
  document.getElementById('solarDetails').replaceChildren(...bodies.map((b,i)=>{const row=document.createElement('div');row.style.color=b[2];row.textContent=(i+1)+' '+b[1]+' · '+Math.hypot(...points[i]).toFixed(3)+' AE';return row;}));
  renderRoadster();draw();
 }
 function project(v,w,h){let [x,y,z]=v;const [a,b,c]=angle;[y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];[x,z]=[x*Math.cos(b)+z*Math.sin(b),-x*Math.sin(b)+z*Math.cos(b)];[x,y]=[x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c)];const s=Math.min(w*.43,h*.44);return [w/2+x*s,h/2-y*s,z];}
 function car(x,y,heading,large){
  // Small overhead car, drawn locally so appearance does not depend on emoji fonts.
  ctx.save();ctx.translate(x,y);ctx.rotate(heading);ctx.scale(large?1:.72,large?1:.72);ctx.fillStyle='#0c1018';ctx.strokeStyle='#c2ccdf';ctx.lineWidth=.7;
  for(const side of [-1,1])for(const end of [-1,1]){ctx.fillRect(side*6-1,end*5-2,2,4);ctx.strokeRect(side*6-1,end*5-2,2,4);}
  ctx.beginPath();ctx.moveTo(-3,-10);ctx.lineTo(3,-10);ctx.quadraticCurveTo(5,-8,5,-4);ctx.lineTo(5,8);ctx.quadraticCurveTo(0,10,-5,8);ctx.lineTo(-5,-4);ctx.quadraticCurveTo(-5,-8,-3,-10);ctx.closePath();
  ctx.fillStyle='#f55862';ctx.fill();ctx.strokeStyle='#ffc7c8';ctx.lineWidth=.7;ctx.stroke();ctx.fillStyle='#b6e8f4';ctx.fillRect(-3,-4,6,3);ctx.fillStyle='#171b27';ctx.fillRect(-3,0,6,4);ctx.fillStyle='#f8deb0';ctx.fillRect(-3,-9,2,1);ctx.fillRect(1,-9,2,1);ctx.restore();
 }
 function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  orbits.forEach((orbit,i)=>{ctx.beginPath();orbit.forEach((v,k)=>{const [x,y]=project(v,w,h);k?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=bodies[i][2];ctx.globalAlpha=.65;ctx.lineWidth=.7;ctx.stroke();});ctx.globalAlpha=1;
  if(roadster){ctx.beginPath();roadsterOrbit.forEach((v,i)=>{const [x,y]=project(v,w,h);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#e46c78';ctx.globalAlpha=.7;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  const sun=project([0,0,0],w,h);ctx.fillStyle='#ffca60';ctx.shadowColor='#ffad32';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(sun[0],sun[1],w>300?5:3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  const occupied=[];points.map((p,i)=>({i,p:project(compress(p),w,h)})).sort((a,b)=>a.p[2]-b.p[2]).forEach(({i,p:[x,y]})=>{ctx.fillStyle=bodies[i][2];ctx.beginPath();ctx.arc(x,y,w>300?3.5:2,0,Math.PI*2);ctx.fill();if(i===5){ctx.beginPath();ctx.ellipse(x,y,7,2.5,-.4,0,Math.PI*2);ctx.strokeStyle=bodies[i][2];ctx.stroke();}label(w>300?bodies[i][1]:String(i+1),x+6,y-5,bodies[i][2],w,h,occupied);});
  roadsterScreen=null;if(roadster){const p=project(compress(roadster.positionAu),w,h),ahead=project(compress(roadster.positionAu.map((v,i)=>v+roadster.velocityAuPerDay[i]*.1)),w,h);car(p[0],p[1],Math.atan2(ahead[1]-p[1],ahead[0]-p[0])+Math.PI/2,w>300);roadsterScreen=p.slice(0,2);if(w>300)label('Roadster',p[0]+12,p[1]-10,'#ff9fa8',w,h,occupied);}
 }
 function label(text,x,y,color,w,h,occupied){ctx.fillStyle=color;ctx.font=(w>300?'12':'8')+'px Segoe UI';const tw=ctx.measureText(text).width,tx=Math.max(1,Math.min(w-tw-2,x));let ty=Math.max(10,Math.min(h-2,y));for(let attempt=0;attempt<12&&occupied.some(r=>tx<r.x+r.w&&tx+tw>r.x&&Math.abs(ty-r.y)<13);attempt++)ty=ty+13<h?ty+13:10;occupied.push({x:tx,y:ty,w:tw});ctx.fillText(text,tx,ty);}
 function expand(roadsterFocus=false){if(!dialog.open){dialog.append(host);dialog.showModal();document.getElementById('solarClose').hidden=false;document.getElementById('solarExpand').hidden=true;draw();}if(roadsterFocus)document.getElementById('roadsterDetails').focus();}
 const center=()=>{angle=[0,0,0];draw();};document.getElementById('solarCenter').onclick=center;
 ['X','Y','Z'].forEach((axis,i)=>document.getElementById('solar'+axis).onclick=()=>{angle[i]+=.2;draw();});
 canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)drag.moved=true;if(drag.moved){angle[0]+=(e.clientY-drag.y)*.01;angle[e.shiftKey?2:1]+=(e.clientX-drag.x)*.01;draw();}drag.x=e.clientX;drag.y=e.clientY;};
 canvas.onpointerup=e=>{const box=canvas.getBoundingClientRect(),selected=drag&&!drag.moved&&roadsterScreen&&Math.hypot(e.clientX-box.left-roadsterScreen[0],e.clientY-box.top-roadsterScreen[1])<=16;drag=null;if(selected)expand(true);};canvas.onpointercancel=()=>{drag=null;};
 canvas.onkeydown=e=>{const keys={ArrowUp:[0,-.1],ArrowDown:[0,.1],ArrowLeft:[1,-.1],ArrowRight:[1,.1],q:[2,-.1],e:[2,.1]};if(e.key==='Home'){center();e.preventDefault();}else if(e.key.toLowerCase()==='r'){expand(true);e.preventDefault();}else if(keys[e.key]){const [i,n]=keys[e.key];angle[i]+=n;draw();e.preventDefault();}};
 document.getElementById('solarExpand').onclick=()=>expand();document.getElementById('solarClose').onclick=()=>dialog.close();
 dialog.onclose=()=>{home.after(host);document.getElementById('solarClose').hidden=true;document.getElementById('solarExpand').hidden=false;draw();document.getElementById('solarExpand').focus();};
 new ResizeObserver(draw).observe(canvas);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});update();setInterval(()=>{if(!document.hidden)update();},60000);
 // Read-only diagnostics shared by UI and astronomy reference checks.
 window.pandaSolar={position,get state(){return {angles:[...angle],time:calculated.toISOString(),positions:points.map(p=>[...p]),roadster:roadster?{...roadster,positionAu:[...roadster.positionAu],velocityAuPerDay:[...roadster.velocityAuPerDay]}:null,roadsterScreen:roadsterScreen?[...roadsterScreen]:null};}};
})();
