I would like to create a game. This is the mission doc:
```Raccoon Platoon - Game Specifications
1. Game Overview
1.1. Concept:
Raccoon Platoon is an HTML5 real-time, squad-based, top-down tactical action game, heavily inspired by the classic "Cannon Fodder". Players control a small squad of raccoon soldiers ("Recruits") navigating procedurally generated levels, battling enemy possums, and completing various mission objectives. The game emphasizes quick tactical decisions, squad management, and a touch of dark humor as recruits are expendable.
1.2. Core Mechanics:
Top-down perspective.
Direct mouse control for squad movement and targeting.
Squad-based gameplay: players control a group of up to 4 raccoons.
Procedurally generated levels for high replayability.
Destructible environment elements.
Permadeath for individual raccoon recruits.
Mission-based progression.
1.3. Theme:
Protagonists: Raccoons (The "Platoon")
Antagonists: Possums (The "Opposition")
Setting: Varied natural and semi-urban environments (forests, swamps, backyards, junkyards).
Tone: Action-packed with a layer of dark comedy, reflecting the expendable nature of the recruits.
2. Gameplay Mechanics
2.1. Squad Control & Formation
Selection:
Clicking on a single raccoon selects that individual.
Click-and-drag to select multiple raccoons.
A "Select All" button/key (e.g., Spacebar) will be available.
Movement:
Right-clicking on terrain orders selected raccoons to move to that point.
Raccoons will attempt to move in a loose formation, pathfinding around obstacles.
If a single raccoon is selected, only that raccoon moves.
If multiple raccoons are selected, they move as a group, maintaining relative positions where possible.
Raccoons will automatically engage enemies they encounter while moving (unless explicitly told to hold fire, if that feature is implemented).
Splitting Squads (Advanced - consider for later):
Ability to assign selected raccoons into sub-groups (e.g., Group 1, Group 2) using keyboard shortcuts (Ctrl+1, Ctrl+2). Selecting '1' or '2' would then select that group. This is similar to Cannon Fodder's "Jools" and "Jops" split.
2.2. Combat
This section details the mechanics of combat, including weapon properties, damage, and targeting.
2.2.1. General Combat Principles:
Real-time Action: Combat unfolds in real-time.
Direct Control Emphasis: Player skill in aiming (for special weapons) and positioning is key.
Lethality: Combat should feel dangerous; both raccoons and possums can be dispatched relatively quickly.
Cover Importance: Using cover effectively significantly improves survivability. Units behind hard cover may be harder or impossible to hit from certain angles. Soft cover might offer a chance to evade shots.
2.2.2. Targeting & Firing:
Automatic Targeting (Default Weapon):
When idle or moving without a specific attack order, selected raccoons with their standard machine gun will automatically target and fire upon the nearest visible enemy within their weapon's range and line of sight.
Prioritization: Could be nearest enemy, or enemy currently attacking the squad. (To be refined during prototyping).
Manual Targeting (Default Weapon):
Left-clicking on an enemy possum orders all selected, armed raccoons to focus fire on that specific target.
A visual indicator (e.g., a specific reticle over the targeted enemy) will confirm the manual target.
Special Weapon Targeting:
Grenades: After selecting the grenade, a targeting cursor appears. Left-clicking on the ground designates the impact point. A visual arc/indicator shows the throw path and estimated AOE.
Rocket Launcher: After selecting the rocket launcher, a targeting cursor appears. Left-clicking on an enemy or a point on the ground fires the rocket in that direction. Rockets fly straight.
Line of Sight (LOS):
Calculated from the center of the firing unit to the center of the target unit.
Obstacles (trees, rocks, buildings, other units – including friendlies if not careful) can block LOS.
Some "soft" cover (bushes) might not fully block LOS but could impose an accuracy penalty.
Weapon Range:
Each weapon has a maximum effective range. Targets outside this range cannot be hit or, for some weapons, even targeted.
Visual feedback for range (e.g., targeting reticle changes color if target is out of range) is desirable.
2.2.3. Weapon Specifications:
A. Raccoon Standard Issue Machine Gun:
Damage per bullet: Low (e.g., 5-8 HP)
Rate of Fire (ROF): High (e.g., 5-7 bullets per second)
Range: Medium (e.g., 150-200 game units/pixels)
Projectile Speed: Very Fast (appears almost instant, hitscan or very fast projectile)
Accuracy: Moderate. Spread increases slightly with sustained fire or if the raccoon is moving.
Ammo: Unlimited.
Notes: The workhorse weapon. Effective against unarmored targets, less so against groups or heavy armor without focused fire.
B. Raccoon Grenade (Pickup):
Damage: High (e.g., 40-60 HP at epicenter)
Area of Effect (AOE): Medium radius (e.g., 30-50 game units/pixels). Damage decreases from epicenter to edge.
Range (Throw): Medium (player skill dependent, based on click distance from thrower, within a max limit)
Fuse Time: Short (e.g., 2-3 seconds after landing or direct hit).
Projectile Speed: Medium (visible arc).
Ammo: Limited (e.g., 1-3 per pickup).
Notes: Effective against groups, entrenched enemies, and light structures. High risk of friendly fire. Can be thrown over some low obstacles.
C. Raccoon Rocket Launcher (Pickup):
Damage: Very High (e.g., 70-100 HP direct hit, plus smaller AOE splash)
Area of Effect (Splash): Small radius around impact (e.g., 15-25 game units/pixels).
Range (Shot): Long (e.g., 250-350 game units/pixels)
Projectile Speed: Fast (straight line).
Ammo: Limited (e.g., 1-2 per pickup).
Notes: Primarily for destroying structures, vehicles (if implemented), or heavily armored targets. Can also clear groups. Friendly fire risk.
D. Possum Basic Rifle (Grunt Possum):
Damage per bullet: Moderate (e.g., 8-12 HP)
Rate of Fire (ROF): Medium (e.g., 2-3 bullets per second)
Range: Medium (e.g., 160-220 game units/pixels)
Projectile Speed: Fast.
Accuracy: Moderate.
Ammo: Unlimited for AI.
E. Possum Heavy Weapon (Heavy Possum):
Damage per bullet: High (e.g., 15-25 HP)
Rate of Fire (ROF): Low (e.g., 1 bullet per 1-1.5 seconds)
Range: Medium-Long (e.g., 180-280 game units/pixels)
Projectile Speed: Medium.
Accuracy: Good.
Ammo: Unlimited for AI.
Notes: May cause knockback or stun on hit (TBD).
F. Possum Grenade (Grenadier Possum):
Damage: Medium-High (e.g., 30-50 HP at epicenter)
Area of Effect (AOE): Medium radius (e.g., 25-45 game units/pixels).
Range (Throw): Programmed AI throw range.
Fuse Time: Short (e.g., 2.5-3.5 seconds after landing).
Ammo: Limited per Grenadier unit (e.g., 2-3 grenades), or cooldown-based.
Notes: AI will attempt to throw at groups of raccoons or those in cover.
2.2.4. Damage Calculation & Effects:
Base Damage: Determined by weapon type.
Hit Detection:
For bullets: Raycasting or fast projectile collision with unit hitboxes.
For explosives: Circular AOE check from impact point.
Cover Effects:
Hard Cover (Rocks, Walls): Blocks shots completely if the target is fully obscured. If partially obscured (e.g., peeking), may still be hittable.
Soft Cover (Bushes, Tall Grass): May provide a chance to "evade" a shot (e.g., 25% chance the shot misses even if aimed correctly) or reduce incoming damage by a small percentage (e.g., 10-15% reduction).
No Critical Hits/Random Modifiers (Initially): To keep combat predictable and skill-based, avoid random damage multipliers initially. Focus on positioning and weapon choice.
Friendly Fire:
Raccoon weapons (especially explosives) can damage/kill other raccoons.
Possum explosives can damage/kill other possums.
Bullets will not pass through friendly units unless a specific "piercing" mechanic is introduced later (unlikely for MVP).
2.2.5. Health & Death:
Raccoon Recruits: Low HP (e.g., 25-35 HP). Designed to be fragile.
Possum Units: Varied HP based on type (see Section 2.3).
Death: When HP reaches 0, unit performs a death animation and is removed from play.
No Health Regeneration: During a mission, HP is not naturally regained. First Aid Kits are the only way for raccoons to heal.
2.2.6. Reloading (Simplified):
For player-controlled raccoons, the Machine Gun will not require manual reloading to maintain game flow. Rate of fire simulates reload pauses if needed.
Special weapons (Grenades, Rockets) are single-use per "equipped" item from ammo pool. Selecting the weapon again if ammo is available effectively "reloads" the next one.
2.3. Enemy Possums
This section details the different types of possum adversaries, their stats, and AI behaviors.
2.3.1. General Possum AI Traits:
Perception: Possums detect raccoons via Line of Sight (LOS) and sound (e.g., gunfire, explosions).
Aggression Levels: Varies by type; some are more prone to charge, others to hang back.
Squad Cohesion (Basic): Possums in a group may react to threats targeting other members of their group.
Self-Preservation (Limited): May attempt to move out of grenade AOEs or reposition if taking heavy fire without cover.
2.3.2. Possum Types & Specifics:
A. Grunt Possum:
Appearance: Basic, scruffy possum with a simple rifle.
Health Points (HP): Low-Medium (e.g., 30-40 HP)
Movement Speed: Medium.
Primary Weapon: Possum Basic Rifle (see 2.2.3.D).
Detection Range: Medium (e.g., 180-240 game units/pixels).
Engagement Range: Prefers medium range, will advance if raccoons are further.
AI Behaviors & Tactics:
The most common enemy type.
Patrols in small groups (1-3) or stands guard at fixed points.
Upon detecting raccoons, will open fire and may slowly advance.
Basic cover usage: If fired upon and near cover, might move to it.
Less likely to use advanced tactics; relies on numbers.
B. Heavy Possum:
Appearance: Larger, bulkier possum, possibly with some makeshift armor, carrying a heavier weapon.
Health Points (HP): High (e.g., 60-80 HP)
Movement Speed: Slow.
Primary Weapon: Possum Heavy Weapon (see 2.2.3.E).
Detection Range: Medium (similar to Grunt).
Engagement Range: Prefers medium to long-medium range to utilize its weapon's power.
AI Behaviors & Tactics:
Acts as a slow-moving firebase.
Often found guarding important locations or as part of a stronger patrol.
Less likely to advance aggressively; prefers to find a good firing position and lay down suppressive fire.
Higher resistance to knockback/stun if implemented.
Priority target due to its high damage output.
C. Grenadier Possum:
Appearance: Possum with a satchel or bandolier of makeshift grenades. May carry a basic pistol for self-defense if raccoons get too close (very short range, low damage).
Health Points (HP): Medium (e.g., 40-50 HP)
Movement Speed: Medium.
Primary Weapon: Possum Grenade (see 2.2.3.F).
Secondary Weapon (Optional): Basic Pistol (short range, low damage, last resort).
Detection Range: Medium-Long (may spot clumped raccoons from further).
Engagement Range (Grenade): Attempts to stay at a safe distance to lob grenades.
AI Behaviors & Tactics:
Stays behind front-line Grunts if possible.
Prioritizes throwing grenades at:
Clustered groups of 2+ raccoons.
Raccoons in stationary cover.
Raccoons near explosive environmental objects.
After throwing a grenade, may reposition.
Has a cooldown between grenade throws or limited ammo per unit.
If approached, will try to flee or use its pistol as a last resort.
D. Sniper Possum (Optional - for later phases/higher difficulty):
Appearance: Leaner possum, perhaps with a makeshift ghillie suit or camouflage, long rifle.
Health Points (HP): Low (e.g., 25-30 HP – relies on not being seen).
Movement Speed: Slow (when aiming/hidden), Medium (when relocating).
Primary Weapon: Possum Sniper Rifle (Very high damage, very slow ROF, very long range, requires setup/stationary to fire accurately).
Detection Range: Very Long (visual only).
Engagement Range: Long to Very Long.
AI Behaviors & Tactics:
Attempts to find concealed, elevated positions with long sightlines.
Remains stationary for long periods while scanning for targets.
Prioritizes single, high-damage shots on individual raccoons.
After firing (or if position is compromised), will attempt to relocate to a new hidden spot.
May have a visible laser sight briefly before firing as a warning/difficulty tuner.
Difficult to spot; may only become visible briefly when firing or if raccoons get very close.
E. Vehicle/Mounted Possums (Optional - for later phases):
Concept: A possum operating a stationary mounted gun or a slow-moving makeshift vehicle (e.g., rusty cart with a machine gun).
Stats: Would have separate HP for the vehicle/emplacement and the possum operator. Destroying the vehicle/emplacement might disable the weapon or kill the operator.
Weaponry: Could range from rapid-fire machine guns to slow, powerful cannons.
AI: Largely stationary or follows a simple path, provides heavy firepower over a designated area.
2.3.3. General AI Behavior Enhancements:
Patrol Patterns:
Simple: Back-and-forth along a defined line.
Circular: Around a key area or object.
Point Guard: Stationary, scanning a specific arc.
Zone Patrol: Roaming within a larger defined area.
Patrol paths will be influenced by the procedurally generated map layout.
Alert System & Propagation:
Triggers: Gunfire (player or AI), explosions, seeing a dead friendly possum, direct LOS on a raccoon.
States:
Unaware: Normal patrol/idle behavior.
Suspicious: Heard a sound, moves to investigate the source. Increased alertness.
Alerted/Engaged: Direct contact with raccoons, actively fighting.
Propagation: When a possum becomes Alerted, nearby possums within a certain radius (e.g., "shouting distance") also become Alerted or at least Suspicious and may move to support.
Cover Usage Logic:
When under fire and not in cover, possums (especially Grunts and Grenadiers) will assess nearby terrain for valid cover points.
Preference for hard cover over soft cover.
May "peek" from cover to shoot, then duck back.
Will abandon cover if it's destroyed or if a grenade forces them out.
Morale System (Optional, for added depth):
Triggers for Morale Check: Taking heavy casualties quickly, witnessing a powerful explosion (e.g., rocket launcher), being the last survivor of a squad.
Effects of Low Morale:
Flee: Attempt to run away from the threat (towards map edge or designated "safe" area).
Suppressed: Reduced accuracy, slower ROF, more likely to stay in cover without returning fire.
Surrender (Highly Unlikely/Comedic): Could be a rare, funny animation.
Heavy Possums might be immune to morale effects or have a very high threshold.
2.4. Procedural Level Generation
This section details the approach to generating varied and engaging levels for Raccoon Platoon. The goal is to ensure high replayability while maintaining a sense of tactical depth and fairness.
2.4.1. Core Generation Philosophy:
Tactical Variety: Levels should offer a mix of open areas, chokepoints, cover opportunities, and sightline blockers.
Thematic Consistency: Generated elements should align with the current biome (forest, swamp, junkyard, etc.).
Player Agency: While procedurally generated, levels should feel like they can be "solved" through smart tactics, not just luck.
Controlled Randomness: Parameters will guide the generation to prevent overly chaotic or impossible layouts.
Flow and Pacing: Levels should guide the player naturally towards objectives without feeling strictly linear, allowing for exploration and flanking.
2.4.2. Biome-Specific Generation Strategies:
A layered approach will likely be used, combining different algorithms for base terrain, feature placement, and pathing.
A. Forests:
Base Terrain: Perlin noise or similar for gentle elevation changes and clearings.
Features:
Dense tree clusters (LOS blockers, impassable or slow movement). Algorithm: Poisson disc sampling for natural-looking distribution, or rule-based placement.
Scattered individual trees and rocks (cover).
Dirt paths or game trails (subtly guiding player, faster movement). Algorithm: Random walks or L-systems.
Small streams or ponds (obstacles, slow movement).
Feel: Mix of claustrophobic wooded areas and more open clearings.
B. Swamps:
Base Terrain: Predominantly flat with many water/mud patches. Algorithm: Cellular automata or noise-based thresholding to create land/water zones.
Features:
Shallow water (slows movement).
Deep water (impassable, requires bridges or specific paths).
Mangrove-like trees or dense reeds (LOS blockers, cover).
Rickety wooden walkways or land bridges (chokepoints).
Sunken logs/debris (minor cover).
Feel: Mazelike, with restricted movement options and ambush points.
C. Backyards/Suburban:
Base Terrain: Mostly flat, defined plots for "yards."
Features:
Fences (destructible, LOS blockers, define pathways). Algorithm: Grid-based placement with variations.
Sheds/Garages (small destructible buildings, potential enemy spawn points or objective locations). Algorithm: BSP Trees or simple rectangular placement.
Patios, flowerbeds, scattered garden tools (minor cover/obstacles).
Roads/driveways (clear paths).
Feel: More structured, with man-made obstacles creating clear firing lanes and cover.
D. Junkyards:
Base Terrain: Uneven, possibly with piles of scrap creating varied height.
Features:
Piles of junk (impassable, cover, LOS blockers). Algorithm: Clustered random placement, potentially using physics-based settling for a more natural look.
Old car husks (destructible, cover, potential explosive hazard).
Chain-link fences (destructible, partial LOS blocking).
Shipping containers (larger obstacles, can form corridors or blockades).
Feel: Chaotic, dense with cover, many potential ambush spots, verticality if height variations are implemented.
2.4.3. Ensuring Playability and Fairness:
Path Guarantees:
The generation algorithm must ensure at least one clear path (though not necessarily obvious or easy) exists from the player spawn point to all primary objective locations and the extraction point.
Techniques: A* pathfinding check post-generation; if no path, regenerate or make minor adjustments (e.g., remove a blocking obstacle).
Resource Distribution (Pickups):
Weapon crates and health kits should be placed thoughtfully.
Not too frequent, but available at points where they might be needed (e.g., after a tough fight, before a major objective).
Consider placing some in slightly off-path or guarded locations to reward exploration.
Enemy Placement Logic:
Avoid placing enemies directly in the player's spawn point or in unavoidable "insta-death" traps.
Distribute enemy patrols and static positions to create varied encounters.
Place stronger enemies or groups guarding key objectives or chokepoints.
Ensure enemies have valid patrol paths and don't get stuck in geometry.
Cover Availability: Ensure a reasonable distribution of cover for both player and AI, preventing maps that are either completely open or too dense.
2.4.4. Integrating Objectives into Generated Levels:
Objective Placement First (Anchor Points): Key objective locations (e.g., enemy barracks, VIP location, extraction zone) could be determined early in the generation process. The rest of the map then forms around these anchors.
Post-Generation Analysis: Alternatively, generate the map terrain first, then analyze it to find suitable locations for objectives (e.g., a large open space for a "holdout" objective, a secluded area for a "rescue").
Connectivity: Ensure objectives are reachable and that the level flow makes sense in relation to them. For "destroy structure" objectives, the structure itself is a placed feature. For "rescue" objectives, the holding area for captives is a placed feature.
2.4.5. Iteration, Seeds, and Parameters (Map Parameters per phase/difficulty):
Seed-Based Generation: Each level should be generatable from a seed, allowing for specific layouts to be revisited or shared (useful for debugging or specific challenges).
Tunable Parameters: The generation algorithms will expose parameters that can be adjusted based on game progression/difficulty:
mapSize: Overall dimensions of the playable area.
enemyDensity: Number of enemies per map area.
objectiveCount: Number of primary/secondary objectives.
obstacleDensity: Frequency of trees, rocks, junk piles.
coverAvailability: Modifier for amount of cover.
chokepointFrequency: How often narrow passages appear.
destructibleRatio: Proportion of destructible vs. indestructible obstacles/structures.
biomeWeights: If a map can mix biome elements, these control the blend.
These parameters will be adjusted for different "Phases" of the campaign to gradually increase complexity and challenge.
Original Map Elements (from previous version, integrated above):
Terrain Types: Grass, dirt, mud (slows movement), shallow water (slows movement), roads.
Obstacles: Rocks, trees, bushes (provide light cover, may not block LOS completely), fences, small walls.
Structures:
Enemy Barracks/Huts: Spawn points for possums. Must be destroyed as an objective.
Watchtowers: Elevated positions for enemy snipers/spotters.
Bridges: Chokepoints.
Destructible Buildings: Can be damaged and destroyed by explosives, potentially revealing new paths or killing units inside.
2.5. Mission Objectives
Missions will be chained together to form phases, and phases form the campaign.
Common Objectives:
Exterminate All Possums: Kill all enemy units on the map.
Destroy Key Structures: E.g., Destroy all possum dens, disable a communication tower.
Rescue Captured Raccoons: Reach and escort friendly units to an extraction point.
Assassination: Eliminate a specific, high-value possum target.
Reach Extraction Point: Navigate the squad to a designated zone after completing other objectives.
Hold Position: Defend a specific area for a set amount of time.
Objective Indication: Clear visual cues on the map and in the UI for objectives.
2.6. Pickups & Power-ups (Found in-level)
Weapon Crates: Contain limited ammo for grenades or rockets.
First Aid Kits (Rare): Fully heal one raccoon. Player chooses which raccoon to apply it to. (e.g., 1 kit fully heals 1 raccoon to max HP).
Temporary Invincibility (Very Rare): Short duration of invulnerability for the raccoon that picks it up.
Keys/Access Cards: To open locked doors or gates.
2.7. Environment Interaction
Destructible Elements:
Certain trees can be shot down.
Fences can be destroyed.
Buildings can be damaged and eventually collapse from explosives. Collapsing buildings can kill units inside or nearby.
Cover:
Hard Cover (Rocks, Walls): Blocks movement and shots.
Soft Cover (Bushes, Tall Grass): May partially
obscure units, making them harder to hit, but doesn't block shots completely. (Added detail in 2.2.4)
Terrain Effects:
Mud/Water: Slows down movement for all units.
Explosive Barrels/Objects: Can be shot to cause an explosion, damaging nearby units.
2.8. Progression & Campaign
This section details how players advance through the game, manage their recruits, and experience the overall campaign structure.
2.8.1. The Recruit Roster & Permadeath:
Initial Roster: Players start the campaign with a small pool of named Raccoon Recruits (e.g., 10-15 recruits). Each recruit has a unique, randomly generated name (e.g., "Bandit," "Rascal," "Shadow," "Paws," "Binny").
Squad Size Limit: For each mission, players can deploy a squad of up to a certain number of raccoons (e.g., 4-8, potentially increasing slightly as the campaign progresses or for specific missions).
Permadeath: If a raccoon recruit's HP drops to zero during a mission, they are permanently killed and removed from the player's roster. This is a core feature.
Recruit Scarcity: Recruits are a finite resource. Losing them should feel impactful.
2.8.2. Gaining New Recruits:
Between Phases: A small batch of new recruits (e.g., 3-5) might join the platoon after successfully completing a "Phase" (a group of missions).
Mission Rewards (Rare): Occasionally, successfully completing a specific mission (especially "Rescue Captured Raccoons" objectives) might add the rescued raccoons to the player's roster.
No "Buying" Recruits: To maintain the theme of valuing each recruit, players generally won't be able to simply purchase more. They are earned through progression or specific mission outcomes.
2.8.3. Recruit Experience & Promotions (Subtle Enhancements):
The goal is to make surviving recruits feel more valuable without making them overpowered, thus maintaining the game's core lethality.
Tracking Survival: The game tracks how many missions each recruit has survived.
Ranks/Titles (Cosmetic & Minor Morale Boost):
After surviving a certain number of missions (e.g., 1, 3, 5, 10), a recruit might gain a new rank/title (e.g., Recruit -> Private -> Corporal -> Sergeant).
These ranks are primarily cosmetic, displayed on their roster portrait/info.
Potentially, higher-ranking raccoons could have a slightly higher "morale" (less likely to panic if that system is implemented) or provide a tiny morale buff to adjacent lower-ranking raccoons.
Minor Stat Boosts (Very Limited):
To avoid unbalancing the game, stat boosts should be minimal and infrequent.
Example: After surviving 5 missions, a recruit might get +5 Max HP (making them slightly more durable but still vulnerable).
Another possibility: A very slight increase in accuracy (e.g., +5%) or reload speed for their standard weapon after 10 successful missions.
These should be capped to prevent "super soldiers."
Visual Distinction: Promoted raccoons might get a minor visual flair (e.g., a different colored helmet stripe, a small badge on their vest). This is handled in Section 4.2.
2.8.4. Phases, Missions, and Difficulty Curve:
Campaign Structure: The game is divided into several "Phases" (e.g., Phase 1: The Backyard Blitz, Phase 2: Swamp Skirmish, Phase 3: Junkyard Justice, Phase 4: Possum HQ Assault).
Missions per Phase: Each phase consists of a sequence of 4-6 missions.
Narrative Snippets:
Phase Introduction: A brief text intro setting the scene for the new operational area and overall objective of the phase.
Mission Briefings: As detailed in 3.2, each mission gets a specific briefing.
Phase Conclusion: A short text outro summarizing the outcome of the phase and hinting at the next.
The narrative is light, focusing on the raccoons' ongoing struggle against the possum menace.
Difficulty Progression:
Early Phases: Fewer enemies, mostly Grunt Possums, simpler map layouts, more forgiving objective timers (if any).
Mid Phases: Introduction of Heavy and Grenadier Possums, more complex map layouts with more chokepoints and cover, objectives requiring more steps. Procedural generation parameters (enemyDensity, obstacleDensity) are increased.
Late Phases: Larger numbers of varied enemy types (including Snipers or even vehicles if implemented), challenging map designs, multi-part objectives, potentially stricter resource availability (fewer pickups).
The goal is a steady increase in challenge that tests the player's tactical skills and squad management.
2.8.5. The Recruit Memorial ("Wall of the Fallen"):
Access: Available from the Main Menu (3.4) and possibly linked from the post-mission screen if recruits were lost.
Content: A dedicated screen that lists every raccoon recruit who has died during the campaign.
Information Displayed (per fallen recruit):
Name
Rank (if any achieved before death)
Mission they died on (e.g., "Phase 2, Mission 3: The Bog of Bad News")
(Optional) A short, procedurally generated "epitaph" or "cause of death" for flavor (e.g., "Shredded by a Heavy Possum," "Went out with a bang (friendly grenade)," "Last seen charging a pillbox").
Purpose: Reinforces the permadeath mechanic, adds to the dark humor/tone, and allows players to reflect on their losses, making surviving veterans feel more precious.
2.8.6. Unlocking Weapons/Abilities (Campaign Progression vs. Pickups):
Primary Method: Pickups: As currently designed (2.6), special weapons (grenades, rockets) are found as limited-use items within missions. This keeps moment-to-moment gameplay dynamic.
Campaign Unlocks (Consideration):
Perhaps the ability to find/use certain items is unlocked. E.g., "After completing Phase 1, your recruits are now trained to use Grenades if found." This means grenade pickups won't appear in levels until that point.
This could also apply to new recruit "classes" if that were a future enhancement (e.g., unlocking a "Heavy Weapons Raccoon" that can carry more rockets). For MVP, all raccoons are standard.
This approach is secondary to in-mission pickups for MVP to keep things simple.
2.9. Game Over / Failure Conditions
Squad Wiped Out: All raccoons in the current mission are killed. Player can retry the mission with new recruits from their pool (if available).
Objective Failed: E.g., VIP killed, extraction point not reached in time (if timed).
No More Recruits: If the player runs out of all available raccoon recruits in their roster, it's a full game over (requiring a campaign restart or loading a previous save if implemented). This is the ultimate failure state.
3. User Interface (UI)
The UI aims for clarity, ease of use, and quick access to essential information and controls, reflecting the fast-paced tactical nature of the game. It should be functional yet themed to fit the "Raccoon Platoon" aesthetic (e.g., slightly grungy, military-esque, but with a touch of raccoon charm).
3.1. In-Game HUD (Heads-Up Display)
The HUD is visible during gameplay and provides critical information at a glance. It should be relatively unobtrusive, likely positioned at the bottom or top of the screen.
3.1.1. Squad Roster Panel:
Layout: A horizontal row of small portraits or stylized icons representing each raccoon currently deployed in the mission.
Information per Recruit:
Portrait/Icon: Clear visual of the raccoon. Could change slightly if heavily damaged (e.g., looking roughed up).
Name: Displayed below or beside the portrait.
Health Bar: A small, simple bar (e.g., green-yellow-red) directly under/beside the portrait.
Selection Indicator: Clearly highlights which raccoon(s) are currently selected by the player (e.g., brighter border, background glow).
Special Weapon Indicator: If a raccoon is carrying a special weapon (grenade/rocket from a pickup), a small icon (grenade, rocket) appears on their portrait.
Status Effects (Optional): Tiny icons for effects like "stunned," "suppressed" (if implemented).
Interaction: Clicking a portrait selects that individual raccoon. Shift-clicking could add to selection.
3.1.2. Special Weapon & Ammo Panel:
Layout: Positioned near the Squad Roster or in a corner.
Content:
Grenade Icon & Count: Displays a clear icon for grenades and the total number currently held by the selected raccoon(s) or the entire squad (TBD - selected might be better for clarity). If no selected raccoon has grenades, it shows '0' or is greyed out.
Rocket Launcher Icon & Count: Similar to grenades, showing icon and ammo count for rockets.
Activation: Clicking these icons (or using a hotkey) would select that weapon type for the currently selected raccoon(s) that possess it, changing the mouse cursor to the appropriate targeting mode.
3.1.3. Mission Objective Display:
Layout: Typically in a corner (e.g., top-right or top-left).
Content:
Clear, concise text stating the primary current objective(s) (e.g., "Eliminate All Possums," "Destroy Possum Den: 0/3," "Reach Extraction Zone").
May include small icons relevant to the objective type.
Updates dynamically as objectives are completed or new ones are given.
Minimizing: Could be a collapsible panel if screen real estate is tight, showing just the main objective line by default.
3.1.4. Minimap (Optional, but Recommended):
Layout: A small, semi-transparent overlay in a corner (e.g., top-right).
Content:
Shows explored areas of the map. Unexplored areas are fogged (Fog of War).
Player raccoon units displayed as friendly dots/icons.
Known enemy positions (last seen or currently visible) as enemy dots/icons.
Key objective markers.
Important terrain features (buildings, water bodies) in simplified form.
Interaction (Optional): Clicking on the minimap could quickly pan the main camera view to that location.
3.1.5. Game Controls / Menu Access:
Pause Button: Clearly visible icon (e.g., "||") to pause the game and bring up an in-game menu (Resume, Options, Restart Mission, Quit to Main Menu).
Game Speed Controls (Optional): Buttons for normal speed, fast-forward (if desired for non-combat traversal, though less common in this genre).
Select All Button (On-screen alternative to hotkey): An icon to select all active raccoons.
3.1.6. Mouse Cursor:
Context-Sensitive: Changes appearance based on what it's hovering over or what action is selected.
Default/Move: Standard pointer or a "move here" footprint/arrow icon.
Target Enemy: Crosshair icon.
Select Unit: Hand/pointer icon.
Grenade Throw: Grenade icon with trajectory preview.
Rocket Aim: Rocket/crosshair icon.
Interact (e.g., pickup crate): Gear/hand icon.
3.1.7. Notifications / Event Pop-ups:
Layout: Small, non-intrusive text messages appearing briefly in a designated area (e.g., top-center or bottom-center of the screen).
Content:
"Recruit [Name] Down!"
"Objective Complete: [Objective Name]"
"New Objective: [Objective Name]"
"Ammo Pickup: +3 Grenades"
"Enemy Spotted!"
Visuals: May have unique colors or small icons for different notification types (e.g., red for recruit down, green for objective complete).
3.2. Pre-Mission Screen ("Recruit Selection / Briefing")
This screen is shown before starting each mission, allowing players to prepare.
Layout: Likely a multi-panel screen.
Left Panel: Mission Briefing & Map Preview
Mission Title: e.g., "Phase 1, Mission 2: Operation Trash Panda"
Briefing Text: Scrollable text area describing the situation, known enemy types/numbers (if available intelligence), and primary/secondary objectives.
Map Preview (Obscured): A stylized, procedurally generated thumbnail of the upcoming map. Key areas might be hinted at, but details are obscured (e.g., under a "recon photo" filter or heavy fog of war). Shows player spawn.
Right Panel: Recruit Roster & Selection
Available Recruits List: Scrollable list of all currently available raccoons in the player's roster.
Per recruit: Portrait, Name, Rank, Missions Survived, Current Health (if not fully healed from a previous non-fatal injury - though typically they'd be healed or dead), any special skills/perks (if implemented beyond MVP).
Deployed Squad Slots: A set of empty slots (e.g., 4-8) representing the current mission's squad size limit.
Interaction: Player clicks/drags recruits from the roster to the deployed slots. Clicking a deployed recruit returns them to the roster.
Bottom Area:
"Launch Mission" Button: Starts the mission with the selected squad.
"Back to Campaign Map/Main Menu" Button.
Total Recruits Available / Deployed Count: (e.g., "Recruits: 12 / Deployed: 4/4").
3.3. Post-Mission Screen ("Debriefing")
This screen appears after a mission ends (success or failure).
Layout: Clear, summary-focused.
Header: Mission Outcome
Large text: "MISSION SUCCESSFUL!" or "MISSION FAILED!"
Sub-text reason for failure if applicable (e.g., "All Recruits KIA," "Objective Not Met: VIP Eliminated").
Main Panel: Statistics & Performance
Raccoons Deployed: (Number)
Raccoons Survived: (Number)
Raccoons Lost: (Number) - If >0, perhaps a small list of names here or a button to "View Fallen."
Possums Eliminated: (Number by type, if desired, or total)
Shots Fired / Accuracy (Optional): (e.g., "Accuracy: 65%")
Time Taken: (MM:SS)
Special Items Used: (Grenades: X, Rockets: Y)
Side/Bottom Panel: Recruit Status & Progression
Surviving Recruits: List of raccoons who made it.
For each: Name, Rank (and if they were promoted this mission, e.g., "Promoted to Corporal!"), Missions Survived (updated).
New Recruits Gained (If applicable): (e.g., "Rescued Recruits: +2 New Platoon Members!")
Footer Buttons:
"Continue" Button: (To next mission, campaign map, or recruit management if new recruits arrived).
"Retry Mission" Button (If failed and player has recruits left).
"View Recruit Memorial" Button (Especially if losses occurred).
"Main Menu" Button.
3.4. Main Menu
The first screen players see when starting the game.
Layout: Clean, simple, with clear navigation options. Thematic background (e.g., a raccoon command tent interior, a stylized map with possum/raccoon markers).
Options:
"New Campaign": Starts a fresh game.
"Load Campaign" (If save system is implemented): Loads a previously saved game.
"Recruit Memorial": Takes player to the "Wall of the Fallen" screen (see 2.8.5).
"Options":
Sound Volume (Master, Music, SFX sliders).
Graphics Quality (Low, Medium, High - if applicable, might affect particle density or texture resolution if not pure vector/simple pixel).
Control Settings (View keybinds, possibly rebind if advanced).
Clear Save Data (with confirmation).
"How to Play" (Optional): A simple screen explaining basic controls and objectives.
"Credits": Game credits.
"Quit Game" (For desktop versions) / "Back" (For web versions, might just be browser back).
3.5. General UI Principles:
Readability: Clear fonts, sufficient contrast.
Responsiveness: UI elements should provide immediate feedback when interacted with (hover states, click states).
Consistency: Similar actions should be performed in similar ways across different screens. Button styles, iconography should be consistent.
Tooltips (Optional): Hovering over complex icons or stats could show a small tooltip with a brief explanation.
4. Art & Sound
This section details the target aesthetic for visuals and audio, as well as considerations for MVP placeholders.
4.1. Visual Style
4.1.1. Target Aesthetic:
Option A: Modern Pixel Art:
Description: Detailed and expressive pixel art with smooth animations. Not overly retro (e.g., not 8-bit NES style), but a more contemporary pixel art look (e.g., 16-bit or 32-bit era fidelity, but with modern animation techniques). Think games like Katana Zero, Hyper Light Drifter (for quality, not necessarily exact style), or Into the Breach for character clarity.
Pros: Can be very characterful, good for conveying the "critter combat" theme with charm. Clear distinction of units and environmental details.
Cons: Can be time-consuming to create high-quality animated sprites for all units and actions.
Option B: Stylized 2D Vector Art:
Description: Clean lines, bold shapes, and potentially cel-shaded or painterly textures. Animations would be smooth, possibly using skeletal animation. Think games like Don't Starve (for character style, not mood), or Invisible, Inc. (for clarity and top-down perspective).
Pros: Scalable to different resolutions easily. Can be faster for certain types of animation if using skeletal systems. Can achieve a very polished, modern look.
Cons: Might lose some of the "gritty" charm if not carefully styled. Ensuring readability of small units from a top-down perspective is key.
Decision Point: The choice between these (or a hybrid) will significantly impact asset creation workflow. For the purpose of this document, we'll assume a Modern Pixel Art approach is slightly favored for its potential to capture the Cannon Fodder feel with the animal theme, but flexibility is retained.
4.1.2. Perspective: Top-down, with a slight angle (e.g., 15-25 degrees off true vertical) to give units and environmental objects some depth and better visibility of their features, similar to the original Cannon Fodder. Avoid a completely flat top-down view.
4.1.3. Color Palette:
General: Rich but not overly saturated. Good contrast between foreground units/action and background environments is paramount for readability.
Biomes:
Forests: Greens, browns, dappled light effects.
Swamps: Murky greens, blues, greys, browns.
Backyards: Brighter greens for lawns, varied colors for man-made objects (fences, sheds), concrete/asphalt greys.
Junkyards: Rusty oranges, browns, metallic greys, muted blues and greens on discarded items.
Units: Raccoons might have slightly more "heroic" or distinct gear colors compared to the more drab/makeshift possum outfits.
4.1.4. Animations (Target Quality):
Movement: Smooth walking/running cycles with clear directional facing (e.g., 8-directional sprites or good interpolation). Idle animations to add life.
Combat: Distinct firing animations for each weapon type. Muzzle flashes, bullet trails (subtle), impact effects (dirt puffs, sparks on metal, small blood effects for hits - stylized, not overly gory).
Explosions: Satisfying and visually clear AOE for grenades and rockets. Debris, smoke.
Death Animations: Varied and characterful. Given the dark comedy, these can be slightly exaggerated (e.g., a possum comically flying back from an explosion, a raccoon dramatically clutching its chest).
Environmental Interaction: Animations for trees falling, fences breaking, buildings crumbling.
4.1.5. MVP Placeholder Art Strategy:
Units: Simple geometric shapes (e.g., circles for raccoons, squares for possums) with different colors. A small arrow or line to indicate facing.
Terrain: Flat colored backgrounds for different terrain types (green for grass, brown for dirt).
Obstacles: Larger colored rectangles or squares.
Projectiles: Simple colored dots or lines.
UI: Basic HTML buttons and text fields.
Goal: Focus entirely on functionality. Art can be iterated upon once core mechanics are solid.
4.2. Character Design
Raccoons (The Platoon):
Core Look: Anthropomorphic but clearly identifiable as raccoons (masked faces, ringed tails). Standing upright.
Gear: Miniature, somewhat comical military gear: helmets (various styles like Brodie, M1, or even makeshift pot helmets), bandoliers, tiny vests, small backpacks. Gear should look functional but also a bit "scavenged" or "DIY."
Differentiation:
Subtle variations in fur patterns or gear color/details to make individual recruits feel unique even before promotions.
Promotions: Clear visual indicators for rank (as per 2.8.3) e.g., a painted stripe on the helmet, a small sewn-on patch/badge on their vest. These should be easily readable from the game's perspective.
Possums (The Opposition):
Core Look: Anthropomorphic but clearly possums (pointed snouts, bare tails, perhaps a "playing dead" idle animation for humor).
Gear: More ragged, makeshift, and less uniform than the raccoons. Think rusty metal scraps for armor, poorly fitting helmets, tattered cloth.
Enemy Types:
Grunt: Basic, minimal gear.
Heavy: Larger, bulkier, more improvised armor plating, bigger weapon.
Grenadier: Satchel/bandolier clearly showing grenades.
Sniper: Camouflaged elements, long rifle.
4.3. Environment Design
Readability: Objects and terrain features must clearly communicate their gameplay function (cover, obstacle, destructible, hazardous).
Detail Level: Detailed enough to be immersive and visually interesting, but not so cluttered that it obscures units or tactical information.
Destructible Elements: Visual states for damaged and destroyed versions of objects (e.g., a fence with broken slats, then completely gone; a building with cracks, then a rubble pile).
Thematic Consistency: Each biome should have a distinct set of environmental props and terrain textures that reinforce its theme.
4.4. Sound Effects (SFX)
4.4.1. Design Goals:
Impactful & Satisfying: Weapon fire, explosions, and destruction should feel weighty and rewarding.
Informative: Sounds should provide gameplay cues (e.g., distinct sound for enemy weapon fire, alert calls from units, grenade fuse hissing).
Thematic: Animal vocalizations should be integrated naturally, not be overly silly to the point of undermining the action (unless specific comedic moments call for it).
4.4.2. Key Sound Categories:
Weapon Sounds:
Raccoon Machine Gun: Rapid, slightly chattering sound.
Possum Rifle: Heavier, more distinct single shots or short bursts.
Heavy Possum Weapon: A more booming, powerful sound.
Grenade: Throw sound (whoosh), thud on impact, distinct fuse hiss, sharp explosion.
Rocket Launcher: Firing "whoosh/thump," rocket travel sound, powerful impact explosion.
Impact Sounds: Bullets hitting dirt, wood, metal, water, flesh (stylized).
Explosions: Layered sounds with bass for impact and higher frequencies for debris.
Unit Vocalizations (Minimalist & Stylized):
Raccoons: Short, sharp barks/chitters for selection acknowledgment ("Yep!"), taking damage (yelp), dying (a final sigh/squeak). Perhaps a "Hoo-rah!" for completing an objective.
Possums: Hisses, guttural growls when spotting player or attacking. Pained squeal when hit/dying. Maybe a "Yeeow!" when a grenade lands near them.
Movement Sounds: Subtle footstep sounds varying by terrain (grass, dirt, wood, shallow water).
Environmental Sounds (Ambient): Looping background tracks for each biome (forest rustling, wind, distant animal calls, swamp water drips/croaks, junkyard metallic creaks).
UI Sounds: Crisp clicks for button presses, short notification sounds (positive for objective complete, negative for recruit lost).
4.4.3. MVP Placeholder Sound Strategy:
Priority: Focus on sounds that provide critical gameplay feedback: weapon fire, explosions, unit damage/death, objective completion.
Sources: Utilize free, open-source sound libraries or simple generated sounds (e.g., using a tool like bfxr/sfxr for basic 8-bit style sounds initially).
No Sound: Some less critical sounds (e.g., ambient environmental sounds, detailed UI clicks) can be omitted for the very first MVP build if necessary.
4.5. Music
Style:
Main Theme/Menus: Upbeat, militaristic but with a quirky, adventurous, and slightly comedic edge. Think "animal platoon on a mission." Catchy and memorable.
In-Game (Mission):
Exploration/Stealth: More ambient, tense, and atmospheric. Lower intensity.
Combat: Music ramps up in intensity and tempo when combat starts. More percussive and driving.
The music should dynamically adapt if possible, or switch tracks based on combat state.
Victory Jingle: Short, triumphant, and slightly cheeky.
Defeat Jingle: Short, melancholic, perhaps with a comical "womp womp" undertone.
Instrumentation: Could blend traditional military band elements (brass, snare drums) with more playful or rustic instruments (e.g., banjo, harmonica, whistling) to fit the raccoon/possum theme.
MVP Placeholder Music Strategy:
One or two royalty-free tracks that fit the general mood can be used.
Or, initially, no music to focus on core gameplay and SFX feedback.
5. Technical Aspects
5.1. Platform: HTML5
Rendering: HTML5 Canvas 2D API.
Language: JavaScript.
5.2. Input
Primary: Mouse (movement, targeting, UI interaction).
Secondary (Optional): Keyboard shortcuts (squad selection, special weapon activation, pause).
5.3. Performance Considerations
Efficient rendering, especially with many units and particle effects (explosions, muzzle flashes).
Optimized pathfinding for potentially many units.
Smooth procedural generation that doesn't cause long loading times.
5.4. Save/Load System (Post-MVP)
Ability to save campaign progress (e.g., after each mission or phase).
Could use browser local storage.
6. Potential Future Enhancements (Post-MVP)
More enemy types and behaviors.
More weapon types and special items.
Vehicles (for both raccoons and possums).
Advanced squad formations and commands (e.g., "Hold Fire," "Seek Cover").
More complex environmental interactions (e.g., flammable oil slicks, electrical hazards).
Co-operative multiplayer (each player controls a subset of the squad).
Level editor.
7. Minimum Viable Product (MVP) Feature List
This section outlines the absolute core features required to create a playable and testable version of "Raccoon Platoon." The goal is to focus on the fundamental gameplay loop first. Placeholder art and sound can be used initially.
7.1. Core Gameplay Loop:
Start Mission: Player can select a mission (initially, perhaps just one test level).
Squad Deployment: Player can select a small squad (e.g., 2-4 raccoons) from a predefined small roster.
Movement: Control selected raccoon(s) with mouse clicks for movement. Basic pathfinding around simple obstacles.
Combat:
Raccoons auto-fire standard machine guns at visible enemies in range.
Player can manually target enemies with left-click.
At least one enemy type (e.g., Grunt Possum) with basic AI (move and shoot).
Health and damage system implemented; units die when HP reaches zero.
Objective: At least one simple objective type (e.g., "Eliminate all Possums" or "Reach Extraction Point").
Win/Loss Condition: Game recognizes mission success (objective complete) or failure (all raccoons lost).
End Mission: Basic post-mission screen showing outcome.
7.2. Key Systems for MVP:
Raccoon Unit:
Basic stats (HP, speed, standard machine gun).
Ability to be selected, move, attack, take damage, die.
Possum Unit (Grunt):
Basic stats (HP, speed, basic rifle).
Basic AI: Patrol a simple path (or stationary), detect and attack raccoons in LOS/range.
Weapon - Raccoon Machine Gun: Functional (damage, range, ROF).
Weapon - Possum Rifle: Functional (damage, range, ROF).
Level Structure:
One fixed, non-procedurally generated test level initially to simplify.
Basic terrain (walkable areas).
Simple obstacles (e.g., impassable blocks) for pathfinding and LOS.
Player spawn point(s).
Enemy spawn point(s).
User Interface (Minimal):
In-Game HUD:
Display selected raccoon(s).
Health indication for raccoons.
Objective display (simple text).
Basic pre-mission screen (just a "Start Mission" button).
Basic post-mission screen (Win/Loss message).
Controls: Mouse-based selection, movement, and targeting.
7.3. Excluded from MVP (for initial focus):
Procedural Level Generation (use a fixed map first).
Multiple enemy types (start with Grunt Possum).
Grenades, Rocket Launchers, and other special pickups/weapons.
Advanced enemy AI (cover, grenades, complex patrols).
Campaign progression, multiple missions/phases, recruit roster management, promotions.
Recruit Memorial.
Destructible environments (beyond basic LOS blocking).
Advanced UI elements (minimap, detailed stats, etc.).
Sound and polished art (use placeholders).
Save/Load system.
Splitting squads.
7.4. MVP Goal:
To have a playable slice that demonstrates the core top-down squad control and combat. This allows for early feedback on game feel, controls, and basic combat balance before investing in more complex systems or extensive content creation.
This detailed specification should provide a solid foundation for developing Raccoon Platoon. The next step would be to prioritize features for a Minimum Viable Product (MVP) and start prototyping the core mechanics.
