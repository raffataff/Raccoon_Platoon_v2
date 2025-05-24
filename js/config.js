// js/config.js
// complete
const CONFIG = {
    // --- Core Game & World ---
    BASE_WORLD_WIDTH: 1280,
    BASE_WORLD_HEIGHT: 720,
    MIN_CANVAS_WIDTH: 800,
    MIN_CANVAS_HEIGHT: 600,
    MAX_DELTA_TIME_STEP: 0.1,
    CAMERA_LERP_SPEED: 0.08,

     // --- World Rendering ---
    WORLD_BASE_MUD_COLOR: '#483524', // A muddy brown color
    WORLD_GRASS_TILE_SIZE: 40,     // Approximate width/height of your grass tile sprites
    WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.25, // e.g., 0.25 means tiles can overlap by up to 25% of their size
                                          // Iteration step will be TILE_SIZE * (1 - OVERLAP_FACTOR)

    // --- Input ---
    INPUT_DRAG_THRESHOLD: 5,
    INPUT_TAP_THRESHOLD_MS: 30,

    // --- Pathfinding ---
    GRID_CELL_SIZE: 4, // Reduced for finer grid, ensure performance
    // NEW: For pathing debug, set to a specific unit ID (e.g., "PSM-1") or null to disable
    DEBUG_PATHING_UNIT_ID: null, // For unit-specific path logs
    DEBUG_DRAW_NAV_GRID_BLOCKED: false, // To draw red overlay for blocked nav grid cells
    DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES: false, // NEW: To draw actual obstacle collision shapes

    // --- Units: Raccoon (Player) ---
    RACCOON_HP: 50,
    RACCOON_SPEED: 150,
    RACCOON_SIZE: 12,
    RACCOON_COLOR: '#808080',
    RACCOON_MG_DAMAGE: 7,
    RACCOON_MG_ROF: 5,
    RACCOON_MG_RANGE: 400,
    RACCOON_MG_PROJECTILE_SPEED: 500,
    RACCOON_MG_ACCURACY_STATIONARY: 0.90,
    RACCOON_MG_ACCURACY_MOVING: 0.60,
    RACCOON_AUTO_TARGET_RANGE_FACTOR: 0.6,
    RACCOON_STARTING_GRENADES: 0,
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 45,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 270,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,
    RACCOON_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/', // NEW
    RACCOON_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'], // NEW
    RACCOON_DEAD_SPRITE_SCALE: 0.05, // NEW - Adjust as needed

    // --- Units: Possum Grunt ---
    POSSUM_GRUNT_HP: 30,
    POSSUM_GRUNT_SPEED: 100,
    POSSUM_GRUNT_SIZE: 14,
    POSSUM_GRUNT_COLOR: '#A0522D',
    POSSUM_RIFLE_DAMAGE: 8,
    POSSUM_RIFLE_ROF: 3,
    POSSUM_RIFLE_RANGE: 350,
    POSSUM_RIFLE_PROJECTILE_SPEED: 400,
    POSSUM_RIFLE_ACCURACY_STATIONARY: 0.75,
    POSSUM_RIFLE_ACCURACY_MOVING: 0.45,
    POSSUM_GRUNT_DEAD_SPRITE_PATH: 'assets/images/units/possum/dead/', // NEW
    POSSUM_GRUNT_DEAD_SPRITE_FILES: ['possum_grunt_dead_3.png'], // NEW
    POSSUM_GRUNT_DEAD_SPRITE_SCALE: 0.05, // NEW - Adjust as needed

    // --- Units: Possum Heavy ---
    POSSUM_HEAVY_HP: 70,
    POSSUM_HEAVY_SPEED: 80,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_WEAPON_DAMAGE: 18,
    POSSUM_HEAVY_WEAPON_ROF: 1.2,
    POSSUM_HEAVY_WEAPON_RANGE: 440,
    POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED: 350,
    POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY: 0.85,
    POSSUM_HEAVY_WEAPON_ACCURACY_MOVING: 0.3,
    POSSUM_HEAVY_DEAD_SPRITE_PATH: 'assets/images/units/possum/dead/', // NEW
    POSSUM_HEAVY_DEAD_SPRITE_FILES: ['possum_grunt_dead_1.png', 'possum_grunt_dead_2.png'], // NEW
    POSSUM_HEAVY_DEAD_SPRITE_SCALE: 0.075, // NEW - Adjust as needed

    // --- Units: General & AI ---
    UNIT_STUCK_FRAMES_THRESHOLD: 45,
    STUCK_FRAMES_THRESHOLD_PATHING: 30, // Was 15, then 30
    REPATH_STUCK_COOLDOWN: 0.75,
    ENEMY_ALERT_PROPAGATION_RADIUS: 200,
    ENEMY_INVESTIGATE_ATTACK_CHANCE: 0.95, // Chance to become suspicious on taking damage without LOS
    ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT: 0.10, // Lowered threshold for alert propagation

    AI: {
        POSSUM_GRUNT: {
            PATROL_MIN_RADIUS: 80,
            PATROL_MAX_RADIUS: 200,
            PATROL_POINT_WORLD_MARGIN_BUFFER: 20,
            PATROL_WAIT_BASE: 1.5,
            PATROL_WAIT_RANDOM_ADD: 2.0,
            CHASE_PREDICTION_TIME_FACTOR: 0.25, 
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0, // More frequent refresh for Grunt
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4, // If actual target moves this far from chase dest, refresh
            ENGAGE_RANGE_BUFFER: 10, // Engage if target is within weapon.range - buffer
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3, // This is GRUNT_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE
            STUCK_ENGAGE_NUDGE_FACTOR: 2.5, 
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75, 
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,   
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 5, 
        },
        POSSUM_HEAVY: {
            DETECTION_RANGE: 270,
            MAX_CHASE_DISTANCE_FROM_POST_FACTOR: 0.95, 
            GUARD_POST_POSITION_TOLERANCE: 5,
            SUSPICIOUS_STATE_SCAN_DURATION: 0.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.15, 
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.5, // Less frequent for slower Heavy
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 3,
            MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY: 40, 
            ENGAGE_RANGE_BUFFER: 5, 
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.0, 
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 4,
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
            SIZE: 4, 
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
    INITIAL_FORMATION_SPACING: 1.7,
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,
    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {} },
        { rankName: "Private", xpNeeded: 100, statBoosts: { maxHpBonus: 10 } },
        { rankName: "Corporal", xpNeeded: 300, statBoosts: { maxHpBonus: 20, accuracyBonus: 0.05 } },
        { rankName: "Sergeant", xpNeeded: 600, statBoosts: { maxHpBonus: 30, accuracyBonus: 0.08 } },
        { rankName: "Elite", xpNeeded: 1000, statBoosts: { maxHpBonus: 50, accuracyBonus: 0.2 } },
        { rankName: "Ghost", xpNeeded: 2000, statBoosts: { maxHpBonus: 100, accuracyBonus: 0.3 } }
    ],
    MAX_RANK_NAME: "Ghost",
    GRENADE_BONUS_CORPORAL: 2,
    GRENADE_BONUS_SERGEANT: 3,
    GRENADE_BONUS_ELITE: 4,
    GRENADE_BONUS_GHOST: 5,

    // --- Visuals & UI ---
    DEFAULT_WORLD_BACKGROUND_COLOR: '#417021',
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/',
    RACCOON_FACE_IMAGES: [
        'face1.png', 'face2.png', 'face3.png', 'face4.png',
        'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png'
    ],
    AUDIO_ASSETS: {
        RACCOON_MG_FIRE: { path: 'assets/audio/sfx/gun_mg_raccoon.mp3', defaultVolume: 0.3, pitchVariation: 0.2 },
        POSSUM_RIFLE_FIRE: { path: 'assets/audio/sfx/gun_rifle_possum.wav', defaultVolume: 0.5, pitchVariation: 0.05 },
        POSSUM_HEAVY_MG_FIRE: { path: 'assets/audio/sfx/gun_heavy_possum.wav', defaultVolume: 0.7, pitchVariation: 0.05 },
        // GRENADE_EXPLODE: { path: 'assets/audio/sfx/grenade_explode.wav', defaultVolume: 0.8 },
        // PROMOTION_SFX: { path: 'assets/audio/sfx/promotion.wav', defaultVolume: 0.7 },
    },

    VISUAL_EFFECTS: {
        PROMOTION: {
            LIFETIME: 1.5, TEXT: "PROMOTED!", FONT: "bold 16px 'Consolas', 'Lucida Console', monospace",
            COLOR_RGB_FADE_START: [255, 223, 0], VELOCITY_Y: -20
        },
        EXPLOSION: { LIFETIME: 0.8 }
    },
    UI_SETTINGS: {
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 3, HEIGHT: 4, Y_OFFSET_BASE: 10, BG_COLOR: '#333333',
            HP_COLOR_FULL: '#00CC00', HP_COLOR_MEDIUM: '#CCCC00', HP_COLOR_LOW: '#CC0000',
            LOW_HP_THRESHOLD_PERCENT: 0.3, MEDIUM_HP_THRESHOLD_PERCENT: 0.6
        },
        RECRUIT_CARD: { DEFAULT_FACE_BG_COLOR: '#555555' },
        MEMORIAL_CARD: { DEFAULT_FACE_BG_COLOR: '#333333' }
    },
    UNIT_VISUALS: {
        STUCK_FRAMES_THRESHOLD: 12,
        UNIT_PHASING_DURATION: 0.75, // NEW: Duration in seconds for phasing
        UNIT_PHASING_OPACITY: 0.5,   // NEW: Opacity for rendering during phasing
        RACCOON_SPRITE_SCALE_FACTOR: 0.4,
        DRAW_GUN_AIM_INDICATOR: true,
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 1 },
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
        DECORATIONS: {
            GRASS_CLUTTER: {
                MIN_SCALE: 1.1,
                MAX_SCALE: 1.5
            }
        }
    },
    
    GRASS_SPRITE_PATH: 'assets/images/objects/biomes/tropical/grass2/',
    GRASS_SPRITE_FILES: [ 
        'grass1.png','grass2.png','grass3.png','grass4.png','grass5.png',
        'grass6.png','grass7.png','grass8.png','grass9.png','grass10.png',
    ],
    BUSH_SPRITES_32PX_PATH: 'assets/images/objects/bushes/32/',
    BUSH_SPRITES_32PX_FILES: [
        'Autumn_bush2.png','Bush_orange_flowers2.png','Bush_pink_flowers2.png','Bush_red_flowers2.png',
        'Bush_simple1_1.png','Bush_simple1_2.png','Bush_simple2_1.png','Bush_simple2_2.png',
        'Fern1_2.png','Fern2_2.png'
    ],
    BUSH_SPRITES_64PX_PATH: 'assets/images/objects/bushes/64/',
    BUSH_SPRITES_64PX_FILES: [
        'Autumn_bush1.png','Bush_orange_flowers1.png','Bush_pink_flowers1.png','Bush_red_flowers1.png',
        'Fern1_1.png','Fern2_1.png'
    ],
    ROCK_SPRITES_16PX_PATH: 'assets/images/objects/rocks/grassy/16/',
    ROCK_SPRITES_16PX_FILES: [''],
    ROCK_SPRITES_32PX_PATH: 'assets/images/objects/rocks/grassy/32/',
    ROCK_SPRITES_32PX_FILES: ['Rock1_medium.png'],
    ROCK_SPRITES_64PX_PATH: 'assets/images/objects/rocks/grassy/64/',
    ROCK_SPRITES_64PX_FILES: ['rock1_large.png','rock2_large.png',],
    PALM_TREE_MEDIUM_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_MEDIUM_SPRITE_FILES: ['palm1_medium_single.png','palm2_medium_single.png',],
    PALM_TREE_TALL_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_TALL_SPRITE_FILES: ['palm1_single.png','palm1_double.png','palm1_triple.png',],
    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_DESTROYED: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
    POSSUM_HUT_SPRITE_FILES: ['possum_hut_1.png'],

    OBSTACLE_DEFINITIONS: [
        {
            type: 'decoration_grass', name: 'Grass Patch', destructible: false, 
            blocksMovement: false, providesCover: false, width: 15, height: 16, 
            spawnWeight: 0, isDecoration: true, 
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22', 
            destructible: true, hp: 30, maxHp: 30, 
            blocksMovement: false, providesCover: false, // MODIFIED: Bushes now provide cover
            width: 32, height: 32,
            collisionShape: { type: 'circle', offsetX: 16, offsetY: 16, radius: 10 },
            spawnWeight: 5, isDecoration: false, 
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400', 
            destructible: true, hp: 50, maxHp: 50, 
            blocksMovement: true, providesCover: false, // MODIFIED: Large bushes block and provide cover
            width: 64, height: 64,
            collisionShape: { type: 'circle', offsetX: 32, offsetY: 32, radius: 16 },
            spawnWeight: 5, isDecoration: false,
        },
        {
            type: 'rock_small', name: 'Small Grassy Rock', color: '#8B4513', 
            destructible: true, hp: 100, maxHp: 100, 
            blocksMovement: true, providesCover: true,
            width: 32, height: 32,
            collisionShape: { type: 'circle', offsetX: 16, offsetY: 16, radius: 15 }, // Adjusted radius
            spawnWeight: 0, isDecoration: false,
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969', 
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 124, height: 88,
            collisionShape: { type: 'circle', offsetX: 52, offsetY: 50, radius: 38 },
            spawnWeight: 15, isDecoration: false,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9', 
            destructible: false, hp: Infinity, maxHp: Infinity, 
            blocksMovement: true, providesCover: true,
            width: 336, height: 268,
            collisionShape: { type: 'circle', offsetX: 155, offsetY: 150, radius: 110 },
            spawnWeight: 5, isDecoration: false,
        },
        {
            type: 'tree_palm_medium', name: 'Palm Tree Medium', color: '#005522',
            destructible: true, hp: 50, maxHp: 50, 
            blocksMovement: true, providesCover: true, 
            width: 80, height: 160, 
            spawnWeight: 60, isDecoration: false,        
            collisionShape: { type: 'rectangle', offsetX: 34, offsetY: 142, width: 23, height: 23 },
        },
        {
            type: 'tree_palm_tall', name: 'Palm Tree', color: '#005522', 
            destructible: true, hp: 100, maxHp: 100, 
            blocksMovement: true, providesCover: true, 
            width: 125, height: 225, 
            spawnWeight: 20, isDecoration: false,        
            collisionShape: { type: 'rectangle', offsetX: 30, offsetY: 200, width: 35, height: 35 },
        },
        {
            type: 'fence_wood', name: 'Wooden Fence', color: '#8B4513', destructible: true, hp: 40, maxHp: 40,
            blocksMovement: true, providesCover: true,
            width: 120, height: 15, 
            spawnWeight: 7
        },
        { 
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            width: 20, height: 30, 
            spawnWeight: 4,
            explosionDamage: 50, explosionAoeRadius: 80,
            spriteNormal: 'assets/images/objects/barrel_red.png',
            spriteDestroyed: 'assets/images/objects/barrel_red_destroyed.png'
        },
        { 
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: true, providesCover: false, // Crates don't provide cover
            width: 32, height: 32, 
            spawnWeight: 1,
            pickupType: 'grenade', pickupQuantity: 2,
            spriteNormal: 'assets/images/objects/crate_full.png',
            spriteDestroyed: 'assets/images/objects/crate_empty.png',
            collisionShape: { type: 'rectangle', offsetX: 2, offsetY: 2, width: 28, height: 27 },
            isPickup: true, // Added flag
        },
        { 
            type: 'possum_hut', name: 'Possum Hut', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 250, height: 190, 
            spawnWeight: 2,
            // spriteNormal: 'assets/images/objects/possums/huts/possum_hut_1.png', // This is now handled by list
            spriteDestroyed: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
            collisionShape: { type: 'circle', offsetX: 120, offsetY: 110, radius: 80 },
            isDecoration: false,  
        },
        {
            type: 'building_shed', name: 'Shed', color: '#787860', destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 120, height: 100, 
            spawnWeight: 0, 
        }
    ],
    ENEMY_SPAWNING: {
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 6,
        RANDOM_ADDITION_FACTOR_MAX: 5,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0,
        SMALL_GROUP_CHANCE: 0.6,
        SMALL_GROUP_SIZE_MIN: 1,
        SMALL_GROUP_SIZE_MAX: 4,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 150,
        LEADER_PLACEMENT_MAX_ATTEMPTS: 20,
        MEMBER_PLACEMENT_MAX_ATTEMPTS: 10,
        GROUP_SPREAD_BASE: 30,
        GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20,
        HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.1,

        POSSUM_HUT_SPAWNING: {
            MAX_ACTIVE_SPAWNING_HUTS_BASE: 3,
            MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE: 0.2,
            SPAWN_COOLDOWN_MIN_SECONDS: 30,
            SPAWN_COOLDOWN_MAX_SECONDS: 180,
            UNITS_PER_SPAWN_MIN: 2,
            UNITS_PER_SPAWN_MAX: 6,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.25, // NEW: To increase group size per phase
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 5,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 10,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 50,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -65, // Negative for left of hut center, positive for right
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -25, // Negative for above hut bottom edge (y+height), positive for below
            SPAWN_AREA_WIDTH: 40,
            SPAWN_PHASING_DURATION: 1.25,
            DEBUG_DRAW_SPAWN_AREAS: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 5,
            MAX_SPAWN_ATTEMPTS_PER_HUT_EVENT: 5,
            INITIAL_MOVE_OUT_DISTANCE: 25,
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