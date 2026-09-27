"use strict";
(() => {
 class EarthMotion {
  constructor(){this.enabled=true;this.earth=true;this.holding=false;this.resumeAt=0;this.last=null;}
  pause(now){this.resumeAt=now+15000;}
  step(now,visible=true){
   const elapsed=this.last===null?0:Math.max(0,Math.min(100,now-this.last));this.last=now;
   return this.enabled&&this.earth&&!this.holding&&visible&&now>=this.resumeAt?elapsed*2*Math.PI/300000:0;
  }
 }
 if(typeof module!=="undefined")module.exports=EarthMotion;
 else window.PandaEarthMotion=EarthMotion;
})();
