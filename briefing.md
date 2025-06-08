# Raccoon Platoon - Project Status & Overview (Gamma - Full Procedural Campaign & Render Debugging Focus)

## Project Overview

**Game Name:** Raccoon Platoon  
**Concept:** An HTML5 real-time, squad-based, top-down tactical action game inspired by "Cannon Fodder." Players control a squad of raccoon soldiers ("Recruits") through procedurally generated levels, battling enemy possums, and completing mission objectives. (Ref GDD 1.1)

**Core Loop:**  
- Squad control (selection, movement, formation)  
- Tactical combat (direct aiming/firing, special weapons, cover mechanics)  
- Completing diverse mission objectives  
- Managing a persistent roster of recruits with permadeath and an XP/promotion system through a multi-phase campaign

**Current State:** Gamma (Major Refactor & Debugging Phase). Core gameplay loop elements are in place.

### Recent Major Advancements & Current Focus

#### Fully Procedural Campaign & Mission Parameter Generation (NEW & CORE FOCUS)
- `campaignRules.js` restructured to define base parameters with per-phase scaling (e.g., world size, enemy density, heavy chance, objective-specific counts).
- Weighted pools for qualitative elements (biomes, objective types, target types, text components for names and briefings).
- Features (objectives, biomes, target types) unlock based on phase progression (`unlocksPhase` property).
- `Game.js` now dynamically generates the entire campaign structure and individual mission parameters based on `campaignRules.js` and seeded RNGs.
- The old `CAMPAIGN_DATA.js` is now a reference for content ideas only.

#### Seed-Based Procedural Level Generation (Foundation Stable)
- Level layouts (obstacles, enemy/hostage placements, decorations) are generated deterministically based on a mission seed.

#### Hostage Mechanics (Refined)
- Vulnerable, spawn thematically (with groups or at huts with guards), global "Hold/Follow" command (`K`).

#### Player Tactical Commands (Stable)
- "Hold Position" (`H`), "Hold Fire" (`J`) for Raccoons.

#### Combat System (Refined)
- Player bullets don't harm other player units; grenades still do. Bullets damage Possum Huts.

#### Hut Spawning (Refined)
- Trickle effect, initial guards for hostage huts. Mission target huts can now also spawn enemies.

#### Sprite Fallback Logic (NEW in `Unit.js`)
- `Unit.render()` attempts to load specific action sprites, defaults to 'idle' sprites if not found. Currently, only 'idle' sprites are preloaded.

#### Current Major Blocker: Rendering Issue
- Game world (beyond the prerendered background) is not rendering on the main canvas. HUD and UI panels are visible. Debugging is focused on `Game.render()` and the `sortableObjects` pipeline.

---

## Implemented Features (Reflecting New Procedural System)

### 2.1. Core Gameplay Mechanics

- **Squad Control:** Selection, Movement (A* with Min-Heap, path smoothing, collision sliding, LOS checks, stuck detection/phasing), Formations (Horizontal/Vertical, spacing).
- **Tactical Commands:** Hold Position (`H`), Hold Fire (`J`).
- **Combat:** Weapon stats in `config/weapon.js`, Direct Fire (LMB), Manual Target Lock (Shift+LMB), Auto-Targeting. Friendly fire disabled for bullets, grenades have AOE FF. Destructible obstacles. Raccoon Grenades (`G`). LOS & Cover.
- **Enemy Types & AI:** Grunt, Heavy. Alert propagation. Dynamic Hut Spawning.
- **XP & Promotion System:** Implemented.
- **Y-Sorting for Depth:** Implemented in `Game.render()`.

### 2.2. User Interface (UI)

- **Screens:** Main Menu, Pre-Mission, Post-Mission, Game Over, Recruit Memorial, Pause.
- **HUD:** Squad roster (shows Hold Pos/Fire status), controls panel, objective display.

### 2.3. Campaign & Roster (SIGNIFICANTLY REVISED)

- **Fully Procedural Campaign Generation:**  
    - Campaign seed determines total number of phases.
    - Each phase has procedurally generated parameters (name, biome, intro, conclusion, number of missions).
- **Fully Procedural Mission Parameter Generation:**  
    - Each mission's parameters are generated using a mission-specific RNG and rules from `campaignRules.js`.
    - Quantitative and qualitative parameters are scaled and chosen from weighted pools.
- **Permadeath & Recruit Memorial:** New recruits from mission wins/hostage rescue.

### 2.4. Technical Aspects & Rendering

- **Asset Preloading:** Only 'idle' sprites are preloaded.
- **Procedural Level Generation:** Deterministic layouts based on mission seed. Order of operations refined.
- **Dynamic NavGrid. AudioManager. Ambient Effects (Flying Birds).**
- **Rendering Debug Focus:** Step-by-step diagnosis of `Game.render()`.

### 2.5. Save/Load System

- Basic `localStorage` for campaign progress (needs re-verification after procedural refactor).

### 2.6. Hostage Rescue Missions (Refined)

- **Objective Type:** RESCUE_HOSTAGES.
- **RaccoonHostage Unit:** Vulnerable, changes team on rescue, follows player.
- **Hostage Commands (`K`):** Toggles isHoldingPosition for all rescued, alive hostages.
- **Spawning:** Hostages spawn with enemy groups or near designated Possum Huts.
- **Win Condition:** Rescue minimum hostages, defeat initial enemies, escort to Extraction Zone.

### 2.7. Destroy Target Missions (Refined)

- **Objective Type:** DESTROY_TARGET.
- **Targets:** Specific obstacles designated as mission targets.
- **Level Generation:** Places required number of target types.
- **Win Condition:** All designated target obstacles destroyed and all initial enemies defeated.

---

## Current Control Scheme (Summary)

- **LMB Tap/Hold:** Direct Fire
- **Shift + LMB:** Manual Target Lock
- **Ctrl + LMB Drag:** Box Select
- **Right Click:** Move / Cancel Grenade
- **G:** Grenade Aim
- **F:** Formation
- **H:** Hold Position (Raccoons)
- **J:** Hold Fire (Raccoons)
- **K:** Hold/Follow (Hostages)
- **Spacebar:** Select All
- **Esc:** Contextual

---

## Known Issues / Immediate Next Steps

- **Formal Multi-Objective System**
- **River/Stream Generation Algorithm.**
- **Save/Load System Re-verification.**
- **UI/UX Polish:**
- **Advanced Level Generation**
- **Performance Optimization**

---

## Future Considerations

- **Refine Biome-Specific Environment Generation:** Ensure biome influences level generation.
- **Mission Variety.**
- **Advanced AI:** Cover usage, "Suspicious" state refinement.
- Raccoon Special Abilities
- Story Elements
- Difficulty Settings
- Multiplayer
- **Full Unit Animations & More SFX.**

---

This document aims to be a precise snapshot. The immediate priority is fixing the world rendering. After that, testing the fixes for mission end flow will be next.
