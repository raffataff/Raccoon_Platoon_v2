// js/possumHeavy.js
class PossumHeavy extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_HEAVY_HP, 
              CONFIG.POSSUM_HEAVY_SPEED, 
              CONFIG.POSSUM_HEAVY_SIZE, 
              CONFIG.POSSUM_HEAVY_COLOR, 
              id || `PHVY-${Date.now().toString(36).slice(-4)}`);
        
        this.weapon = WEAPONS.POSSUM_HEAVY_WEAPON;
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE + 20; // Slightly better detection due to role

        this.aiState = 'GUARDING'; // Or 'IDLE_HEAVY'
        this.guardPost = { x: x, y: y }; // Remembers its intended guard spot
        this.maxChaseDistance = this.weapon.range * 0.5; // Won't chase too far from post
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) { /* ... same as base ... */ return; }

        this.aiLogicHeavy(deltaTime, this.game.playerSquad, this.game.level.obstacles);
        super.update(deltaTime); // Handles movement, base combat firing, stuck detection
    }
    
    onStuck() { // Override if Heavy needs different unstuck behavior
        // console.log(`[PossumHeavy ${this.id}] onStuck. Reverting to guard post.`);
        this.targetX = this.guardPost.x;
        this.targetY = this.guardPost.y;
        this.isMoving = true;
        this.manualTarget = null; // Clear target if stuck trying to reach it
        this.aiState = 'GUARDING';
    }

    aiLogicHeavy(deltaTime, playerSquad, obstacles) {
        let currentTarget = this.manualTarget;
        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerSquad, obstacles); // Base Unit method
            currentTarget = this.autoTarget;
        }

        if (currentTarget && currentTarget.isAlive()) {
            this.aiState = 'ENGAGING_HEAVY';
            this.manualTarget = currentTarget; // Lock on
        } else {
            if (this.aiState === 'ENGAGING_HEAVY') {
                this.aiState = 'GUARDING'; // Return to guard post
                this.targetX = this.guardPost.x;
                this.targetY = this.guardPost.y;
                this.isMoving = (distance(this.x, this.y, this.targetX, this.targetY) > 1);
            }
        }

        switch (this.aiState) {
            case 'GUARDING':
                // If not at guard post, move there.
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 5) {
                    this.targetX = this.guardPost.x;
                    this.targetY = this.guardPost.y;
                    this.isMoving = true;
                } else {
                    this.isMoving = false; // At guard post, scan.
                }
                break;
            case 'ENGAGING_HEAVY':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    
                    // Heavies prefer to shoot from max range and not move if target is in range.
                    if (distToTarget <= this.weapon.range) {
                        this.isMoving = false; // Stop and shoot
                        this.targetX = this.x; this.targetY = this.y; // Hold position
                        this.facingAngle = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                    } else {
                        // Target out of range. If it's not too far from its guard post, move to engage.
                        if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) < this.maxChaseDistance * 1.5) {
                            // Move to optimal engagement range, similar to player unit's engage logic
                            const preferredRange = this.weapon.range * 0.9; // Try to stay near max range
                            const vecX = this.x - this.manualTarget.x;
                            const vecY = this.y - this.manualTarget.y;
                            this.targetX = this.manualTarget.x + (vecX / distToTarget) * preferredRange;
                            this.targetY = this.manualTarget.y + (vecY / distToTarget) * preferredRange;
                            this.isMoving = true;
                        } else {
                            // Target is too far, and Heavy is far from its post. Return to post.
                            this.manualTarget = null; // Drop target
                            this.aiState = 'GUARDING';
                        }
                    }
                } else {
                    this.aiState = 'GUARDING'; // Target lost
                }
                break;
        }
    }
}