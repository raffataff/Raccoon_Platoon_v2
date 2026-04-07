// js/config.js
const CONFIG = {
    // --- Core Game & World ---
    BASE_WORLD_WIDTH: 1920,
    BASE_WORLD_HEIGHT: 1080,
    MIN_CANVAS_WIDTH: 1920,
    MIN_CANVAS_HEIGHT: 1080,
    MAX_DELTA_TIME_STEP: 0.1,
    CAMERA_LERP_SPEED: 0.08,
    CAMERA_ZOOM: 1.1, // Fixed zoom level for campaign mode (1.0 = no zoom, higher = closer)

    // --- World Rendering ---
    WORLD_BASE_MUD_COLOR: '#483524', // A muddy brown color
    WORLD_BASE_DIRT_COLOR: '#5C4033', // A lighter dirt color for bare patches
    WORLD_GRASS_TILE_SIZE: 48,     // Approximate width/height of your grass tile sprites
    WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.66, // e.g., 0.25 means tiles can overlap by up to 25% of their size
    WORLD_GRASS_SKIP_CHANCE: 0.5, // Probability (0-1) to start skipping grass and show dirt/mud
    WORLD_GRASS_SKIP_MIN: 3,       // Minimum consecutive grass tiles to skip
    WORLD_GRASS_SKIP_MAX: 12,       // Maximum consecutive grass tiles to skip

    // Mud patch sprites (used when grass is skipped)
    MUD_SPRITE_PATH: 'assets/images/objects/biomes/tropical/mud/',
    MUD_SPRITE_FILES: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png'],

    // Perlin noise settings for mud patch generation
    WORLD_MUD_NOISE_SCALE_X: 0.015,  // Lower = larger blobs
    WORLD_MUD_NOISE_SCALE_Y: 0.01,  // Lower = larger blobs
    WORLD_MUD_NOISE_THRESHOLD: 0.3, // Higher = fewer/smaller patches
    WORLD_MUD_NOISE_OCTAVES: 3,     // More octaves = more detail
    // Iteration step will be TILE_SIZE * (1 - OVERLAP_FACTOR)
    // VIDEO SETTINGS
    MIN_LOADING_VIDEO_DURATION_MS: 5000,

    // --- Input ---
    INPUT_DRAG_THRESHOLD: 5,
    INPUT_TAP_THRESHOLD_MS: 30,

    // --- Pathfinding ---
    GRID_CELL_SIZE: 4, // Reduced for finer grid, ensure performance
    DEBUG_PATHING_UNIT_ID: null,
    DEBUG_DRAW_NAV_GRID_BLOCKED: true,
    DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES: true,
    DEBUG_DRAW_UNIT_PATHING_BOUNDS: false,


    // --- Units: Raccoon (Player) ---
    RACCOON_HP: 20,
    RACCOON_DETECTION_RANGE: 100,
    RACCOON_MIN_ENGAGEMENT_DISTANCE: 100, // Try to keep this far for grenade lobs
    RACCOON_PREFERRED_ENGAGEMENT_DISTANCE_MAX: 200, // Max preferred range
    RACCOON_ENGAGE_RANGE_BUFFER: 20, // Buffer for deciding to move vs shoot
    GRENADE_THROW_COOLDOWN_BASE: 3.0,
    GRENADE_THROW_COOLDOWN_RANDOM_ADD: 2.5,
    RACCOON_SPEED: 200,
    RACCOON_SIZE: 12,
    RACCOON_COLOR: '#808080',
    RACCOON_MG_DAMAGE: 7,
    RACCOON_MG_ROF: 7,
    RACCOON_MG_RANGE: 500,
    RACCOON_MG_PROJECTILE_SPEED: 600,
    RACCOON_MG_ACCURACY_STATIONARY: 0.90,
    RACCOON_MG_ACCURACY_MOVING: 0.60,
    RACCOON_STARTING_AMMO: 400,
    RACCOON_MAGAZINE_SIZE: 30,
    BASE_RELOAD_TIME: 3.0,
    RELOAD_TIME_REDUCTION_PER_RANK: 0.25,
    RACCOON_AUTO_TARGET_RANGE_FACTOR: 0.6,
    RACCOON_STARTING_GRENADES: 0,
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 65,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 290,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,
    // --- Raccoon Sprites ---
    RACCOON_SPRITE_PATH: 'assets/images/units/raccoon/recruit/',
    RACCOON_SPRITE_SCALE_FACTOR: 0.5,
      // --- Private ---
    RACCOON_PRIVATE_SPRITE_PATH: 'assets/images/units/raccoon/private/',
    RACCOON_PRIVATE_SPRITE_SCALE_FACTOR: 0.55,
      // --- Corporal ---
    RACCOON_CORPORAL_SPRITE_PATH: 'assets/images/units/raccoon/corporal/',
    RACCOON_CORPORAL_SPRITE_SCALE_FACTOR: 0.6,
      // --- Sergeant ---
    RACCOON_SERGEANT_SPRITE_PATH: 'assets/images/units/raccoon/sergeant/',
    RACCOON_SERGEANT_SPRITE_SCALE_FACTOR: 0.62,
      // --- Elite ---
    RACCOON_ELITE_SPRITE_PATH: 'assets/images/units/raccoon/elite/',
    RACCOON_ELITE_SPRITE_SCALE_FACTOR: 0.65,
        // --- Ghost ---
    RACCOON_GHOST_SPRITE_PATH: 'assets/images/units/raccoon/ghost/',
    RACCOON_GHOST_SPRITE_SCALE_FACTOR: 0.7,
        // --- Maverick ---
    RACCOON_MAVERICK_SPRITE_PATH: 'assets/images/units/raccoon/maverick/',
    RACCOON_MAVERICK_SPRITE_SCALE_FACTOR: 0.55,
    
    RACCOON_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/',
    RACCOON_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'],
    RACCOON_DEAD_SPRITE_SCALE: 0.06,
    RACCOON_HOSTAGE_SPRITE_SCALE_FACTOR: 1.3,

    // --- Units: Possum Grunt ---
    POSSUM_GRUNT_HP: 20,
    POSSUM_GRUNT_SPEED: 150,
    POSSUM_GRUNT_SIZE: 14,
    POSSUM_GRUNT_COLOR: '#A0522D',
    POSSUM_RIFLE_DAMAGE: 8,
    POSSUM_RIFLE_ROF: 5,
    POSSUM_RIFLE_RANGE: 400,
    POSSUM_RIFLE_PROJECTILE_SPEED: 320,
    POSSUM_RIFLE_ACCURACY_STATIONARY: 0.75,
    POSSUM_RIFLE_ACCURACY_MOVING: 0.45,
    POSSUM_RIFLE_BULLET_LIFETIME: 1.3,
    POSSUM_GRUNT_SPRITE_PATH: 'assets/images/units/possum_grunt/',
    POSSUM_GRUNT_SPRITE_SCALE_FACTOR: 0.5,
    POSSUM_GRUNT_DEAD_SPRITE_PATH: 'assets/images/units/possum_grunt/dead/',
    POSSUM_GRUNT_DEAD_SPRITE_FILES: ['possum_grunt_dead_3.png', 'possum_grunt_dead_4.png'],
    POSSUM_GRUNT_DEAD_SPRITE_SCALE: 0.5,

    // --- Units: Possum Heavy ---
    POSSUM_HEAVY_HP: 40,
    POSSUM_HEAVY_SPEED: 120,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_WEAPON_DAMAGE: 18,
    POSSUM_HEAVY_WEAPON_ROF: 2,
    POSSUM_HEAVY_WEAPON_RANGE: 500,
    POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED: 400,
    POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY: 0.85,
    POSSUM_HEAVY_WEAPON_ACCURACY_MOVING: 0.3,
    POSSUM_HEAVY_WEAPON_BULLET_LIFETIME: 1.4,
    POSSUM_HEAVY_SPRITE_PATH: 'assets/images/units/possum_heavy/',
    POSSUM_HEAVY_SPRITE_SCALE_FACTOR: 0.55,
    POSSUM_HEAVY_DEAD_SPRITE_PATH: 'assets/images/units/possum_heavy/dead/',
    POSSUM_HEAVY_DEAD_SPRITE_FILES: ['possum_heavy_dead_1.png'],
    POSSUM_HEAVY_DEAD_SPRITE_SCALE: 0.7,

    // --- Units: Possum Boss 1 ---
    POSSUM_BOSS_1_HP: 250,
    POSSUM_BOSS_1_SPEED: 200,
    POSSUM_BOSS_1_SIZE: 20,
    POSSUM_BOSS_1_COLOR: '#703510',
    POSSUM_BOSS_1_WEAPON_DAMAGE: 55,
    POSSUM_BOSS_1_WEAPON_ROF: 0.25,
    POSSUM_BOSS_1_WEAPON_RANGE: 650,
    POSSUM_BOSS_1_WEAPON_PROJECTILE_SPEED: 450,
    POSSUM_BOSS_1_WEAPON_ACCURACY_STATIONARY: 1.0,
    POSSUM_BOSS_1_WEAPON_ACCURACY_MOVING: 1.0,
    POSSUM_BOSS_1_WEAPON_BULLET_LIFETIME: 2.2,
    POSSUM_BOSS_1_GRENADE_AOE_RADIUS: 80,
    POSSUM_BOSS_1_SECONDARY_WEAPON: {
        DAMAGE: 15,
        ROF: 4,
        RANGE: 320,
        PROJECTILE_SPEED: 450,
        ACCURACY_STATIONARY: 0.80,
        ACCURACY_MOVING: 0.40,
        PROJECTILE_COLOR: '#FF8C00'
    },
    POSSUM_BOSS_1_SPRITE_PATH: 'assets/images/units/possum_boss_1/',
    POSSUM_BOSS_1_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_BOSS_1_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_1/dead/',
    POSSUM_BOSS_1_DEAD_SPRITE_FILES: ['possum_boss1_dead1.png', 'possum_boss1_dead2.png'],
    POSSUM_BOSS_1_DEAD_SPRITE_SCALE: 0.4,
    PROJECTILE_COLOR_POSSUM_BOSS_1: '#FF4500',
    XP_FOR_BOSS_KILL: 250,

    // --- NEW: Units: Possum Revolver (Boss 2) ---
    POSSUM_REVOLVER_HP: 150,
    POSSUM_REVOLVER_SPEED: 180, // Moves a lot
    POSSUM_REVOLVER_SIZE: 18,
    POSSUM_REVOLVER_COLOR: '#D2691E', // Chocolate brown
    POSSUM_REVOLVER_SPRITE_PATH: 'assets/images/units/possum_revolver/',
    POSSUM_REVOLVER_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_REVOLVER_DEAD_SPRITE_PATH: 'assets/images/units/possum_revolver/dead/',
    POSSUM_REVOLVER_DEAD_SPRITE_FILES: ['possum_revolver_dead.png'],
    POSSUM_REVOLVER_DEAD_SPRITE_SCALE: 0.09,
    XP_FOR_REVOLVER_KILL: 150,

    POSSUM_REVOLVER_WEAPON_DAMAGE: 12,
    POSSUM_REVOLVER_WEAPON_ROF: 8, // Fires fast
    POSSUM_REVOLVER_WEAPON_RANGE: 520,
    POSSUM_REVOLVER_WEAPON_PROJECTILE_SPEED: 480,
    POSSUM_REVOLVER_WEAPON_ACCURACY: 0.85, // Is accurate
    POSSUM_REVOLVER_WEAPON_BULLET_LIFETIME: 1.8,
    PROJECTILE_COLOR_POSSUM_REVOLVER: '#FFD700', // Gold

    // --- NEW: Units: Possum Sniper ---
    POSSUM_SNIPER_HP: 25,
    POSSUM_SNIPER_SPEED: 100,
    POSSUM_SNIPER_SIZE: 14,
    POSSUM_SNIPER_COLOR: '#788270', // Drab green/grey
    POSSUM_SNIPER_SPRITE_PATH: 'assets/images/units/possum_sniper/',
    POSSUM_SNIPER_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_SNIPER_DEAD_SPRITE_PATH: 'assets/images/units/possum_sniper/dead/',
    POSSUM_SNIPER_DEAD_SPRITE_FILES: ['possum_sniper_dead.png'],
    POSSUM_SNIPER_DEAD_SPRITE_SCALE: 0.5,

    POSSUM_SNIPER_RIFLE_DAMAGE: 35,
    POSSUM_SNIPER_RIFLE_ROF: 0.2, // Very slow, 1 shot every 5 seconds
    POSSUM_SNIPER_RIFLE_RANGE: 700, // Very long range
    POSSUM_SNIPER_RIFLE_PROJECTILE_SPEED: 900, // Very fast projectile
    POSSUM_SNIPER_RIFLE_ACCURACY: 1.0, // Snipers don't miss
    POSSUM_SNIPER_RIFLE_BULLET_LIFETIME: 2.0,
    PROJECTILE_COLOR_POSSUM_SNIPER: '#FF2400', // Scarlet red for visibility

    // --- Units: Possum Elite ---
    POSSUM_ELITE_HP: 80,
    POSSUM_ELITE_SPEED: 190,
    POSSUM_ELITE_SIZE: 15,
    POSSUM_ELITE_COLOR: '#8B4513',
    POSSUM_ELITE_WEAPON_DAMAGE: 12,
    POSSUM_ELITE_WEAPON_ROF: 7,
    POSSUM_ELITE_WEAPON_RANGE: 650,
    POSSUM_ELITE_WEAPON_PROJECTILE_SPEED: 500,
    POSSUM_ELITE_WEAPON_ACCURACY_STATIONARY: 0.95,
    POSSUM_ELITE_WEAPON_ACCURACY_MOVING: 0.90,
    POSSUM_ELITE_WEAPON_BULLET_LIFETIME: 2.0,
    POSSUM_ELITE_SPRITE_PATH: 'assets/images/units/possum_elite/',
    POSSUM_ELITE_SPRITE_SCALE_FACTOR: 0.55,
    POSSUM_ELITE_DEAD_SPRITE_PATH: 'assets/images/units/possum_elite/dead/',
    POSSUM_ELITE_DEAD_SPRITE_FILES: ['possum_elite_dead1.png', 'possum_elite_dead2.png'],
    POSSUM_ELITE_DEAD_SPRITE_SCALE: 0.3,

    // --- Units: General & AI ---
    UNIT_VISUALS: {
        STUCK_FRAMES_THRESHOLD: 2,
        UNIT_PHASING_DURATION: 2.75,
        UNIT_PHASING_OPACITY: 0.5,
        DRAW_GUN_AIM_INDICATOR: false,
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 1 },
        KIA_STYLE: { PLAYER_FILL_COLOR: 'darkgrey', ENEMY_FILL_COLOR: '#555555', OPACITY: 1 },
        GRENADE_AIM_INDICATOR: { COLOR: 'orange', LINE_WIDTH: 2, RADIUS_OFFSET: 6 },
        UNIT_BOBBING_ENABLED: true,
        UNIT_BOBBING_AMPLITUDE: 1, // How many pixels the unit moves up and down
        UNIT_BOBBING_SPEED_FACTOR: 0.2 // Multiplier to link bobbing speed to unit movement speed
    },
    UNIT_PATHING_RADIUS_BUFFER: 10, // Buffer around unit for pathfinding checks
    UNIT_STUCK_FRAMES_THRESHOLD: 2,
    STUCK_FRAMES_THRESHOLD_PATHING: 2,
    REPATH_STUCK_COOLDOWN: 0.3,

    ENEMY_ALERT_PROPAGATION_RADIUS: 200,
    ENEMY_INVESTIGATE_ATTACK_CHANCE: 0.95,
    ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT: 0.10,

    AI: {
        POSSUM_GRUNT: {
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
            DETECTION_RANGE: 370,
            MAX_CHASE_DISTANCE_FROM_POST_FACTOR: 0.95,
            GUARD_POST_POSITION_TOLERANCE: 5,
            SUSPICIOUS_STATE_SCAN_DURATION: 0.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.15,
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.5,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 3,
            MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY: 40,
            ENGAGE_RANGE_BUFFER: 5,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.0,
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75,
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 4,
        },
        POSSUM_BOSS_1: {
            ARENA_RADIUS: 250, // The required radius of clear space for the boss to spawn.
            DETECTION_RANGE: 550,
            PREFERRED_GRENADE_RANGE_MAX: 450,
            MIN_ENGAGEMENT_DISTANCE: 120, // Push player back if they get this close

            GRENADE_COOLDOWN_BETWEEN_SHOTS: 0.6, // Time between each grenade in a volley
            GRENADES_PER_VOLLEY: 4,             // How many grenades it fires in a row
            GRENADE_TARGET_SPREAD_RADIUS: 180,   // How far from the player it can aim grenades

            MG_BURST_SIZE: 10,                   // How many shots in one MG burst
            MG_COOLDOWN_AFTER_BURST: 2.5,       // Cooldown after completing an MG burst

            DEATH_EXPLOSION_RADIUS: 200, // Visual radius of the explosion on death
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE', // SFX key to play on death

            REPOSITION_DURATION_MAX_SECONDS: 2.0,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4], // Always spawns exactly 2
                countPerPhaseBonus: 0, // Boss guards don't scale
                spawnRadius: 100,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_sniper', weight: 1 }, // Chance for a sniper guard
                    { type: 'possum_heavy', weight: 3 }, // More likely to be heavies
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
        // --- NEW ---
        POSSUM_REVOLVER: {
            DETECTION_RANGE: 580,
            RELOAD_TIME_SECONDS: 2.0,
            BURST_SIZE: 8,
            STRAFE_DISTANCE: 75, // How far the boss moves in a single strafe.
            STRAFE_CHANCE: 0.5,  // 85% chance to decide to move when it's idle. Set to 1.0 to always move.
            initialGuardPack: {
                enabled: true,
                countRange: [1, 3],
                countPerPhaseBonus: 0.4,
                spawnRadius: 120,
                unitPool: [
                    { type: 'possum_grunt', weight: 3 },
                    { type: 'possum_sniper', weight: 2 }, // Often has sniper guards
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
        POSSUM_SNIPER: {
            DETECTION_RANGE: 750, // Can see slightly further than it can shoot
            SETUP_TIME_SECONDS: 2.5, // How long it aims before firing
            FIRE_COOLDOWN_SECONDS: 5.0, // Cooldown after a shot
            REPOSITION_CHANCE_AFTER_SHOT: 0.6, // 60% chance to move after firing
            REPOSITION_MAX_DISTANCE: 300,
            REPOSITION_MIN_DISTANCE: 100
        },
        POSSUM_ELITE: {
            DETECTION_RANGE: 520,
            PATROL_MIN_RADIUS: 100,
            PATROL_MAX_RADIUS: 250,
            PATROL_WAIT_BASE: 1.0,
            PATROL_WAIT_RANDOM_ADD: 1.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.30,
            ENGAGE_RANGE_BUFFER: 25,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
        },
    },

    // --- Projectiles & Weapons ---
    PROJECTILE_SIZE: 3,
    PROJECTILE_COLOR_RACCOON: '#ff9100',
    PROJECTILE_COLOR_RACCOON_PRIVATE: '#eeff00',
    PROJECTILE_COLOR_RACCOON_CORPORAL: '#00ff22',
    PROJECTILE_COLOR_RACCOON_SERGEANT: '#00ff95',
    PROJECTILE_COLOR_RACCOON_ELITE: '#00eeff',
    PROJECTILE_COLOR_RACCOON_GHOST: '#000000',
    PROJECTILE_COLOR_RACCOON_MAVERICK: '#8c00ff',
    PROJECTILE_COLOR_POSSUM: '#ff3c00',
    PROJECTILE_COLOR_POSSUM_HEAVY: '#ff4747',
    GRENADE_PROJECTILE_COLOR: '#228B22',
    PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER: 0, // 0 = no friendly fire, 1 = full damage

    WEAPON_SETTINGS: {
        ROF_JITTER_PERCENTAGE: 0.20
    },

    PROJECTILES: {
        BULLET: {
            LIFETIME: 0.7,
            MAX_SPREAD_ANGLE_RADIANS: Math.PI / 6,
            DESPAWN_WORLD_BUFFER: 50
        },
        GRENADE: {
            SPRITE_PATH: 'assets/images/projectiles/grenade.png',
            SPRITE_SCALE: 0.3,
            SIZE: 8,
            MIN_FLIGHT_TIME: 0.05,
            ARC_PEAK_HEIGHT_MIN: 20,
            ARC_PEAK_HEIGHT_DISTANCE_FACTOR: 0.2,
            MAX_LIFETIME_BUFFER: 1.5,
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

    // --- Roster, Progression & Campaign ---
    INITIAL_ROSTER_SIZE: 5,
    NEW_RECRUITS_PER_MISSION_WIN: 1,
    MAX_SQUAD_SIZE_MVP: 4,
    MAX_TOTAL_ROSTER_SIZE: 100,

    // Formation settings
    FORMATION_INDEX: 3,
    INITIAL_FORMATION_SPACING: 3.5, // Spacing between units in formation

    // --- Progression ---
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,
    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {}, nightVisionRadius: 180 },
        { rankName: "Private", xpNeeded: 300, statBoosts: { maxHpBonus: 10, bulletLifetimeBonus: 0.2 }, nightVisionRadius: 200 },
        { rankName: "Corporal", xpNeeded: 600, statBoosts: { maxHpBonus: 20, accuracyBonus: 0.05, bulletLifetimeBonus: 0.4 }, nightVisionRadius: 220 },
        { rankName: "Sergeant", xpNeeded: 1200, statBoosts: { maxHpBonus: 30, accuracyBonus: 0.1, bulletLifetimeBonus: 0.6 }, nightVisionRadius: 250 },
        { rankName: "Elite", xpNeeded: 2400, statBoosts: { maxHpBonus: 50, accuracyBonus: 0.2, bulletLifetimeBonus: 1.0 }, nightVisionRadius: 290 },
        { rankName: "Ghost", xpNeeded: 4800, statBoosts: { maxHpBonus: 100, accuracyBonus: 0.4, bulletLifetimeBonus: 1.2 }, nightVisionRadius: 350 }
    ],
    MAX_RANK_NAME: "Ghost",
    GRENADE_BONUS_CORPORAL: 1,
    GRENADE_BONUS_SERGEANT: 2,
    GRENADE_BONUS_ELITE: 3,
    GRENADE_BONUS_GHOST: 4,

    // --- Visuals & UI ---
    DEFAULT_WORLD_BACKGROUND_COLOR: '#417021',
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/',
    RACCOON_FACE_IMAGES: [
        'face1.png', 'face2.png', 'face3.png', 'face4.png',
        'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png'
    ],
    AUDIO_ASSETS: {
        // Weapons & Combat SFX
        RACCOON_MG_FIRE: { path: 'assets/audio/sfx/gun_mg_raccoon.mp3', defaultVolume: 0.2, pitchVariation: 0.3 },
        POSSUM_RIFLE_FIRE: { path: 'assets/audio/sfx/gun_grunt_possum.mp3', defaultVolume: 0.7, pitchVariation: 0.03 },
        POSSUM_HEAVY_MG_FIRE: { path: 'assets/audio/sfx/gun_heavy_possum.mp3', defaultVolume: 0.3, pitchVariation: 0.03 },
        POSSUM_BOSS_1_WEAPON_FIRE: { path: 'assets/audio/sfx/grenade_launcher.mp3', defaultVolume: 0.2, pitchVariation: 0.1 },
        GRENADE_EXPLODE: { path: 'assets/audio/sfx/grenade_explode.mp3', defaultVolume: 0.3, pitchVariation: 0.4 },
        // Unit SFX
        UI_BUTTON_CLICK: { path: 'assets/audio/sfx/ui_click_soft.mp3', defaultVolume: 0.1 },
        UI_BUTTON_HOVER: { path: 'assets/audio/sfx/ui_hover_gentle.mp3', defaultVolume: 0.3, pitchVariation: 0.1 },
        // Ambient sounds
        AMBIENT_FOREST_1: { path: 'assets/audio/ambience/tropical_forest_ambient_1.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_2: { path: 'assets/audio/ambience/tropical_forest_ambient_2.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_3: { path: 'assets/audio/ambience/tropical_forest_ambient_3.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_4: { path: 'assets/audio/ambience/tropical_forest_ambient_4.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_5: { path: 'assets/audio/ambience/ambience_temperate_day.mp3', defaultVolume: 1.0 },

        AMBIENT_MUSIC_TROPICAL_FOREST_KEYS: [
            'AMBIENT_FOREST_1',
            'AMBIENT_FOREST_2',
            'AMBIENT_FOREST_3',
            'AMBIENT_FOREST_4',
            'AMBIENT_FOREST_5'
        ],
        // Destruction SFX
        POSSUM_HUT_DESTROYED: { path: 'assets/audio/sfx/structure_wood_destroy_01.mp3', defaultVolume: 0.5, pitchVariation: 0.1 }, // Example: unique sound
        EXPLOSIVE_BARREL_DESTROYED: { path: 'assets/audio/sfx/barrel_explode_metal_01.mp3', defaultVolume: 0.1, pitchVariation: 0.2 }, // Example: unique sound
        EXPLOSIVE_BARREL_CLUSTER_DESTROYED: { path: 'assets/audio/sfx/barrel_explode_cluster_01.mp3', defaultVolume: 0.15, pitchVariation: 0.15 }, // Example for cluster
        // Add more SFX keys as needed, e.g., TREE_FALL_SOUND, FENCE_BREAK_SOUND
        
        // --- MUSIC TRACKS ---
        // Main Menu (also used for Pre-Mission Select, How to Play)
        MUSIC_MAIN_MENU: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.6 },
        
        // Mission Combat Music (simple - plays for entire mission)
        MUSIC_COMBAT_1: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.3 },
        
        // Boss Music
        MUSIC_BOSS_1: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.4 },
        
        // Victory/Defeat
        MUSIC_VICTORY_DEFAULT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.8 },
        MUSIC_DEFEAT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.5 },
        
        // Other States
        MUSIC_LOADING: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.4 },
        MUSIC_SHOOTOUT: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.5 },
        MUSIC_CAMPAIGN_COMPLETE: { path: 'assets/audio/music/End Game.mp3', defaultVolume: 0.7 },
        MUSIC_GAME_OVER: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.6 },
        
        // Ambient (tropical forest - already loaded above)
        // Using existing AMBIENT_FOREST_1-4 for tropical ambient
    },

    AUDIO_MUSIC: {
        // Master volume controls
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_AMBIENT_VOLUME: 0.7,
        
        // Transition time for crossfades
        STATE_TRANSITION_TIME: 1.0,
        
        // Per biome track lists
        BIOME_TRACKS: {
            TROPICAL: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: 'MUSIC_DEFEAT'
            },
            SWAMP: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: 'MUSIC_DEFEAT'
            }
        },
        
        // Mission type overrides (only boss needs special music)
        MISSION_TYPE_TRACKS: {
            BOSS: { combat: ['MUSIC_BOSS_1'] }
        },
        
        // Game state tracks
        STATE_TRACKS: {
            MAIN_MENU: 'MUSIC_MAIN_MENU',
            PRE_MISSION_SELECT: 'MUSIC_MAIN_MENU',  // Uses main menu music
            LOADING_MISSION: 'MUSIC_LOADING',
            POST_MISSION_DEBRIEF: null,  // Keeps playing VICTORY or DEFEAT music
            VICTORY: 'MUSIC_VICTORY_DEFAULT',
            DEFEAT: 'MUSIC_DEFEAT',
            PAUSE: null, // silence
            SHOOTOUT_PRE_GAME: 'MUSIC_SHOOTOUT',
            SHOOTOUT_PLAYING: 'MUSIC_SHOOTOUT',
            SHOOTOUT_AMBUSH: 'MUSIC_SHOOTOUT',
            CAMPAIGN_COMPLETE: 'MUSIC_CAMPAIGN_COMPLETE',
            GAME_OVER_NO_RECRUITS: 'MUSIC_GAME_OVER',
            HOW_TO_PLAY: 'MUSIC_MAIN_MENU',  // Uses main menu music
        }
    },

    VISUAL_EFFECTS: {
        PROMOTION: {
            LIFETIME: 1.5, TEXT: "PROMOTED!", FONT: "bold 16px 'Consolas', 'Lucida Console', monospace",
            COLOR_RGB_FADE_START: [255, 223, 0], VELOCITY_Y: -20
        },
        EXPLOSION: { LIFETIME: 1.8 },
        HOSTAGE_HELP_TEXT: {
            TEXT_OPTIONS: ['Help!', 'Over here!', 'Psst!', 'Save me!'],
            LIFETIME_SECONDS: 2.0,
            INTERVAL_MIN_SECONDS: 4.0,
            INTERVAL_MAX_SECONDS: 9.0,
            FONT: 'bold 18px Lucida Console',
            COLOR: 'yellow',
            Y_OFFSET: -45, // Pixels above the unit's y-coordinate
            FADE_OUT_START_PERCENT: 0.8 // Starts fading out at 90% of its lifetime
        },
        LASER_SIGHT: {
            COLOR_START: 'rgba(255, 0, 0, 0.0)',
            COLOR_END: 'rgba(255, 0, 0, 0.7)',
            LINE_WIDTH: 2
        },
        PICKUP: {
            LIFETIME: 1.7,
            TEXT: "+{QTY}",
            FONT: "bold 18px 'Consolas', 'Lucida Console', monospace",
            VELOCITY_Y: -25,
            ICON_Y_OFFSET: -10, // How far above the text the icon appears
            ICON_SIZE: 24 // Size of the icon in pixels
        }
    },

    UI_ASSETS: {
        GRENADE_ICON: 'assets/images/ui/icons/grenade_icon.png',
        HEALTH_ICON: 'assets/images/ui/icons/health_icon.png'
    },

    UI_SETTINGS: {
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 3, HEIGHT: 4, Y_OFFSET_BASE: 10, BG_COLOR: '#333333',
            HP_COLOR_FULL: '#00CC00', HP_COLOR_MEDIUM: '#CCCC00', HP_COLOR_LOW: '#CC0000',
            LOW_HP_THRESHOLD_PERCENT: 0.3, MEDIUM_HP_THRESHOLD_PERCENT: 0.6
        },
        RECRUIT_CARD: { DEFAULT_FACE_BG_COLOR: '#555555' },
        MEMORIAL_CARD: { DEFAULT_FACE_BG_COLOR: '#333333' },
        RANK_ICON_PATH: 'assets/images/ranks/',
        RANK_ICON_FILES: {
            'Recruit': 'recruit.png',
            'Private': 'private.png',
            'Corporal': 'corporal.png',
            'Sergeant': 'sergeant.png',
            'Elite': 'elite.png',
            'Ghost': 'ghost.png'
        }
    },

    // --- Level Generation & Obstacles ---
    LEVEL_GENERATION: {
        WORLD_MARGIN: 5,
        BORDER_WIDTH: 1,
        BORDER_COLOR: '#25221D',
        BORDER_OBSTACLE_TYPE: 'fence_barbed_straight_long',
        PLAYER_SPAWN_ZONE: {
            MIN_WIDTH: 180,
            WIDTH_FACTOR: 0.40,
            MIN_HEIGHT: 180,
            HEIGHT_FACTOR: 0.2, // 1/8th of playable height - spawn zone at bottom-left
            INTERNAL_PADDING_FACTOR: 80.0, // Factor to ensure enough space around player spawn
            PLAYER_SPAWN_ZONE_RESTRICTED_OBSTACLE_TYPES: [
                'possum_hut',
                'possum_hut_round',
                'possum_relay_tower',
                'rock_large',
                'rock_medium',
                'fence_barbed_straight_short',
                'fence_barbed_straight_long'

            ]
        },
        OBSTACLES: {
            BASE_COUNT: 100,
            WORLD_SIZE_FALLBACK_FACTOR: 1.0,
            RANDOM_ADDITION_MAX: 50,
            PLACEMENT_MAX_ATTEMPTS: 15
        },
        PLAYER_SPAWN_PLACEMENT: {
            MAX_ATTEMPTS: 30,
            FALLBACK_SPACING_FACTOR: 10.0,
            PLAYER_SPAWN_AREA: 0.2
        },
        DECORATIONS: {
            GRASS_CLUTTER: {
                MIN_SCALE: 1.1,
                MAX_SCALE: 1.5
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
            SPRITE_PATH: null, // Set to null to use canvas drawing
            FALLBACK_COLOR: 'rgba(60, 120, 255, 0.35)',
            WIDTH: 260,
            HEIGHT: 260,
            NAME: "Extraction Zone",
            PLACEMENT_MARGIN_FROM_EDGE: 30,
            MIN_DISTANCE_FROM_PLAYER_SPAWN: 900,
            MAX_PLACEMENT_ATTEMPTS: 20,
            // --- Sci-fi visual settings ---
            REVEAL_DURATION: 1.5,        // Seconds for the fade-in reveal animation
            PARTICLE_COUNT: 20,          // Number of floating particles in the zone
            SCAN_LINE_SPEED: 80,         // Pixels/sec for the sweeping scan line
            PRIMARY_COLOR: '#00FFD4',    // Cyan/teal holographic primary
            ACCENT_COLOR: '#FFFFFF',     // White accents
            GLOW_COLOR: 'rgba(0, 255, 212, 0.15)', // Subtle background glow
            BRACKET_LENGTH: 20,          // Length of corner bracket arms
            BRACKET_THICKNESS: 3,        // Line width for corner brackets
            PULSE_SPAWN_INTERVAL: 2.0,   // Seconds between pulse ring spawns
            PULSE_LIFETIME: 2.5,         // How long each pulse ring lasts
            LABEL_TEXT: 'EXTRACT',        // Text label on the zone
        },
        TREE_FALL_SETTINGS: {
            ENABLED: true,
            FALL_CHANCE: 0.45, // 45% chance a destroyed tree leaves a fallen log
            MAX_PLACEMENT_ATTEMPTS: 5, // How many times to try placing the log before giving up
            PLACEMENT_DISTANCE_MIN: 10, // Min distance from the stump
            PLACEMENT_DISTANCE_MAX: 20  // Max distance from the stump
        },
    },

    GRASS_SPRITE_PATH: 'assets/images/objects/biomes/tropical/grass2/',
    GRASS_SPRITE_FILES: [
        'grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png',
        'grass6.png', 'grass7.png', 'grass8.png', 'grass9.png', 'grass10.png',

    ],
    
    // Bushes
    BUSH_SPRITES_32PX_PATH: 'assets/images/objects/biomes/tropical/grass2/',
    BUSH_SPRITES_32PX_FILES: ['grass7.png'],

    TROPICAL_BUSH_LARGE_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    TROPICAL_BUSH_LARGE_FILES: [
        'fern_large_1.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png',
        'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png'
    ],

    PALM_BUSH_SMALL_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    PALM_BUSH_SMALL_FILES: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'],

    PALM_BUSH_LARGE_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    PALM_BUSH_LARGE_FILES: ['palm_bush_large_1.png', 'palm_bush_large_2.png'],

    // Rocks
    ROCK_SPRITES_16PX_PATH: 'assets/images/objects/rocks/grassy/16/',
    ROCK_SPRITES_16PX_FILES: [],

    ROCK_SPRITES_32PX_PATH: 'assets/images/objects/rocks/grassy/32/',
    ROCK_SPRITES_32PX_FILES: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png',],

    ROCK_SPRITES_64PX_PATH: 'assets/images/objects/rocks/grassy/64/',
    ROCK_SPRITES_64PX_FILES: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png'],

    // Palm Trees
    // 1
    PALM_TREE_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_SINGLE_SPRITE_FILES: ['palm1_single_1.png', 'palm1_single_2.png', 'palm1_single_3.png', ],

    PALM_TREE_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_DOUBLE_SPRITE_FILES: ['palm1_double.png'],

    PALM_TREE_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_TRIPLE_SPRITE_FILES: ['palm1_triple.png'],

    // 2
    PALM_TREE2_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_SINGLE_SPRITE_FILES: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'],

    PALM_TREE2_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_DOUBLE_SPRITE_FILES: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'],

    PALM_TREE2_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_TRIPLE_SPRITE_FILES: ['palm2_triple_1.png'],

    // Fallen Palm Trees (logs)
    PALM_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    PALM_TREE_FALLEN_SPRITE_FILES: ['palm_fallen_log_1.png'],

    PALM2_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    PALM2_TREE_FALLEN_SPRITE_FILES: ['palm_fallen_log_2.png'],

    // Fallen Deciduous Trees (logs)
    DECIDUOUS_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    DECIDUOUS_TREE_FALLEN_SPRITE_FILES: ['tree_fallen_log_1.png'],

    // Deciduous Trees
    DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES: ['tree2_single_tall.png'],

    TREE4_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    TREE4_SINGLE_SPRITE_FILES: ['tree4_single_large_1.png', 'tree4_single_large_2.png', 'tree4_single_large_3.png'],

    TREE5_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    TREE5_SINGLE_SPRITE_FILES: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png'],

    // Possum Huts
    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_FILES: [
        { normal: 'possum_hut_1_small.png', destroyed: 'possum_hut_1_small_destroyed.png' },
        { normal: 'possum_hut_2.png', destroyed: 'possum_hut_2_destroyed.png' },
        { normal: 'possum_hut_3.png', destroyed: 'possum_hut_3_destroyed.png' }
    ],

    POSSUM_HUT_ROUND_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_ROUND_SPRITE_FILES: [
        { normal: 'possum_hut_4.png', destroyed: 'possum_hut_4_destroyed.png' },
        { normal: 'possum_hut_5.png', destroyed: 'possum_hut_5_destroyed.png' }
    ],


    // Possum Towers
    POSSUM_RELAY_TOWER_SPRITE_PATH: 'assets/images/objects/possums/towers/',
    POSSUM_RELAY_TOWER_SPRITE_FILES: [
        { normal: 'possum_tower_2.png', destroyed: 'possum_tower_2_destroyed.png' },
        { normal: 'possum_tower_3.png', destroyed: 'possum_tower_3_destroyed.png' }
    ],


    HEALTH_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/health/',
    HEALTH_PICKUP_SPRITE_FILES: ['health_pickup_crate.png'],

    FENCE_BARBED_SPRITE_PATH: 'assets/images/objects/fences/barbed/',
    FENCE_BARBED_SHORT_SPRITE_FILES: ['fence_barbed_straight_short_1.png', 'fence_barbed_straight_short_2.png', 'fence_barbed_straight_short_3.png', 'fence_barbed_straight_short_4.png', 'fence_barbed_straight_short_5.png', 'fence_barbed_straight_short_6.png'],
    FENCE_BARBED_LONG_SPRITE_FILES: ['fence_barbed_straight_long_1.png', 'fence_barbed_straight_long_2.png'],

    OBSTACLE_DEFINITIONS: [
        {
            type: 'decoration_grass', name: 'Grass Patch', destructible: false,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: true,
        },
        {
            type: 'fence_barbed_straight_short', name: 'Barbed Wire Fence Straight Short',
            color: '#8B4513', destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.3), width: (w => w * 0.97), height: (h => h * 0.1) },
            canBeFlipped: true,
        },
        {
            type: 'fence_barbed_straight_long', name: 'Barbed Wire Fence Straight Long',
            color: '#8B4513', destructible: false, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.8, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.08), width: (w => w * 0.98), height: (h => h * 0.03) },
            canBeFlipped: true
        },
        // Bushes
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },

        // Palm Bushes
        {
            type: 'palm_bush_small', name: 'Small Palm Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_large', name: 'Large Palm Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },


        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 1,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.43), radiusY: (h => h * 0.29) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: (h => h * 0.29) },
            canBeFlipped: true,
        },
        {
            type: 'tree_palm_single', name: 'Palm Tree Single', color: '#005522',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.39), offsetY: (h => h * 1.25), radius: (w => w * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm_double', name: 'Palm Tree Double', color: '#005522',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.25), radiusX: (w => w * 0.17), radiusY: (h => h * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm_triple', name: 'Palm Tree Triple', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.3), radiusX: (w => w * 0.2), radiusY: (h => h * 0.10) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        // 2
        {
            type: 'tree_palm2_single', name: 'Palm Tree 2 Single', color: '#005522',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm2_double', name: 'Palm Tree 2 Double', color: '#005522',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radiusX: (w => w * 0.13), radiusY: (h => h * 0.085) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm2_triple', name: 'Palm Tree 2 Triple', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
        },
        
        // Fallen palm trees
        {
            type: 'tree_palm_fallen', name: 'Fallen Palm Tree', color: '#005522',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 1.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
        },
        {
            type: 'tree_palm2_fallen', name: 'Fallen Palm2 Tree', color: '#005522',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
        },
        
        // Deciduous Trees
        {
            type: 'tree_deciduous_single', name: 'Deciduous Tree Single', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.93), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.25,
            canBeFlipped: true,
        },

        
        {
            type: 'tree4_deciduous_single', name: 'Deciduous Tree Large', color: '#228B22',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.25,
            canBeFlipped: true,
        },
        {
            type: 'tree5_deciduous_single', name: 'Deciduous Tree Medium', color: '#228B22',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 1.5), radiusX: (w => w * 0.12), radiusY: (h => h * 0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.25,
            canBeFlipped: true,
        },

        // Fallen deciduous trees
        {
            type: 'tree_deciduous_fallen', name: 'Fallen Deciduous Tree', color: '#228B22',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
        },

        // Forest patches
        {
            type: 'forest_patch_dense_1',
            name: 'Dense Palm Forest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 3,
            spriteNormal: 'assets/images/objects/biomes/tropical/trees/palm_forest_1.png',
            spriteScale: 1.30,
            spriteDestroyed: null,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.05), offsetY: (h => h * 0.15), width: (w => w * 0.85), height: (h => h * 0.25) },
            placementBuffer: 50,
            canBeFlipped: true,
            isDecoration: false
        },
        {
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            explosionDamage: 50, explosionAoeRadius: 80,
            spriteNormal: 'assets/images/objects/barrels/barrel_red.png',
            spriteScale: 0.1,
            spriteDestroyed: 'assets/images/objects/barrels/barrel_red_destroyed.png',
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.048), offsetY: (h => h * 0.066), width: (w => w * 0.7), height: (h => h * 0.86) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_DESTROYED',
            canBeFlipped: false,
        },
        {
            type: 'explosive_barrel_cluster', name: 'Cluster Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            explosionDamage: 90, explosionAoeRadius: 120,
            spriteNormal: 'assets/images/objects/barrels/barrel_cluster.png',
            spriteScale: 0.1,
            spriteDestroyed: 'assets/images/objects/barrels/barrel_cluster_destroyed.png',
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.03), offsetY: (h => h * 0.05), width: (w => w * 0.7), height: (h => h * 0.7) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_CLUSTER_DESTROYED',
            canBeFlipped: false,
        },
        {
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1.5,
            pickupType: 'grenade', pickupQuantity: 2,
            spriteNormal: 'assets/images/objects/crates/crate_full.png',
            spriteScale: 0.15,
            spriteDestroyed: 'assets/images/objects/crates/crate_empty.png',
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true, // Crates might have markings
        },
        {
            type: 'pickup_health', name: 'Health Crate', color: '#FF69B4',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1.5,
            pickupType: 'health', pickupQuantity: 30,
            spriteScale: 0.25,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.875), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
        },
        {
            type: 'possum_hut', name: 'Possum Hut', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.2,
            spriteScale: 1,
            spriteDestroyedScale: 1,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.45), radiusX: (w => w * 0.35), radiusY: (h => h * 0.29) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3, // Scales with mission phase
                spawnRadius: 80,
                unitPool: [
                    { type: 'possum_grunt', weight: 10 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 0.4 },
                    { type: 'possum_elite', weight: 0.2 }
                ]
            }
        },

        {
            type: 'possum_hut_round', name: 'Round Possum Hut', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.2,
            spriteScale: 0.3,
            spriteDestroyedScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 0.45), radius: (w => w * 0.35) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true, // Huts have a clear orientation
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3, // Scales with mission phase
                spawnRadius: 80,
                unitPool: [
                    { type: 'possum_grunt', weight: 10 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 0.4 },
                    { type: 'possum_elite', weight: 0.2 }
                ]
            }
        },

        {
            type: 'possum_relay_tower', name: 'Possum Relay Tower', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            bulletDamageMultiplier: 0.5, // Relay towers take reduced damage from bullets
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.01,
            spriteScale: 0.4,
            spriteDestroyedScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 1.15), radiusX: (w => w * 0.40), radiusY: (h => h * 0.33) },
            isDecoration: false,
            sfxOnDestroy: 'STRUCTURE_METAL_DESTROYED',
            canBeFlipped: true,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4], // Fewer, but tougher guards
                countPerPhaseBonus: 0.1,
                spawnRadius: 100,
                unitPool: [
                    { type: 'possum_grunt', weight: 5 },
                    { type: 'possum_heavy', weight: 3 }, // More likely to be heavies
                    { type: 'possum_boss_1', weight: 0.1 }, // Chance for a boss unit
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 1 }
                ]
            }
        },
        {
            type: 'extraction_zone', name: 'Extraction Zone', color: '#3C78FF',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spriteNormal: null,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.1), width: (w => w * 0.8), height: (h => h * 0.8) },
        }

    ],

    ENEMY_SPAWNING: {
        QUADRANT_SPAWNING_ENABLED: true, // Master toggle for this system
        QUADRANT_COLS: 3,               // Default columns (used if scaling disabled or for fallback)
        QUADRANT_ROWS: 3,               // Default rows (used if scaling disabled or for fallback)
        QUADRANT_SCALING_ENABLED: true, // Scale grid size based on world size
        QUADRANT_BASE_COLS: 3,          // Base columns at worldSizeFactor = 1.0
        QUADRANT_BASE_ROWS: 3,          // Base rows at worldSizeFactor = 1.0
        QUADRANT_SCALE_COLS_PER_WORLD_FACTOR: 0.5, // Additional columns per worldSizeFactor increment
        QUADRANT_SCALE_ROWS_PER_WORLD_FACTOR: 0.3, // Additional rows per worldSizeFactor increment
        QUADRANT_RANDOMNESS_FACTOR: 0.3, // Random factor (0.3 = +/- 30% variation)
        QUADRANT_MIN_COLS: 3,           // Minimum columns cap
        QUADRANT_MIN_ROWS: 3,           // Minimum rows cap
        QUADRANT_MAX_COLS: 7,           // Maximum columns cap
        QUADRANT_MAX_ROWS: 5,           // Maximum rows cap
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 10,
        RANDOM_ADDITION_FACTOR_MAX: 8,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0,
        SMALL_GROUP_CHANCE: 0.6,
        SMALL_GROUP_SIZE_MIN: 2,
        SMALL_GROUP_SIZE_MAX: 5,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 450,
        LEADER_PLACEMENT_MAX_ATTEMPTS: 20,
        MEMBER_PLACEMENT_MAX_ATTEMPTS: 10,
        GROUP_SPREAD_BASE: 30,
        GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20,
        HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.1,

        POSSUM_HUT_SPAWNING: {
            MAX_ACTIVE_SPAWNING_HUTS_BASE: 1,
            MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS: 30,
            SPAWN_COOLDOWN_MAX_SECONDS: 120,
            UNITS_PER_SPAWN_MIN: 1,
            UNITS_PER_SPAWN_MAX: 3,
            TIME_BETWEEN_UNITS_IN_BURST_MIN: 0.3,
            TIME_BETWEEN_UNITS_IN_BURST_MAX: 1.9,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.25,
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 0,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 2,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 300,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -65,
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -3,
            SPAWN_AREA_WIDTH: 40,
            SPAWN_PHASING_DURATION: 0.25,
            DEBUG_DRAW_SPAWN_AREAS: false,
            DEBUG_DRAW_HUT_STATUS_TEXT: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 5,
            MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT: 5,
            INITIAL_MOVE_OUT_DISTANCE: 25,
            INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE: 0.6, // Max delay for spawn after hut is shot
            MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS: 2.0,     // Min time before another shot can trigger a spawn
            UNITS_TO_SPAWN_ON_DAMAGE: 2,                 // How many units spawn when hut is shot
            SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE: 10, // Cooldown for regular spawning after a damage-spawn
            SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE: 20,
            MAX_UNITS_PER_HUT_BASE: 6,              // Max units that can spawn from a hut over its lifetime
            MAX_UNITS_PER_HUT_PHASE_INCREMENT: 2,    // Additional max units per phase
        }
    },

    HOSTAGE_SETTINGS: {
        HP: 35,
        SPEED: 110,
        COLOR: '#ADD8E6',
        NEUTRAL_COLOR: '#FFD700',
        RESCUE_RADIUS: 60,
        FOLLOW_DISTANCE: 80,
        FOLLOW_LERP_SPEED: 0.04,
        POSSIBLE_RANKS_ON_RESCUE: [
            { rankName: "Recruit", xpNeeded: 0, weight: 40 },
            { rankName: "Private", xpNeeded: 100, weight: 25 },
            { rankName: "Corporal", xpNeeded: 300, weight: 18 },
            { rankName: "Sergeant", xpNeeded: 600, weight: 12 },
            { rankName: "Elite", xpNeeded: 1000, weight: 5 }
        ],
        MAX_HOSTAGES_PER_MISSION: 5,
        MIN_HOSTAGES_TO_RESCUE_FOR_WIN: 1,
        SPAWN_WITH_ENEMY_GROUPS: true,
        SPAWN_NEAR_CAPTORS_RADIUS: 60,
        MIN_CAPTORS_GROUP_SIZE: 3,
        HOSTAGE_PLACEMENT_ATTEMPTS_NEAR_GROUP: 30,
        SPAWN_AT_HUTS: true,
        MAX_HOSTAGES_PER_HUT: 2,
        SPAWN_OFFSET_FROM_HUT_X: -30,
        SPAWN_OFFSET_FROM_HUT_Y: (h_height => h_height * 0.5 + 30),
        MIN_HUT_DISTANCE_FROM_PLAYER_SPAWN_FOR_HOSTAGE: 500,
        HOSTAGE_PLACEMENT_ATTEMPTS_AT_HUT: 15,
        HOSTAGE_SPAWN_BUFFER: 20,
        INITIAL_GUARD_COUNT_MIN_PER_HOSTAGE_HUT: 3,
        INITIAL_GUARD_COUNT_MAX_PER_HOSTAGE_HUT: 5,
        INITIAL_GUARD_HEAVY_CHANCE_HOSTAGE_HUT: 0.20,
        INITIAL_GUARD_SPAWN_RADIUS_AROUND_HUT: 60,
        INITIAL_GUARD_PLACEMENT_ATTEMPTS: 10
    },

    AMBIENT_EFFECTS: {
        FLYING_BIRD: {
            TILE_SHEET_PATH: 'assets/images/effects/flying_bird_sheet.png',
            FRAME_WIDTH: 100,
            FRAME_HEIGHT: 100,
            NUM_FRAMES: 6,
            ANIMATION_SPEED: 0.1,
            FLIGHT_SPEED_MIN: 80,
            FLIGHT_SPEED_MAX: 90,
            MIN_Y_SPAWN_FACTOR: 0.1,
            MAX_Y_SPAWN_FACTOR: 0.6,
            FLOCK_SIZE_MIN: 1,
            FLOCK_SIZE_MAX: 6,
            FLOCK_SPACING_X: 50,
            FLOCK_SPACING_Y: 20,
            SPAWN_INTERVAL_MIN_SECONDS: 20,
            SPAWN_INTERVAL_MAX_SECONDS: 60,
            SCALE: 0.45,
        }
    },

    UI_TEXT_STRINGS: {
        CAMPAIGN_ALREADY_COMPLETE: "Campaign Already Complete! Restart from Main Menu.", ERROR_NO_INITIAL_RECRUITS: "All initial recruits were KIA! Operation failed before it began.",
        ERROR_LOAD_FIRST_MISSION_FAILED: "Error: Could not load campaign data to start the first mission.", ERROR_PREPARING_NEXT_BRIEFING: "Error preparing next mission briefing.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons KIA. Operation Failed.", CAMPAIGN_CONCLUDED_NO_MORE_MISSIONS: "Campaign Concluded (No more missions defined)!",
        PREMISSION_ERROR_PHASE_TITLE: "Campaign Error", PREMISSION_ERROR_MISSION_TITLE: "Error Loading Mission", PREMISSION_ERROR_BRIEFING: "Could not load mission details for selection.",
        MAX_SQUAD_ALERT: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.", NO_RECRUITS_SELECTED_ALERT: "Select at least one Raccoon for the mission!",
        INVALID_SQUAD_SIZE_ALERT: "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.", DEPLOY_LIST_EMPTY_PLACEHOLDER: "Click recruits on the left to deploy.",
        START_MISSION_BUTTON_ALERT_MAX_SIZE: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.", START_MISSION_BUTTON_ALERT_MIN_SIZE: "Select at least one Raccoon for the mission!",
        POST_MISSION_SUCCESS: "MISSION SUCCESSFUL!", POST_MISSION_FAILED: "MISSION FAILED!",
        POST_MISSION_SURVIVORS_NONE_VICTORY: "Mission accomplished, but no Raccoons survived.", POST_MISSION_SURVIVORS_NONE_DEFEAT: "All deployed Raccoons KIA.",
        POST_MISSION_FALLEN_NONE: "No casualties this mission.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons have been lost in action. The Platoon is no more. Operation Failed.",
        BUTTON_TEXT_NEXT_MISSION: "Next Mission", BUTTON_TEXT_RESTART_CAMPAIGN: "Restart Campaign", BUTTON_TEXT_START_PHASE_PREFIX: "Start ",
        BUTTON_TEXT_CAMPAIGN_COMPLETE: "View Final Stats", BUTTON_TEXT_RETRY_MISSION: "Retry Mission",
        MEMORIAL_NO_FALLEN: "No Raccoons have fallen... yet. Their legend awaits.", MEMORIAL_LABEL_NAME: "Name:", MEMORIAL_LABEL_RANK: "Rank Achieved:",
        MEMORIAL_LABEL_MISSION: "Fell In:", MEMORIAL_LABEL_PHASE: "During:",
        DEFAULT_OBJECTIVE_TEXT: "Defeat Possums", UNKNOWN_OBJECTIVE_TEXT: "Unknown Objective", HUD_NO_SQUAD_DEPLOYED: "No squad deployed.",
        UNKNOWN_PHASE_TEXT: "Unknown Phase", UNKNOWN_MISSION_TEXT: "Unknown Mission",
        GAMEOVER_VICTORY_TITLE: "CAMPAIGN COMPLETE!", GAMEOVER_DEFEAT_TITLE: "GAME OVER",
        CAMPAIGN_COMPLETE_PHASE_NAME: "Campaign Finished", CAMPAIGN_COMPLETE_MISSION_NAME: "All Possums Defeated!",
        ERROR_LOADING_MISSION_RETRY: "Error reloading mission for retry.", RACCOON_OUT_OF_GRENADES_LOG: "Raccoon {ID}: Out of grenades!",
        OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION: "Hostages ready! Proceed to Extraction Zone!",
        OBJECTIVE_RESCUE_HOSTAGES_AT_EVAC: "Hostages at EVAC: {COUNT}/{TOTAL}",

        // --- NEW OBJECTIVE TEXT STRINGS ---
        OBJECTIVE_EXTERMINATE_TEXT: "Eliminate Possums: {CURRENT}/{TOTAL}",
        OBJECTIVE_DESTROY_TARGET_GENERIC_TEXT: "Destroy {TARGET_NAME_PLURAL}: {CURRENT}/{TOTAL}", // Game.js will fill TARGET_NAME_PLURAL
        OBJECTIVE_RESCUE_HOSTAGES_TEXT: "Rescue Hostages: {CURRENT_RESCUED}/{TOTAL_SPAWNED} (Evac: {CURRENT_EVACUATED}/{MIN_TO_EVAC}){KIA_TEXT}",
        OBJECTIVE_RESCUE_TAKEN_HOSTAGE_TEXT: "Rescue Captured comrade from captivity",
        OBJECTIVE_EXTRACTION_TEXT: "Extract All Units: Get to Extraction Zone",
        OBJECTIVE_EXTRACTION_PROCEED: "All objectives complete! Proceed to Extraction Zone!",
        EXTRACTION_ZONE_REVEALED: "Extraction Zone Revealed!"
        // Example for a specific destroy target type if you want very custom text per target:
        // OBJECTIVE_DESTROY_HUTS_TEXT: "Demolish Possum Huts: {CURRENT}/{TOTAL}",
        // OBJECTIVE_DESTROY_TOWERS_TEXT: "Sabotage Relay Towers: {CURRENT}/{TOTAL}",
        // ---
    },

    NIGHT_MISSION: {
        CHANCE: 0.1,                           // 10% chance any mission is a night mission
        UNLOCKS_PHASE: 2,                       // Only appears from phase 1 onward
        OVERLAY_COLOR: 'rgba(0, 0, 20, 0.92)', // Very dark blue-black
        PLAYER_VISION_RADIUS: 220,              // Pixels each raccoon can see
        VISION_EDGE_SOFTNESS: 60,               // Gradient fade width at vision circle edge
        VISION_TINT_OPACITY: 0.45,              // Residual darkness inside vision circles (0=full daylight, 1=full dark)
        ENEMY_DETECTION_MULTIPLIER: 0.45,       // Enemy sight range multiplier at night (e.g. 0.45 = 45% of normal)
        PLAYER_DETECTION_MULTIPLIER: 0.65,      // Player raccoon auto-target range multiplier at night
        ENEMY_NIGHT_ACCURACY_PENALTY: -0.15,    // Flat accuracy reduction for enemies at night
        NIGHT_DETECTION_RADIUS_IN_DARK: 100,     // Enemies can only see units in the dark if this close
        ENEMY_NIGHT_ALERT_MULTIPLIER: 0.65,      // Enemy alert propagation range multiplier at night
    },

    // --- Shootout Mode Settings ---
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
        ELIMINATION_PAR_TIME_PER_TARGET: 3.5, // Time expected per kill for bonus calculation
        INITIAL_PLAYER_HEALTH: 75,
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
        // Enemy Attack Timing Settings
        WARNING_DURATION: 1.0,       // Seconds to show exclamation mark before firing
        BASE_TRAVEL_TIME: 1.0,       // Base seconds for bullet to reach player (modified by enemy scale)
        TRAVEL_TIME_SCALE_FACTOR: 1.0, // Multiplier for travel time calculation (time = base / (scale * factor))
        HEADSHOT_THRESHOLD: 0.3,     // Top 30% of hitbox is a headshot

        

        // Visibility Settings
        // Static threshold (used if DYNAMIC_VISIBILITY_THRESHOLD is false)
        VISIBILITY_THRESHOLD: 0.50,  // 50% of peek distance before becoming visible (0.0 - 1.0)
        FADE_ZONE_SIZE: 0.20,        // 20% transition zone for smooth fade (0.0 - 1.0)

        // Dynamic Visibility Threshold Settings
        // Adjusts visibility threshold based on how far the enemy peeks from cover
        DYNAMIC_VISIBILITY_THRESHOLD: true,  // Set to false to use static threshold above
        // Minimum peek offset (enemy barely exposed - should be harder to see)
        PEEK_OFFSET_MIN: 20,
        // Maximum peek offset (enemy fully exposed - should be easier to see)
        PEEK_OFFSET_MAX: 200,
        // Visibility threshold when enemy is barely exposed (small peek offset)
        VISIBILITY_THRESHOLD_WHEN_HIDDEN: 0.7,  // 70% - harder to see
        // Visibility threshold when enemy is fully exposed (large peek offset)
        VISIBILITY_THRESHOLD_WHEN_EXPOSED: 0.3,  // 30% - easier to see


        // Enemy Tilesheets (4 frames: 0=idle, 1=aiming, 2=shooting, 3=dead)
        ENEMY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_grunt_tile.png',
            FRAME_WIDTH: 128,
            FRAME_HEIGHT: 128,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 0.7  // Scale multiplier for the tile sprite (separate from grunt scale)
        },
        ENEMY_HEAVY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_heavy_tile.png',
            FRAME_WIDTH: 128,
            FRAME_HEIGHT: 128,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 0.9  // Heavy enemies are slightly larger
        },

        // Bullet Mark Sprites
        BULLET_MARKS: {
            ENEMY_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_enemy.png',
                DEFAULT_SCALE: 0.6
            },
            ENVIRONMENT_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_environment.png',
                DEFAULT_SCALE: 0.7
            }
        },

        // Default enemy spawn configuration for new spawn points
        DEFAULT_ENEMY_CONFIGS: {
            grunt: {
                enabled: true,
                weight: 60,
                peekOffset: 40,
                scale: 1.0,
                bulletOffset: { x: -3, y: 14 },
                showInDevMode: true
            },
            heavy: {
                enabled: false,
                weight: 25,
                peekOffset: 50,
                scale: 1.2,
                bulletOffset: { x: 5, y: 2 },
                showInDevMode: true
            },
            elite: {
                enabled: false,
                weight: 15,
                peekOffset: 45,
                scale: 1.1,
                bulletOffset: { x: -3, y: 12 },
                showInDevMode: true
            }
        },

        // Enemy type definitions for UI
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

        // Debug/Dev Mode Settings
        DEBUG_SHOW_SPAWN_AREAS: false,
        DEBUG_SPAWN_AREA_SIZE: 64, // Size of debug box around spawn points
        DEBUG_SPAWN_AREA_COLOR: 'rgba(255, 255, 0, 0.5)', // Yellow semi-transparent
        DEBUG_PEEK_LINE_COLOR: 'rgba(255, 0, 0, 0.8)', // Red for peek direction
        DEBUG_TEXT_COLOR: '#00FF00', // Green for coordinate text

        // Enhanced Game Over Settings
        GAME_OVER_BUTTON_DELAY: 1.5, // Seconds to wait before showing buttons (prevents accidental clicks)

        // Damage Tracking & Penalty Settings
        MAX_DAMAGE_ALLOWED: 75, // Maximum damage player can take before penalty is maxed out
        DAMAGE_MULTIPLIER: 0.5, // Multiplier for damage penalty calculation (higher = more penalty)

        // Grade Thresholds (for final score after damage penalty)
        GRADE_THRESHOLDS: {
            S: { minScore: 12000, minAccuracy: 0.95, minDamageEfficiency: 0.9, minHeadshotPct: 0.4 },
            A: { minScore: 9000, minAccuracy: 0.85, minDamageEfficiency: 0.7, minHeadshotPct: 0.25 },
            B: { minScore: 6500, minAccuracy: 0.75, minDamageEfficiency: 0.5, minHeadshotPct: 0.15 },
            C: { minScore: 4000, minAccuracy: 0.6, minDamageEfficiency: 0.3, minHeadshotPct: 0.05 },
            D: { minScore: 2000, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 },
            F: { minScore: 0, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 }
        },

    // Multiple backgrounds with their own spawn positions
        BACKGROUNDS: {
            JUNGLE_AMBUSH: {
                NAME: 'Jungle Ambush',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_3.png',
                TREE_SPAWN_POSITIONS:
                    // x, y = hidden position behind tree
                    // peekOffset = how far they move when peeking
                    // peekDirection = 'left' | 'right' | 'up'
                    // Possums always face south (toward player) in this mode
                    [{"x":345,"y":905,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},{"x":469,"y":744,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":70,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":true,"weight":16,"peekOffset":70,"scale":1.5,"showInDevMode":true}}},{"x":567,"y":608,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":60,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":60,"scale":0.9,"showInDevMode":true}}},{"x":1540,"y":609,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":90,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":70,"scale":1.3,"showInDevMode":true}}},{"x":1393,"y":776,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":65,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":65,"scale":1,"showInDevMode":true}}},{"x":1560,"y":814,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":145,"scale":1.9,"showInDevMode":true},"heavy":{"enabled":true,"weight":40,"peekOffset":115,"scale":1.9,"showInDevMode":true}}},{"x":663,"y":778,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":130,"scale":1.5,"showInDevMode":true},"heavy":{"enabled":true,"weight":50,"peekOffset":155,"scale":1.5,"showInDevMode":true}}},{"x":90,"y":422,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":75,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":75,"scale":1.4,"showInDevMode":true}}},{"x":1030,"y":581,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.5,"showInDevMode":true}}},{"x":1265,"y":999,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":95,"scale":1.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":95,"scale":1.6,"showInDevMode":true}}},{"x":1135,"y":323,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":1,"showInDevMode":true}}},{"x":1271,"y":731,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":140,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":true,"weight":50,"peekOffset":140,"scale":0.9,"showInDevMode":true}}},{"x":1485,"y":665,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":50,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":50,"scale":0.7,"showInDevMode":true}}},{"x":1082,"y":1081,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":145,"scale":2,"showInDevMode":true},"heavy":{"enabled":true,"weight":35,"peekOffset":105,"scale":3.1,"showInDevMode":true}}},{"x":835,"y":666,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":35,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":35,"scale":0.6,"showInDevMode":true}}},{"x":711,"y":1013,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":110,"scale":1.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":110,"scale":1.8,"showInDevMode":true}}},{"x":1039,"y":596,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":60,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"showInDevMode":true}}}]
            },
            JUNGLE_ATTACK: {
                NAME: 'Jungle Attack',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_1.png',
                TREE_SPAWN_POSITIONS: [{ "x": 358, "y": 904, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 85, "scale": 1.9, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 0, "peekOffset": 85, "scale": 2, "showInDevMode": true } } }, { "x": 453, "y": 721, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 95, "scale": 1.1, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 16, "peekOffset": 100, "scale": 1.5, "showInDevMode": false } } }, { "x": 567, "y": 608, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 60, "scale": 0.8, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 60, "scale": 0.9, "showInDevMode": true } } }, { "x": 1245, "y": 886, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 90, "scale": 1.2, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 70, "scale": 1.3, "showInDevMode": true } } }, { "x": 1393, "y": 776, "peekDirection": "left", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 65, "scale": 1, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 65, "scale": 1, "showInDevMode": true } } }, { "x": 1560, "y": 815, "peekDirection": "left", "enemyConfigs": { "grunt": { "enabled": true, "weight": 50, "peekOffset": 100, "scale": 1.6, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 40, "peekOffset": 130, "scale": 1.8, "showInDevMode": true } } }, { "x": 663, "y": 778, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 50, "peekOffset": 130, "scale": 1.5, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 50, "peekOffset": 155, "scale": 1.5, "showInDevMode": true } } }, { "x": 99, "y": 425, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 75, "scale": 1.3, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 75, "scale": 1.4, "showInDevMode": true } } }, { "x": 1030, "y": 581, "peekDirection": "left", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 55, "scale": 0.5, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 55, "scale": 0.5, "showInDevMode": true } } }, { "x": 1345, "y": 970, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 85, "scale": 1.6, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 95, "scale": 1.6, "showInDevMode": true } } }, { "x": 1135, "y": 323, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 55, "scale": 1, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 55, "scale": 1, "showInDevMode": true } } }, { "x": 1267, "y": 736, "peekDirection": "left", "enemyConfigs": { "grunt": { "enabled": true, "weight": 50, "peekOffset": 140, "scale": 0.9, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 50, "peekOffset": 140, "scale": 0.9, "showInDevMode": true } } }, { "x": 1459, "y": 627, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 50, "scale": 0.7, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 50, "scale": 0.7, "showInDevMode": true } } }, { "x": 1031, "y": 1037, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 50, "peekOffset": 135, "scale": 1.7, "showInDevMode": true }, "heavy": { "enabled": true, "weight": 35, "peekOffset": 155, "scale": 2, "showInDevMode": true } } }, { "x": 835, "y": 666, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 35, "scale": 0.6, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 35, "scale": 0.6, "showInDevMode": true } } }, { "x": 734, "y": 1020, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 100, "peekOffset": 135, "scale": 1.5, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 0, "peekOffset": 110, "scale": 1.8, "showInDevMode": true } } }, { "x": 1039, "y": 596, "peekDirection": "right", "enemyConfigs": { "grunt": { "enabled": true, "weight": 70, "peekOffset": 60, "scale": 0.5, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 30, "peekOffset": 50, "scale": 1.2, "showInDevMode": true } } }, { "x": 1662, "y": 388, "peekDirection": "up", "enemyConfigs": { "grunt": { "enabled": true, "weight": 70, "peekOffset": 40, "scale": 0.8, "showInDevMode": true }, "heavy": { "enabled": false, "weight": 30, "peekOffset": 50, "scale": 1.2, "showInDevMode": true } } }]
            },
            JUNGLE_RUINS: {
                NAME: 'Jungle Ruins',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_2.png',
                TREE_SPAWN_POSITIONS: [{"x":1084,"y":753,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":95,"scale":1.5,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":130,"scale":1.6,"showInDevMode":true}}},{"x":476,"y":765,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.1,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":90,"scale":1.5,"showInDevMode":true}}},{"x":1184,"y":603,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":65,"scale":1.2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1364,"y":739,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":85,"scale":1.2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":100,"scale":1.4,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1596,"y":889,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":1.9,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":100,"scale":1.8,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":680,"y":768,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":95,"scale":1.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":85,"scale":1.4,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":925,"y":532,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":40,"scale":0.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":0.7,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1010,"y":531,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":40,"scale":0.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":395,"y":573,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":75,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":770,"y":538,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":30,"scale":0.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1265,"y":790,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":75,"scale":1.3,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1100,"y":588,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":60,"scale":0.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1654,"y":746,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":75,"scale":1.2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1087,"y":1060,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":45,"scale":2.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":50,"scale":3,"bulletOffset":{"x":5,"y":2},"showInDevMode":false}}},{"x":717,"y":1044,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":120,"scale":2.4,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":50,"scale":3.1,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}}]
            },
            JUNGLE_RUINS_2: {
                NAME: 'Jungle Ruins 2',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_4.png',
                TREE_SPAWN_POSITIONS: [{"x":202,"y":945,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":200,"scale":2,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":195,"scale":2.3,"showInDevMode":true}}},{"x":464,"y":710,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":95,"scale":1.4,"showInDevMode":true}}},{"x":903,"y":605,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":65,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":90,"scale":1,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1176,"y":610,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1354,"y":964,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":110,"scale":2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":105,"scale":2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":975,"y":1052,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":45,"scale":2.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":false},"heavy":{"enabled":true,"weight":30,"peekOffset":50,"scale":3,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":745,"y":882,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":60,"scale":1.3,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1325,"y":699,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":70,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},{"x":1149,"y":333,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":70,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}}]
            }
        },

        DEFAULT_BACKGROUND: 'JUNGLE_AMBUSH',

        // --- Ambush Integration Settings ---
        // Chance (0-1) that an ambush will trigger when getting out of the heli at mission start
        AMBUSH_START_CHANCE: 0.5,
        // Chance (0-1) that an ambush will trigger when evacuating
        AMBUSH_EXTRACTION_CHANCE: 1.0,
        // Duration (ms) to show the ambush alert before auto-transitioning
        AMBUSH_ALERT_DURATION: 3000,
        // Game mode to use for ambushes: 'TIME_ATTACK' or 'ELIMINATION' (fallback if random selection disabled)
        AMBUSH_DEFAULT_MODE: 'ELIMINATION',
        // Chance (0-1) that an ambush will be TIME_ATTACK mode vs ELIMINATION mode. 0.5 = 50/50
        AMBUSH_TIME_ATTACK_CHANCE: 0.5,
        AMBUSH_TIME_LIMIT: 30,
        AMBUSH_ELIMINATION_COUNT: 15,
        AMBUSH_NIGHT_MODE_ENABLED: true,
        AMBUSH_BACKGROUNDS: ['JUNGLE_AMBUSH', 'JUNGLE_ATTACK', 'JUNGLE_RUINS', 'JUNGLE_RUINS_2'],
        AMBUSH_UNLOCKS_PHASE: 2,

        // --- Ambush Success/Failure Rewards ---
        // XP bonus per ambush survived (applied at end of mission)
        XP_PER_AMBUSH_SURVIVED: 100,

        // Ambush alert messages for different scenarios
        AMBUSH_ALERT_MESSAGES: {
            // Mission start ambush messages
            START_AMBUSH: [
                "AMBUSH! Get down!",
                "Enemies spotted! Return fire!",
                "We're under fire! Clear the area!",
                "Hostiles! Engage immediately!",
                "Ambush! Open fire!",
                "Taking fire! Return fire!",
                "Enemies! Shoot them!",
                "Contact! All units, open fire!"
            ],
            // Extraction ambush messages
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

        // Victory/Defeat messages for ambushes
        AMBUSH_RESULT_MESSAGES: {
            VICTORY: [
                "Area clear! Good work!",
                "All hostiles eliminated!",
                "Threat neutralized!",
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
    }
};
