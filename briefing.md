Okay, I've updated the `briefing.md` to reflect the recent changes we've discussed and implemented, including the new control scheme and the introduction of hostage rescue mechanics.

Here's the revised `briefing.md`:

--- START OF FILE briefing.md ---
Raccoon Platoon - Project Status & Overview (Late Beta - Core Systems Mature, Content Expansion & Control Refinements Underway)

1.  Project Overview
    Game Name: Raccoon Platoon
    Concept: An HTML5 real-time, squad-based, top-down tactical action game, inspired by "Cannon Fodder." Players control a squad of raccoon soldiers ("Recruits") through procedurally generated levels, battling enemy possums, and completing mission objectives. (Ref GDD 1.1)
    Core Loop: Squad control (selection, movement, formation), tactical combat (direct aiming/firing, special weapons, cover mechanics), completing diverse mission objectives (including Exterminate and Hostage Rescue), and managing a persistent roster of recruits with permadeath and an XP/promotion system through a multi-phase campaign.
    Current State: Late Beta. Core gameplay loop is highly polished and feature-rich. Recent major advancements include:
    *   **Advanced Pathfinding & Movement:** A* with Min-Heap, path smoothing, robust collision sliding, unit phasing, and initial unit-vs-unit local avoidance (simple push/separation). Refined visual facing logic for smoother direction changes.
    *   **Dynamic Enemy AI:** Varied enemy types (Grunt, Heavy, Grenadier, Sniper) with distinct behaviors, alert propagation, "Suspicious" and "Engaging/Chasing" states, dynamic spawning from destructible Possum Huts, and basic cover utilization.
    *   **Campaign & UI:** Multi-phase campaign structure is functional. All UI screens (Main Menu, Pre/Post Mission, Pause, Game Over, Recruit Memorial) are implemented with improved visual feedback and audio cues. Objective display updated for new mission types.
    *   **Visuals & Audio:** Significant sprite integration for Raccoons (idle, walk, fire, death animations) and key Possum units (Grunt, Heavy - alive and dead states). Expanded audio library with distinct weapon/explosion sounds (including grenade explosion SFX), UI feedback, and ambient tracks. Boundary fences now use sprites.
    *   **Environment:** Destructible obstacles with varied collision shapes (rectangles, circles, ellipses), explosive hazards, and multiple biome themes influencing procedural generation. Top/bottom world boundaries can now use configurable obstacle sprites (e.g., long fences).
    *   **Hostage Rescue Mechanic (NEW):** Implemented `RaccoonHostage` units that can be rescued by player Raccoons. Rescued hostages follow player units and, if they survive the mission, are added to the player's roster with a randomly assigned starting rank.
    *   **Revised Control Scheme (NEW):** LMB click/hold for direct firing at cursor (Raccoons continue movement). Shift + LMB click on enemy to set manual target. Ctrl + LMB drag for box selection. Selection primarily via HUD/Spacebar.
    Platform: HTML5 Canvas 2D, Vanilla JavaScript.

