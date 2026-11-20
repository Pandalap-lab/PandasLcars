// Exercises the real 05 navigation and board against a deterministic native
// bridge. Fixtures are confined to this test and never shipped as live data.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PANDA_ASSETS_ROOT ? path.resolve(process.env.PANDA_ASSETS_ROOT) : path.resolve(__dirname, '../PandaLcarsTactical/Assets');
const qa = path.resolve(__dirname, '../qa'); fs.mkdirSync(qa, {recursive: true});
let browser, page;
const initialNow = Date.parse('2026-11-20T20:00:00Z');
const launches = Array.from({length: 10}, (_, i) => ({
  id: `launch-${i}`, name: i ? `Falcon 9 | Starlink Testmission ${i + 1}` : 'Falcon 9 | Testmission Wien',
  net: new Date(initialNow + (i ? i * 86400_000 : 1800_000)).toISOString(), precision: 'minute',
  status: {id: 1, name: 'Go for Launch', abbrev: 'Go', description: 'Test fixture status'},
  rocket: 'Falcon 9 Block 5', pad: 'Space Launch Complex 40', location: 'Cape Canaveral, FL, USA',
  description: 'Testdaten für die Prüfung von Mission, Startort, Datum und Kalenderauswahl.',
  streamUrl: i === 1 ? 'https://x.com/SpaceX/status/123456789' : i === 2 ? 'javascript:alert(1)' : 'https://www.spacex.com/launches/'
}));

