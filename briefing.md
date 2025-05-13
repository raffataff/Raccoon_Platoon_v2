Okay, this is an excellent idea and standard practice when handing off a project or wanting to ensure continuity with a different assistant or team member.

Here's a Markdown file summarizing the current state of "Raccoon Platoon." I've tried to be comprehensive based on our development journey.

```markdown
# Raccoon Platoon - Project Status & Overview

## 1. Project Overview

*   **Game Name:** Raccoon Platoon
*   **Concept:** An HTML5 real-time, squad-based, top-down tactical action game, heavily inspired by the classic "Cannon Fodder." Players control a small squad of raccoon soldiers ("Recruits") navigating procedurally generated levels, battling enemy possums, and completing mission objectives. (GDD 1.1)
*   **Core Loop:** Squad control (selection, movement, formation), tactical combat (targeting, shooting, special weapons), completing mission objectives, and managing a persistent roster of recruits through a campaign.
*   **Current State:** MVP++ stage. Many core mechanics from the Game Specification Document (GDD) have been implemented. The game features a campaign structure with procedurally generated levels, different enemy types, destructible environment elements, and a basic XP/Rank system for Raccoons.
*   **Platform:** HTML5 Canvas 2D, JavaScript (no external game libraries/engines).

## 2. Implemented Features

### 2.1. Core Gameplay Mechanics

*   **Squad Control (Ref GDD 2.1):**
    *   **Selection:**
        *   Single Raccoon selection via left-click on the unit on the map.
        *   Single Raccoon selection via left-click on its card in the HUD (Note: This was being worked on, verify current state).
        *   Multi-Raccoon selection via click-and-drag box on the map.
        *   Ctrl+Left-Click on HUD cards for additive/toggle selection (Note: Verify current state).
        *   "Select All" deployed Raccoons via Spacebar.
        *   Deselection via 'Esc' key or Left-Click on empty ground (when not issuing a fire command).
    *   **Movement:**
        *   Right-click on terrain orders selected Raccoons to move.
        *   Units attempt to move in a basic formation to the destination.
        *   Basic obstacle collision (units stop or attempt a simple slide). Rudimentary "unstuck" logic implemented.
    *   **Formations:**
        *   Toggle between 'HORIZONTAL' and 'VERTICAL' line formations using a HUD button or 'F' key.
        *   Formation spacing is adjustable in real-time via a HUD slider.
*   **Combat (Ref GDD 2.2):**
    *   **Weapons Implemented:**
        *   Raccoon Standard Issue Machine Gun.
        *   Possum Basic Rifle (for Grunt Possums).
        *   Possum Heavy Weapon (for Heavy Possums).
        *   Stats (damage, ROF, range, projectile speed, accuracy) are defined in `js/config.js`.
    *   **Targeting & Firing:**
        *   **Manual Target Lock-on:** Left-click on an enemy (Possum) or a shootable obstacle (Explosive Barrel) sets it as a `manualTarget` for selected Raccoon(s). Raccoons will shoot this target if in range and Line of Sight (LOS), even while moving. *They do not auto-walk to a manually targeted enemy.*
        *   **Fire at Point (Force Fire):** Shift + Left-Click (on ground, enemy, or barrel) orders selected Raccoon(s) to immediately fire one volley in that direction. This overrides/clears any `manualTarget`.
        *   **Auto-Targeting:** If a Raccoon has no `manualTarget` and is not currently executing a "fire at point" command, it will automatically target and engage the nearest enemy unit within its weapon range and LOS. This occurs even if the Raccoon is moving due to a player's right-click move order.
        *   Possum AI uses similar auto-targeting and manual targeting (set by their AI logic).
    *   **Projectiles:** Basic projectile physics (speed, lifetime). Accuracy is calculated based on whether the shooter is stationary or moving.
    *   **Line of Sight (LOS):** Basic ray-obstacle intersection check.
    *   **Health & Damage:** Units have HP and take damage. They die when HP reaches 0. Fallen Raccoons are deselected automatically.
*   **Special Weapons (Raccoon):**
    *   **Grenades (Ref GDD 2.2.3.B):**
        *   Player Raccoons can be equipped with grenades (currently starting with 0, intended for pickup system later).
        *   'G' key toggles grenade aiming mode for selected Raccoon(s) with ammo.
        *   In aim mode, Left-click designates impact point. AOE preview at cursor.
        *   Grenades have a fuse, travel in a simulated arc, and cause AOE damage upon explosion.
        *   If an enemy is clicked while grenade aiming and is out of max throw range, the Raccoon will move towards the enemy to get in range, remaining in aim mode.
        *   Friendly fire is enabled for explosives.
*   **Enemy Types (Ref GDD 2.3):**
    *   **Possum Grunt:** Standard enemy with a basic rifle. AI includes simple "ping-pong" patrol between two points and engaging player units.
    *   **Possum Heavy:** Larger, slower, tougher enemy with a more powerful, longer-range weapon. AI is more stationary ("firebase" role), preferring to guard a post and engage from a distance.
*   **Environment Interaction (Ref GDD 2.7):**
    *   **Destructible Obstacles:** Certain procedurally generated obstacles have types (e.g., 'fence_wood', 'explosive_barrel', 'rock_small', 'building_shed') and HP.
    *   Grenades damage destructible obstacles in their AOE.
    *   Explosive barrels (`type: 'explosive_barrel'`) can be shot by Raccoon MGs. Upon destruction (HP <= 0), they cause a secondary AOE explosion damaging nearby units and other destructible obstacles.
    *   Destroyed obstacles no longer block movement or LOS and have a "rubble" visual.
    *   Some obstacles are marked indestructible (e.g., 'rock_large', 'border_wall').
*   **XP & Promotion System (Ref GDD 2.8.3 - Partial Implementation):**
    *   Raccoons gain XP for successful bullet hits (`CONFIG.XP_PER_HIT`) and for enemy kills (`CONFIG.XP_PER_KILL`, with bonus for `XP_FOR_HEAVY_KILL`).
    *   Raccoons also gain XP for surviving a successfully completed mission (`CONFIG.XP_PER_MISSION_SURVIVED`).
    *   XP thresholds for ranks ("Recruit", "Private", "Corporal", "Sergeant") are defined in `config.js`.
    *   Promotions can occur mid-mission and are logged to the console. Basic stat boosts (Max HP) are applied on promotion.
    *   Current Rank is displayed on the Raccoon's HUD card.

### 2.2. User Interface (UI) (Ref GDD Section 3)

*   **Layout:** Vertical HUD panel on the left side of the screen, game canvas on the right.
*   **Left HUD Panel (`#left-hud-panel`):**
    *   **Squad Roster (`#hud-squad`):** Displays cards for each deployed Raccoon, showing ID, Rank, HP (with a colored bar), Grenade Ammo, Status (Active, KIA, Busy, Aiming), current XP. Each card has a background image (Raccoon face).
    *   **Controls Area (`#hud-controls`):** Located at the bottom of the left HUD. Contains a button to toggle formation type and a slider to adjust formation spacing.
