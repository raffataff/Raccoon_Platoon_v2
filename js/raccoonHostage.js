// js/raccoonHostage.js

class RaccoonHostage extends Raccoon {
    constructor(x, y, game, id) {
        const hostageConfig = CONFIG.HOSTAGE_SETTINGS || {};
        
        const tempName = `Hostage ${id.slice(-4)}`;
        const tempFace = (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) ?
                         `${CONFIG.RACCOON_FACE_IMAGE_PATH}${CONFIG.RACCOON_FACE_IMAGES[Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length)]}` :
                         'assets/images/raccoons/default_face.png';

        super(x, y, game, id, tempFace, tempName, 0, "Recruit", 0);

        this.team = 'neutral'; // Initial team
        this.originalColor = hostageConfig.NEUTRAL_COLOR || '#FFD700';
        this.color = this.originalColor;

        this.isRescued = false;
        this.followTarget = null;
        this.hasWeapon = false; // Hostages don't use weapons
        this.weapon = null;

        this.RESCUE_RADIUS = hostageConfig.RESCUE_RADIUS || 60;
        this.FOLLOW_DISTANCE = hostageConfig.FOLLOW_DISTANCE || (this.size * 3.0);
        this.FOLLOW_STOP_DISTANCE_THRESHOLD = this.FOLLOW_DISTANCE * 0.7;
        this.REPATH_TARGET_MOVE_THRESHOLD = this.size * 7.5; 
        this.lastFollowTargetPosition = { x: 0, y: 0 };
        this.minTimeBetweenRepath = 0.25; 
        this.lastRepathTime = 0;          

        const possibleRanks = hostageConfig.POSSIBLE_RANKS_ON_RESCUE || [{ rankName: "Recruit", xpNeeded: 0 }];
        const randomRankEntry = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
        this.assignedRankOnRescue = randomRankEntry.rankName;
        this.assignedXpOnRescue = randomRankEntry.xpNeeded !== undefined ? randomRankEntry.xpNeeded : 0;

        this.spriteScaleFactor = CONFIG.RACCOON_SPRITE_SCALE_FACTOR || 1.0;
        this.canShootWhileMoving = false; // Not applicable as they don't shoot
        this.aiState = 'IDLE_HOSTAGE';
        this.isPlayerDirectFiring = false; // Not applicable

        // --- NEW: Hostage Specific State ---
        this.isHoldingPosition = false; // For the 'K' key command
        // ---
    }

    update(deltaTime) {
        if (!this.isAlive()) {
            this.isMoving = false;
            return;
        }

        this._updateVelocity(deltaTime); // Inherited
        if (this.isPhasing) { // Inherited
            this.phasingTimer -= deltaTime;
            if (this.phasingTimer <= 0) this.isPhasing = false;
        }
        
        // Hostages don't have attack/action/grenade cooldowns in the same way
        // but we can keep these for consistency with base class if needed for other timers.
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
            if (this.isMoving) { 
                this.isMoving = false;
                this.currentPath = [];
            }
            this.currentVisualState = 'idle';
            if (this.facingAngle === undefined) this.facingAngle = Math.PI / 2; 
            this.updateVisualDirection(this.facingAngle);

        } else { // Is rescued
            // --- NEW: Check for holding position ---
            if (this.isHoldingPosition) {
                if (this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
                this.currentVisualState = 'idle'; // Remain idle if holding
            } else { // Not holding position, try to follow
                if (this.followTarget && this.followTarget.isAlive()) {
                    const distToFollowTarget = distance(this.x, this.y, this.followTarget.x, this.followTarget.y);
                    
                    let desiredFollowX = this.followTarget.x;
                    let desiredFollowY = this.followTarget.y;
                    if (distToFollowTarget > 1e-5) {
                        // Aim to be slightly behind the follow target
                        let behindAngle = this.followTarget.facingAngle + Math.PI; 
                        desiredFollowX = this.followTarget.x + Math.cos(behindAngle) * (this.FOLLOW_DISTANCE * 0.8);
                        desiredFollowY = this.followTarget.y + Math.sin(behindAngle) * (this.FOLLOW_DISTANCE * 0.8);
                    }

                    const distToDesiredFollowPoint = distance(this.x, this.y, desiredFollowX, desiredFollowY);

                    if (distToDesiredFollowPoint > this.FOLLOW_DISTANCE * 0.5) { // If too far from ideal follow spot
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
                        this.isMoving = false; // Stop if close enough
                        this.currentPath = [];
                    }
                } else { // No valid follow target, try to find one
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
                    if (!this.followTarget && this.isMoving) { // If still no target, stop.
                        this.isMoving = false;
                        this.currentPath = [];
                    }
                }
            } // End of not holding position

            // Visual state update for rescued hostages
            if (this.isMoving) {
                this._handleMovement(deltaTime); 
                this.currentVisualState = 'walk';
                if (Math.abs(this.lastDeltaX) > 1e-6 || Math.abs(this.lastDeltaY) > 1e-6) {
                    this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
                }
            } else { // Not moving (either holding or close enough to follow target)
                this.currentVisualState = 'idle';
                if (!this.isHoldingPosition && this.followTarget && this.followTarget.isAlive()) {
                    // If following and stopped, face the follow target
                    const angleToFollowTarget = Math.atan2(this.followTarget.y - this.y, this.followTarget.x - this.x);
                    if (distance(this.x, this.y, this.followTarget.x, this.followTarget.y) > 1) { // Avoid rapid spinning if too close
                        this.facingAngle = angleToFollowTarget;
                    }
                }
                // If holding position, facingAngle remains as it was.
            }
            this.updateVisualDirection(this.facingAngle);
            this.gunAimAngle = this.facingAngle; // Hostages don't aim guns, but align this for consistency
        }
    }

