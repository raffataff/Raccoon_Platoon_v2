// js/level.js
// complete
class Level {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
    }

    _getObstacleCollisionShape(obstacle) {
        if (obstacle.collisionShape) {
            const shapeDef = obstacle.collisionShape;
            const obsRenderWidth = obstacle.width;
            const obsRenderHeight = obstacle.height;

            if (shapeDef.type === 'rectangle') {
                return {
                    type: 'rectangle',
                    x: obstacle.x + (typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obstacle) : (shapeDef.offsetX || 0)),
                    y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obstacle) : (shapeDef.offsetY || 0)),
                    width: (typeof shapeDef.width === 'function' ? shapeDef.width(obstacle) : (shapeDef.width || obsRenderWidth)),
                    height: (typeof shapeDef.height === 'function' ? shapeDef.height(obstacle) : (shapeDef.height || obsRenderHeight))
                };
            } else if (shapeDef.type === 'circle') {
                return {
                    type: 'circle',
                    x: obstacle.x + (typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obstacle) : (shapeDef.offsetX || obsRenderWidth / 2)),
                    y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obstacle) : (shapeDef.offsetY || obsRenderHeight / 2)),
                    radius: (typeof shapeDef.radius === 'function' ? shapeDef.radius(obstacle) : (shapeDef.radius || Math.min(obsRenderWidth, obsRenderHeight) / 2))
                };
            }
        }
        return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
    }

    _rectOverlap(rect1, rect2) { /* ... (Unchanged from previous complete version) ... */
        return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y);
    }

    isShapeOverlappingList(movingShape, existingObstacles) { /* ... (Unchanged from previous complete version) ... */
        for (const existing of existingObstacles) {
            if (!existing.isDestroyed && existing.blocksMovement) {
                const existingCollisionShape = this._getObstacleCollisionShape(existing);
                let collision = false;
                if (movingShape.type === 'rectangle' && existingCollisionShape.type === 'rectangle') { collision = rectOverlap(movingShape, existingCollisionShape); }
                else if (movingShape.type === 'circle' && existingCollisionShape.type === 'circle') { collision = circleOverlap(movingShape, existingCollisionShape); }
                else if (movingShape.type === 'rectangle' && existingCollisionShape.type === 'circle') { collision = rectCircleOverlap(movingShape, existingCollisionShape); }
                else if (movingShape.type === 'circle' && existingCollisionShape.type === 'rectangle') { collision = rectCircleOverlap(existingCollisionShape, movingShape); }
                if (collision) return true;
            }
        }
        return false;
    }

    isSpawnPointClear(x, y, unitSize, existingObstacles) { /* ... (Unchanged from previous complete version) ... */
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        return !this.isShapeOverlappingList(unitShape, existingObstacles);
    }

    damageObstacle(obstacle, amount, attackerUnit = null) {
        if (!obstacle || !obstacle.destructible || obstacle.isDestroyed || obstacle.hp === undefined) {
            // --- MODIFIED: Add detailed log for early return ---
            if (obstacle && obstacle.type === 'possum_hut') {
                console.log(`[Level.damageObstacle] Returning early for Possum Hut (${obstacle.name || obstacle.id}). Destructible: ${obstacle.destructible}, IsDestroyed: ${obstacle.isDestroyed}, HP defined: ${obstacle.hp !== undefined}`);
            }
            // --- END MODIFICATION ---
            return;
        }

        obstacle.hp -= amount;

        // --- MODIFIED: Log HP after damage specifically for the hut ---
        if (obstacle.type === 'possum_hut') {
            console.log(`[Level.damageObstacle] Possum Hut (${obstacle.name || obstacle.id}) HP after damage: ${obstacle.hp}`);
        }
        // --- END MODIFICATION ---

        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true; // This is the key line

            // --- MODIFIED: Log when isDestroyed is set for the hut ---
            if (obstacle.type === 'possum_hut') {
                console.log(`[Level.damageObstacle] Possum Hut (${obstacle.name || obstacle.id}) has been marked as isDestroyed = true. Current HP: ${obstacle.hp}`);
                // Also log the state of its imageDestroyed property at this exact moment
                console.log(`[Level.damageObstacle] Hut's imageDestroyed object at destruction time:`, obstacle.imageDestroyed);
            }
            // --- END MODIFICATION ---

            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);
            if (obstacleDef) {
                obstacle.blocksMovement = obstacleDef.blocksMovementOnDestroy !== undefined ? obstacleDef.blocksMovementOnDestroy : false;
                obstacle.providesCover = obstacleDef.providesCoverOnDestroy !== undefined ? obstacleDef.providesCoverOnDestroy : false;
            } else {
                obstacle.blocksMovement = false;
                obstacle.providesCover = false;
            }

            if (this.game && obstacleDef && obstacleDef.explosionDamage && obstacleDef.explosionAoeRadius) {
                this.game.addVisualEffect('explosion', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacleDef.explosionAoeRadius);
                const explosionDmg = obstacleDef.explosionDamage;
                const explosionRadius = obstacleDef.explosionAoeRadius;

                (this.game.level.obstacles || []).forEach(otherObs => {
                    if (otherObs !== obstacle && otherObs.destructible && !otherObs.isDestroyed) {
                        const centerObsX = otherObs.x + otherObs.width / 2;
                        const centerObsY = otherObs.y + otherObs.height / 2;
                        const explosionCenterX = obstacle.x + obstacle.width / 2;
                        const explosionCenterY = obstacle.y + obstacle.height / 2;
                        if (distance(explosionCenterX, explosionCenterY, centerObsX, centerObsY) < explosionRadius + (otherObs.width + otherObs.height) / 4) {
                           this.damageObstacle(otherObs, explosionDmg, attackerUnit);
                        }
                    }
                });

                const allUnits = [...(this.game.deployedSquadRoster || []), ...(this.game.enemyUnits || [])];
                allUnits.forEach(unit => {
                    if (unit.isAlive()) {
                        const distToUnit = distance(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, unit.x, unit.y);
                        if (distToUnit <= explosionRadius + unit.size) { // Consider unit size for AOE hit
                            unit.takeDamage(explosionDmg, attackerUnit);
                        }
                    }
                });
            }
        }
    }

    _getRandomObstacleTemplate() { /* ... (Unchanged from previous complete version) ... */
        const definitions = CONFIG.OBSTACLE_DEFINITIONS || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }
        let totalWeight = 0; definitions.forEach(def => totalWeight += (def.spawnWeight || 1));
        if (totalWeight === 0 && definitions.length > 0) return definitions[Math.floor(Math.random() * definitions.length)];
        if (totalWeight === 0) return null;
        let randomNum = Math.random() * totalWeight;
        for (const def of definitions) { randomNum -= (def.spawnWeight || 1); if (randomNum <= 0) return def; }
        return definitions[definitions.length - 1];
    }

    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParams = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}) { /* ... (Unchanged from previous complete version, assuming obstacle instantiation logic is correct based on prior checks) ... */
        this.obstacles = []; if (this.game) { this.game.enemyUnits = []; this.game.gameObjects = []; }
        const genConfig = CONFIG.LEVEL_GENERATION || {}; const worldMargin = genConfig.WORLD_MARGIN || 20;
        const borderWidth = genConfig.BORDER_WIDTH || 30; const borderColor = genConfig.BORDER_COLOR || '#25221D';
        this.obstacles.push({ x: 0, y: 0, width: worldWidth, height: borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity,maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: 0, y: worldHeight - borderWidth, width: worldWidth, height: borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: 0, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: worldWidth - borderWidth, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        const playableMinX = borderWidth + worldMargin; const playableMaxX = worldWidth - borderWidth - worldMargin;
        const playableMinY = borderWidth + worldMargin; const playableMaxY = worldHeight - borderWidth - worldMargin;
        const playableWidth = Math.max(0, playableMaxX - playableMinX); const playableHeight = Math.max(0, playableMaxY - playableMinY);
        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20));
        const playerSpawnZoneHeight = Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20));
        const playerSpawnZone = { x: playableMinX, y: playableMaxY - playerSpawnZoneHeight, width: playerSpawnZoneWidth, height: playerSpawnZoneHeight };
        const obsGenCfg = genConfig.OBSTACLES || {}; const baseNumObstacles = obsGenCfg.BASE_COUNT || 20;
        const worldSizeFactorFallback = obsGenCfg.WORLD_SIZE_FALLBACK_FACTOR || 1.0; const randomAdditionMax = obsGenCfg.RANDOM_ADDITION_MAX || 8;
        const numInternalObstacles = Math.floor(baseNumObstacles * (missionParams.worldSizeFactor || worldSizeFactorFallback)) + Math.floor(Math.random() * (randomAdditionMax + 1));
        const placementMaxAttempts = obsGenCfg.PLACEMENT_MAX_ATTEMPTS || 15;

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = this._getRandomObstacleTemplate();
            if (!template) {
                console.warn("Could not get obstacle template in level generation.");
                continue;
            }

            let obsWidth, obsHeight;
            let actualSpritePath = null; 
            let actualImageObject = null; 
            let actualDestroyedSpritePath = template.spriteDestroyed || null; 
            let actualDestroyedImageObject = template.spriteDestroyed ? (preloadedAssetImages[template.spriteDestroyed] || null) : null;
            let scale = 1.0; 

            let filesArray = [];
            let pathBase = '';
            let useRandomSpriteFromList = false;

            if (template.isDecoration && template.type === 'decoration_grass') {
                filesArray = CONFIG.GRASS_SPRITE_FILES || [];
                pathBase = CONFIG.GRASS_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'bush_medium') {
                filesArray = CONFIG.BUSH_SPRITES_32PX_FILES || [];
                pathBase = CONFIG.BUSH_SPRITES_32PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'bush_large') {
                filesArray = CONFIG.BUSH_SPRITES_64PX_FILES || [];
                pathBase = CONFIG.BUSH_SPRITES_64PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'rock_small') {
                filesArray = CONFIG.ROCK_SPRITES_16PX_FILES || [];
                pathBase = CONFIG.ROCK_SPRITES_16PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'rock_medium') {
                filesArray = CONFIG.ROCK_SPRITES_32PX_FILES || [];
                pathBase = CONFIG.ROCK_SPRITES_32PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'rock_large') {
                filesArray = CONFIG.ROCK_SPRITES_64PX_FILES || [];
                pathBase = CONFIG.ROCK_SPRITES_64PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'tree_palm_medium') {
                filesArray = CONFIG.PALM_TREE_MEDIUM_SPRITE_FILES || [];
                pathBase = CONFIG.PALM_TREE_MEDIUM_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'tree_palm_tall') {
                filesArray = CONFIG.PALM_TREE_TALL_SPRITE_FILES || [];
                pathBase = CONFIG.PALM_TREE_TALL_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'possum_hut') {
                filesArray = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                useRandomSpriteFromList = true; // This ensures it picks from the list for normal sprite
            } else {
                actualSpritePath = template.spriteNormal || null;
                actualImageObject = actualSpritePath ? (preloadedAssetImages[actualSpritePath] || null) : null;
            }

            if (useRandomSpriteFromList) {
                if (filesArray.length > 0 && pathBase) {
                    const randomFile = filesArray[Math.floor(Math.random() * filesArray.length)];
                    actualSpritePath = pathBase + randomFile;
                    actualImageObject = preloadedAssetImages[actualSpritePath] || null;
                } else {
                    actualSpritePath = null;
                    actualImageObject = null;
                }
                 // For types like possum_hut that use a list for normal, but have a specific destroyed sprite
                if (template.type === 'possum_hut' && template.spriteDestroyed) {
                    actualDestroyedSpritePath = template.spriteDestroyed; // Keep the specific destroyed path
                    actualDestroyedImageObject = preloadedAssetImages[template.spriteDestroyed] || null;
                }

            }


            if (template.isDecoration && template.type === 'decoration_grass') {
                const grassConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.GRASS_CLUTTER) || {};
                const minScale = grassConfig.MIN_SCALE || 0.8;
                const maxScale = grassConfig.MAX_SCALE || 1.2;
                scale = minScale + Math.random() * (maxScale - minScale);
                if (actualImageObject) { 
                    obsWidth = actualImageObject.naturalWidth * scale;
                    obsHeight = actualImageObject.naturalHeight * scale;
                } else { 
                    obsWidth = (template.width || 16) * scale; 
                    obsHeight = (template.height || 16) * scale;
                }
                actualDestroyedSpritePath = null; 
                actualDestroyedImageObject = null;
            } else if (template.width !== undefined && template.height !== undefined) {
                obsWidth = template.width;
                obsHeight = template.height;
                scale = 1.0; 
            } else {
                const minW = template.minW || 30; const maxW = template.maxW || 100;
                const minH = template.minH || (template.type === 'fence_wood' ? 10 : 30);
                const maxH = template.maxH || (template.type === 'fence_wood' ? 20 : 100);
                obsWidth = minW + Math.random() * (maxW - minW);
                if (template.height !== undefined) { 
                    obsHeight = template.height;
                } else if (template.type === 'fence_wood') { 
                    obsHeight = minH + Math.random() * (maxH - minH);
                } else { 
                    obsHeight = obsWidth * (0.6 + Math.random() * 0.8);
                }
                scale = 1.0;
            }

            let obsX, obsY;
            let attempts = 0;
            let placed = false;
            do {
                obsX = playableMinX + Math.random() * (playableWidth - obsWidth);
                obsY = playableMinY + Math.random() * (playableHeight - obsHeight);

                let collisionCheckShape;
                const TcollisionShapeDef = template.collisionShape;
                if (TcollisionShapeDef) {
                    const currentObsDims = { width: obsWidth, height: obsHeight }; 
                    if (TcollisionShapeDef.type === 'circle') {
                        collisionCheckShape = { type: 'circle',
                            x: obsX + (typeof TcollisionShapeDef.offsetX === 'function' ? TcollisionShapeDef.offsetX(currentObsDims) : (TcollisionShapeDef.offsetX || obsWidth / 2)),
                            y: obsY + (typeof TcollisionShapeDef.offsetY === 'function' ? TcollisionShapeDef.offsetY(currentObsDims) : (TcollisionShapeDef.offsetY || obsHeight / 2)),
                            radius: (typeof TcollisionShapeDef.radius === 'function' ? TcollisionShapeDef.radius(currentObsDims) : (TcollisionShapeDef.radius || Math.min(obsWidth, obsHeight) / 2))
                        };
                    } else if (TcollisionShapeDef.type === 'rectangle') {
                        collisionCheckShape = { type: 'rectangle',
                            x: obsX + (TcollisionShapeDef.offsetX || 0),
                            y: obsY + (TcollisionShapeDef.offsetY || 0),
                            width: TcollisionShapeDef.width || obsWidth,
                            height: TcollisionShapeDef.height || obsHeight
                        };
                    } else { 
                        collisionCheckShape = { type: 'rectangle', x: obsX, y: obsY, width: obsWidth, height: obsHeight };
                    }
                } else { 
                    collisionCheckShape = { type: 'rectangle', x: obsX, y: obsY, width: obsWidth, height: obsHeight };
                }
                const renderBoxForPlayerZoneCheck = { x: obsX, y: obsY, width: obsWidth, height: obsHeight };

                if (obsX < playableMinX || obsX + obsWidth > playableMaxX || obsY < playableMinY || obsY + obsHeight > playableMaxY) {
                    attempts++;
                    continue;
                }
                if (!this._rectOverlap(renderBoxForPlayerZoneCheck, playerSpawnZone) &&
                    !this.isShapeOverlappingList(collisionCheckShape, this.obstacles)) {
                    this.obstacles.push({
                        x: obsX, y: obsY, width: obsWidth, height: obsHeight,
                        type: template.type, name: template.name || template.type, color: template.color,
                        destructible: template.destructible,
                        hp: template.destructible ? template.hp : Infinity,
                        maxHp: template.destructible ? template.maxHp : Infinity,
                        isDestroyed: false,
                        blocksMovement: template.blocksMovement,
                        providesCover: template.providesCover,
                        pickupType: template.pickupType || null,
                        pickupQuantity: template.pickupQuantity || 0,
                        isPickup: !!template.pickupType,
                        isDecoration: !!template.isDecoration,
                        spriteNormalPath: actualSpritePath,
                        spriteDestroyedPath: actualDestroyedSpritePath,
                        imageNormal: actualImageObject,
                        imageDestroyed: actualDestroyedImageObject,
                        scale: scale, 
                        collisionShape: template.collisionShape || null 
                    });
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }

        const pSpawnPlaceCfg = genConfig.PLAYER_SPAWN_PLACEMENT || {}; const playerSpawnLocations = []; const playerUnitSize = CONFIG.RACCOON_SIZE || 12;
        const spawnAreaPadding = playerUnitSize * (pSpawnPlaceCfg.INTERNAL_PADDING_FACTOR || 1.5);
        const effectiveSpawnZoneX = playerSpawnZone.x + spawnAreaPadding; const effectiveSpawnZoneY = playerSpawnZone.y + spawnAreaPadding;
        const effectiveSpawnZoneWidth = Math.max(0, playerSpawnZone.width - 2 * spawnAreaPadding); const effectiveSpawnZoneHeight = Math.max(0, playerSpawnZone.height - 2 * spawnAreaPadding);
        for (let i = 0; i < numPlayerSpawnsNeeded; i++) {
            let spawnX, spawnY, isClear; let currentPlacementAttempts = 0; const maxPlayerSpawnAttempts = pSpawnPlaceCfg.MAX_ATTEMPTS || 30; let foundSpot = false;
            if (effectiveSpawnZoneWidth > playerUnitSize && effectiveSpawnZoneHeight > playerUnitSize) {
                do {
                    spawnX = effectiveSpawnZoneX + (Math.random() * effectiveSpawnZoneWidth); spawnY = effectiveSpawnZoneY + (Math.random() * effectiveSpawnZoneHeight);
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                    isClear = this.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.obstacles);
                    if (isClear) { playerSpawnLocations.push({ x: spawnX, y: spawnY }); foundSpot = true; break; } currentPlacementAttempts++;
                } while (currentPlacementAttempts < maxPlayerSpawnAttempts);
            }
            if (!foundSpot) {
                console.warn(`Could not find clear random spawn point in zone for Raccoon ${i}. Using grid fallback.`);
                const fallbackSpacing = playerUnitSize * (pSpawnPlaceCfg.FALLBACK_SPACING_FACTOR || 2.0); const spotsPerRow = Math.max(1, Math.floor(effectiveSpawnZoneWidth / fallbackSpacing));
                const row = Math.floor(i / spotsPerRow); const col = i % spotsPerRow;
                spawnX = effectiveSpawnZoneX + (col * fallbackSpacing) + playerUnitSize / 2; spawnY = effectiveSpawnZoneY + (row * fallbackSpacing) + playerUnitSize / 2;
                spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                if (spawnX > playerSpawnZone.x + playerSpawnZone.width - playerUnitSize / 2 || spawnY > playerSpawnZone.y + playerSpawnZone.height - playerUnitSize / 2 || spawnX < playerSpawnZone.x + playerUnitSize/2 || spawnY < playerSpawnZone.y + playerUnitSize/2 ) {
                    console.error(`Fallback spawn for Raccoon ${i} is outside effective player zone! Reverting to absolute fallback.`);
                    spawnX = playableMinX + playerUnitSize + (i * playerUnitSize * 2.5); spawnY = playableMaxY - playerUnitSize;
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); }
                playerSpawnLocations.push({ x: spawnX, y: spawnY });
            }
        }

        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {}; const enemyDensityFactor = missionParams.enemyDensityFactor || 1.0; const baseNumEnemies = enemySpawnCfg.BASE_ENEMY_COUNT_PER_DENSITY_FACTOR || 8;
        const randomAddMax = enemySpawnCfg.RANDOM_ADDITION_FACTOR_MAX || 5; const totalEnemiesToSpawn = Math.floor(baseNumEnemies * enemyDensityFactor) + Math.floor(Math.random() * (randomAddMax * enemyDensityFactor + 1));
        let enemiesSpawnedCount = 0; const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0; const groupSpawnAttempts = Math.ceil(totalEnemiesToSpawn / Math.max(1, avgEnemiesPerGroup));
        const heavySize = CONFIG.POSSUM_HEAVY_SIZE || 18; const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;
        for (let g = 0; g < groupSpawnAttempts && enemiesSpawnedCount < totalEnemiesToSpawn; g++) {
            const smallGroupChance = enemySpawnCfg.SMALL_GROUP_CHANCE || 0.6; const smallGroupMin = enemySpawnCfg.SMALL_GROUP_SIZE_MIN || 1; const smallGroupMax = enemySpawnCfg.SMALL_GROUP_SIZE_MAX || 3;
            let currentGroupSizeAttempt = Math.random() < smallGroupChance ? Math.floor(smallGroupMin + Math.random() * (smallGroupMax - smallGroupMin + 1)) : (smallGroupMax + Math.floor(Math.random() * 2));
            currentGroupSizeAttempt = Math.min(currentGroupSizeAttempt, totalEnemiesToSpawn - enemiesSpawnedCount); if (currentGroupSizeAttempt <= 0) continue;
            let groupLeaderX, groupLeaderY, isLeaderSpawnClear; let leaderPlacementAttempts = 0; const leaderMaxAttempts = enemySpawnCfg.LEADER_PLACEMENT_MAX_ATTEMPTS || 20;
            const minSpawnDistFromPlayerZone = enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 50; const enemySpawnMinX = playerSpawnZone.x + playerSpawnZone.width + minSpawnDistFromPlayerZone;
            const enemySpawnableWidth = Math.max(0, playableMaxX - enemySpawnMinX); if (enemySpawnableWidth <= heavySize * 2) { continue; }
            do {
                groupLeaderX = enemySpawnMinX + Math.random() * (enemySpawnableWidth - heavySize); groupLeaderY = playableMinY + Math.random() * (playableHeight - heavySize);
                groupLeaderX = Math.max(playableMinX + heavySize / 2, Math.min(groupLeaderX, playableMaxX - heavySize / 2)); groupLeaderY = Math.max(playableMinY + heavySize / 2, Math.min(groupLeaderY, playableMaxY - heavySize / 2));
                const leaderFootprint = {x: groupLeaderX - heavySize/2, y: groupLeaderY - heavySize/2, width: heavySize, height: heavySize};
                isLeaderSpawnClear = this.isSpawnPointClear(groupLeaderX, groupLeaderY, heavySize, this.obstacles) && !this._rectOverlap(leaderFootprint, playerSpawnZone); leaderPlacementAttempts++;
            } while (!isLeaderSpawnClear && leaderPlacementAttempts < leaderMaxAttempts);
            if (isLeaderSpawnClear) {
                for (let m = 0; m < currentGroupSizeAttempt && enemiesSpawnedCount < totalEnemiesToSpawn; m++) {
                    let memberX, memberY, isMemberSpawnClear; let memberPlacementAttempts = 0; const memberMaxAttempts = enemySpawnCfg.MEMBER_PLACEMENT_MAX_ATTEMPTS || 10;
                    let currentEnemyUnitSize = gruntSize; let isHeavy = false; const heavyChance = missionParams.heavyChance || (enemySpawnCfg.DEFAULT_HEAVY_CHANCE || 0.20); const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;
                    if ((m === 0 && currentGroupSizeAttempt > 0 && Math.random() < heavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0) ) || (currentGroupSizeAttempt === 1 && Math.random() < heavyChance)) { isHeavy = true; currentEnemyUnitSize = heavySize; }
                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30; const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5; const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + (Math.random() * groupSpread - groupSpread / 2); memberY = (m === 0) ? groupLeaderY : groupLeaderY + (Math.random() * groupSpread - groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2)); memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = {x: memberX - currentEnemyUnitSize/2, y: memberY - currentEnemyUnitSize/2, width: currentEnemyUnitSize, height: currentEnemyUnitSize};
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles) && !this._rectOverlap(memberFootprint, playerSpawnZone); memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);
                    if (isMemberSpawnClear) {
                        const enemyUnit = isHeavy ? new PossumHeavy(memberX, memberY, this.game, `PHVY-${enemiesSpawnedCount + 1}`) : new PossumGrunt(memberX, memberY, this.game, `PSM-${enemiesSpawnedCount + 1}`);
                        if (this.game && this.game.enemyUnits) this.game.enemyUnits.push(enemyUnit); enemiesSpawnedCount++;
                    }
                }
            }
        }

        console.log("[Level] Enemies spawned in level:", this.game.enemyUnits.length);
        if (this.game) { this.game.missionObjective = { type: missionParams.objectiveType || 'EXTERMINATE', description: missionParams.name || (CONFIG.UI_TEXT_STRINGS.DEFAULT_OBJECTIVE_TEXT || 'Eliminate all Possums!'), };}
        return playerSpawnLocations;
    }
}