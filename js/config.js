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
    WORLD_GRASS_TILE_SIZE: 48,     // Approximate width/height of your grass tile sprites
    WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.35, // e.g., 0.25 means tiles can overlap by up to 25% of their size
                                          // Iteration step will be TILE_SIZE * (1 - OVERLAP_FACTOR)

    // --- Input ---
    INPUT_DRAG_THRESHOLD: 5,
    INPUT_TAP_THRESHOLD_MS: 30,

    // --- Pathfinding ---
    GRID_CELL_SIZE: 6, // Reduced for finer grid, ensure performance
    DEBUG_PATHING_UNIT_ID: null, 
    DEBUG_DRAW_NAV_GRID_BLOCKED: true, 
    DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES: false, 

    // --- Units: Raccoon (Player) ---
    RACCOON_HP: 50,
    RACCOON_SPEED: 200,
    RACCOON_SIZE: 12,
    RACCOON_COLOR: '#808080',
    RACCOON_MG_DAMAGE: 7,
    RACCOON_MG_ROF: 5,
    RACCOON_MG_RANGE: 500,
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
    RACCOON_SPRITE_PATH: 'assets/images/units/raccoon/',
    RACCOON_SPRITE_SCALE_FACTOR: 0.5,
    RACCOON_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/', 
    RACCOON_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'],
    RACCOON_DEAD_SPRITE_SCALE: 0.07,

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
    POSSUM_GRUNT_SPRITE_PATH: 'assets/images/units/possum_grunt/', 
    POSSUM_GRUNT_SPRITE_SCALE_FACTOR: 0.5, 
    POSSUM_GRUNT_DEAD_SPRITE_PATH: 'assets/images/units/possum_grunt/dead/',
    POSSUM_GRUNT_DEAD_SPRITE_FILES: ['possum_grunt_dead_3.png', 'possum_grunt_dead_4.png'], 
    POSSUM_GRUNT_DEAD_SPRITE_SCALE: 0.5, 

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
    POSSUM_HEAVY_SPRITE_PATH: 'assets/images/units/possum_heavy/', 
    POSSUM_HEAVY_SPRITE_SCALE_FACTOR: 0.55, 
    POSSUM_HEAVY_DEAD_SPRITE_PATH: 'assets/images/units/possum_heavy/dead/',
    POSSUM_HEAVY_DEAD_SPRITE_FILES: ['possum_heavy_dead_1.png'], 
    POSSUM_HEAVY_DEAD_SPRITE_SCALE: 0.55, 
    
    // --- Units: General & AI ---
    UNIT_VISUALS: {
        STUCK_FRAMES_THRESHOLD: 2,
        UNIT_PHASING_DURATION: 0.75, 
        UNIT_PHASING_OPACITY: 0.5,   
        DRAW_GUN_AIM_INDICATOR: false,
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 1 },
        KIA_STYLE: { PLAYER_FILL_COLOR: 'darkgrey', ENEMY_FILL_COLOR: '#555555', OPACITY: 0.6 },
        GRENADE_AIM_INDICATOR: { COLOR: 'orange', LINE_WIDTH: 2, RADIUS_OFFSET: 6 }
    },
    UNIT_STUCK_FRAMES_THRESHOLD: 45,
    STUCK_FRAMES_THRESHOLD_PATHING: 30, 
    REPATH_STUCK_COOLDOWN: 0.75,
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
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4, 
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
            ENGAGE_RANGE_BUFFER: 5, 
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
            STUCK_ENGAGE_NUDGE_FACTOR: 2.0, 
            STUCK_RECOVERY_COOLDOWN_SHORT: 0.75,
            DESPERATE_STUCK_MOVE_RADIUS_CELLS: 4,
        }
    },

    // --- Projectiles & Weapons ---
    PROJECTILE_SIZE: 2,
    PROJECTILE_COLOR_RACCOON: '#FFFF00',
    PROJECTILE_COLOR_POSSUM: '#FFA500',
    PROJECTILE_COLOR_POSSUM_HEAVY: '#FF6347',
    GRENADE_PROJECTILE_COLOR: '#228B22',
    PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER: 0.25, // 0 = no friendly fire, 1 = full damage

    WEAPON_SETTINGS: {
        ROF_JITTER_PERCENTAGE: 0.10 
    },

    PROJECTILES: {
        BULLET: {
            LIFETIME: 1.5,
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
                COLOR: "rgba(255, 0, 0, 0.45)", 
                SIZE_ADDITION: 0 
            }
        }
    },

    // --- Roster, Progression & Campaign ---
    INITIAL_ROSTER_SIZE: 3,
    NEW_RECRUITS_PER_MISSION_WIN: 1,
    MAX_SQUAD_SIZE_MVP: 4,
    MAX_TOTAL_ROSTER_SIZE: 10,
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
        RACCOON_MG_FIRE: { path: 'assets/audio/sfx/gun_mg_raccoon.mp3', defaultVolume: 0.2, pitchVariation: 0.2 },
        POSSUM_RIFLE_FIRE: { path: 'assets/audio/sfx/gun_grunt_possum.mp3', defaultVolume: 0.6, pitchVariation: 0.03 },
        POSSUM_HEAVY_MG_FIRE: { path: 'assets/audio/sfx/gun_heavy_possum.mp3', defaultVolume: 0.3, pitchVariation: 0.03 },
        GRENADE_EXPLODE: { path: 'assets/audio/sfx/grenade_explode.mp3', defaultVolume: 0.4, pitchVariation: 0.4 },
        UI_BUTTON_CLICK: { path: 'assets/audio/sfx/ui_click_soft.mp3', defaultVolume: 0.2 },
        UI_BUTTON_HOVER: { path: 'assets/audio/sfx/ui_hover_gentle.mp3', defaultVolume: 0.3 },
        AMBIENT_FOREST_1: { path: 'assets/audio/ambience/tropical_forest_ambient_1.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_2: { path: 'assets/audio/ambience/tropical_forest_ambient_2.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_3: { path: 'assets/audio/ambience/tropical_forest_ambient_3.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_4: { path: 'assets/audio/ambience/tropical_forest_ambient_4.mp3', defaultVolume: 0.45 },
        AMBIENT_MUSIC_TROPICAL_FOREST_KEYS: [
            'AMBIENT_FOREST_1',
            'AMBIENT_FOREST_2',
            'AMBIENT_FOREST_3',
            'AMBIENT_FOREST_4'
        ]
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

    // --- Level Generation & Obstacles ---
    LEVEL_GENERATION: {
        WORLD_MARGIN: 20,
        BORDER_WIDTH: 30, 
        BORDER_COLOR: '#25221D', 
        BORDER_OBSTACLE_TYPE: 'fence_barbed_straight_long', 
        PLAYER_SPAWN_ZONE: { 
            MIN_WIDTH: 100, 
            WIDTH_FACTOR: 0.20, 
            MIN_HEIGHT: 100, 
            HEIGHT_FACTOR: 0.20, 
            INTERNAL_PADDING_FACTOR: 1.5 
        },
        OBSTACLES: { 
            BASE_COUNT: 50, 
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
        },
        // --- NEW: EXTRACTION ZONE SETTINGS ---
        EXTRACTION_ZONE_SETTINGS: {
            SPRITE_PATH: null, //'assets/images/objects/extraction_zone_rope_heli.png', // Optional sprite
            FALLBACK_COLOR: 'rgba(60, 120, 255, 0.35)', // Semi-transparent blue
            WIDTH: 120,  // Fallback width if no sprite
            HEIGHT: 120, // Fallback height if no sprite
            NAME: "Extraction Zone",
            PLACEMENT_MARGIN_FROM_EDGE: 30, // How far from world edge to try and place it
            MIN_DISTANCE_FROM_PLAYER_SPAWN: 900,
            MAX_PLACEMENT_ATTEMPTS: 20
        }
        // ---
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
    ROCK_SPRITES_16PX_FILES: [], 
    ROCK_SPRITES_32PX_PATH: 'assets/images/objects/rocks/grassy/32/',
    ROCK_SPRITES_32PX_FILES: ['Rock1_medium.png'],
    ROCK_SPRITES_64PX_PATH: 'assets/images/objects/rocks/grassy/64/',
    ROCK_SPRITES_64PX_FILES: ['rock1_large.png','rock2_large.png',],

    PALM_TREE_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_SINGLE_SPRITE_FILES: ['palm_single_small_2.png','palm_single_small_1.png', 'palm1_single.png'],
    PALM_TREE_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_DOUBLE_SPRITE_FILES: ['palm1_double.png'],
    PALM_TREE_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE_TRIPLE_SPRITE_FILES: ['palm1_triple.png'],

    PALM_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    PALM_TREE_FALLEN_SPRITE_FILES: ['palm_fallen_log_1.png'],

    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_DESTROYED: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
    POSSUM_HUT_SPRITE_FILES: ['possum_hut_1.png'],
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
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.12), width: (w => w * 0.95), height: (h => h * 0.3)},
        },
        {
            type: 'fence_barbed_straight_long', name: 'Barbed Wire Fence Straight Long',
            color: '#8B4513', destructible: false, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.1, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.08), width: (w => w * 0.9), height: (h => h * 0.04) },
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 1.0, 
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 1.0, 
        },
        
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 8, isDecoration: false,
            spriteScale: 0.3, 
            collisionShape: { type: 'ellipse', offsetX: (w => w*0.45), offsetY: (h => h*0.45), radiusX: (w => w*0.45), radiusY: (h => h*0.25) },
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.7, 
            collisionShape: { type: 'ellipse', offsetX: (w => w*0.46), offsetY: (h => h*0.47), radiusX: (w => w*0.43), radiusY: (h => h*0.27) },
        },
        {
            type: 'tree_palm_single', name: 'Palm Tree Single', color: '#005522',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 6, isDecoration: false,
            spriteScale: 0.4, 
            collisionShape: { type: 'circle', offsetX: (w=>w*0.4), offsetY: (h=>h*1.22), radius: (w => w * 0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_1.png',
            spriteDestroyedScale: 0.75, 
        },
        {
            type: 'tree_palm_double', name: 'Palm Tree Double', color: '#005522',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 1.2, 
            collisionShape: { type: 'ellipse', offsetX: (w=>w*0.35), offsetY: (h=>h*1.25), radiusX: (w=>w*0.2), radiusY: (h=>h*0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_1.png',
            spriteDestroyedScale: 0.75, 
        },
        {
            type: 'tree_palm_triple', name: 'Palm Tree Triple', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 1.2, 
            collisionShape: { type: 'ellipse', offsetX: (w=>w*0.37), offsetY: (h=>h*1.2), radiusX: (w=>w*0.2), radiusY: (h=>h*0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_1.png',
            spriteDestroyedScale: 0.75, 
        },
        {
            type: 'tree_palm_fallen', name: 'Fallen Palm Tree', color: '#005522',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 1.0,
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.1), offsetY: (h=>h*0.22), width: (w=>w*0.85), height: (h=>h*0.15) },
        },
        {
            type: 'forest_patch_dense_1',
            name: 'Dense Forest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 5,
            spriteNormal: 'assets/images/objects/biomes/tropical/trees/palm_forest_1.png',
            spriteScale: 1.20, 
            spriteDestroyed: null,
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.041), offsetY: (h=>h*0.2), width: (w=>w*0.852), height: (h=>h*0.2) },
            isDecoration: false
        },
        {
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3,
            explosionDamage: 50, explosionAoeRadius: 80,
            spriteNormal: 'assets/images/objects/barrels/barrel_red.png',
            spriteScale: 0.08, 
            spriteDestroyed: 'assets/images/objects/barrels/barrel_red_destroyed.png',
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.05), offsetY: (h=>h*0.066), width: (w=>w*0.7), height: (h=>h*0.86) },
        },
        {
            type: 'explosive_barrel_cluster', name: 'Cluster Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2,
            explosionDamage: 90, explosionAoeRadius: 120,
            spriteNormal: 'assets/images/objects/barrels/barrel_cluster.png',
            spriteScale: 0.08, 
            spriteDestroyed: 'assets/images/objects/barrels/barrel_cluster_destroyed.png',
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.03), offsetY: (h=>h*0.05), width: (w=>w*0.7), height: (h=>h*0.7) },
        },
        {
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1,
            pickupType: 'grenade', pickupQuantity: 2,
            spriteNormal: 'assets/images/objects/crates/crate_full.png',
            spriteScale: 0.15,
            spriteDestroyed: 'assets/images/objects/crates/crate_empty.png',
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.0625), offsetY: (h=>h*0.0625), width: (w=>w*0.9), height: (h=>h*0.84) },
            isPickup: true,
        },
        {
            type: 'pickup_health', name: 'Health Crate', color: '#FF69B4',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 2,
            pickupType: 'health', pickupQuantity: 30,
            spriteScale: 0.25, 
            collisionShape: { type: 'rectangle', offsetX: (w=>w*0.0625), offsetY: (h=>h*0.0625), width: (w=>w*0.875), height: (h=>h*0.84) },
            isPickup: true,
        },
        {
            type: 'possum_hut', name: 'Possum Hut', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            spriteScale: 0.5, 
            spriteDestroyed: 'assets/images/objects/possums/huts/possum_hut_1_destroyed.png',
            spriteDestroyedScale: 0.5, 
            collisionShape: { type: 'ellipse', offsetX: (w=>w*0.48), offsetY: (h=>h*0.45), radiusX: (w=>w*0.4), radiusY: (h=>h*0.315) },
            isDecoration: false,
        },
        
    ],

    ENEMY_SPAWNING: {
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 6,
        RANDOM_ADDITION_FACTOR_MAX: 5,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0,
        SMALL_GROUP_CHANCE: 0.6,
        SMALL_GROUP_SIZE_MIN: 1,
        SMALL_GROUP_SIZE_MAX: 4,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 250,
        LEADER_PLACEMENT_MAX_ATTEMPTS: 20,
        MEMBER_PLACEMENT_MAX_ATTEMPTS: 10,
        GROUP_SPREAD_BASE: 30,
        GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20,
        HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.1,

        POSSUM_HUT_SPAWNING: {
            MAX_ACTIVE_SPAWNING_HUTS_BASE: 3,
            MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE: 2,
            SPAWN_COOLDOWN_MIN_SECONDS: 30,
            SPAWN_COOLDOWN_MAX_SECONDS: 180,
            UNITS_PER_SPAWN_MIN: 2,
            UNITS_PER_SPAWN_MAX: 6,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.25, 
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 5,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 10,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 50,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -65, 
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -3, 
            SPAWN_AREA_WIDTH: 40,
            SPAWN_PHASING_DURATION: 1.25,
            DEBUG_DRAW_SPAWN_AREAS: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 5,
            MAX_SPAWN_ATTEMPTS_PER_HUT_EVENT: 5,
            INITIAL_MOVE_OUT_DISTANCE: 25,
        }
    },

    HOSTAGE_SETTINGS: {
        HP: 35, 
        SPEED: 110, 
        COLOR: '#ADD8E6', 
        NEUTRAL_COLOR: '#FFD700', 
        RESCUE_RADIUS: 60,
        FOLLOW_DISTANCE: 100,
        FOLLOW_LERP_SPEED: 0.04, 
        POSSIBLE_RANKS_ON_RESCUE: [ 
            { rankName: "Recruit", xpNeeded: 0 },
            { rankName: "Recruit", xpNeeded: 0 }, 
            { rankName: "Private", xpNeeded: 100 },
            { rankName: "Corporal", xpNeeded: 300 },
            { rankName: "Sergeant", xpNeeded: 600 },
            { rankName: "Elite", xpNeeded: 1000 }
        ],
        MAX_HOSTAGES_PER_MISSION: 3, 
        MIN_HOSTAGES_TO_RESCUE_FOR_WIN: 1,
        SPAWN_WITH_ENEMY_GROUPS: false, 
        SPAWN_NEAR_CAPTORS_RADIUS: 40,  
        MIN_CAPTORS_GROUP_SIZE: 1,      
        HOSTAGE_PLACEMENT_ATTEMPTS_NEAR_GROUP: 10,
        SPAWN_AT_HUTS: true, 
        MAX_HOSTAGES_PER_HUT: 1, 
        SPAWN_OFFSET_FROM_HUT_X: 0,  
        SPAWN_OFFSET_FROM_HUT_Y: (h_height => h_height * 0.5 + 30), // A bit further below hut center
        MIN_HUT_DISTANCE_FROM_PLAYER_SPAWN_FOR_HOSTAGE: 250, // Increased distance
        HOSTAGE_PLACEMENT_ATTEMPTS_AT_HUT: 15,
        // --- NEW: Initial Guards for Hostage Huts ---
        INITIAL_GUARD_COUNT_MIN_PER_HOSTAGE_HUT: 2,
        INITIAL_GUARD_COUNT_MAX_PER_HOSTAGE_HUT: 3,
        INITIAL_GUARD_HEAVY_CHANCE_HOSTAGE_HUT: 0.20, // 20% chance for one guard to be heavy
        INITIAL_GUARD_SPAWN_RADIUS_AROUND_HUT: 60, // How far from hut center to place these guards
        INITIAL_GUARD_PLACEMENT_ATTEMPTS: 10
        // ---
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
            FLOCK_SIZE_MAX: 3,
            FLOCK_SPACING_X: 50,  
            FLOCK_SPACING_Y: 20,  
            SPAWN_INTERVAL_MIN_SECONDS: 20,
            SPAWN_INTERVAL_MAX_SECONDS: 60,
            SCALE: 0.4, 
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
        ERROR_LOADING_MISSION_RETRY: "Error reloading mission for retry.", RACCOON_OUT_OF_GRENADES_LOG: "Raccoon {ID}: Out of grenades!",
        OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION: "Hostages ready! Proceed to Extraction Zone!",
        OBJECTIVE_RESCUE_HOSTAGES_AT_EVAC: "Hostages at EVAC: {COUNT}/{TOTAL}"
    }
};