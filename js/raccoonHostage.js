// js/raccoonHostage.js

class RaccoonHostage extends Raccoon {
    constructor(x, y, game, id) {
        const hostageConfig = CONFIG.HOSTAGE_SETTINGS || {};
        
        const tempName = `Hostage ${id.slice(-4)}`;
        const tempFace = (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) ?
                         `${CONFIG.RACCOON_FACE_IMAGE_PATH}${CONFIG.RACCOON_FACE_IMAGES[Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length)]}` :
                         'assets/images/raccoons/default_face.png';

        super(x, y, game, id, tempFace, tempName, 0, "Recruit", 0);

        this.deadSpritePathKey = 'RACCOON_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'RACCOON_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'RACCOON_DEAD_SPRITE_SCALE';

        this.team = 'neutral'; 
        this.originalColor = hostageConfig.NEUTRAL_COLOR || '#FFD700';
        this.color = this.originalColor;

        this.isRescued = false;
        this.followTarget = null;
        this.hasWeapon = false; 
        this.weapon = null;

        this.RESCUE_RADIUS = hostageConfig.RESCUE_RADIUS || 60;
        this.FOLLOW_DISTANCE = hostageConfig.FOLLOW_DISTANCE || (this.size * 3.0);
        this.FOLLOW_STOP_DISTANCE_THRESHOLD = this.FOLLOW_DISTANCE * 0.7;
        this.REPATH_TARGET_MOVE_THRESHOLD = this.size * 7.5; 
        this.minTimeBetweenRepath = 0.25; 
        this.lastRepathTime = 0;          

        const possibleRanks = hostageConfig.POSSIBLE_RANKS_ON_RESCUE || [{ rankName: "Recruit", xpNeeded: 0, weight: 1 }];
        const totalWeight = possibleRanks.reduce((sum, r) => sum + (r.weight || 1), 0);
        let randomVal = Math.random() * totalWeight;
        let randomRankEntry = possibleRanks[0];
        for (const rank of possibleRanks) {
            randomVal -= (rank.weight || 1);
            if (randomVal <= 0) {
                randomRankEntry = rank;
                break;
            }
        }
        this.assignedRankOnRescue = randomRankEntry.rankName;
        this.assignedXpOnRescue = randomRankEntry.xpNeeded !== undefined ? randomRankEntry.xpNeeded : 0;

        this.spriteScaleFactor = CONFIG.RACCOON_SPRITE_SCALE_FACTOR || 0.5;
        this.canShootWhileMoving = false; 
        this.aiState = 'IDLE_HOSTAGE';
        this.isPlayerDirectFiring = false; 
        this.isHoldingPosition = false; 

        this.hostageSpritePath = 'assets/images/units/raccoon/hostage/';
        this.unrescuedKneelingSprite = null;
        this.unrescuedKneelingSpriteDirection = 's';

        this.helpTextConfig = CONFIG.VISUAL_EFFECTS.HOSTAGE_HELP_TEXT || {};
        this.helpTextTimer = (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0) + Math.random() * ((this.helpTextConfig.INTERVAL_MAX_SECONDS || 9.0) - (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0));

        if (!this.isRescued) {
            const kneelingSprites = ['hostage_kneeling_s.png', 'hostage_kneeling_sw.png', 'hostage_kneeling_se.png'];
            const randomSpriteFile = kneelingSprites[Math.floor(Math.random() * kneelingSprites.length)];
            this.unrescuedKneelingSprite = this.game.preloadedImages[this.hostageSpritePath + randomSpriteFile];
            
            if (randomSpriteFile.includes('_sw')) {
                this.unrescuedKneelingSpriteDirection = 'sw';
            } else if (randomSpriteFile.includes('_se')) {
                this.unrescuedKneelingSpriteDirection = 'se';
            } else {
                this.unrescuedKneelingSpriteDirection = 's';
            }
            this.facingAngle = this.getAngleFromDirection(this.unrescuedKneelingSpriteDirection);
            this.currentVisualState = 'idle_hostage_kneeling';
        }
    }

