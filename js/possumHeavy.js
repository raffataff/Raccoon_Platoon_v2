// js/possumHeavy.js
// complete
class PossumHeavy extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_HEAVY_HP, CONFIG.POSSUM_HEAVY_SPEED, CONFIG.POSSUM_HEAVY_SIZE, CONFIG.POSSUM_HEAVY_COLOR, id || `PHVY-${Date.now().toString(36).slice(-4)}`);
        this.weapon = WEAPONS.POSSUM_HEAVY_WEAPON;
        this.canShootWhileMoving = false;
        this.heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        this.detectionRange = this.heavyAIConfig.DETECTION_RANGE || (CONFIG.POSSUM_DETECTION_RANGE || 250) + 20;

        this.aiState = 'GUARDING';

        this.guardPost = { x: x, y: y };
        this.maxChaseDistanceFromPost = this.weapon.range * (this.heavyAIConfig.MAX_CHASE_DISTANCE_FROM_POST_FACTOR || 0.95);

        this.chaseDestination = null;
        this.timeSinceLastChaseDestUpdate = 0;
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.heavyAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.heavyAIConfig.TARGET_DEVIATION_RECALC_THRESHOLD_CELLS * CONFIG.GRID_CELL_SIZE) ** 2 || (3 * CONFIG.GRID_CELL_SIZE) ** 2;
        this.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY = this.heavyAIConfig.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY || 40;
        this.ENGAGE_RANGE_BUFFER = this.heavyAIConfig.ENGAGE_RANGE_BUFFER || 5;


        this.STUCK_RECOVERY_COOLDOWN_INTERNAL = this.heavyAIConfig.STUCK_RECOVERY_COOLDOWN_SHORT || 0.75;
        // MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL is now used by the base Unit.onStuck for phasing.
        this.HEAVY_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE = this.heavyAIConfig.MAX_CONSECUTIVE_STUCK_ATTEMPTS || 3;
        this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL = this.heavyAIConfig.DESPERATE_STUCK_MOVE_RADIUS_CELLS || 4;

        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.aiState === 'ENGAGING_CHASING_HEAVY') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        this.aiLogicHeavy(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime); // This will call the Unit.update which includes stuck frame counting
    }

    aiLogicHeavy(deltaTime, playerUnitsOnMap, obstacles) { /* ... (Unchanged from previous complete version) ... */
        let currentTarget = this.manualTarget;

        if (this.actionTimer > 0) { return; }

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap || [], obstacles);
            currentTarget = this.autoTarget;
        }

        if (currentTarget && currentTarget.isAlive()) {
            this.manualTarget = currentTarget;
            const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);
            const losToTarget = hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, this.game.level.obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level);

            if (this.aiState === 'GUARDING' || this.aiState === 'SUSPICIOUS') {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] Acquired target ${currentTarget.id}. Current state: ${this.aiState}. Dist: ${distToTarget.toFixed(0)}, LOS: ${losToTarget}`);
                this.lastKnownPlayerPosition = null;
                this.alertedByAlly = false;
                this.propagateAlert(this.manualTarget);
            }

            if (distToTarget <= (this.weapon.range - this.ENGAGE_RANGE_BUFFER) && losToTarget) {
                if (this.aiState !== 'ENGAGING_SHOOTING_HEAVY') {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] Target ${currentTarget.id} in range & LOS. Switching to ENGAGING_SHOOTING_HEAVY.`);
                    this.aiState = 'ENGAGING_SHOOTING_HEAVY';
                    if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                }
            } else {
                if (this.aiState !== 'ENGAGING_CHASING_HEAVY') {
                     if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] Target ${currentTarget.id} out of range/LOS. Switching to ENGAGING_CHASING_HEAVY.`);
                    this.aiState = 'ENGAGING_CHASING_HEAVY';
                    this.timeSinceLastChaseDestUpdate = this.CHASE_DESTINATION_REFRESH_INTERVAL;
                    this.chaseDestination = null;
                }
            }
        } else {
            if (this.aiState === 'ENGAGING_CHASING_HEAVY' || this.aiState === 'ENGAGING_SHOOTING_HEAVY') {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] Target lost. Reverting to GUARDING/SUSPICIOUS from ${this.aiState}.`);
                this.aiState = (this.lastKnownPlayerPosition) ? 'SUSPICIOUS' : 'GUARDING';
                 if (this.aiState === 'GUARDING' && (!this.isMoving || this.worldTargetX !== this.guardPost.x || this.worldTargetY !== this.guardPost.y)) {
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                } else if (this.aiState === 'SUSPICIOUS' && this.lastKnownPlayerPosition && (!this.isMoving || this.worldTargetX !== this.lastKnownPlayerPosition.x || this.worldTargetY !== this.lastKnownPlayerPosition.y)) {
                     if(!this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y)){
                        this.aiState = 'GUARDING';
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                }
            }
            this.manualTarget = null;
            this.chaseDestination = null;
        }

        switch (this.aiState) {
            case 'GUARDING':
                const atPostTolerance = this.heavyAIConfig.GUARD_POST_POSITION_TOLERANCE || this.game.level.gridCellSize / 2;
                const distToGuardPostCurrent = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);

                if (distToGuardPostCurrent > atPostTolerance) {
                    if (!this.isMoving || (this.worldTargetX !== this.guardPost.x || this.worldTargetY !== this.guardPost.y)) {
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    if (this.isMoving) {
                        this.isMoving = false;
                        this.currentPath = [];
                        this.x = this.guardPost.x;
                        this.y = this.guardPost.y;
                    }
                }
                break;
            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    const arrivalToleranceLKP = this.game.level.gridCellSize * 1.5;

                    if (!this.isMoving || (this.worldTargetX !== this.lastKnownPlayerPosition.x || this.worldTargetY !== this.lastKnownPlayerPosition.y)) {
                        if (distToLKP > arrivalToleranceLKP) {
                           if(!this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y)){
                                this.aiState = 'GUARDING'; // Fallback if can't path to LKP
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
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    if (this.isMoving) {
                        this.isMoving = false;
                        this.currentPath = [];
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] SHOOTING_HEAVY: Stopped movement to fire.`);
                    }
                    if (distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y) > 0.1) {
                        const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                        this.facingAngle = angleToTarget;
                        this.gunAimAngle = angleToTarget;
                    }
                } else {
                    this.aiState = 'GUARDING';
                }
                break;

            case 'ENGAGING_CHASING_HEAVY':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const target = this.manualTarget;
                    const currentDistToGuardPost = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);

                    if (currentDistToGuardPost >= this.maxChaseDistanceFromPost) {
                        this.aiState = 'GUARDING';
                        this.chaseDestination = null;
                        this.manualTarget = null;
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] Too far from post while CHASING. State: GUARDING.`);
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                        break;
                    }

                    let shouldUpdateChaseDest = false;
                    if (!this.chaseDestination) {
                        shouldUpdateChaseDest = true;
                    } else if (this.timeSinceLastChaseDestUpdate >= this.CHASE_DESTINATION_REFRESH_INTERVAL) {
                        shouldUpdateChaseDest = true;
                    } else if (distanceSq(target.x, target.y, this.chaseDestination.x, this.chaseDestination.y) > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ) {
                        shouldUpdateChaseDest = true;
                    } else if (!this.isMoving && distance(this.x, this.y, target.x, target.y) > this.weapon.range - this.ENGAGE_RANGE_BUFFER) {
                        shouldUpdateChaseDest = true;
                    }

                    if (shouldUpdateChaseDest) {
                        const predictionTime = this.heavyAIConfig.CHASE_PREDICTION_TIME_FACTOR || 0.15;
                        let predictedX = target.x + target.currentVelocity.x * predictionTime;
                        let predictedY = target.y + target.currentVelocity.y * predictionTime;

                        predictedX = Math.max(this.size, Math.min(predictedX, CONFIG.WORLD_WIDTH - this.size));
                        predictedY = Math.max(this.size, Math.min(predictedY, CONFIG.WORLD_HEIGHT - this.size));

                        const distToThisPredicted = distance(this.x, this.y, predictedX, predictedY);
                        if (distToThisPredicted < this.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY) {
                             if (distance(this.x, this.y, target.x, target.y) > 1.0) {
                                const angleToActualTarget = Math.atan2(target.y - this.y, target.x - this.x);
                                predictedX = this.x + Math.cos(angleToActualTarget) * this.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY;
                                predictedY = this.y + Math.sin(angleToActualTarget) * this.MIN_APPROACH_DISTANCE_TO_TARGET_HEAVY;
                                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] CHASING: Predicted target too close, adjusting to maintain min approach distance from current pos.`);
                            } else {
                                predictedX = this.x;
                                predictedY = this.y;
                                if(this.isMoving) {this.isMoving = false; this.currentPath = [];}
                            }
                        }

                        this.chaseDestination = { x: predictedX, y: predictedY };
                        if(this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y)){
                            this.timeSinceLastChaseDestUpdate = 0;
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogicHeavy] CHASING: Updated chase destination to (${predictedX.toFixed(0)}, ${predictedY.toFixed(0)}). Pathing success.`);
                        } else {
                             if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} aiLogicHeavy] CHASING: setMoveTarget failed for new chase destination.`);
                        }
                    }
                } else {
                    this.aiState = 'GUARDING';
                }
                break;
        }
    }

    onStuck(reason = 'unknown') {
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        const currentTime = performance.now() / 1000;

        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
            console.warn(`[${this.id} onStuck HEAVY] Reason: ${reason}. AI State: ${this.aiState}. Pos:(${this.x.toFixed(0)},${this.y.toFixed(0)}), Target:(${this.worldTargetX.toFixed(0)},${this.worldTargetY.toFixed(0)})`);
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

        const maxStuckBeforePhasing = this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL + 2; // Inherited
        if (this.consecutiveStuckAttempts >= maxStuckBeforePhasing && !this.isPhasing) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.warn(`[${this.id} onStuck HEAVY] Max consecutive stuck attempts (${this.consecutiveStuckAttempts}). Initiating Phasing.`);
            }
            this.isPhasing = true;
            this.phasingTimer = CONFIG.UNIT_PHASING_DURATION || 0.75;
            this.consecutiveStuckAttempts = 0;
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