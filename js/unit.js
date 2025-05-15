// js/unit.js
class Unit {
    constructor(x, y, game, team, hp, speed, size, color, id) {
        this.x = x; this.y = y; this.game = game; this.team = team;
        this.id = id || `${team}-${Date.now().toString(36)+Math.random().toString(36).slice(2,5)}`;
        this.maxHp = hp; this.hp = hp; this.speed = speed; this.size = size; this.color = color;
        this.targetX = x; this.targetY = y; this.isMoving = false;
        this.canShootWhileMoving = true;
        this.weapon = null; this.autoTarget = null; this.manualTarget = null;
        this.stuckCheckPosition = { x: x, y: y }; this.stuckFrames = 0;
        this.STUCK_FRAMES_THRESHOLD = CONFIG.UNIT_STUCK_FRAMES_THRESHOLD || 30;
        this.attackCooldown = 0; this.actionTimer = 0; this.isMarkedForDeletion = false; this.facingAngle = 0;
        this.isContinuousFiring = false; this.continuousFireTargetPos = { x: 0, y: 0 }; this.continuousFireTargetEntity = null;
        if (this.team === 'enemy') { this.aiState = 'PATROLLING'; this.lastKnownPlayerPosition = null; this.alertedByAlly = false; }
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        let actionTimerFinishedThisFrame = false;
        if (this.actionTimer > 0) { this.actionTimer -= deltaTime; if (this.actionTimer <= 0) { this.actionTimer = 0; actionTimerFinishedThisFrame = true; } if (this.isMoving) this.isMoving = false; if(this.actionTimer > 0) return; }
        if (this.isMoving) { if (distance(this.x,this.y,this.stuckCheckPosition.x,this.stuckCheckPosition.y) < 0.5) { this.stuckFrames++; } else { this.stuckFrames = 0; this.stuckCheckPosition.x = this.x; this.stuckCheckPosition.y = this.y; } if (this.stuckFrames > this.STUCK_FRAMES_THRESHOLD) { this.isMoving = false; this.stuckFrames = 0; if (this.team === 'enemy' && typeof this.onStuck === 'function') this.onStuck(); }}
        else { this.stuckFrames = 0; this.stuckCheckPosition.x = this.x; this.stuckCheckPosition.y = this.y; }
        this._handleMovement(deltaTime);
        if (this.game && this.game.level && this.game.level.obstacles){ this._handleCombat(deltaTime, this.game.level.obstacles); }
        if (actionTimerFinishedThisFrame && this.game && this.game.ui && this.team === 'player') { this.game.ui.updateSquadPanel(); }
    }

    getCollisionShape() { return { type: 'circle', x: this.x, y: this.y, radius: this.size / 2 }; }

