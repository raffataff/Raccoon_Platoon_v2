// js/config.js
const CONFIG = {

    // =============================================================================
    // CORE
    // =============================================================================
    BASE_WORLD_WIDTH: 1920,
    BASE_WORLD_HEIGHT: 1080,
    MIN_CANVAS_WIDTH: 1920,
    MIN_CANVAS_HEIGHT: 1080,
    MAX_DELTA_TIME_STEP: 0.1,
    CAMERA_LERP_SPEED: 0.08,
    CAMERA_ZOOM: 1.15,

    // =============================================================================
    // PERFORMANCE
    // =============================================================================
    AUTO_PHASE_ENEMIES_FPS_THRESHOLD: 35,

    // =============================================================================
    // LAYOUT
    // =============================================================================
    CANVAS_ASPECT_RATIO_SQUISH: 1.0,                      // Multiplier for the canvas aspect ratio calculation. >1 = wider canvas (less height squish), <1 = narrower canvas (more height squish). Tweak if the 16:9 canvas appears too tall/short relative to the HUD.
    DISPLAY_SIZE: 'stretched',                            // Display size mode: 'stretched' = fill entire canvas container (may squish), 'widescreen' = maintain aspect ratio with letterboxing.

    // =============================================================================
    // INPUT
    // =============================================================================
    INPUT_DRAG_THRESHOLD: 5,
    INPUT_TAP_THRESHOLD_MS: 30,

    // =============================================================================
    // VIDEO
    // =============================================================================
    MIN_LOADING_VIDEO_DURATION_MS: 5000,

    // =============================================================================
    // PATHFINDING
    // =============================================================================
    PATHFINDING: {
        // --- Grid ---
        GRID_CELL_SIZE: 8,                              // Size of each nav grid cell in pixels. All A* pathfinding operates on this grid. Smaller = finer paths but more cells to search.
        UNIT_PATHING_RADIUS_BUFFER: 12,                   // Extra padding (pixels) added to unit radius when rasterizing obstacles onto the nav grid. Higher = paths stay further from walls.
        PATHFINDING_MAX_EXPANSIONS: 20000,                // Max A* node expansions before giving up. Higher = longer search but better chance of finding a path.

        // --- Obstacle repulsion (world-space push forces) ---
        OBSTACLE_REPULSION_RADIUS_FACTOR: 1.10,           // Multiplied by unit size to get the repulsion radius. Units within this distance of obstacles get pushed away.
        OBSTACLE_REPULSION_FORCE: 0.6,                    // Magnitude of the push force when a unit is inside the repulsion radius.
        OBSTACLE_REPULSION_MAX_SPEED_FACTOR: 0.98,         // Caps repulsion speed at this × the unit's desired speed. Prevents repulsion from overwhelming movement.

        // --- Stuck detection ---
        STUCK_REPATH_FRAME_THRESHOLD: 30,                 // Frames a unit must be stuck (not meaningfully moving) before triggering a forced repath.
        STUCK_FRAMES_THRESHOLD_PATHING: 10,               // Frames of stuckness before the pathing system flags the unit as fully stuck.
        UNIT_STUCK_FRAMES_THRESHOLD: 20,                   // Frames before the unit's own stuck counter triggers visual/state changes.
        STUCK_MOVEMENT_THRESHOLD_FACTOR: 0.015,            // Movement per frame below this × speed counts as "stuck". Lower = more sensitive stuck detection.
        STUCK_VELOCITY_SAMPLE_TIME: 0.1,                  // How often (seconds) velocity is sampled for stuck detection averaging.
        STUCK_RECOVERY_COOLDOWN: 1.5,                     // Cooldown (seconds) after a stuck recovery attempt before another can fire.
        MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,                // Max consecutive stuck recovery attempts before the unit gives up and phases.

        // --- Repathing ---
        REPATH_STUCK_COOLDOWN: 1.0,                       // Cooldown (seconds) after a stuck-triggered repath before another stuck repath can fire.
        REPATH_FAILS_BEFORE_PHASING: 3,                   // Number of consecutive repath failures before the unit auto-phases (walks through obstacles).
        REPATH_STUCK_COOLDOWN_AFTER: 0.5,                 // Base cooldown (seconds) added after a stuck repath, plus random jitter.
        BUMP_REPATH_COOLDOWN: 0.35,                       // Cooldown (seconds) after a bump-nudge before the unit will repath.
        SKIP_FIRST_NODE_DIST_FACTOR: 0.5,                 // If closer to the first path node than this × unit size, skip it.
        SKIP_REDUNDANT_NODE_FACTOR: 0.5,                  // Skip path nodes closer than this × arrivalTolerance to the previous node.
        FINAL_ARRIVAL_TOLERANCE_FACTOR: 1.5,              // At the end of a path, unit considers itself arrived when within this × arrivalTolerance of the final target.

        // --- Mid-path repath splicing (obstacle avoidance waypoints) ---
        REPATH_SPLICE_AVOID_RADIUS: 4,                    // Grid cells radius around a blocking unit to search for avoidance waypoints. Larger = wider detour.
        REPATH_SPLICE_AVOID_NODES: 8,                     // Number of intermediate avoidance nodes to insert into the path when splicing around a blocker.
        REPATH_SPLICE_MAX_WAYPOINTS: 6,                   // Max candidate waypoints to consider when building a spliced avoidance detour.
        REPATH_SPLICE_WAYPOINT_GRID_STEP: 3,              // Grid cell step between candidate waypoints placed around the blocker.

        // --- Collision & separation ---
        UNIT_COLLISION_CHECK_ENABLED: false,               // Master toggle for unit-to-unit collision checks.
        MIN_SEPARATION_DISTANCE_FACTOR: 0.85,             // Factor × combined unit radii = minimum distance before separation forces push units apart.
        UNIT_SEPARATION_FORCE_FACTOR: 2.0,                // Global multiplier for separation push force magnitude between units.
        SEPARATION_CHECK_RADIUS_FACTOR: 1.1,              // How far (× unit size) to look for nearby units to apply separation forces to.
        SEPARATION_OVERLAP_PUSH_FACTOR: 2.5,              // Push strength multiplier when units are overlapping (penetrating each other).
        SEPARATION_PROXIMITY_PUSH_FACTOR: 0.15,            // Push strength multiplier for units that are close but not overlapping.
        UNIT_COLLISION_RADIUS_FACTOR: 0.5,                // Unit's collision radius as a factor of its size. Used for obstacle and unit collision checks.
        UNIT_COLLISION_CHECK_RADIUS_FACTOR: 1.2,          // Spatial query radius (× unit size) for finding nearby units to collide with.

        // --- Slide / resolve ---
        MAX_SLIDE_FRAMES: 8,                              // How many frames a slide direction persists after hitting an obstacle before resetting.
        BLOCKED_BY_UNIT_TIMER: 0.1,                         // Seconds to wait after being blocked by another unit before attempting to repath.

        // --- Overlap detection & resolution ---
        OVERLAP_DETECTION_ENABLED: true,                  // Master toggle for proactive overlap detection and resolution.
        OVERLAP_SCAN_RADIUS_FACTOR: 0.05,                  // Spatial query radius (× unit size) for finding overlapping units to resolve.
        OVERLAP_MIN_PUSH_FACTOR: 0.5,                     // Minimum push distance (× unit size) to separate overlapping units immediately.
        OVERLAP_RECOVERY_SPEED_FACTOR: 1.10,               // Speed multiplier for burst-move out of overlaps. Higher = faster escape.
        OVERLAP_PHASING_THRESHOLD: 120,                     // Frames of continuous overlapping before auto-phasing to escape.
        OVERLAP_REPATH_COOLDOWN: 0.2,                     // Minimum seconds between overlap-triggered repaths (prevents spam).

        // --- Obstacle penetration escape ---
        OBSTACLE_STUCK_DETECTION_ENABLED: true,           // Master toggle for detecting when a unit is inside an obstacle.
        OBSTACLE_STUCK_SCAN_RADIUS_FACTOR: 0.1,           // Spatial query radius (× unit size) for finding obstacles the unit is inside.
        OBSTACLE_ESCAPE_PUSH_FACTOR: 0.3,                 // Push distance (× unit size) per frame to eject unit from obstacle.
        OBSTACLE_STUCK_PHASING_THRESHOLD: 60,              // Frames of being inside obstacle before auto-phasing.
        OBSTACLE_STUCK_NAV_CHECK: false,                   // Also check if the unit's nav grid cell is blocked (cheaper early-out).

        // --- Desperate stuck ---
        DESPERATE_STUCK_SEARCH_RADIUS_CELLS: [2, 6],      // [min, max] grid cell radius to search for an alternative walkable start when deeply stuck. Step size is 2.
        DESPERATE_STUCK_MOVE_RADIUS_CELLS: 4,            // Grid cell radius for the random desperate move destination when all else fails.

        // --- Path smoothing ---
        SMOOTHING_COARSE_THRESHOLD_HIGH: 40,              // If remaining path nodes exceed this, use coarse stepping (nodes/10) for line-of-sight checks.
        SMOOTHING_COARSE_THRESHOLD_LOW: 15,               // If remaining nodes exceed this (but below high), use medium stepping (nodes/5).
        SMOOTHING_MAX_ITER_FACTOR: 4,                     // Max smoothing iterations = path length × this factor (minimum 100).

        // --- Path deflation (clearance from obstacles) ---
        DEFLATION_ITERATIONS: 4,                          // Number of deflation passes. Each pass pushes path nodes away from obstacles and other units.
        DEFLATION_OFFSET_MARGIN: 32,                      // Extra margin (pixels) added to pathing radius when querying spatial grid during deflation.
        DEFLATION_NODE_PUSH_FACTOR: 0.9,                  // How much (0-1) to push path nodes away from obstacles per iteration. Lower = gentler adjustment.
        DEFLATION_UNIT_PUSH_FACTOR: 0.9,                  // How much (0-1) to push path nodes away from other units per iteration.

        // --- Border waypoint fallback ---
        BORDER_BFS_MAX_CELLS: 4000,                       // Max BFS cells to search when looking for border waypoints for fallback paths.
        BORDER_MAX_CELLS_COLLECT: 20,                     // Max border cells to collect as candidate waypoints.
        BORDER_MIN_DISTANCE: 5,                           // Minimum grid distance from start for a valid border waypoint.
        BORDER_WAYPOINTS_MAX_TRY: 30,                     // Max border waypoints to attempt when building a two-leg fallback path.
        BORDER_LEG_EXPANSION_FRACTION: 0.33,              // Each leg of a fallback path gets this fraction of the total A* expansion budget.

        // --- Phasing ---
        PHASING_DURATION: 0.3,                            // How long (seconds) a unit phases (walks through obstacles) after repeated repath failures.
        PHASING_DIRECT_MOVE_THRESHOLD: 0.1,               // During phase, if closer than this × unit size to target, move directly instead of pathing.
        PHASING_ARRIVAL_THRESHOLD_FACTOR: 0.05,           // During phase, consider arrived when within this × unit size of the next path node.
        PHASING_STILL_THRESHOLD_FACTOR: 0.1,              // After phase ends, if still further than this × unit size from target, re-path to target.

        // --- Spawn search ---
        SPAWN_WALKABLE_SEARCH_RADIUS: 2,                  // Grid cell radius to search for a walkable cell near a blocked spawn point.
        ENDPOINT_WALKABLE_SEARCH_RADIUS: 6,               // Grid cell radius to search for a walkable cell near a blocked path destination.

        ENEMY_CHASE_THROTTLE_COUNT: 20,                   // When active enemies exceed this, begin throttling chase repaths.
        ENEMY_CHASE_THROTTLE_MULTIPLIER: 2.0,             // Multiply base chase refresh interval when above throttle count.
    },

    // =============================================================================
    // SPATIAL_GRID
    // =============================================================================
    SPATIAL_GRID: {
        CELL_SIZE_FACTOR: 2,                              // Spatial grid cell size = GRID_CELL_SIZE × this. Used for broad-phase unit collision queries.
    },

    // =============================================================================
    // DEBUG
    // =============================================================================
    DEBUG_PATHING_UNIT_ID: 0,
    DEBUG_DRAW_NAV_GRID_BLOCKED: true,
    DEBUG_DRAW_NAV_GRID_TILES: false,
    DEBUG_DRAW_SPATIAL_GRID: false,
    DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES: true,
    DEBUG_DRAW_OBSTACLE_NAMES: true,
    DEBUG_DRAW_UNIT_PATHING_BOUNDS: true,
    DEBUG_DRAW_BULLET_SIZES: false,

    // =============================================================================
    // ENEMY_ALERT
    // =============================================================================
    ENEMY_ALERT_PROPAGATION_RADIUS: 180,
    ENEMY_INVESTIGATE_ATTACK_CHANCE: 0.95,
    ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT: 0.10,

    UNIT_VISUALS: {
        STUCK_FRAMES_THRESHOLD: 6,
        UNIT_PHASING_OPACITY: 0.5,
        DRAW_GUN_AIM_INDICATOR: false,
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 1 },
        KIA_STYLE: { PLAYER_FILL_COLOR: 'darkgrey', ENEMY_FILL_COLOR: '#555555', OPACITY: 1 },
        GRENADE_AIM_INDICATOR: { COLOR: 'orange', LINE_WIDTH: 2, RADIUS_OFFSET: 6 },
        UNIT_BOBBING_ENABLED: true,
        UNIT_BOBBING_AMPLITUDE: 1,
        UNIT_BOBBING_SPEED_FACTOR: 0.2,
        UNIT_HOVER_INERTIA: 0.15,
        UNIT_HOVER_FRICTION: 3.0,
        UNIT_HOVER_BOB_AMPLITUDE: 0.5,
        UNIT_HOVER_BOB_SPEED: 1.5
    },

    // =============================================================================
    // PLAYER_RACCOON
    // =============================================================================

    // Base Stats
    RACCOON_HP: 20,
    RACCOON_SPEED: 200,
    RACCOON_SIZE: 18,
    RACCOON_COLOR: '#808080',
    RACCOON_DETECTION_RANGE: 100,

    // Engagement
    RACCOON_MIN_ENGAGEMENT_DISTANCE: 100,
    RACCOON_PREFERRED_ENGAGEMENT_DISTANCE_MAX: 150,
    RACCOON_ENGAGE_RANGE_BUFFER: 60,

    // Grenades
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 75,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 290,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,
    RACCOON_STARTING_GRENADES: 0,
    GRENADE_THROW_COOLDOWN_BASE: 3.0,
    GRENADE_THROW_COOLDOWN_RANDOM_ADD: 2.5,

    // Ammo/Reload
    RACCOON_STARTING_AMMO: 400,
    RACCOON_MAGAZINE_SIZE: 30,
    BASE_RELOAD_TIME: 3.0,
    RELOAD_TIME_REDUCTION_PER_RANK: 0.25,

    // Auto-target
    RACCOON_AUTO_TARGET_RANGE_FACTOR: 0.6,

    // Sprites
    RACCOON_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/recruit/type1/',
    RACCOON_SPRITE_SCALE_FACTOR: 0.34,
    RACCOON_PRIVATE_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/private/type1/',
    RACCOON_PRIVATE_SPRITE_SCALE_FACTOR: 0.34,
    RACCOON_CORPORAL_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/corporal/type1/',
    RACCOON_CORPORAL_SPRITE_SCALE_FACTOR: 0.34,
    RACCOON_SERGEANT_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/sergeant/type1/',
    RACCOON_SERGEANT_SPRITE_SCALE_FACTOR: 0.28,
    RACCOON_ELITE_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/elite/type2/',
    RACCOON_ELITE_SPRITE_SCALE_FACTOR: 0.35,
    RACCOON_GHOST_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/ghost/type2/',
    RACCOON_GHOST_SPRITE_SCALE_FACTOR: 0.35,
    RACCOON_MAVERICK_SPRITE_PATH: 'assets/images/units/raccoon/maverick/',
    RACCOON_MAVERICK_SPRITE_SCALE_FACTOR: 0.55,
    RACCOON_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/',
    RACCOON_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'],
    RACCOON_DEAD_SPRITE_SCALE: 0.06,
    RACCOON_RECRUIT_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/recruit/dead/',
    RACCOON_RECRUIT_DEAD_SPRITE_FILES: ['raccoon_recruit_dead_1.png'],
    RACCOON_RECRUIT_DEAD_SPRITE_SCALE: 0.38,
    RACCOON_PRIVATE_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/private/dead/',
    RACCOON_PRIVATE_DEAD_SPRITE_FILES: ['raccoon_private_dead_1.png'],
    RACCOON_PRIVATE_DEAD_SPRITE_SCALE: 0.38,
    RACCOON_CORPORAL_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/corporal/dead/',
    RACCOON_CORPORAL_DEAD_SPRITE_FILES: ['raccoon_corporal_dead_1.png'],
    RACCOON_CORPORAL_DEAD_SPRITE_SCALE: 0.38,
    RACCOON_SERGEANT_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/sergeant/dead/',
    RACCOON_SERGEANT_DEAD_SPRITE_FILES: ['raccoon_sergeant_dead_1.png'],
    RACCOON_SERGEANT_DEAD_SPRITE_SCALE: 0.38,
    RACCOON_ELITE_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/elite/dead/',
    RACCOON_ELITE_DEAD_SPRITE_FILES: ['raccoon_elite_dead_1.png'],
    RACCOON_ELITE_DEAD_SPRITE_SCALE: 0.38,
    RACCOON_GHOST_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/rifleman/ghost/dead/',
    RACCOON_GHOST_DEAD_SPRITE_FILES: ['raccoon_ghost_dead_1.png'],
    RACCOON_GHOST_DEAD_SPRITE_SCALE: 0.35,
    RACCOON_MAVERICK_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/',
    RACCOON_MAVERICK_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'],
    RACCOON_MAVERICK_DEAD_SPRITE_SCALE: 0.06,
    RACCOON_HOSTAGE_SPRITE_SCALE_FACTOR: 0.38,
    HOSTAGE_KNEELING_SPRITE_PATH: 'assets/images/units/raccoon/hostage/kneeling/type1/',
    HOSTAGE_STANDING_SPRITE_PATH: 'assets/images/units/raccoon/hostage/standing/type1/',
    HOSTAGE_RESCUED_SPRITE_PATH: 'assets/images/units/raccoon/hostage/rescued/type2/idle/',
    RACCOON_TURN_RATE: 10.0,

    
    // =============================================================================
    // XP_RANKS
    // =============================================================================
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,

    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: { grenadeRangeBonus: 0 }, nightVisionRadius: 180, defaultWeapon: 'RACCOON_MACHINE_GUN' },

        { rankName: "Private", xpNeeded: 300, statBoosts: { maxHpBonus: 20, bulletLifetimeBonus: 0.2, turnRate: 12, grenadeRangeBonus: 20 }, nightVisionRadius: 200, defaultWeapon: 'RACCOON_PRIVATE_MG' },
        
        { rankName: "Corporal", xpNeeded: 1000, statBoosts: { maxHpBonus: 30, accuracyBonus: 0.05, bulletLifetimeBonus: 0.3, turnRate: 15, grenadeRangeBonus: 40 }, nightVisionRadius: 220, defaultWeapon: 'RACCOON_CORPORAL_MG' },
        
        { rankName: "Sergeant", xpNeeded: 2000, statBoosts: { maxHpBonus: 40, accuracyBonus: 0.1, bulletLifetimeBonus: 0.4, turnRate: 20, grenadeRangeBonus: 70 }, nightVisionRadius: 250, defaultWeapon: 'RACCOON_SERGEANT_MG' },
        
        { rankName: "Elite", xpNeeded: 4000, statBoosts: { maxHpBonus: 60, accuracyBonus: 0.2, bulletLifetimeBonus: 0.6, turnRate: 30, grenadeRangeBonus: 110 }, nightVisionRadius: 290, defaultWeapon: 'RACCOON_ELITE_MG' },
        
        { rankName: "Ghost", xpNeeded: 10000, statBoosts: { maxHpBonus: 100, accuracyBonus: 0.4, bulletLifetimeBonus: 0.8, turnRate: 45, grenadeRangeBonus: 160 }, nightVisionRadius: 350, defaultWeapon: 'RACCOON_GHOST_MG' }
    ],
    MAX_RANK_NAME: "Ghost",

    GRENADE_BONUS_PRIVATE: 1,
    GRENADE_BONUS_CORPORAL: 2,
    GRENADE_BONUS_SERGEANT: 3,
    GRENADE_BONUS_ELITE: 4,
    GRENADE_BONUS_GHOST: 5,


    // =============================================================================
    // ENEMY_UNITS
    // =============================================================================

    // --- Possum Grunt ---
    POSSUM_GRUNT_HP: 20,
    POSSUM_GRUNT_SPEED: 150,
    POSSUM_GRUNT_SIZE: 14,
    POSSUM_GRUNT_COLOR: '#A0522D',
    POSSUM_GRUNT_DEFAULT_WEAPON: 'POSSUM_RIFLE',
        POSSUM_GRUNT_SPRITE_PATH: 'assets/images/units/possum_grunt/',
    POSSUM_GRUNT_SPRITE_SCALE_FACTOR: 0.45,
    POSSUM_GRUNT_DEAD_SPRITE_PATH: 'assets/images/units/possum_grunt/dead/',
    POSSUM_GRUNT_DEAD_SPRITE_FILES: ['possum_grunt_dead_3.png', 'possum_grunt_dead_4.png'],
    POSSUM_GRUNT_DEAD_SPRITE_SCALE: 0.5,
    POSSUM_GRUNT_TURN_RATE: 8.0,

    // --- Possum Heavy ---
    POSSUM_HEAVY_HP: 60,
    POSSUM_HEAVY_SPEED: 120,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_DEFAULT_WEAPON: 'POSSUM_HEAVY_WEAPON',
    POSSUM_HEAVY_SPRITE_PATH: 'assets/images/units/possum_heavy/',
    POSSUM_HEAVY_SPRITE_SCALE_FACTOR: 0.55,
    POSSUM_HEAVY_DEAD_SPRITE_PATH: 'assets/images/units/possum_heavy/dead/',
    POSSUM_HEAVY_DEAD_SPRITE_FILES: ['possum_heavy_dead_1.png'],
    POSSUM_HEAVY_DEAD_SPRITE_SCALE: 0.6,
    PROJECTILE_COLOR_POSSUM_HEAVY: '#ff47478e',
    POSSUM_HEAVY_TURN_RATE: 5.0,
    
    // --- Possum Sniper ---
    POSSUM_SNIPER_HP: 25,
    POSSUM_SNIPER_SPEED: 100,
    POSSUM_SNIPER_SIZE: 14,
    POSSUM_SNIPER_COLOR: '#788270',
    POSSUM_SNIPER_DEFAULT_WEAPON: 'POSSUM_SNIPER_RIFLE',
    POSSUM_SNIPER_SPRITE_PATH: 'assets/images/units/possum_sniper/',
    POSSUM_SNIPER_SPRITE_SCALE_FACTOR: 0.6,
    POSSUM_SNIPER_DEAD_SPRITE_PATH: 'assets/images/units/possum_sniper/dead/',
    POSSUM_SNIPER_DEAD_SPRITE_FILES: ['possum_sniper_dead.png'],
    POSSUM_SNIPER_DEAD_SPRITE_SCALE: 0.5,
    PROJECTILE_COLOR_POSSUM_SNIPER: '#FF2400',
    POSSUM_SNIPER_TURN_RATE: 7.0,

    // --- Possum Elite ---
    POSSUM_ELITE_HP: 80,
    POSSUM_ELITE_SPEED: 190,
    POSSUM_ELITE_SIZE: 15,
    POSSUM_ELITE_COLOR: '#8B4513',
    POSSUM_ELITE_DEFAULT_WEAPON: 'POSSUM_ELITE_WEAPON',
    POSSUM_ELITE_SPRITE_PATH: 'assets/images/units/possum_elite/type2/',
    POSSUM_ELITE_SPRITE_SCALE_FACTOR: 0.25,
    POSSUM_ELITE_DEAD_SPRITE_PATH: 'assets/images/units/possum_elite/dead/',
    POSSUM_ELITE_DEAD_SPRITE_FILES: ['possum_elite_dead1.png', 'possum_elite_dead2.png'],
    POSSUM_ELITE_DEAD_SPRITE_SCALE: 0.275,
    PROJECTILE_COLOR_POSSUM_ELITE: '#FF4500',
    POSSUM_ELITE_TURN_RATE: 12.0,
    
    // --- Possum Elite Guard ---
    POSSUM_ELITE_GUARD_HP: 200,
    POSSUM_ELITE_GUARD_SPEED: 210,
    POSSUM_ELITE_GUARD_SIZE: 19,
    POSSUM_ELITE_GUARD_COLOR: '#B87333',
    POSSUM_ELITE_GUARD_DEFAULT_WEAPON: 'POSSUM_ELITE_GUARD_WEAPON',
    POSSUM_ELITE_GUARD_SPRITE_PATH: 'assets/images/units/possum_eliteGuard/',
    POSSUM_ELITE_GUARD_SPRITE_SCALE_FACTOR: 0.45,
    POSSUM_ELITE_GUARD_DEAD_SPRITE_PATH: 'assets/images/units/possum_eliteGuard/dead/',
    POSSUM_ELITE_GUARD_DEAD_SPRITE_FILES: ['possum_eliteGuard_dead1.png', 'possum_eliteGuard_dead2.png'],
    POSSUM_ELITE_GUARD_DEAD_SPRITE_SCALE: 0.35,
    PROJECTILE_COLOR_POSSUM_ELITE_GUARD: '#00E5FF',
    XP_FOR_ELITE_GUARD_KILL: 200,
    POSSUM_ELITE_GUARD_TURN_RATE: 8.0,

    // --- Possum Boss 1 ---
    POSSUM_BOSS_1_HP: 350,
    POSSUM_BOSS_1_SPEED: 200,
    POSSUM_BOSS_1_SIZE: 25,
    POSSUM_BOSS_1_COLOR: '#703510',
    POSSUM_BOSS_1_DEFAULT_WEAPON: 'POSSUM_BOSS_1_WEAPON',
    POSSUM_BOSS_1_DEFAULT_SECONDARY_WEAPON: 'POSSUM_BOSS_1_SECONDARY',
    POSSUM_BOSS_1_GRENADE_AOE_RADIUS: 100,
    POSSUM_BOSS_1_SPRITE_PATH: 'assets/images/units/possum_boss_1/',
    POSSUM_BOSS_1_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_BOSS_1_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_1/dead/',
    POSSUM_BOSS_1_DEAD_SPRITE_FILES: ['possum_boss1_dead1.png', 'possum_boss1_dead2.png'],
    POSSUM_BOSS_1_DEAD_SPRITE_SCALE: 0.5,
    PROJECTILE_COLOR_POSSUM_BOSS_1: '#FF4500',
    XP_FOR_BOSS_KILL: 250,
    POSSUM_BOSS_1_TURN_RATE: 5.0,

    // --- Possum Boss 3 ---
    POSSUM_BOSS_3_HP: 400,
    POSSUM_BOSS_3_SPEED: 150,
    POSSUM_BOSS_3_SIZE: 25,
    POSSUM_BOSS_3_COLOR: '#4a2810',
    POSSUM_BOSS_3_DEFAULT_WEAPON: 'POSSUM_BOSS_3_WEAPON',
    POSSUM_BOSS_3_SPRITE_PATH: 'assets/images/units/possum_boss_3/',
    POSSUM_BOSS_3_SPRITE_SCALE_FACTOR: 0.6,
    POSSUM_BOSS_3_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_3/dead/',
    POSSUM_BOSS_3_DEAD_SPRITE_FILES: ['possum_boss3_dead1.png', 'possum_boss3_dead2.png', 'possum_boss3_dead3.png'],
    POSSUM_BOSS_3_DEAD_SPRITE_SCALE: 0.4,
    PROJECTILE_COLOR_POSSUM_BOSS_3: '#FF4500',
    XP_FOR_BOSS_3_KILL: 250,
    POSSUM_BOSS_3_TURN_RATE: 6.0,

    // --- Possum Boss 4 ---
    POSSUM_BOSS_4_HP: 350,
    POSSUM_BOSS_4_SPEED: 130,
    POSSUM_BOSS_4_SIZE: 20,
    POSSUM_BOSS_4_COLOR: '#1a0a2e',
    POSSUM_BOSS_4_DEFAULT_WEAPON: 'POSSUM_BOSS_4_WEAPON',
    POSSUM_BOSS_4_SPRITE_PATH: 'assets/images/units/possum_boss_4/',
    POSSUM_BOSS_4_SPRITE_SCALE_FACTOR: 0.5,
    POSSUM_BOSS_4_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_4/dead/',
    POSSUM_BOSS_4_DEAD_SPRITE_FILES: ['possum_boss_4_dead_1.png'],
    POSSUM_BOSS_4_DEAD_SPRITE_SCALE: 0.5,
    PROJECTILE_COLOR_POSSUM_BOSS_4: '#7B68EE',
    PROJECTILE_COLOR_POSSUM_BOSS_4_CHARGED: '#00FFFF',
    XP_FOR_BOSS_4_KILL: 300,
    POSSUM_BOSS_4_TURN_RATE: 5.0,

    // --- Possum Revolver ---
    POSSUM_REVOLVER_HP: 350,
    POSSUM_REVOLVER_SPEED: 180,
    POSSUM_REVOLVER_SIZE: 20,
    POSSUM_REVOLVER_COLOR: '#D2691E',
    POSSUM_REVOLVER_DEFAULT_WEAPON: 'POSSUM_REVOLVER',
    POSSUM_REVOLVER_SPRITE_PATH: 'assets/images/units/possum_revolver/',
    POSSUM_REVOLVER_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_REVOLVER_DEAD_SPRITE_PATH: 'assets/images/units/possum_revolver/dead/',
    POSSUM_REVOLVER_DEAD_SPRITE_FILES: ['possum_revolver_dead.png'],
    POSSUM_REVOLVER_DEAD_SPRITE_SCALE: 0.09,
    PROJECTILE_COLOR_POSSUM_REVOLVER: '#FFD700',
    XP_FOR_REVOLVER_KILL: 150,
    POSSUM_REVOLVER_TURN_RATE: 9.0,

    // --- Shootout Target ---
    SHOOTOUT_GRUNT_DEFAULT_WEAPON: 'POSSUM_RIFLE',
    SHOOTOUT_HEAVY_DEFAULT_WEAPON: 'POSSUM_HEAVY_WEAPON',


    // =============================================================================
    // WEAPON_DEFINITIONS
    // =============================================================================

    WEAPON_DEFINITIONS: {
        // =====================
        // RACCOON DEFAULT WEAPONS (rank-based)
        // =====================
        RACCOON_MACHINE_GUN: {
            name: "MG-1",
            damage: 7,
            rof: 7,
            range: 500,
            projectileSpeed: 650,
            projectileColor: '#ffcc00',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_silver_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            magazineSize: 30,
            maxAmmo: 210
        },
        RACCOON_PRIVATE_MG: {
            name: "MG-2",
            damage: 8,
            rof: 7,
            range: 530,
            projectileSpeed: 650,
            projectileColor: '#cc9900',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            magazineSize: 35,
            maxAmmo: 240
        },
        RACCOON_CORPORAL_MG: {
            name: "MG-3",
            damage: 8,
            rof: 8,
            range: 550,
            projectileSpeed: 650,
            projectileColor: '#bb8800',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_goldRed_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            magazineSize: 40,
            maxAmmo: 280
        },
        RACCOON_SERGEANT_MG: {
            name: "MG-4",
            damage: 9,
            rof: 8,
            range: 570,
            projectileSpeed: 700,
            projectileColor: '#aa7700',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_goldBlue_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            magazineSize: 45,
            maxAmmo: 300
        },
        RACCOON_ELITE_MG: {
            name: "ALG-1",
            damage: 10,
            rof: 10,
            range: 590,
            projectileSpeed: 800,
            projectileColor: '#996600',
            accuracyStationary: 0.95,
            accuracyMoving: 0.8,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_blackBlue_1.png',
            bulletSpriteScale: 0.65,
            isDefaultWeapon: true,
            magazineSize: 55,
            maxAmmo: 400
        },
        RACCOON_GHOST_MG: {
            name: "ALG-2",
            damage: 12,
            rof: 11,
            range: 600,
            projectileSpeed: 850,
            projectileColor: '#66ffcc',
            accuracyStationary: 0.99,
            accuracyMoving: 0.9,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_blue_2.png',
            bulletSpriteScale: 0.65,
            isDefaultWeapon: true,
            magazineSize: 100,
            maxAmmo: 500
        },
        RACCOON_MAVERICK_MG: {
            name: "Raccoon Maverick MG",
            damage: 7,
            rof: 7,
            range: 580,
            projectileSpeed: 750,
            projectileColor: '#ff6699',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            magazineSize: 30,
            maxAmmo: 120
        },
        // Shotguns
        SHOTGUN: {
            name: "SI-Shotgun",
            damage: 12,
            rof: 1.2,
            range: 300,
            projectileSpeed: 600,
            projectileColor: '#ffdd44',
            accuracyStationary: 0.7,
            accuracyMoving: 0.5,
            sfxFireKey: 'SHOTGUN_FIRE',
            muzzleFlashScale: 1.8,
            bulletLifetime: 0.4,
            bulletSpritePath: 'assets/images/projectiles/bullet_silver_1.png',
            bulletSpriteScale: 0.4,
            isDefaultWeapon: true,
            magazineSize: 6,
            maxAmmo: 30,
            phaseUnlocked: 2,
            pelletCount: 8,
            spreadAngle: 0.35,
        },

        // =====================
        // POSSUM WEAPONS (enemy-only)
        // =====================
        POSSUM_RIFLE: {
            name: "Possum Rifle",
            damage: 8,
            rof: 5,
            range: 400,
            projectileSpeed: 320,
            projectileColor: '#8B4513',
            accuracyStationary: 0.75,
            accuracyMoving: 0.45,
            sfxFireKey: 'POSSUM_RIFLE_FIRE',
            muzzleFlashScale: 0.9,
            bulletLifetime: 1.3,
            bulletSpritePath: 'assets/images/projectiles/bullet_silver_1.png',
            bulletSpriteScale: 0.4,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_HEAVY_WEAPON: {
            name: "Possum Heavy MG",
            damage: 18,
            rof: 2,
            range: 500,
            projectileSpeed: 500,
            projectileColor: '#ff47478e',
            accuracyStationary: 0.85,
            accuracyMoving: 0.30,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 1.4,
            bulletSize: 5,
            bulletSpritePath: 'assets/images/projectiles/bullet_possumHeavy_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_SNIPER_RIFLE: {
            name: "Possum Sniper Rifle",
            damage: 35,
            rof: 0.2,
            range: 600,
            projectileSpeed: 900,
            projectileColor: '#FF2400',
            accuracyStationary: 1.0,
            accuracyMoving: 1.0,
            sfxFireKey: 'SNIPER_RIFLE_FIRE',
            muzzleFlashScale: 1.2,
            bulletLifetime: 2.0,
            bulletSize: 6,
            bulletSpritePath: 'assets/images/projectiles/bullet_possumSniper_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_ELITE_WEAPON: {
            name: "Possum Elite Rifle",
            damage: 12,
            rof: 7,
            range: 550,
            projectileSpeed: 550,
            projectileColor: '#8B4513',
            accuracyStationary: 0.95,
            accuracyMoving: 0.90,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 1.2,
            bulletSpritePath: 'assets/images/projectiles/bullet_possumElite_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            magazineSize: 40,
            maxAmmo: Infinity
        },
        POSSUM_BOSS_1_WEAPON: {
            name: "Possum Boss 1 Grenade Launcher",
            damage: 55,
            rof: 0.25,
            range: 650,
            projectileSpeed: 650,
            projectileColor: '#FF4500',
            accuracyStationary: 1.0,
            accuracyMoving: 1.0,
            sfxFireKey: 'POSSUM_BOSS_1_WEAPON_FIRE',
            muzzleFlashScale: 1.8,
            bulletLifetime: 2.2,
            grenadeSpritePath: 'assets/images/projectiles/grenade_boss.png',
            grenadeSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_BOSS_1_SECONDARY: {
            name: "Possum Boss 1 Heavy Repeater",
            damage: 35,
            rof: 4,
            range: 650,
            projectileSpeed: 650,
            projectileColor: '#FF8C00',
            accuracyStationary: 0.80,
            accuracyMoving: 0.40,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.3,
            bulletLifetime: 2.2,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_boss.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_REVOLVER: {
            name: "Possum Revolver",
            damage: 12,
            rof: 8,
            range: 520,
            projectileSpeed: 580,
            projectileColor: '#FFD700',
            accuracyStationary: 0.85,
            accuracyMoving: 0.85,
            sfxFireKey: 'POSSUM_REVOLVER_FIRE',
            muzzleFlashScale: 1.1,
            bulletLifetime: 1.8,
            bulletSpritePath: 'assets/images/projectiles/bullet_possumRevolver_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        
        POSSUM_BOSS_3_WEAPON: {
            name: "Possum Boss 3 Minigun",
            damage: 8,
            rof: 17,
            range: 500,
            projectileSpeed: 700,
            projectileColor: '#FF4500',
            accuracyStationary: 0.70,
            accuracyMoving: 0.35,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 1.8,
            bulletSize: 4,
            bulletSpritePath: 'assets/images/projectiles/bullet_pw001_1.png',
            bulletSpriteScale: 0.4,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_BOSS_4_WEAPON: {
            name: "Boss 4 Rail Gun",
            damage: 25,
            rof: 1.5,
            range: 700,
            projectileSpeed: 1200,
            projectileColor: '#7B68EE',
            accuracyStationary: 0.90,
            accuracyMoving: 0.75,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 2.0,
            bulletLifetime: 2.0,
            bulletSize: 8,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_boss.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_ELITE_GUARD_WEAPON: {
            name: "Elite Guard Energy Repeater",
            damage: 14,
            rof: 12,
            range: 580,
            projectileSpeed: 800,
            projectileColor: '#00E5FF',
            accuracyStationary: 0.92,
            accuracyMoving: 0.72,
            sfxFireKey: 'POSSUM_ELITE_GUARD_WEAPON_FIRE',
            muzzleFlashScale: 1.2,
            bulletLifetime: 1.5,
            bulletSpritePath: 'assets/images/projectiles/bullet_pw001_1.png',
            bulletSpriteScale: 0.35,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_TURRET_WEAPON: {
            name: 'Possum Turret',
            damage: 40,
            rof: 2.5,
            range: 500,
            projectileSpeed: 500,
            projectileColor: '#ff6600',
            accuracyStationary: 0.85,
            bulletLifetime: 2.0,
            bulletSize: 6,
            bulletSpritePath: 'assets/images/projectiles/bullet_possumTurret_1.png',
            bulletSpriteScale: 0.6,
            isDefaultWeapon: true,
            sfxFireKey: 'POSSUM_BOSS_1_WEAPON_FIRE',
            isDefaultWeapon: true,
            maxAmmo: Infinity,
            muzzleFlashScale: 0.5
        },

        // =====================
        // ADVANCED WEAPONS (for weapon crates)
        // =====================
        PLASMA_RIFLE: {
            name: "Plasma Rifle",
            damage: 15,
            rof: 10,
            range: 450,
            projectileSpeed: 700,
            projectileColor: '#00ffcc',
            accuracyStationary: 0.85,
            accuracyMoving: 0.65,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.2,
            bulletLifetime: 1.0,
            bulletSpritePath: 'assets/images/projectiles/bullet_plasmaRifle_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 40,
            maxAmmo: 160,
            phaseUnlocked: 3,
            crateColor: '#00ffcc',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/pr-1.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/pr-1_empty.png'
        },
        PW001: {
            name: "PW-001",
            damage: 18,
            rof: 20,
            range: 350,
            projectileSpeed: 750,
            projectileColor: '#ff4400',
            accuracyStationary: 0.6,
            accuracyMoving: 0.4,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 2.0,
            bulletLifetime: 0.5,
            bulletSpritePath: 'assets/images/projectiles/bullet_pw001_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 60,
            maxAmmo: 240,
            crateColor: '#ff4400',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/pw001.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/pw001_empty.png',
            phaseUnlocked: 4,
        },
        
        // Snipers
        X1: {
            name: "X-1",
            damage: 75,
            rof: 1.5,
            range: 800,
            projectileSpeed: 1500,
            projectileColor: '#ff00ff',
            accuracyStationary: 0.95,
            accuracyMoving: 0.70,
            sfxFireKey: 'LASER_WEAPON_FIRE_2',
            muzzleFlashScale: 2.0,
            bulletLifetime: 1.5,
            bulletSize: 8,
            bulletSpritePath: 'assets/images/projectiles/bullet_x1_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 8,
            maxAmmo: 32,
            phaseUnlocked: 5,
            crateColor: '#ff00ff',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/x1.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/x1_empty.png'
        },
        MOSIN_SNIPER: {
            name: "Mosin Sniper",
            damage: 80,
            rof: 0.5,
            range: 900,
            projectileSpeed: 950,
            projectileColor: '#ff6600',
            accuracyStationary: 0.9,
            accuracyMoving: 0.5,
            sfxFireKey: 'SNIPER_RIFLE_FIRE',
            muzzleFlashScale: 2.5,
            bulletLifetime: 4.0,
            bulletSize: 7,
            bulletSpritePath: 'assets/images/projectiles/bullet_mosin_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 5,
            maxAmmo: 20,
            crateColor: '#ff6600',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/mosin.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/mosin_empty.png',
            phaseUnlocked: 7,
        },

        // Shotguns
        G14: {
            name: "G-14",
            damage: 42,
            rof: 6.5,
            range: 400,
            projectileSpeed: 650,
            projectileColor: '#ffaa00',
            accuracyStationary: 0.5,
            accuracyMoving: 0.3,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 0.8,
            bulletSize: 5,
            bulletSpritePath: 'assets/images/projectiles/bullet_g14_1.png',
            bulletSpriteScale: 0.7,
            isDefaultWeapon: false,
            magazineSize: 10,
            maxAmmo: 30,
            pelletCount: 3,
            spreadAngle: 0.15,
            crateColor: '#ffaa00',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/s400.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/s400_empty.png',
            phaseUnlocked: 4,
        },
        SG7: {
            name: "SG-7",
            damage: 42,
            rof: 6.5,
            range: 450,
            projectileSpeed: 650,
            projectileColor: '#ffaa00',
            accuracyStationary: 0.5,
            accuracyMoving: 0.3,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 1.0,
            bulletSize: 5,
            bulletSpritePath: 'assets/images/projectiles/bullet_g14_1.png',
            bulletSpriteScale: 0.7,
            isDefaultWeapon: false,
            magazineSize: 15,
            maxAmmo: 45,
            pelletCount: 3,
            spreadAngle: 0.15,
            crateColor: '#ffaa00',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/g14.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/g14_empty.png',
            phaseUnlocked: 6,
        },

    },

    // =====================
    // STATIONARY TURRETS
    // =====================
    POSSUM_TURRET: {
        spriteScale: 0.3,
        muzzleOffset: 20,
        sfxShutdownKey: 'COMPUTER_HACK_GLITCH'
    },
    POSSUM_ANTI_AIR_TURRET: {
        spriteScale: 0.3,
        muzzleOffset: 20,
        sfxShutdownKey: 'COMPUTER_HACK_GLITCH'
    },

    // =============================================================================
    // AI_BEHAVIOR
    // =============================================================================
    AI: {
        POSSUM_GRUNT: {
            DETECTION_RANGE: 200,
            PATROL_MIN_RADIUS: 80,
            PATROL_MAX_RADIUS: 200,
            PATROL_POINT_WORLD_MARGIN_BUFFER: 20,
            PATROL_WAIT_BASE: 1.5,
            PATROL_WAIT_RANDOM_ADD: 2.0,
            CHASE_PREDICTION_TIME_FACTOR: 0.25,
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 8,
            ENGAGE_RANGE_BUFFER: 30,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 2,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.5,
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75,
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 10,
        },
        POSSUM_HEAVY: {
            DETECTION_RANGE: 270,
            MAX_CHASE_DISTANCE_FROM_POST_FACTOR: 0.95,
            GUARD_POST_POSITION_TOLERANCE: 5,
            SUSPICIOUS_STATE_SCAN_DURATION: 0.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.15,
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.5,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 3,
            MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY: 40,
            ENGAGE_RANGE_BUFFER: 25,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.0,
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75,
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 4,
        },
        POSSUM_SNIPER: {
            DETECTION_RANGE: 450,
            SETUP_TIME_SECONDS: 2.5,
            FIRE_COOLDOWN_SECONDS: 5.0,
            REPOSITION_CHANCE_AFTER_SHOT: 0.6,
            REPOSITION_MAX_DISTANCE: 300,
            REPOSITION_MIN_DISTANCE: 100
        },
        POSSUM_ELITE: {
            DETECTION_RANGE: 320,
            PATROL_MIN_RADIUS: 100,
            PATROL_MAX_RADIUS: 250,
            PATROL_WAIT_BASE: 1.0,
            PATROL_WAIT_RANDOM_ADD: 1.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.30,
            ENGAGE_RANGE_BUFFER: 25,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            STRAFE_COOLDOWN: 0.4,
            STRAFE_DISTANCE: 120,
            STRAFE_CHANCE: 0.7,
            SHOTS_BEFORE_REPOSITION: 12,
            REPOSITION_DISTANCE: 150,
            RETREAT_HP_THRESHOLD: 0.35,
            RETREAT_MIN_ENEMIES: 2,
            RETREAT_DISTANCE: 200,
            FLANK_ENABLED: true,
            GRENADE_DETECTION_RANGE: 250,
            GRENADE_DODGE_COOLDOWN: 1.5,
            GRENADE_DODGE_DISTANCE: 120,
            GRENADE_IMMINENT_FUSE_THRESHOLD: 1.2,
        },
        POSSUM_BOSS_1: {
            ARENA_RADIUS: 650,
            DETECTION_RANGE: 550,
            PREFERRED_GRENADE_RANGE_MAX: 450,
            MIN_ENGAGEMENT_DISTANCE: 120,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1500,

            GRENADE_COOLDOWN_BETWEEN_SHOTS: 0.6,
            GRENADES_PER_VOLLEY: 8,
            GRENADE_TARGET_SPREAD_RADIUS: 270,

            MG_BURST_SIZE: 10,
            MG_COOLDOWN_AFTER_BURST: 1.5,

            DEATH_EXPLOSION_RADIUS: 200,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            REPOSITION_DURATION_MAX_SECONDS: 2.0,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 8],
                countPerPhaseBonus: 2,
                spawnRadius: 200,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_sniper', weight: 3 },
                    { type: 'possum_elite', weight: 2 },
                    { type: 'possum_eliteGuard', weight: 0.5}
                ]
            }
        },
        POSSUM_REVOLVER: {
            ARENA_RADIUS: 450,
            DETECTION_RANGE: 380,
            RELOAD_TIME_SECONDS: 2.0,
            BURST_SIZE: 8,
            STRAFE_DISTANCE: 150,
            STRAFE_CHANCE: 0.85,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1600,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 3],
                countPerPhaseBonus: 0.4,
                spawnRadius: 220,
                unitPool: [
                    { type: 'possum_grunt', weight: 3 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
        POSSUM_BOSS_3: {
            ARENA_RADIUS: 650,
            DETECTION_RANGE: 550,
            MIN_ENGAGEMENT_DISTANCE: 120,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1500,

            DEATH_EXPLOSION_RADIUS: 200,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0,
            MIN_CHASE_DEVIATION_UPDATE_INTERVAL: 0.5,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4,
            CHASE_PREDICTION_TIME_FACTOR: 0.25,

            initialGuardPack: {
                enabled: true,
                countRange: [2, 8],
                countPerPhaseBonus: 2,
                spawnRadius: 220,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_elite', weight: 2 },
                    { type: 'possum_eliteGuard', weight: 1}
                ]
            }
        },

        POSSUM_BOSS_4: {
            ARENA_RADIUS: 680,
            DETECTION_RANGE: 600,
            MIN_ENGAGEMENT_DISTANCE: 350,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1500,

            DEATH_EXPLOSION_RADIUS: 250,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            CHASE_DESTINATION_REFRESH_INTERVAL: 0.8,
            MIN_CHASE_DEVIATION_UPDATE_INTERVAL: 0.4,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4,
            CHASE_PREDICTION_TIME_FACTOR: 0.3,

            CHARGED_SHOT_COOLDOWN: 4.0,

            initialGuardPack: {
                enabled: true,
                countRange: [3, 5],
                countPerPhaseBonus: 0,
                spawnRadius: 240,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_heavy', weight: 2 },
                    { type: 'possum_elite', weight: 3 }
                ]
            }
        },

        POSSUM_ELITE_GUARD: {
            ARENA_RADIUS: 620,
            DETECTION_RANGE: 550,
            MIN_ENGAGEMENT_DISTANCE: 140,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1400,

            DEATH_EXPLOSION_RADIUS: 180,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0,
            MIN_CHASE_DEVIATION_UPDATE_INTERVAL: 0.5,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4,
            CHASE_PREDICTION_TIME_FACTOR: 0.30,

            initialGuardPack: {
                enabled: false,
                countRange: [2, 6],
                countPerPhaseBonus: 0,
                spawnRadius: 220,
                unitPool: [
                    { type: 'possum_elite', weight: 3 },
                    { type: 'possum_heavy', weight: 2 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_grunt', weight: 1 }
                ]
            }
        },

    },
    

    // =============================================================================
    // PROJECTILES_WEAPONS
    // =============================================================================
    PROJECTILE_SIZE: 3,
    PROJECTILE_COLOR_RACCOON: '#ff91008f',
    PROJECTILE_COLOR_RACCOON_PRIVATE: '#fbff008f',
    PROJECTILE_COLOR_RACCOON_CORPORAL: '#00ff228e',
    PROJECTILE_COLOR_RACCOON_SERGEANT: '#00ff957c',
    PROJECTILE_COLOR_RACCOON_ELITE: '#00eeff9a',
    PROJECTILE_COLOR_RACCOON_GHOST: '#000000',
    PROJECTILE_COLOR_RACCOON_MAVERICK: '#8c00ff98',
    PROJECTILE_COLOR_POSSUM: '#ff3c008e',
    GRENADE_PROJECTILE_COLOR: '#228B22',
    PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER: 0,

    WEAPON_SETTINGS: {
        ROF_JITTER_PERCENTAGE: 0.20
    },

    PROJECTILE_SPRITE_OFFSET_Y: 5,

    PROJECTILES: {
        BULLET: {
            LIFETIME: 0.7,
            MAX_SPREAD_ANGLE_RADIANS: Math.PI / 6,
            DESPAWN_WORLD_BUFFER: 100,
            SPRITE_PATH: 'assets/images/projectiles/bullet_gold_1.png',
            SPRITE_SCALE: 0.5
        },
        GRENADE: {
            SPRITE_PATH: 'assets/images/projectiles/grenade.png',
            SPRITE_SCALE: 0.3,
            SIZE: 8,
            MIN_FLIGHT_TIME: 0.05,
            ARC_PEAK_HEIGHT_MIN: 20,
            ARC_PEAK_HEIGHT_DISTANCE_FACTOR: 0.2,
            MAX_LIFETIME_BUFFER: 1.0,
            SHADOW: {
                COLOR_RGBA: [0, 0, 0, 0.3],
                Y_OFFSET_FACTOR: 0.5,
                ELLIPSE_Y_RADIUS_FACTOR: 0.5,
                PEAK_HEIGHT_MULTIPLIER_SCALE: 1.5,
                MAX_REDUCTION_SCALE: 0.8
            },
            FUSE_BLINK: {
                THRESHOLD_SECONDS: 0.5,
                COLOR: "rgba(255, 0, 0, 0.45)",
                SIZE_ADDITION: 0
            }
        }
    },

    // =============================================================================
    // ROSTER_CAMPAIGN
    // =============================================================================
    INITIAL_ROSTER_SIZE: 4,
    NEW_RECRUITS_PER_MISSION_WIN: 1,
    MAX_SQUAD_SIZE_MVP: 4,
    MAX_TOTAL_ROSTER_SIZE: 100,

    FORMATION_INDEX: 3,
    INITIAL_FORMATION_SPACING: 1.5,

    // =============================================================================
    // WORLD_TERRAIN (generic settings - biome-specific terrain moved to js/biomes/)
    // =============================================================================

    // =============================================================================
    // Z_INDEX
    // =============================================================================
    Z_INDEX: {
        BACKGROUND: -5000,
        DESTROYED_OBSTACLE: -10,
        USED_PICKUP: -10,
        DESTROYED_BUILDING: -10,
        PICKUP: 0,
        PROJECTILE: 0,
        DEAD_UNIT: 10,
        DEFAULT: 100,
        VISUAL_EFFECT: 300,
        FLYING_BIRD: 2000,
        UFO: 2500,
        NIGHT_OVERLAY: 4000,
    },

    // =============================================================================
    // OBSTACLES (generic only - biome-specific obstacles moved to js/biomes/)
    // =============================================================================

    // Fences (generic - used by borders across all biomes)
    FENCE_BARBED_SPRITE_PATH: 'assets/images/objects/fences/barbed/',
    FENCE_BARBED_SHORT_SPRITE_FILES: [
        'fence_barbed_straight_short_1.png', 'fence_barbed_straight_short_2.png', 'fence_barbed_straight_short_3.png', 'fence_barbed_straight_short_4.png', 'fence_barbed_straight_short_5.png', 'fence_barbed_straight_short_6.png'
    ],
    FENCE_BARBED_LONG_SPRITE_FILES: ['fence_barbed_straight_long_1.png', 'fence_barbed_straight_long_2.png', 'fence_barbed_straight_long_3.png', 'fence_barbed_straight_long_4.png', 'fence_barbed_straight_long_5.png', 'fence_barbed_straight_long_6.png'],

    FENCE_BARBED_LONG_BORDER_SPRITE_FILES: ['fence_barbed_straight_long_1.png', 'fence_barbed_straight_long_2.png', 'fence_barbed_straight_long_3.png', 'fence_barbed_straight_long_4.png', 'fence_barbed_straight_long_5.png', 'fence_barbed_straight_long_6.png'],

    POSSUM_BARRACKS_1_SPRITE_PATH: 'assets/images/objects/possums/barracks/',
    POSSUM_BARRACKS_1_SPRITE_FILES: [
        { normal: 'possum_barracks_1.png', destroyed: 'possum_barracks_1_destroyed.png' },
        { normal: 'possum_barracks_2.png', destroyed: 'possum_barracks_2_destroyed.png' },
    ],
    
    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_FILES: [
        { normal: 'possum_hut_1.png', destroyed: 'possum_hut_1_destroyed.png' },
    ],

    POSSUM_HUT_ROUND_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_ROUND_SPRITE_FILES: [
        { normal: 'possum_hut_4.png', destroyed: 'possum_hut_4_destroyed.png' },
        { normal: 'possum_hut_5.png', destroyed: 'possum_hut_5_destroyed.png' }
    ],

    POSSUM_BUILDING_LARGE_SPRITE_PATH: 'assets/images/objects/possums/general/',
    POSSUM_BUILDING_LARGE_SPRITE_FILES: [
        { normal: 'possum_building_large_1.png', destroyed: 'possum_building_large_1.png' },
        { normal: 'possum_warehouse.png', destroyed: 'possum_building_large_1.png' },
    ],

    EMPTY_POSSUM_HUT_2_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    EMPTY_POSSUM_HUT_2_SPRITE_FILES: [
        { normal: 'possum_hut_round_1_jungle.png', destroyed: 'possum_hut_2_destroyed.png' },
        { normal: 'possum_hut_square_1_jungle.png', destroyed: 'possum_hut_2_destroyed.png' },
        { normal: 'possum_building_small_1.png', destroyed: 'possum_hut_2_destroyed.png' },
        { normal: 'possum_building_small_2.png', destroyed: 'possum_hut_2_destroyed.png' },
    ],

    POSSUM_RELAY_TOWER_SPRITE_PATH: 'assets/images/objects/possums/towers/',
    POSSUM_RELAY_TOWER_SPRITE_FILES: [
        { normal: 'possum_tower_2.png', destroyed: 'possum_tower_2_destroyed.png' },
        { normal: 'possum_tower_3.png', destroyed: 'possum_tower_3_destroyed.png' }
    ],

    // Helipads
    HELIPAD_SQUARE_SPRITE_PATH: 'assets/images/objects/helipad/',
    HELIPAD_SQUARE_SPRITE_FILES: ['concrete_helipad_square_1.png', 'concrete_helipad_square_2.png', 'concrete_helipad_square_3.png', 'concrete_helipad_square_4.png', 'concrete_helipad_square_5.png'],

    // Barrels
    SINGLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    SINGLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_1.png', destroyed: 'barrel_red_1_destroyed.png'}],

    DOUBLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    DOUBLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_2.png', destroyed: 'barrel_red_2_destroyed.png'}],

    TRIPLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    TRIPLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_3.png', destroyed: 'barrel_red_3_destroyed.png'}],

    // Pickups
    AMMO_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/ammo/',
    AMMO_PICKUP_SPRITE_FILES: [
        { normal: 'ammo_pickup_crate.png', destroyed: 'ammo_pickup_crate_empty.png' }
    ],

    HEALTH_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/health/',
    HEALTH_PICKUP_SPRITE_FILES: [
        { normal: 'health_pickup_crate.png', destroyed: 'health_pickup_crate_empty.png' }
    ],

    GRENADE_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/grenade/',
    GRENADE_PICKUP_SPRITE_FILES: [
        { normal: 'grenade_pickup_crate.png', destroyed: 'grenade_pickup_crate_empty.png' }
    ],


    INTEL: {
        INTERACTION_RADIUS: 100,
        SPAWN_DISTANCE: 450,
        SPRITE_PATH: 'assets/images/objects/possums/intel/',
        SPRITE_FILES: [
            { on: 'intel_console_1_on.png', off: 'intel_console_1_off.png' },
            { on: 'intel_console_2_on.png', off: 'intel_console_2_off.png' },
            { on: 'intel_console_3_on.png', off: 'intel_console_3_off.png' },
        ],
        SPRITE_SCALE: 0.25,
    },

    OBSTACLE_DEFINITIONS: [
        {
            type: 'fence_barbed_straight_short', name: 'Barbed Wire Fence Straight Short',
            color: '#a7a7a7', destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.46), radiusY: (h => h * 0.08) },
            canBeFlipped: true,
            placementBuffer: 150,
        },
        {
            type: 'fence_barbed_straight_long', name: 'Barbed Wire Fence Straight Long',
            color: '#8B4513', destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.08), width: (w => w * 0.96), height: (h => h * 0.015) },
            canBeFlipped: true,
            placementBuffer: 160,
        },
        {
            type: 'fence_barbed_straight_long_border', name: 'Barbed Wire Fence Straight Long Border',
            color: '#8B4513', destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.08), width: (w => w * 0.98), height: (h => h * 0.03) },
            canBeFlipped: true,
            placementBuffer: 160,
        },
        {
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            canBeFlipped: false,
            spawnWeight: 3,
            explosionDamage: 50, explosionAoeRadius: 100,
            spriteScale: 0.13,
            spriteDestroyedScale: 0.13,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.3), offsetY: (h => h * 0.066), width: (w => w * 0.5), height: (h => h * 0.86) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_DESTROYED',
            flameCount: 1,
            flameOffsetY: 0,
        },
        {
            type: 'explosive_barrel_double', name: 'Double Explosive Barrel', color: '#A00000',
            destructible: true, hp: 15, maxHp: 15,
            blocksMovement: true, providesCover: true,
            canBeFlipped: false,
            spawnWeight: 2,
            explosionDamage: 75, explosionAoeRadius: 120,
            spriteScale: 0.09,
            spriteDestroyedScale: 0.1,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.2), offsetY: (h => h * 0.066), width: (w => w * 0.68), height: (h => h * 0.65) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_DESTROYED',
            flameCount: 2,
            flameOffsetY: 0,
        },
        {
            type: 'explosive_barrel_cluster', name: 'Cluster Explosive Barrel', color: '#A00000',
            destructible: true, hp: 20, maxHp: 20,
            blocksMovement: true, providesCover: true,
            canBeFlipped: false,
            spawnWeight: 2,
            explosionDamage: 100, explosionAoeRadius: 160,
            spriteScale: 0.09,
            spriteDestroyedScale: 0.1,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.03), offsetY: (h => h * 0.05), width: (w => w * 0.7), height: (h => h * 0.7) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_CLUSTER_DESTROYED',
            flameCount: 4,
            flameOffsetY: 0,
        },

        {
            type: 'possum_relay_tower', name: 'Possum Relay Tower', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            bulletDamageMultiplier: 0.5,
            blocksMovement: true, providesCover: true,
            phaseUnlocked: 3,
            spawnWeight: 0.01,
            spriteScale: 0.6,
            spriteDestroyed: 'assets/images/objects/possums/towers/possum_tower_2_destroyed.png',
            spriteDestroyedScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 1.1), radiusX: (w => w * 0.40), radiusY: (h => h * 0.25) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 230,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4],
                countPerPhaseBonus: 0.1,
                spawnRadius: 230,
                unitPool: [
                    { type: 'possum_grunt', weight: 5 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_boss_1', weight: 0.1 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 1 }
                ]
            }
        },
        {
            type: 'intel_console', name: 'Intel Console', color: '#2e5986',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false, placementBuffer: 120,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.5), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
            isIntelConsole: true
        },
        {
            type: 'possum_turret', name: 'Possum Turret', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true, isDecoration: false,
            canBeFlipped: false,
            isPossumTurret: true,
            spawnWeight: 1, phaseUnlocked: 3, spawnLimit: 6,
            spriteScale: 0.3,
            sfxOnDestroy: 'STRUCTURE_METAL_DESTROYED',
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.48), radius: (w => w * 0.18) },
            placementBuffer: 250,
            decorationBuffer: 250,
        },
        {
            type: 'possum_anti_air_turret', name: 'Possum Anti-Air Turret', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true, isDecoration: false,
            canBeFlipped: false,
            isPossumAntiAirTurret: true,
            spawnWeight: 0, phaseUnlocked: 3, spawnLimit: 6,
            spriteScale: 0.3,
            sfxOnDestroy: 'STRUCTURE_METAL_DESTROYED',
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.5), radius: (w => w * 0.30) },
            placementBuffer: 250,
            decorationBuffer: 250,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4],
                countPerPhaseBonus: 0.1,
                spawnRadius: 230,
                unitPool: [
                    { type: 'possum_grunt', weight: 5 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_boss_1', weight: 0.1 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 1 }
                ]
            }
        },
        {
            type: 'extraction_zone', name: 'Extraction Zone', color: '#3cc1ff',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spriteNormal: null, isDecoration: false,
            phaseUnlocked: 2,
            spawnWeight: 0,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.1), width: (w => w * 0.8), height: (h => h * 0.8) },
        },
        {
            type: 'helipad_concrete_square_1', name: 'Square Concrete Helipad', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spawnWeight: 2, isDecoration: false,
            spawnLimit: 1,
            phaseUnlocked: 2,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.1), width: (w => w * 0.8), height: (h => h * 0.8) },
            placementBuffer: 100,
        },
        {
            type: 'building_c_shape', name: 'C-Shaped Building', color: '#808080',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: (w => w * 0.8), offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
        {
            type: 'building_u_shape', name: 'U-Shaped Building', color: '#707070',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.15), height: (h => h) },
                { type: 'rectangle', offsetX: (w => w * 0.85), offsetY: 0, width: (w => w * 0.15), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: (h => h * 0.8), width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
        {
            type: 'building_l_shape', name: 'L-Shaped Building', color: '#787878',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: (h => h * 0.8), width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
    ],

    PICKUP_DEFINITIONS: [
        {
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.5,
            pickupType: 'grenade', pickupQuantity: 2,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
            isDecoration: false,
        },
        {
            type: 'pickup_ammo_crate', name: 'Ammo Crate', color: '#4169E1',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.5,
            pickupType: 'ammo', pickupQuantity: 120,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
            isDecoration: false,
        },
        {
            type: 'pickup_health', name: 'Health Crate', color: '#FF69B4',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.9,
            pickupType: 'health', pickupQuantity: 30,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.875), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
            isDecoration: false,
        },
        {
            type: 'pickup_weapon_crate', name: 'Weapon Crate', color: '#FFD700',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.1,
            pickupType: 'weapon', 
            baseCrateSprite: 'assets/images/objects/pickups/weapons/crate_base.png',
            spriteScale: 0.15,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
            isDecoration: false,
        },
        
    ],

    // =============================================================================
    // LEVEL_GENERATION
    // =============================================================================
    LEVEL_GENERATION: {
        WORLD_MARGIN: 5,
        BORDER_WIDTH: 1,
        BORDER_COLOR: '#25221D',
        BORDER_OBSTACLE_TYPE: 'fence_barbed_straight_long_border',
        PLAYER_SPAWN_ZONE: {
            MIN_WIDTH: 680,
            MAX_WIDTH: 900,
            WIDTH_FACTOR: 0.80,
            MIN_HEIGHT: 400,
            MAX_HEIGHT: 700,
            HEIGHT_FACTOR: 0.2,
            INTERNAL_PADDING_FACTOR: 20.0,
            PLAYER_SPAWN_ZONE_RESTRICTED_OBSTACLE_TYPES_GENERIC: [
                'possum_relay_tower',
                'fence_barbed_straight_short',
                'fence_barbed_straight_long',
                'fence_barbed_straight_long_border',
                'possum_turret',
                'possum_anti_air_turret',
                'explosive_barrel',
                'explosive_barrel_double',
                'explosive_barrel_cluster',
                'pickup_health'
            ]
        },
        OBSTACLES: {
            BASE_COUNT: 50,
            WORLD_SIZE_FALLBACK_FACTOR: 0.9,
            RANDOM_ADDITION_MAX: 10,
            PLACEMENT_MAX_ATTEMPTS: 5
        },
        PICKUPS: {
            BASE_COUNT: 3,
            PHASE_INCREMENT: 2,
            RANDOM_ADDITION_MAX: 3,
            PLACEMENT_MAX_ATTEMPTS: 2
        },
        PLAYER_SPAWN_PLACEMENT: {
            MAX_ATTEMPTS: 5,
            FALLBACK_SPACING_FACTOR: 10.0,
            PLAYER_SPAWN_AREA: 0.5
        },
        DECORATIONS: {
            GRASS_CLUTTER: {
                MIN_SCALE: 0.7,
                MAX_SCALE: 1.0
            },
            TREES: {
                MIN_SCALE: 0.8,
                MAX_SCALE: 1.
            },
            BUSHES: {
                MIN_SCALE: 0.8,
                MAX_SCALE: 1.
            },
            ROCKS: {
                MIN_SCALE: 0.7,
                MAX_SCALE: 1.
            }
        },
        EXTRACTION_ZONE_SETTINGS: {
            SPRITE_PATH: null,
            FALLBACK_COLOR: 'rgba(60, 120, 255, 0.35)',
            WIDTH: 260,
            HEIGHT: 260,
            NAME: "Extraction Zone",
            PLACEMENT_MARGIN_FROM_EDGE: 30,
            MIN_DISTANCE_FROM_PLAYER_SPAWN: 900,
            MAX_PLACEMENT_ATTEMPTS: 1,
            REVEAL_DURATION: 1.5,
            PARTICLE_COUNT: 20,
            SCAN_LINE_SPEED: 80,
            PRIMARY_COLOR: '#00FFD4',
            ACCENT_COLOR: '#FFFFFF',
            GLOW_COLOR: 'rgba(0, 255, 212, 0.15)',
            BRACKET_LENGTH: 20,
            BRACKET_THICKNESS: 3,
            PULSE_SPAWN_INTERVAL: 2.0,
            PULSE_LIFETIME: 2.5,
            LABEL_TEXT: 'EXTRACT',
        },
        TREE_FALL_SETTINGS: {
            ENABLED: true,
            FALL_CHANCE: 0.45,
            MAX_PLACEMENT_ATTEMPTS: 1,
            PLACEMENT_DISTANCE_MIN: 5,
            PLACEMENT_DISTANCE_MAX: 20
        },
    },

    // =============================================================================
    // ENEMY_SPAWNING
    // =============================================================================
    ENEMY_SPAWNING: {
        QUADRANT_SPAWNING_ENABLED: true,
        QUADRANT_COLS: 3,
        QUADRANT_ROWS: 3,
        QUADRANT_SCALING_ENABLED: true,
        QUADRANT_BASE_COLS: 3,
        QUADRANT_BASE_ROWS: 3,
        QUADRANT_SCALE_COLS_PER_WORLD_FACTOR: 2,
        QUADRANT_SCALE_ROWS_PER_WORLD_FACTOR: 2,
        QUADRANT_RANDOMNESS_FACTOR: 0.3,
        QUADRANT_MIN_COLS: 3,
        QUADRANT_MIN_ROWS: 3,
        QUADRANT_MAX_COLS: 16,
        QUADRANT_MAX_ROWS: 9,
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 20,
        RANDOM_ADDITION_FACTOR_MAX: 0.1,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0,
        SMALL_GROUP_CHANCE: 0.6,
        SMALL_GROUP_SIZE_MIN: 2,
        SMALL_GROUP_SIZE_MAX: 10,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 650,
        LEADER_PLACEMENT_MAX_ATTEMPTS: 5,
        MEMBER_PLACEMENT_MAX_ATTEMPTS: 5,
        GROUP_SPREAD_BASE: 80,
        GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20,
        HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.3,

        POSSUM_HUT_SPAWNING: {
            MAX_ACTIVE_SPAWNING_HUTS_BASE: 1,
            MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS: 10,
            SPAWN_COOLDOWN_MAX_SECONDS: 60,
            UNITS_PER_SPAWN_MIN: 1,
            UNITS_PER_SPAWN_MAX: 3,
            TIME_BETWEEN_UNITS_IN_BURST_MIN: 0.3,
            TIME_BETWEEN_UNITS_IN_BURST_MAX: 1.9,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.1, // 10% increase per phase
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 0,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 1,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 400,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -125,
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -55,
            SPAWN_AREA_WIDTH: 80,
            SPAWN_PHASING_DURATION: 0.1,
            DEBUG_DRAW_SPAWN_AREAS: true,
            DEBUG_DRAW_HUT_STATUS_TEXT: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 15,
            MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT: 2,
            INITIAL_MOVE_OUT_DISTANCE: 25,
            INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE: 0.8,
            MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS: 0.1,
            UNITS_TO_SPAWN_ON_DAMAGE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE: 0.80,
            SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE: 3,
            MAX_UNITS_PER_HUT_BASE: 6,
            MAX_UNITS_PER_HUT_PHASE_INCREMENT: 2,
        },

        POSSUM_BARRACKS_SPAWNING: {
            MAX_ACTIVE_SPAWNING_BARRACKS_BASE: 1,
            MAX_ACTIVE_SPAWNING_BARRACKS_INCREMENT_PER_PHASE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS: 10,
            SPAWN_COOLDOWN_MAX_SECONDS: 60,
            UNITS_PER_SPAWN_MIN: 2,
            UNITS_PER_SPAWN_MAX: 4,
            TIME_BETWEEN_UNITS_IN_BURST_MIN: 0.2,
            TIME_BETWEEN_UNITS_IN_BURST_MAX: 1.2,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.15, // 15% increase per phase
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 0,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 0.8,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 450,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -150,
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -80,
            SPAWN_AREA_WIDTH: 150,
            SPAWN_PHASING_DURATION: 0.2,
            DEBUG_DRAW_SPAWN_AREAS: true,
            DEBUG_DRAW_HUT_STATUS_TEXT: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 15,
            MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT: 2,
            INITIAL_MOVE_OUT_DISTANCE: 25,
            INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE: 0.8,
            MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS: 0.8,
            UNITS_TO_SPAWN_ON_DAMAGE: 2,
            SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE: 0.8,
            SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE: 2.5,
            MAX_UNITS_PER_BARRACKS_BASE: 10,
            MAX_UNITS_PER_BARRACKS_PHASE_INCREMENT: 3,
        }
    },

    // =============================================================================
    // HOSTAGES
    // =============================================================================
    HOSTAGE_SETTINGS: {
        HP: 35,
        SPEED: 110,
        COLOR: '#ADD8E6',
        NEUTRAL_COLOR: '#FFD700',
        RESCUE_RADIUS: 60,
        FOLLOW_DISTANCE: 20,
        FOLLOW_LERP_SPEED: 0.08,
        POSSIBLE_RANKS_ON_RESCUE: [
            { rankName: "Recruit", xpNeeded: 0, weight: 40 },
            { rankName: "Private", xpNeeded: 300, weight: 25 },
            { rankName: "Corporal", xpNeeded: 1000, weight: 18 },
            { rankName: "Sergeant", xpNeeded: 2000, weight: 12 },
            { rankName: "Elite", xpNeeded: 4000, weight: 5 }
        ],
        MAX_HOSTAGES_PER_MISSION: 3,
        MIN_HOSTAGES_TO_RESCUE_FOR_WIN: 1,
        SPAWN_WITH_ENEMY_GROUPS: true,
        SPAWN_NEAR_CAPTORS_RADIUS: 60,
        MIN_CAPTORS_GROUP_SIZE: 2,
        HOSTAGE_PLACEMENT_ATTEMPTS_NEAR_GROUP: 2,
        SPAWN_AT_HUTS: true,
        MAX_HOSTAGES_PER_HUT: 2,
        SPAWN_OFFSET_FROM_HUT_X: -30,
        SPAWN_OFFSET_FROM_HUT_Y: (h_height => h_height * 0.5 + 30),
        MIN_HUT_DISTANCE_FROM_PLAYER_SPAWN_FOR_HOSTAGE: 800,
        HOSTAGE_PLACEMENT_ATTEMPTS_AT_HUT: 1,
        HOSTAGE_SPAWN_BUFFER: 80,
        HOSTAGE_DECORATION_SPAWN_BUFFER: 225,
        INITIAL_GUARD_COUNT_MIN_PER_HOSTAGE_HUT: 2,
        INITIAL_GUARD_COUNT_MAX_PER_HOSTAGE_HUT: 6,
        INITIAL_GUARD_HEAVY_CHANCE_HOSTAGE_HUT: 0.20,
        INITIAL_GUARD_SPAWN_RADIUS_AROUND_HUT: 180,
        INITIAL_GUARD_PLACEMENT_ATTEMPTS: 2,
        RESCUE_PHASING_DURATION: 1.0 // Seconds hostage phases after rescue to avoid getting stuck on obstacles
    },

    // =============================================================================
    // VISUAL_EFFECTS
    // =============================================================================
    VISUAL_EFFECTS: {
        PROMOTION: {
            LIFETIME: 2.5, TEXT: "PROMOTED!", FONT: "bold 16px 'Consolas', 'Lucida Console', monospace",
            COLOR_RGB_FADE_START: [255, 223, 0], VELOCITY_Y: -20,

            // ============================================================
            // Promotion shockwave / damaging pulse ring.
            // Spawned on the promoted unit. Radius & damage scale with the
            // rank just earned (see RANK_THRESHOLDS order). Tune freely.
            // ============================================================
            PULSE_RING: {
                ENABLED: true,            // master on/off switch for the whole effect
                DEALS_DAMAGE: true,       // set false for a purely cosmetic burst

                // --- Damage (scales with rank) ---
                // Effective damage = BASE_DAMAGE + DAMAGE_PER_RANK * rankStep
                // rankStep = 0 for the first promotable rank (Private), +1 each rank up.
                BASE_DAMAGE: 30,
                DAMAGE_PER_RANK: 18,
                CREDIT_KILLS_TO_UNIT: true, // promoted unit earns XP/kill credit for ring kills

                // --- Radius in world units (scales with rank) ---
                // Effective radius = BASE_RADIUS + RADIUS_PER_RANK * rankStep
                BASE_RADIUS: 150,
                RADIUS_PER_RANK: 75,

                // --- Timing (seconds) ---
                EXPAND_TIME: 0.45,        // time for the shockwave front to reach max radius
                LIFETIME: 1.5,           // total effect duration (fades out after expanding)

                // --- Visuals ---
                // Ring colour. If a matching entry exists in RANK_COLORS that
                // overrides this per rank. Format: [r, g, b].
                SHOCKWAVE_COLOR_RGB: [255, 223, 0],
                CORE_COLOR_RGB: [255, 255, 220],
                RANK_COLORS: {            // optional per-rank tints; remove to use SHOCKWAVE_COLOR_RGB
                    "Private":  [120, 220, 255],
                    "Corporal": [120, 255, 170],
                    "Sergeant": [255, 205, 90],
                    "Elite":    [255, 140, 60],
                    "Ghost":    [205, 120, 255]
                },
                RING_THICKNESS: 6,        // leading ring stroke width (world units)
                SHOCKWAVE_RINGS: 2,       // number of trailing concentric rings
                SPOKE_COUNT: 12,          // radiating energy spokes (0 to disable)
                PARTICLE_COUNT: 16,       // outward sparks (0 to disable)
                GLOW_INTENSITY: 0.45,     // 0..1 strength of the rim glow fill
                SHADOW_BLUR: 14,          // canvas shadow blur on the rings (0 to disable)
                CORE_FLASH: true,         // bright flash at the centre on spawn

                DAMAGE_NUMBERS: false,    // floating "-N" text over damaged enemies
                SCREEN_SHAKE: 0           // screen shake amount if game.addScreenShake exists (0 = off)
            }
        },
        EXPLOSION: {
            LIFETIME: 1.8,
            GRENADE: {
                SPRITE_PATH: 'assets/images/effects/explosion_25.png',
                FRAME_WIDTH: 205,
                FRAME_HEIGHT: 205,
                NUM_FRAMES: 25,
                ANIMATION_SPEED: 0.15,
                SCALE: 0.8
            },
            BARREL: {
                SPRITE_PATH: 'assets/images/effects/explosion_16.png',
                FRAME_WIDTH: 256,
                FRAME_HEIGHT: 256,
                NUM_FRAMES: 16,
                ANIMATION_SPEED: 0.1,
                SCALE: 0.5
            }
        },
        FIRE: {
            SPRITE_PATH: 'assets/images/effects/fire_2.png',
            FRAME_WIDTH: 85,
            FRAME_HEIGHT: 85,
            IGNITION_FRAMES: 12,
            LOOP_FRAMES: 12,
            LOOP_START_FRAME: 12,
            ANIMATION_SPEED: 0.13,
            SCALE: 0.6,
            MAX_LIFETIME: 60.0,
            SPREAD_X: 25,
            SPREAD_Y: 20,
            OPACITY_FADE_START_TIME: 55.0,
            NIGHT_LIGHT: {
                ENABLED: true,
                RADIUS: 180,
                INTENSITY: 0.95,
                INNER_RADIUS_FACTOR: 0.33,
                COLOR_RGB: [255, 140, 40],
                PULSE_SPEED: 1.5,
                PULSE_AMOUNT: 0.05
            }
        },
        HOSTAGE_HELP_TEXT: {
            // Hostage help call out text
            TEXT_OPTIONS: [
                'Help!', 'Over here!', 'Psst!', 'Save me!', 'Oi!', 'I`ve got 5 kits to feed!', 'I`m kinda a big thing...', 'I really need to pee!', 'I`m too young to die!', 'Got a snack? I`m starving!', 'I`m not great at this whole hostage thing...', 'I am not the raccoon you`re looking for...', 'Damn, you stink, possum scum!', 'We can be friends... not!'
            ],
            LIFETIME_SECONDS: 2.0,
            INTERVAL_MIN_SECONDS: 4.0,
            INTERVAL_MAX_SECONDS: 9.0,
            FONT: 'bold 18px Lucida Console',
            COLOR: 'yellow',
            Y_OFFSET: -45,
            FADE_OUT_START_PERCENT: 0.8
        },
        LASER_SIGHT: {
            COLOR_START: 'rgba(255, 0, 0, 0.0)',
            COLOR_END: 'rgba(255, 0, 0, 0.7)',
            LINE_WIDTH: 2
        },
        PICKUP: {
            LIFETIME: 2.7,
            TEXT: "+{QTY}",
            FONT: "bold 18px 'Consolas', 'Lucida Console', monospace",
            VELOCITY_Y: -25,
            ICON_Y_OFFSET: -10,
            ICON_SIZE: 24
        },

        // =============================================================================
        // WATER_SWIRL
        // =============================================================================
        WATER_SWIRL: {
            ENABLED: false,
            SWIRL_STRENGTH: 0.35,
            DRIFT_AMPLITUDE: 0.5,
            DRIFT_SPEED_X: 0.1,
            DRIFT_SPEED_Y: 0.2,
            DRIFT_FREQUENCY: 0.03,
        }
    },

    AMBIENT_EFFECTS: {
        FLYING_BIRD: {
            TILE_SHEET_PATHS: [
                'assets/images/effects/flying_bird_sheet.png',
                'assets/images/effects/flying_parrot_blueGreen_sheet.png',
                'assets/images/effects/flying_parrot_rainbow_sheet.png',
            ],
            FRAME_WIDTH: 100,
            FRAME_HEIGHT: 100,
            NUM_FRAMES: 6,
            ANIMATION_SPEED: 0.1,
            FLIGHT_SPEED_MIN: 80,
            FLIGHT_SPEED_MAX: 90,
            MIN_Y_SPAWN_FACTOR: 0.1,
            MAX_Y_SPAWN_FACTOR: 0.6,
            FLOCK_SIZE_MIN: 1,
            FLOCK_SIZE_MAX: 5,
            FLOCK_SPACING_X: 30,
            FLOCK_SPACING_Y: 20,
            SPAWN_INTERVAL_MIN_SECONDS: 5,
            SPAWN_INTERVAL_MAX_SECONDS: 40,
            SCALE: 0.45,
        },
        UFO: {
            TILE_SHEET_PATH: 'assets/images/objects/ufo/ufo_1_tilesheet.png',
            FRAME_WIDTH: 512,
            FRAME_HEIGHT: 512,
            NUM_FRAMES: 4,
            ANIMATION_SPEED: 0.08,
            SPEED_MIN: 1000,
            SPEED_MAX: 1800,
            MIN_Y_SPAWN_FACTOR: 0.05,
            MAX_Y_SPAWN_FACTOR: 0.35,
            SPAWN_INTERVAL_MIN_SECONDS: 300,
            SPAWN_INTERVAL_MAX_SECONDS: 1200,
            SCALE: 0.2,
            PHASE_UNLOCK: 3,
        }
    },

    // =============================================================================
    // UI
    // =============================================================================
    DEFAULT_WORLD_BACKGROUND_COLOR: '#417021',
    WORLD_MUD_RANDOM_ROTATION: false,
    WORLD_MUD_CLUMP_CHANCE: 0.35,
    WORLD_MUD_CLUMP_MIN: 2,
    WORLD_MUD_CLUMP_MAX: 5,
    WORLD_MUD_CLUMP_RADIUS: 32,
    WORLD_MUD_NOISE_DENSITY_SCALE: 0.008,
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/',
    RACCOON_FACE_IMAGES: [
        'face1.png', 'face2.png', 'face3.png', 'face4.png', 'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png', 'face12.png', 'face13.png', 'face14.png', 'face15.png', 'face16.png',
        'face17.png', 'face18.png', 'face19.png', 'face20.png', 'face21.png', 'face22.png', 'face23.png', 'face24.png',
        'face25.png', 'face26.png', 'face27.png', 'face28.png', 'face29.png', 'face30.png'
    ],

    MENU_WALLPAPERS: [
        { key: 'raccoon_1', name: 'Raccoon 1', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_1_menu.jpg' },
        { key: 'raccoon_2', name: 'Raccoon 2', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_2_menu.jpg' },
        { key: 'raccoon_3', name: 'Raccoon 3', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_3_menu.jpg' },
        { key: 'raccoon_4', name: 'Raccoon 4', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_4_menu.jpg' },
        { key: 'raccoon_5', name: 'Raccoon 5', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_5_menu.jpg' },
        { key: 'raccoon_6', name: 'Raccoon 6', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_6_menu.jpg' },
    ],

    DEFAULT_MENU_WALLPAPER: 'raccoon_1',

    UI_ASSETS: {
        GRENADE_ICON: 'assets/images/ui/icons/grenade_icon.png',
        HEALTH_ICON: 'assets/images/ui/icons/health_icon.png',
        AMMO_ICON: 'assets/images/ui/icons/ammo_icon.png'
    },

    UI_SETTINGS: {
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 3, HEIGHT: 4, Y_OFFSET_BASE: 10, BG_COLOR: '#333333',
            HP_COLOR_FULL: '#00CC00', HP_COLOR_MEDIUM: '#CCCC00', HP_COLOR_LOW: '#CC0000',
            LOW_HP_THRESHOLD_PERCENT: 0.3, MEDIUM_HP_THRESHOLD_PERCENT: 0.6,
            FADE_START_THRESHOLD: 0.25, FADE_MIN_OPACITY: 0.15,
            FLASH_THRESHOLD: 0.25, FLASH_SPEED: 8, FLASH_MIN_OPACITY: 0.3, FLASH_MAX_OPACITY: 1.0
        },
        RECRUIT_CARD: { DEFAULT_FACE_BG_COLOR: '#555555' },
        MEMORIAL_CARD: { DEFAULT_FACE_BG_COLOR: '#333333' },
        RANK_ICON_PATH: 'assets/images/ranks/rifleman/',
        RANK_ICON_FILES: {
            'Recruit': 'recruit.png',
            'Private': 'private.png',
            'Corporal': 'corporal.png',
            'Sergeant': 'sergeant.png',
            'Elite': 'elite.png',
            'Ghost': 'ghost.png'
        }
    },

    UI_TEXT_STRINGS: {
        CAMPAIGN_ALREADY_COMPLETE: "Campaign Already Complete! Restart from Main Menu.",
        ERROR_NO_INITIAL_RECRUITS: "All initial recruits were KIA! Operation failed before it began.",
        ERROR_LOAD_FIRST_MISSION_FAILED: "Error: Could not load campaign data to start the first mission.",
        ERROR_PREPARING_NEXT_BRIEFING: "Error preparing next mission briefing.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons KIA. Operation Failed.",
        CAMPAIGN_CONCLUDED_NO_MORE_MISSIONS: "Campaign Concluded (No more missions defined)!",
        PREMISSION_ERROR_PHASE_TITLE: "Campaign Error",
        PREMISSION_ERROR_MISSION_TITLE: "Error Loading Mission",
        PREMISSION_ERROR_BRIEFING: "Could not load mission details for selection.",
        MAX_SQUAD_ALERT: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.",
        NO_RECRUITS_SELECTED_ALERT: "Select at least one Raccoon for the mission!",
        INVALID_SQUAD_SIZE_ALERT: "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.",
        DEPLOY_LIST_EMPTY_PLACEHOLDER: "Click recruits on the left to deploy.",
        START_MISSION_BUTTON_ALERT_MAX_SIZE: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.",
        START_MISSION_BUTTON_ALERT_MIN_SIZE: "Select at least one Raccoon for the mission!",
        POST_MISSION_SUCCESS: "MISSION SUCCESSFUL!",
        POST_MISSION_FAILED: "MISSION FAILED!",
        POST_MISSION_SURVIVORS_NONE_VICTORY: "Mission accomplished, but no Raccoons survived.",
        POST_MISSION_SURVIVORS_NONE_DEFEAT: "All deployed Raccoons KIA.",
        POST_MISSION_FALLEN_NONE: "No casualties this mission.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons have been lost in action. The Platoon is no more. Operation Failed.",
        BUTTON_TEXT_NEXT_MISSION: "Next Mission",
        BUTTON_TEXT_RESTART_CAMPAIGN: "Restart Campaign",
        BUTTON_TEXT_START_PHASE_PREFIX: "Start ",
        BUTTON_TEXT_CAMPAIGN_COMPLETE: "View Final Stats",
        BUTTON_TEXT_RETRY_MISSION: "Retry Mission",
        MEMORIAL_NO_FALLEN: "No Raccoons have fallen... yet. Their legend awaits.",
        MEMORIAL_LABEL_NAME: "Name:",
        MEMORIAL_LABEL_RANK: "Rank Achieved:",
        MEMORIAL_LABEL_MISSION: "Fell In:",
        MEMORIAL_LABEL_PHASE: "During:",
        DEFAULT_OBJECTIVE_TEXT: "Defeat Possums",
        UNKNOWN_OBJECTIVE_TEXT: "Unknown Objective",
        HUD_NO_SQUAD_DEPLOYED: "No squad deployed.",
        UNKNOWN_PHASE_TEXT: "Unknown Phase",
        UNKNOWN_MISSION_TEXT: "Unknown Mission",
        GAMEOVER_VICTORY_TITLE: "CAMPAIGN COMPLETE!",
        GAMEOVER_DEFEAT_TITLE: "GAME OVER",
        CAMPAIGN_COMPLETE_PHASE_NAME: "Campaign Finished",

        PHASE_DEBRIEF_TITLE: "PHASE COMPLETE",
        PHASE_DEBRIEF_OVERVIEW_TAB: "Overview",
        PHASE_DEBRIEF_MISSIONS_TAB: "Missions",
        PHASE_DEBRIEF_ROSTER_TAB: "Roster",
        PHASE_DEBRIEF_HONOR_ROLL_TAB: "Honor Roll",
        PHASE_DEBRIEF_NEXT_PHASE_LABEL: "Next Phase:",
        PHASE_DEBRIEF_ENEMIES_ELIMINATED: "Enemies Eliminated",
        PHASE_DEBRIEF_HOSTAGES_RESCUED: "Hostages Rescued",
        PHASE_DEBRIEF_CASUALTIES: "Casualties",
        PHASE_DEBRIEF_PHASE_DURATION: "Phase Duration",
        PHASE_DEBRIEF_ROSTER_START: "Roster at Start",
        PHASE_DEBRIEF_ROSTER_END: "Roster at End",
        PHASE_DEBRIEF_NEW_RECRUITS: "New Recruits",
        PHASE_DEBRIEF_PROMOTIONS: "Promotions",
        PHASE_DEBRIEF_NO_CASUALTIES: "No casualties this phase.",
        PHASE_DEBRIEF_CONTINUE: "Continue",
        PHASE_DEBRIEF_MISSION_RESULT: "Result",
        PHASE_DEBRIEF_VICTORY: "VICTORY",
        PHASE_DEBRIEF_DEFEAT: "DEFEAT",
        PHASE_DEBRIEF_KILLS: "Kills",
        PHASE_DEBRIEF_TOP_KILLER: "Top Killer",
        CAMPAIGN_COMPLETE_MISSION_NAME: "All Possums Defeated!",
        ERROR_LOADING_MISSION_RETRY: "Error reloading mission for retry.",
        RACCOON_OUT_OF_GRENADES_LOG: "Raccoon {ID}: Out of grenades!",
        OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION: "Hostages ready! Proceed to Extraction Zone!",
        OBJECTIVE_RESCUE_HOSTAGES_AT_EVAC: "Hostages at EVAC: {COUNT}/{TOTAL}",
        OBJECTIVE_EXTERMINATE_TEXT: "Eliminate Possums: {CURRENT}/{TOTAL}",
        OBJECTIVE_DESTROY_TARGET_GENERIC_TEXT: "Destroy {TARGET_NAME_PLURAL}: {CURRENT}/{TOTAL}",
        OBJECTIVE_RESCUE_HOSTAGES_TEXT: "Rescue Hostages: {CURRENT_RESCUED}/{TOTAL_SPAWNED}{KIA_TEXT}",
        OBJECTIVE_RESCUE_TAKEN_HOSTAGE_TEXT: "Rescue Captured comrade from captivity",
        OBJECTIVE_EXTRACTION_TEXT: "Extract All Units: Get to Extraction Zone",
        OBJECTIVE_EXTRACTION_PROCEED: "All objectives complete! Proceed to Extraction Zone!",
        OBJECTIVE_EXTRACTION_HOSTAGES: "Extract remaining hostages: Get to Extraction Zone",
        OBJECTIVE_INTERACT_INTEL_TEXT: "Hack Intel Console: {CURRENT}/{TOTAL}",
        OBJECTIVE_DEACTIVATE_ANTI_AIR_TEXT: "Deactivate Anti-Air Turrets: {CURRENT}/{TOTAL}",
        EXTRACTION_ZONE_REVEALED: "Extraction Zone Revealed!"
    },

    // =============================================================================
    // NIGHT_MISSION
    // =============================================================================
    NIGHT_MISSION: {
        CHANCE: 0.1,
        UNLOCKS_PHASE: 2,
        OVERLAY_COLOR: 'rgba(0, 0, 20, 0.92)',
        DARKNESS_ALPHA: 0.62,
        PLAYER_VISION_RADIUS: 220,
        VISION_EDGE_SOFTNESS: 60,
        VISION_TINT_OPACITY: 0.45,
        ENEMY_DETECTION_MULTIPLIER: 0.45,
        PLAYER_DETECTION_MULTIPLIER: 0.65,
        ENEMY_NIGHT_ACCURACY_PENALTY: -0.15,
        NIGHT_DETECTION_RADIUS_IN_DARK: 100,
        ENEMY_NIGHT_ALERT_MULTIPLIER: 0.65,
    },

    // =============================================================================
    // AUDIO
    // =============================================================================
    AUDIO_ASSETS: {
        // RACCOON
        RACCOON_MG_FIRE: { path: 'assets/audio/sfx/gun_possum_grunt.ogg', defaultVolume: 1.0, pitchVariation: 0.3 },
       
        // POSSUM
        POSSUM_RIFLE_FIRE: { path: 'assets/audio/sfx/gun_mg_raccoon.mp3', defaultVolume: 0.25, pitchVariation: 0.3 },
        POSSUM_HEAVY_MG_FIRE: { path: 'assets/audio/sfx/gun_possum_heavy.ogg', defaultVolume: 0.5, pitchVariation: 0.08 },
        SNIPER_RIFLE_FIRE: { path: 'assets/audio/sfx/gunshot_sniper_1.ogg', defaultVolume: 0.5, pitchVariation: 0.02 },
        POSSUM_REVOLVER_FIRE: { path: 'assets/audio/sfx/gunshot_1.ogg', defaultVolume: 0.4, pitchVariation: 0.15 },
        POSSUM_BOSS_1_WEAPON_FIRE: { path: 'assets/audio/sfx/grenade_launcher.ogg', defaultVolume: 0.2, pitchVariation: 0.1 },
        POSSUM_BOSS_3_WEAPON_FIRE: { path: 'assets/audio/sfx/gun_possum_heavy.ogg', defaultVolume: 0.3, pitchVariation: 0.1 },
        POSSUM_BOSS_4_WEAPON_FIRE: { path: 'assets/audio/sfx/advanced_laser_1.ogg', defaultVolume: 0.5, pitchVariation: 0.05 },
        POSSUM_ELITE_GUARD_WEAPON_FIRE: { path: 'assets/audio/sfx/advanced_laser_2.ogg', defaultVolume: 0.35, pitchVariation: 0.05 },
       
        // ADVANCED
        LASER_WEAPON_FIRE: { path: 'assets/audio/sfx/advanced_laser_1.ogg', defaultVolume: 0.4, pitchVariation: 0.05 },
        LASER_WEAPON_FIRE_2: { path: 'assets/audio/sfx/advanced_laser_2.ogg', defaultVolume: 0.4, pitchVariation: 0.05 },
        SHOTGUN_FIRE: { path: 'assets/audio/sfx/gunshot_shotgun_1.ogg', defaultVolume: 0.6, pitchVariation: 0.1 },
       
        // EXPLOSIONS
        GRENADE_EXPLODE: { path: 'assets/audio/sfx/grenade_explode.ogg', defaultVolume: 0.3, pitchVariation: 0.4 },
        GRENADE_EXPLODE_2: { path: 'assets/audio/sfx/grenade_explode_2.mp3', defaultVolume: 0.3, pitchVariation: 0.4 },
        POSSUM_HUT_DESTROYED: { path: 'assets/audio/sfx/structure_wood_destroy_01.mp3', defaultVolume: 0.4, pitchVariation: 0.3 },
        POSSUM_TOWER_DESTROYED: { path: 'assets/audio/sfx/barrel_explode_metal_01.mp3', defaultVolume: 0.2, pitchVariation: 0.3 },
        EXPLOSIVE_BARREL_DESTROYED: { path: 'assets/audio/sfx/barrel_explode.ogg', defaultVolume: 0.1, pitchVariation: 0.2 },
        EXPLOSIVE_BARREL_CLUSTER_DESTROYED: { path: 'assets/audio/sfx/barrel_cluster_explode.ogg', defaultVolume: 0.15, pitchVariation: 0.3 },
       
        // INTERACTIONS        
        COMPUTER_HACK_GLITCH: { path: 'assets/audio/sfx/computer_hack_glitch.mp3', defaultVolume: 0.5 },
        SCENT_MARKER_PLACE: { path: 'assets/audio/sfx/scentMarkerPlace.wav', defaultVolume: 0.3, pitchVariation: 0.2 },
        SCENT_SNIFF: { path: 'assets/audio/sfx/scentSniff_1.wav', defaultVolume: 0.4, pitchVariation: 0.15 },

        // UI
        UI_BUTTON_CLICK: { path: 'assets/audio/sfx/ui_click_soft.ogg', defaultVolume: 0.1 },
        UI_BUTTON_HOVER: { path: 'assets/audio/sfx/ui_hover_gentle.mp3', defaultVolume: 0.3, pitchVariation: 0.1 },
        TOAST_NOTIFICATION: { path: 'assets/audio/sfx/ui_sfx_2.mp3', defaultVolume: 0.3 },
       
        // AMBIENCE
        AMBIENT_FOREST_1: { path: 'assets/audio/ambience/tropical_forest_ambient_1.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_2: { path: 'assets/audio/ambience/tropical_forest_ambient_2.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_3: { path: 'assets/audio/ambience/tropical_forest_ambient_3.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_4: { path: 'assets/audio/ambience/tropical_forest_ambient_4.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_5: { path: 'assets/audio/ambience/ambience_temperate_day_4.ogg', defaultVolume: 1.0 },
        
        AMBIENT_MUSIC_TROPICAL_FOREST_KEYS: [
            'AMBIENT_FOREST_1',
            'AMBIENT_FOREST_2',
            'AMBIENT_FOREST_3',
            'AMBIENT_FOREST_4',
            'AMBIENT_FOREST_5'
        ],
        
        // MUSIC
        MUSIC_MAIN_MENU: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.5 },
        MUSIC_COMBAT_1: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.3 },
        MUSIC_BOSS_1: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.4 },
        MUSIC_VICTORY_DEFAULT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.8 },
        MUSIC_DEFEAT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.5 },
        MUSIC_LOADING: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.4 },
        MUSIC_SHOOTOUT: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.5 },
        MUSIC_CAMPAIGN_COMPLETE: { path: 'assets/audio/music/End Game.mp3', defaultVolume: 0.7 },
        MUSIC_GAME_OVER: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.6 },
    },

    AUDIO_MUSIC: {
        DEFAULT_MASTER_VOLUME: 1.0,
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_SFX_VOLUME: 1.0,
        DEFAULT_AMBIENT_VOLUME: 0.7,
        STATE_TRANSITION_TIME: 1.0,

        BIOME_TRACKS: {
            TROPICAL: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: null
            },
            TEMPERATE: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: null
            },
            SWAMP: {
                ambient: ['AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: null
            }
        },

        MISSION_TYPE_TRACKS: {
            BOSS: { combat: ['MUSIC_BOSS_1'] }
        },

        STATE_TRACKS: {
            MAIN_MENU: 'MUSIC_MAIN_MENU',
            PRE_MISSION_SELECT: 'MUSIC_MAIN_MENU',
            LOADING_MISSION: 'MUSIC_LOADING',
            POST_MISSION_DEBRIEF: null,
            END_OF_PHASE_DEBRIEF: null,
            VICTORY: 'MUSIC_VICTORY_DEFAULT',
            DEFEAT: 'MUSIC_DEFEAT',
            PAUSE: null,
            SHOOTOUT_PRE_GAME: 'MUSIC_SHOOTOUT',
            SHOOTOUT_PLAYING: 'MUSIC_SHOOTOUT',
            SHOOTOUT_AMBUSH: 'MUSIC_SHOOTOUT',
            CAMPAIGN_COMPLETE: 'MUSIC_CAMPAIGN_COMPLETE',
            GAME_OVER_NO_RECRUITS: 'MUSIC_GAME_OVER',
            HOW_TO_PLAY: 'MUSIC_MAIN_MENU',
        }
    },

    // =============================================================================
    // SHOOTOUT_MODE
    // =============================================================================
    SHOOTOUT_MODE: {
        MODES: {
            TIME_ATTACK: 'time_attack',
            ELIMINATION: 'elimination'
        },
        NATIVE_WIDTH: 1920,
        NATIVE_HEIGHT: 1080,
        ROUND_DURATION_SECONDS: 60,
        ELIMINATION_TARGET_MIN: 15,
        ELIMINATION_TARGET_MAX: 30,
        ELIMINATION_PAR_TIME_PER_TARGET: 3.5,
        INITIAL_PLAYER_HEALTH: 75,
        PLAYER_FIRE_SFX: 'RACCOON_MG_FIRE',
        INITIAL_SPAWN_INTERVAL: 3.0,
        MIN_SPAWN_INTERVAL: 0.5,
        MAX_CONCURRENT_TARGETS: 5,
        DIFFICULTY_INCREASE_RATE: 0.95,
        DIFFICULTY_INCREASE_INTERVAL: 10,
        PEEK_DURATION_BASE: 1.0,
        PEEK_DURATION_RANDOM: 1.5,
        REACTION_TIME_BASE: 0.5,
        REACTION_TIME_RANDOM: 1.0,
        SCORE_PER_HIT: 100,
        SCORE_PER_KILL: 500,
        ACCURACY_BONUS_THRESHOLD: 0.8,
        TIME_BONUS_MULTIPLIER: 10,
        CROSSHAIR_SIZE: 32,

        WARNING_DURATION: 1.0,
        BASE_TRAVEL_TIME: 1.0,
        TRAVEL_TIME_SCALE_FACTOR: 1.0,
        HEADSHOT_THRESHOLD: 0.3,

        VISIBILITY_THRESHOLD: 0.50,
        FADE_ZONE_SIZE: 0.20,

        DYNAMIC_VISIBILITY_THRESHOLD: true,
        PEEK_OFFSET_MIN: 20,
        PEEK_OFFSET_MAX: 200,
        VISIBILITY_THRESHOLD_WHEN_HIDDEN: 0.7,
        VISIBILITY_THRESHOLD_WHEN_EXPOSED: 0.3,

        ENEMY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_grunt_tile_large.png',
            FRAME_WIDTH: 512,
            FRAME_HEIGHT: 512,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 0.7
        },
        ENEMY_HEAVY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_heavy_tile.png',
            FRAME_WIDTH: 128,
            FRAME_HEIGHT: 128,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 1.0
        },

        BULLET_MARKS: {
            ENEMY_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_enemy.png',
                DEFAULT_SCALE: 1.0
            },
            ENVIRONMENT_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_environment.png',
                DEFAULT_SCALE: 0.7
            }
        },

        DEFAULT_ENEMY_CONFIGS: {
            grunt: {
                enabled: true,
                weight: 60,
                peekOffset: 40,
                scale: 0.8,
                bulletOffset: { x: -3, y: 14 },
                showInDevMode: true
            },
            heavy: {
                enabled: false,
                weight: 25,
                peekOffset: 50,
                scale: 1.0,
                bulletOffset: { x: 5, y: 2 },
                showInDevMode: true
            },
            elite: {
                enabled: false,
                weight: 15,
                peekOffset: 45,
                scale: 1.0,
                bulletOffset: { x: -3, y: 12 },
                showInDevMode: false
            }
        },

        ENEMY_TYPES: {
            grunt: {
                displayName: 'Grunt',
                color: '#A0522D',
                tilesheetKey: 'ENEMY_TILESHEET'
            },
            heavy: {
                displayName: 'Heavy',
                color: '#6A4A3A',
                tilesheetKey: 'ENEMY_HEAVY_TILESHEET'
            },
            elite: {
                displayName: 'Elite',
                color: '#8B4513',
                tilesheetKey: 'ENEMY_TILESHEET'
            }
        },

        DEBUG_SHOW_SPAWN_AREAS: false,
        DEBUG_SPAWN_AREA_SIZE: 64,
        DEBUG_SPAWN_AREA_COLOR: 'rgba(255, 255, 0, 0.5)',
        DEBUG_PEEK_LINE_COLOR: 'rgba(255, 0, 0, 0.8)',
        DEBUG_TEXT_COLOR: '#00FF00',

        GAME_OVER_BUTTON_DELAY: 1.5,

        MAX_DAMAGE_ALLOWED: 75,
        DAMAGE_MULTIPLIER: 0.5,

        GRADE_THRESHOLDS: {
            S: { minScore: 12000, minAccuracy: 0.95, minDamageEfficiency: 0.9, minHeadshotPct: 0.4 },
            A: { minScore: 9000, minAccuracy: 0.85, minDamageEfficiency: 0.7, minHeadshotPct: 0.25 },
            B: { minScore: 6500, minAccuracy: 0.75, minDamageEfficiency: 0.5, minHeadshotPct: 0.15 },
            C: { minScore: 4000, minAccuracy: 0.6, minDamageEfficiency: 0.3, minHeadshotPct: 0.05 },
            D: { minScore: 2000, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 },
            F: { minScore: 0, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 }
        },

        BACKGROUNDS: {
            // TROPICAL
            JUNGLE_ATTACK: {
                NAME: 'Jungle Attack',
                IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_1.png'
            },
            
            JUNGLE_RUINS: {
                NAME: 'Jungle Ruins',
                IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_2.png'
            },

            JUNGLE_AMBUSH: {
                NAME: 'Jungle Ambush',
                IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_3.png'
            },
            
            JUNGLE_RUINS_2: {
                NAME: 'Jungle Ruins 2',
                IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_4.png'
            },
            RAINFOREST_BATTLE_1: {
                NAME: 'Rainforest Battle',
                IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_6.png'
            },
            // TEMPERATE
            TEMPERATE_FOREST_1: {
                NAME: 'Pine Attack',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_1.png'
            },
            TEMPERATE_FOREST_2: {
                NAME: 'Meadow Massacre',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_2.png'
            },

            TEMPERATE_FOREST_3: {
                NAME: 'Pine Ambush',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_3.png'
            },
            TEMPERATE_FOREST_EXTRACTION_1: {
                NAME: 'A Rush Of Blood',
                IMAGE: 'assets/images/shootouts/temperate/shootout_temperate_extraction_1.png'
            },
            // JUNKYARD
            JUNKYARD_SHOOTOUT_1: {
                NAME: 'The Smell Of Blood',
                IMAGE: 'assets/images/shootouts/junkyard/Shootout_junkyard_1.png',
            },
            JUNKYARD_SHOOTOUT_2: {
                NAME: 'Oil For Blood',
                IMAGE: 'assets/images/shootouts/junkyard/Shootout_junkyard_2.png',
            }
        },

        DEFAULT_BACKGROUND: 'JUNGLE_ATTACK',

        AMBUSH_START_CHANCE: 0.2,
        AMBUSH_EXTRACTION_CHANCE: 0.6,
        AMBUSH_ALERT_DURATION: 3000,
        AMBUSH_DEFAULT_MODE: 'ELIMINATION',
        AMBUSH_TIME_ATTACK_CHANCE: 0.5,
        AMBUSH_TIME_LIMIT: 45,
        AMBUSH_ELIMINATION_COUNT: 15,
        AMBUSH_NIGHT_MODE_ENABLED: true,
        AMBUSH_BACKGROUNDS: {
                TROPICAL: ['RAINFOREST_BATTLE_1', 'JUNGLE_ATTACK', 'JUNGLE_RUINS_2', 'JUNGLE_AMBUSH', 'JUNGLE_RUINS', 'TROPICAL_EXTRACTION_BATTLE_1',],
                TEMPERATE: ['TEMPERATE_FOREST_1', 'TEMPERATE_FOREST_2', 'TEMPERATE_FOREST_3', 'TEMPERATE_FOREST_EXTRACTION_1'],
                JUNKYARD: ['JUNKYARD_SHOOTOUT_1', 'JUNKYARD_SHOOTOUT_2']
            },
        AMBUSH_EXTRACTION_BACKGROUNDS: {
                TROPICAL: ['TROPICAL_EXTRACTION_BATTLE_1',],
                TEMPERATE: ['TEMPERATE_FOREST_EXTRACTION_1',],
                JUNKYARD: ['JUNKYARD_SHOOTOUT_1',]
            },
        AMBUSH_UNLOCKS_PHASE: 2,

        XP_PER_AMBUSH_SURVIVED: 100,

        AMBUSH_ALERT_MESSAGES: {
            START_AMBUSH: [
                "AMBUSH! Get down!",
                "Possum scum spotted! Cover!",
                "Hostiles! Take cover!",
                "Ambush! Get to cover!",
                "Possum scum spotted! Return fire!",
                "We're under fire! Clear the area!",
                "Hostiles! Engage immediately!",
                "Ambush! Open fire!",
                "Taking fire! Return fire!",
                "Enemies! Shoot them!",
                "Contact! All units, open fire!"
            ],
            EXTRACTION_AMBUSH: [
                "Extraction under fire!",
                "Enemy reinforcements! Cover the extraction zone!",
                "Ambush at extraction! Defend the position!",
                "Taking fire at extraction point!",
                "Enemies blocking extraction! Clear them out!",
                "Hostile contact at extraction! Push through!",
                "Extraction compromised! Eliminate the threat!",
                "Enemy blocking escape! Get rid of them!"
            ]
        },

        AMBUSH_RESULT_MESSAGES: {
            VICTORY: [
                "Area clear! Good work!",
                "All scum eliminated!",
                "Possum scum neutralized!",
                "Sector secure!",
                "Nice shooting!",
                "Clear! Move out!"
            ],
            DEFEAT: [
                "Fall back! Too many casualties!",
                "Overrun! Withdraw!",
                "Fall back!"
            ],
            TIME_UP: [
                "Time's up! You survived!",
                "Survived the ambush!",
                "You held the line!",
                "Reinforcements arrived! Hold position!"
            ]
        }
    },

    // =============================================================================
    // OBJECTIVE_DIRECTIONAL_INDICATOR
    // =============================================================================
    OBJECTIVE_INDICATOR: {
        ENABLED: true,
        EDGE_MARGIN: 40,
        ARROW_SIZE: 18,
        ARROW_OFFSET: 30,
        PULSE_SPEED: 3,
        PULSE_AMOUNT: 0.3,
        WORLD_MARKER_RADIUS: 12,
        WORLD_MARKER_ON_SCREEN_MARGIN: 20,
        FONT_SIZE: 11,
        LABEL_OFFSET: 8,
        COLORS: {
            EXTERMINATE: '#FF4444',
            DESTROY_TARGET: '#FF8800',
            RESCUE_HOSTAGES: '#44FF44',
            RESCUE_TAKEN_HOSTAGE: '#44FF44',
            ASSASSINATION: '#FF44FF',
            INTERACT_INTEL: '#44DDFF',
            EXTRACTION: '#00FFD4',
            DEFAULT: '#FFFFFF'
        },
        LABELS: {
            EXTERMINATE: 'Enemy',
            DESTROY_TARGET: 'Target',
            RESCUE_HOSTAGES: 'Hostage',
            RESCUE_TAKEN_HOSTAGE: 'Hostage',
            ASSASSINATION: 'Target',
            INTERACT_INTEL: 'Intel',
            EXTRACTION: 'Extract',
            DEFAULT: 'Objective'
        }
    },

    // =============================================================================
    // SCENT MARKERS (Raccoon waypoint system)
    // =============================================================================
    SCENT_MARKERS: {
        ENABLED: true,
        MAX_MARKERS: 20,
        FADE_START_TIME: 300,
        FADE_DURATION: 30,
        RENDER: {
            ICON_SIZE: 28,
            PULSE_SPEED: 2.5,
            PULSE_AMOUNT: 0.25,
            OUTER_RING_RADIUS: 22,
            INNER_CIRCLE_RADIUS: 14,
            LABEL_FONT_SIZE: 12,
            LABEL_OFFSET_Y: 38,
            ARROW_SIZE: 12,
            ARROW_OFFSET: 42,
            EDGE_MARGIN: 50,
            WORLD_MARKER_ON_SCREEN_MARGIN: 30,
        },
        TYPES: {
            HOSTAGE: {
                key: 'HOSTAGE',
                label: 'Hostage',
                color: '#44DDFF',
                glowColor: 'rgba(68, 221, 255, 0.3)',
                iconChar: '✚',
            },
            INTEL_CONSOLE: {
                key: 'INTEL_CONSOLE',
                label: 'Intel Console',
                color: '#FFD700',
                glowColor: 'rgba(255, 215, 0, 0.3)',
                iconChar: '◆',
            },
            HELIPAD: {
                key: 'HELIPAD',
                label: 'Helipad',
                color: '#44FF44',
                glowColor: 'rgba(68, 255, 68, 0.3)',
                iconChar: '⬡',
            },
        },
        RADIAL_MENU: {
            RADIUS: 80,
            CENTER_GAP: 24,
            SEGMENT_INNER_RADIUS: 28,
            SEGMENT_OUTER_RADIUS: 72,
            SEGMENT_LINE_WIDTH: 36,
            SEGMENT_GAP_RADIANS: 0.08,
            CENTER_CIRCLE_RADIUS: 20,
            BG_ALPHA: 0.75,
            BG_COLOR: '#1a1a2e',
            STROKE_COLOR: 'rgba(255,255,255,0.25)',
            HOVER_BRIGHTNESS: 1.3,
            ICON_SIZE: 18,
            LABEL_FONT_SIZE: 14,
            LABEL_OFFSET: 8,
            HOVER_COLOR: '#ffffff',
            REMOVE_KEY: 'REMOVE',
            REMOVE_LABEL: 'Remove Marker',
            REMOVE_COLOR: '#FF4444',
            REMOVE_HOVER_COLOR: '#FF6666',
            SNIFF_LABEL: 'Sniff',
            SNIFF_COLOR: '#DDA0DD',
            SNIFF_HOVER_COLOR: '#E8B8E8',
            SNIFF_DURATION: 10,
            ANIMATION_SPEED: 10,
            EDGE_MARGIN: 60,
            VISIBLE_TRANSITION_SPEED: 0.15,
            DRIFT_SPEED: 0.3,
            DRIFT_AMOUNT: 8,
            DRIFT_INTERVAL: 4,
        },
    },
};
