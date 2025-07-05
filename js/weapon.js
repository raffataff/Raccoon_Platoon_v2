class Weapon {
    constructor(name, damage, rof, range, projectileSpeed, projectileColor,
                accuracyStationary, accuracyMoving = accuracyStationary * 0.75, sfxFireKey = null, muzzleFlashScale = 1.0) { // Added muzzleFlashScale
        this.name = name;
        this.damage = damage;
        this.rof = rof;
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.projectileColor = projectileColor;
        this.accuracyStationary = accuracyStationary;
        this.accuracyMoving = accuracyMoving;
        this.sfxFireKey = sfxFireKey;
        this.muzzleFlashScale = muzzleFlashScale; // Store the new property
    }
}

const WEAPONS = {
    RACCOON_MACHINE_GUN: new Weapon(
        'Raccoon MG',
        CONFIG.RACCOON_MG_DAMAGE, CONFIG.RACCOON_MG_ROF, CONFIG.RACCOON_MG_RANGE,
        CONFIG.RACCOON_MG_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_RACCOON,
        CONFIG.RACCOON_MG_ACCURACY_STATIONARY, CONFIG.RACCOON_MG_ACCURACY_MOVING,
        'RACCOON_MG_FIRE',
        1.0 // Standard muzzle flash size
    ),
    POSSUM_RIFLE: new Weapon(
        'Possum Rifle',
        CONFIG.POSSUM_RIFLE_DAMAGE, CONFIG.POSSUM_RIFLE_ROF, CONFIG.POSSUM_RIFLE_RANGE,
        CONFIG.POSSUM_RIFLE_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_POSSUM,
        CONFIG.POSSUM_RIFLE_ACCURACY_STATIONARY, CONFIG.POSSUM_RIFLE_ACCURACY_MOVING,
        'POSSUM_RIFLE_FIRE',
        0.9 // Slightly smaller flash
    ),
    POSSUM_HEAVY_WEAPON: new Weapon(
        'Possum Heavy MG',
        CONFIG.POSSUM_HEAVY_WEAPON_DAMAGE, CONFIG.POSSUM_HEAVY_WEAPON_ROF, CONFIG.POSSUM_HEAVY_WEAPON_RANGE,
        CONFIG.POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_POSSUM_HEAVY,
        CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY, CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_MOVING,
        'POSSUM_HEAVY_MG_FIRE',
        1.5 // Larger muzzle flash
    ),
    POSSUM_BOSS_1_WEAPON: new Weapon(
        'Possum Boss 1 Grenade Launcher',
        CONFIG.POSSUM_BOSS_1_WEAPON_DAMAGE, CONFIG.POSSUM_BOSS_1_WEAPON_ROF, CONFIG.POSSUM_BOSS_1_WEAPON_RANGE,
        CONFIG.POSSUM_BOSS_1_WEAPON_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_POSSUM_BOSS_1,
        CONFIG.POSSUM_BOSS_1_WEAPON_ACCURACY_STATIONARY, CONFIG.POSSUM_BOSS_1_WEAPON_ACCURACY_MOVING,
        'POSSUM_BOSS_1_WEAPON_FIRE',
        1.8 // Large grenade launcher flash
    ),
    POSSUM_BOSS_1_SECONDARY: new Weapon(
        'Possum Boss 1 Heavy Repeater',
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.DAMAGE,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.ROF,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.RANGE,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.PROJECTILE_SPEED,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.PROJECTILE_COLOR,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.ACCURACY_STATIONARY,
        CONFIG.POSSUM_BOSS_1_SECONDARY_WEAPON.ACCURACY_MOVING,
        'POSSUM_HEAVY_MG_FIRE',
        1.3 // Boss's MG has a respectable flash
    ),
    POSSUM_SNIPER_RIFLE: new Weapon(
        'Possum Sniper Rifle',
        CONFIG.POSSUM_SNIPER_RIFLE_DAMAGE,
        CONFIG.POSSUM_SNIPER_RIFLE_ROF,
        CONFIG.POSSUM_SNIPER_RIFLE_RANGE,
        CONFIG.POSSUM_SNIPER_RIFLE_PROJECTILE_SPEED,
        CONFIG.PROJECTILE_COLOR_POSSUM_SNIPER,
        CONFIG.POSSUM_SNIPER_RIFLE_ACCURACY, // Same accuracy for stationary and moving
        CONFIG.POSSUM_SNIPER_RIFLE_ACCURACY,
        'POSSUM_HEAVY_MG_FIRE', // Using the same sound as heavy MG for now
        1.2 // Muzzle flash scale
    )
};

