class PossumTurret {
    constructor(x, y, game, directionArc, obstacle = null) {
        this.type = 'possum_turret';
        this.team = 'enemy';
        this.x = x;
        this.y = y;
        this.game = game;
        this.directionArc = directionArc;
        this.obstacle = obstacle;
        
        this.facingDirection = directionArc[Math.floor(directionArc.length / 2)];
        
        this.isShutdown = false;
        this.interactionRadius = 100;
        
        this.width = 64;
        this.height = 64;
        
        this.weapon = WEAPONS.POSSUM_TURRET_WEAPON;
        this.fireTimer = Math.random() / this.weapon.rof;
        
        //console.log(`[PossumTurret] Created at (${x}, ${y}) with arc: [${directionArc.join(', ')}]`);
        
        this._loadSprites();
    }
    
    _loadSprites() {
        if (!this.game || !this.game.preloadedImages) {
            console.log(`[PossumTurret._loadSprites] ERROR: no game or no preloadedImages!`);
            return;
        }
        
        this.sprites = {};
        const turretDir = 'assets/images/objects/possums/turrets/';
        const possumTurretKeys = Object.keys(this.game.preloadedImages).filter(k => k.includes('possum_turret'));
        //console.log(`[PossumTurret._loadSprites] Available possum_turret keys: ${JSON.stringify(possumTurretKeys)}`);
        
        let spritesLoadedCount = 0;
        for (const dir of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
            const key = `possum_turret_1_${dir}`;
            const fullPath = turretDir + key + '.png'; // assets/images/objects/possums/turrets/possum_turret_1_n.png
            const found = this.game.preloadedImages[fullPath];
            //console.log(`[PossumTurret._loadSprites] Looking for '${fullPath}', found: ${!!found}, sprite naturalWidth: ${found ? found.naturalWidth : 'N/A'}`);
            this.sprites[dir] = found || null;
            if (found && found.naturalWidth > 0) spritesLoadedCount++;
        }
        
        //console.log(`[PossumTurret._loadSprites] Loaded ${spritesLoadedCount}/8 sprites`);
        
        const currentSprite = this.sprites[this.facingDirection];
        //console.log(`[PossumTurret._loadSprites] facingDirection=${this.facingDirection}, currentSprite=${!!currentSprite}, width=${currentSprite ? currentSprite.naturalWidth : 'N/A'}`);
        const turretConfig = CONFIG.POSSUM_TURRET || {};
        if (currentSprite && currentSprite.naturalWidth > 0) {
            const scale = turretConfig.spriteScale !== undefined ? turretConfig.spriteScale : 0.6;
            this.width = currentSprite.naturalWidth * scale;
            this.height = currentSprite.naturalHeight * scale;
            //console.log(`[PossumTurret._loadSprites] Set dimensions to ${this.width}x${this.height}`);
        } else {
            //console.log(`[PossumTurret._loadSprites] Using default dimensions ${this.width}x${this.height}`);
        }
    }
    
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
    
    _dirToAngle(dir) {
        const dirAngles = {
            'n': -Math.PI / 2, 'ne': -Math.PI / 4, 'e': 0, 'se': Math.PI / 4,
            's': Math.PI / 2, 'sw': 3 * Math.PI / 4, 'w': Math.PI, 'nw': -3 * Math.PI / 4
        };
        return dirAngles[dir] || 0;
    }