    getAngleFromDirection(dirStr) {
        switch (dirStr) {
            case 's': return Math.PI / 2;
            case 'sw': return 3 * Math.PI / 4;
            case 'se': return Math.PI / 4;
            case 'n': return -Math.PI / 2;
            case 'nw': return -3 * Math.PI / 4;
            case 'ne': return -Math.PI / 4;
            case 'w': return Math.PI;
            case 'e': return 0;
            default: return Math.PI / 2;
        }
    }

    update(deltaTime) {
        if (!this.isAlive()) {
            this.isMoving = false;
            return;
        }

        this._updateVelocity(deltaTime); 
        if (this.isPhasing) { 
            this.phasingTimer -= deltaTime;
            if (this.phasingTimer <= 0) this.isPhasing = false;
        }
        
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.actionTimer > 0) this.actionTimer -= deltaTime;
        if (this.grenadeCooldownTimer > 0) this.grenadeCooldownTimer -= deltaTime;

        const currentTime = this.game.lastTime / 1000; 

        if (!this.isRescued) {
            for (const playerUnit of this.game.deployedSquadRoster) {
                if (playerUnit.isAlive() && distance(this.x, this.y, playerUnit.x, playerUnit.y) < this.RESCUE_RADIUS) {
                    this.rescue(playerUnit);
                    break;
                }
            }

            this.helpTextTimer -= deltaTime;
            if (this.helpTextTimer <= 0) {
                if (this.game && typeof this.game.addVisualEffect === 'function') {
                    this.game.addVisualEffect('help_text', { parentUnit: this });
                }
                this.helpTextTimer = (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0) + Math.random() * ((this.helpTextConfig.INTERVAL_MAX_SECONDS || 9.0) - (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0));
            }

            if (this.isMoving) { 
                this.isMoving = false;
                this.currentPath = [];
            }
            this.currentVisualState = 'idle_hostage_kneeling';
            this.updateVisualDirection(this.facingAngle);

        } else { // Is rescued
            super.update(deltaTime);
            
            if (this.isPhasing) {
                return;
            }

            if (!this.isHoldingPosition) {
                 if (this.followTarget && this.followTarget.isAlive()) {
                    const distToFollowTarget = distance(this.x, this.y, this.followTarget.x, this.followTarget.y);
                    
                    let desiredFollowX = this.followTarget.x;
                    let desiredFollowY = this.followTarget.y;
                    if (distToFollowTarget > 1e-5) {
                        let behindAngle = this.followTarget.facingAngle + Math.PI; 
                        desiredFollowX = this.followTarget.x + Math.cos(behindAngle) * (this.FOLLOW_DISTANCE * 0.8);
                        desiredFollowY = this.followTarget.y + Math.sin(behindAngle) * (this.FOLLOW_DISTANCE * 0.8);
                    }

                    const distToDesiredFollowPoint = distance(this.x, this.y, desiredFollowX, desiredFollowY);

                    if (distToDesiredFollowPoint > this.FOLLOW_DISTANCE * 0.5) { 
                        const targetMovedSignificantly = distance(this.followTarget.x, this.followTarget.y, this.lastFollowTargetPosition.x, this.lastFollowTargetPosition.y) > this.REPATH_TARGET_MOVE_THRESHOLD;
                        const currentPathTargetOutdated = this.isMoving && this.currentPath.length > 0 && distance(this.worldTargetX, this.worldTargetY, desiredFollowX, desiredFollowY) > this.REPATH_TARGET_MOVE_THRESHOLD;
                        const canRepathNow = (currentTime - this.lastRepathTime) > this.minTimeBetweenRepath;

                        if (canRepathNow && (!this.isMoving || (this.currentPath.length === 0 && this.currentPathNodeIndex === 0) || targetMovedSignificantly || currentPathTargetOutdated)) {
                            if (this.setMoveTarget(desiredFollowX, desiredFollowY)) {
                                this.lastFollowTargetPosition.x = this.followTarget.x;
                                this.lastFollowTargetPosition.y = this.followTarget.y;
                                this.lastRepathTime = currentTime;
                            }
                        }
                    } else if (distToDesiredFollowPoint < this.FOLLOW_STOP_DISTANCE_THRESHOLD && this.isMoving) {
                        this.isMoving = false; 
                        this.currentPath = [];
                    }
                } else { 
                    let closestPlayer = null;
                    let minDistSq = Infinity;
                    if (this.game.deployedSquadRoster) {
                        for (const playerUnit of this.game.deployedSquadRoster) {
                            if (playerUnit.isAlive()) {
                                const dSq = distanceSq(this.x, this.y, playerUnit.x, playerUnit.y);
                                if (dSq < minDistSq) {
                                    minDistSq = dSq;
                                    closestPlayer = playerUnit;
                                }
                            }
                        }
                    }
                    this.followTarget = closestPlayer;
                    if (!this.followTarget && this.isMoving) { 
                        this.isMoving = false;
                        this.currentPath = [];
                    }
                }
            } else { 
                if (this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
            }
        }
    }

