// Velvet Vault — cameras: wall-mounted, sweeping, and EMP-able.
// A camera hangs on a wall and sweeps its cone back and forth. It watches
// like a guard but never moves, and it never forgets a face: while the thief
// is in its cone the alarm climbs. An EMP pulse knocks every camera offline
// for a few seconds, and a disabled camera shows a grey, dead cone.

import { CAMERA } from './config.js';
import { hasLineOfSight, onRug, tileCenter } from './world.js';

export function makeCamera(spec) {
  const c = tileCenter(spec.tile[0], spec.tile[1]);
  return {
    x: c.x,
    y: c.y,
    facing: spec.facing,
    sweep: spec.sweep,
    phase: spec.phase,
    angle: spec.facing,
    disabledLeft: 0,
    time: spec.phase * 2,
  };
}

export function updateCamera(camera, dt) {
  camera.time += dt;
  if (camera.disabledLeft > 0) {
    camera.disabledLeft = Math.max(0, camera.disabledLeft - dt);
    return;
  }
  camera.angle = camera.facing + Math.sin(camera.time * CAMERA.sweepSpeed) * camera.sweep;
}

export function cameraSees(camera, thief) {
  if (camera.disabledLeft > 0) return 0;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.visionRange) return 0;
  const toThief = Math.atan2(dy, dx);
  let diff = toThief - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.visionHalfAngle) return 0;
  if (!hasLineOfSight(camera.x, camera.y, thief.x, thief.y)) return 0;
  const closeness = 1 - dist / CAMERA.visionRange;
  let clarity = 0.3 + 0.7 * closeness;
  if (thief.sneaking) clarity *= 0.5;
  if (onRug(thief.x, thief.y)) clarity *= 0.55;
  return clarity;
}

export function disableAllCameras(cameras, seconds) {
  for (const camera of cameras) camera.disabledLeft = seconds;
}

export function resetCamera(camera) {
  camera.angle = camera.facing;
  camera.disabledLeft = 0;
  camera.time = camera.phase * 2;
}
