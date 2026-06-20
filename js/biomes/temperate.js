// js/biomes/temperate.js
// Temperate biome definition - self-contained with all sprites, obstacles, and settings


const TEMPERATE_BIOME = {
    name: "TEMPERATE",
    displayName: "Temperate Forest",
    description: "temperate deciduous forest",
    themeAdjectives: ["Crisp", "Wooded", "Serene"],

    landingVideos: [
        'assets/video/landing/helicopter_landing_temperate_2.mp4',
        'assets/video/landing/helicopter_landing_temperate_3.mp4',
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
            path: 'assets/images/objects/biomes/mud/',
            files: [ 'mud_1.png', 'mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png',]
        },
        grass: {
            path: 'assets/images/objects/biomes/temperate/grass/',
            files: ['temperate_grass_2.png', 'temperate_grass_2_2.png', 'temperate_grass_2_3.png', 'temperate_grass_3.png', 'temperate_grass_3_2.png', 'temperate_grass_4.png', 'temperate_grass_6.png', 'temperate_grass_7.png', , 'temperate_grass_9.png', 'temperate_grass_10.png', 'temperate_grass_11.png', 'temperate_grass_12.png', 'temperate_grass_13.png', 'tropical_grass_30.png',  'tropical_grass_32.png']
        },
        grass_decorations: {
            path: 'assets/images/objects/biomes/temperate/grass/',
            files: ['temperate_grass_1.png', 'temperate_grass_6.png', 'temperate_grass_25.png',  ]
        },

        // Walls (reusing tropical wall assets as placeholders)
        temperate_wall_angled_long: {
            path: 'assets/images/objects/biomes/tropical/walls/',
            files: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png']
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

        // Bushes (temperate versions using tropical bush assets as placeholders)
        bush_medium: {
            path: 'assets/images/objects/biomes/temperate/bushes/',
            files: ['bush_medium_1.png', 'bush_medium_3.png', 'bush_medium_4.png', 'bush_medium_5.png', 'temperate_grass_15.png', ]
        },
        bush_large: {
            path: 'assets/images/objects/biomes/temperate/bushes/',
            files: ['bush_large_1.png', 'bush_large_2.png', 'bush_large_3.png', 'bush_berry_1.png', 'bush_berry_2.png', 'bush_berry_3.png', 'bush_berry_4.png', 'bush_berry_5.png', 'bush_berry_6.png', 'bush_berry_7.png' ]
        },
        oak_bush_small: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_bush_1.png', 'tree_oak_bush_2.png', 'tree_oak_bush_3.png', 'tree_oak_bush_4.png', ]
        },
        

        // Oak trees
        tree_oak_single: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_single_1.png', 'tree_oak_single_2.png', 'tree_oak_single_3.png']
        },
        tree_oak_double: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_double_1.png', 'tree_oak_double_2.png', 'tree_oak_double_3.png']
        },
        tree_oak_fallen_small: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_fallen_small_1.png', 'tree_oak_fallen_small_2.png', 'tree_oak_fallen_small_3.png', 'tree_oak_fallen_small_4.png']
        },
        tree_oak_fallen_large: {
            path: 'assets/images/objects/biomes/temperate/trees/oak/',
            files: ['tree_oak_fallen_large_1.png', 'tree_oak_fallen_large_2.png']
        },
        // Maple trees
        tree_maple_single: {
            path: 'assets/images/objects/biomes/temperate/trees/maple/',
            files: ['tree_maple_single_1.png', 'tree_maple_single_2.png', 'tree_maple_single_3.png']
        },
        tree_maple_double: {
            path: 'assets/images/objects/biomes/temperate/trees/maple/',
            files: ['tree_maple_double_1.png', 'tree_maple_double_2.png', ]
        },
        // Rubber Trees
        tree_rubber_single: {
            path: 'assets/images/objects/biomes/tropical/trees/rubber/',
            files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png']
        },
        // Willow Trees
        tree_willow: {
            path: 'assets/images/objects/biomes/temperate/trees/willow/',
            files: ['tree_willow_1.png', 'tree_willow_2.png', 'tree_willow_3.png', 'tree_willow_4.png' ]
        },
        // Birch Trees
        tree_birch: {
            path: 'assets/images/objects/biomes/temperate/trees/birch/',
            files: ['tree_birch_1.png', 'tree_birch_2.png', 'tree_birch_3.png', 'tree_birch_4.png',  ]
        },
        birch_fallen: {
            path: 'assets/images/objects/biomes/temperate/trees/birch/',
            files: ['tree_birch_fallen_1.png', 'tree_birch_fallen_2.png']
        },
        birch_stump: {
            path: 'assets/images/objects/biomes/temperate/trees/birch/',
            files: ['tree_birch_destroyed_1.png', 'tree_birch_destroyed_2.png' ]
        },
        // Pine Trees
        tree_pine: {
            path: 'assets/images/objects/biomes/temperate/trees/pine/',
            files: ['tree_pine_1.png', 'tree_pine_2.png', 'tree_pine_3.png',  ]
        },
        pine_fallen: {
            path: 'assets/images/objects/biomes/temperate/trees/pine/',
            files: ['pine_fallen_log_1.png', 'pine_fallen_log_2.png', ]
        },
        pine_stump: {
            path: 'assets/images/objects/biomes/temperate/trees/pine/',
            files: ['pine_stump_1.png', 'pine_stump_2.png', 'pine_stump_3.png' ]
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

        // Random Stuff
        water_well: {
            path: 'assets/images/objects/biomes/temperate/',
            files: ['water_well.png']
        },

        // Ruins (temperate version)
        temperate_ruins_medium: {
            path: 'assets/images/objects/biomes/temperate/ruins/',
            files: ['temperate_ruins_arch_1.png', ]
        },
        temperate_ruins_large: {
            path: 'assets/images/objects/biomes/temperate/ruins/',
            files: ['temperate_ruins_tower.png',]
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

        // Huts
        // Empty Possum huts
        empty_hut_round: {
            path: 'assets/images/objects/possums/huts/',
            files: ['possum_hut_6.png' ],
        },
        empty_possum_hut_2: {
            path: 'assets/images/objects/possums/huts/',
            files: ['possum_hut_round_1_jungle.png', 'possum_hut_square_1_jungle.png', 'possum_building_small_1.png', 'possum_building_small_2.png'],
        },

        // Possum structures (spawning huts — biome-specific sprite pairs)
        possum_barracks_1: {
            path: 'assets/images/objects/possums/barracks/',
            pairs: [
                { normal: 'possum_barracks_1.png', destroyed: 'possum_barracks_1_destroyed.png' },
                { normal: 'possum_barracks_2.png', destroyed: 'possum_barracks_2_destroyed.png' },
            ],
        },
        possum_hut: {
            path: 'assets/images/objects/possums/huts/',
            pairs: [
                { normal: 'possum_hut_1.png', destroyed: 'possum_hut_1_destroyed.png' },
            ],
        },
        possum_hut_round: {
            path: 'assets/images/objects/possums/huts/',
            pairs: [
                { normal: 'possum_hut_4.png', destroyed: 'possum_hut_4_destroyed.png' },
                { normal: 'possum_hut_5.png', destroyed: 'possum_hut_5_destroyed.png' },
            ],
        },
        general_possum_building_large: {
            path: 'assets/images/objects/possums/general/',
            pairs: [
                { normal: 'possum_building_large_1.png', destroyed: 'possum_building_large_1.png' },
                { normal: 'possum_warehouse.png', destroyed: 'possum_building_large_1.png' },
            ],
        },
    },

    // =========================================================================
    // FULL OBSTACLE DEFINITIONS (adapted from tropical)
    // =========================================================================
    obstacleDefinitions: [
        {
            type: 'grass_decorations', name: 'Grass Decoration', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spawnWeight: 10, isDecoration: true,
            spriteScale: 0.4,
        },
        {
            type: 'pond',
            name: 'Pond',
            color: '#4A90D9',
            destructible: false, blocksMovement: true, providesCover: false, 
            isDecoration: false,
            spawnWeight: 1.5,
            spriteScale: 0.8,
            phaseUnlocked: 2,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.35) },
            swirlRegion: { centerX: 0.5, centerY: 0.5, radius: 0.25 },
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
            spawnWeight: 0.5,
            isDecoration: false,
            spriteScale: 0.8,
            phaseUnlocked: 3,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.45) },
            swirlRegion: { centerX: 0.5, centerY: 0.5, radius: 0.25 },
            canBeFlipped: true,
            placementBuffer: 80,
        },
        {
            type: 'water_well', name: 'Water Well', color: '#4A90D9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: false,
            spawnWeight: 0.5, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.5), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.2) },
            swirlRegion: { centerX: 0.5, centerY: 0.5, radius: 0.2 },
            canBeFlipped: true,
            placementBuffer: 80,
        },
        {
            type: 'temperate_wall_angled_long', name: 'Temperate Wall Angled Long',
            color: '#8B7355', destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.3,
            collisionShapes: [
                { 
                    type: 'ellipse', offsetX: (w => w * 0.1), offsetY: (h => h * 0.8), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
                { 
                    type: 'ellipse', offsetX: (w => w * 0.8), offsetY: (h => h * 0.2), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
            ],
            canBeFlipped: true,
            placementBuffer: 130,
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 75, maxHp: 75,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: true,
            spriteScale: 0.4,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: ((w, h) => h * 0.27) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'bush_medium', name: 'Medium Bush', color: '#228B22',
            destructible: false,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1, isDecoration: true,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'bush_large', name: 'Large Bush', color: '#006400',
            destructible: false,
            blocksMovement: false, providesCover: false,
            spawnWeight: 1, isDecoration: true,
            spriteScale: 0.2,
            canBeFlipped: true,
        },
        {
            type: 'oak_bush_small', name: 'Small Oak Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: true, providesCover: false,
            spawnWeight: 3, isDecoration: false, canBeFlipped: true,
            spriteScale: 0.5,
            collisionShape: {
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.8), radiusX: (w => w * 0.1), radiusY: ((w, h) => h * 0.1) },
        },
        {
            type: 'tree_oak_single', name: 'Oak Tree Single', color: '#bb5912',
            destructible: false, blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 80,
            spriteScale: 0.75,
            collisionShape: {
            type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.78), radius: (w => w * 0.1) },
        },
        {
            type: 'tree_oak_double', name: 'Oak Tree Double', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 100,
            spriteScale: 0.6,
            collisionShape: {
                type: 'ellipse', offsetX: (w => w * 0.47), offsetY: (h => h * 0.7), radiusX: (w => w * 0.17), radiusY: ((w, h) => h * 0.09) },
        },
        
        {
            type: 'tree_oak_fallen_small', name: 'SmallFallen Oak Tree', color: '#8B4513',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            isDecoration: false, canBeFlipped: true,
            spawnWeight: 0.5,
            placementBuffer: 80,
            spriteScale: 0.3,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.42), radiusX: (w => w * 0.75), radiusY: (h => h * 0.35) },
        },
        {
            type: 'tree_oak_fallen_large', name: 'LargeFallen Oak Tree', color: '#228B22',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { 
                type: 'rectangle', offsetX: (w => w * 0.05), offsetY: (h => h * 0.05), width: (w => w * 0.85), height: (h => h * 0.25) },
            canBeFlipped: true,
        },
        {
            type: 'tree_willow', name: 'Willow Tree', color: '#228B22',
            destructible: false,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 1.0,
            collisionShape: { 
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.72), radius: (w => w * 0.08) },
            canBeFlipped: true,
        },
        {
            type: 'tree_birch', name: 'Birch Tree', color: '#C8B560',
            destructible: true, hp: 80, maxHp: 80,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 80,
            spriteScale: 0.7,
            treeStumpType: 'birch_stump',
            fallenTreeType: 'birch_fallen',
            collisionShape: {
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.78), radius: (w => w * 0.1)
            },
        },
        {
            type: 'birch_fallen', name: 'Fallen Birch Tree', color: '#C8B560',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5,
            isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 80,
            spriteScale: 0.3,
            collisionShape: {
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.42), radiusX: (w => w * 0.75), radiusY: (h => h * 0.35)
            },
        },
        {
            type: 'birch_stump', name: 'Birch Tree Stump', color: '#C8B560',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: {
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radius: (w => w * 0.08)
            },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_pine', name: 'Pine Tree', color: '#2E5A1E',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 80,
            spriteScale: 0.7,
            treeStumpType: 'pine_stump',
            fallenTreeType: 'pine_fallen',
            collisionShape: {
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.78), radius: (w => w * 0.1)
            },
        },
        {
            type: 'pine_fallen', name: 'Fallen Pine Log', color: '#2E5A1E',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5,
            isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 80,
            spriteScale: 0.3,
            collisionShape: {
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.42), radiusX: (w => w * 0.75), radiusY: (h => h * 0.35)
            },
        },
        {
            type: 'pine_stump', name: 'Pine Tree Stump', color: '#2E5A1E',
            destructible: false, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: false,
            spriteScale: 0.35,
            collisionShape: {
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radius: (w => w * 0.08)
            },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'tree_maple_single', name: 'Maple Tree Single', color: '#8B4513',
            destructible: false, blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false, canBeFlipped: true,
            spriteScale: 0.65,
            collisionShape: { 
                type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.75), radius: (w => w * 0.1) },
        },
        {
            type: 'possum_barracks_1', name: 'Possum Barracks', color: '#62a170',
            destructible: true, hp: 120, maxHp: 120,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, phaseUnlocked: 2,
            spriteScale: 0.7,
            spriteDestroyedScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.5), radiusX: (w => w * 0.35), radiusY: (h => h * 0.26) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            decorationBuffer: 200,
            placementBuffer: 350,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 6],
                countPerPhaseBonus: 0.3,
                spawnRadius: 300,
                unitPool: [
                    { type: 'possum_grunt', weight: 10 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 0.4 },
                    { type: 'possum_elite', weight: 0.2 }
                ]
            }
        },
        {
            type: 'possum_hut', name: 'Possum Hut', color: '#8B4513',
            destructible: true, hp: 100, maxHp: 100,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, phaseUnlocked: 1,
            spriteScale: 0.7,
            spriteDestroyedScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.58), radiusX: (w => w * 0.3), radiusY: (h => h * 0.18) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 480,
            decorationBuffer: 200,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 280,
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
            spawnWeight: 0, phaseUnlocked: 1,
            spriteScale: 0.3,
            spriteDestroyedScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 0.42), radius: (w => w * 0.3) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 280,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 280,
                unitPool: [
                    { type: 'possum_grunt', weight: 10 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 0.4 },
                    { type: 'possum_elite', weight: 0.2 }
                ]
            }
        },
        {
            type: 'general_possum_building_large', name: 'Large Possum Building', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            isDecoration: false,
            canBeFlipped: true,
            spawnWeight: 2, phaseUnlocked: 3,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.53), radiusX: (w => w * 0.37), radiusY: (h => h * 0.26) },
            placementBuffer: 350,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 6],
                countPerPhaseBonus: 0.3,
                spawnRadius: 350,
                unitPool: [
                    { type: 'possum_grunt', weight: 5 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 1 },
                    { type: 'possum_elite', weight: 0.5 },
                    { type: 'possum_eliteGuard', weight: 0.2 }
                ]
            }
        },
        {
            type: 'empty_possum_hut_2', name: 'Empty Possum Hut', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            isDecoration: false,
            canBeFlipped: true,
            spawnWeight: 3, phaseUnlocked: 2,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.55), radiusX: (w => w * 0.35), radiusY: (h => h * 0.26) },
            placementBuffer: 150,
            decorationBuffer: 200,
        }
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
        'rock_medium',
        'rock_large',
        'tree_oak_fallen_small',
        'tree_oak_fallen_large',
        'tree_oak_single',
        'tree_oak_double',
        'tree_birch',
        'birch_fallen',
        'birch_fallen',
        'tree_pine',
        'pine_fallen',
        'tree_willow',
        'tree_secondary_single',
        'tree_secondary_double',
        'tree_maple_single',
        'tree_maple_double',
        'forest_patch_small_1',
        'forest_patch_large_1',
        'temperate_ruins_medium',
        'temperate_ruins_large',
        'pond',
        'lake',
        'possum_barracks_1',
        'possum_hut',
        'possum_hut_round',
        'general_possum_building_large',
        'empty_possum_hut_2',
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
        
        //BUSHES
        { name: 'bush_medium', files: ['bush_medium_1.png', 'bush_medium_3.png', 'bush_medium_4.png', 'bush_medium_5.png', 'temperate_grass_15.png',  ], path: 'assets/images/objects/biomes/temperate/bushes/', type: 'single' },
        { name: 'bush_large', files: ['bush_large_1.png', 'bush_large_2.png', 'bush_large_3.png', 'bush_berry_1.png', 'bush_berry_2.png', 'bush_berry_3.png', 'bush_berry_4.png', 'bush_berry_5.png', 'bush_berry_6.png', 'bush_berry_7.png' ], path: 'assets/images/objects/biomes/temperate/bushes/', type: 'single' },
        
        //ROCKS
        { name: 'rock_medium', files: ['rock_medium_temperate_1.png', 'rock_medium_temperate_2.png', 'rock_medium_temperate_3.png', 'rock_medium_temperate_4.png', 'rock_medium_temperate_5.png', 'rock_medium_temperate_6.png', 'rock_medium_temperate_7.png', 'rock_medium_temperate_8.png',], path: 'assets/images/objects/biomes/temperate/rocks/medium/', type: 'single' },
        
        { name: 'rock_large', files: ['rock_large_temperate_1.png', 'rock_large_temperate_2.png', 'rock_large_temperate_3.png', 'rock_large_temperate_4.png', 'rock_large_temperate_5.png', 'rock_large_temperate_6.png', 'rock_large_temperate_7.png', 'rock_large_temperate_8.png', ], path: 'assets/images/objects/biomes/temperate/rocks/large/', type: 'single' },
        
        //TREES
            // WILLOW
        { name: 'tree_willow', files: ['tree_willow_1.png', 'tree_willow_2.png', 'tree_willow_3.png', 'tree_willow_4.png' ], path: 'assets/images/objects/biomes/temperate/trees/willow/', type: 'single' },
            // OAK
        { name: 'oak_bush_small', files: ['tree_oak_bush_1.png', 'tree_oak_bush_2.png', 'tree_oak_bush_3.png', 'tree_oak_bush_4.png', ], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'oak_single', files: ['tree_oak_single_1.png', 'tree_oak_single_2.png', 'tree_oak_single_3.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'oak_double', files: ['palm1_double.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'oak_fallen_small', files: ['tree_oak_fallen_small_1.png', 'tree_oak_fallen_small_2.png', 'tree_oak_fallen_small_3.png', 'tree_oak_fallen_small_4.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
        { name: 'tree_oak_fallen_large', files: ['tree_oak_fallen_large_1.png', 'tree_oak_fallen_large_2.png'], path: 'assets/images/objects/biomes/temperate/trees/oak/', type: 'single' },
            // MAPLE
        { name: 'tree_maple_single', files: ['tree_maple_single_1.png', 'tree_maple_single_2.png', 'tree_maple_single_3.png'], path: 'assets/images/objects/biomes/temperate/trees/maple/', type: 'single' },
        { name: 'tree_maple_double', files: ['tree_maple_double_1.png', 'tree_maple_double_2.png',], path: 'assets/images/objects/biomes/temperate/trees/maple/', type: 'single' },
            // BIRCH
        { name: 'tree_birch', files: ['tree_birch_1.png', 'tree_birch_2.png', 'tree_birch_3.png', 'tree_birch_4.png',  ], path: 'assets/images/objects/biomes/temperate/trees/birch', type: 'single' },
        { name: 'birch_fallen', files: ['tree_birch_fallen_1.png', 'tree_birch_fallen_2.png'], path: 'assets/images/objects/biomes/temperate/trees/birch/', type: 'single' },
        { name: 'birch_stump', files: ['tree_birch_destroyed_1.png', 'tree_birch_destroyed_2.png'], path: 'assets/images/objects/biomes/temperate/trees/birch/', type: 'single' },
            // PINE
        { name: 'tree_pine', files: ['tree_pine_1.png', 'tree_pine_2.png', 'tree_pine_3.png'], path: 'assets/images/objects/biomes/temperate/trees/pine/', type: 'single' },
        { name: 'pine_fallen', files: ['pine_fallen_log_1.png', 'pine_fallen_log_2.png', ], path: 'assets/images/objects/biomes/temperate/trees/pine/', type: 'single' },
        { name: 'pine_stump', files: ['pine_stump_1.png', 'pine_stump_2.png', 'pine_stump_3.png' ], path: 'assets/images/objects/biomes/temperate/trees/pine/', type: 'single' },
            // RUBBER
        { name: 'tree_rubber_single', files: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'], path: 'assets/images/objects/biomes/tropical/trees/rubber/', type: 'single' },
        
        //FORESTS
        { name: 'forest_small', files: ['temperate_forest_small_1.png'], path: 'assets/images/objects/biomes/temperate/forests/', type: 'single' },
        { name: 'forest_large', files: ['temperate_forest_1.png', 'temperate_forest_2.png', 'temperate_forest_3.png', 'temperate_forest_4.png', 'temperate_forest_5.png', 'temperate_forest_6.png'], path: 'assets/images/objects/biomes/temperate/forests/', type: 'single' },
        
        //RUINS
        { name: 'temperate_ruins_medium', files: ['temperate_ruins_arch_1.png', ], path: 'assets/images/objects/biomes/temperate/ruins/', type: 'single' },
        { name: 'temperate_ruins_large', files: ['temperate_ruins_tower.png',], path: 'assets/images/objects/biomes/temperate/ruins/', type: 'single' },

        //WATER
        { name: 'pond', files: ['pond_temperate_1.png', 'pond_temperate_2.png', 'pond_temperate_3.png', 'pond_temperate_4.png'], path: 'assets/images/objects/biomes/temperate/ponds/', type: 'single' },
        { name: 'lake', files: ['lake_temperate_1.png', 'lake_temperate_2.png'], path: 'assets/images/objects/biomes/temperate/ponds/', type: 'single' },

        // Random Objects
        { name: 'water_well', files: ['water_well.png'], path: 'assets/images/objects/biomes/temperate/', type: 'single' },

        // GROUND TILES
        { name: 'mud', files: ['mud_1.png', 'mud_2.png', 'mud_3.png', 'mud_4.png', 'mud_5.png', 'mud_6.png', 'sand_new_1.png', 'sand_new_2.png', 'sand_new_3.png', 'sand_new_4.png', 'sand_new_5.png' ], path: 'assets/images/objects/biomes/mud/', type: 'single' },
         { name: 'grass', files: ['temperate_grass_2.png', 'temperate_grass_2_2.png', 'temperate_grass_2_3.png', 'temperate_grass_3.png', 'temperate_grass_3_2.png', 'temperate_grass_4.png', 'temperate_grass_6.png', 'temperate_grass_7.png', , 'temperate_grass_9.png', 'temperate_grass_10.png', 'temperate_grass_11.png', 'temperate_grass_12.png', 'temperate_grass_13.png', 'tropical_grass_30.png',  'tropical_grass_32.png' ], path: 'assets/images/objects/biomes/temperate/grass/', type: 'single' },
         { name: 'grass_decorations', files: ['temperate_grass_1.png', 'temperate_grass_4.png',  'temperate_grass_6.png',  'temperate_grass_9.png', 'temperate_grass_12.png', 'temperate_grass_25.png', ], path: 'assets/images/objects/biomes/temperate/grass/', type: 'single' }
    ],

    // =========================================================================
    // SHOOTOUT BACKGROUNDS (biome-specific)
    // =========================================================================
    shootoutBackgrounds: {
        // TODO: Add temperate shootout backgrounds here
        TEMPERATE_FOREST_1: {
                NAME: 'Pine Attack',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_1.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":460,"y":1108,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":175,"scale":1.7,"showInDevMode":false},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":1467,"y":914,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":1,"showInDevMode":false},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1673,"y":848,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":585,"y":832,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1418,"y":921,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":717,"y":826,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":303,"y":87,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1166,"y":762,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1538,"y":667,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":849,"y":702,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":55,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":600,"y":643,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1300,"y":653,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":90,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":916,"y":712,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}

                ]
            },
            TEMPERATE_FOREST_2: {
                NAME: 'Meadow Massacre',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_2.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":461,"y":1108,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":175,"scale":1.7,"showInDevMode":false},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":1581,"y":584,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1747,"y":912,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":442,"y":791,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":10,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1315,"y":877,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":354,"y":494,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":75,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":236,"y":619,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":889,"y":752,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1281,"y":806,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":794,"y":638,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":45,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":400,"y":290,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":70,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1432,"y":568,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1250,"y":566,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":90,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":705,"y":848,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":900,"y":1095,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":170,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":657,"y":487,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1668,"y":327,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":70,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}

                ]
            },

            TEMPERATE_FOREST_3: {
                NAME: 'Pine Ambush',
                IMAGE: 'assets/images/shootouts/temperate/Shootout_temperate_3.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":460,"y":1108,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":175,"scale":1.7,"showInDevMode":false},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":1410,"y":963,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1644,"y":899,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":455,"y":837,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1316,"y":911,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":619,"y":901,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.9,"showInDevMode":false},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":252,"y":112,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1163,"y":747,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1265,"y":788,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":838,"y":747,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":35,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":602,"y":688,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1372,"y":190,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1046,"y":716,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":706,"y":844,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":751,"y":912,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":185,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}
                ]
            },
            TEMPERATE_FOREST_EXTRACTION_1: {
                NAME: 'A Rush Of Blood',
                IMAGE: 'assets/images/shootouts/temperate/shootout_temperate_extraction_1.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":460,"y":1108,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":175,"scale":1.7,"showInDevMode":false},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":1404,"y":941,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1646,"y":914,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":145,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":464,"y":839,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1316,"y":914,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":619,"y":901,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.9,"showInDevMode":false},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":260,"y":108,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1510,"y":602,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1266,"y":788,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":95,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":684,"y":493,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":494,"y":584,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1451,"y":558,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1185,"y":502,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":706,"y":852,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":751,"y":912,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":185,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}

                ]
            },
    },
};
