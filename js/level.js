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
        this.initialHostageCount = 0; // To track spawned hostages for objective UI
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
        if (obstacle.type === (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE) || obstacle.type === 'border_wall') {
             return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
        }
        return { type: 'rectangle', x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
    }

    _rectOverlap(rect1, rect2) { return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x || rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y); }
    isShapeOverlappingList(movingShape, existingObstacles) {
        for (const existing of existingObstacles) {
            if (!existing.isDestroyed && existing.blocksMovement) {
                const existingCollisionShape = this._getObstacleCollisionShape(existing);
                let collision = false;
                if (movingShape.type === 'rectangle') {
                    if (existingCollisionShape.type === 'rectangle') collision = rectOverlap(movingShape, existingCollisionShape);
                    else if (existingCollisionShape.type === 'circle') collision = rectCircleOverlap(movingShape, existingCollisionShape);
                    else if (existingCollisionShape.type === 'ellipse') collision = rectEllipseOverlap(movingShape, existingCollisionShape);
                } else if (movingShape.type === 'circle') {
                    if (existingCollisionShape.type === 'rectangle') collision = rectCircleOverlap(existingCollisionShape, movingShape);
                    else if (existingCollisionShape.type === 'circle') collision = circleOverlap(movingShape, existingCollisionShape);
                    else if (existingCollisionShape.type === 'ellipse') collision = circleEllipseOverlap(movingShape, existingCollisionShape);
                }
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
            return;
        }
        obstacle.hp -= amount;
        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;
            if (obstacle.type === 'possum_hut') {
                this.activeSpawningHuts = this.activeSpawningHuts.filter(h => h !== obstacle);
            }
            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obstacle.type);
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
        console.log("[Level] NavGrid generation complete.");
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


    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParams = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}) {
        this.obstacles = [];
        this.potentialSpawnerHuts = [];
        this.activeSpawningHuts = [];
        this.initialHostageCount = 0; // Reset for new level

        if (this.game) {
            this.game.enemyUnits = [];
            this.game.gameObjects = [];
            this.game.hostageUnits = []; // Clear previous hostages
        }

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
                borderSpritePath = (CONFIG.FENCE_BARBED_SPRITE_PATH || '') + CONFIG.FENCE_BARBED_LONG_SPRITE_FILES[0];
            } else if (borderObstacleTemplate.spriteNormal) { // Generic fallback for other types
                borderSpritePath = borderObstacleTemplate.spriteNormal;
            }

            if (borderSpritePath) {
                borderSpriteImage = preloadedAssetImages[borderSpritePath];
            }
            borderSpriteScale = borderObstacleTemplate.spriteScale !== undefined ? borderObstacleTemplate.spriteScale : 1.0;

            if (borderSpriteImage) {
                borderSegmentWidth = borderSpriteImage.naturalWidth * borderSpriteScale;
                borderSegmentHeight = borderSpriteImage.naturalHeight * borderSpriteScale;
            } else if (borderObstacleTemplate.width && borderObstacleTemplate.height) {
                borderSegmentWidth = borderObstacleTemplate.width; // These would be absolute if spriteScale not used
                borderSegmentHeight = borderObstacleTemplate.height;
                console.warn(`Border obstacle type '${borderObstacleTypeName}' has no preloaded sprite, using defined dimensions.`);
            } else {
                console.warn(`Border obstacle type '${borderObstacleTypeName}' has no sprite or dimensions. Defaulting border height.`);
                borderSegmentHeight = genConfig.BORDER_WIDTH || 30;
                borderObstacleTemplate = null;
            }
        }

        let topBottomBorderHeight = (borderObstacleTemplate && borderSegmentHeight > 0) ? borderSegmentHeight : (genConfig.BORDER_WIDTH || 30);

        if (borderObstacleTemplate && borderSpriteImage && borderSegmentWidth > 0 && borderSegmentHeight > 0) {
            const numSegments = Math.ceil(worldWidth / borderSegmentWidth);
            for (let i = 0; i < numSegments; i++) {
                const segmentX = i * borderSegmentWidth;
                const commonProps = {
                    type: borderObstacleTemplate.type,
                    name: borderObstacleTemplate.name, // Will append (Border Top/Bottom) later
                    destructible: false, // Borders are indestructible
                    hp: Infinity, maxHp: Infinity, isDestroyed: false,
                    blocksMovement: true, providesCover: true,
                    spriteNormalPath: borderSpritePath, imageNormal: borderSpriteImage,
                    spriteScale: borderSpriteScale,
                    // Deep copy collisionShape, applying scaling if functions are used
                    collisionShape: borderObstacleTemplate.collisionShape ? JSON.parse(JSON.stringify(borderObstacleTemplate.collisionShape)) : { type: 'rectangle', offsetX: 0, offsetY: 0, width: w => w, height: h => h }
                };

                this.obstacles.push({
                    ...commonProps,
                    x: segmentX, y: 0,
                    width: borderSegmentWidth, height: topBottomBorderHeight,
                    name: `${borderObstacleTemplate.name} (Border Top)`,
                });
                this.obstacles.push({
                    ...commonProps,
                    x: segmentX, y: worldHeight - topBottomBorderHeight,
                    width: borderSegmentWidth, height: topBottomBorderHeight,
                    name: `${borderObstacleTemplate.name} (Border Bottom)`,
                });
            }
        } else {
            topBottomBorderHeight = genConfig.BORDER_WIDTH || 30; // Ensure fallback uses default height
            this.obstacles.push({ x: 0, y: 0, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Top', color: sideBorderColor, destructible: false, hp: Infinity,maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
            this.obstacles.push({ x: 0, y: worldHeight - topBottomBorderHeight, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Bottom', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        }

        this.obstacles.push({ x: 0, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Left', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: worldWidth - sideBorderWidth, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Right', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });


        const playableMinX = sideBorderWidth + worldMargin;
        const playableMaxX = worldWidth - sideBorderWidth - worldMargin;
        const playableMinY = topBottomBorderHeight + worldMargin;
        const playableMaxY = worldHeight - topBottomBorderHeight - worldMargin;

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

            let obsRenderWidth, obsRenderHeight;
            let actualSpritePath = null;
            let actualImageObject = null;
            let actualDestroyedSpritePath = template.spriteDestroyed || null;
            let actualDestroyedImageObject = template.spriteDestroyed ? (preloadedAssetImages[template.spriteDestroyed] || null) : null;

            let normalSpriteScale = template.spriteScale || 1.0;
            let destroyedSpriteScale = template.spriteDestroyedScale;

            let filesArray = [];
            let pathBase = '';
            let useRandomSpriteFromList = false;

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
            else if (template.type === 'pickup_health') { filesArray = CONFIG.HEALTH_PICKUP_SPRITE_FILES || []; pathBase = CONFIG.HEALTH_PICKUP_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_fallen') { filesArray = CONFIG.PALM_TREE_FALLEN_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_FALLEN_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else { actualSpritePath = template.spriteNormal || null; }

            if (useRandomSpriteFromList) {
                if (filesArray.length > 0 && pathBase) {
                    const randomFile = filesArray[Math.floor(Math.random() * filesArray.length)];
                    actualSpritePath = pathBase + randomFile;
                } else { actualSpritePath = null; }
            }
            actualImageObject = actualSpritePath ? (preloadedAssetImages[actualSpritePath] || null) : null;

            if (template.isDecoration && template.type === 'decoration_grass') {
                const grassConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.GRASS_CLUTTER) || {};
                normalSpriteScale = (grassConfig.MIN_SCALE || 0.8) + Math.random() * ((grassConfig.MAX_SCALE || 1.2) - (grassConfig.MIN_SCALE || 0.8));
                if (actualImageObject) {
                    obsRenderWidth = actualImageObject.naturalWidth * normalSpriteScale;
                    obsRenderHeight = actualImageObject.naturalHeight * normalSpriteScale;
                } else {
                    obsRenderWidth = (template.width || 16) * normalSpriteScale;
                    obsRenderHeight = (template.height || 16) * normalSpriteScale;
                }
            } else if (actualImageObject && template.spriteScale !== undefined) {
                obsRenderWidth = actualImageObject.naturalWidth * template.spriteScale;
                obsRenderHeight = actualImageObject.naturalHeight * template.spriteScale;
                normalSpriteScale = template.spriteScale;
            } else if (template.width !== undefined && template.height !== undefined) {
                obsRenderWidth = template.width;
                obsRenderHeight = template.height;
                normalSpriteScale = 1.0;
            } else if (actualImageObject) {
                obsRenderWidth = actualImageObject.naturalWidth;
                obsRenderHeight = actualImageObject.naturalHeight;
                normalSpriteScale = 1.0;
            } else {
                console.warn(`Obstacle type ${template.type} has no sprite and no explicit width/height. Defaulting to 32x32.`);
                obsRenderWidth = 32;
                obsRenderHeight = 32;
                normalSpriteScale = 1.0;
            }

            let obsX, obsY;
            let attempts = 0;
            let placed = false;
            do {
                obsX = playableMinX + Math.random() * (playableWidth - obsRenderWidth);
                obsY = playableMinY + Math.random() * (playableHeight - obsRenderHeight);

                let collisionCheckShape;
                const TcollisionShapeDef = template.collisionShape;
                if (TcollisionShapeDef) {
                    const currentVisualDims = { width: obsRenderWidth, height: obsRenderHeight };
                    if (TcollisionShapeDef.type === 'circle') {
                        collisionCheckShape = { type: 'circle',
                            x: obsX + (typeof TcollisionShapeDef.offsetX === 'function' ? TcollisionShapeDef.offsetX(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetX || obsRenderWidth / 2)),
                            y: obsY + (typeof TcollisionShapeDef.offsetY === 'function' ? TcollisionShapeDef.offsetY(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetY || obsRenderHeight / 2)),
                            radius: (typeof TcollisionShapeDef.radius === 'function' ? TcollisionShapeDef.radius(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.radius || Math.min(obsRenderWidth, obsRenderHeight) / 2))
                        };
                    } else if (TcollisionShapeDef.type === 'rectangle') {
                        collisionCheckShape = { type: 'rectangle',
                            x: obsX + (typeof TcollisionShapeDef.offsetX === 'function' ? TcollisionShapeDef.offsetX(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetX || 0)),
                            y: obsY + (typeof TcollisionShapeDef.offsetY === 'function' ? TcollisionShapeDef.offsetY(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetY || 0)),
                            width: (typeof TcollisionShapeDef.width === 'function' ? TcollisionShapeDef.width(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.width || obsRenderWidth)),
                            height: (typeof TcollisionShapeDef.height === 'function' ? TcollisionShapeDef.height(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.height || obsRenderHeight))
                        };
                    } else if (TcollisionShapeDef.type === 'ellipse') {
                         collisionCheckShape = { type: 'ellipse',
                            x: obsX + (typeof TcollisionShapeDef.offsetX === 'function' ? TcollisionShapeDef.offsetX(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetX || obsRenderWidth / 2)),
                            y: obsY + (typeof TcollisionShapeDef.offsetY === 'function' ? TcollisionShapeDef.offsetY(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.offsetY || obsRenderHeight / 2)),
                            radiusX: (typeof TcollisionShapeDef.radiusX === 'function' ? TcollisionShapeDef.radiusX(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.radiusX || obsRenderWidth / 2)),
                            radiusY: (typeof TcollisionShapeDef.radiusY === 'function' ? TcollisionShapeDef.radiusY(currentVisualDims.width, currentVisualDims.height) : (TcollisionShapeDef.radiusY || obsRenderHeight / 2))
                        };
                    } else {
                        collisionCheckShape = { type: 'rectangle', x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight };
                    }
                } else {
                    collisionCheckShape = { type: 'rectangle', x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight };
                }
                const renderBoxForPlayerZoneCheck = { x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight };

                if (obsX < playableMinX || obsX + obsRenderWidth > playableMaxX || obsY < playableMinY || obsY + obsRenderHeight > playableMaxY) {
                    attempts++;
                    continue;
                }
                if (!this._rectOverlap(renderBoxForPlayerZoneCheck, playerSpawnZone) &&
                    !this.isShapeOverlappingList(collisionCheckShape, this.obstacles)) {
                    const newObstacle = {
                        x: obsX, y: obsY,
                        width: obsRenderWidth,
                        height: obsRenderHeight,
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
                        spriteScale: normalSpriteScale,
                        spriteDestroyedScale: destroyedSpriteScale,
                        collisionShape: template.collisionShape || null,
                        isSpawner: template.type === 'possum_hut',
                        spawnCooldownTimer: 0,
                        isActivelySpawning: false
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

        // --- HOSTAGE SPAWNING LOGIC ---
        if (missionParams.objectiveType === 'RESCUE_HOSTAGES') {
            const hostageConf = CONFIG.HOSTAGE_SETTINGS || {};
            // Prioritize mission-specific count, then config, then default
            const numHostagesToSpawn = missionParams.numHostagesToSpawn !== undefined ? missionParams.numHostagesToSpawn : (hostageConf.MAX_HOSTAGES_PER_MISSION !== undefined ? hostageConf.MAX_HOSTAGES_PER_MISSION : 1);
            this.initialHostageCount = numHostagesToSpawn;

            console.log(`[Level] Attempting to spawn ${numHostagesToSpawn} hostages for mission: ${missionParams.name}`);

            for (let i = 0; i < numHostagesToSpawn; i++) {
                let hostageX, hostageY, attempts = 0;
                const maxPlacementAttempts = 30; // Increased attempts for hostages
                let placed = false;
                const hostageSize = CONFIG.RACCOON_SIZE || 12; // Use raccoon size for hostages

                do {
                    // Try to place them away from player spawn, maybe towards middle/top of map
                    // and ensure not overlapping existing obstacles or other hostages
                    hostageX = playableMinX + Math.random() * (playableWidth - hostageSize);
                    // Try to place them further away from player spawn zone vertically
                    hostageY = playableMinY + Math.random() * (playableHeight * 0.6 - hostageSize); // e.g. in top 60% of playable height


                    const tempHostageShapeForPlayerZone = { x: hostageX, y: hostageY, width: hostageSize, height: hostageSize };
                    let existingUnitsForClearance = this.game.enemyUnits.concat(this.game.hostageUnits || []);


                    if (!this._rectOverlap(tempHostageShapeForPlayerZone, playerSpawnZone) && // Not in player spawn zone
                        distance(hostageX, hostageY, playerSpawnZone.x + playerSpawnZone.width/2, playerSpawnZone.y + playerSpawnZone.height/2) > 150 && // Min distance from player spawn center
                        this.isSpawnPointClear(hostageX, hostageY, hostageSize, this.obstacles, existingUnitsForClearance)) {

                        const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${i}`);
                        if(this.game.hostageUnits) this.game.hostageUnits.push(newHostage);
                        else this.game.hostageUnits = [newHostage];
                        placed = true;
                        console.log(`[Level] Spawned hostage ${newHostage.id} at (${hostageX.toFixed(0)}, ${hostageY.toFixed(0)})`);
                    }
                    attempts++;
                } while (!placed && attempts < maxPlacementAttempts);

                if(!placed) {
                    console.warn(`[Level] Could not find suitable placement for hostage ${i + 1} after ${maxPlacementAttempts} attempts.`);
                }
            }
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
            const minSpawnDistFromPlayerZone = enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 50;
            let enemySpawnMinX = playableMinX; // Default spawn anywhere in playable area
             // If player spawn is on the left, spawn enemies to the right of it
            if (playerSpawnZone.x < worldWidth / 2) {
                 enemySpawnMinX = playerSpawnZone.x + playerSpawnZone.width + minSpawnDistFromPlayerZone;
            }
            const enemySpawnableWidth = Math.max(0, playableMaxX - enemySpawnMinX); if (enemySpawnableWidth <= heavySize * 2 && playerSpawnZone.x < worldWidth / 2) { continue; } // Not enough space to the right
            
            do {
                if (playerSpawnZone.x < worldWidth / 2 && enemySpawnableWidth > heavySize) { // Spawn to the right
                     groupLeaderX = enemySpawnMinX + Math.random() * (enemySpawnableWidth - heavySize);
                } else { // Spawn anywhere in playable X if player is not on left, or not enough space right
                     groupLeaderX = playableMinX + Math.random() * (playableWidth - heavySize);
                }
                groupLeaderY = playableMinY + Math.random() * (playableHeight - heavySize);

                groupLeaderX = Math.max(playableMinX + heavySize / 2, Math.min(groupLeaderX, playableMaxX - heavySize / 2));
                groupLeaderY = Math.max(playableMinY + heavySize / 2, Math.min(groupLeaderY, playableMaxY - heavySize / 2));
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

    updateHutSpawning(deltaTime) {
        if (!this.game || !this.game.deployedSquadRoster || this.game.deployedSquadRoster.length === 0) {
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
                        hut.spawnCooldownTimer = (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5) + Math.random() * ((this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MAX || 10) - (this.hutSpawnConfig.INITIAL_SPAWN_DELAY_SECONDS_MIN || 5));
                        this.activeSpawningHuts.push(hut);
                        if(CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Hut at (${hut.x},${hut.y}) activated. Initial spawn in ${hut.spawnCooldownTimer.toFixed(1)}s`);
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
        const spawnOffsetY = this.hutSpawnConfig.SPAWN_POINT_OFFSET_FROM_HUT_BOTTOM_Y || 0;
        const spawnAreaWidth = this.hutSpawnConfig.SPAWN_AREA_WIDTH || (CONFIG.POSSUM_GRUNT_SIZE || 14) * 1.5;

        const spawnCenterY = hutBottomEdgeY + spawnOffsetY;
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
                let angleFromSpawn = Math.PI / 2;
                if(distance(spawnX, spawnCenterY, hutCenterX, hut.y + hut.height/2) > 10) {
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