// js/possumElite.js

class PossumElite extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_ELITE_HP, 
              CONFIG.POSSUM_ELITE_SPEED, 
              CONFIG.POSSUM_ELITE_SIZE, 
              CONFIG.POSSUM_ELITE_COLOR, 
              id || `PSME-${Date.now().toString(36).slice(-4)}`);

        this.deadSpritePathKey = 'POSSUM_ELITE_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_ELITE_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_ELITE_DEAD_SPRITE_SCALE';
        this.spriteBaseName = 'possum_elite';
        this.spriteScaleFactor = CONFIG.POSSUM_ELITE_SPRITE_SCALE_FACTOR;
        
        this.weaponName = CONFIG.POSSUM_ELITE_DEFAULT_WEAPON || 'POSSUM_ELITE_WEAPON';
        this.detectionRange = CONFIG.AI.POSSUM_ELITE?.DETECTION_RANGE || 320;
        
        this.eliteAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_ELITE) ? CONFIG.AI.POSSUM_ELITE : {};

        this.aiState = 'PATROLLING';

        this.patrolPoint1 = { x: x, y: y };
        this.patrolPoint2 = this.generateSecondPatrolPoint(x, y, this.eliteAIConfig.PATROL_MIN_RADIUS || 100, this.eliteAIConfig.PATROL_MAX_RADIUS || 250);
        this.currentTargetPatrolPoint = this.patrolPoint2;
        this.patrolWaitTimer = 0;
        this.PATROL_WAIT_DURATION_BASE = this.eliteAIConfig.PATROL_WAIT_BASE || 1.0;
        this.PATROL_WAIT_RANDOM_ADD = this.eliteAIConfig.PATROL_WAIT_RANDOM_ADD || 1.5;
        this.PATROL_WAIT_TOTAL_DURATION = this.PATROL_WAIT_DURATION_BASE + Math.random() * this.PATROL_WAIT_RANDOM_ADD;

        this.chaseDestination = null;
        this.timeSinceLastChaseDestUpdate = 0;
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.eliteAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.eliteAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.eliteAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.GRID_CELL_SIZE) ** 2;
        this.ENGAGE_RANGE_BUFFER = this.eliteAIConfig.ENGAGE_RANGE_BUFFER || 25;

        this.STUCK_RECOVERY_COOLDOWN_INTERNAL = this.eliteAIConfig.STUCK_RECOVERY_COOLDOWN_SHORT || 1.5;
        this.GRUNT_MAX_STUCK_ATTEMPTS_BEFORE_DESPERATE = this.eliteAIConfig.MAX_CONSECUTIVE_STUCK_ATTEMPTS || 3;
        this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL = this.eliteAIConfig.DESPERATE_STUCK_MOVE_RADIUS_CELLS || 5;

        this.isMoving = false;
        this.suspiciousTimer = 0;
    }

    generateSecondPatrolPoint(originX, originY, minRadius, maxRadius, attemptToAvoidCurrent = null) {
        const eliteAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_ELITE) ? CONFIG.AI.POSSUM_ELITE : {};
        let pX, pY, attempts = 0;
        const worldWidth = CONFIG.WORLD_WIDTH || (this.game && this.game.canvas ? this.game.canvas.width : 1000);
        const worldHeight = CONFIG.WORLD_HEIGHT || (this.game && this.game.canvas ? this.game.canvas.height : 800);
        const margin = this.size + (eliteAIConfig.PATROL_POINT_WORLD_MARGIN_BUFFER || 20);
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

        if (!currentTarget) {
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            currentTarget = this.autoTarget;
        }

        if (!currentTarget || !currentTarget.isAlive()) {
            if (this.aiState !== 'PATROLLING' && this.aiState !== 'SUSPICIOUS') {
                this.findAutoTarget(playerUnitsOnMap, obstacles);
                currentTarget = this.autoTarget;
                if (!currentTarget || !currentTarget.isAlive()) {
                    this.returnToPatrol();
                }
            }
            return;
        }

        const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);

        if (this.aiState === 'PATROLLING' || this.aiState === 'SUSPICIOUS') {
            if (distToTarget <= this.detectionRange) {
                if (hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level)) {
                    this.changeState('ENGAGING_SHOOTING');
                } else {
                    this.changeState('ENGAGING_CHASING');
                }
            }
        }

        switch (this.aiState) {
            case 'PATROLLING':
                this._updatePatrolState(deltaTime, obstacles);
                break;
            case 'SUSPICIOUS':
                this._updateSuspiciousState(deltaTime, currentTarget, obstacles);
                break;
            case 'ENGAGING_SHOOTING':
                this._updateEngagingShootingState(deltaTime, currentTarget, obstacles);
                break;
            case 'ENGAGING_CHASING':
                this._updateEngagingChasingState(deltaTime, currentTarget, distToTarget, obstacles);
                break;
        }
    }

    _updatePatrolState(deltaTime, obstacles) {
        if (!this.isMoving && distance(this.x, this.y, this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y) > 5) {
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
        }

        if (!this.isMoving) {
            this.patrolWaitTimer += deltaTime;
            if (this.patrolWaitTimer >= this.PATROL_WAIT_TOTAL_DURATION) {
                this.patrolWaitTimer = 0;
                this.PATROL_WAIT_TOTAL_DURATION = this.PATROL_WAIT_DURATION_BASE + Math.random() * this.PATROL_WAIT_RANDOM_ADD;
                const temp = this.patrolPoint1;
                this.patrolPoint1 = this.currentTargetPatrolPoint;
                this.currentTargetPatrolPoint = this.patrolPoint2;
                this.patrolPoint2 = temp;
                this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
            }
        }
    }

    _updateSuspiciousState(deltaTime, target, obstacles) {
        // Elite has better detection, shorter suspicious time
        this.suspiciousTimer -= deltaTime;
        if (this.suspiciousTimer <= 0) {
            if (hasLineOfSight(this.x, this.y, target.x, target.y, obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level)) {
                this.changeState('ENGAGING_SHOOTING');
            } else {
                this.changeState('ENGAGING_CHASING');
            }
        }
    }

    _updateEngagingShootingState(deltaTime, target, obstacles) {
        const distToTarget = distance(this.x, this.y, target.x, target.y);

        if (distToTarget > this.weapon.range + this.ENGAGE_RANGE_BUFFER || !hasLineOfSight(this.x, this.y, target.x, target.y, obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level)) {
            this.changeState('ENGAGING_CHASING');
            return;
        }

        this.isMoving = false;

        if (this.canShootWhileMoving || !this.isMoving) {
            this._executeFire(target.x, target.y);
        }
    }

    _updateEngagingChasingState(deltaTime, target, distToTarget, obstacles) {
        if (distToTarget <= this.weapon.range * 0.85 && hasLineOfSight(this.x, this.y, target.x, target.y, obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level)) {
            this.changeState('ENGAGING_SHOOTING');
            return;
        }

        if (distToTarget > this.detectionRange * 1.2) {
            this.returnToPatrol();
            return;
        }

        let shouldUpdateChaseDest = false;

        if (!this.chaseDestination) {
            shouldUpdateChaseDest = true;
        } else if (this.timeSinceLastChaseDestUpdate >= this.CHASE_DESTINATION_REFRESH_INTERVAL) {
            shouldUpdateChaseDest = true;
        } else if (this.timeSinceLastChaseDestUpdate > this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL &&
            distanceSq(target.x, target.y, this.chaseDestination.x, this.chaseDestination.y) > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ) {
            shouldUpdateChaseDest = true;
        } else if (!this.isMoving && distToTarget > this.weapon.range - this.ENGAGE_RANGE_BUFFER) {
            shouldUpdateChaseDest = true;
        }

        if (shouldUpdateChaseDest) {
            this.chaseDestination = { x: target.x, y: target.y };
            this.timeSinceLastChaseDestUpdate = 0;
        }

        if (!this.chaseDestination) {
            this.chaseDestination = { x: target.x, y: target.y };
        }

        if (shouldUpdateChaseDest && (!this.isMoving || distance(this.x, this.y, this.chaseDestination.x, this.chaseDestination.y) > 50)) {
            this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y);
        }
    }

    changeState(newState) {
        if (this.aiState === newState) return;

        this.aiState = newState;

        switch (newState) {
            case 'PATROLLING':
                this.manualTarget = null;
                this.autoTarget = null;
                break;
            case 'SUSPICIOUS':
                this.suspiciousTimer = 0.5;
                break;
            case 'ENGAGING_SHOOTING':
            case 'ENGAGING_CHASING':
                break;
        }
    }

    returnToPatrol() {
        this.changeState('PATROLLING');
        this.manualTarget = null;
        this.autoTarget = null;
        this.chaseDestination = null;
        if (distance(this.x, this.y, this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y) > 5) {
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
        }
    }
}