2.  Implemented Features

    2.1. Core Gameplay Mechanics

    Squad Control (Ref GDD 2.1):
    *   **Selection:**
        *   Single Raccoon selection via Left-click on HUD card.
        *   Multi-Raccoon selection via Ctrl/Cmd+Left-click on HUD card for additive/subtractive selection.
        *   Multi-Raccoon selection via `Ctrl + LMB Drag` box on map (NEW).
        *   "Select All" deployed Raccoons via Spacebar.
        *   Deselection via 'Esc' key (if not opening pause menu or cancelling grenade aim).
    *   **Movement & Pathfinding:**
        *   Right-click orders selected Raccoons to move (Unit.setMoveTarget()).
        *   **A* Pathfinding:** Units use A* (utils.js -> findPath()) with a Min-Heap optimized open list (minHeap.js), navigating a grid (Level.navGrid) generated from obstacle collision shapes (rectangles, circles, ellipses).
        *   **Path Smoothing:** Raw grid paths are smoothed (utils.js -> smoothPath()) for more natural waypoint sequences, with LOS checks against all blocking obstacle types.
        *   **Movement Execution (Unit._handleMovement()):**
            *   Units follow the smoothed path.
            *   **Collision Sliding:** Enhanced to handle various obstacle shapes.
            *   **LOS Checks to Path Nodes:** Movement along a path segment is aborted if an obstacle newly blocks line of sight to the next waypoint, triggering stuck logic.
            *   **Stuck Detection & Recovery:**
                *   Unit.pathingStuckFrames & Unit.stuckFrames increment.
                *   Unit-specific `onStuck()` methods are called.
                *   **Phasing (Last Resort):** If stuck repeatedly, unit enters temporary "phasing" state.
            *   **Local Unit Avoidance (Basic):** Simple push/separation force.
    *   **Formations:**
        *   Toggle 'HORIZONTAL'/'VERTICAL' via HUD button or 'F' key.
        *   Spacing adjustable via HUD slider.
        *   Units path individually to their calculated formation spot.
    *   **Advanced Commands (Implemented):**
        *   **Hold Position:** Selected units will not auto-engage or move unless explicitly ordered. (Hotkey 'H' - Toggles)
        *   **Hold Fire:** Selected units will not fire their weapons (auto or manual) unless explicitly ordered to attack a target or fire at a point. (Hotkey 'J' - Toggles)

    Combat (Ref GDD 2.2):
    *   **Weapons Implemented:**
        *   Raccoon: MG, Grenades.
        *   Possum: Rifle (Grunt), Heavy MG (Heavy), Grenades (Grenadier), Sniper Rifle (Sniper).
        *   Stats, SFX keys (including grenade explosion), and projectile properties defined in config.js and weapon.js. Attack cooldowns now have a slight random jitter to desynchronize volley fire.
    *   **Targeting & Firing Modes (NEW CONTROL SCHEME):**
        *   **Direct Fire (LMB Tap):** Selected Raccoons fire a single volley towards the mouse cursor. Raccoons do *not* stop existing path-based movement.
        *   **Direct Continuous Fire (LMB Hold):** Selected Raccoons continuously fire towards the mouse cursor. Raccoons do *not* stop existing path-based movement.
        *   **Manual Target Lock-on (Shift + LMB Click on Enemy):** Sets the clicked enemy as `manualTarget`. Selected Raccoons will engage this target according to their weapon logic (e.g., MG Raccoons fire while moving if on a path, or from current position if stationary). They do not automatically pathfind towards this `manualTarget`.
        *   **Auto-Targeting:** Units auto-target nearest enemy in weapon range/LOS. Raccoons use a configurable `RACCOON_AUTO_TARGET_RANGE_FACTOR`. Player Raccoons shoot from current position or while pathing for auto-targets, but do not move towards them unless also pathing due to a move order. Enemies will move to engage auto-targets if their AI dictates.
    *   **Visual Facing vs. Gun Aiming & Sprite Orientation:**
        *   Unit.facingAngle: Body's physical orientation (sprite direction). Refined to prevent flickering to default directions during path recalculations.
        *   Unit.gunAimAngle: Direction the weapon is aimed.
        *   **Raccoon Sprite Orientation:** When actively shooting (any mode except grenade aiming), sprite orients towards `gunAimAngle`. When not shooting, sprite faces movement direction or last idle direction. When aiming grenades, sprite faces mouse.
        *   **Enemy Sprite Orientation:** Generally face movement direction or `gunAimAngle` if stationary and shooting.
    *   **Projectiles (weapon.js, Projectile class):** Bullet physics, accuracy, collision with units and various obstacle shapes.
    *   **Line of Sight (LOS - utils.js):** Ray-obstacle intersection check, considers elliptical and circular collision shapes.
    *   **Health & Damage (unit.js):** Standard HP and damage system. Friendly fire active for explosives.
    *   **Cover System (Basic Implementation):**
        *   Hard Cover: Blocks projectiles.
        *   Soft Cover (Accuracy Penalty): Imposes accuracy penalty on shots passing through.
    *   **Special Weapons:**
        *   **Raccoon Grenades:** 'G' key toggles aiming. LMB click confirms throw. Movement to throw range uses pathfinding if enemy clicked outside range. Fuse, arc, AOE, ammo. Grenade projectile has its own sprite. Cooldown is now grenade-specific, allowing other actions (move/shoot MG) immediately after throwing.
        *   **Possum Grenadier:** AI throws grenades.
    *   **Pickups (Grenade Crates, Health Crates):** Auto-pickup by Raccoons.

    Enemy Types & AI (Ref GDD 2.3):
    *   **Implemented Types:** Grunt, Heavy, Grenadier, Sniper.
    *   **General AI Behavior:** Detection (LOS/sound), alert propagation, states (Idle/Patrolling, Suspicious, Engaging/Chasing, Seeking Cover), pathfinding for engagement.
    *   **Dynamic Spawning from Huts (Level.js, CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING):** Destructible huts spawn Possums based on player proximity and campaign phase.

    Environment Interaction (Ref GDD 2.7 - level.js):
    *   **Destructible Obstacles:** Varied HP, sprites (normal/destroyed), and collision shapes. NavGrid updates dynamically.
    *   **World Boundaries (NEW):** Top and bottom boundaries can now be rendered using tileable sprites of a specified obstacle type (e.g., `fence_barbed_straight_long`) from `config.js`. Side boundaries remain colored rectangles.
    *   **Explosive Barrels.**
    *   **Terrain Effects (Basic):** Mud/Water can slow units.

    XP & Promotion System (Ref GDD 2.8.3):
    *   Raccoons earn XP for hits, kills, mission survival.
    *   Promotions grant rank titles and stat boosts. Visual rank indicators on HUD.

    Y-Sorting for Depth Illusion (game.js): Implemented and refined for all renderable game entities.

    Game Pause & Mission End Logic:
    *   'Esc' key toggles pause menu. `Esc` also deselects units if no other UI is active.
    *   Mission win/loss conditions trigger delay before post-mission screen. Logic now correctly stops player actions like continuous fire upon mission end.

    2.2. User Interface (UI) (Ref GDD Section 3)
    *   **Screens:** Main Menu, Pre-Mission Recruit Select, Post-Mission Debrief, Game Over, Recruit Memorial, Pause Menu.
    *   **In-Game HUD:**
        *   Squad roster with detailed info.
        *   Controls panel (formation, spacing).
        *   Objective display (updated for hostage rescue missions).
        *   Minimap (Basic: shows terrain, player units, last known enemy/objective positions).
    *   **Mouse Cursors:** Context-sensitive. Includes new cursors for "Targeting Mode" (Shift held): a default targeting cursor and a "targetable enemy" hover cursor.
    *   **Notifications & Tooltips (Basic).**

    2.3. Campaign & Roster (Ref GDD 2.8)
    *   **Structure:** Multi-phase campaign (CAMPAIGN_DATA.js).
    *   **Progression:** Difficulty scales.
    *   **Permadeath & Recruit Memorial.**
    *   **New Recruits:** Awarded after successful missions or phases, and from rescuing hostages.
    *   **Game Over:** All recruits lost.

    2.4. Technical Aspects & Rendering
    *   **Asset Preloading:** Comprehensive preloading for obstacles (including border fences), units, projectiles, faces, SFX, music.
    *   **Procedural Level Generation (level.js):** Generates levels, places obstacles (varied shapes), spawns entities, distributes pickups. Includes logic for spawning `RaccoonHostage` units.
    *   **Navigation Grid:** Dynamic updates for destructible obstacles.
    *   **Rendering:** Tiled background, unit sprites (Raccoon: 8-dir idle/walk/fire/death; Possums: 8-dir alive/dead for Grunt/Heavy; Placeholders for Grenadier/Sniper), obstacle sprites.
    *   **Audio Framework (AudioManager.js):** SFX (including grenade explosions), music.
    *   **Ambient Effects (FlyingBird.js).**

    2.5. Save/Load System (Basic Implementation)
    *   Campaign progress (phase/mission, roster status, memorial) saved to `localStorage` post-mission.
    *   "Continue Campaign" option on Main Menu.

    2.6. Hostage Rescue Missions (NEW - GDD 2.5 implied, now more concrete)
    *   **Objective Type:** `RESCUE_HOSTAGES` defined in `campaignData.js`.
    *   **RaccoonHostage Unit (`raccoonHostage.js`):**
        *   Extends `Raccoon` class.
        *   Initially `team: 'neutral'`, no weapon.
        *   Player Raccoons can approach to "rescue" them, changing their team to `'player'`.
        *   Rescued hostages automatically follow the nearest/designated player Raccoon.
        *   Follow logic includes re-pathing thresholds to reduce jittery movement.
        *   If they survive the mission and are rescued, they are added to the main roster with a randomly pre-assigned rank.
    *   **Win Condition:** Typically requires rescuing a minimum number of hostages AND eliminating all initial enemies.

