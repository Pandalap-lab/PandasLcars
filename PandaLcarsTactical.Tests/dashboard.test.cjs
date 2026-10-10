const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const assets=process.env.PANDA_ASSETS_ROOT?path.resolve(process.env.PANDA_ASSETS_ROOT):path.resolve(__dirname,'../PandaLcarsTactical/Assets');
const server=http.createServer((req,res)=>{
 const file=path.resolve(assets,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(assets+path.sep)){res.writeHead(403).end();return;}
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).on('error',()=>res.end()).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge',args:process.env.CI ? ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] : []});
 try {
  const context=await browser.newContext({viewport:{width:1500,height:940}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await page.addInitScript(()=>{
   const listeners=[];
   window.testLinks=['Kronen Zeitung','DER STANDARD','Heute','Facebook','OE24','ARGOS ATLAS',...Array.from({length:6},(_,i)=>'Eigener Link '+(i+1))].map((name,i)=>({id:String(i),name,url:i===5?'https://argosatlas.com/':'https://example.com/'+i,custom:i>=6}));
   window.testMessage=data=>listeners.forEach(fn=>fn({data}));
   window.testSent=[];
   window.chrome={webview:{addEventListener:(name,fn)=>listeners.push(fn),postMessage:msg=>{
    window.testSent.push(msg);
    if(msg.type==='displaySettings')setTimeout(()=>window.testMessage({type:'displaySettings',monitors:[{id:'monitor-test',name:'Monitor 3',width:1920,height:1080,primary:false}],monitorId:'monitor-test',fullscreen:true,autostart:true}),10);
    if(msg.type==='services')setTimeout(()=>window.testMessage({type:'services',data:[{id:'photos',name:'Google Fotos',enabled:false,status:'NICHT EINGERICHTET'}]}),10);
    if(msg.type==='siteIcon'){const link=window.testLinks.find(x=>x.id===msg.linkId);if(link)setTimeout(()=>window.testMessage({type:'siteIcon',linkId:link.id,url:link.url,data:'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="'+(link.url.includes('changed')?'red':'blue')+'"/></svg>')}),10);}
    if(msg.type==='links')setTimeout(()=>window.testMessage({type:'links',data:window.testLinks}),10);
    if(msg.type==='linkSave'){
     const link={id:msg.linkId??'new',name:msg.name,url:msg.url,custom:true};
     window.testLinks=msg.linkId?window.testLinks.map(x=>x.id===msg.linkId?link:x):[...window.testLinks,link];
     setTimeout(()=>window.testMessage({type:'links',id:msg.id,data:window.testLinks}),10);
    }
    if(msg.type==='linkDelete'){
     window.testLinks=window.testLinks.filter(x=>x.id!==msg.linkId);
     setTimeout(()=>window.testMessage({type:'links',id:msg.id,data:window.testLinks}),10);
    }
   }}};
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/Web/index.html');
  await page.waitForFunction(()=>document.querySelectorAll('#quickLinks button').length===12);
  await page.waitForFunction(()=>typeof viewer!=='undefined'&&viewer.imageryLayers.length>=2);
  const visible=()=>page.evaluate(()=>{const r=document.querySelector('#quickLinks').getBoundingClientRect();return [...document.querySelectorAll('#quickLinks button')].filter(b=>{const q=b.getBoundingClientRect();return q.top>=r.top-1&&q.bottom<=r.bottom+1}).length;});
  await page.locator('#serviceSummary').click();
  await page.waitForFunction(()=>document.querySelectorAll('.service-row').length===1);
  await page.waitForFunction(()=>document.querySelector('#startMonitor').value==='monitor-test');
  assert(await page.locator('#startAutostart').isChecked());
  await page.locator('#saveDisplay').click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='displaySave'&&x.monitorId==='monitor-test'&&x.fullscreen&&x.autostart)));
  await page.getByRole('button',{name:'IM BROWSER ÖFFNEN',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='serviceOpen'&&x.serviceId==='photos')));
  await page.evaluate(()=>testMessage({type:'services',data:[{id:'photos',name:'Google Fotos',enabled:true,status:'IM BROWSER · STATUS UNBEKANNT'}]}));
  assert.equal(await page.locator('#serviceSummary').innerText(),'DIENSTE · IM BROWSER ÖFFNEN');
  assert(!(await page.locator('#serviceRows').innerText()).includes('STATUS'));
  fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'../qa/settings-1500.png')});
  await page.locator('#closeAppSettings').click();
  assert(!(await page.locator('#appSettings').evaluate(el=>el.open)));
  console.log('PASS browser links without account status and return');
  await page.evaluate(()=>{
   report={timezone:'Asia/Kolkata',celestial:{date:'2026-09-27',sunrise:'2026-09-27T00:40:00Z',sunset:'2026-09-27T12:40:00Z',moonrise:null,moonset:'2026-09-27T01:00:00Z'}};
   renderCelestial();
  });
  assert((await page.locator('#celestialTimes').innerText()).replace(/\s+/g,' ').includes('Sonne ↑ 06:10'));
  assert((await page.locator('#celestialTimes').innerText()).replace(/\s+/g,' ').includes('Mond ↑ —'));
  assert((await page.locator('#celestialTimes').innerText()).includes('27.09.2026'));
  assert.equal(await page.locator('#celestialWeekday').innerText(),'Sonntag');
  console.log('PASS celestial local time, date, full weekday and absent event');
  await page.evaluate(()=>{
   report={timezone:'Europe/Vienna',current:{validAt:'2026-09-29T15:30:00Z',temperatureC:23,cloudPercent:0,precipitationMm:0,intervalMinutes:15,windKmh:15.3,humidityPercent:31,pressureHpa:1025.3,source:'Open-Meteo'},daily:[{date:'2026-09-29',minimumC:13,maximumC:23,weatherCode:1}],celestial:{date:'2026-09-29',sunrise:'2026-09-29T04:50:00Z',sunset:'2026-09-29T16:38:00Z',moonrise:'2026-09-29T15:24:00Z',moonset:'2026-09-29T08:20:00Z'}};
   renderWeather();renderForecast();
   for(let i=0;i<65;i++)renderNetwork(100+(i%7)*5,.5+(i%3)*.2);
  });
  assert.equal(await page.locator('#celestialWeekday').innerText(),'Dienstag');
  assert.equal(await page.locator('#temperature').innerText(),'23 °C');
  assert.equal(await page.locator('#humidityValue').innerText(),'31 %');
  assert.equal(await page.locator('#weatherDetails .weather-line').count(),2);
  assert((await page.locator('#celestialTimes').innerText()).includes('Stand 17:30'));
  // Keep the historical layout fixture fresh during slower CI runs; stale behavior is tested separately.
  await page.evaluate(()=>{report.current.validAt=new Date().toISOString();});
  assert(await page.evaluate(()=>networkSamples.length===60&&document.querySelector('#downloadLine').getAttribute('d').includes('L')));
  assert.equal(await page.locator('#mapHud').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.evaluate(()=>{renderNetwork(null,null);renderNetwork(4,1)});
  assert(await page.locator('#downloadLine').evaluate(el=>el.getAttribute('d').split('M').length>=3));
  console.log('PASS weather tables, transparent HUD and network history with measurement gap');
  assert(await page.evaluate(()=>viewer.scene.globe.enableLighting&&nightLayer.dayAlpha===0&&nightLayer.nightAlpha===1));
  await page.locator('#center').click();
  assert(await page.evaluate(()=>!earthMotion.earth&&!viewer.scene.globe.enableLighting&&!nightLayer.show));
  await page.locator('#earth').click();
  assert(await page.evaluate(()=>earthMotion.earth&&viewer.scene.globe.enableLighting&&nightLayer.show));
  await page.locator('#earth').click();
  assert(await page.evaluate(()=>earthMotion.earth&&!earthMotion.enabled&&document.querySelector('#earth').getAttribute('aria-pressed')==='false'&&!document.querySelector('#earthRotation').checked&&localStorage.getItem('panda.earthRotation')==='false'));
  await page.locator('#earth').click();
  assert(await page.evaluate(()=>earthMotion.enabled&&earthMotion.resumeAt<=performance.now()&&document.querySelector('#earth').getAttribute('aria-pressed')==='true'&&document.querySelector('#earthRotation').checked&&localStorage.getItem('panda.earthRotation')==='true'));
  console.log('PASS EARTH button stops and restarts rotation; settings and persistence synchronized');
  await page.waitForTimeout(1700);
  await page.evaluate(()=>setEarthRotation(false));
  for(let round=0;round<2;round++) {
   await page.evaluate(()=>beginSmoothZoom(2200000));await page.waitForFunction(()=>zoomTarget===null);assert.equal(await page.evaluate(()=>earthMotion.earth),false);
   await page.evaluate(()=>beginSmoothZoom(3000000));await page.waitForFunction(()=>zoomTarget===null);assert.equal(await page.evaluate(()=>earthMotion.earth),true);
  }
  assert.equal(await page.locator('.location h2').innerText(),'SAHARASTAUB / BLITZE');
  assert.equal(await page.locator('.map-wrap #dustLegend').count(),0);
  assert(await page.locator('.location #dustLegend').isVisible());
  assert((await page.locator('#dustLegend').innerText()).includes('ausgeschaltet'));
  await page.locator('#dustToggle').click();
  await page.evaluate(()=>testMessage({type:'dustData',data:{time:new Date().toISOString(),run:new Date().toISOString(),width:2,height:2,west:10,south:40,east:20,north:50,values:[0,100,500,1000]}}));
  assert((await page.locator('#dustLegend').innerText()).includes('mg/m²'));
  assert(await page.locator('.location').evaluate(e=>{const p=e.getBoundingClientRect(),l=e.querySelector('#dustLegend').getBoundingClientRect();return l.top>=p.top&&l.bottom<=p.bottom&&l.right<=p.right;}));
  await page.locator('#dustToggle').click();
  console.log('PASS dedicated Saharastaub panel, scale containment and disabled status');
  await page.locator('#lightningToggle').click();
  await page.waitForFunction(()=>testSent.some(x=>x.type==='lightningData'));
  const beforeLightning=await page.evaluate(()=>viewer.scene.primitives.length);
  await page.evaluate(()=>testMessage({type:'lightningData',data:{from:new Date(Date.now()-600000).toISOString(),to:new Date().toISOString(),qualityWarning:false,points:[{latitude:48.2,longitude:16.3,confidence:.9,time:new Date().toISOString()}]}}));
  assert.equal(await page.evaluate(()=>viewer.scene.primitives.length),beforeLightning+1);
  assert.match(await page.locator('#lightningInfo').innerText(),/Ortszeit Wien[\s\S]*Daten:[\s\S]*Abruf: \d{2}:\d{2} · Nächster: \d{2}:\d{2}[\s\S]*Alle 5 Min\./);
  await page.evaluate(()=>testMessage({type:'lightningData',data:{from:'2000-01-01T00:00:00Z',to:'2000-01-01T00:10:00Z',points:[]}}));
  assert.equal(await page.evaluate(()=>viewer.scene.primitives.length),beforeLightning);
  assert((await page.locator('#satelliteBadge').innerText()).includes('veraltet'));
  await page.locator('#lightningToggle').click();
  await page.locator('#clouds').click();await page.waitForFunction(()=>testSent.some(x=>x.type==='cloudData'));
  await page.evaluate(()=>testMessage({type:'cloudData',error:'Wolkenbild nicht verfügbar'}));
  assert((await page.locator('#satelliteBadge').innerText()).includes('nicht verfügbar'));
  await page.locator('#clouds').click();
  await page.evaluate(()=>setEarthRotation(true));
  console.log('PASS repeated zoom roundtrip, lightning primitives, stale removal and cloud error');
  await page.locator('#lightningOpen').click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='lightning'&&x.place.name==='Wien')));
  console.log('PASS EARTH lighting, target mode and external lightning request');
  for(const action of ['tactical','system','maps','web','data','photos','calendar','desktop','power']) {
   await page.locator('[data-action="'+action+'"]').click();
   assert(await page.evaluate(action=>testSent.some(x=>x.type==='menu'&&x.action===action),action));
  }
  await page.locator('#updateCheck').click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='updateCheck')));
  await page.evaluate(()=>testMessage({type:'update',state:'available',message:'UPDATE v0.6.1 VORHANDEN'}));
  assert(await page.locator('#updateDownload').isEnabled());
  await page.locator('#updateDownload').click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='updateDownload')));
  await page.evaluate(()=>testMessage({type:'update',state:'downloading',message:'LÄDT'}));
  assert(await page.locator('#updateDownload').isDisabled());
  await page.evaluate(()=>testMessage({type:'update',state:'starting',message:'Installer wird gestartet – bitte warten'}));
  assert(await page.locator('#updateDownload').isDisabled());assert(await page.locator('#updateCheck').isDisabled());
  await page.evaluate(()=>testMessage({type:'update',state:'current',message:'AKTUELL'}));
  assert.equal(await page.locator('.insignia svg text').textContent(),'NCC-080470');
  assert.equal(await page.locator('.ship svg text').textContent(),'NCC-080470');
  assert.equal(await page.locator('#quickLinks img').count(),12);
  console.log('PASS monitor settings, menu routing, update states, NCC lettering and icon slots');
  await page.locator('#openAppSettings').click();
  await page.getByRole('button',{name:'ARGOS ATLAS in Tactical öffnen',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='linkOpen'&&x.linkId==='5')));
  assert((await page.locator('#quickLinks img').nth(5).getAttribute('src')).startsWith('data:image/'));assert(await page.locator('#quickLinks img').nth(5).evaluate(e=>e.naturalWidth>0));
  assert(await page.locator('#quickLinks').isVisible());
  await page.locator('#quickLinks').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert(await page.locator('#quickLinks').evaluate(el=>el.scrollTop>0));
  await page.getByRole('button',{name:'Eigener Link 6 in Tactical öffnen',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='linkOpen'&&x.linkId==='11')));console.log('PASS scroll and open last link');
  await page.locator('#addLink').click();await page.locator('#linkName').fill('Neu');await page.locator('#linkUrl').fill('https://example.org/');await page.locator('#saveLink').click();
  await page.waitForFunction(()=>!document.querySelector('#linkDialog').open);assert.equal(await page.locator('#quickLinks button').count(),13);
  await page.locator('#manageLinks').click();await page.locator('.manage-row').last().getByText('BEARBEITEN',{exact:true}).click();await page.locator('#linkName').fill('Geändert');await page.locator('#linkUrl').fill('https://changed.example.net/');await page.locator('#saveLink').click();await page.waitForFunction(()=>!document.querySelector('#linkDialog').open);
  await page.waitForFunction(()=>document.querySelector('#quickLinks button:last-child').dataset.url==='https://changed.example.net/'&&document.querySelector('#quickLinks button:last-child img').src.startsWith('data:image/')&&atob(document.querySelector('#quickLinks button:last-child img').src.split(',')[1]).includes('red'));
  assert(await page.locator('#quickLinks img').last().evaluate(e=>e.naturalWidth>0));
  await page.locator('#manageLinks').click();await page.locator('.manage-row').last().getByText('LÖSCHEN',{exact:true}).click();await page.locator('.manage-row').last().getByText('WIRKLICH LÖSCHEN?',{exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#quickLinks button').length===12);await page.locator('#closeManage').click();console.log('PASS add, edit, delete dialog wiring');
  await page.locator('#closeAppSettings').click();
  for(const mode of ['WORK','STANDBY','WARP']){
   await page.evaluate(mode=>testMessage({type:'activity',data:{mode,since:new Date().toISOString(),idleSeconds:mode==='STANDBY'?180:0,load:22,warpRequested:mode==='WARP'}}),mode);
   assert.equal(await page.locator('#shipMode').innerText(),mode);
  }
  console.log('PASS all three status renderings');
  await page.screenshot({path:path.resolve(__dirname,'../qa/before-zoom.png')});
  console.log('Zoom target diagnostics', await page.locator('#globe').evaluate(el=>{const r=el.getBoundingClientRect();const target=document.elementFromPoint(r.left+200,r.top+160);return {tag:target?.tagName,css:target?.className,text:document.querySelector('.cesium-widget-errorPanel')?.textContent};}));
  // Isolate wheel behavior from a still-running EARTH camera flight/rotation.
  const before=await page.evaluate(()=>{earthMotion.enabled=false;viewer.camera.cancelFlight();stopSmoothZoom();viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(16.3738,48.2082,26000000)});viewer.scene.requestRender();return viewer.camera.positionCartographic.height;});
  await page.locator('#globe').hover({position:{x:200,y:160}});await page.mouse.wheel(0,-120);
  // A browser wheel dispatch may return before its event is handled on CI.
  await page.waitForFunction(previous=>viewer.camera.positionCartographic.height < previous, before);
  await page.waitForFunction(()=>zoomTarget===null);
  const after=await page.evaluate(()=>viewer.camera.positionCartographic.height);assert(after<before&&after/before>.985, 'wheel height before='+before+' after='+after);console.log('PASS real Cesium wheel <1.5% height change');
  await page.locator('#quickLinks').evaluate(el=>el.scrollTop=0);
  const shot=path.resolve(__dirname,'../qa');fs.mkdirSync(shot,{recursive:true});
  await page.screenshot({path:path.join(shot,'dashboard-1500.png')});
  await page.locator('#layers').click();
  assert(await page.locator('#layerDialog').evaluate(el=>el.open));
  await page.locator('#layerOptions button[data-source="clouds"]').click();
  assert.equal(await page.locator('#clouds').getAttribute('aria-pressed'),'true');
  await page.locator('#closeLayers').click();
  await page.locator('#layers').click();await page.locator('#closeLayers').click();
  console.log('PASS LAYERS opens working selector and returns');
  await page.evaluate(()=>{setEarthMode(true);setEarthRotation(true);testMessage({type:'issOrbit',data:JSON.stringify([{NORAD_CAT_ID:25544,EPOCH:new Date().toISOString().replace('Z',''),MEAN_MOTION:15.5,ECCENTRICITY:0.0008,INCLINATION:51.64,RA_OF_ASC_NODE:59.25,ARG_OF_PERICENTER:16.45,MEAN_ANOMALY:347.6,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',ELEMENT_SET_NO:999,REV_AT_EPOCH:17344,BSTAR:0.000059,MEAN_MOTION_DOT:0.00003,MEAN_MOTION_DDOT:0}])});});
  await page.waitForFunction(()=>viewer.entities.values.some(e=>e.name==='ISS · berechnete Position'));
  assert((await page.locator('#issStatus').innerText()).includes('berechnet'));
  await page.locator('#issLocate').click();
  await page.waitForFunction(()=>!document.querySelector('#issMarker').hidden);
  await page.locator('#issMarker img').evaluate(e=>e.decode());
  await page.screenshot({path:path.resolve(__dirname,'../qa/iss-visible.png')});
  const issBefore=await page.evaluate(()=>{const e=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position');return e.position.getValue(viewer.clock.currentTime);});
  await page.waitForFunction(old=>{const e=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position');const p=e.position.getValue(viewer.clock.currentTime);return Math.abs(p.x-old.x)>100;},issBefore);
  await page.evaluate(()=>setEarthRotation(false));
  assert(await page.locator('#issStatus').isHidden());
  assert(!(await page.evaluate(()=>viewer.entities.values.some(e=>e.name==='ISS · berechnete Position'))));
  await page.evaluate(()=>{setEarthRotation(true);testMessage({type:'issOrbit',data:JSON.stringify([{NORAD_CAT_ID:25544,EPOCH:'2020-01-01T00:00:00',MEAN_MOTION:15.5,ECCENTRICITY:.0008,INCLINATION:51.64,RA_OF_ASC_NODE:59.25,ARG_OF_PERICENTER:16.45,MEAN_ANOMALY:347.6,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',ELEMENT_SET_NO:999,REV_AT_EPOCH:17344,BSTAR:.000059,MEAN_MOTION_DOT:.00003,MEAN_MOTION_DDOT:0}])});});
  assert((await page.locator('#issStatus').innerText()).includes('veraltet'));
  assert(!(await page.evaluate(()=>viewer.entities.values.some(e=>e.name==='ISS · berechnete Position'))));
  await page.evaluate(()=>setEarthRotation(false));
  console.log('PASS ISS moves, hides on EARTH OFF and rejects stale orbital data');
  // Start without Internet, then reconnect while weather/radar requests are stale.
  await page.evaluate(()=>{window.savedWeather=report;radarWanted=true;testMessage({type:'connectivity',connected:false,networkAvailable:false,link:'KEIN NETZWERK'});});
  assert.equal(await page.locator('#connection').innerText(),'INTERNET OFFLINE');
  const beforeReconnect=await page.evaluate(()=>{window.oldMap=osm;window.recoveryCounts={};for(const t of ['weather','radar','updateCheck'])recoveryCounts[t]=testSent.filter(m=>m.type===t).length;return recoveryCounts;});
  await page.evaluate(()=>testMessage({type:'connectivity',connected:true,networkAvailable:true,link:'WLAN'}));
  assert.equal(await page.locator('#connection').innerText(),'INTERNET VERBUNDEN');
  assert(await page.evaluate(()=>osm!==oldMap&&viewer.imageryLayers.contains(osm)),'Failed detail tiles recreated after reconnect');
  for(const type of ['weather','radar','updateCheck'])assert.equal(await page.evaluate(t=>testSent.filter(m=>m.type===t).length,type),beforeReconnect[type]+1,type+' automatically reloads');
  await page.evaluate(()=>testMessage({type:'connectivity',connected:true,networkAvailable:true,link:'WLAN'}));
  assert.equal(await page.evaluate(()=>testSent.filter(m=>m.type==='weather').length),beforeReconnect.weather+1,'Repeated online probe does not duplicate requests');
  await page.evaluate(()=>testMessage({type:'error',id:pendingWeather,message:'Weather service unavailable'}));
  assert.equal(await page.locator('#connection').innerText(),'INTERNET VERBUNDEN','Weather service failure must not pretend Internet is offline');
  await page.evaluate(()=>{report=savedWeather;renderWeather();renderForecast();});
  console.log('PASS offline startup/reconnection refreshes weather, radar, map and updates once');
  // View the sun-facing meridian and its opposite, with the real clock/SunLight.
  await page.evaluate(()=>{earthMotion.enabled=false;setEarthMode(true);viewer.camera.cancelFlight();stopSmoothZoom();viewer.scene.light=new Cesium.SunLight();const now=new Date();window.dayLon=180-(now.getUTCHours()+now.getUTCMinutes()/60)*15;viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(dayLon,0,26000000)});radarWanted=false;syncRadar();});
  await page.waitForFunction(()=>viewer.scene.globe.tilesLoaded);
  const brightness=()=>page.evaluate(()=>new Promise(resolve=>{const remove=viewer.scene.postRender.addEventListener(()=>{remove();const gl=viewer.scene.context._gl,pixels=new Uint8Array(32*32*4);gl.readPixels(Math.floor(gl.drawingBufferWidth/2)-16,Math.floor(gl.drawingBufferHeight/2)-16,32,32,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let sum=0;for(let i=0;i<pixels.length;i+=4)sum+=pixels[i]+pixels[i+1]+pixels[i+2];resolve(sum/(32*32*3));});viewer.scene.requestRender();}));
  const dayBefore=await brightness();assert(dayBefore>30,'Sunlit hemisphere actually renders brightly');
  await page.evaluate(async data=>{const image=new Image();image.src=data;await image.decode();window.originalRadarRequest=Cesium.UrlTemplateImageryProvider.prototype.requestImage;Cesium.UrlTemplateImageryProvider.prototype.requestImage=function(){return Promise.resolve(image);};radarWanted=true;showRadar({url:'https://radar-fixture.invalid/{z}/{x}/{y}.png',generatedAt:new Date().toISOString()});},'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'fixtures/radar-2026-10-07.png')).toString('base64'));
  await page.waitForFunction(()=>viewer.scene.globe.tilesLoaded,null,{timeout:60000});
  const dayWithRadar=await brightness();assert(Math.abs(dayBefore-dayWithRadar)<5,'Radar does not darken the sunlit hemisphere: '+dayBefore+' vs '+dayWithRadar);
  await page.screenshot({path:path.resolve(__dirname,'../qa/radar-day.png')});
  await page.evaluate(()=>viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(dayLon+180,0,26000000)}));
  await page.waitForFunction(()=>viewer.scene.globe.tilesLoaded,null,{timeout:60000});
  const nightWithRadar=await brightness();assert(nightWithRadar<dayWithRadar*.6,'Night side remains darker independently of radar');
  await page.screenshot({path:path.resolve(__dirname,'../qa/radar-night.png')});
  await page.evaluate(()=>{radarWanted=false;syncRadar();Cesium.UrlTemplateImageryProvider.prototype.requestImage=originalRadarRequest;viewer.scene.light=new Cesium.SunLight();setEarthMode(false);});
  assert(!(await page.evaluate(()=>viewer.scene.globe.enableLighting||nightLayer.show)),'Radar removal preserves EARTH mode');
  console.log('PASS rendered pixels: daylight survives radar and night remains dark');

  await page.locator('[data-action="web"]').click();
  assert(await page.evaluate(()=>testSent.some(m=>m.type==='menu'&&m.action==='web')));
  assert(await page.evaluate(()=>testSent.some(m=>m.type==='waterLevel')));
  await page.evaluate(()=>testMessage({type:'waterLevel',state:'error'}));
  assert((await page.locator('#waterStatus').innerText()).includes('nicht verfügbar'));
  await page.locator('#waterOpen').click();
  assert(await page.evaluate(()=>testSent.some(m=>m.type==='menu'&&m.action==='water')));
  await page.evaluate(()=>testMessage({type:'waterLevel',state:'ready',fetchedAt:new Date().toISOString(),data:document.querySelector('#targetIcon').src}));
  // Only data PNGs from the isolated chart renderer are accepted.
  assert(await page.locator('#waterImage').isHidden());
  await page.evaluate(data=>testMessage({type:'waterLevel',state:'ready',fetchedAt:new Date().toISOString(),data}),'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'fixtures/radar-2026-10-07.png')).toString('base64'));
  await page.waitForFunction(()=>!document.querySelector('#waterImage').hidden);
  assert((await page.locator('#waterStatus').innerText()).includes('Hydro NÖ'));
  await page.evaluate(()=>testMessage({type:'waterLevel',state:'error'}));
  assert((await page.locator('#waterStatus').innerText()).includes('NICHT AKTUELL'));
  assert(await page.locator('#waterImage').isVisible(),'Last fetched original remains visible but explicitly stale');
  // This is only a transport fixture, not a water-level measurement or release screenshot.
  await page.evaluate(()=>{document.querySelector('#waterImage').hidden=true;document.querySelector('#waterStatus').textContent='Test: Originalquelle wird im Windows-Build geprüft';});
  await page.evaluate(data=>testMessage({type:'waterLevel',state:'ready',fetchedAt:new Date().toISOString(),data}),'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'fixtures/radar-2026-10-07.png')).toString('base64'));
  await page.waitForFunction(()=>!document.querySelector('#waterImage').hidden);
  assert((await page.locator('#waterStatus').innerText()).includes('Hydro NÖ'));
  await page.evaluate(()=>testMessage({type:'waterLevel',state:'error'}));
  assert((await page.locator('#waterStatus').innerText()).includes('NICHT AKTUELL'));
  assert(await page.locator('#waterImage').isVisible(),'Last fetched original remains visible but explicitly stale');
  // This is only a transport fixture, not a water-level measurement or release screenshot.
  await page.evaluate(()=>{document.querySelector('#waterImage').hidden=true;document.querySelector('#waterStatus').textContent='Test: Originalquelle wird im Windows-Build geprüft';});
  console.log('PASS portal action, water chart request, error state and source action');
  const graphic=await page.evaluate(async()=>{
   const result=[];for(const id of ['targetIcon','issMarker']){const e=document.getElementById(id),img=e.tagName==='IMG'?e:e.querySelector('img');await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let colored=0,transparent=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]===0)transparent++;if(pixels[i+3]>100&&pixels[i]+pixels[i+1]+pixels[i+2]>150)colored++;}result.push({id,colored,transparent,total:c.width*c.height,corner:pixels[3]});}return result;
  });
  for(const g of graphic){assert(g.colored>30,g.id+' visible shape');assert(g.transparent>g.total*.2,g.id+' transparent background');assert.equal(g.corner,0);}
  assert(await page.locator('#cityLabel').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(e).borderTopWidth==='0px'));
  console.log('PASS real raster pixels: transparent corners and colored symbols, transparent city label');
  for(const [width,height] of [[1280,720],[1200,740],[950,590],[1920,1080]]){
   await page.setViewportSize({width,height});
   if(width===1280){
    const layout=await page.evaluate(()=>{const b=s=>document.querySelector(s).getBoundingClientRect();return {map:b('.map-wrap').height,weatherRight:b('.weather-compact').right,sunLeft:b('.celestial-panel').left,scaleRight:b('.map-scale').right,controlsLeft:b('.map-controls').left};});
    assert(layout.map>230,'Map is taller than old 184px at 720p');
    const controls=await page.evaluate(()=>[...document.querySelectorAll('#layerTray button')].map(e=>{const b=e.getBoundingClientRect();return {y:b.y,right:b.right};}));assert(Math.max(...controls.map(x=>x.y))-Math.min(...controls.map(x=>x.y))<2,'All weather controls one row');
    const h=await page.locator('.map-wrap').evaluate(e=>e.getBoundingClientRect().height);await page.evaluate(()=>radarStatus('Radar test with a long status message',false));assert.equal(await page.locator('.map-wrap').evaluate(e=>e.getBoundingClientRect().height),h,'Radar status never shrinks map');for(const temp of ['18,8 °C','−28,8 °C','100,0 °C']){await page.locator('#temperature').evaluate((e,t)=>e.textContent=t,temp);assert(await page.evaluate(()=>document.querySelector('#temperature').getBoundingClientRect().right+4<document.querySelector('#weatherDetails').getBoundingClientRect().left),'Temperature unit clear of divider: '+temp);}await page.locator('#temperature').evaluate(e=>e.textContent='23 °C');
    assert(layout.sunLeft>=layout.weatherRight,'Sun/moon beside weather');assert(layout.scaleRight<layout.controlsLeft,'Altitude clear of controls');
   }
   if(width===1280)await page.screenshot({path:path.join(shot,'dashboard-1280.png')});
   assert(await page.locator('#waterOpen').isVisible());
   assert(await page.locator('#waterOpen').evaluate(el=>el.clientHeight>0));
   for(const id of ['radar','clouds','rain','heat','dustToggle','lightningToggle']){
    assert(await page.locator('#'+id).isVisible(),id+' stays visible after repeated LAYERS clicks');
    const bounds=await page.locator('#'+id).boundingBox();
    assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height,id+' within viewport');
   }
   const aligned=await page.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect();
    return Math.abs(box('.targets').right-box('.tactical').right)<1&&Math.abs(box('.quick').left-box('.forecast').left)<1&&Math.abs(box('.quick').right-box('.forecast').right)<1;
   });assert(aligned,'Shared panel edges');
   assert(await page.evaluate(()=>{const cells=[...document.querySelectorAll('.celestial-events b')];const x=e=>{return e.querySelector(".time-colon").getBoundingClientRect().x;};return Math.abs(x(cells[0])-x(cells[2]))<1&&Math.abs(x(cells[1])-x(cells[3]))<1;}),'Sun/moon colons vertically aligned');
   assert(await page.evaluate(()=>{const a=[...document.querySelectorAll('.event-arrow')].map(e=>e.getBoundingClientRect().x);return Math.abs(a[0]-a[2])<1&&Math.abs(a[1]-a[3])<1;}),'Sun/moon arrows vertically aligned');
   assert(await page.evaluate(()=>[...document.querySelectorAll('.celestial-events>span')].every(e=>{const b=e.querySelector('b').getBoundingClientRect(),r=e.getBoundingClientRect(),s=e.querySelector('span').getBoundingClientRect();return b.right+6<r.right&&b.left-s.right<6;})),'Times beside label and clear of border');
   assert(await page.evaluate(()=>Math.abs(document.querySelector('.quick h2').getBoundingClientRect().height-document.querySelector('.targets h2').getBoundingClientRect().height)<1),'Quicklaunch and Targets header equal height');
  }
  console.log('PASS water chart panel layout at 950x590, 1200x740, 1500x940 and 1920x1080');
  await page.screenshot({path:path.join(shot,'dashboard-1920.png')});
  const touch=await browser.newContext({viewport:{width:950,height:590},hasTouch:true});
  const touchPage=await touch.newPage();
  await touchPage.goto('http://127.0.0.1:'+server.address().port+'/Web/index.html');
  await touchPage.waitForSelector('#waterOpen');
  const touchBounds=await touchPage.locator('.quick').boundingBox(),footerBounds=await touchPage.locator('footer').boundingBox();
  assert(touchBounds.y+touchBounds.height<=footerBounds.y);console.log('PASS compact touch layout avoids footer overlap');
  await touch.close();
  if(process.env.PANDA_ASSETS_ROOT)console.log('PASS second pass against published build assets: '+assets);
  assert.deepEqual(errors,[]);console.log('PASS no JavaScript runtime errors');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
