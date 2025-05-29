--- START OF FILE briefing.md ---
Raccoon Platoon - Project Status & Overview (Late Beta - Core Systems Mature, Content Expansion Underway)

1. Project Overview
Game Name: Raccoon Platoon
Concept: An HTML5 real-time, squad-based, top-down tactical action game, inspired by "Cannon Fodder." Players control a squad of raccoon soldiers ("Recruits") through procedurally generated levels, battling enemy possums, and completing mission objectives. (Ref GDD 1.1)
Core Loop: Squad control (selection, movement, formation, advanced tactical commands), tactical combat (targeting, varied firing modes, special weapons, cover mechanics), completing diverse mission objectives, and managing a persistent roster of recruits with permadeath and an XP/promotion system through a multi-phase campaign.
Current State: Late Beta. Core gameplay loop is highly polished and feature-rich. Recent major advancements include:
    *   **Advanced Pathfinding & Movement:** A* with Min-Heap, path smoothing, robust collision sliding, unit phasing, and initial unit-vs-unit local avoidance (simple push/separation).
    *   **Dynamic Enemy AI:** Varied enemy types (Grunt, Heavy, Grenadier, Sniper) with distinct behaviors, alert propagation, "Suspicious" and "Engaging/Chasing" states, dynamic spawning from destructible Possum Huts, and basic cover utilization.
    *   **Campaign & UI:** Multi-phase campaign structure is fully functional with diverse mission objectives. All UI screens (Main Menu, Pre/Post Mission, Pause, Game Over, Recruit Memorial) are implemented with improved visual feedback and audio cues.
    *   **Visuals & Audio:** Significant sprite integration for Raccoons (idle, walk, fire, death animations) and key Possum units (Grunt, Heavy - alive and dead states). Expanded audio library with distinct weapon sounds, explosions, UI feedback, and ambient tracks.
    *   **Environment:** Destructible obstacles with varied collision shapes (including rectangles, circles, and ellipses), explosive hazards, and multiple biome themes influencing procedural generation.
Platform: HTML5 Canvas 2D, Vanilla JavaScript.

2. Implemented Features

2.1. Core Gameplay Mechanics

Squad Control (Ref GDD 2.1):
*   **Selection:**
    *   Single Raccoon selection via left-click on unit (map/HUD).
    *   Multi-Raccoon selection via click-and-drag box (map).
    *   Ctrl/Cmd+Left-click on HUD card for additive/subtractive selection.
    *   "Select All" deployed Raccoons via Spacebar.
    *   Deselection via 'Esc' key (if not opening pause menu) or Left-Click on empty ground.
*   **Movement & Pathfinding:**
    *   Right-click orders selected Raccoons to move (Unit.setMoveTarget()).
    *   **A* Pathfinding:** Units use A* (utils.js -> findPath()) with a Min-Heap optimized open list (minHeap.js), navigating a grid (Level.navGrid) generated from obstacle collision shapes (rectangles, circles, ellipses).
    *   **Path Smoothing:** Raw grid paths are smoothed (utils.js -> smoothPath()) for more natural waypoint sequences, with LOS checks against all blocking obstacle types.
    *   **Movement Execution (Unit._handleMovement()):**
        *   Units follow the smoothed path.
        *   **Collision Sliding:** Enhanced to handle various obstacle shapes. If an imminent collision is detected, the unit attempts to "slide" along the obstacle by trying X-only or Y-only movement. Logic prefers slides aligning with the path to reduce jitter.
        *   **LOS Checks to Path Nodes:** Movement along a path segment is aborted if an obstacle newly blocks line of sight to the next waypoint, triggering stuck logic.
        *   **Stuck Detection & Recovery:**
            *   Unit.pathingStuckFrames & Unit.stuckFrames increment based on lack of progress.
            *   Unit-specific onStuck() methods are called. For Raccoons, this might involve a short re-path attempt. For Possums, more complex fallback behaviors (e.g., return to guard post, find new patrol point).
            *   **Phasing (Last Resort):** If a unit gets stuck repeatedly (MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL + buffer), it enters a temporary "phasing" state (this.isPhasing), becoming semi-transparent and able to move through obstacles for a short duration (CONFIG.UNIT_VISUALS.UNIT_PHASING_DURATION) to escape. It then attempts to re-path.
        *   **Local Unit Avoidance (Basic):** A simple push/separation force is applied if units get too close, reducing clumping, especially in formations. More advanced steering is a future consideration.
