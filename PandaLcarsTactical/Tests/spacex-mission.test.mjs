import test from 'node:test';
import assert from 'node:assert/strict';
import {safeStreamUrl,viennaLaunchTime,formatLaunchTime,countdown} from '../Assets/Web/spacex-mission.mjs';
test('Vienna clock follows DST transitions and rolls calendar dates',()=>{
 for(const [utc,expected] of [['2026-03-29T00:30:00Z','01:30'],['2026-03-29T01:30:00Z','03:30'],['2026-10-25T00:30:00Z','02:30'],['2026-10-25T01:30:00Z','02:30'],['2026-07-01T12:00:00Z','14:00']])assert(viennaLaunchTime(utc).includes(expected));
 assert.match(viennaLaunchTime('2026-11-20T23:30:00Z'),/21\.11\.2026.*00:30/);
 assert.equal(viennaLaunchTime(null),'Zeit nicht verfügbar');
 assert.equal(viennaLaunchTime('invalid'),'Zeit nicht verfügbar');
});
test('imprecise dates never acquire a made-up precise clock',()=>{
 const at=precision=>formatLaunchTime({net:'2026-11-20T12:00:00Z',precision});
 assert.match(at('minute'),/13:00.*Wien/);
 assert.match(at('hour'),/ca\. 13 Uhr.*Wien/);
 assert.match(at('day'),/20\.11\.2026.*UTC/);
 assert.doesNotMatch(at('day'),/13:00/);
 assert.match(at('month'),/November 2026/);
 assert.equal(at('unknown'),'Termin unbestätigt');
 assert.equal(formatLaunchTime({net:null,precision:'minute'}),'Termin unbestätigt');
});
test('countdown stays positive until target and never claims liftoff',()=>{
 const target=Date.parse('2026-11-20T12:00:00Z');
 assert.deepEqual(countdown(target,target-90061000),{days:1,hours:1,minutes:1,seconds:1,elapsed:false});
 assert.deepEqual(countdown(target,target-1),{days:0,hours:0,minutes:0,seconds:1,elapsed:false});
 assert.deepEqual(countdown(target,target+1000),{days:0,hours:0,minutes:0,seconds:0,elapsed:true});
 assert.equal(countdown(null),null);assert.equal(countdown('invalid'),null);assert.equal(countdown(target,NaN),null);
});
test('stream URLs reject executable, lookalike, credential and unexpected-port links',()=>{
 for(const url of ['javascript:alert(1)','http://spacex.com/','https://spacex.com.evil.test/','https://evil.test/','https://user:pass@www.youtube.com/watch?v=test','https://x.com:444/SpaceX','https://x.com/SpaceX\n','file:///test',null,''])assert.equal(safeStreamUrl(url),null,String(url));
 assert.equal(safeStreamUrl('https://www.youtube.com/watch?v=test'),'https://www.youtube.com/watch?v=test');
 assert.equal(safeStreamUrl('https://x.com/SpaceX/status/123'),'https://x.com/SpaceX/status/123');
});
