import test from 'node:test';
import assert from 'node:assert/strict';
import {countdown, viennaLaunchTime, upcomingLaunches, safeStreamUrl, telemetryDisplay} from '../Assets/Web/spacex-mission.mjs';

test('Vienna winter and summer time',()=>{
 assert.match(viennaLaunchTime('2026-01-15T12:00:00Z'),/13:00/);
 assert.match(viennaLaunchTime('2026-07-15T12:00:00Z'),/14:00/);
});
test('countdown and elapsed',()=>{
 assert.deepEqual(countdown('2026-01-02T01:02:03Z',Date.parse('2026-01-01T00:00:00Z')),{days:1,hours:1,minutes:2,seconds:3,elapsed:false});
 assert.equal(countdown('2026-01-01T00:00:00Z',Date.parse('2026-01-02T00:00:00Z')).elapsed,true);
});
test('safe livestream urls',()=>{
 assert.equal(safeStreamUrl('javascript:alert(1)'),null);
 assert.equal(safeStreamUrl('http://example.com'),null);
 assert.equal(safeStreamUrl('https://www.youtube.com/watch?v=test'),'https://www.youtube.com/watch?v=test');
});
test('upcoming launches sorted and past excluded',()=>{
 const records=[{name:'B',net:'2026-12-02T00:00:00Z'},{name:'past',net:'2025-01-01T00:00:00Z'},{name:'A',net:'2026-12-01T00:00:00Z'}];
 assert.deepEqual(upcomingLaunches(records,Date.parse('2026-11-20T00:00:00Z')).map(x=>x.name),['A','B']);
});
test('telemetry must be fresh and verified',()=>{
 const now=Date.now();
 assert.equal(telemetryDisplay({verified:false,timestamp:now,altitudeKm:100,speedKmh:200},now).live,false);
 assert.equal(telemetryDisplay({verified:true,timestamp:now-60000,altitudeKm:100,speedKmh:200},now).live,false);
 assert.equal(telemetryDisplay({verified:true,timestamp:now,altitudeKm:100,speedKmh:200},now).live,true);
});
