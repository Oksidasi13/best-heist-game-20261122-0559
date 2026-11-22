// Velvet Vault — render: everything the player sees, on one canvas.
// The draw order is the whole visual language: floor and rugs first, then
// vision cones, then walls and pedestals over the cones (so a cone reads as
// blocked by a wall), then the loot, the people and the coin, then the HUD.
// Safe cover is dark and quiet, danger is yellow and red, loot is cyan.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS, GRID } from './config.js';
import { GUARD, CAMERA, ALARM } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawFloor(ctx, lootTaken, now) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = GRID[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (t === '#') continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x, y, TILE, TILE);
      if (t === 'R') {
        ctx.fillStyle = COLORS.rug;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.rugEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
      }
      if (t === 'X') {
        // The exit door glows once the diamond is taken: the way out.
        const glow = lootTaken ? 0.55 + 0.45 * Math.sin(now * 4) : 0;
        ctx.fillStyle = COLORS.exit;
        ctx.fillRect(x, y, TILE, TILE);
        if (lootTaken) {
          ctx.fillStyle = `rgba(57, 217, 138, ${0.25 + 0.2 * glow})`;
          ctx.fillRect(x - 4, y - 4, TILE + 8, TILE + 8);
        }
        ctx.fillStyle = COLORS.exitGlow;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EXIT', x + TILE / 2, y + TILE / 2);
      }
    }
  }
}

function drawWalls(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (GRID[row][col] !== '#') continue;
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(x, y, TILE, 4);
    }
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (GRID[row][col] !== 'P') continue;
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = COLORS.pedestal;
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = COLORS.pedestalTop;
      ctx.fillRect(x + 4, y + 4, TILE - 8, 6);
      ctx.strokeStyle = '#2a2113';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4.5, y + 4.5, TILE - 9, TILE - 9);
    }
  }
}

function drawLoot(ctx, loot, now) {
  const pulse = 0.6 + 0.4 * Math.sin(now * 3);
  ctx.fillStyle = COLORS.lootCase;
  ctx.fillRect(loot.x - 20, loot.y - 20, 40, 40);
  ctx.strokeStyle = '#5a7186';
  ctx.lineWidth = 2;
  ctx.strokeRect(loot.x - 20, loot.y - 20, 40, 40);
  if (loot.taken) return;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = COLORS.loot;
  ctx.globalAlpha = 0.55 + 0.45 * pulse;
  const s = 11 + 2 * pulse;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#dff8ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.restore();
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AURORA DIAMOND', loot.x, loot.y - 30);
}

function drawGuard(ctx, guard) {
  drawCone(
    ctx,
    guard.x,
    guard.y,
    guard.facing,
    GUARD.visionHalfAngle,
    GUARD.visionRange,
    COLORS.cone,
    COLORS.coneEdge,
  );
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.guard;
  ctx.fill();
  ctx.strokeStyle = COLORS.guardDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd7d9';
  ctx.fill();
  const fx = guard.x + Math.cos(guard.facing) * (GUARD.radius + 5);
  const fy = guard.y + Math.sin(guard.facing) * (GUARD.radius + 5);
  ctx.strokeStyle = '#ffd7d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  if (guard.suspicion > 0.05) {
    const a = guard.suspicion;
    ctx.strokeStyle = a > 0.66 ? '#ff5a5a' : '#f2c14e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius + 7, -Math.PI / 2, -Math.PI / 2 + a * Math.PI * 2);
    ctx.stroke();
    if (a > 0.66) {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - GUARD.radius - 12);
    } else if (guard.state === 'investigate') {
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - GUARD.radius - 12);
    }
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y + GUARD.radius + 12);
}

function drawCamera(ctx, camera) {
  const disabled = camera.disabledLeft > 0;
  drawCone(
    ctx,
    camera.x,
    camera.y,
    camera.angle,
    CAMERA.visionHalfAngle,
    CAMERA.visionRange,
    disabled ? 'rgba(150, 155, 175, 0.08)' : COLORS.camCone,
    disabled ? 'rgba(150, 155, 175, 0.25)' : COLORS.camConeEdge,
  );
  ctx.fillStyle = COLORS.camera;
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a5f70';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = disabled ? '#8a8f9f' : '#e5484d';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#c8ccd8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OFFLINE', camera.x, camera.y + 20);
  }
}

function drawThief(ctx, thief, now) {
  const r = thief.sneaking ? 11 : 13;
  ctx.save();
  ctx.globalAlpha = thief.invulnerable > 0 && Math.floor(now * 10) % 2 === 0 ? 0.45 : 1;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, r, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thief;
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2c07';
  ctx.fill();
  const fx = thief.x + Math.cos(thief.facing) * (r + 5);
  const fy = thief.y + Math.sin(thief.facing) * (r + 5);
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  ctx.restore();
  if (thief.sneaking) {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', thief.x, thief.y - r - 8);
  }
}

