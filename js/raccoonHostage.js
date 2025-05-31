// js/raccoonHostage.js

class RaccoonHostage extends Raccoon { // MODIFIED: Extends Raccoon
    constructor(x, y, game, id) {
        const hostageConfig = CONFIG.HOSTAGE_SETTINGS || {};
        
        // Create a temporary unique name for the Raccoon constructor, can be refined
        const tempName = `Hostage ${id.slice(-4)}`; 
        const tempFace = (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) ? 
                         `${CONFIG.RACCOON_FACE_IMAGE_PATH}${CONFIG.RACCOON_FACE_IMAGES[Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length)]}` : 
                         'assets/images/raccoons/default_face.png';

        // Call Raccoon constructor. XP, Rank will be overridden later by assignedRankOnRescue.
        super(x, y, game, id, tempFace, tempName, 0, "Recruit", 0);

        this.team = 'neutral'; // Override team to neutral initially
        this.originalColor = hostageConfig.NEUTRAL_COLOR || '#FFD700'; // Store for unrescued state
        this.color = this.originalColor; // Set initial color

        this.isRescued = false;
        this.followTarget = null;
        this.hasWeapon = false;
        this.weapon = null; // Explicitly nullify weapon inherited from Raccoon

        this.RESCUE_RADIUS = hostageConfig.RESCUE_RADIUS || 50;
        this.FOLLOW_DISTANCE = hostageConfig.FOLLOW_DISTANCE || (this.size * 2.5);
        this.FOLLOW_LERP_SPEED = hostageConfig.FOLLOW_LERP_SPEED || 0.04;

        const possibleRanks = hostageConfig.POSSIBLE_RANKS_ON_RESCUE || [{ rankName: "Recruit", xpNeeded: 0 }];
        const randomRankEntry = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
        this.assignedRankOnRescue = randomRankEntry.rankName;
        this.assignedXpOnRescue = randomRankEntry.xpNeeded !== undefined ? randomRankEntry.xpNeeded : 0;

        // spriteBaseName is inherited as 'raccoon' from Raccoon class
        // Raccoon's constructor will set spriteScaleFactor from CONFIG.RACCOON_SPRITE_SCALE_FACTOR
        this.canShootWhileMoving = false;
        this.aiState = 'IDLE_HOSTAGE';
        this.isPlayerDirectFiring = false; // Ensure this is false for hostages
    }

