// Velvet Vault — world: turns the config grid into a playable level.
// Walls and pedestals are solid and block both movement and sight; rugs are
// floor that hides the thief a little better; spawn, exit and loot are
// markers the game reads once at startup.

import { TILE, COLS, ROWS, GRID } from './config.js';

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return GRID[row][col];
}

export function isSolid(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'P';
}

export function isRug(col, row) {
  return tileAt(col, row) === 'R';
}

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function findMarker(ch) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (GRID[row][col] === ch) return { col, row, ...tileCenter(col, row) };
    }
  }
  return null;
}

export function findAllMarkers(ch) {
  const out = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (GRID[row][col] === ch) out.push({ col, row, ...tileCenter(col, row) });
    }
  }
  return out;
}

// Circle-vs-wall collision: push the circle out of every solid tile it
// overlaps, axis by axis, so the thief slides along walls instead of
// sticking to them.
export function moveCircle(x, y, dx, dy, radius) {
  let nx = x + dx;
  let ny = y + dy;
  const minCol = Math.floor((nx - radius) / TILE);
  const maxCol = Math.floor((nx + radius) / TILE);
  const minRow = Math.floor((ny - radius) / TILE);
  const maxRow = Math.floor((ny + radius) / TILE);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isSolid(col, row)) continue;
      const bx = col * TILE;
      const by = row * TILE;
      const cx = Math.max(bx, Math.min(nx, bx + TILE));
      const cy = Math.max(by, Math.min(ny, by + TILE));
      const ddx = nx - cx;
      const ddy = ny - cy;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 >= radius * radius) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        nx = cx + (ddx / d) * radius;
        ny = cy + (ddy / d) * radius;
      } else {
        // Dead centre of a solid tile (should not happen): step back up.
        ny = by - radius;
      }
    }
  }
  return { x: nx, y: ny };
}

// Line of sight on the tile grid (Bresenham): true when no solid tile
// stands between two points. Used by guards and cameras.
export function hasLineOfSight(x0, y0, x1, y1) {
  const c0 = Math.floor(x0 / TILE);
  const r0 = Math.floor(y0 / TILE);
  const c1 = Math.floor(x1 / TILE);
  const r1 = Math.floor(y1 / TILE);
  let dc = Math.abs(c1 - c0);
  let dr = Math.abs(r1 - r0);
  const sc = c0 < c1 ? 1 : -1;
  const sr = r0 < r1 ? 1 : -1;
  let err = dc - dr;
  let c = c0;
  let r = r0;
  for (let steps = 0; steps < 64; steps++) {
    if (c === c1 && r === r1) return true;
    if (isSolid(c, r) && !(c === c0 && r === r0)) return false;
    const e2 = 2 * err;
    if (e2 > -dr) {
      err -= dr;
      c += sc;
    }
    if (e2 < dc) {
      err += dc;
      r += sr;
    }
  }
  return true;
}

export function onRug(x, y) {
  return isRug(Math.floor(x / TILE), Math.floor(y / TILE));
}
