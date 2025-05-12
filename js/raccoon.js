// js/raccoon.js
class Raccoon extends Unit {
    constructor(x, y, game, id, faceImageUrl, existingXP = 0, existingRank = null, existingKills = 0) {
        super(x, y, game, 'player', CONFIG.RACCOON_HP, CONFIG.RACCOON_SPEED, CONFIG.RACCOON_SIZE, CONFIG.RACCOON_COLOR, id);
        this.weapon = WEAPONS.RACCOON_MACHINE_GUN;
        this.grenadeAmmo = CONFIG.RACCOON_STARTING_GRENADES; 
        this.isAimingGrenade = false; 
        this.grenadeTargetUnit = null; 

        this.xp = existingXP;
        this.rank = existingRank || (CONFIG.RANK_THRESHOLDS && CONFIG.RANK_THRESHOLDS[0] ? CONFIG.RANK_THRESHOLDS[0].rankName : "Recruit");
        this.killCount = existingKills;
        this.faceImageUrl = faceImageUrl || `${CONFIG.RACCOON_FACE_IMAGE_PATH}${CONFIG.RACCOON_FACE_IMAGES[0]}`;
        
        // Calculate xpToNextRank based on current rank
        this.updateXpToNextRank(); 
        this.applyRankBonuses(true); // Apply initial bonuses based on starting rank (if any)
    }

    updateXpToNextRank() {
        if (!CONFIG.RANK_THRESHOLDS || CONFIG.RANK_THRESHOLDS.length === 0) {
            this.xpToNextRank = Infinity;
            return;
        }
        const currentRankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        const currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);

