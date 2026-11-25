# Build log — Sizzle & Serve (best-cooking-game-20261125-0137)

## What it is

An original cooking game built for the make.fun bounty "Make the best cooking game"
($250, closes 2026-11-25 14:37 WAT). Orders land on the board with a ticking patience
bar; you chop lettuce and tomato on the board, cook patties and chicken on the stove,
fry potatoes into golden fries, stack it all on a plate and serve it before the
customer walks out. Six original recipes, a 150-second shift, a coin target, three
strikes. Static files, no library, no network request.

## Verification (all run by me in this session)

- Served the game locally and screenshot all four presets through headless Chromium;
  viewed the images and fixed what I saw (clipped ingredient labels, clipped "READY TO
  SERVE" label, the served/streak text overlapping the third ticket, the hints line
  colliding with the held-item line).
- Play-tested by real clicks: serve window serves with full hands (coins 86 → 124,
  order cleared, shift won at the 120 target); a patty goes raw → cooked in the pan and
  lands on a plate; chopping 3× turns a tomato into a chopped tomato; keys 1–8 grab,
  B bins. Zero console errors.
- Caught and fixed in the play-test: cooking never transitioned raw → cooked/fries
  (items could never be plated), and the serve window routed through the plate-add path
  instead of serving.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` twice, diff — byte-identical outputs.

## Entry

- Repo: https://github.com/Victorcollin123/best-cooking-game-20261125-0137
- Kit: fresh kit for this bounty, downloaded 2026-11-25 ~03:18 WAT.
- `makefun record` refused (HTTP 400): this bounty takes transcripts as a bundle, not
  recorded transcripts — same as the best-card-game entry.
