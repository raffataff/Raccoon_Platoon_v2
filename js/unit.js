 //js/unit.js
class Unit {
    constructor(x, y, game, team, hp, speed, size, color, id) {
        this.x = x; this.y = y; this.game = game; this.team = team;
        this.id = id || `${team}-${Date.now().toString(36) + Math.random().toString(36).slice(2, 5)}`;
        this.maxHp = hp; this.hp = hp; this.speed = speed; this.size = size; this.color = color;

        this.worldTargetX = x;
        this.worldTargetY = y;
        this.currentPath = [];
        this.currentPathNodeIndex = 0;
        this.isMoving = false;

        this.lastPosition = { x: x, y: y };
        this.currentVelocity = { x: 0, y: 0 };
        this.velocitySampleTime = 0.1;
        this.timeSinceLastVelocitySample = 0;

        this.lastDeltaX = 0;
        this.lastDeltaY = 0;

        this.canShootWhileMoving = true;
        this.weapon = null;
        this.autoTarget = null; this.manualTarget = null;

        this._weaponName = null;
        Object.defineProperty(this, 'weaponName', {
            get: function() { return this._weaponName; },
            set: function(name) {
                this._weaponName = name;
                if (name && WEAPONS[name]) {
                    this.weapon = WEAPONS[name];
                } else {
                    this.weapon = null;
                }
            },
            configurable: true,
            enumerable: true
        });

        this.attackCooldown = 0; this.actionTimer = 0; this.isMarkedForDeletion = false;
        this.facingAngle = Math.PI / 2;
        this.gunAimAngle = this.facingAngle;

        this.isPlayerDirectFiring = false;
        this.playerDirectFireTargetPos = { x: 0, y: 0 };

        this.aiState = (this.team === 'enemy') ? 'PATROLLING' : 'IDLE';
        this.lastKnownPlayerPosition = null;
        this.alertedByAlly = false;

        this.currentVisualState = 'idle';
        this.currentVisualDirection = 's';
        this.previousVisualDirection = 's';
        this.spriteBaseName = 'unknown';
        this.spriteScaleFactor = 1.0;

        this.isHoldingPosition = false;
        this.isHoldingFire = false;

        this.isPhasing = false;
        this.phasingTimer = 0;

        this.lastNudgeWasLeft = false;
        this.IMMEDIATE_BUMP_NUDGE_BACK_DISTANCE = this.size * 0.5;
        this.IMMEDIATE_BUMP_NUDGE_SIDE_DISTANCE = this.size * 0.5;
        this.IMMEDIATE_BUMP_REPATH_COOLDOWN = 0.15;
        this.bumpRepathCooldown = 0;

        this.deadSpritePathKey = null;
        this.deadSpriteFilesKey = null;
        this.deadSpriteScaleKey = null;

        this.bobbingCounter = Math.random() * Math.PI * 2; // Start at a random point in the bob cycle

        // --- MODIFICATION START ---
        if (this instanceof RaccoonHostage) {
            this.spriteBaseName = 'raccoon_hostage'; // Set base name for rescued state
            this.spriteScaleFactor = CONFIG.RACCOON_HOSTAGE_SPRITE_SCALE_FACTOR || 0.45;
        } else if (this instanceof Raccoon) {
            this.spriteBaseName = 'raccoon';
            this.spriteScaleFactor = CONFIG.RACCOON_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumHeavy) {
            this.spriteBaseName = 'possum_heavy';
            this.spriteScaleFactor = CONFIG.POSSUM_HEAVY_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumGrunt || this instanceof ShootoutTarget) {
            this.spriteBaseName = 'possum_grunt';
            this.spriteScaleFactor = CONFIG.POSSUM_GRUNT_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumSniper) {
            this.spriteBaseName = 'possum_sniper';
            this.spriteScaleFactor = CONFIG.POSSUM_SNIPER_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumBoss1) {
            this.spriteBaseName = 'possum_boss_1';
            this.spriteScaleFactor = CONFIG.POSSUM_BOSS_1_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumRevolver) {
            this.spriteBaseName = 'possum_revolver';
            this.spriteScaleFactor = CONFIG.POSSUM_REVOLVER_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumElite) {
            this.spriteBaseName = 'possum_elite';
            this.spriteScaleFactor = CONFIG.POSSUM_ELITE_SPRITE_SCALE_FACTOR || 1.0;
        }
        // --- MODIFICATION END ---

        this.updateVisualDirection(this.facingAngle);

        this.assignedDeadSpritePath = null;
        this.deathRotationAngle = 0;

        // --- OPTIMIZATION: Throttle target checks ---
        this.targetAcquisitionTimer = Math.random() * 0.5;

        // --- OPTIMIZATION Phase 2: Repath Cooldown ---
        this.repathCooldown = 0;
    }

