// js/possum.js
class PossumGrunt extends Unit {
    constructor(x, y, game, id) {
        // --- ADD LOG in super() call or right after ---
        // The Unit constructor already logs, so this might be redundant unless Possum does something special with HP
        super(x, y, game, 'enemy', CONFIG.POSSUM_GRUNT_HP, CONFIG.POSSUM_GRUNT_SPEED, CONFIG.POSSUM_GRUNT_SIZE, CONFIG.POSSUM_GRUNT_COLOR, id);
        // console.log(`[PossumGrunt Constructor] ${this.id} finished super(). HP: ${this.hp}`);
        // ---------------------------------------------
        this.weapon = WEAPONS.POSSUM_RIFLE;
        this.detectionRange = CONFIG.POSSUM_DETECTION_RANGE;

        this.aiState = 'PATROLLING'; 
        this.patrolPoint1 = { x: x, y: y }; 
        this.patrolPoint2 = this.generateSecondPatrolPoint(x, y, 80, 200); 
        this.currentTargetPatrolPoint = this.patrolPoint2; 
        
        this.patrolWaitTimer = 0; 
        this.PATROL_WAIT_DURATION = 1.5 + Math.random() * 2; 
        
        this.targetX = this.currentTargetPatrolPoint.x;
        this.targetY = this.currentTargetPatrolPoint.y;
        if (distance(this.x, this.y, this.targetX, this.targetY) > 1) { 
            this.isMoving = true;
        }
    }
    // ... (rest of PossumGrunt is fine from previous version with stuck logic)
    generateSecondPatrolPoint(originX, originY, minRadius, maxRadius) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        let pX = originX + Math.cos(angle) * radius;
        let pY = originY + Math.sin(angle) * radius;

        const margin = this.size + 20; 
        pX = Math.max(margin, Math.min(pX, CONFIG.WORLD_WIDTH - margin));
        pY = Math.max(margin, Math.min(pY, CONFIG.WORLD_HEIGHT - margin));
        
        if (this.game && this.game.level) {
            let attempts = 0;
            while(this.game.level.isSpawnPointClear && !this.game.level.isSpawnPointClear(pX, pY, this.size, this.game.level.obstacles) && attempts < 10) {
                const newAngle = Math.random() * Math.PI * 2;
                const newRadius = minRadius + Math.random() * (maxRadius-minRadius) * 0.5; 
                pX = originX + Math.cos(newAngle) * newRadius;
                pY = originY + Math.sin(newAngle) * newRadius;
                pX = Math.max(margin, Math.min(pX, CONFIG.WORLD_WIDTH - margin));
                pY = Math.max(margin, Math.min(pY, CONFIG.WORLD_HEIGHT - margin));
                attempts++;
            }
        }
        return { x: pX, y: pY };
    }

    update(deltaTime) { 
        if (!this.isAlive()) return;
        
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            this.isMoving = false;
            return; 
        }

        this.aiLogic(deltaTime, this.game.playerSquad, this.game.level.obstacles);
        super.update(deltaTime); 
    }

    onStuck() {
        if (this.aiState === 'PATROLLING') {
            if (this.currentTargetPatrolPoint === this.patrolPoint1) {
                this.currentTargetPatrolPoint = this.patrolPoint2;
            } else {
                this.currentTargetPatrolPoint = this.patrolPoint1;
            }
            this.targetX = this.currentTargetPatrolPoint.x;
            this.targetY = this.currentTargetPatrolPoint.y;
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;

        } else if (this.aiState === 'ENGAGING' && this.manualTarget) {
            const nudgeAngle = Math.random() * Math.PI * 2;
            const nudgeDistance = this.size * 3;
            this.targetX = this.x + Math.cos(nudgeAngle) * nudgeDistance;
            this.targetY = this.y + Math.sin(nudgeAngle) * nudgeDistance;
            
            this.targetX = Math.max(this.size, Math.min(this.targetX, CONFIG.WORLD_WIDTH - this.size));
            this.targetY = Math.max(this.size, Math.min(this.targetY, CONFIG.WORLD_HEIGHT - this.size));
            
            if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
        }
    }

    aiLogic(deltaTime, playerSquad, obstacles) {
        let engagableTarget = this.manualTarget; 
        if (!engagableTarget || !engagableTarget.isAlive()) {
            this.manualTarget = null; 
            this.findAutoTarget(playerSquad, obstacles); 
            engagableTarget = this.autoTarget;
        }

        if (engagableTarget && engagableTarget.isAlive()) {
            if (this.aiState !== 'ENGAGING') {
                this.aiState = 'ENGAGING';
                this.manualTarget = engagableTarget; 
            }
        } else { 
            if (this.aiState === 'ENGAGING') {
                this.aiState = 'PATROLLING';
                this.manualTarget = null;
                this.targetX = this.currentTargetPatrolPoint.x; 
                this.targetY = this.currentTargetPatrolPoint.y;
                if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
            }
        }

        switch (this.aiState) {
            case 'PATROLLING':
                if (this.patrolWaitTimer > 0) {
                    this.patrolWaitTimer -= deltaTime;
                    this.isMoving = false; 
                } else {
                    if (this.targetX !== this.currentTargetPatrolPoint.x || this.targetY !== this.currentTargetPatrolPoint.y) {
                        this.targetX = this.currentTargetPatrolPoint.x;
                        this.targetY = this.currentTargetPatrolPoint.y;
                    }
                     if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true;
                    
                    const distToPatrolTarget = distance(this.x, this.y, this.targetX, this.targetY);
                    if (distToPatrolTarget < 5) { 
                        this.isMoving = false; 
                        this.patrolWaitTimer = this.PATROL_WAIT_DURATION;
                        if (this.currentTargetPatrolPoint === this.patrolPoint1) {
                            this.currentTargetPatrolPoint = this.patrolPoint2;
                        } else {
                            this.currentTargetPatrolPoint = this.patrolPoint1;
                        }
                    }
                }
                break;

            case 'ENGAGING':
                if (this.manualTarget && this.manualTarget.isAlive()) { 
                    const distToTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);
                    const preferredRange = this.weapon.range * 0.80; 
                    const tooCloseRange = this.weapon.range * 0.3;

                    if (distToTarget > this.weapon.range * 0.9) { 
                        const angleToTarget = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                        this.targetX = this.manualTarget.x - Math.cos(angleToTarget) * preferredRange;
                        this.targetY = this.manualTarget.y - Math.sin(angleToTarget) * preferredRange;
                        if (distance(this.x,this.y, this.targetX, this.targetY) > 1) this.isMoving = true; else this.isMoving = false;
                    } else if (distToTarget < tooCloseRange) { 
                        const angleFromTarget = Math.atan2(this.y - this.manualTarget.y, this.x - this.manualTarget.x);
                        this.targetX = this.x + Math.cos(angleFromTarget) * (this.speed * deltaTime * 3); 
                        this.targetY = this.y + Math.sin(angleFromTarget) * (this.speed * deltaTime * 3);
                        if (distance(this.x,this.y, this.targetX, this.targetY) > 1) this.isMoving = true; else this.isMoving = false;
                    } else { 
                        this.isMoving = false; 
                        this.targetX = this.x; 
                        this.targetY = this.y;
                    }
                } else { 
                    this.manualTarget = null; 
                    this.aiState = 'PATROLLING'; 
                    this.targetX = this.currentTargetPatrolPoint.x;
                    this.targetY = this.currentTargetPatrolPoint.y;
                    if (distance(this.x, this.y, this.targetX, this.targetY) > 1) this.isMoving = true; else this.isMoving = false;
                }
                break;
        }
    }
}