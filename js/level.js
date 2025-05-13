// js/level.js
class Level {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
    }

    _rectOverlap(rect1, rect2) {
        return !(rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x ||
                 rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y);
    }

    isRectOverlappingList(newRect, existingRects) {
        for (const existing of existingRects) {
            if (!existing.isDestroyed && existing.blocksMovement && this._rectOverlap(newRect, existing)) {
                return true;
            }
        }
        return false;
    }

    isSpawnPointClear(x, y, unitSize, existingObstacles) {
        const unitFootprint = {
            x: x - unitSize / 2, y: y - unitSize / 2,
            width: unitSize, height: unitSize
        };
        const activeBlockingObstacles = existingObstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement);
        return !this.isRectOverlappingList(unitFootprint, activeBlockingObstacles);
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

            if (obstacleDef) { // Use definitions from config for these properties
                obstacle.blocksMovement = obstacleDef.blocksMovementOnDestroy !== undefined ? obstacleDef.blocksMovementOnDestroy : false;
                obstacle.providesCover = obstacleDef.providesCoverOnDestroy !== undefined ? obstacleDef.providesCoverOnDestroy : false;
            } else { // Fallback if definition not found
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
        if (definitions.length === 0) {
            console.warn("No obstacle definitions found in CONFIG!");
            return null;
        }
        let totalWeight = 0;
        definitions.forEach(def => totalWeight += (def.spawnWeight || 1));
        if (totalWeight === 0) return definitions[Math.floor(Math.random() * definitions.length)]; // Equal chance if all weights are 0

        let randomNum = Math.random() * totalWeight;
        for (const def of definitions) {
            randomNum -= (def.spawnWeight || 1);
            if (randomNum <= 0) return def;
        }
        return definitions[definitions.length - 1]; // Fallback
    }

    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParams = {}, numPlayerSpawnsNeeded, preloadedAssetImages = {}) {
        this.obstacles = [];
        if (this.game) {
            this.game.enemyUnits = [];
            this.game.gameObjects = [];
        }

        const genConfig = CONFIG.LEVEL_GENERATION || {};
        const worldMargin = genConfig.WORLD_MARGIN || 20;
        const borderWidth = genConfig.BORDER_WIDTH || 30;
        const borderColor = genConfig.BORDER_COLOR || '#25221D';

        this.obstacles.push({ x: 0, y: 0, width: worldWidth, height: borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity,maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: 0, y: worldHeight - borderWidth, width: worldWidth, height: borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: 0, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });
        this.obstacles.push({ x: worldWidth - borderWidth, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, type: 'border_wall', name: 'Border Wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, isDestroyed: false, blocksMovement: true, providesCover: true });

        const playableMinX = borderWidth + worldMargin;
        const playableMaxX = worldWidth - borderWidth - worldMargin;
        const playableMinY = borderWidth + worldMargin;
        const playableMaxY = worldHeight - borderWidth - worldMargin;
        const playableWidth = Math.max(0, playableMaxX - playableMinX);
        const playableHeight = Math.max(0, playableMaxY - playableMinY);

        const pSpawnCfg = genConfig.PLAYER_SPAWN_ZONE || {};
        const playerSpawnZoneWidth = Math.max(pSpawnCfg.MIN_WIDTH || 150, playableWidth * (pSpawnCfg.WIDTH_FACTOR || 0.20));
        const playerSpawnZoneHeight = Math.max(pSpawnCfg.MIN_HEIGHT || 100, playableHeight * (pSpawnCfg.HEIGHT_FACTOR || 0.20));
        const playerSpawnZone = { x: playableMinX, y: playableMaxY - playerSpawnZoneHeight, width: playerSpawnZoneWidth, height: playerSpawnZoneHeight };

        const obsGenCfg = genConfig.OBSTACLES || {};
        const baseNumObstacles = obsGenCfg.BASE_COUNT || 20;
        const worldSizeFactorFallback = obsGenCfg.WORLD_SIZE_FALLBACK_FACTOR || 1.0;
        const randomAdditionMax = obsGenCfg.RANDOM_ADDITION_MAX || 8;
        const numInternalObstacles = Math.floor(baseNumObstacles * (missionParams.worldSizeFactor || worldSizeFactorFallback)) + Math.floor(Math.random() * (randomAdditionMax + 1));
        const placementMaxAttempts = obsGenCfg.PLACEMENT_MAX_ATTEMPTS || 15;

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = this._getRandomObstacleTemplate();
            if (!template) {
                console.warn("Could not get obstacle template in level generation.");
                continue;
            }

            let obsWidth, obsHeight;
            let actualSpritePath = template.spriteNormal || null; // For non-decorations or fallback
            let actualImageObject = template.spriteNormal ? (preloadedAssetImages[template.spriteNormal] || null) : null;
            let actualDestroyedSpritePath = template.spriteDestroyed || null;
            let actualDestroyedImageObject = template.spriteDestroyed ? (preloadedAssetImages[template.spriteDestroyed] || null) : null;
            let scale = 1.0;

            if (template.isDecoration && template.type === 'decoration_grass') {
                const grassFiles = CONFIG.GRASS_SPRITE_FILES || [];
                const grassPathBase = CONFIG.GRASS_SPRITE_PATH || '';
                if (grassFiles.length > 0) {
                    const randomGrassFile = grassFiles[Math.floor(Math.random() * grassFiles.length)];
                    actualSpritePath = grassPathBase + randomGrassFile; // This is the key for the preloadedImages map
                    actualImageObject = preloadedAssetImages[actualSpritePath] || null;
                }

                const grassConfig = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.DECORATIONS && CONFIG.LEVEL_GENERATION.DECORATIONS.GRASS_CLUTTER) || {};
                const minScale = grassConfig.MIN_SCALE || 0.8;
                const maxScale = grassConfig.MAX_SCALE || 1.2;
                scale = minScale + Math.random() * (maxScale - minScale);

                if (actualImageObject) {
                    obsWidth = actualImageObject.naturalWidth * scale;
                    obsHeight = actualImageObject.naturalHeight * scale;
                } else {
                    obsWidth = (template.width || 16) * scale; // Use grass template base size if image failed
                    obsHeight = (template.height || 16) * scale;
                }
                 // Grass decorations don't have a "destroyed" sprite in this context
                actualDestroyedSpritePath = null;
                actualDestroyedImageObject = null;

            } else if (template.width !== undefined && template.height !== undefined) {
                obsWidth = template.width;
                obsHeight = template.height;
                // actualSpritePath and actualImageObject are already set from template defaults
            } else { // Fallback to minW/maxW randomization
                const minW = template.minW || 30;
                const maxW = template.maxW || 100;
                const minH = template.minH || (template.type === 'fence_wood' ? 10 : 30);
                const maxH = template.maxH || (template.type === 'fence_wood' ? 20 : 100);
                obsWidth = minW + Math.random() * (maxW - minW);
                if (template.height !== undefined) { obsHeight = template.height; }
                else if (template.type === 'fence_wood') { obsHeight = minH + Math.random() * (maxH - minH); }
                else { obsHeight = obsWidth * (0.6 + Math.random() * 0.8); }
                // actualSpritePath and actualImageObject are already set from template defaults
            }

            let obsX, obsY, newObstacleRect;
            let attempts = 0;
            let placed = false;

            do {
                obsX = playableMinX + Math.random() * (playableWidth - obsWidth);
                obsY = playableMinY + Math.random() * (playableHeight - obsHeight);
                newObstacleRect = { x: obsX, y: obsY, width: obsWidth, height: obsHeight };

                if (obsX < playableMinX || obsX + obsWidth > playableMaxX ||
                    obsY < playableMinY || obsY + obsHeight > playableMaxY) {
                    attempts++;
                    continue;
                }

                if (!this._rectOverlap(newObstacleRect, playerSpawnZone) &&
                    !this.isRectOverlappingList(newObstacleRect, this.obstacles)) {
                    this.obstacles.push({
                        x: obsX, y: obsY, width: obsWidth, height: obsHeight,
                        type: template.type,
                        name: template.name || template.type,
                        color: template.color, // Fallback if sprite fails
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
                        spriteNormalPath: actualSpritePath, // Use the determined path
                        spriteDestroyedPath: actualDestroyedSpritePath, // Use the determined path
                        imageNormal: actualImageObject, // Use the determined Image object
                        imageDestroyed: actualDestroyedImageObject, // Use the determined Image object
                        scale: scale // Store scale if needed elsewhere
                    });
                    placed = true;
                }
                attempts++;
            } while (!placed && attempts < placementMaxAttempts);
        }

        // ... (Player Spawn Point Generation - unchanged from previous version) ...
        const pSpawnPlaceCfg = genConfig.PLAYER_SPAWN_PLACEMENT || {};
        const playerSpawnLocations = [];
        const playerUnitSize = CONFIG.RACCOON_SIZE || 12;
        const spawnAreaPadding = playerUnitSize * (pSpawnPlaceCfg.INTERNAL_PADDING_FACTOR || 1.5);

        const effectiveSpawnZoneX = playerSpawnZone.x + spawnAreaPadding;
        const effectiveSpawnZoneY = playerSpawnZone.y + spawnAreaPadding;
        const effectiveSpawnZoneWidth = Math.max(0, playerSpawnZone.width - 2 * spawnAreaPadding);
        const effectiveSpawnZoneHeight = Math.max(0, playerSpawnZone.height - 2 * spawnAreaPadding);

        for (let i = 0; i < numPlayerSpawnsNeeded; i++) {
            let spawnX, spawnY, isClear;
            let currentPlacementAttempts = 0;
            const maxPlayerSpawnAttempts = pSpawnPlaceCfg.MAX_ATTEMPTS || 30;
            do {
                spawnX = effectiveSpawnZoneX + (effectiveSpawnZoneWidth > 0 ? (Math.random() * effectiveSpawnZoneWidth) : 0);
                spawnY = effectiveSpawnZoneY + (effectiveSpawnZoneHeight > 0 ? (Math.random() * effectiveSpawnZoneHeight) : 0);
                spawnX = Math.max(playableMinX + playerUnitSize / 2, Math.min(spawnX, playableMaxX - playerUnitSize / 2));
                spawnY = Math.max(playableMinY + playerUnitSize / 2, Math.min(spawnY, playableMaxY - playerUnitSize / 2));
                isClear = this.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.obstacles);
                currentPlacementAttempts++;
            } while (!isClear && currentPlacementAttempts < maxPlayerSpawnAttempts);

            if (isClear) {
                playerSpawnLocations.push({ x: spawnX, y: spawnY });
            } else {
                const fallbackSpacing = playerUnitSize * (pSpawnPlaceCfg.FALLBACK_SPACING_FACTOR || 3.0);
                let fallbackX = effectiveSpawnZoneX + (i * fallbackSpacing);
                let fallbackY = effectiveSpawnZoneY;
                if (effectiveSpawnZoneWidth > 0 && fallbackX > effectiveSpawnZoneX + effectiveSpawnZoneWidth - playerUnitSize) {
                    fallbackX = effectiveSpawnZoneX + ((i * fallbackSpacing) % Math.max(fallbackSpacing, effectiveSpawnZoneWidth));
                    fallbackY += fallbackSpacing;
                }
                fallbackY = Math.min(fallbackY, effectiveSpawnZoneY + effectiveSpawnZoneHeight - playerUnitSize);
                playerSpawnLocations.push({ x: fallbackX, y: fallbackY });
            }
        }

        // ... (Enemy Spawning - unchanged from previous version) ...
        const enemySpawnCfg = CONFIG.ENEMY_SPAWNING || {};
        const enemyDensityFactor = missionParams.enemyDensityFactor || 1.0;
        const baseNumEnemies = enemySpawnCfg.BASE_ENEMY_COUNT_PER_DENSITY_FACTOR || 8;
        const randomAddMax = enemySpawnCfg.RANDOM_ADDITION_FACTOR_MAX || 5;
        const totalEnemiesToSpawn = Math.floor(baseNumEnemies * enemyDensityFactor) + Math.floor(Math.random() * (randomAddMax * enemyDensityFactor + 1));
        let enemiesSpawnedCount = 0;
        const avgEnemiesPerGroup = enemySpawnCfg.AVG_ENEMIES_PER_GROUP_ATTEMPT || 2.0;
        const groupSpawnAttempts = Math.ceil(totalEnemiesToSpawn / Math.max(1, avgEnemiesPerGroup));
        const heavySize = CONFIG.POSSUM_HEAVY_SIZE || 18;
        const gruntSize = CONFIG.POSSUM_GRUNT_SIZE || 14;

        for (let g = 0; g < groupSpawnAttempts && enemiesSpawnedCount < totalEnemiesToSpawn; g++) {
            const smallGroupChance = enemySpawnCfg.SMALL_GROUP_CHANCE || 0.6;
            const smallGroupMin = enemySpawnCfg.SMALL_GROUP_SIZE_MIN || 1;
            const smallGroupMax = enemySpawnCfg.SMALL_GROUP_SIZE_MAX || 3;
            let currentGroupSizeAttempt = Math.random() < smallGroupChance
                                     ? Math.floor(smallGroupMin + Math.random() * (smallGroupMax - smallGroupMin + 1))
                                     : (smallGroupMax + Math.floor(Math.random() * 2));
            currentGroupSizeAttempt = Math.min(currentGroupSizeAttempt, totalEnemiesToSpawn - enemiesSpawnedCount);
            if (currentGroupSizeAttempt <= 0) continue;

            let groupLeaderX, groupLeaderY, isLeaderSpawnClear;
            let leaderPlacementAttempts = 0;
            const leaderMaxAttempts = enemySpawnCfg.LEADER_PLACEMENT_MAX_ATTEMPTS || 20;
            const minSpawnDistFromPlayerZone = enemySpawnCfg.MIN_DISTANCE_FROM_PLAYER_SPAWN_ZONE || 50;
            const enemySpawnMinX = playerSpawnZone.x + playerSpawnZone.width + minSpawnDistFromPlayerZone;
            const enemySpawnableWidth = Math.max(0, playableMaxX - enemySpawnMinX);

            if (enemySpawnableWidth <= heavySize * 2) { continue; }

            do {
                groupLeaderX = enemySpawnMinX + Math.random() * (enemySpawnableWidth - heavySize);
                groupLeaderY = playableMinY + Math.random() * (playableHeight - heavySize);
                groupLeaderX = Math.max(playableMinX + heavySize / 2, Math.min(groupLeaderX, playableMaxX - heavySize / 2));
                groupLeaderY = Math.max(playableMinY + heavySize / 2, Math.min(groupLeaderY, playableMaxY - heavySize / 2));
                const leaderFootprint = {x: groupLeaderX - heavySize/2, y: groupLeaderY - heavySize/2, width: heavySize, height: heavySize};
                isLeaderSpawnClear = this.isSpawnPointClear(groupLeaderX, groupLeaderY, heavySize, this.obstacles) && !this._rectOverlap(leaderFootprint, playerSpawnZone);
                leaderPlacementAttempts++;
            } while (!isLeaderSpawnClear && leaderPlacementAttempts < leaderMaxAttempts);

            if (isLeaderSpawnClear) {
                for (let m = 0; m < currentGroupSizeAttempt && enemiesSpawnedCount < totalEnemiesToSpawn; m++) {
                    let memberX, memberY, isMemberSpawnClear;
                    let memberPlacementAttempts = 0;
                    const memberMaxAttempts = enemySpawnCfg.MEMBER_PLACEMENT_MAX_ATTEMPTS || 10;
                    let currentEnemyUnitSize = gruntSize; let isHeavy = false;
                    const heavyChance = missionParams.heavyChance || (enemySpawnCfg.DEFAULT_HEAVY_CHANCE || 0.20);
                    const heavyLeaderBonus = enemySpawnCfg.HEAVY_CHANCE_GROUP_LEADER_BONUS || 0.1;
                    if ((m === 0 && currentGroupSizeAttempt > 0 && Math.random() < heavyChance + (currentGroupSizeAttempt > 1 ? heavyLeaderBonus : 0) ) || (currentGroupSizeAttempt === 1 && Math.random() < heavyChance)) {
                        isHeavy = true; currentEnemyUnitSize = heavySize;
                    }
                    const groupSpreadBase = enemySpawnCfg.GROUP_SPREAD_BASE || 30;
                    const groupSpreadSizeMult = enemySpawnCfg.GROUP_SPREAD_SIZE_MULTIPLIER || 1.5;
                    const groupSpread = groupSpreadBase + currentEnemyUnitSize * groupSpreadSizeMult;
                    do {
                        memberX = (m === 0) ? groupLeaderX : groupLeaderX + (Math.random() * groupSpread - groupSpread / 2);
                        memberY = (m === 0) ? groupLeaderY : groupLeaderY + (Math.random() * groupSpread - groupSpread / 2);
                        memberX = Math.max(playableMinX + currentEnemyUnitSize / 2, Math.min(memberX, playableMaxX - currentEnemyUnitSize / 2));
                        memberY = Math.max(playableMinY + currentEnemyUnitSize / 2, Math.min(memberY, playableMaxY - currentEnemyUnitSize / 2));
                        const memberFootprint = {x: memberX - currentEnemyUnitSize/2, y: memberY - currentEnemyUnitSize/2, width: currentEnemyUnitSize, height: currentEnemyUnitSize};
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles) && !this._rectOverlap(memberFootprint, playerSpawnZone);
                        memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < memberMaxAttempts);
                    if (isMemberSpawnClear) {
                        const enemyUnit = isHeavy ? new PossumHeavy(memberX, memberY, this.game, `PHVY-${enemiesSpawnedCount + 1}`) : new PossumGrunt(memberX, memberY, this.game, `PSM-${enemiesSpawnedCount + 1}`);
                        if (this.game && this.game.enemyUnits) this.game.enemyUnits.push(enemyUnit);
                        enemiesSpawnedCount++;
                    }
                }
            }
        }

        if (this.game) {
            this.game.missionObjective = {
                type: missionParams.objectiveType || 'EXTERMINATE',
                description: missionParams.name || (CONFIG.UI_TEXT_STRINGS.DEFAULT_OBJECTIVE_TEXT || 'Eliminate all Possums!'),
            };
        }
        return playerSpawnLocations;
    }
}