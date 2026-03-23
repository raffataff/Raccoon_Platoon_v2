Of course, Director. It is crucial to keep our documentation synchronized with the live codebase. I have updated the `briefing.md` to reflect all the recent implementations and bug fixes.

The new version, **1.2**, now includes details on the Sniper Possum, the new visual effects system, the more advanced procedural generation (non-uniform scaling, quadrant spawning, fallen trees), and our recent critical bug fixes. I have also updated the onboarding section to point new developers to the refactored `levelGenerator.js`.

Here is the complete, updated document for your records.

***

# Project Briefing & Roadmap: Raccoon Platoon

**DOCUMENT VERSION:** 1.2 (Updated)
**DATE:** [Current Date]
**TO:** Development Team
**FROM:** Lead Developer

---

## 1. Project Overview

### 1.1. High-Concept
**Raccoon Platoon** is a top-down, squad-based, real-time tactical action game developed in pure JavaScript and rendered on HTML5 Canvas. Players command a persistent roster of raccoon recruits against a tyrannical possum regime across a series of procedurally generated missions. The game emphasizes quick tactical decisions, squad management, and features core mechanics like permadeath for individual recruits.

### 1.2. Core Gameplay Loop
The gameplay is structured around a continuous campaign loop:

1.  **Pre-Mission Phase:** The player is presented with a mission briefing, objectives, and their available roster. They select a squad of up to 4 raccoons to deploy.
2.  **Mission Phase:** The player controls the deployed squad in a top-down, real-time environment. Control is primarily mouse-driven for movement (right-click) and targeting (left-click). Units auto-acquire and fire on targets but can be given specific commands.
3.  **Post-Mission Phase:** After mission success or failure, a detailed debriefing screen shows statistics, casualties, promotions, and new recruits gained. The campaign then progresses to the next mission or phase.

### 1.3. Key Inspirations
The project's primary inspiration is the classic tactical shooter **"Cannon Fodder"**. This influence is seen in the top-down perspective, squad control, the expendable nature of recruits, and the blend of action with dark humor.

### 1.4. Technical Stack
*   **Language:** JavaScript (ES6+ Class-based)
*   **Platform:** HTML5
*   **Rendering:** 2D Canvas API
*   **Frameworks:** None. This is a pure vanilla JavaScript project.

---

## 2. Current Development Status

The project has a solid, playable core. The main gameplay loop is fully functional.

### 2.1. Architectural Philosophy
The project is built on a **data-driven design**. Core game balance, campaign structure, mission parameters, and even enemy spawn configurations are defined as data in `config.js` and `campaignRules.js`. This allows for rapid iteration, balancing, and content creation without modifying core engine logic. New developers should familiarize themselves with these two files first when making balance adjustments or adding new content variants.

The generation logic has been refactored from `level.js` into a new, dedicated `levelGenerator.js` class. This provides a clean separation of concerns, where `levelGenerator.js` is responsible for creating the level, and `level.js` is responsible for managing its state during gameplay.

### 2.2. Core Systems - Implemented & Stable
*   **Campaign & Mission Generation:**
    *   The campaign structure is procedurally generated from a master seed, governed by `campaignRules.js`.
    *   **Map Shape Variety:** Map generation is now more varied, using independent `worldWidthFactor` and `worldHeightFactor` to create non-uniform map shapes (e.g., long vertical corridors or wide horizontal battlefields).
    *   **Quadrant Spawning:** A new Quadrant Spawning system ensures more even enemy distribution across the map, preventing all enemies from clustering in one area.
    *   **Dynamic Environments:** Destroyed trees now have a configurable chance to fall and spawn a new "fallen log" obstacle, dynamically altering the battlefield's cover and pathing.
    *   The landing zone for players now correctly allows for decorative "filler" obstacles to be placed, making the starting area feel more natural.

*   **Roster & Progression:**
    *   The `Game` class manages a master roster with persistent, named recruits.
    *   Permadeath is functional, with fallen recruits correctly moved to the `fallenRaccoonsGlobal` memorial list.
    *   The XP and rank promotion system is in place.

*   **Unit & Combat Mechanics:**
    *   **Player Units:** `Raccoon` and the distinct `RaccoonHostage` classes are implemented.
    *   **Enemy Units:** `PossumGrunt`, `PossumHeavy`, `PossumBoss1`, and the new **`PossumSniper`** are fully functional. The sniper will find a position, take aim (indicated by a laser sight), and fire a high-damage shot before considering repositioning.
    *   **Unified Logic:** All units share the same core movement, collision, and state machine logic from `unit.js`.

*   **Visual Effects:**
    *   A new suite of visual effects has been added to enhance game feel and player feedback.
    *   **Muzzle Flashes:** All weapon fire now generates a muzzle flash, scaled by weapon power.
    *   **Impact Effects:** Bullets hitting hard surfaces create sparks, while impacts on trees create wood splinters. Unit hits generate a blood splatter effect.
    *   **Explosions:** Grenade and barrel explosions are enhanced with dynamic debris particles.
    *   **Pickups:** Collecting health or grenade pickups now displays a floating icon and text to confirm the action.