    rescue(rescuer) {
        if (this.isRescued) return;

        this.isRescued = true;
        this.team = 'player'; // Now part of the player's "team" for targeting purposes
        this.followTarget = rescuer;
        if (rescuer) { 
            this.lastFollowTargetPosition = { x: rescuer.x, y: rescuer.y };
        }
        this.aiState = 'FOLLOWING_PLAYER'; // More descriptive AI state
        this.color = CONFIG.RACCOON_COLOR; // Change color to player team color
        this.isHoldingPosition = false; // Ensure not holding position on rescue

        console.log(`HOSTAGE DEBUG: Hostage ${this.id} IS NOW RESCUED by ${rescuer?.id || 'unknown'}. isRescued: ${this.isRescued}, Team: ${this.team}`);

        if (this.game.ui && typeof this.game.ui.updateHostageStatus === 'function') {
            this.game.ui.updateHostageStatus(this, true);
        }
        this.currentPath = []; // Clear any previous path
        this.isMoving = false;
        this.lastRepathTime = 0; // Allow immediate pathing on rescue
    }

    // Override setMoveTarget to ensure hostages only move if rescued and not holding
    setMoveTarget(worldX, worldY) {
        if (!this.isAlive() || !this.isRescued || this.isHoldingPosition) {
            this.isMoving = false;
            this.currentPath = [];
            return false;
        }
        // Call the original Unit.setMoveTarget logic
        return Unit.prototype.setMoveTarget.call(this, worldX, worldY);
    }

    // Hostages don't use these Raccoon-specific abilities
    addXp() {}
    incrementKillCount() {}
    checkPromotion() {}
    applyRankBonuses() {} // Base HP is fine
    startGrenadeAim() {}
    cancelGrenadeAim() {}
    confirmThrowGrenade() { return false; }
    moveToGrenadeRange() {}
    checkForAndApplyPickups() {} // Hostages don't pick things up
    _executeFire() {} // Hostages don't fire
    _handlePlayerCombat() {} // Not applicable
    _handleEnemyCombat() {} // Not applicable

    die() {
        const wasRescuedBeforeDeath = this.isRescued;
        // Call Unit's die method first to handle common death logic
        Unit.prototype.die.call(this); 
        
        console.log(`Hostage ${this.id} (${this.name || ''}) has fallen. Was rescued: ${wasRescuedBeforeDeath}`);
        
        // Specific cleanup for hostages
        if (this.game.hostageUnits) {
            const index = this.game.hostageUnits.indexOf(this);
            if (index > -1) {
                this.game.hostageUnits.splice(index, 1);
            }
        }
        
        if (this.game.ui && typeof this.game.ui.updateHostageStatus === 'function') {
            this.game.ui.updateHostageStatus(this, false); // Notify UI they are no longer alive & rescued
        }
        // Mission failure check due to hostage death will be handled in Game.checkMissionStatus
    }

    render(ctx) {
        super.render(ctx); // Use Raccoon's render method

        if (!this.isRescued && this.isAlive()) {
            let playerNear = false;
            if (this.game.deployedSquadRoster) { 
                for (const playerUnit of this.game.deployedSquadRoster) {
                    if (playerUnit.isAlive() && distance(this.x, this.y, playerUnit.x, playerUnit.y) < this.RESCUE_RADIUS * 1.5) {
                        playerNear = true;
                        break;
                    }
                }
            }
            // Visual cue that they can be rescued
            if (playerNear) {
                ctx.fillStyle = "yellow";
                ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("!", this.x, this.y - this.size - 10); // Exclamation mark above head
                ctx.textAlign = "left"; // Reset alignment
            }
        }
    }
}

// Helper function (if not already globally available or in utils.js)
function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}