// js/levelGenerator.js

class LevelGenerator {
    constructor(levelInstance) {
        this.level = levelInstance;
        this.game = levelInstance.game;
        this.rng = null; // Will be set at the start of generation
        this._spawnCounts = {}; // Tracks how many of each obstacle type have been placed

    }

/**
     * Checks if a new obstacle's shape collides with any existing, non-decoration obstacles.
     * @param {object} newObstacleShape - The collision shape of the new obstacle.
     * @param {boolean} newIsDecoration - Whether the new obstacle is just a decoration.
     * @param {Array} existingObstacles - The array of obstacles already placed.
     * @returns {boolean} - True if the placement is invalid (collides), false otherwise.
     */

    _getShapeMaxExtent(shape) {
        if (shape.type === 'circle') {
            return shape.radius;
        } else if (shape.type === 'ellipse') {
            return Math.max(shape.radiusX, shape.radiusY);
        } else if (shape.type === 'rectangle') {
            return Math.sqrt(shape.width * shape.width + shape.height * shape.height) / 2;
        }
        return Math.max(shape.width || 0, shape.height || 0) / 2;
    }

    _getShapeBoundingBox(shape) {
        if (shape.type === 'circle') {
            return { minX: shape.x - shape.radius, minY: shape.y - shape.radius, maxX: shape.x + shape.radius, maxY: shape.y + shape.radius };
        } else if (shape.type === 'ellipse') {
            return { minX: shape.x - shape.radiusX, minY: shape.y - shape.radiusY, maxX: shape.x + shape.radiusX, maxY: shape.y + shape.radiusY };
        } else if (shape.type === 'rectangle') {
            if (shape.rotation !== undefined && shape.rotation !== 0) {
                const halfW = Math.abs(shape.width * Math.cos(shape.rotation)) + Math.abs(shape.height * Math.sin(shape.rotation));
                const halfH = Math.abs(shape.width * Math.sin(shape.rotation)) + Math.abs(shape.height * Math.cos(shape.rotation));
                return { minX: shape.x - halfW / 2, minY: shape.y - halfH / 2, maxX: shape.x + halfW / 2, maxY: shape.y + halfH / 2 };
            }
            return { minX: shape.x, minY: shape.y, maxX: shape.x + shape.width, maxY: shape.y + shape.height };
        }
        return { minX: shape.x || 0, minY: shape.y || 0, maxX: (shape.x || 0) + (shape.width || 0), maxY: (shape.y || 0) + (shape.height || 0) };
    }

    _boundingBoxOverlap(bb1, bb2) {
        return bb1.minX <= bb2.maxX && bb1.maxX >= bb2.minX && bb1.minY <= bb2.maxY && bb1.maxY >= bb2.minY;
    }

