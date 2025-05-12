// js/config.js
const CONFIG = {
    BASE_WORLD_WIDTH: 1280,  // Base size for world calculations
    BASE_WORLD_HEIGHT: 720,
    // CANVAS_WIDTH and CANVAS_HEIGHT are now dynamic based on container
    MIN_CANVAS_WIDTH: 800,
    MIN_CANVAS_HEIGHT: 600,

    RACCOON_HP: 30, // Fragile but skilled
    RACCOON_SPEED: 100, 
    RACCOON_SIZE: 12,  
    RACCOON_COLOR: '#808080', 
    RACCOON_MG_DAMAGE: 7, // Slight damage buff to Raccoon MG
    RACCOON_MG_ROF: 5,    // DPS = 35
    RACCOON_MG_RANGE: 200, 
    RACCOON_MG_PROJECTILE_SPEED: 500,
    RACCOON_MG_ACCURACY_STATIONARY: 0.90, 
    RACCOON_MG_ACCURACY_MOVING: 0.60,   // Slightly lower moving accuracy
    RACCOON_STARTING_GRENADES: 1,       // Changed to 0 for pickups later
    RACCOON_GRENADE_DAMAGE: 50,   
    RACCOON_GRENADE_AOE_RADIUS: 45, 
    RACCOON_GRENADE_FUSE_TIME: 2.5, 
    RACCOON_GRENADE_THROW_RANGE_MAX: 220, 
    RACCOON_GRENADE_THROW_COOLDOWN: 1.0, 
    RACCOON_GRENADE_PROJECTILE_SPEED: 120, 

    // --- POSSUM GRUNT ---
    POSSUM_GRUNT_HP: 30, // Reduced slightly to match Raccoon HP (more of a glass cannon)
    POSSUM_GRUNT_SPEED: 80, 
    POSSUM_GRUNT_SIZE: 14, 
    POSSUM_GRUNT_COLOR: '#A0522D', 
    POSSUM_RIFLE_DAMAGE: 8,  // Slightly reduced damage
    POSSUM_RIFLE_ROF: 3,     // Slightly increased ROF (DPS = 24)
    POSSUM_RIFLE_RANGE: 190, // Raccoon slightly outranges them
    POSSUM_RIFLE_PROJECTILE_SPEED: 400,
    POSSUM_RIFLE_ACCURACY_STATIONARY: 0.75, // Slightly less accurate than Raccoon
    POSSUM_RIFLE_ACCURACY_MOVING: 0.45,    // Significantly less accurate while moving

    // --- NEW: HEAVY POSSUM ---
    POSSUM_HEAVY_HP: 70,
    POSSUM_HEAVY_SPEED: 50, // Slower
    POSSUM_HEAVY_SIZE: 18,  // Larger
    POSSUM_HEAVY_COLOR: '#6A4A3A', // Darker, more imposing brown
    POSSUM_HEAVY_WEAPON_DAMAGE: 18,
    POSSUM_HEAVY_WEAPON_ROF: 1.2, // Shoots about once per 0.83s (DPS ~21.6)
    POSSUM_HEAVY_WEAPON_RANGE: 240, // Outranges Raccoon MG
    POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED: 350, // Slower projectile, easier to dodge?
    POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY: 0.85,
    POSSUM_HEAVY_WEAPON_ACCURACY_MOVING: 0.3, // Very inaccurate while moving

    POSSUM_DETECTION_RANGE: 250, 

    PROJECTILE_SIZE: 2, 
    PROJECTILE_COLOR_RACCOON: '#FFFF00', 
    PROJECTILE_COLOR_POSSUM: '#FFA500', 
    PROJECTILE_COLOR_POSSUM_HEAVY: '#FF6347', // Tomato red for heavy projectiles
    GRENADE_PROJECTILE_COLOR: '#228B22', 

    INITIAL_ROSTER_SIZE: 8, // <<< MAKE SURE THIS IS A POSITIVE NUMBER (e.g., 8 or 10)
    NEW_RECRUITS_PER_MISSION_WIN: 1, 
    MAX_SQUAD_SIZE_MVP: 4, 
    CAMERA_LERP_SPEED: 0.08, 

    XP_PER_MISSION_SURVIVED: 35,
    XP_PER_HIT: 1,
    XP_PER_KILL: 10,
    XP_FOR_HEAVY_KILL: 25, // Bonus for killing a heavy
    RANK_THRESHOLDS: [
        { rankName: "Recruit", xpNeeded: 0, statBoosts: {} },
        { rankName: "Private", xpNeeded: 50, statBoosts: { maxHpBonus: 2 } },
        { rankName: "Corporal", xpNeeded: 150, statBoosts: { maxHpBonus: 4, accuracyBonus: 0.02 } }, // Accuracy bonus as a decimal
        { rankName: "Sergeant", xpNeeded: 350, statBoosts: { maxHpBonus: 6, accuracyBonus: 0.04 } },
        // Add more ranks as desired
    ],
    MAX_RANK_NAME: "Sergeant", // Or the highest rankName you define

    // --- Images ---
    RACCOON_FACE_IMAGE_PATH: 'assets/images/raccoons/', // Base path
    RACCOON_FACE_IMAGES: [ // List of filenames
        'face1.png', 'face2.png', 'face3.png', 'face4.png', 
        'face5.png', 'face6.png', 'face7.png', 'face8.png',
        'face9.png', 'face10.png', 'face11.png'
        // Add all your actual filenames here
    ],
};