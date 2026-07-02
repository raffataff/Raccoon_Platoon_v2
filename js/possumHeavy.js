// js/possumHeavy.js
// complete
class PossumHeavy extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_HEAVY_HP, CONFIG.POSSUM_HEAVY_SPEED, CONFIG.POSSUM_HEAVY_SIZE, CONFIG.POSSUM_HEAVY_COLOR, id || `PHVY-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_HEAVY_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_HEAVY_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_HEAVY_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_HEAVY_DEAD_SPRITE_SCALE';
        this.weaponName = CONFIG.POSSUM_HEAVY_DEFAULT_WEAPON || 'POSSUM_HEAVY_WEAPON';
        this.canShootWhileMoving = false;
        this.heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        this.detectionRange = this.heavyAIConfig.DETECTION_RANGE || (CONFIG.POSSUM_DETECTION_RANGE || 250) + 20;

        this.aiState = 'GUARDING';

        this.guardPost = { x: x, y: y };
        this.maxChaseDistanceFromPost = this.weapon ? this.weapon.range * (this.heavyAIConfig.MAX_CHASE_DISTANCE_FROM_POST_FACTOR || 0.95) : 500;

        this.chaseDestination = null;
        this.timeSinceLastChaseDestUpdate = 0;
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.heavyAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.heavyAIConfig.TARGET_DEVIATION_RECALC_THRESHOLD_CELLS * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2 || (3 * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2;
        this.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY = this.heavyAIConfig.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY || 40;
        this.ENGAGE_RANGE_BUFFER = this.heavyAIConfig.ENGAGE_RANGE_BUFFER || 5;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.heavyAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;


        this.STUCK_RECOVERY_COOLDOWN_INTERNAL = this.heavyAIConfig.STUCK_RECOVERY_COOLDOWN_SHORT || 0.75;
        this.HEAVY_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE = this.heavyAIConfig.MAX_CONSECUTIVE_STUCK_ATTEMPTS || 3;
        this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL = this.heavyAIConfig.DESPERATE_STUCK_MOVE_RADIUS_CELLS || 4;

        // --- MODIFIED: Removed premature setMoveTarget call ---
        // The AI's 'GUARDING' state will handle the initial move command on the first update.
        this.isMoving = false;
        // --- END MODIFIED ---
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.aiState === 'ENGAGING_CHASING_HEAVY') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if (this.actionTimer > 0) return;

        const playerUnitsOnMap = this.game.getLivingPlayerControlledUnits();
        let currentTarget = this.manualTarget || this.autoTarget;

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap || [], obstacles);
            currentTarget = this.autoTarget;
        }

        // --- MODIFICATION START: Corrected state transition logic ---
        if (!currentTarget || !currentTarget.isAlive()) {
            if (this.aiState === 'ENGAGING_CHASING_HEAVY' || this.aiState === 'ENGAGING_SHOOTING_HEAVY') {
                this.aiState = (this.lastKnownPlayerPosition) ? 'SUSPICIOUS' : 'GUARDING';
            }
            this.manualTarget = null;
            this.autoTarget = null; // Also clear auto-target
        } else {
            const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);
            const losToTarget = hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, this.game.level.activeObstacles, this.game.level);

            if (distToTarget <= (this.weapon.range - this.ENGAGE_RANGE_BUFFER) && losToTarget) {
                this.aiState = 'ENGAGING_SHOOTING_HEAVY';
            } else {
                this.aiState = 'ENGAGING_CHASING_HEAVY';
            }
            if (this.aiState !== 'GUARDING' && this.aiState !== 'SUSPICIOUS' && !this.alertedByAlly) {
                this.propagateAlert(currentTarget);
            }
        }

        switch (this.aiState) {
            case 'GUARDING':
                const atPostTolerance = this.heavyAIConfig.GUARD_POST_POSITION_TOLERANCE || this.game.level.gridCellSize / 2;
                const distToGuardPostCurrent = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);
                const targetIsGuardPost = this.worldTargetX !== undefined &&
                    Math.abs(this.worldTargetX - this.guardPost.x) < this.game.level.gridCellSize &&
                    Math.abs(this.worldTargetY - this.guardPost.y) < this.game.level.gridCellSize;
                const atWorldTarget = targetIsGuardPost && !this.isMoving && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) <= this.size * 0.75;

                if (distToGuardPostCurrent <= atPostTolerance) {
                    if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                    this.x = this.guardPost.x;
                    this.y = this.guardPost.y;
                } else if (atWorldTarget) {
                    if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                } else if (!this.isMoving && this.repathCooldown <= 0) {
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                }
                break;
            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    const arrivalToleranceLKP = this.game.level.gridCellSize * 1.5;

                    if (this.repathCooldown <= 0 && (!this.isMoving || (this.worldTargetX !== this.lastKnownPlayerPosition.x || this.worldTargetY !== this.lastKnownPlayerPosition.y))) {
                        if (distToLKP > arrivalToleranceLKP) {
                           if(!this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y)){
                                this.aiState = 'GUARDING';
                                this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                            }
                        }
                    }

                    if (!this.isMoving && distToLKP <= arrivalToleranceLKP) {
                        this.lastKnownPlayerPosition = null;
                        this.aiState = 'GUARDING';
                        this.alertedByAlly = false;
                        this.actionTimer = this.heavyAIConfig.SUSPICIOUS_STATE_SCAN_DURATION || 0.5;
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    this.aiState = 'GUARDING';
                    this.alertedByAlly = false;
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                }
                break;

            case 'ENGAGING_SHOOTING_HEAVY':
                if (this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
                if (currentTarget && currentTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);
                    const losToTarget = hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, this.game.level.activeObstacles, this.game.level);
                    if (distToTarget > this.weapon.range + this.ENGAGE_RANGE_BUFFER || !losToTarget) {
                        this.aiState = 'ENGAGING_CHASING_HEAVY';
                        this.repathCooldown = 0;
                    }
                } else {
                    this.aiState = (this.lastKnownPlayerPosition) ? 'SUSPICIOUS' : 'GUARDING';
                }
                break;

            case 'ENGAGING_CHASING_HEAVY':
                if (currentTarget && currentTarget.isAlive()) {
                    const currentDistToGuardPost = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);

                    if (currentDistToGuardPost >= this.maxChaseDistanceFromPost) {
                        this.aiState = 'GUARDING';
                        this.chaseDestination = null;
                        this.manualTarget = null;
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                        break;
                    }

                    let shouldUpdateChaseDest = false;
                    const throttleCount = CONFIG.PATHFINDING.ENEMY_CHASE_THROTTLE_COUNT || 20;
                    const throttleMult = CONFIG.PATHFINDING.ENEMY_CHASE_THROTTLE_MULTIPLIER || 2.0;
                    const enemyCount = this.game ? this.game.enemyUnits.length : 0;
                    const effectiveRefreshInterval = enemyCount > throttleCount
                        ? this.CHASE_DESTINATION_REFRESH_INTERVAL * throttleMult
                        : this.CHASE_DESTINATION_REFRESH_INTERVAL;
                    if (!this.chaseDestination) {
                        shouldUpdateChaseDest = true;
                    } else if (this.timeSinceLastChaseDestUpdate >= effectiveRefreshInterval) {
                        shouldUpdateChaseDest = true;
                    } else if (this.timeSinceLastChaseDestUpdate > this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL &&
                        distanceSq(currentTarget.x, currentTarget.y, this.chaseDestination.x, this.chaseDestination.y) > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ) {
                        shouldUpdateChaseDest = true;
                    } else if (!this.isMoving && this.repathCooldown <= 0 && distance(this.x, this.y, currentTarget.x, currentTarget.y) > this.weapon.range - this.ENGAGE_RANGE_BUFFER) {
                        shouldUpdateChaseDest = true;
                    }

                    if (shouldUpdateChaseDest) {
                        this.timeSinceLastChaseDestUpdate = 0;
                        const predictionTime = this.heavyAIConfig.CHASE_PREDICTION_TIME_FACTOR || 0.15;
                        let predictedX = currentTarget.x + currentTarget.currentVelocity.x * predictionTime;
                        let predictedY = currentTarget.y + currentTarget.currentVelocity.y * predictionTime;

                        predictedX = Math.max(this.size, Math.min(predictedX, CONFIG.WORLD_WIDTH - this.size));
                        predictedY = Math.max(this.size, Math.min(predictedY, CONFIG.WORLD_HEIGHT - this.size));

                        this.chaseDestination = { x: predictedX, y: predictedY };
                        if(this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y)){
                            this.timeSinceLastChaseDestUpdate = 0;
                        } else if (!this.isMoving && this.repathCooldown <= 0) {
                            this.repathCooldown = 0.5;
                        }
                    }
                } else {
                    this.aiState = (this.lastKnownPlayerPosition) ? 'SUSPICIOUS' : 'GUARDING';
                }
                break;
        }
    }


    onStuck(reason = 'unknown') {
        /* ... (Unchanged from previous complete version) ... */
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        const currentTime = performance.now() / 1000;

        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//            console.warn(`[${this.id} onStuck HEAVY] Reason: ${reason}. AI State: ${this.aiState}. Pos:(${this.x.toFixed(0)},${this.y.toFixed(0)}), Target:(${this.worldTargetX.toFixed(0)},${this.worldTargetY.toFixed(0)})`);
        }

        this.isMoving = false;
        this.stuckFrames = 0;
        this.pathingStuckFrames = 0;
        this.lastRepathAttemptTime = currentTime;

        if (currentTime - this.lastOnStuckTime < this.STUCK_RECOVERY_COOLDOWN_INTERNAL) {
            this.consecutiveStuckAttempts++;
        } else {
            this.consecutiveStuckAttempts = 1;
        }
        this.lastOnStuckTime = currentTime;

        const maxStuckBeforePhasing = (this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL || 3) + 2; // Inherited
        if (this.consecutiveStuckAttempts >= maxStuckBeforePhasing && !this.isPhasing) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//                console.warn(`[${this.id} onStuck HEAVY] Max consecutive stuck attempts (${this.consecutiveStuckAttempts}). Initiating Phasing.`);
            }
            this.isPhasing = true;
            this.phasingTimer = CONFIG.PATHFINDING.PHASING_DURATION || 0.75;
            this.consecutiveStuckAttempts = 0;
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5) {
                 this.isMoving = true;
                 if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                    this._setPhasingEscapePath();
                 }
            } else {
                this.isMoving = false;
            }
            return; // Phasing will take over
        }

        // Heavy's specific recovery if not phasing
        this.currentPath = []; // Clear path if not phasing
        this.chaseDestination = null;

        if (this.consecutiveStuckAttempts > this.HEAVY_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck HEAVY] Heavy's own max stuck attempts. Desperate: return to guard post or desperate move.`);
            if (!this.setMoveTarget(this.guardPost.x, this.guardPost.y)) {
                this._attemptDesperateMove(); // Fallback if guard post pathing fails
            }
            this.consecutiveStuckAttempts = 0; // Reset heavy's own counter
            this.aiState = 'GUARDING';
            return;
        }

        if (this.aiState !== 'GUARDING' || (this.worldTargetX !== this.guardPost.x || this.worldTargetY !== this.guardPost.y) ) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} onStuck HEAVY] Attempting to return to guard post.`);
            if (!this.setMoveTarget(this.guardPost.x, this.guardPost.y)) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck HEAVY] Pathing to guard post failed, attempting desperate move.`);
                this._attemptDesperateMove();
            }
        } else {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck HEAVY] Stuck while already trying to reach guard post. Attempting desperate move.`);
            this._attemptDesperateMove();
        }
        this.aiState = 'GUARDING';
    }
}