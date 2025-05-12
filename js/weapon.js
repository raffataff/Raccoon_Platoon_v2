// js/weapon.js
class Weapon {
    constructor(name, damage, rof, range, projectileSpeed, projectileColor, 
                accuracyStationary, accuracyMoving = accuracyStationary * 0.75) { // Provide a default for moving
        this.name = name;
        this.damage = damage;
        this.rof = rof; 
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.projectileColor = projectileColor;
        this.accuracyStationary = accuracyStationary; // NEW
        this.accuracyMoving = accuracyMoving;         // NEW
    }
}

const WEAPONS = {
    RACCOON_MACHINE_GUN: new Weapon(
        'Raccoon MG',
        CONFIG.RACCOON_MG_DAMAGE,
        CONFIG.RACCOON_MG_ROF,
        CONFIG.RACCOON_MG_RANGE,
        CONFIG.RACCOON_MG_PROJECTILE_SPEED,
        CONFIG.PROJECTILE_COLOR_RACCOON,
        CONFIG.RACCOON_MG_ACCURACY_STATIONARY, // Pass stationary accuracy
        CONFIG.RACCOON_MG_ACCURACY_MOVING    // Pass moving accuracy
    ),
    POSSUM_RIFLE: new Weapon(
        'Possum Rifle',
        CONFIG.POSSUM_RIFLE_DAMAGE,
        CONFIG.POSSUM_RIFLE_ROF,
        CONFIG.POSSUM_RIFLE_RANGE,
        CONFIG.POSSUM_RIFLE_PROJECTILE_SPEED,
        CONFIG.PROJECTILE_COLOR_POSSUM,
        CONFIG.POSSUM_RIFLE_ACCURACY_STATIONARY,
        CONFIG.POSSUM_RIFLE_ACCURACY_MOVING
    ),
    POSSUM_HEAVY_WEAPON: new Weapon(
        'Possum Heavy MG',
        CONFIG.POSSUM_HEAVY_WEAPON_DAMAGE,
        CONFIG.POSSUM_HEAVY_WEAPON_ROF,
        CONFIG.POSSUM_HEAVY_WEAPON_RANGE,
        CONFIG.POSSUM_HEAVY_WEAPON_PROJECTILE_SPEED,
        CONFIG.PROJECTILE_COLOR_POSSUM_HEAVY, // Make sure this color is defined in config
        CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_STATIONARY,
        CONFIG.POSSUM_HEAVY_WEAPON_ACCURACY_MOVING
    )
};

// js/weapon.js
// ... (Weapon class, WEAPONS constant) ...

class Projectile {
    constructor(startX, startY, targetX, targetY, damage, speed, color, game, shooterUnit, effectiveAccuracy) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.size = CONFIG.PROJECTILE_SIZE;
        this.game = game;
        this.shooterUnit = shooterUnit; 
        this.shooterTeam = shooterUnit ? shooterUnit.team : null; 
        this.effectiveAccuracy = effectiveAccuracy;

        // ... (accuracy and velocity calculation as before) ...
        let actualTargetX = targetX;
        let actualTargetY = targetY;

        if (Math.random() > this.effectiveAccuracy) {
            const distToTarget = distance(startX, startY, targetX, targetY);
            const angleToTarget = Math.atan2(targetY - startY, targetX - startX);
            const maxAngleOffset = (1.0 - this.effectiveAccuracy) * (Math.PI / 6);
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
        this.lifetime = 1.5;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isMarkedForDeletion = true;
            return;
        }

        let potentialTargets = []; // Initialize as empty array
        if (this.shooterTeam === 'player' && this.game && this.game.enemyUnits) {
            potentialTargets = this.game.enemyUnits;
        } else if (this.shooterTeam === 'enemy' && this.game && this.game.deployedSquadRoster) { // Use deployedSquadRoster
            potentialTargets = this.game.deployedSquadRoster;
        }
        // If potentialTargets is still empty (e.g. no enemies, or no deployed squad), the loop won't run.

