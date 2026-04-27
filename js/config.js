// js/config.js
const CONFIG = {

    // =============================================================================
    // CORE
    // =============================================================================
    BASE_WORLD_WIDTH: 1920,
    BASE_WORLD_HEIGHT: 1080,
    MIN_CANVAS_WIDTH: 1920,
    MIN_CANVAS_HEIGHT: 1080,
    MAX_DELTA_TIME_STEP: 0.1,
    CAMERA_LERP_SPEED: 0.08,
    CAMERA_ZOOM: 1.2,

    // =============================================================================
    // INPUT
    // =============================================================================
    INPUT_DRAG_THRESHOLD: 5,
    INPUT_TAP_THRESHOLD_MS: 30,

    // =============================================================================
    // VIDEO
    // =============================================================================
    MIN_LOADING_VIDEO_DURATION_MS: 5000,

    // =============================================================================
    // PATHFINDING_AI
    // =============================================================================
    GRID_CELL_SIZE: 4,
    DEBUG_PATHING_UNIT_ID: null,
    DEBUG_DRAW_NAV_GRID_BLOCKED: false,
    DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES: true,
    DEBUG_DRAW_UNIT_PATHING_BOUNDS: false,
    UNIT_PATHING_RADIUS_BUFFER: 15,
    MIN_SEPARATION_DISTANCE_FACTOR: 3.0, // Prevents unit clumping (1.0 = touch, >1.0 = spacing)
    UNIT_STUCK_FRAMES_THRESHOLD: 2,
    STUCK_FRAMES_THRESHOLD_PATHING: 2,
    REPATH_STUCK_COOLDOWN: 0.3,

    ENEMY_ALERT_PROPAGATION_RADIUS: 200,
    ENEMY_INVESTIGATE_ATTACK_CHANCE: 0.95,
    ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT: 0.10,

    UNIT_VISUALS: {
        STUCK_FRAMES_THRESHOLD: 2,
        UNIT_PHASING_DURATION: 2.75,
        UNIT_PHASING_OPACITY: 0.5,
        DRAW_GUN_AIM_INDICATOR: false,
        FACING_INDICATOR: { COLOR: 'black', LINE_WIDTH: 1 },
        KIA_STYLE: { PLAYER_FILL_COLOR: 'darkgrey', ENEMY_FILL_COLOR: '#555555', OPACITY: 1 },
        GRENADE_AIM_INDICATOR: { COLOR: 'orange', LINE_WIDTH: 2, RADIUS_OFFSET: 6 },
        UNIT_BOBBING_ENABLED: true,
        UNIT_BOBBING_AMPLITUDE: 1,
        UNIT_BOBBING_SPEED_FACTOR: 0.2
    },

    // =============================================================================
    // PLAYER_RACCOON
    // =============================================================================

    // Base Stats
    RACCOON_HP: 20,
    RACCOON_SPEED: 200,
    RACCOON_SIZE: 12,
    RACCOON_COLOR: '#808080',
    RACCOON_DETECTION_RANGE: 100,

    // Engagement
    RACCOON_MIN_ENGAGEMENT_DISTANCE: 100,
    RACCOON_PREFERRED_ENGAGEMENT_DISTANCE_MAX: 200,
    RACCOON_ENGAGE_RANGE_BUFFER: 20,

    // Grenades
    RACCOON_GRENADE_DAMAGE: 50,
    RACCOON_GRENADE_AOE_RADIUS: 75,
    RACCOON_GRENADE_FUSE_TIME: 2.5,
    RACCOON_GRENADE_THROW_RANGE_MAX: 290,
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0,
    RACCOON_GRENADE_PROJECTILE_SPEED: 120,
    RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR: 0.9,
    RACCOON_STARTING_GRENADES: 0,
    GRENADE_THROW_COOLDOWN_BASE: 3.0,
    GRENADE_THROW_COOLDOWN_RANDOM_ADD: 2.5,

    // Ammo/Reload
    RACCOON_STARTING_AMMO: 400,
    RACCOON_MAGAZINE_SIZE: 30,
    BASE_RELOAD_TIME: 3.0,
    RELOAD_TIME_REDUCTION_PER_RANK: 0.25,

    // Auto-target
    RACCOON_AUTO_TARGET_RANGE_FACTOR: 0.6,

    // Sprites
    RACCOON_SPRITE_PATH: 'assets/images/units/raccoon/recruit/',
    RACCOON_SPRITE_SCALE_FACTOR: 0.5,
    RACCOON_PRIVATE_SPRITE_PATH: 'assets/images/units/raccoon/private/',
    RACCOON_PRIVATE_SPRITE_SCALE_FACTOR: 0.55,
    RACCOON_CORPORAL_SPRITE_PATH: 'assets/images/units/raccoon/corporal/',
    RACCOON_CORPORAL_SPRITE_SCALE_FACTOR: 0.6,
    RACCOON_SERGEANT_SPRITE_PATH: 'assets/images/units/raccoon/sergeant/',
    RACCOON_SERGEANT_SPRITE_SCALE_FACTOR: 0.62,
    RACCOON_ELITE_SPRITE_PATH: 'assets/images/units/raccoon/elite/',
    RACCOON_ELITE_SPRITE_SCALE_FACTOR: 0.65,
    RACCOON_GHOST_SPRITE_PATH: 'assets/images/units/raccoon/ghost/',
    RACCOON_GHOST_SPRITE_SCALE_FACTOR: 0.7,
    RACCOON_MAVERICK_SPRITE_PATH: 'assets/images/units/raccoon/maverick/',
    RACCOON_MAVERICK_SPRITE_SCALE_FACTOR: 0.55,
    RACCOON_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/dead/',
    RACCOON_DEAD_SPRITE_FILES: ['raccoon_dead_1.png'],
    RACCOON_DEAD_SPRITE_SCALE: 0.06,
    RACCOON_HOSTAGE_SPRITE_SCALE_FACTOR: 1.3,

    
    // =============================================================================
    // XP_RANKS
    // =============================================================================
    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25,

    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {}, nightVisionRadius: 180, defaultWeapon: 'RACCOON_MACHINE_GUN' },
        { rankName: "Private", xpNeeded: 300, statBoosts: { maxHpBonus: 10, bulletLifetimeBonus: 0.2 }, nightVisionRadius: 200, defaultWeapon: 'RACCOON_PRIVATE_MG' },
        { rankName: "Corporal", xpNeeded: 600, statBoosts: { maxHpBonus: 20, accuracyBonus: 0.05, bulletLifetimeBonus: 0.4 }, nightVisionRadius: 220, defaultWeapon: 'RACCOON_CORPORAL_MG' },
        { rankName: "Sergeant", xpNeeded: 1200, statBoosts: { maxHpBonus: 30, accuracyBonus: 0.1, bulletLifetimeBonus: 0.6 }, nightVisionRadius: 250, defaultWeapon: 'RACCOON_SERGEANT_MG' },
        { rankName: "Elite", xpNeeded: 2400, statBoosts: { maxHpBonus: 50, accuracyBonus: 0.2, bulletLifetimeBonus: 1.0 }, nightVisionRadius: 290, defaultWeapon: 'RACCOON_ELITE_MG' },
        { rankName: "Ghost", xpNeeded: 4800, statBoosts: { maxHpBonus: 100, accuracyBonus: 0.4, bulletLifetimeBonus: 1.2 }, nightVisionRadius: 350, defaultWeapon: 'RACCOON_GHOST_MG' }
    ],
    MAX_RANK_NAME: "Ghost",

    GRENADE_BONUS_CORPORAL: 1,
    GRENADE_BONUS_SERGEANT: 2,
    GRENADE_BONUS_ELITE: 3,
    GRENADE_BONUS_GHOST: 4,


    // =============================================================================
    // ENEMY_UNITS
    // =============================================================================

    // --- Possum Grunt ---
    POSSUM_GRUNT_HP: 20,
    POSSUM_GRUNT_SPEED: 150,
    POSSUM_GRUNT_SIZE: 14,
    POSSUM_GRUNT_COLOR: '#A0522D',
    POSSUM_GRUNT_DEFAULT_WEAPON: 'POSSUM_RIFLE',
        POSSUM_GRUNT_SPRITE_PATH: 'assets/images/units/possum_grunt/',
    POSSUM_GRUNT_SPRITE_SCALE_FACTOR: 0.5,
    POSSUM_GRUNT_DEAD_SPRITE_PATH: 'assets/images/units/possum_grunt/dead/',
    POSSUM_GRUNT_DEAD_SPRITE_FILES: ['possum_grunt_dead_3.png', 'possum_grunt_dead_4.png'],
    POSSUM_GRUNT_DEAD_SPRITE_SCALE: 0.5,

    // --- Possum Heavy ---
    POSSUM_HEAVY_HP: 40,
    POSSUM_HEAVY_SPEED: 120,
    POSSUM_HEAVY_SIZE: 18,
    POSSUM_HEAVY_COLOR: '#6A4A3A',
    POSSUM_HEAVY_DEFAULT_WEAPON: 'POSSUM_HEAVY_WEAPON',
    POSSUM_HEAVY_SPRITE_PATH: 'assets/images/units/possum_heavy/',
    POSSUM_HEAVY_SPRITE_SCALE_FACTOR: 0.55,
    POSSUM_HEAVY_DEAD_SPRITE_PATH: 'assets/images/units/possum_heavy/dead/',
    POSSUM_HEAVY_DEAD_SPRITE_FILES: ['possum_heavy_dead_1.png'],
    POSSUM_HEAVY_DEAD_SPRITE_SCALE: 0.7,
    PROJECTILE_COLOR_POSSUM_HEAVY: '#ff47478e',
    
    // --- Possum Sniper ---
    POSSUM_SNIPER_HP: 25,
    POSSUM_SNIPER_SPEED: 100,
    POSSUM_SNIPER_SIZE: 14,
    POSSUM_SNIPER_COLOR: '#788270',
    POSSUM_SNIPER_DEFAULT_WEAPON: 'POSSUM_SNIPER_RIFLE',
    POSSUM_SNIPER_SPRITE_PATH: 'assets/images/units/possum_sniper/',
    POSSUM_SNIPER_SPRITE_SCALE_FACTOR: 0.6,
    POSSUM_SNIPER_DEAD_SPRITE_PATH: 'assets/images/units/possum_sniper/dead/',
    POSSUM_SNIPER_DEAD_SPRITE_FILES: ['possum_sniper_dead.png'],
    POSSUM_SNIPER_DEAD_SPRITE_SCALE: 0.5,
    PROJECTILE_COLOR_POSSUM_SNIPER: '#FF2400',

    // --- Possum Elite ---
    POSSUM_ELITE_HP: 80,
    POSSUM_ELITE_SPEED: 190,
    POSSUM_ELITE_SIZE: 15,
    POSSUM_ELITE_COLOR: '#8B4513',
    POSSUM_ELITE_DEFAULT_WEAPON: 'POSSUM_ELITE_WEAPON',
    POSSUM_ELITE_SPRITE_PATH: 'assets/images/units/possum_elite/',
    POSSUM_ELITE_SPRITE_SCALE_FACTOR: 0.5,
    POSSUM_ELITE_DEAD_SPRITE_PATH: 'assets/images/units/possum_elite/dead/',
    POSSUM_ELITE_DEAD_SPRITE_FILES: ['possum_elite_dead1.png', 'possum_elite_dead2.png'],
    POSSUM_ELITE_DEAD_SPRITE_SCALE: 0.275,
    PROJECTILE_COLOR_POSSUM_ELITE: '#FF4500',

    // --- Possum Boss 1 ---
    POSSUM_BOSS_1_HP: 250,
    POSSUM_BOSS_1_SPEED: 200,
    POSSUM_BOSS_1_SIZE: 20,
    POSSUM_BOSS_1_COLOR: '#703510',
    POSSUM_BOSS_1_DEFAULT_WEAPON: 'POSSUM_BOSS_1_WEAPON',
    POSSUM_BOSS_1_DEFAULT_SECONDARY_WEAPON: 'POSSUM_BOSS_1_SECONDARY',
    POSSUM_BOSS_1_GRENADE_AOE_RADIUS: 80,
    POSSUM_BOSS_1_SPRITE_PATH: 'assets/images/units/possum_boss_1/',
    POSSUM_BOSS_1_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_BOSS_1_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_1/dead/',
    POSSUM_BOSS_1_DEAD_SPRITE_FILES: ['possum_boss1_dead1.png', 'possum_boss1_dead2.png'],
    POSSUM_BOSS_1_DEAD_SPRITE_SCALE: 0.4,
    PROJECTILE_COLOR_POSSUM_BOSS_1: '#FF4500',
    XP_FOR_BOSS_KILL: 250,

    // --- Possum Revolver ---
    POSSUM_REVOLVER_HP: 150,
    POSSUM_REVOLVER_SPEED: 180,
    POSSUM_REVOLVER_SIZE: 18,
    POSSUM_REVOLVER_COLOR: '#D2691E',
    POSSUM_REVOLVER_DEFAULT_WEAPON: 'POSSUM_REVOLVER',
    POSSUM_REVOLVER_SPRITE_PATH: 'assets/images/units/possum_revolver/',
    POSSUM_REVOLVER_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_REVOLVER_DEAD_SPRITE_PATH: 'assets/images/units/possum_revolver/dead/',
    POSSUM_REVOLVER_DEAD_SPRITE_FILES: ['possum_revolver_dead.png'],
    POSSUM_REVOLVER_DEAD_SPRITE_SCALE: 0.09,
    PROJECTILE_COLOR_POSSUM_REVOLVER: '#FFD700',
    XP_FOR_REVOLVER_KILL: 150,

    // --- Shootout Target ---
    SHOOTOUT_GRUNT_DEFAULT_WEAPON: 'POSSUM_RIFLE',
    SHOOTOUT_HEAVY_DEFAULT_WEAPON: 'POSSUM_HEAVY_WEAPON',


    // =============================================================================
    // WEAPON_DEFINITIONS
    // =============================================================================

    WEAPON_DEFINITIONS: {
        // =====================
        // RACCOON DEFAULT WEAPONS (rank-based)
        // =====================
        RACCOON_MACHINE_GUN: {
            name: "MG-1",
            damage: 7,
            rof: 7,
            range: 500,
            projectileSpeed: 600,
            projectileColor: '#ffcc00',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.4,
            isDefaultWeapon: true,
            magazineSize: 30,
            maxAmmo: 210
        },
        RACCOON_PRIVATE_MG: {
            name: "MG-2",
            damage: 8,
            rof: 7,
            range: 500,
            projectileSpeed: 600,
            projectileColor: '#cc9900',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.45,
            isDefaultWeapon: true,
            magazineSize: 35,
            maxAmmo: 240
        },
        RACCOON_CORPORAL_MG: {
            name: "MG-3",
            damage: 8,
            rof: 8,
            range: 500,
            projectileSpeed: 600,
            projectileColor: '#bb8800',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            magazineSize: 40,
            maxAmmo: 280
        },
        RACCOON_SERGEANT_MG: {
            name: "MG-4",
            damage: 9,
            rof: 8,
            range: 500,
            projectileSpeed: 600,
            projectileColor: '#aa7700',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            magazineSize: 45,
            maxAmmo: 300
        },
        RACCOON_ELITE_MG: {
            name: "ALG-1",
            damage: 10,
            rof: 10,
            range: 600,
            projectileSpeed: 700,
            projectileColor: '#996600',
            accuracyStationary: 0.95,
            accuracyMoving: 0.8,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_blue_1.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            magazineSize: 55,
            maxAmmo: 400
        },
        RACCOON_GHOST_MG: {
            name: "ALG-2",
            damage: 12,
            rof: 11,
            range: 700,
            projectileSpeed: 600,
            projectileColor: '#66ffcc',
            accuracyStationary: 0.99,
            accuracyMoving: 0.9,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_blue_1.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            magazineSize: 100,
            maxAmmo: 500
        },
        RACCOON_MAVERICK_MG: {
            name: "Raccoon Maverick MG",
            damage: 7,
            rof: 7,
            range: 500,
            projectileSpeed: 600,
            projectileColor: '#ff6699',
            accuracyStationary: 0.90,
            accuracyMoving: 0.60,
            sfxFireKey: 'RACCOON_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 0.7,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            magazineSize: 30,
            maxAmmo: 120
        },

        // =====================
        // POSSUM WEAPONS (enemy-only)
        // =====================
        POSSUM_RIFLE: {
            name: "Possum Rifle",
            damage: 8,
            rof: 5,
            range: 400,
            projectileSpeed: 350,
            projectileColor: '#8B4513',
            accuracyStationary: 0.75,
            accuracyMoving: 0.45,
            sfxFireKey: 'POSSUM_RIFLE_FIRE',
            muzzleFlashScale: 0.9,
            bulletLifetime: 1.3,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.4,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_HEAVY_WEAPON: {
            name: "Possum Heavy MG",
            damage: 18,
            rof: 2,
            range: 500,
            projectileSpeed: 430,
            projectileColor: '#ff47478e',
            accuracyStationary: 0.85,
            accuracyMoving: 0.30,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 1.4,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_BOSS_1_WEAPON: {
            name: "Possum Boss 1 Grenade Launcher",
            damage: 55,
            rof: 0.25,
            range: 350,
            projectileSpeed: 450,
            projectileColor: '#FF4500',
            accuracyStationary: 1.0,
            accuracyMoving: 1.0,
            sfxFireKey: 'POSSUM_BOSS_1_WEAPON_FIRE',
            muzzleFlashScale: 1.8,
            bulletLifetime: 2.2,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            grenadeSpritePath: 'assets/images/projectiles/grenade_boss.png',
            grenadeSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_BOSS_1_SECONDARY: {
            name: "Possum Boss 1 Heavy Repeater",
            damage: 15,
            rof: 4,
            range: 320,
            projectileSpeed: 500,
            projectileColor: '#FF8C00',
            accuracyStationary: 0.80,
            accuracyMoving: 0.40,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.3,
            bulletLifetime: 2.2,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_boss.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_REVOLVER: {
            name: "Possum Revolver",
            damage: 12,
            rof: 8,
            range: 520,
            projectileSpeed: 480,
            projectileColor: '#FFD700',
            accuracyStationary: 0.85,
            accuracyMoving: 0.85,
            sfxFireKey: 'POSSUM_REVOLVER_FIRE',
            muzzleFlashScale: 1.1,
            bulletLifetime: 1.8,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_SNIPER_RIFLE: {
            name: "Possum Sniper Rifle",
            damage: 35,
            rof: 0.2,
            range: 600,
            projectileSpeed: 900,
            projectileColor: '#FF2400',
            accuracyStationary: 1.0,
            accuracyMoving: 1.0,
            sfxFireKey: 'SNIPER_RIFLE_FIRE',
            muzzleFlashScale: 1.2,
            bulletLifetime: 2.0,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_ELITE_WEAPON: {
            name: "Possum Elite Rifle",
            damage: 12,
            rof: 7,
            range: 550,
            projectileSpeed: 500,
            projectileColor: '#8B4513',
            accuracyStationary: 0.95,
            accuracyMoving: 0.90,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            muzzleFlashScale: 1.0,
            bulletLifetime: 1.2,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
        POSSUM_TURRET_WEAPON: {
            name: 'Possum Turret',
            damage: 20,
            rof: 2.5,
            range: 400,
            projectileSpeed: 500,
            projectileColor: '#ff6600',
            accuracyStationary: 0.85,
            bulletLifetime: 2.0,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: true,
            sfxFireKey: 'POSSUM_HEAVY_MG_FIRE',
            isDefaultWeapon: true,
            maxAmmo: Infinity,
            muzzleFlashScale: 0.5
        },

        // =====================
        // ADVANCED WEAPONS (for weapon crates)
        // =====================
        PLASMA_RIFLE: {
            name: "Plasma Rifle",
            damage: 15,
            rof: 10,
            range: 450,
            projectileSpeed: 700,
            projectileColor: '#00ffcc',
            accuracyStationary: 0.85,
            accuracyMoving: 0.65,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.2,
            bulletLifetime: 1.0,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 40,
            maxAmmo: 120,
            phaseUnlocked: 1,
            crateColor: '#00ffcc',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/pr-1.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/pr-1_empty.png'
        },
        G14: {
            name: "G-14",
            damage: 32,
            rof: 1.5,
            range: 300,
            projectileSpeed: 500,
            projectileColor: '#ffaa00',
            accuracyStationary: 0.4,
            accuracyMoving: 0.2,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 0.8,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 8,
            maxAmmo: 32,
            phaseUnlocked: 8,
            pelletCount: 2,
            crateColor: '#ffaa00',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/g14.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/g14_empty.png'
        },
        X1: {
            name: "X-1",
            damage: 75,
            rof: 1.5,
            range: 800,
            projectileSpeed: 1500,
            projectileColor: '#ff00ff',
            accuracyStationary: 0.95,
            accuracyMoving: 0.70,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 2.0,
            bulletLifetime: 1.5,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 8,
            maxAmmo: 15,
            phaseUnlocked: 3,
            crateColor: '#ff00ff',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/x1.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/x1_empty.png'
        },
        PW001: {
            name: "PW-001",
            damage: 8,
            rof: 20,
            range: 150,
            projectileSpeed: 300,
            projectileColor: '#ff4400',
            accuracyStationary: 0.6,
            accuracyMoving: 0.4,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 2.0,
            bulletLifetime: 0.5,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 60,
            maxAmmo: 180,
            phaseUnlocked: 4,
            crateColor: '#ff4400',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/pw001.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/pw001_empty.png'
        },
        MOSIN_SNIPER: {
            name: "Mosin Sniper",
            damage: 80,
            rof: 0.5,
            range: 600,
            projectileSpeed: 850,
            projectileColor: '#ff6600',
            accuracyStationary: 0.9,
            accuracyMoving: 0.5,
            sfxFireKey: 'LASER_WEAPON_FIRE',
            muzzleFlashScale: 2.5,
            bulletLifetime: 3.0,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_1.png',
            bulletSpriteScale: 0.5,
            isDefaultWeapon: false,
            magazineSize: 4,
            maxAmmo: 12,
            phaseUnlocked: 5,
            crateColor: '#ff6600',
            crateSpriteWithWeapon: 'assets/images/objects/pickups/weapons/mosin.png',
            crateSpriteWithoutWeapon: 'assets/images/objects/pickups/weapons/mosin_empty.png'
        }
    },

    // =====================
    // STATIONARY TURRETS
    // =====================
    POSSUM_TURRET: {
        spriteScale: 0.3,
        muzzleOffset: 20
    },

    // =============================================================================
    // AI_BEHAVIOR
    // =============================================================================
    AI: {
        POSSUM_GRUNT: {
            DETECTION_RANGE: 150,
            PATROL_MIN_RADIUS: 80,
            PATROL_MAX_RADIUS: 200,
            PATROL_POINT_WORLD_MARGIN_BUFFER: 20,
            PATROL_WAIT_BASE: 1.5,
            PATROL_WAIT_RANDOM_ADD: 2.0,
            CHASE_PREDICTION_TIME_FACTOR: 0.25,
            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 8,
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
        },
        POSSUM_SNIPER: {
            DETECTION_RANGE: 550,
            SETUP_TIME_SECONDS: 2.5,
            FIRE_COOLDOWN_SECONDS: 5.0,
            REPOSITION_CHANCE_AFTER_SHOT: 0.6,
            REPOSITION_MAX_DISTANCE: 300,
            REPOSITION_MIN_DISTANCE: 100
        },
        POSSUM_ELITE: {
            DETECTION_RANGE: 320,
            PATROL_MIN_RADIUS: 100,
            PATROL_MAX_RADIUS: 250,
            PATROL_WAIT_BASE: 1.0,
            PATROL_WAIT_RANDOM_ADD: 1.5,
            CHASE_PREDICTION_TIME_FACTOR: 0.30,
            ENGAGE_RANGE_BUFFER: 25,
            MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
        },
        POSSUM_BOSS_1: {
            ARENA_RADIUS: 250,
            DETECTION_RANGE: 550,
            PREFERRED_GRENADE_RANGE_MAX: 450,
            MIN_ENGAGEMENT_DISTANCE: 120,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1500,

            GRENADE_COOLDOWN_BETWEEN_SHOTS: 0.6,
            GRENADES_PER_VOLLEY: 4,
            GRENADE_TARGET_SPREAD_RADIUS: 180,

            MG_BURST_SIZE: 10,
            MG_COOLDOWN_AFTER_BURST: 2.5,

            DEATH_EXPLOSION_RADIUS: 200,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            REPOSITION_DURATION_MAX_SECONDS: 2.0,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4],
                countPerPhaseBonus: 0,
                spawnRadius: 100,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_sniper', weight: 1 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
        POSSUM_REVOLVER: {
            DETECTION_RANGE: 280,
            RELOAD_TIME_SECONDS: 2.0,
            BURST_SIZE: 8,
            STRAFE_DISTANCE: 75,
            STRAFE_CHANCE: 0.5,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 600,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 3],
                countPerPhaseBonus: 0.4,
                spawnRadius: 120,
                unitPool: [
                    { type: 'possum_grunt', weight: 3 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
        
    },

    // =============================================================================
    // PROJECTILES_WEAPONS
    // =============================================================================
    PROJECTILE_SIZE: 3,
    PROJECTILE_COLOR_RACCOON: '#ff91008f',
    PROJECTILE_COLOR_RACCOON_PRIVATE: '#fbff008f',
    PROJECTILE_COLOR_RACCOON_CORPORAL: '#00ff228e',
    PROJECTILE_COLOR_RACCOON_SERGEANT: '#00ff957c',
    PROJECTILE_COLOR_RACCOON_ELITE: '#00eeff9a',
    PROJECTILE_COLOR_RACCOON_GHOST: '#000000',
    PROJECTILE_COLOR_RACCOON_MAVERICK: '#8c00ff98',
    PROJECTILE_COLOR_POSSUM: '#ff3c008e',
    GRENADE_PROJECTILE_COLOR: '#228B22',
    PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER: 0,

    WEAPON_SETTINGS: {
        ROF_JITTER_PERCENTAGE: 0.20
    },

    PROJECTILES: {
        BULLET: {
            LIFETIME: 0.7,
            MAX_SPREAD_ANGLE_RADIANS: Math.PI / 6,
            DESPAWN_WORLD_BUFFER: 100,
            SPRITE_PATH: 'assets/images/projectiles/bullet_gold_1.png',
            SPRITE_SCALE: 0.5
        },
        GRENADE: {
            SPRITE_PATH: 'assets/images/projectiles/grenade.png',
            SPRITE_SCALE: 0.3,
            SIZE: 8,
            MIN_FLIGHT_TIME: 0.05,
            ARC_PEAK_HEIGHT_MIN: 20,
            ARC_PEAK_HEIGHT_DISTANCE_FACTOR: 0.2,
            MAX_LIFETIME_BUFFER: 1.0,
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

    // =============================================================================
    // ROSTER_CAMPAIGN
    // =============================================================================
    INITIAL_ROSTER_SIZE: 5,
    NEW_RECRUITS_PER_MISSION_WIN: 1,
    MAX_SQUAD_SIZE_MVP: 4,
    MAX_TOTAL_ROSTER_SIZE: 100,

    FORMATION_INDEX: 3,
    INITIAL_FORMATION_SPACING: 3.0,

    // =============================================================================
    // WORLD_TERRAIN
    // =============================================================================
    WORLD_BASE_MUD_COLOR: '#483524',
    WORLD_BASE_DIRT_COLOR: '#5C4033',
    WORLD_GRASS_TILE_SIZE: 54,
    WORLD_GRASS_TILE_OVERLAP_FACTOR: 0.6,
    WORLD_GRASS_SKIP_CHANCE: 0.5,
    WORLD_GRASS_SKIP_MIN: 3,
    WORLD_GRASS_SKIP_MAX: 12,

    MUD_SPRITE_PATH: 'assets/images/objects/biomes/tropical/mud/',
    MUD_SPRITE_FILES: ['mud_grassy_5.png', 'mud_grassy_6.png', 'mud_grassy_7.png', 'mud_grassy_8.png', 'mud_grassy_9.png', 'mud_grassy_10.png', 'mud_grassy_11.png'],

    
    FENCE_BARBED_SPRITE_PATH: 'assets/images/objects/fences/barbed/',
    FENCE_BARBED_SHORT_SPRITE_FILES: [
        'fence_barbed_straight_short_1.png', 'fence_barbed_straight_short_2.png', 'fence_barbed_straight_short_3.png', 'fence_barbed_straight_short_4.png', 'fence_barbed_straight_short_5.png', 'fence_barbed_straight_short_6.png'
    ],
    FENCE_BARBED_LONG_SPRITE_FILES: ['fence_barbed_straight_long_1.png', 'fence_barbed_straight_long_2.png', 'fence_barbed_straight_long_3.png', 'fence_barbed_straight_long_4.png', 'fence_barbed_straight_long_5.png', 'fence_barbed_straight_long_6.png'],

    WORLD_MUD_NOISE_SCALE_X: 0.015,
    WORLD_MUD_NOISE_SCALE_Y: 0.01,
    WORLD_MUD_NOISE_THRESHOLD: 0.3,
    WORLD_MUD_NOISE_OCTAVES: 3,

    GRASS_SPRITE_PATH: 'assets/images/objects/biomes/tropical/grass2/',
    GRASS_SPRITE_FILES: [
        'grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png',
        'grass6.png', 'grass7.png', 'grass8.png', 'grass9.png', 'grass10.png'
    ],

    // =============================================================================
    // BIOME_TROPICAL
    // =============================================================================

    // Walls
    TROPICAL_WALL_ANGLED_LONG_PATH: 'assets/images/objects/biomes/tropical/walls/',
    TROPICAL_WALL_ANGLED_LONG_FILES: ['tropical_wall_angled_long_1.png', 'tropical_wall_angled_long_2.png', 'tropical_wall_angled_long_3.png', ],
    
    TROPICAL_BUSH_LARGE_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    TROPICAL_BUSH_LARGE_FILES: [
        'fern_large_1.png', 'fern_large_2.png', 'fern_large_3.png', 'fern_large_4.png', 'fern_large_5.png',
        'plant_red_large_1.png', 'plant_red_large_2.png', 'plant_red_large_3.png'
    ],

    PALM_BUSH_SMALL_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    PALM_BUSH_SMALL_FILES: ['palm_bush_small_1.png', 'palm_bush_small_2.png', 'palm_bush_small_3.png', 'palm_bush_small_4.png'],

    PALM_BUSH_LARGE_PATH: 'assets/images/objects/biomes/tropical/bushes/',
    PALM_BUSH_LARGE_FILES: ['palm_bush_large_1.png', 'palm_bush_large_2.png'],

    ROCK_SPRITES_TRIPICAL_MEDIUM_PATH: 'assets/images/objects/rocks/grassy/medium/',
    ROCK_SPRITES_TRIPICAL_MEDIUM_FILES: ['rock_medium_tropical_1.png', 'rock_medium_tropical_2.png', 'rock_medium_tropical_3.png', 'rock_medium_tropical_4.png', 'rock_medium_tropical_5.png', 'rock_medium_tropical_6.png'],

    ROCK_SPRITES_64PX_PATH: 'assets/images/objects/rocks/grassy/large/',
    ROCK_SPRITES_64PX_FILES: ['rock_large_tropical_1.png', 'rock_large_tropical_2.png', 'rock_large_tropical_3.png', 'rock_large_tropical_4.png', 'rock_large_tropical_5.png', 'rock_large_tropical_6.png'],

    PALM_TREE_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_SINGLE_SPRITE_FILES: ['palm1_single_1.png', 'palm1_single_2.png', 'palm1_single_3.png'],

    PALM_TREE_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_DOUBLE_SPRITE_FILES: ['palm1_double.png'],

    PALM_TREE_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/fullSize/',
    PALM_TREE_TRIPLE_SPRITE_FILES: ['palm1_triple.png'],

    PALM_TREE2_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_SINGLE_SPRITE_FILES: ['palm2_single_1.png', 'palm2_single_2.png', 'palm2_single_3.png'],

    PALM_TREE2_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_DOUBLE_SPRITE_FILES: ['palm2_double_1.png', 'palm2_double_2.png', 'palm2_double_3.png'],

    PALM_TREE2_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    PALM_TREE2_TRIPLE_SPRITE_FILES: ['palm2_triple_1.png'],

    PALM_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    PALM_TREE_FALLEN_SPRITE_FILES: ['palm_fallen_log_1.png'],

    PALM2_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    PALM2_TREE_FALLEN_SPRITE_FILES: ['palm_fallen_log_2.png'],

    FAN_TREE_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    FAN_TREE_SINGLE_SPRITE_FILES: ['tropical_fan_single_1.png', 'tropical_fan_single_2.png', 'tropical_fan_single_3.png'],

    FAN_TREE_DOUBLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    FAN_TREE_DOUBLE_SPRITE_FILES: ['tropical_fan_double_1.png', 'tropical_fan_double_2.png', 'tropical_fan_double_3.png'],

    FAN_TREE_TRIPLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    FAN_TREE_TRIPLE_SPRITE_FILES: ['tropical_fan_triple_1.png'],

    RUBBER_TREE_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/rubber/',
    RUBBER_TREE_SINGLE_SPRITE_FILES: ['tree_rubber_single_2.png', 'tree_rubber_single_3.png'],

    DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES: ['tree2_single_tall.png'],

    TREE4_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    TREE4_SINGLE_SPRITE_FILES: ['tree4_single_large_1.png', 'tree4_single_large_2.png', 'tree4_single_large_3.png'],

    TREE5_SINGLE_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
    TREE5_SINGLE_SPRITE_FILES: ['tree5_single_1.png', 'tree5_single_2.png', 'tree5_single_3.png'],

    DECIDUOUS_TREE_FALLEN_SPRITE_PATH: 'assets/images/objects/biomes/tropical/logs/',
    DECIDUOUS_TREE_FALLEN_SPRITE_FILES: ['tree_fallen_log_1.png'],

    RAINFOREST_SMALL_PATCH_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/forests/',
    RAINFOREST_SMALL_PATCH_SPRITE_FILES: ['rainforest_small_1.png'],

    RAINFOREST_LARGE_PATCH_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/forests/',
    RAINFOREST_LARGE_PATCH_SPRITE_FILES: ['rainforest_large_1.png', 'rainforest_large_3.png', 'rainforest_large_4.png', 'rainforest_large_5.png', ],

    // =============================================================================
    // OBSTACLES
    // =============================================================================
    POSSUM_BARRACKS_1_SPRITE_PATH: 'assets/images/objects/possums/barracks/',
    POSSUM_BARRACKS_1_SPRITE_FILES: [
        { normal: 'possum_barracks_1.png', destroyed: 'possum_barracks_1_destroyed.png' },
        { normal: 'possum_barracks_2.png', destroyed: 'possum_barracks_2_destroyed.png' },
    ],
    
    POSSUM_HUT_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_SPRITE_FILES: [
        { normal: 'possum_hut_1.png', destroyed: 'possum_hut_1_destroyed.png' },
    ],

    POSSUM_HUT_ROUND_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    POSSUM_HUT_ROUND_SPRITE_FILES: [
        { normal: 'possum_hut_4.png', destroyed: 'possum_hut_4_destroyed.png' },
        { normal: 'possum_hut_5.png', destroyed: 'possum_hut_5_destroyed.png' }
    ],

    POSSUM_BUILDING_LARGE_SPRITE_PATH: 'assets/images/objects/possums/general/',
    POSSUM_BUILDING_LARGE_SPRITE_FILES: [
        { normal: 'possum_building_large_1.png', destroyed: 'possum_building_large_1.png' }
    ],

    EMPTY_POSSUM_HUT_ROUND_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    EMPTY_POSSUM_HUT_ROUND_SPRITE_FILES: [
        { normal: 'possum_hut_6.png', destroyed: 'possum_hut_4_destroyed.png' }
    ],
    EMPTY_POSSUM_HUT_2_SPRITE_PATH: 'assets/images/objects/possums/huts/',
    EMPTY_POSSUM_HUT_2_SPRITE_FILES: [
        { normal: 'possum_hut_round_1_jungle.png', destroyed: 'possum_hut_2_destroyed.png' },
        { normal: 'possum_hut_square_1_jungle.png', destroyed: 'possum_hut_2_destroyed.png' }
    ],

    POSSUM_RELAY_TOWER_SPRITE_PATH: 'assets/images/objects/possums/towers/',
    POSSUM_RELAY_TOWER_SPRITE_FILES: [
        { normal: 'possum_tower_2.png', destroyed: 'possum_tower_2_destroyed.png' },
        { normal: 'possum_tower_3.png', destroyed: 'possum_tower_3_destroyed.png' }
    ],

    // Helipads
    HELIPAD_SQUARE_SPRITE_PATH: 'assets/images/objects/helipad/',
    HELIPAD_SQUARE_SPRITE_FILES: ['concrete_helipad_square_1.png'],
    
    // Ruins
    TROPICAL_RUINS_SPRITE_PATH: 'assets/images/objects/BIOMES/tropical/ruins/',
    TROPICAL_RUINS_SPRITE_FILES: ['ruins_arch.png'],


    // Barrels
    SINGLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    SINGLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_1.png', destroyed: 'barrel_red_1_destroyed.png'}],

    DOUBLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    DOUBLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_2.png', destroyed: 'barrel_red_2_destroyed.png'}],

    TRIPLE_EXPLOSIVE_BARREL_SPRITE_PATH: 'assets/images/objects/barrels/',
    TRIPLE_EXPLOSIVE_BARREL_SPRITE_FILES: [ {normal: 'barrel_red_3.png', destroyed: 'barrel_red_3_destroyed.png'}],

    // Pickups
    AMMO_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/ammo/',
    AMMO_PICKUP_SPRITE_FILES: [
        { normal: 'ammo_pickup_crate.png', destroyed: 'ammo_pickup_crate_empty.png' }
    ],

    HEALTH_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/health/',
    HEALTH_PICKUP_SPRITE_FILES: [
        { normal: 'health_pickup_crate.png', destroyed: 'health_pickup_crate_empty.png' }
    ],

    GRENADE_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/grenade/',
    GRENADE_PICKUP_SPRITE_FILES: [
        { normal: 'grenade_pickup_crate.png', destroyed: 'grenade_pickup_crate_empty.png' }
    ],


    INTEL: {
        INTERACTION_RADIUS: 100,
        SPAWN_DISTANCE: 530,
        SPRITE_PATH: 'assets/images/objects/possums/intel/',
        SPRITE_FILES: [
            { on: 'intel_console_1_on.png', off: 'intel_console_1_off.png' },
            { on: 'intel_console_2_on.png', off: 'intel_console_2_off.png' },
            { on: 'intel_console_3_on.png', off: 'intel_console_3_off.png' },
        ],
        SPRITE_SCALE: 0.25,
    },

    OBSTACLE_DEFINITIONS: [
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
            type: 'fence_barbed_straight_short', name: 'Barbed Wire Fence Straight Short',
            color: '#a7a7a7', destructible: true, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 2, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.3), width: (w => w * 0.97), height: (h => h * 0.1) },
            canBeFlipped: true,
            placementBuffer: 60,
        },
        {
            type: 'fence_barbed_straight_long', name: 'Barbed Wire Fence Straight Long',
            color: '#8B4513', destructible: false, hp: 50, maxHp: 50,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.014), offsetY: (h => h * 0.08), width: (w => w * 0.98), height: (h => h * 0.03) },
            canBeFlipped: true
        },
        {
            type: 'rock_medium', name: 'Medium Grassy Rock', color: '#696969',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 1,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 0.64), radiusX: (w => w * 0.41), radiusY: (h => h * 0.2) },
            canBeFlipped: true,
        },
        {
            type: 'rock_large', name: 'Large Grassy Rock', color: '#A9A9A9',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, isDecoration: false,
            spriteScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.58), radiusX: (w => w * 0.41), radiusY: (h => h * 0.27) },
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
            type: 'palm_bush_small', name: 'Small Palm Bush', color: '#228B22',
            destructible: true, hp: 30, maxHp: 30,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        {
            type: 'palm_bush_large', name: 'Large Palm Bush', color: '#228B22',
            destructible: true, hp: 50, maxHp: 50,
            blocksMovement: false, providesCover: false,
            spawnWeight: 4, isDecoration: false,
            spriteScale: 0.6,
            canBeFlipped: true,
        },
        
        {
            type: 'tree_palm_single', name: 'Palm Tree Single', color: '#005522',
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
            type: 'tree_palm_double', name: 'Palm Tree Double', color: '#005522',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1, isDecoration: false,
            spriteScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.35), offsetY: (h => h * 1.25), radiusX: (w => w * 0.17), radiusY: (h => h * 0.09) },
            spriteDestroyed: 'assets/images/objects/biomes/tropical/trees/palm1_single_stump_2.png',
            spriteDestroyedScale: 0.5,
            canBeFlipped: true,
        },
        {
            type: 'tree_palm_triple', name: 'Palm Tree Triple', color: '#005522',
            destructible: true, hp: 200, maxHp: 200,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: false,
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
            spawnWeight: 6, isDecoration: false,
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
            spawnWeight: 5, isDecoration: false,
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
            spawnWeight: 2, isDecoration: false,
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
            spawnWeight: 5, isDecoration: false,
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
            spawnWeight: 8,
            spriteScale: 0.60,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.38), radiusX: (w => w * 0.36), radiusY: (h => h * 0.17) },
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
            spawnWeight: 10,
            spriteScale: 0.5,
            spriteDestroyed: null,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.35), radiusX: (w => w * 0.46), radiusY: (h => h * 0.19) },
            placementBuffer: 150,
            canBeFlipped: true,
            isDecoration: true
        },
        {
            type: 'explosive_barrel', name: 'Explosive Barrel', color: '#A00000',
            destructible: true, hp: 10, maxHp: 10,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            explosionDamage: 50, explosionAoeRadius: 80,
            spriteScale: 0.13,
            spriteDestroyedScale: 0.13,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.3), offsetY: (h => h * 0.066), width: (w => w * 0.5), height: (h => h * 0.86) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_DESTROYED',
            canBeFlipped: false,
        },
        {
            type: 'explosive_barrel_double', name: 'Double Explosive Barrel', color: '#A00000',
            destructible: true, hp: 15, maxHp: 15,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            explosionDamage: 75, explosionAoeRadius: 120,
            spriteScale: 0.1,
            spriteDestroyedScale: 0.1,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.2), offsetY: (h => h * 0.066), width: (w => w * 0.66), height: (h => h * 0.65) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_DESTROYED',
            canBeFlipped: false,
        },
        {
            type: 'explosive_barrel_cluster', name: 'Cluster Explosive Barrel', color: '#A00000',
            destructible: true, hp: 20, maxHp: 20,
            blocksMovement: true, providesCover: true,
            spawnWeight: 1,
            explosionDamage: 100, explosionAoeRadius: 160,
            spriteScale: 0.1,
            spriteDestroyedScale: 0.1,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.03), offsetY: (h => h * 0.05), width: (w => w * 0.7), height: (h => h * 0.7) },
            sfxOnDestroy: 'EXPLOSIVE_BARREL_CLUSTER_DESTROYED',
            canBeFlipped: false,
        },

        {
            type: 'possum_barracks_1', name: 'Possum Barracks', color: '#62a170',
            destructible: true, hp: 120, maxHp: 120,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, phaseUnlocked: 2,
            spriteScale: 0.7,
            spriteDestroyedScale: 0.7,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.5), radiusX: (w => w * 0.35), radiusY: (h => h * 0.26) },
            spawnArea: { type: 'rectangle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.85), width: (w => w * 0.3), height: (h => h * 0.15) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 80,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 70,
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
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.5), radiusX: (w => w * 0.3), radiusY: (h => h * 0.25) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 50,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 80,
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
            collisionShape: { type: 'circle', offsetX: (w => w * 0.48), offsetY: (h => h * 0.42), radius: (w => w * 0.33) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 150,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 80,
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
            spawnWeight: 2, phaseUnlocked: 2,
            spriteScale: 0.5,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: (h => h * 0.23) },
            isDecoration: false,
            canBeFlipped: true,
            placementBuffer: 150,
            initialGuardPack: {
                enabled: true,
                countRange: [2, 4],
                countPerPhaseBonus: 0.3,
                spawnRadius: 80,
                unitPool: [
                    { type: 'possum_grunt', weight: 10 },
                    { type: 'possum_heavy', weight: 5 },
                    { type: 'possum_sniper', weight: 0.4 },
                    { type: 'possum_elite', weight: 0.2 }
                ]
            }
        },
        {
            type: 'empty_possum_hut_round', name: 'Empty Round Possum Hut', color: '#8B4513',
            destructible: true, hp: 300, maxHp: 300,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, phaseUnlocked: 1,
            spriteScale: 0.6,
            spriteDestroyedScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.48), offsetY: (h => h * 0.35), radiusX: (w => w * 0.35), radiusY: (h => h * 0.23) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 150,
        },
        {
            type: 'empty_possum_hut_2', name: 'Empty Possum Hut', color: '#8B4513',
            destructible: true, hp: 400, maxHp: 400,
            blocksMovement: true, providesCover: true,
            spawnWeight: 3, phaseUnlocked: 2,
            spriteScale: 0.6,
            spriteDestroyedScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.49), offsetY: (h => h * 0.5), radiusX: (w => w * 0.35), radiusY: (h => h * 0.3) },
            isDecoration: false,
            sfxOnDestroy: 'POSSUM_HUT_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 150,
        },


        {
            type: 'possum_relay_tower', name: 'Possum Relay Tower', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            bulletDamageMultiplier: 0.5,
            blocksMovement: true, providesCover: true,
            phaseUnlocked: 3,
            spawnWeight: 0.01,
            spriteScale: 0.6,
            spriteDestroyedScale: 0.6,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.45), offsetY: (h => h * 1.15), radiusX: (w => w * 0.40), radiusY: (h => h * 0.33) },
            isDecoration: false,
            sfxOnDestroy: 'STRUCTURE_METAL_DESTROYED',
            canBeFlipped: true,
            placementBuffer: 150,
            initialGuardPack: {
                enabled: true,
                countRange: [1, 4],
                countPerPhaseBonus: 0.1,
                spawnRadius: 100,
                unitPool: [
                    { type: 'possum_grunt', weight: 5 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_boss_1', weight: 0.1 },
                    { type: 'possum_sniper', weight: 2 },
                    { type: 'possum_elite', weight: 1 }
                ]
            }
        },
        {
            type: 'intel_console', name: 'Intel Console', color: '#2e5986',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false, placementBuffer: 100,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.5), radiusX: (w => w * 0.3), radiusY: (h => h * 0.2) },
            isIntelConsole: true
        },
        {
            type: 'possum_turret', name: 'Possum Turret', color: '#8B4513',
            destructible: true, hp: 150, maxHp: 150,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, phaseUnlocked: 3, spawnLimit: 1,
            spriteScale: 0.3,
            collisionShape: { type: 'circle', offsetX: (w => w * 0.53), offsetY: (h => h * 0.5), radius: (w => w * 0.2) },
            isDecoration: false,
            sfxOnDestroy: 'STRUCTURE_METAL_DESTROYED',
            canBeFlipped: false,
            isPossumTurret: true
        },
        {
            type: 'extraction_zone', name: 'Extraction Zone', color: '#3cc1ff',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spriteNormal: null,
            spawnWeight: 0, isDecoration: true,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.1), width: (w => w * 0.8), height: (h => h * 0.8) },
        },
        {
            type: 'helipad_concrete_square_1', name: 'Square Concrete Helipad', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.5, isDecoration: false,
            spriteScale: 0.5,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.1), offsetY: (h => h * 0.1), width: (w => w * 0.8), height: (h => h * 0.8), rotation: Math.PI / 4 },
            placementBuffer: 100,
        },
        {
            type: 'tropical_ruins', name: 'Tropical Ruins', color: '#afafaf',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0.5, isDecoration: true,
            spriteScale: 0.5,
            placementBuffer: 80,
            collisionShape: { type: 'ellipse', offsetX: (w => w * 0.5), offsetY: (h => h * 0.7), radiusX: (w => w * 0.4), radiusY: (h => h * 0.2) },
        },
        {
            type: 'building_c_shape', name: 'C-Shaped Building', color: '#808080',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: (w => w * 0.8), offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
        {
            type: 'building_u_shape', name: 'U-Shaped Building', color: '#707070',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.15), height: (h => h) },
                { type: 'rectangle', offsetX: (w => w * 0.85), offsetY: 0, width: (w => w * 0.15), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: (h => h * 0.8), width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
        {
            type: 'building_l_shape', name: 'L-Shaped Building', color: '#787878',
            destructible: false, hp: Infinity, maxHp: Infinity,
            blocksMovement: true, providesCover: true,
            spawnWeight: 0, isDecoration: false,
            spriteScale: 1,
            collisionShapes: [
                { type: 'rectangle', offsetX: 0, offsetY: 0, width: (w => w * 0.2), height: (h => h) },
                { type: 'rectangle', offsetX: 0, offsetY: (h => h * 0.8), width: (w => w), height: (h => h * 0.2) },
            ],
            canBeFlipped: true,
        },
    ],

    PICKUP_DEFINITIONS: [
        {
            type: 'pickup_grenade_crate', name: 'Grenade Crate', color: '#006400',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.5,
            pickupType: 'grenade', pickupQuantity: 2,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84), rotation: Math.PI / 8 },
            isPickup: true,
            canBeFlipped: true,
        },
        {
            type: 'pickup_ammo_crate', name: 'Ammo Crate', color: '#4169E1',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.5,
            pickupType: 'ammo', pickupQuantity: 120,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84), rotation: Math.PI / 8 },
            isPickup: true,
            canBeFlipped: true,
        },
        {
            type: 'pickup_health', name: 'Health Crate', color: '#FF69B4',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.9,
            pickupType: 'health', pickupQuantity: 30,
            spriteScale: 0.2,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.875), height: (h => h * 0.84), rotation: Math.PI / 8 },
            isPickup: true,
            canBeFlipped: true,
        },
        {
            type: 'pickup_weapon_crate', name: 'Weapon Crate', color: '#FFD700',
            destructible: true, hp: 1, maxHp: 1,
            blocksMovement: false, providesCover: false,
            spawnWeight: 0.1,
            pickupType: 'weapon', 
            baseCrateSprite: 'assets/images/objects/pickups/weapons/crate_base.png',
            spriteScale: 0.15,
            collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
            isPickup: true,
            canBeFlipped: true,
        },
        
    ],

    // =============================================================================
    // LEVEL_GENERATION
    // =============================================================================
    LEVEL_GENERATION: {
        WORLD_MARGIN: 5,
        BORDER_WIDTH: 1,
        BORDER_COLOR: '#25221D',
        BORDER_OBSTACLE_TYPE: 'fence_barbed_straight_long',
        PLAYER_SPAWN_ZONE: {
            MIN_WIDTH: 180,
            WIDTH_FACTOR: 0.40,
            MIN_HEIGHT: 180,
            HEIGHT_FACTOR: 0.2,
            INTERNAL_PADDING_FACTOR: 80.0,
            PLAYER_SPAWN_ZONE_RESTRICTED_OBSTACLE_TYPES: [
                'possum_hut',
                'possum_hut_round',
                'empty_possum_hut_round',
                'possum_relay_tower',
                'rock_large',
                'rock_medium',
                'fence_barbed_straight_short',
                'fence_barbed_straight_long',
                'tree5_deciduous_single',
                'tree4_deciduous_single',
                'tree_deciduous_single',
                'tree_palm_fallen',
                'tree_palm2_fallen',
                'tree_palm_triple',
                'tree_palm2_triple',
                'tree_palm_double',
                'tree_palm2_double',
                'tree_palm_single',
                'tree_palm2_single',
                'tree_fan_single',
                'tree_fan_double',
                'tree_fan_triple',
                'rainforest_patch_small_1',
                'tropical_forest_patch_small_1',
                'empty_possum_hut_2',
                'general_possum_building_large',
                'possum_turret'
            ]
        },
        OBSTACLES: {
            BASE_COUNT: 80,
            WORLD_SIZE_FALLBACK_FACTOR: 0.95,
            RANDOM_ADDITION_MAX: 10,
            PLACEMENT_MAX_ATTEMPTS: 2
        },
        PICKUPS: {
            BASE_COUNT: 3,
            PHASE_INCREMENT: 2,
            RANDOM_ADDITION_MAX: 3,
            PLACEMENT_MAX_ATTEMPTS: 2
        },
        PLAYER_SPAWN_PLACEMENT: {
            MAX_ATTEMPTS: 5,
            FALLBACK_SPACING_FACTOR: 10.0,
            PLAYER_SPAWN_AREA: 0.2
        },
        DECORATIONS: {
            GRASS_CLUTTER: {
                MIN_SCALE: 1.1,
                MAX_SCALE: 1.5
            },
            TREES: {
                MIN_SCALE: 0.8,
                MAX_SCALE: 1.
            },
            BUSHES: {
                MIN_SCALE: 0.8,
                MAX_SCALE: 1.
            },
            ROCKS: {
                MIN_SCALE: 0.7,
                MAX_SCALE: 1.
            }
        },
        EXTRACTION_ZONE_SETTINGS: {
            SPRITE_PATH: null,
            FALLBACK_COLOR: 'rgba(60, 120, 255, 0.35)',
            WIDTH: 260,
            HEIGHT: 260,
            NAME: "Extraction Zone",
            PLACEMENT_MARGIN_FROM_EDGE: 30,
            MIN_DISTANCE_FROM_PLAYER_SPAWN: 900,
            MAX_PLACEMENT_ATTEMPTS: 5,
            REVEAL_DURATION: 1.5,
            PARTICLE_COUNT: 20,
            SCAN_LINE_SPEED: 80,
            PRIMARY_COLOR: '#00FFD4',
            ACCENT_COLOR: '#FFFFFF',
            GLOW_COLOR: 'rgba(0, 255, 212, 0.15)',
            BRACKET_LENGTH: 20,
            BRACKET_THICKNESS: 3,
            PULSE_SPAWN_INTERVAL: 2.0,
            PULSE_LIFETIME: 2.5,
            LABEL_TEXT: 'EXTRACT',
        },
        TREE_FALL_SETTINGS: {
            ENABLED: true,
            FALL_CHANCE: 0.45,
            MAX_PLACEMENT_ATTEMPTS: 5,
            PLACEMENT_DISTANCE_MIN: 5,
            PLACEMENT_DISTANCE_MAX: 20
        },
    },

    // =============================================================================
    // ENEMY_SPAWNING
    // =============================================================================
    ENEMY_SPAWNING: {
        QUADRANT_SPAWNING_ENABLED: true,
        QUADRANT_COLS: 3,
        QUADRANT_ROWS: 3,
        QUADRANT_SCALING_ENABLED: true,
        QUADRANT_BASE_COLS: 3,
        QUADRANT_BASE_ROWS: 3,
        QUADRANT_SCALE_COLS_PER_WORLD_FACTOR: 1.0,
        QUADRANT_SCALE_ROWS_PER_WORLD_FACTOR: 1.0,
        QUADRANT_RANDOMNESS_FACTOR: 0.3,
        QUADRANT_MIN_COLS: 3,
        QUADRANT_MIN_ROWS: 3,
        QUADRANT_MAX_COLS: 7,
        QUADRANT_MAX_ROWS: 5,
        BASE_ENEMY_COUNT_PER_DENSITY_FACTOR: 20,
        RANDOM_ADDITION_FACTOR_MAX: 0.1,
        AVG_ENEMIES_PER_GROUP_ATTEMPT: 2.0,
        SMALL_GROUP_CHANCE: 0.6,
        SMALL_GROUP_SIZE_MIN: 2,
        SMALL_GROUP_SIZE_MAX: 5,
        MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE: 450,
        LEADER_PLACEMENT_MAX_ATTEMPTS: 5,
        MEMBER_PLACEMENT_MAX_ATTEMPTS: 5,
        GROUP_SPREAD_BASE: 30,
        GROUP_SPREAD_SIZE_MULTIPLIER: 1.5,
        DEFAULT_HEAVY_CHANCE: 0.20,
        HEAVY_CHANCE_GROUP_LEADER_BONUS: 0.1,

        POSSUM_HUT_SPAWNING: {
            MAX_ACTIVE_SPAWNING_HUTS_BASE: 1,
            MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS: 30,
            SPAWN_COOLDOWN_MAX_SECONDS: 120,
            UNITS_PER_SPAWN_MIN: 1,
            UNITS_PER_SPAWN_MAX: 3,
            TIME_BETWEEN_UNITS_IN_BURST_MIN: 0.3,
            TIME_BETWEEN_UNITS_IN_BURST_MAX: 1.9,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.1, // 10% increase per phase
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 0,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 1,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 300,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -65,
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -3,
            SPAWN_AREA_WIDTH: 40,
            SPAWN_PHASING_DURATION: 0.25,
            DEBUG_DRAW_SPAWN_AREAS: true,
            DEBUG_DRAW_HUT_STATUS_TEXT: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 5,
            MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT: 5,
            INITIAL_MOVE_OUT_DISTANCE: 35,
            INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE: 1.0,
            MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS: 1.0,
            UNITS_TO_SPAWN_ON_DAMAGE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE: 1.0,
            SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE: 3,
            MAX_UNITS_PER_HUT_BASE: 6,
            MAX_UNITS_PER_HUT_PHASE_INCREMENT: 2,
        },

        POSSUM_BARRACKS_SPAWNING: {
            MAX_ACTIVE_SPAWNING_BARRACKS_BASE: 1,
            MAX_ACTIVE_SPAWNING_BARRACKS_INCREMENT_PER_PHASE: 1,
            SPAWN_COOLDOWN_MIN_SECONDS: 30,
            SPAWN_COOLDOWN_MAX_SECONDS: 120,
            UNITS_PER_SPAWN_MIN: 2,
            UNITS_PER_SPAWN_MAX: 4,
            TIME_BETWEEN_UNITS_IN_BURST_MIN: 0.2,
            TIME_BETWEEN_UNITS_IN_BURST_MAX: 1.2,
            UNITS_PER_SPAWN_PHASE_INCREMENT: 0.15, // 15% increase per phase
            INITIAL_SPAWN_DELAY_SECONDS_MIN: 0,
            INITIAL_SPAWN_DELAY_SECONDS_MAX: 0.8,
            PLAYER_PROXIMITY_TRIGGER_RADIUS: 350,
            SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X: -80,
            SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y: -3,
            SPAWN_AREA_WIDTH: 50,
            SPAWN_PHASING_DURATION: 0.25,
            DEBUG_DRAW_SPAWN_AREAS: true,
            DEBUG_DRAW_HUT_STATUS_TEXT: false,
            MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN: 5,
            MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT: 5,
            INITIAL_MOVE_OUT_DISTANCE: 35,
            INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE: 0.8,
            MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS: 0.8,
            UNITS_TO_SPAWN_ON_DAMAGE: 2,
            SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE: 0.8,
            SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE: 2.5,
            MAX_UNITS_PER_BARRACKS_BASE: 10,
            MAX_UNITS_PER_BARRACKS_PHASE_INCREMENT: 3,
        }
    },

    // =============================================================================
    // HOSTAGES
    // =============================================================================
    HOSTAGE_SETTINGS: {
        HP: 35,
        SPEED: 110,
        COLOR: '#ADD8E6',
        NEUTRAL_COLOR: '#FFD700',
        RESCUE_RADIUS: 60,
        FOLLOW_DISTANCE: 80,
        FOLLOW_LERP_SPEED: 0.04,
        POSSIBLE_RANKS_ON_RESCUE: [
            { rankName: "Recruit", xpNeeded: 0, weight: 40 },
            { rankName: "Private", xpNeeded: 300, weight: 25 },
            { rankName: "Corporal", xpNeeded: 600, weight: 18 },
            { rankName: "Sergeant", xpNeeded: 1200, weight: 12 },
            { rankName: "Elite", xpNeeded: 2400, weight: 5 }
        ],
        MAX_HOSTAGES_PER_MISSION: 5,
        MIN_HOSTAGES_TO_RESCUE_FOR_WIN: 1,
        SPAWN_WITH_ENEMY_GROUPS: true,
        SPAWN_NEAR_CAPTORS_RADIUS: 60,
        MIN_CAPTORS_GROUP_SIZE: 3,
        HOSTAGE_PLACEMENT_ATTEMPTS_NEAR_GROUP: 30,
        SPAWN_AT_HUTS: true,
        MAX_HOSTAGES_PER_HUT: 2,
        SPAWN_OFFSET_FROM_HUT_X: -30,
        SPAWN_OFFSET_FROM_HUT_Y: (h_height => h_height * 0.5 + 30),
        MIN_HUT_DISTANCE_FROM_PLAYER_SPAWN_FOR_HOSTAGE: 500,
        HOSTAGE_PLACEMENT_ATTEMPTS_AT_HUT: 5,
        HOSTAGE_SPAWN_BUFFER: 20,
        HOSTAGE_DECORATION_SPAWN_BUFFER: 25,
        INITIAL_GUARD_COUNT_MIN_PER_HOSTAGE_HUT: 3,
        INITIAL_GUARD_COUNT_MAX_PER_HOSTAGE_HUT: 5,
        INITIAL_GUARD_HEAVY_CHANCE_HOSTAGE_HUT: 0.20,
        INITIAL_GUARD_SPAWN_RADIUS_AROUND_HUT: 60,
        INITIAL_GUARD_PLACEMENT_ATTEMPTS: 5
    },

    // =============================================================================
    // VISUAL_EFFECTS
    // =============================================================================
    VISUAL_EFFECTS: {
        PROMOTION: {
            LIFETIME: 1.5, TEXT: "PROMOTED!", FONT: "bold 16px 'Consolas', 'Lucida Console', monospace",
            COLOR_RGB_FADE_START: [255, 223, 0], VELOCITY_Y: -20
        },
        EXPLOSION: {
            LIFETIME: 1.8,
            GRENADE: {
                SPRITE_PATH: 'assets/images/effects/explosion_25.png',
                FRAME_WIDTH: 205,
                FRAME_HEIGHT: 205,
                NUM_FRAMES: 25,
                ANIMATION_SPEED: 0.15,
                SCALE: 0.8
            },
            BARREL: {
                SPRITE_PATH: 'assets/images/effects/explosion_16.png',
                FRAME_WIDTH: 256,
                FRAME_HEIGHT: 256,
                NUM_FRAMES: 16,
                ANIMATION_SPEED: 0.1,
                SCALE: 0.5
            }
        },
        HOSTAGE_HELP_TEXT: {
            TEXT_OPTIONS: ['Help!', 'Over here!', 'Psst!', 'Save me!'],
            LIFETIME_SECONDS: 2.0,
            INTERVAL_MIN_SECONDS: 4.0,
            INTERVAL_MAX_SECONDS: 9.0,
            FONT: 'bold 18px Lucida Console',
            COLOR: 'yellow',
            Y_OFFSET: -45,
            FADE_OUT_START_PERCENT: 0.8
        },
        LASER_SIGHT: {
            COLOR_START: 'rgba(255, 0, 0, 0.0)',
            COLOR_END: 'rgba(255, 0, 0, 0.7)',
            LINE_WIDTH: 2
        },
        PICKUP: {
            LIFETIME: 2.7,
            TEXT: "+{QTY}",
            FONT: "bold 18px 'Consolas', 'Lucida Console', monospace",
            VELOCITY_Y: -25,
            ICON_Y_OFFSET: -10,
            ICON_SIZE: 24
        }
    },

    AMBIENT_EFFECTS: {
        FLYING_BIRD: {
            TILE_SHEET_PATHS: [
                'assets/images/effects/flying_bird_sheet.png',
                'assets/images/effects/flying_parrot_blueGreen_sheet.png',
                'assets/images/effects/flying_parrot_rainbow_sheet.png',
            ],
            FRAME_WIDTH: 100,
            FRAME_HEIGHT: 100,
            NUM_FRAMES: 6,
            ANIMATION_SPEED: 0.1,
            FLIGHT_SPEED_MIN: 80,
            FLIGHT_SPEED_MAX: 90,
            MIN_Y_SPAWN_FACTOR: 0.1,
            MAX_Y_SPAWN_FACTOR: 0.6,
            FLOCK_SIZE_MIN: 1,
            FLOCK_SIZE_MAX: 6,
            FLOCK_SPACING_X: 50,
            FLOCK_SPACING_Y: 20,
            SPAWN_INTERVAL_MIN_SECONDS: 5,
            SPAWN_INTERVAL_MAX_SECONDS: 30,
            SCALE: 0.45,
        },
        UFO: {
            TILE_SHEET_PATH: 'assets/images/objects/ufo/ufo_1_tilesheet.png',
            FRAME_WIDTH: 512,
            FRAME_HEIGHT: 512,
            NUM_FRAMES: 4,
            ANIMATION_SPEED: 0.08,
            SPEED_MIN: 1000,
            SPEED_MAX: 1200,
            MIN_Y_SPAWN_FACTOR: 0.05,
            MAX_Y_SPAWN_FACTOR: 0.35,
            SPAWN_INTERVAL_MIN_SECONDS: 300,
            SPAWN_INTERVAL_MAX_SECONDS: 1200,
            SCALE: 0.2,
            PHASE_UNLOCK: 4,
        }
    },

    // =============================================================================
    // UI
    // =============================================================================
    DEFAULT_WORLD_BACKGROUND_COLOR: '#417021',
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/',
    RACCOON_FACE_IMAGES: [
        'face1.png', 'face2.png', 'face3.png', 'face4.png', 'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png', 'face12.png', 'face13.png', 'face14.png', 'face15.png', 'face16.png',
        'face17.png', 'face18.png', 'face19.png', 'face20.png', 'face21.png', 'face22.png', 'face23.png', 'face24.png',
        'face25.png', 'face26.png', 'face27.png', 'face28.png', 'face29.png', 'face30.png'
    ],

    MENU_WALLPAPERS: [
        { key: 'raccoon_1', name: 'Raccoon 1', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_1_menu.jpg' },
        { key: 'raccoon_2', name: 'Raccoon 2', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_2_menu.jpg' },
        { key: 'raccoon_3', name: 'Raccoon 3', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_3_menu.jpg' },
        { key: 'raccoon_4', name: 'Raccoon 4', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_4_menu.jpg' },
        { key: 'raccoon_5', name: 'Raccoon 5', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_5_menu.jpg' },
        { key: 'raccoon_6', name: 'Raccoon 6', path: 'assets/images/ui/wallpapers/1K/menu/raccoon_6_menu.jpg' },
    ],

    DEFAULT_MENU_WALLPAPER: 'raccoon_1',

    UI_ASSETS: {
        GRENADE_ICON: 'assets/images/ui/icons/grenade_icon.png',
        HEALTH_ICON: 'assets/images/ui/icons/health_icon.png',
        AMMO_ICON: 'assets/images/ui/icons/ammo_icon.png'
    },

    UI_SETTINGS: {
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 3, HEIGHT: 4, Y_OFFSET_BASE: 10, BG_COLOR: '#333333',
            HP_COLOR_FULL: '#00CC00', HP_COLOR_MEDIUM: '#CCCC00', HP_COLOR_LOW: '#CC0000',
            LOW_HP_THRESHOLD_PERCENT: 0.3, MEDIUM_HP_THRESHOLD_PERCENT: 0.6
        },
        RECRUIT_CARD: { DEFAULT_FACE_BG_COLOR: '#555555' },
        MEMORIAL_CARD: { DEFAULT_FACE_BG_COLOR: '#333333' },
        RANK_ICON_PATH: 'assets/images/ranks/',
        RANK_ICON_FILES: {
            'Recruit': 'recruit.png',
            'Private': 'private.png',
            'Corporal': 'corporal.png',
            'Sergeant': 'sergeant.png',
            'Elite': 'elite.png',
            'Ghost': 'ghost.png'
        }
    },

    UI_TEXT_STRINGS: {
        CAMPAIGN_ALREADY_COMPLETE: "Campaign Already Complete! Restart from Main Menu.",
        ERROR_NO_INITIAL_RECRUITS: "All initial recruits were KIA! Operation failed before it began.",
        ERROR_LOAD_FIRST_MISSION_FAILED: "Error: Could not load campaign data to start the first mission.",
        ERROR_PREPARING_NEXT_BRIEFING: "Error preparing next mission briefing.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons KIA. Operation Failed.",
        CAMPAIGN_CONCLUDED_NO_MORE_MISSIONS: "Campaign Concluded (No more missions defined)!",
        PREMISSION_ERROR_PHASE_TITLE: "Campaign Error",
        PREMISSION_ERROR_MISSION_TITLE: "Error Loading Mission",
        PREMISSION_ERROR_BRIEFING: "Could not load mission details for selection.",
        MAX_SQUAD_ALERT: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.",
        NO_RECRUITS_SELECTED_ALERT: "Select at least one Raccoon for the mission!",
        INVALID_SQUAD_SIZE_ALERT: "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.",
        DEPLOY_LIST_EMPTY_PLACEHOLDER: "Click recruits on the left to deploy.",
        START_MISSION_BUTTON_ALERT_MAX_SIZE: "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.",
        START_MISSION_BUTTON_ALERT_MIN_SIZE: "Select at least one Raccoon for the mission!",
        POST_MISSION_SUCCESS: "MISSION SUCCESSFUL!",
        POST_MISSION_FAILED: "MISSION FAILED!",
        POST_MISSION_SURVIVORS_NONE_VICTORY: "Mission accomplished, but no Raccoons survived.",
        POST_MISSION_SURVIVORS_NONE_DEFEAT: "All deployed Raccoons KIA.",
        POST_MISSION_FALLEN_NONE: "No casualties this mission.",
        GAMEOVER_ALL_RECRUITS_KIA: "All Raccoons have been lost in action. The Platoon is no more. Operation Failed.",
        BUTTON_TEXT_NEXT_MISSION: "Next Mission",
        BUTTON_TEXT_RESTART_CAMPAIGN: "Restart Campaign",
        BUTTON_TEXT_START_PHASE_PREFIX: "Start ",
        BUTTON_TEXT_CAMPAIGN_COMPLETE: "View Final Stats",
        BUTTON_TEXT_RETRY_MISSION: "Retry Mission",
        MEMORIAL_NO_FALLEN: "No Raccoons have fallen... yet. Their legend awaits.",
        MEMORIAL_LABEL_NAME: "Name:",
        MEMORIAL_LABEL_RANK: "Rank Achieved:",
        MEMORIAL_LABEL_MISSION: "Fell In:",
        MEMORIAL_LABEL_PHASE: "During:",
        DEFAULT_OBJECTIVE_TEXT: "Defeat Possums",
        UNKNOWN_OBJECTIVE_TEXT: "Unknown Objective",
        HUD_NO_SQUAD_DEPLOYED: "No squad deployed.",
        UNKNOWN_PHASE_TEXT: "Unknown Phase",
        UNKNOWN_MISSION_TEXT: "Unknown Mission",
        GAMEOVER_VICTORY_TITLE: "CAMPAIGN COMPLETE!",
        GAMEOVER_DEFEAT_TITLE: "GAME OVER",
        CAMPAIGN_COMPLETE_PHASE_NAME: "Campaign Finished",
        CAMPAIGN_COMPLETE_MISSION_NAME: "All Possums Defeated!",
        ERROR_LOADING_MISSION_RETRY: "Error reloading mission for retry.",
        RACCOON_OUT_OF_GRENADES_LOG: "Raccoon {ID}: Out of grenades!",
        OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION: "Hostages ready! Proceed to Extraction Zone!",
        OBJECTIVE_RESCUE_HOSTAGES_AT_EVAC: "Hostages at EVAC: {COUNT}/{TOTAL}",
        OBJECTIVE_EXTERMINATE_TEXT: "Eliminate Possums: {CURRENT}/{TOTAL}",
        OBJECTIVE_DESTROY_TARGET_GENERIC_TEXT: "Destroy {TARGET_NAME_PLURAL}: {CURRENT}/{TOTAL}",
        OBJECTIVE_RESCUE_HOSTAGES_TEXT: "Rescue Hostages: {CURRENT_RESCUED}/{TOTAL_SPAWNED} (Evac: {CURRENT_EVACUATED}/{MIN_TO_EVAC}){KIA_TEXT}",
        OBJECTIVE_RESCUE_TAKEN_HOSTAGE_TEXT: "Rescue Captured comrade from captivity",
        OBJECTIVE_EXTRACTION_TEXT: "Extract All Units: Get to Extraction Zone",
        OBJECTIVE_EXTRACTION_PROCEED: "All objectives complete! Proceed to Extraction Zone!",
        OBJECTIVE_INTERACT_INTEL_TEXT: "Hack Intel Console: {CURRENT}/{TOTAL}",
        EXTRACTION_ZONE_REVEALED: "Extraction Zone Revealed!"
    },

    // =============================================================================
    // NIGHT_MISSION
    // =============================================================================
    NIGHT_MISSION: {
        CHANCE: 0.1,
        UNLOCKS_PHASE: 2,
        OVERLAY_COLOR: 'rgba(0, 0, 20, 0.92)',
        DARKNESS_ALPHA: 0.62,
        PLAYER_VISION_RADIUS: 220,
        VISION_EDGE_SOFTNESS: 60,
        VISION_TINT_OPACITY: 0.45,
        ENEMY_DETECTION_MULTIPLIER: 0.45,
        PLAYER_DETECTION_MULTIPLIER: 0.65,
        ENEMY_NIGHT_ACCURACY_PENALTY: -0.15,
        NIGHT_DETECTION_RADIUS_IN_DARK: 100,
        ENEMY_NIGHT_ALERT_MULTIPLIER: 0.65,
    },

    // =============================================================================
    // AUDIO
    // =============================================================================
    AUDIO_ASSETS: {
        RACCOON_MG_FIRE: { path: 'assets/audio/sfx/gun_possum_grunt.ogg', defaultVolume: 1.0, pitchVariation: 0.3 },

        POSSUM_RIFLE_FIRE: { path: 'assets/audio/sfx/gun_mg_raccoon.mp3', defaultVolume: 0.25, pitchVariation: 0.3 },
        POSSUM_HEAVY_MG_FIRE: { path: 'assets/audio/sfx/gun_possum_heavy.ogg', defaultVolume: 0.5, pitchVariation: 0.08 },
        SNIPER_RIFLE_FIRE: { path: 'assets/audio/sfx/gunshot_sniper_1.ogg', defaultVolume: 0.5, pitchVariation: 0.02 },
        POSSUM_REVOLVER_FIRE: { path: 'assets/audio/sfx/gunshot_1.ogg', defaultVolume: 0.4, pitchVariation: 0.15 },
        LASER_WEAPON_FIRE: { path: 'assets/audio/sfx/advanced_laser_1.ogg', defaultVolume: 0.4, pitchVariation: 0.05 },
        LASER_WEAPON_2_FIRE: { path: 'assets/audio/sfx/advanced_laser_2.ogg', defaultVolume: 0.4, pitchVariation: 0.05 },
        POSSUM_BOSS_1_WEAPON_FIRE: { path: 'assets/audio/sfx/grenade_launcher.ogg', defaultVolume: 0.2, pitchVariation: 0.1 },

        GRENADE_EXPLODE: { path: 'assets/audio/sfx/grenade_explode.ogg', defaultVolume: 0.3, pitchVariation: 0.4 },

        UI_BUTTON_CLICK: { path: 'assets/audio/sfx/ui_click_soft.ogg', defaultVolume: 0.1 },
        UI_BUTTON_HOVER: { path: 'assets/audio/sfx/ui_hover_gentle.mp3', defaultVolume: 0.3, pitchVariation: 0.1 },
        TOAST_NOTIFICATION: { path: 'assets/audio/sfx/ui_sfx_2.mp3', defaultVolume: 0.3 },

        AMBIENT_FOREST_1: { path: 'assets/audio/ambience/tropical_forest_ambient_1.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_2: { path: 'assets/audio/ambience/tropical_forest_ambient_2.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_3: { path: 'assets/audio/ambience/tropical_forest_ambient_3.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_4: { path: 'assets/audio/ambience/tropical_forest_ambient_4.mp3', defaultVolume: 0.45 },
        AMBIENT_FOREST_5: { path: 'assets/audio/ambience/ambience_temperate_day_4.ogg', defaultVolume: 1.0 },

        AMBIENT_MUSIC_TROPICAL_FOREST_KEYS: [
            'AMBIENT_FOREST_1',
            'AMBIENT_FOREST_2',
            'AMBIENT_FOREST_3',
            'AMBIENT_FOREST_4',
            'AMBIENT_FOREST_5'
        ],

        POSSUM_HUT_DESTROYED: { path: 'assets/audio/sfx/structure_wood_destroy_01.mp3', defaultVolume: 0.5, pitchVariation: 0.1 },
        EXPLOSIVE_BARREL_DESTROYED: { path: 'assets/audio/sfx/barrel_explode.ogg', defaultVolume: 0.1, pitchVariation: 0.2 },
        EXPLOSIVE_BARREL_CLUSTER_DESTROYED: { path: 'assets/audio/sfx/barrel_cluster_explode.ogg', defaultVolume: 0.15, pitchVariation: 0.15 },

        MUSIC_MAIN_MENU: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.5 },
        MUSIC_COMBAT_1: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.3 },
        MUSIC_BOSS_1: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.4 },
        MUSIC_VICTORY_DEFAULT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.8 },
        MUSIC_DEFEAT: { path: 'assets/audio/music/Raccoon_Victory_mini.mp3', defaultVolume: 0.5 },
        MUSIC_LOADING: { path: 'assets/audio/music/March Through The Jungle.mp3', defaultVolume: 0.4 },
        MUSIC_SHOOTOUT: { path: 'assets/audio/music/boss_battle.mp3', defaultVolume: 0.5 },
        MUSIC_CAMPAIGN_COMPLETE: { path: 'assets/audio/music/End Game.mp3', defaultVolume: 0.7 },
        MUSIC_GAME_OVER: { path: 'assets/audio/music/Broken Raccoon.mp3', defaultVolume: 0.6 },
    },

    AUDIO_MUSIC: {
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_AMBIENT_VOLUME: 0.7,
        STATE_TRANSITION_TIME: 1.0,

        BIOME_TRACKS: {
            TROPICAL: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: 'MUSIC_DEFEAT'
            },
            SWAMP: {
                ambient: ['AMBIENT_FOREST_1', 'AMBIENT_FOREST_2', 'AMBIENT_FOREST_3', 'AMBIENT_FOREST_4', 'AMBIENT_FOREST_5'],
                combat: ['MUSIC_COMBAT_1'],
                victory: 'MUSIC_VICTORY_DEFAULT',
                defeat: 'MUSIC_DEFEAT'
            }
        },

        MISSION_TYPE_TRACKS: {
            BOSS: { combat: ['MUSIC_BOSS_1'] }
        },

        STATE_TRACKS: {
            MAIN_MENU: 'MUSIC_MAIN_MENU',
            PRE_MISSION_SELECT: 'MUSIC_MAIN_MENU',
            LOADING_MISSION: 'MUSIC_LOADING',
            POST_MISSION_DEBRIEF: null,
            VICTORY: 'MUSIC_VICTORY_DEFAULT',
            DEFEAT: 'MUSIC_DEFEAT',
            PAUSE: null,
            SHOOTOUT_PRE_GAME: 'MUSIC_SHOOTOUT',
            SHOOTOUT_PLAYING: 'MUSIC_SHOOTOUT',
            SHOOTOUT_AMBUSH: 'MUSIC_SHOOTOUT',
            CAMPAIGN_COMPLETE: 'MUSIC_CAMPAIGN_COMPLETE',
            GAME_OVER_NO_RECRUITS: 'MUSIC_GAME_OVER',
            HOW_TO_PLAY: 'MUSIC_MAIN_MENU',
        }
    },

    // =============================================================================
    // SHOOTOUT_MODE
    // =============================================================================
    SHOOTOUT_MODE: {
        MODES: {
            TIME_ATTACK: 'time_attack',
            ELIMINATION: 'elimination'
        },
        NATIVE_WIDTH: 1920,
        NATIVE_HEIGHT: 1080,
        ROUND_DURATION_SECONDS: 60,
        ELIMINATION_TARGET_MIN: 15,
        ELIMINATION_TARGET_MAX: 30,
        ELIMINATION_PAR_TIME_PER_TARGET: 3.5,
        INITIAL_PLAYER_HEALTH: 75,
        PLAYER_FIRE_SFX: 'RACCOON_MG_FIRE',
        INITIAL_SPAWN_INTERVAL: 3.0,
        MIN_SPAWN_INTERVAL: 0.5,
        MAX_CONCURRENT_TARGETS: 5,
        DIFFICULTY_INCREASE_RATE: 0.95,
        DIFFICULTY_INCREASE_INTERVAL: 10,
        PEEK_DURATION_BASE: 1.0,
        PEEK_DURATION_RANDOM: 1.5,
        REACTION_TIME_BASE: 0.5,
        REACTION_TIME_RANDOM: 1.0,
        SCORE_PER_HIT: 100,
        SCORE_PER_KILL: 500,
        ACCURACY_BONUS_THRESHOLD: 0.8,
        TIME_BONUS_MULTIPLIER: 10,
        CROSSHAIR_SIZE: 32,

        WARNING_DURATION: 1.0,
        BASE_TRAVEL_TIME: 1.0,
        TRAVEL_TIME_SCALE_FACTOR: 1.0,
        HEADSHOT_THRESHOLD: 0.3,

        VISIBILITY_THRESHOLD: 0.50,
        FADE_ZONE_SIZE: 0.20,

        DYNAMIC_VISIBILITY_THRESHOLD: true,
        PEEK_OFFSET_MIN: 20,
        PEEK_OFFSET_MAX: 200,
        VISIBILITY_THRESHOLD_WHEN_HIDDEN: 0.7,
        VISIBILITY_THRESHOLD_WHEN_EXPOSED: 0.3,

        ENEMY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_grunt_tile.png',
            FRAME_WIDTH: 128,
            FRAME_HEIGHT: 128,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 0.7
        },
        ENEMY_HEAVY_TILESHEET: {
            PATH: 'assets/images/shootouts/enemies/possum_heavy_tile.png',
            FRAME_WIDTH: 128,
            FRAME_HEIGHT: 128,
            NUM_FRAMES: 4,
            SCALE: 1.0,
            TILE_SCALE: 0.9
        },

        BULLET_MARKS: {
            ENEMY_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_enemy.png',
                DEFAULT_SCALE: 0.6
            },
            ENVIRONMENT_HIT: {
                PATH: 'assets/images/shootouts/bulletShot_environment.png',
                DEFAULT_SCALE: 0.7
            }
        },

        DEFAULT_ENEMY_CONFIGS: {
            grunt: {
                enabled: true,
                weight: 60,
                peekOffset: 40,
                scale: 1.0,
                bulletOffset: { x: -3, y: 14 },
                showInDevMode: true
            },
            heavy: {
                enabled: false,
                weight: 25,
                peekOffset: 50,
                scale: 1.2,
                bulletOffset: { x: 5, y: 2 },
                showInDevMode: true
            },
            elite: {
                enabled: false,
                weight: 15,
                peekOffset: 45,
                scale: 1.1,
                bulletOffset: { x: -3, y: 12 },
                showInDevMode: false
            }
        },

        ENEMY_TYPES: {
            grunt: {
                displayName: 'Grunt',
                color: '#A0522D',
                tilesheetKey: 'ENEMY_TILESHEET'
            },
            heavy: {
                displayName: 'Heavy',
                color: '#6A4A3A',
                tilesheetKey: 'ENEMY_HEAVY_TILESHEET'
            },
            elite: {
                displayName: 'Elite',
                color: '#8B4513',
                tilesheetKey: 'ENEMY_TILESHEET'
            }
        },

        DEBUG_SHOW_SPAWN_AREAS: false,
        DEBUG_SPAWN_AREA_SIZE: 64,
        DEBUG_SPAWN_AREA_COLOR: 'rgba(255, 255, 0, 0.5)',
        DEBUG_PEEK_LINE_COLOR: 'rgba(255, 0, 0, 0.8)',
        DEBUG_TEXT_COLOR: '#00FF00',

        GAME_OVER_BUTTON_DELAY: 1.5,

        MAX_DAMAGE_ALLOWED: 75,
        DAMAGE_MULTIPLIER: 0.5,

        GRADE_THRESHOLDS: {
            S: { minScore: 12000, minAccuracy: 0.95, minDamageEfficiency: 0.9, minHeadshotPct: 0.4 },
            A: { minScore: 9000, minAccuracy: 0.85, minDamageEfficiency: 0.7, minHeadshotPct: 0.25 },
            B: { minScore: 6500, minAccuracy: 0.75, minDamageEfficiency: 0.5, minHeadshotPct: 0.15 },
            C: { minScore: 4000, minAccuracy: 0.6, minDamageEfficiency: 0.3, minHeadshotPct: 0.05 },
            D: { minScore: 2000, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 },
            F: { minScore: 0, minAccuracy: 0, minDamageEfficiency: 0, minHeadshotPct: 0 }
        },

        BACKGROUNDS: {
            JUNGLE_AMBUSH: {
                NAME: 'Jungle Ambush',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_3.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":345,"y":905,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":469,"y":744,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":70,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":true,"weight":16,"peekOffset":70,"scale":1.5,"showInDevMode":true}}},
                    {"x":567,"y":608,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":60,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":60,"scale":0.9,"showInDevMode":true}}},
                    {"x":1540,"y":609,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":90,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":70,"scale":1.3,"showInDevMode":true}}},
                    {"x":1393,"y":776,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":65,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":65,"scale":1,"showInDevMode":true}}},
                    {"x":1560,"y":814,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":145,"scale":1.9,"showInDevMode":true},"heavy":{"enabled":true,"weight":40,"peekOffset":115,"scale":1.9,"showInDevMode":true}}},
                    {"x":663,"y":778,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":130,"scale":1.5,"showInDevMode":true},"heavy":{"enabled":true,"weight":50,"peekOffset":155,"scale":1.5,"showInDevMode":true}}},
                    {"x":90,"y":422,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":75,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":75,"scale":1.4,"showInDevMode":true}}},
                    {"x":1030,"y":581,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.6,"showInDevMode":true}}}
                ]
            },
            JUNGLE_ATTACK: {
                NAME: 'Jungle Attack',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_1.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":358,"y":904,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.9,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":85,"scale":2,"showInDevMode":true}}},
                    {"x":453,"y":721,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":95,"scale":1.1,"showInDevMode":true},"heavy":{"enabled":true,"weight":16,"peekOffset":100,"scale":1.5,"showInDevMode":false}}},
                    {"x":567,"y":608,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":60,"scale":0.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":60,"scale":0.9,"showInDevMode":true}}},
                    {"x":1245,"y":886,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":90,"scale":1.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":70,"scale":1.3,"showInDevMode":true}}},
                    {"x":1393,"y":776,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":65,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":65,"scale":1,"showInDevMode":true}}},
                    {"x":1560,"y":815,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":100,"scale":1.6,"showInDevMode":true},"heavy":{"enabled":true,"weight":40,"peekOffset":130,"scale":1.8,"showInDevMode":true}}},
                    {"x":663,"y":778,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":50,"peekOffset":130,"scale":1.5,"showInDevMode":true},"heavy":{"enabled":true,"weight":50,"peekOffset":155,"scale":1.5,"showInDevMode":true}}},
                    {"x":99,"y":425,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":75,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":75,"scale":1.4,"showInDevMode":true}}},
                    {"x":1030,"y":580,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":55,"scale":0.5,"showInDevMode":true},"heavy":{"enabled":false,"weight":0,"peekOffset":55,"scale":0.6,"showInDevMode":true}}}
                ]
            },
            JUNGLE_RUINS: {
                NAME: 'Jungle Ruins',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_2.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":1084,"y":753,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":95,"scale":1.5,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":130,"scale":1.6,"showInDevMode":true}}},
                    {"x":476,"y":765,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.1,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":90,"scale":1.5,"showInDevMode":true}}},
                    {"x":1184,"y":603,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":65,"scale":1.2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1364,"y":739,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":85,"scale":1.2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":100,"scale":1.4,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1596,"y":889,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":1.9,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":100,"scale":1.8,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":680,"y":768,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":95,"scale":1.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":85,"scale":1.4,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":925,"y":532,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":40,"scale":0.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":0.7,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1010,"y":531,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":45,"scale":0.7,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":55,"scale":0.8,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}}
                ]
            },
            JUNGLE_RUINS_2: {
                NAME: 'Jungle Ruins 2',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_4.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":202,"y":945,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":200,"scale":2,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":195,"scale":2.3,"showInDevMode":true}}},
                    {"x":464,"y":710,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":100,"peekOffset":85,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":true,"weight":0,"peekOffset":95,"scale":1.4,"showInDevMode":true}}},
                    {"x":903,"y":605,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":65,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":90,"scale":1,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1176,"y":610,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":80,"scale":1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1354,"y":964,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":110,"scale":2,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":105,"scale":2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":975,"y":1052,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":45,"scale":2.6,"bulletOffset":{"x":-3,"y":11},"showInDevMode":false},"heavy":{"enabled":true,"weight":30,"peekOffset":50,"scale":3,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":745,"y":882,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":60,"scale":1.3,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":false,"weight":30,"peekOffset":50,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}},
                    {"x":1325,"y":699,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":70,"peekOffset":70,"scale":1.1,"bulletOffset":{"x":-3,"y":11},"showInDevMode":true},"heavy":{"enabled":true,"weight":30,"peekOffset":80,"scale":1.2,"bulletOffset":{"x":5,"y":2},"showInDevMode":true}}}
                ]
            },
            RAINFOREST_BATTLE_1: {
                NAME: 'Rainforest Battle 1',
                IMAGE: 'assets/images/shootouts/Shootout_Jungle_5.png',
                TREE_SPAWN_POSITIONS: [
                    {"x":360,"y":241,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":75,"scale":1.2,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":769,"y":887,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":60,"scale":1.3,"showInDevMode":true},"heavy":{"enabled":true,"weight":25,"peekOffset":80,"scale":1.6,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":1266,"y":974,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":150,"scale":2.1,"showInDevMode":true},"heavy":{"enabled":true,"weight":25,"peekOffset":170,"scale":2.1,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":999,"y":785,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":60,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":true,"weight":25,"peekOffset":60,"scale":0.7,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":631,"y":696,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":80,"scale":0.9,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":357,"y":1017,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":155,"scale":1.8,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":1254,"y":808,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":120,"scale":1.1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":1069,"y":844,"peekDirection":"left","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":70,"scale":1,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":608,"y":533,"peekDirection":"right","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":40,"scale":0.7,"showInDevMode":true},"heavy":{"enabled":false,"weight":25,"peekOffset":50,"scale":1.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}},{"x":840,"y":1101,"peekDirection":"up","enemyConfigs":{"grunt":{"enabled":true,"weight":60,"peekOffset":105,"scale":1.9,"showInDevMode":true},"heavy":{"enabled":true,"weight":25,"peekOffset":105,"scale":2.2,"showInDevMode":true},"elite":{"enabled":false,"weight":15,"peekOffset":45,"scale":1.1,"showInDevMode":false}}}
                ]
            },
        },

        DEFAULT_BACKGROUND: 'RAINFOREST_BATTLE_1',

        AMBUSH_START_CHANCE: 0.2,
        AMBUSH_EXTRACTION_CHANCE: 0.6,
        AMBUSH_ALERT_DURATION: 3000,
        AMBUSH_DEFAULT_MODE: 'ELIMINATION',
        AMBUSH_TIME_ATTACK_CHANCE: 0.5,
        AMBUSH_TIME_LIMIT: 45,
        AMBUSH_ELIMINATION_COUNT: 15,
        AMBUSH_NIGHT_MODE_ENABLED: true,
        AMBUSH_BACKGROUNDS: ['RAINFOREST_BATTLE_1', 'JUNGLE_ATTACK'],
        AMBUSH_UNLOCKS_PHASE: 2,

        XP_PER_AMBUSH_SURVIVED: 100,

        AMBUSH_ALERT_MESSAGES: {
            START_AMBUSH: [
                "AMBUSH! Get down!",
                "Possum scum spotted! Cover!",
                "Hostiles! Take cover!",
                "Ambush! Get to cover!",
                "Possum scum spotted! Return fire!",
                "We're under fire! Clear the area!",
                "Hostiles! Engage immediately!",
                "Ambush! Open fire!",
                "Taking fire! Return fire!",
                "Enemies! Shoot them!",
                "Contact! All units, open fire!"
            ],
            EXTRACTION_AMBUSH: [
                "Extraction under fire!",
                "Enemy reinforcements! Cover the extraction zone!",
                "Ambush at extraction! Defend the position!",
                "Taking fire at extraction point!",
                "Enemies blocking extraction! Clear them out!",
                "Hostile contact at extraction! Push through!",
                "Extraction compromised! Eliminate the threat!",
                "Enemy blocking escape! Get rid of them!"
            ]
        },

        AMBUSH_RESULT_MESSAGES: {
            VICTORY: [
                "Area clear! Good work!",
                "All scum eliminated!",
                "Possum scum neutralized!",
                "Sector secure!",
                "Nice shooting!",
                "Clear! Move out!"
            ],
            DEFEAT: [
                "Fall back! Too many casualties!",
                "Overrun! Withdraw!",
                "Fall back!"
            ],
            TIME_UP: [
                "Time's up! You survived!",
                "Survived the ambush!",
                "You held the line!",
                "Reinforcements arrived! Hold position!"
            ]
        }
    }
};
