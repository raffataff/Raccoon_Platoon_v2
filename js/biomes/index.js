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