3.  Current Control Scheme (Heavily Revised)
    *   **Left Click (Tap) (No Modifiers):**
        *   Orders selected Raccoons to fire a single volley towards the mouse cursor.
        *   Raccoons do *not* stop current path-based movement.
    *   **Left Click (Hold) (No Modifiers):**
        *   Orders selected Raccoons to continuously fire towards the mouse cursor.
        *   Raccoons do *not* stop current path-based movement.
    *   **Shift + Left Click on Enemy Unit:**
        *   Sets the clicked enemy as `manualTarget` for all selected Raccoons. Raccoons engage this target based on their AI and weapon (e.g., MG users shoot while moving).
    *   **Ctrl + Left Click & Drag:**
        *   Box selection for Raccoons on the map.
    *   **Right Click:**
        *   If aiming grenade: Cancel grenade aim.
        *   Else: Order selected Raccoons to move to the clicked world point (pathfinding used). Clears `manualTarget` if set by Shift+LMB.
    *   **'G' Key:** Toggle grenade aiming mode.
    *   **'F' Key:** Toggle movement formation type.
    *   **'H' Key:** Toggle "Hold Position" for selected units.
    *   **'J' Key:** Toggle "Hold Fire" for selected units.
    *   **Spacebar:** Select all alive deployed Raccoons.
    *   **'Esc' Key:**
        *   If game is `RUNNING` and a grenade is being aimed: Cancel grenade aim.
        *   Else if game is `RUNNING` and units are selected: Deselect all units.
        *   Else if game is `RUNNING`: Toggle Pause Menu.
        *   If game is `PAUSED`: Toggle Pause Menu (Resume).
        *   If in Pre-Mission/Post-Mission/Memorial screen: Returns to previous screen or Main Menu.
    *   **HUD Card Click (Left):** Selects individual Raccoon.
    *   **Ctrl/Cmd + HUD Card Click (Left):** Additive/Subtractive selection.

