// js/possum.js
class PossumGrunt extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_GRUNT_HP, CONFIG.POSSUM_GRUNT_SPEED, CONFIG.POSSUM_GRUNT_SIZE, CONFIG.POSSUM_GRUNT_COLOR, id);
        this.weapon = WEAPONS.POSSUM_RIFLE;
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE || 250; // Fallback if not in general config

        // AI Config specific to Grunts
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};

        this.aiState = 'PATROLLING';
        this.patrolPoint1 = { x: x, y: y };
        this.patrolPoint2 = this.generateSecondPatrolPoint(
            x, y,
            gruntAIConfig.PATROL_MIN_RADIUS || 80,
            gruntAIConfig.PATROL_MAX_RADIUS || 200
        );
        this.currentTargetPatrolPoint = this.patrolPoint2;
        this.patrolWaitTimer = 0;
        this.PATROL_WAIT_DURATION_BASE = gruntAIConfig.PATROL_WAIT_BASE || 1.5;
        this.PATROL_WAIT_RANDOM_ADD = gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0;
        this.PATROL_WAIT_TOTAL_DURATION = this.PATROL_WAIT_DURATION_BASE + Math.random() * this.PATROL_WAIT_RANDOM_ADD;


        this.targetX = this.currentTargetPatrolPoint.x;
        this.targetY = this.currentTargetPatrolPoint.y;
        if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
    }

    generateSecondPatrolPoint(originX, originY, minRadius, maxRadius) {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        let pX = originX + Math.cos(angle) * radius;
        let pY = originY + Math.sin(angle) * radius;

        const worldWidth = CONFIG.WORLD_WIDTH || (this.game && this.game.canvas ? this.game.canvas.width : 1000);
        const worldHeight = CONFIG.WORLD_HEIGHT || (this.game && this.game.canvas ? this.game.canvas.height : 800);
        // Margin uses unit size plus a configured buffer
        const margin = this.size + (gruntAIConfig.PATROL_POINT_WORLD_MARGIN_BUFFER || 20);

        pX = Math.max(margin, Math.min(pX, worldWidth - margin));
        pY = Math.max(margin, Math.min(pY, worldHeight - margin));

        // Attempt to find a clear spot
        if (this.game && this.game.level && typeof this.game.level.isSpawnPointClear === 'function') {
            let attempts = 0;
            while(!this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles) && attempts < 10) {
                const newAngle = Math.random() * Math.PI * 2;
                // Reduce radius for subsequent attempts to find closer clear spots
                const newRadius = minRadius + Math.random() * (maxRadius-minRadius) * 0.5;
                pX = originX + Math.cos(newAngle) * newRadius;
                pY = originY + Math.sin(newAngle) * newRadius;
                pX = Math.max(margin, Math.min(pX, worldWidth - margin));
                pY = Math.max(margin, Math.min(pY, worldHeight - margin));
                attempts++;
            }
        }
        return { x: pX, y: pY };
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            this.isMoving = false; // Don't allow movement during action timer
            return;
        }
        this.aiLogic(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime);
    }

    aiLogic(deltaTime, playerUnitsOnMap, obstacles) {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        let engagableTarget = this.manualTarget;
        if (!engagableTarget || !engagableTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            engagableTarget = this.autoTarget;
        }

        if (engagableTarget && engagableTarget.isAlive()) {
            if (this.aiState !== 'ENGAGING') {
                this.aiState = 'ENGAGING';
                this.manualTarget = engagableTarget;
                this.lastKnownPlayerPosition = null;
                this.alertedByAlly = false;
                this.propagateAlert(this.manualTarget);
            }
        } else if (this.aiState === 'ENGAGING') {
            this.aiState = 'PATROLLING';
            this.manualTarget = null;
        }

        switch (this.aiState) {
            case 'PATROLLING':
                if (this.patrolWaitTimer > 0) {
                    this.patrolWaitTimer -= deltaTime; this.isMoving = false;
                } else {
                    if (this.targetX !== this.currentTargetPatrolPoint.x || this.targetY !== this.currentTargetPatrolPoint.y) {
                        this.targetX = this.currentTargetPatrolPoint.x; this.targetY = this.currentTargetPatrolPoint.y;
                    }
                    this.isMoving = distance(this.x, this.y, this.targetX, this.targetY) > 1;
                    if (!this.isMoving) {
                        this.patrolWaitTimer = this.PATROL_WAIT_TOTAL_DURATION; // Use pre-calculated total duration
                        this.currentTargetPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
                        // Recalculate total wait for next time
                        this.PATROL_WAIT_TOTAL_DURATION = (gruntAIConfig.PATROL_WAIT_BASE || 1.5) + Math.random() * (gruntAIConfig.PATROL_WAIT_RANDOM_ADD || 2.0);
                    }
                }
                break;

            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    if (distToLKP > this.size * 2) {
                        this.targetX = this.lastKnownPlayerPosition.x;
                        this.targetY = this.lastKnownPlayerPosition.y;
                        this.isMoving = true;
                    } else {
                        this.isMoving = false; this.lastKnownPlayerPosition = null;
                        this.aiState = 'PATROLLING'; this.alertedByAlly = false;
                        this.patrolWaitTimer = this.PATROL_WAIT_TOTAL_DURATION * 0.5; // Short pause
                    }
                } else {
                    this.aiState = 'PATROLLING'; this.alertedByAlly = false;
                }
                break;

            case 'ENGAGING':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    const preferredRangeFactor = gruntAIConfig.ENGAGE_PREFERRED_RANGE_FACTOR || 0.80;
                    const kiteRangeFactor = gruntAIConfig.ENGAGE_KITE_RANGE_FACTOR || 0.30;
                    const advanceRangeFactor = gruntAIConfig.ENGAGE_ADVANCE_RANGE_FACTOR || 0.95;

                    const preferredRange = this.weapon.range * preferredRangeFactor;
                    const tooCloseRange = this.weapon.range * kiteRangeFactor;

                    if (distToTarget > this.weapon.range * advanceRangeFactor) { // Move closer if far
                        const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                        this.targetX = this.manualTarget.x - Math.cos(angleToTarget) * preferredRange;
                        this.targetY = this.manualTarget.y - Math.sin(angleToTarget) * preferredRange;
                        this.isMoving = distance(this.x,this.y, this.targetX, this.targetY) > 1;
                    } else if (distToTarget < tooCloseRange) { // Too close, kite back
                        const angleFromTarget = Math.atan2(this.y - this.manualTarget.y, this.x - this.manualTarget.x);
                        // Move slightly faster when kiting
                        this.targetX = this.x + Math.cos(angleFromTarget) * (this.speed * deltaTime * 1.2); // Slightly faster kite
                        this.targetY = this.y + Math.sin(angleFromTarget) * (this.speed * deltaTime * 1.2);
                        this.isMoving = distance(this.x,this.y, this.targetX, this.targetY) > 1;
                    } else { // In good range
                        this.isMoving = false; this.targetX = this.x; this.targetY = this.y;
                    }
                } else {
                    this.manualTarget = null; this.aiState = 'PATROLLING';
                }
                break;
        }
    }

    onStuck() {
        const gruntAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_GRUNT) ? CONFIG.AI.POSSUM_GRUNT : {};
        if (this.aiState === 'PATROLLING' || this.aiState === 'SUSPICIOUS') {
            if (this.aiState === 'SUSPICIOUS') {
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false;
                this.aiState = 'PATROLLING';
            }
            // Switch patrol point immediately
            this.currentTargetPatrolPoint = (this.currentTargetPatrolPoint === this.patrolPoint1) ? this.patrolPoint2 : this.patrolPoint1;
            this.targetX = this.currentTargetPatrolPoint.x; this.targetY = this.currentTargetPatrolPoint.y;
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
            this.patrolWaitTimer = 0; // Reset wait timer to encourage immediate move
        } else if (this.aiState === 'ENGAGING' && this.manualTarget) {
            // Nudge in a random direction
            const nudgeAngle = Math.random() * Math.PI * 2;
            const nudgeDistance = this.size * (gruntAIConfig.STUCK_ENGAGE_NUDGE_FACTOR || 2.0);
            this.targetX = this.x + Math.cos(nudgeAngle) * nudgeDistance;
            this.targetY = this.y + Math.sin(nudgeAngle) * nudgeDistance;

            const worldWidth = CONFIG.WORLD_WIDTH || (this.game && this.game.canvas ? this.game.canvas.width : 1000);
            const worldHeight = CONFIG.WORLD_HEIGHT || (this.game && this.game.canvas ? this.game.canvas.height : 800);
            this.targetX = Math.max(this.size, Math.min(this.targetX, worldWidth - this.size));
            this.targetY = Math.max(this.size, Math.min(this.targetY, worldHeight - this.size));
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
        }
    }
}