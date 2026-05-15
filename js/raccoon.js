class Raccoon extends Unit {
    constructor(x, y, game, id, faceImageUrl, name,
        existingXP = 0, existingRank = null, existingKills = 0) {

        super(x, y, game, 'player', CONFIG.RACCOON_HP, CONFIG.RACCOON_SPEED, CONFIG.RACCOON_SIZE, CONFIG.RACCOON_COLOR, id);

        this.deadSpritePathKey = 'RACCOON_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'RACCOON_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'RACCOON_DEAD_SPRITE_SCALE';

        this.defaultWeaponName = 'RACCOON_MACHINE_GUN';
        this.currentWeaponName = 'RACCOON_MACHINE_GUN';
        this.weaponName = 'RACCOON_MACHINE_GUN';
        
        this.name = name || "Recruit";
        this.grenadeAmmo = CONFIG.RACCOON_STARTING_GRENADES || 0;
        this.isAimingGrenade = false;
        this.grenadeTargetUnit = null;
        this.grenadeMoveToTargetPos = null;
        this.grenadeCooldownTimer = 0;

        this.isNewlyRescued = false;
        this.promotedThisMission = false;
        this.previousRank = null;

        this.xp = existingXP;
        this.rank = existingRank || (CONFIG.RANK_THRESHOLDS && CONFIG.RANK_THRESHOLDS[0] ? CONFIG.RANK_THRESHOLDS[0].rankName : "Recruit");
        this.killCount = existingKills;
        this.faceImageUrl = faceImageUrl || `${CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/'}${CONFIG.RACCOON_FACE_IMAGES ? CONFIG.RACCOON_FACE_IMAGES[0] : 'default_face.png'}`;

        // Ammo & Reload properties - per-weapon tracking
        this.defaultMagazineSize = CONFIG.RACCOON_MAGAZINE_SIZE || 30;
        this.defaultMaxAmmo = CONFIG.RACCOON_STARTING_AMMO || 120;
        this.defaultReserveAmmo = this.defaultMaxAmmo;
        this.defaultCurrentMagazine = this.defaultMagazineSize;
        
        this.specialMagazineSize = 0;
        this.specialMaxAmmo = 0;
        this.specialReserveAmmo = 0;
        this.specialCurrentMagazine = 0;
        
        this.reloadTimer = 0;
        this.isReloading = false;

        this.updateXpToNextRank();
        this.applyRankBonuses(true);
        
        // Set sprite based on rank
        this.setRankBasedSprite();
    }

    setRankBasedSprite() {
        const prevDefaultWeapon = this.defaultWeaponName;
        
        const rankData = CONFIG.RANK_THRESHOLDS?.find(r => r.rankName === this.rank);
        this.defaultWeaponName = rankData?.defaultWeapon || 'RACCOON_MACHINE_GUN';
        
        switch(this.rank) {
            case 'Private':
                this.spriteBaseName = 'raccoon_private';
                this.spriteScaleFactor = CONFIG.RACCOON_PRIVATE_SPRITE_SCALE_FACTOR || 0.5;
                break;
            case 'Corporal':
                this.spriteBaseName = 'raccoon_corporal';
                this.spriteScaleFactor = CONFIG.RACCOON_CORPORAL_SPRITE_SCALE_FACTOR || 0.5;
                break;
            case 'Sergeant':
                this.spriteBaseName = 'raccoon_redBeret';
                this.spriteScaleFactor = CONFIG.RACCOON_SERGEANT_SPRITE_SCALE_FACTOR || 0.5;
                break;
            case 'Elite':
                this.spriteBaseName = 'raccoon_elite';
                this.spriteScaleFactor = CONFIG.RACCOON_ELITE_SPRITE_SCALE_FACTOR || 0.5;
                break;
            case 'Ghost':
                this.spriteBaseName = 'raccoon_ghost';
                this.spriteScaleFactor = CONFIG.RACCOON_GHOST_SPRITE_SCALE_FACTOR || 0.5;
                break;
            case 'Maverick':
                this.spriteBaseName = 'raccoon_maverick';
                this.spriteScaleFactor = CONFIG.RACCOON_MAVERICK_SPRITE_SCALE_FACTOR || 0.5;
                break;
            default:
                this.spriteBaseName = 'raccoon';
                this.spriteScaleFactor = CONFIG.RACCOON_SPRITE_SCALE_FACTOR || 0.5;
                break;
        }
        
        const defaultDef = CONFIG.WEAPON_DEFINITIONS[this.defaultWeaponName];
        if (defaultDef) {
            this.defaultMagazineSize = defaultDef.magazineSize || 30;
            this.defaultMaxAmmo = defaultDef.maxAmmo || 120;
            if (prevDefaultWeapon !== this.defaultWeaponName) {
                this.defaultReserveAmmo = this.defaultMaxAmmo;
                this.defaultCurrentMagazine = this.defaultMagazineSize;
            }
        }
        
        this.currentWeaponName = this.defaultWeaponName;
        this.weaponName = this.defaultWeaponName;
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
                if (!this.previousRank) this.previousRank = this.rank;
                this.rank = nextRankData.rankName;
                promoted = true;
                // --- NEW ---
                this.promotedThisMission = true;
                // --- END NEW ---
                if (this.game && this.game.addVisualEffect) this.game.addVisualEffect('promotion', { unitId: this.id });
                if (this.game && this.game.trySpeech) this.game.trySpeech(this, 'ON_PROMOTION');
                this.applyRankBonuses(); currentRankData = nextRankData; currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);
                this.updateXpToNextRank();
                this.setRankBasedSprite(); // Update sprite when promoted
            } else break;
        }
        if (promoted && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }


    // Helper to get current weapon's ammo state
    _getCurrentAmmoState() {
        const currentDef = CONFIG.WEAPON_DEFINITIONS[this.currentWeaponName];
        const isUsingSpecialWeapon = currentDef && !currentDef.isDefaultWeapon;
        
        if (isUsingSpecialWeapon) {
            return {
                magazineSize: this.specialMagazineSize,
                maxAmmo: this.specialMaxAmmo,
                reserveAmmo: this.specialReserveAmmo,
                currentMagazine: this.specialCurrentMagazine,
                isSpecial: true
            };
        } else {
            return {
                magazineSize: this.defaultMagazineSize,
                maxAmmo: this.defaultMaxAmmo,
                reserveAmmo: this.defaultReserveAmmo,
                currentMagazine: this.defaultCurrentMagazine,
                isSpecial: false
            };
        }
    }
    
    // Helper to set current weapon's ammo state
    _setCurrentAmmoState(state) {
        if (state.isSpecial) {
            this.specialMagazineSize = state.magazineSize;
            this.specialMaxAmmo = state.maxAmmo;
            this.specialReserveAmmo = state.reserveAmmo;
            this.specialCurrentMagazine = state.currentMagazine;
        } else {
            this.defaultMagazineSize = state.magazineSize;
            this.defaultMaxAmmo = state.maxAmmo;
            this.defaultReserveAmmo = state.reserveAmmo;
            this.defaultCurrentMagazine = state.currentMagazine;
        }
    }

    // --- Reload Logic ---
    startReload() {
        if (this.isReloading) return;
        
        const ammoState = this._getCurrentAmmoState();
        if (ammoState.reserveAmmo <= 0 || ammoState.currentMagazine >= ammoState.magazineSize) return;

        const rankIndex = CONFIG.RANK_THRESHOLDS ? CONFIG.RANK_THRESHOLDS.findIndex(r => r.rankName === this.rank) : 0;
        const baseReloadTime = CONFIG.BASE_RELOAD_TIME || 3.0;
        const reductionPerRank = CONFIG.RELOAD_TIME_REDUCTION_PER_RANK || 0.5;

        let reloadTime = baseReloadTime - (Math.max(0, rankIndex) * reductionPerRank);
        reloadTime = Math.max(0.5, reloadTime);

        this.isReloading = true;
        this.reloadTimer = reloadTime;

        if (this.game && this.game.trySpeech) {
            this.game.trySpeech(this, 'ON_RELOAD', 0.2);
        }

        if (this.game && this.game.addVisualEffect) {
            let effectX = this.x;
            let effectY = this.y - this.size;

            if (this.game.selectedUnits && this.game.selectedUnits.includes(this) &&
                this.game.inputHandler && this.game.inputHandler.mousePos) {
                effectX = this.game.inputHandler.mousePos.worldX;
                effectY = this.game.inputHandler.mousePos.worldY - 20;
            }

            this.game.addVisualEffect('pickup', {
                x: effectX,
                y: effectY,
                text: "Reloading!",
                color: '#AAAAAA',
                icon: null
            });
        }
    }

    completeReload() {
        let ammoState = this._getCurrentAmmoState();
        
        const ammoNeeded = ammoState.magazineSize - ammoState.currentMagazine;
        if (ammoNeeded <= 0) {
            this.isReloading = false;
            return;
        }

        const ammoToTake = Math.min(ammoNeeded, ammoState.reserveAmmo);
        ammoState.currentMagazine += ammoToTake;
        ammoState.reserveAmmo -= ammoToTake;
        
        this._setCurrentAmmoState(ammoState);
        this.isReloading = false;

        if (this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.completeReload();
            }
        } else {
            const ammoState = this._getCurrentAmmoState();
            const currentDef = CONFIG.WEAPON_DEFINITIONS[this.currentWeaponName];
            const isUsingSpecialWeapon = currentDef && !currentDef.isDefaultWeapon;
            
            if (ammoState.currentMagazine <= 0 && ammoState.reserveAmmo > 0) {
                this.startReload();
            } else if (ammoState.currentMagazine <= 0 && ammoState.reserveAmmo <= 0 && isUsingSpecialWeapon) {
                // Special weapon completely empty - swap back to default
                this._revertToDefaultWeapon();
            }
        }

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

    // Override _executeFire to consume ammo and handle special weapons
    _executeFire(pointX, pointY) {
        if (this.isReloading) return;
        
        // Defensive check: ensure weapon is valid before firing
        if (!this.weapon) {
            console.error(`[Raccoon ${this.id}] _executeFire called with null weapon! currentWeaponName: ${this.currentWeaponName}`);
            return;
        }

        let ammoState = this._getCurrentAmmoState();
        const currentDef = CONFIG.WEAPON_DEFINITIONS[this.currentWeaponName];
        const isUsingSpecialWeapon = currentDef && !currentDef.isDefaultWeapon;

        if (ammoState.currentMagazine <= 0) {
            if (ammoState.reserveAmmo > 0) {
                this.startReload();
            } else if (isUsingSpecialWeapon) {
                // Special weapon is completely empty - swap back to default weapon
                this._revertToDefaultWeapon();
            }
            return;
        }

        super._executeFire(pointX, pointY);

        if (this.game && this.game.trySpeech) {
            this.game.trySpeech(this, 'ON_START_FIRING', 0.15);
        }

        // Consume ammo from current magazine
        ammoState.currentMagazine--;
        this._setCurrentAmmoState(ammoState);
    }

    // Swap back to default weapon when special weapon ammo is exhausted
    _revertToDefaultWeapon() {
        const defaultDef = CONFIG.WEAPON_DEFINITIONS[this.defaultWeaponName];
        if (defaultDef) {
            this.currentWeaponName = this.defaultWeaponName;
            this.weaponName = this.defaultWeaponName;
            
            // Reset special weapon ammo (can be picked up again later)
            this.specialMagazineSize = 0;
            this.specialMaxAmmo = 0;
            this.specialReserveAmmo = 0;
            this.specialCurrentMagazine = 0;
            
            // Ensure default ammo is valid
            if (this.defaultCurrentMagazine <= 0 && this.defaultReserveAmmo > 0) {
                this.defaultCurrentMagazine = Math.min(this.defaultMagazineSize, this.defaultReserveAmmo);
            }
            
            // Show visual feedback
            if (this.game && this.game.addVisualEffect) {
                const defaultWeaponName = defaultDef.name || 'Default Weapon';
                this.game.addVisualEffect('pickup', {
                    x: this.x,
                    y: this.y - this.size,
                    text: defaultWeaponName,
                    color: defaultDef.projectileColor || '#FFFFFF',
                    icon: null
                });
            }
            
            // Update UI
            if (this.game && this.game.ui) {
                this.game.ui.updateSquadPanel();
            }
            
            if (CONFIG.DEBUG_LOGGING) {
                console.log(`[Raccoon ${this.id}] Reverted to default weapon: ${this.defaultWeaponName}`);
            }
        }
    }

    _handleAimingMovement(deltaTime) {
        if (this.game.inputHandler.mousePos) {
            this.facingAngle = Math.atan2(this.game.inputHandler.mousePos.worldY - this.y, this.game.inputHandler.mousePos.worldX - this.x);
            this.gunAimAngle = this.facingAngle;
        }

        if (this.isMoving && this.grenadeMoveToTargetPos) {
            const distToGrenadePos = distance(this.x, this.y, this.grenadeMoveToTargetPos.x, this.grenadeMoveToTargetPos.y);
            if (distToGrenadePos < this.game.level.gridCellSize * 0.5) {
                this.isMoving = false;
                this.currentPath = [];
                this.grenadeMoveToTargetPos = null;
                
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
//            console.log(`[${this.id}] Grenade on cooldown for ${this.grenadeCooldownTimer.toFixed(1)}s`);
        } else if (this.grenadeAmmo <= 0) {
            const logMsgTemplate = (CONFIG.UI_TEXT_STRINGS && CONFIG.UI_TEXT_STRINGS.RACCOON_OUT_OF_GRENADES_LOG) || "Raccoon {ID}: Out of grenades!";
//            console.log(logMsgTemplate.replace('{ID}', this.name || this.id));
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
        if (this.game && this.game.trySpeech) {
            this.game.trySpeech(this, 'ON_GRENADE');
        }
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
//                console.log(`[${this.id} moveToGrenadeRange] Already in preferred range of target ${enemyTarget.id}.`);
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
//                console.warn(`[${this.id} moveToGrenadeRange] Raccoon is on top of grenade target ${enemyTarget.id}. Cannot calculate move point.`);
            }
            return;
        }

        this.grenadeTargetUnit = enemyTarget;
        this.grenadeMoveToTargetPos = { x: targetPointX, y: targetPointY };

        
        this.setMoveTarget(targetPointX, targetPointY);
    }

    checkForAndApplyPickups() {
        if (!this.isAlive() || !this.game || !this.game.level || !this.game.level.obstacles) {
            return;
        }
        for (let i = this.game.level.obstacles.length - 1; i >= 0; i--) {
            const obs = this.game.level.obstacles[i];
            if (obs && obs.isPickup && !obs.isDestroyed && obs.pickupType) {
                const isValidPickup = (obs.pickupQuantity !== undefined) || (obs.pickupType === 'weapon' && obs.weaponName);
                if (!isValidPickup) continue;
                
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
        // --- MODIFICATION START ---
        let pickupText = `+${pickupObstacle.pickupQuantity}`;
        let pickupColor = 'white';
        let pickupIcon = null;

        if (pickupObstacle.pickupType === 'grenade') {
            this.grenadeAmmo += pickupObstacle.pickupQuantity;
            pickupColor = '#F0E68C'; // Khaki
            pickupIcon = this.game.preloadedImages[CONFIG.UI_ASSETS.GRENADE_ICON];
        } else if (pickupObstacle.pickupType === 'ammo') {
            let ammoState = this._getCurrentAmmoState();
            ammoState.reserveAmmo += pickupObstacle.pickupQuantity;
            ammoState.reserveAmmo = Math.min(ammoState.reserveAmmo, ammoState.maxAmmo);
            this._setCurrentAmmoState(ammoState);
            pickupColor = '#87CEEB'; // SkyBlue
            pickupIcon = this.game.preloadedImages[CONFIG.UI_ASSETS.AMMO_ICON];
        } else if (pickupObstacle.pickupType === 'health') {
            if (this.hp < this.maxHp) {
                this.hp += pickupObstacle.pickupQuantity;
                if (this.hp > this.maxHp) {
                    this.hp = this.maxHp;
                }
                pickupColor = '#90EE90'; // LightGreen
                pickupIcon = this.game.preloadedImages[CONFIG.UI_ASSETS.HEALTH_ICON];
            } else {
                return;
            }
        } else if (pickupObstacle.pickupType === 'weapon') {
            if (pickupObstacle.weaponName && WEAPONS[pickupObstacle.weaponName]) {
                const weaponDef = CONFIG.WEAPON_DEFINITIONS[pickupObstacle.weaponName];
                if (weaponDef) {
                    this.specialMagazineSize = weaponDef.magazineSize || 30;
                    this.specialMaxAmmo = weaponDef.maxAmmo || 120;
                    this.specialReserveAmmo = this.specialMaxAmmo;
                    this.specialCurrentMagazine = this.specialMagazineSize;
                    
                    this.currentWeaponName = pickupObstacle.weaponName;
                    this.weaponName = pickupObstacle.weaponName;
                    
                    pickupText = weaponDef.name;
                    pickupColor = weaponDef.projectileColor || '#FFD700';
                }
            }
        }

        // Trigger the visual effect
        if (this.game.addVisualEffect) {
            this.game.addVisualEffect('pickup', {
                x: this.x,
                y: this.y - this.size,
                text: pickupText,
                color: pickupColor,
                icon: pickupIcon
            });
        }

        if (this.game && this.game.trySpeech) {
            const _catMap = { 'ammo': 'ON_PICKUP_AMMO', 'health': 'ON_PICKUP_HEALTH', 'grenade': 'ON_PICKUP_GRENADE', 'weapon': 'ON_PICKUP_WEAPON' };
            this.game.trySpeech(this, _catMap[pickupObstacle.pickupType] || 'ON_PICKUP_ITEM');
        }

        // Update UI
        if (this.game.ui) {
            this.game.ui.updateSquadPanel();
        }
        // --- MODIFICATION END ---
    }

    render(ctx) {
        super.render(ctx);

        // Reloading Indicator - show while reload is in progress
        if (this.isAlive() && this.isReloading) {
            ctx.save();
            ctx.font = "bold 14px 'Consolas'";
            ctx.textAlign = 'center';
            ctx.shadowColor = "rgba(0,0,0,0.9)";
            ctx.shadowBlur = 4;
            
            let x = this.x;
            let y = this.y - this.size - 10; // Above unit

            // If selected and mouse active, show at cursor
            if (this.game.selectedUnits && this.game.selectedUnits.includes(this) &&
                this.game.inputHandler && this.game.inputHandler.mousePos) {
                x = this.game.inputHandler.mousePos.worldX;
                y = this.game.inputHandler.mousePos.worldY - 25;
            }

            ctx.fillStyle = '#AAAAAA';
            ctx.fillText("Reloading...", x, y);
            ctx.restore();
        }
    }
}
