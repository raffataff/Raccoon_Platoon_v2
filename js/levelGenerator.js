// js/levelGenerator.js

class LevelGenerator {
    constructor(levelInstance) {
        this.level = levelInstance;
        this.game = levelInstance.game;
        this.rng = null; // Will be set at the start of generation
        
    }

    /**
     * Checks if a new obstacle's shape collides with any existing, non-decoration obstacles.
     * @param {object} newObstacleShape - The collision shape of the new obstacle.
     * @param {boolean} newIsDecoration - Whether the new obstacle is just a decoration.
     * @param {Array} existingObstacles - The array of obstacles already placed.
     * @param {Array} extraKeepOutZones - Additional rectangular zones to avoid.
     * @returns {boolean} - True if the placement is invalid (collides), false otherwise.
     */
    _isPlacementInvalid(newObstacleShape, newIsDecoration, existingObstacles, extraKeepOutZones = []) {
        // Check against extra keep-out zones first
        for (const zone of extraKeepOutZones) {
            if (this.level._rectOverlap(newObstacleShape, zone)) {
                return true; // Invalid if it overlaps a keep-out zone
            }
        }

        for (const existing of existingObstacles) {
            if (newIsDecoration && existing.isDecoration) { 
                continue;
            }
    
            const existingShape = this.level._getObstacleCollisionShape(existing);
            if (!existingShape) continue;
    
            let collision = false;
            if (newObstacleShape.type === 'circle') {
                if (existingShape.type === 'rectangle') collision = rectCircleOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = circleOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'ellipse') collision = circleEllipseOverlap(newObstacleShape, existingShape);
            } else if (newObstacleShape.type === 'rectangle') {
                if (existingShape.type === 'rectangle') collision = this.level._rectOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = rectCircleOverlap(newObstacleShape, existingShape);
                else if (existingShape.type === 'ellipse') collision = rectEllipseOverlap(newObstacleShape, existingShape);
            } else if (newObstacleShape.type === 'ellipse') {
                if (existingShape.type === 'rectangle') collision = rectEllipseOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'circle') collision = circleEllipseOverlap(existingShape, newObstacleShape);
                else if (existingShape.type === 'ellipse') {
                    const r1 = { x: newObstacleShape.x - newObstacleShape.radiusX, y: newObstacleShape.y - newObstacleShape.radiusY, width: newObstacleShape.radiusX * 2, height: newObstacleShape.radiusY * 2 };
                    const r2 = { x: existingShape.x - existingShape.radiusX, y: existingShape.y - existingShape.radiusY, width: existingShape.radiusX * 2, height: existingShape.radiusY * 2 };
                    collision = this.level._rectOverlap(r1, r2);
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
    
    _getRandomObstacleTemplate() {
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
    
    _spawnInitialGuardsForObject(parentObject, objectDefinition) {
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
        // --- MODIFICATION START: Keep track of guards spawned for THIS pack ---
        const guardsInThisPack = [];
        // --- MODIFICATION END ---
        
        for (let i = 0; i < guardCount; i++) {
            const unitDef = this.game._weightedRandomSelect(pack.unitPool, this.rng);
            if (!unitDef) continue;

            let GuardClass;
            let guardSize;
            if (unitDef.type === 'possum_grunt') {
                GuardClass = PossumGrunt;
                guardSize = CONFIG.POSSUM_GRUNT_SIZE;
            } else if (unitDef.type === 'possum_heavy') {
                GuardClass = PossumHeavy;
                guardSize = CONFIG.POSSUM_HEAVY_SIZE;
            } else if (unitDef.type === 'possum_sniper') {
                GuardClass = PossumSniper;
                guardSize = CONFIG.POSSUM_SNIPER_SIZE;
            } else {
                continue;
            }

            let guardX, guardY, placed = false;
            for (let attempt = 0; attempt < 15; attempt++) {
                const angle = this.rng.nextFloat(0, Math.PI * 2);
                const radius = this.rng.nextFloat(guardSize, spawnRadius);
                guardX = parentCenterX + Math.cos(angle) * radius;
                guardY = parentCenterY + Math.sin(angle) * radius;

                guardX = Math.max(playableBounds.minX + guardSize / 2, Math.min(guardX, playableBounds.maxX - guardSize / 2));
                guardY = Math.max(playableBounds.minY + guardSize / 2, Math.min(guardY, playableBounds.maxY - guardSize / 2));

                // --- MODIFICATION START: Pass the list of already-spawned guards in this pack ---
                if (this.level.isSpawnPointClear(guardX, guardY, guardSize, this.level.obstacles, [...this.game.enemyUnits, ...guardsInThisPack])) {
                    const newGuard = new GuardClass(guardX, guardY, this.game);
                    newGuard.guardPost = { x: guardX, y: guardY }; 
                    
                    this.game.enemyUnits.push(newGuard);
                    guardsInThisPack.push(newGuard); // Add to our temporary list for the next check
                    // --- MODIFICATION END ---

                    this.game.incrementObjectiveEnemyCount(1);
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

    /**
     * The main entry point for generating a new level.
     * This method orchestrates the entire process from clearing old data to placing units.
     * @param {number} worldWidth - The total width of the game world.
     * @param {number} worldHeight - The total height of the game world.
     * @param {object} missionParamsContainer - Object containing mission details (baseParams, objectives).
     * @param {number} numPlayerSpawnsNeeded - The number of player units to spawn.
     * @param {object} preloadedAssetImages - A map of preloaded image assets.
     * @param {number} missionSeed - The seed for the random number generator for this mission.
     * @returns {Array<object>} - An array of player spawn locations {x, y}.
     */
    generate(worldWidth, worldHeight, missionParamsContainer = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}, missionSeed) {
        this.rng = new SeededRandom(missionSeed);
        this.level.rng = this.rng;

        this.level.obstacles = [];
        this.level.potentialSpawnerHuts = []; 
        this.level.activeSpawningHuts = [];
        this.level.initialHostageCount = 0; 
        this.level.missionTargetObstacles = [];
        this.level.playerSpawnZone = null;
        this.level.effectivePlayerSpawnZone = null;
        this.level.voronoiDiagram = null;
        this.level.corridorKeepOutZones = [];

        this.level.quadrantBoundaries = null;

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
        
        const extraKeepOutZones = [];
        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20));
        const playerSpawnZoneHeight = Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20));
        
        const playerSpawnZone = { x: playableMinX, y: playableMaxY - playerSpawnZoneHeight, width: playerSpawnZoneWidth, height: playerSpawnZoneHeight };
        this.level.playerSpawnZone = playerSpawnZone; 
        
        const playerUnitSize = CONFIG.RACCOON_SIZE || 12;
        const spawnAreaWidth = playerSpawnZone.width * CONFIG.LEVEL_GENERATION.PLAYER_SPAWN_PLACEMENT.PLAYER_SPAWN_AREA;
        const spawnAreaHeight = playerSpawnZone.height * CONFIG.LEVEL_GENERATION.PLAYER_SPAWN_PLACEMENT.PLAYER_SPAWN_AREA;
        const fixedPadding = 30; 
        const effectiveSpawnZoneX = playerSpawnZone.x + fixedPadding; 
        const effectiveSpawnZoneY = (playerSpawnZone.y + playerSpawnZone.height) - spawnAreaHeight - fixedPadding - 60;
        const effectiveSpawnZoneWidth = spawnAreaWidth; 
        const effectiveSpawnZoneHeight = spawnAreaHeight;
        
        this.level.effectivePlayerSpawnZone = {
            x: effectiveSpawnZoneX,
            y: effectiveSpawnZoneY,
            width: effectiveSpawnZoneWidth,
            height: effectiveSpawnZoneHeight
        };

        extraKeepOutZones.push(this.level.effectivePlayerSpawnZone);
        
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
                this.level.obstacles.push({ ...commonProps, x: segmentX, y: 0, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Top)`});
                this.level.obstacles.push({ ...commonProps, x: segmentX, y: worldHeight - topBottomBorderHeight, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Bottom)`});
            }
        } else {
            this.level.obstacles.push({ x: 0, y: 0, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Top', color: sideBorderColor, destructible: false, hp: Infinity,maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
            this.level.obstacles.push({ x: 0, y: worldHeight - topBottomBorderHeight, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Bottom', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        }
        this.level.obstacles.push({ x: 0, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Left', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        this.level.obstacles.push({ x: worldWidth - sideBorderWidth, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Right', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });

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
                
                if (distToPlayerSpawn >= (ezConfig.MIN_DISTANCE_FROM_PLAYER_SPAWN || 300) && !this.level._rectOverlap(ezObstacle, playerSpawnZone)) {
                    this.level.obstacles.push(ezObstacle);
                    this.game.addVisualEffect('extraction_zone', { obstacle: ezObstacle });
                    placedEZ = true;
                }
            }
            if (!placedEZ) { 
                ezObstacle.x = playableMinX; ezObstacle.y = playableMinY; 
                this.level.obstacles.push(ezObstacle); 
                this.game.addVisualEffect('extraction_zone', { obstacle: ezObstacle });
            }
        }
        
        // --- MODIFICATION START: Define a placement boundary for objectives to keep them out of the spawn zone ---
        const objectivePlacementMaxY = playerSpawnZone.y - 280; // 280px buffer
        // --- MODIFICATION END ---
        
        missionObjectives.forEach(objective => {
            if (objective.type === 'DESTROY_TARGET' && objective.targetTypeKey && objective.totalToAchieve > 0) {
                const targetTemplateOriginal = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === objective.targetTypeKey);
                
                if (targetTemplateOriginal) {
                    for (let i = 0; i < objective.totalToAchieve; i++) {
                        let targetX, targetY, placedTarget = false;
                        
                        let actualSpritePath = null;
                        let actualDestroyedSpritePath = null;
                        if (targetTemplateOriginal.type === 'possum_hut') {
                            const hutSpritePairs = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                            if (hutSpritePairs.length > 0) {
                                const selectedPair = this.rng.pickFrom(hutSpritePairs);
                                const pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                                actualSpritePath = pathBase + selectedPair.normal;
                                actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                            }
                        } else if (targetTemplateOriginal.type === 'possum_relay_tower') {
                             const towerSpritePairs = CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES || [];
                             if (towerSpritePairs.length > 0) {
                                const selectedPair = this.rng.pickFrom(towerSpritePairs);
                                const pathBase = CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH || '';
                                actualSpritePath = pathBase + selectedPair.normal;
                                actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                             }
                        } else {
                            actualSpritePath = targetTemplateOriginal.spriteNormal || null;
                            actualDestroyedSpritePath = targetTemplateOriginal.spriteDestroyed || null;
                        }
                        
                        let targetImage = actualSpritePath ? preloadedAssetImages[actualSpritePath] : null;

                        const targetWidth = targetImage ? targetImage.naturalWidth * (targetTemplateOriginal.spriteScale || 1) : (targetTemplateOriginal.width || 64);
                        const targetHeight = targetImage ? targetImage.naturalHeight * (targetTemplateOriginal.spriteScale || 1) : (targetTemplateOriginal.height || 64);

                        for (let attempt = 0; attempt < (genConfig.OBSTACLES.PLACEMENT_MAX_ATTEMPTS || 15); attempt++) {
                            // --- MODIFICATION START: Use the new Y boundary for objectives ---
                            targetX = this.rng.nextFloat(playableMinX, playableMaxX - targetWidth);
                            targetY = this.rng.nextFloat(playableMinY, objectivePlacementMaxY - targetHeight);
                            // --- MODIFICATION END ---
                            
                            const tempTargetForShapeCheck = { 
                                x:targetX, y:targetY, 
                                width:targetWidth, height:targetHeight, 
                                collisionShape: targetTemplateOriginal.collisionShape 
                            };
                            const collisionShapeForPlacementCheck = this.level._getObstacleCollisionShape(tempTargetForShapeCheck);

                            if (!this._isPlacementInvalid(collisionShapeForPlacementCheck, targetTemplateOriginal.isDecoration, this.level.obstacles, extraKeepOutZones)) {
                                const missionTargetObs = {
                                    x: targetX, y: targetY, width: targetWidth, height: targetHeight,
                                    type: targetTemplateOriginal.type, name: `${objective.targetNameSingular || targetTemplateOriginal.name || targetTemplateOriginal.type} (Objective)`,
                                    color: targetTemplateOriginal.color, destructible: targetTemplateOriginal.destructible,
                                    hp: targetTemplateOriginal.hp, maxHp: targetTemplateOriginal.maxHp, isDestroyed: false,
                                    blocksMovement: targetTemplateOriginal.blocksMovement, providesCover: targetTemplateOriginal.providesCover,
                                    isDecoration: targetTemplateOriginal.isDecoration,
                                    spriteNormalPath: actualSpritePath, imageNormal: targetImage, 
                                    spriteDestroyedPath: actualDestroyedSpritePath, imageDestroyed: actualDestroyedSpritePath ? preloadedAssetImages[actualDestroyedSpritePath] : null,
                                    spriteScale: targetTemplateOriginal.spriteScale || 1.0, spriteDestroyedScale: targetTemplateOriginal.spriteDestroyedScale,
                                    collisionShape: targetTemplateOriginal.collisionShape, 
                                    isMissionTarget: true, objectiveId: objective.id,
                                    isSpawner: targetTemplateOriginal.type === 'possum_hut',
                                    spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                                    delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0 
                                };
                                this.level.obstacles.push(missionTargetObs);
                                this.level.missionTargetObstacles.push(missionTargetObs);
                                if (missionTargetObs.isSpawner) this.level.potentialSpawnerHuts.push(missionTargetObs);
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

        const obsGenCfg = genConfig.OBSTACLES || {}; 
        const baseNumObstacles = obsGenCfg.BASE_COUNT || 20;
        const numInternalObstacles = Math.floor(baseNumObstacles * (baseParams.worldSizeFactor || 1.0)) + this.rng.nextInt(0, obsGenCfg.RANDOM_ADDITION_MAX || 8);
        const placementMaxAttempts = obsGenCfg.PLACEMENT_MAX_ATTEMPTS || 15;

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = this._getRandomObstacleTemplate();
            if (!template) { continue; }
            let obsRenderWidth, obsRenderHeight;
            let actualSpritePath = null, actualImageObject = null;
            let actualDestroyedSpritePath = template.spriteDestroyed || null, actualDestroyedImageObject = null;
            let normalSpriteScale = template.spriteScale || 1.0, destroyedSpriteScale = template.spriteDestroyedScale;
            let filesArray = [], pathBase = '', useRandomSpriteFromList = false;

            if (template.type === 'possum_hut') {
                const hutSpritePairs = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'possum_relay_tower') {
                const towerSpritePairs = CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES || [];
                if (towerSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(towerSpritePairs);
                    pathBase = CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'bush_medium') { filesArray = CONFIG.BUSH_SPRITES_32PX_FILES || []; pathBase = CONFIG.BUSH_SPRITES_32PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'bush_large') { filesArray = CONFIG.TROPICAL_BUSH_LARGE_FILES || []; pathBase = CONFIG.TROPICAL_BUSH_LARGE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'fence_barbed_straight_short') { filesArray = CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'fence_barbed_straight_long') { filesArray = CONFIG.FENCE_BARBED_LONG_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rock_medium') { filesArray = CONFIG.ROCK_SPRITES_32PX_FILES || []; pathBase = CONFIG.ROCK_SPRITES_32PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rock_large') { filesArray = CONFIG.ROCK_SPRITES_64PX_FILES || []; pathBase = CONFIG.ROCK_SPRITES_64PX_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_single') { filesArray = CONFIG.PALM_TREE_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_double') { filesArray = CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_DOUBLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm_triple') { filesArray = CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_TRIPLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
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
                const collisionCheckShape = this.level._getObstacleCollisionShape(tempObstacleForShape);
                
                if (!this._isPlacementInvalid(collisionCheckShape, template.isDecoration, this.level.obstacles, extraKeepOutZones)) {
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
                    this.level.obstacles.push(newObstacle);
                    if (newObstacle.isSpawner && !newObstacle.isMissionTarget) this.level.potentialSpawnerHuts.push(newObstacle);
                    this._spawnInitialGuardsForObject(newObstacle, template);
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }
        
        this.level.generateNavigationGrid(worldWidth, worldHeight);
        
        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {}; 
        // --- MODIFICATION START: Define enemy spawn boundary to keep them out of player zone ---
        const enemySpawnMinY = playableMinY;
        const enemySpawnMaxY = playerSpawnZone.y - (enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 100);
        // --- MODIFICATION END ---
        
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
                    
                    if (this.level.isSpawnPointClear(bossX, bossY, bossSize, this.level.obstacles, [])) {
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
        
        const totalEnemiesToSpawnForThisMission = totalEnemiesToSpawn_InitialCalculation; 
        const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0; 
        const numberOfGroupsToAttempt = Math.ceil(Math.max(0, totalEnemiesToSpawnForThisMission - enemiesSpawnedCount) / Math.max(1, avgEnemiesPerGroup));


        const quadrantCols = enemySpawnCfg.QUADRANT_COLS || 3;
        const quadrantRows = enemySpawnCfg.QUADRANT_ROWS || 2;
        const quadrantEnemyCounts = Array(quadrantRows).fill(0).map(() => Array(quadrantCols).fill(0));
        
        // --- MODIFICATION START: Use full playable area for quadrant calculations ---
        const quadrantWidth = playableWidth / quadrantCols;
        const quadrantHeight = playableHeight / quadrantRows;

        if (enemySpawnCfg.QUADRANT_SPAWNING_ENABLED) {
            this.level.quadrantBoundaries = {
                minX: playableMinX,
                minY: playableMinY,
                maxX: playableMaxX,
                maxY: playableMaxY, // Use the full playable area's bottom edge
                cols: quadrantCols,
                rows: quadrantRows,
                width: quadrantWidth,
                height: quadrantHeight
            };

            for (let r = 0; r < quadrantRows; r++) {
                for (let c = 0; c < quadrantCols; c++) {
                    const quadRect = {
                        x: playableMinX + c * quadrantWidth,
                        y: playableMinY + r * quadrantHeight,
                        width: quadrantWidth,
                        height: quadrantHeight
                    };

                    if (this.level._rectOverlap(quadRect, playerSpawnZone)) {
                        quadrantEnemyCounts[r][c] = Infinity; // Mark as "full"
                    }
                }
            }
        }
        // --- MODIFICATION END ---

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
            
            let targetQuadrantCol = -1, targetQuadrantRow = -1;
            if (enemySpawnCfg.QUADRANT_SPAWNING_ENABLED) {
                let minCount = Infinity;
                quadrantEnemyCounts.forEach(row => row.forEach(count => {
                    if (count < minCount) minCount = count;
                }));

                const leastPopulatedQuadrants = [];
                for (let r = 0; r < quadrantRows; r++) {
                    for (let c = 0; c < quadrantCols; c++) {
                        if (quadrantEnemyCounts[r][c] === minCount) {
                            leastPopulatedQuadrants.push({ row: r, col: c });
                        }
                    }
                }

                if (leastPopulatedQuadrants.length > 0) {
                    const chosenQuadrant = this.rng.pickFrom(leastPopulatedQuadrants);
                    targetQuadrantRow = chosenQuadrant.row;
                    targetQuadrantCol = chosenQuadrant.col;
                }
            }
            
            for (let attempt = 0; attempt < leaderMaxAttempts; attempt++) {
                if (targetQuadrantCol !== -1) {
                    const quadMinX = playableMinX + targetQuadrantCol * quadrantWidth;
                    const quadMinY = playableMinY + targetQuadrantRow * quadrantHeight;
                    groupLeaderX = this.rng.nextFloat(quadMinX, quadMinX + quadrantWidth);
                    groupLeaderY = this.rng.nextFloat(quadMinY, quadMinY + quadrantHeight);
                } else {
                    groupLeaderX = this.rng.nextFloat(playableMinX, playableMaxX);
                    groupLeaderY = this.rng.nextFloat(playableMinY, playableMaxY);
                }

                const leaderFootprint = {x: groupLeaderX - CONFIG.POSSUM_HEAVY_SIZE/2, y: groupLeaderY - CONFIG.POSSUM_HEAVY_SIZE/2, width: CONFIG.POSSUM_HEAVY_SIZE, height: CONFIG.POSSUM_HEAVY_SIZE};

                // This check now correctly prevents spawning in the effectivePlayerSpawnZone
                if (this.level.isSpawnPointClear(groupLeaderX, groupLeaderY, CONFIG.POSSUM_HEAVY_SIZE, this.level.obstacles, this.game.enemyUnits) &&
                    !this._isPlacementInvalid(leaderFootprint, false, [], extraKeepOutZones)) {
                        isLeaderSpawnClear = true;
                        break;
                }
            }

            if (isLeaderSpawnClear) {
                if (targetQuadrantCol !== -1) {
                    quadrantEnemyCounts[targetQuadrantRow][targetQuadrantCol] += currentGroupSizeAttempt;
                }
                const currentGroupMembers = [];
                for (let m = 0; m < currentGroupSizeAttempt && enemiesSpawnedCount < totalEnemiesToSpawnForThisMission; m++) {
                    let memberX, memberY, isMemberSpawnClear; 
                    let memberPlacementAttempts = 0; const memberMaxAttempts = enemySpawnCfg.MEMBER_PLACEMENT_MAX_ATTEMPTS || 10;
                    
                    // --- MODIFICATION START ---
                    let EnemyClass = PossumGrunt;
                    let currentEnemyUnitSize = CONFIG.POSSUM_GRUNT_SIZE;

                    const sniperChance = baseParams.sniperChance || 0;
                    const heavyChance = baseParams.heavyChance || 0.20;
                    const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;

                    // Determine unit type: Sniper > Heavy > Grunt
                    if (this.rng.chance(sniperChance)) {
                        EnemyClass = PossumSniper;
                        currentEnemyUnitSize = CONFIG.POSSUM_SNIPER_SIZE;
                    } else if ((m === 0 && currentGroupSizeAttempt > 0 && this.rng.chance(heavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0))) || (currentGroupSizeAttempt === 1 && this.rng.chance(heavyChance))) {
                        EnemyClass = PossumHeavy;
                        currentEnemyUnitSize = CONFIG.POSSUM_HEAVY_SIZE;
                    }
                    // --- MODIFICATION END ---
                    
                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30; const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5; const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberY = (m === 0) ? groupLeaderY : groupLeaderY + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2)); 
                        memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = {x: memberX - currentEnemyUnitSize/2, y: memberY - currentEnemyUnitSize/2, width: currentEnemyUnitSize, height: currentEnemyUnitSize};
                        isMemberSpawnClear = this.level.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.level.obstacles, this.game.enemyUnits.concat(currentGroupMembers)) && !this._isPlacementInvalid(memberFootprint, false, [], extraKeepOutZones); 
                        memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);
                    
                    if (isMemberSpawnClear) {
                        const enemyUnit = new EnemyClass(memberX, memberY, this.game);
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
            this.level.initialHostageCount = numHostagesToSpawn;
            let spawnedHostageCount = 0;
            const hostageSize = CONFIG.RACCOON_SIZE || 12;

            if (hostageConf.SPAWN_AT_HUTS && numHostagesToSpawn > spawnedHostageCount) {
                const eligibleHuts = this.level.obstacles.filter(hut => {
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
                        if (this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${spawnedHostageCount}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                            hutHostageCounts.set(hut.name || hut.type + hut.x + hut.y, (currentHutHostageCount + 1));
                            const hutDef = CONFIG.OBSTACLE_DEFINITIONS.find(def => def.type === hut.type);
                            if(hutDef) this._spawnInitialGuardsForObject(hut, hutDef);
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
                                this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
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
                            this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
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

        const playerSpawnLocations = []; 
        const pSpawnPlaceCfg = genConfig.PLAYER_SPAWN_PLACEMENT || {}; 
        
        for (let i = 0; i < numPlayerSpawnsNeeded; i++) {
            let spawnX, spawnY, isClear; let currentPlacementAttempts = 0; const maxPlayerSpawnAttempts = pSpawnPlaceCfg.MAX_ATTEMPTS || 30; let foundSpot = false;
            if (effectiveSpawnZoneWidth > playerUnitSize && effectiveSpawnZoneHeight > playerUnitSize) {
                do {
                    spawnX = this.rng.nextFloat(effectiveSpawnZoneX, effectiveSpawnZoneX + effectiveSpawnZoneWidth);
                    spawnY = this.rng.nextFloat(effectiveSpawnZoneY, effectiveSpawnZoneY + effectiveSpawnZoneHeight);
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2)); 
                    spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                    isClear = this.level.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.level.obstacles, this.game.deployedSquadRoster || []);
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
}