class Projectile {
    constructor(startX, startY, targetX, targetY, damage, speed, color, game, shooterUnit, effectiveAccuracy) {
        // --- POOLING NOTE: This constructor is primarily for pool creation. ---
        // --- Actual initialization happens in reset() for pooled objects. ---
        this.game = game; // Game instance needed early by SpatialGrid
        this._spatialGridCells = new Set();
        this._pooled = false; // Will be set by ObjectPool if created by it
        this.isActiveInPool = false; // Will be set by ObjectPool

        this.reset(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy);
    }

    reset(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        // this.game = game; // Already set in constructor if pooled, or passed if not
        this.shooterUnit = shooterUnit;
        this.shooterTeam = shooterUnit ? shooterUnit.team : null;
        this.effectiveAccuracy = effectiveAccuracy;
        this.size = CONFIG.PROJECTILE_SIZE || 2;

        const bulletConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.BULLET) ? CONFIG.PROJECTILES.BULLET : {};

        let actualTargetX = targetX;
        let actualTargetY = targetY;

        if (Math.random() > this.effectiveAccuracy) {
            const distToTarget = distance(startX, startY, targetX, targetY);
            const angleToTarget = Math.atan2(targetY - startY, targetX - startX);
            const maxAngleOffset = (1.0 - this.effectiveAccuracy) * (bulletConfig.MAX_SPREAD_ANGLE_RADIANS || Math.PI / 6);
            const angleOffset = (Math.random() - 0.5) * 2 * maxAngleOffset;
            const finalAngle = angleToTarget + angleOffset;
            actualTargetX = startX + Math.cos(finalAngle) * distToTarget;
            actualTargetY = startY + Math.sin(finalAngle) * distToTarget;
        }

        const dx = actualTargetX - this.x;
        const dy = actualTargetY - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.velocityX = (dx / dist) * this.speed;
        this.velocityY = (dy / dist) * this.speed;

        this.isMarkedForDeletion = false;
        this.lifetime = bulletConfig.LIFETIME || 1.5;
        
        // Ensure spatial grid cells are cleared if it's being reused
        if (this._spatialGridCells) this._spatialGridCells.clear();
        else this._spatialGridCells = new Set();

