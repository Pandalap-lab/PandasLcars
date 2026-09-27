"use strict";
// Public Cesium APIs only; limits shared by wheel, buttons and regression tests.
globalThis.PandaZoom = Object.freeze({
 min: 500, max: 35000000,
 clamp(height) { return Math.max(this.min, Math.min(this.max, height)); },
 wheelDelta(delta, mode) { return Math.max(-120, Math.min(120, delta * (mode === 1 ? 16 : mode === 2 ? 120 : 1))); },
 target(current, pending, delta, mode) {
  const next = (pending ?? current) * Math.exp(this.wheelDelta(delta, mode) * .0004);
  return this.clamp(Math.max(current * .8, Math.min(current * 1.25, next)));
 },
 step(current, target, milliseconds) {
  return this.clamp(current + (target - current) * (1 - Math.exp(-Math.min(milliseconds, 50) / 85)));
 }
});
