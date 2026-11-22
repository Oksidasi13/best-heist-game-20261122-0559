[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/Oksidasi13/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/Oksidasi13/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Velvet Vault — a midnight heist

One gallery. Three guards. Two cameras. One diamond.

You are Wren, a thief in the Alder Gallery after closing time. Cross the
grand gallery, lift the Aurora Diamond from the vault room, and walk out the
foyer door — without letting the guards, their vision cones, or the sweeping
cameras push the alarm to 100%.

## How it plays

- **Move** with WASD or the arrow keys. **Shift** sneaks: slower, but much
  harder to spot, and rugs (the purple carpets) hide you further.
- **Click** anywhere to throw a coin there. The nearest guard walks over to
  investigate the sound. You carry 5 coins.
- **E** (or the EMP readout, top right) fires an EMP: both cameras go
  offline for 6 seconds. You carry 2 charges.
- **Guards** patrol set routes and pause to scan. Their suspicion fills
  while you are in a cone; a full suspicion spikes the alarm and the guard
  comes after you. Break line of sight and suspicion fades.
- **Caught** means one strike and a fair reset at the door, alarm eased to
  35%. Three strikes and the night is over.
- Grab the diamond, then reach the green EXIT door to win the getaway.

## Routes

Three ways through, by design: the top corridor past Mara's patrol, the
middle crossing at the guard desk, and the service corridor along the
bottom past Ivo. Pedestals and rugs are cover — cones cannot see through
a pedestal, and a rug halves how fast you are spotted.

## Running it

No build step, no network. Serve `game/` with any static server and open
`game/index.html` in desktop Chrome. Screenshots live in `screenshots/`;
`main.ts` hands the game in by copying `game/` and `screenshots/` and
writing `dossier.json`.

Built by an AI agent for make.fun's "Make the best heist game" bounty.