*   **Formations:**
    *   Toggle 'HORIZONTAL'/'VERTICAL' via HUD button or 'F' key.
    *   Spacing adjustable via HUD slider, affecting the distance between formation slots.
    *   Units path individually to their calculated formation spot.
*   **Advanced Commands (Implemented):**
    *   **Hold Position:** Selected units will not auto-engage or move from their current spot unless explicitly ordered. (Hotkey 'H' - Toggles)
    *   **Hold Fire:** Selected units will not fire their weapons (auto or manual) unless explicitly ordered to attack a target or fire at a point. (Hotkey 'J' - Toggles)

Combat (Ref GDD 2.2):
*   **Weapons Implemented:**
    *   Raccoon: MG, Grenades.
    *   Possum: Rifle (Grunt), Heavy MG (Heavy), Grenades (Grenadier), Sniper Rifle (Sniper).
    *   Stats, SFX keys, and projectile properties (including sprites for grenades) defined in config.js and weapon.js.
*   **Targeting & Firing Modes:**
    *   **Manual Target Lock-on:** Left-click an enemy sets it as manualTarget. Selected Raccoons engage, continuing current movement path if applicable (for Raccoon MG).
    *   **Fire at Point (Single Volley):** Shift + Quick Left Click (Tap) orders a shot at the cursor. Does not stop Raccoon movement or change their primary manualTarget.
    *   **Continuous Fire at Point/Target:** Shift + Hold Left Mouse Button for continuous fire. Raccoons will stop path-based movement to engage.
    *   **Auto-Targeting:** Units auto-target nearest enemy in weapon range/LOS. Raccoons use a configurable RACCOON_AUTO_TARGET_RANGE_FACTOR. Player Raccoons shoot from current position or while pathing, but do not move towards auto-targets. Enemies will move to engage auto-targets if their AI dictates.
*   **Visual Facing vs. Gun Aiming & Sprite Orientation:**
    *   Unit.facingAngle: Represents the body's physical orientation (sprite direction).
    *   Unit.gunAimAngle: Direction the weapon is aimed.
    *   **Raccoon Sprite Orientation:** When actively shooting (any mode except grenade aiming), sprite orients towards gunAimAngle, allowing visual kiting. When not shooting, sprite faces movement direction or last idle direction. When aiming grenades, sprite faces mouse.
    *   **Enemy Sprite Orientation:** Generally face movement direction or gunAimAngle if stationary and shooting. Snipers may have specific aiming animations.
*   **Projectiles (weapon.js, Projectile class):** Bullet physics, accuracy based on movement and weapon stats, collision with units and various obstacle shapes (rect, circle, ellipse).
*   **Line of Sight (LOS - utils.js):** Ray-obstacle intersection check, now accurately considers elliptical and circular collision shapes.
*   **Health & Damage (unit.js):** Standard HP and damage system. Friendly fire is active for explosives.
*   **Cover System (Basic Implementation - Ref GDD 2.2.4):**
    *   Obstacles marked with `providesCover: true` can affect combat.
    *   **Hard Cover:** Obstacles that `blockMovement: true` and `providesCover: true` (e.g., rocks, walls) fully block projectiles if the projectile's path intersects their collision shape.
    *   **Soft Cover (Accuracy Penalty):** Obstacles with `providesCover: true` but `blockMovement: false` (e.g., dense bushes) can impose an accuracy penalty on shots passing through them (configurable, e.g., -20% accuracy). This is checked during projectile update if it passes through such an obstacle's area before hitting a target.
    *   Units (AI and Player if ordered) do not yet actively "snap" to cover but benefit if positioned behind it. AI has basic logic to prefer pathing near cover when engaging.
*   **Special Weapons:**
    *   **Raccoon Grenades:** 'G' key toggles aiming. Movement to throw range uses pathfinding. Fuse, arc, AOE, ammo as per GDD. Grenade projectile has its own sprite.
    *   **Possum Grenadier:** AI throws grenades at player clusters or static positions.
