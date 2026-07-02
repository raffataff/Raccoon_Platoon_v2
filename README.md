# Raccoon Platoon

**Raccoon Platoon** is a squad-based, top-down tactical action game inspired by classics like Cannon Fodder. Lead your team of raccoon soldiers through procedurally generated missions, battle enemy possums, and manage your roster in a campaign with permadeath and persistent progression.

Built in pure vanilla JavaScript + HTML5 Canvas — no frameworks, no build step.

## Features

- **Squad-based tactical gameplay:** Command up to 4 raccoon recruits per mission.
- **Procedurally generated campaigns:** Seeded generation — every campaign rolls 20–50 phases of unique missions across Tropical, Temperate, and Junkyard biomes.
- **Permadeath & progression:** Fallen raccoons are gone for good (visit them on the Wall of the Fallen). Survivors earn XP and climb ranks from Recruit to Ghost, unlocking better weapons and stats.
- **Varied objectives:** Exterminate, destroy targets, rescue hostages, assassinate VIPs, hack intel consoles, deactivate anti-air turrets — plus extraction finales with boss fights.
- **Shootout mode:** A standalone arcade shooting-gallery mode (Time Attack & Elimination), which also appears mid-campaign as ambush events.
- **Night missions, destructible environments, ambient wildlife, and the occasional UFO.**
- **Save system:** 5 save slots (browser localStorage) with JSON export/import.
- **Custom audio and visuals:** Unique sprites, sound effects, music, and mission videos.

## Getting Started

1. **Clone this repository:**
   ```
   git clone https://github.com/raffataff/Raccoon_Platoon.git
   ```
2. **Run a local web server** from the project root (required — assets and audio won't load from `file://` URLs):

   ```
   python -m http.server 8000
   ```
   or
   ```
   npx serve .
   ```
3. **Open** `http://localhost:8000` in a modern browser (Chrome, Firefox, Edge).

## Controls

- **Left-click / drag:** Select raccoons (drag for box select). Click-hold on ground to direct-fire.
- **Right-click:** Order selected raccoons to move.
- **Keyboard:** Squad group hotkeys, formation toggle, scent markers, pause. See the in-game **How To Play** field manual for the full list.

## Project Structure

```
index.html            Entry point — all UI screens + ordered <script> tags
style.css             All UI styling
CLAUDE.md             Developer onboarding / architecture guide (start here to work on the code)
js/
  game.js             Game class: state machine, campaign flow, main loop
  config.js           CONFIG — all tuning values (units, weapons, AI, levelgen, UI, audio)
  campaignRules.js    CAMPAIGN_RULES — procedural campaign/objective generation rules
  level.js            Current level state, obstacles, nav grid
  levelGenerator.js   Seeded procedural level generation
  ui.js               All DOM screens and HUD
  input.js            Mouse/keyboard handling
  saveManager.js      localStorage saves + JSON export/import
  unit.js             Base Unit class (movement, pathing, AI states)
  raccoon.js          Player units (XP, ranks, grenades)
  raccoonHostage.js   Rescuable hostages
  possum*.js          Enemy variants and bosses
  possumTurret.js     Stationary turrets (+ PossumAntiAirTurret.js)
  weapon.js           Weapons and projectiles
  effects.js          Canvas visual effects
  audioManager.js     SFX and volume buses
  musicManager.js     Music selection/crossfade
  utils.js            Geometry + A* pathfinding pipeline
  spatialGrid.js      Broad-phase collision queries
  ObjectPool.js       Object pooling (projectiles/grenades)
  minHeap.js          Priority queue for A*
  rng.js              Seeded RNG (deterministic campaigns)
  scentmarker.js      Scent marker system
  IntelConsole.js     Hackable intel consoles
  flyingBird.js       Ambient birds
  ufo.js              Ambient UFO
  raccoonNames.js     Recruit name generator
  speechConfig.js     Unit barks/one-liners
  manualContent.js    How To Play manual content
  biomes/             Biome definitions (tropical, temperate, junkyard)
  shootout/           Shootout arcade mode (controller, spawner, targets)
assets/
  audio/              Music, SFX, ambience
  images/             Sprites, terrain, UI art (organized by biome/unit)
  video/              Landing/extraction mission videos
docs/                 Design docs and feature plans
```

## For Developers

See **[CLAUDE.md](CLAUDE.md)** for the full architecture guide: script load order rules, the game state machine, campaign/mission flow, performance conventions, and gotchas.

## Credits

- Game design and code: raffataff
- Art and audio: See `assets/` and documentation.

## License

This project is for educational and non-commercial use. See individual asset licenses where applicable.

---

*Raccoon Platoon* — Lead your furry platoon to victory!
