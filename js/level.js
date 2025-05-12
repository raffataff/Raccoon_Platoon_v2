// js/level.js
class Level {
    // ... (constructor, isRectOverlappingList, isSpawnPointClear, damageObstacle) ...
    constructor(game) {
        this.game = game;
        this.obstacles = [];
    }

    isRectOverlappingList(newRect, existingRects) {
        for (const existing of existingRects) {
            if (newRect.x < existing.x + existing.width &&
                newRect.x + newRect.width > existing.x &&
                newRect.y < existing.y + existing.height &&
                newRect.y + newRect.height > existing.y) {
                return true; 
            }
        }
        return false;
    }

    isSpawnPointClear(x, y, unitSize, existingObstacles) {
        const unitFootprint = {
            x: x - unitSize,
            y: y - unitSize,
            width: unitSize * 2,
            height: unitSize * 2
        };
        const activeObstacles = existingObstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement);
        return !this.isRectOverlappingList(unitFootprint, activeObstacles);
    }
    damageObstacle(obstacle, amount, attackerUnit = null) { 
        if (!obstacle || !obstacle.destructible || obstacle.isDestroyed || !obstacle.hp) {
            return; 
        }
        obstacle.hp -= amount;
        if (obstacle.hp <= 0) {
            obstacle.hp = 0;
            obstacle.isDestroyed = true;
            obstacle.blocksMovement = false; 
            obstacle.providesCover = false;  
            
            if (this.game && obstacle.type === 'explosive_barrel') {
                this.game.addVisualEffect('explosion', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 80); 
                const barrelExplosionDamage = 50; 
                const barrelAoeRadius = 80;

                this.game.level.obstacles.forEach(otherObs => {
                    if (otherObs !== obstacle && otherObs.destructible && !otherObs.isDestroyed) {
                        let testX = obstacle.x + obstacle.width/2; 
                        let testY = obstacle.y + obstacle.height/2;

                        if (testX < otherObs.x) testX = otherObs.x;
                        else if (testX > otherObs.x + otherObs.width) testX = otherObs.x + otherObs.width;
                        if (testY < otherObs.y) testY = otherObs.y;
                        else if (testY > otherObs.y + otherObs.height) testY = otherObs.y + otherObs.height;
                        
                        const distX = (obstacle.x + obstacle.width/2) - testX;
                        const distY = (obstacle.y + obstacle.height/2) - testY;
                        const distSquared = (distX * distX) + (distY * distY);

                        if (distSquared <= barrelAoeRadius * barrelAoeRadius) {
                           this.damageObstacle(otherObs, barrelExplosionDamage, attackerUnit); 
                        }
                    }
                });
                const allUnits = [...this.game.deployedSquadRoster, ...this.game.enemyUnits]; // Use deployedSquadRoster
                allUnits.forEach(unit => {
                    if (unit.isAlive()) {
                        const distToUnit = distance(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, unit.x, unit.y);
                        if (distToUnit <= barrelAoeRadius + unit.size) {
                            unit.takeDamage(barrelExplosionDamage, attackerUnit); 
                        }
                    }
                });
            }
        }
    }

    // --- MODIFIED: generateLevelAndGetPlayerSpawns ---
    generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, missionParams = {}, numPlayerSpawnsNeeded) {
        this.obstacles = []; 
        if (this.game) {
            // this.game.playerSquad = []; // Game now manages this via deployedSquadRoster
            this.game.enemyUnits = [];    // Clear enemies for new level
            this.game.gameObjects = []; 
        }

        // ... (border wall and internal obstacle generation logic is the same) ...
        const worldMargin = 50; 
        const borderWidth = 30; 

        const borderColor = '#25221D'; 
        this.obstacles.push({ 
            x: 0, y: 0, width: worldWidth, height: borderWidth, 
            type: 'border_wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, 
            isDestroyed: false, blocksMovement: true, providesCover: true 
        });
        this.obstacles.push({ 
            x: 0, y: worldHeight - borderWidth, width: worldWidth, height: borderWidth, 
            type: 'border_wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, 
            isDestroyed: false, blocksMovement: true, providesCover: true 
        });
        this.obstacles.push({ 
            x: 0, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, 
            type: 'border_wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, 
            isDestroyed: false, blocksMovement: true, providesCover: true 
        });
        this.obstacles.push({ 
            x: worldWidth - borderWidth, y: borderWidth, width: borderWidth, height: worldHeight - 2 * borderWidth, 
            type: 'border_wall', color: borderColor, destructible: false, hp: Infinity, maxHp: Infinity, 
            isDestroyed: false, blocksMovement: true, providesCover: true 
        });
        
        const playableMinX = borderWidth + worldMargin;
        const playableMaxX = worldWidth - borderWidth - worldMargin;
        const playableMinY = borderWidth + worldMargin;
        const playableMaxY = worldHeight - borderWidth - worldMargin;
        const playableWidth = playableMaxX - playableMinX;
        const playableHeight = playableMaxY - playableMinY;

        const baseNumObstacles = 30; 
        const numInternalObstacles = Math.floor(baseNumObstacles * (missionParams.worldSizeFactor || 1.5)) + Math.floor(Math.random() * 15);


        const minObstacleDim = 40;
        const maxObstacleDim = 250; 

        const obstacleTypes = [
            { type: 'rock_large', color: '#504840', destructible: false, hp: Infinity, blocksMovement: true, providesCover: true, minW: 80, maxW: 150, minH: 80, maxH: 150 },
            { type: 'rock_small', color: '#605850', destructible: true, hp: 150, blocksMovement: true, providesCover: true, minW: 40, maxW: 70, minH: 40, maxH: 70 },
            { type: 'tree_dense', color: '#285020', destructible: true, hp: 80, blocksMovement: true, providesCover: true, minW: 50, maxW: 100, minH: 50, maxH: 100 }, 
            { type: 'fence_wood', color: '#8B4513', destructible: true, hp: 40, blocksMovement: true, providesCover: true, minW: 100, maxW: 200, minH: 15, maxH: 25 }, 
            { type: 'building_shed', color: '#787860', destructible: true, hp: 200, blocksMovement: true, providesCover: true, minW: 100, maxW: 180, minH: 80, maxH: 150 },
            { type: 'explosive_barrel', color: '#A00000', destructible: true, hp: 10, blocksMovement: true, providesCover: true, minW: 30, maxW: 40, minH: 30, maxH: 40 }
        ];

        for (let i = 0; i < numInternalObstacles; i++) {
            const template = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            const width = template.minW + Math.random() * (template.maxW - template.minW);
            const height = (template.type === 'fence_wood') ? (template.minH + Math.random() * (template.maxH - template.minH)) : width * (0.7 + Math.random() * 0.6); 
            
            const x = playableMinX + Math.random() * (playableWidth - width);
            const y = playableMinY + Math.random() * (playableHeight - height);
            
            const newObstacle = { 
                x, y, width, height, 
                type: template.type,
                color: template.color, 
                destructible: template.destructible, 
                hp: template.destructible ? template.hp : Infinity, 
                maxHp: template.destructible ? template.hp : Infinity,
                isDestroyed: false, 
                blocksMovement: template.blocksMovement, 
                providesCover: template.providesCover 
            };
            this.obstacles.push(newObstacle);
        }


        // --- Player Spawn Point GENERATION ---
        const playerSpawnLocations = []; // Array of {x, y}
        const playerUnitSize = CONFIG.RACCOON_SIZE;
        const playerStartX = playableMinX + 50; 
        const playerStartY = playableMaxY - 100; 

        for (let i = 0; i < numPlayerSpawnsNeeded; i++) {
            let spawnX, spawnY, isClear;
            let placementAttempts = 0;
            do {
                spawnX = playerStartX + i * (playerUnitSize * 3); 
                spawnY = playerStartY + (Math.random() * 20 - 10); 
                spawnX = Math.max(playableMinX + playerUnitSize, Math.min(spawnX, playableMaxX - playerUnitSize));
                spawnY = Math.max(playableMinY + playerUnitSize, Math.min(spawnY, playableMaxY - playerUnitSize));
                isClear = this.isSpawnPointClear(spawnX, spawnY, playerUnitSize, this.obstacles);
                placementAttempts++;
                if (!isClear) { 
                    spawnX += (Math.random() - 0.5) * 20; 
                    spawnY += (Math.random() - 0.5) * 20;
                }
            } while (!isClear && placementAttempts < 20);

            if (isClear) {
                playerSpawnLocations.push({ x: spawnX, y: spawnY });
            } else {
                // Fallback if clear spot not found
                playerSpawnLocations.push({ x: playerStartX + i * (playerUnitSize * 3), y: playerStartY });
            }
        }
        // console.log(`Generated ${playerSpawnLocations.length} player spawn points.`);

        // --- Enemy Spawning (uses missionParams.enemyDensityFactor) ---
        const enemyDensityFactor = missionParams.enemyDensityFactor || 1.0;
        const baseNumEnemies = 8;
        const totalEnemiesToSpawn = Math.floor(baseNumEnemies * enemyDensityFactor) + Math.floor(Math.random() * 5 * enemyDensityFactor);
        let enemiesSpawnedCount = 0; 
        const enemyUnitSize = CONFIG.POSSUM_GRUNT_SIZE;
        const enemyMinSpawnX = playerStartX + playableWidth * 0.25; 
        const groupSpawnAttempts = Math.ceil(totalEnemiesToSpawn / 1.5); 

        for (let g = 0; g < groupSpawnAttempts && enemiesSpawnedCount < totalEnemiesToSpawn; g++) {
            const groupSize = Math.random() < 0.7 ? 
                              Math.floor(2 + Math.random() * 2) : 
                              1; 

            let groupLeaderX, groupLeaderY, isLeaderSpawnClear;
            let leaderPlacementAttempts = 0;
            do {
                groupLeaderX = enemyMinSpawnX + Math.random() * (playableMaxX - enemyMinSpawnX - CONFIG.POSSUM_HEAVY_SIZE - 50); 
                groupLeaderY = playableMinY + Math.random() * (playableHeight - CONFIG.POSSUM_HEAVY_SIZE - 50); 
                
                groupLeaderX = Math.max(playableMinX + CONFIG.POSSUM_HEAVY_SIZE, Math.min(groupLeaderX, playableMaxX - CONFIG.POSSUM_HEAVY_SIZE));
                groupLeaderY = Math.max(playableMinY + CONFIG.POSSUM_HEAVY_SIZE, Math.min(groupLeaderY, playableMaxY - CONFIG.POSSUM_HEAVY_SIZE));

                isLeaderSpawnClear = this.isSpawnPointClear(groupLeaderX, groupLeaderY, CONFIG.POSSUM_HEAVY_SIZE, this.obstacles); 
                leaderPlacementAttempts++;
            } while (!isLeaderSpawnClear && leaderPlacementAttempts < 20);

            if (isLeaderSpawnClear) {
                for (let m = 0; m < groupSize && enemiesSpawnedCount < totalEnemiesToSpawn; m++) {
                    let memberX, memberY, isMemberSpawnClear;
                    let memberPlacementAttempts = 0;
                    let currentEnemyUnitSize = CONFIG.POSSUM_GRUNT_SIZE; 

                    let isHeavy = false;
                    const heavySpawnChance = missionParams.heavyChance || 0.2; 
                    if (m === 0 && groupSize > 1 && Math.random() < heavySpawnChance + 0.2) { 
                        isHeavy = true;
                    } else if (groupSize === 1 && Math.random() < heavySpawnChance) { 
                        isHeavy = true;
                    }
                    if (isHeavy) currentEnemyUnitSize = CONFIG.POSSUM_HEAVY_SIZE;
                    
                    const groupSpread = 40 + currentEnemyUnitSize * 2; 
                    do {
                        if (m === 0) { 
                            memberX = groupLeaderX;
                            memberY = groupLeaderY;
                        } else { 
                            memberX = groupLeaderX + (Math.random() * groupSpread - groupSpread / 2);
                            memberY = groupLeaderY + (Math.random() * groupSpread - groupSpread / 2);
                        }
                        memberX = Math.max(playableMinX + currentEnemyUnitSize, Math.min(memberX, playableMaxX - currentEnemyUnitSize));
                        memberY = Math.max(playableMinY + currentEnemyUnitSize, Math.min(memberY, playableMaxY - currentEnemyUnitSize));
                        isMemberSpawnClear = this.isSpawnPointClear(memberX, memberY, currentEnemyUnitSize, this.obstacles);
                        memberPlacementAttempts++;
                    } while(!isMemberSpawnClear && memberPlacementAttempts < 10);

                    if (isMemberSpawnClear) {
                        let enemyUnit;
                        if (isHeavy) {
                             enemyUnit = new PossumHeavy(memberX, memberY, this.game, `PHVY-${enemiesSpawnedCount + 1}`);
                        } else {
                             enemyUnit = new PossumGrunt(memberX, memberY, this.game, `PSM-${enemiesSpawnedCount + 1}`);
                        }
                        this.game.enemyUnits.push(enemyUnit);
                        enemiesSpawnedCount++;
                    }
                }
            }
        }
        // console.log(`[Level.generateLevel] Finished spawning enemies. Actual enemies: ${this.game.enemyUnits.length}`);

        if (this.game) {
            this.game.missionObjective = {
                type: missionParams.objectiveType || 'EXTERMINATE',
                description: missionParams.name || 'Eliminate all Possums!', 
            };
        }
        return playerSpawnLocations; // Return the generated spawn points
    }
}