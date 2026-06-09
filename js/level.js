// js/level.js

class Level {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.navGrid = null;
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 8;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.rng = null;

        this.playerSpawnZone = null;
        this.effectivePlayerSpawnZone = null;

        this.potentialSpawnerHuts = [];
        this.activeSpawningHuts = [];
        this.hutSpawnConfig = (CONFIG.ENEMY_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING)
                            ? CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING
                            : {};
        this.barracksSpawnConfig = (CONFIG.ENEMY_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_BARRACKS_SPAWNING)
                            ? CONFIG.ENEMY_SPAWNING.POSSUM_BARRACKS_SPAWNING
                            : {};
        this.timeSinceLastHutActivationCheck = 0;
        this.HUT_ACTIVATION_CHECK_INTERVAL = 1.0;
        this.initialHostageCount = 0; 
        this.missionTargetObstacles = [];
        this.activeObstacles = [];
        this.obstacleSet = new WeakSet();

        // --- NEW: Add property to store quadrant data ---
        this.quadrantBoundaries = null;
        // --- END NEW ---

        // Explosion propagation queue for wave-based chain reactions
        this.explosionQueue = [];
        this.explosionWaveSpeed = 250; // pixels per second - speed of the shockwave
        this.explosionWaveDelay = 0.05; // minimum delay between chained explosions (seconds)

