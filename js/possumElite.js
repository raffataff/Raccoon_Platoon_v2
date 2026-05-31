// js/possumElite.js

class PossumElite extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy',
              CONFIG.POSSUM_ELITE_HP,
              CONFIG.POSSUM_ELITE_SPEED,
              CONFIG.POSSUM_ELITE_SIZE,
              CONFIG.POSSUM_ELITE_COLOR,
              id || `PSME-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_ELITE_TURN_RATE;
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

        // --- Elite-specific tactical properties ---
        this.STRAFE_COOLDOWN = this.eliteAIConfig.STRAFE_COOLDOWN || 0.4;
        this.STRAFE_DISTANCE = this.eliteAIConfig.STRAFE_DISTANCE || 120;
        this.STRAFE_CHANCE = this.eliteAIConfig.STRAFE_CHANCE || 0.7;
        this.timeSinceLastStrafe = 0;

        this.SHOTS_BEFORE_REPOSITION = this.eliteAIConfig.SHOTS_BEFORE_REPOSITION || 12;
        this.REPOSITION_DISTANCE = this.eliteAIConfig.REPOSITION_DISTANCE || 150;
        this.shotsFired = 0;

        this.RETREAT_HP_THRESHOLD = this.eliteAIConfig.RETREAT_HP_THRESHOLD || 0.35;
        this.RETREAT_MIN_ENEMIES = this.eliteAIConfig.RETREAT_MIN_ENEMIES || 2;
        this.RETREAT_DISTANCE = this.eliteAIConfig.RETREAT_DISTANCE || 200;

        this.FLANK_ENABLED = this.eliteAIConfig.FLANK_ENABLED !== undefined ? this.eliteAIConfig.FLANK_ENABLED : true;

        // --- Grenade detection & avoidance ---
        this.GRENADE_DETECTION_RANGE = this.eliteAIConfig.GRENADE_DETECTION_RANGE || 250;
        this.GRENADE_DODGE_COOLDOWN = this.eliteAIConfig.GRENADE_DODGE_COOLDOWN || 1.5;
        this.GRENADE_DODGE_DISTANCE = this.eliteAIConfig.GRENADE_DODGE_DISTANCE || 120;
        this.GRENADE_IMMINENT_FUSE_THRESHOLD = this.eliteAIConfig.GRENADE_IMMINENT_FUSE_THRESHOLD || 1.2;
        this.grenadeDodgeCooldownTimer = 0;
        this.lastDodgeTarget = null;

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

        // --- Grenade detection & avoidance (highest priority) ---
        if (this.grenadeDodgeCooldownTimer > 0) {
            this.grenadeDodgeCooldownTimer -= deltaTime;
        }
        const incomingGrenade = this._detectIncomingGrenade();
        if (incomingGrenade && this.grenadeDodgeCooldownTimer <= 0) {
            this._dodgeGrenade(incomingGrenade);
            super.update(deltaTime);
            return;
        }

        // --- Tactical retreat check ---
        if (this.aiState.startsWith('ENGAGING') && this.hp < this.maxHp * this.RETREAT_HP_THRESHOLD) {
            const nearbyPlayerUnits = this.game.getLivingPlayerControlledUnits().filter(
                u => distance(this.x, this.y, u.x, u.y) < this.detectionRange
            );
            if (nearbyPlayerUnits.length >= this.RETREAT_MIN_ENEMIES) {
                const currentTarget = this.manualTarget || this.autoTarget;
                if (currentTarget) {
                    this._retreatFrom(currentTarget);
                    super.update(deltaTime);
                    return;
                }
            }
        }

        super.update(deltaTime);
    }

    findAutoTarget(potentialTargets, obstacles) {
        let closestTarget = null;
        let engagementRange = (this.weapon ? this.weapon.range : (this.detectionRange || 150));

        if (this.game && this.game.isNightMission && CONFIG.NIGHT_MISSION) {
            const nightCfg = CONFIG.NIGHT_MISSION;
            const enemyMult = nightCfg.ENEMY_DETECTION_MULTIPLIER !== undefined ? nightCfg.ENEMY_DETECTION_MULTIPLIER : 0.45;
            engagementRange *= enemyMult;
        }

        let minDistanceSq = engagementRange ** 2;
        if (!potentialTargets || !Array.isArray(potentialTargets)) { this.autoTarget = null; return; }
        const activeObstacles = Array.isArray(obstacles) ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];

        const validTargets = [];
        potentialTargets.forEach(target => {
            if (target && target.isAlive() && target.team !== this.team && target.team !== 'neutral') {
                const dx = target.x - this.x; const dy = target.y - this.y;
                const dSq = dx * dx + dy * dy;
                if (dSq <= minDistanceSq) {
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, activeObstacles, this.game.level, false)) {
                        validTargets.push({ target, dSq });
                    }
                }
            }
        });

        if (validTargets.length === 0) {
            this.autoTarget = null;
            return;
        }

        // Elite prioritization: prefer low-HP targets to finish them off
        validTargets.sort((a, b) => {
            const aHpRatio = a.target.hp / a.target.maxHp;
            const bHpRatio = b.target.hp / b.target.maxHp;
            if (Math.abs(aHpRatio - bHpRatio) > 0.15) {
                return aHpRatio - bHpRatio;
            }
            return a.dSq - b.dSq;
        });

        this.autoTarget = validTargets[0].target;
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        // --- Hit reaction: immediately engage attacker ---
        if (this.hitStunTimer > 0 && this.recentlyHitBy && this.recentlyHitBy.isAlive()) {
            this.manualTarget = this.recentlyHitBy;
            this.lastKnownPlayerPosition = { x: this.recentlyHitBy.x, y: this.recentlyHitBy.y };
            const distToAttacker = distance(this.x, this.y, this.recentlyHitBy.x, this.recentlyHitBy.y);
            const hasLOS = hasLineOfSight(this.x, this.y, this.recentlyHitBy.x, this.recentlyHitBy.y, this.game.level.activeObstacles, this.game.level);
            if (hasLOS && distToAttacker <= this.weapon.range - this.ENGAGE_RANGE_BUFFER) {
                this.changeState('ENGAGING_SHOOTING');
            } else {
                this.changeState('ENGAGING_CHASING');
                this.chaseDestination = { x: this.recentlyHitBy.x, y: this.recentlyHitBy.y };
                this.setMoveTarget(this.recentlyHitBy.x, this.recentlyHitBy.y);
            }
            this.propagateAlert(this.recentlyHitBy);
            return;
        }

        let currentTarget = this.manualTarget || this.autoTarget;
        const playerUnitsOnMap = this.game.getLivingPlayerControlledUnits();

        if (this.actionTimer > 0) { return; }

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
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

        this.manualTarget = currentTarget;
        const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);
        const losToTarget = hasLineOfSight(this.x, this.y, currentTarget.x, currentTarget.y, this.game.level.activeObstacles, this.game.level);

        // --- Dynamic state transitions every frame (like grunt) ---
        if (this.aiState === 'PATROLLING' || this.aiState === 'SUSPICIOUS') {
            if (distToTarget <= this.detectionRange && losToTarget) {
                if (distToTarget <= (this.weapon.range - this.ENGAGE_RANGE_BUFFER)) {
                    this.changeState('ENGAGING_SHOOTING');
                } else {
                    this.changeState('ENGAGING_CHASING');
                }
            } else if (distToTarget <= this.detectionRange) {
                this.changeState('ENGAGING_CHASING');
            }
        } else if (this.aiState === 'ENGAGING_SHOOTING') {
            if (distToTarget > this.weapon.range + this.ENGAGE_RANGE_BUFFER || !losToTarget) {
                this.changeState('ENGAGING_CHASING');
            }
        } else if (this.aiState === 'ENGAGING_CHASING') {
            if (distToTarget <= this.weapon.range * 0.85 && losToTarget) {
                this.changeState('ENGAGING_SHOOTING');
            } else if (distToTarget > this.detectionRange * 1.2) {
                this.returnToPatrol();
                return;
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
        this.suspiciousTimer -= deltaTime;
        if (this.suspiciousTimer <= 0) {
            if (hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level)) {
                this.changeState('ENGAGING_SHOOTING');
            } else {
                this.changeState('ENGAGING_CHASING');
            }
        }
    }

    _updateEngagingShootingState(deltaTime, target, obstacles) {
        const distToTarget = distance(this.x, this.y, target.x, target.y);

        if (distToTarget > this.weapon.range + this.ENGAGE_RANGE_BUFFER || !hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level)) {
            this.changeState('ENGAGING_CHASING');
            return;
        }

        this.isMoving = false;

        // --- Strafe while shooting ---
        this._strafeEngaging(target, deltaTime);

        if (this.canShootWhileMoving || !this.isMoving) {
            this._executeFire(target.x, target.y);
            this.shotsFired++;

            // --- Reposition after burst ---
            if (this.shotsFired >= this.SHOTS_BEFORE_REPOSITION) {
                this.shotsFired = 0;
                this._repositionAfterBurst(target);
            }
        }
    }

    _strafeEngaging(target, deltaTime) {
        this.timeSinceLastStrafe += deltaTime;
        if (this.timeSinceLastStrafe < this.STRAFE_COOLDOWN) return;

        if (!this.isMoving && this.game.level.rng.chance(this.STRAFE_CHANCE)) {
            const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
            const strafeAngle = angleToTarget + (this.game.level.rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);

            const newX = this.x + Math.cos(strafeAngle) * this.STRAFE_DISTANCE;
            const newY = this.y + Math.sin(strafeAngle) * this.STRAFE_DISTANCE;

            this.setMoveTarget(newX, newY);
            this.timeSinceLastStrafe = 0;
        }
    }

    _repositionAfterBurst(target) {
        const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
        const reposAngle = angleToTarget + (this.game.level.rng.chance(0.5) ? Math.PI / 3 : -Math.PI / 3);

        const newX = this.x + Math.cos(reposAngle) * this.REPOSITION_DISTANCE;
        const newY = this.y + Math.sin(reposAngle) * this.REPOSITION_DISTANCE;

        this.setMoveTarget(newX, newY);
    }

    _updateEngagingChasingState(deltaTime, target, distToTarget, obstacles) {
        if (distToTarget <= this.weapon.range * 0.85 && hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level)) {
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
            let destX, destY;

            // --- Flanking logic ---
            if (this.FLANK_ENABLED && this._shouldFlank(target)) {
                const flankAngle = this._calculateFlankAngle(target);
                const flankDist = this.weapon.range * 0.7;
                destX = target.x + Math.cos(flankAngle) * flankDist;
                destY = target.y + Math.sin(flankAngle) * flankDist;
            } else {
                // --- Predictive chase (was missing before) ---
                const predictionTime = this.eliteAIConfig.CHASE_PREDICTION_TIME_FACTOR || 0.30;
                destX = target.x + target.currentVelocity.x * predictionTime;
                destY = target.y + target.currentVelocity.y * predictionTime;
            }

            destX = Math.max(this.size, Math.min(destX, CONFIG.WORLD_WIDTH - this.size));
            destY = Math.max(this.size, Math.min(destY, CONFIG.WORLD_HEIGHT - this.size));

            this.chaseDestination = { x: destX, y: destY };
            this.timeSinceLastChaseDestUpdate = 0;
        }

        if (!this.chaseDestination) {
            this.chaseDestination = { x: target.x, y: target.y };
        }

        if (shouldUpdateChaseDest && (!this.isMoving || distance(this.x, this.y, this.chaseDestination.x, this.chaseDestination.y) > 50)) {
            this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y);
        }
    }

    _shouldFlank(target) {
        if (!this.game.enemyUnits) return false;
        const alliesEngaging = this.game.enemyUnits.filter(e =>
            e !== this && e.isAlive() &&
            (e.aiState === 'ENGAGING_SHOOTING' || e.aiState === 'ENGAGING_CHASING') &&
            e.manualTarget === target
        );
        return alliesEngaging.length > 0;
    }

    _calculateFlankAngle(target) {
        const alliesEngaging = this.game.enemyUnits.filter(e =>
            e !== this && e.isAlive() &&
            (e.aiState === 'ENGAGING_SHOOTING' || e.aiState === 'ENGAGING_CHASING') &&
            e.manualTarget === target
        );
        if (alliesEngaging.length === 0) {
            return Math.atan2(this.y - target.y, this.x - target.x);
        }

        const avgAngle = alliesEngaging.reduce((sum, e) =>
            sum + Math.atan2(e.y - target.y, e.x - target.x), 0) / alliesEngaging.length;

        return avgAngle + Math.PI / 2;
    }

    _retreatFrom(target) {
        const awayAngle = Math.atan2(this.y - target.y, this.x - target.x);
        const retreatX = this.x + Math.cos(awayAngle) * this.RETREAT_DISTANCE;
        const retreatY = this.y + Math.sin(awayAngle) * this.RETREAT_DISTANCE;
        this.setMoveTarget(retreatX, retreatY);
    }

    _detectIncomingGrenade() {
        if (!this.game || !this.game.gameObjects) return null;

        let mostThreatening = null;
        let shortestTimeToImpact = Infinity;

        for (let i = 0; i < this.game.gameObjects.length; i++) {
            const obj = this.game.gameObjects[i];
            if (!(obj instanceof GrenadeProjectile)) continue;
            if (obj.exploded || obj.isMarkedForDeletion) continue;
            if (obj.shooterTeam === this.team) continue;

            const isLanded = obj.flightTimeElapsed >= obj.flightTimeTotal;
            const distToGrenade = distance(this.x, this.y, obj.x, obj.y);
            const distToTarget = distance(this.x, this.y, obj.targetX, obj.targetY);

            if (isLanded) {
                if (distToGrenade > this.GRENADE_DETECTION_RANGE) continue;
                const blastDist = distToGrenade - obj.aoeRadius - this.size;
                if (blastDist > this.GRENADE_DODGE_DISTANCE * 1.5) continue;
                if (obj.fuseTimer < this.GRENADE_IMMINENT_FUSE_THRESHOLD) {
                    if (obj.fuseTimer < shortestTimeToImpact) {
                        shortestTimeToImpact = obj.fuseTimer;
                        mostThreatening = obj;
                    }
                }
            } else {
                if (distToTarget > this.GRENADE_DETECTION_RANGE) continue;
                const predictedBlastDist = distToTarget - obj.aoeRadius - this.size;
                if (predictedBlastDist > this.GRENADE_DODGE_DISTANCE * 1.5) continue;
                const timeToLand = obj.flightTimeTotal - obj.flightTimeElapsed;
                const totalTimeToImpact = timeToLand + obj.fuseTimer;
                if (totalTimeToImpact < shortestTimeToImpact) {
                    shortestTimeToImpact = totalTimeToImpact;
                    mostThreatening = obj;
                }
            }
        }

        return mostThreatening;
    }

    _dodgeGrenade(grenade) {
        const isLanded = grenade.flightTimeElapsed >= grenade.flightTimeTotal;
        const threatX = isLanded ? grenade.x : grenade.targetX;
        const threatY = isLanded ? grenade.y : grenade.targetY;

        const awayAngle = Math.atan2(this.y - threatY, this.x - threatX);
        const dodgeDist = this.GRENADE_DODGE_DISTANCE + grenade.aoeRadius * 0.5;

        let dodgeAngle;
        if (this.lastDodgeTarget &&
            Math.abs(this.lastDodgeTarget.x - threatX) < 10 &&
            Math.abs(this.lastDodgeTarget.y - threatY) < 10) {
            dodgeAngle = awayAngle + Math.PI / 2;
        } else {
            dodgeAngle = awayAngle + (this.game.level.rng.chance(0.5) ? Math.PI / 3 : -Math.PI / 3);
        }

        const dodgeX = this.x + Math.cos(dodgeAngle) * dodgeDist;
        const dodgeY = this.y + Math.sin(dodgeAngle) * dodgeDist;

        this.setMoveTarget(dodgeX, dodgeY);
        this.grenadeDodgeCooldownTimer = this.GRENADE_DODGE_COOLDOWN;
        this.lastDodgeTarget = { x: threatX, y: threatY };
    }

    changeState(newState) {
        if (this.aiState === newState) return;

        this.aiState = newState;

        switch (newState) {
            case 'PATROLLING':
                this.manualTarget = null;
                this.autoTarget = null;
                this.shotsFired = 0;
                break;
            case 'SUSPICIOUS':
                this.suspiciousTimer = 0.5;
                this.shotsFired = 0;
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
        this.shotsFired = 0;
        if (distance(this.x, this.y, this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y) > 5) {
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
        }
    }
}
