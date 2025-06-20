// js/possumBoss1.js

class PossumBoss1 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_BOSS_1_HP, 
              CONFIG.POSSUM_BOSS_1_SPEED, 
              CONFIG.POSSUM_BOSS_1_SIZE, 
              CONFIG.POSSUM_BOSS_1_COLOR, 
              id || `BOSS1-${Date.now().toString(36).slice(-4)}`);

        this.primaryWeapon = WEAPONS.POSSUM_BOSS_1_WEAPON; 
        this.secondaryWeapon = WEAPONS.POSSUM_BOSS_1_SECONDARY;
        this.weapon = this.primaryWeapon; 
        
        this.canShootWhileMoving = false;
        
        this.bossAIConfig = CONFIG.AI.POSSUM_BOSS_1 || {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || 500;

        this.aiState = 'GUARDING';
        this.attackMode = 'GRENADE_VOLLEY'; 
        this.volleyCount = 0;
        this.burstCount = 0;
        
        this.guardPost = { x: x, y: y };
        
        this.attackCooldown = 0;
        
        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 250;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        // The super.update() call will invoke _handleMovement and then our overridden _handleEnemyCombat
        super.update(deltaTime); 
    }
    
    // --- MODIFIED: This is the correct override for the Unit's AI execution ---
    _handleEnemyCombat(deltaTime, obstacles) {
        let target = this.manualTarget || this.autoTarget;

        // 1. ACQUIRE TARGET
        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
            if (!target) {
                this.aiState = 'GUARDING';
            } else {
                this.aiState = 'ENGAGING'; 
            }
        }
        
        // 2. EXECUTE STATE LOGIC
        if (this.aiState === 'GUARDING') {
            if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                if (!this.isMoving) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        if (!target) {
            this.aiState = 'GUARDING';
            return;
        }

        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level);
        
        // 3. REPOSITION IF NECESSARY
        const needsToReposition = (dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE) || !hasLOS || (dist > this.primaryWeapon.range && dist > this.secondaryWeapon.range);
        if (needsToReposition) {
            if (!this.isMoving) {
                let targetX, targetY;
                if (dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE) {
                    const angleAway = Math.atan2(this.y - target.y, this.x - target.x);
                    targetX = this.x + Math.cos(angleAway) * 150;
                    targetY = this.y + Math.sin(angleAway) * 150;
                } else {
                    targetX = target.x;
                    targetY = target.y;
                }
                this.setMoveTarget(targetX, targetY);
            }
            return; // Exit to focus on moving
        }
        
        if (this.isMoving) {
            this.isMoving = false;
        }
        
        // 4. ATTACK IF IN POSITION AND OFF COOLDOWN
        if (this.attackCooldown > 0) return;
        
        // Execute the current attack mode
        if (this.attackMode === 'GRENADE_VOLLEY') {
            this._executeGrenadeFire(target);
        } else if (this.attackMode === 'MG_BURST') {
            this._executeFire(target.x, target.y);
        }
    }
    
    _executeGrenadeFire(target) {
        if (!this.game || !this.primaryWeapon || !target) return;
        
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = this.gunAimAngle;

        const spread = this.bossAIConfig.GRENADE_TARGET_SPREAD_RADIUS || 80;
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = Math.random() * spread;
        
        const predictionTime = 0.3;
        const predictedX = target.x + target.currentVelocity.x * predictionTime;
        const predictedY = target.y + target.currentVelocity.y * predictionTime;
        
        const finalTargetX = predictedX + Math.cos(randomAngle) * randomRadius;
        const finalTargetY = predictedY + Math.sin(randomAngle) * randomRadius;

        const grenade = this.game.getGrenadeProjectileFromPool(this.x, this.y, finalTargetX, finalTargetY, this);
        this.game.addProjectile(grenade);

        if (this.primaryWeapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(this.primaryWeapon.sfxFireKey);
        }
        
        this.volleyCount++;
        if (this.volleyCount >= (this.bossAIConfig.GRENADES_PER_VOLLEY || 3)) {
            this.attackMode = 'MG_BURST';
            this.volleyCount = 0;
            this.attackCooldown = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
        } else {
            this.attackCooldown = this.bossAIConfig.GRENADE_COOLDOWN_BETWEEN_SHOTS || 0.6;
        }
    }

    _executeFire(targetX, targetY) {
        if (!this.game || !this.secondaryWeapon) return;

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = this.gunAimAngle;
        
        const fireAngle = this.gunAimAngle;
        const accuracy = this.secondaryWeapon.accuracyStationary;

        const projectile = this.game.getProjectileFromPool(
            this.x, this.y, 
            this.x + Math.cos(fireAngle) * this.secondaryWeapon.range,  
            this.y + Math.sin(fireAngle) * this.secondaryWeapon.range,
            this.secondaryWeapon.damage,
            this.secondaryWeapon.projectileSpeed,
            this.secondaryWeapon.projectileColor,
            this,
            accuracy
        );
        this.game.addProjectile(projectile);

        if (this.secondaryWeapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(this.secondaryWeapon.sfxFireKey);
        }
        
        this.attackCooldown = 1 / this.secondaryWeapon.rof;
        this.burstCount++;
        if (this.burstCount >= (this.bossAIConfig.MG_BURST_SIZE || 5)) {
            this.attackMode = 'GRENADE_VOLLEY';
            this.burstCount = 0;
            this.attackCooldown = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
        }
    }

    die() {
        super.die();
        if(this.game) {
            const assassinateObjective = this.game.currentMissionParams?.objectives.find(obj => 
                obj.type === "ASSASSINATION" && obj.targetUnitId === this.id
            );
            if (assassinateObjective && !assassinateObjective.isComplete) {
                assassinateObjective.isComplete = true;
                assassinateObjective.currentProgress = 1;
            }
        }
        console.log(`PossumBoss1 ${this.id} has been defeated!`);
    }
}