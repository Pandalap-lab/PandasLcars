import {formatLaunchTime, safeStreamUrl, viennaLaunchTime} from './spacex-mission.mjs';

// The native service owns network access and caching. A planned time is never
// treated as a measured liftoff; telemetry requires its own fresh source sample.
const FRESH_MS = 15 * 60_000, REFRESH_MS = 5 * 60_000, TELEMETRY_MS = 30_000;
const bridge = window.chrome?.webview;
const dialog = document.createElement('dialog');
dialog.id = 'spacexBoard';
dialog.setAttribute('aria-labelledby', 'sxTitle');
dialog.setAttribute('aria-describedby', 'sxSubtitle');
dialog.innerHTML = `
  <div class="sx-shell">
    <header class="sx-header">
      <div class="sx-section-number" aria-hidden="true">05</div>
      <div class="sx-heading"><p id="sxSubtitle">PANDAs LCARS · MISSIONSKONTROLLE</p><h1 id="sxTitle">SPACEX</h1></div>
      <div class="sx-header-time"><span>WIEN · EUROPE/VIENNA</span><time id="sxClock">—</time></div>
      <button id="sxClose" class="sx-close" type="button" aria-label="SpaceX schließen und zum Dashboard zurückkehren">ZURÜCK <span aria-hidden="true">↗</span></button>
    </header>
    <div class="sx-toolbar"><p id="sxDataStatus" role="status">Startdaten werden geladen …</p><button id="sxRefresh" type="button">AKTUALISIEREN <span aria-hidden="true">↻</span></button></div>
    <div class="sx-grid">
      <section class="sx-card sx-next" aria-labelledby="sxNextHeading">
        <h2 id="sxNextHeading"><span>01 · NÄCHSTER START</span><span class="sx-heading-end" aria-hidden="true">FLIGHT</span></h2>
        <div class="sx-next-body">
          <p id="sxNextStatus" class="sx-kicker">WARTE AUF DATEN</p><h3 id="sxNextName">Mission wird geladen</h3>
          <div class="sx-countdown-wrap"><span id="sxCountdownLabel">COUNTDOWN · GEPLANTER START</span><strong id="sxCountdown" aria-label="Countdown nicht verfügbar">—</strong><span id="sxCountdownNote">Starttermine können sich ändern.</span></div>
          <dl class="sx-next-facts"><div><dt>RAKETE</dt><dd id="sxNextRocket">—</dd></div><div><dt>STARTORT</dt><dd id="sxNextPad">—</dd></div><div><dt>WIENER UHRZEIT</dt><dd id="sxNextTime">—</dd></div></dl>
        </div>
      </section>
      <section class="sx-card sx-calendar" aria-labelledby="sxCalendarHeading">
        <h2 id="sxCalendarHeading"><span>02 · STARTKALENDER</span><span id="sxCount" class="sx-heading-end">00</span></h2>
        <div class="sx-calendar-caption"><span>SPACEX · NÄCHSTE MISSIONEN</span><span>ZEIT IN WIEN</span></div>
        <ol id="sxCalendar" aria-label="Kommende SpaceX-Missionen"></ol><p id="sxCalendarEmpty" class="sx-empty">Startkalender wird geladen …</p>
        <p class="sx-calendar-note">Mission wählen für Details und Übertragung.</p>
      </section>
      <section class="sx-card sx-telemetry" aria-labelledby="sxTelemetryHeading">
        <h2 id="sxTelemetryHeading"><span>03 · STARSHIP-TELEMETRIE</span><span id="sxTelemetryState" class="sx-heading-end">KEIN SIGNAL</span></h2>
        <div class="sx-telemetry-body">
          <p class="sx-kicker">SPACEX · ÖFFENTLICHER STARSHIP-TRACKER</p><p id="sxTelemetryMission" class="sx-telemetry-mission">Keine aktive Starship-Telemetrie</p><select id="sxVehicle" aria-label="Starship-Telemetriefahrzeug auswählen" hidden></select>
          <div class="sx-metrics"><div><span>HÖHE</span><strong id="sxAltitude">—</strong><small>km</small></div><div><span>GESCHWINDIGKEIT</span><strong id="sxSpeed">—</strong><small>km/h</small></div><div class="sx-mission-time"><span>MISSIONSZEIT</span><strong id="sxMissionTime">—</strong><small>gemessene Flugzeit</small></div></div>
          <p id="sxTelemetryNote" class="sx-note">Keine bestätigten Messwerte verfügbar.</p><p id="sxTelemetrySource" class="sx-source-line">Messwerte erscheinen nur mit Quelle und frischem Zeitstempel.</p>
        </div>
      </section>
      <section class="sx-card sx-detail" aria-labelledby="sxDetailHeading">
        <h2 id="sxDetailHeading"><span>04 · MISSIONSDATEN</span><select id="sxRecent" aria-label="Laufende oder kürzlich gestartete Mission auswählen" hidden></select></h2>
        <div class="sx-detail-body"><h3 id="sxSelectedName">Keine Mission ausgewählt</h3><p id="sxSelectedTime" class="sx-selected-time">—</p><dl class="sx-detail-facts"><div><dt>RAKETE</dt><dd id="sxSelectedRocket">—</dd></div><div><dt>STARTORT</dt><dd id="sxSelectedPad">—</dd></div><div><dt>STATUS</dt><dd id="sxSelectedStatus">—</dd></div></dl><p id="sxDescription" class="sx-description">Der Startkalender liefert Missionsdetails, sobald die Datenquelle erreichbar ist.</p></div>
      </section>
      <section class="sx-card sx-transmission" aria-labelledby="sxTransmissionHeading">
        <h2 id="sxTransmissionHeading"><span>05 · ÜBERTRAGUNG</span><span class="sx-heading-end" aria-hidden="true">LINK</span></h2>
        <div class="sx-transmission-body"><p id="sxStreamNote">Für diese Mission ist noch keine Übertragung hinterlegt.</p><button id="sxStream" type="button" disabled>MISSION-STREAM ÖFFNEN <span aria-hidden="true">↗</span></button><p class="sx-note">Öffnet die Übertragung im Browser. Startzeiten und Flugstatus sind keine Live-Telemetrie.</p><div class="sx-attribution"><span>STARTDATEN</span><button id="sxSource" type="button">The Space Devs · Launch Library 2 ↗</button></div></div>
      </section>
    </div>
    <footer class="sx-footer"><span>SPACEX · MISSION CONTROL</span><span id="sxFooterStatus">DATENQUELLE VERBINDEN</span><span>LCARS 05</span></footer>
    <p id="sxAnnouncement" class="sx-sr-only" aria-live="polite" aria-atomic="true"></p>
  </div>`;
