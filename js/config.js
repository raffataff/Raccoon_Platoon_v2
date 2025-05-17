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
    INPUT_TAP_THRESHOLD_MS: 30,

    // --- Pathfinding ---
    GRID_CELL_SIZE: 16,

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
    RACCOON_AUTO_TARGET_RANGE_FACTOR: 0.5,
    RACCOON_STARTING_GRENADES: 0,
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 45,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 270,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,

    // --- Units: Possum Grunt ---
    POSSUM_GRUNT_HP: 30,
    POSSUM_GRUNT_SPEED: 100,
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
    POSSUM_HEAVY_SPEED: 80,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_WEAPON_DAMAGE: 18,
    POSSUM_HEAVY_WEAPON_ROF: 1.2,
    POSSUM_HEAVY_WEAPON_RANGE: 240,
    POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED: 350,
    POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY: 0.85,
    POSSUM_HEAVY_WEAPON_ACCURACY_MOVING: 0.3,

    // --- Units: General & AI ---
    UNIT_STUCK_FRAMES_THRESHOLD: 60,
    POSSUM_DETECTION_RANGE: 250,
    ENEMY_ALERT_PROPAGATION_RADIUS: 200,
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
    INITIAL_FORMATION_SPACING: 1.7,
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,
    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {} },
        { rankName: "Private", xpNeeded: 100, statBoosts: { maxHpBonus: 10 } },
        { rankName: "Corporal", xpNeeded: 200, statBoosts: { maxHpBonus: 20, accuracyBonus: 0.05 } },
        { rankName: "Sergeant", xpNeeded: 500, statBoosts: { maxHpBonus: 30, accuracyBonus: 0.08 } },
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
            BASE_COUNT: 150, 
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
        
    ],
    GRASS_SPRITE_PATH: 'assets/images/objects/grass/', // Path to the grass folder

    // NEW: Bush Sprite Definitions
    BUSH_SPRITES_32PX_PATH: 'assets/images/objects/bushes/32/',
    BUSH_SPRITES_32PX_FILES: [
        'Autumn_bush2.png',
        'Bush_orange_flowers2.png',
        'Bush_pink_flowers2.png',
        'Bush_red_flowers2.png', // Note: some names have "2" but are in 32px list per your image
        'Bush_simple1_1.png',
        'Bush_simple1_2.png',
        'Bush_simple2_1.png',
        'Bush_simple2_2.png',
        'Fern1_2.png',
        'Fern2_2.png'
    ],
    BUSH_SPRITES_64PX_PATH: 'assets/images/objects/bushes/64/',
    BUSH_SPRITES_64PX_FILES: [
        'Autumn_bush1.png',
        'Bush_orange_flowers1.png',
        'Bush_pink_flowers1.png',
        'Bush_red_flowers1.png',
        'Fern1_1.png',
        'Fern2_1.png'
    ],

    // NEW: Rock Sprite Definitions
    ROCK_SPRITES_16PX_PATH: 'assets/images/objects/rocks/grassy/16/',
    ROCK_SPRITES_16PX_FILES: [
        'Rock1_small.png'
    ],
    ROCK_SPRITES_32PX_PATH: 'assets/images/objects/rocks/grassy/32/',
    ROCK_SPRITES_32PX_FILES: [
        'Rock1_medium.png'
    ],
    ROCK_SPRITES_64PX_PATH: 'assets/images/objects/rocks/grassy/64/',
    ROCK_SPRITES_64PX_FILES: [
        'rock1_large.png',
        'rock2_large.png',
    ],

    // NEW: Palm Tree Sprite Definitions
    //PALM_TREE_TALL_SPRITE_DESTROYED: 'assets/images/objects/biomes/tropical/trees/palm_stump.png',
    PALM_TREE_MEDIUM_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_MEDIUM_SPRITE_FILES: [
        'palm1_medium_single.png',
        'palm2_medium_single.png',
        // Add more palm tree variations here if you have them, e.g., 'palm2_cluster.png'
    ],
    PALM_TREE_TALL_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_TALL_SPRITE_FILES: [
        'palm1_single.png',
        'palm1_double.png',
        'palm1_triple.png',
        // Add more palm tree variations here if you have them, e.g., 'palm2_cluster.png'
    ],

    // NEW: Possum Huts
    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_DESTROYED: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
    POSSUM_HUT_SPRITE_FILES: [
        'possum_hut_1.png'
    ],

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
            spawnWeight: 0,       // Make grass fairly common
            isDecoration: true,    // Custom flag to identify it as purely visual
            // Sprites will be chosen randomly from GRASS_SPRITE_FILES
        },
        // --- NEW BUSH DEFINITIONS ---
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22', // Fallback color
            destructible: true, hp: 30, maxHp: 30, // Example: Medium bushes can be destroyed
            blocksMovement: false,       // Typically bushes don't block movement but provide cover
            providesCover: false,
            width: 32, height: 32,    // Fixed size for this type
            collisionShape: {
                type: 'circle', // This rock is best represented by a circle
                offsetX: 16,    // Offset from sprite's top-left to circle's center X
                offsetY: 16,    // Offset from sprite's top-left to circle's center Y
                radius: 14      // Radius of the collision circle
            },
            spawnWeight: 15,           // Adjust spawn frequency
            isDecoration: false,       // It's gameplay relevant (cover)
            // Sprites will be chosen randomly from BUSH_SPRITES_32PX_FILES
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400', // Fallback color
            destructible: true, hp: 50, maxHp: 50, // Example: Larger bushes tougher
            blocksMovement: true,        // Large dense bushes might block movement
            providesCover: false,
            width: 64, height: 64,    // Fixed size for this type
            collisionShape: {
                type: 'circle', // This rock is best represented by a circle
                offsetX: 32,    // Offset from sprite's top-left to circle's center X
                offsetY: 32,    // Offset from sprite's top-left to circle's center Y
                radius: 16      // Radius of the collision circle
            },
            spawnWeight: 10,           // Adjust spawn frequency
            isDecoration: false,
            // Sprites will be chosen randomly from BUSH_SPRITES_64PX_FILES
        },
        
        // --- UPDATED/NEW ROCK DEFINITIONS ---
        {
            type: 'rock_small', name: 'Small Grassy Rock', color: '#708090', // Slate gray fallback
            destructible: true, hp: 100, maxHp: 100, // Small rocks might be destructible
            blocksMovement: true, providesCover: true,
            width: 32, height: 32,    // Fixed size for this type
                collisionShape: {
                type: 'circle', // This rock is best represented by a circle
                offsetX: 16,    // Offset from sprite's top-left to circle's center X
                offsetY: 16,    // Offset from sprite's top-left to circle's center Y
                radius: 30      // Radius of the collision circle
            },
            spawnWeight: 0,           // Adjust spawn frequency
            isDecoration: false,       // Gameplay relevant
            // Sprites will be chosen randomly from ROCK_SPRITES_16PX_FILES
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969', // Dim gray fallback
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 124, height: 88,    // Fixed size for this type
                collisionShape: {
                type: 'circle', // This rock is best represented by a circle
                offsetX: 62,    // Offset from sprite's top-left to circle's center X
                offsetY: 45,    // Offset from sprite's top-left to circle's center Y
                radius: 45      // Radius of the collision circle
            },
            spawnWeight: 15,
            isDecoration: false,
            // Sprites will be chosen randomly from ROCK_SPRITES_32PX_FILES
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9', // Dark gray fallback
            destructible: false, hp: Infinity, maxHp: Infinity, // Large rocks often indestructible
            blocksMovement: true, providesCover: true,
            width: 336, height: 268,    // Fixed size for this type
            collisionShape: {
                type: 'circle', // This rock is best represented by a circle
                offsetX: 150,    // Offset from sprite's top-left to circle's center X
                offsetY: 150,    // Offset from sprite's top-left to circle's center Y
                radius: 100      // Radius of the collision circle
            },
            spawnWeight: 5,
            isDecoration: false,
            // Sprites will be chosen randomly from ROCK_SPRITES_64PX_FILES
        },

        // --- NEW PALM TREE DEFINITION ---
        {
            type: 'tree_palm_tall',
            name: 'Palm Tree',
            color: '#005522', // Fallback color if sprite fails
            destructible: true, hp: 100, maxHp: 100, // Example: Palm trees can be shot down
            blocksMovement: true,       // Trunk will block movement
            providesCover: true,        // Canopy and trunk can provide cover
            width: 125, height: 225,    // << ADJUST TO YOUR 'palm1_single.png' ACTUAL RENDER SIZE
            spawnWeight: 20,             // Adjust frequency
            isDecoration: false,        // Gameplay relevant (blocks, cover)
            // Sprites will be chosen randomly from PALM_TREE__TALL_SPRITE_FILES
            // Define a collision shape for the trunk primarily
            collisionShape: {
                type: 'rectangle',
                offsetX: 23,  // Example: if trunk is centered and 16px wide in a 64px wide sprite
                offsetY: 180,  // Example: if trunk starts some way down
                width: 44,    // Example: width of the trunk
                height: 35    // Example: height of the trunk part that collides
            },
            // spriteDestroyed: 'assets/images/objects/biomes/trees/palm_stump.png' // Optional
        },
        {
            type: 'tree_palm_medium',
            name: 'Palm Tree Medium',
            color: '#005522', // Fallback color if sprite fails
            destructible: true, hp: 50, maxHp: 50, // Example: Palm trees can
            blocksMovement: true,       // Trunk will block movement
            providesCover: true,        // Canopy and trunk can provide cover
            width: 64, height: 128,    // << ADJUST TO YOUR 'palm1__small_single.png' ACTUAL RENDER SIZE
            spawnWeight: 80,             // Adjust frequency
            isDecoration: false,        // Gameplay relevant (blocks, cover)
            collisionShape: {
                type: 'rectangle',
                offsetX: 23,  // Example: if trunk is centered and 16px wide in a 64px wide sprite
                offsetY: 100,  // Example: if trunk starts some way down
                width: 25,    // Example: width of the trunk
                height: 30    // Example: height of the trunk part that collides
            },
            // spriteDestroyed: 'assets/images/objects/biomes/trees/palm_stump.png' // Optional
        },
        {
            type: 'fence_wood', name: 'Wooden Fence', color: '#8B4513', destructible: true, hp: 40, maxHp: 40,
            blocksMovement: true, providesCover: true,
            width: 120, height: 15, // Example of fixed size for fences (can still vary length if needed via minW/maxW)
            // Or if you want varied length:
            // minW: 80, maxW: 180, height: 15, // Fixed height, varied width
            spawnWeight: 7
        },
        { // EXPLOSIVE BARREL - Fixed size
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            width: 20, height: 30, // <<-- FIXED SIZE
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
            pickupType: 'grenade', pickupQuantity: 2,
            spriteNormal: 'assets/images/objects/crate_full.png',
            spriteDestroyed: 'assets/images/objects/crate_empty.png',
            collisionShape: {
                type: 'rectangle', // This crate is best represented by a rectangle
                offsetX: 2,  // Offset from sprite's top-left to rectangle's top-left
                offsetY: 2,  // Offset from sprite's top-left to rectangle's top-left
                width: 28,   // Width of the collision rectangle
                height: 27   // Height of the collision rectangle
            },
        },
        // Buildings
        { // Possum Huts
            type: 'possum_hut', name: 'Possum Hut', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 250, height: 190, // Example of fixed size for huts
            spawnWeight: 5,
            spriteNormal: 'assets/images/objects/possums/huts/possum_hut_1.png',
            spriteDestroyed: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
            collisionShape: {
                type: 'circle', // This hut is best represented by a circle
                offsetX: 120,  // Example: if trunk is centered and 16px wide in a 64px wide sprite
                offsetY: 80,  // Example: if trunk starts some way down
                radius: 80      // Radius of the collision circle
            },
            isDecoration: false,  
        },
        {
            type: 'building_shed', name: 'Shed', color: '#787860', destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            width: 120, height: 100, // Fixed size for sheds
            // Or use minW/maxW, minH/maxH if sheds should vary
            spawnWeight: 0
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