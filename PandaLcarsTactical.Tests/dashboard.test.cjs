const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const assets=path.resolve(__dirname,'../PandaLcarsTactical/Assets');
const server=http.createServer((req,res)=>{
 const file=path.resolve(assets,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(assets+path.sep)){res.writeHead(403).end();return;}
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.wasm':'application/wasm'};
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
   window.testLinks=['Kronen Zeitung','DER STANDARD','Heute','Facebook','OE24',...Array.from({length:7},(_,i)=>'Eigener Link '+(i+1))].map((name,i)=>({id:String(i),name,url:'https://example.com/'+i,custom:i>=5}));
   window.testMessage=data=>listeners.forEach(fn=>fn({data}));
   window.testSent=[];
   window.chrome={webview:{addEventListener:(name,fn)=>listeners.push(fn),postMessage:msg=>{
    window.testSent.push(msg);
    if(msg.type==='displaySettings')setTimeout(()=>window.testMessage({type:'displaySettings',monitors:[{id:'monitor-test',name:'Monitor 3',width:1920,height:1080,primary:false}],monitorId:'monitor-test',fullscreen:true,autostart:true}),10);
    if(msg.type==='services')setTimeout(()=>window.testMessage({type:'services',data:[{id:'photos',name:'Google Fotos',enabled:false,status:'NICHT EINGERICHTET'}]}),10);
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
  await page.getByRole('button',{name:'IM BROWSER EINRICHTEN',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='serviceOpen'&&x.serviceId==='photos')));
  await page.evaluate(()=>testMessage({type:'services',data:[{id:'photos',name:'Google Fotos',enabled:true,status:'IM BROWSER · STATUS UNBEKANNT'}]}));
  assert((await page.locator('#serviceSummary').innerText()).includes('STATUS ?'));
  await page.getByRole('button',{name:'ZUORDNUNG ENTFERNEN',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='serviceRemove'&&x.serviceId==='photos')));
  fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'../qa/settings-1500.png')});
  await page.locator('#closeAppSettings').click();
  assert(!(await page.locator('#appSettings').evaluate(el=>el.open)));
  console.log('PASS services settings, truthful status, remove and return');
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
  await page.evaluate(()=>testMessage({type:'update',state:'current',message:'AKTUELL'}));
  assert.equal(await page.locator('.insignia svg text').textContent(),'NCC-080470');
  assert.equal(await page.locator('.ship svg text').textContent(),'NCC-080470');
  assert.equal(await page.locator('#quickLinks img').count(),12);
  console.log('PASS monitor settings, menu routing, update states, NCC lettering and icon slots');
  assert.equal(await visible(),8);console.log('PASS exactly eight visible quicklaunch tiles');
  await page.locator('#quickLinks').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert(await page.locator('#quickLinks').evaluate(el=>el.scrollTop>0));assert.equal(await visible(),8);
  await page.getByRole('button',{name:'Eigener Link 7 in Tactical öffnen',exact:true}).click();
  assert(await page.evaluate(()=>testSent.some(x=>x.type==='linkOpen'&&x.linkId==='11')));console.log('PASS scroll and open last link');
  await page.locator('#addLink').click();await page.locator('#linkName').fill('Neu');await page.locator('#linkUrl').fill('https://example.org/');await page.locator('#saveLink').click();
  await page.waitForFunction(()=>!document.querySelector('#linkDialog').open);assert.equal(await page.locator('#quickLinks button').count(),13);
  await page.locator('#manageLinks').click();await page.locator('.manage-row').last().getByText('BEARBEITEN',{exact:true}).click();await page.locator('#linkName').fill('Geändert');await page.locator('#saveLink').click();await page.waitForFunction(()=>!document.querySelector('#linkDialog').open);
  await page.locator('#manageLinks').click();await page.locator('.manage-row').last().getByText('LÖSCHEN',{exact:true}).click();await page.locator('.manage-row').last().getByText('WIRKLICH LÖSCHEN?',{exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#quickLinks button').length===12);await page.locator('#closeManage').click();console.log('PASS add, edit, delete dialog wiring');
  for(const mode of ['WORK','STANDBY','WARP']){
   await page.evaluate(mode=>testMessage({type:'activity',data:{mode,since:new Date().toISOString(),idleSeconds:mode==='STANDBY'?180:0,load:22,warpRequested:mode==='WARP'}}),mode);
   assert.equal(await page.locator('#shipMode').innerText(),mode);
  }
  console.log('PASS all three status renderings');
  await page.screenshot({path:path.resolve(__dirname,'../qa/before-zoom.png')});
  console.log('Zoom target diagnostics', await page.locator('#globe').evaluate(el=>{const r=el.getBoundingClientRect();const target=document.elementFromPoint(r.left+200,r.top+160);return {tag:target?.tagName,css:target?.className,text:document.querySelector('.cesium-widget-errorPanel')?.textContent};}));
  const before=await page.evaluate(()=>viewer.camera.positionCartographic.height);
  await page.locator('#globe').hover({position:{x:200,y:160}});await page.mouse.wheel(0,-120);
  // A browser wheel dispatch may return before its event is handled on CI.
  await page.waitForFunction(previous=>viewer.camera.positionCartographic.height < previous, before);
  await page.waitForFunction(()=>zoomTarget===null);
  const after=await page.evaluate(()=>viewer.camera.positionCartographic.height);assert(after<before&&after/before>.95, 'wheel height before='+before+' after='+after);console.log('PASS real Cesium wheel <5% height change');
  await page.locator('#quickLinks').evaluate(el=>el.scrollTop=0);
  const shot=path.resolve(__dirname,'../qa');fs.mkdirSync(shot,{recursive:true});
  await page.screenshot({path:path.join(shot,'dashboard-1500.png')});
  for(const [width,height] of [[1200,740],[950,590],[1920,1080]]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>{const r=document.querySelector('#quickLinks').getBoundingClientRect();return [...document.querySelectorAll('#quickLinks button')].filter(b=>{const q=b.getBoundingClientRect();return q.top>=r.top-1&&q.bottom<=r.bottom+1}).length===8;});
   assert.equal(await visible(),8);
   assert(await page.locator('#quickLinks').evaluate(el=>el.clientHeight>0));
  }
  console.log('PASS eight-tile layout at 950x590, 1200x740, 1500x940 and 1920x1080');
  await page.screenshot({path:path.join(shot,'dashboard-1920.png')});
  const touch=await browser.newContext({viewport:{width:950,height:590},hasTouch:true});
  const touchPage=await touch.newPage();
  await touchPage.goto('http://127.0.0.1:'+server.address().port+'/Web/index.html');
  await touchPage.waitForFunction(()=>document.querySelector('#quickLinks').style.getPropertyValue('--quick-row'));
  const touchBounds=await touchPage.locator('.quick').boundingBox(),footerBounds=await touchPage.locator('footer').boundingBox();
  assert(touchBounds.y+touchBounds.height<=footerBounds.y);console.log('PASS compact touch layout avoids footer overlap');
  await touch.close();
  assert.deepEqual(errors,[]);console.log('PASS no JavaScript runtime errors');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
