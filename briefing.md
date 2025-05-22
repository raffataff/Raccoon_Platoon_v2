Okay, I will update the `briefing.md` document to reflect all the recent major changes, especially the introduction of A* pathfinding, the refined chase AI for Possums, the ground tiling, and the separation of body/gun facing. This will be a comprehensive update.

Here is the updated `briefing.md`:

--- START OF FILE briefing.md ---

# Raccoon Platoon - Project Status & Overview (Mid-Development Update - Pathfinding Implemented)

## 1. Project Overview

*   **Game Name:** Raccoon Platoon
*   **Concept:** An HTML5 real-time, squad-based, top-down tactical action game, inspired by "Cannon Fodder." Players control a squad of raccoon soldiers ("Recruits") through procedurally generated levels, battling enemy possums, and completing mission objectives. (GDD 1.1)
*   **Core Loop:** Squad control (selection, movement, formation), tactical combat (targeting, various firing modes, special weapons), completing mission objectives, and managing a persistent roster of recruits with permadeath through a multi-phase campaign.
*   **Current State:** Alpha. Core gameplay loop is robust. Campaign structure, multiple UI screens, varied enemy AI, destructible environments, detailed procedural level generation, and initial sprite integration are implemented. Significant configuration options are centralized in `config.js`. **Major recent addition: A\* pathfinding for all units.**
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
    *   **Movement & Pathfinding (NEW - A\* Implemented):**
        *   Right-click on terrain orders selected Raccoons to move to that point (`Unit.setMoveTarget()`).
        *   Units now use **A\* pathfinding** (`utils.js -> findPath()`) to navigate around obstacles.
        *   A navigation grid (`Level.navGrid`) is generated based on `CONFIG.GRID_CELL_SIZE` and obstacle `collisionShape` data when a level loads (`Level.generateNavigationGrid()`). Blocked cells are marked.
        *   Paths are requested from the unit's current grid cell to the target's grid cell.
        *   If the target grid cell is blocked, A\* attempts to find a path to a nearby walkable alternative.
        *   **Path Smoothing (NEW):** Raw grid paths from A\* are processed by `utils.js -> smoothPath()` to remove unnecessary intermediate waypoints if a direct Line of Sight (LOS) exists between non-adjacent waypoints, resulting in more natural movement. LOS for smoothing checks against `blocksMovement` obstacles.
        *   Units follow the smoothed path (an array of world coordinates).
        *   `Unit._handleMovement()` manages path following, moving towards the next node in `this.currentPath`.
        *   **Stuck Detection & Recovery:**
            *   `Unit.stuckFrames`: For direct movement (no path).
            *   `Unit.pathingStuckFrames`: For when following a path but not making progress to the next node. If triggered, the unit attempts to re-calculate its path to the original `worldTargetX/Y` after a short cooldown (`REPATH_STUCK_COOLDOWN`).
            *   Enemy-specific `onStuck()` methods provide further recovery behaviors.
        *   Units move in formation towards the destination if multiple units are selected (formation points are calculated, then each unit paths individually to its formation spot).
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
        *   **Manual Target Lock-on:** Left-click on an enemy Possum sets it as `manualTarget`. Selected Raccoons engage if in range/LOS. Player Raccoons stop path-following movement when a manual target is set.
        *   **Fire at Point (Single Volley):** Shift + Left-Click (Tap/Release) on any map point orders selected Raccoon(s) for an immediate single volley. Clears `manualTarget` and stops continuous fire. Projectile uses the calculated angle to the point.
        *   **Continuous Fire at Point/Target:** Shift + Hold Left Mouse Button orders selected Raccoon(s) to fire continuously towards the mouse cursor. Player Raccoons stop path-following movement. Tracks enemy if hold starts over one.
        *   **Auto-Targeting:**
            *   If no manual/continuous fire command, units auto-target and engage the nearest enemy in weapon range/LOS (`Unit.findAutoTarget()`).
            *   **Raccoon Auto-Target Range (NEW):** Raccoons use `CONFIG.RACCOON_AUTO_TARGET_RANGE_FACTOR` (e.g., 0.66) of their full weapon range for *acquiring* auto-targets, making them less aggressive on their own. They still shoot up to full weapon range if commanded or if an auto-target is maintained.
            *   **Player Raccoons DO NOT move towards auto-targets.** They shoot from their current position (if stationary) or continue along their player-commanded path (if moving and `canShootWhileMoving`).
        *   **Shooting While Moving:** Raccoons (with MGs by default) can shoot while moving (`Unit.canShootWhileMoving = true`). Possum Heavy cannot. Accuracy penalties for moving are applied (`CONFIG.*_ACCURACY_MOVING`).
    *   **Visual Facing vs. Gun Aiming (NEW Distinction):**
        *   `Unit.facingAngle`: Represents the body's orientation, primarily for sprite display. Updated by movement direction (path following) or by combat target if stationary.
        *   `Unit.gunAimAngle`: Represents the actual direction the gun/weapon is pointing. Updated by the current combat target (manual, continuous, or auto). Used for drawing the gun line indicator and for the projectile's actual firing angle.
        *   This allows units (especially Raccoons) to move in one direction while shooting in another.
    *   **Projectiles (`weapon.js`, `Projectile` class):**
        *   Bullet physics (speed, lifetime from `CONFIG.PROJECTILES.BULLET`).
        *   Projectile direction now uses the unit's `gunAimAngle` (passed to `_executeFire` and then to `Projectile` constructor as `explicitShooterAngle`).
        *   Accuracy calculation includes weapon's base stationary/moving accuracy, unit's movement state, and Raccoon rank bonuses. Max spread defined in `CONFIG.PROJECTILES.BULLET.MAX_SPREAD_ANGLE_RADIANS`.
        *   Projectile collision with units and obstacle `collisionShape`.
    *   **Line of Sight (LOS - `utils.js`):** Ray-obstacle intersection check using defined obstacle `collisionShape`. LOS for shooting typically checks against `blocksMovement` obstacles.
    *   **Health & Damage (`unit.js`):** Units have HP, take damage, die at 0 HP. Fallen Raccoons auto-deselected.