*   **Game Canvas Area (`#canvas-container`):**
    *   Main game rendering.
    *   **Objective Display (`#hud-objective`):** Top-right overlay on the canvas, currently shows the mission name.
*   **Screen Overlays:**
    *   **Pre-Mission Screen (`#preMissionScreen`):** Displays current Phase Name, Mission Name, and Mission Briefing. Includes UI for selecting Raccoons from the `masterRoster` for deployment (up to `MAX_SQUAD_SIZE_MVP`).
    *   **Post-Mission Screen (`#postMissionScreen`):** Displays "Mission Successful/Failed", mission context, mission stats (Time Taken, Enemies Killed), lists of Surviving Raccoons (with final Rank/XP) and Fallen Raccoons. Provides "Next Mission/Start Phase/Campaign Complete" or "Retry Mission" buttons.
    *   **Game Over Screen (`#gameOverScreen`):** Basic screen for "All Recruits KIA" or other campaign-ending conditions.
*   **Mouse Cursors:**
    *   Default arrow.
    *   Attack cursor (custom `red_crosshair.png`): Shown when Shift is held (and Raccoons selected, ready to fire at point) OR when hovering over an enemy unit (without Shift, indicating targetable).
    *   Cell cursor: Shown when a Raccoon is aiming a grenade.

### 2.3. Campaign & Roster (Ref GDD 2.8)

*   **Campaign Structure:** Defined in `js/campaignData.js`. Consists of Phases, each with multiple Missions. Each mission has parameters (name, briefing, `worldSizeFactor`, `enemyDensityFactor`, `objectiveType`).
*   **Progression:** Game progresses through missions and phases upon successful completion. UI flow guides this via Pre/Post mission screens.
*   **Master Roster (`game.masterRoster`):** A persistent list of all Raccoon objects available to the player.
    *   Initialized with `CONFIG.INITIAL_ROSTER_SIZE` recruits at the start of a new campaign.
    *   Recruits in the master roster retain their XP, Rank, and alive/KIA status between missions.
