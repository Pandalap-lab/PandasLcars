const assert=require('node:assert/strict');
const {normalize,evaluate,isViennaCode}=require('../PandaLcarsTactical/Assets/Web/weather-alerts.js');
const now=Date.now(),reply={type:'Feature',properties:{location:{properties:{gemeindenr:90101}},warnings:[]}};
const warning=(level,start=now-60000,end=now+60000)=>({properties:{warnstufeid:level,warntypid:5,rawinfo:{start:String(start/1000),end:String(end/1000)}}});
assert.equal(evaluate(normalize(reply),now).level,0);
for(let n=1;n<=3;n++){reply.properties.warnings=[warning(n)];assert.equal(evaluate(normalize(reply),now).level,n);assert.equal(evaluate(normalize(reply),now).interval,600000);}
reply.properties.warnings=[warning(3,now-60000,now),warning(2,now+60000,now+120000)];assert.equal(evaluate(normalize(reply),now).level,0);assert.equal(evaluate(normalize(reply),now).future.length,1);
reply.properties.warnings=[warning(4)];assert.throws(()=>normalize(reply));reply.properties.location.properties.gemeindenr=30740;assert.throws(()=>normalize(reply));assert.ok(isViennaCode(92201));assert.ok(!isViennaCode(30740));
console.log('PASS warning levels, exact expiry, future warnings, invalid replies and Vienna codes');