*   **Special Weapons (Raccoon - Grenades - GDD 2.2.3.B):**
    *   'G' key toggles grenade aiming mode.
    *   Logic for moving into throw range (`moveToGrenadeRange`) uses `setMoveTarget` and thus pathfinding.
    *   Other grenade mechanics (fuse, arc, AOE, visuals, friendly fire, ammo) remain as previously implemented.
*   **Pickups (Grenade Crates):**
    *   Functionality for Raccoons auto-picking up grenade crates by walking over them (`Raccoon.checkForAndApplyPickups`) remains.
*   **Enemy Types (Ref GDD 2.3 - `possum.js`, `possumHeavy.js`):**
    *   **Possum Grunt & Possum Heavy:** Base stats and weapons from `config.js`.
    *   **AI Behavior & Pathfinding:**
        *   Detection via LOS (`CONFIG.POSSUM_DETECTION_RANGE` / per-type AI config).
        *   Alert propagation to nearby allies.
        *   "Suspicious" state to investigate sounds/damage, now uses `setMoveTarget` to pathfind to `lastKnownPlayerPosition`.
        *   **Engaging Targets (NEW - Chase Logic):**
            *   Enemy AI (`PossumGrunt.aiLogic`, `PossumHeavy.aiLogicHeavy`) now uses `setMoveTarget` to pathfind towards Raccoon targets if they are out of preferred range or if the Raccoon is moving.
            *   They attempt to maintain an optimal engagement distance or return to their guard post, using pathfinding for all significant movements.
            *   Possum Grunts are more persistent in chasing moving targets.
        *   **Reaction to Damage (NEW):** Enemies now more reliably become suspicious and investigate the source location of damage even if they don't have direct LOS to the attacker (`Unit.takeDamage()`).
*   **Environment Interaction (Ref GDD 2.7 - `level.js`):**
    *   **Destructible Obstacles:** Defined in `CONFIG.OBSTACLE_DEFINITIONS` with HP, `spriteDestroyed`, and `collisionShape`. When an obstacle that `blocksMovement` is destroyed, the `navGrid` is updated locally to mark its cells as walkable (`Level.updateNavigationGridForObstacle()`).
    *   **Explosive Barrels:** Cause AOE damage to units and other obstacles.
*   **XP & Promotion System (Ref GDD 2.8.3 - `raccoon.js`, `config.js`):**
    *   Functionality remains: XP for hits, kills, survival. Promotions grant stat boosts and visual effect.
*   **Y-Sorting for Depth Illusion (`game.js` render loop):**
    *   Functionality remains, sorting units and relevant obstacles.

### 2.2. User Interface (UI) (Ref GDD Section 3 - `ui.js`, `style.css`, `index.html`)

*   **Main Menu, Pre-Mission, Post-Mission, Game Over, Recruit Memorial:** Functionality largely as before, using `config.js` for text strings.
*   **In-Game HUD (`#left-hud-panel`):** Squad roster, controls area (formation, spacing).
*   **Canvas Area (`#canvas-container`):** Main game rendering, objective display.
*   **Mouse Cursors:** Context-sensitive.

### 2.3. Campaign & Roster (Ref GDD 2.8 - `game.js`, `campaignData.js`)

*   Structure, progression, master roster, permadeath, new recruits, and game over conditions remain as previously implemented.

### 2.4. Technical Aspects & Rendering