*   **Deployed Squad (`game.deployedSquadRoster`):** For each mission, player selects units from the available (alive) members of the `masterRoster`. These selected units are deployed.
*   **New Recruits:** `CONFIG.NEW_RECRUITS_PER_MISSION_WIN` new Raccoons are added to the `masterRoster` after each successfully completed mission (up to an optional total roster cap).
*   **Fallen Raccoons:** Tracked per mission for debrief (`game.fallenRaccoonsThisMission`) and globally for a future Recruit Memorial (`game.fallenRaccoonsGlobal`). Dead Raccoons are not available for future deployment.
*   **Game Over:** Occurs if all Raccoons in the `masterRoster` are KIA and the player attempts to start a new mission.

### 2.4. Technical Aspects

*   **Platform:** HTML5 Canvas 2D, vanilla JavaScript.
*   **World & Camera:** Supports a large game world (`CONFIG.WORLD_WIDTH/HEIGHT`) with a smaller viewport (`canvas.width/height`) that dynamically fills available browser space next to the HUD. A camera system (`game.cameraX/Y`) follows selected units with a lerp and clamps to world boundaries. All game object rendering and input coordinates are translated to/from world space.
*   **Procedural Level Generation (`js/level.js`):**
    *   Generates levels based on parameters from `campaignData.js` (world size, enemy density).
    *   Creates four thick, indestructible "border wall" obstacles.
    *   Randomly places a configurable number of internal rectangular obstacles of varying sizes and types (some destructible with HP, some not). Obstacle types include 'rock_large', 'rock_small', 'tree_dense', 'fence_wood', 'building_shed', 'explosive_barrel'.
    *   Generates player spawn locations in a fixed area (e.g., bottom-left of playable area).
    *   Generates enemy spawn locations (mix of Grunts and Heavies) in groups and as stragglers, ensuring they don't spawn directly inside obstacles.
*   **Rudimentary Stuck Logic:** Units detect if they haven't moved for a set number of frames while trying to move. Player units stop. AI (Possum) units attempt a simple unstuck maneuver (e.g., try different patrol point or a nudge).

## 3. Current Code Structure (Key Files)

*   **`index.html`**: Main HTML page, defines structure for UI panels (pre-mission, post-mission, game over, left HUD, canvas container).
*   **`style.css`**: All visual styling for HTML elements and custom cursors.
*   **`assets/`**: Contains subfolders for images (`cursors/red_crosshair.png`, `images/raccoons/faceX.png`).
*   **`js/config.js`**: Global game constants: dimensions, unit/weapon stats, XP/Rank thresholds, asset paths, lists of face images, etc.
*   **`js/campaignData.js`**: Defines the structure of campaign phases and missions with their specific parameters.
*   **`js/utils.js`**: Helper functions like `distance()`, `hasLineOfSight()`.
*   **`js/input.js`**: Handles all mouse and keyboard inputs. Manages `isShiftPressed`. Determines cursor style based on context and calls `ui.setCursor()`. Differentiates between clicks, drags, Shift+clicks and calls appropriate methods in `Game.js`.
*   **`js/ui.js`**: Manages DOM manipulation for all UI screens (pre-mission recruit selection, post-mission debrief, game over, in-game HUD). Populates these screens with dynamic data. Handles HUD card click selection.
*   **`js/weapon.js`**: Defines `Weapon` class (stats, accuracies), `WEAPONS` object (specific weapon instances), `Projectile` class (for bullets, handles hit detection, damage, XP for hits), and `GrenadeProjectile` class (arc, fuse, AOE damage to units and obstacles).
*   **`js/unit.js`**: Base class for all characters. Handles movement (including basic collision and stuck detection), `_handleCombat` (prioritizing manual target, then auto-target, allowing shoot-while-moving for MGs), health, damage (`takeDamage` now accepts `attackerUnit` for XP attribution), death (including de-selection and recording fallen player units), `fireAtPoint()`, `setManualTarget()`, `setMoveTarget()`.
*   **`js/raccoon.js`**: `Raccoon` class (player units). Inherits from `Unit`. Manages XP (`addXp`), promotions (`checkPromotion`), grenade state (`isAimingGrenade`), and grenade actions (`startGrenadeAim`, `confirmThrowGrenade`, `moveToGrenadeRange`). Stores `faceImageUrl`.
*   **`js/possum.js`**: `PossumGrunt` class. Inherits from `Unit`. Contains AI logic for patrolling (ping-pong between two points) and engaging player units.
*   **`js/possumHeavy.js`**: `PossumHeavy` class. Inherits from `Unit`. Contains AI logic for a more stationary "firebase" role.
*   **`js/level.js`**: `Level` class. `generateLevelAndGetPlayerSpawns()` method handles procedural creation of border walls, internal obstacles (with types and destructibility properties), and provides player spawn locations. Also spawns enemy Grunts and Heavies in groups/straggler formation, ensuring they are not inside obstacles. Contains `damageObstacle()` method.
*   **`js/game.js`**: The main orchestrator.
    *   Manages game state (`PRE_CAMPAIGN_INIT`, `PRE_CAMPAIGN`, `RUNNING`, `POST_MISSION_DEBRIEF`, `GAME_OVER_NO_RECRUITS`, `CAMPAIGN_COMPLETE`).
    *   Handles campaign progression (`currentPhaseIndex`, `currentMissionIndex`, `loadMissionData`, `proceedToNextLogicalStep`).
    *   Manages rosters: `masterRoster`, `deployedSquadRoster`, `fallenRaccoonsGlobal`, `fallenRaccoonsThisMission`, `addNewRecruitToMasterRoster`.
    *   Handles game loop (`update`, `render`).
    *   Manages camera (`cameraX`, `cameraY`, `clampCamera`, camera follow logic).
    *   Contains the specific click handler methods: `handlePrimaryLeftClick`, `handleShiftFireAtPointCommand`, `handleRightClickCommand`.
    *   `confirmSquadAndStartMission`: Key method to transition from recruit selection to active gameplay.
    *   `recordRaccoonFallen`: Tracks fallen Raccoons.
    *   `addVisualEffect`: For explosions and promotions.
    *   `checkMissionStatus`: Determines win/loss conditions for the current mission.