*   **Pickups (Grenade Crates, Health Crates):** Auto-pickup by Raccoons. Health crates restore a fixed amount of HP.

Enemy Types & AI (Ref GDD 2.3):
*   **Implemented Types:**
    *   **Possum Grunt (possum.js):** Standard rifle, patrol/guard behavior, basic cover preference.
    *   **Possum Heavy (possumHeavy.js):** Heavy MG, slower, prefers stationary fire from guard posts, higher HP.
    *   **Possum Grenadier (possumGrenadier.js - NEW FILE/CLASS):** Throws grenades, tries to keep distance, may have a weak pistol. AI prioritizes groups.
    *   **Possum Sniper (possumSniper.js - NEW FILE/CLASS):** Long-range, high damage, slow RoF. AI seeks concealed positions, remains stationary to aim/fire, relocates after firing or if compromised. May have a brief laser sight telegraph.
*   **General AI Behavior:**
    *   **Detection:** LOS and sound (gunfire, explosions).
    *   **Alert Propagation:** Alerts spread to nearby enemies.
    *   **States:** "Idle/Patrolling", "Suspicious" (investigates disturbances using pathfinding), "Engaging/Chasing" (uses pathfinding to approach/engage targets), "Seeking Cover" (basic attempt to move near cover if under fire and exposed).
    *   **Pathfinding for Engagement:** All enemy movement (patrol, chase, investigate, seek cover) uses the A* pathfinding system.
*   **Dynamic Spawning from Huts (Level.js, CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING):**
    *   Possum Huts are destructible and act as spawners.
    *   Configurable number of huts become active based on player proximity and campaign phase.
    *   Active huts spawn groups of Possums (configurable types and sizes, potentially increasing with phase/difficulty) after an initial delay and then on a cooldown.
    *   Newly spawned units briefly "phase" to exit the hut cleanly.
    *   Destroying a hut stops its spawning and might be a mission objective.

Environment Interaction (Ref GDD 2.7 - level.js):
*   **Destructible Obstacles:** Defined in CONFIG with HP, sprites (normal and destroyed, including scaled stumps for trees), and varied collision shapes (rectangle, circle, ellipse). NavGrid updates dynamically when `blocksMovement` obstacles are destroyed.
*   **Explosive Barrels (Single and Cluster):** AOE damage to units and other obstacles. Cluster barrels have distinct properties.
*   **Terrain Effects (Basic):** Mud/Water areas can be defined in level generation parameters to slow unit movement (visuals are tiled, effect is a speed multiplier). Pathfinding does not yet consider terrain cost, but units are slowed when moving through these zones.

XP & Promotion System (Ref GDD 2.8.3):
*   Raccoons earn XP for hits, kills, and mission survival.
*   Promotions grant rank titles and minor stat boosts (HP, accuracy), and bonus starting grenades as defined in CONFIG.
*   Visual indicators for rank on HUD cards (e.g., chevrons).

Y-Sorting for Depth Illusion (game.js): Implemented and refined for all renderable game entities (units, obstacles).

Game Pause & Mission End Logic:
*   'Esc' key toggles a pause menu (PAUSED game state) with Resume, Restart Mission, Main Menu options.
*   Mission win/loss conditions trigger a brief delay (MISSION_END_DELAY_SECONDS) with an overlay message before showing the full post-mission screen.

2.2. User Interface (UI) (Ref GDD Section 3)
*   **Screens:** Main Menu, Pre-Mission Recruit Select, Post-Mission Debrief, Game Over, Recruit Memorial, Pause Menu. All screens are functional with improved layouts and information display. Text strings are sourced from CONFIG.UI_TEXT_STRINGS.
*   **In-Game HUD:**
    *   Squad roster with detailed info (HP, status, rank, special weapon ammo).
    *   Controls panel (formation toggle, spacing slider, hold position/fire indicators).
    *   Objective display.
    *   **Minimap (NEW):** Basic minimap showing explored terrain, player units, and last known enemy positions/objectives. (Not clickable for camera panning yet).
*   **Mouse Cursors:** Context-sensitive (default, attack, move, grenade aim).
*   **Notifications:** On-screen pop-ups for key events (recruit down, objective complete, low ammo).
*   **Tooltips (Basic):** Hovering over some HUD elements (e.g., formation button) shows a brief explanation.