4.  Known Issues / Immediate Next Steps Discussed
    *   **Full Unit Animations:** Complete sprite sheets for Possum Grenadier & Sniper. More varied idle animations.
    *   **Advanced AI - Cover Usage & Tactical Behaviors (Flanking, Suppression, Retreat).**
    *   **Pathfinding & Movement Refinements:** Terrain Cost, Advanced Local Avoidance.
    *   **Audio Expansion:** More unique sounds, vocalizations, volume controls.
    *   **More Objective Types & Mission Variety:** Expand beyond Exterminate/Rescue with Destroy Specific Target, Hold Area, Escort. These new types will need careful integration with the "always exterminate" implicit rule or a more explicit multi-objective system.
    *   **More Weapon Pickups & Types.**
    *   **UI/UX Polish:** Minimap click-to-pan, detailed tooltips, enemy alert icons.
    *   **Hostage Visuals:** Ensure rescued hostages correctly use standard Raccoon sprites and scaling if not already perfect. Consider distinct visuals for unrescued hostages if desired.

5.  Future Considerations & Suggested Improvements
    *   Performance Optimization for Very Large Number of Units.
    *   Advanced Level Generation (more biome distinction, deliberate choke points, etc.).
    *   **Formal Multi-Objective System:** Explicitly define missions with multiple primary and/or secondary objectives in `campaignData.js` and update `Game.js` and `UI.js` to handle them.
    *   Procedural Mission Objectives based on map seed.
    *   Raccoon Special Abilities/Classes.
    *   Story/Narrative Elements.
    *   Difficulty Settings.
    *   User Settings Persistence.
    *   Multiplayer (Co-op).

This document reflects a game that has undergone significant control scheme changes to favor direct action, while also expanding content with features like hostage rescue. The focus remains on AI, content variety, and polish.
--- END OF FILE briefing.md ---