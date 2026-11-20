[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/spy26/gta6-trophy-guide-r2c/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/spy26/gta6-trophy-guide-r2c/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI · All 55 Trophies

A tracker and guide for every PlayStation 5 trophy in Grand Theft Auto VI, built as a
plain static site: open `app/index.html`, no build step, no network, nothing leaves
your browser. Progress and notes live in localStorage only.

## What it does

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden — with the
  guide written on every card, so the help is visible without a click.
- **Difficulty (★/5), time estimate and live rarity** on every trophy. Rarity is
  Exophase player data from 20 Nov 2026, the day after launch.
- **The one trophy you can miss, flagged everywhere**: *Positive Mental Attitude*
  (meditate at all 18 spots) — PowerPyx, GTABase and KeenGamer agree the Chapter 1
  spot on Lucia's balcony after "Down to Earth" may lock once you leave. The banner,
  the planner and the trophy itself all say so.
- **"Next up" planner** — the missable trophy first, then the easiest unearned ones.
  Hidden trophies are recommended spoiler-safe ("Hidden story trophy · Ch. 2").
- **Three views**: Cards (default), a sortable Table, and a three-phase Platinum
  Roadmap (Story 60–80 h → 100% grind ~100 h → Strangers & clean-up 10–20 h),
  with per-grade progress bars under the platinum ring.
- **Checklist, per-trophy notes, export/import** of your progress, plus search,
  kind/grade filters, earned-only, and a spoiler toggle that hides hidden names.
- **Honest gaps**: two trophies are marked *unconfirmed* (Bad Luck, I Guess; The
  Truth Is Out There — no guide has pinned their triggers yet) and two are
  *single-source* (Personal Best; Let's Go Bowling — GTAScoop only).

## The platinum, in short

Difficulty 4/10, roughly 200 hours, one playthrough is enough (PowerPyx). The 100%
checklist (35 tasks) appears after the credits with an in-game tracker — and it is
lenient: 70 of 80 challenges, 100 of 255 animals and 200 of 277 vehicles count.
Cheats disable trophies and saving, so leave them off for a trophy run.

## Sources

PowerPyx, GTABase, KeenGamer, GTAScoop, Insider Gaming; rarity from Exophase.
Names, descriptions and grades cross-checked against the official 55-trophy list.

## Run it

Serve the `app/` folder any static way, for example:

```sh
cd app && python3 -m http.server 8080
```

then open http://localhost:8080. Or open `app/index.html` directly from disk.

Demo mode for screenshots: `?seed=13` marks the first 13 trophies earned,
`?view=table` or `?view=roadmap` picks a view, `?detail=28` opens one trophy's
detail pane, `?spoiler=off` hides hidden names.

## Build the submission bundle

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the dataset first (exactly 55 trophies, every one with a
non-empty guide) and the screenshots (1–4 files, each ≤ 256 KiB), then stages
`app/` + `screenshots/` and writes `dossier.json` via the vendored make.fun
library (`vendor/makefun-frontend.ts`, untouched from the kit).
