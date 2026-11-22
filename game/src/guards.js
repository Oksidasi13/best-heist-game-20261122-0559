// Velvet Vault — guards: patrol, watch, suspect, chase, investigate.
// A guard walks a loop of waypoints and pauses at each one to scan. Its
// vision cone is a range and an angle, blocked by walls and pedestals. When
// the thief is inside the cone and in line of sight, suspicion fills; a full
// suspicion means the guard spotted the thief and raises the alarm. A coin
// landing nearby pulls the guard away to investigate the sound.

import { GUARD } from './config.js';
import { hasLineOfSight, moveCircle, onRug, tileCenter } from './world.js';

export function makeGuard(route) {
  const first = tileCenter(route.waypoints[0][0], route.waypoints[0][1]);
  return {
    name: route.name,
    waypoints: route.waypoints,
    pauseSeconds: route.pauseSeconds,
    x: first.x,
    y: first.y,
    facing: 0,
    targetIndex: 1,
    pauseLeft: 0,
    suspicion: 0,
    clarity: 0,
    state: 'patrol', // patrol | pause | investigate | chase | return
    stateTime: 0,
    investigateX: 0,
    investigateY: 0,
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

function angleTo(x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How clearly this guard sees the thief right now: 0 when out of range,
// out of the cone or behind a wall; up to 1 at point blank in the centre
// of the cone. Sneaking and standing on a rug both make the thief harder
// to spot. The last clarity is kept on the guard so the alarm can read it.
export function guardSees(guard, thief) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.visionRange) return 0;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toThief, guard.facing)) > GUARD.visionHalfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y)) return 0;
  const closeness = 1 - dist / GUARD.visionRange;
  let clarity = 0.35 + 0.65 * closeness;
  if (thief.sneaking) clarity *= 0.5;
  if (onRug(thief.x, thief.y)) clarity *= 0.55;
  return clarity;
}

export function updateGuard(guard, thief, dt, onSpotted) {
  const seen = guardSees(guard, thief);
  guard.clarity = seen;
  if (seen > 0) {
    guard.suspicion = Math.min(1, guard.suspicion + GUARD.detectRate * seen * dt);
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
    if (guard.suspicion >= 1 && guard.state !== 'chase') {
      guard.state = 'chase';
      guard.stateTime = 0;
      onSpotted(guard);
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - 0.45 * dt);
  }

  const speedFor = (state) =>
    state === 'chase'
      ? GUARD.chaseSpeed
      : state === 'investigate'
        ? GUARD.investigateSpeed
        : GUARD.patrolSpeed;

  if (guard.state === 'pause') {
    guard.pauseLeft -= dt;
    guard.facing += Math.sin(guard.stateTime * 1.4) * 0.6 * dt;
    if (guard.pauseLeft <= 0) guard.state = 'patrol';
    return;
  }

  let tx;
  let ty;
  if (guard.state === 'chase') {
    tx = guard.lastSeenX;
    ty = guard.lastSeenY;
    guard.stateTime += dt;
    if (guard.stateTime > GUARD.loseSightSeconds && seen <= 0) {
      guard.state = 'return';
      guard.stateTime = 0;
    }
  } else if (guard.state === 'investigate') {
    tx = guard.investigateX;
    ty = guard.investigateY;
    guard.stateTime += dt;
    if (guard.stateTime > GUARD.investigateSeconds) {
      guard.state = 'return';
      guard.stateTime = 0;
    }
  } else if (guard.state === 'return') {
    const wp = guard.waypoints[guard.targetIndex];
    const c = tileCenter(wp[0], wp[1]);
    tx = c.x;
    ty = c.y;
  } else {
    const wp = guard.waypoints[guard.targetIndex];
    const c = tileCenter(wp[0], wp[1]);
    tx = c.x;
    ty = c.y;
  }

  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    if (guard.state === 'patrol') {
      guard.targetIndex = (guard.targetIndex + 1) % guard.waypoints.length;
      guard.state = 'pause';
      guard.pauseLeft = guard.pauseSeconds;
      guard.stateTime = 0;
    } else if (guard.state === 'return') {
      guard.state = 'patrol';
    } else if (guard.state === 'investigate') {
      guard.state = 'pause';
      guard.pauseLeft = 1.2;
      guard.stateTime = 0;
    }
    return;
  }
  const speed = speedFor(guard.state);
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const moved = moveCircle(guard.x, guard.y, nx - guard.x, ny - guard.y, GUARD.radius);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.facing = angleTo(guard.x, guard.y, tx, ty);
}

// A coin just landed: the nearest guard in earshot walks over to look.
export function distractGuard(guard, x, y) {
  if (guard.state === 'chase') return false;
  const dist = Math.hypot(x - guard.x, y - guard.y);
  if (dist > 340) return false;
  guard.state = 'investigate';
  guard.stateTime = 0;
  guard.investigateX = x;
  guard.investigateY = y;
  guard.suspicion = Math.max(0, guard.suspicion - 0.5);
  return true;
}

export function resetGuard(guard) {
  const first = tileCenter(guard.waypoints[0][0], guard.waypoints[0][1]);
  guard.x = first.x;
  guard.y = first.y;
  guard.facing = 0;
  guard.targetIndex = 1;
  guard.pauseLeft = 0;
  guard.suspicion = 0;
  guard.clarity = 0;
  guard.state = 'patrol';
  guard.stateTime = 0;
}