    update(deltaTime) {
        if (!this.isAlive()) {
            this.isMoving = false;
            return;
        }

        // Call Raccoon's update, but it will handle movement and its own combat logic.
        // We need to be careful here. Hostages shouldn't use Raccoon's combat logic.
        // Let's call Unit's update for basic things, then our specific logic.
        
        // Basic updates from Unit (velocity, phasing - if hostages ever phase)
        this._updateVelocity(deltaTime);
        if (this.isPhasing) {
            this.phasingTimer -= deltaTime;
            if (this.phasingTimer <= 0) this.isPhasing = false;
        }
        // No call to Raccoon's full update as that includes combat.
        // Hostages have their own movement logic when rescued.

        if (this.attackCooldown > 0) { // Ensure attack cooldown (inherited) ticks down
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }
        if (this.actionTimer > 0) { // Ensure action timer (inherited) ticks down
            this.actionTimer -= deltaTime;
            if (this.actionTimer < 0) this.actionTimer = 0;
        }
        if (this.grenadeCooldownTimer > 0) { // Ensure grenade cooldown (inherited) ticks down
            this.grenadeCooldownTimer -= deltaTime;
            if (this.grenadeCooldownTimer < 0) this.grenadeCooldownTimer = 0;
        }


        if (!this.isRescued) {
            for (const playerUnit of this.game.deployedSquadRoster) {
                if (playerUnit.isAlive() && distance(this.x, this.y, playerUnit.x, playerUnit.y) < this.RESCUE_RADIUS) {
                    this.rescue(playerUnit);
                    break;
                }
            }
             // If not rescued, they don't move based on pathfinding.
             // Their facingAngle might just stay as is or be random. Let's set it to default 's'
            if (!this.isMoving) { // If they were somehow moving, stop it.
                this.currentPath = [];
            }
            this.updateVisualDirection(Math.PI / 2); // Face South
            this.currentVisualState = 'idle'; // Stay idle


        } else { // Is rescued
            if (this.followTarget && this.followTarget.isAlive()) {
                const distToFollowTarget = distance(this.x, this.y, this.followTarget.x, this.followTarget.y);
                
                if (distToFollowTarget > this.FOLLOW_DISTANCE) {
                    const angleToTarget = Math.atan2(this.followTarget.y - this.y, this.followTarget.x - this.x);
                    const targetX = this.followTarget.x - Math.cos(angleToTarget) * (this.FOLLOW_DISTANCE * 0.8);
                    const targetY = this.followTarget.y - Math.sin(angleToTarget) * (this.FOLLOW_DISTANCE * 0.8);
                    
                    if (!this.isMoving || distance(this.worldTargetX, this.worldTargetY, targetX, targetY) > this.size * 0.5) {
                         this.setMoveTarget(targetX, targetY);
                    }
                } else if (distToFollowTarget < this.FOLLOW_DISTANCE * 0.7 && this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
            } else {
                let closestPlayer = null;
                let minDistSq = Infinity;
                for (const playerUnit of this.game.deployedSquadRoster) {
                    if (playerUnit.isAlive()) {
                        const dSq = distanceSq(this.x, this.y, playerUnit.x, playerUnit.y);
                        if (dSq < minDistSq) {
                            minDistSq = dSq;
                            closestPlayer = playerUnit;
                        }
                    }
                }
                this.followTarget = closestPlayer;
                if (!this.followTarget && this.isMoving) {
                    this.isMoving = false;
                    this.currentPath = [];
                }
            }
            // Movement handling for rescued hostages (if they have a path)
            if (this.isMoving) {
                this._handleMovement(deltaTime); // Use Unit's movement execution
            }

            // Visual state for rescued hostages
            if (this.isMoving) {
                this.currentVisualState = 'walk';
                if (Math.abs(this.lastDeltaX) > 1e-5 || Math.abs(this.lastDeltaY) > 1e-5) {
                    this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
                }
            } else {
                this.currentVisualState = 'idle';
                // Optionally, face the followTarget if idle and rescued
                if (this.followTarget && this.followTarget.isAlive()) {
                    this.facingAngle = Math.atan2(this.followTarget.y - this.y, this.followTarget.x - this.x);
                }
            }
            this.updateVisualDirection(this.facingAngle);
            this.gunAimAngle = this.facingAngle; // Align gun with body as they don't shoot
        }
    }

    rescue(rescuer) {
        if (this.isRescued) return;

        this.isRescued = true;
        this.team = 'player';
        this.followTarget = rescuer;
        this.aiState = 'FOLLOWING_PLAYER';
        this.color = CONFIG.RACCOON_COLOR; // Change to standard Raccoon color upon rescue
        console.log(`HOSTAGE DEBUG: Hostage ${this.id} IS NOW RESCUED by ${rescuer.id}. isRescued: ${this.isRescued}, Team: ${this.team}`);

        if (this.game.ui && typeof this.game.ui.updateHostageStatus === 'function') {
            this.game.ui.updateHostageStatus(this, true);
        }
        this.currentPath = [];
        this.isMoving = false;
    }

    setMoveTarget(worldX, worldY) {
        if (!this.isAlive() || !this.isRescued) {
            this.isMoving = false;
            this.currentPath = [];
            return false;
        }
        this.isPlayerDirectFiring = false;
        // Call Unit's setMoveTarget, not Raccoon's, to avoid Raccoon-specific logic like clearing manualTarget
        return Unit.prototype.setMoveTarget.call(this, worldX, worldY);
    }

    // Override Raccoon methods that hostages shouldn't use
    addXp() {}
    incrementKillCount() {}
    checkPromotion() {}
    applyRankBonuses() {
        // Hostages get their rank/stats when added to roster, not during mission
    }
    startGrenadeAim() {}
    cancelGrenadeAim() {}
    confirmThrowGrenade() { return false; }
    moveToGrenadeRange() {}
    checkForAndApplyPickups() {} // Hostages don't pick up items
    _executeFire() {}           // Hostages don't fire
    _handlePlayerCombat() {}    // Hostages don't engage in player-like combat AI
    _handleEnemyCombat() {}     // Hostages don't have enemy AI

    die() {
        const wasRescued = this.isRescued;
        // Call Unit's die method directly to bypass Raccoon's die if it has specific logic we don't want
        Unit.prototype.die.call(this);
        console.log(`Hostage ${this.id} (${this.name || ''}) has fallen. Was rescued: ${wasRescued}`);
        if (this.game.ui && typeof this.game.ui.updateHostageStatus === 'function') {
            this.game.ui.updateHostageStatus(this, false);
        }
        if(this.game.hostageUnits) {
            this.game.hostageUnits = this.game.hostageUnits.filter(h => h !== this);
        }
    }

    render(ctx) {
        // The color is set in constructor (neutral) and rescue() (player team color)
        // The spriteBaseName is 'raccoon' from Raccoon class.
        // The Unit.render() method will use this.spriteBaseName and CONFIG.RACCOON_SPRITE_SCALE_FACTOR.
        Unit.prototype.render.call(this, ctx); // Explicitly call Unit's render

        if (!this.isRescued && this.isAlive()) {
            let playerNear = false;
            for (const playerUnit of this.game.deployedSquadRoster) {
                if (playerUnit.isAlive() && distance(this.x, this.y, playerUnit.x, playerUnit.y) < this.RESCUE_RADIUS * 1.5) {
                    playerNear = true;
                    break;
                }
            }
            if (playerNear) {
                ctx.fillStyle = "yellow";
                ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("!", this.x, this.y - this.size - 10);
                ctx.textAlign = "left";
            }
        }
    }
}

function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}