document.body.append(dialog);
const $ = id => dialog.querySelector('#' + id);
let launches = [], recentLaunches = [], selectedId = null, fetchedAt = 0, sourceStale = true;
let lastError = '', pendingId = null, sequence = 0, requestTimeout = null, tickTimer = null;
let retryAt = 0, lastAttempt = 0, returnFocus = null, sample = null;
let vehicles = [], vehicleId = null, telemetryPendingId = null, telemetryTimeout = null;
let telemetryAttempt = 0, telemetryRetryAt = 0, telemetryStale = true, telemetryError = '', telemetryReceived = false;
const send = message => bridge?.postMessage(message);
const timestamp = launch => Date.parse(launch?.net ?? launch?.launchUtc ?? '');
const launchId = launch => String(launch?.id ?? '');
const selected = () => [...launches, ...recentLaunches].find(launch => launchId(launch) === selectedId) ?? null;
const statusName = launch => typeof launch?.status === 'string' ? launch.status : launch?.status?.name || 'Unbestätigt';
const statusId = launch => Number(launch?.status?.id);
const fresh = (now = Date.now()) => !sourceStale && fetchedAt > 0 && now - fetchedAt <= FRESH_MS && fetchedAt - now < 60_000;
const text = (id, value) => { const element = $(id), next = String(value || '—'); if (element.textContent !== next) element.textContent = next; };
const announce = value => { $('sxAnnouncement').textContent = value; };
const pad = value => String(value).padStart(2, '0');

function nextLaunch() {
  return launches.find(launch => ![3, 4, 7].includes(statusId(launch))) ?? launches[0] ?? null;
}

