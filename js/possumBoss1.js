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

        // --- MODIFIED: New AI state properties for attack cycle ---
        this.aiState = 'GUARDING';
        this.attackMode = 'GRENADE_VOLLEY'; // Start with grenades
        this.volleyCount = 0;
        
        this.aiStateTimer = 0; 
        this.guardPost = { x: x, y: y };
        
        this.grenadeCooldown = 0;
        this.mgCooldown = 0;
        this.mgSuppressionTimer = 0;
        
        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 250;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        if (this.grenadeCooldown > 0) this.grenadeCooldown -= deltaTime;
        if (this.mgCooldown > 0) this.mgCooldown -= deltaTime;
        if (this.aiStateTimer > 0) this.aiStateTimer -= deltaTime;
        if (this.mgSuppressionTimer > 0) this.mgSuppressionTimer -= deltaTime;

        super.update(deltaTime); 
    }
    
    // --- MODIFIED: Rewritten AI Logic with Attack Cycle ---
    aiLogic(deltaTime, playerUnitsOnMap, obstacles) {
        let target = this.manualTarget || this.autoTarget;

        if (!target || !target.isAlive()) {
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            target = this.autoTarget;
            if (!target) {
                this.aiState = 'GUARDING';
            }
        }
        
        if (this.aiState === 'GUARDING') {
            if (target) {
                this.aiState = 'EVALUATING';
            } else if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                this.setMoveTarget(this.guardPost.x, this.guardPost.y);
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
        const inMGRange = dist <= this.secondaryWeapon.range;
        const tooClose = dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE;

        // Repositioning takes priority
        if (tooClose || (!hasLOS && this.actionTimer <= 0)) {
            const angleAway = Math.atan2(this.y - target.y, this.x - target.x);
            const repositionDist = tooClose ? this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE * 1.5 : dist;
            this.setMoveTarget(this.x + Math.cos(angleAway) * repositionDist, this.y + Math.sin(angleAway) * repositionDist);
            return;
        }

        if (this.isMoving) {
            // Don't start a new attack while moving unless it's the MG suppression phase
            if (this.attackMode !== 'MG_SUPPRESSION') {
                return;
            }
        }

        // --- Attack Cycle Logic ---
        if (this.actionTimer > 0) return; // Wait for current attack animation to finish

        if (this.attackMode === 'GRENADE_VOLLEY') {
            if (this.grenadeCooldown <= 0) {
                this._executeGrenadeFire(target.x, target.y);
                this.volleyCount++;
                if (this.volleyCount >= (this.bossAIConfig.GRENADES_PER_VOLLEY || 3)) {
                    this.attackMode = 'MG_SUPPRESSION';
                    this.volleyCount = 0;
                    this.mgSuppressionTimer = this.bossAIConfig.MG_SUPPRESSION_DURATION_SECONDS || 3.0;
                }
            }
        } else if (this.attackMode === 'MG_SUPPRESSION') {
            if (this.mgSuppressionTimer > 0) {
                if (inMGRange && hasLOS && this.mgCooldown <= 0) {
                    this._executeFire(target.x, target.y);
                }
            } else {
                this.attackMode = 'GRENADE_VOLLEY';
            }
        }
    }

    evaluateAndSetNextAction(target) {
        if (!target || !target.isAlive()) {
            this.aiState = 'GUARDING';
            return;
        }
        
        const dist = distance(this.x, this.y, target.x, target.y);
        const canUseGrenade = this.grenadeCooldown <= 0;
        const canUseMG = this.mgCooldown <= 0;
        
        const inGrenadeRange = dist >= this.bossAIConfig.PREFERRED_GRENADE_RANGE_MIN && dist <= this.bossAIConfig.PREFERRED_GRENADE_RANGE_MAX;
        const inMGRange = dist <= this.secondaryWeapon.range;
        const tooClose = dist < this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE;

        // Priority 1: If too close, back away
        if (tooClose) {
            const angleAway = Math.atan2(this.y - target.y, this.x - target.x);
            const repositionDist = this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE * 1.5;
            this.setMoveTarget(this.x + Math.cos(angleAway) * repositionDist, this.y + Math.sin(angleAway) * repositionDist);
            this.aiState = 'REPOSITIONING';
            this.aiStateTimer = this.bossAIConfig.REPOSITION_DURATION_MAX_SECONDS || 2.0;
            return;
        }

        // Priority 2: Use grenade if in perfect range and off cooldown
        if (canUseGrenade && inGrenadeRange) {
            this.aiState = 'FIRING_GRENADE';
            this._executeGrenadeFire(target.x, target.y);
            return;
        }
        
        // Priority 3: Use MG if in range and off cooldown
        if (canUseMG && inMGRange) {
            this.aiState = 'FIRING_MG';
            this._executeFire(target.x, target.y); // Fires the MG
            return;
        }
        
        // Priority 4: If out of all ranges, chase the player
        if (dist > this.primaryWeapon.range) {
            this.setMoveTarget(target.x, target.y);
            this.aiState = 'REPOSITIONING';
            this.aiStateTimer = this.bossAIConfig.REPOSITION_DURATION_MAX_SECONDS || 2.0;
            return;
        }
        
        // Fallback: If can't do anything else, wait and re-evaluate
        this.aiState = 'EVALUATING';
        this.aiStateTimer = this.bossAIConfig.EVALUATION_INTERVAL_SECONDS || 0.5;
        if (this.isMoving) this.isMoving = false; // Stop moving if just waiting
    }
    
    _executeGrenadeFire(targetX, targetY) {
        if (!this.game || !this.primaryWeapon) return;
        
        this.isMoving = false;
        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = this.gunAimAngle;

        const grenade = this.game.getGrenadeProjectileFromPool(this.x, this.y, targetX, targetY, this);
        this.game.addProjectile(grenade);

        if (this.primaryWeapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(this.primaryWeapon.sfxFireKey);
        }

        this.grenadeCooldown = (this.bossAIConfig.GRENADE_THROW_COOLDOWN_BASE || 0.8) + (Math.random() * (this.bossAIConfig.GRENADE_THROW_COOLDOWN_RANDOM_ADD || 0.4));
        this.actionTimer = this.grenadeCooldown * 0.8; // Set action timer for animation
    }

    _executeFire(targetX, targetY) {
        if (!this.game || !this.secondaryWeapon) return;

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = this.gunAimAngle;
        
        const fireAngle = this.gunAimAngle;
        const accuracy = this.isMoving ? this.secondaryWeapon.accuracyMoving : this.secondaryWeapon.accuracyStationary;

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

        this.mgCooldown = 1 / this.secondaryWeapon.rof;
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