    _handleMovement(deltaTime) {
        if (!this.isMoving) return;
        const dx = this.targetX - this.x; const dy = this.targetY - this.y;
        const distToMovementTarget = distance(this.x, this.y, this.targetX, this.targetY);

        if (distToMovementTarget > 1.0) {
            const moveSpeed = this.speed * deltaTime;
            const moveAngle = Math.atan2(dy, dx);

            // Only update facing angle from movement if NOT aiming/targeting something specific
            if (!this.manualTarget && !this.isContinuousFiring && !(this instanceof Raccoon && this.isAimingGrenade) && !this.autoTarget) {
                this.facingAngle = moveAngle;
            }
            let nextX = this.x + Math.cos(moveAngle) * moveSpeed; let nextY = this.y + Math.sin(moveAngle) * moveSpeed;
            if (distToMovementTarget <= moveSpeed) { nextX = this.targetX; nextY = this.targetY; this.isMoving = false; }
            let collision = false; const activeObstacles = this.game && this.game.level && this.game.level.obstacles ? this.game.level.obstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement) : [];
            const unitFutureShape = { type: 'circle', x: nextX, y: nextY, radius: this.size / 2 };
            for (const obs of activeObstacles) { const obsCS = this.game.level._getObstacleCollisionShape(obs); let currentCollision = false; if (unitFutureShape.type === 'circle' && obsCS.type === 'circle') { currentCollision = circleOverlap(unitFutureShape, obsCS); } else if (unitFutureShape.type === 'circle' && obsCS.type === 'rectangle') { currentCollision = rectCircleOverlap(obsCS, unitFutureShape); } if (currentCollision) { collision = true; break; }}
            if (!collision) { this.x = nextX; this.y = nextY; }
            else {
                let slid = false; const unitFutureXShape = { ...unitFutureShape, y: this.y }; let tempCollisionX = false;
                for (const obs of activeObstacles) { const obsCS = this.game.level._getObstacleCollisionShape(obs); if ((unitFutureXShape.type==='circle'&&obsCS.type==='circle'&&circleOverlap(unitFutureXShape,obsCS))||(unitFutureXShape.type==='circle'&&obsCS.type==='rectangle'&&rectCircleOverlap(obsCS,unitFutureXShape))) { tempCollisionX=true; break;}}
                if (!tempCollisionX) { this.x = nextX; slid = true; }
                const unitFutureYShape = { ...unitFutureShape, x: this.x }; let tempCollisionY = false;
                for (const obs of activeObstacles) { const obsCS = this.game.level._getObstacleCollisionShape(obs); if ((unitFutureYShape.type==='circle'&&obsCS.type==='circle'&&circleOverlap(unitFutureYShape,obsCS))||(unitFutureYShape.type==='circle'&&obsCS.type==='rectangle'&&rectCircleOverlap(obsCS,unitFutureYShape))) { tempCollisionY=true; break;}}
                if (!tempCollisionY) { this.y = nextY; slid = true; }
                if (!slid) { this.isMoving = false; }
            }
            const worldW = CONFIG.WORLD_WIDTH || 0; const worldH = CONFIG.WORLD_HEIGHT || 0;
            this.x = Math.max(this.size/2, Math.min(this.x, worldW - this.size/2)); this.y = Math.max(this.size/2, Math.min(this.y, worldH - this.size/2));
        } else { this.isMoving = false; this.x = this.targetX; this.y = this.targetY; }
    }

    setContinuousFire(isFiring, targetX, targetY) {
        this.isContinuousFiring = isFiring;
        if (isFiring) {
            this.manualTarget = null; this.autoTarget = null;
            // DO NOT set this.isMoving = false; here if we want to shoot while moving.
            // Movement will be controlled by player's right-click commands.
            // Firing logic will just check if it CAN fire from current position/state.

            this.continuousFireTargetEntity = null;
            const potentialTargets = (this.team === 'player') ? this.game.enemyUnits : this.game.deployedSquadRoster;
            if(potentialTargets && targetX !== undefined && targetY !== undefined) {
                for (const enemy of potentialTargets) { if (enemy.isAlive() && distance(targetX, targetY, enemy.x, enemy.y) < enemy.size + 7) { this.continuousFireTargetEntity = enemy; break; }}} // Increased radius to lock
            if (this.continuousFireTargetEntity) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
            else if (targetX !== undefined && targetY !== undefined) { this.continuousFireTargetPos = { x: targetX, y: targetY }; }
            else { this.continuousFireTargetPos = { x: this.x + Math.cos(this.facingAngle) * 100, y: this.y + Math.sin(this.facingAngle) * 100 }; }
            this.facingAngle = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
        } else {
            this.continuousFireTargetEntity = null;
        }
    }

    updateContinuousFireTarget(targetX, targetY) {
        if (!this.isContinuousFiring) return;
        if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
        else { this.continuousFireTargetEntity = null; this.continuousFireTargetPos = { x: targetX, y: targetY }; }
        this.facingAngle = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
    }

    _handleCombat(deltaTime, obstacles) {
        if ((this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;
        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; if (this.attackCooldown < 0) this.attackCooldown = 0; }
        let targetToShoot = null; let fireAtX, fireAtY;
        if (this.isContinuousFiring) {
            if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) { targetToShoot = this.continuousFireTargetEntity; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y; }
            else if (this.continuousFireTargetEntity && !this.continuousFireTargetEntity.isAlive()){ this.setContinuousFire(false); return; }
            else { fireAtX = this.continuousFireTargetPos.x; fireAtY = this.continuousFireTargetPos.y; }
            this.facingAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
        } else if (this.manualTarget && this.manualTarget.isAlive()) {
            targetToShoot = this.manualTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y; this.facingAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
        } else {
            if (this.manualTarget) this.manualTarget = null;
            const potentialTargets = (this.team === 'player') ? this.game.enemyUnits : this.game.deployedSquadRoster;
            this.findAutoTarget(potentialTargets, obstacles);
            if (this.autoTarget) { targetToShoot = this.autoTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y; if (!this.isMoving) this.facingAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x); }
            else { return; }
        }
        if (fireAtX === undefined || fireAtY === undefined) return;
        if ((targetToShoot || this.isContinuousFiring) && this.attackCooldown <= 0) {
            const distToTargetPoint = distance(this.x, this.y, fireAtX, fireAtY);
            if (distToTargetPoint <= this.weapon.range) {
                let hasLOS = true; const activeObstacles = obstacles ? obstacles.filter(o => !o.isDestroyed && o.providesCover) : [];
                if (targetToShoot && targetToShoot.team && targetToShoot.team !== 'neutral_object') { hasLOS = hasLineOfSight(this.x, this.y, fireAtX, fireAtY, activeObstacles, this.game.level); }
                if (hasLOS) { this.facingAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x); this._executeFire(fireAtX, fireAtY); }
                else { if (targetToShoot === this.autoTarget) this.autoTarget = null; if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.continuousFireTargetEntity = null; }
            } else { if (targetToShoot === this.autoTarget) this.autoTarget = null; if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.setContinuousFire(false); }
        } else if (targetToShoot && targetToShoot.isAlive()) { if (this.manualTarget === targetToShoot || (this.autoTarget === targetToShoot && !this.isMoving)) { this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x); }}
    }


    findAutoTarget(potentialTargets, obstacles) {
        let closestTarget = null;
        let minDistanceSq = (this.weapon ? this.weapon.range : (this.detectionRange || 150)) ** 2;

        if (!potentialTargets || !Array.isArray(potentialTargets)) {
            this.autoTarget = null; return;
        }

        const activeObstacles = Array.isArray(obstacles) ? obstacles.filter(o => !o.isDestroyed && o.providesCover) : [];

        potentialTargets.forEach(target => {
            if (target && target.isAlive() && target.team !== this.team) { // Ensure target exists, is alive, and not friendly
                const dx = target.x - this.x; const dy = target.y - this.y;
                const dSq = dx*dx + dy*dy;
                if (dSq <= minDistanceSq) { // If within weapon range (squared)
                    // Check Line of Sight
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, activeObstacles, this.game.level)) {
                        if (!closestTarget || dSq < minDistanceSq) { // If this is the first valid target or closer than previous
                           closestTarget = target;
                           minDistanceSq = dSq;
                        }
                    }
                }
            }
        });
        this.autoTarget = closestTarget;
    }

    fireAt(targetEntity) { // This is called by AI or could be a specific player command later
        if (this.isContinuousFiring) this.setContinuousFire(false); // Stop continuous if specific target chosen
        this._executeFire(targetEntity.x, targetEntity.y);
    }

    _executeFire(pointX, pointY) {
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) return;
        // NEW: Check if allowed to shoot while moving
        if (this.isMoving && !this.canShootWhileMoving) {
            return; // Cannot shoot if moving and weapon/unit type doesn't allow it
        }

        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) { baseAccuracy += this.accuracyBonus; }
        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy));

        const projectile = new Projectile(this.x, this.y, pointX, pointY, this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this.game, this, effectiveAccuracy);
        this.game.addProjectile(projectile);
        this.attackCooldown = 1 / this.weapon.rof;
    }


    fireAtPoint(pointX, pointY) { // This is for Shift+TAP single volley
        if (this.isContinuousFiring) this.setContinuousFire(false);
        this._executeFire(pointX, pointY);
        this.manualTarget = null; this.autoTarget = null; // Shift+Tap clears targets
    }

    takeDamage(amount, attackerUnit = null) {
        if (!this.isAlive()) return;
        const prevHp = this.hp;
        this.hp -= amount;
        let died = false;

        if (this.hp <= 0) {
            this.hp = 0; died = true;
            if (attackerUnit && attackerUnit.team === 'player' && typeof attackerUnit.addXp === 'function') {
                let killXp = CONFIG.XP_PER_KILL || 10; // Default from config
                if (this instanceof PossumHeavy) killXp += (CONFIG.XP_FOR_HEAVY_KILL || 15); // Bonus from config
                attackerUnit.addXp(killXp);
                if (typeof attackerUnit.incrementKillCount === 'function') attackerUnit.incrementKillCount();
            }
            this.die();
        }

        if (!died && this.team === 'enemy' && attackerUnit && attackerUnit.team === 'player') {
            const initialAiState = this.aiState;
            if (this.aiState !== 'ENGAGING' && this.aiState !== 'ENGAGING_HEAVY') {
                const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.providesCover);
                const hasLOSToAttacker = hasLineOfSight(this.x, this.y, attackerUnit.x, attackerUnit.y, activeObstacles, this.game.level);
                if (hasLOSToAttacker) {
                    this.manualTarget = attackerUnit;
                    this.aiState = (this instanceof PossumHeavy) ? 'ENGAGING_HEAVY' : 'ENGAGING';
                    this.lastKnownPlayerPosition = null;
                } else if (Math.random() < (CONFIG.ENEMY_INVESTIGATE_ATTACK_CHANCE || 0.85)) {
                    this.lastKnownPlayerPosition = { x: attackerUnit.x, y: attackerUnit.y };
                    if (this.aiState === 'PATROLLING' || this.aiState === 'GUARDING') {
                        this.aiState = 'SUSPICIOUS';
                    }
                }
            }
            const alertDmgThreshold = this.maxHp * (CONFIG.ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT || 0.20);
            if ( (this.aiState !== initialAiState && (this.aiState === 'ENGAGING' || this.aiState === 'ENGAGING_HEAVY' || this.aiState === 'SUSPICIOUS')) ||
                 (amount >= alertDmgThreshold) || (prevHp === this.maxHp && amount > 0) ) {
                 this.propagateAlert(attackerUnit);
            }
        }
        if (!died && this.game && this.game.ui && this.team === 'player') {
             this.game.ui.updateSquadPanel();
        }
    }

    propagateAlert(sourceOfAlertUnit = null) {
        if (!this.isAlive() || this.team !== 'enemy' || !this.game || !this.game.enemyUnits) return;
        this.game.enemyUnits.forEach(otherEnemy => {
            if (otherEnemy && otherEnemy.isAlive() && otherEnemy !== this &&
                (otherEnemy.aiState === 'PATROLLING' || otherEnemy.aiState === 'GUARDING')) {
                const distToOtherEnemy = distance(this.x, this.y, otherEnemy.x, otherEnemy.y);
                if (distToOtherEnemy <= (CONFIG.ENEMY_ALERT_PROPAGATION_RADIUS || 180)) {
                    otherEnemy.alertedByAlly = true;
                    otherEnemy.aiState = 'SUSPICIOUS';
                    if (sourceOfAlertUnit && sourceOfAlertUnit.isAlive()) {
                        otherEnemy.lastKnownPlayerPosition = { x: sourceOfAlertUnit.x, y: sourceOfAlertUnit.y };
                        const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.providesCover);
                        if (hasLineOfSight(otherEnemy.x, otherEnemy.y, sourceOfAlertUnit.x, sourceOfAlertUnit.y, activeObstacles, this.game.level)) {
                            otherEnemy.manualTarget = sourceOfAlertUnit;
                            otherEnemy.aiState = (otherEnemy instanceof PossumHeavy) ? 'ENGAGING_HEAVY' : 'ENGAGING';
                        }
                    } else {
                        otherEnemy.lastKnownPlayerPosition = { x: this.x, y: this.y };
                    }
                }
            }
        });
    }

    die() {
        this.manualTarget = null; this.autoTarget = null; this.isMoving = false;
        const wasSelected = this.game && this.game.selectedUnits.includes(this);
        if (this instanceof Raccoon && this.isAimingGrenade) this.cancelGrenadeAim();
        if (this.game && this.game.selectedUnits.includes(this)) {
            this.game.selectedUnits = this.game.selectedUnits.filter(unit => unit !== this);
        }
        if (this.team === 'player' && this.game && typeof this.game.recordRaccoonFallen === 'function') {
            this.game.recordRaccoonFallen(this);
        }
        if (wasSelected && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }

    isAlive() { return this.hp > 0; }

    render(ctx) {
        const kiaStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.KIA_STYLE;
        const facingIndicatorStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.FACING_INDICATOR;
        const healthBarStyle = CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Unit Body
        if (!this.isAlive()) {
            ctx.fillStyle = this.team === 'player' ?
                            (kiaStyle && kiaStyle.PLAYER_FILL_COLOR || 'darkgrey') :
                            (kiaStyle && kiaStyle.ENEMY_FILL_COLOR || '#555');
            ctx.globalAlpha = (kiaStyle && kiaStyle.OPACITY !== undefined) ? kiaStyle.OPACITY : 0.6;
        } else {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 1.0;
        }
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha

        // Facing Indicator
        if (this.isAlive() && facingIndicatorStyle) {
            ctx.strokeStyle = facingIndicatorStyle.COLOR || 'black';
            ctx.lineWidth = facingIndicatorStyle.LINE_WIDTH || 2;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(this.size * Math.cos(this.facingAngle), this.size * Math.sin(this.facingAngle));
            ctx.stroke();
        }
        ctx.restore(); // Restore from unit translation

        // Health Bar (drawn in world space, not translated with unit)
        if (this.isAlive() && healthBarStyle) {
            const barWidth = this.size * (healthBarStyle.WIDTH_MULTIPLIER || 1.5);
            const barHeight = healthBarStyle.HEIGHT || 4;
            const barX = this.x - barWidth / 2;
            // Y-offset calculation: unit top edge (this.y - this.size) minus bar height, minus additional offset
            const barY = this.y - this.size - barHeight + (healthBarStyle.Y_OFFSET_BASE || -5);

            ctx.fillStyle = healthBarStyle.BG_COLOR || '#333';
            ctx.fillRect(barX -1, barY -1, barWidth + 2, barHeight + 2); // BG border

            const currentHealthWidth = Math.max(0, (this.hp / this.maxHp) * barWidth);
            let hpColor = healthBarStyle.HP_COLOR_FULL || '#00CC00';
            const hpRatio = this.hp / this.maxHp;
            if (hpRatio < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3)) {
                hpColor = healthBarStyle.HP_COLOR_LOW || '#CC0000';
            } else if (hpRatio < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) {
                hpColor = healthBarStyle.HP_COLOR_MEDIUM || '#CCCC00';
            }
            ctx.fillStyle = hpColor;
            ctx.fillRect(barX, barY, currentHealthWidth, barHeight);
        }
    }

    setMoveTarget(x, y) { if (this.isContinuousFiring) this.setContinuousFire(false); this.targetX = x; this.targetY = y; this.isMoving = true; this.autoTarget = null; this.stuckFrames = 0; }
    setManualTarget(target) { if (this.isContinuousFiring) this.setContinuousFire(false); this.manualTarget = target; this.autoTarget = null; this.stuckFrames = 0; if (target && target.isAlive()) { this.isMoving = false; this.targetX = this.x; this.targetY = this.y; this.facingAngle = Math.atan2(target.y - this.y, target.x - this.x); }}
}