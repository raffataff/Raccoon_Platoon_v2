class Raccoon extends Unit {
    constructor(x, y, game, id, faceImageUrl, name,
                existingXP = 0, existingRank = null, existingKills = 0) {

        super(x, y, game, 'player', CONFIG.RACCOON_HP, CONFIG.RACCOON_SPEED, CONFIG.RACCOON_SIZE, CONFIG.RACCOON_COLOR, id);
        this.weapon = WEAPONS.RACCOON_MACHINE_GUN;
        this.name = name || "Recruit";
        this.grenadeAmmo = CONFIG.RACCOON_STARTING_GRENADES || 0;
        this.isAimingGrenade = false;
        this.grenadeTargetUnit = null;
        this.grenadeMoveToTargetPos = null;
        this.grenadeCooldownTimer = 0; 

        this.isNewlyRescued = false;
        this.promotedThisMission = false;

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
                this.rank = nextRankData.rankName; 
                promoted = true;
                // --- NEW ---
                this.promotedThisMission = true; 
                // --- END NEW ---
                if (this.game && this.game.addVisualEffect) this.game.addVisualEffect('promotion', { unitId: this.id });
                this.applyRankBonuses(); currentRankData = nextRankData; currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);
                this.updateXpToNextRank();
            } else break;
        }
        if (promoted && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }


    update(deltaTime) {
        if (!this.isAlive()) return;

        if (this.grenadeCooldownTimer > 0) { 
            this.grenadeCooldownTimer -= deltaTime;
            if (this.grenadeCooldownTimer < 0) this.grenadeCooldownTimer = 0;
        }

        if (this.isAimingGrenade) {
            this._handleAimingMovement(deltaTime);
            return;
        }

        super.update(deltaTime); 
        this.checkForAndApplyPickups();
    }

    _handleAimingMovement(deltaTime) {
        if (this.game.inputHandler.mousePos) {
            this.facingAngle = Math.atan2( this.game.inputHandler.mousePos.worldY - this.y, this.game.inputHandler.mousePos.worldX - this.x );
            this.gunAimAngle = this.facingAngle;
        }

        if (this.isMoving && this.grenadeMoveToTargetPos) {
            const distToGrenadePos = distance(this.x, this.y, this.grenadeMoveToTargetPos.x, this.grenadeMoveToTargetPos.y);
            if (distToGrenadePos < this.game.level.gridCellSize * 0.5) {
                this.isMoving = false;
                this.currentPath = [];
                this.grenadeMoveToTargetPos = null;
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                    console.log(`[${this.id} _handleAimingMovement] Arrived at grenade throw position.`);
                }
            }
        }
     }

    startGrenadeAim(targetUnit = null) {
        if (this.isContinuousFiring) {
            this.setContinuousFire(false);
            if (this.game && this.game.inputHandler && this.game.inputHandler.isShiftHoldFiring) {
                this.game.inputHandler.isShiftHoldFiring = false;
            }
        }
        if (this.grenadeAmmo > 0 && this.actionTimer <= 0 && this.grenadeCooldownTimer <= 0) {
            this.isAimingGrenade = true; this.manualTarget = null; this.autoTarget = null;
            this.grenadeTargetUnit = targetUnit;
            this.grenadeMoveToTargetPos = null;
            if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        } else if (this.grenadeCooldownTimer > 0) {
            console.log(`[${this.id}] Grenade on cooldown for ${this.grenadeCooldownTimer.toFixed(1)}s`);
        } else if (this.grenadeAmmo <= 0) {
            const logMsgTemplate = (CONFIG.UI_TEXT_STRINGS && CONFIG.UI_TEXT_STRINGS.RACCOON_OUT_OF_GRENADES_LOG) || "Raccoon {ID}: Out of grenades!";
            console.log(logMsgTemplate.replace('{ID}', this.name || this.id));
        }
    }

    cancelGrenadeAim() {
        if (!this.isAimingGrenade) return;
        this.isAimingGrenade = false;
        this.isMoving = false; 
        this.currentPath = []; 
        this.grenadeTargetUnit = null;
        this.grenadeMoveToTargetPos = null;
        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        if (this.game && this.game.inputHandler) this.game.inputHandler.updateMouseCursor();
    }

    confirmThrowGrenade(targetX, targetY) {
        if (!this.isAimingGrenade || this.grenadeAmmo <= 0 || this.actionTimer > 0 || this.grenadeCooldownTimer > 0) return false;
        this.grenadeAmmo--;
        this.isAimingGrenade = false;
        this.grenadeTargetUnit = null;
        this.grenadeMoveToTargetPos = null;
        this.isMoving = false; 
        this.currentPath = [];

        this.grenadeCooldownTimer = CONFIG.RACCOON_GRENADE_THROW_COOLDOWN || 1.0;
        this.actionTimer = 0; 

        this.facingAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.gunAimAngle = this.facingAngle;

        // --- MODIFIED: Use game's pool to get grenade projectile ---
        const grenade = this.game.getGrenadeProjectileFromPool(
            this.x, this.y, 
            targetX, targetY, 
            this // shooterUnit
        );
        this.game.addProjectile(grenade); // Add to gameObjects and spatialGrid
        // --- END MODIFIED ---
        
        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
        return true;
    }

    moveToGrenadeRange(enemyTarget) {
        if (!this.isAimingGrenade || !enemyTarget || this.actionTimer > 0 || this.grenadeCooldownTimer > 0) return;

        const preferredRangeFactor = CONFIG.RACCOON_GRENADE_PREFERRED_THROW_RANGE_FACTOR || 0.9;
        const preferredThrowRange = CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX * preferredRangeFactor;
        const distToEnemy = distance(this.x, this.y, enemyTarget.x, enemyTarget.y);

        if (distToEnemy <= preferredThrowRange) {
            this.isMoving = false;
            this.currentPath = [];
            this.grenadeMoveToTargetPos = null;
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.log(`[${this.id} moveToGrenadeRange] Already in preferred range of target ${enemyTarget.id}.`);
            }
            return;
        }

        let targetPointX, targetPointY;
        if (distToEnemy > 0) {
            const vecX = this.x - enemyTarget.x;
            const vecY = this.y - enemyTarget.y;
            targetPointX = enemyTarget.x + (vecX / distToEnemy) * preferredThrowRange;
            targetPointY = enemyTarget.y + (vecY / distToEnemy) * preferredThrowRange;
        } else {
            targetPointX = this.x;
            targetPointY = this.y;
            this.isMoving = false;
            this.currentPath = [];
            this.grenadeMoveToTargetPos = null;
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.warn(`[${this.id} moveToGrenadeRange] Raccoon is on top of grenade target ${enemyTarget.id}. Cannot calculate move point.`);
            }
            return;
        }

        this.grenadeTargetUnit = enemyTarget;
        this.grenadeMoveToTargetPos = { x: targetPointX, y: targetPointY };

        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
            console.log(`[${this.id} moveToGrenadeRange] Setting move target to (${targetPointX.toFixed(0)}, ${targetPointY.toFixed(0)}) for grenade on ${enemyTarget.id}.`);
        }
        this.setMoveTarget(targetPointX, targetPointY);
    }

    checkForAndApplyPickups() {
        if (!this.isAlive() || !this.game || !this.game.level || !this.game.level.obstacles) {
            return;
        }
        for (let i = this.game.level.obstacles.length - 1; i >= 0; i--) {
            const obs = this.game.level.obstacles[i];
            if (obs && obs.isPickup && !obs.isDestroyed && obs.pickupType && obs.pickupQuantity !== undefined) { 
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
                    this.applyPickup(obs);
                    obs.isDestroyed = true;
                    obs.hp = 0;
                    if (obs.blocksMovement && this.game.level.navGrid) {
                        this.game.level.updateNavigationGridForObstacle(obs, true);
                    }
                    break;
                }
            }
        }
    }
    applyPickup(pickupObstacle) {
        if (pickupObstacle.pickupType === 'grenade') {
            this.grenadeAmmo += pickupObstacle.pickupQuantity;
            if (this.game && this.game.ui) {
                this.game.ui.updateSquadPanel();
            }
        } else if (pickupObstacle.pickupType === 'health') { 
            if (this.hp < this.maxHp) {
                this.hp += pickupObstacle.pickupQuantity;
                if (this.hp > this.maxHp) {
                    this.hp = this.maxHp;
                }
                console.log(`[${this.id}] picked up health. HP: ${this.hp}/${this.maxHp}`);
                if (this.game && this.game.ui) {
                    this.game.ui.updateSquadPanel(); 
                }
            }
        }
    }
    render(ctx) {
        super.render(ctx);
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