        for (const targetUnit of potentialTargets) { 
            if (targetUnit && targetUnit.isAlive()) { // Added null check for targetUnit
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
        
        // ... (obstacle collision and world boundary checks as before) ...
        if (this.game && this.game.level && this.game.level.obstacles) { // Guard access
            for (const obs of this.game.level.obstacles) {
                if (!obs.isDestroyed) { 
                    if (this.x >= obs.x && this.x <= obs.x + obs.width &&
                        this.y >= obs.y && this.y <= obs.y + obs.height) {
                        if (obs.destructible && obs.type === 'explosive_barrel') {
                            this.game.level.damageObstacle(obs, this.damage, this.shooterUnit); 
                        }
                        if (obs.providesCover) {
                            this.isMarkedForDeletion = true;
                            return; 
                        }
                    }
                }
            }
        }
        if (this.isMarkedForDeletion) return;

        const buffer = 50; 
        if (this.x < -buffer || this.x > CONFIG.WORLD_WIDTH + buffer || 
            this.y < -buffer || this.y > CONFIG.WORLD_HEIGHT + buffer) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        // ... (render is fine) ...
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ... (GrenadeProjectile class, ensure its shooterUnit is correctly passed for XP on kill) ...
// The GrenadeProjectile constructor already takes shooterUnit.
// Its explode method calls unit.takeDamage(this.damage, this.shooterUnit); which is correct.
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

        this.damage = CONFIG.RACCOON_GRENADE_DAMAGE;
        this.aoeRadius = CONFIG.RACCOON_GRENADE_AOE_RADIUS;
        this.fuseTimer = CONFIG.RACCOON_GRENADE_FUSE_TIME;
        this.color = CONFIG.GRENADE_PROJECTILE_COLOR;
        this.size = CONFIG.PROJECTILE_SIZE + 2; 

        this.flightTimeTotal = distance(startX, startY, targetX, targetY) / CONFIG.RACCOON_GRENADE_PROJECTILE_SPEED;
        if (this.flightTimeTotal === 0) this.flightTimeTotal = 0.1; 
        this.flightTimeElapsed = 0;
        this.currentHeight = 0; 
        this.peakHeight = Math.max(20, distance(startX, startY, targetX, targetY) * 0.2); 

        this.isMarkedForDeletion = false;
        this.exploded = false;
        this.maxLifetime = this.fuseTimer + this.flightTimeTotal + 2.0; 
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
            if (unit && unit.isAlive()) { // Guard unit
                const distToUnit = distance(this.x, this.y, unit.x, unit.y);
                if (distToUnit <= this.aoeRadius + unit.size) { 
                    unit.takeDamage(this.damage, this.shooterUnit); 
                }
            }
        });

        if(this.game && this.game.level && this.game.level.obstacles) this.game.level.obstacles.forEach(obstacle => { // Guard
            if (obstacle.destructible && !obstacle.isDestroyed && obstacle.hp > 0) {
                let testX = this.x; 
                let testY = this.y; 

                if (this.x < obstacle.x) testX = obstacle.x; 
                else if (this.x > obstacle.x + obstacle.width) testX = obstacle.x + obstacle.width; 
                if (this.y < obstacle.y) testY = obstacle.y; 
                else if (this.y > obstacle.y + obstacle.height) testY = obstacle.y + obstacle.height; 

                const distX = this.x - testX;
                const distY = this.y - testY;
                const distSquared = (distX * distX) + (distY * distY);

                if (distSquared <= this.aoeRadius * this.aoeRadius) {
                     this.game.level.damageObstacle(obstacle, this.damage, this.shooterUnit); 
                }
            }
        });
    }

    render(ctx) {
        if (this.exploded) return;
        
        const shadowSize = this.size * (1 - Math.min(this.currentHeight / (this.peakHeight * 1.5), 0.8)); 
        if (shadowSize > 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.size * 0.5, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2); 
            ctx.fill();
        }
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.currentHeight, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this.fuseTimer > 0 && this.fuseTimer < 0.5) { 
             ctx.fillStyle = 'red';
             ctx.beginPath();
             ctx.arc(this.x, this.y - this.currentHeight, this.size + 2, 0, Math.PI * 2);
             ctx.fill();
        }
    }
}