2.3. Campaign & Roster (Ref GDD 2.8)
*   **Structure:** Multi-phase campaign (CAMPAIGN_DATA.js) with sequential missions. Each phase has intro/outro text.
*   **Progression:** Players advance through missions and phases. Difficulty scales via enemy types, density, and objective complexity (controlled by missionParams in CAMPAIGN_DATA).
*   **Permadeath:** Fallen raccoons are recorded in the Recruit Memorial.
*   **New Recruits:** Awarded after successful missions or phases.
*   **Game Over:** Occurs if all recruits in the roster are lost.

2.4. Technical Aspects & Rendering
*   **Asset Preloading:** Comprehensive preloading for obstacle sprites (normal, destroyed, including specific stump variations), unit sprites (Raccoon: idle, walk, fire, death; Possums: alive, dead for Grunt/Heavy; placeholders for Grenadier/Sniper walk/fire), unit faces, bird tilesheet, grenade projectile sprite, and all audio assets.
*   **Procedural Level Generation (level.js):**
    *   Generates levels based on biome themes (Forest, Swamp, Junkyard hints from GDD, currently one primary "tropical forest" theme fully fleshed out).
    *   Places obstacles with varied collision shapes (rect, circle, ellipse).
    *   Spawns initial enemies and player squad.
    *   Distributes pickups (grenades, health).
*   **Navigation Grid:** Generated at level start based on CONFIG.GRID_CELL_SIZE and obstacle collision shapes. Dynamically updates when obstacles are destroyed/created.
*   **Rendering:**
    *   **Ground Texture:** Prerendered tiled background for performance.
    *   **Unit Sprites:**
        *   Raccoons: Full 8-directional sprite sets for idle, walk, and fire states. Death animation sequence.
        *   Possum Grunt & Heavy: 8-directional sprites for alive states (idle, walk, fire). Specific dead sprites.
        *   Possum Grenadier & Sniper: Placeholder sprites (colored circles or basic static sprite) pending full animation sets. Specific dead sprites configured.
        *   All sprites are scaled via `spriteScaleFactor` (for units) or `spriteScale` (for obstacles) in CONFIG.
    *   **Obstacle Sprites:** Normal and destroyed states, with `spriteDestroyedScale` for specific sizing of destroyed versions (e.g., tree stumps).
*   **Audio Framework (AudioManager.js):**
    *   Loads and plays sound effects and looping music defined in CONFIG.AUDIO_ASSETS.
    *   Supports polyphony for SFX.
    *   Distinct gunshot sounds for all implemented weapons. Explosion, death, UI click/hover sounds.
    *   Ambient music tracks for different game states/themes (e.g., menu, in-mission).
*   **Ambient Effects (FlyingBird.js):** Birds fly across screen using sprite sheet animation.

2.5. Save/Load System (NEW - Basic Implementation)
*   **Functionality:** Campaign progress (current phase/mission, master roster status including XP/rank/KIA, fallen memorial list) is automatically saved to `localStorage` after each mission completion (win or loss resulting in return to pre-mission screen).
*   **Loading:** On game start, if a saved campaign exists in `localStorage`, a "Continue Campaign" button appears on the Main Menu (replacing/supplementing "New Campaign"). Clicking it loads the saved state.
*   **Data Integrity:** Basic checks; if saved data is malformed, it offers to start a new campaign.
*   **Limitations:** Does not save in-mission progress.

3. Current Control Scheme (Refined)
*   **Left Click (No Modifiers):**
    *   On Enemy Unit: Set as manualTarget. Raccoon continues current movement.
    *   On Friendly Raccoon (map/HUD): Selects unit. Ctrl/Cmd+Click on HUD for multi-select.
    *   On Empty Ground: Deselects all.
*   **Shift + Quick Left Click (Tap):** `fireAtPoint()` single volley at cursor. Does NOT stop Raccoon movement or change existing manualTarget.
*   **Shift + Hold Left Mouse Button:** Continuous fire at mouse cursor. Raccoons stop path-based movement to engage.
*   **Left Click & Drag (No Modifiers):** Box selection.
*   **Right Click:**
    *   If aiming grenade: Cancel grenade aim.
    *   Else: Order selected Raccoons to move to the clicked world point (pathfinding used). Does not clear existing Raccoon manualTarget.
