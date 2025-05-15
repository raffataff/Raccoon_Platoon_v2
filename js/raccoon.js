// js/raccoon.js
class Raccoon extends Unit {
    constructor(x, y, game, id, faceImageUrl, name,
                existingXP = 0, existingRank = null, existingKills = 0) {

        super(x, y, game, 'player', CONFIG.RACCOON_HP, CONFIG.RACCOON_SPEED, CONFIG.RACCOON_SIZE, CONFIG.RACCOON_COLOR, id);
        this.weapon = WEAPONS.RACCOON_MACHINE_GUN;
        this.name = name || "Recruit";
        this.grenadeAmmo = CONFIG.RACCOON_STARTING_GRENADES || 0;
        this.isAimingGrenade = false;
        this.grenadeTargetUnit = null;

        this.xp = existingXP;
        this.rank = existingRank || (CONFIG.RANK_THRESHOLDS && CONFIG.RANK_THRESHOLDS[0] ? CONFIG.RANK_THRESHOLDS[0].rankName : "Recruit");
        this.killCount = existingKills;
        this.faceImageUrl = faceImageUrl || `${CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/'}${CONFIG.RACCOON_FACE_IMAGES ? CONFIG.RACCOON_FACE_IMAGES[0] : 'default_face.png'}`;

        this.updateXpToNextRank();
        this.applyRankBonuses(true);
    }

    updateXpToNextRank() {
        if (!CONFIG.RANK_THRESHOLDS || CONFIG.RANK_THRESHOLDS.length === 0) { this.xpToNextRank = Infinity; return; }
        const currentRankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        const currentRankIndex = currentRankData ? CONFIG.RANK_THRESHOLDS.indexOf(currentRankData) : -1;
        if (currentRankData && currentRankIndex < CONFIG.RANK_THRESHOLDS.length - 1) {
            this.xpToNextRank = CONFIG.RANK_THRESHOLDS[currentRankIndex + 1].xpNeeded;
        } else { this.xpToNextRank = Infinity; }
    }

    applyRankBonuses(isInitialSetup = false) {
        if (!CONFIG.RANK_THRESHOLDS) return;
        const rankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        if (rankData && rankData.statBoosts) {
            const baseHp = CONFIG.RACCOON_HP || 30;
            let newMaxHp = baseHp;
            if (rankData.statBoosts.maxHpBonus) newMaxHp = baseHp + rankData.statBoosts.maxHpBonus;
            const hpDiff = newMaxHp - this.maxHp;
            this.maxHp = newMaxHp;
            if (isInitialSetup || hpDiff > 0) { this.hp += hpDiff; if (this.hp > this.maxHp) this.hp = this.maxHp; }
            else if (hpDiff < 0 && this.hp > this.maxHp) this.hp = this.maxHp;
            this.accuracyBonus = rankData.statBoosts.accuracyBonus || 0;
        } else {
             this.maxHp = CONFIG.RACCOON_HP || 30; this.accuracyBonus = 0;
             if (!isInitialSetup && this.hp > this.maxHp) this.hp = this.maxHp;
        }
    }

    addXp(amount) {
        if (!this.isAlive() || (CONFIG.MAX_RANK_NAME && this.rank === CONFIG.MAX_RANK_NAME)) return;
        this.xp += amount;
        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        this.checkPromotion();
    }

    incrementKillCount() { this.killCount = (this.killCount || 0) + 1; }

    checkPromotion() {
        if (!CONFIG.RANK_THRESHOLDS || CONFIG.RANK_THRESHOLDS.length === 0) return;
        let currentRankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        let currentRankIndex = currentRankData ? CONFIG.RANK_THRESHOLDS.indexOf(currentRankData) : -1;
        if (currentRankIndex === -1) {
            currentRankIndex = 0; this.rank = CONFIG.RANK_THRESHOLDS[0].rankName; this.applyRankBonuses();
        }
        let promoted = false;
        while (currentRankIndex < CONFIG.RANK_THRESHOLDS.length - 1) {
            const nextRankData = CONFIG.RANK_THRESHOLDS[currentRankIndex + 1];
            if (this.xp >= nextRankData.xpNeeded) {
                this.rank = nextRankData.rankName; promoted = true;
                if (this.game && this.game.addVisualEffect) this.game.addVisualEffect('promotion', this.x, this.y, this.id);
                this.applyRankBonuses(); currentRankData = nextRankData; currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);
                this.updateXpToNextRank();
            } else break;
        }
        if (promoted && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }

