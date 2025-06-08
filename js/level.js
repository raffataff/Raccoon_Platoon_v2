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
        if (obstacle.type === (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE) || 
            obstacle.type === 'border_wall' || 
            obstacle.type === 'extraction_zone') { 
             return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
        }
        return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
    }

    _rectOverlap(rect1, rect2) { return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y); }
    
    _isPlacementInvalid(newObstacleShape, newIsDecoration, existingObstacles) {
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
                return true; 
            }
        }
        return false; 
    }

    isSpawnPointClear(x, y, unitSize, existingObstacles, existingUnits = []) {
        const unitShape = { type: 'circle', x: x, y: y, radius: unitSize / 2 };
        if (this._isPlacementInvalid(unitShape, false, existingObstacles)) {
            return false;
        }

        for (const unit of existingUnits) {
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
        obstacle.hp -= amount;
        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;

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
        const definitions = CONFIG.OBSTACLE_DEFINITIONS || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }
        
        let totalWeight = 0; 
        definitions.forEach(def => {
            // Exclude mission target types currently active for this mission from random placement pool
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
        this.gridCellSize = CONFIG.GRID_CELL_SIZE || 16;
        this.gridWidth = Math.floor(worldWidth / this.gridCellSize);
        this.gridHeight = Math.floor(worldHeight / this.gridCellSize);
        this.navGrid = [];

        for (let y = 0; y < this.gridHeight; y++) {
            this.navGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.navGrid[y][x] = 0;
                const cellRect = {
                    x: x * this.gridCellSize,
                    y: y * this.gridCellSize,
                    width: this.gridCellSize,
                    height: this.gridCellSize
                };

                for (const obs of this.obstacles) {
                    if (obs.blocksMovement && !obs.isDestroyed) { 
                        const obsShape = this._getObstacleCollisionShape(obs);
                        if (!obsShape) continue;
                        let collision = false;
                        if (obsShape.type === 'rectangle') {
                            collision = rectOverlap(cellRect, obsShape);
                        } else if (obsShape.type === 'circle') {
                            collision = rectCircleOverlap(cellRect, obsShape);
                        } else if (obsShape.type === 'ellipse') {
                            collision = rectEllipseOverlap(cellRect, obsShape);
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

        const obsShapeForBounds = this._getObstacleCollisionShape(obstacle);
        let minObsX, maxObsX, minObsY, maxObsY;

        if (!obsShapeForBounds) { 
            minObsX = obstacle.x;
            maxObsX = obstacle.x + obstacle.width;
            minObsY = obstacle.y;
            maxObsY = obstacle.y + obstacle.height;
        } else if (obsShapeForBounds.type === 'rectangle') {
            minObsX = obsShapeForBounds.x;
            maxObsX = obsShapeForBounds.x + obsShapeForBounds.width;
            minObsY = obsShapeForBounds.y;
            maxObsY = obsShapeForBounds.y + obsShapeForBounds.height;
        } else if (obsShapeForBounds.type === 'circle') {
            minObsX = obsShapeForBounds.x - obsShapeForBounds.radius;
            maxObsX = obsShapeForBounds.x + obsShapeForBounds.radius;
            minObsY = obsShapeForBounds.y - obsShapeForBounds.radius;
            maxObsY = obsShapeForBounds.y + obsShapeForBounds.radius;
        } else if (obsShapeForBounds.type === 'ellipse') {
            minObsX = obsShapeForBounds.x - obsShapeForBounds.radiusX;
            maxObsX = obsShapeForBounds.x + obsShapeForBounds.radiusX;
            minObsY = obsShapeForBounds.y - obsShapeForBounds.radiusY;
            maxObsY = obsShapeForBounds.y + obsShapeForBounds.radiusY;
        } else { 
            minObsX = obstacle.x;
            maxObsX = obstacle.x + obstacle.width;
            minObsY = obstacle.y;
            maxObsY = obstacle.y + obstacle.height;
        }

        const startGridX = Math.max(0, Math.floor(minObsX / this.gridCellSize) -1); 
        const endGridX = Math.min(this.gridWidth -1, Math.ceil(maxObsX / this.gridCellSize) +1);
        const startGridY = Math.max(0, Math.floor(minObsY / this.gridCellSize) -1);
        const endGridY = Math.min(this.gridHeight -1, Math.ceil(maxObsY / this.gridCellSize) +1);

        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                if (y < 0 || y >= this.gridHeight || x < 0 || x >= this.gridWidth) continue;

                const cellRect = { x: x * this.gridCellSize, y: y * this.gridCellSize, width: this.gridCellSize, height: this.gridCellSize };
                let stillBlockedByOther = false;
                for (const otherObs of this.obstacles) {
                    if (otherObs.blocksMovement && !otherObs.isDestroyed) { 
                        const otherObsShape = this._getObstacleCollisionShape(otherObs);
                        if (!otherObsShape) continue;
                        let collisionWithOther = false;
                        if (otherObsShape.type === 'rectangle') collisionWithOther = rectOverlap(cellRect, otherObsShape);
                        else if (otherObsShape.type === 'circle') collisionWithOther = rectCircleOverlap(cellRect, otherObsShape);
                        else if (otherObsShape.type === 'ellipse') collisionWithOther = rectEllipseOverlap(cellRect, otherObsShape);

                        if (collisionWithOther) {
                            stillBlockedByOther = true;
                            break;
                        }
                    }
                }
                this.navGrid[y][x] = stillBlockedByOther ? 1 : 0;
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

    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParamsContainer = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}, missionSeed) {
        this.rng = new SeededRandom(missionSeed);
        this.obstacles = [];
        this.potentialSpawnerHuts = []; 
        this.activeSpawningHuts = [];
        this.initialHostageCount = 0; 
        this.missionTargetObstacles = [];

        if (this.game) {
            this.game.enemyUnits = [];
            this.game.gameObjects = [];
            this.game.hostageUnits = []; 
        }

        const missionObjectives = missionParamsContainer.objectives || [];
        const baseParams = missionParamsContainer.baseParams || {};


        const genConfig = CONFIG.LEVEL_GENERATION || {};
        const worldMargin = genConfig.WORLD_MARGIN || 20;
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

        const playableMinX = sideBorderWidth + worldMargin;
        const playableMaxX = worldWidth - sideBorderWidth - worldMargin;
        const playableMinY = topBottomBorderHeight + worldMargin;
        const playableMaxY = worldHeight - topBottomBorderHeight - worldMargin;
        const playableWidth = Math.max(0, playableMaxX - playableMinX); 
        const playableHeight = Math.max(0, playableMaxY - playableMinY);
        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20));
        const playerSpawnZoneHeight = Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20));
        const playerSpawnZone = { x: playableMinX, y: playableMaxY - playerSpawnZoneHeight, width: playerSpawnZoneWidth, height: playerSpawnZoneHeight };

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

        // --- Place mission-critical "anchors" based on objectives ---
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
            if (!placedEZ) { /* Fallback placement for EZ if all attempts fail */ 
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
                        const template = JSON.parse(JSON.stringify(targetTemplateOriginal)); 

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
                            const tempTargetForShape = { ...template, x:targetX, y:targetY, width:targetWidth, height:targetHeight };
                            const collisionShapeForCheck = this._getObstacleCollisionShape(tempTargetForShape);

                            if (!this._rectOverlap(collisionShapeForCheck, playerSpawnZone) && !this._isPlacementInvalid(collisionShapeForCheck, template.isDecoration, this.obstacles)) {
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
                                    collisionShape: template.collisionShape || null, isMissionTarget: true, objectiveId: objective.id,
                                    isSpawner: template.type === 'possum_hut',
                                    spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0
                                };
                                this.obstacles.push(missionTargetObs);
                                this.missionTargetObstacles.push(missionTargetObs);
                                if (missionTargetObs.isSpawner) this.potentialSpawnerHuts.push(missionTargetObs);
                                placedTarget = true;
                                break;
                            }
                        }
                        if (!placedTarget) console.warn(`[Level Gen] Could not place mission target type ${objective.targetTypeKey}`);
                    }
                } else { console.warn(`[Level Gen] No template found for destroyTargetTypeKey: ${objective.targetTypeKey}`); }
            }
        });


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
                    console.warn(`[Level Gen] Obstacle type ${template.type} configured for list-based sprite but filesArray or pathBase is missing/empty.`);
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
                
                const renderBoxForPlayerZoneCheck = { x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight };
                if (obsX < playableMinX || obsX + obsRenderWidth > playableMaxX || obsY < playableMinY || obsY + obsRenderHeight > playableMaxY) { attempts++; continue; }
                
                if (!this._rectOverlap(renderBoxForPlayerZoneCheck, playerSpawnZone) && !this._isPlacementInvalid(collisionCheckShape, template.isDecoration, this.obstacles)) {
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
                        spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0
                    };
                    this.obstacles.push(newObstacle);
                    if (newObstacle.isSpawner && !newObstacle.isMissionTarget) this.potentialSpawnerHuts.push(newObstacle);
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }
        
        this.generateNavigationGrid(worldWidth, worldHeight);

        const pSpawnPlaceCfg = genConfig.PLAYER_SPAWN_PLACEMENT || {}; 
        const playerSpawnLocations = []; 
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

        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {}; 
        const enemyDensityFactor = baseParams.enemyDensityFactor || 1.0; 
        const baseNumEnemies = enemySpawnCfg.BASE_ENEMY_COUNT_PER_DENSITY_FACTOR || 8;
        const randomAddMax = enemySpawnCfg.RANDOM_ADDITION_FACTOR_MAX || 5; 
        const totalEnemiesToSpawn = Math.floor(baseNumEnemies * enemyDensityFactor) + this.rng.nextInt(0, Math.floor(randomAddMax * enemyDensityFactor));
        let enemiesSpawnedCount = 0; 
        const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0; 
        const groupSpawnAttempts = Math.ceil(totalEnemiesToSpawn / Math.max(1, avgEnemiesPerGroup));
        const heavySize = CONFIG.POSSUM_HEAVY_SIZE || 18; 
        const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;
        const enemyGroups = []; 

        for (let g = 0; g < groupSpawnAttempts && enemiesSpawnedCount < totalEnemiesToSpawn; g++) {
            const smallGroupChance = enemySpawnCfg.SMALL_GROUP_CHANCE || 0.6; 
            const smallGroupMin = enemySpawnCfg.SMALL_GROUP_SIZE_MIN || 1; 
            const smallGroupMax = enemySpawnCfg.SMALL_GROUP_SIZE_MAX || 3;
            let currentGroupSizeAttempt = this.rng.chance(smallGroupChance) ? this.rng.nextInt(smallGroupMin, smallGroupMax) : (smallGroupMax + this.rng.nextInt(0,1));
            currentGroupSizeAttempt = Math.min(currentGroupSizeAttempt, totalEnemiesToSpawn - enemiesSpawnedCount); 
            if (currentGroupSizeAttempt <= 0) continue;
            let groupLeaderX, groupLeaderY, isLeaderSpawnClear; 
            let leaderPlacementAttempts = 0; 
            const leaderMaxAttempts = enemySpawnCfg.LEADER_PLACEMENT_MAX_ATTEMPTS || 20;
            const minSpawnDistFromPlayerZone = enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 50;
            let enemySpawnMinX = playableMinX; 
            if (playerSpawnZone.x < worldWidth / 2) { enemySpawnMinX = playerSpawnZone.x + playerSpawnZone.width + minSpawnDistFromPlayerZone; }
            const enemySpawnableWidth = Math.max(0, playableMaxX - enemySpawnMinX); 
            if (enemySpawnableWidth <= heavySize * 2 && playerSpawnZone.x < worldWidth / 2) { continue; } 
            do {
                groupLeaderX = (playerSpawnZone.x < worldWidth / 2 && enemySpawnableWidth > heavySize) ? this.rng.nextFloat(enemySpawnMinX, enemySpawnMinX + enemySpawnableWidth - heavySize) : this.rng.nextFloat(playableMinX, playableMaxX - heavySize);
                groupLeaderY = this.rng.nextFloat(playableMinY, playableMaxY - heavySize);
                groupLeaderX = Math.max(playableMinX + heavySize / 2, Math.min(groupLeaderX, playableMaxX - heavySize / 2));
                groupLeaderY = Math.max(playableMinY + heavySize / 2, Math.min(groupLeaderY, playableMaxY - heavySize / 2));
                const leaderFootprint = {x: groupLeaderX - heavySize/2, y: groupLeaderY - heavySize/2, width: heavySize, height: heavySize};
                isLeaderSpawnClear = this.isSpawnPointClear(groupLeaderX, groupLeaderY, heavySize, this.obstacles, this.game.enemyUnits) && !this._rectOverlap(leaderFootprint, playerSpawnZone); 
                leaderPlacementAttempts++;
            } while (!isLeaderSpawnClear && leaderPlacementAttempts < leaderMaxAttempts);
            if (isLeaderSpawnClear) {
                const currentGroupMembers = [];
                for (let m = 0; m < currentGroupSizeAttempt && enemiesSpawnedCount < totalEnemiesToSpawn; m++) {
                    let memberX, memberY, isMemberSpawnClear; 
                    let memberPlacementAttempts = 0; const memberMaxAttempts = enemySpawnCfg.MEMBER_PLACEMENT_MAX_ATTEMPTS || 10;
                    let currentEnemyUnitSize = gruntSize; let isHeavy = false; 
                    const heavyChance = baseParams.heavyChance || (enemySpawnCfg.DEFAULT_HEAVY_CHANCE || 0.20); 
                    const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;
                    if ((m === 0 && currentGroupSizeAttempt > 0 && this.rng.chance(heavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0)) ) || (currentGroupSizeAttempt === 1 && this.rng.chance(heavyChance))) { isHeavy = true; currentEnemyUnitSize = heavySize; }
                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30; const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5; const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberY = (m === 0) ? groupLeaderY : groupLeaderY + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2)); 
                        memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = {x: memberX - currentEnemyUnitSize/2, y: memberY - currentEnemyUnitSize/2, width: currentEnemyUnitSize, height: currentEnemyUnitSize};
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles, this.game.enemyUnits.concat(currentGroupMembers)) && !this._rectOverlap(memberFootprint, playerSpawnZone); 
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
            const numHostagesToSpawn = rescueObjectiveInstance.totalToAchieve; // This was set by _instantiateObjective
            this.initialHostageCount = numHostagesToSpawn;
            let spawnedHostageCount = 0;
            const hostageSize = CONFIG.RACCOON_SIZE || 12;

            if (hostageConf.SPAWN_AT_HUTS && numHostagesToSpawn > spawnedHostageCount) {
                const eligibleHuts = this.potentialSpawnerHuts.filter(hut => {
                    if (hut.isDestroyed || hut.isMissionTarget) return false;
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
                            this.spawnInitialHutGuards(hut, preloadedAssetImages, playerSpawnZone, playableMinX, playableMaxX, playableMinY, playableMaxY);
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
                            if (!this._rectOverlap({ x: hostageX - hostageSize/2, y: hostageY - hostageSize/2, width: hostageSize, height: hostageSize }, playerSpawnZone) &&
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
                        if (!this._rectOverlap(tempHostageShapeForPlayerZone, playerSpawnZone) && 
                            distance(hostageX, hostageY, playerSpawnZone.x + playerSpawnZone.width/2, playerSpawnZone.y + playerSpawnZone.height/2) > 150 && 
                            this.isSpawnPointClear(hostageX, hostageY, hostageSize, this.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${i}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                        } attempts++;
                    } while (!placed && attempts < maxPlacementAttempts);
                }
            }
             // Update the specific rescue objective instance after spawning all hostages
            if (rescueObjectiveInstance) {
                rescueObjectiveInstance.totalToAchieve = spawnedHostageCount; // Actual number spawned
            }
        }
        
        // Note: Game.js no longer has a single 'this.missionObjective'.
        // The objectives are now an array in this.game.currentMissionParams.objectives.
        // The UI will read from there.
        return playerSpawnLocations;
    }

    spawnInitialHutGuards(hut, preloadedAssetImages, playerSpawnZone, playableMinX, playableMaxX, playableMinY, playableMaxY) {
        const hostageConf = CONFIG.HOSTAGE_SETTINGS || {};
        const guardMin = hostageConf.INITIAL_GUARD_COUNT_MIN_PER_HOSTAGE_HUT || 1;
        const guardMax = hostageConf.INITIAL_GUARD_COUNT_MAX_PER_HOSTAGE_HUT || 2;
        const numGuards = this.rng.nextInt(guardMin, guardMax);
        const heavyChance = hostageConf.INITIAL_GUARD_HEAVY_CHANCE_HOSTAGE_HUT || 0.1;
        const spawnRadius = hostageConf.INITIAL_GUARD_SPAWN_RADIUS_AROUND_HUT || 60;
        const placementAttempts = hostageConf.INITIAL_GUARD_PLACEMENT_ATTEMPTS || 10;

        let guardsSpawned = 0;
        for (let i = 0; i < numGuards; i++) {
            let guardX, guardY;
            const isHeavy = this.rng.chance(heavyChance);
            const guardSize = isHeavy ? CONFIG.POSSUM_HEAVY_SIZE : CONFIG.POSSUM_GRUNT_SIZE;
            let placedGuard = false;
            for (let attempt = 0; attempt < placementAttempts; attempt++) {
                const angle = this.rng.nextFloat(0, Math.PI * 2);
                const radiusOffset = this.rng.nextFloat(guardSize, spawnRadius); 
                guardX = (hut.x + hut.width / 2) + Math.cos(angle) * radiusOffset;
                guardY = (hut.y + hut.height / 2) + Math.sin(angle) * radiusOffset;
                guardX = Math.max(playableMinX + guardSize / 2, Math.min(guardX, playableMaxX - guardSize / 2));
                guardY = Math.max(playableMinY + guardSize / 2, Math.min(guardY, playableMaxY - guardSize / 2));
                const guardFootprint = { x: guardX - guardSize / 2, y: guardY - guardSize / 2, width: guardSize, height: guardSize };
                if (this.isSpawnPointClear(guardX, guardY, guardSize, this.obstacles, this.game.enemyUnits) &&
                    !this._rectOverlap(guardFootprint, playerSpawnZone)) {
                    const enemyUnit = isHeavy ?
                        new PossumHeavy(guardX, guardY, this.game, `PHVY-HGRD-${this.game.enemyUnits.length + 1}`) :
                        new PossumGrunt(guardX, guardY, this.game, `PSM-HGRD-${this.game.enemyUnits.length + 1}`);
                    this.game.enemyUnits.push(enemyUnit);
                    guardsSpawned++;
                    placedGuard = true;
                    break; 
                }
            }
        }
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

            if (hut.unitsToSpawnThisBurst > 0) {
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
            } else { 
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
            return true;
        } else {
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