        this.isActiveInPool = true; // Mark as active when reset
        return this; // Return instance for chaining or direct use
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isMarkedForDeletion = true;
            return;
        }

        let potentialHitObjects = [];
        if (this.game.spatialGrid) {
            const queryRange = Math.max(this.size, CONFIG.POSSUM_HEAVY_SIZE || 18, CONFIG.RACCOON_SIZE || 12) + 5; 
            potentialHitObjects = this.game.spatialGrid.queryRange(this.x, this.y, queryRange);
        } else { 
            if (this.shooterTeam === 'player') potentialHitObjects.push(...(this.game.enemyUnits || []));
            else if (this.shooterTeam === 'enemy') potentialHitObjects.push(...(this.game.getLivingPlayerControlledUnits() || []));
            potentialHitObjects.push(...(this.game.level.obstacles || []));
        }

        for (const obj of potentialHitObjects) {
            if (this.isMarkedForDeletion) break; 

            if (obj instanceof Unit && obj.isAlive() && obj.team !== this.shooterTeam && obj.team !== 'neutral') {
                const distToTarget = distance(this.x, this.y, obj.x, obj.y);
                if (distToTarget < obj.size + this.size) {
                    let actualDamage = this.damage;
                    obj.takeDamage(actualDamage, this.shooterUnit);
                    if (this.shooterUnit && this.shooterTeam === 'player' && obj.team === 'enemy' && typeof this.shooterUnit.addXp === 'function') {
                        this.shooterUnit.addXp(CONFIG.XP_PER_HIT || 1);
                    }
                    this.isMarkedForDeletion = true;
                    return;
                }
            } else if (this.game.level.obstacles.includes(obj) && !obj.isDestroyed) {
                const obsCollisionShape = this.game.level._getObstacleCollisionShape(obj);
                if (!obsCollisionShape) continue;

                let hitObstacle = false;
                if (obsCollisionShape.type === 'rectangle' && pointInRectangle(this.x, this.y, obsCollisionShape)) hitObstacle = true;
                else if (obsCollisionShape.type === 'circle' && pointInCircle(this.x, this.y, obsCollisionShape)) hitObstacle = true;
                else if (obsCollisionShape.type === 'ellipse' && pointInEllipse(this.x, this.y, obsCollisionShape)) hitObstacle = true;
                
                if (hitObstacle) {
                    if (obj.destructible) {
                        if (obj.type === 'explosive_barrel' || obj.type === 'explosive_barrel_cluster' || obj.type === 'possum_hut') {
                            this.game.level.damageObstacle(obj, this.damage, this.shooterUnit);
                        }
                    }
                    if (obj.blocksMovement || obj.providesCover) {
                        // --- MODIFICATION START ---
                        if (this.game.addVisualEffect) {
                            const isTree = obj.type.startsWith('tree_');
                            const impactAngle = Math.atan2(this.velocityY, this.velocityX) + Math.PI; // Reverse of bullet direction

                            if (isTree) {
                                this.game.addVisualEffect('wood_splinter', { x: this.x, y: this.y, angle: impactAngle });
                            } else if (obj.blocksMovement) { // Only spark on hard surfaces that block movement
                                this.game.addVisualEffect('spark', { x: this.x, y: this.y });
                            }
                        }
                        // --- MODIFICATION END ---
                        this.isMarkedForDeletion = true;
                        return;
                    }
                }
            }
        }

        if (this.isMarkedForDeletion) return;

        const worldBuffer = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.BULLET && CONFIG.PROJECTILES.BULLET.DESPAWN_WORLD_BUFFER !== undefined)
                           ? CONFIG.PROJECTILES.BULLET.DESPAWN_WORLD_BUFFER : 50;
        if (this.x < -worldBuffer || this.x > (CONFIG.WORLD_WIDTH || 0) + worldBuffer ||
            this.y < -worldBuffer || this.y > (CONFIG.WORLD_HEIGHT || 0) + worldBuffer) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class GrenadeProjectile {
    constructor(startX, startY, targetX, targetY, game, shooterUnit) {
        this.game = game;
        this._spatialGridCells = new Set();
        this._pooled = false;
        this.isActiveInPool = false;
        
        this.reset(startX, startY, targetX, targetY, shooterUnit);
    }

    reset(startX, startY, targetX, targetY, shooterUnit) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.shooterUnit = shooterUnit;
        this.shooterTeam = shooterUnit ? shooterUnit.team : null;

        const grenadeMainConfig = CONFIG;
        const grenadeVisualConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.GRENADE) ? CONFIG.PROJECTILES.GRENADE : {};

        this.damage = grenadeMainConfig.RACCOON_GRENADE_DAMAGE || 50;
        this.aoeRadius = grenadeMainConfig.RACCOON_GRENADE_AOE_RADIUS || grenadeMainConfig.POSSUM_BOSS_1_GRENADE_AOE_RADIUS || 45;
        this.fuseTimer = grenadeMainConfig.RACCOON_GRENADE_FUSE_TIME || 2.5;

        this.color = grenadeMainConfig.GRENADE_PROJECTILE_COLOR || '#228B22';
        this.size = grenadeVisualConfig.SIZE || 8;
        this.sprite = this.game.preloadedImages[grenadeVisualConfig.SPRITE_PATH] || null;
        this.spriteScale = grenadeVisualConfig.SPRITE_SCALE || 1.0;
        this.spriteWidth = 0;
        this.spriteHeight = 0;
        if (this.sprite) {
            this.spriteWidth = this.sprite.naturalWidth * this.spriteScale;
            this.spriteHeight = this.sprite.naturalHeight * this.spriteScale;
        }
        this.rotation = 0;

        // --- MODIFIED: Ensure flightTimeTotal is always recalculated ---
        this.flightTimeTotal = distance(this.startX, this.startY, this.targetX, this.targetY) / (grenadeMainConfig.RACCOON_GRENADE_PROJECTILE_SPEED || 120);
        if (this.flightTimeTotal <= 0) this.flightTimeTotal = grenadeVisualConfig.MIN_FLIGHT_TIME || 0.05;
        // --- END MODIFIED ---
        this.flightTimeElapsed = 0;

        const arcPeakMin = grenadeVisualConfig.ARC_PEAK_HEIGHT_MIN || 20;
        const arcPeakFactor = grenadeVisualConfig.ARC_PEAK_HEIGHT_DISTANCE_FACTOR || 0.2;
        this.currentHeight = 0;
        this.peakHeight = Math.max(arcPeakMin, distance(startX, startY, targetX, targetY) * arcPeakFactor);

        this.isMarkedForDeletion = false;
        this.exploded = false;
        this.maxLifetime = this.fuseTimer + this.flightTimeTotal + (grenadeVisualConfig.MAX_LIFETIME_BUFFER || 2.0);

        if (this._spatialGridCells) this._spatialGridCells.clear();
        else this._spatialGridCells = new Set();

        this.isActiveInPool = true;
        return this;
    }

    update(deltaTime) {
        if (this.exploded) return;

        this.maxLifetime -= deltaTime;
        if (this.maxLifetime <= 0 && !this.exploded) {
            this.isMarkedForDeletion = true;
            return;
        }

        this.fuseTimer -= deltaTime;

        if (this.flightTimeElapsed < this.flightTimeTotal) {
            this.flightTimeElapsed += deltaTime;
            const progress = Math.min(this.flightTimeElapsed / this.flightTimeTotal, 1);

            this.x = this.startX + (this.targetX - this.startX) * progress;
            this.y = this.startY + (this.targetY - this.startY) * progress;

            const t_over_T = Math.min(progress, 1.0);
            this.currentHeight = 4 * this.peakHeight * t_over_T * (1 - t_over_T);

            this.rotation += deltaTime * 5;
        } else {
             this.x = this.targetX;
             this.y = this.targetY;
             this.currentHeight = 0;
        }

        if (this.fuseTimer <= 0) {
            this.explode();
        }
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;
        this.isMarkedForDeletion = true;

        if (this.game && this.game.audioManager) {
            this.game.audioManager.play('GRENADE_EXPLODE');
        }

        if(this.game && this.game.addVisualEffect) this.game.addVisualEffect('explosion', { x: this.x, y: this.y, radius: this.aoeRadius });

        let objectsInAOE = [];
        if (this.game.spatialGrid) {
            // Query slightly larger than AOE to catch edges of larger collision shapes
            const queryRadius = this.aoeRadius + Math.max(CONFIG.POSSUM_HEAVY_SIZE || 18, CONFIG.RACCOON_SIZE || 12, 32); // 32 as a guess for max obstacle collision shape extent
            objectsInAOE = this.game.spatialGrid.queryRange(this.x, this.y, queryRadius);
        } else { 
            if (this.game && this.game.deployedSquadRoster) objectsInAOE.push(...this.game.deployedSquadRoster);
            if (this.game && this.game.enemyUnits) objectsInAOE.push(...this.game.enemyUnits);
            if (this.game && this.game.hostageUnits) objectsInAOE.push(...this.game.hostageUnits);
            if (this.game && this.game.level && this.game.level.obstacles) objectsInAOE.push(...this.game.level.obstacles);
        }
        
        objectsInAOE.forEach(obj => {
            if (obj instanceof Unit && obj.isAlive()) {
                const distToUnit = distance(this.x, this.y, obj.x, obj.y);
                if (distToUnit <= this.aoeRadius + obj.size) { // Unit size as buffer for AOE
                    let damageMultiplier = 1.0;
                    if (this.shooterTeam === 'player' && obj.team === 'player' && obj !== this.shooterUnit) {
                        damageMultiplier = CONFIG.PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER !== undefined ? CONFIG.PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER : 0.5; 
                    }
                    obj.takeDamage(this.damage * damageMultiplier, this.shooterUnit);
                }
            } else if (this.game.level.obstacles.includes(obj) && obj.destructible && !obj.isDestroyed && obj.hp > 0) {
                // --- MODIFIED: Use collisionShape for AOE damage on obstacles ---
                const obsCollisionShape = this.game.level._getObstacleCollisionShape(obj);
                if (!obsCollisionShape) return;

                let shapeCenterX, shapeCenterY, shapeEffectiveSize;

                if (obsCollisionShape.type === 'rectangle') {
                    shapeCenterX = obsCollisionShape.x + obsCollisionShape.width / 2;
                    shapeCenterY = obsCollisionShape.y + obsCollisionShape.height / 2;
                    shapeEffectiveSize = Math.max(obsCollisionShape.width, obsCollisionShape.height) / 2; // Use half of max dimension
                } else if (obsCollisionShape.type === 'circle') {
                    shapeCenterX = obsCollisionShape.x;
                    shapeCenterY = obsCollisionShape.y;
                    shapeEffectiveSize = obsCollisionShape.radius;
                } else if (obsCollisionShape.type === 'ellipse') {
                    shapeCenterX = obsCollisionShape.x;
                    shapeCenterY = obsCollisionShape.y;
                    shapeEffectiveSize = Math.max(obsCollisionShape.radiusX, obsCollisionShape.radiusY); // Use max radius
                } else { // Fallback if somehow no proper shape
                    shapeCenterX = obj.x + obj.width / 2;
                    shapeCenterY = obj.y + obj.height / 2;
                    shapeEffectiveSize = Math.max(obj.width, obj.height) / 4; // Original fallback
                }

                if (distance(this.x, this.y, shapeCenterX, shapeCenterY) <= this.aoeRadius + shapeEffectiveSize) {
                     this.game.level.damageObstacle(obj, this.damage, this.shooterUnit);
                }
                // --- END MODIFIED ---
            }
        });
    }

    render(ctx) {
        if (this.exploded) return;
        const grenadeVisualConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.GRENADE) ? CONFIG.PROJECTILES.GRENADE : {};
        const shadowConfig = grenadeVisualConfig.SHADOW || {};
        const fuseBlinkConfig = grenadeVisualConfig.FUSE_BLINK || {};

        const shadowColor = `rgba(${(shadowConfig.COLOR_RGBA || [0,0,0,0.3]).join(',')})`;
        const visualHeightForShadow = this.sprite ? this.spriteHeight : this.size;
        const shadowYOffset = visualHeightForShadow * (shadowConfig.Y_OFFSET_FACTOR || 0.5);
        const shadowEllipseYFactor = shadowConfig.ELLIPSE_Y_RADIUS_FACTOR || 0.5;
        const shadowHeightScale = shadowConfig.PEAK_HEIGHT_MULTIPLIER_SCALE || 1.5;
        const shadowMaxReduction = shadowConfig.MAX_REDUCTION_SCALE || 0.8;

        const shadowSizeFactor = 1 - Math.min(this.currentHeight / (this.peakHeight * shadowHeightScale + 1e-6), shadowMaxReduction);
        const shadowBaseSize = this.sprite ? this.spriteWidth : this.size;
        const currentShadowSize = shadowBaseSize * shadowSizeFactor;


        if (currentShadowSize > 1) {
            ctx.fillStyle = shadowColor;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + shadowYOffset, currentShadowSize, currentShadowSize * shadowEllipseYFactor, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x, this.y - this.currentHeight);

        if (this.sprite) {
            ctx.rotate(this.rotation);
            ctx.drawImage(
                this.sprite,
                -this.spriteWidth / 2,
                -this.spriteHeight / 2,
                this.spriteWidth,
                this.spriteHeight
            );
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();


        const blinkThreshold = fuseBlinkConfig.THRESHOLD_SECONDS || 0.5;
        if (this.fuseTimer > 0 && this.fuseTimer < blinkThreshold && (Math.floor(this.fuseTimer * 10) % 2 === 0) ) {
             ctx.fillStyle = fuseBlinkConfig.COLOR || 'red';
             ctx.beginPath();
             ctx.arc(this.x, this.y - this.currentHeight, (this.sprite ? this.spriteWidth/2 : this.size) + (fuseBlinkConfig.SIZE_ADDITION || 2), 0, Math.PI * 2);
             ctx.fill();
        }
    }
}