*   **Asset Preloading (`game.js`):** Preloads obstacle sprites (including specific lists for grass tiles, bushes, rocks, palms, huts) and unit faces.
*   **Procedural Level Generation (`level.js`):**
    *   Generates levels based on `campaignData.js` and `CONFIG`.
    *   Places border walls, internal obstacles, pickups, player spawns, and enemy groups.
    *   **Navigation Grid Generation:** `Level.generateNavigationGrid()` creates a 2D array representing walkable/blocked cells based on `CONFIG.GRID_CELL_SIZE` and the `collisionShape` of `blocksMovement` obstacles. This grid is used by the A\* pathfinder.
*   **Ground Texture Rendering (NEW - Tiled Background):**
    *   The game world background is now prerendered onto an offscreen canvas when a mission starts (`Game.generatePrerenderedBackground()`).
    *   This background consists of a base "mud" color (`CONFIG.WORLD_BASE_MUD_COLOR`).
    *   On top of the mud, grass tile sprites (from `CONFIG.GRASS_SPRITE_FILES`) are drawn in a tiled fashion with configurable overlap (`CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR`) and random selection to create an organic ground texture. Tiles can be drawn scaled to `CONFIG.WORLD_GRASS_TILE_SIZE`.
    *   The main render loop then draws this single prerendered background image first, improving performance.
*   **Dynamic World & Camera:** Functionality remains.
*   **Code Configuration:** Extensive use of `config.js`.

## 3. Current Control Scheme (Refined)

*   **Left Click (No Modifiers):**
    *   On Enemy Unit: Set as `manualTarget`. Raccoon stops current path and faces target.
    *   On Friendly Raccoon (map/HUD): Selects unit.
    *   On Empty Ground / Non-Shootable: Deselects all.
*   **Shift + Quick Left Click (Tap):** `fireAtPoint()` single volley at cursor. Clears manual target, stops continuous fire. Projectile uses calculated angle to point.
*   **Shift + Hold Left Mouse Button:** Continuous fire at mouse cursor. Raccoon stops current path. Tracks enemy if hold starts over one.
*   **Left Click & Drag (No Modifiers):** Box selection.
*   **Right Click:**
    *   If aiming grenade: Cancel grenade aim.
    *   Else: Order selected Raccoons to move to the clicked world point (pathfinding used). Stops continuous fire/manual targeting.
*   **'G' Key:** Toggle grenade aiming mode. Stops continuous fire.
*   **'F' Key:** Toggle movement formation type.
*   **Spacebar:** Select all alive deployed Raccoons. Stops continuous fire.
*   **Esc Key:** Deselect all. Stops continuous fire.

## 4. Known Issues / Immediate Next Steps Discussed (Updated)

*   **Advanced AI:**
    *   Cover usage by AI units (needs pathfinding to move to cover spots).
    *   More enemy types (Grenadier, Sniper from GDD) with specialized AI and pathfinding needs.
*   **Visual Polish:**
    *   Integrating final sprites/animations for units (including 8-directional movement/idle/firing sprites). `Unit.updateVisualDirection()` and `Unit.facingAngle` support this, but actual sprite rendering logic in `Unit.render()` is placeholder.
    *   Terrain features not yet sprited.
    *   More varied visual effects.
*   **Audio:** Placeholder/missing sounds.
*   **Procedural Mission *Parameter* Generation:** For post-handcrafted phases to enhance replayability (names, briefings, objective types).
*   **More Objective Types:** Beyond "EXTERMINATE" (e.g., Rescue Hostages, Destroy Specific Structures, Hold Position).
*   **New Weapon Pickups:** Rocket Launcher, etc.
*   **Pathfinding Refinements:**
    *   Consider performance for many units (e.g., Min-Heap for A\* open list).
    *   Local avoidance for dynamic unit-vs-unit collisions (steering behaviors).
    *   Handling of units with different sizes more accurately on the nav grid.
    *   More robust "unstuck" logic if pathfinding still leads to edge case stucks.
*   **Save/Load System.**
*   **Raccoon Hostage System:** Design and implement mechanics for rescuing unarmed Raccoons who then join the roster. Link to Possum Huts for spawning.
*   **Dynamic Possum Spawning from Huts:** Implement proximity triggers and valid spawn point logic.
*   **More Varied Level Generation:**
    *   Distinct Biomes (Swamp, Junkyard themes using different obstacle sets).
    *   Water terrain with movement effects.
    *   More structured "map flow" generation beyond random obstacle placement.

This document reflects a significantly advanced alpha build, with A\* pathfinding being a major new system. The focus on a robust pathfinding foundation, along with the new tiled background rendering, has greatly improved the potential for complex and engaging gameplay. The next steps will likely involve leveraging this pathfinding for more advanced AI, objectives, and richer level designs.

--- END OF FILE briefing.md ---