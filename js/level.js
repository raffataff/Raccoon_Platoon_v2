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
        this.rng = null; // Will be initialized with a seed

        this.potentialSpawnerHuts = [];
        this.activeSpawningHuts = [];
        this.hutSpawnConfig = (CONFIG.ENEMY_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING)
                            ? CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING
                            : {};
        this.timeSinceLastHutActivationCheck = 0;
        this.HUT_ACTIVATION_CHECK_INTERVAL = 1.0;
        this.initialHostageCount = 0; 
        this.missionTargetObstacles = []; // For DESTROY_TARGET objectives
    }

    _getObstacleCollisionShape(obstacle) {
        /* ... (Unchanged from previous complete version) ... */
        if (obstacle.collisionShape) {
            const shapeDef = obstacle.collisionShape;
            const obsCurrentWidth = obstacle.width;
            const obsCurrentHeight = obstacle.height;

            if (shapeDef.type === 'rectangle') {
                return {
                    type: 'rectangle',
                    x: obstacle.x + (typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || 0)),
                    y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || 0)),
                    width: (typeof shapeDef.width === 'function' ? shapeDef.width(obsCurrentWidth, obsCurrentHeight) : (shapeDef.width || obsCurrentWidth)),
                    height: (typeof shapeDef.height === 'function' ? shapeDef.height(obsCurrentWidth, obsCurrentHeight) : (shapeDef.height || obsCurrentHeight))
                };
            } else if (shapeDef.type === 'circle') {
                return {
                    type: 'circle',
                    x: obstacle.x + (typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || obsCurrentWidth / 2)),
                    y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || obsCurrentHeight / 2)),
                    radius: (typeof shapeDef.radius === 'function' ? shapeDef.radius(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radius || Math.min(obsCurrentWidth, obsCurrentHeight) / 2))
                };
            } else if (shapeDef.type === 'ellipse') {
                return {
                    type: 'ellipse',
                    x: obstacle.x + (typeof shapeDef.offsetX === 'function' ? shapeDef.offsetX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetX || obsCurrentWidth / 2)),
                    y: obstacle.y + (typeof shapeDef.offsetY === 'function' ? shapeDef.offsetY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.offsetY || obsCurrentHeight / 2)),
                    radiusX: (typeof shapeDef.radiusX === 'function' ? shapeDef.radiusX(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radiusX || obsCurrentWidth / 2)),
                    radiusY: (typeof shapeDef.radiusY === 'function' ? shapeDef.radiusY(obsCurrentWidth, obsCurrentHeight) : (shapeDef.radiusY || obsCurrentHeight / 2))
                };
            }
        }
        // Fallback for obstacles without a defined collisionShape (e.g. borders, simple old obstacles)
        // or if type is not recognized above.
        if (obstacle.type === (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE) || 
            obstacle.type === 'border_wall' || 
            obstacle.type === 'extraction_zone') { 
             return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
        }
        // Default to the obstacle's bounding box if no specific shape defined
        return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
    }

    _rectOverlap(rect1, rect2) {
        /* ... (Unchanged from previous complete version) ... */
        return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y);
    }

    _isPlacementInvalid(newObstacleShape, newIsDecoration, existingObstacles, extraKeepOutZones = []) {
        /* ... (Unchanged from previous complete version) ... */
        // Check against extra keep-out zones first
        for (const zone of extraKeepOutZones) {
            if (rectOverlap(newObstacleShape, zone)) {
                return true; // Invalid if it overlaps a keep-out zone
            }
        }

        for (const existing of existingObstacles) {
            if (newIsDecoration && existing.isDecoration) { 
                continue;
            }
    
            const existingShape = this._getObstacleCollisionShape(existing);
            if (!existingShape) continue;
    
            let collision = false;
            if (newObstacleShape.type === 'circle') {
                if (existingShape.type === 'rectangle') collision = rectCircleOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = circleOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'ellipse') collision = circleEllipseOverlap(newObstacleShape, existingShape);
            } else if (newObstacleShape.type === 'rectangle') {
                if (existingShape.type === 'rectangle') collision = rectOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = rectCircleOverlap(newObstacleShape, existingShape);
                else if (existingShape.type === 'ellipse') collision = rectEllipseOverlap(newObstacleShape, existingShape);
            } else if (newObstacleShape.type === 'ellipse') {
                if (existingShape.type === 'rectangle') collision = rectEllipseOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = circleEllipseOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'ellipse') {
                    const r1 = { x: newObstacleShape.x - newObstacleShape.radiusX, y: newObstacleShape.y - newObstacleShape.radiusY, width: newObstacleShape.radiusX * 2, height: newObstacleShape.radiusY * 2 };
                    const r2 = { x: existingShape.x - existingShape.radiusX, y: existingShape.y - existingShape.radiusY, width: existingShape.radiusX * 2, height: existingShape.radiusY * 2 };
                    collision = rectOverlap(r1, r2);
                }
            }
            
            if (collision) {
                if (newIsDecoration && !existing.isDecoration && !existing.blocksMovement && existing.providesCover) {
                    continue; 
                }
                return true; 
            }
        }
        return false;
    }

    isSpawnPointClear(x, y, unitSize, existingObstacles, existingUnits = []) {
        /* ... (Unchanged from previous complete version) ... */
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        if (this._isPlacementInvalid(unitShape, false, existingObstacles)) { // Units are not decorations
            return false;
        }

        // Check against other units
        for (const unit of existingUnits) {
            if (unit.isAlive()) {
                const distSq = (x - unit.x) * (x - unit.x) + (y - unit.y) * (y - unit.y);
                // Ensure units don't spawn overlapping
                const minSeparationDist = (unitSize / 2 + unit.size / 2) + (this.hutSpawnConfig.MIN_DISTANCE_FROM_EXISTING_UNIT_SPAWN || 5); 
                if (distSq < minSeparationDist * minSeparationDist) {
                    return false;
                }
            }
        }
        return true;
    }

    damageObstacle(obstacle, amount, attackerUnit = null) {
        /* ... (Unchanged from previous complete version) ... */
        if (!obstacle || !obstacle.destructible || obstacle.isDestroyed || obstacle.hp === undefined) {
            return;
        }
        const wasAlive = obstacle.hp > 0; // Check if it was alive before taking damage

        obstacle.hp -= amount;

        // --- NEW: Hut spawns units when shot ---
        if (wasAlive && obstacle.type === 'possum_hut' && obstacle.hp > 0 && !obstacle.isDestroyed) {
            const isSpawner = this.potentialSpawnerHuts.includes(obstacle) || this.activeSpawningHuts.includes(obstacle);
            // Trigger spawn if it's a mission target OR a spawner that isn't already about to spawn immediately
            if (obstacle.isMissionTarget || isSpawner) {
                if (!obstacle.damageSpawnCooldown || obstacle.damageSpawnCooldown <= 0) {
                    // Set a short delay for the "alarm" spawn
                    obstacle.delayedDamageSpawnTimer = (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX_ON_DAMAGE || 0.5) + (Math.random() * 0.3 - 0.15); // ~0.35 to 0.65s
                    obstacle.damageSpawnCooldown = (this.hutSpawnConfig.MIN_COOLDOWN_BETWEEN_DAMAGE_SPAWNS || 5.0); // Prevent spamming damage spawns
                    
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] Hut ${obstacle.name || obstacle.id} shot! Scheduling damage spawn in ${obstacle.delayedDamageSpawnTimer.toFixed(1)}s.`);

                    // If it wasn't actively spawning, make it so, but with a short initial burst
                    if (!this.activeSpawningHuts.includes(obstacle) && this.potentialSpawnerHuts.includes(obstacle)) {
                        const maxAllowedActive = Math.floor(this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_BASE +
                            (this.game.currentPhaseIndex * (this.hutSpawnConfig.MAX_ACTIVE_SPAWNING_HUTS_INCREMENT_PER_PHASE || 0)));
                        if (this.activeSpawningHuts.length < maxAllowedActive) {
                            obstacle.isActivelySpawning = true; // Mark it so it processes in updateHutSpawning
                            // It will use its delayedDamageSpawnTimer first
                            this.activeSpawningHuts.push(obstacle);
                        }
                    }
                }
            }
        }
        // --- END NEW ---


        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;
            // ... (rest of existing destroy logic: sfx, remove from activeSpawners, update navGrid, explosion)
            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);

            if (obstacleDef && obstacleDef.sfxOnDestroy && this.game && this.game.audioManager) {
                this.game.audioManager.play(obstacleDef.sfxOnDestroy);
            } 
            else if (obstacle.type === 'possum_hut' && this.game && this.game.audioManager && !obstacleDef?.sfxOnDestroy) { 
                this.game.audioManager.play('POSSUM_HUT_DESTROYED');
            }
            
            if (obstacle.type === 'possum_hut') { 
                this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== obstacle);
                const potIndex = this.potentialSpawnerHuts.indexOf(obstacle);
                if (potIndex > -1) this.potentialSpawnerHuts.splice(potIndex, 1);
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

    _getRandomObstacleTemplate() {
        /* ... (Unchanged from previous complete version) ... */
        const definitions = CONFIG.OBSTACLE_DEFINITIONS || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }
        
        let totalWeight = 0; 
        definitions.forEach(def => {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj => 
                    obj.type === "DESTROY_TARGET" && obj.targetTypeKey === def.type
                );
            }

            if (def.type !== 'extraction_zone' && !isCurrentMissionTargetType) {
                totalWeight += (def.spawnWeight || 0);
            }
        });

        if (totalWeight === 0) {
            const validDefs = definitions.filter(def => {
                let isCurrentMissionTargetType = false;
                if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                     isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj => 
                        obj.type === "DESTROY_TARGET" && obj.targetTypeKey === def.type
                    );
                }
                return def.type !== 'extraction_zone' && !isCurrentMissionTargetType;
            });
            if (validDefs.length > 0) return this.rng.pickFrom(validDefs);
            return null;
        }
        
        let randomNum = this.rng.next() * totalWeight;
        for (const def of definitions) {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                 isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj => 
                    obj.type === "DESTROY_TARGET" && obj.targetTypeKey === def.type
                );
            }
            if (def.type === 'extraction_zone' || isCurrentMissionTargetType) continue;

            randomNum -= (def.spawnWeight || 0); 
            if (randomNum <= 0) return def; 
        }

        const lastValidDefs = definitions.filter(def => {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                 isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj => 
                    obj.type === "DESTROY_TARGET" && obj.targetTypeKey === def.type
                );
            }
            return def.type !== 'extraction_zone' && !isCurrentMissionTargetType;
        });
        return lastValidDefs.pop() || (lastValidDefs.length > 0 ? lastValidDefs[0] : null);
    }

    generateNavigationGrid(worldWidth, worldHeight) {
        /* ... (Unchanged from previous complete version) ... */
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 16;
        this.gridWidth = Math.floor(worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(worldHeight / this.gridCellSize);
        this.navGrid = [];

        // --- MODIFIED: Define pathing clearance radius ---
        const unitClearanceRadius = (CONFIG.RACCOON_SIZE / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);
        // --- END MODIFIED ---

        for (let y = 0; y < this.gridHeight; y++) {
            this.navGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.navGrid[y][x] = 0; // Default to walkable
                
                // --- MODIFIED: Cell representation for collision check ---
                // Check a representative point of the cell, e.g., its center
                const cellCenterX = x * this.gridCellSize + this.gridCellSize / 2;
                const cellCenterY = y * this.gridCellSize + this.gridCellSize / 2;
                // Or, represent cell as a small rectangle for more accuracy if needed
                const cellRect = {
                    x: x * this.gridCellSize,
                    y: y * this.gridCellSize,
                    width: this.gridCellSize,
                    height: this.gridCellSize
                };
                // --- END MODIFIED ---

                for (const obs of this.obstacles) {
                    if (obs.blocksMovement && !obs.isDestroyed) { 
                        const obsShape = this._getObstacleCollisionShape(obs);
                        if (!obsShape) continue;

                        // --- MODIFIED: Inflate obstacle shape for pathing ---
                        let inflatedObsShape = {...obsShape}; // Clone original shape

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
                        // --- END MODIFIED ---
                        
                        let collision = false;
                        // Check if the cell's center point is inside the inflated obstacle shape
                        if (inflatedObsShape.type === 'rectangle') {
                            collision = pointInRectangle(cellCenterX, cellCenterY, inflatedObsShape);
                        } else if (inflatedObsShape.type === 'circle') {
                            collision = pointInCircle(cellCenterX, cellCenterY, inflatedObsShape);
                        } else if (inflatedObsShape.type === 'ellipse') {
                            collision = pointInEllipse(cellCenterX, cellCenterY, inflatedObsShape);
                        }
                        
                        // More accurate (but more expensive) check: does cell rectangle overlap inflated obstacle?
                        // if (inflatedObsShape.type === 'rectangle') {
                        //     collision = rectOverlap(cellRect, inflatedObsShape);
                        // } else if (inflatedObsShape.type === 'circle') {
                        //     collision = rectCircleOverlap(cellRect, inflatedObsShape);
                        // } // etc. for ellipse

                        if (collision) {
                            this.navGrid[y][x] = 1; // Mark as blocked
                            break; 
                        }
                    }
                }
            }
        }
    }

    updateNavigationGridForObstacle(obstacle, isDestroyedAndNowWalkable) {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.navGrid || !obstacle) return;
        
        // --- MODIFIED: Define pathing clearance radius, same as in generateNavigationGrid ---
        const unitClearanceRadius = (CONFIG.RACCOON_SIZE / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 12);
        // --- END MODIFIED ---

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

        // --- MODIFIED: Expand the bounding box for update by the clearance radius too ---
        const updateMargin = Math.ceil(unitClearanceRadius / this.gridCellSize) + 1; // Number of cells to expand check by
        const startGridX = Math.max(0, Math.floor(minObsX / this.gridCellSize) - updateMargin); 
        const endGridX = Math.min(this.gridWidth -1, Math.ceil(maxObsX / this.gridCellSize) + updateMargin);
        const startGridY = Math.max(0, Math.floor(minObsY / this.gridCellSize) - updateMargin);
        const endGridY = Math.min(this.gridHeight -1, Math.ceil(maxObsY / this.gridCellSize) + updateMargin);
        // --- END MODIFIED ---


        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                if (y < 0 || y >= this.gridHeight || x < 0 || x >= this.gridWidth) continue;

                const cellCenterX = x * this.gridCellSize + this.gridCellSize / 2;
                const cellCenterY = y * this.gridCellSize + this.gridCellSize / 2;
                
                let cellIsBlocked = false;
                for (const otherObs of this.obstacles) {
                    // Consider the obstacle being updated as "destroyed" if isDestroyedAndNowWalkable is true
                    // and it no longer blocks movement
                    const currentObsBlocks = (otherObs === obstacle)
                        ? (isDestroyedAndNowWalkable ? (obstacle.blocksMovementOnDestroy !== undefined ? obstacle.blocksMovementOnDestroy : false) : otherObs.blocksMovement)
                        : (otherObs.blocksMovement && !otherObs.isDestroyed);

                    if (currentObsBlocks) { 
                        const otherObsShape = this._getObstacleCollisionShape(otherObs);
                        if (!otherObsShape) continue;

                        // Inflate this 'otherObsShape' for checking against the cell center
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
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
        return {
            x: Math.floor(worldX / this.gridCellSize),
            y: Math.floor(worldY / this.gridCellSize)
        };
    }

    gridToWorldCoords(gridX, gridY) {
        /* ... (Unchanged from previous complete version) ... */
        return {
            x: gridX * this.gridCellSize + this.gridCellSize / 2,
            y: gridY * this.gridCellSize + this.gridCellSize / 2
        };
    }

    _weightedRandomSelect(items, rngInstance) {
        /* ... (Copied from game.js for self-containment) ... */
        if (!items || items.length === 0) return null;
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        if (totalWeight <= 0) { 
            if (items.length > 0) return rngInstance.pickFrom(items);
            return null;
        }
        let randomVal = rngInstance.nextFloat(0, totalWeight);
        for (const item of items) {
            randomVal -= (item.weight || 1);
            if (randomVal <= 0) {
                return item;
            }
        }
        return items.length > 0 ? items[items.length - 1] : null;
    }

    _spawnInitialGuardsForObject(parentObject, objectDefinition) {
        /* ... (As defined in proposal) ... */
        if (!objectDefinition.initialGuardPack || !objectDefinition.initialGuardPack.enabled) {
            return;
        }

        const pack = objectDefinition.initialGuardPack;
        const phaseBonus = Math.floor((this.game.currentPhaseIndex || 0) * (pack.countPerPhaseBonus || 0));
        const guardCount = this.rng.nextInt(pack.countRange[0], pack.countRange[1]) + phaseBonus;

        if (guardCount <= 0) return;

        const parentCenterX = parentObject.x + (parentObject.width / 2);
        const parentCenterY = parentObject.y + (parentObject.height / 2);
        const spawnRadius = pack.spawnRadius || 60;
        const playableBounds = {
             minX: (CONFIG.LEVEL_GENERATION.BORDER_WIDTH || 30) + (CONFIG.LEVEL_GENERATION.WORLD_MARGIN || 20),
             maxX: (CONFIG.WORLD_WIDTH || 0) - (CONFIG.LEVEL_GENERATION.BORDER_WIDTH || 30) - (CONFIG.LEVEL_GENERATION.WORLD_MARGIN || 20),
             minY: (CONFIG.LEVEL_GENERATION.BORDER_WIDTH || 30) + (CONFIG.LEVEL_GENERATION.WORLD_MARGIN || 20),
             maxY: (CONFIG.WORLD_HEIGHT || 0) - (CONFIG.LEVEL_GENERATION.BORDER_WIDTH || 30) - (CONFIG.LEVEL_GENERATION.WORLD_MARGIN || 20)
        };
        
        let spawnedGuards = 0;
        for (let i = 0; i < guardCount; i++) {
            const unitDef = this._weightedRandomSelect(pack.unitPool, this.rng);
            if (!unitDef) continue;

            let GuardClass;
            let guardSize;
            if (unitDef.type === 'possum_grunt') {
                GuardClass = PossumGrunt;
                guardSize = CONFIG.POSSUM_GRUNT_SIZE;
            } else if (unitDef.type === 'possum_heavy') {
                GuardClass = PossumHeavy;
                guardSize = CONFIG.POSSUM_HEAVY_SIZE;
            } else {
                continue; // Skip unknown types
            }

            let guardX, guardY, placed = false;
            for (let attempt = 0; attempt < 15; attempt++) {
                const angle = this.rng.nextFloat(0, Math.PI * 2);
                const radius = this.rng.nextFloat(guardSize, spawnRadius);
                guardX = parentCenterX + Math.cos(angle) * radius;
                guardY = parentCenterY + Math.sin(angle) * radius;

                // Clamp to playable area
                guardX = Math.max(playableBounds.minX + guardSize / 2, Math.min(guardX, playableBounds.maxX - guardSize / 2));
                guardY = Math.max(playableBounds.minY + guardSize / 2, Math.min(guardY, playableBounds.maxY - guardSize / 2));

                if (this.isSpawnPointClear(guardX, guardY, guardSize, this.obstacles, this.game.enemyUnits)) {
                    const newGuard = new GuardClass(guardX, guardY, this.game);
                    newGuard.guardPost = { x: guardX, y: guardY }; // Set guard post
                    
                    this.game.enemyUnits.push(newGuard);
                    this.game.incrementObjectiveEnemyCount(1); // Crucial for objective tracking
                    if (this.game.spatialGrid) {
                        this.game.spatialGrid.addObject(newGuard);
                    }
                    spawnedGuards++;
                    placed = true;
                    break;
                }
            }
        }
        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Spawned ${spawnedGuards}/${guardCount} initial guards for object: ${parentObject.name || parentObject.type}`);
    }

    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParamsContainer = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}, missionSeed) {
        this.rng = new SeededRandom(missionSeed);
        this.obstacles = [];
        this.potentialSpawnerHuts = []; 
        this.activeSpawningHuts = [];
        this.initialHostageCount = 0; 
        this.missionTargetObstacles = [];

        const extraKeepOutZones = [];

        if (this.game) {
            this.game.enemyUnits = [];
            this.game.gameObjects = [];
            this.game.hostageUnits = []; 
        }

        const missionObjectives = missionParamsContainer.objectives || [];
        const baseParams = missionParamsContainer.baseParams || {};

        const genConfig = CONFIG.LEVEL_GENERATION || {};
        const playableMinX = (genConfig.BORDER_WIDTH || 30) + (genConfig.WORLD_MARGIN || 20);
        const playableMaxX = worldWidth - (genConfig.BORDER_WIDTH || 30) - (genConfig.WORLD_MARGIN || 20);
        const playableMinY = (genConfig.BORDER_WIDTH || 30) + (genConfig.WORLD_MARGIN || 20);
        const playableMaxY = worldHeight - (genConfig.BORDER_WIDTH || 30) - (genConfig.WORLD_MARGIN || 20);
        const playableWidth = Math.max(0, playableMaxX - playableMinX); 
        const playableHeight = Math.max(0, playableMaxY - playableMinY);
        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20));
        const playerSpawnZoneHeight = Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20));
        const playerSpawnZone = { x: playableMinX, y: playableMaxY - playerSpawnZoneHeight, width: playerSpawnZoneWidth, height: playerSpawnZoneHeight };
        extraKeepOutZones.push(playerSpawnZone);

        const sideBorderWidth = genConfig.BORDER_WIDTH || 30;
        const sideBorderColor = genConfig.BORDER_COLOR || '#25221D';
        const borderObstacleTypeName = genConfig.BORDER_OBSTACLE_TYPE;
        let borderObstacleTemplate = null;
        if (borderObstacleTypeName) {
            borderObstacleTemplate = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === borderObstacleTypeName);
        }
        let borderSpriteImage = null;
        let borderSegmentWidth = 0;
        let borderSegmentHeight = 0;
        let borderSpriteScale = 1.0;
        let borderSpritePath = null;

        if (borderObstacleTemplate) {
            if (borderObstacleTemplate.type === 'fence_barbed_straight_long' && CONFIG.FENCE_BARBED_LONG_SPRITE_FILES && CONFIG.FENCE_BARBED_LONG_SPRITE_FILES.length > 0) {
                borderSpritePath = (CONFIG.FENCE_BARBED_SPRITE_PATH || '') + this.rng.pickFrom(CONFIG.FENCE_BARBED_LONG_SPRITE_FILES);
            } else if (borderObstacleTemplate.spriteNormal) { 
                borderSpritePath = borderObstacleTemplate.spriteNormal;
            }
            if (borderSpritePath) borderSpriteImage = preloadedAssetImages[borderSpritePath];
            borderSpriteScale = borderObstacleTemplate.spriteScale !== undefined ? borderObstacleTemplate.spriteScale : 1.0;
            if (borderSpriteImage) {
                borderSegmentWidth = borderSpriteImage.naturalWidth * borderSpriteScale;
                borderSegmentHeight = borderSpriteImage.naturalHeight * borderSpriteScale;
            } else if (borderObstacleTemplate.width && borderObstacleTemplate.height) {
                borderSegmentWidth = borderObstacleTemplate.width; borderSegmentHeight = borderObstacleTemplate.height;
            } else { borderSegmentHeight = genConfig.BORDER_WIDTH || 30; borderObstacleTemplate = null; }
        }
        let topBottomBorderHeight = (borderObstacleTemplate && borderSegmentHeight > 0) ? borderSegmentHeight : (genConfig.BORDER_WIDTH || 30);

        if (borderObstacleTemplate && borderSpriteImage && borderSegmentWidth > 0 && borderSegmentHeight > 0) {
            const numSegments = Math.ceil(worldWidth / borderSegmentWidth);
            for (let i = 0; i < numSegments; i++) {
                const segmentX = i * borderSegmentWidth;
                const commonProps = {
                    type: borderObstacleTemplate.type, name: borderObstacleTemplate.name, 
                    destructible: borderObstacleTemplate.destructible || false, 
                    hp: borderObstacleTemplate.hp || Infinity, maxHp: borderObstacleTemplate.maxHp || Infinity, 
                    isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false,
                    spriteNormalPath: borderSpritePath, imageNormal: borderSpriteImage, spriteScale: borderSpriteScale,
                    collisionShape: borderObstacleTemplate.collisionShape ? JSON.parse(JSON.stringify(borderObstacleTemplate.collisionShape)) : { type: 'rectangle', offsetX: 0, offsetY: 0, width: w => w, height: h => h }
                };
                this.obstacles.push({ ...commonProps, x: segmentX, y: 0, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Top)`});
                this.obstacles.push({ ...commonProps, x: segmentX, y: worldHeight - topBottomBorderHeight, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Bottom)`});
            }
        } else {
            this.obstacles.push({ x: 0, y: 0, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Top', color: sideBorderColor, destructible: false, hp: Infinity,maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
            this.obstacles.push({ x: 0, y: worldHeight - topBottomBorderHeight, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Bottom', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        }
        this.obstacles.push({ x: 0, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Left', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        this.obstacles.push({ x: worldWidth - sideBorderWidth, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Right', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });

        const rescueObjectiveInstance = missionObjectives.find(obj => obj.type === 'RESCUE_HOSTAGES');
        if (rescueObjectiveInstance) {
            const ezConfig = genConfig.EXTRACTION_ZONE_SETTINGS || {};
            const ezObstacle = {
                type: 'extraction_zone',
                name: ezConfig.NAME || "Extraction Zone",
                color: ezConfig.FALLBACK_COLOR || 'rgba(0,0,255,0.3)',
                imageNormal: preloadedAssetImages[ezConfig.SPRITE_PATH] || null,
                spriteNormalPath: ezConfig.SPRITE_PATH,
                spriteScale: ezConfig.SPRITE_SCALE || 1.0,
                blocksMovement: false, providesCover: false, destructible: false,
                isDestroyed: false, isPickup: false, isDecoration: true,
                hp: Infinity, maxHp: Infinity
            };
            ezObstacle.width = ezObstacle.imageNormal ? ezObstacle.imageNormal.naturalWidth * ezObstacle.spriteScale : (ezConfig.WIDTH || 100);
            ezObstacle.height = ezObstacle.imageNormal ? ezObstacle.imageNormal.naturalHeight * ezObstacle.spriteScale : (ezConfig.HEIGHT || 100);

            let placedEZ = false;
            for (let attempt = 0; attempt < (ezConfig.MAX_PLACEMENT_ATTEMPTS || 20) && !placedEZ; attempt++) {
                ezObstacle.x = this.rng.nextFloat(playableMinX, playableMaxX - ezObstacle.width);
                ezObstacle.y = this.rng.nextFloat(playableMinY, playableMaxY - ezObstacle.height);
                const distToPlayerSpawn = distance(ezObstacle.x + ezObstacle.width / 2, ezObstacle.y + ezObstacle.height / 2, playerSpawnZone.x + playerSpawnZone.width / 2, playerSpawnZone.y + playerSpawnZone.height / 2);
                
                if (distToPlayerSpawn >= (ezConfig.MIN_DISTANCE_FROM_PLAYER_SPAWN || 300) && !this._rectOverlap(ezObstacle, playerSpawnZone)) {
                    this.obstacles.push(ezObstacle);
                    this.game.addVisualEffect('extraction_zone', { obstacle: ezObstacle });
                    placedEZ = true;
                }
            }
            if (!placedEZ) { 
                ezObstacle.x = playableMinX; ezObstacle.y = playableMinY; 
                this.obstacles.push(ezObstacle); 
                this.game.addVisualEffect('extraction_zone', { obstacle: ezObstacle });
            }
        }
        
        missionObjectives.forEach(objective => {
            if (objective.type === 'DESTROY_TARGET' && objective.targetTypeKey && objective.totalToAchieve > 0) {
                const targetTemplateOriginal = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === objective.targetTypeKey);
                
                if (targetTemplateOriginal) {
                    for (let i = 0; i < objective.totalToAchieve; i++) {
                        let targetX, targetY, placedTarget = false;
                        let actualTargetSpritePath = null;
                        let targetImage = null;
                        const template = targetTemplateOriginal; 

                        let targetFilesArray = [];
                        let targetPathBase = '';
                        let targetUseRandomSpriteFromList = false;

                        if (template.type === 'possum_hut') { targetFilesArray = CONFIG.POSSUM_HUT_SPRITE_FILES || []; targetPathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || ''; targetUseRandomSpriteFromList = true; }
                        else if (template.type === 'possum_relay_tower') { targetFilesArray = CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES || []; targetPathBase = CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH || ''; targetUseRandomSpriteFromList = true; }
                        else if (template.spriteNormal) { actualTargetSpritePath = template.spriteNormal; }

                        if (targetUseRandomSpriteFromList && targetFilesArray.length > 0 && targetPathBase) {
                            actualTargetSpritePath = targetPathBase + this.rng.pickFrom(targetFilesArray);
                        }
                        if (actualTargetSpritePath) targetImage = preloadedAssetImages[actualTargetSpritePath];

                        const targetWidth = targetImage ? targetImage.naturalWidth * (template.spriteScale || 1) : (template.width || 64);
                        const targetHeight = targetImage ? targetImage.naturalHeight * (template.spriteScale || 1) : (template.height || 64);

                        for (let attempt = 0; attempt < (genConfig.OBSTACLES.PLACEMENT_MAX_ATTEMPTS || 15); attempt++) {
                            targetX = this.rng.nextFloat(playableMinX, playableMaxX - targetWidth);
                            targetY = this.rng.nextFloat(playableMinY, playableMaxY - targetHeight);
                            
                            const tempTargetForShapeCheck = { 
                                x:targetX, y:targetY, 
                                width:targetWidth, height:targetHeight, 
                                collisionShape: template.collisionShape 
                            };
                            const collisionShapeForPlacementCheck = this._getObstacleCollisionShape(tempTargetForShapeCheck);

                            if (!this._isPlacementInvalid(collisionShapeForPlacementCheck, template.isDecoration, this.obstacles, extraKeepOutZones)) {
                                const missionTargetObs = {
                                    x: targetX, y: targetY, width: targetWidth, height: targetHeight,
                                    type: template.type, name: `${objective.targetNameSingular || template.name || template.type} (Objective)`,
                                    color: template.color, destructible: template.destructible,
                                    hp: template.hp, maxHp: template.maxHp, isDestroyed: false,
                                    blocksMovement: template.blocksMovement, providesCover: template.providesCover,
                                    isDecoration: template.isDecoration,
                                    spriteNormalPath: actualTargetSpritePath, imageNormal: targetImage, 
                                    spriteDestroyedPath: template.spriteDestroyed, imageDestroyed: template.spriteDestroyed ? preloadedAssetImages[template.spriteDestroyed] : null,
                                    spriteScale: template.spriteScale || 1.0, spriteDestroyedScale: template.spriteDestroyedScale,
                                    collisionShape: template.collisionShape, 
                                    isMissionTarget: true, objectiveId: objective.id,
                                    isSpawner: template.type === 'possum_hut',
                                    spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                                    delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0 
                                };
                                this.obstacles.push(missionTargetObs);
                                this.missionTargetObstacles.push(missionTargetObs);
                                if (missionTargetObs.isSpawner) this.potentialSpawnerHuts.push(missionTargetObs);
                                this._spawnInitialGuardsForObject(missionTargetObs, targetTemplateOriginal);
                                placedTarget = true;
                                break;
                            }
                        }
                        if (!placedTarget) console.warn(`[Level Gen] Could not place mission target type ${objective.targetTypeKey}`);
                    }
                } else { console.warn(`[Level Gen] No template found for destroyTargetTypeKey: ${objective.targetTypeKey}`); }
            }
        });

        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {}; 
        const enemyDensityFactor = baseParams.enemyDensityFactor || 1.0; 
        const baseNumEnemies = enemySpawnCfg.BASE_ENEMY_COUNT_PER_DENSITY_FACTOR || 8;
        const randomAddMax = enemySpawnCfg.RANDOM_ADDITION_FACTOR_MAX || 5; 
        const totalEnemiesToSpawn_InitialCalculation = Math.floor(baseNumEnemies * enemyDensityFactor) + this.rng.nextInt(0, Math.floor(randomAddMax * enemyDensityFactor));
        
        let enemiesSpawnedCount = 0; 
        const enemyGroups = []; 
        let bossSpawned = false;
        const assassinationObjectiveInstance = missionObjectives.find(obj => obj.type === "ASSASSINATION");

        if (assassinationObjectiveInstance && assassinationObjectiveInstance.targetDetails) {
            const targetInfo = assassinationObjectiveInstance.targetDetails;
            // Spawning for possum_boss_1
            if (targetInfo.assassinationTypeKey === 'possum_boss_1') {
                let bossX, bossY;
                const bossMaxAttempts = 25; 
                const bossSize = CONFIG.POSSUM_BOSS_1_SIZE * 5; 
                const bossArenaRadius = CONFIG.POSSUM_BOSS_1_WEAPON_RANGE * 0.5;
                
                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.5) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);
                    
                    if (this.isSpawnPointClear(bossX, bossY, bossSize, this.obstacles, [])) {
                        const boss = new PossumBoss1(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;
                        enemiesSpawnedCount++;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_BOSS_1 && CONFIG.AI.POSSUM_BOSS_1.initialGuardPack) ? CONFIG.AI.POSSUM_BOSS_1.initialGuardPack : {enabled: false} };
                        this._spawnInitialGuardsForObject(boss, bossDefinition);

                        const arenaZone = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaZone);
                        if (CONFIG.DEBUG_LOGGING) console.log(`Boss arena created at (${arenaZone.x.toFixed(0)}, ${arenaZone.y.toFixed(0)})`);

                        break;
                    }
                }
                if (!bossSpawned) {
                    console.warn(`[Level Gen] Could not find suitable spawn for Boss Target: ${targetInfo.name}.`);
                }
            }
        }
        
        const obsGenCfg = genConfig.OBSTACLES || {}; 
        const baseNumObstacles = obsGenCfg.BASE_COUNT || 20;
        const numInternalObstacles = Math.floor(baseNumObstacles * (baseParams.worldSizeFactor || 1.0)) + this.rng.nextInt(0, obsGenCfg.RANDOM_ADDITION_MAX || 8);
        const placementMaxAttempts = obsGenCfg.PLACEMENT_MAX_ATTEMPTS || 15;

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = this._getRandomObstacleTemplate();
            if (!template) { continue; }
            let obsRenderWidth, obsRenderHeight;
            let actualSpritePath = null, actualImageObject = null, actualDestroyedSpritePath = template.spriteDestroyed || null, actualDestroyedImageObject = null;
            let normalSpriteScale = template.spriteScale || 1.0, destroyedSpriteScale = template.spriteDestroyedScale;
            let filesArray = [], pathBase = '', useRandomSpriteFromList = false;
                 if (template.type === 'bush_medium') { filesArray = CONFIG.BUSH_SPRITES_32PX_FILES || []; pathBase = CONFIG.BUSH_SPRITES_32PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'bush_large') { filesArray = CONFIG.BUSH_SPRITES_64PX_FILES || []; pathBase = CONFIG.BUSH_SPRITES_64PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'fence_barbed_straight_short') { filesArray = CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'fence_barbed_straight_long') { filesArray = CONFIG.FENCE_BARBED_LONG_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rock_medium') { filesArray = CONFIG.ROCK_SPRITES_32PX_FILES || []; pathBase = CONFIG.ROCK_SPRITES_32PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rock_large') { filesArray = CONFIG.ROCK_SPRITES_64PX_FILES || []; pathBase = CONFIG.ROCK_SPRITES_64PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_single') { filesArray = CONFIG.PALM_TREE_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_double') { filesArray = CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_DOUBLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_triple') { filesArray = CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_TRIPLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'possum_hut') { filesArray = CONFIG.POSSUM_HUT_SPRITE_FILES || []; pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'possum_relay_tower') { filesArray = CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES || []; pathBase = CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'pickup_health') { filesArray = CONFIG.HEALTH_PICKUP_SPRITE_FILES || []; pathBase = CONFIG.HEALTH_PICKUP_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_fallen') { filesArray = CONFIG.PALM_TREE_FALLEN_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_FALLEN_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else { actualSpritePath = template.spriteNormal || null; }
            if (useRandomSpriteFromList) { 
                if (filesArray.length > 0 && pathBase) {
                    actualSpritePath = pathBase + this.rng.pickFrom(filesArray); 
                } else { 
                    if (CONFIG.DEBUG_LOGGING) console.warn(`[Level Gen] Obstacle type ${template.type} configured for list-based sprite but filesArray or pathBase is missing/empty.`);
                }
            }
            actualImageObject = actualSpritePath ? (preloadedAssetImages[actualSpritePath] || null) : null;
            if(actualDestroyedSpritePath) actualDestroyedImageObject = preloadedAssetImages[actualDestroyedSpritePath] || null;

            if (template.isDecoration && template.type === 'decoration_grass') {
                const grassConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.GRASS_CLUTTER) || {};
                normalSpriteScale = this.rng.nextFloat(grassConfig.MIN_SCALE || 0.8, grassConfig.MAX_SCALE || 1.2);
                obsRenderWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 16) * normalSpriteScale;
                obsRenderHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 16) * normalSpriteScale;
            } else if (actualImageObject && template.spriteScale !== undefined) {
                obsRenderWidth = actualImageObject.naturalWidth * template.spriteScale; obsRenderHeight = actualImageObject.naturalHeight * template.spriteScale; normalSpriteScale = template.spriteScale;
            } else if (template.width !== undefined && template.height !== undefined) {
                obsRenderWidth = template.width; obsRenderHeight = template.height; normalSpriteScale = 1.0;
            } else if (actualImageObject) {
                obsRenderWidth = actualImageObject.naturalWidth; obsRenderHeight = actualImageObject.naturalHeight; normalSpriteScale = 1.0;
            } else { obsRenderWidth = 32; obsRenderHeight = 32; normalSpriteScale = 1.0; }
            let obsX, obsY; let attempts = 0; let placed = false;
            do {
                obsX = this.rng.nextFloat(playableMinX, playableMaxX - obsRenderWidth);
                obsY = this.rng.nextFloat(playableMinY, playableMaxY - obsRenderHeight);
                const tempObstacleForShape = { ...template, x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight };
                const collisionCheckShape = this._getObstacleCollisionShape(tempObstacleForShape);
                
                if (!this._isPlacementInvalid(collisionCheckShape, template.isDecoration, this.obstacles, extraKeepOutZones)) {
                    const newObstacle = {
                        x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight, type: template.type, name: template.name || template.type, color: template.color,
                        destructible: template.destructible, hp: template.destructible ? template.hp : Infinity, maxHp: template.destructible ? template.maxHp : Infinity, isDestroyed: false,
                        blocksMovement: template.blocksMovement, providesCover: template.providesCover, pickupType: template.pickupType || null, pickupQuantity: template.pickupQuantity || 0,
                        isPickup: !!template.pickupType, isDecoration: !!template.isDecoration, 
                        spriteNormalPath: actualSpritePath, 
                        spriteDestroyedPath: actualDestroyedSpritePath,
                        imageNormal: actualImageObject, 
                        imageDestroyed: actualDestroyedImageObject, 
                        spriteScale: normalSpriteScale, spriteDestroyedScale: destroyedSpriteScale,
                        collisionShape: template.collisionShape || null, isSpawner: template.type === 'possum_hut',
                        spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                        delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0 
                    };
                    this.obstacles.push(newObstacle);
                    if (newObstacle.isSpawner && !newObstacle.isMissionTarget) this.potentialSpawnerHuts.push(newObstacle);
                    this._spawnInitialGuardsForObject(newObstacle, template);
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }
        
        const totalEnemiesToSpawnForThisMission = totalEnemiesToSpawn_InitialCalculation; 
        const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0; 
        const numberOfGroupsToAttempt = Math.ceil(Math.max(0, totalEnemiesToSpawnForThisMission - enemiesSpawnedCount) / Math.max(1, avgEnemiesPerGroup));


        for (let g = 0; g < numberOfGroupsToAttempt && enemiesSpawnedCount < totalEnemiesToSpawnForThisMission; g++) {
            const smallGroupChance = enemySpawnCfg.SMALL_GROUP_CHANCE || 0.6; 
            const smallGroupMin = enemySpawnCfg.SMALL_GROUP_SIZE_MIN || 1; 
            const smallGroupMax = enemySpawnCfg.SMALL_GROUP_SIZE_MAX || 3;
            let currentGroupSizeAttempt = this.rng.chance(smallGroupChance) ? this.rng.nextInt(smallGroupMin, smallGroupMax) : (smallGroupMax + this.rng.nextInt(0,1));
            currentGroupSizeAttempt = Math.min(currentGroupSizeAttempt, totalEnemiesToSpawnForThisMission - enemiesSpawnedCount); 
            if (currentGroupSizeAttempt <= 0) continue;
            let groupLeaderX, groupLeaderY, isLeaderSpawnClear; 
            let leaderPlacementAttempts = 0; 
            const leaderMaxAttempts = enemySpawnCfg.LEADER_PLACEMENT_MAX_ATTEMPTS || 20;
            
            for (let attempt = 0; attempt < leaderMaxAttempts; attempt++) {
                groupLeaderX = this.rng.nextFloat(playableMinX, playableMaxX);
                groupLeaderY = this.rng.nextFloat(playableMinY, playableMaxY);

                const leaderFootprint = {x: groupLeaderX - CONFIG.POSSUM_HEAVY_SIZE/2, y: groupLeaderY - CONFIG.POSSUM_HEAVY_SIZE/2, width: CONFIG.POSSUM_HEAVY_SIZE, height: CONFIG.POSSUM_HEAVY_SIZE};

                if (this.isSpawnPointClear(groupLeaderX, groupLeaderY, CONFIG.POSSUM_HEAVY_SIZE, this.obstacles, this.game.enemyUnits) &&
                    !this._isPlacementInvalid(leaderFootprint, false, [], extraKeepOutZones)) {
                        isLeaderSpawnClear = true;
                        break;
                }
            }

            if (isLeaderSpawnClear) {
                const currentGroupMembers = [];
                for (let m = 0; m < currentGroupSizeAttempt && enemiesSpawnedCount < totalEnemiesToSpawnForThisMission; m++) {
                    let memberX, memberY, isMemberSpawnClear; 
                    let memberPlacementAttempts = 0; const memberMaxAttempts = enemySpawnCfg.MEMBER_PLACEMENT_MAX_ATTEMPTS || 10;
                    let currentEnemyUnitSize = CONFIG.POSSUM_GRUNT_SIZE; let isHeavy = false; 
                    const heavyChance = baseParams.heavyChance || (enemySpawnCfg.DEFAULT_HEAVY_CHANCE || 0.20); 
                    const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;
                    if ((m === 0 && currentGroupSizeAttempt > 0 && this.rng.chance(heavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0)) ) || (currentGroupSizeAttempt === 1 && this.rng.chance(heavyChance))) { isHeavy = true; currentEnemyUnitSize = CONFIG.POSSUM_HEAVY_SIZE; }
                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30; const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5; const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberY = (m === 0) ? groupLeaderY : groupLeaderY + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2)); 
                        memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = {x: memberX - currentEnemyUnitSize/2, y: memberY - currentEnemyUnitSize/2, width: currentEnemyUnitSize, height: currentEnemyUnitSize};
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles, this.game.enemyUnits.concat(currentGroupMembers)) && !this._isPlacementInvalid(memberFootprint, false, [], extraKeepOutZones); 
                        memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);
                    if (isMemberSpawnClear) {
                        const enemyUnit = isHeavy ? new PossumHeavy(memberX, memberY, this.game, `PHVY-${enemiesSpawnedCount + 1}`) : new PossumGrunt(memberX, memberY, this.game, `PSM-${enemiesSpawnedCount + 1}`);
                        if (this.game && this.game.enemyUnits) this.game.enemyUnits.push(enemyUnit); 
                        currentGroupMembers.push(enemyUnit); enemiesSpawnedCount++;
                    }
                }
                if (currentGroupMembers.length > 0) enemyGroups.push(currentGroupMembers); 
            }
        }

        if (rescueObjectiveInstance) {
            const hostageConf = CONFIG.HOSTAGE_SETTINGS || {};
            const numHostagesToSpawn = rescueObjectiveInstance.totalToAchieve; 
            this.initialHostageCount = numHostagesToSpawn;
            let spawnedHostageCount = 0;
            const hostageSize = CONFIG.RACCOON_SIZE || 12;

            if (hostageConf.SPAWN_AT_HUTS && numHostagesToSpawn > spawnedHostageCount) {
                const eligibleHuts = this.obstacles.filter(hut => {
                    if (hut.type !== 'possum_hut' || hut.isDestroyed) return false; 
                    const hutCenterX = hut.x + hut.width / 2; const hutCenterY = hut.y + hut.height / 2;
                    const distToPlayerSpawn = distance(hutCenterX, hutCenterY, playerSpawnZone.x + playerSpawnZone.width / 2, playerSpawnZone.y + playerSpawnZone.height / 2);
                    return distToPlayerSpawn > (hostageConf.MIN_HUT_DISTANCE_FROM_PLAYER_SPAWN_FOR_HOSTAGE || 0);
                });
                this.rng.shuffleArray(eligibleHuts);
                const hutHostageCounts = new Map(); 
                for (const hut of eligibleHuts) {
                    if (spawnedHostageCount >= numHostagesToSpawn) break;
                    let currentHutHostageCount = hutHostageCounts.get(hut.name || hut.type + hut.x + hut.y) || 0; 
                    if (currentHutHostageCount >= (hostageConf.MAX_HOSTAGES_PER_HUT || 1)) continue;
                    let hostageX, hostageY, placed = false;
                    const hutCenterX = hut.x + hut.width / 2; const hutCenterY = hut.y + hut.height / 2;
                    const offsetX = typeof hostageConf.SPAWN_OFFSET_FROM_HUT_X === 'function' ? hostageConf.SPAWN_OFFSET_FROM_HUT_X(hut.width, hut.height) : (hostageConf.SPAWN_OFFSET_FROM_HUT_X || 0);
                    const offsetY = typeof hostageConf.SPAWN_OFFSET_FROM_HUT_Y === 'function' ? hostageConf.SPAWN_OFFSET_FROM_HUT_Y(hut.width, hut.height) : (hostageConf.SPAWN_OFFSET_FROM_HUT_Y || hut.height / 2 + 20);
                    const idealHostageX = hutCenterX + offsetX; const idealHostageY = hutCenterY + offsetY;
                    for (let attempt = 0; attempt < (hostageConf.HOSTAGE_PLACEMENT_ATTEMPTS_AT_HUT || 15); attempt++) {
                        hostageX = idealHostageX + this.rng.nextFloat(-10, 10) * (attempt * 0.1);
                        hostageY = idealHostageY + this.rng.nextFloat(-10, 10) * (attempt * 0.1);
                        hostageX = Math.max(playableMinX + hostageSize / 2, Math.min(hostageX, playableMaxX - hostageSize / 2));
                        hostageY = Math.max(playableMinY + hostageSize / 2, Math.min(hostageY, playableMaxY - hostageSize / 2));
                        if (this.isSpawnPointClear(hostageX, hostageY, hostageSize, this.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${spawnedHostageCount}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                            hutHostageCounts.set(hut.name || hut.type + hut.x + hut.y, (currentHutHostageCount + 1));
                            break;
                        }
                    }
                }
            }
            if (spawnedHostageCount < numHostagesToSpawn && hostageConf.SPAWN_WITH_ENEMY_GROUPS) {
                const spawnNearRadius = hostageConf.SPAWN_NEAR_CAPTORS_RADIUS || 40; const minCaptorGroupSize = hostageConf.MIN_CAPTORS_GROUP_SIZE || 1; const placementAttempts = hostageConf.HOSTAGE_PLACEMENT_ATTEMPTS_NEAR_GROUP || 10;
                if (enemyGroups.length > 0) {
                    const eligibleCaptorGroups = enemyGroups.filter(group => group.length >= minCaptorGroupSize);
                    this.rng.shuffleArray(eligibleCaptorGroups);
                    for (const group of eligibleCaptorGroups) {
                        if (spawnedHostageCount >= numHostagesToSpawn) break;
                        const groupLeader = group[0]; let hostageX, hostageY, placed = false;
                        for (let attempt = 0; attempt < placementAttempts; attempt++) {
                            const angle = this.rng.nextFloat(0, 2 * Math.PI); const radius = this.rng.nextFloat(0, spawnNearRadius);
                            hostageX = groupLeader.x + Math.cos(angle) * radius; hostageY = groupLeader.y + Math.sin(angle) * radius;
                            hostageX = Math.max(playableMinX + hostageSize / 2, Math.min(hostageX, playableMaxX - hostageSize / 2)); hostageY = Math.max(playableMinY + hostageSize / 2, Math.min(hostageY, playableMaxY - hostageSize / 2));
                            if (!this._isPlacementInvalid({ x: hostageX - hostageSize/2, y: hostageY - hostageSize/2, width: hostageSize, height: hostageSize }, false, [], extraKeepOutZones) && 
                                this.isSpawnPointClear(hostageX, hostageY, hostageSize, this.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
                                const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${spawnedHostageCount}`);
                                this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++; break; 
                            }
                        }
                    }
                }
            }
            if (spawnedHostageCount < numHostagesToSpawn) { 
                for (let i = spawnedHostageCount; i < numHostagesToSpawn; i++) { 
                    let hostageX, hostageY, attempts = 0; const maxPlacementAttempts = 30; let placed = false;
                    do {
                        hostageX = this.rng.nextFloat(playableMinX, playableMaxX - hostageSize);
                        hostageY = this.rng.nextFloat(playableMinY, playableMinY + (playableHeight * 0.6 - hostageSize)); 
                        const tempHostageShapeForPlayerZone = { x: hostageX, y: hostageY, width: hostageSize, height: hostageSize };
                        if (!this._isPlacementInvalid(tempHostageShapeForPlayerZone, false, [], extraKeepOutZones) && 
                            distance(hostageX, hostageY, playerSpawnZone.x + playerSpawnZone.width/2, playerSpawnZone.y + playerSpawnZone.height/2) > 150 && 
                            this.isSpawnPointClear(hostageX, hostageY, hostageSize, this.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${i}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                        } attempts++;
                    } while (!placed && attempts < maxPlacementAttempts);
                }
            }
            if (rescueObjectiveInstance) {
                rescueObjectiveInstance.totalToAchieve = spawnedHostageCount; 
            }
        }

        this.generateNavigationGrid(worldWidth, worldHeight);
        const playerSpawnLocations = []; 
        const pSpawnPlaceCfg = genConfig.PLAYER_SPAWN_PLACEMENT || {}; 
        const playerUnitSize = CONFIG.RACCOON_SIZE || 12;
        const spawnAreaPadding = playerUnitSize * (pSpawnPlaceCfg.INTERNAL_PADDING_FACTOR || 1.5);
        const effectiveSpawnZoneX = playerSpawnZone.x + spawnAreaPadding; 
        const effectiveSpawnZoneY = playerSpawnZone.y + spawnAreaPadding;
        const effectiveSpawnZoneWidth = Math.max(0, playerSpawnZone.width - 2 * spawnAreaPadding); 
        const effectiveSpawnZoneHeight = Math.max(0, playerSpawnZone.height - 2 * spawnAreaPadding);
        for (let i = 0; i < numPlayerSpawnsNeeded; i++) {
            let spawnX, spawnY, isClear; let currentPlacementAttempts = 0; const maxPlayerSpawnAttempts = pSpawnPlaceCfg.MAX_ATTEMPTS || 30; let foundSpot = false;
            if (effectiveSpawnZoneWidth > playerUnitSize && effectiveSpawnZoneHeight > playerUnitSize) {
                do {
                    spawnX = this.rng.nextFloat(effectiveSpawnZoneX, effectiveSpawnZoneX + effectiveSpawnZoneWidth);
                    spawnY = this.rng.nextFloat(effectiveSpawnZoneY, effectiveSpawnZoneY + effectiveSpawnZoneHeight);
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); 
                    spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                    isClear = this.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.obstacles, this.game.deployedSquadRoster || []);
                    if (isClear) { playerSpawnLocations.push({ x: spawnX, y: spawnY }); foundSpot = true; break; } 
                    currentPlacementAttempts++;
                } while (currentPlacementAttempts < maxPlayerSpawnAttempts);
            }
            if (!foundSpot) {
                const fallbackSpacing = playerUnitSize * (pSpawnPlaceCfg.FALLBACK_SPACING_FACTOR || 2.0); 
                const spotsPerRow = Math.max(1, Math.floor(effectiveSpawnZoneWidth / fallbackSpacing));
                const row = Math.floor(i / spotsPerRow); const col = i % spotsPerRow;
                spawnX = effectiveSpawnZoneX + (col * fallbackSpacing) + playerUnitSize / 2; 
                spawnY = effectiveSpawnZoneY + (row * fallbackSpacing) + playerUnitSize / 2;
                spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); 
                spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                if (spawnX > playerSpawnZone.x + playerSpawnZone.width - playerUnitSize / 2 || spawnY > playerSpawnZone.y + playerSpawnZone.height - playerUnitSize / 2 || spawnX < playerSpawnZone.x + playerUnitSize/2 || spawnY < playerSpawnZone.y + playerUnitSize/2 ) {
                    spawnX = playableMinX + playerUnitSize + (i * playerUnitSize * 2.5); 
                    spawnY = playableMaxY - playerUnitSize;
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); 
                }
                playerSpawnLocations.push({ x: spawnX, y: spawnY });
            }
        }
        return playerSpawnLocations;
    }

    updateHutSpawning(deltaTime) {
        /* ... (Unchanged from previous complete version) ... */
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
                if (hut.isDestroyed || hut.isActivelySpawning || hut.isMissionTarget) continue; // Don't auto-activate mission target huts via proximity

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

            // --- NEW: Handle delayed spawn triggered by damage ---
            if (hut.delayedDamageSpawnTimer && hut.delayedDamageSpawnTimer > 0) {
                hut.delayedDamageSpawnTimer -= deltaTime;
                if (hut.delayedDamageSpawnTimer <= 0) {
                    hut.delayedDamageSpawnTimer = 0;
                    const damageSpawnCount = this.hutSpawnConfig.UNITS_TO_SPAWN_ON_DAMAGE || this.rng.nextInt(1,2); // Configurable
                    if(CONFIG.DEBUG_LOGGING) console.log(`[Level] Hut ${hut.name || hut.id} damage spawn: ${damageSpawnCount} units.`);
                    for (let k = 0; k < damageSpawnCount; k++) {
                        this.attemptSingleSpawnFromHut(hut);
                    }
                    // Optionally, make the hut enter its normal cooldown or a shorter one
                     hut.spawnCooldownTimer = this.rng.nextFloat(
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS_AFTER_DAMAGE || 10),
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MAX_SECONDS_AFTER_DAMAGE || 20)
                        );
                    hut.unitsToSpawnThisBurst = 0; // Clear any normal burst
                }
            }
            if(hut.damageSpawnCooldown && hut.damageSpawnCooldown > 0){
                hut.damageSpawnCooldown -= deltaTime;
                 if(hut.damageSpawnCooldown <0) hut.damageSpawnCooldown = 0;
            }
            // --- END NEW ---


            if (hut.unitsToSpawnThisBurst > 0 && hut.delayedDamageSpawnTimer <= 0) { // Only spawn if not waiting for damage spawn
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
                    } else { // Burst finished
                        hut.spawnCooldownTimer = this.rng.nextFloat(
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MIN_SECONDS || 15),
                            (this.hutSpawnConfig.SPAWN_COOLDOWN_MAX_SECONDS || 30)
                        );
                    }
                }
            } else if (hut.delayedDamageSpawnTimer <= 0) { // Normal cooldown (not a burst, not waiting for damage spawn)
                hut.spawnCooldownTimer -= deltaTime;
                if (hut.spawnCooldownTimer <= 0) {
                    // Start a new burst
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
        /* ... (Unchanged from previous complete version) ... */
        if (hut.isDestroyed || !this.rng) return false;

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
            // --- NEW: Notify game to update objective counts ---
            if (this.game && typeof this.game.incrementObjectiveEnemyCount === 'function') {
                this.game.incrementObjectiveEnemyCount(1);
            }
            if (this.game && this.game.spatialGrid) { // Also add to spatial grid
                this.game.spatialGrid.addObject(newGrunt);
            }
            // --- END NEW ---
            return true;
        } else {
            if (CONFIG.DEBUG_LOGGING) console.warn(`[Level] Failed to find clear spawn point for hut ${hut.name || hut.id}`);
            return false;
        }
    }

    renderHutSpawnAreas(ctx) {
        /* ... (Unchanged from previous complete version) ... */
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
            const spawnLineCenterX = hutCenterX + spawnOffsetX;
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