# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Victorcollin123/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Victorcollin123/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve — an original cooking game. Orders land on the board with a ticking patience bar; you chop lettuce and tomato on the board, cook patties and chicken on the stove, fry potatoes into golden fries, stack it all on a plate and serve it before the customer walks out. Six original recipes, a 150-second shift, a coin target to beat, and three strikes before the shift ends. Playable offline in a desktop browser from static files — no network request, no build step.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Click an ingredient (or press 1–8), click a station to use it, click a plate to serve. C chops, S serves a matching plate, B bins what you hold, P pauses, M mutes, R restarts.

## How it plays

- Pick an ingredient from the counter, prep it (chop / cook / fry), and stack it on a plate.
- Each order lists its exact recipe — serve a plate that matches it, on time, for coins plus a time bonus.
- An order that times out costs a heart; three failed orders end the shift. Reach the coin target to finish the shift a winner.
- Burnt food goes in the bin, never on a plate. A streak of three served orders in a row earns a shout-out.

## Files

- `game/` — the playable game as static files (`index.html`, `src/`).
- `game/src/config.js` — recipes, ingredients, tuning; `state.js` — the shift state machine; `render.js` — the kitchen; `input.js` — mouse + keyboard; `audio.js` — synthesized sounds; `random.js` — seeded RNG; `shots.js` — screenshot presets; `main.js` — boot.
- `screenshots/` — kitchen, chopping, served and title screens, real renders of the game.
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
