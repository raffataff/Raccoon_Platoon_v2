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
        // Each weapon fires until its magazine is empty, reloads (Unit._spendEnemyRound), then he swaps.
        this.attackMode = 'GRENADE_VOLLEY';
        this.reloadLabel = 'RELOADING';

        // Reinforcement flare (CONFIG.AI.POSSUM_BOSS_1.FLARE).
        this.flareConfig = this.bossAIConfig.FLARE || { ENABLED: false };
        this.nextFlareIndex = 0;
        this.flareWindupTimer = 0;

        this.guardPost = { x: x, y: y };

        // Use actionTimer for major cooldowns, attackCooldown for rate-of-fire.
        this.actionTimer = 0;

        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 250;

        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.bossAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.PATHFINDING.GRID_CELL_SIZE) ** 2;
        this.timeSinceLastChaseDestUpdate = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.targetAcquisitionTimer > 0) {
            this.targetAcquisitionTimer -= deltaTime;
        }
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if (this._updateFlare(deltaTime)) return;

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
                if (!this.isMoving && !this.isAtMoveGoal(this.guardPost.x, this.guardPost.y)) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        // We have a target, lock on and evaluate
        this.manualTarget = target;
        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = this.hasLineOfSightTo(target);
        const currentWeapon = this.weapon;

        // AIM: Always aim if there is a target
        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        // SHOOT: Check if we can shoot
        if (hasLOS && dist <= currentWeapon.range) {
            this.isMoving = false; // Stop moving if in range and LOS
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            if (this.actionTimer <= 0 && this.attackCooldown <= 0 && !this.isEnemyReloading()) {
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

    // Reinforcement flare: when HP drops past the next threshold he plants, winds up (no shooting),
    // then fires a flare and a squad spawns out of sight around him. Returns true while winding up.
    _updateFlare(deltaTime) {
        const cfg = this.flareConfig;
        if (!cfg.ENABLED) return false;

        if (this.flareWindupTimer > 0) {
            this.isMoving = false;
            this.currentPath = [];
            this.aiState = 'CALLING_REINFORCEMENTS';
            const target = this.manualTarget;
            if (target && target.isAlive()) {
                this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
                this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);
            }
            this.flareWindupTimer -= deltaTime;
            if (this.flareWindupTimer <= 0) {
                this.flareWindupTimer = 0;
                this._fireFlare();
            }
            return true;
        }

        const thresholds = cfg.HP_THRESHOLDS || [];
        if (this.nextFlareIndex >= thresholds.length || this.hp > this.maxHp * thresholds[this.nextFlareIndex]) return false;
        // One flare even if a big hit skipped several thresholds.
        while (this.nextFlareIndex < thresholds.length && this.hp <= this.maxHp * thresholds[this.nextFlareIndex]) this.nextFlareIndex++;
        this.flareWindupTimer = cfg.WINDUP || 1.4;
        this.isMoving = false;
        this.currentPath = [];
        this._bossCallout('FLARE');
        return true;
    }

    _fireFlare() {
        if (!this.game) return;
        this.game.addVisualEffect('flare', { x: this.x, y: this.y });
        const launcher = WEAPONS[this.primaryWeaponName];
        if (launcher && launcher.sfxFireKey && this.game.audioManager) this.game.audioManager.play(launcher.sfxFireKey);
        this._spawnReinforcements();
    }

    _spawnReinforcements() {
        const cfg = this.flareConfig;
        const game = this.game;
        const level = game.level;
        const rng = level && level.rng;
        if (!rng || !level.getNavigationGrid()) return;

        const range = cfg.COUNT_RANGE || [3, 4];
        const phaseBonus = Math.floor((game.currentPhaseIndex || 0) * (cfg.COUNT_PER_PHASE_BONUS || 0));
        const count = Math.min(cfg.MAX_COUNT || 7, rng.nextInt(range[0], range[1]) + phaseBonus);

        const raccoons = game.getLivingPlayerControlledUnits();
        const minRaccoonDistSq = (cfg.MIN_DISTANCE_FROM_RACCOONS || 380) ** 2;
        const zoom = game.cameraZoom || 1;
        const viewW = game.viewWidth / zoom, viewH = game.viewHeight / zoom;
        const target = this.manualTarget && this.manualTarget.isAlive() ? this.manualTarget : null;
        const rushX = target ? target.x : this.x, rushY = target ? target.y : this.y;
        const attempts = 14;

        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < attempts; attempt++) {
                const angle = rng.nextFloat(0, Math.PI * 2);
                const dist = rng.nextFloat(cfg.SPAWN_DISTANCE_MIN || 450, cfg.SPAWN_DISTANCE_MAX || 700);
                const p = game.snapToWalkableCell(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist);
                if (!this._isWalkable(p.x, p.y)) continue;

                let tooClose = false;
                for (let r = 0; r < raccoons.length; r++) {
                    if (distanceSq(p.x, p.y, raccoons[r].x, raccoons[r].y) < minRaccoonDistSq) { tooClose = true; break; }
                }
                if (tooClose) continue;

                // Prefer arriving from off-screen; the last few attempts accept anything valid.
                const onScreen = p.x > game.cameraX && p.x < game.cameraX + viewW && p.y > game.cameraY && p.y < game.cameraY + viewH;
                if (onScreen && attempt < attempts - 4) continue;

                const unitType = this._pickReinforcementType(rng);
                const unit = game.spawnEnemyAtLocation(p.x, p.y, unitType, rushX + rng.nextFloat(-60, 60), rushY + rng.nextFloat(-60, 60));
                if (unit && target) {
                    unit.alertedByAlly = true;
                    unit.manualTarget = target;
                    unit.lastKnownPlayerPosition = { x: target.x, y: target.y };
                }
                break;
            }
        }
    }

    _isWalkable(x, y) {
        const level = this.game.level;
        const navGrid = level.getNavigationGrid();
        const g = level.worldToGridCoords(x, y);
        return g.y >= 0 && g.y < navGrid.length && g.x >= 0 && g.x < navGrid[0].length && navGrid[g.y][g.x] === 0;
    }

    _pickReinforcementType(rng) {
        const pool = this.flareConfig.UNIT_POOL || [];
        let total = 0;
        for (let i = 0; i < pool.length; i++) total += pool[i].weight;
        let roll = rng.nextFloat(0, total);
        for (let i = 0; i < pool.length; i++) {
            roll -= pool[i].weight;
            if (roll <= 0) return pool[i].type;
        }
        return pool.length ? pool[pool.length - 1].type : 'possum_grunt';
    }

    // Magazine empty and reloaded: swap to the other weapon.
    onEnemyReloadEnd() {
        if (this.attackMode === 'GRENADE_VOLLEY') {
            this.attackMode = 'MG_BURST';
            this.weaponName = this.secondaryWeaponName;
        } else {
            this.attackMode = 'GRENADE_VOLLEY';
            this.weaponName = this.primaryWeaponName;
        }
    }

    getStatusBar() {
        if (this.flareWindupTimer > 0) {
            const windup = this.flareConfig.WINDUP || 1.4;
            return this._setStatusBar(1 - this.flareWindupTimer / windup, `rgb(${CONFIG.VISUAL_EFFECTS.BOSS_TELEGRAPHS.FLARE_COLOR})`, 'FLARE');
        }
        return super.getStatusBar();
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

        this.attackCooldown = this.bossAIConfig.GRENADE_COOLDOWN_BETWEEN_SHOTS || 0.6;
        this._spendEnemyRound(primaryWeapon);
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
        this._spendEnemyRound(secondaryWeapon);
    }

    die() {
        super.die();
        if(this.game) {
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
//        console.log(`PossumBoss1 ${this.id} has been defeated!`);
    }
}
