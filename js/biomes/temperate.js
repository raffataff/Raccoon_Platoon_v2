// js/biomes/temperate.js
// Temperate biome definition - self-contained with all sprites, obstacles, and settings
// Uses tropical sprite paths as placeholders until temperate assets are created

const TEMPERATE_BIOME = {
    name: "TEMPERATE",
    displayName: "Temperate Forest",
    description: "a temperate deciduous forest",
    themeAdjectives: ["Autumn", "Golden", "Crisp", "Wooded", "Serene"],

    // =========================================================================
    // SPRITE PATH MAPPINGS (keyed by obstacle type for levelGenerator lookup)
    // Using tropical paths as placeholders - update when temperate assets are ready
    // =========================================================================
    spritePaths: {
        // Terrain
        mud: {
            path: 'assets/images/objects/biomes/tropical/mud/',
            files: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png']
        },
        grass: {
            path: 'assets/images/objects/biomes/tropical/grass2/',
            files: ['grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png', 'grass6.png', 'grass7.png', 'grass8.png', 'grass9.png', 'grass10.png']
        },

        // Walls (reusing tropical wall assets as placeholders)
        temperate_wall_angled_long: {
            path: 'assets/images/objects/biomes/tropical/walls/',
            files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png']
        },

        // Bushes (temperate versions using tropical bush assets as placeholders)
        bush_large: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['fern_large_1.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png']
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
            path: 'assets/images/objects/rocks/grassy/medium/',
            files: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png']
        },
        rock_large: {
            path: 'assets/images/objects/rocks/grassy/large/',
            files: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png']
        },

        // Oak trees (fullSize) - using tropical palm assets as placeholders
        tree_oak_single: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: ['palm1_single_1.png', 'palm1_single_2.png', 'palm1_single_3.png']
        },
        tree_oak_double: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: ['palm1_double.png']
        },
        tree_oak_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: ['palm1_triple.png']
        },

        // Secondary trees (using tropical palm2 assets as placeholders)
        tree_secondary_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png']
        },
        tree_secondary_double: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png']
        },
        tree_secondary_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_triple_1.png']
        },

        // Fallen logs
        tree_oak_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['palm_fallen_log_1.png']
        },
        tree_secondary_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['palm_fallen_log_2.png']
        },
        tree_deciduous_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['tree_fallen_log_1.png']
        },

        // Maple trees (using tropical fan tree assets as placeholders)
        tree_maple_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png']
        },
        tree_maple_double: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png']
        },
        tree_maple_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_triple_1.png']
        },

        // Other deciduous trees
        tree_rubber_single: {
            path: 'assets/images/objects/biomes/tropical/trees/rubber/',
            files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png']
        },
        tree_deciduous_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tree2_single_tall.png']
        },
        tree4_deciduous_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tree4_single_large_1.png', 'tree4_single_large_2.png', 'tree4_single_large_3.png']
        },
        tree5_deciduous_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png']
        },

        // Forest patches
        forest_patch_small_1: {
            path: 'assets/images/objects/biomes/tropical/trees/forests/',
            files: ['rainforest_small_1.png']
        },
        forest_patch_large_1: {
            path: 'assets/images/objects/biomes/tropical/trees/forests/',
            files: ['rainforest_large_1.png', 'rainforest_large_3.png', 'rainforest_large_4.png', 'rainforest_large_5.png']
        },

        // Ruins (temperate version)
        temperate_ruins: {
            path: 'assets/images/objects/BIOMES/tropical/ruins/',
            files: ['ruins_arch.png']
        },
    },

    // =========================================================================
    // FULL OBSTACLE DEFINITIONS (adapted from tropical)
    // =========================================================================
    obstacleDefinitions: [
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
            spawnWeight: 4, isDecoration: false,
            spriteScale: 1,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.27) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'oak_bush_small', name: 'Small Oak Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'oak_bush_large', name: 'Large Oak Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'tree_oak_single', name: 'Oak Tree Single', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.39), offsetY: (h => h * 1.25), radius: (w => w * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.25), radiusX: (w => w * 0.17), radiusY: ((w, h) => h * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_oak_triple', name: 'Oak Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.3), radiusX: (w => w * 0.2), radiusY: ((w, h) => h * 0.10) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_secondary_single', name: 'Secondary Tree Single', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 6, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_secondary_double', name: 'Secondary Tree Double', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.51), offsetY: (h => h * 0.75), radiusX: (w => w * 0.08), radiusY: ((w, h) => h * 0.065) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_secondary_triple', name: 'Secondary Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_oak_fallen', name: 'Fallen Oak Tree', color: '#8B4513',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2,
            isDecoration: false,
            spriteScale: 1.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_secondary_fallen', name: 'Fallen Secondary Tree', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2,
            isDecoration: false,
            spriteScale: 0.8,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.22), width: (w => w * 0.85), height: (h => h * 0.15) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_maple_single', name: 'Maple Tree Single', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 0.75), radius: (w => w * 0.07) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_maple_double', name: 'Maple Tree Double', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radiusX: (w => w * 0.13), radiusY: ((w, h) => h * 0.085) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_maple_triple', name: 'Maple Tree Triple', color: '#8B4513',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
        },
        {
            type: 'tree_rubber_single', name: 'Rubber Tree Single', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.85), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree_deciduous_single', name: 'Deciduous Tree Single', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.93), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree4_deciduous_single', name: 'Deciduous Tree Large', color: '#228B22',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree5_deciduous_single', name: 'Deciduous Tree Medium', color: '#228B22',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 1.5), radiusX: (w => w * 0.12), radiusY: ((w, h) => h * 0.15) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree_deciduous_fallen', name: 'Fallen Deciduous Tree', color: '#228B22',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2,
            isDecoration: false,
            spriteScale: 0.6,
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
            spriteScale: 0.60,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.38), radiusX: (w => w * 0.36), radiusY: ((w, h) => h * 0.25) },
            placementBuffer: 150,
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
            spriteScale: 0.5,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.46), radiusY: ((w, h) => h * 0.25) },
            placementBuffer: 150,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'temperate_ruins', name: 'Temperate Ruins', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: true,
            spriteScale: 0.5,
            placementBuffer: 80,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.2) },
        },
    ],

    // =========================================================================
    // LEVEL GENERATION SETTINGS (biome-specific)
    // =========================================================================
    levelGenSettings: {
        WORLD_BASE_MUD_COLOR: '#5C4033',
        WORLD_BASE_DIRT_COLOR: '#6B4F34',
        WORLD_GRASS_TILE_SIZE: 48,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.6,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_MUD_NOISE_SCALE_X: 0.005,
        WORLD_MUD_NOISE_SCALE_Y: 0.1,
        WORLD_MUD_NOISE_THRESHOLD: 0.3,
        WORLD_MUD_NOISE_OCTAVES: 3,
    },

    // =========================================================================
    // RESTRICTED OBSTACLE TYPES (shouldn't spawn near player spawn zone)
    // =========================================================================
    restrictedObstacleTypes: [
        'rock_large',
        'rock_medium',
        'tree5_deciduous_single',
        'tree4_deciduous_single',
        'tree_deciduous_single',
        'tree_oak_fallen',
        'tree_secondary_fallen',
        'tree_oak_triple',
        'tree_oak_double',
        'tree_oak_single',
        'tree_secondary_single',
        'tree_secondary_double',
        'tree_maple_single',
        'tree_maple_double',
        'tree_maple_triple',
        'forest_patch_small_1',
        'temperate_ruins',
    ],

    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        { name: 'temperate_wall_angled_long', files: [
            'tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png'], path: 'assets/images/objects/biomes/tropical/walls/', type: 'single' },
        { name: 'bush_large', files: [
            'fern_large_1.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'rock_medium', files: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png'], path: 'assets/images/objects/rocks/grassy/medium/', type: 'single' },
        { name: 'rock_large', files: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png'], path: 'assets/images/objects/rocks/grassy/large/', type: 'single' },
        { name: 'oak_single', files: ['palm1_single_1.png', 'palm1_single_2.png', 'palm1_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'oak_double', files: ['palm1_double.png'], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'oak_triple', files: ['palm1_triple.png'], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'oak_fallen', files: ['palm_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'secondary_fallen', files: ['palm_fallen_log_2.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'secondary_single', files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'secondary_double', files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'secondary_triple', files: ['palm2_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'deciduous_fallen', files: ['tree_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'deciduous_single', files: ['tree2_single_tall.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree4_deciduous', files: ['tree4_single_large_1.png', 'tree4_single_large_2.png', 'tree4_single_large_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree5_deciduous', files: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_maple_single', files: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_maple_double', files: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_maple_triple', files: ['tropical_fan_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_rubber_single', files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/rubber/', type: 'single' },
        { name: 'oak_bush_small', files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'oak_bush_large', files: ['palm_bush_large_1.png', 'palm_bush_large_2.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'mud', files: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png'], path: 'assets/images/objects/biomes/tropical/mud/', type: 'single' },
        { name: 'grass', files: ['grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png', 'grass6.png', 'grass7.png', 'grass8.png', 'grass9.png', 'grass10.png'], path: 'assets/images/objects/biomes/tropical/grass2/', type: 'single' },
        { name: 'forest_small', files: ['rainforest_small_1.png'], path: 'assets/images/objects/biomes/tropical/trees/forests/', type: 'single' },
        { name: 'forest_large', files: ['rainforest_large_1.png', 'rainforest_large_3.png', 'rainforest_large_4.png', 'rainforest_large_5.png'], path: 'assets/images/objects/biomes/tropical/trees/forests/', type: 'single' },
        { name: 'temperate_ruins', files: ['ruins_arch.png'], path: 'assets/images/objects/BIOMES/tropical/ruins/', type: 'single' },
    ],
};
