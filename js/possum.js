// js/possum.js
// complete
class PossumGrunt extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_GRUNT_HP, CONFIG.POSSUM_GRUNT_SPEED, CONFIG.POSSUM_GRUNT_SIZE, CONFIG.POSSUM_GRUNT_COLOR, id);

        this.turnRate = CONFIG.POSSUM_GRUNT_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_GRUNT_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_GRUNT_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_GRUNT_DEAD_SPRITE_SCALE';

        this.weaponName = CONFIG.POSSUM_GRUNT_DEFAULT_WEAPON || 'POSSUM_RIFLE';
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE || 250;
        this.gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};

        this.aiState = 'PATROLLING';

        this.patrolPoint1 = { x: x, y: y };
        this.patrolPoint2 = this.generateSecondPatrolPoint(x, y, this.gruntAIConfig.PATROL_MIN_RADIUS || 80, this.gruntAIConfig.PATROL_MAX_RADIUS || 200);
        this.currentTargetPatrolPoint = this.patrolPoint2;
        this.patrolWaitTimer = 0;
        this.PATROL_WAIT_DURATION_BASE = this.gruntAIConfig.PATROL_WAIT_BASE || 1.5;
        this.PATROL_WAIT_RANDOM_ADD = this.gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0;
        this.PATROL_WAIT_TOTAL_DURATION = this.PATROL_WAIT_DURATION_BASE + Math.random() * this.PATROL_WAIT_RANDOM_ADD;

        this.chaseDestination = null;
        this.timeSinceLastChaseDestUpdate = 0;
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.gruntAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        // --- OPTIMIZATION Phase 4: Throttle deviation updates ---
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.gruntAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.gruntAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.GRID_CELL_SIZE) ** 2;
        this.ENGAGE_RANGE_BUFFER = this.gruntAIConfig.ENGAGE_RANGE_BUFFER || 10;


        this.STUCK_RECOVERY_COOLDOWN_INTERNAL = this.gruntAIConfig.STUCK_RECOVERY_COOLDOWN_SHORT || 1.5; // OPTIMIZATION Phase 2: Increased from 0.75 to 1.5
        this.GRUNT_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE = this.gruntAIConfig.MAX_CONSECUTIVE_STUCK_ATTEMPTS || 3;
        this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL = this.gruntAIConfig.DESPERATE_STUCK_MOVE_RADIUS_CELLS || 5;

        // --- MODIFIED: Removed premature setMoveTarget call ---
        // The AI's 'PATROLLING' state will handle the initial move command on the first update.
        this.isMoving = false;
        // --- END MODIFIED ---
    }

    generateSecondPatrolPoint(originX, originY, minRadius, maxRadius, attemptToAvoidCurrent = null) {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        let pX, pY, attempts = 0;
        const worldWidth = CONFIG.WORLD_WIDTH || (this.game && this.game.canvas ? this.game.canvas.width : 1000);
        const worldHeight = CONFIG.WORLD_HEIGHT || (this.game && this.game.canvas ? this.game.canvas.height : 800);
        const margin = this.size + (gruntAIConfig.PATROL_POINT_WORLD_MARGIN_BUFFER || 20);
        const navGrid = this.game.level.getNavigationGrid();
        const cellSize = this.game.level.gridCellSize;

        do {
            const angle = Math.random() * Math.PI * 2;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            pX = originX + Math.cos(angle) * radius;
            pY = originY + Math.sin(angle) * radius;
            pX = Math.max(margin, Math.min(pX, worldWidth - margin));
            pY = Math.max(margin, Math.min(pY, worldHeight - margin));

            if (attemptToAvoidCurrent && distance(pX, pY, attemptToAvoidCurrent.x, attemptToAvoidCurrent.y) < cellSize * 2) {
                attempts++; continue;
            }

            if (navGrid && this.game && this.game.level) {
                const gridCoords = this.game.level.worldToGridCoords(pX, pY);
                if (gridCoords.y >= 0 && gridCoords.y < navGrid.length &&
                    gridCoords.x >= 0 && gridCoords.x < navGrid[0].length &&
                    navGrid[gridCoords.y][gridCoords.x] === 0 &&
                    this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles)) {
                    break;
                }
            } else {
                if (this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles)) {
                    break;
                }
            }
            attempts++;
        } while (attempts < 20);

        if (attempts >= 20 && CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//            console.warn(`[${this.id} generateSecondPatrolPoint] Could not find ideal clear patrol point after 20 attempts. Using last attempt.`);
        }
        return { x: pX, y: pY };
    }


    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        let currentTarget = this.manualTarget || this.autoTarget;
        const playerUnitsOnMap = this.game.getLivingPlayerControlledUnits();

        if (this.actionTimer > 0) { return; }

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            currentTarget = this.autoTarget;
        }

        // --- MODIFICATION START: Corrected state transition logic ---
        if (currentTarget && currentTarget.isAlive()) {
            this.manualTarget = currentTarget;
            const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);
            let losToTarget = hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, this.game.level.activeObstacles, this.game.level);

            // Night mission: stealth in darkness
            if (losToTarget && this.game.isNightMission && currentTarget.team === 'player') {
                if (!currentTarget.isIlluminated()) {
                    // If target is in the dark, enemy can only see them if very close
                    const darkDetectRadius = (CONFIG.NIGHT_MISSION && CONFIG.NIGHT_MISSION.NIGHT_DETECTION_RADIUS_IN_DARK) || 100;
                    if (distToTarget > darkDetectRadius) {
                        losToTarget = false;
                    }
                }
            }

            if (this.aiState === 'PATROLLING' || this.aiState === 'SUSPICIOUS') {
                this.propagateAlert(this.manualTarget);
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(this, 'ON_ALERT', 0.3);
                }
            }

            // This block now runs every frame, allowing the state to change dynamically.
            if (distToTarget <= (this.weapon.range - this.ENGAGE_RANGE_BUFFER) && losToTarget) {
                this.aiState = 'ENGAGING_SHOOTING';
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(this, 'ON_START_FIRING', 0.2);
                }
            } else {
                this.aiState = 'ENGAGING_CHASING';
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(this, 'ON_CHASE', 0.15);
                }
            }
        } else {
            if (this.aiState === 'ENGAGING_CHASING' || this.aiState === 'ENGAGING_SHOOTING') {
                this.aiState = (this.lastKnownPlayerPosition) ? 'SUSPICIOUS' : 'PATROLLING';
            }
            this.manualTarget = null;
            this.autoTarget = null; // Also clear auto-target
        }


        switch (this.aiState) {
            case 'PATROLLING':
                if (this.patrolWaitTimer > 0) {
                    this.patrolWaitTimer -= deltaTime;
                    if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                } else {
                    const distToCurrentPatrolPoint = distance(this.x, this.y, this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                    const arrivalTolerance = this.game.level.gridCellSize * 0.75;
                    if (!this.isMoving || (this.worldTargetX !== this.currentTargetPatrolPoint.x || this.worldTargetY !== this.currentTargetPatrolPoint.y)) {
                        if (distToCurrentPatrolPoint > arrivalTolerance) {
                            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                        }
                    }
                    if (!this.isMoving && distToCurrentPatrolPoint <= arrivalTolerance) {
                        this.x = this.currentTargetPatrolPoint.x;
                        this.y = this.currentTargetPatrolPoint.y;
                        this.patrolWaitTimer = this.PATROL_WAIT_TOTAL_DURATION;
                        this.currentTargetPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
                        this.PATROL_WAIT_TOTAL_DURATION = (this.gruntAIConfig.PATROL_WAIT_BASE || 1.5) + Math.random() * (this.gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0);
                    }
                }
                break;
            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    const arrivalToleranceLKP = this.game.level.gridCellSize * 1.5;
                    if (!this.isMoving || (this.worldTargetX !== this.lastKnownPlayerPosition.x || this.worldTargetY !== this.lastKnownPlayerPosition.y)) {
                        if (distToLKP > arrivalToleranceLKP) {
                            if (!this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y)) {
                                this.aiState = 'PATROLLING'; // Fallback if can't path to LKP
                                this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                            }
                        }
                    }
                    if (!this.isMoving && distToLKP <= arrivalToleranceLKP) {
                        this.lastKnownPlayerPosition = null;
                        this.aiState = 'PATROLLING';
                        this.alertedByAlly = false;
                        this.patrolWaitTimer = this.PATROL_WAIT_TOTAL_DURATION * 0.5;
                        this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                    }
                } else {
                    this.aiState = 'PATROLLING';
                    this.alertedByAlly = false;
                    this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                }
                break;

            case 'ENGAGING_SHOOTING':
                if (this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
                // Firing is now handled by the base Unit class. This state just ensures we stop moving.
                break;

            case 'ENGAGING_CHASING':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const target = this.manualTarget;
                    let shouldUpdateChaseDest = false;

                    if (!this.chaseDestination) {
                        shouldUpdateChaseDest = true;
                    } else if (this.timeSinceLastChaseDestUpdate >= this.CHASE_DESTINATION_REFRESH_INTERVAL) {
                        shouldUpdateChaseDest = true;
                    } else if (this.timeSinceLastChaseDestUpdate > this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL &&
                        distanceSq(target.x, target.y, this.chaseDestination.x, this.chaseDestination.y) > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ) {
                        shouldUpdateChaseDest = true;
                    } else if (!this.isMoving && distance(this.x, this.y, target.x, target.y) > this.weapon.range - this.ENGAGE_RANGE_BUFFER) {
                        shouldUpdateChaseDest = true;
                    }

                    if (shouldUpdateChaseDest) {
                        const isNightInDark = this.game.isNightMission && !target.isIlluminated();

                        let predictedX, predictedY;

                        if (isNightInDark) {
                            // If they are in the dark, stop predicting. Just head to where they are/were.
                            predictedX = target.x;
                            predictedY = target.y;
                        } else {
                            const predictionTime = this.gruntAIConfig.CHASE_PREDICTION_TIME_FACTOR || 0.25;
                            predictedX = target.x + target.currentVelocity.x * predictionTime;
                            predictedY = target.y + target.currentVelocity.y * predictionTime;
                        }

                        predictedX = Math.max(this.size, Math.min(predictedX, CONFIG.WORLD_WIDTH - this.size));
                        predictedY = Math.max(this.size, Math.min(predictedY, CONFIG.WORLD_HEIGHT - this.size));

                        this.chaseDestination = { x: predictedX, y: predictedY };
                        if (this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y)) {
                            this.timeSinceLastChaseDestUpdate = 0;
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} aiLogic] CHASING: Updated chase destination to (${predictedX.toFixed(0)}, ${predictedY.toFixed(0)}). Pathing success.`);
                        } else {
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} aiLogic] CHASING: setMoveTarget failed for new chase destination.`);
                        }
                    }
                } else {
                    this.aiState = 'PATROLLING';
                }
                break;
        }
    }

    onStuck(reason = 'unknown') {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        const currentTime = performance.now() / 1000;

        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//            console.warn(`[${this.id} onStuck GRUNT] Reason: ${reason}. AI State: ${this.aiState}. Pos:(${this.x.toFixed(0)},${this.y.toFixed(0)}), Target:(${this.worldTargetX.toFixed(0)},${this.worldTargetY.toFixed(0)})`);
        }

        this.isMoving = false;
        // Don't clear path immediately if we might phase
        this.stuckFrames = 0;
        this.pathingStuckFrames = 0;
        this.lastRepathAttemptTime = currentTime;

        if (currentTime - this.lastOnStuckTime < this.STUCK_RECOVERY_COOLDOWN_INTERNAL) {
            this.consecutiveStuckAttempts++;
        } else {
            this.consecutiveStuckAttempts = 1;
        }
        this.lastOnStuckTime = currentTime;

        const maxStuckBeforePhasing = this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL + 2; // Inherited from Unit.js or defined in config
        if (this.consecutiveStuckAttempts >= maxStuckBeforePhasing && !this.isPhasing) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
