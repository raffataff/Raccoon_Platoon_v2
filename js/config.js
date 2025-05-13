// js/config.js
const CONFIG = {
    // --- Core Game & World ---
    BASE_WORLD_WIDTH: 1280,
    BASE_WORLD_HEIGHT: 720,
    MIN_CANVAS_WIDTH: 800,
    MIN_CANVAS_HEIGHT: 600,
    MAX_DELTA_TIME_STEP: 0.1,
    CAMERA_LERP_SPEED: 0.08,

    // --- Input ---
    INPUT_DRAG_THRESHOLD: 5,

    // --- Units: Raccoon (Player) ---
    RACCOON_HP: 30,
    RACCOON_SPEED: 100,
    RACCOON_SIZE: 12,
    RACCOON_COLOR: '#808080',
    RACCOON_MG_DAMAGE: 7,
    RACCOON_MG_ROF: 5,
    RACCOON_MG_RANGE: 200,
    RACCOON_MG_PROJECTILE_SPEED: 500,
    RACCOON_MG_ACCURACY_STATIONARY: 0.90,
    RACCOON_MG_ACCURACY_MOVING: 0.60,
    RACCOON_STARTING_GRENADES: 1,
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 45,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 220,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,

    // --- Units: Possum Grunt ---
    POSSUM_GRUNT_HP: 30,
    POSSUM_GRUNT_SPEED: 80,
    POSSUM_GRUNT_SIZE: 14,
    POSSUM_GRUNT_COLOR: '#A0522D',
    POSSUM_RIFLE_DAMAGE: 8,
    POSSUM_RIFLE_ROF: 3,
    POSSUM_RIFLE_RANGE: 190,
    POSSUM_RIFLE_PROJECTILE_SPEED: 400,
    POSSUM_RIFLE_ACCURACY_STATIONARY: 0.75,
    POSSUM_RIFLE_ACCURACY_MOVING: 0.45,

    // --- Units: Possum Heavy ---
    POSSUM_HEAVY_HP: 70,
    POSSUM_HEAVY_SPEED: 50,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_WEAPON_DAMAGE: 18,
    POSSUM_HEAVY_WEAPON_ROF: 1.2,
    POSSUM_HEAVY_WEAPON_RANGE: 240,
    POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED: 350,
    POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY: 0.85,
    POSSUM_HEAVY_WEAPON_ACCURACY_MOVING: 0.3,

    // --- Units: General & AI ---
    UNIT_STUCK_FRAMES_THRESHOLD: 30,
    POSSUM_DETECTION_RANGE: 250,
    ENEMY_ALERT_PROPAGATION_RADIUS: 180,
    ENEMY_INVESTIGATE_ATTACK_CHANCE: 0.85,
    ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT: 0.20,

    AI: {
        POSSUM_GRUNT: {
            PATROL_MIN_RADIUS: 80,
            PATROL_MAX_RADIUS: 200,
            PATROL_POINT_WORLD_MARGIN_BUFFER: 20,
            PATROL_WAIT_BASE: 1.5,
            PATROL_WAIT_RANDOM_ADD: 2.0,
            ENGAGE_PREFERRED_RANGE_FACTOR: 0.80,
            ENGAGE_KITE_RANGE_FACTOR: 0.30,
            ENGAGE_ADVANCE_RANGE_FACTOR: 0.95,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.0,
        },
        POSSUM_HEAVY: {
            DETECTION_RANGE: 270,
            MAX_CHASE_DISTANCE_FROM_POST_FACTOR: 0.85,
            GUARD_POST_POSITION_TOLERANCE: 5,
            SUSPICIOUS_STATE_SCAN_DURATION: 0.5,
            ENGAGE_CHASE_LIMIT_BUFFER_FACTOR: 0.2,
            ENGAGE_PREFERRED_RANGE_FACTOR: 0.85,
            STUCK_ENGAGE_NUDGE_FACTOR: 1.5,
        }
    },

    // --- Projectiles & Weapons ---
    PROJECTILE_SIZE: 2,
    PROJECTILE_COLOR_RACCOON: '#FFFF00',
    PROJECTILE_COLOR_POSSUM: '#FFA500',
    PROJECTILE_COLOR_POSSUM_HEAVY: '#FF6347',
    GRENADE_PROJECTILE_COLOR: '#228B22',

    PROJECTILES: {
        BULLET: {
            LIFETIME: 1.5,
            MAX_SPREAD_ANGLE_RADIANS: Math.PI / 6,
            DESPAWN_WORLD_BUFFER: 50
        },
        GRENADE: {
            SIZE: 4, // Calculated as (CONFIG.PROJECTILE_SIZE || 2) + 2 in weapon.js if preferred
            MIN_FLIGHT_TIME: 0.05,
            ARC_PEAK_HEIGHT_MIN: 20,
            ARC_PEAK_HEIGHT_DISTANCE_FACTOR: 0.2,
            MAX_LIFETIME_BUFFER: 2.0,
            SHADOW: {
                COLOR_RGBA: [0, 0, 0, 0.3],
                Y_OFFSET_FACTOR: 0.5,
                ELLIPSE_Y_RADIUS_FACTOR: 0.5,
                PEAK_HEIGHT_MULTIPLIER_SCALE: 1.5,
                MAX_REDUCTION_SCALE: 0.8
            },
            FUSE_BLINK: {
                THRESHOLD_SECONDS: 0.5,
                COLOR: 'red',
                SIZE_ADDITION: 2
            }
        }
    },

    // --- Roster, Progression & Campaign ---
    INITIAL_ROSTER_SIZE: 5,
    NEW_RECRUITS_PER_MISSION_WIN: 1,
    MAX_SQUAD_SIZE_MVP: 4,
    MAX_TOTAL_ROSTER_SIZE: 20,
    INITIAL_FORMATION_SPACING: 3.5,
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,
    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {} },
        { rankName: "Private", xpNeeded: 50, statBoosts: { maxHpBonus: 2 } },
        { rankName: "Corporal", xpNeeded: 150, statBoosts: { maxHpBonus: 4, accuracyBonus: 0.02 } },
        { rankName: "Sergeant", xpNeeded: 350, statBoosts: { maxHpBonus: 6, accuracyBonus: 0.04 } },
        { rankName: "Elite", xpNeeded: 600, statBoosts: { maxHpBonus: 8, accuracyBonus: 0.06 } },
        { rankName: "Ghost", xpNeeded: 1000, statBoosts: { maxHpBonus: 10, accuracyBonus: 0.08 } }
    ],
    MAX_RANK_NAME: "Ghost",
    GRENADE_BONUS_CORPORAL: 1,
    GRENADE_BONUS_SERGEANT: 1,

    // --- Visuals & UI ---
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/',
    RACCOON_FACE_IMAGES: [
        'face1.png', 'face2.png', 'face3.png', 'face4.png',
        'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png'
    ],
    VISUAL_EFFECTS: {
        PROMOTION: {
            LIFETIME: 1.5, TEXT: "PROMOTED!", FONT: "bold 16px 'Consolas', 'Lucida Console', monospace",
            COLOR_RGB_FADE_START: [255, 223, 0], VELOCITY_Y: -20
        },
        EXPLOSION: { LIFETIME: 0.5 }
    },
    UI_SETTINGS: {
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 1.5, HEIGHT: 4, Y_OFFSET_BASE: -5, BG_COLOR: '#333333',
            HP_COLOR_FULL: '#00CC00', HP_COLOR_MEDIUM: '#CCCC00', HP_COLOR_LOW: '#CC0000',
            LOW_HP_THRESHOLD_PERCENT: 0.3, MEDIUM_HP_THRESHOLD_PERCENT: 0.6
        },
        RECRUIT_CARD: { DEFAULT_FACE_BG_COLOR: '#555555' },
        MEMORIAL_CARD: { DEFAULT_FACE_BG_COLOR: '#333333' }
    },
    UNIT_VISUALS: {
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 2 },
        KIA_STYLE: { PLAYER_FILL_COLOR: 'darkgrey', ENEMY_FILL_COLOR: '#555555', OPACITY: 0.6 },
        GRENADE_AIM_INDICATOR: { COLOR: 'orange', LINE_WIDTH: 2, RADIUS_OFFSET: 6 }
    },

    // --- Level Generation & Obstacles ---
    LEVEL_GENERATION: {
        WORLD_MARGIN: 20, BORDER_WIDTH: 30, BORDER_COLOR: '#25221D',
        PLAYER_SPAWN_ZONE: { 
            MIN_WIDTH: 150, 
            WIDTH_FACTOR: 0.20, 
            MIN_HEIGHT: 100, 
            HEIGHT_FACTOR: 0.20, 
            INTERNAL_PADDING_FACTOR: 1.5 
        },
        OBSTACLES: { 
            BASE_COUNT: 100, 
            WORLD_SIZE_FALLBACK_FACTOR: 1.0, 
            RANDOM_ADDITION_MAX: 8, 
            PLACEMENT_MAX_ATTEMPTS: 15 
        },
        PLAYER_SPAWN_PLACEMENT: { 
            MAX_ATTEMPTS: 30, 
            FALLBACK_SPACING_FACTOR: 3.0 
        },
        DECORATIONS: { // New section for decoration-specific settings
            GRASS_CLUTTER: {
                // If you want grass patches to have varied sizes, define min/max here
                // and use them in level.js if the template is 'decoration_grass'
                // MIN_SIZE: 20,
                // MAX_SIZE: 48,
                // Or if you want to scale the chosen sprite randomly:
                MIN_SCALE: 1.1,
                MAX_SCALE: 1.5
            }
        }
    },

    GRASS_SPRITE_FILES: [ // Add all your grass sprite filenames here
        '1.png',
        '2.png',
        '3.png',
        '4.png',
        '5.png',
        '6.png'
        // ... etc.
    ],
    GRASS_SPRITE_PATH: 'assets/images/objects/grass/', // Path to the grass folder

    OBSTACLE_DEFINITIONS: [
        {
            type: 'decoration_grass',
            name: 'Grass Patch',
            // No color needed if always using sprites
            destructible: false, // Grass isn't typically destroyed by gameplay
            blocksMovement: false,
            providesCover: false,
            width: 15, height: 16, // Define a base size for placement, sprite can vary
                                   // Or use minW/maxW if grass patches should have varied footprints
            spawnWeight: 100,       // Make grass fairly common
            isDecoration: true,    // Custom flag to identify it as purely visual
            // Sprites will be chosen randomly from GRASS_SPRITE_FILES
        },
        {
            type: 'rock_large', name: 'Large Rock', color: '#504840', destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            minW: 70, maxW: 160, minH: 70, maxH: 160, // Varied size
            spawnWeight: 5
        },
        {
            type: 'rock_small', name: 'Small Rock', color: '#605850', destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            minW: 30, maxW: 60, minH: 30, maxH: 60, // Varied size
            spawnWeight: 10
        },
        {
            type: 'tree_dense', name: 'Dense Tree', color: '#285020', destructible: true, hp: 80, maxHp: 80,
            blocksMovement: true, providesCover: true,
            minW: 40, maxW: 90, minH: 40, maxH: 90, // Varied size
            spawnWeight: 8
        },
        {
            type: 'bush_light', name: 'Light Bush', color: '#3A6B35', destructible: true, hp: 20, maxHp: 20,
            blocksMovement: false, providesCover: true,
            minW: 30, maxW: 70, minH: 30, maxH: 70, // Varied size
            spawnWeight: 12
        },
        {
            type: 'fence_wood', name: 'Wooden Fence', color: '#8B4513', destructible: true, hp: 40, maxHp: 40,
            blocksMovement: true, providesCover: true,
            width: 120, height: 15, // Example of fixed size for fences (can still vary length if needed via minW/maxW)
            // Or if you want varied length:
            // minW: 80, maxW: 180, height: 15, // Fixed height, varied width
            spawnWeight: 7
        },
        {
            type: 'building_shed', name: 'Shed', color: '#787860', destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 120, height: 100, // Fixed size for sheds
            // Or use minW/maxW, minH/maxH if sheds should vary
            spawnWeight: 8
        },
        { // EXPLOSIVE BARREL - Fixed size
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            width: 25, height: 35, // <<-- FIXED SIZE
            spawnWeight: 5,
            explosionDamage: 50, explosionAoeRadius: 80,
            spriteNormal: 'assets/images/objects/barrel_red.png',
            spriteDestroyed: 'assets/images/objects/barrel_red_destroyed.png'
        },
        { // GRENADE CRATE PICKUP - Fixed size
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            width: 32, height: 32, // <<-- FIXED SIZE (was minW:64, minH:32 - adjusted to be square for example)
            spawnWeight: 2,
            pickupType: 'grenade', pickupQuantity: 3,
            spriteNormal: 'assets/images/objects/crate_full.png',
            spriteDestroyed: 'assets/images/objects/crate_empty.png'
        }
    ],
    ENEMY_SPAWNING: {
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 8, RANDOM_ADDITION_FACTOR_MAX: 5,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0, SMALL_GROUP_CHANCE: 0.6, SMALL_GROUP_SIZE_MIN: 1, SMALL_GROUP_SIZE_MAX: 3,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 50, LEADER_PLACEMENT_MAX_ATTEMPTS: 20, MEMBER_PLACEMENT_MAX_ATTEMPTS: 10,
        GROUP_SPREAD_BASE: 30, GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20, HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.1
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
        BUTTON_TEXT_NEXT_MISSION: "Next Mission", BUTTON_TEXT_RESTART_CAMPAIGN: "Restart Campaign", BUTTON_TEXT_START_PHASE_PREFIX: "Start ",
        BUTTON_TEXT_CAMPAIGN_COMPLETE: "View Final Stats", BUTTON_TEXT_RETRY_MISSION: "Retry Mission",
        MEMORIAL_NO_FALLEN: "No Raccoons have fallen... yet. Their legend awaits.", MEMORIAL_LABEL_NAME: "Name:", MEMORIAL_LABEL_RANK: "Rank Achieved:",
        MEMORIAL_LABEL_MISSION: "Fell In:", MEMORIAL_LABEL_PHASE: "During:",
        DEFAULT_OBJECTIVE_TEXT: "Defeat Possums", UNKNOWN_OBJECTIVE_TEXT: "Unknown Objective", HUD_NO_SQUAD_DEPLOYED: "No squad deployed.",
        UNKNOWN_PHASE_TEXT: "Unknown Phase", UNKNOWN_MISSION_TEXT: "Unknown Mission",
        GAMEOVER_VICTORY_TITLE: "CAMPAIGN COMPLETE!", GAMEOVER_DEFEAT_TITLE: "GAME OVER",
        CAMPAIGN_COMPLETE_PHASE_NAME: "Campaign Finished", CAMPAIGN_COMPLETE_MISSION_NAME: "All Possums Defeated!",
        ERROR_LOADING_MISSION_RETRY: "Error reloading mission for retry.", RACCOON_OUT_OF_GRENADES_LOG: "Raccoon {ID}: Out of grenades!"
    }
};