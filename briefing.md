# Raccoon Platoon - Project Status & Overview (Mid-Development Update)

## 1. Project Overview

*   **Game Name:** Raccoon Platoon
*   **Concept:** An HTML5 real-time, squad-based, top-down tactical action game, inspired by "Cannon Fodder." Players control a squad of raccoon soldiers ("Recruits") through procedurally generated levels, battling enemy possums, and completing mission objectives. (GDD 1.1)
*   **Core Loop:** Squad control (selection, movement, formation), tactical combat (targeting, various firing modes, special weapons), completing mission objectives, and managing a persistent roster of recruits with permadeath through a multi-phase campaign.
*   **Current State:** Advanced MVP++ / Alpha. Core gameplay loop is robust. Campaign structure, multiple UI screens, varied enemy AI, destructible environments, detailed procedural level generation, and initial sprite integration are implemented. Significant configuration options are now centralized in `config.js`.
*   **Platform:** HTML5 Canvas 2D, Vanilla JavaScript.

## 2. Implemented Features

### 2.1. Core Gameplay Mechanics

*   **Squad Control (Ref GDD 2.1):**
    *   **Selection:**
        *   Single Raccoon selection via left-click on unit (map).
        *   Multi-Raccoon selection via click-and-drag box (map).
        *   Select via HUD card click (Left-click for single, Ctrl/Cmd+Left-click for toggle/additive).
        *   "Select All" deployed Raccoons via Spacebar.
        *   Deselection via 'Esc' key or Left-Click on empty ground (when not issuing a fire command).
    *   **Movement:**
        *   Right-click on terrain orders selected Raccoons to move.
        *   Units move in formation towards the destination.
        *   Basic obstacle collision (units stop or attempt a simple slide against defined collision shapes). Rudimentary "unstuck" logic implemented for AI and player units.
    *   **Formations:**
        *   Toggle between 'HORIZONTAL' and 'VERTICAL' line formations using HUD button or 'F' key.
        *   Formation spacing adjustable in real-time via HUD slider (`CONFIG.INITIAL_FORMATION_SPACING`).
*   **Combat (Ref GDD 2.2):**
    *   **Weapons Implemented:**
        *   Raccoon Standard Issue Machine Gun.
        *   Possum Basic Rifle (Grunt Possums).
        *   Possum Heavy Weapon (Heavy Possums).
        *   Stats (damage, ROF, range, projectile speed, accuracy - stationary/moving) defined in `config.js` and used by `weapon.js`.
    *   **Targeting & Firing Modes:**
        *   **Manual Target Lock-on:** Left-click on an enemy Possum (or shootable obstacle like barrel) sets it as `manualTarget`. Selected Raccoons engage if in range/LOS. Overrides auto-target.
        *   **Fire at Point (Single Volley):** Shift + Left-Click (Tap/Release) on any map point orders selected Raccoon(s) for an immediate single volley. Clears `manualTarget` and stops continuous fire.
        *   **Continuous Fire at Point/Target (NEW):** Shift + Hold Left Mouse Button orders selected Raccoon(s) to fire continuously towards the mouse cursor.
            *   If the hold starts over an enemy, that enemy becomes the sustained target (tracks if it moves).
            *   If the hold starts over ground/obstacle, units fire continuously at that point.
            *   Releasing Shift or LMB stops continuous fire. Other commands (move, grenade) also interrupt it.
            *   Differentiated from "tap" via `CONFIG.INPUT_TAP_THRESHOLD_MS`.
        *   **Auto-Targeting:** If no manual/continuous fire command, Raccoons auto-target and engage the nearest enemy in weapon range/LOS.
        *   **Shooting While Moving:** Raccoons (with MGs by default) can shoot while moving. `Unit.canShootWhileMoving` flag (configurable per unit type, e.g., Possum Heavy cannot) controls this. Accuracy penalties for moving are applied (`CONFIG.*_ACCURACY_MOVING`).
    *   **Projectiles (`weapon.js`):**
        *   Bullet physics (speed, lifetime from `CONFIG.PROJECTILES.BULLET`).
        *   Accuracy calculation includes weapon's base stationary/moving accuracy, unit's movement state, and Raccoon rank bonuses. Max spread defined in `CONFIG.PROJECTILES.BULLET.MAX_SPREAD_ANGLE_RADIANS`.
        *   Projectile collision with units and obstacle **collision shapes** (not just render bounds).
    *   **Line of Sight (LOS - `utils.js`):** Ray-obstacle intersection check using defined obstacle **collision shapes**.
    *   **Health & Damage (`unit.js`):** Units have HP, take damage, die at 0 HP. Fallen Raccoons auto-deselected.
