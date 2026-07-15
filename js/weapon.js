class Weapon {
    constructor(name, damage, rof, range, projectileSpeed, projectileColor,
                accuracyStationary, accuracyMoving = accuracyStationary * 0.75, sfxFireKey = null, muzzleFlashScale = 1.0, bulletLifetime = 0.7, bulletSpritePath = null, bulletSpriteScale = 1.0, grenadeSpritePath = null, grenadeSpriteScale = 1.0, pelletCount = 1, spreadAngle = 0) {
        this.name = name;
        this.damage = damage;
        this.rof = rof;
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.projectileColor = projectileColor;
        this.accuracyStationary = accuracyStationary;
        this.accuracyMoving = accuracyMoving;
        this.sfxFireKey = sfxFireKey;
        this.muzzleFlashScale = muzzleFlashScale;
        this.bulletLifetime = bulletLifetime;
        this.bulletSpritePath = bulletSpritePath;
        this.bulletSpriteScale = bulletSpriteScale;
        this.grenadeSpritePath = grenadeSpritePath;
        this.grenadeSpriteScale = grenadeSpriteScale;
        this.pelletCount = pelletCount;
        this.spreadAngle = spreadAngle;
    }
}

function buildWEAPONSFromConfig() {
    const weapons = {};
    const defs = CONFIG.WEAPON_DEFINITIONS || {};
    
    for (const [key, def] of Object.entries(defs)) {
        weapons[key] = new Weapon(
            def.name,
            def.damage,
            def.rof,
            def.range,
            def.projectileSpeed,
            def.projectileColor,
            def.accuracyStationary,
            def.accuracyMoving !== undefined ? def.accuracyMoving : def.accuracyStationary * 0.75,
            def.sfxFireKey,
            def.muzzleFlashScale,
            def.bulletLifetime,
            def.bulletSpritePath,
            def.bulletSpriteScale,
            def.grenadeSpritePath,
            def.grenadeSpriteScale,
            def.pelletCount || 1,
            def.spreadAngle || 0
        );
    }
    
    return weapons;
}

