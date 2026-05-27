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
        this.minTimeBetweenRepath = 0.85; 
        this.lastRepathTime = Math.random() * this.minTimeBetweenRepath;
        this.stuckFrames = 0;
        this.lastStuckCheckX = 0;
        this.lastStuckCheckY = 0;

        this.followSpreadSeed = this._hashIdToSpread(id);

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

    _hashIdToSpread(id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return ((Math.abs(hash) % 1000) / 1000);
    }

    _getFollowSpreadOffset(followTarget) {
        const arcSpan = Math.PI * 0.7;
        const baseAngle = followTarget.facingAngle + Math.PI;
        const spreadAngle = baseAngle + (this.followSpreadSeed - 0.5) * arcSpan;
        const spreadDist = this.FOLLOW_DISTANCE * (0.6 + this.followSpreadSeed * 1.6);
        return {
            x: followTarget.x + Math.cos(spreadAngle) * spreadDist,
            y: followTarget.y + Math.sin(spreadAngle) * spreadDist
        };
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
                if (this.game && this.game.trySpeech) {
                    this.game.trySpeech(this, 'CAPTURED');
                }
                this.helpTextTimer = (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0) + Math.random() * ((this.helpTextConfig.INTERVAL_MAX_SECONDS || 9.0) - (this.helpTextConfig.INTERVAL_MIN_SECONDS || 4.0));
            }

            if (this.isMoving) { 
                this.isMoving = false;
                this.currentPath = [];
            }
            this.currentVisualState = 'idle_hostage_kneeling';
            this.updateVisualDirection(this.facingAngle);

        } else {
            const wasPhasing = this.isPhasing;
            super.update(deltaTime);
            const phasingJustEnded = wasPhasing && !this.isPhasing;

            if (!this.isHoldingPosition) {
                 if (this.followTarget && this.followTarget.isAlive()) {
                    const spreadOffset = this._getFollowSpreadOffset(this.followTarget);
                    const desiredFollowX = spreadOffset.x;
                    const desiredFollowY = spreadOffset.y;

                    const distToDesiredFollowPoint = distance(this.x, this.y, desiredFollowX, desiredFollowY);

                    if (this.isMoving) {
                        const movedDist = Math.hypot(this.x - this.lastStuckCheckX, this.y - this.lastStuckCheckY);
                        if (movedDist < this.size * 0.1) {
                            this.stuckFrames++;
                        } else {
                            this.stuckFrames = 0;
                        }
                    }
                    this.lastStuckCheckX = this.x;
                    this.lastStuckCheckY = this.y;

                    const isStuck = this.stuckFrames > 30;
                    const severelyStuck = this.stuckFrames > 60;

                    if (severelyStuck) {
                        this.stuckFrames = 0;
                        this.currentPath = [];
                        this.isMoving = true;
                        if (this.setMoveTarget(desiredFollowX, desiredFollowY)) {
                            this.lastFollowTargetPosition.x = this.followTarget.x;
                            this.lastFollowTargetPosition.y = this.followTarget.y;
                            this.lastRepathTime = currentTime;
                        }
                    } else if (distToDesiredFollowPoint > this.FOLLOW_DISTANCE * 0.5 || isStuck) {
                        const targetMoved = distance(this.followTarget.x, this.followTarget.y, this.lastFollowTargetPosition.x, this.lastFollowTargetPosition.y) > this.REPATH_TARGET_MOVE_THRESHOLD;
                        const pathOutdated = this.isMoving && this.currentPath.length > 0 && distance(this.worldTargetX, this.worldTargetY, desiredFollowX, desiredFollowY) > this.REPATH_TARGET_MOVE_THRESHOLD;
                        const needsRepath = !this.isMoving || pathOutdated || isStuck;
                        const effectiveCooldown = isStuck ? 0.1 : this.minTimeBetweenRepath;

                        if (needsRepath && (targetMoved || phasingJustEnded || isStuck) && (currentTime - this.lastRepathTime) > effectiveCooldown) {
                            if (this.setMoveTarget(desiredFollowX, desiredFollowY)) {
                                this.lastFollowTargetPosition.x = this.followTarget.x;
                                this.lastFollowTargetPosition.y = this.followTarget.y;
                                this.lastRepathTime = currentTime;
                                this.stuckFrames = 0;
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
        if (this.game && this.game.trySpeech) {
            this.game.trySpeech(this, 'ON_RESCUE');
        }
        if (rescuer) { 
            this.lastFollowTargetPosition = { x: rescuer.x, y: rescuer.y };
        }
        this.aiState = 'FOLLOWING_PLAYER'; 
        this.color = CONFIG.RACCOON_COLOR; 
        this.isHoldingPosition = false; 
        this.spriteBaseName = 'raccoon_hostage'; 
        this.currentVisualState = 'idle';

        // Phase the hostage briefly after rescue to prevent getting stuck on nearby obstacles
        const hostageConfig = CONFIG.HOSTAGE_SETTINGS || {};
        const rescuePhasingDuration = hostageConfig.RESCUE_PHASING_DURATION !== undefined ? hostageConfig.RESCUE_PHASING_DURATION : 1.5;
        if (rescuePhasingDuration > 0) {
            this.isPhasing = true;
            this.phasingTimer = rescuePhasingDuration;
        }

        // If hostage is on a blocked cell, move to the nearest walkable cell
        if (this.game && this.game.level) {
            const navGrid = this.game.level.getNavigationGrid();
            if (navGrid) {
                const grid = this.game.level.worldToGridCoords(this.x, this.y);
                if (grid.x < 0 || grid.x >= this.game.level.gridWidth ||
                    grid.y < 0 || grid.y >= this.game.level.gridHeight ||
                    navGrid[grid.y][grid.x] === 1) {
                    let found = false;
                    for (let r = 1; r <= 10 && !found; r++) {
                        for (let dy = -r; dy <= r && !found; dy++) {
                            for (let dx = -r; dx <= r && !found; dx++) {
                                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                                const cx = grid.x + dx;
                                const cy = grid.y + dy;
                                if (cx >= 0 && cx < this.game.level.gridWidth &&
                                    cy >= 0 && cy < this.game.level.gridHeight &&
                                    navGrid[cy][cx] === 0) {
                                    const worldPos = this.game.level.gridToWorldCoords(cx, cy);
                                    this.x = worldPos.x;
                                    this.y = worldPos.y;
                                    found = true;
                                }
                            }
                        }
                    }
                }
            }
        }

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
        return Unit.prototype.setMoveTarget.call(this, worldX, worldY);
    }


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