// Velvet Vault — shots: staged scenes for the screenshots.
// The game reads ?shot=cover|play|alarm|exit from the page URL and stages
// one frozen moment, so every screenshot is a real render of the game's own
// code. The simulation is paused in a shot, so the frame is identical every
// time it is taken.

import { tileCenter } from './world.js';

function placeThief(state, col, row, facing) {
  const c = tileCenter(col, row);
  state.thief.x = c.x;
  state.thief.y = c.y;
  state.thief.facing = facing;
  state.thief.sneaking = false;
}

function placeGuard(state, index, col, row, facing, suspicion) {
  const guard = state.guards[index];
  const c = tileCenter(col, row);
  guard.x = c.x;
  guard.y = c.y;
  guard.facing = facing;
  guard.suspicion = suspicion;
  guard.state = 'pause';
  guard.pauseLeft = 99;
}

export function shotName() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

// Stage one frozen moment. Returns true when a shot was staged.
export function applyShot(state, name) {
  if (!name) return false;
  state.phase = 'playing';
  state.elapsed = 0;
  if (name === 'cover') {
    // Everything in one frame: thief mid-room, guards with cones, cameras
    // sweeping, the diamond glowing, the alarm meter part filled.
    placeThief(state, 16, 8, -Math.PI / 2);
    state.thief.sneaking = true;
    placeGuard(state, 0, 15, 4, Math.PI / 2, 0.3);
    placeGuard(state, 1, 14, 12, 0, 0.1);
    placeGuard(state, 2, 25, 6, Math.PI, 0);
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI / 2 - 0.4;
    state.alarm.value = 35;
    state.alarm.peak = 35;
    return true;
  }
  if (name === 'play') {
    // A quiet stealth beat: the thief crouched behind a pedestal while a
    // guard's cone sweeps past, a coin still in the air.
    placeThief(state, 13, 6, Math.PI / 2);
    state.thief.sneaking = true;
    placeGuard(state, 0, 16, 4, Math.PI / 2, 0.55);
    placeGuard(state, 1, 14, 12, 0, 0.1);
    placeGuard(state, 2, 25, 6, Math.PI, 0);
    state.cameras[0].angle = Math.PI / 2 - 0.6;
    state.cameras[1].angle = Math.PI / 2 + 0.3;
    state.tools.flying = {
      fromX: state.thief.x,
      fromY: state.thief.y,
      toX: state.thief.x + 90,
      toY: state.thief.y + 40,
      x: state.thief.x + 45,
      y: state.thief.y - 6,
      t: 0.5,
    };
    state.alarm.value = 22;
    state.alarm.peak = 22;
    return true;
  }
  if (name === 'alarm') {
    // The caught moment: the thief inside a guard's cone, the alarm nearly
    // full, the red vignette closing in.
    placeThief(state, 17, 12, -Math.PI / 2);
    placeGuard(state, 0, 16, 4, Math.PI / 2, 0.2);
    placeGuard(state, 1, 17, 10, Math.PI / 2, 1);
    placeGuard(state, 2, 25, 6, Math.PI, 0);
    state.cameras[0].angle = Math.PI / 2 + 0.2;
    state.cameras[1].angle = Math.PI / 2;
    state.alarm.value = 88;
    state.alarm.peak = 88;
    state.alarm.caughtFlash = 0.8;
    return true;
  }
  if (name === 'exit') {
    // The getaway: diamond taken, the thief at the exit door, alarm low.
    placeThief(state, 2, 16, Math.PI);
    placeGuard(state, 0, 15, 4, -Math.PI / 2, 0);
    placeGuard(state, 1, 14, 12, Math.PI, 0);
    placeGuard(state, 2, 25, 6, Math.PI, 0);
    state.cameras[0].angle = Math.PI / 2 - 0.3;
    state.cameras[1].angle = Math.PI / 2 + 0.5;
    state.loot.taken = true;
    state.alarm.value = 12;
    state.alarm.peak = 41;
    state.phase = 'win';
    state.elapsed = 174;
    return true;
  }
  return false;
}
