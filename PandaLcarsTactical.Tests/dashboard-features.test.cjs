const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PANDA_ASSETS_ROOT?path.resolve(process.env.PANDA_ASSETS_ROOT):path.resolve(__dirname,'../PandaLcarsTactical/Assets');
fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1504,height:776}}),errors=[];let live=false;const warningQueries=[];page.on('pageerror',e=>errors.push(e.message));
 const dust={timestamps:[],reference_time:'',features:[{geometry:{type:'Point',coordinates:[16.4,48.2]},properties:{parameters:{dust:{unit:'mg m-2',data:[.06]}}}}]};const hour=new Date();hour.setUTCMinutes(0,0,0);dust.timestamps=[hour.toISOString()];dust.reference_time=hour.toISOString();
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='panda.local'){
   let relative=decodeURIComponent(u.pathname).replace(/^\//,'');
   let file=path.join(base,relative);
   if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
   return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  }
  if(u.hostname==='warnungen.zamg.at'){
   warningQueries.push(u.search);if(live)return route.continue();
   const code=u.searchParams.get('lon')==='16.45'?92201:u.searchParams.get('lon')==='16.47'?30740:90101;
   return route.fulfill({json:{type:'Feature',properties:{location:{properties:{gemeindenr:code,name:code===92201?'Wien-Donaustadt':code===30740?'Schwechat':'Wien-Innere Stadt'}},warnings:[]}}});
  }
  if(u.hostname==='dataset.api.hub.geosphere.at')return live?route.continue():route.fulfill({json:dust});
  return route.abort();
 });
 await page.addInitScript(()=>{
  const listeners=[];window.testMessage=data=>listeners.forEach(fn=>fn({data}));window.testSent=[];
  window.chrome={webview:{addEventListener:(name,fn)=>listeners.push(fn),postMessage:msg=>{testSent.push(msg);if(msg.type==='connectivity')setTimeout(()=>testMessage({type:'connectivity',connected:false,networkAvailable:true,link:'WLAN'}),20);}}};
 });
 await page.goto('https://panda.local/Web/index.html');await page.waitForFunction(()=>window.pandaLunar?.state&&document.querySelector('#dustLocalSummary').textContent.includes('mg/m²'));
 await page.waitForFunction(()=>typeof viewer!=='undefined'&&!!viewer);
 assert.deepEqual(errors,[]);
 assert.equal(await page.locator('.solar-tools').isVisible(),false);
 assert.equal(await page.locator('.title-panda').isVisible(),true);
 assert.ok(!(await page.locator('#connection').textContent()).includes('OFFLINE'));
 await page.evaluate(()=>{window.pandaLastServiceSuccess=0;testMessage({type:'connectivity',connected:false,networkAvailable:true});});
 assert.equal(await page.locator('#connection').textContent(),'VERBINDUNGSPRÜFUNG UNBESTÄTIGT');
 const count=await page.evaluate(()=>testSent.filter(m=>m.type==='weather').length);await page.evaluate(()=>{pendingWeather=null;loadWeather();});
 assert.ok(await page.evaluate(c=>testSent.filter(m=>m.type==='weather').length>c,count));
 await page.evaluate(()=>window.pandaServiceReachable('GeoSphere'));assert.equal(await page.locator('#connection').textContent(),'INTERNET VERBUNDEN');
 await page.evaluate(()=>testMessage({type:'connectivity',connected:false,networkAvailable:true}));assert.equal(await page.locator('#connection').textContent(),'INTERNET VERBUNDEN');
 const moon=await page.evaluate(()=>{const s=pandaLunar.calculate(new Date('2026-10-14T15:00:00Z'));return {fraction:s.fraction,phase:s.phase,rise:s.rise?.toISOString(),set:s.set?.toISOString(),full:s.full?.toISOString(),newMoon:s.newMoon?.toISOString(),dst:[pandaLunar.midnight(new Date('2026-03-29T12:00:00Z')).toISOString(),pandaLunar.midnight(new Date('2026-03-30T12:00:00Z')).toISOString()]};});
 assert.ok(moon.fraction>0&&moon.fraction<1);assert.ok(moon.phase>0&&moon.phase<180);assert.equal(moon.rise.slice(11,16),'09:41');assert.equal(moon.set.slice(11,16),'17:26');assert.equal((Date.parse(moon.dst[1])-Date.parse(moon.dst[0]))/3600000,23);
 assert.ok(Date.parse(moon.full)>Date.parse('2026-10-14'));assert.ok(Date.parse(moon.newMoon)>Date.parse('2026-10-14'));
 await page.locator('#solarExpand').click();assert.equal(await page.locator('.solar-tools').isVisible(),true);await page.locator('#solarClose').click();assert.equal(await page.locator('.solar-tools').isVisible(),false);
 assert.ok(!await page.locator('#moonCanvas').isVisible());assert.equal(await page.locator('.celestial-panel #lunarStatus').count(),0);
 await page.locator('#openLunar').click();assert.ok(await page.locator('#lunarDialog').evaluate(e=>e.open));assert.ok(await page.locator('#moonCanvas').isVisible());await page.locator('#lunarDialog button').click();assert.ok(!await page.locator('#lunarDialog').evaluate(e=>e.open));assert.ok(!await page.locator('#moonCanvas').isVisible());
 await page.locator('#environmentExpand').click();assert.equal(await page.locator('#weatherAlert details').isVisible(),true);await page.locator('#environmentClose').click();assert.equal(await page.locator('#weatherAlert details').isVisible(),false);
 const before=warningQueries.length;
 await page.evaluate(()=>selectPlace({name:'Berlin',latitude:52.52,longitude:13.405,country:'Deutschland'}));
 assert.equal(await page.locator('#weatherAlert>b').textContent(),'WEATHER ALERT · BERLIN');assert.equal(await page.locator('.alert-state').textContent(),'Keine Daten · außerhalb Wien');assert.ok(!await page.locator('.alert-scale').isVisible());assert.equal(warningQueries.length,before);
 await page.evaluate(()=>selectPlace({name:'Donaustadt',latitude:48.24,longitude:16.45,country:'Österreich'}));
 await page.waitForFunction(()=>document.querySelector('.alert-state').textContent==='Keine aktive Warnung');assert.ok((await page.locator('#weatherAlert').getAttribute('title')).includes('Wien-Donaustadt'));assert.ok(warningQueries.at(-1).includes('lon=16.45&lat=48.24'));
 await page.evaluate(()=>selectPlace({name:'Schwechat',latitude:48.14,longitude:16.47,country:'Österreich'}));await page.waitForFunction(()=>document.querySelector('.alert-state').textContent==='Keine Daten · außerhalb Wien');
 await page.evaluate(()=>selectPlace(vienna));await page.waitForFunction(()=>document.querySelector('.alert-state').textContent==='Keine aktive Warnung');
 await page.evaluate(()=>{
  const original=window.fetch;
  window.fetch=(url,options)=>String(url).includes('/getWarningsForCoords')?new Promise(resolve=>window.resolveOldWarning=()=>resolve(new Response(JSON.stringify({type:'Feature',properties:{location:{properties:{gemeindenr:90101}},warnings:[{properties:{warnstufeid:3,warntypid:5,rawinfo:{start:Date.now()/1000-60,end:Date.now()/1000+3600}}}]}}),{status:200}))):original(url,options);
  selectPlace(vienna);selectPlace({name:'Berlin',latitude:52.52,longitude:13.405,country:'Deutschland'});resolveOldWarning();window.fetch=original;
 });
 await page.waitForTimeout(100);assert.equal(await page.locator('.alert-state').textContent(),'Keine Daten · außerhalb Wien');assert.ok(!await page.locator('.alert-scale i').isVisible());
 await page.evaluate(()=>selectPlace(vienna));await page.waitForFunction(()=>document.querySelector('.alert-state').textContent==='Keine aktive Warnung');
 for(const [width,height] of [[1920,1080],[1504,776],[1366,768],[1280,720],[1024,768]]){
  await page.setViewportSize({width,height});const sizes=await page.evaluate(()=>{const tile=document.querySelector('.dust-panel'),foot=document.querySelector('footer'),moon=document.querySelector('#lunarStatus');return {scroll:tile.scrollHeight,client:tile.clientHeight,footer:foot.getBoundingClientRect().bottom,moonBottom:moon.getBoundingClientRect().bottom,weatherBottom:document.querySelector('.weather-dock').getBoundingClientRect().bottom};});
  assert.ok(sizes.footer<=height+1,JSON.stringify(sizes));assert.ok(sizes.moonBottom<=sizes.weatherBottom+1,JSON.stringify(sizes));
  if(width>=1280)assert.ok(sizes.scroll<=sizes.client+2,'Compact tile should fit: '+JSON.stringify(sizes));
 }
 await page.setViewportSize({width:1504,height:776});await page.screenshot({path:path.resolve(__dirname,'../qa/dashboard-features.png'),fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS feature regression: lunar/DST, targets/races, offline recovery, compact panels, five layouts');
})().catch(e=>{console.error(e);process.exit(1)});
