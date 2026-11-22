// Velvet Vault — input: keyboard and mouse, one place.
// WASD or arrows move, Shift sneaks, E fires the EMP, R restarts, Enter
// starts. A mouse click throws a coin at the clicked floor tile; a click on
// the EMP button in the HUD fires the EMP instead. The game reads this state
// once per frame and never touches the DOM events itself.

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    empPressed: false,
    restartPressed: false,
    startPressed: false,
    click: null, // {x, y} in canvas pixels, consumed by the game loop
    clickEmp: false,
  };
}

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function attachInput(input, canvas, onEmpButton) {
  const down = (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE') {
      if (!event.repeat) input.empPressed = true;
      event.preventDefault();
    } else if (event.code === 'KeyR') {
      if (!event.repeat) input.restartPressed = true;
    } else if (event.code === 'Enter' || event.code === 'Space') {
      if (!event.repeat) input.startPressed = true;
      event.preventDefault();
    }
  };
  const up = (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  };
  const click = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    if (onEmpButton && onEmpButton(x, y)) {
      input.clickEmp = true;
      return;
    }
    input.click = { x, y };
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('click', click);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    canvas.removeEventListener('click', click);
  };
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.hypot(x, y);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function consumePresses(input) {
  const out = {
    emp: input.empPressed || input.clickEmp,
    restart: input.restartPressed,
    start: input.startPressed,
    click: input.click,
  };
  input.empPressed = false;
  input.clickEmp = false;
  input.restartPressed = false;
  input.startPressed = false;
  input.click = null;
  return out;
}
