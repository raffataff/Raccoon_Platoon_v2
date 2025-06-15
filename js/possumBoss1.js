// js/possumBoss1.js

class PossumBoss1 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_BOSS_1_HP, 
              CONFIG.POSSUM_BOSS_1_SPEED, 
              CONFIG.POSSUM_BOSS_1_SIZE, 
              CONFIG.POSSUM_BOSS_1_COLOR, 
              id || `BOSS1-${Date.now().toString(36).slice(-4)}`);

        this.weapon = WEAPONS.POSSUM_BOSS_1_WEAPON; // This will be a grenade launcher type
        this.canShootWhileMoving = false; // Bosses usually stop to fire special weapons
        
        this.bossAIConfig = (CONFIG.AI && CONFIG.AI.POSSUM_BOSS_1) ? CONFIG.AI.POSSUM_BOSS_1 : {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || CONFIG.POSSUM_HEAVY_WEAPON_RANGE || 350; // Use its weapon range or heavy's as default

        this.aiState = 'GUARDING_POST'; // Initial state

        this.guardPost = { x: x, y: y }; // Its spawn point is its guard post
        this.maxChaseDistanceFromPost = (this.weapon.range * (this.bossAIConfig.MAX_CHASE_DISTANCE_FROM_POST_FACTOR || 0.8));
        
        this.preferredEngagementDistance = this.weapon.range * 0.75; // Try to stay at a good grenade lobbing distance
        this.minEngagementDistance = this.weapon.range * 0.4;   // Don't let players get too close easily

        this.chaseDestination = null;
        this.timeSinceLastChaseDestUpdate = 0;
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 2.0;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.GRID_CELL_SIZE) ** 2;
        
        this.grenadeThrowCooldown = 0; // Separate from weapon.rof for grenade ability
        this.GRENADE_THROW_COOLDOWN_BASE = 4.0; // Seconds between grenade throws
        this.GRENADE_THROW_COOLDOWN_RANDOM_ADD = 2.0;

        // XP for killing the boss
        this.xpValue = CONFIG.XP_FOR_BOSS_KILL || 150; // Add this to config if you want specific XP

        if (!this.weapon) {
            console.error("PossumBoss1: Weapon POSSUM_BOSS_1_WEAPON not found in WEAPONS config!");
            // Assign a fallback or handle error
        }
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        if (this.grenadeThrowCooldown > 0) {
            this.grenadeThrowCooldown -= deltaTime;
        }

        // Standard unit updates (velocity, phasing, timers)
        super.update(deltaTime); 
        // AI logic specific to the boss will be called by super.update if we follow the pattern
        // Or, we call it here:
        // this.aiLogicBoss(deltaTime, this.game.deployedSquadRoster, this.game.level.obstacles);
    }
    
    // Override _handleEnemyCombat as the boss uses grenades differently
    _handleEnemyCombat(deltaTime, obstacles) {
        if (this.actionTimer > 0 || !this.weapon) return;
        
        let targetToShoot = this.manualTarget || this.autoTarget;

        if (!targetToShoot || !targetToShoot.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            targetToShoot = this.autoTarget;
            if (!targetToShoot) return;
        }
        
        this.manualTarget = targetToShoot; // Lock on

        const distToTarget = distance(this.x, this.y, targetToShoot.x, targetToShoot.y);
        const losToTarget = hasLineOfSight(this.x, this.y, targetToShoot.x, targetToShoot.y, 
                                           this.game.level.obstacles.filter(o => o.blocksMovement && !o.isDestroyed), 
                                           this.game.level);

        if (losToTarget && distToTarget <= this.weapon.range) {
            if (this.grenadeThrowCooldown <= 0) {
                if (this.isMoving) this.isMoving = false; // Stop to aim/throw grenade
                
                this.gunAimAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                if (!this.isMoving) this.facingAngle = this.gunAimAngle;

                this._executeGrenadeFire(targetToShoot.x, targetToShoot.y); // Special fire method for grenades
                
                this.grenadeThrowCooldown = this.GRENADE_THROW_COOLDOWN_BASE + Math.random() * this.GRENADE_THROW_COOLDOWN_RANDOM_ADD;
                this.actionTimer = 1.0; // Short action timer after throwing
            }
        } else if (distToTarget > this.weapon.range || !losToTarget) {
            // If target is out of range or LOS, AI logic should handle repositioning
            this.aiState = 'CHASING_TARGET'; // Trigger AI to move closer
        }
    }

    // Boss-specific AI Logic (can inherit from PossumHeavy or have its own)
    aiLogic(deltaTime, playerUnitsOnMap, obstacles) { // Renamed from aiLogicBoss to match Unit's call
        let currentTarget = this.manualTarget || this.autoTarget;

        if (this.actionTimer > 0) return;

        if (!currentTarget || !currentTarget.isAlive()) {
            this.manualTarget = null;
            this.findAutoTarget(playerUnitsOnMap, obstacles);
            currentTarget = this.autoTarget;
        }

        if (currentTarget && currentTarget.isAlive()) {
            this.manualTarget = currentTarget; // Lock on
            const distToTarget = distance(this.x, this.y, currentTarget.x, currentTarget.y);

            if (this.aiState === 'GUARDING_POST' || this.aiState === 'SUSPICIOUS') {
                this.propagateAlert(currentTarget); // Alert nearby allies
            }

            if (distToTarget <= this.preferredEngagementDistance && distToTarget >= this.minEngagementDistance) {
                this.aiState = 'ENGAGING_TARGET'; // In good range, _handleEnemyCombat will try to fire
                if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
            } else if (distToTarget < this.minEngagementDistance) {
                this.aiState = 'REPOSITIONING_EVADE'; // Too close, try to back up
                const angleAway = Math.atan2(this.y - currentTarget.y, this.x - currentTarget.x);
                const evadeDist = this.minEngagementDistance * 1.5;
                const targetX = this.x + Math.cos(angleAway) * evadeDist;
                const targetY = this.y + Math.sin(angleAway) * evadeDist;
                this.setMoveTarget(targetX, targetY);
            } else { // Too far or needs to chase
                this.aiState = 'CHASING_TARGET';
            }
        } else { // No target
            this.aiState = 'GUARDING_POST';
            this.manualTarget = null;
        }

        // State-specific movement logic
        switch (this.aiState) {
            case 'GUARDING_POST':
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > (this.bossAIConfig.GUARD_POST_POSITION_TOLERANCE || 5)) {
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                } else if (this.isMoving) {
                    this.isMoving = false;
                }
                break;
            case 'CHASING_TARGET':
                if (currentTarget && currentTarget.isAlive()) {
                    const distToGuard = distance(this.x, this.y, this.guardPost.x, this.guardPost.y);
                    if (distToGuard > this.maxChaseDistanceFromPost) {
                        this.aiState = 'RETURNING_TO_POST';
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    } else {
                        this.setMoveTarget(currentTarget.x, currentTarget.y); // Simple chase for now
                    }
                } else {
                    this.aiState = 'GUARDING_POST';
                }
                break;
            case 'RETURNING_TO_POST':
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) <= (this.bossAIConfig.GUARD_POST_POSITION_TOLERANCE || 5)) {
                    this.aiState = 'GUARDING_POST';
                    if (this.isMoving) this.isMoving = false;
                } else if (!this.isMoving || (this.worldTargetX !== this.guardPost.x || this.worldTargetY !== this.guardPost.y)) {
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                }
                break;
            case 'ENGAGING_TARGET':
            case 'REPOSITIONING_EVADE':
                // Movement handled by distance checks or _handleEnemyCombat stopping movement
                break;
        }
    }
    
    _executeGrenadeFire(targetX, targetY) {
        if (!this.game || !this.weapon) return;
        
        // Create and add grenade projectile
        const grenade = this.game.getGrenadeProjectileFromPool(
            this.x, this.y,
            targetX, targetY, // Target the unit's current position
            this // shooterUnit
        );
        this.game.addProjectile(grenade);

        // Play sound if configured for the weapon
        if (this.weapon.sfxFireKey && this.game.audioManager) {
            const sfxConfig = CONFIG.AUDIO_ASSETS[this.weapon.sfxFireKey];
            if (sfxConfig) {
                this.game.audioManager.play(this.weapon.sfxFireKey, {
                    volume: sfxConfig.defaultVolume,
                    pitchVariation: sfxConfig.pitchVariation
                });
            } else {
                // console.warn(`PossumBoss1: SFX key ${this.weapon.sfxFireKey} not found in AUDIO_ASSETS.`);
            }
        }
    }

    // Override standard _executeFire to prevent normal bullet firing if called by mistake
    _executeFire(pointX, pointY, fireAngle = null) {
        // Boss uses _executeGrenadeFire
        if (CONFIG.DEBUG_LOGGING) console.log("PossumBoss1 _executeFire called, but it should use _executeGrenadeFire.");
    }

    die() {
        super.die(); // Call parent Unit's die method
        // Any boss-specific death logic here (e.g., special explosion, drop unique item)
        if(this.game) {
            // Potentially trigger mission objective completion if this boss was an assassination target
            const assassinateObjective = this.game.currentMissionParams?.objectives.find(obj => 
                obj.type === "ASSASSINATION" && obj.targetUnitId === this.id // Assuming objective stores boss ID
            );
            if (assassinateObjective && !assassinateObjective.isComplete) {
                assassinateObjective.isComplete = true;
                assassinateObjective.currentProgress = 1; // Mark as 1 of 1 completed
                // this.game.ui.updateObjective(); // UI will update in game loop
            }
        }
        console.log(`PossumBoss1 ${this.id} has been defeated!`);
    }
}