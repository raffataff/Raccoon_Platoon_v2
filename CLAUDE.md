# Raccoon Platoon — Developer Onboarding

Read this at the start of every session. It covers what the game is, how the code is organized, and the conventions/gotchas you need before touching anything.

---

## 1. What This Is

**Raccoon Platoon** is a squad-based, top-down tactical action game (Cannon Fodder-inspired) built in **pure vanilla JavaScript + HTML5 Canvas**. Raccoon soldiers vs. enemy possums, procedurally generated missions, permadeath, persistent campaign roster. Currently **v0.1.0 Alpha**. Target: eventual **Steam release** — performance matters in every change.

- **No framework, no build step, no bundler, no package.json, no tests, no linter.**
- All code loads as classic `<script>` tags in `index.html`. Everything lives in **global scope**.
- Original design spec: `docs/mission.md`. Feature plans: `docs/plans/`.

## 2. Running the Game

Serve the folder over HTTP (assets/audio fail on `file://`):

```
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`. There is no compile step — edit a file, refresh the browser. Debug via browser DevTools console.

## 3. Repo Layout

```
index.html          All UI screens (DOM panels) + the ordered <script> list. ENTRY POINT.
style.css           All styling for DOM UI panels.
js/                 All game code (~52 files, detailed below).
js/biomes/          Biome definitions (tropical, temperate, junkyard) + accessor index.
js/shootout/        Standalone "Shootout" arcade mode (gallery shooter).
js/minigames/       Reusable modal mini-game framework (gates interactions like hacking/deactivating).
assets/             images/ audio/ video/ — large; organized by biome/unit/purpose.
docs/               mission.md (original spec), plans/, ADDING_PICKUPS.md,
                    special_unit_classes_design.md, briefing.md.
.kilo/              AI-tool artifacts (node_modules etc.) — IGNORE, not game code.
README.md           Player-facing readme.
```

## 4. Critical Convention: Script Load Order

`index.html` (bottom of `<body>`) loads every script in dependency order. **Global classes/objects must be defined before files that reference them.** If you add a new JS file, you MUST add a `<script>` tag in `index.html` at the right position (e.g. anything extending `Unit` goes after `js/unit.js`; anything reading `CONFIG` goes after `js/config.js`). `js/game.js` is always last.

Load order summary: pools/utils/rng → `config.js` → biomes → `ui.js`/audio → `weapon.js` → `unit.js` → `raccoon.js` → possum variants → turrets/consoles → `levelGenerator.js` → `level.js` → shootout files → mini-games (`MiniGame` base → games → `MiniGameManager`) → `game.js`.

## 5. Entry Point & Game Loop

`js/game.js` (~6,000 lines — the hub of everything):

- `window.addEventListener('DOMContentLoaded', () => new Game('gameCanvas'))` at the very bottom.
- `Game` constructor builds all subsystems (Level, UI, InputHandler, AudioManager, MusicManager, pools, ScentRadialMenu…), then asynchronously preloads assets with a loading screen, then shows the main menu.
- `gameLoop(timestamp)` → `update(deltaTime)` + `render()` via `requestAnimationFrame`. Delta time is clamped by `CONFIG.MAX_DELTA_TIME_STEP` (0.1s).

### Game state machine

Everything branches on the string `game.gameState`. Known states:

`MAIN_MENU`, `PRE_MISSION_SELECT`, `LOADING_MISSION`, `RUNNING`, `PAUSED`,
`POST_MISSION_DEBRIEF`, `END_OF_PHASE_DEBRIEF`, `EXTRACTION_VIDEO`,
`CAMPAIGN_COMPLETE`, `GAME_OVER_NO_RECRUITS`, `LOADED_READY` (post save-load),
`ERROR_STATE`, `MINIGAME_ACTIVE` (a modal mini-game is up — `update()` skips this state so the
sim is paused, while `render()` keeps drawing the frozen battlefield behind the overlay, like `PAUSED`),
and shootout states: `SHOOTOUT_PRE_GAME`, `SHOOTOUT_PLAYING`,
`SHOOTOUT_PAUSED`, `SHOOTOUT_GAME_OVER`, `SHOOTOUT_AMBUSH`.

