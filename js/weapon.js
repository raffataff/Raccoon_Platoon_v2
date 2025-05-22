// js/weapon.js
// complete
class Weapon {
    constructor(name, damage, rof, range, projectileSpeed, projectileColor,
                accuracyStationary, accuracyMoving = accuracyStationary * 0.75, sfxFireKey = null) { // Added sfxFireKey
        this.name = name;
        this.damage = damage;
        this.rof = rof;
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.projectileColor = projectileColor;
        this.accuracyStationary = accuracyStationary;
        this.accuracyMoving = accuracyMoving;
        this.sfxFireKey = sfxFireKey; // Store it
    }
}

const WEAPONS = {
    RACCOON_MACHINE_GUN: new Weapon(
        'Raccoon MG',
        CONFIG.RACCOON_MG_DAMAGE, CONFIG.RACCOON_MG_ROF, CONFIG.RACCOON_MG_RANGE,
        CONFIG.RACCOON_MG_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_RACCOON,
        CONFIG.RACCOON_MG_ACCURACY_STATIONARY, CONFIG.RACCOON_MG_ACCURACY_MOVING,
        'RACCOON_MG_FIRE' // SFX Key
    ),
    POSSUM_RIFLE: new Weapon(
        'Possum Rifle',
        CONFIG.POSSUM_RIFLE_DAMAGE, CONFIG.POSSUM_RIFLE_ROF, CONFIG.POSSUM_RIFLE_RANGE,
        CONFIG.POSSUM_RIFLE_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_POSSUM,
        CONFIG.POSSUM_RIFLE_ACCURACY_STATIONARY, CONFIG.POSSUM_RIFLE_ACCURACY_MOVING,
        'POSSUM_RIFLE_FIRE' // SFX Key
    ),
    POSSUM_HEAVY_WEAPON: new Weapon(
        'Possum Heavy MG',
        CONFIG.POSSUM_HEAVY_WEAPON_DAMAGE, CONFIG.POSSUM_HEAVY_WEAPON_ROF, CONFIG.POSSUM_HEAVY_WEAPON_RANGE,
        CONFIG.POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED, CONFIG.PROJECTILE_COLOR_POSSUM_HEAVY,
        CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY, CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_MOVING,
        'POSSUM_HEAVY_MG_FIRE' // SFX Key
    )
};

