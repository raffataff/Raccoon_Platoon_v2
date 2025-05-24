// js/level.js
// complete
class Level {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.navGrid = null;
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 8;
        this.gridWidth = 0;
        this.gridHeight = 0;

        this.potentialSpawnerHuts = [];
        this.activeSpawningHuts = [];
        this.hutSpawnConfig = (CONFIG.ENEMY_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING)
                            ? CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING
                            : {};
        this.timeSinceLastHutActivationCheck = 0;
        this.HUT_ACTIVATION_CHECK_INTERVAL = 1.0;
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

    _rectOverlap(rect1, rect2) { return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y); }
    isShapeOverlappingList(movingShape, existingObstacles) {
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
    isSpawnPointClear(x, y, unitSize, existingObstacles, existingUnits = []) {
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        if (this.isShapeOverlappingList(unitShape, existingObstacles)) {
            return false;
        }
        // Check against other units
        for (const unit of existingUnits) {
            if (unit.isAlive()) {
                const distSq = (x - unit.x) * (x - unit.x) + (y - unit.y) * (y - unit.y);
                if (distSq < (unitSize / 2 + unit.size / 2) * (unitSize / 2 + unit.size / 2) + (this.hutSpawnConfig.MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN || 10)) {
                    return false;
                }
            }
        }
        return true;
    }
    damageObstacle(obstacle, amount, attackerUnit = null) {
        if (!obstacle || !obstacle.destructible || obstacle.isDestroyed || obstacle.hp === undefined) {
            if (obstacle && obstacle.type === 'possum_hut') {
            }
            return;
        }
        obstacle.hp -= amount;
        if (obstacle.type === 'possum_hut') {
        }
        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;
            if (obstacle.type === 'possum_hut') {
                // Remove from active spawners if it was one
                this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== obstacle);
            }
            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);
            if (obstacleDef) {
                obstacle.blocksMovement = obstacleDef.blocksMovementOnDestroy !== undefined ? obstacleDef.blocksMovementOnDestroy : false;
                obstacle.providesCover = obstacleDef.providesCoverOnDestroy !== undefined ? obstacleDef.providesCoverOnDestroy : false;
            } else {
                obstacle.blocksMovement = false;
                obstacle.providesCover = false;
            }
            if (this.navGrid && (!obstacleDef || obstacleDef.blocksMovement)) {
                this.updateNavigationGridForObstacle(obstacle, true);
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
                        if (distToUnit <= explosionRadius + unit.size) {
                            unit.takeDamage(explosionDmg, attackerUnit);
                        }
                    }
                });
            }
        }
    }
    _getRandomObstacleTemplate() {
        const definitions = CONFIG.OBSTACLE_DEFINITIONS || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }
        let totalWeight = 0; definitions.forEach(def => totalWeight += (def.spawnWeight || 1));
        if (totalWeight === 0 && definitions.length > 0) return definitions[Math.floor(Math.random() * definitions.length)];
        if (totalWeight === 0) return null;
        let randomNum = Math.random() * totalWeight;
        for (const def of definitions) { randomNum -= (def.spawnWeight || 1); if (randomNum <= 0) return def; }
        return definitions[definitions.length - 1];
    }

    generateNavigationGrid(worldWidth, worldHeight) {
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 16;
        this.gridWidth = Math.floor(worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(worldHeight / this.gridCellSize);
        this.navGrid = [];

        console.log(`[Level] Generating NavGrid: ${this.gridWidth}x${this.gridHeight} cells of size ${this.gridCellSize}`);

        for (let y = 0; y < this.gridHeight; y++) {
            this.navGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.navGrid[y][x] = 0; // 0 = walkable, 1 = blocked
                const cellWorldX = x * this.gridCellSize;
                const cellWorldY = y * this.gridCellSize;
                const cellRect = {
                    x: cellWorldX,
                    y: cellWorldY,
                    width: this.gridCellSize,
                    height: this.gridCellSize
                };

                for (const obs of this.obstacles) {
                    if (obs.blocksMovement && !obs.isDestroyed) {
                        const obsShape = this._getObstacleCollisionShape(obs);
                        let collision = false;
                        if (obsShape.type === 'rectangle') {
                            collision = rectOverlap(cellRect, obsShape);
                        } else if (obsShape.type === 'circle') {
                            collision = rectCircleOverlap(cellRect, obsShape);
                        }
                        if (collision) {
                            this.navGrid[y][x] = 1; // Mark as blocked
                            break; // No need to check other obstacles for this cell
                        }
                    }
                }
            }
        }
        console.log("[Level] NavGrid generation complete.");
    }

    updateNavigationGridForObstacle(obstacle, isDestroyedAndNowWalkable) {
        if (!this.navGrid || !obstacle) return;

        const startGridX = Math.max(0, Math.floor(obstacle.x / this.gridCellSize) -1); // -1 for buffer
        const endGridX = Math.min(this.gridWidth -1, Math.ceil((obstacle.x + obstacle.width) / this.gridCellSize) +1);
        const startGridY = Math.max(0, Math.floor(obstacle.y / this.gridCellSize) -1);
        const endGridY = Math.min(this.gridHeight -1, Math.ceil((obstacle.y + obstacle.height) / this.gridCellSize) +1);


        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                if (y < 0 || y >= this.gridHeight || x < 0 || x >= this.gridWidth) continue;

                const cellWorldX = x * this.gridCellSize;
                const cellWorldY = y * this.gridCellSize;
                const cellRect = { x: cellWorldX, y: cellWorldY, width: this.gridCellSize, height: this.gridCellSize };

                if (isDestroyedAndNowWalkable) {
                    let stillBlocked = false;
                    for (const otherObs of this.obstacles) {
                        if (otherObs !== obstacle && otherObs.blocksMovement && !otherObs.isDestroyed) {
                            const otherObsShape = this._getObstacleCollisionShape(otherObs);
                            let collision = false;
                            if (otherObsShape.type === 'rectangle') collision = rectOverlap(cellRect, otherObsShape);
                            else if (otherObsShape.type === 'circle') collision = rectCircleOverlap(cellRect, otherObsShape);
                            if (collision) { stillBlocked = true; break; }
                        }
                    }
                    this.navGrid[y][x] = stillBlocked ? 1 : 0;
                } else {
                    const obsShape = this._getObstacleCollisionShape(obstacle);
                     let collision = false;
                    if (obsShape.type === 'rectangle') collision = rectOverlap(cellRect, obsShape);
                    else if (obsShape.type === 'circle') collision = rectCircleOverlap(cellRect, obsShape);

                    if (collision && obstacle.blocksMovement && !obstacle.isDestroyed) {
                        this.navGrid[y][x] = 1;
                    }
                }
            }
        }
    }


    getNavigationGrid() {
        if (!this.navGrid) {
            console.warn("[Level] Navigation grid requested but not yet generated!");
            if (CONFIG.WORLD_WIDTH && CONFIG.WORLD_HEIGHT) {
                this.generateNavigationGrid(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
            } else {
                return null;
            }
        }
        return this.navGrid;
    }

    worldToGridCoords(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.gridCellSize),
            y: Math.floor(worldY / this.gridCellSize)
        };
    }

    gridToWorldCoords(gridX, gridY) {
        return {
            x: gridX * this.gridCellSize + this.gridCellSize / 2,
            y: gridY * this.gridCellSize + this.gridCellSize / 2
        };
    }


    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParams = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}) {
        this.obstacles = [];
        this.potentialSpawnerHuts = []; // Reset for new level
        this.activeSpawningHuts = [];   // Reset for new level

        if (this.game) { this.game.enemyUnits = []; this.game.gameObjects = []; }

        // ... (Obstacle placement logic, largely unchanged, but ensure huts get added to this.potentialSpawnerHuts) ...
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

            //if (template.isDecoration && template.type === 'decoration_grass') {
            //    filesArray = CONFIG.GRASS_SPRITE_FILES || [];
            //    pathBase = CONFIG.GRASS_SPRITE_PATH || '';
            //    useRandomSpriteFromList = true;
            if (template.type === 'bush_medium') {
                filesArray = CONFIG.BUSH_SPRITES_32PX_FILES || [];
                pathBase = CONFIG.BUSH_SPRITES_32PX_PATH || '';
                useRandomSpriteFromList = true;
            } else if (template.type === 'bush_large') {
                filesArray = CONFIG.BUSH_SPRITES_64PX_FILES || [];
                pathBase = CONFIG.BUSH_SPRITES_64PX_PATH || '';
                useRandomSpriteFromList = true;
            //} else if (template.type === 'rock_small') {
            //    filesArray = CONFIG.ROCK_SPRITES_16PX_FILES || [];
            //    pathBase = CONFIG.ROCK_SPRITES_16PX_PATH || '';
            //    useRandomSpriteFromList = true;
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
            } else if (template.type === 'possum_hut') { // Ensure this case is distinct
                filesArray = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
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
                if (template.type === 'possum_hut' && template.spriteDestroyed) {
                    actualDestroyedSpritePath = template.spriteDestroyed;
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
                    const newObstacle = {
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
                        collisionShape: template.collisionShape || null,
                        // Hut specific spawning properties
                        isSpawner: template.type === 'possum_hut', // Or check template.isSpawner
                        spawnCooldownTimer: 0,
                        isActivelySpawning: false // Huts start inactive
                    };
                    this.obstacles.push(newObstacle);
                    if (newObstacle.isSpawner) {
                        this.potentialSpawnerHuts.push(newObstacle);
                    }
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }

        this.generateNavigationGrid(worldWidth, worldHeight);

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
                    isClear = this.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.obstacles, this.game.deployedSquadRoster);
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
                isLeaderSpawnClear = this.isSpawnPointClear(groupLeaderX, groupLeaderY, heavySize, this.obstacles, this.game.enemyUnits) && !this._rectOverlap(leaderFootprint, playerSpawnZone); leaderPlacementAttempts++;
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
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles, this.game.enemyUnits) && !this._rectOverlap(memberFootprint, playerSpawnZone); memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);
                    if (isMemberSpawnClear) {
                        const enemyUnit = isHeavy ? new PossumHeavy(memberX, memberY, this.game, `PHVY-${enemiesSpawnedCount + 1}`) : new PossumGrunt(memberX, memberY, this.game, `PSM-${enemiesSpawnedCount + 1}`);
                        if (this.game && this.game.enemyUnits) this.game.enemyUnits.push(enemyUnit); enemiesSpawnedCount++;
                    }
                }
            }
        }

        console.log("[Level] Initial enemies spawned:", this.game.enemyUnits.length);
        if (this.game) { this.game.missionObjective = { type: missionParams.objectiveType || 'EXTERMINATE', description: missionParams.name || (CONFIG.UI_TEXT_STRINGS.DEFAULT_OBJECTIVE_TEXT || 'Eliminate all Possums!'), };}
        return playerSpawnLocations;
    }

    // --- NEW Hut Spawning Logic ---
    updateHutSpawning(deltaTime) {
        if (!this.game || !this.game.deployedSquadRoster || this.game.deployedSquadRoster.length === 0) {
            return; // No players, no spawning
        }
        if (!this.hutSpawnConfig || Object.keys(this.hutSpawnConfig).length === 0) return; // No config

        this.timeSinceLastHutActivationCheck += deltaTime;

        // 1. Activate/Deactivate Huts based on Proximity
        if (this.timeSinceLastHutActivationCheck >= this.HUT_ACTIVATION_CHECK_INTERVAL) {
            this.timeSinceLastHutActivationCheck = 0;
            const maxAllowedActive = Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE +
                                   (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));

            // Check inactive huts to activate
            for (const hut of this.potentialSpawnerHuts) {
                if (hut.isDestroyed || hut.isActivelySpawning) continue;

                if (this.activeSpawningHuts.length < maxAllowedActive) {
                    let playerNearby = false;
                    for (const playerUnit of this.game.deployedSquadRoster) {
                        if (playerUnit.isAlive() && distance(playerUnit.x, playerUnit.y, hut.x + hut.width / 2, hut.y + hut.height / 2) < (this.hutSpawnConfig.PLAYER_PROXIMITY_TRIGGER_RADIUS || 300)) {
                            playerNearby = true;
                            break;
                        }
                    }
                    if (playerNearby) {
                        hut.isActivelySpawning = true;
                        hut.spawnCooldownTimer = (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5) + Math.random() * ((this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX || 10) - (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5));
                        this.activeSpawningHuts.push(hut);
                        if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Hut at (${hut.x},${hut.y}) activated. Initial spawn in ${hut.spawnCooldownTimer.toFixed(1)}s`);
                    }
                }
            }

            // Check active huts to deactivate (optional - if too far from player)
            // For now, once active, they stay active unless destroyed.
        }

        // 2. Process Active Huts for Spawning
        for (let i = this.activeSpawningHuts.length - 1; i >= 0; i--) {
            const hut = this.activeSpawningHuts[i];
            if (hut.isDestroyed) {
                this.activeSpawningHuts.splice(i, 1);
                continue;
            }

            hut.spawnCooldownTimer -= deltaTime;
            if (hut.spawnCooldownTimer <= 0) {
                this.attemptSpawnFromHut(hut);
                hut.spawnCooldownTimer = (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS || 15) + Math.random() * ((this.hutSpawnConfig.SPAWN_COOLDOWN_MAX_SECONDS || 30) - (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS || 15));
                 if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Hut at (${hut.x},${hut.y}) triggered spawn. Next spawn in ${hut.spawnCooldownTimer.toFixed(1)}s`);
            }
        }
    }

    attemptSpawnFromHut(hut) {
        const numToSpawnBaseMin = this.hutSpawnConfig.UNITS_PER_SPAWN_MIN || 1;
        const numToSpawnBaseMax = this.hutSpawnConfig.UNITS_PER_SPAWN_MAX || 2;
        const phaseIncrement = this.hutSpawnConfig.UNITS_PER_SPAWN_PHASE_INCREMENT || 0;

        let currentMinUnits = Math.max(1, Math.floor(numToSpawnBaseMin + (this.game.currentPhaseIndex * phaseIncrement)));
        let currentMaxUnits = Math.max(currentMinUnits, Math.floor(numToSpawnBaseMax + (this.game.currentPhaseIndex * phaseIncrement)));

        const numToSpawn = Math.floor(currentMinUnits + Math.random() * (currentMaxUnits - currentMinUnits + 1));

        if (numToSpawn <= 0) return;

        if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Hut (${hut.name || hut.type} at ${hut.x.toFixed(0)},${hut.y.toFixed(0)}) attempting to spawn ${numToSpawn} units.`);

        const hutCenterX = hut.x + hut.width / 2;
        const hutBottomEdgeY = hut.y + hut.height;

        const spawnOffsetX = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
        const spawnOffsetY = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0; // Negative for "up" from bottom
        const spawnAreaWidth = this.hutSpawnConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;

        const spawnCenterY = hutBottomEdgeY + spawnOffsetY; // Actual Y coord for spawning
        const spawnLineCenterX = hutCenterX + spawnOffsetX;
        const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;

        let unitsSpawnedThisEvent = 0;
        const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;
        const maxPlacementAttemptsPerUnit = this.hutSpawnConfig.MAX_SPAWN_ATTEMPTS_PER_HUT_EVENT || 5;

        for (let i = 0; i < numToSpawn; i++) {
            let spawnX, spawnClear = false;
            for (let attempt = 0; attempt < maxPlacementAttemptsPerUnit; attempt++) {
                spawnX = spawnLineMinX + Math.random() * spawnAreaWidth;
                spawnX = Math.max(gruntSize/2, Math.min(spawnX, (CONFIG.WORLD_WIDTH || 0) - gruntSize/2));
                const clampedSpawnY = Math.max(gruntSize/2, Math.min(spawnCenterY, (CONFIG.WORLD_HEIGHT || 0) - gruntSize/2));

                if (this.isSpawnPointClear(spawnX, clampedSpawnY, gruntSize, this.obstacles, this.game.enemyUnits)) {
                    spawnClear = true;
                    break;
                }
            }

            if (spawnClear) {
                const newGrunt = new PossumGrunt(spawnX, spawnCenterY, this.game, `PSM-HUT-${this.game.enemyUnits.length + 1}`);
                newGrunt.isPhasing = true;
                newGrunt.phasingTimer = this.hutSpawnConfig.SPAWN_PHASING_DURATION || 1.0;

                const moveOutDist = this.hutSpawnConfig.INITIAL_MOVE_OUT_DISTANCE || 50;
                // Move directly "down" (positive Y) from the spawn point, or slightly away from hut center
                let angleFromSpawn = Math.PI / 2; // Default to straight down
                if(distance(spawnX, spawnCenterY, hutCenterX, hut.y + hut.height/2) > 10) { // If not spawning right at hut center
                     angleFromSpawn = Math.atan2(spawnCenterY - (hut.y + hut.height/2), spawnX - hutCenterX);
                }


                let initialTargetX = spawnX + Math.cos(angleFromSpawn) * moveOutDist;
                let initialTargetY = spawnCenterY + Math.sin(angleFromSpawn) * moveOutDist;

                initialTargetX = Math.max(gruntSize/2, Math.min(initialTargetX, (CONFIG.WORLD_WIDTH || 0) - gruntSize/2));
                initialTargetY = Math.max(gruntSize/2, Math.min(initialTargetY, (CONFIG.WORLD_HEIGHT || 0) - gruntSize/2));

                newGrunt.setMoveTarget(initialTargetX, initialTargetY);

                this.game.enemyUnits.push(newGrunt);
                unitsSpawnedThisEvent++;
                if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`  Spawned Grunt at (${spawnX.toFixed(0)},${spawnCenterY.toFixed(0)}). Phasing for ${newGrunt.phasingTimer}s. Initial move to (${initialTargetX.toFixed(0)}, ${initialTargetY.toFixed(0)})`);
            } else {
                if(CONFIG.DEBUG_PATHING_UNIT_ID) console.warn(`  Could not find clear spawn point for unit ${i+1} from hut.`);
            }
        }
         if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Hut spawned ${unitsSpawnedThisEvent} units.`);
    }

    renderHutSpawnAreas(ctx) {
        if (!this.hutSpawnConfig.DEBUG_DRAW_SPAWN_AREAS) return;

        ctx.save();
        const originalAlpha = ctx.globalAlpha; // Store original alpha
        ctx.globalAlpha = 0.5; // Set alpha for debug drawing
        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'; // Magenta, more opaque for visibility

        for (const hut of this.potentialSpawnerHuts) {
            if (hut.isDestroyed) continue;

            const hutCenterX = hut.x + hut.width / 2;
            const hutBottomEdgeY = hut.y + hut.height;

            const spawnOffsetX = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
            const spawnOffsetY = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
            const spawnAreaWidth = this.hutSpawnConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;

            const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
            const spawnLineCenterX = hutCenterX + spawnOffsetX;
            const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;

            // Draw a small rectangle representing the spawn "line" or "door" area
            const debugSpawnHeight = (CONFIG.POSSUM_GRUNT_SIZE || 14) * 0.5; // Make it a thin line
            ctx.fillRect(spawnLineMinX, spawnCenterY - debugSpawnHeight / 2, spawnAreaWidth, debugSpawnHeight);

            if (hut.isActivelySpawning) {
                ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // Orange for active spawner hut itself
                ctx.beginPath();
                ctx.arc(hut.x + hut.width / 2, hut.y + hut.height / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'; // Reset for next hut's spawn area
            }
        }
        ctx.globalAlpha = originalAlpha; // Restore original alpha
        ctx.restore();
    }
}