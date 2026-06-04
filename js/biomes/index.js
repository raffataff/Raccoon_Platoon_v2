// js/biomes/index.js
// Registers all biomes into CONFIG.BIOMES and provides helper functions
// This file must be loaded AFTER config.js and biome files, BEFORE game.js/levelGenerator.js

CONFIG.BIOMES = {};

// Register each biome
CONFIG.BIOMES[TROPICAL_BIOME.name] = TROPICAL_BIOME;
CONFIG.BIOMES[TEMPERATE_BIOME.name] = TEMPERATE_BIOME;

// Helper: get biome config by name (fallback to TROPICAL)
function getBiomeConfig(biomeName) {
    return CONFIG.BIOMES[biomeName] || CONFIG.BIOMES['TROPICAL'];
}

// Helper: merge generic + biome obstacle definitions
function getAllObstacleDefinitions(biomeName) {
    const biome = getBiomeConfig(biomeName);
    return [
        ...CONFIG.OBSTACLE_DEFINITIONS,
        ...(biome.obstacleDefinitions || [])
    ];
}

// Helper: get all restricted obstacle types (generic + biome)
function getAllRestrictedObstacleTypes(biomeName) {
    const biome = getBiomeConfig(biomeName);
    const genericRestricted = CONFIG.LEVEL_GENERATION?.PLAYER_SPAWN_ZONE?.PLAYER_SPAWN_ZONE_RESTRICTED_OBSTACLE_TYPES_GENERIC || [];
    const biomeRestricted = biome.restrictedObstacleTypes || [];
    return [...genericRestricted, ...biomeRestricted];
}

// Helper: get sprite path info for a type
function getBiomeSpritePath(biomeName, type) {
    const biome = getBiomeConfig(biomeName);
    return biome.spritePaths[type] || null;
}

// Helper: get preload sprite sets for a biome
function getBiomePreloadSpriteSets(biomeName) {
    const biome = getBiomeConfig(biomeName);
    return biome.preloadSpriteSets || [];
}

// Helper: get level gen settings for a biome
function getBiomeLevelGenSettings(biomeName) {
    const biome = getBiomeConfig(biomeName);
    return biome.levelGenSettings || {};
}

// Helper: get landing videos for a biome
function getBiomeLandingVideos(biomeName) {
    const biome = getBiomeConfig(biomeName);
    return biome.landingVideos || [
        'assets/video/landing/Raccoon_Combat_Team_Deploys.mp4',
        'assets/video/landing/Helicopter_Landing_6.mp4',
    ];
}

// Helper: get extraction videos for a biome
function getBiomeExtractionVideos(biomeName) {
    const biome = getBiomeConfig(biomeName);
    return biome.extractionVideos || [
        'assets/video/extraction/extraction_takeoff_1.mp4',
    ];
}

// Helper: get extraction hostage videos for a biome
function getBiomeExtractionHostageVideos(biomeName) {
    const biome = getBiomeConfig(biomeName);
    if (biome.extractionHostageVideos && biome.extractionHostageVideos.length > 0) {
        return biome.extractionHostageVideos;
    }
    const defaults = [];
    for (let i = 1; i <= 3; i++) {
        defaults.push(`assets/video/extraction/extraction_hostage_${i}.mp4`);
    }
    return defaults;
}

// Helper: get shootout background config for a biome-specific background key
// Returns the biome-specific background config if available, otherwise falls back to CONFIG.SHOOTOUT_MODE.BACKGROUNDS
function getBiomeShootoutBackground(biomeName, backgroundKey) {
    const biome = getBiomeConfig(biomeName);
    if (biome.shootoutBackgrounds && biome.shootoutBackgrounds[backgroundKey]) {
        return biome.shootoutBackgrounds[backgroundKey];
    }
    return CONFIG.SHOOTOUT_MODE.BACKGROUNDS[backgroundKey];
}

// Helper: get all shootout background keys available for a biome
function getBiomeShootoutBackgroundKeys(biomeName) {
    const biome = getBiomeConfig(biomeName);
    const biomeKeys = biome.shootoutBackgrounds ? Object.keys(biome.shootoutBackgrounds) : [];
    if (biomeKeys.length > 0) {
        return biomeKeys;
    }
    return CONFIG.SHOOTOUT_MODE.AMBUSH_BACKGROUNDS[biomeName] || CONFIG.SHOOTOUT_MODE.AMBUSH_BACKGROUNDS['TROPICAL'];
}