*   **'G' Key:** Toggle grenade aiming mode.
*   **'F' Key:** Toggle movement formation type.
*   **'H' Key:** Toggle "Hold Position" for selected units.
*   **'J' Key:** Toggle "Hold Fire" for selected units.
*   **Spacebar:** Select all alive deployed Raccoons.
*   **'Esc' Key:**
    *   If game is RUNNING or PAUSED: Toggles the Pause Menu.
    *   If in Pre-Mission/Post-Mission/Memorial screen: Returns to previous screen or Main Menu.
    *   If no other UI is active: Deselects all units.

4. Known Issues / Immediate Next Steps Discussed
*   **Full Unit Animations:** Complete sprite sheets for Possum Grenadier & Sniper (walk, fire, death). Add more varied idle animations for all units.
*   **Advanced AI - Cover Usage:** Implement more sophisticated AI logic for enemies to actively pathfind to, utilize, and "peek" from hard cover positions.
*   **Advanced AI - Tactical Behaviors:**
    *   Flanking maneuvers for certain enemy types.
    *   Suppressive fire behaviors (e.g., Heavy Possums pinning down player units).
    *   Retreat logic when overwhelmed or low health for some enemy types.
*   **Pathfinding & Movement Refinements:**
    *   **Terrain Cost:** Integrate different terrain type costs (e.g., mud, shallow water) into A* pathfinding heuristic so units prefer easier terrain.
    *   **Advanced Local Avoidance:** Improve unit-vs-unit steering beyond simple push/separation to prevent overlap during complex maneuvers or in tight spaces.
*   **Audio Expansion:**
    *   More unique death sounds for different units/weapon types.
    *   Unit-specific vocalizations (acknowledgments, alerts, pain).
    *   More varied ambient environmental loops for different biomes/map areas.
    *   Implement volume controls in Options/Pause Menu and persist settings.
*   **More Objective Types & Mission Variety:** Expand beyond "EXTERMINATE" with Rescue, Destroy Specific Target, Hold Area, Escort.
*   **More Weapon Pickups & Types:** Introduce player-usable Rocket Launcher, potentially other special weapons.
*   **UI/UX Polish:**
    *   Minimap click-to-pan camera.
    *   More detailed tooltips for recruits in selection screen (showing full stats).
    *   Clearer visual feedback for enemy alert states (e.g., icons above head).

5. Future Considerations & Suggested Improvements
*   **Performance Optimization for Very Large Number of Units:**
    *   If encountering issues with >50-100 units, profile update/render loops.
    *   Consider spatial partitioning (e.g., quadtrees) for collision detection and target acquisition if bottlenecks appear.
*   **Advanced Level Generation:**
    *   More distinct biome generation with unique obstacle sets, visual themes, and specific terrain features (e.g., traversable shallow water vs. impassable deep water).
    *   More deliberate generation of chokepoints, open fields, and ambush alleys based on mission type or difficulty.
    *   Variable terrain height affecting LOS and movement (complex).
*   **Advanced Enemy AI Tactics:**
    *   Coordinated group attacks (e.g., one group suppresses while another flanks).
    *   Use of smoke grenades or other tactical equipment by enemies.
*   **Raccoon Special Abilities/Classes (Post-MVP):** Distinct recruit types (Medic, Heavy Gunner, Engineer) with unique passive/active skills unlocked via promotion or found as special training.
*   **Story/Narrative Elements:** More flavor text, short intro/outro cutscenes (static images with text), or brief character interactions between missions.
*   **Difficulty Settings:** Introduce explicit difficulty settings affecting enemy count, types, AI aggressiveness, resource availability, and possibly permadeath rules (e.g., an easier mode where recruits are only "wounded" and unavailable for one mission).
*   **User Settings Persistence:** Store volume, graphics preferences (if any), and control keybinds (if remapping is added) in `localStorage`.
*   **Multiplayer (Co-op):** Ambitious, but a consideration for long-term.

This document reflects a game that has matured significantly, with robust core systems and a solid foundation of content. The focus is shifting towards deeper AI, content variety (missions, enemies, items), and overall polish to prepare for a wider release.
--- END OF FILE briefing.md ---