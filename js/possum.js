// js/possumHeavy.js
// complete
class PossumHeavy extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_HEAVY_HP, CONFIG.POSSUM_HEAVY_SPEED, CONFIG.POSSUM_HEAVY_SIZE, CONFIG.POSSUM_HEAVY_COLOR, id || `PHVY-${Date.now().toString(36).slice(-4)}`);
        this.weapon = WEAPONS.POSSUM_HEAVY_WEAPON;
        this.canShootWhileMoving = false;

        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        this.detectionRange = heavyAIConfig.DETECTION_RANGE || (CONFIG.POSSUM_DETECTION_RANGE || 250) + 20;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        this.maxChaseDistanceFromPost = this.weapon.range * (heavyAIConfig.MAX_CHASE_DISTANCE_FROM_POST_FACTOR || 0.85);

        this.isMoving = false; // Ensure starts stationary at guard post
        this.currentPath = [];
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        this.aiLogicHeavy(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime);
    }

    aiLogicHeavy(deltaTime, playerUnitsOnMap, obstacles) {
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        let currentTarget = this.manualTarget;

        if (this.actionTimer > 0) { return; }

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap || [], obstacles);
            currentTarget = this.autoTarget;
        }

        if (currentTarget && currentTarget.isAlive()) {
            if (this.aiState !== 'ENGAGING_HEAVY') {
                // console.log(`[AI ${this.id}] State change: ${this.aiState} -> ENGAGING_HEAVY (Target: ${currentTarget.id})`);
                this.aiState = 'ENGAGING_HEAVY';
                this.manualTarget = currentTarget;
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false;
                this.currentPath = [];
                this.isMoving = false;
                this.propagateAlert(this.manualTarget);
            }
        } else if (this.aiState === 'ENGAGING_HEAVY') {
            // console.log(`[AI ${this.id}] State change: ENGAGING_HEAVY -> GUARDING (Target lost)`);
            this.aiState = 'GUARDING';
            this.manualTarget = null;
            this.setMoveTarget(this.guardPost.x, this.guardPost.y);
        }

        switch (this.aiState) {
            case 'GUARDING':
                const atPostTolerance = heavyAIConfig.GUARD_POST_POSITION_TOLERANCE || this.game.level.gridCellSize / 2;
                const distToGuardPost = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);

                if (distToGuardPost > atPostTolerance) {
                    if (!this.isMoving || (this.worldTargetX !== this.guardPost.x || this.worldTargetY !== this.guardPost.y)) {
                        // console.log(`[AI ${this.id}] Guarding: Not at post. Moving to guard post.`);
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    if (this.isMoving) { // Arrived at guard post
                        // console.log(`[AI ${this.id}] Guarding: Arrived at post. Stopping.`);
                        this.isMoving = false;
                        this.currentPath = [];
                        this.x = this.guardPost.x; // Snap
                        this.y = this.guardPost.y;
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
                        this.aiState = 'GUARDING';
                        this.alertedByAlly = false;
                        this.actionTimer = heavyAIConfig.SUSPICIOUS_STATE_SCAN_DURATION || 0.5;
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    this.aiState = 'GUARDING';
                    this.alertedByAlly = false;
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                }
                break;

            case 'ENGAGING_HEAVY':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    const currentDistToGuardPost = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);
                    const engageChaseLimitBuffer = this.weapon.range * (heavyAIConfig.ENGAGE_CHASE_LIMIT_BUFFER_FACTOR || 0.2);
                    const effectiveMaxChaseDist = this.maxChaseDistanceFromPost + engageChaseLimitBuffer;

                    // If target is in weapon range AND unit is not too far from post OR unit is already moving towards target
                    if (distToTarget <= this.weapon.range && (currentDistToGuardPost <= effectiveMaxChaseDist || this.isMoving)) {
                        if (this.isMoving && !this.canShootWhileMoving) { // If moving but can't shoot while moving
                            // console.log(`[AI ${this.id}] Engaging: In range, but stopping to shoot (cannot shoot while moving).`);
                            this.isMoving = false; // Stop to shoot
                            this.currentPath = [];
                        } else if (!this.isMoving && this.canShootWhileMoving) {
                            // Already stationary and can shoot
                        }
                    }
                    // If target is out of range BUT unit is within chase distance from post
                    else if (distToTarget > this.weapon.range && currentDistToGuardPost < this.maxChaseDistanceFromPost) {
                        if (!this.isMoving || (this.worldTargetX !== this.manualTarget.x || this.worldTargetY !== this.manualTarget.y)) {
                            // console.log(`[AI ${this.id}] Engaging: Target out of range, but within chase. Moving to ${this.manualTarget.id}`);
                            this.setMoveTarget(this.manualTarget.x, this.manualTarget.y);
                        }
                    }
                    // If too far from guard post OR target is way out of range and not already chasing
                    else if (currentDistToGuardPost >= this.maxChaseDistanceFromPost || distToTarget > this.weapon.range * 1.5) {
                        // console.log(`[AI ${this.id}] Engaging: Too far from post or target too far. Returning to guard.`);
                        this.manualTarget = null;
                        this.aiState = 'GUARDING';
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    this.manualTarget = null;
                    this.aiState = 'GUARDING';
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                }
                break;
        }
    }

    onStuck() {
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        console.warn(`PossumHeavy ${this.id} onStuck triggered. AI State: ${this.aiState}. Attempting recovery.`);
        this.currentPath = [];

        if (this.aiState === 'GUARDING' || this.aiState === 'SUSPICIOUS') {
            if (this.aiState === 'SUSPICIOUS') {
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false;
            }
            this.aiState = 'GUARDING';
            this.setMoveTarget(this.guardPost.x, this.guardPost.y);
        } else if (this.aiState === 'ENGAGING_HEAVY' && this.manualTarget && this.manualTarget.isAlive()) {
            const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
            const randomOffsetAngle = (Math.random() - 0.5) * Math.PI;
            const nudgeDistance = this.size * (heavyAIConfig.STUCK_ENGAGE_NUDGE_FACTOR || 1.5) * (1.5 + Math.random());
            const newTargetX = this.x + Math.cos(angleToTarget + randomOffsetAngle) * nudgeDistance;
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