const WEAPONS = buildWEAPONSFromConfig();

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

    reset(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy, bulletLifetimeBonus = 0) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        // this.game = game; // Already set in constructor if pooled, or passed if not
        this.shooterUnit = shooterUnit;
        this.shooterTeam = shooterUnit ? shooterUnit.team : null;
        this.effectiveAccuracy = effectiveAccuracy;
        const bulletConfig = (CONFIG.PROJECTILES && CONFIG.PROJECTILES.BULLET) ? CONFIG.PROJECTILES.BULLET : {};

        if (shooterUnit && shooterUnit.weapon) {
            this.size = shooterUnit.weapon.bulletSize || CONFIG.PROJECTILE_SIZE || 2;
            this.bulletSpritePath = shooterUnit.weapon.bulletSpritePath || bulletConfig.SPRITE_PATH || null;
            this.bulletSpriteScale = shooterUnit.weapon.bulletSpriteScale || bulletConfig.SPRITE_SCALE || 1.0;
        } else {
            this.size = CONFIG.PROJECTILE_SIZE || 2;
            this.bulletSpritePath = bulletConfig.SPRITE_PATH || null;
            this.bulletSpriteScale = bulletConfig.SPRITE_SCALE || 1.0;
        }

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
        const baseLifetime = bulletConfig.LIFETIME || 1.5;
        this.lifetime = baseLifetime + (bulletLifetimeBonus || 0);
        
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
            } else if (this.game.level.obstacles.includes(obj) && !obj.isDestroyed && obj !== this.shooterObstacle) {
                const obsCollisionShapes = this.game.level._getObstacleCollisionShape(obj);
                if (!obsCollisionShapes) continue;
                const shapesArray = Array.isArray(obsCollisionShapes) ? obsCollisionShapes : [obsCollisionShapes];

                let hitObstacle = false;
                for (const obsCollisionShape of shapesArray) {
                    if (obsCollisionShape.type === 'rectangle' && pointInRectangle(this.x, this.y, obsCollisionShape)) { hitObstacle = true; break; }
                    else if (obsCollisionShape.type === 'circle' && pointInCircle(this.x, this.y, obsCollisionShape)) { hitObstacle = true; break; }
                    else if (obsCollisionShape.type === 'ellipse' && pointInEllipse(this.x, this.y, obsCollisionShape)) { hitObstacle = true; break; }
                }
                
                if (hitObstacle) {
                    if (obj.destructible) {
                        if (obj.type === 'explosive_barrel' || obj.type === 'explosive_barrel_double' || obj.type === 'explosive_barrel_cluster' || obj.type === 'possum_hut' || obj.type === 'possum_hut_round' || obj.type === 'possum_relay_tower' || obj.type === 'possum_barracks_1') {
                            // Apply bullet damage multiplier if defined (e.g., relay towers take reduced damage)
                            let actualBulletDamage = this.damage;
                            const obstacleDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === obj.type);
                            if (obstacleDef && obstacleDef.bulletDamageMultiplier !== undefined) {
                                actualBulletDamage = this.damage * obstacleDef.bulletDamageMultiplier;
                            }
                            this.game.level.damageObstacle(obj, actualBulletDamage, this.shooterUnit);
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

        // Special handling for shootout mode - check if enemy projectile hit player
        if (!this.isMarkedForDeletion && 
            this.shooterTeam === 'enemy' && 
            this.game.shootoutController && 
            this.game.shootoutController.isRoundActive) {
            const playerPos = this.game.shootoutController.getPlayerPosition();
            const distToPlayer = Math.hypot(this.x - playerPos.x, this.y - playerPos.y);
            const playerHitboxSize = 60; // Size of player hit area in shootout mode (increased for better hit detection)
            
            if (distToPlayer < playerHitboxSize + this.size) {
                this.game.shootoutController.takeDamage(this.damage);
                this.isMarkedForDeletion = true;
                return;
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
        if (this.bulletSpritePath && this.game && this.game.preloadedImages) {
            const sprite = this.game.preloadedImages[this.bulletSpritePath];
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                const w = sprite.naturalWidth * this.bulletSpriteScale;
                const h = sprite.naturalHeight * this.bulletSpriteScale;
                const angle = Math.atan2(this.velocityY, this.velocityX) + Math.PI / 2;
                const renderOffsetY = -(CONFIG.PROJECTILE_SPRITE_OFFSET_Y || 0);
                ctx.save();
                ctx.translate(this.x, this.y + renderOffsetY);
                ctx.rotate(angle);
                ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
                ctx.restore();
                return;
            }
        }
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

    reset(startX, startY, targetX, targetY, shooterUnit, grenadeTypeKey = 'FRAG') {
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

        // Grenade type (exotic arsenal). Unknown/missing keys fall back to FRAG, whose
        // values mirror the legacy tuning — boss grenades etc. are unaffected.
        this.typeKey = (CONFIG.GRENADE_TYPES && CONFIG.GRENADE_TYPES[grenadeTypeKey]) ? grenadeTypeKey : 'FRAG';
        this.typeConfig = (CONFIG.GRENADE_TYPES && CONFIG.GRENADE_TYPES[this.typeKey]) || null;

        this.damage = (this.typeConfig && this.typeConfig.damage !== undefined) ? this.typeConfig.damage : (grenadeMainConfig.RACCOON_GRENADE_DAMAGE || 50);
        this.aoeRadius = (this.typeConfig && this.typeConfig.aoeRadius !== undefined) ? this.typeConfig.aoeRadius : (grenadeMainConfig.RACCOON_GRENADE_AOE_RADIUS || grenadeMainConfig.POSSUM_BOSS_1_GRENADE_AOE_RADIUS || 45);
        this.fuseTimer = (this.typeConfig && this.typeConfig.fuseTime !== undefined) ? this.typeConfig.fuseTime : (grenadeMainConfig.RACCOON_GRENADE_FUSE_TIME || 2.5);

        this.color = (this.typeConfig && this.typeConfig.color) || grenadeMainConfig.GRENADE_PROJECTILE_COLOR || '#228B22';
        this.size = grenadeVisualConfig.SIZE || 8;

        let grenadeSpritePath = (this.typeConfig && this.typeConfig.spritePath) || grenadeVisualConfig.SPRITE_PATH;
        let grenadeSpriteScale = (this.typeConfig && this.typeConfig.spriteScale) || grenadeVisualConfig.SPRITE_SCALE || 1.0;
        if (shooterUnit && shooterUnit.weapon && shooterUnit.weapon.grenadeSpritePath) {
            grenadeSpritePath = shooterUnit.weapon.grenadeSpritePath;
            grenadeSpriteScale = shooterUnit.weapon.grenadeSpriteScale || 1.0;
        }

        this.sprite = this.game.preloadedImages[grenadeSpritePath] || null;
        this.spriteScale = grenadeSpriteScale;
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
            this.game.audioManager.play((this.typeConfig && this.typeConfig.explosionSfx) || 'GRENADE_EXPLODE');
        }

        if(this.game && this.game.addVisualEffect) this.game.addVisualEffect('grenade_explosion', { x: this.x, y: this.y, radius: this.aoeRadius });

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
        
        const unitsInBlast = [];
        objectsInAOE.forEach(obj => {
            if (obj instanceof Unit && obj.isAlive()) {
                if (obj === this.shooterUnit) return;
                const distToUnit = distance(this.x, this.y, obj.x, obj.y);
                if (distToUnit <= this.aoeRadius + obj.size) { // Unit size as buffer for AOE
                    unitsInBlast.push(obj);
                    let damageMultiplier = 1.0;
                    if (this.shooterTeam === 'player' && obj.team === 'player') {
                        damageMultiplier = CONFIG.PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER !== undefined ? CONFIG.PLAYER_BULLET_FRIENDLY_FIRE_DAMAGE_MULTIPLIER : 0.5;
                    }
                    obj.takeDamage(this.damage * damageMultiplier, this.shooterUnit);
                }
            } else if (this.game.level.obstacles.includes(obj) && obj.destructible && !obj.isDestroyed && obj.hp > 0) {
                const obsCollisionShapes = this.game.level._getObstacleCollisionShape(obj);
                if (!obsCollisionShapes) return;
                const shapesArray = Array.isArray(obsCollisionShapes) ? obsCollisionShapes : [obsCollisionShapes];

                let obstacleHit = false;
                for (const obsCollisionShape of shapesArray) {
                    let shapeCenterX, shapeCenterY, shapeEffectiveSize;

                    if (obsCollisionShape.type === 'rectangle') {
                        shapeCenterX = obsCollisionShape.x + obsCollisionShape.width / 2;
                        shapeCenterY = obsCollisionShape.y + obsCollisionShape.height / 2;
                        shapeEffectiveSize = Math.max(obsCollisionShape.width, obsCollisionShape.height) / 2;
                    } else if (obsCollisionShape.type === 'circle') {
                        shapeCenterX = obsCollisionShape.x;
                        shapeCenterY = obsCollisionShape.y;
                        shapeEffectiveSize = obsCollisionShape.radius;
                    } else if (obsCollisionShape.type === 'ellipse') {
                        shapeCenterX = obsCollisionShape.x;
                        shapeCenterY = obsCollisionShape.y;
                        shapeEffectiveSize = Math.max(obsCollisionShape.radiusX, obsCollisionShape.radiusY);
                    } else {
                        shapeCenterX = obj.x + obj.width / 2;
                        shapeCenterY = obj.y + obj.height / 2;
                        shapeEffectiveSize = Math.max(obj.width, obj.height) / 4;
                    }

                    if (distance(this.x, this.y, shapeCenterX, shapeCenterY) <= this.aoeRadius + shapeEffectiveSize) {
                        obstacleHit = true;
                        break;
                    }
                }
                if (obstacleHit) {
                     this.game.level.damageObstacle(obj, this.damage, this.shooterUnit);
                }
            }
        });

        this._applyTypeEffects(unitsInBlast);
    }

    // Exotic grenade payloads, applied after the base AoE damage. Debuffs only affect
    // units hostile to the thrower; blast damage keeps the normal friendly-fire rules.
    _applyTypeEffects(unitsInBlast) {
        const cfg = this.typeConfig;
        if (!cfg || !this.game) return;

        if (cfg.pool) {  // Slagger: molten plasma pool (area denial DOT)
            this.game.addVisualEffect('plasma_pool', {
                x: this.x, y: this.y,
                radius: cfg.pool.radius || this.aoeRadius,
                duration: cfg.pool.duration,
                dps: cfg.pool.dps,
                tickInterval: cfg.pool.tickInterval,
                shooterUnit: this.shooterUnit,
                color: cfg.color
            });
        }

        if (cfg.slow) {  // Freezer: cryo-foam slow
            unitsInBlast.forEach(u => {
                if (u.team !== this.shooterTeam) u.applyStatusEffect('slow', cfg.slow);
            });
            this.game.addVisualEffect('shockwave_ring', { x: this.x, y: this.y, radius: this.aoeRadius, color: cfg.color });
        }

        if (cfg.vulnerability) {  // Gray Rain: nanite corrosion (+damage taken)
            unitsInBlast.forEach(u => {
                if (u.team !== this.shooterTeam) u.applyStatusEffect('vulnerability', cfg.vulnerability);
            });
            this.game.addVisualEffect('shockwave_ring', { x: this.x, y: this.y, radius: this.aoeRadius, color: cfg.color });
        }

        if (cfg.pull) this._applyGravitonPull(cfg.pull);
        if (cfg.chain) this._applyArcChain(cfg.chain);
    }

    // Pucker: drag hostile units toward the blast center, stopping at unwalkable terrain.
    _applyGravitonPull(pullCfg) {
        const radius = pullCfg.radius || 140;
        const strength = pullCfg.strengthFactor !== undefined ? pullCfg.strengthFactor : 0.85;
        const level = this.game.level;
        if (!level) return;
        const navGrid = level.getNavigationGrid();

        let candidates;
        if (this.game.spatialGrid) {
            candidates = this.game.spatialGrid.queryRange(this.x, this.y, radius);
        } else {
            candidates = [...(this.game.enemyUnits || []), ...(this.game.deployedSquadRoster || [])];
        }

        candidates.forEach(u => {
            if (!(u instanceof Unit) || !u.isAlive() || u === this.shooterUnit) return;
            if (u.team === this.shooterTeam) return;
            const d = distance(this.x, this.y, u.x, u.y);
            if (d > radius || d < 1e-3) return;
            const pullDist = d * strength;
            const nx = (this.x - u.x) / d;
            const ny = (this.y - u.y) / d;
            // Step toward the center, keeping the last walkable position.
            const steps = 4;
            let bestX = u.x, bestY = u.y;
            for (let s = 1; s <= steps; s++) {
                const tx = u.x + nx * (pullDist * s / steps);
                const ty = u.y + ny * (pullDist * s / steps);
                const grid = level.worldToGridCoords(tx, ty);
                if (grid.x < 0 || grid.x >= level.gridWidth || grid.y < 0 || grid.y >= level.gridHeight) break;
                if (navGrid && navGrid[grid.y][grid.x] === 1) break;
                bestX = tx; bestY = ty;
            }
            u.x = bestX;
            u.y = bestY;
            // Yanked off their path — clear it so movement/AI recomputes from here.
            u.isMoving = false;
            u.currentPath = [];
            if (this.game.spatialGrid) this.game.spatialGrid.updateObject(u);
        });

        this.game.addVisualEffect('shockwave_ring', { x: this.x, y: this.y, radius: radius, color: this.typeConfig.color, inward: true });
    }

    // Tesla Egg: chain lightning. Jumps between hostile units (damage + brief stun) and,
    // for player throws, EMP-disables possum turrets it reaches.
    _applyArcChain(chainCfg) {
        const jumps = chainCfg.jumps || 4;
        const jumpRadius = chainCfg.jumpRadius || 120;
        const chainDamage = chainCfg.damage || 20;
        const stunDuration = chainCfg.stunDuration || 0.5;

        const searchRadius = jumpRadius * (jumps + 1);
        let unitCandidates;
        if (this.game.spatialGrid) {
            unitCandidates = this.game.spatialGrid.queryRange(this.x, this.y, searchRadius)
                .filter(o => o instanceof Unit && o.isAlive() && o.team !== this.shooterTeam);
        } else {
            unitCandidates = (this.game.enemyUnits || []).filter(u => u.isAlive());
        }
        const turretCandidates = (this.shooterTeam === 'player')
            ? (this.game.possumTurrets || []).filter(t => !t.isShutdown)
            : [];

        const hitSet = new Set();
        let fromX = this.x, fromY = this.y;

        for (let j = 0; j < jumps; j++) {
            let best = null;
            let bestDistSq = jumpRadius * jumpRadius;
            for (const u of unitCandidates) {
                if (hitSet.has(u)) continue;
                const dx = u.x - fromX, dy = u.y - fromY;
                const dSq = dx * dx + dy * dy;
                if (dSq <= bestDistSq) { bestDistSq = dSq; best = u; }
            }
            for (const t of turretCandidates) {
                if (hitSet.has(t)) continue;
                const tx = t.x + (t.width || 0) / 2, ty = t.y + (t.height || 0) / 2;
                const dx = tx - fromX, dy = ty - fromY;
                const dSq = dx * dx + dy * dy;
                if (dSq <= bestDistSq) { bestDistSq = dSq; best = t; }
            }
            if (!best) break;
            hitSet.add(best);

            const isUnit = best instanceof Unit;
            const bx = isUnit ? best.x : best.x + (best.width || 0) / 2;
            const by = isUnit ? best.y : best.y + (best.height || 0) / 2;
            this.game.addVisualEffect('arc_lightning', { x1: fromX, y1: fromY, x2: bx, y2: by, color: this.typeConfig.color });

            if (isUnit) {
                best.takeDamage(chainDamage, this.shooterUnit);
                best.applyStatusEffect('stun', { duration: stunDuration });
            } else {
                best.empDisabledTimer = Math.max(best.empDisabledTimer || 0, chainCfg.turretDisableDuration || 4.0);
                this.game.addVisualEffect('spark', { x: bx, y: by });
            }
            fromX = bx; fromY = by;
        }
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