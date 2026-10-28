// js/possumRevolver.js

// "Six-Shooter Sid": strafes constantly and reloads his cylinder (weapon magazine). Every so often he
// calls a "High Noon" duel — plants, marks one raccoon and fires a single deadly shot when the wind-up
// ends. Enough damage during the wind-up staggers him instead; hard cover stops the shot.
// Tuning: CONFIG.AI.POSSUM_REVOLVER.DUEL and WEAPON_DEFINITIONS.POSSUM_REVOLVER.
class PossumRevolver extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy',
              CONFIG.POSSUM_REVOLVER_HP,
              CONFIG.POSSUM_REVOLVER_SPEED,
              CONFIG.POSSUM_REVOLVER_SIZE,
              CONFIG.POSSUM_REVOLVER_COLOR,
              id || `REVO-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_REVOLVER_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_REVOLVER_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_REVOLVER_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_REVOLVER_DEAD_SPRITE_SCALE';

        this.weaponName = CONFIG.POSSUM_REVOLVER_DEFAULT_WEAPON || 'POSSUM_REVOLVER';

        this.canShootWhileMoving = true;

        this.revolverAIConfig = CONFIG.AI.POSSUM_REVOLVER || {};
        this.detectionRange = this.revolverAIConfig.DETECTION_RANGE || 450;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        this.reloadLabel = 'RELOADING';

        this.xpValue = CONFIG.XP_FOR_REVOLVER_KILL || 150;

        this.STRAFE_COOLDOWN = this.revolverAIConfig.STRAFE_COOLDOWN || 0.5;
        this.timeSinceLastStrafe = 0;

        // High Noon duel.
        this.duelConfig = this.revolverAIConfig.DUEL || { ENABLED: false };
        this.duelCooldownTimer = this.duelConfig.FIRST_DELAY || 5.0;
        this.isDueling = false;
        this.duelTimer = 0;
        this.duelDamageTaken = 0;
        this.duelTarget = null;
        this.duelMark = null;
        this.isStaggered = false;
        this.staggerDuration = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.duelCooldownTimer > 0 && this.aiState !== 'GUARDING') {
            this.duelCooldownTimer -= deltaTime;
        }
        if (this.isStaggered && this.actionTimer <= 0) this.isStaggered = false;
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
         if (this.isDueling) {
             this._updateDuel(deltaTime);
             return;
         }

         // Staggered or stunned: rooted.
         if (this.actionTimer > 0) {
             this.isMoving = false;
             this.currentPath = [];
             this.aiState = 'STAGGERED';
             return;
         }

         let target = this.manualTarget || this.autoTarget;
         if (!target || !target.isAlive()) {
             this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
             target = this.autoTarget;
         }

         if (!target) {
             this.aiState = 'GUARDING';
             if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                 if (!this.isMoving && this.repathCooldown <= 0 && !this.isAtMoveGoal(this.guardPost.x, this.guardPost.y)) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
             } else {
                 this.isMoving = false;
             }
             return;
         }

         this.manualTarget = target;
         const dist = distance(this.x, this.y, target.x, target.y);
         const hasLOS = this.hasLineOfSightTo(target);

         this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
         this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

         if (this.isEnemyReloading()) {
             this.aiState = 'RELOADING';
             this._strafe(target, deltaTime, dist, true);
             return;
         }

         if (hasLOS && dist <= this.weapon.range && this.duelConfig.ENABLED && this.duelCooldownTimer <= 0) {
             this._startDuel(target);
             return;
         }

         if (hasLOS && dist <= this.weapon.range && this.attackCooldown <= 0) {
             this.aiState = 'ENGAGING';
             this._executeFire(target.x, target.y);
         }

         this._strafe(target, deltaTime, dist, false);
     }

     _strafe(target, deltaTime, dist, isReloading) {
         this.timeSinceLastStrafe += deltaTime;

         if (this.timeSinceLastStrafe < this.STRAFE_COOLDOWN) {
             return;
         }

         if (!this.isMoving) {
             const shouldMove = this.game.level.rng.chance(this.revolverAIConfig.STRAFE_CHANCE || 0.85);

             if (shouldMove) {
                 const moveDist = this.revolverAIConfig.STRAFE_DISTANCE || 150;
                 const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
                 const rng = this.game.level.rng;

                 const optimalRange = (this.weapon.range || 520) * 0.6;
                 const needsToClose = dist > optimalRange;
                 const tooClose = dist < optimalRange * 0.4;

                 let moveAngle;
                 const roll = rng.chance(100) / 100;

                 if (needsToClose) {
                     if (roll < 0.7) {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? 0.6 : -0.6);
                     } else {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);
                     }
                 } else if (tooClose) {
                     if (roll < 0.5) {
                         moveAngle = angleToTarget + Math.PI;
                     } else {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? Math.PI * 0.75 : -Math.PI * 0.75);
                     }
                 } else {
                     if (roll < 0.35) {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? 0.5 : -0.5);
                     } else if (roll < 0.65) {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);
                     } else {
                         moveAngle = angleToTarget + (rng.chance(0.5) ? 0.9 : -0.9);
                     }
                 }

                 const newX = this.x + Math.cos(moveAngle) * moveDist;
                 const newY = this.y + Math.sin(moveAngle) * moveDist;

                 this.setMoveTarget(newX, newY);
                 this.timeSinceLastStrafe = 0;
             }
         }
     }

    _startDuel(target) {
        this.isDueling = true;
        this.duelTimer = this.duelConfig.WINDUP || 1.8;
        this.duelDamageTaken = 0;
        this.duelTarget = target;
        this.isMoving = false;
        this.currentPath = [];
        this.duelMark = new DuelMarkEffect(this, target);
        this.game.addVisualEffect(this.duelMark);
        this._bossCallout('DUEL');
    }

    _updateDuel(deltaTime) {
        const cfg = this.duelConfig;
        const target = this.duelTarget;
        // Stunned mid-wind-up, or the mark is gone: the duel is off.
        if (this.actionTimer > 0 || !target || !target.isAlive()) {
            this._endDuel(cfg.COOLDOWN * 0.5);
            return;
        }
        this.isMoving = false;
        this.currentPath = [];
        this.aiState = 'DUELING';
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        this.duelTimer -= deltaTime;
        this.duelMark.progress = 1 - Math.max(0, this.duelTimer) / (cfg.WINDUP || 1.8);
        if (this.duelTimer <= 0) {
            this._fireDuelShot(target);
            this._endDuel(cfg.COOLDOWN);
        }
    }

    // One perfectly accurate, heavy bullet — a real projectile, so hard cover stops it.
    _fireDuelShot(target) {
        const cfg = this.duelConfig;
        const weapon = this.weapon;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const muzzleOffset = this.size / 2 + 17;
        const muzzleX = this.x + Math.cos(angle) * muzzleOffset;
        const muzzleY = this.y + Math.sin(angle) * muzzleOffset;
        const projectile = this.game.getProjectileFromPool(
            muzzleX, muzzleY,
            this.x + Math.cos(angle) * weapon.range,
            this.y + Math.sin(angle) * weapon.range,
            cfg.DAMAGE || 45,
            cfg.PROJECTILE_SPEED || 1500,
            weapon.projectileColor,
            this,
            1.0
        );
        this.game.addProjectile(projectile);
        this.game.addVisualEffect('muzzle_flash', { x: muzzleX, y: muzzleY, scale: (weapon.muzzleFlashScale || 1) * 2 });
        if (weapon.sfxFireKey && this.game.audioManager) this.game.audioManager.play(weapon.sfxFireKey);
        this.game.addScreenShake(0.15, this.x, this.y);
        this.attackCooldown = 0.5;
    }

    _endDuel(cooldown) {
        if (this.duelMark) this.duelMark.isMarkedForDeletion = true;
        this.duelMark = null;
        this.duelTarget = null;
        this.isDueling = false;
        if (this.aiState === 'DUELING') this.aiState = 'ENGAGING';
        this.duelCooldownTimer = cooldown;
    }

    _interruptDuel() {
        const cfg = this.duelConfig;
        this._endDuel(cfg.COOLDOWN);
        const stagger = cfg.STAGGER_TIME || 2.2;
        this.actionTimer = Math.max(this.actionTimer, stagger);
        this.isStaggered = true;
        this.staggerDuration = stagger;
        this.applyStatusEffect('vulnerability', { duration: stagger, damageTakenMult: cfg.STAGGER_DAMAGE_TAKEN_MULT || 1.4 });
        this._bossCallout('DUEL_INTERRUPTED');
    }

    takeDamage(amount, attackerUnit = null, source = null) {
        const hpBefore = this.hp;
        super.takeDamage(amount, attackerUnit, source);
        if (this.isDueling && this.isAlive()) {
            this.duelDamageTaken += hpBefore - this.hp;
            if (this.duelDamageTaken >= (this.duelConfig.INTERRUPT_DAMAGE || 45)) this._interruptDuel();
        }
    }

    getStatusBar() {
        if (this.isDueling) {
            // Fills as the squad's damage closes in on breaking his wind-up.
            const interruptAt = this.duelConfig.INTERRUPT_DAMAGE || 45;
            return this._setStatusBar(this.duelDamageTaken / interruptAt, `rgb(${CONFIG.VISUAL_EFFECTS.BOSS_TELEGRAPHS.DUEL_MARK_COLOR})`, 'HIGH NOON');
        }
        if (this.isStaggered && this.actionTimer > 0) {
            return this._setStatusBar(this.actionTimer / this.staggerDuration, '#ffffff', 'STAGGERED');
        }
        return super.getStatusBar();
    }

    _executeFire(targetX, targetY) {
        if (this.isDueling) return;
        super._executeFire(targetX, targetY);
    }

    die() {
        this._endDuel(0);
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