//                console.warn(`[${this.id} onStuck GRUNT] Max consecutive stuck attempts (${this.consecutiveStuckAttempts}). Initiating Phasing.`);
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

        // Grunt's specific recovery if not phasing
        this.currentPath = []; // Now clear path if not phasing
        this.chaseDestination = null;

        if (this.consecutiveStuckAttempts > this.GRUNT_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck GRUNT] Grunt's own max stuck attempts. Desperate move.`);
            if (this._attemptDesperateMove()) {
                this.aiState = 'PATROLLING';
                this.patrolWaitTimer = 0.2;
            } else {
                this.aiState = 'PATROLLING';
                this.patrolWaitTimer = 1.0;
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.error(`[${this.id} onStuck GRUNT] Desperate move failed.`);
            }
            this.consecutiveStuckAttempts = 0; // Reset grunt's own counter after desperate move
            return;
        }

        if (this.aiState === 'ENGAGING_CHASING' || this.aiState === 'ENGAGING_SHOOTING') {
            if (this.manualTarget && this.manualTarget.isAlive()) {
                this.lastKnownPlayerPosition = { x: this.manualTarget.x, y: this.manualTarget.y };
                this.aiState = 'SUSPICIOUS';
                if (!this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y)) {
                    this.aiState = 'PATROLLING';
                    this.setMoveTarget(this.patrolPoint1.x, this.patrolPoint1.y);
                }
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} onStuck GRUNT] Stuck engaging. Becoming SUSPICIOUS of target's LKP.`);
            } else {
                this.aiState = 'PATROLLING';
                this.setMoveTarget(this.patrolPoint1.x, this.patrolPoint1.y);
            }
        } else { // PATROLLING, SUSPICIOUS, or other
            this.aiState = 'PATROLLING';
            const otherPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
            if (!this.setMoveTarget(otherPatrolPoint.x, otherPatrolPoint.y)) {
                this.patrolPoint2 = this.generateSecondPatrolPoint(this.patrolPoint1.x, this.patrolPoint1.y, gruntAIConfig.PATROL_MIN_RADIUS, gruntAIConfig.PATROL_MAX_RADIUS, this.currentTargetPatrolPoint);
                this.currentTargetPatrolPoint = this.patrolPoint2;
                if (!this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y)) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck GRUNT] Stuck patrolling, all recovery patrol points failed pathing.`);
                    this._attemptDesperateMove();
                }
            }
            this.patrolWaitTimer = 0.5;
        }
    }
}

function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}