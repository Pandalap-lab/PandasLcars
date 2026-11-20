// Exercises the real solar scripts and styles in isolation; the main dashboard
// regression separately loads index.html and the rest of the native bridge.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PANDA_ASSETS_ROOT?path.resolve(process.env.PANDA_ASSETS_ROOT):path.resolve(__dirname,'../PandaLcarsTactical/Assets');
const executable=process.env.PANDA_BROWSER_EXECUTABLE||process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const launch=executable?{executablePath:executable}:{channel:'msedge'};
const fixture='<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="/Web/dashboard.css"><link rel="stylesheet" href="/Web/roadster.css"><style>.solar-test-home{width:180px;height:145px;margin:16px}.solar-test-home>.insignia{width:100%;height:100%}</style></head><body><main class="solar-test-home"><div class="insignia"></div></main><script src="/Web/astronomy.browser.min.js"></script><script src="/Web/roadster.js"></script><script src="/Web/solar-system.js"></script></body></html>';
(async()=>{
 const browser=await chromium.launch({headless:true,...launch});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://panda.local/**',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/solar-test')return route.fulfill({contentType:'text/html',body:fixture});
  const file=path.join(base,u.pathname.slice(1));
  if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
  const type={'.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({contentType:type,body:fs.readFileSync(file)});
 });
 await page.clock.install({time:new Date('2026-11-20T20:00:00Z')});
 await page.goto('https://panda.local/solar-test');
 await page.waitForFunction(()=>window.pandaSolar?.state.roadster);
 assert.equal(await page.locator('#roadsterDetails').isVisible(),false);
 assert.equal((await page.evaluate(()=>pandaSolar.state.positions)).length,8);
 const point=await page.evaluate(()=>pandaSolar.state.roadsterScreen),canvas=await page.locator('#solarCanvas').boundingBox();
 await page.mouse.click(canvas.x+point[0],canvas.y+point[1]);
 assert.ok(await page.locator('#solarDialog').evaluate(e=>e.open));
 assert.equal(await page.locator('#roadsterDetails').isVisible(),true);
 assert.match(await page.locator('#roadsterStatus').textContent(),/keine Live-Telemetrie/);
 assert.match(await page.locator('#roadsterSpeed').textContent(),/km\/h/);
 for(const [width,height] of [[1280,720],[1024,768],[1920,1080]]){
  await page.setViewportSize({width,height});
  const geometry=await page.evaluate(()=>{
   const ids=['solarDialog','solarCanvas','roadsterDetails','solarDetails','solarClose'];
   return Object.fromEntries(ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return [id,{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}];}));
  });
  assert.ok(geometry.solarDialog.bottom<=height+1&&geometry.solarDialog.right<=width+1,JSON.stringify(geometry));
  assert.ok(geometry.solarCanvas.height>200&&geometry.solarCanvas.width>300,JSON.stringify(geometry));
  assert.ok(geometry.solarCanvas.bottom<=geometry.solarDetails.y+1,JSON.stringify(geometry));
  assert.ok(geometry.roadsterDetails.scrollHeight<=geometry.roadsterDetails.clientHeight+1,JSON.stringify(geometry));
  assert.ok(geometry.solarClose.bottom<=geometry.solarDialog.bottom,JSON.stringify(geometry));
 }
 await page.setViewportSize({width:1280,height:720});
 await page.locator('#solarCenter').click();assert.deepEqual(await page.evaluate(()=>pandaSolar.state.angles),[0,0,0]);
 for(const axis of ['X','Y','Z'])await page.locator('#solar'+axis).click();
 assert.ok((await page.evaluate(()=>pandaSolar.state.angles)).every(x=>x>0));
 fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});
 await page.screenshot({path:path.resolve(__dirname,'../qa/roadster-1280.png')});
 await page.locator('#solarClose').click();assert.equal(await page.locator('#roadsterDetails').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'solarExpand');
 await page.locator('#solarCanvas').press('r');assert.ok(await page.locator('#solarDialog').evaluate(e=>e.open));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#solarDialog').evaluate(e=>e.open),false);
 await page.clock.setSystemTime(new Date('2033-01-01T12:00:00Z'));await page.reload();
 await page.locator('#solarExpand').click();
 assert.equal(await page.evaluate(()=>pandaSolar.state.roadster),null);
 assert.equal(await page.locator('#roadsterSpeed').textContent(),'—');
 assert.match(await page.locator('#roadsterStatus').textContent(),/nicht verfügbar/);
 assert.equal((await page.evaluate(()=>pandaSolar.state.positions)).length,8);
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS Roadster UI: car click, 8 planets, controls, source/expiry, 3 layouts, focus and Escape');
})().catch(e=>{console.error(e);process.exit(1)});
