// Velvet Vault — loot and tools: the diamond, the coins and the EMP.
// The Aurora Diamond sits in a display case in the vault room. Walking over
// it takes it, and only then does the exit door open for the getaway. The
// thief carries two tools, each with a cost: coins to throw and pull a guard
// away from its patrol, and EMP charges to knock the cameras offline.

import { TOOLS, LOOT } from './config.js';
import { findMarker } from './world.js';

export function makeLoot() {
  const spot = findMarker('L');
  return {
    name: LOOT.name,
    valueText: LOOT.valueText,
    x: spot.x,
    y: spot.y,
    taken: false,
    takenAt: 0,
  };
}

export function makeTools() {
  return {
    coinsLeft: TOOLS.coins,
    empLeft: TOOLS.empCharges,
    flying: null, // {x, y, fromX, fromY, toX, toY, t} while a coin is in the air
    landed: null, // {x, y, t} where the last coin came to rest
  };
}

export function throwCoin(tools, fromX, fromY, toX, toY) {
  if (tools.coinsLeft <= 0 || tools.flying) return false;
  tools.coinsLeft -= 1;
  tools.flying = {
    fromX,
    fromY,
    toX,
    toY,
    x: fromX,
    y: fromY,
    t: 0,
  };
  return true;
}

export function updateTools(tools, dt, onCoinLanded) {
  if (tools.flying) {
    const f = tools.flying;
    f.t += dt / TOOLS.coinFlightSeconds;
    const t = Math.min(1, f.t);
    f.x = f.fromX + (f.toX - f.fromX) * t;
    f.y = f.fromY + (f.toY - f.fromY) * t - Math.sin(t * Math.PI) * 26;
    if (f.t >= 1) {
      tools.landed = { x: f.toX, y: f.toY, t: 0 };
      tools.flying = null;
      onCoinLanded(f.toX, f.toY);
    }
  }
  if (tools.landed) {
    tools.landed.t += dt;
    if (tools.landed.t > 3) tools.landed = null;
  }
}

export function tryTakeLoot(loot, thief, now) {
  if (loot.taken) return false;
  const dist = Math.hypot(thief.x - loot.x, thief.y - loot.y);
  if (dist < 34) {
    loot.taken = true;
    loot.takenAt = now;
    return true;
  }
  return false;
}

export function resetLoot(loot) {
  loot.taken = false;
  loot.takenAt = 0;
}