    _isAngleInArc(angle) {
        const centerDir = this.directionArc[Math.floor(this.directionArc.length / 2)];
        const centerAngle = this._dirToAngle(centerDir);
        let diff = Math.abs(angle - centerAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        return diff <= Math.PI / 2 + 0.1; // 90 degrees + small epsilon
    }

    _isTargetInArc(target) {
        const dx = target.x - this.getCenterX();
        const dy = target.y - this.getCenterY();
        const angle = Math.atan2(dy, dx);
        return this._isAngleInArc(angle);
    }

    _hasLineOfSight(x1, y1, x2, y2, obstacles, gameLevelInstance) {
        let candidateObstacles = obstacles;
        if (gameLevelInstance && gameLevelInstance.game && gameLevelInstance.game.spatialGrid) {
            const gridCandidates = gameLevelInstance.game.spatialGrid.queryLine(x1, y1, x2, y2);
            candidateObstacles = gridCandidates.filter(obj => gameLevelInstance.obstacles.includes(obj) && obj !== this.obstacle);
        }
        if (!candidateObstacles) return true;
        for (const obs of candidateObstacles) {
            const relevantObstacleProperty = obs.blocksMovement;
            if (relevantObstacleProperty && !obs.isDestroyed) {
                let collisionDetected = false;
                const obsShapeOrShapes = (gameLevelInstance && typeof gameLevelInstance._getObstacleCollisionShape === 'function')
                    ? gameLevelInstance._getObstacleCollisionShape(obs)
                    : { type: 'rectangle', x: obs.x, y: obs.y, width: obs.width, height: obs.height };
                if (!obsShapeOrShapes) continue;
                const shapesArray = Array.isArray(obsShapeOrShapes) ? obsShapeOrShapes : [obsShapeOrShapes];
                for (const obsShape of shapesArray) {
                    if (obsShape.type === 'rectangle') {
                        if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) { collisionDetected = true; break; }
                    } else if (obsShape.type === 'circle') {
                        if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) { collisionDetected = true; break; }
                    } else if (obsShape.type === 'ellipse') {
                        if (lineIntersectsEllipse(x1, y1, x2, y2, obsShape)) { collisionDetected = true; break; }
                    }
                }
                if (collisionDetected) return false;
            }
        }
        return true;
    }

    getNearestRaccoonBehind() {
        if (!this.game || !this.game.deployedSquadRoster) return null;

        const centerX = this.getCenterX();
        const centerY = this.getCenterY();

        let nearest = null;
        let nearestDist = Infinity;

        for (const raccoon of this.game.deployedSquadRoster) {
            if (!raccoon.isAlive()) continue;
            const dist = distance(centerX, centerY, raccoon.x, raccoon.y);
            if (dist > this.interactionRadius) continue;
            if (this._isTargetInArc(raccoon)) continue; // must be OUTSIDE the arc to be "behind"

            if (dist < nearestDist) {
                nearest = raccoon;
                nearestDist = dist;
            }
        }
        return nearest;
    }
    
    shutdown() {
        this.isShutdown = true;
        this.facingDirection = this.directionArc[Math.floor(this.directionArc.length / 2)];
        //console.log(`[POSSUM TURRET] Shutdown at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        const turretConfig = CONFIG.POSSUM_TURRET || {};
        if (this.game && this.game.audioManager && turretConfig.sfxShutdownKey) {
            this.game.audioManager.play(turretConfig.sfxShutdownKey);
        }
    }
    
    update(deltaTime) {
        if (this.isShutdown) return;
        
        // Debug logging every few seconds to track update calls
        if (!this._updateLogCount) this._updateLogCount = 0;
        this._updateLogCount++;
       /* if (this._updateLogCount % 100 === 0) {
            //console.log(`[PossumTurret.update] tick=${this._updateLogCount}, pos=(${this.x.toFixed(0)},${this.y.toFixed(0)}), range=${this.weapon.range}, shutdown=${this.isShutdown}`);
        }
            */
        
        const nearestTarget = this._getNearestRaccoonInWeaponRange();
        if (!nearestTarget) return;
        
        const dx = nearestTarget.x - this.getCenterX();
        const dy = nearestTarget.y - this.getCenterY();
        const angle = Math.atan2(dy, dx);
        
        let bestDir = this.facingDirection;
        let bestDiff = Infinity;
        
        const dirAngles = {
            'n': -Math.PI / 2,
            'ne': -Math.PI / 4,
            'e': 0,
            'se': Math.PI / 4,
            's': Math.PI / 2,
            'sw': 3 * Math.PI / 4,
            'w': Math.PI,
            'nw': -3 * Math.PI / 4
        };
        
        let normalizedAngle = angle;
        while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;
        while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
        
        for (const dir of this.directionArc) {
            const dirAngle = dirAngles[dir];
            let diff = Math.abs(normalizedAngle - dirAngle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            
            if (diff < bestDiff) {
                bestDiff = diff;
                bestDir = dir;
            }
        }
        
        this.facingDirection = bestDir;
        
        this.fireTimer -= deltaTime;
        if (this.fireTimer <= 0) {
            this._fireAt(nearestTarget);
            this.fireTimer = 1 / this.weapon.rof;
        }
    }
    
    _getNearestRaccoonInWeaponRange() {
        if (!this.game || !this.game.deployedSquadRoster) return null;

        const centerX = this.getCenterX();
        const centerY = this.getCenterY();
        const range = this.weapon.range;

        let nearest = null;
        let nearestDist = Infinity;

        const obstacles = this.game.level ? this.game.level.activeObstacles : [];
        for (const raccoon of this.game.deployedSquadRoster) {
            if (!raccoon.isAlive()) continue;
            const dist = distance(centerX, centerY, raccoon.x, raccoon.y);
            if (dist > range || dist >= nearestDist) continue;
            if (!this._isTargetInArc(raccoon)) continue;
            if (!_hasLineOfSight(centerX, centerY, raccoon.x, raccoon.y, obstacles, this.game.level)) continue;
            nearest = raccoon;
            nearestDist = dist;
        }
        return nearest;
    }
    
    _fireAt(target) {
        if (!this.game || !target) return;

        const centerX = this.getCenterX();
        const centerY = this.getCenterY();

        const angle = Math.atan2(target.y - centerY, target.x - centerX);
        const turretConfig = CONFIG.POSSUM_TURRET || {};
        const muzzleOffset = turretConfig.muzzleOffset !== undefined ? turretConfig.muzzleOffset : 0;
        const startX = centerX + Math.cos(angle) * muzzleOffset;
        const startY = centerY + Math.sin(angle) * muzzleOffset;

        const accuracy = this.weapon.accuracyStationary;
        const effectiveAccuracy = accuracy * (0.85 + Math.random() * 0.3);

        const projectile = this.game.getProjectileFromPool(
            startX, startY,
            target.x, target.y,
            this.weapon.damage,
            this.weapon.projectileSpeed,
            this.weapon.projectileColor,
            this,
            effectiveAccuracy
        );

        if (this.obstacle) {
            projectile.shooterObstacle = this.obstacle;
        }

        this.game.addProjectile(projectile);

        if (this.game.audioManager && this.weapon.sfxFireKey) {
            this.game.audioManager.play(this.weapon.sfxFireKey);
        }
    }
    
    render(ctx) {
        let sprite = this.sprites[this.facingDirection];
        if ((!sprite || sprite.naturalWidth === 0) && (!this._spriteLoadAttempts || this._spriteLoadAttempts < 5)) {
            this._spriteLoadAttempts = (this._spriteLoadAttempts || 0) + 1;
            this._loadSprites();
            sprite = this.sprites[this.facingDirection];
        }
        //console.log(`[PossumTurret.render] x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height}, sprite=${!!sprite}, isShutdown=${this.isShutdown}`);
        if (sprite && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isShutdown ? '#444444' : '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = this.isShutdown ? '#00FF00' : '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

    }

    renderOverlay(ctx) {
        if (!this.isShutdown) {
            const nearbyRaccoon = this.getNearestRaccoonBehind();
            if (nearbyRaccoon) {
                ctx.font = "bold 14px 'Consolas'";
                ctx.fillStyle = '#00FF00';
                ctx.textAlign = 'center';
                ctx.shadowColor = "rgba(0,0,0,0.9)";
                ctx.shadowBlur = 4;
                ctx.fillText("Press E to Shut Down", this.x + this.width / 2, this.y - 25);
                ctx.shadowBlur = 0;
            }
        }
    }
}