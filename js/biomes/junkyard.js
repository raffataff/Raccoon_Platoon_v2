// =========================================================================
// JUNKYARD BIOME DEFINITION
// =========================================================================
const JUNKYARD_BIOME = {
    name: "JUNKYARD",
    displayName: "Junkyard",
    description: "filthy and dangerous, the junkyard is a sprawling expanse of discarded machinery and rusting vehicles. The air is thick with the smell of oil and decay, and the ground is littered with sharp metal scraps. It's a haven for scavengers and outcasts, where danger lurks around every corner.",
    themeAdjectives: ["Rusty", "Filthy", "Dangerous"],

    landingVideos: [
        'assets/video/landing/helicopter_landing_scrapyard_1.mp4',
    ],
    extractionVideos: [
        'assets/video/extraction/helicopter_extraction_team_scrapyard_1.mp4',
    ],
    extractionHostageVideos: [
        'assets/video/extraction/extraction_hostage_1.mp4',
        'assets/video/extraction/extraction_hostage_2.mp4',
        'assets/video/extraction/extraction_hostage_3.mp4',
        'assets/video/extraction/extraction_hostage_4.mp4',
    ],

    // =========================================================================
    // SPRITE PATH MAPPINGS
    // =========================================================================
    spritePaths: {
        // Terrain
        mud: {
            path: 'assets/images/objects/biomes/mud/',
            files: [ 'mud_1.png', 'mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png',]
        },

        // Objects
        junk_small_round: {
            path: 'assets/images/objects/biomes/junkyard/junkSmall/',
            files: [ 'random_junk_small_2.png', 'random_junk_small_3.png', 'random_junk_small_4.png',]
        },
        junk_small_tall: {
            path: 'assets/images/objects/biomes/junkyard/junkSmall/',
            files: ['random_junk_small_1.png', 'random_junk_small_5.png', ]
        },
        junk_vehicle: {
            path: 'assets/images/objects/biomes/junkyard/vehicles/',
            files: ['vehicle_junk_patch_1.png', 'vehicle_junk_patch_2.png', 'vehicle_junk_patch_3.png', 'vehicle_junk_patch_4.png',]
        },

    },

    // =========================================================================
    // OBJECT DEFINITIONS
    // =========================================================================
    obstacleDefinitions: [
        {
            type: 'junk_small_round', name: 'Small Round Junk', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 10, isDecoration: false,
            spriteScale: 0.55,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.64), radiusX: (w => w * 0.38), radiusY: ((w, h) => h * 0.23) },
            canBeFlipped: true,
        },
        {
            type: 'junk_small_tall', name: 'Small Tall Junk', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 10, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.64), radiusX: (w => w * 0.18), radiusY: ((w, h) => h * 0.23) },
            canBeFlipped: true,
        },
        {
            type: 'junk_vehicle', name: 'Vehicle Junk', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 10, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: ((w, h) => h * 0.35) },
            canBeFlipped: true,
        },

    ],

    // =========================================================================
    // LEVEL GENERATION SETTINGS (biome-specific)
    // =========================================================================
    levelGenSettings: {
        WORLD_BASE_MUD_COLOR: '#5C4033',
        WORLD_BASE_DIRT_COLOR: '#6B4F34',
        WORLD_GRASS_TILE_SCALE: 0.8,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.65,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_GRASS_CLUMP_CHANCE: 0.4,
        WORLD_GRASS_CLUMP_MIN: 2,
        WORLD_GRASS_CLUMP_MAX: 5,
        WORLD_GRASS_CLUMP_RADIUS: 32,
        WORLD_MUD_TILE_SCALE: 0.6,
        WORLD_MUD_TILE_OVERLAP_FACTOR: 0.65,
        WORLD_MUD_RANDOM_ROTATION: false,
        WORLD_MUD_NOISE_SCALE_X: 0.012,
        WORLD_MUD_NOISE_SCALE_Y: 0.012,
        WORLD_MUD_NOISE_THRESHOLD: 0.3,
        WORLD_MUD_NOISE_OCTAVES: 3,
        WORLD_MUD_PATCH_SCALE_X: 0.002,
        WORLD_MUD_PATCH_SCALE_Y: 0.002,
        WORLD_MUD_BLEND_WIDTH: 0.15,
    },


    // =========================================================================
    // RESTRICTED OBSTACLE TYPES (shouldn't spawn near player spawn zone)
    // =========================================================================
    restrictedObstacleTypes: [
            'junk_small_round',
            'junk_small_tall',
            'junk_vehicle',
    ],


    // =========================================================================
    // FLYING BIRD SPRITE PATHS (biome-specific)
    // =========================================================================
    flyingBirdSpritePaths: [
        'assets/images/effects/flying_crow_sheet.png',
        'assets/images/effects/flying_magpie_sheet.png',
        'assets/images/effects/flying_buzzard_sheet.png',
        'assets/images/effects/flying_gull_sheet.png',
    ],


    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        { name: 'junk_small_round', files: ['junk_small_1.png', 'junk_small_2.png', 'junk_small_3.png'], path: 'assets/images/objects/biomes/junkyard/junkSmall/', type: 'single' },
        { name: 'junk_small_tall', files: ['junk_small_tall_1.png', 'junk_small_tall_2.png', 'junk_small_tall_3.png'], path: 'assets/images/objects/biomes/junkyard/junkSmall/', type: 'single' },
        { name: 'junk_vehicle', files: ['vehicle_junk_patch_1.png', 'vehicle_junk_patch_2.png', 'vehicle_junk_patch_3.png', 'vehicle_junk_patch_4.png'], path: 'assets/images/objects/biomes/junkyard/vehicles/', type: 'single' },

    ],


}