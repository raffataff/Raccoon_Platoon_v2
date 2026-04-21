// js/possumRevolver.js

class PossumRevolver extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_REVOLVER_HP, 
              CONFIG.POSSUM_REVOLVER_SPEED, 
              CONFIG.POSSUM_REVOLVER_SIZE, 
              CONFIG.POSSUM_REVOLVER_COLOR, 
              id || `REVO-${Date.now().toString(36).slice(-4)}`);

        this.deadSpritePathKey = 'POSSUM_REVOLVER_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_REVOLVER_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_REVOLVER_DEAD_SPRITE_SCALE';
        
        this.weaponName = CONFIG.POSSUM_REVOLVER_DEFAULT_WEAPON || 'POSSUM_REVOLVER';
        
        this.canShootWhileMoving = true;
        
        this.revolverAIConfig = CONFIG.AI.POSSUM_REVOLVER || {};
        this.detectionRange = this.revolverAIConfig.DETECTION_RANGE || 450;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        
        this.burstAmmo = this.revolverAIConfig.BURST_SIZE || 8;
        this.reloadTimer = 0;
        
        this.xpValue = CONFIG.XP_FOR_REVOLVER_KILL || 150;
        
        this.STRAFE_COOLDOWN = this.revolverAIConfig.STRAFE_COOLDOWN || 0.5;
        this.timeSinceLastStrafe = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        if (this.reloadTimer > 0) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.reloadTimer = 0;
                this.burstAmmo = this.revolverAIConfig.BURST_SIZE || 8; 
            }
        }

        super.update(deltaTime); 
    }
    
    _handleEnemyCombat(deltaTime, obstacles) {
        let target = this.manualTarget || this.autoTarget;
        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
        }

        if (!target) {
            this.aiState = 'GUARDING';
            if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                if (!this.isMoving) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        this.manualTarget = target;
        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level);

        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = this.gunAimAngle;

        if (this.reloadTimer > 0) {
            this.aiState = 'RELOADING';
            this._strafe(target, deltaTime); 
            return; 
        }

        if (hasLOS && dist <= this.weapon.range && this.attackCooldown <= 0) {
            this.aiState = 'ENGAGING';
            this._executeFire(target.x, target.y);
        }
        
        this._strafe(target, deltaTime);
    }

    _strafe(target, deltaTime) {
        this.timeSinceLastStrafe += deltaTime;
        
        if (this.timeSinceLastStrafe < this.STRAFE_COOLDOWN) {
            return;
        }
        
        if (!this.isMoving) {
            const shouldMove = this.game.level.rng.chance(this.revolverAIConfig.STRAFE_CHANCE || 0.85);
            
            if (shouldMove) {
                const strafeDist = this.revolverAIConfig.STRAFE_DISTANCE || 150;
                const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
                const strafeAngle = angleToTarget + (this.game.level.rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);

                const newX = this.x + Math.cos(strafeAngle) * strafeDist;
                const newY = this.y + Math.sin(strafeAngle) * strafeDist;
                
                this.setMoveTarget(newX, newY);
                this.timeSinceLastStrafe = 0;
            }
        }
    }
    
    _executeFire(targetX, targetY) {
        if (!this.weapon || this.reloadTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) return;

        super._executeFire(targetX, targetY); 
        
        this.burstAmmo--;

        if (this.burstAmmo <= 0) {
            this.reloadTimer = this.revolverAIConfig.RELOAD_TIME_SECONDS || 2.0;
        }
    }

    die() {
        super.die();
        const assassinateObjective = this.game.currentMissionParams?.objectives.find(obj => 
            obj.type === "ASSASSINATION" && obj.targetUnitId === this.id
        );
        if (assassinateObjective && !assassinateObjective.isComplete) {
            assassinateObjective.isComplete = true;
            assassinateObjective.currentProgress = 1;
        }
    }
}