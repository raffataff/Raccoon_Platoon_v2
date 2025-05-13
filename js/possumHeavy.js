// js/possumHeavy.js
class PossumHeavy extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', CONFIG.POSSUM_HEAVY_HP, CONFIG.POSSUM_HEAVY_SPEED, CONFIG.POSSUM_HEAVY_SIZE, CONFIG.POSSUM_HEAVY_COLOR, id || `PHVY-${Date.now().toString(36).slice(-4)}`);
        this.weapon = WEAPONS.POSSUM_HEAVY_WEAPON;

        // AI Config specific to Heavies
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};

        // Use specific detection range from config, or fallback to a calculation based on general possum detection
        this.detectionRange = heavyAIConfig.DETECTION_RANGE || (CONFIG.POSSUM_DETECTION_RANGE || 250) + 20;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        // Calculate maxChaseDistance based on its own weapon range and a config factor
        this.maxChaseDistanceFromPost = this.weapon.range * (heavyAIConfig.MAX_CHASE_DISTANCE_FROM_POST_FACTOR || 0.85);
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            this.isMoving = false; // Don't allow movement during action timer
            return;
        }
        this.aiLogicHeavy(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime); // Call base unit update for movement, combat execution
    }

    aiLogicHeavy(deltaTime, playerUnitsOnMap, obstacles) {
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        let currentTarget = this.manualTarget;

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap || [], obstacles); // Ensure playerUnitsOnMap is an array
            currentTarget = this.autoTarget;
        }

        // State transitions based on target
        if (currentTarget && currentTarget.isAlive()) {
            if (this.aiState !== 'ENGAGING_HEAVY') {
                this.aiState = 'ENGAGING_HEAVY';
                this.manualTarget = currentTarget; // Prioritize this target
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false; // Clear these flags
                this.propagateAlert(this.manualTarget); // Alert others when first engaging
            }
        } else if (this.aiState === 'ENGAGING_HEAVY') { // Was engaging, but target lost/died
            this.aiState = 'GUARDING'; // Revert to default behavior
            this.manualTarget = null;
        }
        // If in SUSPICIOUS state and no direct target, it will try to move towards lastKnownPlayerPosition

        switch (this.aiState) {
            case 'GUARDING':
                const atPostTolerance = heavyAIConfig.GUARD_POST_POSITION_TOLERANCE || 5;
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > atPostTolerance) {
                    this.targetX = this.guardPost.x; this.targetY = this.guardPost.y;
                    this.isMoving = true;
                } else {
                    this.isMoving = false;
                }
                break;

            case 'SUSPICIOUS':
                if (this.lastKnownPlayerPosition) {
                    const distToLKP = distance(this.x, this.y, this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);
                    if (distToLKP > this.size * 2) { // Move towards LKP
                        this.targetX = this.lastKnownPlayerPosition.x; this.targetY = this.lastKnownPlayerPosition.y;
                        this.isMoving = true;
                    } else { // Reached LKP
                        this.isMoving = false; this.lastKnownPlayerPosition = null;
                        this.aiState = 'GUARDING'; this.alertedByAlly = false;
                        this.actionTimer = heavyAIConfig.SUSPICIOUS_STATE_SCAN_DURATION || 0.5; // Short scan/pause
                    }
                } else { // No LKP, or already investigated
                    this.aiState = 'GUARDING'; this.alertedByAlly = false;
                }
                break;

            case 'ENGAGING_HEAVY':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    const distToGuardPost = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);
                    const engageChaseLimitBuffer = this.weapon.range * (heavyAIConfig.ENGAGE_CHASE_LIMIT_BUFFER_FACTOR || 0.2);

                    // Check if target is within weapon range AND Heavy is not too far from its guard post
                    if (distToTarget <= this.weapon.range && distToGuardPost <= (this.maxChaseDistanceFromPost + engageChaseLimitBuffer)) {
                        this.isMoving = false; // Prefer to stand and shoot
                        this.targetX = this.x; this.targetY = this.y; // Stop at current position
                    } else if (distToGuardPost < this.maxChaseDistanceFromPost) { // Out of weapon range but still within chase limit from post
                        const preferredRangeFactor = heavyAIConfig.ENGAGE_PREFERRED_RANGE_FACTOR || 0.85;
                        const preferredRange = this.weapon.range * preferredRangeFactor;
                        const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                        // Target a point that is 'preferredRange' away from the enemy
                        this.targetX = this.manualTarget.x - Math.cos(angleToTarget) * preferredRange;
                        this.targetY = this.manualTarget.y - Math.sin(angleToTarget) * preferredRange;
                        this.isMoving = true;
                    } else { // Target is out of weapon range AND Heavy is at its chase limit from post (or beyond)
                        this.manualTarget = null; // Give up on this target
                        this.aiState = 'GUARDING'; // Return to guard post
                    }
                } else { // Target lost or died
                    this.manualTarget = null; this.aiState = 'GUARDING';
                }
                break;
        }
    }

    onStuck() {
        const heavyAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_HEAVY) ? CONFIG.AI.POSSUM_HEAVY : {};
        if (this.aiState === 'GUARDING' || this.aiState === 'SUSPICIOUS') {
            if (this.aiState === 'SUSPICIOUS') {
                this.lastKnownPlayerPosition = null; this.alertedByAlly = false;
            }
            // Try to return to guard post
            this.targetX = this.guardPost.x; this.targetY = this.guardPost.y;
            this.aiState = 'GUARDING';
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
        } else if (this.aiState === 'ENGAGING_HEAVY' && this.manualTarget) {
            // Nudge in a random direction
            const nudgeAngle = Math.random() * Math.PI * 2;
            const nudgeDistance = this.size * (heavyAIConfig.STUCK_ENGAGE_NUDGE_FACTOR || 1.5);
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