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
        this.velocitySampleTime = CONFIG.PATHFINDING.STUCK_VELOCITY_SAMPLE_TIME;
        this.timeSinceLastVelocitySample = 0;

        this.lastDeltaX = 0;
        this.lastDeltaY = 0;

        this.hovers = false;
        this.hoverVelocityX = 0;
        this.hoverVelocityY = 0;

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

        const initialDelay = (this.weapon && this.team === 'enemy') ? Math.random() * (1 / this.weapon.rof) : 0;
        this.attackCooldown = initialDelay; this.actionTimer = 0; this.isMarkedForDeletion = false;
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
        this.IMMEDIATE_BUMP_REPATH_COOLDOWN = CONFIG.PATHFINDING.BUMP_REPATH_COOLDOWN;
        this.bumpRepathCooldown = 0;

        this.overlapEscapeCooldown = 0;
        this.overlapStuckFrames = 0;
        this._lastOverlapEscapeDir = { x: 0, y: 0 };
        this._overlapEscapeFramesLeft = 0;
        this.obstacleStuckFrames = 0;

        this._slideDirX = 0;
        this._slideDirY = 0;
        this._slideFramesLeft = 0;

        this.stuckFrameCounter = 0;
        this.repathFailCount = 0;
        this.stuckSpeechTimer = 0;
        this.stuckSpeechCooldown = 0;
        this.stuckMovementThreshold = this.speed * CONFIG.PATHFINDING.STUCK_MOVEMENT_THRESHOLD_FACTOR;
        this.consecutiveStuckAttempts = 0;
        this.lastOnStuckTime = 0;
        this.STUCK_RECOVERY_COOLDOWN_INTERNAL = CONFIG.PATHFINDING.STUCK_RECOVERY_COOLDOWN;
        this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL = CONFIG.PATHFINDING.MAX_CONSECUTIVE_STUCK_ATTEMPTS;
        this.repathFailCooldown = 0;
        this.unitBlockWaitTimer = 0;
        this._lastBlockedByUnit = 0;

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
        } else if (this instanceof PossumBoss3) {
            this.spriteBaseName = 'possum_boss_3';
            this.spriteScaleFactor = CONFIG.POSSUM_BOSS_3_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumBoss4) {
            this.spriteBaseName = 'possum_boss_4';
            this.spriteScaleFactor = CONFIG.POSSUM_BOSS_4_SPRITE_SCALE_FACTOR || 1.0;
        } else if (this instanceof PossumEliteGuard) {
            this.spriteBaseName = 'possum_eliteGuard';
            this.spriteScaleFactor = CONFIG.POSSUM_ELITE_GUARD_SPRITE_SCALE_FACTOR || 1.0;
        }
        // --- MODIFICATION END ---

        this.updateVisualDirection(this.facingAngle);

        this.assignedDeadSpritePath = null;
        this.deathRotationAngle = 0;

        // --- OPTIMIZATION: Throttle target checks ---
        this.targetAcquisitionTimer = Math.random() * 0.5;

        // --- OPTIMIZATION Phase 2: Repath Cooldown ---
        this.repathCooldown = 0;
        this.speechCooldown = Math.random() * 5;
        this.idleChatterTimer = SPEECH_CONFIG.GLOBAL.IDLE_CHATTER_INTERVAL_MIN +
            Math.random() * (SPEECH_CONFIG.GLOBAL.IDLE_CHATTER_INTERVAL_MAX - SPEECH_CONFIG.GLOBAL.IDLE_CHATTER_INTERVAL_MIN);
        this.furbyTimer = Math.random() * SPEECH_CONFIG.GLOBAL.FURBY_COOLDOWN;

        this.formationGroup = null; // Units in the same formation move group - don't avoid each other during pathfinding
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
                if (this.isMoving && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * CONFIG.PATHFINDING.SKIP_FIRST_NODE_DIST_FACTOR) {
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
        if (isActuallyMovingForBobbing && this.isAlive() && !this.hovers) {
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
            this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

            if (!(this instanceof PossumBoss1) && !(this instanceof PossumBoss3) && !(this instanceof PossumBoss4) && !(this instanceof PossumEliteGuard)) {
                const fireAtX = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.x : target.x;
                const fireAtY = this.isPlayerDirectFiring ? this.playerDirectFireTargetPos.y : target.y;
                this._executeFire(fireAtX, fireAtY);
            }

        } else if (hasTarget && isOrderedToFire) {
            this.currentVisualState = 'idle';
            this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);
        } else if (isActuallyMovingForBobbing) {
            this.currentVisualState = 'walk';
            const movedDist = Math.hypot(this.lastDeltaX, this.lastDeltaY);
            // Only turn the sprite if we moved more than a trivial snap distance.
            // This prevents the 1-frame South flash when smoothing snaps us to the first grid center.
            if (movedDist > 0.5) {
                this.facingAngle = lerpAngle(this.facingAngle, Math.atan2(this.lastDeltaY, this.lastDeltaX), this.turnRate * deltaTime);
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

    _attemptDesperateMove() {
        if (!this.game || !this.game.level) return false;
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) return false;
        const cellSize = this.game.level.gridCellSize;
        const radius = (this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL || CONFIG.PATHFINDING.DESPERATE_STUCK_MOVE_RADIUS_CELLS) * cellSize;
        const currentGrid = this.game.level.worldToGridCoords(this.x, this.y);
        for (let attempt = 0; attempt < 16; attempt++) {
            const angle = (attempt / 16) * Math.PI * 2;
            const dist = radius * (0.5 + Math.random() * 0.5);
            const tryX = this.x + Math.cos(angle) * dist;
            const tryY = this.y + Math.sin(angle) * dist;
            const tryGrid = this.game.level.worldToGridCoords(tryX, tryY);
            if (tryGrid.x >= 0 && tryGrid.x < this.game.level.gridWidth &&
                tryGrid.y >= 0 && tryGrid.y < this.game.level.gridHeight &&
                navGrid[tryGrid.y][tryGrid.x] === 0) {
                if (this.game.level.isSpawnPointClear(tryX, tryY, this.size, this.game.level.obstacles)) {
                    this.worldTargetX = tryX;
                    this.worldTargetY = tryY;
                    if (this.calculatePath(null, false)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    onStuck(reason = 'unknown') {
    }

    getCollisionShape() {
        return { type: 'circle', x: this.x, y: this.y, radius: this.size / 2 };
    }

    calculatePath(explicitStartGrid = null, isPhasingOverride = false, excludeUnits = null) {
        if (!this.game || !this.game.level) { this.isMoving = false; this.currentPath = []; this.clearFormationState(); return false; }
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) { this.isMoving = false; this.currentPath = []; this.clearFormationState(); return false; }

        const startGrid = explicitStartGrid || this.game.level.worldToGridCoords(this.x, this.y);
        const endGrid = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);

        if (startGrid.x < 0 || startGrid.x >= this.game.level.gridWidth || startGrid.y < 0 || startGrid.y >= this.game.level.gridHeight ||
            endGrid.x < 0 || endGrid.x >= this.game.level.gridWidth || endGrid.y < 0 || endGrid.y >= this.game.level.gridHeight) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Start/End grid out of bounds.`);
            this.isMoving = false; this.currentPath = []; this.clearFormationState(); return false;
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
                this.isMoving = false; this.currentPath = []; this.clearFormationState(); return false;
            }
        } else         if (navGrid[startGrid.y][startGrid.x] === 1 && isPhasingOverride) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} calculatePath] Phasing: Allowing path start from 'blocked' navGrid cell.`);
        }

        if (navGrid[endGrid.y][endGrid.x] === 1 && !isPhasingOverride) {
            let bestX = -1, bestY = -1, bestDistSq = Infinity;
            for (let r = 1; r <= CONFIG.PATHFINDING.ENDPOINT_WALKABLE_SEARCH_RADIUS; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ax = endGrid.x + dx;
                        const ay = endGrid.y + dy;
                        if (ax >= 0 && ax < this.game.level.gridWidth && ay >= 0 && ay < this.game.level.gridHeight && navGrid[ay][ax] === 0) {
                            const dSq = (ax - startGrid.x) * (ax - startGrid.x) + (ay - startGrid.y) * (ay - startGrid.y);
                            if (dSq < bestDistSq) {
                                bestDistSq = dSq;
                                bestX = ax;
                                bestY = ay;
                            }
                        }
                    }
                }
            }
            if (bestX >= 0) {
                endGrid.x = bestX;
                endGrid.y = bestY;
            } else {
                endGrid.x = startGrid.x;
                endGrid.y = startGrid.y;
            }
        }

         const rawPathGridCoords = findPath(startGrid, endGrid, navGrid, isPhasingOverride);

         if (rawPathGridCoords && rawPathGridCoords.length > 0) {
             if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                 let blockedByUnitCount = 0;
                 for (const unit of [
                     ...(this.game.getLivingPlayerControlledUnits?.() || []),
                     ...(this.game.enemyUnits || []),
                     ...(this.game.hostageUnits || [])
                 ]) {
                     if (unit === this || !unit.isAlive() || unit.isPhasing) continue;
                     for (const pt of rawPathGridCoords) {
                         const wx = pt.x * this.game.level.gridCellSize + this.game.level.gridCellSize / 2;
                         const wy = pt.y * this.game.level.gridCellSize + this.game.level.gridCellSize / 2;
                         const dx = wx - unit.x;
                         const dy = wy - unit.y;
                         if (dx * dx + dy * dy < (unit.size * 0.5 + 10) * (unit.size * 0.5 + 10)) {
                             blockedByUnitCount++;
                             break;
                         }
                     }
                 }
                 console.log(`[${this.id} calculatePath] Raw A* path: ${rawPathGridCoords.length} nodes, ${blockedByUnitCount} nodes inside unit radii`);
             }
             this.currentPath = smoothPath(rawPathGridCoords, this.size, this.game.level, { x: this.x, y: this.y });
            if (this.currentPath && this.currentPath.length > 0) {
                this.currentPath = deflatePath(this.currentPath, this.size / 2, this.game.level);
                this.currentPathNodeIndex = 0; this.isMoving = true;
                if (!this.manualTarget && !this.autoTarget && !this.isPlayerDirectFiring) { this.gunAimAngle = this.facingAngle; }
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} calculatePath] Path found (phasing: ${isPhasingOverride}). Smoothed len: ${this.currentPath.length}. isMoving=true.`);
                return true;
            }
        }
        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] No path found (phasing: ${isPhasingOverride}). isMoving=false.`);
        this.isMoving = false; this.currentPath = []; this.clearFormationState();
        return false;
    }

    repathSplicedPath(blockingUnit) {
        if (!this.game || !this.game.level) return false;
        if (!this.isMoving || !this.currentPath || this.currentPath.length === 0) return false;
        if (this.currentPathNodeIndex >= this.currentPath.length) return false;

        const level = this.game.level;
        const navGrid = level.getNavigationGrid();
        if (!navGrid) return false;

        const cellSize = level.gridCellSize;
        const avoidRadius = CONFIG.PATHFINDING.REPATH_SPLICE_AVOID_RADIUS || 2;
        const numNodes = CONFIG.PATHFINDING.REPATH_SPLICE_AVOID_NODES || 3;
        const maxWaypoints = CONFIG.PATHFINDING.REPATH_SPLICE_MAX_WAYPOINTS || 8;
        const gridStep = CONFIG.PATHFINDING.REPATH_SPLICE_WAYPOINT_STEP || 2;

        const blockerGrid = level.worldToGridCoords(blockingUnit.x, blockingUnit.y);
        const myGrid = level.worldToGridCoords(this.x, this.y);
        const targetGrid = level.worldToGridCoords(this.worldTargetX, this.worldTargetY);

        const dxTarget = targetGrid.x - myGrid.x;
        const dyTarget = targetGrid.y - myGrid.y;
        const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
        const normDx = distToTarget > 1e-6 ? dxTarget / distToTarget : 0;
        const normDy = distToTarget > 1e-6 ? dyTarget / distToTarget : 0;

        const perpDx = -normDy;
        const perpDy = normDx;

        const candidates = [];
        const searchR = avoidRadius + numNodes * gridStep;
        for (let r = avoidRadius; r <= searchR && candidates.length < maxWaypoints; r += gridStep) {
            for (let side = -1; side <= 1; side += 2) {
                const gx = blockerGrid.x + Math.round(perpDx * r * side);
                const gy = blockerGrid.y + Math.round(perpDy * r * side);
                if (gx >= 0 && gx < level.gridWidth && gy >= 0 && gy < level.gridHeight && navGrid[gy][gx] === 0) {
                    const wx = gx * cellSize + cellSize / 2;
                    const wy = gy * cellSize + cellSize / 2;
                    const distToMe = Math.hypot(wx - this.x, wy - this.y);
                    const distToTargetPt = Math.hypot(wx - this.worldTargetX, wy - this.worldTargetY);
                    candidates.push({ x: wx, y: wy, gx, gy, score: distToMe + distToTargetPt * 0.5 });
                }
            }
        }

        for (let r = avoidRadius; r <= searchR && candidates.length < maxWaypoints; r += gridStep) {
            const gx = blockerGrid.x + Math.round(normDx * r);
            const gy = blockerGrid.y + Math.round(normDy * r);
            if (gx >= 0 && gx < level.gridWidth && gy >= 0 && gy < level.gridHeight && navGrid[gy][gx] === 0) {
                const wx = gx * cellSize + cellSize / 2;
                const wy = gy * cellSize + cellSize / 2;
                const distToMe = Math.hypot(wx - this.x, wy - this.y);
                const distToTargetPt = Math.hypot(wx - this.worldTargetX, wy - this.worldTargetY);
                candidates.push({ x: wx, y: wy, gx, gy, score: distToMe + distToTargetPt * 0.5 + cellSize });
            }
        }

        if (candidates.length === 0) return false;

        candidates.sort((a, b) => a.score - b.score);

        const waypoints = [];
        const usedGrids = new Set();
        usedGrids.add(`${myGrid.x},${myGrid.y}`);
        usedGrids.add(`${blockerGrid.x},${blockerGrid.y}`);
        usedGrids.add(`${targetGrid.x},${targetGrid.y}`);

        for (const c of candidates) {
            if (waypoints.length >= numNodes) break;
            const key = `${c.gx},${c.gy}`;
            if (usedGrids.has(key)) continue;
            let tooClose = false;
            for (const wp of waypoints) {
                if (Math.hypot(wp.x - c.x, wp.y - c.y) < cellSize * 1.5) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
            waypoints.push({ x: c.x, y: c.y });
            usedGrids.add(key);
        }

        if (waypoints.length === 0) return false;

        waypoints.sort((a, b) => {
            const distA = Math.hypot(a.x - this.x, a.y - this.y);
            const distB = Math.hypot(b.x - this.x, b.y - this.y);
            return distA - distB;
        });

        const remainingPath = this.currentPath.slice(this.currentPathNodeIndex);
        const blockerClearRadius = (this.size + blockingUnit.size) * 0.5 + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 10) * 2;
        const filteredRemaining = remainingPath.filter(node => {
            const dx = node.x - blockingUnit.x;
            const dy = node.y - blockingUnit.y;
            return dx * dx + dy * dy >= blockerClearRadius * blockerClearRadius;
        });
        const splicedPath = [...waypoints, ...filteredRemaining];

        this.currentPath = splicedPath;
        this.currentPathNodeIndex = 0;
        this.isMoving = true;

        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
            console.log(`[${this.id} repathSplicedPath] Spliced ${waypoints.length} avoidance nodes at index ${this.currentPathNodeIndex}. New path length: ${this.currentPath.length}`);
        }
        return true;
    }

    _resolveOverlaps(deltaTime) {
        if (!CONFIG.PATHFINDING.OVERLAP_DETECTION_ENABLED || !this.game || !this.isAlive()) return null;
        if (this.isPhasing) {
            this.overlapStuckFrames = 0;
            return null;
        }

        const scanRadius = this.size * CONFIG.PATHFINDING.OVERLAP_SCAN_RADIUS_FACTOR;
        let nearbyUnits = null;
        if (this.game.spatialGrid) {
            const gridObjects = this.game.spatialGrid.queryRange(this.x, this.y, scanRadius);
            nearbyUnits = gridObjects.filter(o => o instanceof Unit);
        } else {
            nearbyUnits = [
                ...(this.game.getLivingPlayerControlledUnits?.() || []),
                ...(this.game.enemyUnits || []),
                ...(this.game.hostageUnits || [])
            ];
        }

        const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;
        let totalPushX = 0;
        let totalPushY = 0;
        let hasOverlap = false;
        let deepestOverlap = 0;
        let deepestOverlapUnit = null;

        for (const other of nearbyUnits) {
            if (other === this || !other.isAlive() || other.isPhasing) continue;
            if (formationGroupSet && formationGroupSet.has(other)) continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx * dx + dy * dy;
            const combinedRadii = (this.size + other.size) * 0.5;
            const minDist = combinedRadii * 0.8;

            if (distSq < minDist * minDist && distSq > 1e-6) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;
                const pushStrength = overlap + this.size * CONFIG.PATHFINDING.OVERLAP_MIN_PUSH_FACTOR * 0.1;
                totalPushX += nx * pushStrength;
                totalPushY += ny * pushStrength;
                hasOverlap = true;
                if (overlap > deepestOverlap) {
                    deepestOverlap = overlap;
                    deepestOverlapUnit = other;
                }
            } else if (distSq < 1e-6) {
                const angle = Math.random() * Math.PI * 2;
                const pushOut = this.size * CONFIG.PATHFINDING.OVERLAP_MIN_PUSH_FACTOR;
                totalPushX += Math.cos(angle) * pushOut;
                totalPushY += Math.sin(angle) * pushOut;
                hasOverlap = true;
                if (pushOut > deepestOverlap) {
                    deepestOverlap = pushOut;
                    deepestOverlapUnit = other;
                }
            }
        }

        if (!hasOverlap) {
            this.overlapStuckFrames = 0;
            return null;
        }

        this.overlapStuckFrames++;

        const pushMag = Math.hypot(totalPushX, totalPushY);
        if (pushMag > 1e-6) {
            const normalizeFactor = 1 / pushMag;
            let pushSpeed = this.speed * CONFIG.PATHFINDING.OVERLAP_RECOVERY_SPEED_FACTOR * deltaTime;
            const minPush = this.size * CONFIG.PATHFINDING.OVERLAP_MIN_PUSH_FACTOR;
            if (pushSpeed < minPush) pushSpeed = minPush;

            if (this._overlapEscapeFramesLeft > 0) {
                const consistency = (totalPushX * this._lastOverlapEscapeDir.x + totalPushY * this._lastOverlapEscapeDir.y) * normalizeFactor;
                if (consistency > 0.7) {
                    pushSpeed *= 1.5;
                }
            }

            this._lastOverlapEscapeDir.x = totalPushX * normalizeFactor;
            this._lastOverlapEscapeDir.y = totalPushY * normalizeFactor;
            this._overlapEscapeFramesLeft = 6;

            return {
                x: totalPushX * normalizeFactor * pushSpeed,
                y: totalPushY * normalizeFactor * pushSpeed,
                deepestOverlapUnit: deepestOverlapUnit
            };
        }

        return null;
    }

    _checkObstaclePenetration() {
        if (!CONFIG.PATHFINDING.OBSTACLE_STUCK_DETECTION_ENABLED || !this.game || !this.game.level) return null;
        if (this.isPhasing) return null;

        const level = this.game.level;
        let isInside = false;
        let deepestPenetration = 0;
        let escapeX = 0;
        let escapeY = 0;

        if (CONFIG.PATHFINDING.OBSTACLE_STUCK_NAV_CHECK && level.navGrid) {
            const grid = level.worldToGridCoords(this.x, this.y);
            if (grid.x >= 0 && grid.x < level.gridWidth && grid.y >= 0 && grid.y < level.gridHeight) {
                if (level.navGrid[grid.y][grid.x] === 1) {
                    isInside = true;
                    deepestPenetration = this.size;
                }
            }
        }

        if (!isInside || deepestPenetration < this.size * 0.5) {
            const scanRadius = this.size * CONFIG.PATHFINDING.OBSTACLE_STUCK_SCAN_RADIUS_FACTOR;
            let nearbyObstacles;
            if (this.game.spatialGrid && level.obstacleSet) {
                const nearbyObjects = this.game.spatialGrid.queryRange(this.x, this.y, scanRadius);
                nearbyObstacles = nearbyObjects.filter(obj => level.obstacleSet.has(obj) && obj.blocksMovement && !obj.isDestroyed);
            } else {
                nearbyObstacles = (level.activeObstacles || []).filter(o => o.blocksMovement && !o.isDestroyed);
            }

            const unitShape = { type: 'circle', x: this.x, y: this.y, radius: this.size * 0.5 };

            for (const obs of nearbyObstacles) {
                const obsShapes = level._getObstacleCollisionShape(obs);
                const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];

                for (const obsCS of shapesArray) {
                    let penetration = 0;
                    let ex = 0;
                    let ey = 0;

                    if (obsCS.type === 'rectangle') {
                        const closestX = Math.max(obsCS.x, Math.min(this.x, obsCS.x + obsCS.width));
                        const closestY = Math.max(obsCS.y, Math.min(this.y, obsCS.y + obsCS.height));
                        const dx = this.x - closestX;
                        const dy = this.y - closestY;
                        const dist = Math.hypot(dx, dy);
                        const r = this.size * 0.5;

                        if (dist < r) {
                            penetration = r - dist;
                            if (dist < 1e-6) {
                                const cx = obsCS.x + obsCS.width / 2;
                                const cy = obsCS.y + obsCS.height / 2;
                                const toCenterX = this.x - cx;
                                const toCenterY = this.y - cy;
                                const edgeDists = [
                                    { d: this.x - obsCS.x, nx: -1, ny: 0 },
                                    { d: (obsCS.x + obsCS.width) - this.x, nx: 1, ny: 0 },
                                    { d: this.y - obsCS.y, nx: 0, ny: -1 },
                                    { d: (obsCS.y + obsCS.height) - this.y, nx: 0, ny: 1 }
                                ];
                                edgeDists.sort((a, b) => a.d - b.d);
                                const nearest = edgeDists[0];
                                penetration = nearest.d + r;
                                ex = nearest.nx;
                                ey = nearest.ny;
                            } else {
                                ex = dx / dist;
                                ey = dy / dist;
                            }
                        }
                    } else if (obsCS.type === 'circle') {
                        const dx = this.x - obsCS.x;
                        const dy = this.y - obsCS.y;
                        const dist = Math.hypot(dx, dy);
                        const r = this.size * 0.5;
                        const combinedR = (obsCS.radius || 0) + r;

                        if (dist < combinedR) {
                            penetration = combinedR - dist;
                            if (dist < 1e-6) {
                                const angle = Math.random() * Math.PI * 2;
                                ex = Math.cos(angle);
                                ey = Math.sin(angle);
                            } else {
                                ex = dx / dist;
                                ey = dy / dist;
                            }
                        }
                    } else if (obsCS.type === 'ellipse') {
                        const rx = obsCS.radiusX || 1;
                        const ry = obsCS.radiusY || 1;
                        const nx = (this.x - obsCS.x) / rx;
                        const ny = (this.y - obsCS.y) / ry;
                        const normalizedDist = nx * nx + ny * ny;

                        if (normalizedDist < 1) {
                            penetration = this.size * 0.5;
                            const angle = Math.atan2(ny, nx);
                            ex = Math.cos(angle);
                            ey = Math.sin(angle);
                        }
                    }

                    if (penetration > deepestPenetration) {
                        deepestPenetration = penetration;
                        escapeX = ex;
                        escapeY = ey;
                        isInside = true;
                    }
                }
            }
        } else {
            const grid = level.worldToGridCoords(this.x, this.y);
            const searchR = 3;
            let bestDist = Infinity;
            let bestDx = 0;
            let bestDy = 0;
            for (let dy = -searchR; dy <= searchR; dy++) {
                for (let dx = -searchR; dx <= searchR; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const gx = grid.x + dx;
                    const gy = grid.y + dy;
                    if (gx >= 0 && gx < level.gridWidth && gy >= 0 && gy < level.gridHeight) {
                        if (level.navGrid[gy][gx] === 0) {
                            const d = Math.abs(dx) + Math.abs(dy);
                            if (d < bestDist) {
                                bestDist = d;
                                bestDx = dx;
                                bestDy = dy;
                            }
                        }
                    }
                }
            }
            if (bestDist < Infinity) {
                const len = Math.hypot(bestDx, bestDy) || 1;
                escapeX = bestDx / len;
                escapeY = bestDy / len;
            } else {
                escapeX = (Math.random() - 0.5) * 2;
                escapeY = (Math.random() - 0.5) * 2;
                const len = Math.hypot(escapeX, escapeY) || 1;
                escapeX /= len;
                escapeY /= len;
            }
        }

        if (!isInside) return null;

        const pushDist = Math.max(deepestPenetration, this.size * CONFIG.PATHFINDING.OBSTACLE_ESCAPE_PUSH_FACTOR);
        return { x: escapeX * pushDist, y: escapeY * pushDist };
    }

    _handleMovement(deltaTime) {
        const originalX = this.x;
        const originalY = this.y;
        if (this.bumpRepathCooldown > 0) this.bumpRepathCooldown -= deltaTime;
        if (this.overlapEscapeCooldown > 0) this.overlapEscapeCooldown -= deltaTime;
        if (this._overlapEscapeFramesLeft > 0) this._overlapEscapeFramesLeft--;

        if (this.team === 'player' && this.isHoldingPosition && !(this instanceof RaccoonHostage) && !this.isPhasing) {
            this.isMoving = false; this.currentPath = []; this.clearFormationState(); this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }
        if (this instanceof RaccoonHostage && this.isHoldingPosition && !this.isPhasing) {
            this.isMoving = false; this.currentPath = []; this.clearFormationState(); this.lastDeltaX = 0; this.lastDeltaY = 0; return;
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
                if (distToTarget > this.size * CONFIG.PATHFINDING.PHASING_ARRIVAL_THRESHOLD_FACTOR) {
                    const moveRatio = Math.min(1, moveSpeed / (distToTarget || 1e-5));
                    this.x += dxToTarget * moveRatio; this.y += dyToTarget * moveRatio;
                } else {
                    if (this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                        this.x = targetXForPhasing; this.y = targetYForPhasing; this.currentPathNodeIndex++;
                        if (this.currentPathNodeIndex >= this.currentPath.length) {
                            this.isMoving = (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * CONFIG.PATHFINDING.PHASING_STILL_THRESHOLD_FACTOR);
                            this.currentPath = [];
                        }
                    } else { this.x = this.worldTargetX; this.y = this.worldTargetY; this.isMoving = false; this.clearFormationState(); }
                }
                this.x = Math.max(this.size / 2, Math.min(this.x, (CONFIG.WORLD_WIDTH || 0) - this.size / 2));
                this.y = Math.max(this.size / 2, Math.min(this.y, (CONFIG.WORLD_HEIGHT || 0) - this.size / 2));
            }
            this.lastDeltaX = this.x - originalX; this.lastDeltaY = this.y - originalY;
            return;
        }

        const overlapResolution = this._resolveOverlaps(deltaTime);
        if (overlapResolution && (!this.isMoving || this.overlapStuckFrames >= CONFIG.PATHFINDING.OVERLAP_PHASING_THRESHOLD)) {
            this.x += overlapResolution.x;
            this.y += overlapResolution.y;

            if (this.overlapStuckFrames >= CONFIG.PATHFINDING.OVERLAP_PHASING_THRESHOLD && !this.isPhasing) {
                this.isPhasing = true;
                this.phasingTimer = CONFIG.PATHFINDING.PHASING_DURATION || 0.75;
                this.isMoving = distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5;
                this.overlapStuckFrames = 0;
                if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                    if (this.isMoving) {
                        const targetGridPos = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
                        this.currentPath = [this.game.level.gridToWorldCoords(targetGridPos.x, targetGridPos.y)];
                        this.currentPathNodeIndex = 0;
                    }
                }
            }

            if (this.isMoving && overlapResolution.deepestOverlapUnit && this.overlapEscapeCooldown <= 0) {
                this.overlapEscapeCooldown = CONFIG.PATHFINDING.OVERLAP_REPATH_COOLDOWN;
                if (this.repathSplicedPath(overlapResolution.deepestOverlapUnit)) {
                    this.overlapStuckFrames = Math.max(0, this.overlapStuckFrames - 2);
                }
            }

            this.x = Math.max(this.size / 2, Math.min(this.x, (CONFIG.WORLD_WIDTH || 0) - this.size / 2));
            this.y = Math.max(this.size / 2, Math.min(this.y, (CONFIG.WORLD_HEIGHT || 0) - this.size / 2));
            this.lastDeltaX = this.x - originalX;
            this.lastDeltaY = this.y - originalY;
            return;
        }

        const obstacleEscape = this._checkObstaclePenetration();
        if (obstacleEscape) {
            this.x += obstacleEscape.x;
            this.y += obstacleEscape.y;

            if (!this.isPhasing) {
                this.isPhasing = true;
                this.phasingTimer = CONFIG.PATHFINDING.PHASING_DURATION || 0.75;
                this.isMoving = distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5;
                if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                    if (this.isMoving) {
                        const targetGridPos = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
                        this.currentPath = [this.game.level.gridToWorldCoords(targetGridPos.x, targetGridPos.y)];
                        this.currentPathNodeIndex = 0;
                    }
                }
            }

            this.x = Math.max(this.size / 2, Math.min(this.x, (CONFIG.WORLD_WIDTH || 0) - this.size / 2));
            this.y = Math.max(this.size / 2, Math.min(this.y, (CONFIG.WORLD_HEIGHT || 0) - this.size / 2));
            this.lastDeltaX = this.x - originalX;
            this.lastDeltaY = this.y - originalY;
            return;
        }

        if (!this.isAlive() || !this.isMoving) {
            if (!this.isAlive()) { this.isMoving = false; this.currentPath = []; this.clearFormationState(); }
            this.lastDeltaX = 0; this.lastDeltaY = 0; return;
        }

        if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
            this.currentPath = []; this.currentPathNodeIndex = 0;
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR) {
                this.isMoving = false;
                this.clearFormationState();
                //this.x = this.worldTargetX; this.y = this.worldTargetY;
            } else if (this.isMoving) {
                this.setMoveTarget(this.worldTargetX, this.worldTargetY);
            }
            if (!this.isMoving) {
                this.lastDeltaX = 0; this.lastDeltaY = 0; return;
            }
            if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                this.lastDeltaX = 0; this.lastDeltaY = 0; return;
            }
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

        if (this.isMoving && this.game && CONFIG.PATHFINDING.UNIT_COLLISION_CHECK_ENABLED !== false) {
            const SEPARATION_CHECK_RADIUS = this.size * CONFIG.PATHFINDING.SEPARATION_CHECK_RADIUS_FACTOR;
            const MIN_SEPARATION_DISTANCE_FACTOR = CONFIG.PATHFINDING.MIN_SEPARATION_DISTANCE_FACTOR || 1.2;
            const UNIT_SEPARATION_FORCE_FACTOR = CONFIG.PATHFINDING.UNIT_SEPARATION_FORCE_FACTOR || 1.5;
            let separationDX = 0; let separationDY = 0;
            let nearbyUnits = null;
            if (this.game.spatialGrid) {
                const queryRadius = SEPARATION_CHECK_RADIUS;
                const gridObjects = this.game.spatialGrid.queryRange(this.x, this.y, queryRadius);
                nearbyUnits = gridObjects.filter(o => o instanceof Unit);
            } else {
                nearbyUnits = [
                    ...(this.game.getLivingPlayerControlledUnits?.() || []),
                    ...(this.game.enemyUnits || []),
                    ...(this.game.hostageUnits || [])
                ];
            }
            const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;
            for (const otherUnit of nearbyUnits) {
                if (otherUnit === this || !otherUnit.isAlive() || otherUnit.isPhasing) continue;
                const isInSameFormation = formationGroupSet && formationGroupSet.has(otherUnit);
                const dx = this.x - otherUnit.x;
                const dy = this.y - otherUnit.y;
                const distSq = dx * dx + dy * dy;
                if (distSq === 0) continue;
                const dist = Math.sqrt(distSq);
                const combinedRadii = (this.size + otherUnit.size) * 0.5;
                const minDist = combinedRadii * MIN_SEPARATION_DISTANCE_FACTOR;
                if (dist < SEPARATION_CHECK_RADIUS) {
                    const overlap = minDist - dist;
                    let pushStrength;
                    if (overlap > 0) {
                        if (isInSameFormation) {
                            // Soft push for same-formation allies - just enough to prevent stacking
                            pushStrength = (overlap / minDist) * 0.3;
                        } else {
                            pushStrength = (overlap / minDist) * CONFIG.PATHFINDING.SEPARATION_OVERLAP_PUSH_FACTOR + 0.5;
                        }
                    } else {
                        const proximity = 1.0 - (dist / SEPARATION_CHECK_RADIUS);
                        pushStrength = proximity * proximity * CONFIG.PATHFINDING.SEPARATION_PROXIMITY_PUSH_FACTOR;
                        if (isInSameFormation) {
                            // Drastically reduce proximity push for formation allies
                            pushStrength *= 0.1;
                        }
                    }
                    separationDX += (dx / dist) * pushStrength;
                    separationDY += (dy / dist) * pushStrength;
                }
            }
            const sepMag = Math.hypot(separationDX, separationDY);
            if (sepMag > 1e-6) {
                const pushMagnitude = this.speed * UNIT_SEPARATION_FORCE_FACTOR * deltaTime;
                finalDeltaX += (separationDX / sepMag) * pushMagnitude;
                finalDeltaY += (separationDY / sepMag) * pushMagnitude;
            }
        }

        if (this.isMoving && !this.isPhasing) {
            const OBSTACLE_REPULSION_RADIUS = this.size * (CONFIG.PATHFINDING.OBSTACLE_REPULSION_RADIUS_FACTOR || 3.0);
            const OBSTACLE_REPULSION_FORCE = CONFIG.PATHFINDING.OBSTACLE_REPULSION_FORCE || 1.5;
            let repelDX = 0; let repelDY = 0; let repelCount = 0;
            for (const obs of obstaclesForCollision) {
                const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                for (const obsCS of shapesArray) {
                    const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                    let closestPt;
                    if (hasRotation) {
                        const cx = obsCS.x + obsCS.width / 2;
                        const cy = obsCS.y + obsCS.height / 2;
                        const cos = Math.cos(-(obsCS.rotation || 0));
                        const sin = Math.sin(-(obsCS.rotation || 0));
                        const localX = cos * (this.x - cx) - sin * (this.y - cy);
                        const localY = sin * (this.x - cx) + cos * (this.y - cy);
                        const hw = obsCS.width / 2;
                        const hh = obsCS.height / 2;
                        const closestLocalX = Math.max(-hw, Math.min(localX, hw));
                        const closestLocalY = Math.max(-hh, Math.min(localY, hh));
                        const worldCos = Math.cos(obsCS.rotation || 0);
                        const worldSin = Math.sin(obsCS.rotation || 0);
                        closestPt = {
                            x: cx + worldCos * closestLocalX - worldSin * closestLocalY,
                            y: cy + worldSin * closestLocalX + worldCos * closestLocalY
                        };
                    } else {
                        closestPt = closestPointOnCollisionShape(this.x, this.y, obsCS);
                    }
                    const toUnitX = this.x - closestPt.x;
                    const toUnitY = this.y - closestPt.y;
                    const distToObs = Math.hypot(toUnitX, toUnitY);
                    if (distToObs < OBSTACLE_REPULSION_RADIUS && distToObs > 1e-6) {
                        const penetration = OBSTACLE_REPULSION_RADIUS - distToObs;
                        const strength = (penetration / OBSTACLE_REPULSION_RADIUS);
                        repelDX += (toUnitX / distToObs) * strength;
                        repelDY += (toUnitY / distToObs) * strength;
                        repelCount++;
                    }
                }
            }
            if (repelCount > 0) {
                const avgRepelDX = repelDX / repelCount;
                const avgRepelDY = repelDY / repelCount;
                const repelMove = this.speed * OBSTACLE_REPULSION_FORCE * deltaTime;
                finalDeltaX += avgRepelDX * repelMove;
                finalDeltaY += avgRepelDY * repelMove;
                const totalMag = Math.hypot(finalDeltaX, finalDeltaY);
                const desiredMag = Math.hypot(desiredDeltaX, desiredDeltaY);
                const maxSpeedFactor = CONFIG.PATHFINDING.OBSTACLE_REPULSION_MAX_SPEED_FACTOR;
                if (totalMag > desiredMag * maxSpeedFactor && desiredMag > 0.1) {
                    const scale = (desiredMag * maxSpeedFactor) / totalMag;
                    finalDeltaX *= scale; finalDeltaY *= scale;
                }
            }
        }

        let collisionOccurredThisFrame = false;
        let blockedByUnit = false;
        let blockingUnitThisFrame = null;
        if (distToNextNode > 1e-5) {
            const potentialNewX_combined = this.x + finalDeltaX;
            const potentialNewY_combined = this.y + finalDeltaY;
            const collisionCheckRadius = this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 10);
            const unitBodyShape_combined = { type: 'circle', x: potentialNewX_combined, y: potentialNewY_combined, radius: collisionCheckRadius };
            let isCollisionWithDesiredMove = false;
            for (const obs of obstaclesForCollision) {
                const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                for (const obsCS of shapesArray) {
                    const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                    if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_combined) : rectCircleOverlap(obsCS, unitBodyShape_combined))) ||
                        (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_combined)) ||
                        (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_combined, obsCS))) {
                        isCollisionWithDesiredMove = true; break;
                    }
                }
                if (isCollisionWithDesiredMove) break;
            }
            if (!isCollisionWithDesiredMove && CONFIG.PATHFINDING.UNIT_COLLISION_CHECK_ENABLED !== false) {
                const unitColR = this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR;
                const nearbyUnitsCol = this.game.spatialGrid ?
                    this.game.spatialGrid.queryRange(this.x, this.y, this.size * CONFIG.PATHFINDING.UNIT_COLLISION_CHECK_RADIUS_FACTOR).filter(o => o instanceof Unit && o !== this && o.isAlive() && !o.isPhasing) :
                    [...(this.game.getLivingPlayerControlledUnits?.() || []), ...(this.game.enemyUnits || []), ...(this.game.hostageUnits || [])].filter(o => o !== this && o.isAlive() && !o.isPhasing);
                const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;
                for (const otherUnit of nearbyUnitsCol) {
                    const isInSameFormation = formationGroupSet && formationGroupSet.has(otherUnit);
                    const combinedR = unitColR + otherUnit.size * 0.5;
                    const dx = potentialNewX_combined - otherUnit.x;
                    const dy = potentialNewY_combined - otherUnit.y;
                    if ((dx * dx + dy * dy) < (combinedR * combinedR)) {
                        if (isInSameFormation) {
                            // Same formation: allow overlap, just apply soft separation (handled above)
                            continue;
                        }
                        isCollisionWithDesiredMove = true;
                        blockedByUnit = true;
                        blockingUnitThisFrame = otherUnit;
                        break;
                    }
                }
            }
            if (isCollisionWithDesiredMove) {
                collisionOccurredThisFrame = true;
                let canMoveX = false;
                if (Math.abs(finalDeltaX) > 1e-5) {
                    const unitBodyShape_X_Only = { type: 'circle', x: this.x + finalDeltaX, y: this.y, radius: collisionCheckRadius };
                    let collisionX = false;
                    for (const obs of obstaclesForCollision) {
                        const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                        const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                        for (const obsCS of shapesArray) {
                            const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                            if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_X_Only) : rectCircleOverlap(obsCS, unitBodyShape_X_Only))) ||
                                (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_X_Only)) ||
                                (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_X_Only, obsCS))) {
                                collisionX = true; break;
                            }
                        }
                        if (collisionX) break;
                    }
                    if (!collisionX) canMoveX = true;
                }
                if (canMoveX) {
                    const testX = this.x + finalDeltaX;
                    const unitColR = this.size * 0.5;
                    const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;
                    const nearbyUnitsX = this.game.spatialGrid ?
                        this.game.spatialGrid.queryRange(testX, this.y, this.size * 2.5).filter(o => o instanceof Unit && o !== this && o.isAlive() && !o.isPhasing) :
                        [...(this.game.getLivingPlayerControlledUnits?.() || []), ...(this.game.enemyUnits || []), ...(this.game.hostageUnits || [])].filter(o => o !== this && o.isAlive() && !o.isPhasing);
                    for (const otherUnit of nearbyUnitsX) {
                        if (formationGroupSet && formationGroupSet.has(otherUnit)) continue;
                        const combinedR = unitColR + otherUnit.size * 0.5;
                        const dx = testX - otherUnit.x;
                        const dy = this.y - otherUnit.y;
                        if ((dx * dx + dy * dy) < (combinedR * combinedR)) {
                            canMoveX = false; blockedByUnit = true; break;
                        }
                    }
                }
                let canMoveY = false;
                if (Math.abs(finalDeltaY) > 1e-5) {
                    const unitBodyShape_Y_Only = { type: 'circle', x: this.x, y: this.y + finalDeltaY, radius: collisionCheckRadius };
                    let collisionY = false;
                    for (const obs of obstaclesForCollision) {
                        const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                        const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                        for (const obsCS of shapesArray) {
                            const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                            if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, unitBodyShape_Y_Only) : rectCircleOverlap(obsCS, unitBodyShape_Y_Only))) ||
                                (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_Y_Only)) ||
                                (obsCS.type === 'ellipse' && circleEllipseOverlap(unitBodyShape_Y_Only, obsCS))) {
                                collisionY = true; break;
                            }
                        }
                        if (collisionY) break;
                    }
                    if (!collisionY) canMoveY = true;
                }
                if (canMoveY) {
                    const testY = this.y + finalDeltaY;
                    const unitColR = this.size * 0.5;
                    const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;
                    const nearbyUnitsY = this.game.spatialGrid ?
                        this.game.spatialGrid.queryRange(this.x, testY, this.size * 2.5).filter(o => o instanceof Unit && o !== this && o.isAlive() && !o.isPhasing) :
                        [...(this.game.getLivingPlayerControlledUnits?.() || []), ...(this.game.enemyUnits || []), ...(this.game.hostageUnits || [])].filter(o => o !== this && o.isAlive() && !o.isPhasing);
                    for (const otherUnit of nearbyUnitsY) {
                        if (formationGroupSet && formationGroupSet.has(otherUnit)) continue;
                        const combinedR = unitColR + otherUnit.size * 0.5;
                        const dx = this.x - otherUnit.x;
                        const dy = testY - otherUnit.y;
                        if ((dx * dx + dy * dy) < (combinedR * combinedR)) {
                            canMoveY = false; blockedByUnit = true; break;
                        }
                    }
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
                } else {
                    let foundSlide = false;
                    const desiredMag = Math.hypot(desiredDeltaX, desiredDeltaY);

                    if (this._slideFramesLeft > 0) {
                        const testSlideX = desiredMag * this._slideDirX;
                        const testSlideY = desiredMag * this._slideDirY;
                        const slideTestShape = { type: 'circle', x: this.x + testSlideX, y: this.y + testSlideY, radius: collisionCheckRadius };
                        let persistentSlideBlocked = false;
                        for (const obs of obstaclesForCollision) {
                            const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                            const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                            for (const obsCS of shapesArray) {
                                const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                                if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, slideTestShape) : rectCircleOverlap(obsCS, slideTestShape))) ||
                                    (obsCS.type === 'circle' && circleOverlap(obsCS, slideTestShape)) ||
                                    (obsCS.type === 'ellipse' && circleEllipseOverlap(slideTestShape, obsCS))) {
                                    persistentSlideBlocked = true; break;
                                }
                            }
                            if (persistentSlideBlocked) break;
                        }
                        if (!persistentSlideBlocked) {
                            const slideColR = this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR;
                            const slideUX = this.x + testSlideX;
                            const slideUY = this.y + testSlideY;
                            const nearbySlideUnits = this.game.spatialGrid ?
                                this.game.spatialGrid.queryRange(slideUX, slideUY, this.size * CONFIG.PATHFINDING.UNIT_COLLISION_CHECK_RADIUS_FACTOR).filter(o => o instanceof Unit && o !== this && o.isAlive() && !o.isPhasing) :
                                [];
                            for (const su of nearbySlideUnits) {
                                const cr = slideColR + su.size * 0.5;
                                const sdx = slideUX - su.x;
                                const sdy = slideUY - su.y;
                                if (sdx * sdx + sdy * sdy < cr * cr) { persistentSlideBlocked = true; break; }
                            }
                        }
                        if (!persistentSlideBlocked) {
                            finalDeltaX = testSlideX; finalDeltaY = testSlideY; collisionOccurredThisFrame = false; foundSlide = true;
                            this._slideFramesLeft--;
                        } else {
                            this._slideFramesLeft = 0;
                            this._slideDirX = 0; this._slideDirY = 0;
                        }
                    }

                    if (!foundSlide) {
                        const MAX_SLIDE_FRAMES = CONFIG.PATHFINDING.MAX_SLIDE_FRAMES;
                        for (const obs of obstaclesForCollision) {
                            const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                            const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                            for (const obsCS of shapesArray) {
                                const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                                const testShape = { type: 'circle', x: this.x + desiredDeltaX, y: this.y + desiredDeltaY, radius: collisionCheckRadius };
                                let blocks = false;
                                if (obsCS.type === 'rectangle') blocks = hasRotation ? obbCircleOverlap(obsCS, testShape) : rectCircleOverlap(obsCS, testShape);
                                else if (obsCS.type === 'circle') blocks = circleOverlap(obsCS, testShape);
                                else if (obsCS.type === 'ellipse') blocks = circleEllipseOverlap(testShape, obsCS);
                                if (blocks) {
                                    let nx, ny;
                                    if (obsCS.type === 'circle') {
                                        nx = this.x - obsCS.x; ny = this.y - obsCS.y;
                                    } else if (obsCS.type === 'ellipse') {
                                        const rx = obsCS.radiusX || 1e-6;
                                        const ry = obsCS.radiusY || 1e-6;
                                        nx = (this.x - obsCS.x) / (rx * rx);
                                        ny = (this.y - obsCS.y) / (ry * ry);
                                    } else {
                                        const closestPt = closestPointOnCollisionShape(this.x, this.y, obsCS);
                                        nx = this.x - closestPt.x; ny = this.y - closestPt.y;
                                    }
                                    const nLen = Math.hypot(nx, ny);
                                    if (nLen > 1e-6) { nx /= nLen; ny /= nLen; }
                                    else { nx = -desiredDeltaX; ny = -desiredDeltaY; const dLen = Math.hypot(nx, ny); if (dLen > 1e-6) { nx /= dLen; ny /= dLen; } }

                                    let projDot = nx * desiredDeltaX + ny * desiredDeltaY;
                                    let slideDX = desiredDeltaX - projDot * nx;
                                    let slideDY = desiredDeltaY - projDot * ny;
                                    let slideMag = Math.hypot(slideDX, slideDY);
                                    if (slideMag < 1e-5) {
                                        slideDX = -ny;
                                        slideDY = nx;
                                        slideMag = 1;
                                    }

                                    let bestSlideX = 0, bestSlideY = 0;
                                    let bestScore = -Infinity;
                                    const signAttempts = [1, -1];
                                    for (const sign of signAttempts) {
                                        let tryDX, tryDY;
                                        if (Math.abs(slideMag) > 1e-5) {
                                            const normX = slideDX / slideMag;
                                            const normY = slideDY / slideMag;
                                            tryDX = normX * sign * desiredMag;
                                            tryDY = normY * sign * desiredMag;
                                        } else {
                                            tryDX = (-ny * sign) * desiredMag;
                                            tryDY = (nx * sign) * desiredMag;
                                        }
                                        const tryTestShape = { type: 'circle', x: this.x + tryDX, y: this.y + tryDY, radius: collisionCheckRadius };
                                        let tryBlocked = false;
                                        for (const obs2 of obstaclesForCollision) {
                                            const obs2Shapes = this.game.level._getObstacleCollisionShape(obs2);
                                            const obs2Arr = Array.isArray(obs2Shapes) ? obs2Shapes : [obs2Shapes];
                                            for (const obs2CS of obs2Arr) {
                                                const hasRot2 = obs2CS.type === 'rectangle' && obs2CS.rotation !== undefined && obs2CS.rotation !== 0;
                                                if ((obs2CS.type === 'rectangle' && (hasRot2 ? obbCircleOverlap(obs2CS, tryTestShape) : rectCircleOverlap(obs2CS, tryTestShape))) ||
                                                    (obs2CS.type === 'circle' && circleOverlap(obs2CS, tryTestShape)) ||
                                                    (obs2CS.type === 'ellipse' && circleEllipseOverlap(tryTestShape, obs2CS))) {
                                                    tryBlocked = true; break;
                                                }
                                            }
                                            if (tryBlocked) break;
                                        }
                                        if (!tryBlocked) {
                                            const tryColR = this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR;
                                            const tryUX = this.x + tryDX;
                                            const tryUY = this.y + tryDY;
                                            const nearbyTryUnits = this.game.spatialGrid ?
                                                this.game.spatialGrid.queryRange(tryUX, tryUY, this.size * CONFIG.PATHFINDING.UNIT_COLLISION_CHECK_RADIUS_FACTOR).filter(o => o instanceof Unit && o !== this && o.isAlive() && !o.isPhasing) :
                                                [];
                                            for (const tu of nearbyTryUnits) {
                                                const tcr = tryColR + tu.size * 0.5;
                                                const tdx = tryUX - tu.x;
                                                const tdy = tryUY - tu.y;
                                                if (tdx * tdx + tdy * tdy < tcr * tcr) { tryBlocked = true; break; }
                                            }
                                        }
                                        if (!tryBlocked) {
                                            const alignment = (tryDX * desiredDeltaX + tryDY * desiredDeltaY) / (desiredMag * desiredMag);
                                            let score = alignment;
                                            if (this._slideDirX !== 0 || this._slideDirY !== 0) {
                                                const prevAlignment = tryDX * this._slideDirX + tryDY * this._slideDirY;
                                                score += prevAlignment * 2.0;
                                            }
                                            if (score > bestScore) {
                                                bestScore = score;
                                                bestSlideX = tryDX;
                                                bestSlideY = tryDY;
                                            }
                                        }
                                    }
                                    if (bestScore > -Infinity) {
                                        finalDeltaX = bestSlideX; finalDeltaY = bestSlideY;
                                        if (desiredMag > 1e-5) {
                                            this._slideDirX = bestSlideX / desiredMag;
                                            this._slideDirY = bestSlideY / desiredMag;
                                        } else {
                                            this._slideDirX = 0; this._slideDirY = 0;
                                        }
                                        this._slideFramesLeft = MAX_SLIDE_FRAMES;
                                        collisionOccurredThisFrame = false; foundSlide = true;
                                    }
                                    break;
                                }
                            }
                            if (foundSlide) break;
                        }
                    }
                     if (!foundSlide) { finalDeltaX = 0; finalDeltaY = 0; }
                 }
             }
         }

        if (this.hovers) {
            const inertia = CONFIG.UNIT_VISUALS?.UNIT_HOVER_INERTIA ?? 0.15;
            const friction = CONFIG.UNIT_VISUALS?.UNIT_HOVER_FRICTION ?? 3.0;
            const hasInput = (Math.abs(finalDeltaX) > 1e-5 || Math.abs(finalDeltaY) > 1e-5);
            if (hasInput) {
                this.hoverVelocityX = this.hoverVelocityX * (1 - inertia) + finalDeltaX * inertia;
                this.hoverVelocityY = this.hoverVelocityY * (1 - inertia) + finalDeltaY * inertia;
            } else {
                this.hoverVelocityX *= (1 - friction * deltaTime);
                this.hoverVelocityY *= (1 - friction * deltaTime);
                if (Math.abs(this.hoverVelocityX) < 0.01) this.hoverVelocityX = 0;
                if (Math.abs(this.hoverVelocityY) < 0.01) this.hoverVelocityY = 0;
            }
            this.x += this.hoverVelocityX;
            this.y += this.hoverVelocityY;
        } else {
            this.x += finalDeltaX;
            this.y += finalDeltaY;
        }

        const actualMoveDist = Math.hypot(this.x - originalX, this.y - originalY);
        const attemptedToMoveFlag = (Math.abs(desiredDeltaX) > 1e-5 || Math.abs(desiredDeltaY) > 1e-5);
        const meaningfullyMoved = actualMoveDist > this.stuckMovementThreshold;
        const fullBlockEncountered = attemptedToMoveFlag && !meaningfullyMoved && collisionOccurredThisFrame;

        if (this.repathFailCooldown > 0) this.repathFailCooldown -= deltaTime;
        if (this.unitBlockWaitTimer > 0) this.unitBlockWaitTimer -= deltaTime;
        if (this._lastBlockedByUnit > 0) {
            this._lastBlockedByUnit -= deltaTime;
            if (this._lastBlockedByUnit <= 0) {
                this._lastBlockingUnit = null;
            }
        }

        if (blockedByUnit) {
            this._lastBlockedByUnit = CONFIG.PATHFINDING.BLOCKED_BY_UNIT_TIMER;
            if (blockingUnitThisFrame) this._lastBlockingUnit = blockingUnitThisFrame;
        }

        if (this._lastBlockedByUnit > 0 && this.isMoving && !this.isPhasing) {
            if (this.unitBlockWaitTimer <= 0 && this.repathCooldown <= 0) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Blocked by unit. Repathing now.`);
                let pathSucceeded = false;
                if (this._lastBlockingUnit && this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Attempting spliced repath around blocking unit ${this._lastBlockingUnit.id}.`);
                    if (this.repathSplicedPath(this._lastBlockingUnit)) {
                        pathSucceeded = true;
                    }
                }
                if (!pathSucceeded) {
                    const currentGrid = this.game.level.worldToGridCoords(this.x, this.y);
                    if (this.calculatePath(currentGrid, false)) {
                        pathSucceeded = true;
                    }
                }
                if (!pathSucceeded) {
                    this.repathFailCount++;
                    this.repathFailCooldown = 1.0;
                    this.currentPath = [];
                    this.currentPathNodeIndex = 0;
                    if (this.repathFailCount >= CONFIG.PATHFINDING.REPATH_FAILS_BEFORE_PHASING && !this.isPhasing) {
                        this.isPhasing = true;
                        this.phasingTimer = CONFIG.PATHFINDING.PHASING_DURATION || 0.75;
                        this.repathFailCount = 0;
                        if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5) {
                            this.isMoving = true;
                            if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                                const targetGridPos = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
                                this.currentPath = [this.game.level.gridToWorldCoords(targetGridPos.x, targetGridPos.y)];
                                this.currentPathNodeIndex = 0;
                            }
                        } else {
                            this.isMoving = false;
                        }
                    }
                } else {
                    this.repathFailCount = 0;
                    this._lastBlockedByUnit = 0;
                    this._lastBlockingUnit = null;
                }
            }
            finalDeltaX = 0;
            finalDeltaY = 0;
            collisionOccurredThisFrame = false;
        }

        if (this.isMoving && attemptedToMoveFlag && !meaningfullyMoved && collisionOccurredThisFrame) {
            this.stuckFrameCounter++;
            this.stuckSpeechTimer += deltaTime;
            const stuckThreshold = CONFIG.PATHFINDING.STUCK_REPATH_FRAME_THRESHOLD || 30;
            if (this.stuckFrameCounter >= stuckThreshold && this.repathCooldown <= 0) {
                    this.stuckFrameCounter = 0;
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Stuck for ${stuckThreshold} frames. Forcing repath with offset.`);
                    let pathSucceeded = false;
                    if (this._lastBlockingUnit && this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Stuck: attempting spliced repath around blocking unit ${this._lastBlockingUnit.id}.`);
                        if (this.repathSplicedPath(this._lastBlockingUnit)) {
                            pathSucceeded = true;
                        }
                    }
                    if (!pathSucceeded) {
                        const currentGrid = this.game.level.worldToGridCoords(this.x, this.y);
                        const navGrid = this.game.level.getNavigationGrid();
                        const searchDistances = CONFIG.PATHFINDING.DESPERATE_STUCK_SEARCH_RADIUS_CELLS;
                        for (let dist = searchDistances[0]; dist <= searchDistances[1] && !pathSucceeded; dist += 2) {
                            const tryOffsets = [
                                { dx: 0, dy: -dist }, { dx: 0, dy: dist },
                                { dx: -dist, dy: 0 }, { dx: dist, dy: 0 }
                            ];
                            for (const off of tryOffsets) {
                                const tx = currentGrid.x + off.dx;
                                const ty = currentGrid.y + off.dy;
                                if (tx >= 0 && tx < this.game.level.gridWidth && ty >= 0 && ty < this.game.level.gridHeight && navGrid[ty][tx] === 0) {
                                    if (this.calculatePath({ x: tx, y: ty }, this.isPhasing)) {
                                        pathSucceeded = true;
                                    }
                                    break;
                                }
                            }
                        }
                        if (!pathSucceeded) {
                            if (!this.calculatePath(currentGrid, this.isPhasing)) {
                                this.repathFailCount++;
                                this.repathFailCooldown = 1.0;
                        if (this.repathFailCount >= CONFIG.PATHFINDING.REPATH_FAILS_BEFORE_PHASING && !this.isPhasing) {
                                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} _HM] ${this.repathFailCount} consecutive repath failures. Auto-phasing to unblock.`);
                                    this.isPhasing = true;
                                    this.phasingTimer = CONFIG.PATHFINDING.PHASING_DURATION || 0.75;
                                    this.repathFailCount = 0;
                                    if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5) {
                                        this.isMoving = true;
                                        if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                                            const targetGridPos = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
                                            this.currentPath = [this.game.level.gridToWorldCoords(targetGridPos.x, targetGridPos.y)];
                                            this.currentPathNodeIndex = 0;
                                        }
                                    } else {
                                        this.isMoving = false;
                                    }
                                }
                            } else {
                                this.repathFailCount = 0;
                            }
                        } else {
                            this.repathFailCount = 0;
                        }
                    } else {
                        this.repathFailCount = 0;
                    }
                    this.repathCooldown = CONFIG.PATHFINDING.REPATH_STUCK_COOLDOWN_AFTER + Math.random();
                    if (typeof this.onStuck === 'function') {
                        this.onStuck('stuck_repath');
                    }
                }
            if (this.stuckSpeechTimer >= 5.0 && this.stuckSpeechCooldown <= 0) {
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(this, 'ON_PATH_BLOCKED', 0.5);
                }
                this.stuckSpeechTimer = 0;
                this.stuckSpeechCooldown = 8.0 + Math.random() * 7.0;
            }
        } else {
            this.stuckFrameCounter = 0;
            this.stuckSpeechTimer = 0;
            this._slideFramesLeft = 0;
            this._slideDirX = 0;
            this._slideDirY = 0;
            this.repathFailCount = 0;
            this._lastBlockingUnit = null;
        }
        if (this.stuckSpeechCooldown > 0) {
            this.stuckSpeechCooldown -= deltaTime;
        }

        const distToNextNodeAfterMove = distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y);
        const arrivalTolerance = Math.max(moveSpeed * 0.5, this.size * CONFIG.PATHFINDING.UNIT_COLLISION_RADIUS_FACTOR);

        if (distToNextNodeAfterMove <= arrivalTolerance || (moveSpeed >= distToNextNode && distToNextNode > 1e-5 && Math.abs(finalDeltaX - desiredDeltaX) < 1e-4 && Math.abs(finalDeltaY - desiredDeltaY) < 1e-4)) {
            this.currentPathNodeIndex++;
            while (this.currentPathNodeIndex < this.currentPath.length) {
                const nextNode = this.currentPath[this.currentPathNodeIndex];
                const distToNext = distance(this.x, this.y, nextNode.x, nextNode.y);
                if (distToNext < arrivalTolerance * CONFIG.PATHFINDING.SKIP_REDUNDANT_NODE_FACTOR) {
                    this.currentPathNodeIndex++;
                } else {
                    break;
                }
            }
            if (this.currentPathNodeIndex >= this.currentPath.length) {
                this.currentPath = []; this.currentPathNodeIndex = 0;
                if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < arrivalTolerance * CONFIG.PATHFINDING.FINAL_ARRIVAL_TOLERANCE_FACTOR) {
                    this.isMoving = false; 
                    //this.x = this.worldTargetX; this.y = this.worldTargetY;
                    if (this.hovers) {
                        this.hoverVelocityX = 0;
                        this.hoverVelocityY = 0;
                    }
                } else if (this.isMoving) {
                    this.setMoveTarget(this.worldTargetX, this.worldTargetY);
                }
            }
        }
        else if (fullBlockEncountered && this.isMoving && !blockedByUnit) {
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
                const nudgedShape = { type: 'circle', x: nudgedX, y: nudgedY, radius: this.size / 2 + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 15) };
                for (const obs of obstaclesForCollision) {
                    const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                    const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                    for (const obsCS of shapesArray) {
                        const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                        if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, nudgedShape) : rectCircleOverlap(obsCS, nudgedShape))) ||
                            (obsCS.type === 'circle' && circleOverlap(obsCS, nudgedShape)) ||
                            (obsCS.type === 'ellipse' && circleEllipseOverlap(nudgedShape, obsCS))) {
                            canNudgeToSpot = false; break;
                        }
                    }
                    if (!canNudgeToSpot) break;
                }

                if (canNudgeToSpot) {
                    this.x = nudgedX; this.y = nudgedY;
                } else {
                    const nudgeDist = this.IMMEDIATE_BUMP_NUDGE_BACK_DISTANCE + this.IMMEDIATE_BUMP_NUDGE_SIDE_DISTANCE;
                    let foundNudge = false;
                    for (let ai = 0; ai < 8 && !foundNudge; ai++) {
                        const tryAngle = (ai / 8) * Math.PI * 2;
                        const tryX = originalX + Math.cos(tryAngle) * nudgeDist;
                        const tryY = originalY + Math.sin(tryAngle) * nudgeDist;
                        let tryClear = true;
                        const tryShape = { type: 'circle', x: tryX, y: tryY, radius: this.size / 2 + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 15) };
                        for (const obs of obstaclesForCollision) {
                            const obsShapes = this.game.level._getObstacleCollisionShape(obs);
                            const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];
                            for (const obsCS of shapesArray) {
                                const hasRotation = obsCS.type === 'rectangle' && obsCS.rotation !== undefined && obsCS.rotation !== 0;
                                if ((obsCS.type === 'rectangle' && (hasRotation ? obbCircleOverlap(obsCS, tryShape) : rectCircleOverlap(obsCS, tryShape))) ||
                                    (obsCS.type === 'circle' && circleOverlap(obsCS, tryShape)) ||
                                    (obsCS.type === 'ellipse' && circleEllipseOverlap(tryShape, obsCS))) {
                                    tryClear = false; break;
                                }
                            }
                            if (!tryClear) break;
                        }
                        if (tryClear) {
                            this.x = tryX; this.y = tryY; foundNudge = true;
                        }
                    }
                    if (!foundNudge) {
                        this.x = originalX; this.y = originalY;
                    }
                }

                if (this.worldTargetX !== undefined && this.worldTargetY !== undefined) {

                    // --- OPTIMIZATION Phase 2: "Wait and See" + Throttled Repath ---
                    const distToTarget = distance(this.x, this.y, this.worldTargetX, this.worldTargetY);
                    const isCloseToTarget = distToTarget < this.size * 6;

                    if (isCloseToTarget) {
                        const targetBlockedByObstacle = !hasLineOfSight(this.x, this.y, this.worldTargetX, this.worldTargetY, obstaclesForCollision, this.game.level);
                        if (targetBlockedByObstacle && this.repathCooldown <= 0) {
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Bumped close to target but LOS blocked. Repathing around obstacle.`);
                            this.calculatePath(this.game.level.worldToGridCoords(this.x, this.y), this.isPhasing);
                    this.repathCooldown = CONFIG.PATHFINDING.REPATH_STUCK_COOLDOWN_AFTER + Math.random();
                        } else if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                            if (targetBlockedByObstacle) {
                                console.log(`[${this.id} _HM] Bumped close to target, LOS blocked, but repath on cooldown. Waiting.`);
                            } else {
                                console.log(`[${this.id} _HM] Bumped close to target. Waiting instead of repathing.`);
                            }
                        }
                    } else if (this.repathCooldown <= 0) {
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Recalculating path after immediate bump to: (${this.worldTargetX.toFixed(0)}, ${this.worldTargetY.toFixed(0)})`);

                        this.calculatePath(this.game.level.worldToGridCoords(this.x, this.y), this.isPhasing);

                        // Set a random cooldown to prevent swarm sync (0.5s - 1.5s)
                        this.repathCooldown = CONFIG.PATHFINDING.REPATH_STUCK_COOLDOWN_AFTER + Math.random();
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
            const targetAngle = Math.atan2(worldY - this.y, worldX - this.x);
            this.facingAngle = lerpAngle(this.facingAngle, targetAngle, this.turnRate * 0.016);
            this.updateVisualDirection(this.facingAngle);
            this.gunAimAngle = this.facingAngle;
        }
    }

    setMoveTarget(worldX, worldY, excludeUnits = null) {
        if (this.isPlayerDirectFiring) this.isPlayerDirectFiring = false;
        if (this.actionTimer > 0 && !(this instanceof Raccoon && this.isAimingGrenade)) return false;

        this.formationGroup = excludeUnits || null;

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
            let foundValidStart = false; const searchRadius = CONFIG.PATHFINDING.SPAWN_WALKABLE_SEARCH_RADIUS;
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
            this.isMoving = false; this.currentPath = []; this.clearFormationState(); this.worldTargetX = this.x; this.worldTargetY = this.y; return false;
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

            if (!foundAlternative) { this.isMoving = false; this.currentPath = []; this.clearFormationState(); this.worldTargetX = this.x; this.worldTargetY = this.y; return false; }
        }

        this.worldTargetX = finalWorldTargetX; this.worldTargetY = finalWorldTargetY;

        if (this.calculatePath(conceptualStartGrid, this.isPhasing, excludeUnits)) {
            return true;
        } else {
            if (this.isPhasing && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * CONFIG.PATHFINDING.PHASING_DIRECT_MOVE_THRESHOLD) {
                this.isMoving = true;
                this.currentPath = [];
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Pathing failed during phase, will attempt direct move. isMoving: ${this.isMoving}`);
                return true;
            }
            this.isMoving = false;
            this.clearFormationState();
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] calculatePath returned false. Move command failed.`);
            return false;
        }
    }

    clearFormationState() {
        this.formationGroup = null;
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

        const pelletCount = this.weapon.pelletCount || 1;
        const spreadAngle = this.weapon.spreadAngle || 0;

        for (let i = 0; i < pelletCount; i++) {
            let pelletAngle = fireAngle;
            if (pelletCount > 1 && spreadAngle > 0) {
                const angleOffset = (Math.random() - 0.5) * spreadAngle;
                pelletAngle = fireAngle + angleOffset;
            }
            const targetX = this.x + Math.cos(pelletAngle) * this.weapon.range;
            const targetY = this.y + Math.sin(pelletAngle) * this.weapon.range;
             const spawnOffsetY = CONFIG.PROJECTILE_SPRITE_OFFSET_Y || 0;
             const projectile = this.game.getProjectileFromPool(this.x, this.y + spawnOffsetY, targetX, targetY, this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this, effectiveAccuracy);
            this.game.addProjectile(projectile);
        }

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

        if (this.game && this.game.trySpeech) {
            if (this.hp > 0 && this.hp < this.maxHp * 0.3) {
                this.game.trySpeech(this, 'ON_LOW_HP');
            } else if (this.hp > 0) {
                this.game.trySpeech(this, 'ON_DAMAGE');
            }
        }

        let died = false;

        if (this.hp <= 0) {
            this.hp = 0;
            died = true;
            if (attackerUnit && attackerUnit.team === 'player' && typeof attackerUnit.addXp === 'function') {
                let killXp = CONFIG.XP_PER_KILL || 10;
                if (this instanceof PossumHeavy) killXp += (CONFIG.XP_PER_HEAVY_KILL || 15);
                attackerUnit.addXp(killXp);
                if (typeof attackerUnit.incrementKillCount === 'function') attackerUnit.incrementKillCount();
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(attackerUnit, 'ON_KILL', 0.25);
                }
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

            this.targetAcquisitionTimer = 0;
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
        if (this.isAlive() && this.hovers) {
            const hoverBobAmp = bobbingConfig?.UNIT_HOVER_BOB_AMPLITUDE ?? 0.5;
            const hoverBobSpeed = bobbingConfig?.UNIT_HOVER_BOB_SPEED ?? 1.5;
            yOffset = Math.sin(this.bobbingCounter) * hoverBobAmp;
            this.bobbingCounter += (this.game?._frameDeltaTime || 0.016) * hoverBobSpeed;
        } else if (isActuallyMoving && this.isAlive() && bobbingConfig && bobbingConfig.UNIT_BOBBING_ENABLED) {
            yOffset = Math.sin(this.bobbingCounter) * bobbingConfig.UNIT_BOBBING_AMPLITUDE;
        }

        ctx.save();
        ctx.translate(this.x, this.y + yOffset);

        if (this.isPhasing) {
            ctx.globalAlpha = CONFIG.UNIT_VISUALS.UNIT_PHASING_OPACITY || 0.5;
        }

        if (this.isAlive() && this.game.isDebugVisualsActive && CONFIG.DEBUG_DRAW_UNIT_PATHING_BOUNDS) {
            const pathingRadius = (this.size / 2) + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 0);
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
                this.deadSpriteFlipped = Math.random() < 0.5;
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
            if (!this.isAlive() && this.deadSpriteFlipped) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(spriteToDraw, drawOffsetX, drawOffsetY, spriteWidth, spriteHeight);
                ctx.restore();
            } else {
                ctx.drawImage(spriteToDraw, drawOffsetX, drawOffsetY, spriteWidth, spriteHeight);
            }
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

        const isUnitSelected = this.game && this.game.selectedUnits && this.game.selectedUnits.includes(this);
        if (isUnitSelected && this.isAlive() && this.team === 'player') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.size * 1.3, this.size * 0.6, this.size * 0.22, 0, 0, Math.PI * 2);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.55)';
            ctx.shadowColor = 'rgba(100, 180, 255, 0.35)';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
        }

        if (this.isAlive() && CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR) {
            const healthBarStyle = CONFIG.UI_SETTINGS.HEALTH_BAR;
            const barWidth = this.size * (healthBarStyle.WIDTH_MULTIPLIER || 1.5);
            const barX = this.x - barWidth / 2;
            const hpBarHeight = healthBarStyle.HEIGHT || 4;
            const spriteVisualHeight = spriteToDraw ? spriteHeight : this.size;
            const barY = (this.y + yOffset) - (spriteVisualHeight / 2) - (healthBarStyle.Y_OFFSET_BASE || 0) - hpBarHeight - 5;
            const hpPercent = this.hp / this.maxHp;

            let barOpacity = 1.0;
            const fadeThreshold = healthBarStyle.FADE_START_THRESHOLD || 0.25;
            const flashThreshold = healthBarStyle.FLASH_THRESHOLD || 0.25;
            if (hpPercent <= flashThreshold) {
                const flashSpeed = healthBarStyle.FLASH_SPEED || 8;
                const flashMin = healthBarStyle.FLASH_MIN_OPACITY || 0.3;
                const flashMax = healthBarStyle.FLASH_MAX_OPACITY || 1.0;
                const t = Math.sin(performance.now() / 1000 * flashSpeed) * 0.5 + 0.5;
                barOpacity = flashMin + t * (flashMax - flashMin);
            } else if (hpPercent > fadeThreshold) {
                const fadeMin = healthBarStyle.FADE_MIN_OPACITY || 0.15;
                barOpacity = 1.0 - (hpPercent - fadeThreshold) / (1.0 - fadeThreshold) * (1.0 - fadeMin);
            }

            this.game.ctx.save();
            this.game.ctx.globalAlpha = barOpacity;

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

            this.game.ctx.restore();
        }
    }

    static resolveAllOverlaps(units, maxIterations = 5) {
        if (!units || units.length < 2) return;

        for (let iter = 0; iter < maxIterations; iter++) {
            let anyResolved = false;

            for (let i = 0; i < units.length; i++) {
                const a = units[i];
                if (!a.isAlive() || a.isPhasing) continue;

                for (let j = i + 1; j < units.length; j++) {
                    const b = units[j];
                    if (!b.isAlive() || b.isPhasing) continue;

                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const distSq = dx * dx + dy * dy;
                    const combinedRadii = (a.size + b.size) * 0.5;
                    const minDist = combinedRadii * 0.9;

                    if (distSq < minDist * minDist) {
                        const dist = Math.sqrt(distSq) || 1e-6;
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const pushAmount = overlap * 0.5 + 0.5;

                        a.x -= nx * pushAmount;
                        a.y -= ny * pushAmount;
                        b.x += nx * pushAmount;
                        b.y += ny * pushAmount;

                        a.x = Math.max(a.size / 2, Math.min(a.x, (CONFIG.WORLD_WIDTH || 0) - a.size / 2));
                        a.y = Math.max(a.size / 2, Math.min(a.y, (CONFIG.WORLD_HEIGHT || 0) - a.size / 2));
                        b.x = Math.max(b.size / 2, Math.min(b.x, (CONFIG.WORLD_WIDTH || 0) - b.size / 2));
                        b.y = Math.max(b.size / 2, Math.min(b.y, (CONFIG.WORLD_HEIGHT || 0) - b.size / 2));

                        anyResolved = true;
                    }
                }
            }

            if (!anyResolved) break;
        }
    }

    isOverlapping() {
        if (!this.game || !this.isAlive()) return false;

        const scanRadius = this.size * 1.5;
        let nearbyUnits = null;
        if (this.game.spatialGrid) {
            const gridObjects = this.game.spatialGrid.queryRange(this.x, this.y, scanRadius);
            nearbyUnits = gridObjects.filter(o => o instanceof Unit);
        } else {
            nearbyUnits = [
                ...(this.game.getLivingPlayerControlledUnits?.() || []),
                ...(this.game.enemyUnits || []),
                ...(this.game.hostageUnits || [])
            ];
        }

        const formationGroupSet = this.formationGroup ? new Set(this.formationGroup) : null;

        for (const other of nearbyUnits) {
            if (other === this || !other.isAlive() || other.isPhasing) continue;
            if (formationGroupSet && formationGroupSet.has(other)) continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx * dx + dy * dy;
            const combinedRadii = (this.size + other.size) * 0.5;

            if (distSq < combinedRadii * combinedRadii) {
                return true;
            }
        }
        return false;
    }
}