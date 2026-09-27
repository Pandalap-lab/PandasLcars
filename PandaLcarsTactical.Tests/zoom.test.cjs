const assert = require('node:assert/strict');
require('../PandaLcarsTactical/Assets/Web/zoom.js');
const z=globalThis.PandaZoom;
for(const current of [500,1000,160000,10000000,35000000]) {
 for(const delta of [-1e9,-120,-3,0,3,120,1e9]) {
  const target=z.target(current,null,delta,0);
  assert(target>=500&&target<=35000000);
  let h=current;
  for(let i=0;i<100;i++) { const next=z.step(h,target,16); assert(next>=Math.min(h,target)&&next<=Math.max(h,target)); h=next; }
  assert(Math.abs(h-target)<Math.max(1,target*.0001));
 }
}
assert(z.target(100000,null,120,0)/100000<1.05);
assert.equal(z.wheelDelta(3,1),48);
assert.equal(z.wheelDelta(1,2),120);
let pending=null;
for(let i=0;i<500;i++)pending=z.target(100000,pending,120,0);
assert(pending<=125000);
console.log('PASS zoom limits, smooth monotonic convergence, event normalization, <=5% wheel steps and burst cap');