class Projectile {
    constructor(startX, startY, targetX, targetY, damage, speed, color, game, shooterUnit, effectiveAccuracy) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.size = CONFIG.PROJECTILE_SIZE || 2; // Use from config
        this.game = game;
        this.shooterUnit = shooterUnit;
        this.shooterTeam = shooterUnit ? shooterUnit.team : null;
        this.effectiveAccuracy = effectiveAccuracy; // Already passed in

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
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isMarkedForDeletion = true;
            return;
        }

        let potentialTargets = [];
        if (this.shooterTeam === 'player' && this.game && this.game.enemyUnits) {
            potentialTargets = this.game.enemyUnits;
        } else if (this.shooterTeam === 'enemy' && this.game && this.game.deployedSquadRoster) {
            potentialTargets = this.game.deployedSquadRoster;
        }

        for (const targetUnit of potentialTargets) {
            if (targetUnit && targetUnit.isAlive()) {
                const distToTarget = distance(this.x, this.y, targetUnit.x, targetUnit.y);
                if (distToTarget < targetUnit.size + this.size) {
                    targetUnit.takeDamage(this.damage, this.shooterUnit);
                    if (this.shooterUnit && this.shooterUnit.team === 'player' && typeof this.shooterUnit.addXp === 'function') {
                        this.shooterUnit.addXp(CONFIG.XP_PER_HIT || 1);
                    }
                    this.isMarkedForDeletion = true;
                    return;
                }
            }
        }

        if (this.game && this.game.level && this.game.level.obstacles) {
            for (const obs of this.game.level.obstacles) {
                if (!obs.isDestroyed) {
                    const obsCollisionShape = this.game.level._getObstacleCollisionShape(obs);
                    let hitObstacle = false;

                    if (obsCollisionShape.type === 'rectangle') {
                        if (pointInRectangle(this.x, this.y, obsCollisionShape)) {
                            hitObstacle = true;
                        }
                    } else if (obsCollisionShape.type === 'circle') {
                        if (pointInCircle(this.x, this.y, obsCollisionShape)) {
                            hitObstacle = true;
                        }
                    }

                    if (hitObstacle) {
                        if (obs.destructible && obs.type === 'explosive_barrel') {
                            this.game.level.damageObstacle(obs, this.damage, this.shooterUnit);
                        }
                        if (obs.providesCover) {
                            this.isMarkedForDeletion = true;
                            return;
                        }
                        if(!obs.providesCover && obs.collisionShape){
                             this.isMarkedForDeletion = true;
                             return;
                        }
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
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.game = game;
        this.shooterUnit = shooterUnit;
        this.shooterTeam = shooterUnit ? shooterUnit.team : null;

        const grenadeMainConfig = CONFIG;
        const grenadeProjectileConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.GRENADE) ? CONFIG.PROJECTILES.GRENADE : {};

        this.damage = grenadeMainConfig.RACCOON_GRENADE_DAMAGE || 50;
        this.aoeRadius = grenadeMainConfig.RACCOON_GRENADE_AOE_RADIUS || 45;
        this.fuseTimer = grenadeMainConfig.RACCOON_GRENADE_FUSE_TIME || 2.5;
        this.color = grenadeMainConfig.GRENADE_PROJECTILE_COLOR || '#228B22';
        this.size = grenadeProjectileConfig.SIZE || (CONFIG.PROJECTILE_SIZE || 2) + 2;

        this.flightTimeTotal = distance(startX, startY, targetX, targetY) / (grenadeMainConfig.RACCOON_GRENADE_PROJECTILE_SPEED || 120);
        if (this.flightTimeTotal === 0) this.flightTimeTotal = grenadeProjectileConfig.MIN_FLIGHT_TIME || 0.05;
        this.flightTimeElapsed = 0;

        const arcPeakMin = grenadeProjectileConfig.ARC_PEAK_HEIGHT_MIN || 20;
        const arcPeakFactor = grenadeProjectileConfig.ARC_PEAK_HEIGHT_DISTANCE_FACTOR || 0.2;
        this.currentHeight = 0;
        this.peakHeight = Math.max(arcPeakMin, distance(startX, startY, targetX, targetY) * arcPeakFactor);

        this.isMarkedForDeletion = false;
        this.exploded = false;
        this.maxLifetime = this.fuseTimer + this.flightTimeTotal + (grenadeProjectileConfig.MAX_LIFETIME_BUFFER || 2.0);
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

        if(this.game && this.game.addVisualEffect) this.game.addVisualEffect('explosion', this.x, this.y, this.aoeRadius);

        const unitsToDamage = [];
        if (this.game && this.game.deployedSquadRoster) unitsToDamage.push(...this.game.deployedSquadRoster);
        if (this.game && this.game.enemyUnits) unitsToDamage.push(...this.game.enemyUnits);

        unitsToDamage.forEach(unit => {
            if (unit && unit.isAlive()) {
                const distToUnit = distance(this.x, this.y, unit.x, unit.y);
                if (distToUnit <= this.aoeRadius + unit.size) {
                    unit.takeDamage(this.damage, this.shooterUnit);
                }
            }
        });

        if(this.game && this.game.level && this.game.level.obstacles) this.game.level.obstacles.forEach(obstacle => {
            if (obstacle.destructible && !obstacle.isDestroyed && obstacle.hp > 0) {
                let testX = this.x; let testY = this.y;
                if (this.x < obstacle.x) testX = obstacle.x;
                else if (this.x > obstacle.x + obstacle.width) testX = obstacle.x + obstacle.width;
                if (this.y < obstacle.y) testY = obstacle.y;
                else if (this.y > obstacle.y + obstacle.height) testY = obstacle.y + obstacle.height;

                const distX = this.x - testX; const distY = this.y - testY;
                const distSquared = (distX * distX) + (distY * distY);

                if (distSquared <= this.aoeRadius * this.aoeRadius) {
                     this.game.level.damageObstacle(obstacle, this.damage, this.shooterUnit);
                }
            }
        });
    }

    render(ctx) {
        if (this.exploded) return;
        const grenadeProjectileConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.GRENADE) ? CONFIG.PROJECTILES.GRENADE : {};
        const shadowConfig = grenadeProjectileConfig.SHADOW || {};
        const fuseBlinkConfig = grenadeProjectileConfig.FUSE_BLINK || {};

        const shadowColor = `rgba(${(shadowConfig.COLOR_RGBA || [0,0,0,0.3]).join(',')})`;
        const shadowYOffset = this.size * (shadowConfig.Y_OFFSET_FACTOR || 0.5);
        const shadowEllipseYFactor = shadowConfig.ELLIPSE_Y_RADIUS_FACTOR || 0.5;
        const shadowHeightScale = shadowConfig.PEAK_HEIGHT_MULTIPLIER_SCALE || 1.5;
        const shadowMaxReduction = shadowConfig.MAX_REDUCTION_SCALE || 0.8;

        const shadowSizeFactor = 1 - Math.min(this.currentHeight / (this.peakHeight * shadowHeightScale + 1e-6), shadowMaxReduction);
        const currentShadowSize = this.size * shadowSizeFactor;

        if (currentShadowSize > 1) {
            ctx.fillStyle = shadowColor;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + shadowYOffset, currentShadowSize, currentShadowSize * shadowEllipseYFactor, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.currentHeight, this.size, 0, Math.PI * 2);
        ctx.fill();

        const blinkThreshold = fuseBlinkConfig.THRESHOLD_SECONDS || 0.5;
        if (this.fuseTimer > 0 && this.fuseTimer < blinkThreshold && (Math.floor(this.fuseTimer * 10) % 2 === 0) ) {
             ctx.fillStyle = fuseBlinkConfig.COLOR || 'red';
             ctx.beginPath();
             ctx.arc(this.x, this.y - this.currentHeight, this.size + (fuseBlinkConfig.SIZE_ADDITION || 2), 0, Math.PI * 2);
             ctx.fill();
        }
    }
}