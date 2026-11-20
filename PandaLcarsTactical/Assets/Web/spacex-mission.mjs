// Native SpaceXService owns transport, caching and rate limits.
const streamHosts=new Set(['spacex.com','www.spacex.com','x.com','www.x.com','twitter.com','www.twitter.com','youtube.com','www.youtube.com','m.youtube.com','youtu.be']);
export function safeStreamUrl(value){
 if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\u007f]/.test(value))return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&streamHosts.has(url.hostname)?url.href:null;}catch{return null;}
}
function timeValue(value){
 if(value instanceof Date)return value.getTime();
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)?Date.parse(value):NaN;
}
export function viennaLaunchTime(value){
 const ms=timeValue(value);if(!Number.isFinite(ms))return 'Zeit nicht verfügbar';
 return new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(ms);
}
export function formatLaunchTime(launch){
 const ms=timeValue(launch?.net);if(!Number.isFinite(ms))return 'Termin unbestätigt';
 const precision=launch.precision;
 if(precision==='second'||precision==='minute')return viennaLaunchTime(ms)+' · Wien';
 if(precision==='hour'){
  const date=new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',year:'numeric'}).format(ms);
  const hour=new Intl.DateTimeFormat('de-AT',{timeZone:'Europe/Vienna',hour:'2-digit',hourCycle:'h23'}).format(ms);
  return date+' · ca. '+hour+' Uhr · Wien';
 }
 // Coarse NET values are calendar placeholders. Never invent a clock time or
 // shift a month/year boundary by applying a UTC offset.
 const options=precision==='day'?{day:'2-digit',month:'2-digit',year:'numeric'}:
  precision==='month'?{month:'long',year:'numeric'}:precision==='year'?{year:'numeric'}:null;
 return options?new Intl.DateTimeFormat('de-AT',{...options,timeZone:'UTC'}).format(ms)+
  (precision==='day'?' · Tag geplant (UTC)':' · vorläufig'):'Termin unbestätigt';
}
export function countdown(value,now=Date.now()){
 const target=timeValue(value),current=timeValue(now);
 if(!Number.isFinite(target)||!Number.isFinite(current))return null;
 const seconds=Math.max(0,Math.ceil((target-current)/1000));
 return {days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60,elapsed:target<=current};
}
