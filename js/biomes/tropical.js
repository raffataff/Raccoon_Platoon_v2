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
        'assets/video/landing/Helicopter_Landing_tropical_2.mp4',
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
            path: 'assets/images/objects/biomes/mud/',
            files: ['sand_new_1.png', 'sand_new_2.png', 'sand_new_3.png', 'sand_new_4.png']
        },
        grass: {
            path: 'assets/images/objects/biomes/tropical/grass/',
            files: ['tropical_grass_2.png', 'tropical_grass_3.png', 'tropical_grass_3_2.png', 'tropical_grass_3_3.png', 'tropical_grass_4.png', 'tropical_grass_5.png', 'tropical_grass_6.png', 'tropical_grass_7.png', 'tropical_grass_8.png', 'tropical_grass_9.png', 'tropical_grass_10.png', 'tropical_grass_11.png', 'tropical_grass_12.png', 'tropical_grass_13.png', 'tropical_grass_14.png', 'tropical_grass_15.png', 'tropical_grass_16.png', 'tropical_grass_17.png', 'tropical_grass_18.png', 'tropical_grass_19.png', 'tropical_grass_20.png', 'tropical_grass_21.png', 'tropical_grass_22.png', 'tropical_grass_23.png', 'tropical_grass_24.png', 'tropical_grass_25.png', 'tropical_grass_26.png', 'tropical_grass_27.png', 'tropical_grass_29.png', 'tropical_grass_30.png', 'tropical_grass_31.png',  ]
        },
        grass_decoration: {
            path: 'assets/images/objects/biomes/tropical/grass/',
            files: ['tropical_grass_4.png', 'tropical_grass_5.png', 'tropical_grass_6.png', 'tropical_grass_7.png', 'tropical_grass_8.png', 'tropical_grass_9.png', 'tropical_grass_10.png', 'tropical_grass_11.png', 'tropical_grass_12.png', 'tropical_grass_13.png', 'tropical_grass_15.png',  'tropical_grass_17.png', 'tropical_grass_18.png', 'tropical_grass_19.png', 'tropical_grass_20.png', 'tropical_grass_21.png', 'tropical_grass_22.png', 'tropical_grass_23.png',  ]
        },

        // Ponds
        tropical_pond: {
            path: 'assets/images/objects/biomes/tropical/ponds/',
            files: ['tropical_pond_1.png', 'tropical_pond_2.png', 'tropical_pond_3.png', 'tropical_pond_4.png', 'tropical_pond_5.png', 'tropical_pond_6.png', ]
        },

        // Walls
        tropical_wall_angled_long: {
            path: 'assets/images/objects/biomes/tropical/walls/',
            files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png']
        },

        // Bushes
        bush_large: {
            path: 'assets/images/objects/biomes/tropical/bushes/',
            files: ['fern_large_6.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png']
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
            path: 'assets/images/objects/biomes/tropical/rocks/medium/',
            files: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png']
        },
        rock_large: {
            path: 'assets/images/objects/biomes/tropical/rocks/large/',
            files: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png']
        },

        // Palm trees (fullSize)
        tree_robusta_tall: {
            path: 'assets/images/objects/biomes/tropical/trees/robusta/',
            files: ['tropical_robusta_tall_1.png', 'tropical_robusta_tall_2.png',]
        },
        tree_robusta_small: {
            path: 'assets/images/objects/biomes/tropical/trees/robusta/',
            files: [ 'tropical_robusta_small_5.png', 'tropical_robusta_small_6.png', 'tropical_robusta_small_7.png', 'tropical_robusta_small_8.png' ]
        },
        tree_palm_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/fullSize/',
            files: []
        },

        // Palm2 trees
        tree_palm2_single: {
            path: 'assets/images/objects/biomes/tropical/trees/palm2/',
            files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png']
        },
        tree_palm2_double: {
            path: 'assets/images/objects/biomes/tropical/trees/palm2/',
            files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png']
        },
        tree_palm2_triple: {
            path: 'assets/images/objects/biomes/tropical/trees/palm2/',
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
        tree_kapok_single: {
            path: 'assets/images/objects/biomes/tropical/trees/kapok/',
            files: ['tropical_kapok_single_1.png', 'tropical_kapok_single_2.png', 'tropical_kapok_single_3.png']
        },
        tree_pheonix: {
            path: 'assets/images/objects/biomes/tropical/trees/pheonix/',
            files: ['tree_pheonix_1.png', 'tree_pheonix_2.png', 'tree_pheonix_3.png']
        },
        tree5_deciduous_single: {
            path: 'assets/images/objects/biomes/tropical/trees/',
            files: []
        },

        // Rainforest patches
        rainforest_patch_small_1: {
            path: 'assets/images/objects/biomes/tropical/forests/',
            files: ['tropical_forest_small_1.png']
        },
        rainforest_patch_large_1: {
            path: 'assets/images/objects/biomes/tropical/forests/',
            files: ['tropical_forest_long_1.png', 'tropical_forest_long_2.png', 'tropical_forest_long_3.png', 'tropical_forest_long_4.png']
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
            type: 'grass_decoration', name: 'Grass Decoration', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spawnWeight: 10, isDecoration: true,
            spriteScale: 0.2,
        },
        {
            type: 'tropical_pond', name: 'Tropical Pond', color: '#1E90FF',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: false,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            phaseUnlocked: 2,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: (h => h * 0.22) },
        },
        {
            type: 'tropical_wall_angled_long', name: 'Tropical Wall Angled Long',
            color: '#93a5a7', destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.3,
            collisionShapes: [
                { type: 'ellipse', offsetX: (w => w * 0.1), offsetY: (h => h * 0.8), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
                { type: 'ellipse', offsetX: (w => w * 0.8), offsetY: (h => h * 0.2), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
            ],
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
            spawnWeight: 10, isDecoration: true,
            spriteScale: 0.3,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_small', name: 'Small Palm Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 14, isDecoration: true,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_large', name: 'Large Palm Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 14, isDecoration: true,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'tree_robusta_tall', name: 'Palm Tree Single', color: '#005522',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.7,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 1.95), radius: (w => w * 0.1) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_robusta_small', name: 'Palm Tree Double', color: '#005522',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.8,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.97), radiusX: (w => w * 0.17), radiusY: (h => h * 0.09) },
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
            spawnWeight: 2, isDecoration: false,
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
            spawnWeight: 1, isDecoration: false,
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
            spawnWeight: 2, isDecoration: false,
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
            spawnWeight: 1, isDecoration: false,
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
            spawnWeight: 0.7, isDecoration: false,
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
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.85), radius: (w => w * 0.08) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree_kapok_single', name: 'Kapok Tree Single', color: '#228B22',
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
            type: 'tree_pheonix', name: 'Pheonix Palm', color: '#228B22',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.53), offsetY: (h => h * 0.75), radiusX: (w => w * 0.1), radiusY: (h => h * 0.06) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/tree_single_stump_1.png',
            spriteDestroyedScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'tree5_deciduous_single', name: 'Deciduous Tree Medium', color: '#228B22',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.32), radiusX: (w => w * 0.36), radiusY: (h => h * 0.17) },
            placementBuffer: 150,
            decorationBuffer: 50,
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.32), radiusX: (w => w * 0.46), radiusY: (h => h * 0.2) },
            placementBuffer: 150,
            decorationBuffer: 50,
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
        WORLD_GRASS_TILE_SCALE: 0.8,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.65,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_MUD_TILE_SCALE: 0.6,
        WORLD_MUD_TILE_OVERLAP_FACTOR: 0.45,
        WORLD_MUD_RANDOM_ROTATION: false,
        WORLD_MUD_NOISE_SCALE_X: 0.012,
        WORLD_MUD_NOISE_SCALE_Y: 0.012,
        WORLD_MUD_NOISE_THRESHOLD: 0.3,
        WORLD_MUD_NOISE_OCTAVES: 3,
        WORLD_MUD_PATCH_SCALE_X: 0.003,
        WORLD_MUD_PATCH_SCALE_Y: 0.003,
        WORLD_MUD_BLEND_WIDTH: 0.85,
    },

    // =========================================================================
    // RESTRICTED OBSTACLE TYPES (shouldn't spawn near player spawn zone)
    // =========================================================================
    restrictedObstacleTypes: [
        'rock_medium',
        'rock_large',
        'tree5_deciduous_single',
        'tree_pheonix',
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
    // FLYING BIRD SPRITE PATHS (biome-specific)
    // =========================================================================
    flyingBirdSpritePaths: [
        'assets/images/effects/flying_parrot_blueGreen_sheet.png',
        'assets/images/effects/flying_parrot_rainbow_sheet.png',
        'assets/images/effects/flying_bird_sheet.png',
        'assets/images/effects/flying_toucan_sheet.png',
    ],

    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        // 
        { name: 'tropical_pond', files: ['tropical_pond_1.png', 'tropical_pond_2.png', 'tropical_pond_3.png', 'tropical_pond_4.png', 'tropical_pond_5.png', 'tropical_pond_6.png', ], path: 'assets/images/objects/biomes/tropical/ponds/', type: 'single' },
        
        { name: 'palm_bush_small', files: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        { name: 'palm_bush_large', files: ['palm_bush_large_1.png', 'palm_bush_large_2.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        
        { name: 'tropical_wall_angled_long', files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png'], path: 'assets/images/objects/biomes/tropical/walls/', type: 'single' },
        
        { name: 'bush_large', files: ['fern_large_6.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png', 'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png'], path: 'assets/images/objects/biomes/tropical/bushes/', type: 'single' },
        
        // Rocks
        { name: 'rock_medium', files: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png'], path: 'assets/images/objects/biomes/tropical/rocks/medium/', type: 'single' },
        { name: 'rock_large', files: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png'], path: 'assets/images/objects/biomes/tropical/rocks/large/', type: 'single' },
        
        // Trees
        { name: 'tree_robusta_small', files: [ 'tropical_robusta_small_5.png', 'tropical_robusta_small_6.png', 'tropical_robusta_small_7.png', 'tropical_robusta_small_8.png' ], path: 'assets/images/objects/biomes/tropical/trees/robusta/', type: 'single' },
        { name: 'tree_robusta_tall', files: ['tropical_robusta_tall_1.png', 'tropical_robusta_tall_2.png',], path: 'assets/images/objects/biomes/tropical/trees/robusta/', type: 'single' },
        
        { name: 'palm_triple', files: ['palm1_triple.png'], path: 'assets/images/objects/biomes/tropical/trees/fullSize/', type: 'single' },
        { name: 'palm_fallen', files: ['palm_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        
        { name: 'palm2_single', files: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/palm2/', type: 'single' },
        { name: 'palm2_double', files: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/palm2/', type: 'single' },
        { name: 'palm2_triple', files: ['palm2_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/palm2/', type: 'single' },
        { name: 'palm2_fallen', files: ['palm_fallen_log_2.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        
        { name: 'kapok_single', files: ['tropical_kapok_single_1.png', 'tropical_kapok_single_2.png', 'tropical_kapok_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/kapok/', type: 'single' },
        { name: 'tree_pheonix', files: ['tree_pheonix_1.png', 'tree_pheonix_2.png', 'tree_pheonix_3.png'], path: 'assets/images/objects/biomes/tropical/trees/pheonix/', type: 'single' },
        { name: 'tree5_deciduous', files: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'deciduous_fallen', files: ['tree_fallen_log_1.png'], path: 'assets/images/objects/biomes/tropical/logs/', type: 'single' },
        
        { name: 'tree_fan_single', files: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_fan_double', files: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        { name: 'tree_fan_triple', files: ['tropical_fan_triple_1.png'], path: 'assets/images/objects/biomes/tropical/trees/', type: 'single' },
        
        { name: 'tree_rubber_single', files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/rubber/', type: 'single' },
        
        // Rainforest patches
        { name: 'rainforest_small', files: ['tropical_forest_small_1.png'], path: 'assets/images/objects/biomes/tropical/forests/', type: 'single' },
        { name: 'rainforest_large', files: ['tropical_forest_long_1.png', 'tropical_forest_long_2.png', 'tropical_forest_long_3.png', 'tropical_forest_long_4.png'], path: 'assets/images/objects/biomes/tropical/forests/', type: 'single' },
        
        // Ruins
        { name: 'tropical_ruins', files: ['ruins_arch.png', 'ruins_pillars.png', 'ruins_shrine.png', 'ruins_fallen_jag.png', 'ruins_shrine_small.png', 'ruins_monkey_tomb.png',], path: 'assets/images/objects/BIOMES/tropical/ruins/', type: 'single' },
        
        // Ground textures
        { name: 'mud', files: ['mud_1.png','mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png', 'sand_new_1.png', 'sand_new_2.png', 'sand_new_3.png', 'sand_new_4.png', 'sand_new_5.png' ], path: 'assets/images/objects/biomes/mud/', type: 'single' },
        
        { name: 'grass', files: ['tropical_grass_1.png', 'tropical_grass_2.png', 'tropical_grass_3.png', 'tropical_grass_4.png', 'tropical_grass_5.png', 'tropical_grass_6.png', 'tropical_grass_7.png', 'tropical_grass_8.png', 'tropical_grass_9.png', 'tropical_grass_10.png', 'tropical_grass_11.png', 'tropical_grass_12.png', 'tropical_grass_13.png', 'tropical_grass_14.png', 'tropical_grass_15.png', 'tropical_grass_16.png', 'tropical_grass_17.png', 'tropical_grass_18.png', 'tropical_grass_19.png', 'tropical_grass_20.png', 'tropical_grass_21.png', 'tropical_grass_22.png', 'tropical_grass_23.png', 'tropical_grass_24.png', 'tropical_grass_25.png', 'tropical_grass_26.png', 'tropical_grass_27.png', 'tropical_grass_28.png', 'tropical_grass_29.png', 'tropical_grass_30.png', 'tropical_grass_31.png',  ], path: 'assets/images/objects/biomes/tropical/grass/', type: 'single' },
        
        { name: 'grass_decoration', files: ['tropical_grass_1.png', 'tropical_grass_2.png', 'tropical_grass_3.png', 'tropical_grass_3_2.png', 'tropical_grass_3_3.png', 'tropical_grass_4.png', 'tropical_grass_5.png', 'tropical_grass_6.png', 'tropical_grass_7.png', 'tropical_grass_8.png', 'tropical_grass_9.png', 'tropical_grass_10.png', 'tropical_grass_11.png', 'tropical_grass_12.png', 'tropical_grass_13.png', 'tropical_grass_14.png', 'tropical_grass_15.png', 'tropical_grass_16.png', 'tropical_grass_17.png', 'tropical_grass_18.png', 'tropical_grass_19.png', 'tropical_grass_20.png', 'tropical_grass_21.png', 'tropical_grass_22.png', 'tropical_grass_23.png', 'tropical_grass_24.png', 'tropical_grass_25.png', 'tropical_grass_26.png', 'tropical_grass_27.png', 'tropical_grass_29.png', 'tropical_grass_30.png', 'tropical_grass_31.png',  ], path: 'assets/images/objects/biomes/tropical/grass/', type: 'single' },
    ],

    // =========================================================================
    // SHOOTOUT BACKGROUNDS (biome-specific)
    // =========================================================================
    shootoutBackgrounds: {
        JUNGLE_ATTACK: {
            NAME: 'Jungle Attack',
            IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_1.png',
            TREE_SPAWN_POSITIONS: [
                {"x":355,"y":1087,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":100,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":false}}},
                {"x":435,"y":908,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":105,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":16,"peekOffset":100,"scale":1.5,"showInDevMode":false}}},
                {"x":867,"y":1095,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":110,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":60,"scale":0.9,"showInDevMode":true}}},
                {"x":1109,"y":880,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":70,"scale":1.3,"showInDevMode":true}}},
                {"x":1403,"y":803,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":65,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":65,"scale":1,"showInDevMode":true}}},
                {"x":1635,"y":932,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":200,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":40,"peekOffset":130,"scale":1.8,"showInDevMode":true}}},
                {"x":516,"y":896,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":175,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":50,"peekOffset":155,"scale":1.5,"showInDevMode":true}}},
                {"x":212,"y":196,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":90,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":75,"scale":1.4,"showInDevMode":true}}},
                {"x":745,"y":337,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.6,"showInDevMode":true}}},
                {"x":1064,"y":407,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":40,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":912,"y":891,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":85,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1604,"y":853,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":100,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}}
            ]
        },
        JUNGLE_RUINS: {
            NAME: 'Jungle Ruins',
            IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_2.png',
            TREE_SPAWN_POSITIONS: [
                {"x":1013,"y":762,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":95,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":130,"scale":1.6,"showInDevMode":false}}},
                {"x":476,"y":765,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":90,"scale":1.5,"showInDevMode":false}}},
                {"x":1184,"y":603,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":65,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"showInDevMode":true}}},
                {"x":1264,"y":766,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":125,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":100,"scale":1.4,"showInDevMode":true}}},
                {"x":1053,"y":1070,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":100,"scale":1.8,"showInDevMode":true}}},
                {"x":674,"y":780,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":95,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":85,"scale":1.4,"showInDevMode":true}}},
                {"x":918,"y":543,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":50,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":0.7,"showInDevMode":true}}},
                {"x":1015,"y":542,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":45,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":55,"scale":0.8,"showInDevMode":true}}},
                {"x":701,"y":1056,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":55,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1038,"y":711,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":50,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1654,"y":761,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":100,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":110,"y":430,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":85,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}}
            ]
        },
        JUNGLE_AMBUSH: {
            NAME: 'Jungle Ambush',
            IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_3.png',
            TREE_SPAWN_POSITIONS: [
                {"x":382,"y":1107,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":175,"scale":1.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                {"x":566,"y":860,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":16,"peekOffset":70,"scale":1.5,"showInDevMode":true}}},
                {"x":760,"y":829,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":160,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":60,"scale":0.9,"showInDevMode":true}}},
                {"x":1295,"y":87,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":60,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":70,"scale":1.3,"showInDevMode":true}}},
                {"x":1276,"y":956,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":195,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":65,"scale":1,"showInDevMode":true}}},
                {"x":1744,"y":926,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":200,"scale":1.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":40,"peekOffset":115,"scale":1.9,"showInDevMode":true}}},
                {"x":759,"y":916,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":130,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":50,"peekOffset":155,"scale":1.5,"showInDevMode":true}}},
                {"x":347,"y":245,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":100,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":75,"scale":1.4,"showInDevMode":true}}},
                {"x":1046,"y":771,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.3,"showInDevMode":true}}},
                {"x":1552,"y":770,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.3,"showInDevMode":true}}},
                {"x":559,"y":1100,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":55,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1552,"y":627,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":100,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}}
            ]
        },
        JUNGLE_RUINS_2: {
            NAME: 'Jungle Ruins 2',
            IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_4.png',
            TREE_SPAWN_POSITIONS: [
                {"x":202,"y":945,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":200,"scale":2,"showInDevMode":false},"heavy":{"enabled":false,"weight":0,"peekOffset":195,"scale":2.3,"showInDevMode":false}}},
                {"x":464,"y":710,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":115,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":95,"scale":1.4,"showInDevMode":true}}},
                {"x":902,"y":599,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":90,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":90,"scale":1,"showInDevMode":true}}},
                {"x":1181,"y":602,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"showInDevMode":true}}},
                {"x":1389,"y":1030,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":67,"peekOffset":110,"scale":2,"showInDevMode":false},"heavy":{"enabled":false,"weight":30,"peekOffset":105,"scale":2,"showInDevMode":true}}},
                {"x":981,"y":1077,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":175,"scale":2.6,"showInDevMode":false},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":3,"showInDevMode":false}}},
                {"x":745,"y":893,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"showInDevMode":true}}},
                {"x":1324,"y":698,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":90,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":80,"scale":1.2,"showInDevMode":true}}},
                {"x":1658,"y":863,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":165,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                {"x":771,"y":519,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                {"x":1284,"y":956,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":160,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                {"x":600,"y":933,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}
            ]
        },
        RAINFOREST_BATTLE_1: {
            NAME: 'Rainforest Battle',
            IMAGE: 'assets/images/shootouts/tropical/Shootout_Jungle_6.png',
            TREE_SPAWN_POSITIONS: [
                {"x":558,"y":852,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":746,"y":890,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":80,"scale":1.6,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1504,"y":1075,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":150,"scale":2.1,"showInDevMode":false},"heavy":{"enabled":false,"weight":25,"peekOffset":170,"scale":2.1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1120,"y":755,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":85,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":60,"scale":0.7,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":663,"y":436,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":365,"y":1106,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":195,"scale":1.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1455,"y":715,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":150,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":false},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":1167,"y":888,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":120,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":807,"y":781,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":115,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},
                {"x":841,"y":1107,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":130,"scale":1.9,"showInDevMode":false},"heavy":{"enabled":false,"weight":25,"peekOffset":105,"scale":2.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}}
            ]
        },
    },
};