UI screens are **DOM panels** in `index.html` shown/hidden by `js/ui.js`; only the battlefield renders to canvas.

## 6. File-by-File Map (js/)

### Core systems
| File | Role |
|---|---|
| `game.js` (~6k lines) | `Game` class: state machine, campaign flow, mission lifecycle, update/render loop, formations, ambushes, shootout hooks, speech triggers. |
| `config.js` (~2.6k lines) | `CONFIG` — the single tuning surface. Sections: CORE, PERFORMANCE, PATHFINDING, SPATIAL_GRID, DEBUG, ENEMY_ALERT, PLAYER_RACCOON, XP_RANKS, ENEMY_UNITS, WEAPON_DEFINITIONS, TURRETS, AI_BEHAVIOR, PROJECTILES, ROSTER_CAMPAIGN, Z_INDEX, LEVEL_GENERATION, ENEMY_SPAWNING, HOSTAGES, VISUAL_EFFECTS, UI, NIGHT_MISSION, AUDIO, SHOOTOUT_MODE, MINIGAMES. **Balance/tuning changes belong here, not hardcoded.** |
| `campaignRules.js` | `CAMPAIGN_RULES` — procedural campaign generation: per-phase scaling parameters, biome pool, objective pool, destroy-target pool. |
| `level.js` | `Level` — holds current level data, obstacles, nav grid, walkability queries. |
| `levelGenerator.js` (~2.7k lines) | `LevelGenerator` — seeded procedural placement of obstacles, crates/pickups, enemies, hostages, bosses + arenas, extraction zones. |
| `saveManager.js` | `SaveManager` (all static) — localStorage saves. Keys: `raccoon_platoon_saves` (5 slots, `SAVE_VERSION = 1`), `raccoon_platoon_preferences`. Also JSON export/import. **Bump SAVE_VERSION if you change the save shape.** |
| `input.js` | `InputHandler` — mouse/keyboard, selection, drag-select, commands. |
| `ui.js` (~2.8k lines) | `UI` — every DOM screen: menus, pre/post-mission, phase debrief, memorial, save/load modal, options, HUD squad cards. |
| `rng.js` | `SeededRandom` — deterministic RNG. Campaign seed → phase RNG → mission RNG chain makes procgen reproducible. **Use the passed-in RNG instance in procgen code, never `Math.random()`.** |

### Units (inheritance: all extend `Unit` except turrets)
| File | Class |
|---|---|
| `unit.js` (~1.7k lines) | `Unit` — base: HP, movement, A*-path following, stuck detection/recovery, collision slide, AI states (`PATROLLING`/`IDLE`…), `weaponName` setter binds to `WEAPONS`. |
| `raccoon.js` | `Raccoon` — player unit: XP, ranks (Recruit→Private→Corporal→Sergeant→Elite→Ghost), grenades, pickups. |
| `raccoonHostage.js` | `RaccoonHostage extends Raccoon` — rescue/follow/evacuate logic. |
| `possum.js` | `PossumGrunt`; `possumHeavy.js`, `possumSniper.js`, `possumElite.js`, `possumEliteGuard.js`, `possumRevolver.js`, `possumBoss1.js`, `possumBoss3.js`, `possumBoss4.js` — enemy variants/bosses. |
| `possumTurret.js`, `PossumAntiAirTurret.js` | Stationary turrets (NOT `Unit` subclasses). |
| `flyingBird.js`, `ufo.js` | Ambient flyovers (`CONFIG.AMBIENT_EFFECTS`). |
| `IntelConsole.js` | Hackable intel console objective object. |
| `scentmarker.js` | `ScentMarker` + `ScentRadialMenu` — player marker system. |