(async () => {
  browser = await chromium.launch({headless: true, ...(process.platform === 'win32' ? {channel: 'msedge'} : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  page = await browser.newPage({viewport: {width: 1280, height: 720}}); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'panda.local') return route.abort();
    const file = path.join(base, decodeURIComponent(url.pathname).replace(/^\//, ''));
    if (!fs.existsSync(file)) return route.fulfill({status: 404, body: ''});
    return route.fulfill({body: fs.readFileSync(file), contentType: ({'.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json', '.wasm': 'application/wasm'})[path.extname(file)] || 'application/octet-stream'});
  });
  await page.addInitScript(now => {
    const RealDate = Date; window.testNow = now;
    window.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [window.testNow])); } static now() { return window.testNow; } };
    const listeners = []; window.testSent = [];
    window.testReply = data => listeners.forEach(listener => listener({data}));
    window.chrome = {webview: {addEventListener: (name, listener) => { if (name === 'message') listeners.push(listener); }, postMessage: message => window.testSent.push(message)}};
  }, initialNow);
  await page.goto('https://panda.local/Web/index.html');
  await page.waitForFunction(() => Boolean(window.pandaSpaceX));
  await page.evaluate(() => document.fonts.ready);
  const dashboardStyle = () => page.evaluate(() => Object.fromEntries(['.dashboard', '#solarCanvas', '#temperature'].map(selector => {
    const element = document.querySelector(selector), bounds = element.getBoundingClientRect(), style = getComputedStyle(element);
    return [selector, {width:bounds.width, height:bounds.height, font:style.font, color:style.color, background:style.backgroundColor}];
  })));
  const dashboardBeforeBoard = await dashboardStyle();
  const launchReply = async (data = {}) => page.evaluate(data => {
    const requestId = window.testSent.filter(message => message.type === 'spacexLaunches').at(-1).requestId;
    window.testReply({type: 'spacexLaunches', requestId, fetchedAt: new Date(Date.now()).toISOString(), stale: false, error: null, retryAt: null, ...data});
  }, data);
  const telemetryReply = async (data = {}) => page.evaluate(data => {
    const requestId = window.testSent.filter(message => message.type === 'spacexTelemetry').at(-1).requestId;
    window.testReply({type: 'spacexTelemetry', requestId, fetchedAt: new Date(Date.now()).toISOString(), stale: false, error: null, vehicles: [], ...data});
  }, data);
  const refresh = async data => { await page.locator('#sxRefresh').click(); await launchReply(data); };
  const advance = async milliseconds => page.evaluate(milliseconds => { window.testNow += milliseconds; document.dispatchEvent(new Event('visibilitychange')); }, milliseconds);
  const countdownParts = () => page.evaluate(() => ['sxDays','sxHours','sxMinutes','sxSeconds'].map(id => document.getElementById(id).textContent));
  const assertCountdown = async expected => {
    assert.equal(await page.locator('#sxCountdown').getAttribute('data-mode'), 'countdown');
    assert.equal(await page.locator('#sxCountdownDigits').isVisible(), true);
    assert.equal(await page.locator('#sxCountdownState').isVisible(), false);
    assert.deepEqual(await countdownParts(), expected);
  };
  const assertCountdownState = async (mode, expected) => {
    assert.equal(await page.locator('#sxCountdown').getAttribute('data-mode'), mode);
    assert.equal(await page.locator('#sxCountdownDigits').isVisible(), false, mode + ': numeric countdown must be hidden');
    assert.equal(await page.locator('#sxCountdownState').isVisible(), true);
    if (expected !== undefined) assert.equal(await page.locator('#sxCountdownState').textContent(), expected);
  };

  await page.locator('[data-action=data]').click();
  await page.waitForFunction(() => document.querySelector('#spacexBoard').open);
  assert.equal(await page.evaluate(() => testSent.filter(message => message.type === 'menu' && message.action === 'data').length), 0, '05 must not launch the old Explorer action');
  assert.equal(await page.evaluate(() => testSent.filter(message => message.type === 'spacexLaunches').length), 1, 'Opening must not duplicate launch requests');
  await launchReply({launches}); await telemetryReply();
  assert.equal(await page.locator('#sxCalendar button').count(), 10);
  assert.equal(await page.locator('#sxNextName').textContent(), launches[0].name);
  assert.match(await page.locator('#sxNextTime').textContent(), /21:30.*Wien/);
  await assertCountdown(['00','00','30','00']);
  assert.equal(await page.locator('#sxSelectedSummary').isVisible(), false, 'NEXT mission facts are not repeated in the detail card');
  assert.equal(await page.locator('#sxSelectedExtraFacts').isVisible(), false);
  assert.equal(await page.locator('#sxSelectedStatus').isVisible(), true);
  await page.locator('#sxLaunchImage').evaluate(image => image.decode());
  const launchImage = await page.locator('#sxLaunchImage').evaluate(image => ({source:image.currentSrc, width:image.naturalWidth, height:image.naturalHeight}));
  assert.ok(launchImage.source.startsWith('https://panda.local/Web/') && launchImage.width > 0 && launchImage.height > 0, 'Launch artwork must load from packaged local assets');
  assert.match(await page.locator('#sxLaunchImage').locator('..').textContent(), /Archivbild/);
  assert.deepEqual(await dashboardStyle(), dashboardBeforeBoard, 'SpaceX styling must not change the main dashboard or solar system');
  assert.equal(await page.locator('#sxAltitude').textContent(), '—');
  assert.equal(await page.locator('#sxMissionTime').textContent(), '—');
  assert.match(await page.locator('#sxTelemetryNote').textContent(), /keine aktive Starship-Telemetrie/);
  await page.screenshot({path:path.join(qa, 'spacex-board-1280x720.png')});
  await advance(16_000);
  await telemetryReply({vehicles:[],error:'SpaceX-Telemetrie nicht erreichbar',stale:true});
  assert.match(await page.locator('#sxTelemetryMission').textContent(), /nicht verfügbar/);
  assert.doesNotMatch(await page.locator('#sxTelemetryMission').textContent(), /Keine aktive/);
  assert.match(await page.locator('#sxTelemetryNote').textContent(), /nicht erreichbar/);
  await page.locator('#sxCalendar button').nth(1).click();
  assert.equal(await page.locator('#sxSelectedName').textContent(), launches[1].name);
  assert.equal(await page.locator('#sxNextName').textContent(), launches[0].name, 'Selecting another launch must not replace NEXT');
  assert.equal(await page.locator('#sxSelectedSummary').isVisible(), true);
  assert.equal(await page.locator('#sxSelectedExtraFacts').isVisible(), true);
  await page.screenshot({path:path.join(qa, 'spacex-board-selected-1280x720.png')});
  await page.locator('#sxStream').click();
  assert.equal(await page.evaluate(() => testSent.filter(message => message.type === 'spacexOpenLink').at(-1).url), launches[1].streamUrl);
  await page.evaluate(() => testReply({type:'spacexLinkResult', opened:false, message:'Test: Browser nicht erreichbar'}));
  assert.match(await page.locator('#sxStreamNote').textContent(), /Browser nicht erreichbar/);
  await page.locator('#sxCalendar button').nth(2).click(); assert.equal(await page.locator('#sxStream').isDisabled(), true, 'Unsafe stream URL must not open');
  await page.locator('#sxSource').click(); assert.equal(await page.evaluate(() => testSent.at(-1).url), 'https://thespacedevs.com/llapi');
  await page.locator('#sxCalendar button').first().click();

  for (const [width, height] of [[1920,1080], [1504,776], [1280,720], [950,590]]) {
    await page.setViewportSize({width, height});
    const layout = await page.locator('#spacexBoard').evaluate(element => { const r = element.getBoundingClientRect(); return {left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:element.clientWidth, scroll:element.scrollWidth}; });
    assert.ok(layout.left >= 0 && layout.top >= 0 && layout.right <= width + 1 && layout.bottom <= height + 1, JSON.stringify(layout));
    assert.ok(layout.scroll <= layout.width + 1, 'Board must not overflow horizontally: ' + JSON.stringify(layout));
    if (width === 1280) {
      const calendar = await page.locator('#sxCalendar').evaluate(element => ({height:element.clientHeight, scroll:element.scrollHeight}));
      assert.ok(calendar.scroll <= calendar.height + 2, 'All ten calendar rows should fit at 1280×720: ' + JSON.stringify(calendar));
      const fonts = await page.evaluate(() => Object.fromEntries(['#sxCalendar .sx-launch-label strong', '#sxCalendar .sx-launch-label > span', '#sxNextRocket', '#sxNextPad'].map(selector => [selector, parseFloat(getComputedStyle(document.querySelector(selector)).fontSize)])));
      for (const [selector, size] of Object.entries(fonts)) assert.ok(size >= 13, 'Readable mission text at 1280×720: ' + selector + ' is ' + size + 'px');
      const countdown = await page.locator('#sxCountdownDigits').evaluate(element => ({width:element.clientWidth, scroll:element.scrollWidth}));
      assert.ok(countdown.scroll <= countdown.width + 1, 'Four countdown fields must fit without horizontal clipping');
      await page.screenshot({path: path.join(qa, 'spacex-board-error-1280x720.png')});
    }
  }
  await page.setViewportSize({width:1280,height:720});

  // After liftoff a mission leaves the future calendar but its stream/details
  // must remain selected and reachable from the recent-mission selector.
  const recent = {...launches[0], net:'2026-11-20T19:59:00Z', status:{id:6,name:'In Flight'}};
  await refresh({launches:launches.slice(1), recentLaunches:[recent]});
  assert.equal(await page.locator('#sxNextName').textContent(), launches[1].name);
  assert.equal(await page.locator('#sxSelectedName').textContent(), recent.name);
  assert.equal(await page.locator('#sxSelectedStatus').textContent(), 'In Flight');
  assert.equal(await page.locator('#sxSelectedSummary').isVisible(), true, 'A recently launched mission remains distinguishable from NEXT');
  assert.equal(await page.locator('#sxRecent').inputValue(), recent.id);
  assert.equal(await page.locator('#sxStream').isDisabled(), false);
  await page.locator('#sxStream').click();
  assert.equal(await page.evaluate(() => testSent.filter(message => message.type === 'spacexOpenLink').at(-1).url), recent.streamUrl);
  await page.locator('#sxCalendar button').first().click();
  await page.locator('#sxRecent').selectOption(recent.id);
  assert.equal(await page.locator('#sxSelectedName').textContent(), recent.name);
  assert.equal(await page.locator('#sxNextName').textContent(), launches[1].name);
  await refresh({launches});

  // Telemetry remains explicitly Starship, even when a Falcon calendar row is selected.
  await advance(16_000);
  const observedAt = new Date(initialNow + 16_000).toISOString();
  await telemetryReply({vehicles:[{id:'SHIP-TEST', observedAt, missionTimeSeconds:180, altitudeKm:50.5, speedKmh:4000, stale:false}, {id:'BOOSTER-TEST', observedAt, missionTimeSeconds:150, altitudeKm:10, speedKmh:1000, stale:false}]});
  assert.match(await page.locator('#sxTelemetryMission').textContent(), /STARSHIP.*SHIP-TEST/);
  assert.equal(await page.locator('#sxAltitude').textContent(), '50,5');
  assert.equal(await page.locator('#sxMissionTime').textContent(), 'T+ 00:03:00');
  assert.equal(await page.locator('#sxVehicle').isVisible(), true);
  await page.screenshot({path:path.join(qa, 'spacex-board-telemetry-1280x720.png')});
  await page.locator('#sxVehicle').selectOption('BOOSTER-TEST'); assert.equal(await page.locator('#sxAltitude').textContent(), '10');
  await page.locator('#sxCalendar button').nth(3).click(); assert.match(await page.locator('#sxTelemetryMission').textContent(), /BOOSTER-TEST/);
  await advance(31_000); assert.equal(await page.locator('#sxAltitude').textContent(), '—'); assert.equal(await page.locator('#sxTelemetryState').textContent(), 'VERALTET');
  await telemetryReply({vehicles:[{id:'SHIP-TEST', observedAt:new Date(initialNow + 47_000).toISOString(), missionTimeSeconds:null, altitudeKm:null, speedKmh:null, stale:false}]});
  assert.equal(await page.locator('#sxAltitude').textContent(), '—', 'Missing telemetry must not become zero');
  assert.equal(await page.locator('#sxMissionTime').textContent(), '—');

  await refresh({launches, fetchedAt:'2026-11-19T20:00:00Z', stale:true});
  await assertCountdownState('stale', '—');
  assert.equal(await page.locator('#sxCalendar button').count(), 10, 'Stale cached missions stay inspectable');
  await refresh({launches:[], error:'Quelle offline', stale:true});
  assert.equal(await page.locator('#sxCalendar button').count(), 10, 'Transient failure preserves previous missions');
  assert.match(await page.locator('#sxDataStatus').textContent(), /Quelle offline/);
  await refresh({launches:[{...launches[0], status:{id:5,name:'On Hold'}}]});
  await assertCountdownState('hold', 'HOLD');
  await refresh({launches:[{...launches[0], precision:'day'}]});
  await assertCountdownState('approximate', 'ZEITFENSTER');
  assert.doesNotMatch(await page.locator('#sxNextTime').textContent(), /21:30/);
  await refresh({launches:[{...launches[0], status:{id:8,name:'To Be Confirmed'}}]});
  await assertCountdownState('tentative', 'VORLÄUFIG');
  await refresh({launches:[{...launches[0], net:'2026-11-20T19:59:00Z'}]});
  await assertCountdownState('pending', '—');
  assert.doesNotMatch(await page.locator('#sxCountdownState').textContent(), /T\+/);
  // Four visible values must roll over together and stop at NET, never into T+.
  const nextDay = await page.evaluate(() => new Date(Date.now() + 86_401_000).toISOString());
  await refresh({launches:[{...launches[0], net:nextDay, precision:'second'}]});
  await assertCountdown(['01','00','00','01']);
  await advance(2000); await assertCountdown(['00','23','59','59']);
  const finalSecond = await page.evaluate(() => new Date(Date.now() + 1000).toISOString());
  await refresh({launches:[{...launches[0], net:finalSecond, precision:'second'}]});
  await assertCountdown(['00','00','00','01']);
  await advance(1000); await assertCountdownState('pending', '—');
  await refresh({launches:[{...launches[0], name:'<img src=x onerror="window.xss=true">', description:'<script>window.xss=true</script>'}]});
  assert.equal(await page.locator('#sxSelectedName img').count(), 0); assert.equal(await page.evaluate(() => window.xss), undefined);
  await refresh({launches:[]}); assert.equal(await page.locator('#sxCalendar button').count(), 0); assert.equal(await page.locator('#sxCalendarEmpty').isVisible(), true);
  await refresh({launches:[], error:'HTTP 429 · später erneut versuchen', retryAt:'2026-11-20T21:00:00Z', stale:true});
  await assertCountdownState('empty', '—');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#spacexBoard').evaluate(element => element.open), false);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'data', 'Closing restores navigation focus');
  const requestsAtClose = await page.evaluate(() => testSent.filter(message => ['spacexLaunches','spacexTelemetry'].includes(message.type)).length); await advance(600_000);
  assert.equal(await page.evaluate(() => testSent.filter(message => ['spacexLaunches','spacexTelemetry'].includes(message.type)).length), requestsAtClose, 'Hidden board must not poll');
  assert.deepEqual(errors, [], 'No runtime JavaScript errors');
  await browser.close(); console.log('PASS SpaceX board: native navigation, packaged artwork, readable 10 Vienna launches, four-field countdown and day rollover, scoped styling, selection, safe streams, Starship freshness/nulls, no invented liftoff, stale/offline/HOLD/TBD, four layouts, keyboard return');
})().catch(async error => {
  console.error(error);
  try { if (page && !page.isClosed()) await page.screenshot({path:path.join(qa, 'spacex-board-failure.png')}); } catch {}
  try { if (browser) await browser.close(); } catch {}
  process.exitCode = 1;
});