*   **Special Weapons (Raccoon - Grenades - GDD 2.2.3.B):**
    *   'G' key toggles grenade aiming mode for selected Raccoon(s) with ammo.
    *   Aim mode shows AOE preview at cursor. Left-click designates impact point.
    *   If enemy is clicked while aiming out of max throw range (`CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX`), Raccoon moves towards enemy to get in range (using `CONFIG.RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR`).
    *   Grenades have fuse (`CONFIG.RACCOON_GRENADE_FUSE_TIME`), arc (`CONFIG.PROJECTILES.GRENADE.ARC_*`), AOE damage (`CONFIG.RACCOON_GRENADE_DAMAGE`, `AOE_RADIUS`).
    *   Visuals: Grenade projectile with shadow, fuse blink (`CONFIG.PROJECTILES.GRENADE.FUSE_BLINK`).
    *   Friendly fire enabled for explosives.
    *   Grenade ammo per Raccoon managed, updated on HUD. Starting grenades and rank bonuses from `config.js`.
*   **Pickups (NEW - Grenade Crates):**
    *   "Grenade Crates" (`pickup_grenade_crate` type in `CONFIG.OBSTACLE_DEFINITIONS`) spawn in levels.
    *   Raccoons auto-pickup by walking over them (`Raccoon.checkForAndApplyPickups`).
    *   Crate provides `pickupQuantity` grenades (from config).
    *   Crate sprite changes from "full" to "empty" (`spriteNormal`, `spriteDestroyed` from config).
*   **Enemy Types (Ref GDD 2.3 - `possum.js`, `possumHeavy.js`):**
    *   **Possum Grunt:** Patrols (parameters from `CONFIG.AI.POSSUM_GRUNT`), engages players. Uses Basic Rifle.
    *   **Possum Heavy:** More stationary "guard" role (parameters from `CONFIG.AI.POSSUM_HEAVY`), tougher, uses Heavy Weapon. Cannot shoot while moving.
    *   **AI Behavior:**
        *   Detection via LOS (`CONFIG.POSSUM_DETECTION_RANGE` / per-type AI config).
        *   Alert propagation to nearby allies (`CONFIG.ENEMY_ALERT_PROPAGATION_RADIUS`).
        *   "Suspicious" state to investigate sounds/damage without direct LOS.
*   **Environment Interaction (Ref GDD 2.7 - `level.js`):**
    *   **Destructible Obstacles:** Various obstacle types defined in `CONFIG.OBSTACLE_DEFINITIONS` have HP, can be destroyed.
    *   **Collision Shapes (NEW):** Obstacles can define a `collisionShape` (`rectangle` or `circle` with `offsetX/Y`, `width/height` or `radius`) in `config.js` for more accurate collision detection for movement, LOS, and projectile impacts, rather than just using full sprite bounds.
    *   **Explosive Barrels:** `explosive_barrel` type causes AOE damage (from its config def) to units and other obstacles upon destruction.
    *   Destroyed obstacles have a "rubble" visual (if `spriteDestroyed` defined) or become non-blocking.
*   **XP & Promotion System (Ref GDD 2.8.3 - `raccoon.js`, `config.js`):**
    *   XP for hits, kills (bonus for heavy), mission survival (values from `CONFIG`).
    *   Ranks and XP thresholds defined in `CONFIG.RANK_THRESHOLDS`.
    *   Promotions apply stat boosts (Max HP, Accuracy Bonus from config). Visual "PROMOTED!" effect (`CONFIG.VISUAL_EFFECTS.PROMOTION`).
*   **Y-Sorting for Depth Illusion (NEW - `game.js` render loop):**
    *   Units and relevant obstacles are Y-sorted based on their "feet" or base Y-coordinate.
    *   Allows units to appear behind taller obstacles (e.g., palm tree canopies) if their Y-sort value is lower.

### 2.2. User Interface (UI) (Ref GDD Section 3 - `ui.js`, `style.css`, `index.html`)

*   **Main Menu:** Start screen with "New Campaign", "Recruit Memorial", "Options" (disabled) buttons. Fullscreen background image support.
*   **Pre-Mission Screen:** Phase/Mission Name, Briefing. Recruit selection from `masterRoster` to `tempSelectedForDeployment` (up to `CONFIG.MAX_SQUAD_SIZE_MVP`). Uses sprite-based recruit cards.
*   **Post-Mission Screen:** Outcome, stats (time, kills), lists of survivors (with final Rank/XP) and fallen. "Next Mission" / "Retry Mission" / "Restart Campaign" buttons with context-aware text from `CONFIG.UI_TEXT_STRINGS`. Links to Recruit Memorial.
*   **Game Over Screen:** For campaign failure (e.g., all recruits KIA).
*   **Recruit Memorial ("Wall of the Fallen"):** Lists fallen recruits with name, rank, mission died, phase died. Uses face images.
*   **In-Game HUD (`#left-hud-panel`):**
    *   **Squad Roster (`#hud-squad`):** Dynamically updating cards for deployed Raccoons (Name, Rank, HP bar from `CONFIG.UI_SETTINGS.HEALTH_BAR`, Grenade Ammo, Status, XP, Face Image). Selected units highlighted.
    *   **Controls Area (`#hud-controls`):** Formation toggle button, formation spacing slider.