*   **Performance & Pathfinding:**
    *   `spatialGrid.js` is used for efficient collision detection and line-of-sight checks.
    *   `ObjectPool.js` manages projectiles to reduce garbage collection overhead.
    *   The A* pathfinding algorithm (`findPath`) and the path smoothing algorithm (`smoothPath`) in `utils.js` are stable. The path smoother now performs a "corridor check" to account for unit width, preventing units from clipping through obstacle corners.

### 2.3. User Interface (UI)
The UI has been significantly overhauled to establish an immersive "command center" aesthetic.
*   **Pre-Mission Screen:** A full-screen layout with detailed mission intel and a visually-driven, vertically scrollable grid for the "Available Recruits" panel.
*   **Post-Mission Screen:** A comprehensive debriefing screen showing detailed stats, objective status, and visual cards for survivors, fallen heroes, and new recruits.
*   **Recruit Memorial:** A dedicated, full-screen "Wall of the Fallen."
*   **Video Loader:** A random video intro now plays to mask level generation time.
*   **Debug Overlays:** Pressing 'P' toggles a master debug view, now showing pathing lines, collision shapes, unit pathing boundaries, spawn zones, and the enemy spawning quadrant grid.

### 2.4. Known Issues & Recent Bug Fixes
*   **Fixed:** Addressed an issue where units could appear to 'speed up' or 'warp' around obstacle corners due to a flaw in collision sliding logic.
*   **Fixed:** Corrected the procedural generation sequence to prevent enemies from spawning inside trees or other obstacles.
*   **Fixed:** Resolved multiple `ReferenceError` bugs related to the new visual effects classes not being loaded in the correct order.
*   **Fixed:** The `PossumBoss1` AI was completely rewritten to correctly execute its attack patterns.
*   **Fixed:** Addressed a critical bug where units (especially Possums) would "stutter-fire" instead of firing continuously.
*   **Fixed:** Addressed multiple layout and display bugs in the Pre-Mission and Post-Mission UI panels.
*   **Fixed:** A bug where guards spawned for mission objectives were not being counted towards the "Exterminate" total has been resolved.
*   **Known Issue:** The automatic "stuck detection" for units can still fail in very complex terrain geometry. The **'U' key** remains implemented as a manual override, forcing all player units to phase through obstacles for a short duration. Further refinement of the "nudge" logic is a standing objective.

---

## 3. Development Roadmap & Next Steps

This roadmap is based on the original Game Design Document (`mission.md`).

### 3.1. Immediate Priorities (Next 1-2 Sprints)
The focus is on expanding content variety and polishing existing systems.
*   **New Mission Objectives:** Implement the "Hold Position" objective, which will require a timer and area-checking logic.
*   **AI & Pathfinding Refinement:** Continue to monitor and improve unit "stuck" recovery and cover-seeking behavior. A key goal is to make the Sniper AI actively seek out and use cover.

### 3.2. Mid-Term Goals (Features for Next Major Version)
These features require more significant system development.
*   **Advanced AI & Cover System:** Enhance enemy AI to intelligently evaluate and use cover. This involves adding logic for units to "peek" from cover to fire.
*   **New Weapons & Pickups:** Introduce new weapon types for player pickup (e.g., Rocket Launcher) and associated ammo management.
*   **The Graveyard:** When the art assets are ready, implement the post-mission "graveyard" sequence where a tombstone is added for each fallen recruit.

### 3.3. Long-Term Vision (Post-MVP Enhancements)
These are ambitious goals to consider once the core single-player experience is complete and polished.
*   **Vehicles & Mounted Guns:** Implement simple vehicles or mounted guns for both factions.
*   **More Biomes & Environmental Hazards:** Introduce new biomes (e.g., Urban Decay) with unique obstacles and interactive hazards.

---

## 4. Onboarding Notes for New Developers

Welcome to the Raccoon Platoon!

### 4.1. Key Files to Review
To get up to speed quickly, please familiarize yourself with the following core files:
1.  **`game.js`:** The heart of the application. It manages the main game loop, state, and orchestrates all other modules.
2.  **`config.js` & `campaignRules.js`:** **Your first stop for tuning and balancing.** These files control almost all game parameters.
3.  **`unit.js`:** The base class for all characters in the game.
4.  **`levelGenerator.js` & `level.js`:** `levelGenerator.js` contains all the logic for creating a level. `level.js` manages the level's state (obstacles, nav grid) during gameplay.
5.  **`ui.js` & `style.css`:** Manages all user-facing screens and HUD elements.
6.  **`effects.js`:** Contains the class definitions for all visual effects (explosions, sparks, etc.).

### 4.2. Development Philosophy
*   **Director-Led:** All new features and major changes are initiated by the Game Director.
*   **Complete Functions:** We avoid providing code with placeholders. Always provide full, complete functions for review.
*   **Code Quality:** Ensure no oversights are made when generating or modifying code. Perform checks to ensure logic is sound and bug-free before presenting for confirmation.