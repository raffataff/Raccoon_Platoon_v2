// js/unit.js
class Unit {
    constructor(x, y, game, team, hp, speed, size, color, id) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.team = team;
        this.id = id || `${team}-${Date.now().toString(36)+Math.random().toString(36).slice(2,5)}`;

        this.maxHp = hp;
        this.hp = hp;

        this.speed = speed;
        this.size = size;
        this.color = color;

        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;

        this.weapon = null;
        this.autoTarget = null;
        this.manualTarget = null;

        this.stuckCheckPosition = { x: x, y: y };
        this.stuckFrames = 0;
        this.STUCK_FRAMES_THRESHOLD = CONFIG.UNIT_STUCK_FRAMES_THRESHOLD || 30; // From CONFIG

        this.attackCooldown = 0;
        this.actionTimer = 0;
        this.isMarkedForDeletion = false;
        this.facingAngle = 0;

        if (this.team === 'enemy') {
            this.aiState = 'PATROLLING';
            this.lastKnownPlayerPosition = null;
            this.alertedByAlly = false;
        }
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        let actionTimerFinishedThisFrame = false;
        if (this.actionTimer > 0) {
            const prevTimer = this.actionTimer;
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                 this.actionTimer = 0;
                 actionTimerFinishedThisFrame = true;
            }
            if (this.isMoving) this.isMoving = false; // Stop movement if busy
            if(this.actionTimer > 0) return; // Don't do other updates if still busy
        }

        // Stuck Check
        if (this.isMoving) {
            if (distance(this.x, this.y, this.stuckCheckPosition.x, this.stuckCheckPosition.y) < 0.5) {
                this.stuckFrames++;
            } else {
                this.stuckFrames = 0;
                this.stuckCheckPosition.x = this.x;
                this.stuckCheckPosition.y = this.y;
            }
            if (this.stuckFrames > this.STUCK_FRAMES_THRESHOLD) {
                this.isMoving = false;
                this.stuckFrames = 0;
                if (this.team === 'enemy' && typeof this.onStuck === 'function') {
                    this.onStuck();
                }
            }
        } else { // Not moving, reset stuck frames
            this.stuckFrames = 0;
            this.stuckCheckPosition.x = this.x;
            this.stuckCheckPosition.y = this.y;
        }

        this._handleMovement(deltaTime);
        if (this.game && this.game.level && this.game.level.obstacles){ // Ensure obstacles exist
            this._handleCombat(deltaTime, this.game.level.obstacles);
        }

        // Update UI if player unit's action timer just finished
        if (actionTimerFinishedThisFrame && this.game && this.game.ui && this.team === 'player') {
            this.game.ui.updateSquadPanel();
        }
    }

    _handleMovement(deltaTime) {
        if (!this.isMoving) return;
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distToMovementTarget = distance(this.x, this.y, this.targetX, this.targetY);

        if (distToMovementTarget > 1.0) { // Only move if not already at target
            const moveSpeed = this.speed * deltaTime;
            const moveAngle = Math.atan2(dy, dx);
            if (!this.manualTarget) { // Only face movement if no manual target
                this.facingAngle = moveAngle;
            }

            let nextX = this.x + Math.cos(moveAngle) * moveSpeed;
            let nextY = this.y + Math.sin(moveAngle) * moveSpeed;

            // If we would overshoot, snap to target
            if (distToMovementTarget <= moveSpeed) {
                nextX = this.targetX;
                nextY = this.targetY;
                this.isMoving = false;
            }

            // Collision detection
            let collision = false;
            const activeObstacles = this.game && this.game.level && this.game.level.obstacles ?
                                    this.game.level.obstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement) :
                                    [];
            for (const obs of activeObstacles) {
                if (nextX + this.size > obs.x && nextX - this.size < obs.x + obs.width &&
                    nextY + this.size > obs.y && nextY - this.size < obs.y + obs.height) {
                    collision = true; break;
                }
            }
            if (!collision) {
                this.x = nextX; this.y = nextY;
            } else { // Attempt to slide
                let slid = false;
                 // Try X movement only
                 let tempCollisionX = false;
                 for (const obs of activeObstacles) {
                     if (nextX + this.size > obs.x && nextX - this.size < obs.x + obs.width &&
                         this.y + this.size > obs.y && this.y - this.size < obs.y + obs.height) {
                         tempCollisionX = true; break;
                     }
                 }
                 if (!tempCollisionX) { this.x = nextX; slid = true; }

                 // Try Y movement only
                 let tempCollisionY = false;
                 for (const obs of activeObstacles) {
                    if (this.x + this.size > obs.x && this.x - this.size < obs.x + obs.width &&
                        nextY + this.size > obs.y && nextY - this.size < obs.y + obs.height) {
                        tempCollisionY = true; break;
                    }
                 }
                 if (!tempCollisionY) { this.y = nextY; slid = true; }

                 if (!slid) { this.isMoving = false; } // Stop if couldn't slide
            }
            // Clamp to world boundaries
            this.x = Math.max(this.size, Math.min(this.x, (CONFIG.WORLD_WIDTH || this.game.canvas.width) - this.size));
            this.y = Math.max(this.size, Math.min(this.y, (CONFIG.WORLD_HEIGHT || this.game.canvas.height) - this.size));
        } else { // Already at target
            this.isMoving = false; this.x = this.targetX; this.y = this.targetY;
        }
    }

    _handleCombat(deltaTime, obstacles) {
        if ((this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }

        let targetToShoot = null;
        // Prioritize manual target
        if (this.manualTarget && typeof this.manualTarget.isAlive === 'function' && this.manualTarget.isAlive()) {
            targetToShoot = this.manualTarget;
            // Always face manual target when actively targeting
            this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
        } else {
            if (this.manualTarget) this.manualTarget = null; // Clear if dead or invalid
            // Find auto target if no manual one
            const potentialTargets = (this.team === 'player') ? this.game.enemyUnits : this.game.deployedSquadRoster;
            this.findAutoTarget(potentialTargets, obstacles);
            targetToShoot = this.autoTarget;
        }

        // If we have a target to shoot and weapon is ready
        if (targetToShoot && typeof targetToShoot.isAlive === 'function' && targetToShoot.isAlive() && this.attackCooldown <= 0) {
            const distToTarget = distance(this.x, this.y, targetToShoot.x, targetToShoot.y);
            if (distToTarget <= this.weapon.range) {
                 let hasLOS = true; // Assume LOS for barrels/destructibles initially
                 const activeObstacles = obstacles ? obstacles.filter(o => !o.isDestroyed && o.providesCover) : [];
                 // Only check LOS for actual units, not neutral shootable objects like barrels
                 if (targetToShoot.team && targetToShoot.team !== 'neutral_object') {
                     hasLOS = hasLineOfSight(this.x, this.y, targetToShoot.x, targetToShoot.y, activeObstacles);
                 }

                if (hasLOS) {
                    // Face the target before firing
                    this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                    this.fireAt(targetToShoot);
                } else {
                     // Lost LOS to auto target, clear it so we can find a new one
                     if (targetToShoot === this.autoTarget) this.autoTarget = null;
                }
            } else {
                 // Target out of range
                 if (targetToShoot === this.autoTarget) this.autoTarget = null; // Clear auto target
            }
        } else if (targetToShoot && typeof targetToShoot.isAlive === 'function' && targetToShoot.isAlive()) {
             // If has a target but attack is on cooldown, still face them (if manual or stationary auto)
             if (this.manualTarget === targetToShoot) {
                 this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
             } else if (this.autoTarget === targetToShoot && !this.isMoving) {
                 this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
             }
        }
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
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, activeObstacles)) {
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

    fireAt(targetEntity) {
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) return;

        // Determine accuracy based on movement and rank bonus (if player)
        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) { // accuracyBonus is from Raccoon rank
            baseAccuracy += this.accuracyBonus;
        }
        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy)); // Clamp between 0 and 1

        const projectile = new Projectile(this.x, this.y, targetEntity.x, targetEntity.y, this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this.game, this, effectiveAccuracy);
        this.game.addProjectile(projectile);
        this.attackCooldown = 1 / this.weapon.rof;
    }

    fireAtPoint(pointX, pointY) {
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) return;

        this.facingAngle = Math.atan2(pointY - this.y, pointX - this.x);
        this.manualTarget = null; this.autoTarget = null; // Clear targets when firing at point

        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) {
            baseAccuracy += this.accuracyBonus;
        }
        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy));

        const projectile = new Projectile(this.x, this.y, pointX, pointY, this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this.game, this, effectiveAccuracy);
        this.game.addProjectile(projectile);
        this.attackCooldown = 1 / this.weapon.rof;
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
                const hasLOSToAttacker = hasLineOfSight(this.x, this.y, attackerUnit.x, attackerUnit.y, activeObstacles);
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
                        if (hasLineOfSight(otherEnemy.x, otherEnemy.y, sourceOfAlertUnit.x, sourceOfAlertUnit.y, activeObstacles)) {
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

    setMoveTarget(x, y) {
        if (this.actionTimer > 0) return; // Don't allow move if busy
        this.targetX = x; this.targetY = y; this.isMoving = true;
        // Manual target is NOT cleared by right-click move in this design.
        this.autoTarget = null; // Clear auto target as we are now explicitly moving
        this.stuckFrames = 0; // Reset stuck counter
    }

    setManualTarget(target) {
        if (this.actionTimer > 0 || (this instanceof Raccoon && this.isAimingGrenade)) return;
        this.manualTarget = target;
        this.autoTarget = null; // Manual target overrides auto
        this.stuckFrames = 0;
        // If setting a valid target, stop moving and face it
        if (target && typeof target.isAlive === 'function' && target.isAlive()) {
             this.isMoving = false; // Stop any current movement
             this.targetX = this.x; // Update target to current position
             this.targetY = this.y;
             this.facingAngle = Math.atan2(target.y - this.y, target.x - this.x); // Face the target
        }
    }
}