    _buildGenerationSpatialGrid(existingObstacles) {
        const cellSize = 100;
        const grid = new Map();
        for (const obs of existingObstacles) {
            const shapes = this.level._getObstacleCollisionShape(obs);
            if (!shapes) continue;
            const shapesArray = Array.isArray(shapes) ? shapes : [shapes];
            for (const shape of shapesArray) {
                const bb = this._getShapeBoundingBox(shape);
                const startCol = Math.floor(bb.minX / cellSize);
                const endCol = Math.floor(bb.maxX / cellSize);
                const startRow = Math.floor(bb.minY / cellSize);
                const endRow = Math.floor(bb.maxY / cellSize);
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startCol; col <= endCol; col++) {
                        const key = `${col},${row}`;
                        if (!grid.has(key)) grid.set(key, []);
                        grid.get(key).push({ obstacle: obs, shape: shape, boundingBox: bb });
                    }
                }
            }
        }
        return { grid, cellSize };
    }

    _queryGenerationSpatialGrid(spatialGridData, newShapesArray, buffer) {
        const { grid, cellSize } = spatialGridData;
        const results = new Set();
        const maxExtraExtent = buffer + 50;
        for (const newShape of newShapesArray) {
            const bb = this._getShapeBoundingBox(newShape);
            const startCol = Math.floor((bb.minX - maxExtraExtent) / cellSize);
            const endCol = Math.floor((bb.maxX + maxExtraExtent) / cellSize);
            const startRow = Math.floor((bb.minY - maxExtraExtent) / cellSize);
            const endRow = Math.floor((bb.maxY + maxExtraExtent) / cellSize);
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const key = `${col},${row}`;
                    const cell = grid.get(key);
                    if (cell) {
                        for (const entry of cell) {
                            results.add(entry);
                        }
                    }
                }
            }
        }
        return Array.from(results);
    }

    _isPlacementInvalid(newObstacleShape, newObstacleTemplate, existingObstacles, extraKeepOutZones = []) {
        const newShapesArray = Array.isArray(newObstacleShape) ? newObstacleShape : [newObstacleShape];

        for (const zone of extraKeepOutZones) {
            let zoneCollision = false;
            for (const newShape of newShapesArray) {
                const newHasRotation = newShape.type === 'rectangle' && newShape.rotation !== undefined && newShape.rotation !== 0;
                if (newShape.type === 'rectangle' && newHasRotation) {
                    if (obbOverlap(newShape, zone)) { zoneCollision = true; break; }
                } else {
                    if (this.level._rectOverlap(newShape, zone)) { zoneCollision = true; break; }
                }
            }
            if (zoneCollision) return true;
        }

        const buffer = newObstacleTemplate.placementBuffer || 0;

        const newBoundingBoxes = newShapesArray.map(s => this._getShapeBoundingBox(s));
        let newCombinedBB = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        for (const bb of newBoundingBoxes) {
            if (bb.minX < newCombinedBB.minX) newCombinedBB.minX = bb.minX;
            if (bb.minY < newCombinedBB.minY) newCombinedBB.minY = bb.minY;
            if (bb.maxX > newCombinedBB.maxX) newCombinedBB.maxX = bb.maxX;
            if (bb.maxY > newCombinedBB.maxY) newCombinedBB.maxY = bb.maxY;
        }

        if (!this._genSpatialGrid || this._genSpatialGridVersion !== existingObstacles.length) {
            this._genSpatialGrid = this._buildGenerationSpatialGrid(existingObstacles);
            this._genSpatialGridVersion = existingObstacles.length;
        }

        const candidates = this._queryGenerationSpatialGrid(this._genSpatialGrid, newShapesArray, buffer);

        for (const candidate of candidates) {
            const existing = candidate.obstacle;
            const shapeToCheck = candidate.shape;
            const existingBB = candidate.boundingBox;

            if (newObstacleTemplate.isDecoration && existing.isDecoration) {
                const decoBuffer = newObstacleTemplate.decorationBuffer || 0;
                if (decoBuffer <= 0) continue;
                const newCenterX = newShapesArray[0].x || 0;
                const newCenterY = newShapesArray[0].y || 0;
                const existCenterX = shapeToCheck.x || existing.x || 0;
                const existCenterY = shapeToCheck.y || existing.y || 0;
                const cdx = newCenterX - existCenterX;
                const cdy = newCenterY - existCenterY;
                const newExtent = this._getShapeMaxExtent(newShapesArray[0]);
                const existExtent = this._getShapeMaxExtent(shapeToCheck);
                const minDist =  decoBuffer;
                if (cdx * cdx + cdy * cdy < minDist * minDist) return true;
                continue;
            }

            if (!this._boundingBoxOverlap(newCombinedBB, existingBB)) {
                continue;
            }

            let collision = false;
            const newMaxExtent = this._getShapeMaxExtent(newShapesArray[0]);
            const existMaxExtent = this._getShapeMaxExtent(shapeToCheck);
            const newCenterX = newShapesArray[0].x || 0;
            const newCenterY = newShapesArray[0].y || 0;
            const existCenterX = shapeToCheck.x || existing.x || 0;
            const existCenterY = shapeToCheck.y || existing.y || 0;
            const dx = newCenterX - existCenterX;
            const dy = newCenterY - existCenterY;
            const maxDist = newMaxExtent + existMaxExtent + buffer + 50;
            if (dx * dx + dy * dy > maxDist * maxDist) continue;

            let shapeForCollision = shapeToCheck;
            if (buffer > 0) {
                shapeForCollision = { ...shapeToCheck };
                if (shapeForCollision.type === 'rectangle') {
                    shapeForCollision.x -= buffer;
                    shapeForCollision.y -= buffer;
                    shapeForCollision.width += buffer * 2;
                    shapeForCollision.height += buffer * 2;
                } else if (shapeForCollision.type === 'circle') {
                    shapeForCollision.radius += buffer;
                } else if (shapeForCollision.type === 'ellipse') {
                    shapeForCollision.radiusX += buffer;
                    shapeForCollision.radiusY += buffer;
                }
            }

            for (const newShape of newShapesArray) {
                const newHasRotation = newShape.type === 'rectangle' && newShape.rotation !== undefined && newShape.rotation !== 0;
                const checkHasRotation = shapeForCollision.type === 'rectangle' && shapeForCollision.rotation !== undefined && shapeForCollision.rotation !== 0;
                if (newShape.type === 'circle') {
                    if (shapeForCollision.type === 'rectangle') collision = checkHasRotation ? obbCircleOverlap(shapeForCollision, newShape) : rectCircleOverlap(shapeForCollision, newShape);
                    else if (shapeForCollision.type === 'circle') collision = circleOverlap(shapeForCollision, newShape);
                    else if (shapeForCollision.type === 'ellipse') collision = circleEllipseOverlap(newShape, shapeForCollision);
                } else if (newShape.type === 'rectangle') {
                    if (shapeForCollision.type === 'rectangle') {
                        if (newHasRotation || checkHasRotation) {
                            collision = obbOverlap(newShape, shapeForCollision);
                        } else {
                            collision = this.level._rectOverlap(shapeForCollision, newShape);
                        }
                    }
                    else if (shapeForCollision.type === 'circle') collision = newHasRotation ? obbCircleOverlap(newShape, shapeForCollision) : rectCircleOverlap(newShape, shapeForCollision);
                    else if (shapeForCollision.type === 'ellipse') collision = newHasRotation ? obbEllipseOverlap(newShape, shapeForCollision) : rectEllipseOverlap(newShape, shapeForCollision);
                } else if (newShape.type === 'ellipse') {
                    if (shapeForCollision.type === 'rectangle') collision = checkHasRotation ? obbEllipseOverlap(shapeForCollision, newShape) : rectEllipseOverlap(shapeForCollision, newShape);
                    else if (shapeForCollision.type === 'circle') collision = circleEllipseOverlap(shapeForCollision, newShape);
                    else if (shapeForCollision.type === 'ellipse') {
                        const r1 = { x: newShape.x - newShape.radiusX, y: newShape.y - newShape.radiusY, width: newShape.radiusX * 2, height: newShape.radiusY * 2 };
                        const r2 = { x: shapeForCollision.x - shapeForCollision.radiusX, y: shapeForCollision.y - shapeForCollision.radiusY, width: shapeForCollision.radiusX * 2, height: shapeForCollision.radiusY * 2 };
                        collision = this.level._rectOverlap(r1, r2);
                    }
                }

                if (collision) {
                    if (newObstacleTemplate.isDecoration && !existing.isDecoration && !existing.blocksMovement && existing.providesCover) {
                        continue;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    _isClearOfMovementBlockingDecorations(x, y, radius, existingObstacles, extraBuffer = 0) {
        const movementBlockingDecorations = existingObstacles.filter(obs => 
            obs.isDecoration && obs.blocksMovement && !obs.isDestroyed
        );
        
        for (const decoration of movementBlockingDecorations) {
            const shapesToCheck = this.level._getObstacleCollisionShape(decoration);
            if (!shapesToCheck) continue;
            
            const decorationShapes = Array.isArray(shapesToCheck) ? shapesToCheck : [shapesToCheck];
            const spawnCircle = { type: 'circle', x: x, y: y, radius: radius + extraBuffer };
            
            for (const decoShape of decorationShapes) {
                let collision = false;
                if (decoShape.type === 'rectangle') {
                    const hasRotation = decoShape.rotation !== undefined && decoShape.rotation !== 0;
                    collision = hasRotation ? obbCircleOverlap(decoShape, spawnCircle) : rectCircleOverlap(decoShape, spawnCircle);
                } else if (decoShape.type === 'circle') {
                    collision = circleOverlap(decoShape, spawnCircle);
                } else if (decoShape.type === 'ellipse') {
                    collision = circleEllipseOverlap(spawnCircle, decoShape);
                }
                
                if (collision) return false;
            }
        }
        return true;
    }

    _getAllObstacleDefinitions() {
        if (!this._mergedObstacleDefs) {
            this._mergedObstacleDefs = [
                ...CONFIG.OBSTACLE_DEFINITIONS,
                ...(this.currentBiome.obstacleDefinitions || [])
            ];
        }
        return this._mergedObstacleDefs;
    }

    _getRandomObstacleTemplate() {
        const definitions = this._getAllObstacleDefinitions() || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }

        const currentPhaseIdx = this.game.currentPhaseIndex || 0;

        const hasReachedSpawnLimit = (def) => {
            if (def.spawnLimit === undefined || def.spawnLimit === null) return false;
            const currentCount = this._spawnCounts[def.type] || 0;
            return currentCount >= def.spawnLimit;
        };

        let totalWeight = 0;
        definitions.forEach(def => {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj =>
                    obj.type === "DESTROY_TARGET" && def.type.startsWith(obj.targetTypeKeyPrefix)
                );
            }

            if (def.type !== 'extraction_zone' && !isCurrentMissionTargetType) {
                if ((def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx) && !hasReachedSpawnLimit(def)) {
                    totalWeight += (def.spawnWeight || 0);
                }
            }
        });

        if (totalWeight === 0) {
            const validDefs = definitions.filter(def => {
                let isCurrentMissionTargetType = false;
                if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                    isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj =>
                        obj.type === "DESTROY_TARGET" && def.type.startsWith(obj.targetTypeKeyPrefix)
                    );
                }
                return def.type !== 'extraction_zone' && !isCurrentMissionTargetType &&
                    (def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx) &&
                    !hasReachedSpawnLimit(def);
            });
            if (validDefs.length > 0) return this.rng.pickFrom(validDefs);
            return null;
        }

        let randomNum = this.rng.next() * totalWeight;
        for (const def of definitions) {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj =>
                    obj.type === "DESTROY_TARGET" && def.type.startsWith(obj.targetTypeKeyPrefix)
                );
            }
            if (def.type === 'extraction_zone' || isCurrentMissionTargetType) continue;
            if (def.phaseUnlocked !== undefined && def.phaseUnlocked > currentPhaseIdx) continue;
            if (hasReachedSpawnLimit(def)) continue;

            randomNum -= (def.spawnWeight || 0);
            if (randomNum <= 0) return def;
        }

        const lastValidDefs = definitions.filter(def => {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj =>
                    obj.type === "DESTROY_TARGET" && def.type.startsWith(obj.targetTypeKeyPrefix)
                );
            }
            return def.type !== 'extraction_zone' && !isCurrentMissionTargetType &&
                (def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx) &&
                !hasReachedSpawnLimit(def);
        });
        return lastValidDefs.pop() || (lastValidDefs.length > 0 ? lastValidDefs[0] : null);
    }

    _getRandomPickupTemplate() {
        const definitions = CONFIG.PICKUP_DEFINITIONS || [];
        if (definitions.length === 0) {
            console.warn("No pickup definitions found in CONFIG.PICKUP_DEFINITIONS!");
            return null;
        }

        let totalWeight = 0;
        definitions.forEach(def => {
            totalWeight += (def.spawnWeight || 0);
        });

        if (totalWeight === 0) return null;

        let randomNum = this.rng.next() * totalWeight;
        for (const def of definitions) {
            randomNum -= (def.spawnWeight || 0);
            if (randomNum <= 0) return def;
        }

        return definitions.pop() || null;
    }

    _spawnInitialGuardsForObject(parentObject, objectDefinition, allSpawnedEnemies, extraUnitPoolWeights) {
        if (!objectDefinition.initialGuardPack || !objectDefinition.initialGuardPack.enabled) {
            return;
        }

        const pack = objectDefinition.initialGuardPack;
        const phaseBonus = Math.floor((this.game.currentPhaseIndex || 0) * (pack.countPerPhaseBonus || 0));
        const guardCount = this.rng.nextInt(pack.countRange[0], pack.countRange[1]) + phaseBonus;

        if (guardCount <= 0) return;

        const currentPhaseIdx = this.game.currentPhaseIndex || 0;
        const unitUnlockPhases = { possum_heavy: 1, possum_sniper: 2, possum_elite: 3 };
        const effectiveUnitPool = pack.unitPool.filter(unitDef => {
            const unlockPhase = unitUnlockPhases[unitDef.type];
            return unlockPhase === undefined || currentPhaseIdx >= unlockPhase;
        });

        if (effectiveUnitPool.length === 0) return;

        let finalUnitPool = effectiveUnitPool;
        if (extraUnitPoolWeights && extraUnitPoolWeights.length > 0) {
            const filteredExtra = extraUnitPoolWeights.filter(uw => {
                const unlockPhase = unitUnlockPhases[uw.type];
                return unlockPhase === undefined || currentPhaseIdx >= unlockPhase;
            });
            finalUnitPool = effectiveUnitPool.concat(filteredExtra);
        }

        // --- MODIFICATION START: Correctly determine the center for both Obstacles and Units ---
        const isUnit = parentObject.width === undefined; // Units have .size, not .width
        const parentCenterX = isUnit ? parentObject.x : parentObject.x + parentObject.width / 2;
        const parentCenterY = isUnit ? parentObject.y : parentObject.y + parentObject.height / 2;
        // --- MODIFICATION END ---

        const spawnRadius = pack.spawnRadius || 60;
        const playableBounds = {
            minX: this.level.playableMinX,
            maxX: this.level.playableMaxX,
            minY: this.level.playableMinY,
            maxY: this.level.playableMaxY
        };

        let spawnedGuards = 0;

        for (let i = 0; i < guardCount; i++) {
            const unitDef = this.game._weightedRandomSelect(finalUnitPool, this.rng);
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
            } else if (unitDef.type === 'possum_elite') {
                GuardClass = PossumElite;
                guardSize = CONFIG.POSSUM_ELITE_SIZE;
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

                if (this.level.isSpawnPointClear(guardX, guardY, guardSize, this.level.obstacles, allSpawnedEnemies)) {
                    const newGuard = new GuardClass(guardX, guardY, this.game);
                    newGuard.guardPost = { x: guardX, y: guardY };

                    this.game.enemyUnits.push(newGuard);
                    allSpawnedEnemies.push(newGuard); // Add to the master list for this generation pass.

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
     * Spawns a grenade crate near a relay tower target
     * @param {number} targetX - X position of the target
     * @param {number} targetY - Y position of the target
     * @param {number} targetWidth - Width of the target
     * @param {number} targetHeight - Height of the target
     */
    _spawnGrenadeCrateNearTarget(targetX, targetY, targetWidth, targetHeight, towerCollisionShapes) {
        // Find the grenade crate template
        const grenadeCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_grenade_crate');
        if (!grenadeCrateDef) {
//            console.warn("[Level Gen] Could not find pickup_grenade_crate definition");
            return;
        }

        const centerX = targetX + targetWidth / 2;
        const centerY = targetY + targetHeight / 2;

        let minDistance = 50;
        if (towerCollisionShapes && towerCollisionShapes.length > 0) {
            for (const shape of towerCollisionShapes) {
                const extent = this._getCollisionShapeMaxExtentFromCenter(shape, centerX, centerY);
                minDistance = Math.max(minDistance, extent + 20);
            }
        }

        // Calculate spawn position - random angle and distance around the target
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const distance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
        const crateX = centerX + Math.cos(angle) * distance;
        const crateY = centerY + Math.sin(angle) * distance;

        // Check bounds
        const playableMinX = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxX = (CONFIG.WORLD_WIDTH || 800) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMinY = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxY = (CONFIG.WORLD_HEIGHT || 600) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;

        // Clamp to playable bounds
        const finalCrateX = Math.max(playableMinX, Math.min(crateX, playableMaxX - 30));
        const finalCrateY = Math.max(playableMinY, Math.min(crateY, playableMaxY - 30));

        // Check if placement is valid
        const crateShape = {
            x: finalCrateX,
            y: finalCrateY,
            width: 30,
            height: 30
        };

        if (this._isPlacementInvalid(crateShape, grenadeCrateDef, this.level.obstacles, [])) {
            // Try a few more random positions around the target
            let placed = false;
            for (let attempt = 0; attempt < 8; attempt++) {
                const retryAngle = this.rng.nextFloat(0, Math.PI * 2);
                const retryDistance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
                crateShape.x = centerX + Math.cos(retryAngle) * retryDistance;
                crateShape.y = centerY + Math.sin(retryAngle) * retryDistance;
                if (!this._isPlacementInvalid(crateShape, grenadeCrateDef, this.level.obstacles, [])) {
                    placed = true;
                    break;
                }
            }
            if (!placed) {
//                console.warn("[Level Gen] Could not place grenade crate near relay tower - no valid position found");
                return;
            }
        }

        // Create the grenade crate obstacle
        const grenadeSpriteFiles = CONFIG.GRENADE_PICKUP_SPRITE_FILES || [];
        const grenadeSpritePath = CONFIG.GRENADE_PICKUP_SPRITE_PATH || '';
        const grenadeSpritePair = grenadeSpriteFiles.length > 0 ? grenadeSpriteFiles[0] : { normal: 'grenade_pickup_crate.png', destroyed: 'grenade_pickup_crate_empty.png' };
        const spriteNormalPath = grenadeSpritePath + grenadeSpritePair.normal;
        const spriteDestroyedPath = grenadeSpritePath + grenadeSpritePair.destroyed;
        const crateImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteNormalPath] : null;
        const crateDestroyedImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteDestroyedPath] : null;

        const grenadeCrate = {
            x: crateShape.x,
            y: crateShape.y,
            width: crateImage ? crateImage.naturalWidth * (grenadeCrateDef.spriteScale || 1) : (grenadeCrateDef.width || 30),
            height: crateImage ? crateImage.naturalHeight * (grenadeCrateDef.spriteScale || 1) : (grenadeCrateDef.height || 30),
            type: grenadeCrateDef.type,
            name: grenadeCrateDef.name,
            color: grenadeCrateDef.color,
            destructible: grenadeCrateDef.destructible,
            hp: grenadeCrateDef.hp,
            maxHp: grenadeCrateDef.maxHp,
            isDestroyed: false,
            blocksMovement: false,
            providesCover: false,
            pickupType: grenadeCrateDef.pickupType,
            pickupQuantity: grenadeCrateDef.pickupQuantity,
            isPickup: true,
            isDecoration: false,
            spriteNormalPath: spriteNormalPath,
            spriteDestroyedPath: spriteDestroyedPath,
            imageNormal: crateImage,
            imageDestroyed: crateDestroyedImage,
            spriteScale: grenadeCrateDef.spriteScale || 1.0,
            collisionShape: grenadeCrateDef.collisionShape
        };

        this.level.obstacles.push(grenadeCrate);
        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Spawned grenade crate at (${finalCrateX.toFixed(0)}, ${finalCrateY.toFixed(0)}) near relay tower`);
    }

    /**
     * Spawns an ammo crate near a relay tower target
     * @param {number} targetX - X position of the target
     * @param {number} targetY - Y position of the target
     * @param {number} targetWidth - Width of the target
     * @param {number} targetHeight - Height of the target
     */
    _spawnAmmoCrateNearTarget(targetX, targetY, targetWidth, targetHeight, towerCollisionShapes) {
        const ammoCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_ammo_crate');
        if (!ammoCrateDef) {
            return;
        }

        const centerX = targetX + targetWidth / 2;
        const centerY = targetY + targetHeight / 2;

        let minDistance = 50;
        if (towerCollisionShapes && towerCollisionShapes.length > 0) {
            for (const shape of towerCollisionShapes) {
                const extent = this._getCollisionShapeMaxExtentFromCenter(shape, centerX, centerY);
                minDistance = Math.max(minDistance, extent + 20);
            }
        }

        // Calculate spawn position - random angle and distance around the target
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const distance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
        const crateX = centerX + Math.cos(angle) * distance;
        const crateY = centerY + Math.sin(angle) * distance;

        const playableMinX = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxX = (CONFIG.WORLD_WIDTH || 800) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMinY = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxY = (CONFIG.WORLD_HEIGHT || 600) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;

        const finalCrateX = Math.max(playableMinX, Math.min(crateX, playableMaxX - 30));
        const finalCrateY = Math.max(playableMinY, Math.min(crateY, playableMaxY + 30));

        const crateShape = {
            x: finalCrateX,
            y: finalCrateY,
            width: 30,
            height: 30
        };

        if (this._isPlacementInvalid(crateShape, ammoCrateDef, this.level.obstacles, [])) {
            // Try a few more random positions around the target
            let placed = false;
            for (let attempt = 0; attempt < 8; attempt++) {
                const retryAngle = this.rng.nextFloat(0, Math.PI * 2);
                const retryDistance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
                crateShape.x = centerX + Math.cos(retryAngle) * retryDistance;
                crateShape.y = centerY + Math.sin(retryAngle) * retryDistance;
                if (!this._isPlacementInvalid(crateShape, ammoCrateDef, this.level.obstacles, [])) {
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                return;
            }
        }

        const ammoSpriteFiles = CONFIG.AMMO_PICKUP_SPRITE_FILES || [];
        const ammoSpritePath = CONFIG.AMMO_PICKUP_SPRITE_PATH || '';
        const ammoSpritePair = ammoSpriteFiles.length > 0 ? ammoSpriteFiles[0] : { normal: 'ammo_pickup_crate.png', destroyed: 'ammo_pickup_crate_empty.png' };
        const spriteNormalPath = ammoSpritePath + ammoSpritePair.normal;
        const spriteDestroyedPath = ammoSpritePath + ammoSpritePair.destroyed;
        const crateImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteNormalPath] : null;
        const crateDestroyedImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteDestroyedPath] : null;

        const ammoCrate = {
            x: crateShape.x,
            y: crateShape.y,
            width: crateImage ? crateImage.naturalWidth * (ammoCrateDef.spriteScale || 1) : (ammoCrateDef.width || 30),
            height: crateImage ? crateImage.naturalHeight * (ammoCrateDef.spriteScale || 1) : (ammoCrateDef.height || 30),
            type: ammoCrateDef.type,
            name: ammoCrateDef.name,
            color: ammoCrateDef.color,
            destructible: ammoCrateDef.destructible,
            hp: ammoCrateDef.hp,
            maxHp: ammoCrateDef.maxHp,
            isDestroyed: false,
            blocksMovement: false,
            providesCover: false,
            pickupType: ammoCrateDef.pickupType,
            pickupQuantity: ammoCrateDef.pickupQuantity,
            isPickup: true,
            isDecoration: false,
            spriteNormalPath: spriteNormalPath,
            spriteDestroyedPath: spriteDestroyedPath,
            imageNormal: crateImage,
            imageDestroyed: crateDestroyedImage,
            spriteScale: ammoCrateDef.spriteScale || 1.0,
            collisionShape: ammoCrateDef.collisionShape
        };

        this.level.obstacles.push(ammoCrate);
        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Spawned ammo crate at (${finalCrateX.toFixed(0)}, ${finalCrateY.toFixed(0)}) near relay tower`);
    }

    _getAvailableWeaponCrateTypes(currentPhase) {
        const availableWeapons = [];
        const weaponDefs = CONFIG.WEAPON_DEFINITIONS || {};
        for (const [weaponName, def] of Object.entries(weaponDefs)) {
            if (!def.isDefaultWeapon && def.phaseUnlocked !== undefined && def.phaseUnlocked <= currentPhase) {
                availableWeapons.push(weaponName);
            }
        }
        return availableWeapons;
    }

    _spawnWeaponCrateNearTarget(targetX, targetY, targetWidth, targetHeight, currentPhase, towerCollisionShapes) {
        const weaponCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_weapon_crate');
        if (!weaponCrateDef) {
            return;
        }

        const availableWeapons = this._getAvailableWeaponCrateTypes(currentPhase);
        if (availableWeapons.length === 0) {
            return;
        }

        const selectedWeapon = availableWeapons[this.rng.nextInt(0, availableWeapons.length)];

        const centerX = targetX + targetWidth / 2;
        const centerY = targetY + targetHeight / 2;

        let minDistance = 50;
        if (towerCollisionShapes && towerCollisionShapes.length > 0) {
            for (const shape of towerCollisionShapes) {
                const extent = this._getCollisionShapeMaxExtentFromCenter(shape, centerX, centerY);
                minDistance = Math.max(minDistance, extent + 20);
            }
        }

        // Calculate spawn position - random angle and distance around the target
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const distance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
        const crateX = centerX + Math.cos(angle) * distance;
        const crateY = centerY + Math.sin(angle) * distance;

        const playableMinX = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxX = (CONFIG.WORLD_WIDTH || 800) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMinY = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
        const playableMaxY = (CONFIG.WORLD_HEIGHT || 600) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;

        const finalCrateX = Math.max(playableMinX, Math.min(crateX, playableMaxX - 30));
        const finalCrateY = Math.max(playableMinY, Math.min(crateY, playableMaxY - 30));

        const crateShape = {
            x: finalCrateX,
            y: finalCrateY,
            width: 30,
            height: 30
        };

        if (this._isPlacementInvalid(crateShape, weaponCrateDef, this.level.obstacles, [])) {
            // Try a few more random positions around the target
            let placed = false;
            for (let attempt = 0; attempt < 8; attempt++) {
                const retryAngle = this.rng.nextFloat(0, Math.PI * 2);
                const retryDistance = this.rng.nextFloat(minDistance, Math.max(minDistance + 50, 120));
                crateShape.x = centerX + Math.cos(retryAngle) * retryDistance;
                crateShape.y = centerY + Math.sin(retryAngle) * retryDistance;
                if (!this._isPlacementInvalid(crateShape, weaponCrateDef, this.level.obstacles, [])) {
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                return;
            }
        }

        const weaponDef = CONFIG.WEAPON_DEFINITIONS[selectedWeapon];
        const spriteNormalPath = weaponDef?.crateSpriteWithWeapon || weaponCrateDef.baseCrateSprite || '';
        const spriteDestroyedPath = weaponDef?.crateSpriteWithoutWeapon || weaponCrateDef.baseCrateSprite || '';
        const crateImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteNormalPath] : null;
        const crateDestroyedImage = this.preloadedAssetImages ? this.preloadedAssetImages[spriteDestroyedPath] : null;
        const crateColor = weaponDef?.crateColor || weaponCrateDef.color || '#FFD700';

        const weaponCrate = {
            x: crateShape.x,
            y: crateShape.y,
            width: crateImage ? crateImage.naturalWidth * (weaponCrateDef.spriteScale || 1) : (weaponCrateDef.width || 30),
            height: crateImage ? crateImage.naturalHeight * (weaponCrateDef.spriteScale || 1) : (weaponCrateDef.height || 30),
            type: weaponCrateDef.type,
            name: weaponDef?.name || 'Weapon Crate',
            color: crateColor,
            destructible: weaponCrateDef.destructible,
            hp: weaponCrateDef.hp,
            maxHp: weaponCrateDef.maxHp,
            isDestroyed: false,
            blocksMovement: false,
            providesCover: false,
            pickupType: weaponCrateDef.pickupType,
            weaponName: selectedWeapon,
            isPickup: true,
            isDecoration: false,
            spriteNormalPath: spriteNormalPath,
            spriteDestroyedPath: spriteDestroyedPath,
            imageNormal: crateImage,
            imageDestroyed: crateDestroyedImage,
            spriteScale: weaponCrateDef.spriteScale || 1.0,
            collisionShape: weaponCrateDef.collisionShape
        };

        this.level.obstacles.push(weaponCrate);
        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Spawned weapon crate at (${finalCrateX.toFixed(0)}, ${finalCrateY.toFixed(0)}) with ${selectedWeapon}`);
    }

    _finalizeEnemyPositions(allEnemies) {
        if (!this.level.navGrid) {
            return;
        }

        const navGrid = this.level.navGrid;
        const reachableGrid = this.level.reachableGrid;
        const gridW = this.level.gridWidth;
        const gridH = this.level.gridHeight;
        const hasReachability = !!(reachableGrid && reachableGrid.length === gridH);

        for (let i = allEnemies.length - 1; i >= 0; i--) {
            const enemy = allEnemies[i];
            const gridPos = this.level.worldToGridCoords(enemy.x, enemy.y);

            const outOfBounds = gridPos.x < 0 || gridPos.x >= gridW || gridPos.y < 0 || gridPos.y >= gridH;
            const onBlockedCell = !outOfBounds && navGrid[gridPos.y][gridPos.x] === 1;
            const unreachable = hasReachability && !outOfBounds && navGrid[gridPos.y][gridPos.x] === 0 && reachableGrid[gridPos.y][gridPos.x] === 0;

            if (outOfBounds || onBlockedCell || unreachable) {
                let moved = false;

                if (hasReachability) {
                    for (let r = 1; r <= 30 && !moved; r++) {
                        for (let dy = -r; dy <= r && !moved; dy++) {
                            for (let dx = -r; dx <= r && !moved; dx++) {
                                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                                const newGridX = gridPos.x + dx;
                                const newGridY = gridPos.y + dy;
                                if (newGridX >= 0 && newGridX < gridW && newGridY >= 0 && newGridY < gridH
                                    && navGrid[newGridY][newGridX] === 0 && reachableGrid[newGridY][newGridX] === 1) {
                                    const newWorldPos = this.level.gridToWorldCoords(newGridX, newGridY);
                                    enemy.x = newWorldPos.x;
                                    enemy.y = newWorldPos.y;
                                    moved = true;
                                }
                            }
                        }
                    }
                }

                if (!moved) {
                    for (let r = 1; r <= 15 && !moved; r++) {
                        for (let dy = -r; dy <= r && !moved; dy++) {
                            for (let dx = -r; dx <= r && !moved; dx++) {
                                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                                const newGridX = gridPos.x + dx;
                                const newGridY = gridPos.y + dy;
                                if (newGridX >= 0 && newGridX < gridW && newGridY >= 0 && newGridY < gridH && navGrid[newGridY][newGridX] === 0) {
                                    const newWorldPos = this.level.gridToWorldCoords(newGridX, newGridY);
                                    enemy.x = newWorldPos.x;
                                    enemy.y = newWorldPos.y;
                                    moved = true;
                                }
                            }
                        }
                    }
                }

                if (!moved) {
                    this.game.enemyUnits = this.game.enemyUnits.filter(u => u.id !== enemy.id);
                    allEnemies.splice(i, 1);
                }
            }
        }
    }

    generate(worldWidth, worldHeight, missionParamsContainer = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}, missionSeed) {
        this.rng = new SeededRandom(missionSeed);
        this.preloadedAssetImages = preloadedAssetImages;
        this.level.rng = this.rng;

        // Capture current biome
        this.currentBiomeName = (missionParamsContainer.baseParams && missionParamsContainer.baseParams.biome) || 'TROPICAL';
        this.currentBiome = CONFIG.BIOMES[this.currentBiomeName] || CONFIG.BIOMES['TROPICAL'];
        this._mergedObstacleDefs = null;

        this.level.obstacles = [];
        this.level.potentialSpawnerHuts = [];
        this.level.activeSpawningHuts = [];
        this.level.initialHostageCount = 0;
        this.level.missionTargetObstacles = [];
        this.level.playerSpawnZone = null;
        this.level.effectivePlayerSpawnZone = null;
        this.level.voronoiDiagram = null;
        this.level.corridorKeepOutZones = [];
        this.level.reachableGrid = null;

        this.level.quadrantBoundaries = null;

        if (this.game) {
            this.game.enemyUnits = [];
            this.game.gameObjects = [];
            this.game.hostageUnits = [];
        }

        const allSpawnedEnemiesDuringGen = [];
        const pendingTurretObstacles = [];

        const missionObjectives = missionParamsContainer.objectives || [];
        const baseParams = missionParamsContainer.baseParams || {};

        const genConfig = CONFIG.LEVEL_GENERATION || {};
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

        let effectiveBorderCollisionHeight = genConfig.BORDER_WIDTH || 30;
        if (borderObstacleTemplate && borderObstacleTemplate.collisionShape && borderSegmentHeight > 0) {
            const cs = borderObstacleTemplate.collisionShape;
            if (cs.type === 'rectangle') {
                const offsetY = (typeof cs.offsetY === 'function' ? cs.offsetY(borderSegmentHeight, borderSegmentHeight) : (cs.offsetY || 0));
                const csHeight = (typeof cs.height === 'function' ? cs.height(borderSegmentHeight, borderSegmentHeight) : (cs.height || borderSegmentHeight));
                effectiveBorderCollisionHeight = offsetY + csHeight;
            } else if (cs.type === 'ellipse') {
                effectiveBorderCollisionHeight = (typeof cs.radiusY === 'function' ? cs.radiusY(borderSegmentHeight, borderSegmentHeight) : (cs.radiusY || borderSegmentHeight));
            } else if (cs.type === 'circle') {
                effectiveBorderCollisionHeight = (typeof cs.radius === 'function' ? cs.radius(borderSegmentHeight, borderSegmentHeight) : (cs.radius || borderSegmentHeight)) * 2;
            }
        }

        let playableMinX = effectiveBorderCollisionHeight + (genConfig.WORLD_MARGIN || 20);
        let playableMaxX = worldWidth - effectiveBorderCollisionHeight - (genConfig.WORLD_MARGIN || 20);
        let playableMinY = effectiveBorderCollisionHeight + (genConfig.WORLD_MARGIN || 20);
        let playableMaxY = worldHeight - effectiveBorderCollisionHeight - (genConfig.WORLD_MARGIN || 20);
        const playableWidth = Math.max(0, playableMaxX - playableMinX);
        const playableHeight = Math.max(0, playableMaxY - playableMinY);

        const fallbackFactor = (genConfig.OBSTACLES && genConfig.OBSTACLES.WORLD_SIZE_FALLBACK_FACTOR) || 1.0;
        if (fallbackFactor < 1.0 && fallbackFactor > 0) {
            const widthReduction = playableWidth * (1 - fallbackFactor);
            const heightReduction = playableHeight * (1 - fallbackFactor);
            playableMinX += widthReduction / 2;
            playableMaxX -= widthReduction / 2;
            playableMinY += heightReduction / 2;
            playableMaxY -= heightReduction / 2;
        }

        this.level.playableMinY = playableMinY;
        this.level.playableMaxY = playableMaxY;
        this.level.playableMinX = playableMinX;
        this.level.playableMaxX = playableMaxX;

        const extraKeepOutZones = [];
        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.min(pSpawnCfg.MAX_WIDTH || 300, Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20)));
        const playerSpawnZoneHeight = Math.min(pSpawnCfg.MAX_HEIGHT || 150, Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20)));

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

        extraKeepOutZones.push({
            x: 0,
            y: 0,
            width: worldWidth,
            height: topBottomBorderHeight
        });

        // --- FIX: Top border segmented fences with collision stretching from y=0 to fence bottom ---
        if (borderObstacleTemplate && borderSpriteImage && borderSegmentWidth > 0 && borderSegmentHeight > 0) {
            const numSegments = Math.ceil(worldWidth / borderSegmentWidth);

            // Collision shape for top border - stretches from y=0 to bottom of fence sprite
            const topBorderCollisionShape = {
                type: 'rectangle',
                offsetX: 0,
                offsetY: 0, // Start at top of screen
                width: borderSegmentWidth,
                height: topBottomBorderHeight // Covers from y=0 to fence bottom
            };

            // Top border - segmented fences with full collision coverage
            for (let i = 0; i < numSegments; i++) {
                const segmentX = i * borderSegmentWidth;
                const segmentSpritePath = (CONFIG.FENCE_BARBED_SPRITE_PATH || '') + this.rng.pickFrom(CONFIG.FENCE_BARBED_LONG_SPRITE_FILES);
                const segmentImage = preloadedAssetImages[segmentSpritePath];
                this.level.obstacles.push({
                    type: borderObstacleTemplate.type,
                    name: borderObstacleTemplate.name,
                    destructible: borderObstacleTemplate.destructible || false,
                    hp: borderObstacleTemplate.hp || Infinity,
                    maxHp: borderObstacleTemplate.maxHp || Infinity,
                    isDestroyed: false,
                    blocksMovement: true,
                    providesCover: true,
                    isDecoration: false,
                    spriteNormalPath: segmentSpritePath,
                    imageNormal: segmentImage,
                    spriteScale: borderSpriteScale,
                    collisionShape: topBorderCollisionShape,
                    x: segmentX,
                    y: 0,
                    width: borderSegmentWidth,
                    height: topBottomBorderHeight
                });
            }

            // Bottom border - segmented fence (kept as is, with original collision shape)
            const bottomBorderCollisionShape = borderObstacleTemplate.collisionShape ? {
                type: borderObstacleTemplate.collisionShape.type,
                offsetX: borderObstacleTemplate.collisionShape.offsetX,
                offsetY: borderObstacleTemplate.collisionShape.offsetY,
                width: borderObstacleTemplate.collisionShape.width,
                height: borderObstacleTemplate.collisionShape.height,
                radius: borderObstacleTemplate.collisionShape.radius,
                radiusX: borderObstacleTemplate.collisionShape.radiusX,
                radiusY: borderObstacleTemplate.collisionShape.radiusY
            } : { type: 'rectangle', offsetX: 0, offsetY: 0, width: w => w, height: h => h };
            for (let i = 0; i < numSegments; i++) {
                const segmentX = i * borderSegmentWidth;
                const segmentSpritePath = (CONFIG.FENCE_BARBED_SPRITE_PATH || '') + this.rng.pickFrom(CONFIG.FENCE_BARBED_LONG_SPRITE_FILES);
                const segmentImage = preloadedAssetImages[segmentSpritePath];
                this.level.obstacles.push({
                    type: borderObstacleTemplate.type,
                    name: borderObstacleTemplate.name,
                    destructible: borderObstacleTemplate.destructible || false,
                    hp: borderObstacleTemplate.hp || Infinity,
                    maxHp: borderObstacleTemplate.maxHp || Infinity,
                    isDestroyed: false,
                    blocksMovement: true,
                    providesCover: true,
                    isDecoration: false,
                    spriteNormalPath: segmentSpritePath,
                    imageNormal: segmentImage,
                    spriteScale: borderSpriteScale,
                    collisionShape: bottomBorderCollisionShape,
                    x: segmentX,
                    y: worldHeight - topBottomBorderHeight,
                    width: borderSegmentWidth,
                    height: topBottomBorderHeight,
                    name: `${borderObstacleTemplate.name} (Border Bottom)`
                });
            }

            // Add a single long fence at the top of the player spawn zone as a barrier
            if (borderObstacleTemplate.collisionShape) {
                this.level.obstacles.push({
                    type: borderObstacleTemplate.type,
                    name: borderObstacleTemplate.name,
                    destructible: borderObstacleTemplate.destructible || false,
                    hp: borderObstacleTemplate.hp || Infinity,
                    maxHp: borderObstacleTemplate.maxHp || Infinity,
                    isDestroyed: false,
                    blocksMovement: true,
                    providesCover: true,
                    isDecoration: false,
                    spriteNormalPath: borderSpritePath,
                    imageNormal: borderSpriteImage,
                    spriteScale: borderSpriteScale * 0.5,
                    collisionShape: borderObstacleTemplate.collisionShape,
                    x: playerSpawnZone.x,
                    y: playerSpawnZone.y,
                    width: borderSegmentWidth,
                    height: borderSegmentHeight,
                    name: `${borderObstacleTemplate.name} (Spawn Zone Barrier)`
                });
            }
        } else {
            this.level.obstacles.push({ x: 0, y: 0, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Top', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
            this.level.obstacles.push({ x: 0, y: worldHeight - topBottomBorderHeight, width: worldWidth, height: topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Bottom', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        }
        this.level.obstacles.push({ x: 0, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Left', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });
        this.level.obstacles.push({ x: worldWidth - sideBorderWidth, y: topBottomBorderHeight, width: sideBorderWidth, height: worldHeight - 2 * topBottomBorderHeight, type: 'border_wall', name: 'Border Wall Right', color: sideBorderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false });

        const assassinationObjectiveInstance = missionObjectives.find(obj => obj.type === "ASSASSINATION");
        if (assassinationObjectiveInstance && assassinationObjectiveInstance.targetDetails) {
            const targetInfo = assassinationObjectiveInstance.targetDetails;

            if (targetInfo.assassinationTypeKey === 'possum_boss_1') {
                let bossX, bossY, bossSpawned = false;
                const bossMaxAttempts = 50;
                const bossArenaRadius = CONFIG.AI.POSSUM_BOSS_1.ARENA_RADIUS || 200;
                const bossMinDistFromPlayer = CONFIG.AI.POSSUM_BOSS_1.BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER || 600;
                const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
                const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

                    const distToPlayer = distance(bossX, bossY, playerSpawnCenterX, playerSpawnCenterY);
                    if (distToPlayer < bossMinDistFromPlayer) continue;

                    const arenaZoneShape = { type: 'circle', x: bossX, y: bossY, radius: bossArenaRadius };
                    if (!this._isPlacementInvalid(arenaZoneShape, { isDecoration: false }, this.level.obstacles, extraKeepOutZones)) {
                        const boss = new PossumBoss1(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        allSpawnedEnemiesDuringGen.push(boss);
                        if (this.game.spatialGrid) {
                            this.game.spatialGrid.addObject(boss);
                        }
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_BOSS_1 && CONFIG.AI.POSSUM_BOSS_1.initialGuardPack) ? CONFIG.AI.POSSUM_BOSS_1.initialGuardPack : { enabled: false } };
                        this._spawnInitialGuardsForObject(boss, bossDefinition, allSpawnedEnemiesDuringGen);

                        const arenaKeepOutRect = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaKeepOutRect);
                        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Boss arena reserved at (${arenaKeepOutRect.x.toFixed(0)}, ${arenaKeepOutRect.y.toFixed(0)})`);
                        break;
                    }
                }
                if (!bossSpawned) {
//                    console.warn(`[Level Gen] Could not find suitable spawn for Boss Target: ${targetInfo.name}.`);
                }
            } else if (targetInfo.assassinationTypeKey === 'possum_revolver_boss') {
                let bossX, bossY, bossSpawned = false;
                const bossMaxAttempts = 50;
                const bossArenaRadius = 150;
                const bossMinDistFromPlayer = CONFIG.AI.POSSUM_REVOLVER.BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER || 600;
                const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
                const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

                    const distToPlayer = distance(bossX, bossY, playerSpawnCenterX, playerSpawnCenterY);
                    if (distToPlayer < bossMinDistFromPlayer) continue;

                    const arenaZoneShape = { type: 'circle', x: bossX, y: bossY, radius: bossArenaRadius };
                    if (!this._isPlacementInvalid(arenaZoneShape, { isDecoration: false }, this.level.obstacles, extraKeepOutZones)) {
                        const boss = new PossumRevolver(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        allSpawnedEnemiesDuringGen.push(boss);
                        if (this.game.spatialGrid) {
                            this.game.spatialGrid.addObject(boss);
                        }
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_REVOLVER && CONFIG.AI.POSSUM_REVOLVER.initialGuardPack) ? CONFIG.AI.POSSUM_REVOLVER.initialGuardPack : { enabled: false } };
                        this._spawnInitialGuardsForObject(boss, bossDefinition, allSpawnedEnemiesDuringGen);

                        const arenaKeepOutRect = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaKeepOutRect);
                        break;
                    }
                }
                if (!bossSpawned) {
//                    console.warn(`[Level Gen] Could not find suitable spawn for Revolver Boss Target: ${targetInfo.name}.`);
                }
            } else if (targetInfo.assassinationTypeKey === 'possum_boss_3') {
                let bossX, bossY, bossSpawned = false;
                const bossMaxAttempts = 50;
                const bossArenaRadius = CONFIG.AI.POSSUM_BOSS_3.ARENA_RADIUS || 200;
                const bossMinDistFromPlayer = CONFIG.AI.POSSUM_BOSS_3.BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER || 600;
                const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
                const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

                    const distToPlayer = distance(bossX, bossY, playerSpawnCenterX, playerSpawnCenterY);
                    if (distToPlayer < bossMinDistFromPlayer) continue;

                    const arenaZoneShape = { type: 'circle', x: bossX, y: bossY, radius: bossArenaRadius };
                    if (!this._isPlacementInvalid(arenaZoneShape, { isDecoration: false }, this.level.obstacles, extraKeepOutZones)) {
                        const boss = new PossumBoss3(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        allSpawnedEnemiesDuringGen.push(boss);
                        if (this.game.spatialGrid) {
                            this.game.spatialGrid.addObject(boss);
                        }
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_BOSS_3 && CONFIG.AI.POSSUM_BOSS_3.initialGuardPack) ? CONFIG.AI.POSSUM_BOSS_3.initialGuardPack : { enabled: false } };
                        this._spawnInitialGuardsForObject(boss, bossDefinition, allSpawnedEnemiesDuringGen);

                        const arenaKeepOutRect = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaKeepOutRect);
                        break;
                    }
                }
                if (!bossSpawned) {
//                    console.warn(`[Level Gen] Could not find suitable spawn for Boss 3 Target: ${targetInfo.name}.`);
                }
            } else if (targetInfo.assassinationTypeKey === 'possum_elite_guard') {
                let bossX, bossY, bossSpawned = false;
                const bossMaxAttempts = 50;
                const bossArenaRadius = CONFIG.AI.POSSUM_ELITE_GUARD.ARENA_RADIUS || 200;
                const bossMinDistFromPlayer = CONFIG.AI.POSSUM_ELITE_GUARD.BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER || 600;
                const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
                const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

                    const distToPlayer = distance(bossX, bossY, playerSpawnCenterX, playerSpawnCenterY);
                    if (distToPlayer < bossMinDistFromPlayer) continue;

                    const arenaZoneShape = { type: 'circle', x: bossX, y: bossY, radius: bossArenaRadius };
                    if (!this._isPlacementInvalid(arenaZoneShape, { isDecoration: false }, this.level.obstacles, extraKeepOutZones)) {
                        const boss = new PossumEliteGuard(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        allSpawnedEnemiesDuringGen.push(boss);
                        if (this.game.spatialGrid) {
                            this.game.spatialGrid.addObject(boss);
                        }
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_ELITE_GUARD && CONFIG.AI.POSSUM_ELITE_GUARD.initialGuardPack) ? CONFIG.AI.POSSUM_ELITE_GUARD.initialGuardPack : { enabled: false } };
                        this._spawnInitialGuardsForObject(boss, bossDefinition, allSpawnedEnemiesDuringGen);

                        const arenaKeepOutRect = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaKeepOutRect);
                        break;
                    }
                }
                if (!bossSpawned) {
//                    console.warn(`[Level Gen] Could not find suitable spawn for Elite Guard Target: ${targetInfo.name}.`);
                }
            }
        }

        const rescueObjectiveInstance = missionObjectives.find(obj => obj.type === 'RESCUE_HOSTAGES');
        const rescueTakenObjectiveInstance = missionObjectives.find(obj => obj.type === 'RESCUE_TAKEN_HOSTAGE');
        const extractionObjectiveInstance = missionObjectives.find(obj => obj.type === 'EXTRACTION');
        const needsExtractionZone = rescueObjectiveInstance || rescueTakenObjectiveInstance || extractionObjectiveInstance;
        
        if (needsExtractionZone) {
            const ezConfig = genConfig.EXTRACTION_ZONE_SETTINGS || {};
            const ezObstacle = {
                type: 'extraction_zone',
                name: ezConfig.NAME || "Extraction Zone",
                color: ezConfig.FALLBACK_COLOR || 'rgba(0,0,255,0.3)',
                imageNormal: preloadedAssetImages[ezConfig.SPRITE_PATH] || null,
                spriteNormalPath: ezConfig.SPRITE_PATH,
                spriteScale: ezConfig.SPRITE_SCALE || 1.0,
                blocksMovement: false, providesCover: false, destructible: false,
                isDestroyed: false, isPickup: false, isDecoration: false,
                hp: Infinity, maxHp: Infinity,
                isHidden: true // Start hidden until all hostages are freed
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
                    // NOTE: Visual effect is NOT created here. It will be created when the zone is revealed.
                    placedEZ = true;
                }
            }
            if (!placedEZ) {
                ezObstacle.x = playableMinX; ezObstacle.y = playableMinY;
                this.level.obstacles.push(ezObstacle);
                // NOTE: Visual effect is NOT created here.
            }
        }

        const objectivePlacementMaxY = playerSpawnZone.y - 280; // 280px buffer

        missionObjectives.forEach(objective => {
            if (objective.type === 'DESTROY_TARGET' && objective.targetTypeKeyPrefix && objective.totalToAchieve > 0) {
                const matchingTemplates = (CONFIG.OBSTACLE_DEFINITIONS || []).filter(def => def.type.startsWith(objective.targetTypeKeyPrefix));

                if (matchingTemplates.length === 0) {
                    console.error(`[Level Gen] CRITICAL: No templates found for destroyTargetTypeKeyPrefix: ${objective.targetTypeKeyPrefix}!`);
                    return;
                }

                let successfulPlacements = 0;
                let placementMinY = playableMinY;
                let placementMaxY = objectivePlacementMaxY;
                
                if (placementMaxY <= placementMinY) {
                    placementMinY = playableMinY;
                    placementMaxY = playableMinY + (playableMaxY - playableMinY) * 0.6;
                }
                
                for (let i = 0; i < objective.totalToAchieve; i++) {
                    const targetTemplateOriginal = this.rng.pickFrom(matchingTemplates);
                    let targetX, targetY, placedTarget = false;

                    let actualSpritePath = null;
                    let actualDestroyedSpritePath = null;
                    if (targetTemplateOriginal.type === 'possum_hut') {
                        const hutSpritePairs = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                        const pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                        if (hutSpritePairs.length > 0) {
                            const selectedPair = this.rng.pickFrom(hutSpritePairs);
                            actualSpritePath = pathBase + selectedPair.normal;
                            actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                        }
                    } else if (targetTemplateOriginal.type === 'possum_hut_round') {
                        const hutSpritePairs = CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES || [];
                        const pathBase = CONFIG.POSSUM_HUT_ROUND_SPRITE_PATH || '';
                        if (hutSpritePairs.length > 0) {
                            const selectedPair = this.rng.pickFrom(hutSpritePairs);
                            actualSpritePath = pathBase + selectedPair.normal;
                            actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                        }
                    } else if (targetTemplateOriginal.type === 'possum_barracks_1') {
                        const barracksSpritePairs = CONFIG.POSSUM_BARRACKS_1_SPRITE_FILES || [];
                        const pathBase = CONFIG.POSSUM_BARRACKS_1_SPRITE_PATH || '';
                        if (barracksSpritePairs.length > 0) {
                            const selectedPair = this.rng.pickFrom(barracksSpritePairs);
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

                    for (let attempt = 0; attempt < 100; attempt++) {
                        targetX = this.rng.nextFloat(playableMinX, playableMaxX - targetWidth);
                        targetY = this.rng.nextFloat(placementMinY, placementMaxY - targetHeight);

                        const tempTargetForShapeCheck = {
                            x: targetX, y: targetY,
                            width: targetWidth, height: targetHeight,
                            collisionShape: targetTemplateOriginal.collisionShape,
                            collisionShapes: targetTemplateOriginal.collisionShapes
                        };
                        const collisionShapeForPlacementCheck = this.level._getObstacleCollisionShape(tempTargetForShapeCheck);

                        if (!this._isPlacementInvalid(collisionShapeForPlacementCheck, targetTemplateOriginal, this.level.obstacles, extraKeepOutZones)) {
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
                                isSpawner: (targetTemplateOriginal.type === 'possum_hut' || targetTemplateOriginal.type === 'possum_hut_round' || targetTemplateOriginal.type === 'possum_barracks_1') && !targetTemplateOriginal.isDecoration,
                                spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                                delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0, unitsSpawnedFromHut: 0
                            };
                            this.level.obstacles.push(missionTargetObs);
                            this.level.missionTargetObstacles.push(missionTargetObs);
                            if (missionTargetObs.isSpawner) this.level.potentialSpawnerHuts.push(missionTargetObs);
                            this._spawnInitialGuardsForObject(missionTargetObs, targetTemplateOriginal, allSpawnedEnemiesDuringGen);
                            
                            if (targetTemplateOriginal.type === 'possum_relay_tower') {
                                const towerCollisionShapes = this.level._getObstacleCollisionShape(missionTargetObs);
                                this._spawnGrenadeCrateNearTarget(targetX, targetY, targetWidth, targetHeight, towerCollisionShapes);
                                this._spawnAmmoCrateNearTarget(targetX, targetY, targetWidth, targetHeight, towerCollisionShapes);
                                this._spawnWeaponCrateNearTarget(targetX, targetY, targetWidth, targetHeight, (this.game.currentPhaseIndex || 0) + 1, towerCollisionShapes);
                            }
                            
                            placedTarget = true;
                            successfulPlacements++;
                            break;
                        }
                    }
                    if (!placedTarget) console.warn(`[Level Gen] Could not place mission target type ${objective.targetTypeKeyPrefix}`);
                }
                if (successfulPlacements < objective.totalToAchieve) {
                    objective.totalToAchieve = successfulPlacements;
                }
            } else if (objective.type === 'INTERACT_INTEL' && objective.totalToAchieve > 0) {
                const consoleTemplate = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === 'intel_console');
                if (!consoleTemplate) {
                    console.error('[Level Gen] CRITICAL: Intel console template not found in OBSTACLE_DEFINITIONS!');
                    return;
                }

                const spriteVariants = CONFIG.INTEL.SPRITE_FILES;
                const phase = this.game.currentPhaseIndex || 0;
                const params = CAMPAIGN_RULES.BASE_PARAMETERS;
                const numBase = params.numIntelConsoles?.initial || 1;
                const numInc = params.numIntelConsoles?.perPhaseIncrement || 0.3;
                const numMax = params.numIntelConsoles?.max || 3;
                const numToPlace = Math.min(Math.floor(numBase + phase * numInc), numMax);

                objective.totalToAchieve = Math.min(numToPlace, objective.totalToAchieve);

                let successfulPlacements = 0;
                const placementMinY = playableMinY;
                const placementMaxY = objectivePlacementMaxY > placementMinY ? objectivePlacementMaxY : playableMinY + (playableMaxY - playableMinY) * 0.6;

                for (let i = 0; i < numToPlace; i++) {
                    let placedConsole = false;

                    // Randomly select a sprite variant for this console
                    const selectedVariant = spriteVariants[Math.floor(this.rng.nextFloat(0, spriteVariants.length))];
                    const consoleSpritePath = CONFIG.INTEL.SPRITE_PATH + selectedVariant.on;
                    const consoleSpriteDestroyedPath = CONFIG.INTEL.SPRITE_PATH + selectedVariant.off;
                    const consoleImage = preloadedAssetImages[consoleSpritePath];
                    const consoleImageDestroyed = preloadedAssetImages[consoleSpriteDestroyedPath];

                    const consoleWidth = consoleImage ? consoleImage.naturalWidth * CONFIG.INTEL.SPRITE_SCALE : 64;
                    const consoleHeight = consoleImage ? consoleImage.naturalHeight * CONFIG.INTEL.SPRITE_SCALE : 64;

                    for (let attempt = 0; attempt < 100; attempt++) {
                        const consoleX = this.rng.nextFloat(playableMinX, playableMaxX - consoleWidth);
                        const consoleY = this.rng.nextFloat(placementMinY, placementMaxY - consoleHeight);

                        const tempShape = {
                            x: consoleX, y: consoleY,
                            width: consoleWidth, height: consoleHeight,
                            collisionShape: consoleTemplate.collisionShape,
                            collisionShapes: consoleTemplate.collisionShapes
                        };
                        const collisionShapeForCheck = this.level._getObstacleCollisionShape(tempShape);

                        if (!this._isPlacementInvalid(collisionShapeForCheck, consoleTemplate, this.level.obstacles, extraKeepOutZones)) {
                            const consoleObs = {
                                x: consoleX, y: consoleY,
                                width: consoleWidth, height: consoleHeight,
                                type: 'intel_console',
                                name: 'Intel Console',
                                color: consoleTemplate.color,
                                destructible: consoleTemplate.destructible,
                                hp: consoleTemplate.hp,
                                maxHp: consoleTemplate.maxHp,
                                isDestroyed: false,
                                blocksMovement: consoleTemplate.blocksMovement,
                                providesCover: consoleTemplate.providesCover,
                                isDecoration: consoleTemplate.isDecoration,
                                spriteNormalPath: consoleSpritePath,
                                imageNormal: consoleImage,
                                spriteDestroyedPath: consoleSpriteDestroyedPath,
                                imageDestroyed: consoleImageDestroyed,
                                spriteScale: CONFIG.INTEL.SPRITE_SCALE,
                                collisionShape: consoleTemplate.collisionShape,
                                interactionRadius: CONFIG.INTEL.INTERACTION_RADIUS,
                                isMissionTarget: true,
                                objectiveId: objective.id,
                                isIntelConsole: true,
                                spriteVariant: selectedVariant
                            };

                            this.level.obstacles.push(consoleObs);

                            const intelConsoleInstance = new IntelConsole(consoleX, consoleY, this.game, `intel_${this.game.intelConsoles.length}`, selectedVariant);
                            intelConsoleInstance.width = consoleWidth;
                            intelConsoleInstance.height = consoleHeight;
                            intelConsoleInstance.collisionShape = consoleTemplate.collisionShape;
                            intelConsoleInstance.isHacked = false;
                            intelConsoleInstance.isBeingHacked = false;
                            intelConsoleInstance.objectiveId = objective.id;
                            this.game.intelConsoles.push(intelConsoleInstance);

                            placedConsole = true;
                            successfulPlacements++;
                            break;
                        }
                    }
                    if (!placedConsole) {
                        console.warn(`[Level Gen] Could not place intel console ${i + 1}`);
                    }
                }

                if (successfulPlacements < objective.totalToAchieve) {
                    objective.totalToAchieve = successfulPlacements;
                }
            }
        });

        const spawnedMissionTargets = this.level.missionTargetObstacles || [];
        const hutsSpawned = spawnedMissionTargets.filter(o => o.type.startsWith('possum_hut')).length;
        const barracksSpawned = spawnedMissionTargets.filter(o => o.type.startsWith('possum_barracks')).length;
        const towersSpawned = spawnedMissionTargets.filter(o => o.type.startsWith('possum_relay_tower')).length;
        if (hutsSpawned === 0 && barracksSpawned === 0 && towersSpawned === 0) {
//            console.error(`[Level Gen] CRITICAL: No mission targets (huts/towers) were spawned! This will lock the mission!`);
        }

        const obsGenCfg = genConfig.OBSTACLES || {};
        const baseNumObstacles = obsGenCfg.BASE_COUNT || 20;
        const phaseObstacleIncrement = baseParams.obstacleCountPhaseIncrement || 0;
        const numInternalObstacles = Math.floor(baseNumObstacles * (baseParams.worldSizeFactor || 1.0) * (1 + phaseObstacleIncrement)) + this.rng.nextInt(0, obsGenCfg.RANDOM_ADDITION_MAX || 8);
        const placementMaxAttempts = obsGenCfg.PLACEMENT_MAX_ATTEMPTS || 5;
        const turretPlacementMaxAttempts = 10;

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = this._getRandomObstacleTemplate();
            if (!template) { continue; }
            let obsRenderWidth, obsRenderHeight;
            let actualSpritePath = null, actualImageObject = null;
            let actualDestroyedSpritePath = template.spriteDestroyed || null, actualDestroyedImageObject = null;
            let normalSpriteScale = template.spriteScale || 1.0, destroyedSpriteScale = template.spriteDestroyedScale;
            let filesArray = [], pathBase = '', useRandomSpriteFromList = false, useSpritePair = false;
            let useTilesheet = false, tilesheetFrameWidth = 400, tilesheetFrameHeight = 400, tilesheetNumFrames = 6, tilesheetFramesPerRow = 2;

            if (template.type === 'possum_hut') {
                const hutSpritePairs = CONFIG.POSSUM_HUT_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.POSSUM_HUT_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'possum_hut_round') {
                const hutSpritePairs = CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.POSSUM_HUT_ROUND_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'empty_possum_hut_round') {
                const hutSpritePairs = CONFIG.EMPTY_POSSUM_HUT_ROUND_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.EMPTY_POSSUM_HUT_ROUND_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'empty_possum_hut_2') {
                const hutSpritePairs = CONFIG.EMPTY_POSSUM_HUT_2_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.EMPTY_POSSUM_HUT_2_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            
            else if (template.type === 'general_possum_building_large') {
                const hutSpritePairs = CONFIG.POSSUM_BUILDING_LARGE_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.POSSUM_BUILDING_LARGE_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            
            else if (template.type === 'possum_barracks_1') {
                const hutSpritePairs = CONFIG.POSSUM_BARRACKS_1_SPRITE_FILES || [];
                if (hutSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(hutSpritePairs);
                    pathBase = CONFIG.POSSUM_BARRACKS_1_SPRITE_PATH || '';
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
            else if (template.type === 'explosive_barrel') {
                const barrelSpritePairs = CONFIG.SINGLE_EXPLOSIVE_BARREL_SPRITE_FILES || [];
                if (barrelSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(barrelSpritePairs);
                    pathBase = CONFIG.SINGLE_EXPLOSIVE_BARREL_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'explosive_barrel_double') {
                const barrelSpritePairs = CONFIG.DOUBLE_EXPLOSIVE_BARREL_SPRITE_FILES || [];
                if (barrelSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(barrelSpritePairs);
                    pathBase = CONFIG.DOUBLE_EXPLOSIVE_BARREL_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'explosive_barrel_cluster') {
                const barrelSpritePairs = CONFIG.TRIPLE_EXPLOSIVE_BARREL_SPRITE_FILES || [];
                if (barrelSpritePairs.length > 0) {
                    const selectedPair = this.rng.pickFrom(barrelSpritePairs);
                    pathBase = CONFIG.TRIPLE_EXPLOSIVE_BARREL_SPRITE_PATH || '';
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                }
            }
            else if (template.type === 'possum_turret') {
                actualSpritePath = 'assets/images/objects/possums/turrets/possum_turret_1_s.png';
            }
            
            // Try biome sprite lookup first (handles all tropical/biome-specific obstacles)
            else {
                const biomeSpriteInfo = this.currentBiome.spritePaths[template.type];
                if (biomeSpriteInfo) {
                    filesArray = biomeSpriteInfo.files || [];
                    pathBase = biomeSpriteInfo.path || '';
                    if (biomeSpriteInfo.isTilesheet) {
                        useTilesheet = true;
                        tilesheetFrameWidth = biomeSpriteInfo.frameWidth || 400;
                        tilesheetFrameHeight = biomeSpriteInfo.frameHeight || 400;
                        tilesheetNumFrames = biomeSpriteInfo.numFrames || 6;
                        tilesheetFramesPerRow = biomeSpriteInfo.framesPerRow || 2;
                        actualSpritePath = pathBase + filesArray[0];
                    } else {
                        useRandomSpriteFromList = true;
                    }
                } else {
                    // Generic obstacles with CONFIG-based sprite paths
                    if (template.type === 'fence_barbed_straight_short') { filesArray = CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
                    else if (template.type === 'fence_barbed_straight_long') { filesArray = CONFIG.FENCE_BARBED_LONG_SPRITE_FILES || []; pathBase = CONFIG.FENCE_BARBED_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
                    else if (template.type === 'pickup_health') {
                        filesArray = CONFIG.HEALTH_PICKUP_SPRITE_FILES || [];
                        pathBase = CONFIG.HEALTH_PICKUP_SPRITE_PATH || '';
                        useRandomSpriteFromList = true;
                        useSpritePair = true;
                    }
                    else if (template.type === 'pickup_ammo_crate') {
                        filesArray = CONFIG.AMMO_PICKUP_SPRITE_FILES || [];
                        pathBase = CONFIG.AMMO_PICKUP_SPRITE_PATH || '';
                        useRandomSpriteFromList = true;
                        useSpritePair = true;
                    }
                    else if (template.type === 'pickup_grenade_crate') {
                        filesArray = CONFIG.GRENADE_PICKUP_SPRITE_FILES || [];
                        pathBase = CONFIG.GRENADE_PICKUP_SPRITE_PATH || '';
                        useRandomSpriteFromList = true;
                        useSpritePair = true;
                    }
                    else if (template.type === 'helipad_concrete_square_1') { filesArray = CONFIG.HELIPAD_SQUARE_SPRITE_FILES || []; pathBase = CONFIG.HELIPAD_SQUARE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
                    else { actualSpritePath = template.spriteNormal || null; }
                }
            }

            if (useRandomSpriteFromList) {
                if (filesArray.length > 0 && pathBase) {
                    if (useSpritePair) {
                        const selectedPair = this.rng.pickFrom(filesArray);
                        actualSpritePath = pathBase + selectedPair.normal;
                        actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                    } else {
                        actualSpritePath = pathBase + this.rng.pickFrom(filesArray);
                    }
                } else {
                    if (CONFIG.DEBUG_LOGGING) console.warn(`[Level Gen] Obstacle type ${template.type} configured for list-based sprite but filesArray or pathBase is missing/empty.`);
                }
            }
            actualImageObject = actualSpritePath ? (preloadedAssetImages[actualSpritePath] || null) : null;
            if (actualDestroyedSpritePath) actualDestroyedImageObject = preloadedAssetImages[actualDestroyedSpritePath] || null;

            if (template.type.startsWith('tree_')) {
                const treeConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.TREES) || {};
                const baseScale = template.spriteScale || 1.0;
                const variation = this.rng.nextFloat(treeConfig.MIN_SCALE || 0.8, treeConfig.MAX_SCALE || 1.2);
                normalSpriteScale = baseScale * variation;
                obsRenderWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 32) * normalSpriteScale;
                obsRenderHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 32) * normalSpriteScale;
            } else if (template.type === 'bush_medium' || template.type === 'bush_large') {
                const bushConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.BUSHES) || {};
                const baseScale = template.spriteScale || 1.0;
                const variation = this.rng.nextFloat(bushConfig.MIN_SCALE || 0.9, bushConfig.MAX_SCALE || 1.1);
                normalSpriteScale = baseScale * variation;
                obsRenderWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 32) * normalSpriteScale;
                obsRenderHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 32) * normalSpriteScale;
            } else if (template.type === 'rock_medium' || template.type === 'rock_large') {
                const rockConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.ROCKS) || {};
                const baseScale = template.spriteScale || 1.0;
                const variation = this.rng.nextFloat(rockConfig.MIN_SCALE || 0.85, rockConfig.MAX_SCALE || 1.15);
                normalSpriteScale = baseScale * variation;
                obsRenderWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 32) * normalSpriteScale;
                obsRenderHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 32) * normalSpriteScale;
            } else if (useTilesheet) {
                const baseScale = template.spriteScale || 1.0;
                normalSpriteScale = baseScale;
                obsRenderWidth = tilesheetFrameWidth * normalSpriteScale;
                obsRenderHeight = tilesheetFrameHeight * normalSpriteScale;
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

                const restrictedTypes = getAllRestrictedObstacleTypes(this.currentBiomeName);
                const isRestrictedType = restrictedTypes.includes(template.type);

                let overlapsOuterSpawnZone = false;
                if (isRestrictedType) {
                    const shapesArray = Array.isArray(collisionCheckShape) ? collisionCheckShape : [collisionCheckShape];
                    for (const checkShape of shapesArray) {
                        const shapeHasRotation = checkShape.type === 'rectangle' && checkShape.rotation !== undefined && checkShape.rotation !== 0;
                        if (checkShape.type === 'rectangle') {
                            if (shapeHasRotation) {
                                overlapsOuterSpawnZone = obbOverlap(checkShape, this.level.playerSpawnZone);
                            } else {
                                overlapsOuterSpawnZone = this.level._rectOverlap(checkShape, this.level.playerSpawnZone);
                            }
                        } else if (checkShape.type === 'circle') {
                            overlapsOuterSpawnZone = rectCircleOverlap(this.level.playerSpawnZone, checkShape);
                        } else if (checkShape.type === 'ellipse') {
                            overlapsOuterSpawnZone = rectEllipseOverlap(this.level.playerSpawnZone, checkShape);
                        }
                        if (overlapsOuterSpawnZone) break;
                    }
                }

                let placementValid = !this._isPlacementInvalid(collisionCheckShape, template, this.level.obstacles, extraKeepOutZones) && !(isRestrictedType && overlapsOuterSpawnZone);
                if (placementValid && template.type === 'possum_turret') {
                    const turretVisualRadius = Math.max(obsRenderWidth, obsRenderHeight) * 0.5;
                    const turretCenterX = obsX + obsRenderWidth / 2;
                    const turretCenterY = obsY + obsRenderHeight / 2;
                    const turretClearanceShape = { type: 'circle', x: turretCenterX, y: turretCenterY, radius: turretVisualRadius };
                    const turretPlacementTemplate = { ...template, placementBuffer: Math.max(template.placementBuffer || 0, 100) };
                    if (this._isPlacementInvalid(turretClearanceShape, turretPlacementTemplate, this.level.obstacles, extraKeepOutZones)) {
                        placementValid = false;
                    }
                }
                if (placementValid) {
                    const isTreeType = template.type.startsWith('tree_palm') || template.type.startsWith('tree_deciduous');
                    const treeFallChance = isTreeType ? (CONFIG.LEVEL_GENERATION?.TREE_FALL_SETTINGS?.FALL_CHANCE ?? 0.45) : 0;
                    const willSpawnLog = isTreeType ? this.rng.chance(treeFallChance) : false;
                    let precomputedLogSpawnData = null;
                    if (willSpawnLog) {
                        const stumpBottomCenterX = obsX + obsRenderWidth / 2;
                        const stumpBottomCenterY = obsY + obsRenderHeight;
                        const fallAngle = this.rng.nextFloat(0, Math.PI * 2);
                        const fallDistance = this.rng.nextFloat(
                            CONFIG.LEVEL_GENERATION.TREE_FALL_SETTINGS.PLACEMENT_DISTANCE_MIN,
                            CONFIG.LEVEL_GENERATION.TREE_FALL_SETTINGS.PLACEMENT_DISTANCE_MAX
                        );
                        let fallenLogType = 'tree_palm_fallen';
                        if (template.type.startsWith('tree_palm2_')) fallenLogType = 'tree_palm2_fallen';
                        else if (template.type.startsWith('tree_deciduous')) fallenLogType = 'tree_deciduous_fallen';
                        precomputedLogSpawnData = {
                            type: fallenLogType,
                            angle: fallAngle,
                            distance: fallDistance,
                            stumpBottomCenterX: stumpBottomCenterX,
                            stumpBottomCenterY: stumpBottomCenterY
                        };
                    }
                    const newObstacle = {
                        x: obsX, y: obsY, width: obsRenderWidth, height: obsRenderHeight, type: template.type, name: template.name || template.type, color: template.color,
                        destructible: template.destructible, hp: template.destructible ? template.hp : Infinity, maxHp: template.destructible ? template.maxHp : Infinity, isDestroyed: false,
                        blocksMovement: template.blocksMovement, providesCover: template.providesCover, pickupType: template.pickupType || null, pickupQuantity: template.pickupQuantity || 0,
                        isPickup: !!template.pickupType, isDecoration: !!template.isDecoration || template.type === 'possum_turret',
                        spriteNormalPath: actualSpritePath,
                        spriteDestroyedPath: actualDestroyedSpritePath,
                        imageNormal: actualImageObject,
                        imageDestroyed: actualDestroyedImageObject,
                        spriteScale: normalSpriteScale, spriteDestroyedScale: destroyedSpriteScale,
                        isFlippedHorizontally: template.canBeFlipped ? this.rng.chance(0.5) : false,
                        collisionShape: template.collisionShape || null, spawnArea: template.spawnArea || null, isSpawner: (template.type === 'possum_hut' || template.type === 'possum_hut_round' || template.type === 'possum_barracks_1') && !template.isDecoration,
                        spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                        delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0, unitsSpawnedFromHut: 0,
                        willSpawnLog: willSpawnLog,
                        precomputedLogSpawnData: precomputedLogSpawnData,
                        isAnimated: template.isAnimated || false,
                        tilesheetPath: useTilesheet ? actualSpritePath : null,
                        frameWidth: useTilesheet ? tilesheetFrameWidth : null,
                        frameHeight: useTilesheet ? tilesheetFrameHeight : null,
                        numFrames: useTilesheet ? tilesheetNumFrames : null,
                        framesPerRow: useTilesheet ? tilesheetFramesPerRow : null,
                        currentFrame: 0,
                        animationTimer: 0,
                        animationSpeed: template.animationSpeed || 0.25,
                    };
                    if (template.type === 'possum_turret') {
                        const turretArc = (obsY < (this.level.playableMinY + this.level.playableMaxY) / 2)
                            ? ['w', 'sw', 's', 'se', 'e']
                            : ['n', 'nw', 'w', 'sw', 's'];
                        pendingTurretObstacles.push({
                            obstacle: newObstacle,
                            arc: turretArc,
                            obsX: obsX,
                            obsY: obsY,
                            logMsg: `[LevelGen] Created possum_turret obstacle at (${obsX}, ${obsY}) with dimensions ${obsRenderWidth}x${obsRenderHeight}, spriteScale=${normalSpriteScale}, actualImageObject=${!!actualImageObject}`
                        });
                    } else {
                        this.level.obstacles.push(newObstacle);
                        if (newObstacle.isSpawner && !newObstacle.isMissionTarget) this.level.potentialSpawnerHuts.push(newObstacle);
                        this._spawnInitialGuardsForObject(newObstacle, template, allSpawnedEnemiesDuringGen);
                    }

                    this._spawnCounts[template.type] = (this._spawnCounts[template.type] || 0) + 1;

                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < (template.type === 'possum_turret' ? turretPlacementMaxAttempts : placementMaxAttempts));
        }

        for (const pendingTurret of pendingTurretObstacles) {
            this.level.obstacles.push(pendingTurret.obstacle);
            const turret = new PossumTurret(pendingTurret.obsX, pendingTurret.obsY, this.game, pendingTurret.arc, pendingTurret.obstacle);
            turret.collisionShape = pendingTurret.obstacle.collisionShape;
            this.game.possumTurrets.push(turret);
            pendingTurret.obstacle.render = function() {};
            //console.log(pendingTurret.logMsg);
        }

        if (needsExtractionZone) {
            const helipadObstacles = this.level.obstacles.filter(o => o.type === 'helipad_concrete_square_1');
            if (helipadObstacles.length > 0) {
                const helipad = helipadObstacles[0];
                const extractionZoneObs = this.level.obstacles.filter(o => o.type === 'extraction_zone');
                if (extractionZoneObs.length > 0) {
                    extractionZoneObs.forEach(ez => {
                        ez.x = helipad.x;
                        ez.y = helipad.y;
                        ez.width = helipad.width;
                        ez.height = helipad.height;
                    });
                    if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Extraction zone placed on helipad at (${helipad.x.toFixed(0)}, ${helipad.y.toFixed(0)})`);
                }
            } else {
                const extractionZoneObs = this.level.obstacles.filter(o => o.type === 'extraction_zone');
                if (extractionZoneObs.length > 0) {
                    const helipadFiles = CONFIG.HELIPAD_SQUARE_SPRITE_FILES || [];
                    const helipadPath = CONFIG.HELIPAD_SQUARE_SPRITE_PATH || '';
                    const helipadSpriteFile = helipadFiles.length > 0 ? this.rng.pickFrom(helipadFiles) : '';
                    const helipadSpriteFullPath = helipadPath + helipadSpriteFile;
                    const helipadImage = this.preloadedAssetImages[helipadSpriteFullPath] || null;
                    const helipadSpriteScale = 0.4;

                    extractionZoneObs.forEach(ez => {
                        const helipadWidth = helipadImage ? helipadImage.naturalWidth * helipadSpriteScale : ez.width;
                        const helipadHeight = helipadImage ? helipadImage.naturalHeight * helipadSpriteScale : ez.height;
                        const newObstacle = {
                            x: ez.x, y: ez.y, width: helipadWidth, height: helipadHeight,
                            type: 'helipad_concrete_square_1',
                            name: 'Square Concrete Helipad',
                            color: '#afafaf',
                            destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false,
                            blocksMovement: false, providesCover: false,
                            isPickup: false, isDecoration: false,
                            spriteNormalPath: helipadSpriteFullPath,
                            imageNormal: helipadImage,
                            spriteScale: helipadSpriteScale,
                            isFlippedHorizontally: false,
                            collisionShape: { type: 'rectangle', offsetX: helipadWidth * 0.1, offsetY: helipadHeight * 0.1, width: helipadWidth * 0.8, height: helipadHeight * 0.8},
                        };
                        this.level.obstacles.push(newObstacle);
                        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Concrete helipad spawned at extraction zone (${ez.x.toFixed(0)}, ${ez.y.toFixed(0)})`);
                    });
                }
            }
        }

        const pickupGenCfg = genConfig.PICKUPS || {};
        const pickupBaseCount = pickupGenCfg.BASE_COUNT || 5;
        const pickupPhaseIncrement = pickupGenCfg.PHASE_INCREMENT || 0;
        const phaseIndex = this.game.currentPhaseIndex || 0;
        const numPickups = pickupBaseCount + (phaseIndex * pickupPhaseIncrement) + this.rng.nextInt(0, pickupGenCfg.RANDOM_ADDITION_MAX || 3);
        const pickupPlacementMaxAttempts = pickupGenCfg.PLACEMENT_MAX_ATTEMPTS || 15;

        for (let i = 0; i < numPickups; i++) {
            const template = this._getRandomPickupTemplate();
            if (!template) continue;

            let actualSpritePath = null, actualImageObject = null;
            let actualDestroyedSpritePath = null, actualDestroyedImageObject = null;
            let normalSpriteScale = template.spriteScale || 1.0, destroyedSpriteScale = template.spriteDestroyedScale;
            let filesArray = [], pathBase = '', useRandomSpriteFromList = false, useSpritePair = false;

            if (template.type === 'pickup_health') {
                filesArray = CONFIG.HEALTH_PICKUP_SPRITE_FILES || [];
                pathBase = CONFIG.HEALTH_PICKUP_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
                useSpritePair = true;
            }
            else if (template.type === 'pickup_ammo_crate') {
                filesArray = CONFIG.AMMO_PICKUP_SPRITE_FILES || [];
                pathBase = CONFIG.AMMO_PICKUP_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
                useSpritePair = true;
            }
            else if (template.type === 'pickup_grenade_crate') {
                filesArray = CONFIG.GRENADE_PICKUP_SPRITE_FILES || [];
                pathBase = CONFIG.GRENADE_PICKUP_SPRITE_PATH || '';
                useRandomSpriteFromList = true;
                useSpritePair = true;
            }
            else if (template.type === 'pickup_weapon_crate') {
                // Pick a random available weapon for this crate
                const availableWeapons = this._getAvailableWeaponCrateTypes(this.game.currentPhaseIndex || 0);
                if (availableWeapons.length > 0) {
                    const selectedWeapon = this.rng.pickFrom(availableWeapons);
                    const weaponDef = CONFIG.WEAPON_DEFINITIONS[selectedWeapon];
                    if (weaponDef) {
                        actualSpritePath = weaponDef.crateSpriteWithWeapon || null;
                        actualDestroyedSpritePath = weaponDef.crateSpriteWithoutWeapon || null;
                        // Store weapon info on the template for reference
                        template.weaponName = selectedWeapon;
                        template.weaponDef = weaponDef;
                        normalSpriteScale = template.spriteScale || 1.0;
                    }
                }
            }

            if (useRandomSpriteFromList && filesArray.length > 0 && pathBase) {
                if (useSpritePair) {
                    const selectedPair = this.rng.pickFrom(filesArray);
                    actualSpritePath = pathBase + selectedPair.normal;
                    actualDestroyedSpritePath = pathBase + selectedPair.destroyed;
                } else {
                    actualSpritePath = pathBase + this.rng.pickFrom(filesArray);
                }
            }
            actualImageObject = actualSpritePath ? (preloadedAssetImages[actualSpritePath] || null) : null;
            if (actualDestroyedSpritePath) actualDestroyedImageObject = preloadedAssetImages[actualDestroyedSpritePath] || null;

            const pickupWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 32);
            const pickupHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 32);

            let pickupX, pickupY;
            let placed = false;
            let attempts = 0;

            do {
                pickupX = this.rng.nextFloat(playableMinX, playableMaxX - pickupWidth);
                pickupY = this.rng.nextFloat(playableMinY, playableMaxY - pickupHeight);

                const tempPickupForShape = { ...template, x: pickupX, y: pickupY, width: pickupWidth, height: pickupHeight, collisionShapes: template.collisionShapes };
                const collisionCheckShape = this.level._getObstacleCollisionShape(tempPickupForShape);

                if (!this._isPlacementInvalid(collisionCheckShape, template, this.level.obstacles, [])) {
                    const newPickup = {
                        x: pickupX, y: pickupY, width: pickupWidth, height: pickupHeight,
                        type: template.type, name: template.name || template.type, color: template.color,
                        destructible: template.destructible, hp: template.destructible ? template.hp : Infinity, maxHp: template.destructible ? template.maxHp : Infinity, isDestroyed: false,
                        blocksMovement: false, providesCover: false,
                        pickupType: template.pickupType || null, pickupQuantity: template.pickupQuantity || 0,
                        isPickup: true, isDecoration: false,
                        spriteNormalPath: actualSpritePath,
                        spriteDestroyedPath: actualDestroyedSpritePath,
                        imageNormal: actualImageObject,
                        imageDestroyed: actualDestroyedImageObject,
                        spriteScale: normalSpriteScale, spriteDestroyedScale: destroyedSpriteScale,
                        collisionShape: template.collisionShape || null,
                        weaponName: template.weaponName || null,
                        weaponDef: template.weaponDef || null
                    };
                    this.level.obstacles.push(newPickup);
                    placed = true;
                    if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Spawned pickup ${template.type} at (${pickupX.toFixed(0)}, ${pickupY.toFixed(0)})`);
                }
                attempts++;
            } while (!placed && attempts < pickupPlacementMaxAttempts);
        }

        this.level.generateNavigationGrid(worldWidth, worldHeight);

        const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
        const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;
        this.level.computeReachableCells(playerSpawnCenterX, playerSpawnCenterY);

        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {};
        const enemySpawnMinY = playableMinY;
        const enemySpawnMaxY = playerSpawnZone.y - (enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 100);

        const enemyDensityFactor = baseParams.enemyDensityFactor || 1.0;
        const baseNumEnemies = enemySpawnCfg.BASE_ENEMY_COUNT_PER_DENSITY_FACTOR || 8;
        const randomAddMax = enemySpawnCfg.RANDOM_ADDITION_FACTOR_MAX || 5;
        const totalEnemiesToSpawn_InitialCalculation = Math.floor(baseNumEnemies * enemyDensityFactor) + this.rng.nextInt(0, Math.max(1, Math.floor(baseNumEnemies * enemyDensityFactor * randomAddMax)));
        let enemiesSpawnedCount = allSpawnedEnemiesDuringGen.length;
        const enemyGroups = [];

        const totalEnemiesToSpawnForThisMission = totalEnemiesToSpawn_InitialCalculation;
        const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0;
        const numberOfGroupsToAttempt = Math.ceil(Math.max(0, totalEnemiesToSpawnForThisMission - enemiesSpawnedCount) / Math.max(1, avgEnemiesPerGroup));


        let quadrantCols, quadrantRows;
        if (enemySpawnCfg.QUADRANT_SCALING_ENABLED) {
            const worldSizeFactor = baseParams.worldSizeFactor || 1.0;
            const baseCols = enemySpawnCfg.QUADRANT_BASE_COLS || 2;
            const baseRows = enemySpawnCfg.QUADRANT_BASE_ROWS || 2;
            const scaleCols = enemySpawnCfg.QUADRANT_SCALE_COLS_PER_WORLD_FACTOR || 0.5;
            const scaleRows = enemySpawnCfg.QUADRANT_SCALE_ROWS_PER_WORLD_FACTOR || 0.3;
            const randomness = enemySpawnCfg.QUADRANT_RANDOMNESS_FACTOR || 0.3;
            const minCols = enemySpawnCfg.QUADRANT_MIN_COLS || 2;
            const maxCols = enemySpawnCfg.QUADRANT_MAX_COLS || 6;
            const minRows = enemySpawnCfg.QUADRANT_MIN_ROWS || 2;
            const maxRows = enemySpawnCfg.QUADRANT_MAX_ROWS || 4;

            const targetCols = baseCols + worldSizeFactor * scaleCols;
            const targetRows = baseRows + worldSizeFactor * scaleRows;
            const randomFactor = 1.0 + this.rng.nextFloat(-randomness, randomness);
            quadrantCols = Math.round(targetCols * randomFactor);
            quadrantRows = Math.round(targetRows * randomFactor);
            quadrantCols = Math.max(minCols, Math.min(maxCols, quadrantCols));
            quadrantRows = Math.max(minRows, Math.min(maxRows, quadrantRows));
        } else {
            quadrantCols = enemySpawnCfg.QUADRANT_COLS || 3;
            quadrantRows = enemySpawnCfg.QUADRANT_ROWS || 2;
        }
        if (CONFIG.DEBUG_LOGGING) console.log(`[Level Gen] Enemy distribution grid: ${quadrantCols}x${quadrantRows} (worldSizeFactor: ${baseParams.worldSizeFactor || 1.0})`);
        const quadrantEnemyCounts = Array(quadrantRows).fill(0).map(() => Array(quadrantCols).fill(0));

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

        for (let g = 0; g < numberOfGroupsToAttempt && enemiesSpawnedCount < totalEnemiesToSpawnForThisMission; g++) {
            const smallGroupChance = enemySpawnCfg.SMALL_GROUP_CHANCE || 0.6;
            const smallGroupMin = enemySpawnCfg.SMALL_GROUP_SIZE_MIN || 1;
            const smallGroupMax = enemySpawnCfg.SMALL_GROUP_SIZE_MAX || 3;
            let currentGroupSizeAttempt = this.rng.chance(smallGroupChance) ? this.rng.nextInt(smallGroupMin, smallGroupMax) : (smallGroupMax + this.rng.nextInt(0, 1));
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

                const leaderFootprint = { x: groupLeaderX - CONFIG.POSSUM_HEAVY_SIZE / 2, y: groupLeaderY - CONFIG.POSSUM_HEAVY_SIZE / 2, width: CONFIG.POSSUM_HEAVY_SIZE, height: CONFIG.POSSUM_HEAVY_SIZE };

                if (this.level.isSpawnPointClear(groupLeaderX, groupLeaderY, CONFIG.POSSUM_HEAVY_SIZE, this.level.obstacles, allSpawnedEnemiesDuringGen) &&
                    !this._isPlacementInvalid(leaderFootprint, { isDecoration: false }, [], extraKeepOutZones)) {
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

                    let EnemyClass = PossumGrunt;
                    let currentEnemyUnitSize = CONFIG.POSSUM_GRUNT_SIZE;

                    const sniperUnlockPhase = CAMPAIGN_RULES.BASE_PARAMETERS.sniperChance?.unlocksPhase ?? 2;
                    const heavyUnlockPhase = 1;
                    const eliteUnlockPhase = CAMPAIGN_RULES.BASE_PARAMETERS.eliteChance?.unlocksPhase ?? 3;
                    const currentPhaseIdx = this.game.currentPhaseIndex || 0;
                    const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;

                    const phaseSniperChance = currentPhaseIdx >= sniperUnlockPhase ? baseParams.sniperChance : 0;
                    const phaseHeavyChance = currentPhaseIdx >= heavyUnlockPhase ? baseParams.heavyChance : 0;
                    const phaseEliteChance = currentPhaseIdx >= eliteUnlockPhase ? baseParams.eliteChance : 0;

                    if (this.rng.chance(phaseEliteChance)) {
                        EnemyClass = PossumElite;
                        currentEnemyUnitSize = CONFIG.POSSUM_ELITE_SIZE;
                    } else if (this.rng.chance(phaseSniperChance)) {
                        EnemyClass = PossumSniper;
                        currentEnemyUnitSize = CONFIG.POSSUM_SNIPER_SIZE;
                    } else if ((m === 0 && currentGroupSizeAttempt > 0 && this.rng.chance(phaseHeavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0))) || (currentGroupSizeAttempt === 1 && this.rng.chance(phaseHeavyChance))) {
                        EnemyClass = PossumHeavy;
                        currentEnemyUnitSize = CONFIG.POSSUM_HEAVY_SIZE;
                    }

                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30; const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5; const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberY = (m === 0) ? groupLeaderY : groupLeaderY + this.rng.nextFloat(-groupSpread / 2, groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2));
                        memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = { x: memberX - currentEnemyUnitSize / 2, y: memberY - currentEnemyUnitSize / 2, width: currentEnemyUnitSize, height: currentEnemyUnitSize };
                        isMemberSpawnClear = this.level.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.level.obstacles, allSpawnedEnemiesDuringGen) && !this._isPlacementInvalid(memberFootprint, { isDecoration: false }, [], extraKeepOutZones);
                        memberPlacementAttempts++;
                    } while (!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);

                    if (isMemberSpawnClear) {
                        const enemyUnit = new EnemyClass(memberX, memberY, this.game);
                        if (this.game && this.game.enemyUnits) this.game.enemyUnits.push(enemyUnit);
                        allSpawnedEnemiesDuringGen.push(enemyUnit);
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
                    const hutBottomEdgeY = hut.y + hut.height;
                    if (hutBottomEdgeY < playableMinY + (CONFIG.POSSUM_GRUNT_SIZE || 14)) return false;
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
                        const buffer = hostageConf.HOSTAGE_SPAWN_BUFFER || 20;
                        hostageX = Math.max(playableMinX + buffer + hostageSize / 2, Math.min(hostageX, playableMaxX - buffer - hostageSize / 2));
                        hostageY = Math.max(playableMinY + buffer + hostageSize / 2, Math.min(hostageY, playableMaxY - buffer - hostageSize / 2));
                        const decorationBuffer = hostageConf.HOSTAGE_DECORATION_SPAWN_BUFFER || 15;
                        if (this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || [])) &&
                            this._isClearOfMovementBlockingDecorations(hostageX, hostageY, hostageSize / 2, this.level.obstacles, decorationBuffer)) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${spawnedHostageCount}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                            hutHostageCounts.set(hut.name || hut.type + hut.x + hut.y, (currentHutHostageCount + 1));
                            const hutDef = CONFIG.OBSTACLE_DEFINITIONS.find(def => def.type === hut.type);
                            if (hutDef) {
                                const baseParams = missionParamsContainer.baseParams || {};
                                const phaseIndex = this.game.currentPhaseIndex || 0;
                                const sniperRules = CAMPAIGN_RULES.BASE_PARAMETERS.sniperChance || {};
                                const eliteRules = CAMPAIGN_RULES.BASE_PARAMETERS.eliteChance || {};
                                const sniperUnlockPhase = sniperRules.unlocksPhase || 2;
                                const eliteUnlockPhase = eliteRules.unlocksPhase || 3;
                                let phaseSniperWeight = 0;
                                let phaseEliteWeight = 0;
                                if (phaseIndex >= sniperUnlockPhase) {
                                    const effectivePhase = phaseIndex - sniperUnlockPhase;
                                    phaseSniperWeight = Math.min((sniperRules.initial || 0.05) + (effectivePhase * (sniperRules.perPhaseGrowthFactor || 0.08)), sniperRules.max || 0.45);
                                }
                                if (phaseIndex >= eliteUnlockPhase) {
                                    const effectivePhase = phaseIndex - eliteUnlockPhase;
                                    phaseEliteWeight = Math.min((eliteRules.initial || 0.05) + (effectivePhase * (eliteRules.perPhaseGrowthFactor || 0.07)), eliteRules.max || 0.45);
                                }
                                const hostageGuardBonusWeights = [
                                    { type: 'possum_sniper', weight: phaseSniperWeight * 10 },
                                    { type: 'possum_elite', weight: phaseEliteWeight * 10 }
                                ];
                                this._spawnInitialGuardsForObject(hut, hutDef, allSpawnedEnemiesDuringGen, hostageGuardBonusWeights);
                            }
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
                            const buffer = hostageConf.HOSTAGE_SPAWN_BUFFER || 20;
                            hostageX = Math.max(playableMinX + buffer + hostageSize / 2, Math.min(hostageX, playableMaxX - buffer - hostageSize / 2)); hostageY = Math.max(playableMinY + buffer + hostageSize / 2, Math.min(hostageY, playableMaxY - buffer - hostageSize / 2));
                            const decorationBuffer = hostageConf.HOSTAGE_DECORATION_SPAWN_BUFFER || 15;
                            if (!this._isPlacementInvalid({ x: hostageX - hostageSize / 2, y: hostageY - hostageSize / 2, width: hostageSize, height: hostageSize }, { isDecoration: false }, [], extraKeepOutZones) &&
                                this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || [])) &&
                                this._isClearOfMovementBlockingDecorations(hostageX, hostageY, hostageSize / 2, this.level.obstacles, decorationBuffer)) {
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
                    const buffer = hostageConf.HOSTAGE_SPAWN_BUFFER || 20;
                    do {
                        hostageX = this.rng.nextFloat(playableMinX + buffer, playableMaxX - buffer - hostageSize);
                        hostageY = this.rng.nextFloat(playableMinY + buffer, playableMinY + (playableHeight * 0.6 - buffer - hostageSize));
                        const tempHostageShapeForPlayerZone = { x: hostageX, y: hostageY, width: hostageSize, height: hostageSize };
                        const decorationBuffer = hostageConf.HOSTAGE_DECORATION_SPAWN_BUFFER || 15;
                        if (!this._isPlacementInvalid(tempHostageShapeForPlayerZone, { isDecoration: false }, [], extraKeepOutZones) &&
                            distance(hostageX, hostageY, playerSpawnZone.x + playerSpawnZone.width / 2, playerSpawnZone.y + playerSpawnZone.height / 2) > 150 &&
                            this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || [])) &&
                            this._isClearOfMovementBlockingDecorations(hostageX, hostageY, hostageSize / 2, this.level.obstacles, decorationBuffer)) {
                            const newHostage = new RaccoonHostage(hostageX, hostageY, this.game, `HOST-${i}`);
                            this.game.hostageUnits.push(newHostage); placed = true; spawnedHostageCount++;
                        } attempts++;
                    } while (!placed && attempts < maxPlacementAttempts);
                }
            }
            if (rescueObjectiveInstance) {
                rescueObjectiveInstance.totalToAchieve = spawnedHostageCount;
                if (rescueObjectiveInstance.minToAchieveForCompletion > spawnedHostageCount) {
                    rescueObjectiveInstance.minToAchieveForCompletion = spawnedHostageCount;
                }
            }
        }

        this._finalizeEnemyPositions(allSpawnedEnemiesDuringGen);

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
                if (spawnX > playerSpawnZone.x + playerSpawnZone.width - playerUnitSize / 2 || spawnY > playerSpawnZone.y + playerSpawnZone.height - playerUnitSize / 2 || spawnX < playerSpawnZone.x + playerUnitSize / 2 || spawnY < playerSpawnZone.y + playerUnitSize / 2) {
                    spawnX = playableMinX + playerUnitSize + (i * playerUnitSize * 2.5);
                    spawnY = playableMaxY - playerUnitSize;
                    spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2));
                }
                playerSpawnLocations.push({ x: spawnX, y: spawnY });
            }
        }
        return playerSpawnLocations;
    }

    _getCollisionShapeMaxExtentFromCenter(shape, centerX, centerY) {
        if (shape.type === 'ellipse') {
            const dx = Math.abs(shape.x - centerX);
            const dy = Math.abs(shape.y - centerY);
            return Math.sqrt(Math.pow(dx + shape.radiusX, 2) + Math.pow(dy + shape.radiusY, 2));
        } else if (shape.type === 'circle') {
            const dx = Math.abs(shape.x - centerX);
            const dy = Math.abs(shape.y - centerY);
            return Math.sqrt(dx * dx + dy * dy) + shape.radius;
        } else if (shape.type === 'rectangle') {
            const dx = Math.abs(shape.x + shape.width / 2 - centerX);
            const dy = Math.abs(shape.y + shape.height / 2 - centerY);
            return Math.sqrt(Math.pow(dx + shape.width / 2, 2) + Math.pow(dy + shape.height / 2, 2));
        }
        return Math.max(shape.width || 0, shape.height || 0);
    }
}