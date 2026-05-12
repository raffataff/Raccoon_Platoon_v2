// js/biomes/tropical.js
// Tropical biome definition - self-contained with all sprites, obstacles, and settings

const TROPICAL_BIOME = {
    name: "TROPICAL",
    displayName: "Tropical Jungle",
    description: "dense, overgrown jungle region",
    themeAdjectives: ["Verdant", "Whispering", "Wild", "Primal", "Canopy"],

    landingVideos: [
        'assets/video/landing/Raccoon_Combat_Team_Deploys_tropical.mp4',
        'assets/video/landing/Helicopter_Landing_tropical_1.mp4',
    ],
    extractionVideos: [
        'assets/video/extraction/extraction_takeoff_1.mp4',
        'assets/video/extraction/extraction_takeoff_2.mp4',
    ],
    extractionHostageVideos: [
        'assets/video/extraction/extraction_hostage_1.mp4',
        'assets/video/extraction/extraction_hostage_2.mp4',
        'assets/video/extraction/extraction_hostage_3.mp4',
    ],

    // =========================================================================
    // SPRITE PATH MAPPINGS (keyed by obstacle type for levelGenerator lookup)
    // =========================================================================
    spritePaths: {
        // Terrain
        mud: {
            path: 'assets/images/objects/biomes/tropical/mud/',
            files: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png']
        },
        grass: {
            path: 'assets/images/objects/biomes/tropical/grass/',
            files: ['tropical_grass_1.png', 'tropical_grass_2.png', 'tropical_grass_3.png', 'tropical_grass_4.png', 'tropical_grass_5.png', 'tropical_grass_6.png', 'tropical_grass_7.png', 'tropical_grass_8.png', 'tropical_grass_9.png', 'tropical_grass_10.png', 'tropical_grass_11.png', 'tropical_grass_12.png', 'tropical_grass_13.png', 'tropical_grass_14.png', 'tropical_grass_15.png', 'tropical_grass_16.png', 'tropical_grass_17.png', 'tropical_grass_18.png', 'tropical_grass_19.png', 'tropical_grass_20.png', 'tropical_grass_21.png', 'tropical_grass_22.png', 'tropical_grass_23.png', 'tropical_grass_24.png', 'tropical_grass_25.png', 'tropical_grass_26.png', 'tropical_grass_27.png', 'tropical_grass_28.png', 'tropical_grass_29.png', 'tropical_grass_30.png', 'tropical_grass_31.png',  ]
        },

        // Ponds
        tropical_pond: {
            path: 'assets/images/objects/biomes/tropical/ponds/',
            files: ['tropical_pond_1.png', 'tropical_pond_2.png', 'tropical_pond_3.png', 'tropical_pond_4.png', 'tropical_pond_5.png']
        },

        // Walls
        tropical_wall_angled_long: {
            path: 'assets/images/objects/biomes/tropical/walls/',
            files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png']
        },

        // Bushes
        bush_large: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['fern_large_6.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png']
        },
        palm_bush_small: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png']
        },
        palm_bush_large: {
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

        // Palm trees (fullSize)
        tree_robusta_tall: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_robusta_tall_1.png', 'tropical_robusta_tall_2.png',]
        },
        tree_robusta_small: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_robusta_small_1.png', 'tropical_robusta_small_2.png', 'tropical_robusta_small_3.png', 'tropical_robusta_small_4.png', 'tropical_robusta_small_5.png', ]
        },
        tree_palm_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: ['palm1_triple.png']
        },

        // Palm2 trees
        tree_palm2_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png']
        },
        tree_palm2_double: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png']
        },
        tree_palm2_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['palm2_triple_1.png']
        },

        // Fallen logs
        tree_palm_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['palm_fallen_log_1.png']
        },
        tree_palm2_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['palm_fallen_log_2.png']
        },
        tree_deciduous_fallen: {
            path: 'assets/images/objects/biomes/tropical/logs/',
            files: ['tree_fallen_log_1.png']
        },

        // Fan trees
        tree_fan_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png']
        },
        tree_fan_double: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png']
        },
        tree_fan_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: ['tropical_fan_triple_1.png']
        },

        // Other trees
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

        // Rainforest patches
        rainforest_patch_small_1: {
            path: 'assets/images/objects/biomes/tropical/trees/forests/',
            files: ['rainforest_small_1.png']
        },
        rainforest_patch_large_1: {
            path: 'assets/images/objects/biomes/tropical/trees/forests/',
            files: ['rainforest_large_1.png', 'rainforest_large_3.png', 'rainforest_large_4.png', 'rainforest_large_5.png']
        },

        // Ruins
        tropical_ruins: {
            path: 'assets/images/objects/BIOMES/tropical/ruins/',
            files: ['ruins_arch.png', 'ruins_pillars.png', 'ruins_shrine.png', 'ruins_fallen_jag.png', 'ruins_shrine_small.png', 'ruins_monkey_tomb.png',]
        },
    },

    // =========================================================================
    // FULL OBSTACLE DEFINITIONS (moved from CONFIG.OBSTACLE_DEFINITIONS)
    // =========================================================================
    obstacleDefinitions: [

        {
            type: 'tropical_pond', name: 'Tropical Pond', color: '#1E90FF',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: false,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 1,
            phaseUnlocked: 2,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.5), radiusX: (w => w * 0.45), radiusY: (h => h * 0.35) },
        },
        {
            type: 'tropical_wall_angled_long', name: 'Tropical Wall Angled Long',
            color: '#93a5a7', destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.3,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.42), width: (w => w * 0.95), height: (h => h * 0.15), rotation: -Math.PI / 6.3 },
            canBeFlipped: true,
            placementBuffer: 90,
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 1,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.41), radiusY: (h => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: true,
            spriteScale: 0.8,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: (h => h * 0.27) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1, isDecoration: true,
            spriteScale: 0.3,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_small', name: 'Small Palm Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_large', name: 'Large Palm Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'tree_robusta_tall', name: 'Palm Tree Single', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.39), offsetY: (h => h * 0.65), radius: (w => w * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_robusta_small', name: 'Palm Tree Double', color: '#005522',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 0.65), radiusX: (w => w * 0.17), radiusY: (h => h * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm_triple', name: 'Palm Tree Triple', color: '#005522',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.3), radiusX: (w => w * 0.2), radiusY: (h => h * 0.10) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm2_single', name: 'Palm Tree 2 Single', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_palm2_double', name: 'Palm Tree 2 Double', color: '#005522',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.51), offsetY: (h => h * 0.75), radiusX: (w => w * 0.08), radiusY: (h => h * 0.065) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_palm2_triple', name: 'Palm Tree 2 Triple', color: '#005522',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_palm_fallen', name: 'Fallen Palm Tree', color: '#005522',
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
            type: 'tree_palm2_fallen', name: 'Fallen Palm2 Tree', color: '#005522',
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
            type: 'tree_fan_single', name: 'Fan Tree Single', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 0.75), radius: (w => w * 0.07) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_fan_double', name: 'Fan Tree Double', color: '#005522',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radiusX: (w => w * 0.13), radiusY: (h => h * 0.085) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.4,
            canBeFlipped: true,
        },
        {
            type: 'tree_fan_triple', name: 'Fan Tree Triple', color: '#005522',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.45,
            canBeFlipped: true,
        },
        {
            type: 'tree_rubber_single', name: 'Rubber Tree Single', color: '#005522',
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 1.5), radiusX: (w => w * 0.12), radiusY: (h => h * 0.15) },
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
            type: 'rainforest_patch_small_1',
            name: 'Small Rainforest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 10,
            spriteScale: 0.60,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.36), radiusY: (h => h * 0.2) },
            placementBuffer: 150,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'rainforest_patch_large_1',
            name: 'Large Rainforest Patch',
            color: '#0E2908',
            destructible: false,
            hp: Infinity,
            maxHp: Infinity,
            blocksMovement: true,
            providesCover: true,
            spawnWeight: 15,
            spriteScale: 0.5,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.46), radiusY: (h => h * 0.25) },
            placementBuffer: 150,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'tropical_ruins', name: 'Tropical Ruins', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1.5, isDecoration: false, canBeFlipped: true,
            spriteScale: 0.5,
            placementBuffer: 80,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radiusX: (w => w * 0.4), radiusY: (h => h * 0.2) },
        },
    ],

    // =========================================================================
    // LEVEL GENERATION SETTINGS (biome-specific)
    // =========================================================================
    levelGenSettings: {
        WORLD_BASE_MUD_COLOR: '#324824',
        WORLD_BASE_DIRT_COLOR: '#505c33',
        WORLD_GRASS_TILE_SIZE: 48,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.8,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_MUD_NOISE_SCALE_X: 0.015,
        WORLD_MUD_NOISE_SCALE_Y: 0.001,
        WORLD_MUD_NOISE_THRESHOLD: 0.3,
        WORLD_MUD_NOISE_OCTAVES: 3,
    },

    // =========================================================================
    // RESTRICTED OBSTACLE TYPES (shouldn't spawn near player spawn zone)
    // =========================================================================
    restrictedObstacleTypes: [
        'rock_medium',
        'rock_large',
        'tree5_deciduous_single',
        'tree4_deciduous_single',
        'tree_deciduous_single',
        'tree_deciduous_fallen',
        'tree_palm_fallen',
        'tree_palm2_fallen',
        'tree_palm_triple',
        'tree_palm2_triple',
        'tree_robusta_tall',
        'tree_robusta_small',
        'tree_palm2_double',
        'tree_palm2_single',
        'tree_fan_single',
        'tree_fan_double',
        'tree_fan_triple',
        'rainforest_patch_small_1',
        'tropical_ruins',
        'tropical_pond',
    ],

    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        { name: 'tropical_pond', files: ['tropical_pond_1.png', 'tropical_pond_2.png', 'tropical_pond_3.png', 'tropical_pond_4.png', 'tropical_pond_5.png'], path: 'assets/images/objects/biomes/tropical/ponds/', type: 'single' },
        { name: 'tropical_wall_angled_long', files: [
            'tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png'], path: 'assets/images/objects/biomes/tropical/walls/', type: 'single' },
        { name: 'bush_large', files: [
            'fern_large_6.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'rock_medium', files: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png'], path: 'assets/images/objects/rocks/grassy/medium/', type: 'single' },
        { name: 'rock_large', files: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png'], path: 'assets/images/objects/rocks/grassy/large/', type: 'single' },
        { name: 'tree_robusta_tall', files: ['tropical_robusta_tall_1.png', 'tropical_robusta_tall_2.png',], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_robusta_small', files: ['tropical_robusta_small_1.png', 'tropical_robusta_small_2.png', 'tropical_robusta_small_3.png', 'tropical_robusta_small_4.png', 'tropical_robusta_small_5.png',], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'palm_triple', files: ['palm1_triple.png'], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'palm_fallen', files: ['palm_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'palm2_fallen', files: ['palm_fallen_log_2.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'palm2_single', files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'palm2_double', files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'palm2_triple', files: ['palm2_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'deciduous_fallen', files: ['tree_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        { name: 'deciduous_single', files: ['tree2_single_tall.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree4_deciduous', files: ['tree4_single_large_1.png', 'tree4_single_large_2.png', 'tree4_single_large_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree5_deciduous', files: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_fan_single', files: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_fan_double', files: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_fan_triple', files: ['tropical_fan_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_rubber_single', files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/rubber/', type: 'single' },
        { name: 'palm_bush_small', files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'palm_bush_large', files: ['palm_bush_large_1.png', 'palm_bush_large_2.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'mud', files: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png'], path: 'assets/images/objects/biomes/tropical/mud/', type: 'single' },
        { name: 'grass', files: ['grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png', 'grass6.png', 'grass7.png', 'grass8.png', 'grass9.png', 'grass10.png'], path: 'assets/images/objects/biomes/tropical/grass2/', type: 'single' },
        { name: 'rainforest_small', files: ['rainforest_small_1.png'], path: 'assets/images/objects/biomes/tropical/trees/forests/', type: 'single' },
        { name: 'rainforest_large', files: ['rainforest_large_1.png', 'rainforest_large_3.png', 'rainforest_large_4.png', 'rainforest_large_5.png'], path: 'assets/images/objects/biomes/tropical/trees/forests/', type: 'single' },
        { name: 'tropical_ruins', files: ['ruins_arch.png', 'ruins_pillars.png', 'ruins_shrine.png', 'ruins_fallen_jag.png', 'ruins_shrine_small.png', 'ruins_monkey_tomb.png',], path: 'assets/images/objects/BIOMES/tropical/ruins/', type: 'single' },
    ],
};