## 4. Current Control Scheme

*   **Left Click (No Shift Modifier):**
    *   On an Enemy Unit: Sets it as the `manualTarget` for selected Raccoon(s). Red target line appears. Raccoons will fire if in range/LOS (no auto-walk).
    *   On a friendly Raccoon (on map): Selects that Raccoon, deselects others.
    *   On Empty Ground / Non-Shootable Obstacle / Barrel: Deselects all currently selected Raccoons.
*   **Shift + Left Click:**
    *   Cursor changes to red crosshair image when Shift is held (if Raccoons are selected).
    *   On any point on the map (Enemy, Barrel, or Empty Ground): Selected Raccoon(s) immediately execute `fireAtPoint()` in the direction of the mouse click. This action overrides/clears any existing `manualTarget`.
*   **Left Click & Drag (No Shift Modifier):** Draws a selection box to select multiple Raccoons within the deployed squad. Dragging is disabled if Shift is held down.
*   **Right Click:**
    *   If a selected Raccoon is aiming a grenade: Cancels grenade aim mode.
    *   Else: Orders selected Raccoon(s) to move to the clicked world location, using the currently active formation (`HORIZONTAL` or `VERTICAL`). This action clears any `manualTarget` the Raccoons had.
*   **'G' Key:** Toggles grenade aiming mode for selected Raccoon(s) that have grenades.
*   **'F' Key:** Toggles the movement formation type (currently 'HORIZONTAL' <> 'VERTICAL'). The HUD button updates to reflect the change.
*   **Spacebar:** Selects all *alive* Raccoons currently deployed on the mission.
*   **Esc Key:** Deselects all currently selected Raccoons.
*   **HUD Squad Cards:**
    *   Clicking a Raccoon's card selects that Raccoon (deselects others).
    *   Ctrl+Click (Cmd+Click on Mac) on a Raccoon's card toggles its selection state (adds to or removes from the current selection). (Note: Current status of this HUD card selection should be verified).

## 5. Known Issues / Immediate Next Steps Discussed

*   **HUD Card Clicking:** The functionality to select/multi-select Raccoons by clicking their cards in the HUD was recently being worked on and needs to be re-verified or fully implemented robustly.
*   **Pathfinding:** Unit movement around obstacles is still very basic (stop or rudimentary slide). Units (especially AI) can get stuck. A proper pathfinding system (e.g., A*) is a major future enhancement.
*   **Visual Polish:**
    *   Adding icons for ranks and inventory to HUD cards.
    *   Integrating actual sprites for terrain, units, obstacles, and effects instead of placeholder colored rectangles.
*   **Procedural Mission Details:** Further enhance replayability by procedurally generating mission names and parts of briefings from pools of terms.
*   **Recruit Memorial:** Implement the "Wall of the Fallen" screen as per GDD.

This document should provide a solid foundation for understanding the current state of Raccoon Platoon.
```

This Markdown file covers:
*   A high-level overview.
*   A detailed list of currently implemented features, referencing GDD sections.
*   A breakdown of the current JavaScript file structure and the role of each key file.
*   A summary of the current, refined control scheme.
*   A list of known issues or the next areas we were about to focus on.

This should be sufficient for another AI or developer to get up to speed. Let me know if you'd like any part expanded or clarified!