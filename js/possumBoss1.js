// js/possumBoss1.js

class PossumBoss1 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_BOSS_1_HP, 
              CONFIG.POSSUM_BOSS_1_SPEED, 
              CONFIG.POSSUM_BOSS_1_SIZE, 
              CONFIG.POSSUM_BOSS_1_COLOR, 
              id || `BOSS1-${Date.now().toString(36).slice(-4)}`);

        this.deadSpritePathKey = 'POSSUM_BOSS_1_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_BOSS_1_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_BOSS_1_DEAD_SPRITE_SCALE';
        
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
        
        // Use actionTimer for major cooldowns, attackCooldown for rate-of-fire.
        this.actionTimer = 0; // Changed from attackCooldown
        
        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 250;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        // We now handle actionTimer here, separate from the base unit's attackCooldown
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
        }
        super.update(deltaTime); 
    }
    
    _handleEnemyCombat(deltaTime, obstacles) {
        // Find a target if we don't have one
        let target = this.manualTarget || this.autoTarget;
        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
        }

        // If no target, return to guard post
        if (!target) {
            this.aiState = 'GUARDING';
            if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                if (!this.isMoving) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        // We have a target, lock on and evaluate
        this.manualTarget = target;
        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level);
        const currentWeapon = this.attackMode === 'GRENADE_VOLLEY' ? this.primaryWeapon : this.secondaryWeapon;

        // AIM: Always aim if there is a target
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = this.gunAimAngle;

        // SHOOT: Check if we can shoot
        if (hasLOS && dist <= currentWeapon.range) {
            this.isMoving = false; // Stop moving if in range and LOS
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            // Only fire if both major (actionTimer) and minor (attackCooldown) timers are ready
            if (this.actionTimer <= 0 && this.attackCooldown <= 0) {
                if (this.attackMode === 'GRENADE_VOLLEY') {
                    this._executeGrenadeFire(target);
                } else if (this.attackMode === 'MG_BURST') {
                    this._executeFire(target.x, target.y);
                }
            }
            return; // We are in shooting logic, so we are done for this frame.
        }

        // MOVE: If we can't shoot, we need to move
        this.aiState = 'ENGAGING_CHASING';
        if (!this.isMoving) {
            let targetX, targetY;
            if (dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE) {
                // Too close, move away
                const angleAway = Math.atan2(this.y - target.y, this.x - target.x);
                targetX = this.x + Math.cos(angleAway) * 150;
                targetY = this.y + Math.sin(angleAway) * 150;
            } else {
                // Too far, move closer
                targetX = target.x;
                targetY = target.y;
            }
            
            if (!this.setMoveTarget(targetX, targetY)) {
                // If we can't path, reset to guarding to avoid getting stuck
                this.manualTarget = null;
                this.autoTarget = null;
                this.aiState = 'GUARDING';
            }
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
        // Use attackCooldown for delay BETWEEN shots in a volley
        this.attackCooldown = this.bossAIConfig.GRENADE_COOLDOWN_BETWEEN_SHOTS || 0.6;

        if (this.volleyCount >= (this.bossAIConfig.GRENADES_PER_VOLLEY || 3)) {
            this.attackMode = 'MG_BURST';
            this.volleyCount = 0;
            // Use actionTimer for the long delay AFTER the volley is complete
            this.actionTimer = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
            this.weapon = this.secondaryWeapon;
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
        
        // Use attackCooldown for the rate of fire
        this.attackCooldown = 1 / this.secondaryWeapon.rof;
        this.burstCount++;

        if (this.burstCount >= (this.bossAIConfig.MG_BURST_SIZE || 5)) {
            this.attackMode = 'GRENADE_VOLLEY';
            this.burstCount = 0;
            // Use actionTimer for the long delay AFTER the burst is complete
            this.actionTimer = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
            this.weapon = this.primaryWeapon;
        }
    }

    die() {
        super.die();
        if(this.game) {
            const explosionRadius = this.bossAIConfig.DEATH_EXPLOSION_RADIUS;
            if (explosionRadius > 0) {
                this.game.addVisualEffect('barrel_explosion', { x: this.x, y: this.y, radius: explosionRadius });
            }

            const sfxKey = this.bossAIConfig.DEATH_EXPLOSION_SFX;
            if (sfxKey && this.game.audioManager) {
                this.game.audioManager.play(sfxKey);
            }

            const assassinateObjective = this.game.currentMissionParams?.objectives.find(obj => 
                obj.type === "ASSASSINATION" && obj.targetUnitId === this.id
            );
            if (assassinateObjective && !assassinateObjective.isComplete) {
                assassinateObjective.isComplete = true;
                assassinateObjective.currentProgress = 1;
            }
        }
//        console.log(`PossumBoss1 ${this.id} has been defeated!`);
    }
}