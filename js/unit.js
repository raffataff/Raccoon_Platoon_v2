// js/unit.js
class Unit {
    // ... (constructor and other methods as before) ...
    constructor(x, y, game, team, hp, speed, size, color, id) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.team = team;
        this.id = id || `${team}-${Date.now().toString(36)+Math.random().toString(36).slice(2,5)}`;

        this.maxHp = hp;
        this.hp = hp; 
        
        this.speed = speed;
        this.size = size;
        this.color = color;

        this.targetX = x; 
        this.targetY = y;
        this.isMoving = false; 

        this.weapon = null; 
        this.autoTarget = null;
        this.manualTarget = null; 
        this.isMovingToEngageManualTarget = false;
        
        this.stuckCheckPosition = { x: x, y: y }; 
        this.stuckFrames = 0;                      
        this.STUCK_FRAMES_THRESHOLD = 20;          
        
        this.attackCooldown = 0;
        this.actionTimer = 0; 
        this.isMarkedForDeletion = false;
        this.facingAngle = 0; 
    }

    update(deltaTime) {
        if (!this.isAlive()) {
            return;
        }

        if (this.actionTimer > 0) { 
            this.actionTimer -= deltaTime;
            if (this.isMoving) this.isMoving = false; 
            if (this.isMovingToEngageManualTarget) this.isMovingToEngageManualTarget = false;
            return; 
        }

        if (this.isMovingToEngageManualTarget && this.manualTarget && this.manualTarget.isAlive() && this.weapon && this.team === 'player') {
            const preferredEngagementRange = this.weapon.range * 0.85;
            const distToActualTarget = distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y);

            if (distToActualTarget <= preferredEngagementRange) {
                this.isMovingToEngageManualTarget = false;
                this.isMoving = false; 
                this.targetX = this.x; 
                this.targetY = this.y;
            } else {
                const vecXFromTargetToUnit = this.x - this.manualTarget.x;
                const vecYFromTargetToUnit = this.y - this.manualTarget.y;
                
                if (distToActualTarget > 0) { 
                    this.targetX = this.manualTarget.x + (vecXFromTargetToUnit / distToActualTarget) * preferredEngagementRange;
                    this.targetY = this.manualTarget.y + (vecYFromTargetToUnit / distToActualTarget) * preferredEngagementRange;
                } else { 
                    this.targetX = this.manualTarget.x + preferredEngagementRange;
                    this.targetY = this.manualTarget.y;
                }
                if (distance(this.x, this.y, this.targetX, this.targetY) > 1.0) {
                    this.isMoving = true;
                } else { 
                    this.isMoving = false;
                    this.isMovingToEngageManualTarget = false; 
                }
            }
        } else if (this.isMovingToEngageManualTarget && (!this.manualTarget || !this.manualTarget.isAlive())) {
            this.isMovingToEngageManualTarget = false;
            this.isMoving = false; 
            this.manualTarget = null;
        }

        if (this.isMoving) {
            if (Math.abs(this.x - this.stuckCheckPosition.x) < 0.1 && Math.abs(this.y - this.stuckCheckPosition.y) < 0.1) {
                this.stuckFrames++;
            } else {
                this.stuckFrames = 0;
                this.stuckCheckPosition.x = this.x;
                this.stuckCheckPosition.y = this.y;
            }

            if (this.stuckFrames > this.STUCK_FRAMES_THRESHOLD) {
                this.isMoving = false; 
                this.stuckFrames = 0;  
                if (this.isMovingToEngageManualTarget) {
                    this.isMovingToEngageManualTarget = false; 
                }
                if (this.team === 'enemy' && typeof this.onStuck === 'function') {
                    this.onStuck(); 
                }
            }
        } else {
            this.stuckFrames = 0; 
            this.stuckCheckPosition.x = this.x;
            this.stuckCheckPosition.y = this.y;
        }

        this._handleMovement(deltaTime); 
        this._handleCombat(deltaTime, this.game.level.obstacles);
    }
    
    _handleMovement(deltaTime) {
        if (!this.isMoving) return; 

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distToMovementTarget = distance(this.x, this.y, this.targetX, this.targetY);

        if (distToMovementTarget > 0.5) { 
            const moveSpeed = this.speed * deltaTime;
            this.facingAngle = Math.atan2(dy, dx);

            let nextX = this.x + Math.cos(this.facingAngle) * moveSpeed;
            let nextY = this.y + Math.sin(this.facingAngle) * moveSpeed;
            
            if (distToMovementTarget <= moveSpeed) { 
                nextX = this.targetX;
                nextY = this.targetY;
                this.isMoving = false; 
            }

            let collision = false;
            for (const obs of this.game.level.obstacles) {
                if (!obs.isDestroyed && obs.blocksMovement) {
                    if (nextX + this.size > obs.x && nextX - this.size < obs.x + obs.width &&
                        nextY + this.size > obs.y && nextY - this.size < obs.y + obs.height) {
                        collision = true;
                        this.isMoving = false; 
                        if(this.isMovingToEngageManualTarget) this.isMovingToEngageManualTarget = false;
                        break;
                    }
                }
            }

            if (!collision) {
                this.x = nextX;
                this.y = nextY;
            } else { 
                let movedX = false, movedY = false; 
                let tempNextX = this.x + Math.cos(this.facingAngle) * moveSpeed;
                let tempCollisionX = false;
                for (const obs of this.game.level.obstacles) { 
                    if (!obs.isDestroyed && obs.blocksMovement && tempNextX + this.size > obs.x && tempNextX - this.size < obs.x + obs.width && this.y + this.size > obs.y && this.y - this.size < obs.y + obs.height) { 
                        tempCollisionX = true; break; 
                    } 
                }
                if (!tempCollisionX) { this.x = tempNextX; movedX = true; }

                let tempNextY = this.y + Math.sin(this.facingAngle) * moveSpeed;
                let tempCollisionY = false;
                 for (const obs of this.game.level.obstacles) { 
                    if (!obs.isDestroyed && obs.blocksMovement && this.x + this.size > obs.x && this.x - this.size < obs.x + obs.width && tempNextY + this.size > obs.y && tempNextY - this.size < obs.y + obs.height) {
                        tempCollisionY = true; break; 
                    }
                }
                if(!tempCollisionY) { this.y = tempNextY; movedY = true; }

                if (!movedX && !movedY) { 
                    this.isMoving = false; 
                    if(this.isMovingToEngageManualTarget) this.isMovingToEngageManualTarget = false;
                }
            }
            this.x = Math.max(this.size, Math.min(this.x, CONFIG.WORLD_WIDTH - this.size));
            this.y = Math.max(this.size, Math.min(this.y, CONFIG.WORLD_HEIGHT - this.size));
        } else { 
            this.isMoving = false; 
        }
    }

    _handleCombat(deltaTime, obstacles) {
        if (this.isAimingGrenade || this.actionTimer > 0 || !this.weapon) return; 

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        let targetToShoot = this.manualTarget; 

        if (!targetToShoot || typeof targetToShoot.isAlive !== 'function' || !targetToShoot.isAlive()) {
            this.manualTarget = null;
            if (this.isMovingToEngageManualTarget) { 
                this.isMovingToEngageManualTarget = false;
            }
            this.findAutoTarget(this.team === 'player' ? this.game.enemyUnits : this.game.playerSquad, obstacles);
            targetToShoot = this.autoTarget;
        }
        
        if (targetToShoot && typeof targetToShoot.isAlive === 'function' && targetToShoot.isAlive() && this.attackCooldown <= 0) {
            const distToTarget = distance(this.x, this.y, targetToShoot.x, targetToShoot.y);

            if (distToTarget <= this.weapon.range) { 
                let hasLOS = true;
                if (targetToShoot.team && targetToShoot.team !== 'neutral_object') { 
                    hasLOS = hasLineOfSight(this.x, this.y, targetToShoot.x, targetToShoot.y, obstacles);
                }

                if (hasLOS) {
                    this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                    this.fireAt(targetToShoot); 
                    this.attackCooldown = 1 / this.weapon.rof;
                } else { 
                    if (targetToShoot === this.autoTarget) this.autoTarget = null; 
                }
            } else { 
                if (targetToShoot === this.autoTarget) this.autoTarget = null;
            }
        } else if (targetToShoot && typeof targetToShoot.isAlive === 'function' && targetToShoot.isAlive()) { 
            if (!this.isMoving) { 
                 this.facingAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
            }
        }
    }
    
    findAutoTarget(potentialTargets, obstacles) {
        let closestTarget = null;
        let minDistance = this.weapon ? this.weapon.range : (this.detectionRange || 150);

        if (!potentialTargets || !Array.isArray(potentialTargets)) {
            // console.warn(`[Unit ${this.id} findAutoTarget] potentialTargets is invalid:`, potentialTargets);
            this.autoTarget = null;
            return;
        }

        potentialTargets.forEach(target => {
            if (target && target.isAlive() && target.team !== this.team) {
                const d = distance(this.x, this.y, target.x, target.y);
                if (d <= minDistance) { 
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, obstacles)) {
                        if (!closestTarget || d < distance(this.x, this.y, closestTarget.x, closestTarget.y)) {
                           closestTarget = target;
                        }
                    }
                }
            }
        });
        this.autoTarget = closestTarget;
    }

    fireAt(target) { 
        const effectiveAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        const projectile = new Projectile(
            this.x, this.y, target.x, target.y, 
            this.weapon.damage, 
            this.weapon.projectileSpeed, 
            this.weapon.projectileColor, 
            this.game, 
            this, 
            effectiveAccuracy
        );
        this.game.addProjectile(projectile);
    }

    takeDamage(amount, attackerUnit = null) { 
        if (!this.isAlive()) return; // Already dead, no more damage

        this.hp -= amount;

        if (this.hp <= 0) {
            this.hp = 0;
            if (attackerUnit && attackerUnit.team === 'player' && typeof attackerUnit.addXp === 'function') {
                let killXp = CONFIG.XP_PER_KILL || 5; 
                if (this instanceof PossumHeavy) { 
                    killXp += (CONFIG.XP_FOR_HEAVY_KILL || 10); 
                }
                attackerUnit.addXp(killXp);
                if (typeof attackerUnit.incrementKillCount === 'function') {
                    attackerUnit.incrementKillCount();
                }
            }
            this.die(); // Call existing die method AFTER awarding XP
        }
    }

    die() {
        this.manualTarget = null; 
        this.autoTarget = null;
        this.isMoving = false;
        this.isMovingToEngageManualTarget = false;

        if (this.game && this.game.selectedUnits.includes(this)) {
            this.game.selectedUnits = this.game.selectedUnits.filter(unit => unit !== this);
            if (typeof this.cancelGrenadeAim === 'function' && this.isAimingGrenade) {
                this.cancelGrenadeAim();
            }
            // No need to call UI updates here, game loop handles squad panel,
            // and input handler handles cursor based on selection and hover.
        }

        // --- NEW: Record Raccoon death for debrief ---
        if (this.team === 'player' && this.game && typeof this.game.recordRaccoonFallen === 'function') {
            this.game.recordRaccoonFallen(this);
        }
        // ---------------------------------------------
    }

    isAlive() {
        return this.hp > 0;
    }

    // ... (render, setMoveTarget, setManualTarget methods as before) ...
    render(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        
        if (!this.isAlive()) {
            ctx.fillStyle = this.team === 'player' ? 'darkred' : '#502A14'; 
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2); 
        ctx.fill();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0); 
        ctx.lineTo(this.size * Math.cos(this.facingAngle), this.size * Math.sin(this.facingAngle)); 
        ctx.stroke();
        
        ctx.restore(); 

        if (this.isAlive()) {
            const healthBarWidth = this.size * 1.5;
            const healthBarHeight = 4;
            const healthBarX = this.x - healthBarWidth / 2;
            const healthBarY = this.y - this.size - healthBarHeight - 3; 

            ctx.fillStyle = '#333'; 
            ctx.fillRect(healthBarX -1, healthBarY -1, healthBarWidth + 2, healthBarHeight + 2);
            ctx.fillStyle = 'red';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight); 
            
            const currentHealthWidth = Math.max(0, (this.hp / this.maxHp) * healthBarWidth);
            ctx.fillStyle = 'green';
            ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
        }
    }

    setMoveTarget(x, y) { 
        if (this.actionTimer > 0) return; 
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true; 
        this.manualTarget = null; 
        this.isMovingToEngageManualTarget = false; 
        this.stuckFrames = 0; 
    }

    setManualTarget(target) { 
        if (this.actionTimer > 0 || this.isAimingGrenade) {
            return;
        }
        this.manualTarget = target; 
        this.autoTarget = null;   
        this.isMovingToEngageManualTarget = false; 
        this.stuckFrames = 0; 

        if (target && typeof target.isAlive === 'function' && target.isAlive() && this.weapon) {
            if (target.team && target.team !== 'neutral_object' && this.team === 'player') {
                const distToManualTarget = distance(this.x, this.y, target.x, target.y);
                const preferredEngagementRange = this.weapon.range * 0.85;
                if (distToManualTarget > preferredEngagementRange) {
                    this.isMovingToEngageManualTarget = true; 
                } else {
                    this.isMoving = false; 
                    this.targetX = this.x; 
                    this.targetY = this.y;
                    this.facingAngle = Math.atan2(target.y - this.y, target.x - this.x);
                }
            } else if (target.team === 'neutral_object') { 
                 this.isMoving = false; 
                 this.targetX = this.x; 
                 this.targetY = this.y;
                 this.facingAngle = Math.atan2(target.y - this.y, target.x - this.x);
            }
        } else {
             this.isMovingToEngageManualTarget = false;
        }
    }
}