        if (currentRankData && currentRankIndex < CONFIG.RANK_THRESHOLDS.length - 1) {
            this.xpToNextRank = CONFIG.RANK_THRESHOLDS[currentRankIndex + 1].xpNeeded;
        } else {
            this.xpToNextRank = Infinity; // Max rank or rank not found
        }
    }
    
    applyRankBonuses(isInitialSetup = false) {
        if (!CONFIG.RANK_THRESHOLDS) return;
        const rankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        if (rankData && rankData.statBoosts) {
            if (isInitialSetup) { // Only apply base HP from config on initial setup
                this.maxHp = CONFIG.RACCOON_HP;
            }
            if (rankData.statBoosts.maxHpBonus) {
                // Ensure we don't re-add bonus if already applied due to multiple promotions
                // This simple cumulative way can lead to very high HP if not capped or designed carefully
                // For now, let's make it a flat bonus ON TOP of base, not cumulative from previous rank bonus
                const baseHp = CONFIG.RACCOON_HP;
                const newMaxHp = baseHp + (rankData.statBoosts.maxHpBonus || 0);
                const hpDiff = newMaxHp - this.maxHp;
                this.maxHp = newMaxHp;
                if (isInitialSetup || hpDiff > 0) { // Only add HP if it's an increase
                   this.hp += hpDiff; // Heal by the amount of maxHP increase
                   if (this.hp > this.maxHp) this.hp = this.maxHp;
                }
            }
            if (rankData.statBoosts.accuracyBonus && this.weapon) {
                // This assumes weapon accuracy is reset each time or based on a base weapon stat
                // For simplicity, let's assume a base accuracy for the weapon type
                // And this is an *additional* bonus.
                // This is tricky if weapons change. Better to modify 'effectiveAccuracy' calc.
                // For now, we'll skip direct weapon stat modification via rank here
                // and assume it's handled in accuracy calculation if needed.
            }
        }
    }


    addXp(amount) {
        if (!this.isAlive() || (CONFIG.MAX_RANK_NAME && this.rank === CONFIG.MAX_RANK_NAME)) return;
        this.xp += amount;
        this.checkPromotion();
    }

    incrementKillCount() {
        this.killCount = (this.killCount || 0) + 1;
    }

    checkPromotion() {
        if (!CONFIG.RANK_THRESHOLDS || CONFIG.RANK_THRESHOLDS.length === 0) return;
        let currentRankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === this.rank);
        let currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);

        if (currentRankIndex === -1) { 
            currentRankIndex = 0; 
            this.rank = CONFIG.RANK_THRESHOLDS[0].rankName;
        }

        // Loop to handle multiple promotions from a large XP gain
        while (currentRankIndex < CONFIG.RANK_THRESHOLDS.length - 1) {
            const nextRankData = CONFIG.RANK_THRESHOLDS[currentRankIndex + 1];
            if (this.xp >= nextRankData.xpNeeded) {
                this.rank = nextRankData.rankName;
                // console.log(`PROMOTION! ${this.id} promoted to ${this.rank}!`);
                if (this.game && this.game.addVisualEffect) {
                    this.game.addVisualEffect('promotion', this.x, this.y - this.size, this.id); 
                }
                this.applyRankBonuses(); // Apply new rank bonuses
                currentRankData = nextRankData;
                currentRankIndex = CONFIG.RANK_THRESHOLDS.indexOf(currentRankData);
                this.updateXpToNextRank(); // Update for the *new* current rank
                 if (this.game && this.game.ui) this.game.ui.updateSquadPanel(); 
            } else {
                break; // Not enough XP for the next rank in the list
            }
        }
    }
    // ... (rest of Raccoon methods as before)
    update(deltaTime) {
        if (this.actionTimer > 0) {
            if(this.isAimingGrenade) this.cancelGrenadeAim(); 
            super.update(deltaTime); 
            return;
        }
        
        if (this.isAimingGrenade) {
            if (this.isMoving) { 
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const distToMovementTarget = distance(this.x, this.y, this.targetX, this.targetY);
                const moveSpeed = this.speed * deltaTime;

                if (distToMovementTarget <= moveSpeed) {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.isMoving = false; 
                } else {
                    this.facingAngle = Math.atan2(dy, dx);
                    let nextX = this.x + Math.cos(this.facingAngle) * moveSpeed;
                    let nextY = this.y + Math.sin(this.facingAngle) * moveSpeed;
                    let collision = false;
                    for (const obs of this.game.level.obstacles) {
                        if (!obs.isDestroyed && obs.blocksMovement && nextX + this.size > obs.x && nextX - this.size < obs.x + obs.width &&
                            nextY + this.size > obs.y && nextY - this.size < obs.y + obs.height) {
                            collision = true; this.isMoving = false; break;
                        }
                    }
                    if (!collision) { this.x = nextX; this.y = nextY; }

                    this.x = Math.max(this.size, Math.min(this.x, CONFIG.WORLD_WIDTH - this.size));
                    this.y = Math.max(this.size, Math.min(this.y, CONFIG.WORLD_HEIGHT - this.size));
                }
            } else { 
                this.isMoving = false; 
                if (this.game.inputHandler.mousePos) {
                     this.facingAngle = Math.atan2(
                        this.game.inputHandler.mousePos.worldY - this.y, 
                        this.game.inputHandler.mousePos.worldX - this.x  
                    );
                }
            }
            return; 
        }
        super.update(deltaTime); 
    }
    startGrenadeAim(targetUnit = null) { 
        if (this.grenadeAmmo > 0 && this.actionTimer <= 0) {
            this.isAimingGrenade = true;
            this.manualTarget = null; 
            this.autoTarget = null;   
            this.isMoving = false;    
            this.isMovingToEngageManualTarget = false; 
            this.grenadeTargetUnit = targetUnit; 
        }
    }

    cancelGrenadeAim() {
        this.isAimingGrenade = false;
        this.isMoving = false; 
        this.grenadeTargetUnit = null;
    }

    confirmThrowGrenade(targetX, targetY) {
        if (!this.isAimingGrenade || this.grenadeAmmo <= 0 || this.actionTimer > 0) {
            return false;
        }
        
        this.grenadeAmmo--;
        this.isAimingGrenade = false; 
        this.grenadeTargetUnit = null;
        this.actionTimer = CONFIG.RACCOON_GRENADE_THROW_COOLDOWN; 
        this.facingAngle = Math.atan2(targetY - this.y, targetX - this.x); 

        const grenade = new GrenadeProjectile(this.x, this.y, targetX, targetY, this.game, this); 
        this.game.addProjectile(grenade);
        this.game.ui.updateSquadPanel(); 
        return true; 
    }
    
    moveToGrenadeRange(enemyTarget) {
        if (!this.isAimingGrenade || !enemyTarget || this.actionTimer > 0) {
            return;
        }

        const preferredThrowRange = CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX * 0.9; 
        const distToEnemy = distance(this.x, this.y, enemyTarget.x, enemyTarget.y);

        if (distToEnemy <= preferredThrowRange) { 
            this.isMoving = false; 
            return;
        }

        const vecXFromTargetToUnit = this.x - enemyTarget.x;
        const vecYFromTargetToUnit = this.y - enemyTarget.y;
        
        if (distToEnemy > 0) {
            this.targetX = enemyTarget.x + (vecXFromTargetToUnit / distToEnemy) * preferredThrowRange;
            this.targetY = enemyTarget.y + (vecYFromTargetToUnit / distToEnemy) * preferredThrowRange;
        } else {
            this.targetX = enemyTarget.x + preferredThrowRange;
            this.targetY = enemyTarget.y;
        }
        this.isMoving = true; 
        this.isMovingToEngageManualTarget = false; 
    }

    render(ctx) {
        super.render(ctx); 
        if (this.isAlive() && this.isAimingGrenade) {
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}