    rescue(rescuer) {
        if (this.isRescued) return;

        this.isRescued = true;
        this.team = 'player'; 
        this.followTarget = rescuer;
        if (rescuer) { 
            this.lastFollowTargetPosition = { x: rescuer.x, y: rescuer.y };
        }
        this.aiState = 'FOLLOWING_PLAYER'; 
        this.color = CONFIG.RACCOON_COLOR; 
        this.isHoldingPosition = false; 
        this.spriteBaseName = 'raccoon_hostage'; 
        this.currentVisualState = 'idle';

//        console.log(`HOSTAGE DEBUG: Hostage ${this.id} IS NOW RESCUED by ${rescuer?.id || 'unknown'}. isRescued: ${this.isRescued}, Team: ${this.team}`);

        if (this.game.ui && typeof this.game.ui.updateHostageStatus === 'function') {
            this.game.ui.updateHostageStatus(this, true);
        }
        this.currentPath = []; 
        this.isMoving = false;
        this.lastRepathTime = 0; 
    }

    setMoveTarget(worldX, worldY) {
        if (!this.isAlive() || !this.isRescued || this.isHoldingPosition) {
            this.isMoving = false;
            this.currentPath = [];
            return false;
        }
        return Unit.prototype.setMoveTarget.call(this, worldX, worldY, this.isPhasing);
    }

    addXp() {}
    incrementKillCount() {}
    checkPromotion() {}
    applyRankBonuses() {} 
    startGrenadeAim() {}
    cancelGrenadeAim() {}
    confirmThrowGrenade() { return false; }
    moveToGrenadeRange() {}
    checkForAndApplyPickups() {} 
    _executeFire() {} 
    _handlePlayerCombat() {} 
    _handleEnemyCombat() {} 

    render(ctx) {
        if (!this.isRescued && this.isAlive() && this.unrescuedKneelingSprite) {
            ctx.save();
            ctx.translate(this.x, this.y);
            const sprite = this.unrescuedKneelingSprite;
            const scale = this.spriteScaleFactor;
            const sWidth = sprite.naturalWidth * scale;
            const sHeight = sprite.naturalHeight * scale;
            ctx.drawImage(sprite, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
            
            let playerNear = false;
            if (this.game.deployedSquadRoster) { 
                for (const playerUnit of this.game.deployedSquadRoster) {
                    if (playerUnit.isAlive() && distance(this.x, this.y, playerUnit.x, playerUnit.y) < this.RESCUE_RADIUS * 1.5) {
                        playerNear = true; break;
                    }
                }
            }
            if (playerNear) {
                ctx.fillStyle = "yellow"; ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("!", 0, -this.size - 10 - sHeight/2 + this.size/2);
                ctx.textAlign = "left"; 
            }
            ctx.restore();
        } else {
            super.render(ctx); 
        }
    }
}

function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}