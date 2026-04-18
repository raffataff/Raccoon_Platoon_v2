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
    _isPlacementInvalid(newObstacleShape, newObstacleTemplate, existingObstacles, extraKeepOutZones = []) {
        // Check against extra keep-out zones first
        for (const zone of extraKeepOutZones) {
            if (this.level._rectOverlap(newObstacleShape, zone)) {
                return true; // Invalid if it overlaps a keep-out zone
            }
        }

        for (const existing of existingObstacles) {
            if (newObstacleTemplate.isDecoration && existing.isDecoration) {
                continue;
            }

            let shapeToCheck = this.level._getObstacleCollisionShape(existing);
            if (!shapeToCheck) continue;

            // --- MODIFICATION START: Inflate shape for buffer check ---
            const buffer = newObstacleTemplate.placementBuffer || 0;
            if (buffer > 0) {
                let inflatedShape = { ...shapeToCheck };
                if (inflatedShape.type === 'rectangle') {
                    inflatedShape.x -= buffer;
                    inflatedShape.y -= buffer;
                    inflatedShape.width += buffer * 2;
                    inflatedShape.height += buffer * 2;
                } else if (inflatedShape.type === 'circle') {
                    inflatedShape.radius += buffer;
                } else if (inflatedShape.type === 'ellipse') {
                    inflatedShape.radiusX += buffer;
                    inflatedShape.radiusY += buffer;
                }
                shapeToCheck = inflatedShape;
            }
            // --- MODIFICATION END ---

            let collision = false;
            if (newObstacleShape.type === 'circle') {
                if (shapeToCheck.type === 'rectangle') collision = rectCircleOverlap(shapeToCheck, newObstacleShape);
                else if (shapeToCheck.type === 'circle') collision = circleOverlap(shapeToCheck, newObstacleShape);
                else if (shapeToCheck.type === 'ellipse') collision = circleEllipseOverlap(newObstacleShape, shapeToCheck);
            } else if (newObstacleShape.type === 'rectangle') {
                if (shapeToCheck.type === 'rectangle') collision = this.level._rectOverlap(shapeToCheck, newObstacleShape);
                else if (shapeToCheck.type === 'circle') collision = rectCircleOverlap(newObstacleShape, shapeToCheck);
                else if (shapeToCheck.type === 'ellipse') collision = rectEllipseOverlap(newObstacleShape, shapeToCheck);
            } else if (newObstacleShape.type === 'ellipse') {
                if (shapeToCheck.type === 'rectangle') collision = rectEllipseOverlap(shapeToCheck, newObstacleShape);
                else if (shapeToCheck.type === 'circle') collision = circleEllipseOverlap(shapeToCheck, newObstacleShape);
                else if (shapeToCheck.type === 'ellipse') {
                    const r1 = { x: newObstacleShape.x - newObstacleShape.radiusX, y: newObstacleShape.y - newObstacleShape.radiusY, width: newObstacleShape.radiusX * 2, height: newObstacleShape.radiusY * 2 };
                    const r2 = { x: shapeToCheck.x - shapeToCheck.radiusX, y: shapeToCheck.y - shapeToCheck.radiusY, width: shapeToCheck.radiusX * 2, height: shapeToCheck.radiusY * 2 };
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
        return false;
    }

    _getRandomObstacleTemplate() {
        const definitions = CONFIG.OBSTACLE_DEFINITIONS || [];
        if (definitions.length === 0) { console.warn("No obstacle definitions in CONFIG!"); return null; }

        const currentPhaseIdx = this.game.currentPhaseIndex || 0;

        let totalWeight = 0;
        definitions.forEach(def => {
            let isCurrentMissionTargetType = false;
            if (this.game && this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
                isCurrentMissionTargetType = this.game.currentMissionParams.objectives.some(obj =>
                    obj.type === "DESTROY_TARGET" && def.type.startsWith(obj.targetTypeKeyPrefix)
                );
            }

            if (def.type !== 'extraction_zone' && !isCurrentMissionTargetType) {
                if (def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx) {
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
                    (def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx);
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
                (def.phaseUnlocked === undefined || def.phaseUnlocked <= currentPhaseIdx);
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
    _spawnGrenadeCrateNearTarget(targetX, targetY, targetWidth, targetHeight) {
        // Find the grenade crate template
        const grenadeCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_grenade_crate');
        if (!grenadeCrateDef) {
//            console.warn("[Level Gen] Could not find pickup_grenade_crate definition");
            return;
        }

        // Calculate spawn position - place crate to the right side of the target
        const crateOffsetX = targetWidth / 2 + 40; // 40px to the right of the target
        const crateOffsetY = 0;
        const crateX = targetX + crateOffsetX;
        const crateY = targetY + crateOffsetY;

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
            // Try left side instead
            crateShape.x = targetX - targetWidth / 2 - 40;
            if (this._isPlacementInvalid(crateShape, grenadeCrateDef, this.level.obstacles, [])) {
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
    _spawnAmmoCrateNearTarget(targetX, targetY, targetWidth, targetHeight) {
        const ammoCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_ammo_crate');
        if (!ammoCrateDef) {
            return;
        }

        const crateOffsetX = targetWidth / 2 + 40;
        const crateOffsetY = 0;
        const crateX = targetX + crateOffsetX;
        const crateY = targetY + crateOffsetY;

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
            crateShape.x = targetX - targetWidth / 2 - 40;
            if (this._isPlacementInvalid(crateShape, ammoCrateDef, this.level.obstacles, [])) {
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

    _spawnWeaponCrateNearTarget(targetX, targetY, targetWidth, targetHeight, currentPhase) {
        const weaponCrateDef = (CONFIG.PICKUP_DEFINITIONS || []).find(def => def.type === 'pickup_weapon_crate');
        if (!weaponCrateDef) {
            return;
        }

        const availableWeapons = this._getAvailableWeaponCrateTypes(currentPhase);
        if (availableWeapons.length === 0) {
            return;
        }

        const selectedWeapon = availableWeapons[this.rng.nextInt(0, availableWeapons.length)];

        const crateOffsetX = targetWidth / 2 + 40;
        const crateOffsetY = 0;
        const crateX = targetX + crateOffsetX;
        const crateY = targetY + crateOffsetY;

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
            crateShape.x = targetX - targetWidth / 2 - 40;
            if (this._isPlacementInvalid(crateShape, weaponCrateDef, this.level.obstacles, [])) {
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

    // --- NEW: Sanity check function to run at the end of generation ---
    _finalizeEnemyPositions(allEnemies) {
        if (!this.level.navGrid) {
//            console.error("[Level Gen] Cannot finalize enemy positions without a navGrid!");
            return;
        }

        const navGrid = this.level.navGrid;
        const gridW = this.level.gridWidth;
        const gridH = this.level.gridHeight;

        for (let i = allEnemies.length - 1; i >= 0; i--) {
            const enemy = allEnemies[i];
            const gridPos = this.level.worldToGridCoords(enemy.x, enemy.y);

            // Check if the enemy is on a blocked cell
            if (gridPos.x < 0 || gridPos.x >= gridW || gridPos.y < 0 || gridPos.y >= gridH || navGrid[gridPos.y][gridPos.x] === 1) {
                let moved = false;
                // Search for a nearby valid spot
                for (let r = 1; r <= 5; r++) { // Search up to 5 cells away
                    for (let dy = -r; dy <= r; dy++) {
                        for (let dx = -r; dx <= r; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const newGridX = gridPos.x + dx;
                            const newGridY = gridPos.y + dy;

                            if (newGridX >= 0 && newGridX < gridW && newGridY >= 0 && newGridY < gridH && navGrid[newGridY][newGridX] === 0) {
                                const newWorldPos = this.level.gridToWorldCoords(newGridX, newGridY);
//                                console.warn(`[Level Gen] Sanity Check: Moved invalid enemy ${enemy.id} from blocked cell to (${newWorldPos.x.toFixed(0)}, ${newWorldPos.y.toFixed(0)})`);
                                enemy.x = newWorldPos.x;
                                enemy.y = newWorldPos.y;
                                moved = true;
                                break;
                            }
                        }
                        if (moved) break;
                    }
                    if (moved) break;
                }

                if (!moved) {
//                    console.error(`[Level Gen] CRITICAL: Could not find valid spawn for enemy ${enemy.id}. Removing from game to prevent an unwinnable state.`);
                    this.game.enemyUnits = this.game.enemyUnits.filter(u => u.id !== enemy.id);
                    allEnemies.splice(i, 1);
                }
            }
        }
    }

    generate(worldWidth, worldHeight, missionParamsContainer = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}, missionSeed) {
        this.rng = new SeededRandom(missionSeed);
        this.preloadedAssetImages = preloadedAssetImages; // Store for access by helper methods
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

        const allSpawnedEnemiesDuringGen = [];

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

        extraKeepOutZones.push({
            x: 0,
            y: 0,
            width: worldWidth,
            height: topBottomBorderHeight
        });

        if (borderObstacleTemplate && borderSpriteImage && borderSegmentWidth > 0 && borderSegmentHeight > 0) {
            const numSegments = Math.ceil(worldWidth / borderSegmentWidth);
            const borderCollisionShape = borderObstacleTemplate.collisionShape ? {
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
                const commonProps = {
                    type: borderObstacleTemplate.type, name: borderObstacleTemplate.name,
                    destructible: borderObstacleTemplate.destructible || false,
                    hp: borderObstacleTemplate.hp || Infinity, maxHp: borderObstacleTemplate.maxHp || Infinity,
                    isDestroyed: false, blocksMovement: true, providesCover: true, isDecoration: false,
                    spriteNormalPath: borderSpritePath, imageNormal: borderSpriteImage, spriteScale: borderSpriteScale,
                    collisionShape: borderCollisionShape
                };
                this.level.obstacles.push({ ...commonProps, x: segmentX, y: 0, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Top)` });
                this.level.obstacles.push({ ...commonProps, x: segmentX, y: worldHeight - topBottomBorderHeight, width: borderSegmentWidth, height: topBottomBorderHeight, name: `${borderObstacleTemplate.name} (Border Bottom)` });
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

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

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

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

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
                isDestroyed: false, isPickup: false, isDecoration: true,
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
                    if (targetTemplateOriginal.type === 'possum_hut' || targetTemplateOriginal.type === 'possum_hut_round') {
                        const hutSpritePairs = targetTemplateOriginal.type === 'possum_hut' 
                            ? (CONFIG.POSSUM_HUT_SPRITE_FILES || [])
                            : (CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES || []);
                        const pathBase = targetTemplateOriginal.type === 'possum_hut'
                            ? (CONFIG.POSSUM_HUT_SPRITE_PATH || '')
                            : (CONFIG.POSSUM_HUT_ROUND_SPRITE_PATH || '');
                        if (hutSpritePairs.length > 0) {
                            const selectedPair = this.rng.pickFrom(hutSpritePairs);
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
                            collisionShape: targetTemplateOriginal.collisionShape
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
                                isSpawner: (targetTemplateOriginal.type === 'possum_hut' || targetTemplateOriginal.type === 'possum_hut_round') && !targetTemplateOriginal.isDecoration,
                                spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                                delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0, unitsSpawnedFromHut: 0
                            };
                            this.level.obstacles.push(missionTargetObs);
                            this.level.missionTargetObstacles.push(missionTargetObs);
                            if (missionTargetObs.isSpawner) this.level.potentialSpawnerHuts.push(missionTargetObs);
                            this._spawnInitialGuardsForObject(missionTargetObs, targetTemplateOriginal, allSpawnedEnemiesDuringGen);
                            
                            if (targetTemplateOriginal.type === 'possum_relay_tower') {
                                this._spawnGrenadeCrateNearTarget(targetX, targetY, targetWidth, targetHeight);
                                this._spawnAmmoCrateNearTarget(targetX, targetY, targetWidth, targetHeight);
                                this._spawnWeaponCrateNearTarget(targetX, targetY, targetWidth, targetHeight, (this.game.currentPhaseIndex || 0) + 1);
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
                            collisionShape: consoleTemplate.collisionShape
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
                            intelConsoleInstance.isHacked = false;
                            intelConsoleInstance.isBeingHacked = false;
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
        const towersSpawned = spawnedMissionTargets.filter(o => o.type.startsWith('possum_relay_tower')).length;
        if (hutsSpawned === 0 && towersSpawned === 0) {
//            console.error(`[Level Gen] CRITICAL: No mission targets (huts/towers) were spawned! This will lock the mission!`);
        }

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
            let filesArray = [], pathBase = '', useRandomSpriteFromList = false, useSpritePair = false;

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
            else if (template.type === 'tree_palm_fallen') { filesArray = CONFIG.PALM_TREE_FALLEN_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE_FALLEN_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm2_fallen') { filesArray = CONFIG.PALM2_TREE_FALLEN_SPRITE_FILES || []; pathBase = CONFIG.PALM2_TREE_FALLEN_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_deciduous_fallen') { filesArray = CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_FILES || []; pathBase = CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm2_single') { filesArray = CONFIG.PALM_TREE2_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE2_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm2_double') { filesArray = CONFIG.PALM_TREE2_DOUBLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE2_DOUBLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_palm2_triple') { filesArray = CONFIG.PALM_TREE2_TRIPLE_SPRITE_FILES || []; pathBase = CONFIG.PALM_TREE2_TRIPLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_deciduous_single') { filesArray = CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES || []; pathBase = CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree4_deciduous_single') { filesArray = CONFIG.TREE4_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.TREE4_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree5_deciduous_single') { filesArray = CONFIG.TREE5_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.TREE5_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_rubber_single') { filesArray = CONFIG.RUBBER_TREE_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.RUBBER_TREE_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_fan_single') { filesArray = CONFIG.FAN_TREE_SINGLE_SPRITE_FILES || []; pathBase = CONFIG.FAN_TREE_SINGLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_fan_double') { filesArray = CONFIG.FAN_TREE_DOUBLE_SPRITE_FILES || []; pathBase = CONFIG.FAN_TREE_DOUBLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'tree_fan_triple') { filesArray = CONFIG.FAN_TREE_TRIPLE_SPRITE_FILES || []; pathBase = CONFIG.FAN_TREE_TRIPLE_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'palm_bush_small') { filesArray = CONFIG.PALM_BUSH_SMALL_FILES || []; pathBase = CONFIG.PALM_BUSH_SMALL_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'palm_bush_large') { filesArray = CONFIG.PALM_BUSH_LARGE_FILES || []; pathBase = CONFIG.PALM_BUSH_LARGE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rainforest_patch_small_1') { filesArray = CONFIG.RAINFOREST_SMALL_PATCH_SPRITE_FILES || []; pathBase = CONFIG.RAINFOREST_SMALL_PATCH_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else if (template.type === 'rainforest_patch_large_1') { filesArray = CONFIG.RAINFOREST_LARGE_PATCH_SPRITE_FILES || []; pathBase = CONFIG.RAINFOREST_LARGE_PATCH_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
            else { actualSpritePath = template.spriteNormal || null; }

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

            if (template.isDecoration && template.type === 'decoration_grass') {
                const grassConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.GRASS_CLUTTER) || {};
                normalSpriteScale = this.rng.nextFloat(grassConfig.MIN_SCALE || 0.8, grassConfig.MAX_SCALE || 1.2);
                obsRenderWidth = actualImageObject ? actualImageObject.naturalWidth * normalSpriteScale : (template.width || 16) * normalSpriteScale;
                obsRenderHeight = actualImageObject ? actualImageObject.naturalHeight * normalSpriteScale : (template.height || 16) * normalSpriteScale;
            } else if (template.type.startsWith('tree_')) {
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

                const spawnZoneConfig = CONFIG.LEVEL_GENERATION.PLAYER_SPAWN_ZONE || {};
                const restrictedTypes = spawnZoneConfig.PLAYER_SPAWN_ZONE_RESTRICTED_OBSTACLE_TYPES || [];
                const isRestrictedType = restrictedTypes.includes(template.type);

                let overlapsOuterSpawnZone = false;
                if (isRestrictedType) {
                    if (collisionCheckShape.type === 'rectangle') {
                        overlapsOuterSpawnZone = this.level._rectOverlap(collisionCheckShape, this.level.playerSpawnZone);
                    } else if (collisionCheckShape.type === 'circle') {
                        overlapsOuterSpawnZone = rectCircleOverlap(this.level.playerSpawnZone, collisionCheckShape);
                    } else if (collisionCheckShape.type === 'ellipse') {
                        overlapsOuterSpawnZone = rectEllipseOverlap(this.level.playerSpawnZone, collisionCheckShape);
                    }
                }

                if (!this._isPlacementInvalid(collisionCheckShape, template, this.level.obstacles, extraKeepOutZones) && !(isRestrictedType && overlapsOuterSpawnZone)) {
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
                        isPickup: !!template.pickupType, isDecoration: !!template.isDecoration,
                        spriteNormalPath: actualSpritePath,
                        spriteDestroyedPath: actualDestroyedSpritePath,
                        imageNormal: actualImageObject,
                        imageDestroyed: actualDestroyedImageObject,
                        spriteScale: normalSpriteScale, spriteDestroyedScale: destroyedSpriteScale,
                        isFlippedHorizontally: template.canBeFlipped ? this.rng.chance(0.5) : false,
                        collisionShape: template.collisionShape || null, isSpawner: (template.type === 'possum_hut' || template.type === 'possum_hut_round') && !template.isDecoration,
                        spawnCooldownTimer: 0, isActivelySpawning: false, unitsToSpawnThisBurst: 0, timeUntilNextUnitInBurst: 0,
                        delayedDamageSpawnTimer: 0, damageSpawnCooldown: 0, unitsSpawnedFromHut: 0,
                        willSpawnLog: willSpawnLog,
                        precomputedLogSpawnData: precomputedLogSpawnData
                    };
                    this.level.obstacles.push(newObstacle);
                    if (newObstacle.isSpawner && !newObstacle.isMissionTarget) this.level.potentialSpawnerHuts.push(newObstacle);
                    this._spawnInitialGuardsForObject(newObstacle, template, allSpawnedEnemiesDuringGen);
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
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

                const tempPickupForShape = { ...template, x: pickupX, y: pickupY, width: pickupWidth, height: pickupHeight };
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

            const targetCols = baseCols + (worldSizeFactor - 1.0) * scaleCols;
            const targetRows = baseRows + (worldSizeFactor - 1.0) * scaleRows;
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
                        if (this.level.isSpawnPointClear(hostageX, hostageY, hostageSize, this.level.obstacles, this.game.enemyUnits.concat(this.game.hostageUnits || []))) {
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
                            if (!this._isPlacementInvalid({ x: hostageX - hostageSize / 2, y: hostageY - hostageSize / 2, width: hostageSize, height: hostageSize }, { isDecoration: false }, [], extraKeepOutZones) &&
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
                    const buffer = hostageConf.HOSTAGE_SPAWN_BUFFER || 20;
                    do {
                        hostageX = this.rng.nextFloat(playableMinX + buffer, playableMaxX - buffer - hostageSize);
                        hostageY = this.rng.nextFloat(playableMinY + buffer, playableMinY + (playableHeight * 0.6 - buffer - hostageSize));
                        const tempHostageShapeForPlayerZone = { x: hostageX, y: hostageY, width: hostageSize, height: hostageSize };
                        if (!this._isPlacementInvalid(tempHostageShapeForPlayerZone, { isDecoration: false }, [], extraKeepOutZones) &&
                            distance(hostageX, hostageY, playerSpawnZone.x + playerSpawnZone.width / 2, playerSpawnZone.y + playerSpawnZone.height / 2) > 150 &&
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
}