// js/possumBoss1.js

class PossumBoss1 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_BOSS_1_HP, 
              CONFIG.POSSUM_BOSS_1_SPEED, 
              CONFIG.POSSUM_BOSS_1_SIZE, 
              CONFIG.POSSUM_BOSS_1_COLOR, 
              id || `BOSS1-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_BOSS_1_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_BOSS_1_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_BOSS_1_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_BOSS_1_DEAD_SPRITE_SCALE';
        
        this.primaryWeaponName = CONFIG.POSSUM_BOSS_1_DEFAULT_WEAPON || 'POSSUM_BOSS_1_WEAPON'; 
        this.secondaryWeaponName = CONFIG.POSSUM_BOSS_1_DEFAULT_SECONDARY_WEAPON || 'POSSUM_BOSS_1_SECONDARY';
        this.weaponName = this.primaryWeaponName; 
        
        this.canShootWhileMoving = false;
        
        this.bossAIConfig = CONFIG.AI.POSSUM_BOSS_1 || {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || 500;
        this._bossTargetAcquisitionOptimization = true;

        this.aiState = 'GUARDING';
        this.attackMode = 'GRENADE_VOLLEY'; 
        this.volleyCount = 0;
        this.burstCount = 0;
        
        this.guardPost = { x: x, y: y };
        
        // Use actionTimer for major cooldowns, attackCooldown for rate-of-fire.
        this.actionTimer = 0; // Changed from attackCooldown
        
        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 250;
        
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.bossAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2;
        this.timeSinceLastChaseDestUpdate = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
        }
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime); 
    }
    
    _handleEnemyCombat(deltaTime, obstacles) {
        // Find a target if we don't have one (throttled via targetAcquisitionTimer)
        let target = this.manualTarget || this.autoTarget;
        if (!target || !target.isAlive()) {
            if (this.targetAcquisitionTimer <= 0) {
                this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
                this.targetAcquisitionTimer = 0.3 + Math.random() * 0.2;
            }
            target = this.manualTarget || this.autoTarget;
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
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level);
        const currentWeapon = this.attackMode === 'GRENADE_VOLLEY' ? WEAPONS[this.primaryWeaponName] : WEAPONS[this.secondaryWeaponName];

        // AIM: Always aim if there is a target
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        // SHOOT: Check if we can shoot
        if (hasLOS && dist <= currentWeapon.range) {
            this.isMoving = false; // Stop moving if in range and LOS
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            // Only fire if both major (actionTimer) and minor (attackCooldown) timers are ready
            if (this.actionTimer <= 0 && this.attackCooldown <= 0) {
                if (this.attackMode === 'GRENADE_VOLLEY') {
                    this._executeGrenadeFire(target, deltaTime);
                } else if (this.attackMode === 'MG_BURST') {
                    this._executeFire(target.x, target.y, deltaTime);
                }
            }
            return; // We are in shooting logic, so we are done for this frame.
        }

        // MOVE: If we can't shoot, we need to move
        this.aiState = 'ENGAGING_CHASING';
        
        let shouldUpdateChaseDest = false;
        const chaseTargetX = dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE 
            ? this.x + Math.cos(Math.atan2(this.y - target.y, this.x - target.x)) * 150
            : target.x;
        const chaseTargetY = dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE 
            ? this.y + Math.sin(Math.atan2(this.y - target.y, this.x - target.x)) * 150
            : target.y;

        if (!this.chaseDestination) {
            shouldUpdateChaseDest = true;
        } else if (this.timeSinceLastChaseDestUpdate >= this.CHASE_DESTINATION_REFRESH_INTERVAL) {
            shouldUpdateChaseDest = true;
        } else if (this.timeSinceLastChaseDestUpdate > this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL &&
            distanceSq(chaseTargetX, chaseTargetY, this.chaseDestination.x, this.chaseDestination.y) > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ) {
            shouldUpdateChaseDest = true;
        } else if (!this.isMoving && dist > this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE * 1.5) {
            shouldUpdateChaseDest = true;
        }

        if (shouldUpdateChaseDest) {
            this.chaseDestination = { x: chaseTargetX, y: chaseTargetY };
            this.timeSinceLastChaseDestUpdate = 0;
            
            if (!this.isMoving) {
                if (!this.setMoveTarget(this.chaseDestination.x, this.chaseDestination.y)) {
                    this.manualTarget = null;
                    this.autoTarget = null;
                    this.aiState = 'GUARDING';
                }
            }
        }
    }
    
    _executeGrenadeFire(target, deltaTime) {
        if (!this.game || !WEAPONS[this.primaryWeaponName] || !target) return;
        const primaryWeapon = WEAPONS[this.primaryWeaponName];
        
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        const spread = this.bossAIConfig.GRENADE_TARGET_SPREAD_RADIUS || 80;
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = Math.random() * spread;
        
        const predictionTime = 0.3;
        const predictedX = target.x + target.currentVelocity.x * predictionTime;
        const predictedY = target.y + target.currentVelocity.y * predictionTime;
        
        const finalTargetX = predictedX + Math.cos(randomAngle) * randomRadius;
        const finalTargetY = predictedY + Math.sin(randomAngle) * randomRadius;

        const muzzleOffset = this.size / 2 + 17;
        const muzzleX = this.x + Math.cos(this.facingAngle) * muzzleOffset;
        const muzzleY = this.y + Math.sin(this.facingAngle) * muzzleOffset;

        const grenade = this.game.getGrenadeProjectileFromPool(muzzleX, muzzleY, finalTargetX, finalTargetY, this);
        this.game.addProjectile(grenade);

        if (primaryWeapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(primaryWeapon.sfxFireKey);
        }
        
        this.volleyCount++;
        this.attackCooldown = this.bossAIConfig.GRENADE_COOLDOWN_BETWEEN_SHOTS || 0.6;

        if (this.volleyCount >= (this.bossAIConfig.GRENADES_PER_VOLLEY || 3)) {
            this.attackMode = 'MG_BURST';
            this.volleyCount = 0;
            this.actionTimer = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
            this.weapon = WEAPONS[this.secondaryWeaponName];
        }
    }

    _executeFire(targetX, targetY, deltaTime) {
        if (!this.game || !WEAPONS[this.secondaryWeaponName]) return;
        const secondaryWeapon = WEAPONS[this.secondaryWeaponName];

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);
        
        const fireAngle = this.gunAimAngle;
        const accuracy = secondaryWeapon.accuracyStationary;

        const muzzleOffset = this.size / 2 + 17;
        const muzzleX = this.x + Math.cos(fireAngle) * muzzleOffset;
        const muzzleY = this.y + Math.sin(fireAngle) * muzzleOffset;

        const projectile = this.game.getProjectileFromPool(
            muzzleX, muzzleY, 
            this.x + Math.cos(fireAngle) * secondaryWeapon.range,  
            this.y + Math.sin(fireAngle) * secondaryWeapon.range,
            secondaryWeapon.damage,
            secondaryWeapon.projectileSpeed,
            secondaryWeapon.projectileColor,
            this,
            accuracy
        );
        this.game.addProjectile(projectile);

        if (secondaryWeapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(secondaryWeapon.sfxFireKey);
        }
        
        this.attackCooldown = 1 / secondaryWeapon.rof;
        this.burstCount++;

        if (this.burstCount >= (this.bossAIConfig.MG_BURST_SIZE || 5)) {
            this.attackMode = 'GRENADE_VOLLEY';
            this.burstCount = 0;
            this.actionTimer = (this.bossAIConfig.MG_COOLDOWN_AFTER_BURST || 2.5);
            this.weapon = WEAPONS[this.primaryWeaponName];
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