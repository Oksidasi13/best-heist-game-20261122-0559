// Velvet Vault — configuration: canvas, colours, tuning and the level grid.
// Every number the game runs on lives here, so tuning never touches the
// systems that read it. The grid is one screen of 32 x 18 tiles at 40 px.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 720

export const COLORS = {
  floor: '#232838',
  floorAlt: '#272d40',
  rug: '#3d2b4d',
  rugEdge: '#543a66',
  wall: '#12141d',
  wallTop: '#2e3450',
  pedestal: '#4a3a28',
  pedestalTop: '#6b5636',
  exit: '#1f7a4d',
  exitGlow: '#39d98a',
  loot: '#7fe7ff',
  lootCase: '#9db4c8',
  thief: '#f2c14e',
  thiefDark: '#8a6a1f',
  guard: '#e5484d',
  guardDark: '#7a1f24',
  cone: 'rgba(242, 193, 78, 0.16)',
  coneEdge: 'rgba(242, 193, 78, 0.35)',
  camCone: 'rgba(229, 72, 77, 0.13)',
  camConeEdge: 'rgba(229, 72, 77, 0.4)',
  camera: '#c8ccd8',
  alarmLow: '#39d98a',
  alarmMid: '#f2c14e',
  alarmHigh: '#e5484d',
  text: '#e8eaf2',
  textDim: '#9aa0b5',
  panel: 'rgba(10, 12, 20, 0.82)',
  panelEdge: '#3a4060',
};

// Grid legend: # wall, . floor, R rug (shadow: slower detection), P pedestal
// (solid cover, blocks sight), S spawn, X exit door, L loot display case.
export const GRID = [
  '################################',
  '#.........#..........#.........#',
  '#.........#.................L..#',
  '#..............................#',
  '#....................#.........#',
  '#.........#...P......#.........#',
  '#.........#..........#....P....#',
  '#.........#....P.....#.........#',
  '#.........#....................#',
  '#.........#.######.#...........#',
  '#.........#...RRR....#.........#',
  '#.........#...RRR....#.........#',
  '#.........#..PRPR....#...RRRR..#',
  '#.RRRR...............#...RRRR..#',
  '#.RRRR...................RRRR..#',
  '#.RSRR....#....................#',
  '#XX.......#..........#.........#',
  '################################',
];

export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 92,
  accel: 1400,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 66,
  investigateSpeed: 96,
  chaseSpeed: 132,
  visionRange: 232,
  visionHalfAngle: 0.61, // ~35 degrees
  detectRate: 1.15, // suspicion 0 -> 1 per second at point blank
  loseSightSeconds: 2.0,
  investigateSeconds: 4.0,
};

export const CAMERA = {
  visionRange: 258,
  visionHalfAngle: 0.52, // ~30 degrees
  detectRate: 0.9,
  sweepSpeed: 0.55, // radians per second
};

export const ALARM = {
  max: 100,
  decayPerSecond: 5,
  caughtReset: 35, // alarm after a fair reset
  spotBonus: 26, // instant jump when a guard fully spots the thief
  maxStrikes: 3,
};

export const TOOLS = {
  coins: 5,
  coinRange: 340, // guards this close hear the coin land
  coinFlightSeconds: 0.45,
  empCharges: 2,
  empDisableSeconds: 6,
};

// Patrol routes, in tile coordinates. Each guard walks its loop and pauses
// briefly at every waypoint, scanning the room before moving on.
export const PATROLS = [
  {
    name: 'Mara',
    waypoints: [[12, 3], [19, 3], [19, 6], [12, 6]],
    pauseSeconds: 1.1,
  },
  {
    name: 'Ivo',
    waypoints: [[12, 14], [19, 14], [19, 11], [12, 11]],
    pauseSeconds: 1.1,
  },
  {
    name: 'Sable',
    waypoints: [[24, 3], [28, 3], [28, 9], [24, 9]],
    pauseSeconds: 1.4,
  },
];

// Wall-mounted cameras: tile position, base facing (radians, 0 = east),
// sweep amplitude and phase offset so the two cameras stay out of sync.
export const CAMERAS = [
  { tile: [16, 1], facing: Math.PI / 2, sweep: 0.85, phase: 0 },
  { tile: [26, 1], facing: Math.PI / 2, sweep: 0.62, phase: 1.7 },
];

export const LOOT = {
  name: 'Aurora Diamond',
  valueText: '$1,000,000',
};
