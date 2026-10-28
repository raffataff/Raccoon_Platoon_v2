// "Overmind": rail gun shots from a capacitor (weapon magazine; recharge = reload), plus the rail
// lance — a telegraphed beam along a targeting line that hits every raccoon on it. Step off the
// line or get behind hard cover; an arc-grenade stun cancels the charge.
// Tuning: CONFIG.AI.POSSUM_BOSS_4.LANCE and WEAPON_DEFINITIONS.POSSUM_BOSS_4_WEAPON.
class PossumBoss4 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy',
              CONFIG.POSSUM_BOSS_4_HP,
              CONFIG.POSSUM_BOSS_4_SPEED,
              CONFIG.POSSUM_BOSS_4_SIZE,
              CONFIG.POSSUM_BOSS_4_COLOR,
              id || `BOSS4-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_BOSS_4_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_BOSS_4_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_BOSS_4_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_BOSS_4_DEAD_SPRITE_SCALE';

        this.hovers = true;

        this.weaponName = CONFIG.POSSUM_BOSS_4_DEFAULT_WEAPON || 'POSSUM_BOSS_4_WEAPON';
        this.canShootWhileMoving = true;

        this.bossAIConfig = CONFIG.AI.POSSUM_BOSS_4 || {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || 600;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        this.actionTimer = 0;
        this.reloadLabel = 'RECHARGING';
        this.xpValue = CONFIG.XP_FOR_BOSS_4_KILL || 300;

        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 0.8;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.bossAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.4;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2;
        this.timeSinceLastChaseDestUpdate = 0;

        // Rail lance.
        this.lanceConfig = this.bossAIConfig.LANCE || { ENABLED: false };
        this.lanceCooldownTimer = this.lanceConfig.FIRST_DELAY || 3.0;
        this.isChargingLance = false;
        this.lanceTimer = 0;
        this.lanceAngle = 0;
        this.lanceTarget = null;
        this.lanceEffect = null;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.lanceCooldownTimer > 0 && this.aiState !== 'GUARDING') {
            this.lanceCooldownTimer -= deltaTime;
        }
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if (this.isChargingLance) {
            this._updateLance(deltaTime);
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
                if (!this.isMoving && !this.isAtMoveGoal(this.guardPost.x, this.guardPost.y)) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
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

        if (hasLOS && dist <= this.weapon.range) {
            this.isMoving = false;
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            if (this.actionTimer <= 0 && this.attackCooldown <= 0 && !this.isEnemyReloading()) {
                if (this.lanceConfig.ENABLED && this.lanceCooldownTimer <= 0 && dist > 150) {
                    this._startLance(target);
                } else {
                    this._executeFire(target.x, target.y, deltaTime);
                }
            }
            return;
        }

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

    _startLance(target) {
        this.isChargingLance = true;
        this.lanceTimer = 0;
        this.lanceTarget = target;
        this.lanceAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.isMoving = false;
        this.currentPath = [];
        this.lanceEffect = new RailLanceEffect(this);
        this._updateLanceLine();
        this.game.addVisualEffect(this.lanceEffect);
        if (Math.random() < 0.5) this._bossCallout('LANCE');
    }

    // Charge: the line swings toward the target at TRACK_RATE, then holds still for LOCK_TIME and fires.
    _updateLance(deltaTime) {
        const cfg = this.lanceConfig;
        // Stunned mid-charge (arc grenade): the charge fizzles.
        if (this.actionTimer > 0) {
            this._endLance(cfg.COOLDOWN * 0.5);
            return;
        }
        this.isMoving = false;
        this.currentPath = [];
        this.aiState = 'CHARGING_LANCE';
        this.lanceTimer += deltaTime;

        const lockAt = cfg.CHARGE_TIME - cfg.LOCK_TIME;
        const target = this.lanceTarget;
        if (this.lanceTimer < lockAt && target && target.isAlive()) {
            let diff = Math.atan2(target.y - this.y, target.x - this.x) - this.lanceAngle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            const maxTurn = cfg.TRACK_RATE * deltaTime;
            this.lanceAngle += Math.max(-maxTurn, Math.min(maxTurn, diff));
        }
        this.gunAimAngle = this.lanceAngle;
        this.facingAngle = lerpAngle(this.facingAngle, this.lanceAngle, this.turnRate * deltaTime);

        this.lanceEffect.charge = Math.min(1, this.lanceTimer / cfg.CHARGE_TIME);
        this.lanceEffect.locked = this.lanceTimer >= lockAt;
        this._updateLanceLine();

        if (this.lanceTimer >= cfg.CHARGE_TIME) this._fireLance();
    }

    // The line runs to RANGE or to the first obstacle that blocks line of sight.
    _updateLanceLine() {
        const range = this.lanceConfig.RANGE || 900;
        const dx = Math.cos(this.lanceAngle), dy = Math.sin(this.lanceAngle);
        const level = this.game.level;
        const obstacles = level.activeObstacles;
        let reach = range;
        if (!hasLineOfSight(this.x, this.y, this.x + dx * range, this.y + dy * range, obstacles, level)) {
            let lo = 0, hi = range;
            for (let i = 0; i < 7; i++) {
                const mid = (lo + hi) * 0.5;
                if (hasLineOfSight(this.x, this.y, this.x + dx * mid, this.y + dy * mid, obstacles, level)) lo = mid;
                else hi = mid;
            }
            reach = lo;
        }
        this.lanceEffect.setLine(this.x, this.y, this.x + dx * reach, this.y + dy * reach);
    }

    _fireLance() {
        const cfg = this.lanceConfig;
        const e = this.lanceEffect;
        const halfWidth = cfg.HALF_WIDTH || 12;
        const raccoons = this.game.getLivingPlayerControlledUnits();
        // Collect first: a kill can change the shared list.
        const hits = [];
        for (let i = 0; i < raccoons.length; i++) {
            const r = raccoons[i];
            if (pointToSegmentDist(r.x, r.y, e.x1, e.y1, e.x2, e.y2) <= halfWidth + r.size / 2) hits.push(r);
        }
        for (let i = 0; i < hits.length; i++) hits[i].takeDamage(cfg.DAMAGE, this);

        e.fire();
        const weapon = this.weapon;
        const muzzleX = this.x + Math.cos(this.lanceAngle) * (this.size / 2 + 17);
        const muzzleY = this.y + Math.sin(this.lanceAngle) * (this.size / 2 + 17);
        this.game.addVisualEffect('muzzle_flash', { x: muzzleX, y: muzzleY, scale: (weapon && weapon.muzzleFlashScale || 1) * 1.5 });
        if (weapon && weapon.sfxFireKey && this.game.audioManager) this.game.audioManager.play(weapon.sfxFireKey);
        this.game.addScreenShake(0.3, this.x, this.y);

        this.lanceEffect = null;
        this._endLance(cfg.COOLDOWN);
        this.attackCooldown = 0.6;
    }

    _endLance(cooldown) {
        if (this.lanceEffect) this.lanceEffect.isMarkedForDeletion = true;
        this.lanceEffect = null;
        this.isChargingLance = false;
        this.lanceTarget = null;
        this.lanceCooldownTimer = cooldown;
    }

    getStatusBar() {
        if (this.isChargingLance) {
            const cfg = this.lanceConfig;
            const locked = this.lanceTimer >= cfg.CHARGE_TIME - cfg.LOCK_TIME;
            return this._setStatusBar(this.lanceTimer / cfg.CHARGE_TIME, `rgb(${CONFIG.VISUAL_EFFECTS.BOSS_TELEGRAPHS.LANCE_LOCK_COLOR})`, locked ? 'LOCKED' : 'CHARGING');
        }
        return super.getStatusBar();
    }

    _executeFire(targetX, targetY, deltaTime) {
        if (!this.game || !this.weapon) return;
        const weapon = this.weapon;

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        const fireAngle = this.gunAimAngle;
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
        this._endLance(0);
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