function drawCoin(ctx, tools) {
  if (tools.flying) {
    const f = tools.flying;
    ctx.beginPath();
    ctx.ellipse(f.toX, f.toY, 8, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c14e';
    ctx.fill();
    ctx.strokeStyle = '#8a6a1f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (tools.landed) {
    const l = tools.landed;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c14e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(242,193,78,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 9 + Math.sin(l.t * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function alarmColor(value) {
  if (value < 40) return COLORS.alarmLow;
  if (value < 70) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function drawHud(ctx, state) {
  const { alarm, tools, loot, elapsed, phase } = state;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(0, 46, VIEW_W, 2);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('VELVET VAULT', 14, 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px monospace';
  const objective = loot.taken ? 'GET TO THE EXIT!' : 'STEAL THE AURORA DIAMOND';
  ctx.fillText(objective, 170, 24);
  // Alarm meter, centre top.
  const mx = VIEW_W / 2 - 150;
  const my = 14;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', mx - 8, 24);
  ctx.fillStyle = '#0c0e18';
  roundRect(ctx, mx, my, 300, 18, 4);
  ctx.fill();
  ctx.fillStyle = alarmColor(alarm.value);
  const w = Math.max(0, Math.min(300, (alarm.value / ALARM.max) * 300));
  if (w > 2) {
    roundRect(ctx, mx, my, w, 18, 4);
    ctx.fill();
  }
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx, my, 300, 18, 4);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(alarm.value)}%`, mx + 150, 24);
  // Tools, timer, strikes, right side.
  const rx = VIEW_W - 14;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px monospace';
  const empText = `EMP ${tools.empLeft}   COIN ${tools.coinsLeft}`;
  ctx.fillText(empText, rx, 16);
  ctx.fillStyle = alarm.strikes > 0 ? COLORS.alarmHigh : COLORS.textDim;
  const strikes = '●'.repeat(alarm.strikes) + '○'.repeat(ALARM.maxStrikes - alarm.strikes);
  ctx.fillText(`${strikes}  ${formatTime(elapsed)}`, rx, 34);
  // Bottom hint bar.
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / ARROWS move   ·   SHIFT sneak   ·   CLICK throw a coin   ·   E EMP (cameras off)   ·   R restart',
    VIEW_W / 2,
    VIEW_H - 13,
  );
  if (phase === 'playing' && !loot.taken) {
    // Sits just above the bottom hint bar, clear of the cameras up top.
    ctx.fillStyle = 'rgba(127, 231, 255, 0.9)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('The diamond is in the vault room, top right', VIEW_W / 2, VIEW_H - 36);
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function drawBanner(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, VIEW_W / 2 - 320, VIEW_H / 2 - 110, 640, 220, 10);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, VIEW_W / 2 - 320, VIEW_H / 2 - 110, 640, 220, 10);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 48);
  ctx.fillStyle = COLORS.text;
  ctx.font = '15px monospace';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 6 + i * 26);
  });
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px monospace';
  ctx.fillText('Press R to try again — or ENTER to start over', VIEW_W / 2, VIEW_H / 2 + 84);
}

export function drawGame(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0c0e18';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, state.loot.taken, now);
  for (const camera of state.cameras) drawCamera(ctx, camera);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawWalls(ctx);
  drawLoot(ctx, state.loot, now);
  drawCoin(ctx, state.tools);
  if (state.phase !== 'title') drawThief(ctx, state.thief, now);
  // Red vignette while the alarm is high or just after being caught.
  const heat = Math.max(state.alarm.value / 100, state.alarm.caughtFlash > 0 ? 0.55 : 0);
  if (heat > 0.45) {
    const g = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
    );
    g.addColorStop(0, 'rgba(229,72,77,0)');
    g.addColorStop(1, `rgba(229,72,77,${0.35 * heat})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawHud(ctx, state);
  if (state.phase === 'title') {
    drawBanner(
      ctx,
      'VELVET VAULT',
      [
        'One gallery. Three guards. Two cameras. One diamond.',
        'Cross the room, lift the Aurora Diamond, and walk out the door.',
        'WASD move · SHIFT sneak · CLICK throw a coin · E EMP',
      ],
      COLORS.thief,
    );
  } else if (state.phase === 'caught') {
    drawBanner(
      ctx,
      'SPOTTED!',
      ['The alarm is screaming. Wren slips back to the door.', `Strikes: ${state.alarm.strikes} of ${ALARM.maxStrikes}`],
      COLORS.alarmHigh,
    );
  } else if (state.phase === 'win') {
    drawBanner(
      ctx,
      'CLEAN GETAWAY',
      [
        `The Aurora Diamond (${state.loot.valueText}) is yours.`,
        `Time ${formatTime(state.elapsed)} · Peak alarm ${Math.round(state.alarm.peak)}% · Strikes ${state.alarm.strikes}`,
      ],
      COLORS.exitGlow,
    );
  } else if (state.phase === 'gameover') {
    drawBanner(
      ctx,
      'CAUGHT',
      ['Three strikes. The gallery keeps its diamond tonight.', 'The vault door locks behind you.'],
      COLORS.alarmHigh,
    );
  }
}

export function empButtonRect() {
  // The EMP readout at the top right doubles as a clickable button.
  return { x: VIEW_W - 260, y: 4, w: 150, h: 38 };
}