### Combat & performance infrastructure
| File | Role |
|---|---|
| `weapon.js` | `Weapon`, `Projectile`, `GrenadeProjectile`; `buildWEAPONSFromConfig()` builds the global `WEAPONS` table from `CONFIG.WEAPON_DEFINITIONS`. |
| `ObjectPool.js` | Generic pool — projectiles & grenades are pooled on `Game` (`projectilePool`, `grenadeProjectilePool`). **Reuse pools; don't `new Projectile()` per shot.** |
| `spatialGrid.js` | `SpatialGrid` — broad-phase neighbor queries (cell size = `PATHFINDING.GRID_CELL_SIZE × SPATIAL_GRID.CELL_SIZE_FACTOR`). |
| `minHeap.js` | Priority queue for A*. |
| `utils.js` | Geometry (line/circle/rect/ellipse/OBB intersection), line-of-sight, and the whole pathfinding pipeline: `findPath` (A*) → `smoothPath` → `deflatePath`. |
| `effects.js` | ~15 canvas effect classes (explosions, blood, muzzle flash, speech bubbles…) driven via `game.addVisualEffect(type, data)`. |
| `waterSwirl.js` | Water ambient effect. |

### Audio / content / misc
| File | Role |
|---|---|
| `audioManager.js` | SFX + volume buses (master/music/sfx/ambience). |
| `musicManager.js` | Music track selection/crossfade (init'd from `CONFIG.AUDIO_MUSIC`). |
| `speechConfig.js` | `SPEECH_CONFIG` — unit barks/one-liners. |
| `raccoonNames.js` | Random recruit name generator. |
| `manualContent.js` | "How To Play" field manual content. |
| `biomes/*.js` | `TROPICAL_BIOME`, `TEMPERATE_BIOME`, `JUNKYARD_BIOME` + `biomes/index.js` accessor functions (`getBiomeConfig`, sprite paths, level-gen settings, landing/extraction videos, shootout backgrounds). |

### Shootout mode (js/shootout/)
Separate arcade "shooting gallery" mode, also reused mid-campaign as **ambush** events (`SHOOTOUT_AMBUSH` at mission start/extraction).
- `ShootoutController.js` (~2.3k lines) — mode logic, Time Attack & Elimination modes, scoring/grades, dev mode.
- `ShootoutSpawner.js` — spawn point/wave management.
- `ShootoutTarget.js` — pop-up possum targets (`extends Unit`; states HIDDEN/PEEKING/AIMING/SHOOTING/HIT/DEAD).
- Has an in-game **dev mode** (spawn-point editor, "Copy Config" exports JSON) toggled from the shootout pre-game screen.

### Mini-games (js/minigames/)
A reusable **modal mini-game framework**. A mini-game can gate any interaction; it runs in a DOM overlay (`#minigame-overlay`, styled in `style.css`) with its own `<canvas>` and RAF loop while `game.gameState = 'MINIGAME_ACTIVE'` pauses the sim. Balance/tuning lives in `CONFIG.MINIGAMES`; **no save impact** (mini-games are transient — no `SAVE_VERSION` bump).

- `MiniGame.js` — base class every game extends (lifecycle: `init`/`update`/`render` + pointer/key hooks; finish via `succeed()`/`fail()`/`abort()`). Reads its tuning from a passed-in config block; uses the passed-in `SeededRandom`.
- `MiniGameManager.js` — instantiated once on `Game` (`this.miniGameManager`). Builds the overlay, owns the mini-game loop, resolves difficulty from `currentPhaseIndex`, seeds RNG, routes input. `launch(key, opts)` runs one game; `launchFromPool(poolKey, {selector, onComplete, …})` picks one **deterministically per objective** (`_poolSeed(selector)`) from `CONFIG.MINIGAMES.POOLS` — same challenge *type* per objective, fresh layout each attempt.
- Games (each declares a static `CONFIG_KEY`): `MazeShutdown.js` ("Circuit Breach"), `NullWave.js` ("Dead Air"), `BreakerCascade.js` ("Breaker Cascade"), `TraceRace.js` ("Trace Race"). Pools: `SHUTDOWN` (maze/wave/breaker) and `HACK` (trace).
- **Gate pattern**: the interaction completes ONLY in the `onComplete` success callback. Live gates in `game.js`: `handlePossumAntiAirTurretShutdown()` (SHUTDOWN pool → `turret.shutdown()`) and `handleIntelConsoleInteraction()` (HACK pool → `startHackOnConsole()`, i.e. the mini-game runs *before* the timed enemy-spawning hack). `CONFIG.MINIGAMES.ENABLED = false` reverts every gate to its old instant behavior.
- **Adding a game**: new file `class X extends MiniGame` with a static `X.CONFIG_KEY`; add its `<script>` before `MiniGameManager.js`; register it in `MiniGameManager._autoRegister()`; add a tuning block under `CONFIG.MINIGAMES` (and optionally a `POOLS` entry). Preloading/wiring is otherwise automatic.
- **Sandbox**: `minigame_test.html` at repo root plays any game or pool in isolation (no full game boot) — handy for tuning and testing.

## 7. Campaign / Mission Flow

1. **New campaign**: `initializeNewCampaign()` seeds `campaignSeed`, rolls campaign length (`CAMPAIGN_RULES.CAMPAIGN_LENGTH_PHASES_RANGE` = 20–50 phases), builds `campaignStructure` per phase via `_generatePhaseStructure()` (biome, missions, finale).
2. **Pre-mission**: player picks up to 4 recruits from `masterRoster` → `confirmSquadAndStartMission()`.
3. **Mission gen**: `generateAndSetCurrentMissionParams(phaseIdx, missionIdx)` selects objectives from `CAMPAIGN_RULES.OBJECTIVE_POOL` scaled by `BASE_PARAMETERS`; `LevelGenerator` builds the map from the mission seed.
4. **Play** (`RUNNING`): `checkMissionStatus()` evaluates objective completion each frame; mission end goes through `initiateMissionEnd()` → 3s delay → `actuallyEndMission()`.
5. **Debriefs**: `POST_MISSION_DEBRIEF` → (phase finale: `EXTRACTION_VIDEO` + `END_OF_PHASE_DEBRIEF`) → next mission. Campaign ends at `CAMPAIGN_COMPLETE` or `GAME_OVER_NO_RECRUITS` (roster empty = permadeath game over).

**Objective types**: `EXTERMINATE`, `DESTROY_TARGET`, `RESCUE_HOSTAGES`, `ASSASSINATION`, `INTERACT_INTEL`, `DEACTIVATE_ANTI_AIR_TURRETS`, plus `EXTRACTION` (auto-added to phase finales). Deactivating anti-air turrets and hacking intel consoles are **gated behind a mini-game** — the interaction only completes on mini-game success (see §6 Mini-games / `CONFIG.MINIGAMES`). Biomes currently live: TROPICAL, TEMPERATE, JUNKYARD (SWAMP and URBAN_DECAY are commented out in `campaignRules.js`).

**Progression**: XP per hit/kill/mission survived (`CONFIG.XP_*`), ranks via `CONFIG.RANK_THRESHOLDS`, rank grants grenade bonuses and faster reloads. Fallen raccoons go to the Memorial ("Wall of the Fallen").

**Sprite variants (multi-type units)**: `CONFIG.RACCOON_SPRITE_VARIANTS` maps each rank to an array of visual variants (`{basePath, baseName, scaleFactor}`). Folders follow `rifleman/<rank>/typeN/idle/<baseName>_idle_<dir>.png` (8 dirs); baseNames are NOT uniform across folders, so each variant declares its own. A raccoon rolls a random `spriteType` index at creation (seeded roster RNG when available) and re-rolls on every promotion; the index is persisted in saves (`SAVE_VERSION` 2). To add a new type: drop the folder on disk and add one line to the rank's array — preloading is automatic.

## 8. Performance Rules (Steam target — non-negotiable)

- **Object pooling** for anything spawned frequently (projectiles, grenades). Follow `ObjectPool` pattern for new high-churn objects.
- **SpatialGrid** for any proximity query — never O(n²) loops over all units.
- Background terrain is **pre-rendered once** to an offscreen canvas (`generatePrerenderedBackground`); night overlay is a separate offscreen canvas. Don't add per-frame full-map draws.
- Auto-degradation exists: `CONFIG.AUTO_PHASE_ENEMIES_FPS_THRESHOLD` (35 FPS) phases enemy AI when slow. FPS counter is on-screen (`#hud-fps`).
- Pathfinding is budgeted: A* capped at `PATHFINDING_MAX_EXPANSIONS` (20k), path smoothing uses coarse stepping on long paths, repaths are cooldown-gated. Respect these knobs when touching movement code.
- Prefer squared-distance comparisons (`distanceSq` pattern already used) over `Math.sqrt` in hot loops.

## 9. Debugging Tools

- **Debug visuals panel** (`#debugPanel` in index.html; `game.toggleDebugVisuals()`): nav grid blocked cells, spatial grid, obstacle shapes/names, pathing bounds, bullet sizes, hut spawn areas. Defaults in `CONFIG` `DEBUG_*` flags.
- **Shootout dev mode**: on-screen spawn point editor, exports spawn configs as JSON.
- Save export/import (JSON) via the save/load modal — useful for reproducing states.
- Deterministic seeds: log/reuse `campaignSeed` / `currentMissionSeed` to reproduce a generated level exactly.

## 10. Gotchas & Conventions

- **Everything is global.** No modules, no imports. Name collisions are real; `distanceSq` is defined in more than one file (`possum.js`, `raccoonHostage.js`) — last-loaded wins. Be careful adding top-level names.
- **New script file ⇒ new `<script>` tag in `index.html`** in correct dependency order (see §4).
- **Tune via `CONFIG` / `CAMPAIGN_RULES`**, not magic numbers in logic files. Nearly every constant already has a documented home in `config.js`.
- **Seeded RNG discipline**: procgen must use the provided `SeededRandom` instance so campaigns are reproducible. `Math.random()` is acceptable only for pure cosmetics (some ambient timers do this).
- **Save compatibility**: changing what gets serialized (roster, campaign state, mission params) requires bumping `SaveManager.SAVE_VERSION` and handling old saves.
- **`weaponName` is a property setter** on `Unit` that resolves against the global `WEAPONS` table — set the name, not the object.
- **Windows repo, CRLF line endings.** File paths in code use forward slashes (web paths).
- Turrets (`PossumTurret`, `PossumAntiAirTurret`) are *not* `Unit` subclasses — they're tracked in separate arrays on `Game` (`possumTurrets`, `possumAntiAirTurrets`).
- UI text templates live in `CONFIG.UI_TEXT_STRINGS` and are filled via `_fillTextTemplate` (`{PLACEHOLDER}` syntax).
- Commented-out code blocks (e.g. auto-save-on-unload in `game.js` constructor) are intentionally disabled — don't re-enable without checking the comment's reason (that one caused XP/death duplication bugs).

## 11. Docs Worth Reading Before Specific Tasks

- Adding pickups/crates → `docs/ADDING_PICKUPS.md`
- New unit classes → `docs/special_unit_classes_design.md`
- Shootout/ambush work → `docs/plans/shootout_*.md`
- Music system → `docs/plans/music_system_plan.md`
- Extraction/finale flow → `docs/plans/phase_finale_extraction_plan.md`
- Full original game spec → `docs/mission.md`

## 12. Quick Start Checklist for a New Session

1. Serve the folder (`python -m http.server 8000`) and confirm the game boots to the main menu.
2. Identify which system your task touches using the file map (§6).
3. Check `CONFIG` first — the value you want to change probably already exists.
4. If adding a file, wire it into `index.html` in dependency order.
5. Keep it performative: pools, spatial grid, seeded RNG, no per-frame allocations in hot paths.
6. Test both a campaign mission AND shootout mode if you touched shared code (`Unit`, `weapon.js`, `game.js`).
7. If save data shape changed, bump `SAVE_VERSION` and test load of an old save.
