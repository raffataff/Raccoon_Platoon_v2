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
        this.timeSinceLastHutActivationCheck = 0;
        this.HUT_ACTIVATION_CHECK_INTERVAL = 1.0;
        this.initialHostageCount = 0; 
        this.missionTargetObstacles = [];
        
        // --- NEW: Add property to store quadrant data ---
        this.quadrantBoundaries = null;
        // --- END NEW ---
        
        this.levelGenerator = new LevelGenerator(this);
    }
    
    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParamsContainer, numPlayerSpawnsNeeded, preloadedAssetImages, missionSeed) {
        return this.levelGenerator.generate(worldWidth, worldHeight, missionParamsContainer, numPlayerSpawnsNeeded, preloadedAssetImages, missionSeed);
    }
    
    _getObstacleCollisionShape(obstacle) {
        if (obstacle.collisionShape) {
            const shapeDef = obstacle.collisionShape;
            const obsCurrentWidth = obstacle.width;
            const obsCurrentHeight = obstacle.height;

            if (shapeDef.type === 'rectangle') {
                let offsetX = typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || 0);
                let offsetY = typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || 0);
                if (obstacle.isFlippedHorizontally) {
                    offsetX = obsCurrentWidth - offsetX - (typeof shapeDef.width === 'function' ? shapeDef.width(obsCurrentWidth, obsCurrentHeight) : (shapeDef.width || obsCurrentWidth));
                }
                return {
                    type: 'rectangle',
                    x: obstacle.x + offsetX,
                    y: obstacle.y + offsetY,
                    width: (typeof shapeDef.width === 'function' ? shapeDef.width(obsCurrentWidth, obsCurrentHeight) : (shapeDef.width || obsCurrentWidth)),
                    height: (typeof shapeDef.height === 'function' ? shapeDef.height(obsCurrentWidth, obsCurrentHeight) : (shapeDef.height || obsCurrentHeight))
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
        }
        if (obstacle.type === (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE) || 
            obstacle.type === 'border_wall' || 
            obstacle.type === 'extraction_zone') { 
             return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
        }
        return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
    }

    _rectOverlap(rect1, rect2) {
        return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y);
    }
    
    isSpawnPointClear(x, y, unitSize, existingObstacles, existingUnits = []) {
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        if (this.levelGenerator._isPlacementInvalid(unitShape, false, existingObstacles)) {
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

        if (wasAlive && (obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round') && obstacle.hp > 0 && !obstacle.isDestroyed) {
            const isSpawner = this.potentialSpawnerHuts.includes(obstacle) || this.activeSpawningHuts.includes(obstacle);
            if (obstacle.isMissionTarget || isSpawner) {
                if (!obstacle.damageSpawnCooldown || obstacle.damageSpawnCooldown <= 0) {
                    obstacle.delayedDamageSpawnTimer = (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE || 0.5) + (Math.random() * 0.3 - 0.15);
                    obstacle.damageSpawnCooldown = (this.hutSpawnConfig.MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS || 5.0);
                    
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] Hut ${obstacle.name || obstacle.id} shot! Scheduling damage spawn in ${obstacle.delayedDamageSpawnTimer.toFixed(1)}s.`);

                    if (!this.activeSpawningHuts.includes(obstacle) && this.potentialSpawnerHuts.includes(obstacle)) {
                        const maxAllowedActive = Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE +
                            (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));
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
            const isPalmTree = obstacle.type.startsWith('tree_palm');
            const isDeciduousTree = obstacle.type.startsWith('tree_deciduous');
            if ((isPalmTree || isDeciduousTree) && treeFallSettings?.ENABLED && this.rng.chance(treeFallSettings.FALL_CHANCE)) {
                let fallenLogType = 'tree_palm_fallen';
                if (obstacle.type.startsWith('tree_palm2_')) {
                    fallenLogType = 'tree_palm2_fallen';
                } else if (obstacle.type.startsWith('tree_deciduous')) {
                    fallenLogType = 'tree_deciduous_fallen';
                }
                this._spawnFallenTree(obstacle.x, obstacle.y, obstacle.width, obstacle.height, fallenLogType);
            }

            if (obstacleDef && obstacleDef.sfxOnDestroy && this.game && this.game.audioManager) {
                this.game.audioManager.play(obstacleDef.sfxOnDestroy);
            } 
            else if ((obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round') && this.game && this.game.audioManager && !obstacleDef?.sfxOnDestroy) {
                this.game.audioManager.play('POSSUM_HUT_DESTROYED');
            }
            
if (obstacle.type === 'possum_hut' || obstacle.type === 'possum_hut_round') { 
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

            if (this.game && obstacleDef && obstacleDef.explosionDamage && obstacleDef.explosionAoeRadius) {
                this.game.addVisualEffect('explosion', { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2, radius: obstacleDef.explosionAoeRadius });
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
                const allUnits = this.game.getLivingPlayerControlledUnits().concat(this.game.enemyUnits || []); 
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

    _spawnFallenTree(stumpX, stumpY, stumpWidth, stumpHeight, fallenLogType = 'tree_palm_fallen') {
        const fallSettings = CONFIG.LEVEL_GENERATION.TREE_FALL_SETTINGS;
        const fallenLogTemplate = CONFIG.OBSTACLE_DEFINITIONS.find(def => def.type === fallenLogType);
        if (!fallenLogTemplate) {
//            console.warn(`Could not find '${fallenLogType}' obstacle definition to spawn.`);
            return;
        }

        let filesArray, pathBase;
        switch (fallenLogType) {
            case 'tree_palm2_fallen':
                filesArray = CONFIG.PALM2_TREE_FALLEN_SPRITE_FILES || [];
                pathBase = CONFIG.PALM2_TREE_FALLEN_SPRITE_PATH || '';
                break;
            case 'tree_deciduous_fallen':
                filesArray = CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_FILES || [];
                pathBase = CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_PATH || '';
                break;
            default:
                filesArray = CONFIG.PALM_TREE_FALLEN_SPRITE_FILES || [];
                pathBase = CONFIG.PALM_TREE_FALLEN_SPRITE_PATH || '';
                break;
        }
        let actualSpritePath = (filesArray.length > 0 && pathBase) ? pathBase + this.rng.pickFrom(filesArray) : null;
        let logImage = actualSpritePath ? this.game.preloadedImages[actualSpritePath] : null;

        if (!logImage) {
//            console.warn("Preloaded image for fallen tree not found.");
            return;
        }
        
        const logWidth = logImage.naturalWidth * (fallenLogTemplate.spriteScale || 1.0);
        const logHeight = logImage.naturalHeight * (fallenLogTemplate.spriteScale || 1.0);
        
        // --- MODIFICATION START ---
        // Calculate spawn origin from the bottom-center of the stump, not the total center.
        const stumpBottomCenterX = stumpX + stumpWidth / 2;
        const stumpBottomCenterY = stumpY + stumpHeight; // Use the bottom edge for the Y-origin
        // --- MODIFICATION END ---

        let placed = false;
        for (let i = 0; i < fallSettings.MAX_PLACEMENT_ATTEMPTS; i++) {
            const angle = this.rng.nextFloat(0, Math.PI * 2);
            const distance = this.rng.nextFloat(fallSettings.PLACEMENT_DISTANCE_MIN, fallSettings.PLACEMENT_DISTANCE_MAX);
            
            // --- MODIFICATION START ---
            // Place the log relative to the new bottom-center origin point
            const logX = stumpBottomCenterX + Math.cos(angle) * distance - logWidth / 2;
            const logY = stumpBottomCenterY + Math.sin(angle) * distance - logHeight / 2;
            // --- MODIFICATION END ---

            const newLogObstacle = {
                x: logX, y: logY, width: logWidth, height: logHeight,
                type: fallenLogTemplate.type, name: fallenLogTemplate.name, color: fallenLogTemplate.color,
                destructible: fallenLogTemplate.destructible, hp: fallenLogTemplate.hp, maxHp: fallenLogTemplate.maxHp,
                isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false,
                spriteNormalPath: actualSpritePath, imageNormal: logImage, spriteScale: fallenLogTemplate.spriteScale || 1.0,
                collisionShape: fallenLogTemplate.collisionShape,
            };

            const collisionShape = this._getObstacleCollisionShape(newLogObstacle);
            
            const otherObstacles = this.obstacles.filter(obs => obs.hp > 0 || (obs.x !== stumpX && obs.y !== stumpY));

            if (!this.levelGenerator._isPlacementInvalid(collisionShape, false, otherObstacles)) {
                this.obstacles.push(newLogObstacle);
                this.game.spatialGrid.addObject(newLogObstacle);
                this.updateNavigationGridForObstacle(newLogObstacle, false);
                placed = true;
                break;
            }
        }
        if (!placed) {
//            console.log("Could not find a valid placement for fallen tree log.");
        }
    }

    generateNavigationGrid(worldWidth, worldHeight) {
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 16;
        this.gridWidth = Math.floor(worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(worldHeight / this.gridCellSize);
        this.navGrid = [];

        const unitClearanceRadius = (CONFIG.RACCOON_SIZE / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);

        for (let y = 0; y < this.gridHeight; y++) {
            this.navGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.navGrid[y][x] = 0;
                
                const cellCenterX = x * this.gridCellSize + this.gridCellSize / 2;
                const cellCenterY = y * this.gridCellSize + this.gridCellSize / 2;

                for (const obs of this.obstacles) {
                    if (obs.blocksMovement && !obs.isDestroyed) { 
                        const obsShape = this._getObstacleCollisionShape(obs);
                        if (!obsShape) continue;

                        let inflatedObsShape = {...obsShape};

                        if (inflatedObsShape.type === 'rectangle') {
                            inflatedObsShape.x -= unitClearanceRadius;
                            inflatedObsShape.y -= unitClearanceRadius;
                            inflatedObsShape.width += 2 * unitClearanceRadius;
                            inflatedObsShape.height += 2 * unitClearanceRadius;
                        } else if (inflatedObsShape.type === 'circle') {
                            inflatedObsShape.radius = (inflatedObsShape.radius || 0) + unitClearanceRadius;
                        } else if (inflatedObsShape.type === 'ellipse') {
                            inflatedObsShape.radiusX = (inflatedObsShape.radiusX || 0) + unitClearanceRadius;
                            inflatedObsShape.radiusY = (inflatedObsShape.radiusY || 0) + unitClearanceRadius;
                        }
                        
                        let collision = false;
                        if (inflatedObsShape.type === 'rectangle') {
                            collision = pointInRectangle(cellCenterX, cellCenterY, inflatedObsShape);
                        } else if (inflatedObsShape.type === 'circle') {
                            collision = pointInCircle(cellCenterX, cellCenterY, inflatedObsShape);
                        } else if (inflatedObsShape.type === 'ellipse') {
                            collision = pointInEllipse(cellCenterX, cellCenterY, inflatedObsShape);
                        }
                        
                        if (collision) {
                            this.navGrid[y][x] = 1;
                            break; 
                        }
                    }
                }
            }
        }
    }

    updateNavigationGridForObstacle(obstacle, isDestroyedAndNowWalkable) {
        if (!this.navGrid || !obstacle) return;
        
        const unitClearanceRadius = (CONFIG.RACCOON_SIZE / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 12);

        const obsShapeForBounds = this._getObstacleCollisionShape(obstacle);
        let minObsX, maxObsX, minObsY, maxObsY;

        if (!obsShapeForBounds) { 
            minObsX = obstacle.x; maxObsX = obstacle.x + obstacle.width;
            minObsY = obstacle.y; maxObsY = obstacle.y + obstacle.height;
        } else if (obsShapeForBounds.type === 'rectangle') {
            minObsX = obsShapeForBounds.x; maxObsX = obsShapeForBounds.x + obsShapeForBounds.width;
            minObsY = obsShapeForBounds.y; maxObsY = obsShapeForBounds.y + obsShapeForBounds.height;
        } else if (obsShapeForBounds.type === 'circle') {
            minObsX = obsShapeForBounds.x - obsShapeForBounds.radius; maxObsX = obsShapeForBounds.x + obsShapeForBounds.radius;
            minObsY = obsShapeForBounds.y - obsShapeForBounds.radius; maxY = obsShapeForBounds.y + obsShapeForBounds.radius;
        } else if (obsShapeForBounds.type === 'ellipse') {
            minObsX = obsShapeForBounds.x - obsShapeForBounds.radiusX; maxObsX = obsShapeForBounds.x + obsShapeForBounds.radiusX;
            minObsY = obsShapeForBounds.y - obsShapeForBounds.radiusY; maxObsY = obsShapeForBounds.y + obsShapeForBounds.radiusY;
        } else { 
            minObsX = obstacle.x; maxObsX = obstacle.x + obstacle.width;
            minObsY = obstacle.y; maxObsY = obstacle.y + obstacle.height;
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
                
                let cellIsBlocked = false;
                for (const otherObs of this.obstacles) {
                    const currentObsBlocks = (otherObs === obstacle)
                        ? (isDestroyedAndNowWalkable ? (obstacle.blocksMovementOnDestroy !== undefined ? obstacle.blocksMovementOnDestroy : false) : otherObs.blocksMovement)
                        : (otherObs.blocksMovement && !otherObs.isDestroyed);

                    if (currentObsBlocks) { 
                        const otherObsShape = this._getObstacleCollisionShape(otherObs);
                        if (!otherObsShape) continue;

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
//            console.warn("[Level] Navigation grid requested but not yet generated!");
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

    updateHutSpawning(deltaTime) {
        if (!this.game || !this.game.deployedSquadRoster || this.game.deployedSquadRoster.length === 0 || !this.rng) {
            return;
        }
        if (!this.hutSpawnConfig || Object.keys(this.hutSpawnConfig).length === 0) return;

        this.timeSinceLastHutActivationCheck += deltaTime;

        if (this.timeSinceLastHutActivationCheck >= this.HUT_ACTIVATION_CHECK_INTERVAL) {
            this.timeSinceLastHutActivationCheck = 0;
            const maxAllowedActive = Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE +
                                   (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));

            for (const hut of this.potentialSpawnerHuts) {
                if (hut.isDestroyed || hut.isActivelySpawning || hut.isMissionTarget) continue;

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
                        const numToSpawnBaseMin = this.hutSpawnConfig.UNITS_PER_SPAWN_MIN || 1;
                        const numToSpawnBaseMax = this.hutSpawnConfig.UNITS_PER_SPAWN_MAX || 2;
                        const phaseIncrement = this.hutSpawnConfig.UNITS_PER_SPAWN_PHASE_INCREMENT || 0;
                        let currentMinUnits = Math.max(1, Math.floor(numToSpawnBaseMin + (this.game.currentPhaseIndex * phaseIncrement)));
                        let currentMaxUnits = Math.max(currentMinUnits, Math.floor(numToSpawnBaseMax + (this.game.currentPhaseIndex * phaseIncrement)));
                        hut.unitsToSpawnThisBurst = this.rng.nextInt(currentMinUnits, currentMaxUnits);
                        hut.timeUntilNextUnitInBurst = this.rng.nextFloat(
                            (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5),
                            (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX || 10)
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

            if (hut.delayedDamageSpawnTimer && hut.delayedDamageSpawnTimer > 0) {
                hut.delayedDamageSpawnTimer -= deltaTime;
                if (hut.delayedDamageSpawnTimer <= 0) {
                    hut.delayedDamageSpawnTimer = 0;
                    const damageSpawnCount = this.hutSpawnConfig.UNITS_TO_SPAWN_ON_DAMAGE || this.rng.nextInt(1,2);
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] Hut ${hut.name || hut.id} damage spawn: ${damageSpawnCount} units.`);
                    for (let k = 0; k < damageSpawnCount; k++) {
                        this.attemptSingleSpawnFromHut(hut);
                    }
                     hut.spawnCooldownTimer = this.rng.nextFloat(
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE || 10),
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE || 20)
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
                            (this.hutSpawnConfig.TIME_BETWEEN_UNITS_IN_BURST_MIN || 0.2),
                            (this.hutSpawnConfig.TIME_BETWEEN_UNITS_IN_BURST_MAX || 0.5)
                        );
                    } else {
                        hut.spawnCooldownTimer = this.rng.nextFloat(
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS || 15),
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MAX_SECONDS || 30)
                        );
                    }
                }
            } else if (hut.delayedDamageSpawnTimer <= 0) {
                hut.spawnCooldownTimer -= deltaTime;
                if (hut.spawnCooldownTimer <= 0) {
                    const numToSpawnBaseMin = this.hutSpawnConfig.UNITS_PER_SPAWN_MIN || 1;
                    const numToSpawnBaseMax = this.hutSpawnConfig.UNITS_PER_SPAWN_MAX || 2;
                    const phaseIncrement = this.hutSpawnConfig.UNITS_PER_SPAWN_PHASE_INCREMENT || 0;
                    let currentMinUnits = Math.max(1, Math.floor(numToSpawnBaseMin + (this.game.currentPhaseIndex * phaseIncrement)));
                    let currentMaxUnits = Math.max(currentMinUnits, Math.floor(numToSpawnBaseMax + (this.game.currentPhaseIndex * phaseIncrement)));
                    hut.unitsToSpawnThisBurst = this.rng.nextInt(currentMinUnits, currentMaxUnits);
                    hut.timeUntilNextUnitInBurst = this.rng.nextFloat(
                        (this.hutSpawnConfig.TIME_BETWEEN_UNITS_IN_BURST_MIN || 0.2),
                        (this.hutSpawnConfig.TIME_BETWEEN_UNITS_IN_BURST_MAX || 0.2) 
                    ); 
                }
            }
        }
    }
    
    attemptSingleSpawnFromHut(hut) {
        if (hut.isDestroyed || !this.rng) return false;

        const maxUnitsPerHut = Math.floor((this.hutSpawnConfig.MAX_UNITS_PER_HUT_BASE || 10) + (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_UNITS_PER_HUT_PHASE_INCREMENT || 2)));
        if (hut.unitsSpawnedFromHut >= maxUnitsPerHut) {
            if (CONFIG.DEBUG_LOGGING) console.log(`[Level] Hut ${hut.name || hut.id} has reached max units spawned (${hut.unitsSpawnedFromHut}/${maxUnitsPerHut}).`);
            hut.isActivelySpawning = false;
            this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== hut);
            return false;
        }

        const hutCenterX = hut.x + hut.width / 2;
        const hutBottomEdgeY = hut.y + hut.height;
        const spawnOffsetX = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
        const spawnOffsetY = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
        const spawnAreaWidth = this.hutSpawnConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;
        const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
        const spawnLineCenterX = hutCenterX + spawnOffsetX;
        const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;
        const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;
        const maxPlacementAttempts = this.hutSpawnConfig.MAX_SPAWN_ATTEMPTS_PER_SINGLE_UNIT || 3;

        let spawnX, spawnClear = false;
        for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
            spawnX = this.rng.nextFloat(spawnLineMinX, spawnLineMinX + spawnAreaWidth);
            spawnX = Math.max(gruntSize / 2, Math.min(spawnX, (CONFIG.WORLD_WIDTH || 0) - gruntSize / 2));
            const clampedSpawnY = Math.max(gruntSize / 2, Math.min(spawnCenterY, (CONFIG.WORLD_HEIGHT || 0) - gruntSize / 2));
            if (this.playableMinY !== undefined && clampedSpawnY < this.playableMinY + gruntSize / 2) continue;

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
            let angleFromSpawn = Math.PI / 2; 
            if (distance(spawnX, spawnCenterY, hutCenterX, hut.y + hut.height / 2) > 10) {
                angleFromSpawn = Math.atan2(spawnCenterY - (hut.y + hut.height / 2), spawnX - hutCenterX);
            }
            let initialTargetX = spawnX + Math.cos(angleFromSpawn) * moveOutDist;
            let initialTargetY = spawnCenterY + Math.sin(angleFromSpawn) * moveOutDist;
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
            const hutCenterX = hut.x + hut.width / 2;
            const hutBottomEdgeY = hut.y + hut.height;
            const spawnOffsetX = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_CENTER_X || 0;
            const spawnOffsetY = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
            const spawnAreaWidth = this.hutSpawnConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;
            const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
const spawnLineCenterX = hut.isFlippedHorizontally ? hutCenterX - spawnOffsetX : hutCenterX + spawnOffsetX;
            const spawnLineMinX = spawnLineCenterX - spawnAreaWidth / 2;
            const debugSpawnHeight = (CONFIG.POSSUM_GRUNT_SIZE || 14) * 0.5;
            ctx.fillRect(spawnLineMinX, spawnCenterY - debugSpawnHeight / 2, spawnAreaWidth, debugSpawnHeight);
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