        this.levelGenerator = new LevelGenerator(this);
    }
    
    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParamsContainer, numPlayerSpawnsNeeded, preloadedAssetImages, missionSeed) {
        return this.levelGenerator.generate(worldWidth, worldHeight, missionParamsContainer, numPlayerSpawnsNeeded, preloadedAssetImages, missionSeed);
    }
    
    _resolveSingleCollisionShape(shapeDef, obstacle) {
        const obsCurrentWidth = obstacle.width;
        const obsCurrentHeight = obstacle.height;

        if (shapeDef.type === 'rectangle') {
            let offsetX = typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || 0);
            let offsetY = typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || 0);
            if (obstacle.isFlippedHorizontally) {
                offsetX = obsCurrentWidth - offsetX - (typeof shapeDef.width === 'function' ? shapeDef.width(obsCurrentWidth, obsCurrentHeight) : (shapeDef.width || obsCurrentWidth));
            }
            let rotation = shapeDef.rotation !== undefined ? shapeDef.rotation : 0;
            if (obstacle.isFlippedHorizontally) {
                rotation = -rotation;
            }
            const width = (typeof shapeDef.width === 'function' ? shapeDef.width(obsCurrentWidth, obsCurrentHeight) : (shapeDef.width || obsCurrentWidth));
            const height = (typeof shapeDef.height === 'function' ? shapeDef.height(obsCurrentWidth, obsCurrentHeight) : (shapeDef.height || obsCurrentHeight));
            return {
                type: 'rectangle',
                x: obstacle.x + offsetX,
                y: obstacle.y + offsetY,
                width: width,
                height: height,
                rotation: rotation
            };
        } else if (shapeDef.type === 'circle') {
            let offsetX = typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || obsCurrentWidth / 2);
            if (obstacle.isFlippedHorizontally) {
                offsetX = obsCurrentWidth - offsetX;
            }
            return {
                type: 'circle',
                x: obstacle.x + offsetX,
                y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || obsCurrentHeight / 2)),
                radius: (typeof shapeDef.radius === 'function' ? shapeDef.radius(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radius || Math.min(obsCurrentWidth, obsCurrentHeight) / 2))
            };
        } else if (shapeDef.type === 'ellipse') {
            let offsetX = typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || obsCurrentWidth / 2);
            if (obstacle.isFlippedHorizontally) {
                offsetX = obsCurrentWidth - offsetX;
            }
            return {
                type: 'ellipse',
                x: obstacle.x + offsetX,
                y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || obsCurrentHeight / 2)),
                radiusX: (typeof shapeDef.radiusX === 'function' ? shapeDef.radiusX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radiusX || obsCurrentWidth / 2)),
                radiusY: (typeof shapeDef.radiusY === 'function' ? shapeDef.radiusY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radiusY || obsCurrentHeight / 2))
            };
        }
        return null;
    }

    _getObstacleCollisionShape(obstacle) {
        if (obstacle.collisionShapes && Array.isArray(obstacle.collisionShapes) && obstacle.collisionShapes.length > 0) {
            const shapes = [];
            for (const shapeDef of obstacle.collisionShapes) {
                const resolved = this._resolveSingleCollisionShape(shapeDef, obstacle);
                if (resolved) shapes.push(resolved);
            }
            if (shapes.length > 0) return shapes;
        }

        if (obstacle.collisionShape) {
            const resolved = this._resolveSingleCollisionShape(obstacle.collisionShape, obstacle);
            if (resolved) return [resolved];
        }

        if (obstacle.type === (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE) || 
            obstacle.type === 'border_wall' || 
            obstacle.type === 'extraction_zone') { 
             return [{ type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height, rotation: 0 }];
        }
        return [{ type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height, rotation: 0 }];
    }

    _resolveSpawnArea(spawnAreaDef, obstacle) {
        if (!spawnAreaDef) return null;
        const obsCurrentWidth = obstacle.width;
        const obsCurrentHeight = obstacle.height;

        if (spawnAreaDef.type === 'rectangle') {
            let offsetX = typeof spawnAreaDef.offsetX === 'function' ? spawnAreaDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (spawnAreaDef.offsetX || 0);
            let offsetY = typeof spawnAreaDef.offsetY === 'function' ? spawnAreaDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (spawnAreaDef.offsetY || 0);
            if (obstacle.isFlippedHorizontally) {
                offsetX = obsCurrentWidth - offsetX - (typeof spawnAreaDef.width === 'function' ? spawnAreaDef.width(obsCurrentWidth, obsCurrentHeight) : (spawnAreaDef.width || obsCurrentWidth));
            }
            const width = (typeof spawnAreaDef.width === 'function' ? spawnAreaDef.width(obsCurrentWidth, obsCurrentHeight) : (spawnAreaDef.width || obsCurrentWidth));
            const height = (typeof spawnAreaDef.height === 'function' ? spawnAreaDef.height(obsCurrentWidth, obsCurrentHeight) : (spawnAreaDef.height || obsCurrentHeight));
            return {
                type: 'rectangle',
                x: obstacle.x + offsetX,
                y: obstacle.y + offsetY,
                width: width,
                height: height
            };
        }
        return null;
    }

    getObstacleSpawnArea(obstacle) {
        if (!obstacle.spawnArea) return null;
        return this._resolveSpawnArea(obstacle.spawnArea, obstacle);
    }

    _rectOverlap(rect1, rect2) {
        return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y);
    }
    
    isSpawnPointClear(x, y, unitSize, existingObstacles, existingUnits = []) {
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        const movementBlockingObstacles = existingObstacles.filter(obs => obs.blocksMovement && !obs.isDestroyed);
        if (this.levelGenerator._isPlacementInvalid(unitShape, { isDecoration: false }, movementBlockingObstacles)) {
            return false;
        }

        for (const unit of existingUnits) {
            // Defensive check: skip invalid units that don't have isAlive method
            if (!unit || typeof unit.isAlive !== 'function') {
//                console.warn('isSpawnPointClear: Skipping invalid unit in existingUnits:', unit,
//                    '- unit type:', unit?.constructor?.name, '- has hp:', unit?.hp, '- has x:', unit?.x);
                continue;
            }
            if (unit.isAlive()) {
                const distSq = (x - unit.x) * (x - unit.x) + (y - unit.y) * (y - unit.y);
                const minSeparationDist = (unitSize / 2 + unit.size / 2) + (this.hutSpawnConfig.MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN || 5); 
                if (distSq < minSeparationDist * minSeparationDist) {
                    return false;
                }
            }
        }
        return true;
    }

    damageObstacle(obstacle, amount, attackerUnit = null) {
        if (!obstacle || !obstacle.destructible || obstacle.isDestroyed || obstacle.hp === undefined) {
            return;
        }
        const wasAlive = obstacle.hp > 0;

        obstacle.hp -= amount;

        if (wasAlive && (obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round' || obstacle.type === 'empty_possum_hut_round' || obstacle.type === 'possum_barracks_1') && obstacle.hp > 0 && !obstacle.isDestroyed) {
            const isSpawner = this.potentialSpawnerHuts.includes(obstacle) || this.activeSpawningHuts.includes(obstacle);
            if (obstacle.isMissionTarget || isSpawner) {
                if (!obstacle.damageSpawnCooldown || obstacle.damageSpawnCooldown <= 0) {
                    const spawnerConfig = this.getSpawnerConfig(obstacle);
                    obstacle.delayedDamageSpawnTimer = (spawnerConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE || 0.5) + (Math.random() * 0.3 - 0.15);
                    obstacle.damageSpawnCooldown = (spawnerConfig.MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS || 5.0);
                    
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] ${obstacle.type} ${obstacle.name || obstacle.id} shot! Scheduling damage spawn in ${obstacle.delayedDamageSpawnTimer.toFixed(1)}s.`);

                    if (!this.activeSpawningHuts.includes(obstacle) && this.potentialSpawnerHuts.includes(obstacle)) {
                        const isBarracks = obstacle.type === 'possum_barracks_1';
                        const maxAllowedActive = isBarracks
                            ? Math.floor((spawnerConfig.MAX_ACTIVE_SPAWNING_BARRACKS_BASE || 0) + (this.game.currentPhaseIndex * (spawnerConfig.MAX_ACTIVE_SPAWNING_BARRACKS_INCREMENT_PER_PHASE || 0)))
                            : Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE + (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));
                        if (this.activeSpawningHuts.length < maxAllowedActive) {
                            obstacle.isActivelySpawning = true;
                            this.activeSpawningHuts.push(obstacle);
                        }
                    }
                }
            }
        }

        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;
            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);

            const treeFallSettings = CONFIG.LEVEL_GENERATION?.TREE_FALL_SETTINGS;
            const hasFallenTreeType = !!(obstacleDef?.fallenTreeType);
            const isPalmTree = obstacle.type.startsWith('tree_palm');
            const isDeciduousTree = obstacle.type.startsWith('tree_deciduous');
            if ((hasFallenTreeType || isPalmTree || isDeciduousTree) && treeFallSettings?.ENABLED && obstacle.willSpawnLog && obstacle.precomputedLogSpawnData) {
                this._spawnFallenTree(obstacle.precomputedLogSpawnData);
            }

            if (obstacleDef && obstacleDef.sfxOnDestroy && this.game && this.game.audioManager) {
                this.game.audioManager.play(obstacleDef.sfxOnDestroy);
            } 
            else if ((obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round' || obstacle.type === 'possum_barracks_1') && this.game && this.game.audioManager && !obstacleDef?.sfxOnDestroy) {
                this.game.audioManager.play('POSSUM_HUT_DESTROYED');
            }
            
if (obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round' || obstacle.type === 'empty_possum_hut_round' || obstacle.type === 'possum_barracks_1') { 
                this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== obstacle);
                const potIndex = this.potentialSpawnerHuts.indexOf(obstacle);
                if (potIndex > -1) this.potentialSpawnerHuts.splice(potIndex, 1);
                obstacle.spawnCooldownTimer = 0;
                obstacle.isActivelySpawning = false;
                obstacle.unitsToSpawnThisBurst = 0;
                obstacle.timeUntilNextUnitInBurst = 0;
                obstacle.delayedDamageSpawnTimer = 0;
                obstacle.damageSpawnCooldown = 0;
            }
            
            if (obstacleDef) {
                obstacle.blocksMovement = obstacleDef.blocksMovementOnDestroy !== undefined ? obstacleDef.blocksMovementOnDestroy : false;
                obstacle.providesCover = obstacleDef.providesCoverOnDestroy !== undefined ? obstacleDef.providesCoverOnDestroy : false;
                if (obstacleDef.collisionShapeDestroyed) {
                    obstacle.collisionShape = obstacleDef.collisionShapeDestroyed;
                } else if (obstacle.treeStumpType) {
                    const stumpDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.treeStumpType);
                    if (stumpDef && stumpDef.collisionShape) {
                        obstacle.collisionShape = stumpDef.collisionShape;
                    } else if (obstacle.blocksMovement === false) {
                        obstacle.collisionShape = null;
                    }
                } else if (obstacle.blocksMovement === false) {
                    obstacle.collisionShape = null;
                }
            } else { 
                obstacle.blocksMovement = false;
                obstacle.providesCover = false;
                obstacle.collisionShape = null;
            }

            if (this.navGrid) {
                this.updateNavigationGridForObstacle(obstacle, true);
            }

            this.rebuildActiveObstacles();

            if (this.game && obstacleDef && obstacleDef.explosionDamage && obstacleDef.explosionAoeRadius) {
                this.game.addVisualEffect('barrel_explosion', { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2, radius: obstacleDef.explosionAoeRadius });
                if (obstacleDef.flameCount && obstacleDef.flameCount > 0) {
                    this.game.addVisualEffect('fire', { anchorObstacle: obstacle, flameCount: obstacleDef.flameCount, flameOffsetY: obstacleDef.flameOffsetY || 0 });
                }
                const explosionDmg = obstacleDef.explosionDamage;
                const explosionRadius = obstacleDef.explosionAoeRadius;
                const explosionCenterX = obstacle.x + obstacle.width / 2;
                const explosionCenterY = obstacle.y + obstacle.height / 2;

                (this.obstacles || []).forEach(otherObs => {
                    if (otherObs !== obstacle && otherObs.destructible && !otherObs.isDestroyed &&
                        (otherObs.type === 'explosive_barrel' || otherObs.type === 'explosive_barrel_double' ||
                         otherObs.type === 'explosive_barrel_cluster')) {
                        const centerObsX = otherObs.x + otherObs.width / 2;
                        const centerObsY = otherObs.y + otherObs.height / 2;
                        const dist = distance(explosionCenterX, explosionCenterY, centerObsX, centerObsY);
                        const hitRadius = explosionRadius + (otherObs.width + otherObs.height) / 4;

                        if (dist < hitRadius) {
                            const delay = Math.max(
                                this.explosionWaveDelay,
                                dist / this.explosionWaveSpeed
                            );
                            const alreadyQueued = this.explosionQueue && this.explosionQueue.some(q => q.obstacle === otherObs);
                            if (!alreadyQueued) {
                                this.explosionQueue.push({
                                    obstacle: otherObs,
                                    damage: explosionDmg,
                                    attackerUnit: attackerUnit,
                                    remainingDelay: delay
                                });
                            }
                        }
                    }
                });

                const allUnits = this.game.getLivingPlayerControlledUnits().concat(this.game.enemyUnits || []);
                allUnits.forEach(unit => {
                    if (unit.isAlive()) {
                        const distToUnit = distance(explosionCenterX, explosionCenterY, unit.x, unit.y);
                        if (distToUnit <= explosionRadius + unit.size) {
                            unit.takeDamage(explosionDmg, attackerUnit);
                        }
                    }
                });
            }
        }
    }

    _spawnFallenTree(precomputedData) {
        const { type: fallenLogType, angle, distance, stumpBottomCenterX, stumpBottomCenterY } = precomputedData;
        const fallenLogTemplate = CONFIG.OBSTACLE_DEFINITIONS.find(def => def.type === fallenLogType);
        if (!fallenLogTemplate) return;

        let filesArray = null;
        let pathBase = null;
        if (CONFIG.BIOMES) {
            for (const biomeKey of Object.keys(CONFIG.BIOMES)) {
                const biome = CONFIG.BIOMES[biomeKey];
                if (biome.spritePaths && biome.spritePaths[fallenLogType]) {
                    filesArray = biome.spritePaths[fallenLogType].files || [];
                    pathBase = biome.spritePaths[fallenLogType].path || '';
                    break;
                }
            }
        }
        if (!filesArray) {
            const legacySpriteConfig = {
                tree_palm2_fallen: { files: CONFIG.PALM2_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM2_TREE_FALLEN_SPRITE_PATH },
                tree_deciduous_fallen: { files: CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_FILES, path: CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_PATH },
                tree_palm_fallen: { files: CONFIG.PALM_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM_TREE_FALLEN_SPRITE_PATH },
            };
            const legacy = legacySpriteConfig[fallenLogType];
            if (legacy) {
                filesArray = legacy.files || [];
                pathBase = legacy.path || '';
            }
        }
        if (!filesArray || !pathBase) return;

        const actualSpritePath = filesArray.length > 0 ? pathBase + this.rng.pickFrom(filesArray) : null;
        const logImage = actualSpritePath ? this.game.preloadedImages[actualSpritePath] : null;
        if (!logImage) return;

        const logWidth = logImage.naturalWidth * (fallenLogTemplate.spriteScale || 1.0);
        const logHeight = logImage.naturalHeight * (fallenLogTemplate.spriteScale || 1.0);

        const logX = stumpBottomCenterX + Math.cos(angle) * distance - logWidth / 2;
        const logY = stumpBottomCenterY + Math.sin(angle) * distance - logHeight / 2;

        const newLogObstacle = {
            x: logX, y: logY, width: logWidth, height: logHeight,
            type: fallenLogTemplate.type, name: fallenLogTemplate.name, color: fallenLogTemplate.color,
            destructible: fallenLogTemplate.destructible, hp: fallenLogTemplate.hp, maxHp: fallenLogTemplate.maxHp,
            isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false,
            spriteNormalPath: actualSpritePath, imageNormal: logImage, spriteScale: fallenLogTemplate.spriteScale || 1.0,
            collisionShape: fallenLogTemplate.collisionShape,
        };

        this.obstacles.push(newLogObstacle);
        this.obstacleSet.add(newLogObstacle);
        this.game.spatialGrid.addObject(newLogObstacle);
        this.updateNavigationGridForObstacle(newLogObstacle, false);
        this.rebuildActiveObstacles();
    }

     generateNavigationGrid(worldWidth, worldHeight) {
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 16;
        this.gridWidth = Math.floor(worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(worldHeight / this.gridCellSize);
        this.navGrid = [];

        // Initialize grid with all walkable cells
        for (let y = 0; y < this.gridHeight; y++) {
            this.navGrid[y] = new Uint8Array(this.gridWidth);
        }

        const maxUnitSize = Math.max(
            CONFIG.RACCOON_SIZE || 20,
            CONFIG.POSSUM_GRUNT_SIZE || 14,
            CONFIG.POSSUM_HEAVY_SIZE || 18,
            CONFIG.POSSUM_SNIPER_SIZE || 14,
            CONFIG.POSSUM_ELITE_SIZE || 15
        );
        const unitClearanceRadius = (maxUnitSize / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);

        // OPTIMIZED: Rasterize each obstacle onto the grid instead of checking every cell
        for (const obs of this.obstacles) {
            if (!obs.blocksMovement || obs.isDestroyed) continue;

            const obsShapeOrShapes = this._getObstacleCollisionShape(obs);
            if (!obsShapeOrShapes) continue;
            const shapesArray = Array.isArray(obsShapeOrShapes) ? obsShapeOrShapes : [obsShapeOrShapes];

            for (const obsShape of shapesArray) {
                // Inflate shape by unit clearance radius and calculate bounds
                let inflatedShape;
                let minX, maxX, minY, maxY;

                if (obsShape.type === 'rectangle') {
                    inflatedShape = {
                        type: 'rectangle',
                        x: obsShape.x - unitClearanceRadius,
                        y: obsShape.y - unitClearanceRadius,
                        width: obsShape.width + 2 * unitClearanceRadius,
                        height: obsShape.height + 2 * unitClearanceRadius,
                        rotation: obsShape.rotation || 0
                    };
                    minX = inflatedShape.x;
                    maxX = inflatedShape.x + inflatedShape.width;
                    minY = inflatedShape.y;
                    maxY = inflatedShape.y + inflatedShape.height;
                } else if (obsShape.type === 'circle') {
                    inflatedShape = {
                        type: 'circle',
                        x: obsShape.x,
                        y: obsShape.y,
                        radius: (obsShape.radius || 0) + unitClearanceRadius
                    };
                    minX = inflatedShape.x - inflatedShape.radius;
                    maxX = inflatedShape.x + inflatedShape.radius;
                    minY = inflatedShape.y - inflatedShape.radius;
                    maxY = inflatedShape.y + inflatedShape.radius;
                } else if (obsShape.type === 'ellipse') {
                    inflatedShape = {
                        type: 'ellipse',
                        x: obsShape.x,
                        y: obsShape.y,
                        radiusX: (obsShape.radiusX || 0) + unitClearanceRadius,
                        radiusY: (obsShape.radiusY || 0) + unitClearanceRadius
                    };
                    minX = inflatedShape.x - inflatedShape.radiusX;
                    maxX = inflatedShape.x + inflatedShape.radiusX;
                    minY = inflatedShape.y - inflatedShape.radiusY;
                    maxY = inflatedShape.y + inflatedShape.radiusY;
                } else {
                    continue;
                }

                // Convert bounds to grid coordinates
                const startGridX = Math.max(0, Math.floor(minX / this.gridCellSize));
                const endGridX = Math.min(this.gridWidth - 1, Math.ceil(maxX / this.gridCellSize));
                const startGridY = Math.max(0, Math.floor(minY / this.gridCellSize));
                const endGridY = Math.min(this.gridHeight - 1, Math.ceil(maxY / this.gridCellSize));

                // Mark blocked cells
                for (let gy = startGridY; gy <= endGridY; gy++) {
                    for (let gx = startGridX; gx <= endGridX; gx++) {
                        if (this.navGrid[gy][gx] === 1) continue; // Already blocked

                        const cellCenterX = gx * this.gridCellSize + this.gridCellSize / 2;
                        const cellCenterY = gy * this.gridCellSize + this.gridCellSize / 2;

                        let collision = false;
                        if (inflatedShape.type === 'rectangle') {
                            collision = pointInRectangle(cellCenterX, cellCenterY, inflatedShape);
                        } else if (inflatedShape.type === 'circle') {
                            collision = pointInCircle(cellCenterX, cellCenterY, inflatedShape);
                        } else if (inflatedShape.type === 'ellipse') {
                            collision = pointInEllipse(cellCenterX, cellCenterY, inflatedShape);
                        }

                        if (collision) {
                            this.navGrid[gy][gx] = 1;
                        }
                    }
                }
            }
        }
    }

     updateNavigationGridForObstacle(obstacle, isDestroyedAndNowWalkable) {
        if (!this.navGrid || !obstacle) return;

        // Calculate max unit size to ensure all units can pathfind correctly
        const maxUnitSize = Math.max(
            CONFIG.RACCOON_SIZE || 12,
            CONFIG.POSSUM_GRUNT_SIZE || 14,
            CONFIG.POSSUM_HEAVY_SIZE || 18,
            CONFIG.POSSUM_SNIPER_SIZE || 14,
            CONFIG.POSSUM_ELITE_SIZE || 15
        );
        const unitClearanceRadius = (maxUnitSize / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 12);

        const obsShapesForBounds = this._getObstacleCollisionShape(obstacle);
        let minObsX, maxObsX, minObsY, maxObsY;

        if (!obsShapesForBounds || (Array.isArray(obsShapesForBounds) && obsShapesForBounds.length === 0)) { 
            minObsX = obstacle.x; maxObsX = obstacle.x + obstacle.width;
            minObsY = obstacle.y; maxObsY = obstacle.y + obstacle.height;
        } else {
            const shapesArray = Array.isArray(obsShapesForBounds) ? obsShapesForBounds : [obsShapesForBounds];
            minObsX = Infinity; maxObsX = -Infinity; minObsY = Infinity; maxObsY = -Infinity;
            for (const obsShapeForBounds of shapesArray) {
                let sMinX, sMaxX, sMinY, sMaxY;
                if (obsShapeForBounds.type === 'rectangle') {
                    sMinX = obsShapeForBounds.x; sMaxX = obsShapeForBounds.x + obsShapeForBounds.width;
                    sMinY = obsShapeForBounds.y; sMaxY = obsShapeForBounds.y + obsShapeForBounds.height;
                } else if (obsShapeForBounds.type === 'circle') {
                    sMinX = obsShapeForBounds.x - obsShapeForBounds.radius; sMaxX = obsShapeForBounds.x + obsShapeForBounds.radius;
                    sMinY = obsShapeForBounds.y - obsShapeForBounds.radius; sMaxY = obsShapeForBounds.y + obsShapeForBounds.radius;
                } else if (obsShapeForBounds.type === 'ellipse') {
                    sMinX = obsShapeForBounds.x - obsShapeForBounds.radiusX; sMaxX = obsShapeForBounds.x + obsShapeForBounds.radiusX;
                    sMinY = obsShapeForBounds.y - obsShapeForBounds.radiusY; sMaxY = obsShapeForBounds.y + obsShapeForBounds.radiusY;
                } else {
                    sMinX = obstacle.x; sMaxX = obstacle.x + obstacle.width;
                    sMinY = obstacle.y; sMaxY = obstacle.y + obstacle.height;
                }
                if (sMinX < minObsX) minObsX = sMinX;
                if (sMaxX > maxObsX) maxObsX = sMaxX;
                if (sMinY < minObsY) minObsY = sMinY;
                if (sMaxY > maxObsY) maxObsY = sMaxY;
            }
        }

        const updateMargin = Math.ceil(unitClearanceRadius / this.gridCellSize) + 1;
        const startGridX = Math.max(0, Math.floor(minObsX / this.gridCellSize) - updateMargin); 
        const endGridX = Math.min(this.gridWidth -1, Math.ceil(maxObsX / this.gridCellSize) + updateMargin);
        const startGridY = Math.max(0, Math.floor(minObsY / this.gridCellSize) - updateMargin);
        const endGridY = Math.min(this.gridHeight -1, Math.ceil(maxObsY / this.gridCellSize) + updateMargin);


        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                if (y < 0 || y >= this.gridHeight || x < 0 || x >= this.gridWidth) continue;

                const cellCenterX = x * this.gridCellSize + this.gridCellSize / 2;
                const cellCenterY = y * this.gridCellSize + this.gridCellSize / 2;
                
                // Bounding box of the cell plus unit clearance
                const cellMinX = cellCenterX - unitClearanceRadius;
                const cellMaxX = cellCenterX + unitClearanceRadius;
                const cellMinY = cellCenterY - unitClearanceRadius;
                const cellMaxY = cellCenterY + unitClearanceRadius;
                
                let cellIsBlocked = false;
                for (const otherObs of this.obstacles) {
                    const currentObsBlocks = (otherObs === obstacle)
                        ? (isDestroyedAndNowWalkable ? (obstacle.blocksMovementOnDestroy !== undefined ? obstacle.blocksMovementOnDestroy : false) : otherObs.blocksMovement)
                        : (otherObs.blocksMovement && !otherObs.isDestroyed);

                    if (currentObsBlocks) { 
                        // Quick bounding box check to skip distant obstacles
                        const obsMinX = otherObs.x;
                        const obsMaxX = otherObs.x + otherObs.width;
                        const obsMinY = otherObs.y;
                        const obsMaxY = otherObs.y + otherObs.height;
                        
                        // If bounding boxes don't overlap, skip this obstacle
                        if (obsMaxX < cellMinX || obsMinX > cellMaxX || obsMaxY < cellMinY || obsMinY > cellMaxY) {
                            continue;
                        }
                        
                        const otherObsShapeOrShapes = this._getObstacleCollisionShape(otherObs);
                        if (!otherObsShapeOrShapes) continue;
                        const otherShapesArray = Array.isArray(otherObsShapeOrShapes) ? otherObsShapeOrShapes : [otherObsShapeOrShapes];

                        let cellBlockedByOther = false;
                        for (const otherObsShape of otherShapesArray) {
                            let inflatedOtherObsShape = {...otherObsShape};
                            if (inflatedOtherObsShape.type === 'rectangle') {
                                inflatedOtherObsShape.x -= unitClearanceRadius;
                                inflatedOtherObsShape.y -= unitClearanceRadius;
                                inflatedOtherObsShape.width += 2 * unitClearanceRadius;
                                inflatedOtherObsShape.height += 2 * unitClearanceRadius;
                            } else if (inflatedOtherObsShape.type === 'circle') {
                                inflatedOtherObsShape.radius = (inflatedOtherObsShape.radius || 0) + unitClearanceRadius;
                            } else if (inflatedOtherObsShape.type === 'ellipse') {
                                inflatedOtherObsShape.radiusX = (inflatedOtherObsShape.radiusX || 0) + unitClearanceRadius;
                                inflatedOtherObsShape.radiusY = (inflatedOtherObsShape.radiusY || 0) + unitClearanceRadius;
                            }
                            
                            let collisionWithOther = false;
                            if (inflatedOtherObsShape.type === 'rectangle') collisionWithOther = pointInRectangle(cellCenterX, cellCenterY, inflatedOtherObsShape);
                            else if (inflatedOtherObsShape.type === 'circle') collisionWithOther = pointInCircle(cellCenterX, cellCenterY, inflatedOtherObsShape);
                            else if (inflatedOtherObsShape.type === 'ellipse') collisionWithOther = pointInEllipse(cellCenterX, cellCenterY, inflatedOtherObsShape);

                            if (collisionWithOther) {
                                cellBlockedByOther = true;
                                break;
                            }
                        }
                        if (cellBlockedByOther) {
                            cellIsBlocked = true;
                            break; 
                        }
                    }
                }
                this.navGrid[y][x] = cellIsBlocked ? 1 : 0;
            }
        }
    }

    getNavigationGrid() {
        if (!this.navGrid) {
            if (CONFIG.WORLD_WIDTH && CONFIG.WORLD_HEIGHT) {
                this.generateNavigationGrid(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
            } else {
                return null;
            }
        }
        return this.navGrid;
    }

    getNavigationGridWithUnits(requesterUnit, unitRadiusCells) {
        const baseGrid = this.getNavigationGrid();
        if (!baseGrid) return null;
        const gridCopy = [];
        for (let y = 0; y < this.gridHeight; y++) {
            gridCopy[y] = new Uint8Array(baseGrid[y]);
        }
        if (!this.game) return gridCopy;
        const allUnits = [
            ...(this.game.getLivingPlayerControlledUnits?.() || []),
            ...(this.game.enemyUnits || []),
            ...(this.game.hostageUnits || [])
        ];
        const requesterGrid = this.worldToGridCoords(requesterUnit.x, requesterUnit.y);
        for (const unit of allUnits) {
            if (unit === requesterUnit || !unit.isAlive() || unit.isPhasing) continue;
            const unitGrid = this.worldToGridCoords(unit.x, unit.y);
            const r = Math.ceil((unit.size * 0.5 + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 10)) / this.gridCellSize) + unitRadiusCells;
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const gx = unitGrid.x + dx;
                    const gy = unitGrid.y + dy;
                    if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
                        if (dx * dx + dy * dy <= r * r) {
                            gridCopy[gy][gx] = 1;
                        }
                    }
                }
            }
        }
        gridCopy[requesterGrid.y][requesterGrid.x] = 0;
        return gridCopy;
    }

    rebuildActiveObstacles() {
        this.activeObstacles = this.obstacles.filter(obs => obs.blocksMovement && !obs.isDestroyed);
    }

    rebuildObstacleSet() {
        this.obstacleSet = new WeakSet(this.obstacles);
    }

    worldToGridCoords(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.gridCellSize),
            y: Math.floor(worldY / this.gridCellSize)
        };
    }

    computeReachableCells(playerSpawnX, playerSpawnY) {
        if (!this.navGrid || this.gridWidth === 0 || this.gridHeight === 0) {
            return;
        }

        this.reachableGrid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.reachableGrid[y] = new Uint8Array(this.gridWidth);
        }

        const start = this.worldToGridCoords(playerSpawnX, playerSpawnY);
        let sx = start.x;
        let sy = start.y;

        sx = Math.max(0, Math.min(this.gridWidth - 1, sx));
        sy = Math.max(0, Math.min(this.gridHeight - 1, sy));

        if (this.navGrid[sy][sx] === 1) {
            let found = false;
            for (let r = 1; r <= 10 && !found; r++) {
                for (let dy = -r; dy <= r && !found; dy++) {
                    for (let dx = -r; dx <= r && !found; dx++) {
                        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                        const nx = sx + dx, ny = sy + dy;
                        if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight && this.navGrid[ny][nx] === 0) {
                            sx = nx; sy = ny; found = true;
                        }
                    }
                }
            }
            if (!found) return;
        }

        const queue = new Array(this.gridWidth * this.gridHeight);
        let head = 0, tail = 0;

        queue[tail++] = (sy << 16) | sx;
        this.reachableGrid[sy][sx] = 1;

        while (head < tail) {
            const packed = queue[head++];
            const cx = packed & 0xFFFF;
            const cy = (packed >> 16) & 0xFFFF;

            if (cy > 0 && this.navGrid[cy - 1][cx] === 0 && this.reachableGrid[cy - 1][cx] === 0) {
                this.reachableGrid[cy - 1][cx] = 1;
                queue[tail++] = ((cy - 1) << 16) | cx;
            }
            if (cy < this.gridHeight - 1 && this.navGrid[cy + 1][cx] === 0 && this.reachableGrid[cy + 1][cx] === 0) {
                this.reachableGrid[cy + 1][cx] = 1;
                queue[tail++] = ((cy + 1) << 16) | cx;
            }
            if (cx > 0 && this.navGrid[cy][cx - 1] === 0 && this.reachableGrid[cy][cx - 1] === 0) {
                this.reachableGrid[cy][cx - 1] = 1;
                queue[tail++] = (cy << 16) | (cx - 1);
            }
            if (cx < this.gridWidth - 1 && this.navGrid[cy][cx + 1] === 0 && this.reachableGrid[cy][cx + 1] === 0) {
                this.reachableGrid[cy][cx + 1] = 1;
                queue[tail++] = (cy << 16) | (cx + 1);
            }
        }
    }

    isPositionReachable(worldX, worldY) {
        const gp = this.worldToGridCoords(worldX, worldY);
        if (gp.x < 0 || gp.x >= this.gridWidth || gp.y < 0 || gp.y >= this.gridHeight) {
            return false;
        }
        if (!this.reachableGrid) {
            return true;
        }
        return this.reachableGrid[gp.y][gp.x] === 1;
    }

    gridToWorldCoords(gridX, gridY) {
        return {
            x: gridX * this.gridCellSize + this.gridCellSize / 2,
            y: gridY * this.gridCellSize + this.gridCellSize / 2
        };
    }

    getSpawnerConfig(spawner) {
        if (spawner.type === 'possum_barracks_1') {
            return this.barracksSpawnConfig;
        }
        return this.hutSpawnConfig;
    }

    updateHutSpawning(deltaTime) {
        if (!this.game || !this.game.deployedSquadRoster || this.game.deployedSquadRoster.length === 0 || !this.rng) {
            return;
        }
        if (!this.hutSpawnConfig || Object.keys(this.hutSpawnConfig).length === 0) return;

        this.timeSinceLastHutActivationCheck += deltaTime;

        if (this.timeSinceLastHutActivationCheck >= this.HUT_ACTIVATION_CHECK_INTERVAL) {
            this.timeSinceLastHutActivationCheck = 0;

            const hutMaxActive = Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE +
                (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));
            const barracksMaxActive = Math.floor((this.barracksSpawnConfig.MAX_ACTIVE_SPAWNING_BARRACKS_BASE || 0) +
                (this.game.currentPhaseIndex * (this.barracksSpawnConfig.MAX_ACTIVE_SPAWNING_BARRACKS_INCREMENT_PER_PHASE || 0)));

            const activeHuts = this.activeSpawningHuts.filter(h => h.type !== 'possum_barracks_1');
            const activeBarracks = this.activeSpawningHuts.filter(h => h.type === 'possum_barracks_1');

            for (const hut of this.potentialSpawnerHuts) {
                if (hut.isDestroyed || hut.isActivelySpawning || hut.isMissionTarget) continue;

                const isBarracks = hut.type === 'possum_barracks_1';
                const spawnerConfig = this.getSpawnerConfig(hut);
                const currentActiveCount = isBarracks ? activeBarracks.length : activeHuts.length;
                const maxAllowedActive = isBarracks ? barracksMaxActive : hutMaxActive;

                if (currentActiveCount < maxAllowedActive) {
                    let playerNearby = false;
                    for (const playerUnit of this.game.deployedSquadRoster) {
                        if (playerUnit.isAlive() && distance(playerUnit.x, playerUnit.y, hut.x + hut.width / 2, hut.y + hut.height / 2) < (spawnerConfig.PLAYER_PROXIMITY_TRIGGER_RADIUS || 300)) {
                            playerNearby = true;
                            break;
                        }
                    }
                    if (playerNearby) {
                        hut.isActivelySpawning = true;
                        const numToSpawnBaseMin = spawnerConfig.UNITS_PER_SPAWN_MIN || 1;
                        const numToSpawnBaseMax = spawnerConfig.UNITS_PER_SPAWN_MAX || 2;
                        const phaseIncrement = spawnerConfig.UNITS_PER_SPAWN_PHASE_INCREMENT || 0;
                        let currentMinUnits = Math.max(1, Math.floor(numToSpawnBaseMin * (1 + this.game.currentPhaseIndex * phaseIncrement)));
                        let currentMaxUnits = Math.max(currentMinUnits, Math.floor(numToSpawnBaseMax * (1 + this.game.currentPhaseIndex * phaseIncrement)));
                        hut.unitsToSpawnThisBurst = this.rng.nextInt(currentMinUnits, currentMaxUnits);
                        hut.timeUntilNextUnitInBurst = this.rng.nextFloat(
                            (spawnerConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5),
                            (spawnerConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX || 10)
                        );
                        hut.spawnCooldownTimer = hut.timeUntilNextUnitInBurst; 
                        this.activeSpawningHuts.push(hut);
                    }
                }
            }
        }

        for (let i = this.activeSpawningHuts.length - 1; i >= 0; i--) {
            const hut = this.activeSpawningHuts[i];
            if (hut.isDestroyed) { 
                this.activeSpawningHuts.splice(i, 1);
                continue;
            }

            const spawnerConfig = this.getSpawnerConfig(hut);

            if (hut.delayedDamageSpawnTimer && hut.delayedDamageSpawnTimer > 0) {
                hut.delayedDamageSpawnTimer -= deltaTime;
                if (hut.delayedDamageSpawnTimer <= 0) {
                    hut.delayedDamageSpawnTimer = 0;
                    const damageSpawnCount = spawnerConfig.UNITS_TO_SPAWN_ON_DAMAGE || this.rng.nextInt(1,2);
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] ${hut.type} ${hut.name || hut.id} damage spawn: ${damageSpawnCount} units.`);
                    for (let k = 0; k < damageSpawnCount; k++) {
                        this.attemptSingleSpawnFromHut(hut);
                    }
                     hut.spawnCooldownTimer = this.rng.nextFloat(
                            (spawnerConfig.SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE || 10),
                            (spawnerConfig.SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE || 20)
                        );
                    hut.unitsToSpawnThisBurst = 0;
                }
            }
            if(hut.damageSpawnCooldown && hut.damageSpawnCooldown > 0){
                hut.damageSpawnCooldown -= deltaTime;
                 if(hut.damageSpawnCooldown <0) hut.damageSpawnCooldown = 0;
            }

            if (hut.unitsToSpawnThisBurst > 0 && hut.delayedDamageSpawnTimer <= 0) {
                hut.timeUntilNextUnitInBurst -= deltaTime;
                if (hut.timeUntilNextUnitInBurst <= 0) {
                    if (this.attemptSingleSpawnFromHut(hut)) {
                        hut.unitsToSpawnThisBurst--;
                    } else {
                        hut.unitsToSpawnThisBurst--; 
                    }
                    if (hut.unitsToSpawnThisBurst > 0) {
                        hut.timeUntilNextUnitInBurst = this.rng.nextFloat(
                            (spawnerConfig.TIME_BETWEEN_UNITS_IN_BURST_MIN || 0.2),
                            (spawnerConfig.TIME_BETWEEN_UNITS_IN_BURST_MAX || 0.5)
                        );
                    } else {
                        hut.spawnCooldownTimer = this.rng.nextFloat(
                            (spawnerConfig.SPAWN_COOLDOWN_MIN_SECONDS || 15),
                            (spawnerConfig.SPAWN_COOLDOWN_MAX_SECONDS || 30)
                        );
                    }
                }
            } else if (hut.delayedDamageSpawnTimer <= 0) {
                hut.spawnCooldownTimer -= deltaTime;
                if (hut.spawnCooldownTimer <= 0) {
                    const numToSpawnBaseMin = spawnerConfig.UNITS_PER_SPAWN_MIN || 1;
                    const numToSpawnBaseMax = spawnerConfig.UNITS_PER_SPAWN_MAX || 2;
                    const phaseIncrement = spawnerConfig.UNITS_PER_SPAWN_PHASE_INCREMENT || 0;
                    let currentMinUnits = Math.max(1, Math.floor(numToSpawnBaseMin * (1 + this.game.currentPhaseIndex * phaseIncrement)));
                    let currentMaxUnits = Math.max(currentMinUnits, Math.floor(numToSpawnBaseMax * (1 + this.game.currentPhaseIndex * phaseIncrement)));
                    hut.unitsToSpawnThisBurst = this.rng.nextInt(currentMinUnits, currentMaxUnits);
                    hut.timeUntilNextUnitInBurst = this.rng.nextFloat(
                        (spawnerConfig.TIME_BETWEEN_UNITS_IN_BURST_MIN || 0.2),
                        (spawnerConfig.TIME_BETWEEN_UNITS_IN_BURST_MAX || 0.2) 
                    ); 
                }
            }
        }
    }

    updateExplosionQueue(deltaTime) {
        if (!this.explosionQueue || this.explosionQueue.length === 0) return;

        for (let i = 0; i < this.explosionQueue.length; i++) {
            const entry = this.explosionQueue[i];
            entry.remainingDelay -= deltaTime;

            if (entry.remainingDelay <= 0) {
                if (entry.obstacle && !entry.obstacle.isDestroyed) {
                    const obstacle = entry.obstacle;
                    const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);

                    if (obstacleDef && obstacleDef.explosionDamage && obstacleDef.explosionAoeRadius) {
                        obstacle.isDestroyed = true;
                        obstacle.hp = 0;

                        obstacle.blocksMovement = obstacleDef.blocksMovementOnDestroy !== undefined ? obstacleDef.blocksMovementOnDestroy : false;
                        obstacle.providesCover = obstacleDef.providesCoverOnDestroy !== undefined ? obstacleDef.providesCoverOnDestroy : false;
                        if (obstacleDef.collisionShapeDestroyed) {
                            obstacle.collisionShape = obstacleDef.collisionShapeDestroyed;
                        } else if (obstacle.treeStumpType) {
                            const stumpDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.treeStumpType);
                            if (stumpDef && stumpDef.collisionShape) {
                                obstacle.collisionShape = stumpDef.collisionShape;
                            } else if (obstacle.blocksMovement === false) {
                                obstacle.collisionShape = null;
                            }
                        } else if (obstacle.blocksMovement === false) {
                            obstacle.collisionShape = null;
                        }

                        if (this.navGrid) {
                            this.updateNavigationGridForObstacle(obstacle, true);
                        }
                        this.rebuildActiveObstacles();

                        const centerX = obstacle.x + obstacle.width / 2;
                        const centerY = obstacle.y + obstacle.height / 2;

                        if (this.game) {
                            this.game.addVisualEffect('barrel_explosion', {
                                x: centerX,
                                y: centerY,
                                radius: obstacleDef.explosionAoeRadius
                            });

                            if (obstacleDef.flameCount && obstacleDef.flameCount > 0) {
                                this.game.addVisualEffect('fire', {
                                    anchorObstacle: obstacle,
                                    flameCount: obstacleDef.flameCount,
                                    flameOffsetY: obstacleDef.flameOffsetY || 0
                                });
                            }

                            if (obstacleDef.sfxOnDestroy && this.game.audioManager) {
                                this.game.audioManager.play(obstacleDef.sfxOnDestroy);
                            }
                        }

                        const explosionDmg = obstacleDef.explosionDamage;
                        const explosionRadius = obstacleDef.explosionAoeRadius;

                        (this.obstacles || []).forEach(otherObs => {
                            if (otherObs !== obstacle && otherObs.destructible && !otherObs.isDestroyed &&
                                (otherObs.type === 'explosive_barrel' || otherObs.type === 'explosive_barrel_double' ||
                                 otherObs.type === 'explosive_barrel_cluster')) {

                                const otherCenterX = otherObs.x + otherObs.width / 2;
                                const otherCenterY = otherObs.y + otherObs.height / 2;
                                const dist = distance(centerX, centerY, otherCenterX, otherCenterY);
                                const hitRadius = explosionRadius + (otherObs.width + otherObs.height) / 4;

                                if (dist < hitRadius) {
                                    const delay = Math.max(
                                        this.explosionWaveDelay,
                                        dist / this.explosionWaveSpeed
                                    );

                                    const alreadyQueued = this.explosionQueue.some(q => q.obstacle === otherObs);
                                    if (!alreadyQueued) {
                                        this.explosionQueue.push({
                                            obstacle: otherObs,
                                            damage: explosionDmg,
                                            attackerUnit: entry.attackerUnit,
                                            remainingDelay: delay
                                        });
                                    }
                                }
                            }
                        });

                        const allUnits = (this.game ? this.game.getLivingPlayerControlledUnits() : [])
                            .concat(this.game ? this.game.enemyUnits : []);
                        allUnits.forEach(unit => {
                            if (unit.isAlive()) {
                                const distToUnit = distance(centerX, centerY, unit.x, unit.y);
                                if (distToUnit <= explosionRadius + unit.size) {
                                    unit.takeDamage(explosionDmg, entry.attackerUnit);
                                }
                            }
                        });
                    }
                }
            }
        }

        for (let i = this.explosionQueue.length - 1; i >= 0; i--) {
            const entry = this.explosionQueue[i];
            if (entry.remainingDelay <= 0 || !entry.obstacle || entry.obstacle.isDestroyed) {
                this.explosionQueue.splice(i, 1);
            }
        }
    }

    attemptSingleSpawnFromHut(hut) {
        if (hut.isDestroyed || !this.rng) return false;

        const spawnerConfig = this.getSpawnerConfig(hut);
        const isBarracks = hut.type === 'possum_barracks_1';
        const maxUnitsKey = isBarracks ? 'MAX_UNITS_PER_BARRACKS_BASE' : 'MAX_UNITS_PER_HUT_BASE';
        const phaseIncKey = isBarracks ? 'MAX_UNITS_PER_BARRACKS_PHASE_INCREMENT' : 'MAX_UNITS_PER_HUT_PHASE_INCREMENT';
        const maxUnitsPerSpawner = Math.floor((spawnerConfig[maxUnitsKey] || 10) + (this.game.currentPhaseIndex * (spawnerConfig[phaseIncKey] || 2)));
        if (hut.unitsSpawnedFromHut >= maxUnitsPerSpawner) {
            if (CONFIG.DEBUG_LOGGING) console.log(`[Level] ${hut.type} ${hut.name || hut.id} has reached max units spawned (${hut.unitsSpawnedFromHut}/${maxUnitsPerSpawner}).`);
            hut.isActivelySpawning = false;
            this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== hut);
            return false;
        }

        const hutCenterX = hut.x + hut.width / 2;
        const hutBottomEdgeY = hut.y + hut.height;
        const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;
        const maxPlacementAttempts = spawnerConfig.MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT || 3;

        const spawnArea = this.getObstacleSpawnArea(hut);
        let getSpawnPoint;

        if (spawnArea && spawnArea.type === 'rectangle') {
            getSpawnPoint = () => {
                const x = this.rng.nextFloat(spawnArea.x, spawnArea.x + spawnArea.width);
                const y = this.rng.nextFloat(spawnArea.y, spawnArea.y + spawnArea.height);
                return { x, y };
            };
        } else {
            const spawnOffsetX = spawnerConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
            const spawnOffsetY = spawnerConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
            const spawnAreaWidth = spawnerConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;
            const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
            const spawnLineCenterX = hut.isFlippedHorizontally ? hutCenterX - spawnOffsetX : hutCenterX + spawnOffsetX;
            const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;
            getSpawnPoint = () => {
                const x = this.rng.nextFloat(spawnLineMinX, spawnLineMinX + spawnAreaWidth);
                const y = spawnCenterY;
                return { x, y };
            };
        }

        let spawnX, spawnY, spawnClear = false;
        for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
            const point = getSpawnPoint();
            spawnX = Math.max(gruntSize / 2, Math.min(point.x, (CONFIG.WORLD_WIDTH || 0) - gruntSize / 2));
            spawnY = Math.max(gruntSize / 2, Math.min(point.y, (CONFIG.WORLD_HEIGHT || 0) - gruntSize / 2));
            if (this.playableMinY !== undefined && spawnY < this.playableMinY + gruntSize / 2) continue;

            if (this.isSpawnPointClear(spawnX, spawnY, gruntSize, this.obstacles, this.game.enemyUnits)) {
                spawnClear = true;
                break;
            }
        }

        if (spawnClear) {
            const newGrunt = new PossumGrunt(spawnX, spawnY, this.game, `PSM-HUT-${this.game.enemyUnits.length + 1}`);
            newGrunt.isPhasing = true;
            newGrunt.phasingTimer = spawnerConfig.SPAWN_PHASING_DURATION || 1.0;
            const moveOutDist = spawnerConfig.INITIAL_MOVE_OUT_DISTANCE || 50;
            let angleFromSpawn = Math.PI / 2; 
            if (distance(spawnX, spawnY, hutCenterX, hut.y + hut.height / 2) > 10) {
                angleFromSpawn = Math.atan2(spawnY - (hut.y + hut.height / 2), spawnX - hutCenterX);
            }
            let initialTargetX = spawnX + Math.cos(angleFromSpawn) * moveOutDist;
            let initialTargetY = spawnY + Math.sin(angleFromSpawn) * moveOutDist;
            initialTargetX = Math.max(gruntSize / 2, Math.min(initialTargetX, (CONFIG.WORLD_WIDTH || 0) - gruntSize / 2));
            initialTargetY = Math.max(gruntSize / 2, Math.min(initialTargetY, (CONFIG.WORLD_HEIGHT || 0) - gruntSize / 2));
            newGrunt.setMoveTarget(initialTargetX, initialTargetY);
            
            this.game.enemyUnits.push(newGrunt);
            if (this.game && typeof this.game.incrementObjectiveEnemyCount === 'function') {
                this.game.incrementObjectiveEnemyCount(1);
            }
            if (this.game && this.game.spatialGrid) {
                this.game.spatialGrid.addObject(newGrunt);
            }
            hut.unitsSpawnedFromHut++;
            return true;
        } else {
            if (CONFIG.DEBUG_LOGGING) console.warn(`[Level] Failed to find clear spawn point for hut ${hut.name || hut.id}`);
            return false;
        }
    }

    renderHutSpawnAreas(ctx) {
        if (!this.hutSpawnConfig.DEBUG_DRAW_SPAWN_AREAS) return;
        ctx.save();
        const originalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
        for (const hut of this.potentialSpawnerHuts) {
            if (hut.isDestroyed) continue;
            const spawnerConfig = this.getSpawnerConfig(hut);
            const spawnArea = this.getObstacleSpawnArea(hut);

            if (spawnArea && spawnArea.type === 'rectangle') {
                ctx.fillRect(spawnArea.x, spawnArea.y, spawnArea.width, spawnArea.height);
            } else {
                const hutCenterX = hut.x + hut.width / 2;
                const hutBottomEdgeY = hut.y + hut.height;
                const spawnOffsetX = spawnerConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
                const spawnOffsetY = spawnerConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
                const spawnAreaWidth = spawnerConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;
                const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
                const spawnLineCenterX = hut.isFlippedHorizontally ? hutCenterX - spawnOffsetX : hutCenterX + spawnOffsetX;
                const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;
                const debugSpawnHeight = (CONFIG.POSSUM_GRUNT_SIZE || 14) * 0.5;
                ctx.fillRect(spawnLineMinX, spawnCenterY - debugSpawnHeight / 2, spawnAreaWidth, debugSpawnHeight);
            }
            if (hut.isActivelySpawning) {
                ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
                ctx.beginPath();
                ctx.arc(hut.x + hut.width / 2, hut.y + hut.height / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
            }
        }
        ctx.globalAlpha = originalAlpha;
        ctx.restore();
    }
}