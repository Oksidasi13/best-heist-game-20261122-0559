// Velvet Vault — alarm: the meter that decides whether the heist holds.
// The alarm climbs while any guard or camera has the thief in sight, and
// falls again while the thief stays hidden. A guard that fully spots the
// thief spikes it at once. At 100 the heist is blown: a strike, a fair reset
// back to the foyer door with the alarm eased down, and the patrols back on
// their rounds. Three strikes and the night is over.

import { ALARM } from './config.js';

export function makeAlarm() {
  return {
    value: 0,
    strikes: 0,
    peak: 0,
    caughtFlash: 0,
  };
}

export function addAlarm(alarm, amount) {
  alarm.value = Math.min(ALARM.max, alarm.value + amount);
  alarm.peak = Math.max(alarm.peak, alarm.value);
}

export function decayAlarm(alarm, dt) {
  if (alarm.value > 0) {
    alarm.value = Math.max(0, alarm.value - ALARM.decayPerSecond * dt);
  }
  if (alarm.caughtFlash > 0) {
    alarm.caughtFlash = Math.max(0, alarm.caughtFlash - dt);
  }
}

export function isCaught(alarm) {
  return alarm.value >= ALARM.max;
}

// A fair reset: one strike, the thief back at the door, the alarm eased
// down instead of zeroed, so the next stretch starts tense, not free.
export function applyCaught(alarm) {
  alarm.strikes += 1;
  alarm.value = ALARM.caughtReset;
  alarm.caughtFlash = 1.2;
  return alarm.strikes >= ALARM.maxStrikes;
}

export function resetAlarm(alarm) {
  alarm.value = 0;
  alarm.strikes = 0;
  alarm.peak = 0;
  alarm.caughtFlash = 0;
}
