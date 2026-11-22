// Velvet Vault — main: the game loop and the state machine.
// Title -> playing -> (caught -> playing) -> win / game over. One frame
// reads the input, moves the thief, lets the guards and cameras watch, feeds
// what they see into the alarm, and draws. A ?shot= URL stages a frozen
// screenshot scene instead of starting the game.

import { TILE, VIEW_W, VIEW_H, PLAYER, PATROLS, CAMERAS, ALARM, TOOLS } from './config.js';
import { findMarker, findAllMarkers, moveCircle, tileCenter } from './world.js';
import { makeGuard, updateGuard, distractGuard, resetGuard } from './guards.js';
import { makeCamera, updateCamera, cameraSees, disableAllCameras, resetCamera } from './cameras.js';
import { makeLoot, makeTools, throwCoin, updateTools, tryTakeLoot, resetLoot } from './loot.js';
import { makeAlarm, addAlarm, decayAlarm, isCaught, applyCaught, resetAlarm } from './alarm.js';
import { makeInput, attachInput, moveVector, consumePresses } from './input.js';
import { drawGame, empButtonRect } from './render.js';
import { shotName, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function newGameState() {
  const spawn = findMarker('S');
  return {
    phase: 'title', // title | playing | caught | win | gameover
    phaseTime: 0,
    elapsed: 0,
    thief: {
      x: spawn.x,
      y: spawn.y,
      facing: -Math.PI / 2,
      sneaking: false,
      invulnerable: 0,
    },
    guards: PATROLS.map(makeGuard),
    cameras: CAMERAS.map(makeCamera),
    loot: makeLoot(),
    tools: makeTools(),
    alarm: makeAlarm(),
    exitTiles: findAllMarkers('X'),
  };
}

const state = newGameState();
const input = makeInput();

function inEmpButton(x, y) {
  const r = empButtonRect();
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

attachInput(input, canvas, inEmpButton);

function resetRun() {
  const fresh = newGameState();
  state.phase = 'playing';
  state.phaseTime = 0;
  state.elapsed = 0;
  state.thief.x = fresh.thief.x;
  state.thief.y = fresh.thief.y;
  state.thief.facing = fresh.thief.facing;
  state.thief.sneaking = false;
  state.thief.invulnerable = 0;
  state.guards = fresh.guards;
  state.cameras = fresh.cameras;
  state.loot = fresh.loot;
  state.tools = fresh.tools;
  state.alarm = fresh.alarm;
  state.exitTiles = fresh.exitTiles;
}

function fireEmp() {
  if (state.tools.empLeft <= 0) return;
  state.tools.empLeft -= 1;
  disableAllCameras(state.cameras, TOOLS.empDisableSeconds);
}

function onCoinLanded(x, y) {
  for (const guard of state.guards) distractGuard(guard, x, y);
}

function onSpotted() {
  addAlarm(state.alarm, ALARM.spotBonus);
}

function update(dt) {
  const presses = consumePresses(input);
  if (state.phase === 'title') {
    if (presses.start || presses.click) {
      state.phase = 'playing';
      state.phaseTime = 0;
    }
    return;
  }
  if (state.phase === 'caught') {
    state.phaseTime += dt;
    if (state.phaseTime > 1.6) {
      state.phase = 'playing';
      state.phaseTime = 0;
    }
    return;
  }
  if (state.phase === 'win' || state.phase === 'gameover') {
    if (presses.restart || presses.start) resetRun();
    return;
  }

  // Playing.
  state.elapsed += dt;
  if (presses.restart) {
    resetRun();
    return;
  }
  if (presses.emp) fireEmp();
  if (presses.click) {
    throwCoin(state.tools, state.thief.x, state.thief.y, presses.click.x, presses.click.y);
  }

  const vec = moveVector(input);
  const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const moved = moveCircle(
    state.thief.x,
    state.thief.y,
    vec.x * speed * dt,
    vec.y * speed * dt,
    PLAYER.radius,
  );
  state.thief.x = moved.x;
  state.thief.y = moved.y;
  state.thief.sneaking = input.sneak && (vec.x !== 0 || vec.y !== 0);
  if (vec.x !== 0 || vec.y !== 0) {
    state.thief.facing = Math.atan2(vec.y, vec.x);
  }
  if (state.thief.invulnerable > 0) state.thief.invulnerable -= dt;

  for (const guard of state.guards) {
    updateGuard(guard, state.thief, dt, onSpotted);
  }
  for (const camera of state.cameras) updateCamera(camera, dt);
  updateTools(state.tools, dt, onCoinLanded);

  // What the watchers see right now feeds the alarm.
  let seen = 0;
  for (const guard of state.guards) {
    seen = Math.max(seen, guard.clarity || 0);
  }
  for (const camera of state.cameras) {
    camera.clarity = cameraSees(camera, state.thief);
    if (camera.clarity > 0) seen = Math.max(seen, camera.clarity);
  }
  if (seen > 0 && state.thief.invulnerable <= 0) {
    addAlarm(state.alarm, seen * 22 * dt);
  } else {
    decayAlarm(state.alarm, dt);
  }
  if (state.alarm.caughtFlash > 0) {
    state.alarm.caughtFlash = Math.max(0, state.alarm.caughtFlash - dt);
  }

  if (tryTakeLoot(state.loot, state.thief, state.elapsed)) {
    // The case pops open: the exit door is the way out now.
  }

  // Exit: only open once the diamond is taken.
  if (state.loot.taken) {
    for (const tile of state.exitTiles) {
      const dx = state.thief.x - tile.x;
      const dy = state.thief.y - tile.y;
      if (Math.hypot(dx, dy) < TILE * 0.75) {
        state.phase = 'win';
        state.phaseTime = 0;
        return;
      }
    }
  }

  if (isCaught(state.alarm)) {
    const over = applyCaught(state.alarm);
    const spawn = findMarker('S');
    state.thief.x = spawn.x;
    state.thief.y = spawn.y;
    state.thief.invulnerable = 2;
    for (const guard of state.guards) resetGuard(guard);
    for (const camera of state.cameras) resetCamera(camera);
    state.phase = over ? 'gameover' : 'caught';
    state.phaseTime = 0;
  }
}

let last = performance.now();
let frozen = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) update(dt);
  drawGame(ctx, state, now / 1000);
  requestAnimationFrame(frame);
}

// A screenshot scene freezes the simulation after staging it.
const shot = shotName();
if (shot) {
  frozen = applyShot(state, shot);
}

// A tiny read-only hook for play-testing from a browser console: it lets a
// test read the live state (phase, alarm, loot, positions) without touching
// the game. It ships no data anywhere and changes nothing about the game.
window.__velvetVault = { state, input, resetRun };

requestAnimationFrame(frame);
