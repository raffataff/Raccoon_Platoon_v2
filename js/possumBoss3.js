// js/possumBoss3.js

// "Ironhide": armored front (flank him), a minigun that spins up and sweeps instead of tracking,
// and an overheat after each stream (the weapon's magazine) that leaves him venting — stationary,
// armor open. Tuning: CONFIG.AI.POSSUM_BOSS_3 and WEAPON_DEFINITIONS.POSSUM_BOSS_3_WEAPON.
class PossumBoss3 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy',
              CONFIG.POSSUM_BOSS_3_HP,
              CONFIG.POSSUM_BOSS_3_SPEED,
              CONFIG.POSSUM_BOSS_3_SIZE,
              CONFIG.POSSUM_BOSS_3_COLOR,
              id || `BOSS3-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_BOSS_3_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_BOSS_3_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_BOSS_3_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_BOSS_3_DEAD_SPRITE_SCALE';

        this.weaponName = CONFIG.POSSUM_BOSS_3_DEFAULT_WEAPON || 'POSSUM_BOSS_3_WEAPON';
        this.canShootWhileMoving = false;

        this.bossAIConfig = CONFIG.AI.POSSUM_BOSS_3 || {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || 500;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        this.actionTimer = 0;
        this.xpValue = CONFIG.XP_FOR_BOSS_3_KILL || 250;

        // Minigun: 'IDLE' -> 'SPINNING_UP' -> 'FIRING'; venting is the magazine reload (isEnemyReloading).
        this.minigunState = 'IDLE';
        this.spinUpTimer = 0;
        this.streamAngle = 0;
        this.ventSparkTimer = 0;

        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.bossAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2;
        this.timeSinceLastChaseDestUpdate = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        // Heat bleeds off between streams.
        const weapon = this.magazineWeapon;
        if (weapon && this.minigunState !== 'FIRING' && !this.isEnemyReloading() && this.magazineAmmo < weapon.magazineSize) {
            this.magazineAmmo = Math.min(weapon.magazineSize, this.magazineAmmo + (this.bossAIConfig.HEAT_DECAY_PER_SECOND || 10) * deltaTime);
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if (this.isEnemyReloading()) {
            this._updateVenting(deltaTime);
            return;
        }

        let target = this.manualTarget || this.autoTarget;
        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
        }

        if (!target) {
            this.minigunState = 'IDLE';
            this.aiState = 'GUARDING';
            if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                if (!this.isMoving && !this.isAtMoveGoal(this.guardPost.x, this.guardPost.y)) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        this.manualTarget = target;
        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = this.hasLineOfSightTo(target);
        const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);

        this.gunAimAngle = angleToTarget;
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        if (hasLOS && dist <= this.weapon.range) {
            this.isMoving = false;
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';
            this._updateMinigun(deltaTime, angleToTarget);
            return;
        }

        this.minigunState = 'IDLE';
        this.aiState = 'ENGAGING_CHASING';

        const needsChaseDestUpdate = this.timeSinceLastChaseDestUpdate >= this.CHASE_DESTINATION_REFRESH_INTERVAL ||
            (this.autoTarget && this.autoTarget.isAlive() && distance(this.autoTarget.x, this.autoTarget.y, this.lastKnownPlayerPosition?.x || 0, this.lastKnownPlayerPosition?.y || 0) ** 2 > this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ);

        if (needsChaseDestUpdate) {
            this.timeSinceLastChaseDestUpdate = 0;
            this.lastKnownPlayerPosition = { x: target.x, y: target.y };

            const predictionTime = this.bossAIConfig.CHASE_PREDICTION_TIME_FACTOR || 0.25;
            const targetVelX = target.currentVelocity ? target.currentVelocity.x : 0;
            const targetVelY = target.currentVelocity ? target.currentVelocity.y : 0;
            const predictedX = target.x + targetVelX * predictionTime;
            const predictedY = target.y + targetVelY * predictionTime;

            if (!this.isMoving || distance(this.worldTargetX, this.worldTargetY, predictedX, predictedY) > 20) {
                this.setMoveTarget(predictedX, predictedY);
            }
        }

        if (!this.isMoving && this.repathCooldown <= 0 && dist > (this.bossAIConfig.MIN_ENGAGEMENT_DISTANCE || 120)) {
            this.setMoveTarget(target.x, target.y);
        }
    }

    // Spin up (aims, no shots), then fire along streamAngle, which swings toward the target at
    // SWEEP_TURN_RATE instead of snapping to it.
    _updateMinigun(deltaTime, angleToTarget) {
        if (this.minigunState === 'IDLE') {
            this.minigunState = 'SPINNING_UP';
            this.spinUpTimer = this.bossAIConfig.SPIN_UP_TIME || 0.8;
            if (Math.random() < 0.3) this._bossCallout('SPIN_UP');
        }

        if (this.minigunState === 'SPINNING_UP') {
            this.streamAngle = angleToTarget;
            this.spinUpTimer -= deltaTime;
            if (this.spinUpTimer > 0) return;
            this.minigunState = 'FIRING';
        }

        let diff = angleToTarget - this.streamAngle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        const maxTurn = (this.bossAIConfig.SWEEP_TURN_RATE || 0.6) * deltaTime;
        this.streamAngle += Math.max(-maxTurn, Math.min(maxTurn, diff));

        if (this.actionTimer <= 0 && this.attackCooldown <= 0) {
            this._executeFire(this.streamAngle, deltaTime);
        }
    }

    _updateVenting(deltaTime) {
        this.isMoving = false;
        this.currentPath = [];
        this.aiState = 'VENTING';
        this.ventSparkTimer -= deltaTime;
        if (this.ventSparkTimer <= 0 && this.game) {
            this.ventSparkTimer = 0.15;
            const a = Math.random() * Math.PI * 2;
            this.game.addVisualEffect('spark', { x: this.x + Math.cos(a) * this.size * 0.6, y: this.y + Math.sin(a) * this.size * 0.6 });
        }
    }

    // Overheated (heat capacity = weapon magazineSize).
    onEnemyReloadStart() {
        this.minigunState = 'IDLE';
        this.isMoving = false;
        this.currentPath = [];
        this.ventSparkTimer = 0;
        this._bossCallout('OVERHEAT');
    }

    takeDamage(amount, attackerUnit = null, source = null) {
        if (!this.isAlive()) return;
        const cfg = this.bossAIConfig;
        if (this.isEnemyReloading()) {
            amount *= cfg.VENT_DAMAGE_TAKEN_MULT || 1.6;
        } else if (source instanceof Projectile && this._isFrontalHit(source)) {
            amount *= cfg.FRONT_ARMOR_DAMAGE_MULT !== undefined ? cfg.FRONT_ARMOR_DAMAGE_MULT : 0.3;
            if (this.game) this.game.addVisualEffect('spark', { x: source.x, y: source.y });
        }
        // Mid-stream he stays on his target instead of turning to whoever shot him — that's the flank.
        const committedTarget = this.minigunState !== 'IDLE' ? this.manualTarget : null;
        super.takeDamage(amount, attackerUnit, source);
        if (committedTarget && committedTarget.isAlive() && this.isAlive()) this.manualTarget = committedTarget;
    }

    // The bullet came from within the armored arc around his facing.
    _isFrontalHit(projectile) {
        const fromAngle = Math.atan2(-projectile.velocityY, -projectile.velocityX);
        let diff = fromAngle - this.facingAngle;
        diff = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
        return diff <= (this.bossAIConfig.FRONT_ARMOR_HALF_ARC || 1.2);
    }

    getStatusBar() {
        const weapon = this.weapon;
        if (this.isEnemyReloading()) {
            return this._setStatusBar(1 - this.enemyReloadTimer / this.enemyReloadDuration, '#ff7a1a', 'VENTING');
        }
        if (this.minigunState === 'SPINNING_UP') {
            return this._setStatusBar(1 - this.spinUpTimer / (this.bossAIConfig.SPIN_UP_TIME || 0.8), '#ffe08a', 'SPIN UP');
        }
        if (this.magazineWeapon && weapon && this.magazineAmmo < weapon.magazineSize) {
            const heat = 1 - this.magazineAmmo / weapon.magazineSize;
            return this._setStatusBar(heat, heat < 0.6 ? '#ffb347' : '#ff4d2e', '');
        }
        return null;
    }

    _executeFire(fireAngle, deltaTime) {
        if (!this.game || !this.weapon) return;
        const weapon = this.weapon;

        const accuracy = this.isMoving ? weapon.accuracyMoving : weapon.accuracyStationary;

        const muzzleOffset = this.size / 2 + 17;
        const muzzleX = this.x + Math.cos(fireAngle) * muzzleOffset;
        const muzzleY = this.y + Math.sin(fireAngle) * muzzleOffset;

        const projectile = this.game.getProjectileFromPool(
            muzzleX, muzzleY,
            this.x + Math.cos(fireAngle) * weapon.range,
            this.y + Math.sin(fireAngle) * weapon.range,
            weapon.damage,
            weapon.projectileSpeed,
            weapon.projectileColor,
            this,
            accuracy
        );
        this.game.addProjectile(projectile);

        if (weapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(weapon.sfxFireKey);
        }

        this.attackCooldown = 1 / weapon.rof;
        this._spendEnemyRound(weapon);
    }

    die() {
        super.die();
        if (this.game) {
            const explosionRadius = this.bossAIConfig.DEATH_EXPLOSION_RADIUS;
            if (explosionRadius > 0) {
                this.game.addVisualEffect('barrel_explosion', { x: this.x, y: this.y, radius: explosionRadius, shakeKey: 'BOSS_DEATH' });
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
    }
}