    update(deltaTime) {
        if (!this.isAlive()) return; // Do nothing if not alive

        if (this.isAimingGrenade) {
            this._handleAimingMovement(deltaTime);
            return; 
        }
        super.update(deltaTime); // Handles movement, combat, timers if not aiming

        // --- ADDED PICKUP CHECK ---
        this.checkForAndApplyPickups();
        // --------------------------
    }

    _handleAimingMovement(deltaTime) {
         if (!this.isMoving) {
             if (this.game.inputHandler.mousePos) {
                 this.facingAngle = Math.atan2( this.game.inputHandler.mousePos.worldY - this.y, this.game.inputHandler.mousePos.worldX - this.x );
            } return;
         }
        const dx = this.targetX - this.x; const dy = this.targetY - this.y;
        const distToMovementTarget = distance(this.x, this.y, this.targetX, this.targetY);
        const moveSpeed = this.speed * deltaTime;
        if (distToMovementTarget <= moveSpeed + 1.0) {
            this.x = this.targetX; this.y = this.targetY; this.isMoving = false;
             if (this.grenadeTargetUnit) {
                 const distToEnemy = distance(this.x, this.y, this.grenadeTargetUnit.x, this.grenadeTargetUnit.y);
                 if (distToEnemy > CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) { /* console.warn(`Raccoon ${this.id} moved but target still out of grenade range.`); */ }
             }
        } else {
            this.facingAngle = Math.atan2(dy, dx);
            let nextX = this.x + Math.cos(this.facingAngle) * moveSpeed;
            let nextY = this.y + Math.sin(this.facingAngle) * moveSpeed;
            let collision = false;
            const activeObstacles = this.game.level.obstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement);
            for (const obs of activeObstacles) {
                if (nextX + this.size > obs.x && nextX - this.size < obs.x + obs.width && nextY + this.size > obs.y && nextY - this.size < obs.y + obs.height) {
                    collision = true; this.isMoving = false; break;
                }
            }
            if (!collision) { this.x = nextX; this.y = nextY; }
            const worldW = CONFIG.WORLD_WIDTH || (this.game.canvas ? this.game.canvas.width : 0);
            const worldH = CONFIG.WORLD_HEIGHT || (this.game.canvas ? this.game.canvas.height : 0);
            this.x = Math.max(this.size, Math.min(this.x, worldW - this.size));
            this.y = Math.max(this.size, Math.min(this.y, worldH - this.size));
        }
     }

    startGrenadeAim(targetUnit = null) {
        if (this.isContinuousFiring) { // Check inherited property
            this.setContinuousFire(false); // Call inherited method
            if (this.game && this.game.inputHandler && this.game.inputHandler.isShiftHoldFiring) {
                this.game.inputHandler.isShiftHoldFiring = false; // Reset input handler flag
            }
        }
        if (this.grenadeAmmo > 0 && this.actionTimer <= 0) {
            this.isAimingGrenade = true; this.manualTarget = null; this.autoTarget = null; this.isMoving = false;
            this.grenadeTargetUnit = targetUnit;
            if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        } else if (this.grenadeAmmo <= 0) {
            const logMsgTemplate = (CONFIG.UI_TEXT_STRINGS && CONFIG.UI_TEXT_STRINGS.RACCOON_OUT_OF_GRENADES_LOG) || "Raccoon {ID}: Out of grenades!";
            console.log(logMsgTemplate.replace('{ID}', this.name || this.id));
        }
    }

    cancelGrenadeAim() {
        if (!this.isAimingGrenade) return;
        this.isAimingGrenade = false; this.isMoving = false; this.grenadeTargetUnit = null;
        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        if (this.game && this.game.inputHandler) this.game.inputHandler.updateMouseCursor();
    }

    confirmThrowGrenade(targetX, targetY) {
        
        if (!this.isAimingGrenade || this.grenadeAmmo <= 0 || this.actionTimer > 0) return false;
        this.grenadeAmmo--; this.isAimingGrenade = false; this.grenadeTargetUnit = null;
        this.actionTimer = CONFIG.RACCOON_GRENADE_THROW_COOLDOWN || 1.0;
        this.facingAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const grenade = new GrenadeProjectile(this.x, this.y, targetX, targetY, this.game, this);
        this.game.addProjectile(grenade);
        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        return true;
    }

    moveToGrenadeRange(enemyTarget) {
        if (!this.isAimingGrenade || !enemyTarget || this.actionTimer > 0) return;
        const preferredRangeFactor = CONFIG.RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR || 0.9;
        const preferredThrowRange = CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX * preferredRangeFactor;
        const distToEnemy = distance(this.x, this.y, enemyTarget.x, enemyTarget.y);
        if (distToEnemy <= preferredThrowRange) { this.isMoving = false; return; }
        const vecX = this.x - enemyTarget.x; const vecY = this.y - enemyTarget.y;
        if (distToEnemy > 0) {
            this.targetX = enemyTarget.x + (vecX / distToEnemy) * preferredThrowRange;
            this.targetY = enemyTarget.y + (vecY / distToEnemy) * preferredThrowRange;
        } else { this.targetX = this.x; this.targetY = this.y; this.isMoving = false; return; }
        this.isMoving = true; this.grenadeTargetUnit = enemyTarget;
    }

    // --- NEW PICKUP METHODS ---
    checkForAndApplyPickups() {
        if (!this.isAlive() || !this.game || !this.game.level || !this.game.level.obstacles) {
            // console.log(`${this.name} cannot check for pickups: missing game context or not alive.`);
            return;
        }

        for (let i = this.game.level.obstacles.length - 1; i >= 0; i--) {
            const obs = this.game.level.obstacles[i];

            // Check if the obstacle is a pickup, not destroyed, and has a type/quantity
            if (obs && obs.isPickup && !obs.isDestroyed && obs.pickupType && obs.pickupQuantity > 0) {
                // Collision check: Raccoon's bounding box vs obstacle's bounding box
                // Assuming this.x, this.y is center of raccoon, obs.x, obs.y is top-left of obstacle
                const raccoonLeft = this.x - this.size / 2;
                const raccoonRight = this.x + this.size / 2;
                const raccoonTop = this.y - this.size / 2;
                const raccoonBottom = this.y + this.size / 2;

                const obsLeft = obs.x;
                const obsRight = obs.x + obs.width;
                const obsTop = obs.y;
                const obsBottom = obs.y + obs.height;

                if (raccoonRight > obsLeft && raccoonLeft < obsRight &&
                    raccoonBottom > obsTop && raccoonTop < obsBottom) {
                    // console.log(`${this.name} overlapping with pickup: ${obs.name || obs.type}`);
                    this.applyPickup(obs);
                    obs.isDestroyed = true; // Mark crate as "consumed"
                    obs.hp = 0;             // Also set HP to 0
                    // The level's render logic will now use the 'destroyed' sprite (e.g., crate_empty.png)
                    break; // Raccoon picks up one crate per check cycle for simplicity
                }
            }
        }
    }

    applyPickup(pickupObstacle) {
        if (pickupObstacle.pickupType === 'grenade') {
            this.grenadeAmmo += pickupObstacle.pickupQuantity;
           // console.log(`${this.name} picked up ${pickupObstacle.pickupQuantity} ${pickupObstacle.pickupType}(s). Total grenades: ${this.grenadeAmmo}`);
            // Update UI immediately
            if (this.game && this.game.ui) {
                this.game.ui.updateSquadPanel();
            }
        }
        // Future: else if (pickupObstacle.pickupType === 'rocket_ammo') { ... }
        // Future: else if (pickupObstacle.pickupType === 'health_pack') { ... }
    }
    // --- END PICKUP METHODS ---

    render(ctx) {
        super.render(ctx); // Base unit rendering
        const aimIndicatorCfg = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.GRENADE_AIM_INDICATOR;
        if (this.isAlive() && this.isAimingGrenade && aimIndicatorCfg) {
            ctx.strokeStyle = aimIndicatorCfg.COLOR || 'orange';
            ctx.lineWidth = aimIndicatorCfg.LINE_WIDTH || 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + (aimIndicatorCfg.RADIUS_OFFSET || 6), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}