// js/possum.js
// complete
class PossumGrunt extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_GRUNT_HP, CONFIG.POSSUM_GRUNT_SPEED, CONFIG.POSSUM_GRUNT_SIZE, CONFIG.POSSUM_GRUNT_COLOR, id);
        this.weapon = WEAPONS.POSSUM_RIFLE;
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE || 250;

        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};

        this.aiState = 'PATROLLING';
        this.patrolPoint1 = { x: x, y: y }; // Start at current location
        this.patrolPoint2 = this.generateSecondPatrolPoint(
            x, y,
            gruntAIConfig.PATROL_MIN_RADIUS || 80,
            gruntAIConfig.PATROL_MAX_RADIUS || 200
        );
        this.currentTargetPatrolPoint = this.patrolPoint2; // Initial target
        this.patrolWaitTimer = 0;
        this.PATROL_WAIT_DURATION_BASE = gruntAIConfig.PATROL_WAIT_BASE || 1.5;
        this.PATROL_WAIT_RANDOM_ADD = gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0;
        this.PATROL_WAIT_TOTAL_DURATION = this.PATROL_WAIT_DURATION_BASE + Math.random() * this.PATROL_WAIT_RANDOM_ADD;

        // Initial move order using pathfinding, only if the target is different
        if (this.currentTargetPatrolPoint.x !== this.x || this.currentTargetPatrolPoint.y !== this.y) {
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
        } else {
            this.isMoving = false; // Already at the first "patrol point" (spawn)
        }
    }

    generateSecondPatrolPoint(originX, originY, minRadius, maxRadius) {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        let pX, pY, attempts = 0;
        const worldWidth = CONFIG.WORLD_WIDTH || (this.game && this.game.canvas ? this.game.canvas.width : 1000);
        const worldHeight = CONFIG.WORLD_HEIGHT || (this.game && this.game.canvas ? this.game.canvas.height : 800);
        const margin = this.size + (gruntAIConfig.PATROL_POINT_WORLD_MARGIN_BUFFER || 20);
        const navGrid = this.game.level.getNavigationGrid();

        do {
            const angle = Math.random() * Math.PI * 2;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            pX = originX + Math.cos(angle) * radius;
            pY = originY + Math.sin(angle) * radius;

            pX = Math.max(margin, Math.min(pX, worldWidth - margin));
            pY = Math.max(margin, Math.min(pY, worldHeight - margin));

            if (navGrid && this.game && this.game.level) {
                const gridCoords = this.game.level.worldToGridCoords(pX, pY);
                if (gridCoords.y >= 0 && gridCoords.y < navGrid.length &&
                    gridCoords.x >= 0 && gridCoords.x < navGrid[0].length &&
                    navGrid[gridCoords.y][gridCoords.x] === 0 && // Check if walkable on nav grid
                    this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles)) {
                    break; // Found a good point
                }
            } else { // Fallback if navGrid isn't ready (shouldn't happen if called after level gen)
                if (this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles)) {
                    break;
                }
            }
            attempts++;
        } while (attempts < 20); // Try a few times to find a walkable point

        if (attempts >= 20) {
            console.warn(`PossumGrunt ${this.id} couldn't find a clear walkable patrol point, using last attempt.`);
        }
        return { x: pX, y: pY };
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        this.aiLogic(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime);
    }

    aiLogic(deltaTime, playerUnitsOnMap, obstacles) {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        let engagableTarget = this.manualTarget;

        if (this.actionTimer > 0) { return; }

        if (!engagableTarget || !engagableTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            engagableTarget = this.autoTarget;
        }

        if (engagableTarget && engagableTarget.isAlive()) {
            if (this.aiState !== 'ENGAGING') {
                // console.log(`[AI ${this.id}] State change: ${this.aiState} -> ENGAGING (Target: ${engagableTarget.id})`);
                this.aiState = 'ENGAGING';
                this.manualTarget = engagableTarget;
                this.lastKnownPlayerPosition = null;
                this.alertedByAlly = false;
                this.currentPath = [];
                this.isMoving = false;
                this.propagateAlert(this.manualTarget);
            }
        } else if (this.aiState === 'ENGAGING') {
            // console.log(`[AI ${this.id}] State change: ENGAGING -> PATROLLING (Target lost)`);
            this.aiState = 'PATROLLING';
            this.manualTarget = null;
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
        }

        switch (this.aiState) {
            case 'PATROLLING':
                if (this.patrolWaitTimer > 0) {
                    this.patrolWaitTimer -= deltaTime;
                    if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                } else {
                    const distToCurrentPatrolPoint = distance(this.x, this.y, this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                    const arrivalTolerance = this.game.level.gridCellSize * 0.75; // Slightly less than a cell

                    // If not moving AND not yet at the point (or significantly drifted)
                    if (!this.isMoving && distToCurrentPatrolPoint > arrivalTolerance) {
                        // console.log(`[AI ${this.id}] Patrolling: Not moving and not at target. Setting move to ${this.currentTargetPatrolPoint.x.toFixed(0)}, ${this.currentTargetPatrolPoint.y.toFixed(0)}`);
                        this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                    }
                    // If moving, but the world target of the path is not the current patrol point (e.g. path was for old point)
                    else if (this.isMoving && (this.worldTargetX !== this.currentTargetPatrolPoint.x || this.worldTargetY !== this.currentTargetPatrolPoint.y)) {
                         // console.log(`[AI ${this.id}] Patrolling: Moving to wrong target. Correcting to ${this.currentTargetPatrolPoint.x.toFixed(0)}, ${this.currentTargetPatrolPoint.y.toFixed(0)}`);
                        this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                    }

                    // Check for arrival: if not moving (path ended or failed) AND close enough
                    if (!this.isMoving && distToCurrentPatrolPoint <= arrivalTolerance) {
                        // console.log(`[AI ${this.id}] Patrolling: Arrived at patrol point. Waiting.`);
                        this.x = this.currentTargetPatrolPoint.x; // Snap
                        this.y = this.currentTargetPatrolPoint.y;
                        this.patrolWaitTimer = this.PATROL_WAIT_TOTAL_DURATION;
                        this.currentTargetPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
                        this.PATROL_WAIT_TOTAL_DURATION = (gruntAIConfig.PATROL_WAIT_BASE || 1.5) + Math.random() * (gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0);
                    }
                }
                break;

            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    const arrivalToleranceLKP = this.game.level.gridCellSize * 1.5;

                    if (!this.isMoving && distToLKP > arrivalToleranceLKP) {
                        this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    } else if (this.isMoving && (this.worldTargetX !== this.lastKnownPlayerPosition.x || this.worldTargetY !== this.lastKnownPlayerPosition.y)) {
                        this.setMoveTarget(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
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

            case 'ENGAGING':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    const preferredRangeFactor = gruntAIConfig.ENGAGE_PREFERRED_RANGE_FACTOR || 0.80;
                    const kiteRangeFactor = gruntAIConfig.ENGAGE_KITE_RANGE_FACTOR || 0.30;
                    const preferredRange = this.weapon.range * preferredRangeFactor;
                    const tooCloseRange = this.weapon.range * kiteRangeFactor;

                    if (distToTarget > preferredRange + this.game.level.gridCellSize) { // Move if clearly outside preferred range
                        if (!this.isMoving || (this.worldTargetX !== this.manualTarget.x || this.worldTargetY !== this.manualTarget.y)) {
                            // console.log(`[AI ${this.id}] Engaging: Target too far. Moving to ${this.manualTarget.id}`);
                            this.setMoveTarget(this.manualTarget.x, this.manualTarget.y);
                        }
                    } else if (distToTarget < tooCloseRange) {
                        const angleFromTarget = Math.atan2(this.y - this.manualTarget.y, this.x - this.manualTarget.x);
                        const kiteDist = this.game.level.gridCellSize * 2; // Kite about 2 cells away
                        const kiteTargetX = this.x + Math.cos(angleFromTarget) * kiteDist;
                        const kiteTargetY = this.y + Math.sin(angleFromTarget) * kiteDist;
                        // console.log(`[AI ${this.id}] Engaging: Target too close. Kiting.`);
                        this.setMoveTarget(kiteTargetX, kiteTargetY);
                    } else { // In good range
                        if (this.isMoving) {
                            // console.log(`[AI ${this.id}] Engaging: In range, stopping movement.`);
                            this.isMoving = false;
                            this.currentPath = [];
                        }
                    }
                } else {
                    this.manualTarget = null;
                    this.aiState = 'PATROLLING';
                    this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
                }
                break;
        }
    }

    onStuck() {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        console.warn(`PossumGrunt ${this.id} onStuck triggered. AI State: ${this.aiState}. Attempting recovery.`);
        this.currentPath = []; // Clear any existing path that might be causing issues

        if (this.aiState === 'PATROLLING' || this.aiState === 'SUSPICIOUS') {
            if (this.aiState === 'SUSPICIOUS') {
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false;
            }
            this.aiState = 'PATROLLING';
            this.currentTargetPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
            // Try generating a new second patrol point in case the old one was problematic
            this.patrolPoint2 = this.generateSecondPatrolPoint(this.patrolPoint1.x, this.patrolPoint1.y, gruntAIConfig.PATROL_MIN_RADIUS || 80, gruntAIConfig.PATROL_MAX_RADIUS || 200);
            if (this.currentTargetPatrolPoint === this.patrolPoint2 && (this.patrolPoint2.x === this.patrolPoint1.x && this.patrolPoint2.y === this.patrolPoint1.y)) {
                // If new P2 is same as P1, try making P1 the target
                 this.currentTargetPatrolPoint = this.patrolPoint1; // Fallback
            }
            this.setMoveTarget(this.currentTargetPatrolPoint.x, this.currentTargetPatrolPoint.y);
            this.patrolWaitTimer = 0.5; // Short wait before trying new path
        } else if (this.aiState === 'ENGAGING' && this.manualTarget && this.manualTarget.isAlive()) {
            const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
            const randomOffsetAngle = (Math.random() - 0.5) * Math.PI; // +/- 90 degrees
            const nudgeDistance = this.size * (gruntAIConfig.STUCK_ENGAGE_NUDGE_FACTOR || 2.0) * (1.5 + Math.random());
            const newTargetX = this.x + Math.cos(angleToTarget + randomOffsetAngle) * nudgeDistance; // Nudge from current pos
            const newTargetY = this.y + Math.sin(angleToTarget + randomOffsetAngle) * nudgeDistance;
            this.setMoveTarget(newTargetX, newTargetY);
        } else {
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDist = this.size * 4;
            this.setMoveTarget(this.x + Math.cos(randomAngle) * randomDist, this.y + Math.sin(randomAngle) * randomDist);
        }
        this.stuckFrames = 0;
    }
}