    getNightVisionRadius(unit) {
        if (!unit || !unit.rank) return CONFIG.NIGHT_MISSION.PLAYER_VISION_RADIUS || 220;
        const rankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === unit.rank);
        return (rankData && rankData.nightVisionRadius) || CONFIG.NIGHT_MISSION.PLAYER_VISION_RADIUS || 220;
    }

    getHitbox() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    isIlluminated() {
        if (!this.game || !this.game.isNightMission) return true;

        // Find all units that provide vision
        const visionProviders = [
            ...(this.game.deployedSquadRoster || []),
            ...(this.game.hostageUnits || []).filter(h => h && h.isRescued)
        ];

        for (const provider of visionProviders) {
            if (!provider || !provider.isAlive()) continue;
            const visionRadius = this.getNightVisionRadius(provider);
            const visionRadiusSq = visionRadius * visionRadius;
            const dx = this.x - provider.x;
            const dy = this.y - provider.y;
            if (dx * dx + dy * dy <= visionRadiusSq) return true;
        }
        return false;
    }

    updateVisualDirection(angleToUse) {
        const angle = angleToUse;
        const twoPi = Math.PI * 2;
        const normalizedAngle = ((angle % twoPi) + twoPi) % twoPi;
        const slice = Math.PI / 4;
        const offset = Math.PI / 8;

        let newDirection;
        if (normalizedAngle >= (twoPi - offset) || normalizedAngle < (offset)) { newDirection = 'e'; }
        else if (normalizedAngle >= offset && normalizedAngle < (slice + offset)) { newDirection = 'se'; }
        else if (normalizedAngle >= (slice + offset) && normalizedAngle < (2 * slice + offset)) { newDirection = 's'; }
        else if (normalizedAngle >= (2 * slice + offset) && normalizedAngle < (3 * slice + offset)) { newDirection = 'sw'; }
        else if (normalizedAngle >= (3 * slice + offset) && normalizedAngle < (4 * slice + offset)) { newDirection = 'w'; }
        else if (normalizedAngle >= (4 * slice + offset) && normalizedAngle < (5 * slice + offset)) { newDirection = 'nw'; }
        else if (normalizedAngle >= (5 * slice + offset) && normalizedAngle < (6 * slice + offset)) { newDirection = 'n'; }
        else { newDirection = 'ne'; }

        if (newDirection !== this.currentVisualDirection) {
            this.previousVisualDirection = this.currentVisualDirection;
            this.currentVisualDirection = newDirection;
        }
    }

    _updateVelocity(deltaTime) {
        this.timeSinceLastVelocitySample += deltaTime;
        if (this.timeSinceLastVelocitySample >= this.velocitySampleTime) {
            const dx = this.x - this.lastPosition.x;
            const dy = this.y - this.lastPosition.y;
            if (this.timeSinceLastVelocitySample > 1e-5) {
                this.currentVelocity.x = dx / this.timeSinceLastVelocitySample;
                this.currentVelocity.y = dy / this.timeSinceLastVelocitySample;
            } else {
                this.currentVelocity.x = 0; this.currentVelocity.y = 0;
            }
            this.lastPosition.x = this.x; this.lastPosition.y = this.y;
            this.timeSinceLastVelocitySample = 0;
        }
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        this._updateVelocity(deltaTime);

        if (this.isPhasing) {
            this.phasingTimer -= deltaTime;
            if (this.phasingTimer <= 0) {
                this.isPhasing = false;
                this.phasingTimer = 0;
                if (this.isMoving && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 0.5) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id}] Player-forced Phasing ended. Repathing to target: (${this.worldTargetX.toFixed(0)}, ${this.worldTargetY.toFixed(0)})`);
                    this.setMoveTarget(this.worldTargetX, this.worldTargetY);
                } else {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id && this.isMoving) console.log(`[${this.id}] Phasing ended, already near target or no target. Stopping.`);
                    this.isMoving = false;
                }
            }
        }

        let actionTimerFinishedThisFrame = false;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) { this.actionTimer = 0; actionTimerFinishedThisFrame = true; }
        }

        // --- OPTIMIZATION Phase 2: Decrement repath cooldown ---
        if (this.repathCooldown > 0) this.repathCooldown -= deltaTime;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }

        const prevX = this.x; const prevY = this.y;
        this.lastDeltaX = 0; this.lastDeltaY = 0;
        this._handleMovement(deltaTime);

        const isActuallyMovingForBobbing = this.isMoving && (Math.abs(this.lastDeltaX) > 1e-6 || Math.abs(this.lastDeltaY) > 1e-6);
        if (isActuallyMovingForBobbing && this.isAlive()) {
            const bobbingConfig = CONFIG.UNIT_VISUALS;
            if (bobbingConfig && bobbingConfig.UNIT_BOBBING_ENABLED) {
                const speedFactor = bobbingConfig.UNIT_BOBBING_SPEED_FACTOR || 0.02;
                this.bobbingCounter += deltaTime * this.speed * speedFactor;
            }
        }

        if (this.team === 'player') {
            this._handlePlayerCombat(deltaTime, this.game.level.obstacles);
        } else if (this.team === 'enemy') {
            this._handleEnemyCombat(deltaTime, this.game.level.obstacles);
        }

        const target = this.manualTarget || this.autoTarget;
        if (this.isPlayerDirectFiring && this.playerDirectFireTargetPos) {
            this.gunAimAngle = Math.atan2(this.playerDirectFireTargetPos.y - this.y, this.playerDirectFireTargetPos.x - this.x);
        } else if (target && target.isAlive()) {
            this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        } else {
            this.gunAimAngle = this.facingAngle;
        }

        const hasTarget = (target && target.isAlive()) || this.isPlayerDirectFiring;
        const isReadyToFire = (this.attackCooldown <= 0 && this.actionTimer <= 0);
        const isOrderedToFire = !(this.isHoldingFire && !this.isPlayerDirectFiring);

        let isFiringThisFrame = false;
        if (hasTarget && isReadyToFire && isOrderedToFire && !(this instanceof Raccoon && this.isAimingGrenade)) {
            const fireAtX = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.x : target.x;
            const fireAtY = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.y : target.y;

            if (this.isPlayerDirectFiring) {
                if (this.weapon) isFiringThisFrame = true;
            } else {
                const dist = distance(this.x, this.y, fireAtX, fireAtY);
                const hasLOS = hasLineOfSight(this.x, this.y, fireAtX, fireAtY, this.game.level.activeObstacles, this.game.level);

                if (this.weapon && dist <= this.weapon.range && hasLOS) {
                    isFiringThisFrame = true;
                }
            }
        }

        if (!this.isAlive()) {
            this.currentVisualState = 'death';
        } else if (isFiringThisFrame) {
            this.currentVisualState = 'fire';
            this.facingAngle = this.gunAimAngle;

            if (!(this instanceof PossumBoss1)) {
                const fireAtX = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.x : target.x;
                const fireAtY = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.y : target.y;
                this._executeFire(fireAtX, fireAtY);
            }

        } else if (hasTarget && isOrderedToFire) {
            this.currentVisualState = 'idle';
            this.facingAngle = this.gunAimAngle;
        } else if (isActuallyMovingForBobbing) {
            this.currentVisualState = 'walk';
            const movedDist = Math.hypot(this.lastDeltaX, this.lastDeltaY);
            // Only turn the sprite if we moved more than a trivial snap distance.
            // This prevents the 1-frame South flash when smoothing snaps us to the first grid center.
            if (movedDist > 0.5) {
                this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
            }
        } else {
            this.currentVisualState = 'idle';
        }

        this.updateVisualDirection(this.facingAngle);
        if (actionTimerFinishedThisFrame && this.game && this.game.ui && this.team === 'player') { this.game.ui.updateSquadPanel(); }
    }


    forcePhaseOut(duration = 1.0) {
        if (!this.isAlive()) return;
        this.isPhasing = true;
        this.phasingTimer = duration;
        this.currentPath = [];
        this.currentPathNodeIndex = 0;
        if (CONFIG.DEBUG_LOGGING || CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//            console.log(`[${this.id}] Manually Force Phasing for ${duration}s. isMoving: ${this.isMoving}`);
        }
    }

    getCollisionShape() {
        return { type: 'circle', x: this.x, y: this.y, radius: this.size / 2 };
    }

    calculatePath(explicitStartGrid = null, isPhasingOverride = false) {
        if (!this.game || !this.game.level) { this.isMoving = false; this.currentPath = []; return false; }
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) { this.isMoving = false; this.currentPath = []; return false; }

        const startGrid = explicitStartGrid || this.game.level.worldToGridCoords(this.x, this.y);
        const endGrid = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);

        if (startGrid.x < 0 || startGrid.x >= this.game.level.gridWidth || startGrid.y < 0 || startGrid.y >= this.game.level.gridHeight ||
            endGrid.x < 0 || endGrid.x >= this.game.level.gridWidth || endGrid.y < 0 || endGrid.y >= this.game.level.gridHeight) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Start/End grid out of bounds.`);
            this.isMoving = false; this.currentPath = []; return false;
        }

        if (navGrid[startGrid.y][startGrid.x] === 1 && !isPhasingOverride && !explicitStartGrid) {
            let foundValidStart = false;
            const searchRadius = 2;
            for (let r = 1; r <= searchRadius && !foundValidStart; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx === 0 && dy === 0 && r > 1) continue;
                        const checkX = startGrid.x + dx; const checkY = startGrid.y + dy;
                        if (checkX >= 0 && checkX < this.game.level.gridWidth && checkY >= 0 && checkY < this.game.level.gridHeight && navGrid[checkY][checkX] === 0) {
                            startGrid.x = checkX; startGrid.y = checkY;
                            foundValidStart = true;
                            
                            break;
                        }
                    } if (foundValidStart) break;
                } if (foundValidStart) break;
            }
            if (!foundValidStart) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.error(`[${this.id} calculatePath] CRITICAL: No walkable start cell. Pathing aborted.`);
                this.isMoving = false; this.currentPath = []; return false;
            }
        } else if (navGrid[startGrid.y][startGrid.x] === 1 && isPhasingOverride) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} calculatePath] Phasing: Allowing path start from 'blocked' navGrid cell.`);
        }

        const rawPathGridCoords = findPath(startGrid, endGrid, navGrid, isPhasingOverride);

        if (rawPathGridCoords && rawPathGridCoords.length > 0) {
            this.currentPath = smoothPath(rawPathGridCoords, this.size, this.game.level);
            if (this.currentPath && this.currentPath.length > 0) {
                this.currentPathNodeIndex = 0; this.isMoving = true;
                // --- FIX: Skip the first path node if it's just the start grid center
                // and we're already very close to it. This prevents a 1-frame snap
                // that briefly faces the sprite in the wrong direction.
                if (this.currentPath.length > 1) {
                    const distToFirst = distance(this.x, this.y, this.currentPath[0].x, this.currentPath[0].y);
                    if (distToFirst < this.size * 0.5) {
                        this.currentPathNodeIndex = 1;
                    }
                }
                if (!this.manualTarget && !this.autoTarget && !this.isPlayerDirectFiring) { this.gunAimAngle = this.facingAngle; }
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} calculatePath] Path found (phasing: ${isPhasingOverride}). Smoothed len: ${this.currentPath.length}. isMoving=true.`);
                return true;
            }
        }
        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] No path found (phasing: ${isPhasingOverride}). isMoving=false.`);
        this.isMoving = false; this.currentPath = [];
        return false;
    }

    _handleMovement(deltaTime) {
        const originalX = this.x;
        const originalY = this.y;
        if (this.bumpRepathCooldown > 0) this.bumpRepathCooldown -= deltaTime;

        if (this.team === 'player' && this.isHoldingPosition && !(this instanceof RaccoonHostage) && !this.isPhasing) {
            this.isMoving = false; this.currentPath = []; this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }
        if (this instanceof RaccoonHostage && this.isHoldingPosition && !this.isPhasing) {
            this.isMoving = false; this.currentPath = []; this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }

        if (this.isPhasing) {
            if (this.isMoving && this.isAlive()) {
                const moveSpeed = this.speed * deltaTime;
                let targetXForPhasing, targetYForPhasing;
                if (this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                    const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
                    targetXForPhasing = nextNodeWorldCoords.x; targetYForPhasing = nextNodeWorldCoords.y;
                } else {
                    targetXForPhasing = this.worldTargetX; targetYForPhasing = this.worldTargetY;
                }
                const dxToTarget = targetXForPhasing - this.x; const dyToTarget = targetYForPhasing - this.y;
                const distToTarget = Math.hypot(dxToTarget, dyToTarget);
                if (distToTarget > this.size * 0.05) {
                    const moveRatio = Math.min(1, moveSpeed / (distToTarget || 1e-5));
                    this.x += dxToTarget * moveRatio; this.y += dyToTarget * moveRatio;
                } else {
                    if (this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                        this.x = targetXForPhasing; this.y = targetYForPhasing; this.currentPathNodeIndex++;
                        if (this.currentPathNodeIndex >= this.currentPath.length) {
                            this.isMoving = (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 0.1);
                            this.currentPath = [];
                        }
                    } else { this.x = this.worldTargetX; this.y = this.worldTargetY; this.isMoving = false; }
                }
                this.x = Math.max(this.size / 2, Math.min(this.x, (CONFIG.WORLD_WIDTH || 0) - this.size / 2));
                this.y = Math.max(this.size / 2, Math.min(this.y, (CONFIG.WORLD_HEIGHT || 0) - this.size / 2));
            }
            this.lastDeltaX = this.x - originalX; this.lastDeltaY = this.y - originalY;
            return;
        }

        if (!this.isAlive() || !this.isMoving) {
            if (!this.isAlive()) { this.isMoving = false; this.currentPath = []; }
            this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }

        if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
            this.isMoving = false; this.currentPath = []; this.currentPathNodeIndex = 0;
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < this.size) {
                this.x = this.worldTargetX; this.y = this.worldTargetY;
            }
            this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }

        const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
        const moveSpeed = this.speed * deltaTime;

        let obstaclesForCollision = [];
        if (this.game && this.game.level) {
            if (this.game.spatialGrid && this.game.level.obstacleSet) {
                const queryRadius = this.size / 2 + moveSpeed + 5;
                const nearbyObjects = this.game.spatialGrid.queryRange(this.x, this.y, queryRadius);
                obstaclesForCollision = nearbyObjects.filter(obj => this.game.level.obstacleSet.has(obj) && obj.blocksMovement && !obj.isDestroyed);
            } else {
                obstaclesForCollision = this.game.level.activeObstacles;
            }
        }

        const dxToNode = nextNodeWorldCoords.x - this.x; const dyToNode = nextNodeWorldCoords.y - this.y;
        const distToNextNode = Math.hypot(dxToNode, dyToNode);
        let desiredDeltaX = 0; let desiredDeltaY = 0;
        if (distToNextNode > 1e-5) {
            const moveRatio = Math.min(1, moveSpeed / distToNextNode);
            desiredDeltaX = dxToNode * moveRatio; desiredDeltaY = dyToNode * moveRatio;
        }
        let finalDeltaX = desiredDeltaX; let finalDeltaY = desiredDeltaY;

        if (this.isMoving && this.game) {
            const SEPARATION_CHECK_RADIUS = this.size * 1.5; const SEPARATION_FORCE_FACTOR = 0.9;
            const MIN_SEPARATION_DISTANCE_FACTOR = 0.95;
            let separationDX = 0; let separationDY = 0; let unitsInSeparationRange = 0;
            let unitsToConsiderForSeparation = [];

            // --- OPTIMIZATION: Use Spatial Grid for Separation ---
            let nearbyUnits = null;
            if (this.game.spatialGrid) {
                // Query slightly larger radius to be safe
                const queryRadius = SEPARATION_CHECK_RADIUS * 1.2;
                const gridObjects = this.game.spatialGrid.queryRange(this.x, this.y, queryRadius);
                nearbyUnits = gridObjects.filter(o => o instanceof Unit);
            } else {
                if (this.team === 'player') unitsToConsiderForSeparation = this.game.getLivingPlayerControlledUnits();
                else if (this.team === 'enemy') unitsToConsiderForSeparation = this.game.enemyUnits || [];
                nearbyUnits = unitsToConsiderForSeparation;
            }

            for (const otherUnit of nearbyUnits) {
                if (otherUnit === this || !otherUnit.isAlive() || otherUnit.isPhasing) continue;
                if (this.team === 'player' && otherUnit.team !== 'player') continue;
                if (this.team === 'enemy' && otherUnit.team !== 'enemy') continue;
                const distSq = (this.x - otherUnit.x) ** 2 + (this.y - otherUnit.y) ** 2;
                if (distSq === 0) continue;
                const combinedRadii = (this.size / 2) + (otherUnit.size / 2);
                const desiredSeparationDist = combinedRadii * MIN_SEPARATION_DISTANCE_FACTOR;
                if (distSq < (SEPARATION_CHECK_RADIUS * SEPARATION_CHECK_RADIUS) && distSq < (desiredSeparationDist * desiredSeparationDist)) {
                    const dist = Math.sqrt(distSq); const awayX = this.x - otherUnit.x; const awayY = this.y - otherUnit.y;
                    const overlap = desiredSeparationDist - dist; const pushStrength = (overlap / desiredSeparationDist);
                    separationDX += (awayX / dist) * pushStrength; separationDY += (awayY / dist) * pushStrength;
                    unitsInSeparationRange++;
                }
            }
            if (unitsInSeparationRange > 0) {
                const avgSeparationDX = separationDX / unitsInSeparationRange; const avgSeparationDY = separationDY / unitsInSeparationRange;
                const pushMagnitude = this.speed * SEPARATION_FORCE_FACTOR * deltaTime;
                finalDeltaX += avgSeparationDX * pushMagnitude; finalDeltaY += avgSeparationDY * pushMagnitude;
                const totalMovementMagnitude = Math.hypot(finalDeltaX, finalDeltaY);
                const originalDesiredMagnitude = Math.hypot(desiredDeltaX, desiredDeltaY);
                if (totalMovementMagnitude > originalDesiredMagnitude * 1.5 && originalDesiredMagnitude > 0.1) {
                    const scale = (originalDesiredMagnitude * 1.5) / totalMovementMagnitude;
                    finalDeltaX *= scale; finalDeltaY *= scale;
                } else if (totalMovementMagnitude > this.speed * deltaTime * 1.2) {
                    const scale = (this.speed * deltaTime * 1.2) / totalMovementMagnitude;
                    finalDeltaX *= scale; finalDeltaY *= scale;
                }
            }
        }

        let collisionOccurredThisFrame = false;
        if (distToNextNode > 1e-5) {
            const potentialNewX_combined = this.x + finalDeltaX;
            const potentialNewY_combined = this.y + finalDeltaY;
            const collisionCheckRadius = this.size / 2 + 1.2;
            const unitBodyShape_combined = { type: 'circle', x: potentialNewX_combined, y: potentialNewY_combined, radius: collisionCheckRadius };
            let isCollisionWithDesiredMove = false;
            for (const obs of obstaclesForCollision) {
                const obsCS = this.game.level._getObstacleCollisionShape(obs);
                const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_combined) : rectCircleOverlap(obsCS, unitBodyShape_combined))) ||
                    (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_combined)) ||
                    (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_combined, obsCS))) {
                    isCollisionWithDesiredMove = true; break;
                }
            }
            if (isCollisionWithDesiredMove) {
                collisionOccurredThisFrame = true;
                let canMoveX = false;
                if (Math.abs(finalDeltaX) > 1e-5) {
                    const unitBodyShape_X_Only = { type: 'circle', x: this.x + finalDeltaX, y: this.y, radius: collisionCheckRadius };
                    let collisionX = false;
                    for (const obs of obstaclesForCollision) {
                        const obsCS = this.game.level._getObstacleCollisionShape(obs);
                        const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                        if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_X_Only) : rectCircleOverlap(obsCS, unitBodyShape_X_Only))) ||
                            (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_X_Only)) ||
                            (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_X_Only, obsCS))) {
                            collisionX = true; break;
                        }
                    }
                    if (!collisionX) canMoveX = true;
                }
                let canMoveY = false;
                if (Math.abs(finalDeltaY) > 1e-5) {
                    const unitBodyShape_Y_Only = { type: 'circle', x: this.x, y: this.y + finalDeltaY, radius: collisionCheckRadius };
                    let collisionY = false;
                    for (const obs of obstaclesForCollision) {
                        const obsCS = this.game.level._getObstacleCollisionShape(obs);
                        const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                        if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_Y_Only) : rectCircleOverlap(obsCS, unitBodyShape_Y_Only))) ||
                            (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_Y_Only)) ||
                            (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_Y_Only, obsCS))) {
                            collisionY = true; break;
                        }
                    }
                    if (!collisionY) canMoveY = true;
                }
                if (canMoveX && !canMoveY) { finalDeltaY = 0; collisionOccurredThisFrame = false; }
                else if (!canMoveX && canMoveY) { finalDeltaX = 0; collisionOccurredThisFrame = false; }
                else if (canMoveX && canMoveY) {
                    const angleToNode = Math.atan2(dyToNode, dxToNode);
                    const angleOfXMove = (finalDeltaX >= 0) ? 0 : Math.PI;
                    const angleOfYMove = (finalDeltaY >= 0) ? Math.PI / 2 : -Math.PI / 2;
                    let diffX = Math.abs(angleToNode - angleOfXMove); if (diffX > Math.PI) diffX = 2 * Math.PI - diffX;
                    let diffY = Math.abs(angleToNode - angleOfYMove); if (diffY > Math.PI) diffY = 2 * Math.PI - diffY;
                    if (diffX < diffY - 1e-3 && Math.abs(finalDeltaX) > 1e-5) { finalDeltaY = 0; collisionOccurredThisFrame = false; }
                    else if (diffY < diffX - 1e-3 && Math.abs(finalDeltaY) > 1e-5) { finalDeltaX = 0; collisionOccurredThisFrame = false; }
                    else if (Math.abs(finalDeltaX) > Math.abs(finalDeltaY) + 1e-4 && Math.abs(finalDeltaX) > 1e-5) { finalDeltaY = 0; collisionOccurredThisFrame = false; }
                    else if (Math.abs(finalDeltaY) > 1e-5) { finalDeltaX = 0; collisionOccurredThisFrame = false; }
                    else { finalDeltaX = 0; finalDeltaY = 0; }
                } else { finalDeltaX = 0; finalDeltaY = 0; }
            }
        }

        this.x += finalDeltaX;
        this.y += finalDeltaY;

        const actualMovementMade = (Math.abs(this.x - originalX) > 1e-5 || Math.abs(this.y - originalY) > 1e-5);
        const attemptedToMoveFlag = (Math.abs(desiredDeltaX) > 1e-5 || Math.abs(desiredDeltaY) > 1e-5);
        const fullBlockEncountered = attemptedToMoveFlag && !actualMovementMade && collisionOccurredThisFrame;

        const distToNextNodeAfterMove = distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y);
        const arrivalTolerance = Math.max(moveSpeed * 0.3, this.size * 0.3);

        if (distToNextNodeAfterMove <= arrivalTolerance || (moveSpeed >= distToNextNode && distToNextNode > 1e-5 && Math.abs(finalDeltaX - desiredDeltaX) < 1e-4 && Math.abs(finalDeltaY - desiredDeltaY) < 1e-4)) {
            this.x = nextNodeWorldCoords.x; this.y = nextNodeWorldCoords.y;
            this.currentPathNodeIndex++;
            if (this.currentPathNodeIndex >= this.currentPath.length) {
                this.currentPath = []; this.currentPathNodeIndex = 0;
                if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < arrivalTolerance * 1.5) {
                    this.isMoving = false; this.x = this.worldTargetX; this.y = this.worldTargetY;
                } else if (this.isMoving) {
                    this.setMoveTarget(this.worldTargetX, this.worldTargetY, this.isPhasing);
                }
            }
        }
        else if (fullBlockEncountered && !(this instanceof RaccoonHostage) && this.isMoving) {
            if (this.bumpRepathCooldown <= 0) {
                this.bumpRepathCooldown = this.IMMEDIATE_BUMP_REPATH_COOLDOWN;

                const vecToNodeX = nextNodeWorldCoords.x - originalX;
                const vecToNodeY = nextNodeWorldCoords.y - originalY;
                const angleToNode = Math.atan2(vecToNodeY, vecToNodeX);

                const stepBackAngle = angleToNode + Math.PI;
                let nudgedX = originalX + Math.cos(stepBackAngle) * this.IMMEDIATE_BUMP_NUDGE_BACK_DISTANCE;
                let nudgedY = originalY + Math.sin(stepBackAngle) * this.IMMEDIATE_BUMP_NUDGE_BACK_DISTANCE;

                const sideStepAngleOffset = Math.PI / 2;
                const sideNudgeAngle = angleToNode + (this.lastNudgeWasLeft ? -sideStepAngleOffset : sideStepAngleOffset);
                this.lastNudgeWasLeft = !this.lastNudgeWasLeft;

                nudgedX += Math.cos(sideNudgeAngle) * this.IMMEDIATE_BUMP_NUDGE_SIDE_DISTANCE;
                nudgedY += Math.sin(sideNudgeAngle) * this.IMMEDIATE_BUMP_NUDGE_SIDE_DISTANCE;

                let canNudgeToSpot = true;
                const nudgedShape = { type: 'circle', x: nudgedX, y: nudgedY, radius: this.size / 2 + 0.5 };
                for (const obs of obstaclesForCollision) {
                    const obsCS = this.game.level._getObstacleCollisionShape(obs);
                    const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                    if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, nudgedShape) : rectCircleOverlap(obsCS, nudgedShape))) ||
                        (obsCS.type === 'circle' && circleOverlap(obsCS, nudgedShape)) ||
                        (obsCS.type === 'ellipse' && circleEllipseOverlap(nudgedShape, obsCS))) {
                        canNudgeToSpot = false; break;
                    }
                }

                if (canNudgeToSpot) {
                    this.x = nudgedX; this.y = nudgedY;
                } else {
                    this.x = originalX; this.y = originalY;
                }

                if (this.worldTargetX !== undefined && this.worldTargetY !== undefined) {

                    // --- OPTIMIZATION Phase 2: "Wait and See" + Throttled Repath ---
                    const distToTarget = distance(this.x, this.y, this.worldTargetX, this.worldTargetY);
                    const isCloseToTarget = distToTarget < this.size * 3;

                    if (isCloseToTarget) {
                        // If we are close (likely crowded around player), DON'T REPATH immediately.
                        // Just wait. A spot might open up.
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Bumped close to target. Waiting instead of repathing.`);
                    } else if (this.repathCooldown <= 0) {
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Recalculating path after immediate bump to: (${this.worldTargetX.toFixed(0)}, ${this.worldTargetY.toFixed(0)})`);

                        this.calculatePath(this.game.level.worldToGridCoords(this.x, this.y), this.isPhasing);

                        // Set a random cooldown to prevent swarm sync (0.5s - 1.5s)
                        this.repathCooldown = 0.5 + Math.random();
                    } else {
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Bumped but repath on cooldown. Waiting.`);
                    }
                }
            } else {
                this.x = originalX; this.y = originalY;
            }
        }

        const worldW = CONFIG.WORLD_WIDTH || 0; const worldH = CONFIG.WORLD_HEIGHT || 0;
        this.x = Math.max(this.size / 2, Math.min(this.x, worldW - this.size / 2));
        this.y = Math.max(this.size / 2, Math.min(this.y, worldH - this.size / 2));

        this.lastDeltaX = this.x - originalX;
        this.lastDeltaY = this.y - originalY;
    }

    setFacingToward(worldX, worldY) {
        if (distance(this.x, this.y, worldX, worldY) > 0.1) {
            this.facingAngle = Math.atan2(worldY - this.y, worldX - this.x);
            this.updateVisualDirection(this.facingAngle);
            this.gunAimAngle = this.facingAngle;
        }
    }

    setMoveTarget(worldX, worldY) {
        if (this.isPlayerDirectFiring) this.isPlayerDirectFiring = false;
        if (this.actionTimer > 0 && !(this instanceof Raccoon && this.isAimingGrenade)) return false;

        if (this.team === 'player' && this.isHoldingPosition && !(this instanceof RaccoonHostage)) {
            this.isHoldingPosition = false;
            if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        }

        if (this.team === 'player') this.autoTarget = null; else this.autoTarget = null;

        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] No navGrid available.`);
            this.isMoving = false; this.currentPath = []; return false;
        }

        let conceptualStartGrid = this.game.level.worldToGridCoords(this.x, this.y);
        if (!this.isPhasing &&
            (conceptualStartGrid.x < 0 || conceptualStartGrid.x >= this.game.level.gridWidth ||
                conceptualStartGrid.y < 0 || conceptualStartGrid.y >= this.game.level.gridHeight ||
                navGrid[conceptualStartGrid.y][conceptualStartGrid.x] === 1)) {
            let foundValidStart = false; const searchRadius = 2;
            for (let r = 1; r <= searchRadius && !foundValidStart; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx === 0 && dy === 0 && r > 1) continue;
                        const checkX = conceptualStartGrid.x + dx; const checkY = conceptualStartGrid.y + dy;
                        if (checkX >= 0 && checkX < this.game.level.gridWidth && checkY >= 0 && checkY < this.game.level.gridHeight && navGrid[checkY][checkX] === 0) {
                            conceptualStartGrid = { x: checkX, y: checkY }; foundValidStart = true;
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Alt start: (${checkX},${checkY})`);
                            break;
                        }
                    } if (foundValidStart) break;
                } if (foundValidStart) break;
            }
            if (!foundValidStart) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.error(`[${this.id} setMoveTarget] CRITICAL: No walkable start cell.`);
                this.isMoving = false; this.currentPath = []; return false;
            }
        }

        const clampedWorldX = Math.max(this.size / 2, Math.min(worldX, CONFIG.WORLD_WIDTH - this.size / 2));
        const clampedWorldY = Math.max(this.size / 2, Math.min(worldY, CONFIG.WORLD_HEIGHT - this.size / 2));
        let targetGridX = Math.floor(clampedWorldX / this.game.level.gridCellSize);
        let targetGridY = Math.floor(clampedWorldY / this.game.level.gridCellSize);
        let finalWorldTargetX = clampedWorldX; let finalWorldTargetY = clampedWorldY;

        if (targetGridX < 0 || targetGridX >= this.game.level.gridWidth || targetGridY < 0 || targetGridY >= this.game.level.gridHeight) {
            this.isMoving = false; this.currentPath = []; this.worldTargetX = this.x; this.worldTargetY = this.y; return false;
        }

        if (navGrid[targetGridY][targetGridX] === 1 && !this.isPhasing) {
            let foundAlternative = false;

            let dx = conceptualStartGrid.x - targetGridX;
            let dy = conceptualStartGrid.y - targetGridY;
            const dist = Math.hypot(dx, dy);

            if (dist > 1) {
                dx /= dist;
                dy /= dist;

                for (let i = 0; i < dist; i++) {
                    const checkX = Math.round(targetGridX + dx * i);
                    const checkY = Math.round(targetGridY + dy * i);

                    if (checkX >= 0 && checkX < this.game.level.gridWidth &&
                        checkY >= 0 && checkY < this.game.level.gridHeight) {

                        if (navGrid[checkY][checkX] === 0) {
                            const altWorldCoords = this.game.level.gridToWorldCoords(checkX, checkY);
                            finalWorldTargetX = altWorldCoords.x;
                            finalWorldTargetY = altWorldCoords.y;
                            foundAlternative = true;
                            break;
                        }
                    }
                }
            }

            if (!foundAlternative) { this.isMoving = false; this.currentPath = []; this.worldTargetX = this.x; this.worldTargetY = this.y; return false; }
        }

        this.worldTargetX = finalWorldTargetX; this.worldTargetY = finalWorldTargetY;

        if (this.calculatePath(conceptualStartGrid, this.isPhasing)) {
            return true;
        } else {
            if (this.isPhasing && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 0.1) {
                this.isMoving = true;
                this.currentPath = [];
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Pathing failed during phase, will attempt direct move. isMoving: ${this.isMoving}`);
                return true;
            }
            this.isMoving = false;
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] calculatePath returned false. Move command failed.`);
            return false;
        }
    }

    setManualTarget(target) {
        if (this.isPlayerDirectFiring) this.isPlayerDirectFiring = false;
        this.manualTarget = target; this.autoTarget = null;
        if (target && target.isAlive()) {
            if (distance(this.x, this.y, target.x, target.y) > 0.1) {
                this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
            }
        }
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if ((this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;

        // --- OPTIMIZATION: Throttle target checks ---
        if (this.targetAcquisitionTimer > 0) {
            this.targetAcquisitionTimer -= deltaTime;
        }

        if (!this.manualTarget || !this.manualTarget.isAlive()) {
            if (this.targetAcquisitionTimer <= 0) {
                const potentialTargets = this.game.getLivingPlayerControlledUnits();
                this.findAutoTarget(potentialTargets, obstacles);
                this.targetAcquisitionTimer = 0.2 + Math.random() * 0.1; // Check ~3-5 times/sec
            }
        }
    }

    _handlePlayerCombat(deltaTime, obstacles) {
        if (this.isPlayerDirectFiring || (this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;

        if (this.manualTarget && this.manualTarget.isAlive()) {
            this.autoTarget = null;
            return;
        } else if (this.manualTarget && !this.manualTarget.isAlive()) {
            this.manualTarget = null;
        }

        // --- OPTIMIZATION: Throttle target checks ---
        if (this.targetAcquisitionTimer > 0) {
            this.targetAcquisitionTimer -= deltaTime;
            if (this.autoTarget && this.autoTarget.isAlive()) {
                return;
            }
        }

        if (this.targetAcquisitionTimer <= 0) {
            const potentialTargets = this.game.enemyUnits;
            this.findAutoTarget(potentialTargets, obstacles);
            this.targetAcquisitionTimer = 0.2 + Math.random() * 0.1;
        }
    }

    findAutoTarget(potentialTargets, obstacles) {
        let closestTarget = null;
        let engagementRange = (this.weapon ? this.weapon.range : (this.detectionRange || 150));

        if (this.team === 'player' && this instanceof Raccoon && this.weapon) {
            if (!this.isMoving) {
                engagementRange = this.weapon.range;
            } else {
                const autoTargetRangeFactor = CONFIG.RACCOON_AUTO_TARGET_RANGE_FACTOR;
                if (typeof autoTargetRangeFactor === 'number' && autoTargetRangeFactor > 0 && autoTargetRangeFactor <= 1) {
                    engagementRange = this.weapon.range * autoTargetRangeFactor;
                }
            }
        }

        // Night mission: reduce detection ranges
        if (this.game && this.game.isNightMission && CONFIG.NIGHT_MISSION) {
            const nightCfg = CONFIG.NIGHT_MISSION;
            if (this.team === 'enemy') {
                const enemyMult = nightCfg.ENEMY_DETECTION_MULTIPLIER !== undefined ? nightCfg.ENEMY_DETECTION_MULTIPLIER : 0.45;
                engagementRange *= enemyMult;
            } else if (this.team === 'player') {
                const playerMult = nightCfg.PLAYER_DETECTION_MULTIPLIER !== undefined ? nightCfg.PLAYER_DETECTION_MULTIPLIER : 0.70;
                engagementRange *= playerMult;
            }
        }

        let minDistanceSq = engagementRange ** 2;
        if (!potentialTargets || !Array.isArray(potentialTargets)) { this.autoTarget = null; return; }
        const activeObstacles = Array.isArray(obstacles) ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];
        potentialTargets.forEach(target => {
            if (target && target.isAlive() && target.team !== this.team && target.team !== 'neutral') {
                const dx = target.x - this.x; const dy = target.y - this.y;
                const dSq = dx * dx + dy * dy;
                if (dSq <= minDistanceSq) {
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, activeObstacles, this.game.level, false)) {
                        if (!closestTarget || dSq < minDistanceSq) {
                            closestTarget = target; minDistanceSq = dSq;
                        }
                    }
                }
            }
        });
        this.autoTarget = closestTarget;
    }

    _executeFire(pointX, pointY) {
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) return;
        if (this.team === 'player' && this.isHoldingFire && !this.isPlayerDirectFiring) return;
        if (this.isMoving && !this.canShootWhileMoving && !this.isPlayerDirectFiring) return;

        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) { baseAccuracy += this.accuracyBonus; }

        // Night mission: reduce enemy accuracy
        if (this.team === 'enemy' && this.game && this.game.isNightMission && CONFIG.NIGHT_MISSION) {
            const nightAccPenalty = CONFIG.NIGHT_MISSION.ENEMY_NIGHT_ACCURACY_PENALTY !== undefined
                ? CONFIG.NIGHT_MISSION.ENEMY_NIGHT_ACCURACY_PENALTY : -0.15;
            baseAccuracy += nightAccPenalty;
        }

        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy));

        const fireAngle = Math.atan2(pointY - this.y, pointX - this.x);

        if (this.game && this.game.addVisualEffect) {
            const muzzleOffset = this.size / 2 + 17;
            const muzzleX = this.x + Math.cos(fireAngle) * muzzleOffset;
            const muzzleY = this.y + Math.sin(fireAngle) * muzzleOffset;
            this.game.addVisualEffect('muzzle_flash', { x: muzzleX, y: muzzleY, scale: this.weapon.muzzleFlashScale });
        }

        const projectile = this.game.getProjectileFromPool(this.x, this.y, this.x + Math.cos(fireAngle) * this.weapon.range, this.y + Math.sin(fireAngle) * this.weapon.range, this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this, effectiveAccuracy);
        this.game.addProjectile(projectile);
        const baseCooldown = 1 / this.weapon.rof;
        const jitterPercentage = (CONFIG.WEAPON_SETTINGS && CONFIG.WEAPON_SETTINGS.ROF_JITTER_PERCENTAGE !== undefined) ? CONFIG.WEAPON_SETTINGS.ROF_JITTER_PERCENTAGE : 0;
        const jitter = Math.random() * baseCooldown * jitterPercentage;
        this.attackCooldown = baseCooldown + jitter;
        if (this.weapon.sfxFireKey && this.game && this.game.audioManager) {
            const sfxConfig = CONFIG.AUDIO_ASSETS[this.weapon.sfxFireKey];
            if (sfxConfig) { this.game.audioManager.play(this.weapon.sfxFireKey, { volume: sfxConfig.defaultVolume, pitchVariation: sfxConfig.pitchVariation }); }
        }
    }

    fireAtPoint(pointX, pointY) {
        if (this.isPlayerDirectFiring) this.isPlayerDirectFiring = false;
        this._executeFire(pointX, pointY);
        this.manualTarget = null; this.autoTarget = null;
    }

    takeDamage(amount, attackerUnit = null) {
        if (!this.isAlive()) return;

        if (this.game && this.game.addVisualEffect && attackerUnit) {
            const impactAngle = Math.atan2(this.y - attackerUnit.y, this.x - attackerUnit.x);
            this.game.addVisualEffect('blood', { x: this.x, y: this.y, angle: impactAngle });
        }

        const prevHp = this.hp;
        this.hp -= amount;
        let died = false;

        if (this.hp <= 0) {
            this.hp = 0;
            died = true;
            if (attackerUnit && attackerUnit.team === 'player' && typeof attackerUnit.addXp === 'function') {
                let killXp = CONFIG.XP_PER_KILL || 10;
                if (this instanceof PossumHeavy) killXp += (CONFIG.XP_PER_HEAVY_KILL || 15);
                attackerUnit.addXp(killXp);
                if (typeof attackerUnit.incrementKillCount === 'function') attackerUnit.incrementKillCount();
            }
            this.die();
        }

        if (!died && this.team === 'enemy' && attackerUnit && attackerUnit.team === 'player') {
            let becameAware = false;
            const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.blocksMovement);
            const hasLOSToAttacker = hasLineOfSight(this.x, this.y, attackerUnit.x, attackerUnit.y, activeObstacles, this.game.level, false);
            if (this.manualTarget !== attackerUnit) { this.manualTarget = attackerUnit; becameAware = true; }
            else { becameAware = true; }
            this.lastKnownPlayerPosition = { x: attackerUnit.x, y: attackerUnit.y };
            const alertDmgThreshold = this.maxHp * (CONFIG.ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT || 0.10);
            if (becameAware || (amount >= alertDmgThreshold) || (prevHp === this.maxHp && amount > 0)) {
                this.propagateAlert(attackerUnit);
            }
        }

        if (!died && this.game && this.game.ui && this.team === 'player') {
            this.game.ui.updateSquadPanel();
        }
    }

    propagateAlert(sourceOfAlertUnit = null) {
        if (!this.isAlive() || this.team !== 'enemy' || !this.game || !this.game.enemyUnits) return;

        let alertRadius = CONFIG.ENEMY_ALERT_PROPAGATION_RADIUS || 180;

        // Night mission: reduce alert propagation distance
        if (this.game.isNightMission && CONFIG.NIGHT_MISSION) {
            const nightAlertMult = CONFIG.NIGHT_MISSION.ENEMY_NIGHT_ALERT_MULTIPLIER !== undefined
                ? CONFIG.NIGHT_MISSION.ENEMY_NIGHT_ALERT_MULTIPLIER : 0.65;
            alertRadius *= nightAlertMult;
        }

        this.game.enemyUnits.forEach(otherEnemy => {
            if (otherEnemy && otherEnemy.isAlive() && otherEnemy !== this && (otherEnemy.aiState === 'PATROLLING' || otherEnemy.aiState === 'GUARDING')) {
                const distToOtherEnemy = distance(this.x, this.y, otherEnemy.x, otherEnemy.y);
                if (distToOtherEnemy <= alertRadius) {
                    otherEnemy.alertedByAlly = true;
                    if (sourceOfAlertUnit && sourceOfAlertUnit.isAlive()) {
                        otherEnemy.lastKnownPlayerPosition = { x: sourceOfAlertUnit.x, y: sourceOfAlertUnit.y };
                        otherEnemy.manualTarget = sourceOfAlertUnit;
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === otherEnemy.id) console.log(`[${otherEnemy.id}] Alerted by ${this.id}. Target: ${sourceOfAlertUnit.id}.`);
                    } else {
                        otherEnemy.lastKnownPlayerPosition = { x: this.x, y: this.y }; otherEnemy.aiState = 'SUSPICIOUS';
                    }
                }
            }
        });
    }

    die() {
        this.manualTarget = null; this.autoTarget = null; this.isMoving = false; this.currentPath = [];
        this.isPlayerDirectFiring = false; this.isHoldingPosition = false; this.isHoldingFire = false;
        const wasSelected = this.game && this.game.selectedUnits.includes(this);
        if (this instanceof Raccoon && this.isAimingGrenade) this.cancelGrenadeAim();
        if (this.game && this.game.selectedUnits.includes(this)) {
            this.game.selectedUnits = this.game.selectedUnits.filter(unit => unit !== this);
        }
        if (this.team === 'player' && this.game && typeof this.game.recordRaccoonFallen === 'function' && !(this instanceof RaccoonHostage)) {
            this.game.recordRaccoonFallen(this);
        }
        if (wasSelected && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }

    isAlive() {
        return this.hp > 0;
    }

    render(ctx) {
        const kiaStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.KIA_STYLE;
        const facingIndicatorStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.FACING_INDICATOR;
        const bobbingConfig = CONFIG.UNIT_VISUALS;

        let yOffset = 0;
        const isActuallyMoving = this.isMoving && (Math.abs(this.lastDeltaX) > 1e-6 || Math.abs(this.lastDeltaY) > 1e-6);
        if (isActuallyMoving && this.isAlive() && bobbingConfig && bobbingConfig.UNIT_BOBBING_ENABLED) {
            yOffset = Math.sin(this.bobbingCounter) * bobbingConfig.UNIT_BOBBING_AMPLITUDE;
        }

        ctx.save();
        ctx.translate(this.x, this.y + yOffset);

        if (this.isPhasing) {
            ctx.globalAlpha = CONFIG.UNIT_VISUALS.UNIT_PHASING_OPACITY || 0.5;
        }

        if (this.isAlive() && this.game.isDebugVisualsActive && CONFIG.DEBUG_DRAW_UNIT_PATHING_BOUNDS) {
            const pathingRadius = (this.size / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, pathingRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        if (!this.isAlive() && this.currentVisualState !== 'death') {
            this.currentVisualState = 'death';
        }

        let spriteToDraw = null;
        let spriteScale = this.spriteScaleFactor;
        let spriteWidth = 0;
        let spriteHeight = 0;
        let drawOffsetX = -this.size / 2;
        let drawOffsetY = -this.size / 2;

        if (this.isAlive()) {
            let actionFolder = this.currentVisualState;
            let spriteKey = `${this.spriteBaseName}_${actionFolder}_${this.currentVisualDirection}`;
            spriteToDraw = this.game.preloadedImages[spriteKey];
            
            
            if (!spriteToDraw && actionFolder !== 'idle') {
                spriteKey = `${this.spriteBaseName}_idle_${this.currentVisualDirection}`;
                spriteToDraw = this.game.preloadedImages[spriteKey];
            }
            if (!spriteToDraw) {
                const ultimateFallbackSpriteKey = `${this.spriteBaseName}_idle_s`;
                spriteToDraw = this.game.preloadedImages[ultimateFallbackSpriteKey];
            }

            if (spriteToDraw) {
                spriteWidth = spriteToDraw.naturalWidth * spriteScale;
                spriteHeight = spriteToDraw.naturalHeight * spriteScale;
                drawOffsetX = -spriteWidth / 2;
                drawOffsetY = -spriteHeight / 2;
            }
        } else {
            const deadSpriteConfigPath = this.deadSpritePathKey ? CONFIG[this.deadSpritePathKey] : null;
            const deadSpriteConfigFiles = this.deadSpriteFilesKey ? CONFIG[this.deadSpriteFilesKey] : null;
            const deadSpriteScaleValue = this.deadSpriteScaleKey ? CONFIG[this.deadSpriteScaleKey] : this.spriteScaleFactor;
            spriteScale = deadSpriteScaleValue !== undefined ? deadSpriteScaleValue : this.spriteScaleFactor;

            if (!this.assignedDeadSpritePath && deadSpriteConfigPath && deadSpriteConfigFiles && deadSpriteConfigFiles.length > 0) {
                const randomDeadFile = deadSpriteConfigFiles[Math.floor(Math.random() * deadSpriteConfigFiles.length)];
                this.assignedDeadSpritePath = deadSpriteConfigPath + randomDeadFile;
                this.deathRotationAngle = (Math.random() - 0.5) * 0.5;
            }

            if (this.assignedDeadSpritePath) {
                spriteToDraw = this.game.preloadedImages[this.assignedDeadSpritePath];
            }

            if (spriteToDraw) {
                spriteWidth = spriteToDraw.naturalWidth * spriteScale;
                spriteHeight = spriteToDraw.naturalHeight * spriteScale;
                drawOffsetX = -spriteWidth / 2;
                drawOffsetY = -spriteHeight * 0.8 + (this.size / 2);
                ctx.rotate(this.deathRotationAngle);
            }
        }

        if (spriteToDraw) {
            ctx.drawImage(spriteToDraw, drawOffsetX, drawOffsetY, spriteWidth, spriteHeight);
        } else {
            let originalAlpha = ctx.globalAlpha;
            if (!this.isAlive()) {
                ctx.fillStyle = this.team === 'player' ? (kiaStyle && kiaStyle.PLAYER_FILL_COLOR || 'darkgrey') : (kiaStyle && kiaStyle.ENEMY_FILL_COLOR || '#555');
                const baseOpacity = (kiaStyle && kiaStyle.OPACITY !== undefined) ? kiaStyle.OPACITY : 0.6;
                ctx.globalAlpha = this.isPhasing ? Math.min(originalAlpha, baseOpacity) : baseOpacity;
            } else {
                ctx.fillStyle = this.color;
            }
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = originalAlpha;
        }

        if (!this.isAlive() && spriteToDraw) {
            ctx.rotate(-this.deathRotationAngle);
        }
        if (this.isPhasing) {
            ctx.globalAlpha = 1.0;
        } else if (!this.isAlive() && kiaStyle && kiaStyle.OPACITY !== undefined) {
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (this.isAlive() && CONFIG.UNIT_VISUALS.DRAW_GUN_AIM_INDICATOR && facingIndicatorStyle) {
            ctx.strokeStyle = facingIndicatorStyle.COLOR || 'black';
            ctx.lineWidth = facingIndicatorStyle.LINE_WIDTH || 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.size * 1.2 * Math.cos(this.gunAimAngle), this.size * 1.2 * Math.sin(this.gunAimAngle));
            ctx.stroke();
        }

        ctx.restore();

        if (this.isAlive() && CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR) {
            const healthBarStyle = CONFIG.UI_SETTINGS.HEALTH_BAR;
            const barWidth = this.size * (healthBarStyle.WIDTH_MULTIPLIER || 1.5);
            const barX = this.x - barWidth / 2;
            const hpBarHeight = healthBarStyle.HEIGHT || 4;
            const spriteVisualHeight = spriteToDraw ? spriteHeight : this.size;
            const barY = (this.y + yOffset) - (spriteVisualHeight / 2) - (healthBarStyle.Y_OFFSET_BASE || 0) - hpBarHeight - 5;
            const hpPercent = this.hp / this.maxHp;

            if (this.game && this.game.selectedUnits && this.game.selectedUnits.includes(this)) {
                this.game.ctx.strokeStyle = 'rgba(0, 150, 255, 0.9)';
                this.game.ctx.lineWidth = 2;
                this.game.ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, hpBarHeight + 4);
            }

            this.game.ctx.fillStyle = healthBarStyle.BG_COLOR || '#333333';
            this.game.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, hpBarHeight + 2);

            let fillColor = healthBarStyle.HP_COLOR_FULL || '#00CC00';
            if (hpPercent < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3)) {
                fillColor = healthBarStyle.HP_COLOR_LOW || '#CC0000';
            } else if (hpPercent < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) {
                fillColor = healthBarStyle.HP_COLOR_MEDIUM || '#CCCC00';
            }
            this.game.ctx.fillStyle = fillColor;
            this.game.ctx.fillRect(barX, barY, barWidth * hpPercent, hpBarHeight);
        }
    }
}