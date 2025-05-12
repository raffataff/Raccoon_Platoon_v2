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
// ... (Weapon class and WEAPONS constant) ...

class Projectile {
    constructor(startX, startY, targetX, targetY, damage, speed, color, game, shooterUnit, effectiveAccuracy) { // Added shooterUnit
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.size = CONFIG.PROJECTILE_SIZE;
        this.game = game;
        this.shooterUnit = shooterUnit; // Store the actual shooter unit
        this.shooterTeam = shooterUnit ? shooterUnit.team : null; // Store team for convenience
        this.effectiveAccuracy = effectiveAccuracy;

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

        // Determine potential targets based on shooter's team
        let potentialTargets;
        if (this.shooterTeam === 'player') {
            potentialTargets = this.game.enemyUnits;
        } else if (this.shooterTeam === 'enemy') {
            potentialTargets = this.game.playerSquad;
        } else {
            potentialTargets = []; // No targets if shooterTeam is unknown
        }

        for (const targetUnit of potentialTargets) { // Changed loop variable name for clarity
            if (targetUnit.isAlive()) { // No need to check targetUnit.team !== this.shooterTeam, potentialTargets already filtered by opposition
                const distToTarget = distance(this.x, this.y, targetUnit.x, targetUnit.y);
                if (distToTarget < targetUnit.size + this.size) { 
                    // --- HIT CONFIRMED ---
                    // Apply damage, passing the shooterUnit as the attacker
                    targetUnit.takeDamage(this.damage, this.shooterUnit); 

                    // Award XP for hit if shooter is a player Raccoon
                    if (this.shooterUnit && this.shooterUnit.team === 'player' && typeof this.shooterUnit.addXp === 'function') {
                        this.shooterUnit.addXp(CONFIG.XP_PER_HIT || 1); // Default to 1 XP if not defined
                    }
                    
                    this.isMarkedForDeletion = true;
                    return; // Projectile is done
                }
            }
        }
        
        // Check collision with obstacles (barrel damage logic is here)
        for (const obs of this.game.level.obstacles) {
            if (!obs.isDestroyed) { 
                if (this.x >= obs.x && this.x <= obs.x + obs.width &&
                    this.y >= obs.y && this.y <= obs.y + obs.height) {
                    if (obs.destructible && obs.type === 'explosive_barrel') {
                        // Pass this.shooterUnit so barrel explosion could potentially award XP/credit later
                        this.game.level.damageObstacle(obs, this.damage, this.shooterUnit); 
                    }
                    if (obs.providesCover) {
                        this.isMarkedForDeletion = true;
                        return; 
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
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ... (GrenadeProjectile class)
// GrenadeProjectile.explode() should also pass the grenade thrower to takeDamage if possible
// For now, grenade damage is anonymous.
class GrenadeProjectile {
    // ... (constructor and update are fine from previous version)
    constructor(startX, startY, targetX, targetY, game, shooterUnit) { // Pass shooterUnit
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.game = game;
        this.shooterUnit = shooterUnit; // Store the raccoon who threw it
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

        this.game.addVisualEffect('explosion', this.x, this.y, this.aoeRadius);

        const allUnits = [...this.game.playerSquad, ...this.game.enemyUnits];
        allUnits.forEach(unit => {
            if (unit.isAlive()) {
                const distToUnit = distance(this.x, this.y, unit.x, unit.y);
                if (distToUnit <= this.aoeRadius + unit.size) { 
                    // Pass this.shooterUnit (the raccoon who threw it) as the attacker
                    unit.takeDamage(this.damage, this.shooterUnit); 
                }
            }
        });

        this.game.level.obstacles.forEach(obstacle => {
            if (obstacle.destructible && !obstacle.isDestroyed && obstacle.hp > 0) {
                let testX = this.x; // Explosion center X
                let testY = this.y; // Explosion center Y

                // Find closest point in/on obstacle rectangle to explosion center
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
        // ... (render logic same)
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