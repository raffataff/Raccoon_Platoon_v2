// js/biomes/temperate.js
// Temperate biome definition - self-contained with all sprites, obstacles, and settings
// Uses tropical sprite paths as placeholders until temperate assets are created

const TEMPERATE_BIOME = {
    name: "TEMPERATE",
    displayName: "Temperate Forest",
    description: "temperate deciduous forest",
    themeAdjectives: ["Crisp", "Wooded", "Serene"],

    landingVideos: [
        'assets/video/landing/helicopter_landing_temperate_1.mp4',
        'assets/video/landing/helicopter_landing_temperate_2.mp4',
    ],
    extractionVideos: [
        'assets/video/extraction/helicopter_extraction_team_temperate_2.mp4',
    ],
    extractionHostageVideos: [
        'assets/video/extraction/extraction_hostage_1.mp4',
        'assets/video/extraction/extraction_hostage_2.mp4',
        'assets/video/extraction/extraction_hostage_3.mp4',
        'assets/video/extraction/extraction_hostage_4.mp4',
    ],

    // =========================================================================
    // SPRITE PATH MAPPINGS (keyed by obstacle type for levelGenerator lookup)
    // Using tropical paths as placeholders - update when temperate assets are ready
    // =========================================================================
    spritePaths: {
        // Terrain
        mud: {
            path: 'assets/images/objects/biomes/temperate/mud/',
            files: [  'mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png',]
        },
        grass: {
            path: 'assets/images/objects/biomes/temperate/grass/',
            files: ['temperate_grass_1.png', 'temperate_grass_2.png', 'temperate_grass_3.png', 'temperate_grass_4.png','temperate_grass_6.png', 'temperate_grass_7.png', , 'temperate_grass_9.png', 'temperate_grass_10.png', 'temperate_grass_11.png', 'temperate_grass_12.png', 'temperate_grass_13.png',  ]
        },

        // Walls (reusing tropical wall assets as placeholders)
        temperate_wall_angled_long: {
            path: 'assets/images/objects/biomes/tropical/walls/',
            files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png']
        },

        // Bushes (temperate versions using tropical bush assets as placeholders)
        bush_medium: {
            path: 'assets/images/objects/biomes/temperate/bushes/',
            files: ['bush_medium_1.png', 'bush_medium_3.png', 'bush_medium_4.png', 'bush_medium_5.png', 'temperate_grass_15.png', ]
        },
        bush_large: {
            path: 'assets/images/objects/biomes/temperate/bushes/',
            files: ['bush_large_1.png', 'bush_large_2.png', 'bush_large_3.png', ]
        },
        oak_bush_small: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png']
        },
        oak_bush_large: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['palm_bush_large_1.png', 'palm_bush_large_2.png']
        },

        // Rocks
        rock_medium: {
            path: 'assets/images/objects/biomes/temperate/rocks/medium/',
            files: ['rock_medium_temperate_1.png', 'rock_medium_temperate_2.png', 'rock_medium_temperate_3.png', 'rock_medium_temperate_4.png', 'rock_medium_temperate_5.png', 'rock_medium_temperate_6.png', 'rock_medium_temperate_7.png', 'rock_medium_temperate_8.png', ]
        },
        rock_large: {
            path: 'assets/images/objects/biomes/temperate/rocks/large/',
            files: ['rock_large_temperate_1.png', 'rock_large_temperate_2.png', 'rock_large_temperate_3.png', 'rock_large_temperate_4.png', 'rock_large_temperate_5.png', 'rock_large_temperate_6.png', 'rock_large_temperate_7.png', 'rock_large_temperate_8.png', ]
        },

        // Oak trees (fullSize)
        tree_oak_single: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_single_1.png', 'tree_oak_single_2.png', 'tree_oak_single_3.png']
        },
        tree_oak_double: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_double_1.png', 'tree_oak_double_2.png', 'tree_oak_double_3.png']
        },
        tree_oak_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: ['palm1_triple.png']
        },

        // Secondary trees (using tropical palm2 assets as placeholders)
        tree_secondary_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: []
        },
        tree_secondary_double: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: []
        },
        tree_secondary_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: []
        },

        // Fallen logs
        tree_oak_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['tree_fallen_log_1.png']
        },
        tree_secondary_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['tree_fallen_log_1.png']
        },
        tree_deciduous_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['tree_fallen_log_1.png']
        },

        // Maple trees (using tropical fan tree assets as placeholders)
        tree_maple_single: {
            path: 'assets/images/objects/biomes/temperate/trees/maple/',
            files: ['tree_maple_single_1.png', 'tree_maple_single_2.png', 'tree_maple_single_3.png']
        },
        tree_maple_double: {
            path: 'assets/images/objects/biomes/temperate/trees/maple/',
            files: ['tree_maple_double_1.png', 'tree_maple_double_2.png', ]
        },
        tree_maple_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: []
        },

        // Other deciduous trees
        tree_rubber_single: {
            path: 'assets/images/objects/biomes/tropical/trees/rubber/',
            files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png']
        },
        tree_willow_single: {
            path: 'assets/images/objects/biomes/temperate/trees/willow/',
            files: ['tree_willow_1.png', 'tree_willow_2.png', 'tree_willow_3.png', 'tree_willow_4.png' ]
        },
        tree_birch: {
            path: 'assets/images/objects/biomes/temperate/trees/birch/',
            files: ['tree_birch_1.png', 'tree_birch_2.png',  ]
        },
        tree_pine: {
            path: 'assets/images/objects/biomes/temperate/trees/pine/',
            files: ['tree_pine_1.png', ]
        },

        // Forest patches
        forest_patch_small_1: {
            path: 'assets/images/objects/biomes/temperate/forests/',
            files: ['temperate_forest_small_1.png']
        },
        forest_patch_large_1: {
            path: 'assets/images/objects/biomes/temperate/forests/',
            files: ['temperate_forest_1.png', 'temperate_forest_2.png', 'temperate_forest_3.png', 'temperate_forest_4.png', 'temperate_forest_5.png', 'temperate_forest_6.png']
        },

        // Ruins (temperate version)
        temperate_ruins: {
            path: 'assets/images/objects/BIOMES/tropical/ruins/',
            files: ['ruins_arch.png', 'ruins_pillars.png', 'ruins_shrine.png', 'ruins_fallen_jag.png', 'ruins_shrine_small.png', 'ruins_monkey_tomb.png',]
        },

        // Water bodies
        pond: {
            path: 'assets/images/objects/biomes/temperate/ponds/',
            files: ['pond_temperate_1.png', 'pond_temperate_2.png', 'pond_temperate_3.png', 'pond_temperate_4.png',  ],
        },
        lake: {
            path: 'assets/images/objects/biomes/temperate/ponds/',
            files: ['lake_temperate_1.png', 'lake_temperate_2.png',]
        },
    },

    // =========================================================================
    // FULL OBSTACLE DEFINITIONS (adapted from tropical)
    // =========================================================================
    obstacleDefinitions: [
        {
            type: 'pond',
            name: 'Pond',
            color: '#4A90D9',
            destructible: false,
            blocksMovement: true,
            providesCover: false,
            spawnWeight: 0.5,
            isDecoration: false,
            spriteScale: 0.8,
            phaseUnlocked: 2,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.35) },
            canBeFlipped: true,
            placementBuffer: 80,
        },
        {
            type: 'lake',
            name: 'Lake',
            color: '#4A90D9',
            destructible: false,
            blocksMovement: true,
            providesCover: false,
            spawnWeight: 1.5,
            isDecoration: false,
            spriteScale: 0.8,
            phaseUnlocked: 2,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.45) },
            canBeFlipped: true,
            placementBuffer: 80,
        },
        {
            type: 'temperate_wall_angled_long', name: 'Temperate Wall Angled Long',
            color: '#8B7355', destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.42), width: (w => w * 0.95), height: (h => h * 0.15), rotation: -Math.PI / 6 },
            canBeFlipped: true,
            placementBuffer: 90,
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: true,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.27) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: false,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: false,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'oak_bush_small', name: 'Small Oak Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'oak_bush_large', name: 'Large Oak Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'tree_oak_single', name: 'Oak Tree Single', color: '#bb5912',
            destructible: true, hp: 300, maxHp: 300,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.75,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.756), radius: (w => w * 0.1) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_oak_double', name: 'Oak Tree Double', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.6), radiusX: (w => w * 0.17), radiusY: ((w, h) => h * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_oak_triple', name: 'Oak Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.3), radiusX: (w => w * 0.2), radiusY: ((w, h) => h * 0.10) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_secondary_single', name: 'Secondary Tree Single', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_secondary_double', name: 'Secondary Tree Double', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.51), offsetY: (h => h * 0.75), radiusX: (w => w * 0.08), radiusY: ((w, h) => h * 0.065) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_secondary_triple', name: 'Secondary Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_oak_fallen', name: 'Fallen Oak Tree', color: '#8B4513',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 0.9,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_willow_single', name: 'Will Tree', color: '#228B22',
            destructible: false, hp: 250, maxHp: 250,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 1.0,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radius: (w => w * 0.12) },
            canBeFlipped: true,
        },
        {
            type: 'tree_secondary_fallen', name: 'Fallen Secondary Tree', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0,
            isDecoration: false,
            spriteScale: 0.8,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_maple_single', name: 'Maple Tree Single', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.65,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radius: (w => w * 0.1) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_maple_double', name: 'Maple Tree Double', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.65,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radiusX: (w => w * 0.13), radiusY: ((w, h) => h * 0.085) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_maple_triple', name: 'Maple Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
        },
        {
            type: 'tree_rubber_single', name: 'Rubber Tree Single', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.85), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        
        {
            type: 'tree_birch', name: 'Birch Tree', color: '#228B22',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.55), offsetY: (h => h * 0.85), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree_pine', name: 'Pine Tree', color: '#228B22',
            destructible: true, hp: 175, maxHp: 175,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radiusX: (w => w * 0.16), radiusY: ((w, h) => h * 0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree_deciduous_fallen', name: 'Fallen Deciduous Tree', color: '#228B22',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
        },
        {
            type: 'forest_patch_small_1',
            name: 'Small Forest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 10,
            spriteScale: 0.70,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.36), radiusY: ((w, h) => h * 0.35) },
            placementBuffer: 150,
            decorationBuffer: 35,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'forest_patch_large_1',
            name: 'Large Forest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 15,
            spriteScale: 0.7,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.46), radiusY: ((w, h) => h * 0.35) },
            placementBuffer: 150,
            decorationBuffer: 35,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'temperate_ruins', name: 'Temperate Ruins', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.65,
            placementBuffer: 80,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.2) },
            canBeFlipped: true,
        },
        
    ],

    // =========================================================================
    // LEVEL GENERATION SETTINGS (biome-specific)
    // =========================================================================
    levelGenSettings: {
        WORLD_BASE_MUD_COLOR: '#5C4033',
        WORLD_BASE_DIRT_COLOR: '#6B4F34',
        WORLD_GRASS_TILE_SIZE: 48,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.65,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_MUD_NOISE_SCALE_X: 0.01,
        WORLD_MUD_NOISE_SCALE_Y: 0.05,
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
        'rock_large',
        'rock_medium',
        'tree_pine',
        'tree_birch',
        'tree_willow_single',
        'tree_oak_fallen',
        'tree_secondary_fallen',
        'tree_deciduous_fallen',
        'tree_oak_single',
        'tree_oak_triple',
        'tree_oak_double',
        'tree_secondary_single',
        'tree_secondary_double',
        'tree_maple_single',
        'tree_maple_double',
        'tree_maple_triple',
        'forest_patch_small_1',
        'forest_patch_large_1',
        'temperate_ruins',
        'pond',
        'lake',
    ],

    // =========================================================================
    // FLYING BIRD SPRITE PATHS (biome-specific)
    // =========================================================================
    flyingBirdSpritePaths: [
        'assets/images/effects/flying_crow_sheet.png',
        'assets/images/effects/flying_magpie_sheet.png',
        'assets/images/effects/flying_hawk_sheet.png',
    ],

    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        { name: 'temperate_wall_angled_long', files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png'], path: 'assets/images/objects/biomes/tropical/walls/', type: 'single' },
        
        //BUSH
        { name: 'bush_medium', files: ['bush_medium_1.png', 'bush_medium_3.png', 'bush_medium_4.png', 'bush_medium_5.png', 'temperate_grass_15.png',  ], path: 'assets/images/objects/biomes/temperate/bushes/', type: 'single' },
        { name: 'bush_large', files: ['bush_large_1.png', 'bush_large_2.png', 'bush_large_3.png', ], path: 'assets/images/objects/biomes/temperate/bushes/', type: 'single' },
        
        // BUSH
        { name: 'oak_bush_small', files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'oak_bush_large', files: ['palm_bush_large_1.png', 'palm_bush_large_2.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        
        //ROCK
        { name: 'rock_medium', files: ['rock_medium_temperate_1.png', 'rock_medium_temperate_2.png', 'rock_medium_temperate_3.png', 'rock_medium_temperate_4.png', 'rock_medium_temperate_5.png', 'rock_medium_temperate_6.png', 'rock_medium_temperate_7.png', 'rock_medium_temperate_8.png',], path: 'assets/images/objects/biomes/temperate/rocks/medium/', type: 'single' },

        { name: 'rock_large', files: ['rock_large_temperate_1.png', 'rock_large_temperate_2.png', 'rock_large_temperate_3.png', 'rock_large_temperate_4.png', 'rock_large_temperate_5.png', 'rock_large_temperate_6.png', 'rock_large_temperate_7.png', 'rock_large_temperate_8.png', ], path: 'assets/images/objects/biomes/temperate/rocks/large/', type: 'single' },
        
        //TREE
        { name: 'tree_willow_single', files: ['tree_willow_1.png', 'tree_willow_2.png', 'tree_willow_3.png', 'tree_willow_4.png' ], path: 'assets/images/objects/biomes/temperate/trees/willow/', type: 'single' },
        
        { name: 'oak_single', files: ['tree_oak_single_1.png', 'tree_oak_single_2.png', 'tree_oak_single_3.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'oak_double', files: ['palm1_double.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'oak_triple', files: [], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'oak_fallen', files: ['palm_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        
        { name: 'secondary_fallen', files: ['palm_fallen_log_2.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'secondary_single', files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'secondary_double', files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'secondary_triple', files: ['palm2_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'deciduous_fallen', files: ['tree_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        
        { name: 'tree_birch', files: ['tree_birch_1.png', 'tree_birch_1.png', ], path: 'assets/images/objects/biomes/temperate/trees/birch', type: 'single' },
        { name: 'tree_pine', files: ['tree_pine_1.png', ], path: 'assets/images/objects/biomes/temperate/trees/pine/', type: 'single' },
        { name: 'tree_maple_single', files: ['tree_maple_single_1.png', 'tree_maple_single_2.png', 'tree_maple_single_3.png'], path: 'assets/images/objects/biomes/temperate/trees/maple/', type: 'single' },
        { name: 'tree_maple_double', files: ['tree_maple_double_1.png', 'tree_maple_double_2.png',], path: 'assets/images/objects/biomes/temperate/trees/maple/', type: 'single' },
        { name: 'tree_maple_triple', files: ['tropical_fan_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        
        { name: 'tree_rubber_single', files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/rubber/', type: 'single' },
        
        
        //FOREST
        { name: 'forest_small', files: ['temperate_forest_small_1.png'], path: 'assets/images/objects/biomes/temperate/forests/', type: 'single' },
        { name: 'forest_large', files: ['temperate_forest_1.png', 'temperate_forest_2.png', 'temperate_forest_3.png', 'temperate_forest_4.png', 'temperate_forest_5.png', 'temperate_forest_6.png'], path: 'assets/images/objects/biomes/temperate/forests/', type: 'single' },
        //RUINS
        { name: 'temperate_ruins', files: ['ruins_arch.png', 'ruins_pillars.png', 'ruins_shrine.png', 'ruins_fallen_jag.png', 'ruins_shrine_small.png', 'ruins_monkey_tomb.png',], path: 'assets/images/objects/BIOMES/tropical/ruins/', type: 'single' },
        //WATER
        { name: 'pond', files: ['pond_temperate_1.png', 'pond_temperate_2.png', 'pond_temperate_3.png', 'pond_temperate_4.png'], path: 'assets/images/objects/biomes/temperate/ponds/', type: 'single' },
        { name: 'lake', files: ['lake_temperate_1.png', 'lake_temperate_2.png'], path: 'assets/images/objects/biomes/temperate/ponds/', type: 'single' },

        // GROUND TILES
        { name: 'mud', files: ['mud_grassy_1.png', 'mud_grassy_2.png', 'mud_grassy_3.png', 'mud_grassy_4.png', 'mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png', 'mud_1.png', 'mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png',], path: 'assets/images/objects/biomes/temperate/mud/', type: 'single' },
        { name: 'grass', files: ['temperate_grass_1.png', 'temperate_grass_2.png', 'temperate_grass_3.png', 'temperate_grass_4.png', 'temperate_grass_5.png', 'temperate_grass_6.png', 'temperate_grass_7.png', 'temperate_grass_8.png', 'temperate_grass_9.png', 'temperate_grass_10.png', 'temperate_grass_11.png', 'temperate_grass_12.png', 'temperate_grass_13.png', 'temperate_grass_19.png', 'temperate_grass_20.png', 'temperate_grass_21.png', 'temperate_grass_22.png', 'temperate_grass_23.png', 'temperate_grass_24.png', 'temperate_grass_25.png',], path: 'assets/images/objects/biomes/temperate/grass/', type: 'single' },
    ],
};
