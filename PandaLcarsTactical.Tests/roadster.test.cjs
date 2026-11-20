const test=require('node:test'),assert=require('node:assert/strict');
const roadster=require('../PandaLcarsTactical/Assets/Web/roadster.js');
const references=require('./fixtures/roadster-horizons.json');

test('Roadster interpolation matches independent JPL Horizons UTC vectors',()=>{
 for(const ref of references.samples){
  const value=roadster.at(ref.time);
  const positionKm=Math.hypot(...value.positionAu.map((n,i)=>n-ref.positionAu[i]))*roadster.AU_KM;
  const velocityKms=Math.hypot(...value.velocityAuPerDay.map((n,i)=>n-ref.velocityAuPerDay[i]))*roadster.AU_KM/86400;
  assert.ok(positionKm<.1,`${ref.time}: position interpolation error ${positionKm} km`);
  assert.ok(velocityKms<.00001,`${ref.time}: velocity interpolation error ${velocityKms} km/s`);
 }
});

test('Roadster source, coordinate frame and time coverage remain explicit',()=>{
 assert.equal(roadster.metadata.targetId,-143205);
 assert.equal(roadster.metadata.frame,'Ecliptic J2000 / ICRF');
 assert.equal(roadster.metadata.center,'Sun');
 assert.equal(roadster.metadata.sampleCount,2557);
 assert.ok(roadster.at(roadster.metadata.validFrom));
 assert.ok(roadster.at(roadster.metadata.validUntil));
 for(const time of ['2024-12-31T23:59:59Z','2032-01-01T00:00:01Z','invalid',null,undefined,NaN,Infinity])assert.equal(roadster.at(time),null);
 assert.equal(roadster.trajectory('2033-01-01').length,0);
});

test('Roadster speed uses AU/day to km/hour and orbit never leaves the source interval',()=>{
 const sample=roadster.at('2026-11-20T20:00:00Z');
 assert.equal(sample.speedKmh,Math.hypot(...sample.velocityAuPerDay)*149597870.7/24);
 assert.ok(sample.speedKmh>70000&&sample.speedKmh<120000);
 for(const time of [roadster.metadata.validFrom,'2026-11-20T20:00:00Z',roadster.metadata.validUntil]){
  const path=roadster.trajectory(time);
  assert.equal(path.length,181);
  assert.ok(path.every(p=>p.length===3&&p.every(Number.isFinite)));
  assert.ok(path.every(p=>Math.hypot(...p)>.9&&Math.hypot(...p)<1.8));
 }
});

test('Returned Roadster positions cannot mutate later calculations',()=>{
 const at='2026-11-20T20:00:00Z',before=roadster.at(at).positionAu[0];
 roadster.at(at).positionAu[0]=12345;roadster.trajectory(at)[0][0]=12345;
 assert.equal(roadster.at(at).positionAu[0],before);
});