*   **Canvas Area (`#canvas-container`):**
    *   Main game rendering.
    *   **Objective Display (`#hud-objective`):** Top-right, shows current mission name/objective.
*   **Mouse Cursors:** Context-sensitive (default, attack, grenade aim cell) via CSS classes.
*   **Extensive Configuration:** Many UI text strings, colors, and minor layout parameters are now sourced from `CONFIG.UI_TEXT_STRINGS` and `CONFIG.UI_SETTINGS`.

### 2.3. Campaign & Roster (Ref GDD 2.8 - `game.js`, `campaignData.js`)

*   **Structure:** Phases and Missions defined in `campaignData.js`.
*   **Progression:** Sequential through missions/phases on victory.
*   **Master Roster:** Persistent list (`game.masterRoster`). Recruits retain stats.
*   **Permadeath:** Fallen Raccoons tracked globally (`game.fallenRaccoonsGlobal`) and per mission, removed from active roster.
*   **New Recruits:** Added to master roster on mission win (`CONFIG.NEW_RECRUITS_PER_MISSION_WIN`).
*   **Game Over:** If all master roster recruits are KIA.

### 2.4. Technical Aspects

*   **Asset Preloading (`game.js`):** Sprites for obstacles (including specific lists for grass, bushes, rocks, palms) and unit faces are preloaded before mission start to prevent pop-in.
*   **Procedural Level Generation (`level.js`):**
    *   Generates levels based on parameters from `campaignData.js` and extensive settings in `CONFIG.LEVEL_GENERATION`, `CONFIG.OBSTACLE_DEFINITIONS`, `CONFIG.ENEMY_SPAWNING`.
    *   Places border walls, internal obstacles (with types, destructibility, sprites, collision shapes), pickups, player spawns (in a cleared zone), and enemy groups/stragglers.
    *   Obstacle placement uses weighted random selection (`spawnWeight` in `CONFIG.OBSTACLE_DEFINITIONS`).
    *   Sprite Handling: Supports fixed sprites per obstacle type, or random selection from lists (grass, bushes, rocks, palms). Supports normal and destroyed sprites. Grass can be randomly scaled.
*   **Dynamic World & Camera:** Supports variable world size per mission. Camera follows selected units with lerp, clamps to world boundaries.
*   **Code Configuration:** A vast majority of game parameters (unit/weapon stats, AI behaviors, level gen rules, UI text, visual effect details, input thresholds) are now centralized in `config.js`.

## 3. Current Control Scheme (Refined)

*   **Left Click (No Modifiers):**
    *   On Enemy Unit: Set as `manualTarget`.
    *   On Friendly Raccoon (map/HUD): Selects unit (Ctrl/Cmd+Click on HUD for multi-select).
    *   On Empty Ground / Non-Shootable: Deselects all.
*   **Shift + Quick Left Click (Tap):** `fireAtPoint()` single volley at cursor. Clears manual target, stops continuous fire.
*   **Shift + Hold Left Mouse Button:** Continuous fire at mouse cursor. Tracks enemy if hold starts over one.
*   **Left Click & Drag (No Modifiers):** Box selection for multiple Raccoons.
*   **Right Click:**
    *   If aiming grenade: Cancel grenade aim.
    *   Else: Order selected Raccoons to move (maintains formation). Stops continuous fire.
*   **'G' Key:** Toggle grenade aiming mode. Stops continuous fire.
*   **'F' Key:** Toggle movement formation type.
*   **Spacebar:** Select all alive deployed Raccoons. Stops continuous fire.
*   **Esc Key:** Deselect all. Stops continuous fire.

## 4. Known Issues / Immediate Next Steps Discussed

*   **Pathfinding:** Still the most significant system awaiting implementation. Crucial for unit navigation around complex `collisionShape` obstacles.
*   **Advanced AI:** Cover usage, more enemy types (Grenadier, Sniper from GDD).
*   **Visual Polish:** Integrating final sprites/animations for units, terrain features not yet sprited, and effects.
*   **Audio:** Placeholder/missing sounds.
*   **Procedural Mission *Parameter* Generation:** For post-handcrafted phases to enhance replayability (names, briefings, objective types).
*   **More Objective Types:** Beyond "EXTERMINATE".
*   **Rocket Launcher & Other Pickups:** Beyond grenade crates.
*   **Background Image for Main Menu:** The issue with it not appearing needs to be revisited (likely path or CSS loading order).
*   **Save/Load System.**

This document reflects a feature-rich alpha build with a strong, configurable foundation. The focus on sprite integration and advanced controls has significantly progressed the game.