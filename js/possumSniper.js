// js/possumSniper.js

class PossumSniper extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_SNIPER_HP, 
              CONFIG.POSSUM_SNIPER_SPEED, 
              CONFIG.POSSUM_SNIPER_SIZE, 
              CONFIG.POSSUM_SNIPER_COLOR, 
              id || `SNPR-${Date.now().toString(36).slice(-4)}`);

        this.deadSpritePathKey = 'POSSUM_SNIPER_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_SNIPER_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_SNIPER_DEAD_SPRITE_SCALE';
        this.spriteBaseName = 'possum_sniper';
        this.spriteScaleFactor = CONFIG.POSSUM_SNIPER_SPRITE_SCALE_FACTOR;
        
        this.weaponName = CONFIG.POSSUM_SNIPER_DEFAULT_WEAPON || 'POSSUM_SNIPER_RIFLE';
        this.canShootWhileMoving = false;
        
        this.sniperAIConfig = CONFIG.AI.POSSUM_SNIPER || {};
        this.detectionRange = this.sniperAIConfig.DETECTION_RANGE;

        this.aiState = 'GUARDING'; // Initial state
        this.guardPost = { x: x, y: y };
        
        this.aimTimer = 0;
        this.laserEffect = null;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;

        // The base Unit.update handles velocity, phasing, and visual direction updates.
        // We override the combat logic with our specialized AI.
        super.update(deltaTime); 
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        if (this.actionTimer > 0) return; // Busy with firing cooldown

        let target = this.manualTarget || this.autoTarget;

        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
            if (!target) {
                this.changeState('GUARDING');
            } else {
                this.manualTarget = target; // Lock on
                this.changeState('AIMING');
            }
        }
        
        switch (this.aiState) {
            case 'GUARDING':
                if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 5) {
                    if (!this.isMoving) {
                        this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                    }
                } else {
                    this.isMoving = false;
                }
                break;

            case 'AIMING':
                this.isMoving = false;
                this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
                this.facingAngle = this.gunAimAngle;

                this.aimTimer -= deltaTime;
                if (this.aimTimer <= 0) {
                    this.changeState('FIRING');
                }
                break;

            case 'FIRING':
                this._executeFire(target.x, target.y, this.gunAimAngle);
                this.actionTimer = this.sniperAIConfig.FIRE_COOLDOWN_SECONDS;
                
                // --- MODIFICATION START ---
                // Correctly reference the level's RNG instance
                if (this.game.level.rng.chance(this.sniperAIConfig.REPOSITION_CHANCE_AFTER_SHOT)) {
                    this.changeState('REPOSITIONING');
                } else {
                    this.changeState('GUARDING');
                }
                // --- MODIFICATION END ---
                break;

            case 'REPOSITIONING':
                if (!this.isMoving) {
                    const minD = this.sniperAIConfig.REPOSITION_MIN_DISTANCE;
                    const maxD = this.sniperAIConfig.REPOSITION_MAX_DISTANCE;
                    let newX, newY, attempts = 0;
                    
                    do {
                        // --- MODIFICATION START ---
                        // Correctly reference the level's RNG instance
                        const angle = this.game.level.rng.nextFloat(0, Math.PI * 2);
                        const dist = this.game.level.rng.nextFloat(minD, maxD);
                        // --- MODIFICATION END ---
                        newX = this.guardPost.x + Math.cos(angle) * dist;
                        newY = this.guardPost.y + Math.sin(angle) * dist;
                        attempts++;
                    } while (!this.game.level.isSpawnPointClear(newX, newY, this.size, obstacles) && attempts < 10);
                    
                    this.guardPost = { x: newX, y: newY };
                    this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                } else {
                    if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) < 10) {
                        this.changeState('GUARDING');
                    }
                }
                break;
        }
    }

    changeState(newState) {
        if (this.aiState === newState) return;

        if (this.aiState === 'AIMING' && this.laserEffect) {
            this.laserEffect.isMarkedForDeletion = true;
            this.laserEffect = null;
        }

        this.aiState = newState;

        if (this.aiState === 'AIMING') {
            this.aimTimer = this.sniperAIConfig.SETUP_TIME_SECONDS;
            this.laserEffect = new LaserSightEffect(this, this.manualTarget);
            this.game.addVisualEffect(this.laserEffect);
        } else if (this.aiState === 'GUARDING') {
            this.manualTarget = null;
            this.autoTarget = null;
        }
    }

    die() {
        if (this.laserEffect) {
            this.laserEffect.isMarkedForDeletion = true;
            this.laserEffect = null;
        }
        super.die();
    }
}