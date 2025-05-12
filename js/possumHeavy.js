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
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE + 20; 

        this.aiState = 'GUARDING'; 
        this.guardPost = { x: x, y: y }; 
        this.maxChaseDistance = this.weapon.range * 0.75; // Reduced chase slightly
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) { 
            this.actionTimer -= deltaTime;
            this.isMoving = false;
            return; 
        }

        // Pass the correct list of targetable player units
        this.aiLogicHeavy(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
        super.update(deltaTime); 
    }
    
    onStuck() { 
        // ... (same as before)
        if (this.aiState === 'PATROLLING' || this.aiState === 'GUARDING') { // Added GUARDING here
            // For heavy, returning to guard post might be better than random patrol point
            this.targetX = this.guardPost.x;
            this.targetY = this.guardPost.y;
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
            this.aiState = 'GUARDING';


        } else if (this.aiState === 'ENGAGING_HEAVY' && this.manualTarget) {
            const nudgeAngle = Math.random() * Math.PI * 2;
            const nudgeDistance = this.size * 3;
            this.targetX = this.x + Math.cos(nudgeAngle) * nudgeDistance;
            this.targetY = this.y + Math.sin(nudgeAngle) * nudgeDistance;
            
            this.targetX = Math.max(this.size, Math.min(this.targetX, CONFIG.WORLD_WIDTH - this.size));
            this.targetY = Math.max(this.size, Math.min(this.targetY, CONFIG.WORLD_HEIGHT - this.size));
            
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
        }
    }

    // playerUnitsOnMap is this.game.deployedSquadRoster
    aiLogicHeavy(deltaTime, playerUnitsOnMap, obstacles) {
        let currentTarget = this.manualTarget; // AI's focused target
        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            // Heavy Possum uses its own findAutoTarget call within its AI logic
            this.findAutoTarget(playerUnitsOnMap || [], obstacles); // Pass the correct list
            currentTarget = this.autoTarget;
        }

        if (currentTarget && currentTarget.isAlive()) {
            this.aiState = 'ENGAGING_HEAVY';
            this.manualTarget = currentTarget; 
        } else {
            if (this.aiState === 'ENGAGING_HEAVY') {
                this.aiState = 'GUARDING'; 
                this.targetX = this.guardPost.x;
                this.targetY = this.guardPost.y;
                this.isMoving = (distance(this.x, this.y, this.targetX, this.targetY) > 1);
            }
        }

        switch (this.aiState) {
            case 'GUARDING':
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 5) {
                    this.targetX = this.guardPost.x;
                    this.targetY = this.guardPost.y;
                    this.isMoving = true;
                } else {
                    this.isMoving = false; 
                }
                break;
            case 'ENGAGING_HEAVY':
                if (this.manualTarget && this.manualTarget.isAlive()) {
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    
                    if (distToTarget <= this.weapon.range) {
                        this.isMoving = false; 
                        this.targetX = this.x; this.targetY = this.y; 
                        this.facingAngle = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                    } else {
                        if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) < this.maxChaseDistance) {
                            const preferredRange = this.weapon.range * 0.9; 
                            const vecX = this.x - this.manualTarget.x; // Vector from target to self
                            const vecY = this.y - this.manualTarget.y;
                            // Normalize this vector and scale by preferredRange
                            const currentDistToTarget = Math.hypot(vecX, vecY); // Should be same as distToTarget
                            if (currentDistToTarget > 0) { // Avoid division by zero
                                this.targetX = this.manualTarget.x + (vecX / currentDistToTarget) * preferredRange;
                                this.targetY = this.manualTarget.y + (vecY / currentDistToTarget) * preferredRange;
                                this.isMoving = true;
                            } else { this.isMoving = false; } // On top of target, stop
                        } else {
                            this.manualTarget = null; 
                            this.aiState = 'GUARDING';
                        }
                    }
                } else {
                    this.aiState = 'GUARDING'; 
                }
                break;
        }
    }
}