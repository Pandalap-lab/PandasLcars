"use strict";
(() => {
 const host=document.querySelector('.insignia');
 host.classList.remove('art');host.removeAttribute('data-crop');host.setAttribute('aria-label','Sonnensystem und U.S.S. Panda');
 host.innerHTML='<h2>SONNENSYSTEM <button id="solarExpand" title="Sonnensystem vergrößern">⤢</button></h2><div class="solar-stage"><canvas id="solarCanvas" tabindex="0" aria-label="Sonnensystem: Ziehen zum Drehen, Pfeiltasten für X/Y, Q/E für Z"></canvas></div><div class="solar-tools"><div><button id="solarCenter" title="Zentrierte Draufsicht">CENTER</button><button id="solarX" aria-label="Um X drehen">X ↻</button><button id="solarY" aria-label="Um Y drehen">Y ↻</button><button id="solarZ" aria-label="Um Z drehen">Z ↻</button></div><small id="solarTime"></small><small>Größen / Abstände angepasst</small><button id="solarClose" hidden>ZURÜCK</button></div><div id="solarDetails"></div>';
 const dialog=document.createElement('dialog');dialog.id='solarDialog';document.body.append(dialog);
 const home=document.createComment('solar home');host.before(home);
 const bodies=[['Mercury','Merkur','#c7b5aa',87.969],['Venus','Venus','#e6c78c',224.701],['Earth','Erde','#67caff',365.256],['Mars','Mars','#ec8971',686.980],['Jupiter','Jupiter','#ffbb7d',4332.59],['Saturn','Saturn','#efd697',10759.22],['Uranus','Uranus','#8bdce6',30688.5],['Neptune','Neptun','#a69aef',60182]];
 const canvas=document.getElementById('solarCanvas'),ctx=canvas.getContext('2d');
 let angle=[.85,0,-.3],points=[],orbits=[],calculated=null,orbitTime=0,drag=null;
 const rotation=Astronomy.Rotation_EQJ_ECL();
 function position(body,date){const v=Astronomy.RotateVector(rotation,Astronomy.HelioVector(body,date));return [v.x,v.y,v.z];}
 function compress(v){const r=Math.hypot(...v),scale=Math.log1p(r*3)/Math.log1p(31*3)/r;return v.map(x=>x*scale);}
 function update(){
  const now=new Date();points=bodies.map(b=>position(b[0],now));
  // Sample one orbital period; use a fixed J2000 ecliptic plane for every point.
  if(now-orbitTime>86400000){orbits=bodies.map(b=>Array.from({length:181},(_,i)=>compress(position(b[0],new Date(now.getTime()+b[3]*86400000*(i/180-.5))))));orbitTime=now.getTime();}
  calculated=now;document.getElementById('solarTime').textContent=now.toLocaleString('de-AT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'})+' · Wien';
  document.getElementById('solarDetails').replaceChildren(...bodies.map((b,i)=>{const row=document.createElement('div');row.style.color=b[2];row.textContent=(i+1)+' '+b[1]+' · '+Math.hypot(...points[i]).toFixed(3)+' AE';return row;}));draw();
 }
 function project(v,w,h){let [x,y,z]=v;let [a,b,c]=angle;[y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];[x,z]=[x*Math.cos(b)+z*Math.sin(b),-x*Math.sin(b)+z*Math.cos(b)];[x,y]=[x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c)];const s=Math.min(w*.43,h*.44);return [w/2+x*s,h/2-y*s,z];}
 function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  orbits.forEach((orbit,i)=>{ctx.beginPath();orbit.forEach((v,k)=>{const [x,y]=project(v,w,h);k?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=bodies[i][2];ctx.globalAlpha=.65;ctx.lineWidth=.7;ctx.stroke();});ctx.globalAlpha=1;
  const sun=project([0,0,0],w,h);ctx.fillStyle='#ffca60';ctx.shadowColor='#ffad32';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(sun[0],sun[1],w>300?5:3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  const occupied=[];
  points.map((p,i)=>({i,p:project(compress(p),w,h)})).sort((a,b)=>a.p[2]-b.p[2]).forEach(({i,p:[x,y]})=>{
   ctx.fillStyle=bodies[i][2];ctx.beginPath();ctx.arc(x,y,w>300?3.5:2,0,Math.PI*2);ctx.fill();
   if(i===5){ctx.beginPath();ctx.ellipse(x,y,7,2.5,-.4,0,Math.PI*2);ctx.strokeStyle=bodies[i][2];ctx.stroke();}
   const text=w>300?bodies[i][1]:String(i+1);ctx.font=(w>300?'12':'8')+'px Segoe UI';const tw=ctx.measureText(text).width;
   let tx=Math.max(1,Math.min(w-tw-2,x+6)),ty=Math.max(10,Math.min(h-2,y-5));
   for(let attempt=0;attempt<12&&occupied.some(r=>tx<r.x+r.w&&tx+tw>r.x&&Math.abs(ty-r.y)<13);attempt++)ty=ty+13<h?ty+13:10;
   occupied.push({x:tx,y:ty,w:tw});ctx.fillText(text,tx,ty);
  });
 }
 const center=()=>{angle=[0,0,0];draw();};document.getElementById('solarCenter').onclick=center;
 ['X','Y','Z'].forEach((axis,i)=>document.getElementById('solar'+axis).onclick=()=>{angle[i]+=.2;draw();});
 canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;angle[0]+=(e.clientY-drag[1])*.01;angle[e.shiftKey?2:1]+=(e.clientX-drag[0])*.01;drag=[e.clientX,e.clientY];draw();};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
 canvas.onkeydown=e=>{const keys={ArrowUp:[0,-.1],ArrowDown:[0,.1],ArrowLeft:[1,-.1],ArrowRight:[1,.1],q:[2,-.1],e:[2,.1]};if(e.key==='Home'){center();e.preventDefault();}else if(keys[e.key]){const [i,n]=keys[e.key];angle[i]+=n;draw();e.preventDefault();}};
 document.getElementById('solarExpand').onclick=()=>{dialog.append(host);dialog.showModal();document.getElementById('solarClose').hidden=false;document.getElementById('solarExpand').hidden=true;draw();};
 document.getElementById('solarClose').onclick=()=>dialog.close();dialog.onclose=()=>{home.after(host);document.getElementById('solarClose').hidden=true;document.getElementById('solarExpand').hidden=false;draw();document.getElementById('solarExpand').focus();};
 new ResizeObserver(draw).observe(canvas);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 update();setInterval(()=>{if(!document.hidden)update();},60000);
 // Read-only diagnostics shared by screenshot and astronomy reference checks.
 window.pandaSolar={position,get state(){return {angles:[...angle],time:calculated.toISOString(),positions:points.map(p=>[...p])};}};
})();
