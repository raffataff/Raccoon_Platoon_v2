// js/possumBoss3.js

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
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level);

        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        if (hasLOS && dist <= this.weapon.range) {
            this.isMoving = false;
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            if (this.actionTimer <= 0 && this.attackCooldown <= 0) {
                this._executeFire(target.x, target.y, deltaTime);
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

    _executeFire(targetX, targetY, deltaTime) {
        if (!this.game || !this.weapon) return;
        const weapon = this.weapon;

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        const fireAngle = this.gunAimAngle;
        const accuracy = this.isMoving ? weapon.accuracyMoving : weapon.accuracyStationary;

        const projectile = this.game.getProjectileFromPool(
            this.x, this.y,
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
    }

    die() {
        super.die();
        if (this.game) {
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
    }
}
