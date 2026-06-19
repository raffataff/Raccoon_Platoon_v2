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
            path: 'assets/images/objects/biomes/junkyard/mud/',
            files: [ 'mud_junkyard_1.png', 'mud_junkyard_3.png', 'mud_junkyard_4.png', 'mud_junkyard_5.png', 'mud_junkyard_6.png', 'mud_junkyard_7.png', 'mud_junkyard_8.png',]
        },
        grass: {
            path: 'assets/images/objects/biomes/junkyard/mud/',
            files: ['mud_junkyard_1.png', 'mud_junkyard_3.png', 'mud_junkyard_4.png', 'mud_junkyard_5.png', 'mud_junkyard_6.png', 'mud_junkyard_7.png', 'mud_junkyard_8.png',]
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
        junk_vehicle_small: {
            path: 'assets/images/objects/biomes/junkyard/vehicles/',
            files: ['vehicle_junk_patch_small_1.png', 'vehicle_junk_patch_small_2.png',]
        },
        junk_vehicle_large: {
            path: 'assets/images/objects/biomes/junkyard/vehicles/',
            files: ['vehicle_junk_patch_large_1.png', 'vehicle_junk_patch_large_2.png', ]
        },
        vehicle_heap_small: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: []
        },

        vehicle_heap_large: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['vehicle_heap_large_1.png', 'vehicle_heap_large_2.png', 'vehicle_heap_large_3.png', ]
        },
        trash_heap_small: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: []
        },
        trash_heap_large: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['trash_heap_large_1.png', ]
        },
        trashbag_heap_small: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['trashbag_heap_small_1.png', 'trashbag_heap_small_2.png',]
        },
        trashbag_heap_medium1: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['trashbag_heap_medium1_1.png',]
        },
        trashbag_heap_medium2: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['trashbag_heap_medium2_1.png',]
        },
        trashbag_heap_large: {
            path: 'assets/images/objects/biomes/junkyard/heaps/',
            files: ['trashbag_heap_large_1.png']
        },

        // Empty Possum huts
        empty_hut_round: {
            path: 'assets/images/objects/possums/huts/',
            files: ['possum_hut_6.png' ],
        },
        empty_possum_hut_2: {
            path: 'assets/images/objects/possums/huts/',
            files: ['possum_hut_square_1_jungle.png', 'possum_building_small_1.png', 'possum_building_small_2.png'],
        },
        junkyard_building_medium: {
            path: 'assets/images/objects/biomes/junkyard/buildings/',
            files: ['junkyard_empty_building_1.png', 'junkyard_empty_building_2.png', 'junkyard_empty_building_4.png'],
        },
        junkyard_building_large: {
            path: 'assets/images/objects/biomes/junkyard/buildings/',
            files: ['junkyard_empty_building_3.png',],
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
    // OBJECT DEFINITIONS
    // =========================================================================
    obstacleDefinitions: [
        {
            type: 'junk_small_round', name: 'Small Round Junk', color: '#654321',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.55,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.64), radiusX: (w => w * 0.3), radiusY: ((w, h) => h * 0.15) },
            canBeFlipped: true,
        },
        {
            type: 'junk_small_tall', name: 'Small Tall Junk', color: '#654321',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 5, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.66), radiusX: (w => w * 0.18), radiusY: ((w, h) => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'junk_vehicle_small', name: 'Small Vehicle Junk', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.4,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: ((w, h) => h * 0.35) },
            canBeFlipped: true,
        },
        {
            type: 'junk_vehicle_large', name: 'Large Vehicle Junk', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: ((w, h) => h * 0.3) },
            canBeFlipped: true,
        },
        {
            type: 'vehicle_heap_small', name: 'Small Vehicle Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: ((w, h) => h * 0.35) },
            canBeFlipped: true,
        },
        {
            type: 'vehicle_heap_large', name: 'Large Vehicle Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 8, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.35) },
            canBeFlipped: true,
        },
        {
            type: 'trash_heap_small', name: 'Small Trash Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: true,
            canBeFlipped: true,
            spriteScale: 0.5,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: ((w, h) => h * 0.35) },
        },
        {
            type: 'trash_heap_large', name: 'Large Trash Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            canBeFlipped: true,
            spawnWeight: 6, isDecoration: true,
            spriteScale: 0.5,
            decorationBuffer: 75,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.45), radiusY: ((w, h) => h * 0.35) },
        },
        {
            type: 'trashbag_heap_small', name: 'Small Trashbag Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            canBeFlipped: true,
            spawnWeight: 4, isDecoration: true,
            spriteScale: 0.5,
            decorationBuffer: 75,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.35) },
        },
        {
            type: 'trashbag_heap_medium1', name: 'Medium Trashbag Heap 1', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            canBeFlipped: true,
            spawnWeight: 6, isDecoration: true,
            spriteScale: 0.5,
            decorationBuffer: 75,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.35) },
        },
        {
            type: 'trashbag_heap_medium2', name: 'Medium Trashbag Heap 2', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            canBeFlipped: true,
            spawnWeight: 6, isDecoration: true,
            spriteScale: 0.6,
            decorationBuffer: 75,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.35) },
        },
        {
            type: 'trashbag_heap_large', name: 'Large Trashbag Heap', color: '#654321',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            canBeFlipped: true,
            spawnWeight: 6, isDecoration: true,
            spriteScale: 0.6,
            decorationBuffer: 75,
            collisionShape: { 
                type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.3), radiusX: (w => w * 0.4), radiusY: ((w, h) => h * 0.35) },
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
            type: 'general_possum_building_large', name: 'Large Possum Building', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            isDecoration: false,
            canBeFlipped: true,
            spawnWeight: 1, phaseUnlocked: 3,
            spawnLimit: 2,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.53), radiusX: (w => w * 0.37), radiusY: (h => h * 0.26) },
            placementBuffer: 380,
            decorationBuffer: 370,
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
            spawnWeight: 2, phaseUnlocked: 2,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.55), radiusX: (w => w * 0.35), radiusY: (h => h * 0.26) },
            placementBuffer: 150,
            decorationBuffer: 200,
        },
        {
            type: 'junkyard_building_medium', name: 'Medium Junkyard Building', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            isDecoration: false,
            canBeFlipped: false,
            spawnWeight: 2, phaseUnlocked: 1,
            spriteScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.45), radiusX: (w => w * 0.35), radiusY: (h => h * 0.18) },
            placementBuffer: 150,
            decorationBuffer: 200,
        },
        {
            type: 'junkyard_building_large', name: 'Large Junkyard Building', color: '#8B4513',
            destructible: false,
            blocksMovement: true, providesCover: true,
            isDecoration: false,
            canBeFlipped: false,
            spawnWeight: 2, phaseUnlocked: 1,
            spriteScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.55), radiusX: (w => w * 0.35), radiusY: (h => h * 0.26) },
            placementBuffer: 150,
            decorationBuffer: 200,
        },

    ],

    // =========================================================================
    // LEVEL GENERATION SETTINGS (biome-specific)
    // =========================================================================
    levelGenSettings: {
        WORLD_BASE_MUD_COLOR: '#5C4033',
        WORLD_BASE_DIRT_COLOR: '#6B4F34',
        WORLD_GRASS_TILE_SCALE: 1,
        WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.35,
        WORLD_GRASS_SKIP_CHANCE: 0.5,
        WORLD_GRASS_SKIP_MIN: 3,
        WORLD_GRASS_SKIP_MAX: 12,
        WORLD_GRASS_CLUMP_CHANCE: 0.4,
        WORLD_GRASS_CLUMP_MIN: 2,
        WORLD_GRASS_CLUMP_MAX: 5,
        WORLD_GRASS_CLUMP_RADIUS: 32,
        WORLD_MUD_TILE_SCALE: 1.0,
        WORLD_MUD_TILE_OVERLAP_FACTOR: 0.6,
        WORLD_MUD_RANDOM_ROTATION: false,
        WORLD_MUD_NOISE_SCALE_X: 0.012,
        WORLD_MUD_NOISE_SCALE_Y: 0.012,
        WORLD_MUD_NOISE_THRESHOLD: 0.3,
        WORLD_MUD_NOISE_OCTAVES: 3,
        WORLD_MUD_PATCH_SCALE_X: 0.002,
        WORLD_MUD_PATCH_SCALE_Y: 0.002,
        WORLD_MUD_BLEND_WIDTH: 0.65,
    },


    // =========================================================================
    // RESTRICTED OBSTACLE TYPES (shouldn't spawn near player spawn zone)
    // =========================================================================
    restrictedObstacleTypes: [
            'junk_small_round',
            'junk_small_tall',
            'junk_vehicle_small',
            'junk_vehicle_large',
            'vehicle_heap_small',
            'vehicle_heap_large',
            'trash_heap_small',
            'trash_heap_large',
            'trashbag_heap_small',
            'trashbag_heap_medium1',
            'trashbag_heap_medium2',
            'trashbag_heap_large',
            'empty_hut_round',
            'possum_barracks_1',
            'possum_hut',
            'possum_hut_round',
            'general_possum_building_large',
            'empty_possum_hut_2',
            'junkyard_building_medium',
            'junkyard_building_large',
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
    // SHOOTOUT BACKGROUNDS (biome-specific)
    // =========================================================================
    shootoutBackgrounds: {
        JUNKYARD_SHOOTOUT_1: {
                NAME: 'The Smell Of Blood',
                IMAGE: 'assets/images/shootouts/junkyard/Shootout_junkyard_1.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":444,"y":929,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":190,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":123,"y":740,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":160,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1184,"y":763,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":115,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1476,"y":908,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":110,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":613,"y":743,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":120,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":818,"y":719,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1075,"y":703,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1328,"y":554,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":65,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1754,"y":719,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":140,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":959,"y":1106,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":871,"y":651,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1461,"y":664,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}

                ]
        },
        JUNKYARD_SHOOTOUT_2: {
                NAME: 'Oil For Blood',
                IMAGE: 'assets/images/shootouts/junkyard/Shootout_junkyard_2.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":447,"y":930,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":190,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":172,"y":680,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":160,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1237,"y":824,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":115,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1476,"y":911,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":185,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":657,"y":751,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":120,"scale":0.6,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":791,"y":597,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":75,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1185,"y":673,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":135,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1328,"y":576,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":70,"scale":0.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1715,"y":751,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":140,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":959,"y":1106,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":863,"y":651,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1531,"y":647,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":125,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":619,"y":709,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":200,"scale":0.4,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":1205,"y":484,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":50,"scale":0.1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}},
                    {"x":677,"y":429,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":40,"scale":0.1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1,"showInDevMode":false}}}

                ]
        },

    },

    // =========================================================================
    // PRELOAD SPRITE SETS (for game.js asset loading)
    // =========================================================================
    preloadSpriteSets: [
        { name: 'junk_small_round', files: ['junk_small_1.png', 'junk_small_2.png', 'junk_small_3.png'], path: 'assets/images/objects/biomes/junkyard/junkSmall/', type: 'single' },
        { name: 'junk_small_tall', files: ['junk_small_tall_1.png', 'junk_small_tall_2.png', 'junk_small_tall_3.png'], path: 'assets/images/objects/biomes/junkyard/junkSmall/', type: 'single' },
        
        { name: 'junk_vehicle_small', files: ['vehicle_junk_patch_small_1.png', 'vehicle_junk_patch_small_2.png', 'vehicle_junk_patch_small_3.png', 'vehicle_junk_patch_small_4.png'], path: 'assets/images/objects/biomes/junkyard/vehicles/', type: 'single' },
        { name: 'junk_vehicle_large', files: ['vehicle_junk_patch_large_1.png', 'vehicle_junk_patch_large_2.png', 'vehicle_junk_patch_large_3.png', 'vehicle_junk_patch_large_4.png'], path: 'assets/images/objects/biomes/junkyard/vehicles/', type: 'single' },
        
        { name: 'vehicle_heap_small', files: [], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        { name: 'vehicle_heap_large', files: ['vehicle_heap_large_1.png', 'vehicle_heap_large_2.png', 'vehicle_heap_large_3.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        
        { name: 'trash_heap_small', files: [], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        { name: 'trash_heap_large', files: ['trash_heap_large_1.png', 'trash_heap_large_2.png', 'trash_heap_large_3.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },

        { name: 'trashbag_heap_small', files: ['trashbag_heap_small_1.png', 'trashbag_heap_small_2.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        { name: 'trashbag_heap_medium1', files: ['trashbag_heap_medium1_1.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        { name: 'trashbag_heap_medium2', files: ['trashbag_heap_medium2_1.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },
        { name: 'trashbag_heap_large', files: ['trashbag_heap_large_1.png'], path: 'assets/images/objects/biomes/junkyard/heaps/', type: 'single' },

        { name: 'junkyard_building_medium', files: ['junkyard_empty_building_1.png', 'junkyard_empty_building_2.png', 'junkyard_empty_building_4.png'], path: 'assets/images/objects/biomes/junkyard/buildings/', type: 'single' },
        { name: 'junkyard_building_large', files: ['junkyard_empty_building_3.png',], path: 'assets/images/objects/biomes/junkyard/buildings/', type: 'single' },

        { name: 'mud', files: ['mud_junkyard_1.png', 'mud_junkyard_3.png', 'mud_junkyard_4.png', 'mud_junkyard_5.png', 'mud_junkyard_6.png', 'mud_junkyard_7.png', 'mud_junkyard_8.png'], path: 'assets/images/objects/biomes/junkyard/mud/', type: 'single' },
    ],


}