function countdownView(launch, now) {
  if (!launch) return {value: '—', label: 'COUNTDOWN NICHT VERFÜGBAR', note: 'Keine Startdaten verfügbar.', mode: 'empty'};
  if (!fresh(now)) return {value: '—', label: 'DATEN VERALTET', note: 'Countdown pausiert, bis die Startplanung bestätigt wurde.', mode: 'stale'};
  const id = statusId(launch), name = statusName(launch), net = timestamp(launch);
  if (id === 5 || /hold/i.test(name)) return {value: 'HOLD', label: 'COUNTDOWN ANGEHALTEN', note: 'Die Datenquelle meldet eine Startunterbrechung.', mode: 'hold'};
  if (id === 6 || /in flight/i.test(name)) return {value: 'IM FLUG', label: 'FLUGSTATUS LAUT QUELLE', note: 'Messwerte werden ausschließlich im Telemetriefeld angezeigt.', mode: 'flight'};
  if ([3, 4, 7].includes(id)) return {value: 'BEENDET', label: 'MISSIONSTATUS LAUT QUELLE', note: name, mode: 'ended'};
  if (!Number.isFinite(net)) return {value: 'TBD', label: 'STARTTERMIN OFFEN', note: 'Die Datenquelle nennt noch keinen gültigen Termin.', mode: 'unknown'};
  if (!['second', 'minute'].includes(launch.precision)) return {value: 'ZEITFENSTER', label: 'GENAUE STARTZEIT OFFEN', note: 'Der Termin ist nur ungefähr angegeben.', mode: 'approximate'};
  if (id !== 1) return {value: 'VORLÄUFIG', label: 'STARTZEIT UNBESTÄTIGT', note: name, mode: 'tentative'};
  if (net <= now) return {value: '—', label: 'STARTZEIT ERREICHT', note: 'Warte auf bestätigten Startstatus. Kein Start aus der Uhrzeit abgeleitet.', mode: 'pending'};
  const remaining = Math.ceil((net - now) / 1000);
  const days = Math.floor(remaining / 86400), hours = Math.floor(remaining % 86400 / 3600), minutes = Math.floor(remaining % 3600 / 60), seconds = remaining % 60;
  return {value: `${days ? days + 'd ' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, label: 'T− · GEPLANTER START', note: launch.precision === 'minute' ? 'Quelle nennt minutengenaue Startzeit · Änderungen möglich.' : 'Countdown zum veröffentlichten Termin · Änderungen möglich.', mode: 'countdown'};
}

function renderCountdown() {
  const view = countdownView(nextLaunch(), Date.now());
  text('sxCountdown', view.value); text('sxCountdownLabel', view.label); text('sxCountdownNote', view.note);
  $('sxCountdown').dataset.mode = view.mode;
  $('sxCountdown').setAttribute('aria-label', `${view.label}: ${view.value}`);
}

function renderStatus() {
  const time = fetchedAt ? viennaLaunchTime(fetchedAt) + ' · Wien' : 'kein Datenstand';
  let state = 'empty', message;
  if (pendingId) { state = 'loading'; message = launches.length ? `Startplanung wird geprüft · Stand ${time}` : 'Startplanung wird geladen …'; }
  else if (lastError) { state = 'error'; message = `${lastError}${launches.length ? ' · Gespeicherter Stand: ' + time : ''}`; }
  else if (!fetchedAt) message = 'Noch keine Startdaten verfügbar.';
  else if (!fresh()) { state = 'stale'; message = `Startplanung veraltet · Stand ${time}`; }
  else { state = 'fresh'; message = `Startplanung aktuell · Stand ${time}`; }
  text('sxDataStatus', message); $('sxDataStatus').dataset.state = state;
  $('sxRefresh').disabled = Boolean(pendingId); $('sxRefresh').setAttribute('aria-busy', String(Boolean(pendingId)));
  text('sxFooterStatus', state === 'fresh' ? 'STARTPLANUNG AKTUELL · TERMINE VORBEHALTLICH ÄNDERUNG' : state === 'loading' ? 'DATEN WERDEN GEPRÜFT' : 'DATENSTAND BEACHTEN · KEINE SIMULIERTEN MESSWERTE');
}

function renderNext() {
  const launch = nextLaunch();
  text('sxNextName', launch?.name || (pendingId ? 'Mission wird geladen' : 'Noch kein Start verfügbar'));
  text('sxNextStatus', launch ? statusName(launch) : 'KEINE STARTDATEN'); text('sxNextRocket', launch?.rocket);
  text('sxNextPad', launch ? [launch.pad, launch.location].filter(Boolean).join(' · ') : null);
  text('sxNextTime', launch ? formatLaunchTime(launch) : '—'); renderCountdown();
}

function renderCalendar() {
  const focusedId = document.activeElement?.closest('#sxCalendar button')?.dataset.launchId;
  const list = $('sxCalendar');
  list.replaceChildren(...launches.map((launch, index) => {
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.dataset.launchId = launchId(launch); button.setAttribute('aria-pressed', String(launchId(launch) === selectedId));
    const number = document.createElement('span'); number.className = 'sx-launch-number'; number.textContent = pad(index + 1);
    const details = document.createElement('span'); details.className = 'sx-launch-label';
    const name = document.createElement('strong'); name.textContent = launch.name;
    const time = document.createElement('span'); time.textContent = formatLaunchTime(launch);
    const rocket = document.createElement('small'); rocket.textContent = launch.rocket || 'Rakete unbestätigt';
    details.append(name, time, rocket); button.append(number, details); button.title = `${launch.name}\n${formatLaunchTime(launch)}\n${statusName(launch)}`;
    button.addEventListener('click', () => selectMission(launchId(launch))); li.append(button); return li;
  }));
  $('sxCalendarEmpty').hidden = launches.length > 0;
  text('sxCalendarEmpty', pendingId ? 'Startkalender wird geladen …' : lastError ? 'Startkalender derzeit nicht erreichbar. Erneut aktualisieren.' : 'Die Datenquelle meldet derzeit keine kommenden SpaceX-Missionen.');
  text('sxCount', pad(launches.length));
  if (focusedId) Array.from(list.querySelectorAll('button')).find(button => button.dataset.launchId === focusedId)?.focus();
}

function renderSelection() {
  const launch = selected();
  $('sxRecent').value = recentLaunches.some(item => launchId(item) === selectedId) ? selectedId : '';
  text('sxSelectedName', launch?.name || 'Keine Mission ausgewählt'); text('sxSelectedTime', launch ? formatLaunchTime(launch) : '—'); text('sxSelectedRocket', launch?.rocket);
  text('sxSelectedPad', launch ? [launch.pad, launch.location].filter(Boolean).join(' · ') : null); text('sxSelectedStatus', launch ? statusName(launch) : '—');
  $('sxSelectedStatus').title = launch?.status?.description || '';
  text('sxDescription', launch?.description || (launch ? 'Zu dieser Mission liegt noch keine Beschreibung vor.' : 'Wähle eine Mission aus dem Startkalender.'));
  const stream = safeStreamUrl(launch?.streamUrl); $('sxStream').disabled = !stream;
  text('sxStreamNote', stream ? 'Übertragung zur ausgewählten Mission verfügbar.' : 'Für diese Mission ist noch keine Übertragung hinterlegt.'); renderTelemetry();
}

function selectMission(id) {
  if (![...launches, ...recentLaunches].some(launch => launchId(launch) === id)) return;
  selectedId = id;
  for (const button of $('sxCalendar').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.launchId === id));
  renderSelection(); announce(`${selected()?.name} ausgewählt.`);
}

function renderRecent() {
  const control = $('sxRecent'), placeholder = document.createElement('option');
  placeholder.value = ''; placeholder.textContent = 'LAUFEND / ZULETZT'; placeholder.disabled = true;
  control.replaceChildren(placeholder, ...recentLaunches.map(launch => {
    const option = document.createElement('option'); option.value = launchId(launch);
    option.textContent = `${statusName(launch)} · ${launch.name}`; return option;
  }));
  control.hidden = recentLaunches.length === 0;
}

function renderTelemetry() {
  sample = vehicles.find(vehicle => String(vehicle.id) === vehicleId) ?? null;
  const now = Date.now(), sampleTime = Date.parse(sample?.observedAt || '');
  const available = !telemetryStale && sample && sample.stale !== true && Number.isFinite(sampleTime) && now - sampleTime <= TELEMETRY_MS && sampleTime - now <= 5000;
  const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const measuredTime = value => typeof value === 'number' && Number.isFinite(value);
  const live = available && ([sample.altitudeKm, sample.speedKmh].some(numeric) || measuredTime(sample.missionTimeSeconds));
  const format = (value, places) => live && numeric(value) ? value.toLocaleString('de-AT', {maximumFractionDigits: places}) : '—';
  text('sxAltitude', format(sample?.altitudeKm, 1)); text('sxSpeed', format(sample?.speedKmh, 0));
  const seconds = sample?.missionTimeSeconds, absolute = Math.abs(seconds);
  text('sxMissionTime', live && measuredTime(seconds) ? `T${seconds < 0 ? '−' : '+'} ${pad(Math.floor(absolute / 3600))}:${pad(Math.floor(absolute % 3600 / 60))}:${pad(Math.floor(absolute % 60))}` : '—');
  text('sxTelemetryMission', sample ? `STARSHIP · ${sample.id}` : telemetryReceived ? 'Keine aktive Starship-Telemetrie' : 'Starship-Tracker wird geprüft');
  text('sxTelemetryState', live ? 'MESSWERTE' : sample && !available ? 'VERALTET' : 'KEIN SIGNAL'); $('sxTelemetryState').dataset.live = String(Boolean(live));
  text('sxTelemetryNote', telemetryError || (live ? 'Messwerte aus dem SpaceX-Tracker. Dieser Starship-Flug ist unabhängig vom ausgewählten Kalenderstart.' : sample ? 'Keine frischen, gültigen Messwerte verfügbar. Werte bleiben bis zum nächsten bestätigten Datensatz ausgeblendet.' : telemetryReceived ? 'SpaceX meldet derzeit keine aktive Starship-Telemetrie. Für Falcon-Missionen steht hier kein öffentlicher Messdatenfeed bereit.' : 'Warte auf den öffentlichen SpaceX-Tracker. Messwerte werden nicht aus dem Startplan geschätzt.'));
  text('sxTelemetrySource', Number.isFinite(sampleTime) ? `SpaceX Starship Tracker · ${new Date(sampleTime).toLocaleTimeString('de-AT', {timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', second: '2-digit'})} Wien` : 'Quelle: SpaceX Starship Tracker · keine simulierten Messwerte');
}

function receiveTelemetry(message) {
  if (!telemetryPendingId || String(message.requestId) !== telemetryPendingId) return;
  clearTimeout(telemetryTimeout); telemetryPendingId = null; telemetryReceived = true;
  telemetryError = typeof message.error === 'string' ? message.error.slice(0, 220) : '';
  telemetryStale = message.stale !== false;
  telemetryRetryAt = Date.parse(message.retryAt || '') || 0;
  if (Array.isArray(message.vehicles)) vehicles = message.vehicles.filter(vehicle => vehicle && vehicle.id != null).slice(0, 10);
  if (!vehicles.some(vehicle => String(vehicle.id) === vehicleId)) vehicleId = vehicles[0] ? String(vehicles[0].id) : null;
  const choices = $('sxVehicle');
  choices.replaceChildren(...vehicles.map(vehicle => { const option = document.createElement('option'); option.value = String(vehicle.id); option.textContent = `Starship · ${vehicle.id}`; return option; }));
  choices.value = vehicleId ?? ''; choices.hidden = vehicles.length < 2; renderTelemetry();
}

function requestTelemetry() {
  if (!dialog.open || telemetryPendingId || !bridge?.postMessage) return;
  telemetryPendingId = `telemetry-${++sequence}`; telemetryAttempt = Date.now();
  const requestId = telemetryPendingId;
  telemetryTimeout = setTimeout(() => {
    if (telemetryPendingId !== requestId) return;
    telemetryPendingId = null; telemetryStale = true; telemetryError = 'Der Starship-Tracker antwortet derzeit nicht.'; renderTelemetry();
  }, 20_000);
  send({type: 'spacexTelemetry', requestId});
}

function receiveLaunches(message) {
  if (!pendingId || String(message.requestId) !== pendingId) return;
  clearTimeout(requestTimeout); pendingId = null; lastError = typeof message.error === 'string' ? message.error.slice(0, 240) : '';
  const nextRetry = Date.parse(message.retryAt || ''); retryAt = Number.isFinite(nextRetry) ? nextRetry : 0;
  if (Array.isArray(message.launches) && (!lastError || message.launches.length || message.recentLaunches?.length)) {
    launches = message.launches.filter(launch => launch && typeof launch === 'object' && launch.id != null && typeof launch.name === 'string').slice(0, 10);
    recentLaunches = Array.isArray(message.recentLaunches) ? message.recentLaunches.filter(launch => launch && typeof launch === 'object' && launch.id != null && typeof launch.name === 'string' && !launches.some(future => launchId(future) === launchId(launch))).slice(0, 5) : [];
    launches.sort((a, b) => (timestamp(a) || Infinity) - (timestamp(b) || Infinity)); fetchedAt = Date.parse(message.fetchedAt || '') || 0; sourceStale = message.stale !== false;
    if (!selected()) selectedId = launchId(nextLaunch() ?? recentLaunches[0]) || null;
    if (fresh()) window.pandaServiceReachable?.('Launch Library 2');
  } else if (lastError) sourceStale = true;
  renderStatus(); renderNext(); renderCalendar(); renderRecent(); renderSelection(); announce(lastError || `${launches.length} kommende SpaceX-Missionen geladen. Zeiten in Wien.`);
}

function requestRefresh() {
  if (pendingId) return;
  if (!bridge?.postMessage) { lastError = 'Startdaten sind in der Windows-App verfügbar.'; renderStatus(); renderNext(); renderCalendar(); return; }
  pendingId = `spacex-${++sequence}`; lastAttempt = Date.now(); renderStatus(); renderCalendar(); const requestId = pendingId;
  requestTimeout = setTimeout(() => {
    if (pendingId !== requestId) return;
    pendingId = null; sourceStale = true; lastError = 'Die Startdatenquelle antwortet derzeit nicht.';
    renderStatus(); renderNext(); renderCalendar(); announce(lastError);
  }, 25_000);
  send({type: 'spacexLaunches', requestId});
}

function tick() {
  if (!dialog.open || document.hidden) return;
  const now = Date.now(); text('sxClock', new Date(now).toLocaleTimeString('de-AT', {timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  renderCountdown(); renderStatus(); renderTelemetry();
  if (!pendingId && now - lastAttempt >= REFRESH_MS && now >= retryAt) requestRefresh();
  if (!telemetryPendingId && now - telemetryAttempt >= 15_000 && now >= telemetryRetryAt) requestTelemetry();
}

function openBoard() {
  if (dialog.open) return;
  returnFocus = document.activeElement; dialog.showModal(); renderNext(); renderCalendar(); renderSelection(); tick(); requestRefresh(); requestTelemetry();
  clearInterval(tickTimer); tickTimer = setInterval(tick, 1000); $('sxClose').focus();
}

function openLink(url) { const safe = safeStreamUrl(url); if (safe) send({type: 'spacexOpenLink', url: safe}); }
$('sxClose').addEventListener('click', () => dialog.close()); $('sxRefresh').addEventListener('click', requestRefresh);
$('sxStream').addEventListener('click', () => openLink(selected()?.streamUrl));
$('sxSource').addEventListener('click', () => send({type: 'spacexOpenLink', url: 'https://thespacedevs.com/llapi'}));
dialog.addEventListener('close', () => { clearInterval(tickTimer); tickTimer = null; clearTimeout(telemetryTimeout); telemetryPendingId = null; if (returnFocus?.isConnected) returnFocus.focus(); });
$('sxVehicle').addEventListener('change', () => { vehicleId = $('sxVehicle').value; renderTelemetry(); });
$('sxRecent').addEventListener('change', () => selectMission($('sxRecent').value));
document.addEventListener('panda-open-spacex', openBoard);
document.addEventListener('panda-internet-restored', () => { if (dialog.open && Date.now() - lastAttempt >= REFRESH_MS && Date.now() >= retryAt) requestRefresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
bridge?.addEventListener('message', ({data: message}) => {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'spacexLaunches') receiveLaunches(message);
  else if (message.type === 'spacexTelemetry') receiveTelemetry(message);
  else if (message.type === 'spacexLinkResult' && message.opened === false) {
    const error = typeof message.message === 'string' ? message.message : 'Die Übertragung konnte nicht geöffnet werden.';
    text('sxStreamNote', error); announce(error);
  }
});
// Read-only diagnostics for regression tests; this never loads demo data.
window.pandaSpaceX = {open: openBoard, get state() { return {open: dialog.open, count: launches.length, selectedId, fresh: fresh(), pending: Boolean(pendingId)}; }};
