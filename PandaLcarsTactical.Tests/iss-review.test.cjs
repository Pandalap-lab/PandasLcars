const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PANDA_ASSETS_ROOT?path.resolve(process.env.PANDA_ASSETS_ROOT):path.resolve(__dirname,'../PandaLcarsTactical/Assets');
fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1504,height:776}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.hostname!=='panda.local')return route.abort();
  const relative=decodeURIComponent(u.pathname).replace(/^\//,'');
  const file=path.join(base,relative);
  if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.addInitScript(()=>{
  const handlers=[];window.testMessage=data=>handlers.forEach(fn=>fn({data}));window.sent=[];
  window.chrome={webview:{addEventListener:(type,fn)=>handlers.push(fn),postMessage:msg=>sent.push(msg)}};
 });
 await page.goto('https://panda.local/Web/index.html');await page.waitForFunction(()=>typeof viewer!=='undefined'&&!!viewer);
 const epoch=await page.evaluate(()=>{window.issTestTime=Date.now();Date.now=()=>issTestTime;return new Date(issTestTime).toISOString().replace('Z','');});
 const omm={NORAD_CAT_ID:25544,EPOCH:epoch,MEAN_MOTION:15.5,ECCENTRICITY:.0008,INCLINATION:51.64,RA_OF_ASC_NODE:59.25,ARG_OF_PERICENTER:16.45,MEAN_ANOMALY:347.6,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',ELEMENT_SET_NO:999,REV_AT_EPOCH:17344,BSTAR:.000059,MEAN_MOTION_DOT:.00003,MEAN_MOTION_DDOT:0};
 await page.evaluate(data=>{setEarthMode(true);setEarthRotation(true);testMessage({type:'issOrbit',data:JSON.stringify([data])});},omm);
 await page.waitForFunction(()=>viewer.entities.values.filter(e=>e.polyline).length===4);
 const tracking=await page.evaluate(omm=>{
  const actual=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position').position.getValue(viewer.clock.currentTime);
  const record=satellite.json2satrec(omm),date=new Date(issTestTime),pv=satellite.propagate(record,date),geo=satellite.eciToGeodetic(pv.position,satellite.gstime(date));
  const expected=Cesium.Cartesian3.fromRadians(geo.longitude,geo.latitude,geo.height*1000);
  const lines=viewer.entities.values.filter(e=>e.polyline);
  return {difference:Cesium.Cartesian3.distance(actual,expected),points:lines.map(e=>e.polyline.positions.getValue().length),widths:lines.map(e=>e.polyline.width.getValue()),dashed:lines[1].polyline.material instanceof Cesium.PolylineDashMaterialProperty};
 },omm);
 assert.ok(tracking.difference<.001);assert.deepEqual(tracking.points,[91,181,91,181]);assert.equal(tracking.dashed,true);assert.deepEqual(tracking.widths,[1.2,1.2,3.5,3.5]);
 const before=await page.evaluate(()=>{const p=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position').position.getValue(viewer.clock.currentTime);issTestTime+=1000;return {x:p.x,y:p.y,z:p.z};});
 await page.waitForFunction(old=>{const p=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position').position.getValue(viewer.clock.currentTime);return Cesium.Cartesian3.distance(p,new Cesium.Cartesian3(old.x,old.y,old.z))>100;},before);
 await page.locator('#issLocate').click();await page.waitForTimeout(1600);await page.waitForFunction(()=>!document.querySelector('#issMarker').hidden);
 const sizes=[];
 for(const height of [5000000,12000000,18000000]){
  await page.evaluate(height=>{const p=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position').position.getValue(viewer.clock.currentTime),c=Cesium.Cartographic.fromCartesian(p);viewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(c.longitude,c.latitude,height),orientation:{heading:0,pitch:-Cesium.Math.PI_OVER_TWO,roll:0}});viewer.scene.requestRender();},height);
  await page.waitForTimeout(150);const size=await page.locator('#issMarker img').boundingBox();assert.equal(size.width,36);assert.equal(size.height,27);sizes.push({height,width:size.width,imageHeight:size.height});
 }
 const alpha=await page.locator('#issMarker img').evaluate(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,1,1).data[3];});assert.equal(alpha,0);
 await page.evaluate(()=>{const p=viewer.entities.values.find(e=>e.name==='ISS · berechnete Position').position.getValue(viewer.clock.currentTime),c=Cesium.Cartographic.fromCartesian(p);viewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(c.longitude+Math.PI,-c.latitude,12000000)});viewer.scene.requestRender();});await page.waitForTimeout(200);assert.ok(!await page.locator('#issMarker').isVisible());
 await page.locator('#issLocate').click();await page.waitForTimeout(1600);
 await page.screenshot({path:path.resolve(__dirname,'../qa/iss-review-night.png')});
 await page.evaluate(()=>{const original=Cesium.JulianDate.now;Cesium.JulianDate.now=()=>Cesium.JulianDate.fromDate(new Date(issTestTime+12*3600000));viewer.clock.currentTime=Cesium.JulianDate.now();viewer.scene.requestRender();window.restoreIssClock=()=>{Cesium.JulianDate.now=original;};});await page.waitForTimeout(250);
 await page.screenshot({path:path.resolve(__dirname,'../qa/iss-review-day.png')});await page.evaluate(()=>restoreIssClock());
 await page.evaluate(()=>setEarthRotation(false));assert.ok(!await page.locator('#issMarker').isVisible());assert.equal(await page.evaluate(()=>viewer.entities.values.filter(e=>e.polyline).length),0);
 await page.evaluate(()=>setEarthRotation(true));await page.waitForFunction(()=>viewer.entities.values.filter(e=>e.polyline).length===4);
 await page.evaluate(omm=>{testMessage({type:'issOrbit',data:JSON.stringify([{...omm,EPOCH:'2020-01-01T00:00:00'}])});},omm);assert.ok(!await page.locator('#issMarker').isVisible());assert.ok(await page.locator('#issLocate').isDisabled());
 assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../qa/iss-review.json'),JSON.stringify({pass:true,tracking,sizes,transparent:true,errors,simulatedOrbit:true},null,2));
 await browser.close();console.log('PASS: same 36x27 size at 3 zooms, exact SGP4 position, track/pause/resume, occlusion, stale-data hiding, fine line/dash/halo, transparent asset, no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
