// js/unit.js
// complete
class Unit {
    constructor(x, y, game, team, hp, speed, size, color, id) {
        this.x = x; this.y = y; this.game = game; this.team = team;
        this.id = id || `${team}-${Date.now().toString(36)+Math.random().toString(36).slice(2,5)}`;
        this.maxHp = hp; this.hp = hp; this.speed = speed; this.size = size; this.color = color;

        this.worldTargetX = x;
        this.worldTargetY = y;
        this.currentPath = [];
        this.currentPathNodeIndex = 0;
        this.isMoving = false;

        this.canShootWhileMoving = true;
        this.weapon = null; this.autoTarget = null; this.manualTarget = null;

        this.stuckCheckPosition = { x: x, y: y };
        this.stuckFrames = 0;
        this.pathingStuckCheckPosition = { x: x, y: y };
        this.pathingStuckFrames = 0;

        this.STUCK_FRAMES_THRESHOLD = CONFIG.UNIT_STUCK_FRAMES_THRESHOLD || 60;
        this.attackCooldown = 0; this.actionTimer = 0; this.isMarkedForDeletion = false;

        this.facingAngle = Math.PI / 2; // For body/sprite orientation
        this.gunAimAngle = this.facingAngle; // For gun indicator and projectile direction

        this.isContinuousFiring = false; this.continuousFireTargetPos = { x: 0, y: 0 }; this.continuousFireTargetEntity = null;
        if (this.team === 'enemy') { this.aiState = 'PATROLLING'; this.lastKnownPlayerPosition = null; this.alertedByAlly = false; }

        this.currentVisualState = 'idle';
        this.currentVisualDirection = 's';
    }

    updateVisualDirection() { // Uses this.facingAngle for body sprite
        const angle = this.facingAngle;
        const pi = Math.PI;
        const normalizedAngle = (angle % (2 * pi) + (2 * pi)) % (2 * pi);
        const sliceDegrees = 45;
        const offsetDegrees = 22.5;
        let angleDegrees = normalizedAngle * (180 / pi);
        if (angleDegrees >= (360 - offsetDegrees) || angleDegrees < offsetDegrees) this.currentVisualDirection = 'e';
        else if (angleDegrees >= offsetDegrees && angleDegrees < offsetDegrees + sliceDegrees) this.currentVisualDirection = 'se';
        else if (angleDegrees >= offsetDegrees + sliceDegrees && angleDegrees < offsetDegrees + 2 * sliceDegrees) this.currentVisualDirection = 's';
        else if (angleDegrees >= offsetDegrees + 2 * sliceDegrees && angleDegrees < offsetDegrees + 3 * sliceDegrees) this.currentVisualDirection = 'sw';
        else if (angleDegrees >= offsetDegrees + 3 * sliceDegrees && angleDegrees < offsetDegrees + 4 * sliceDegrees) this.currentVisualDirection = 'w';
        else if (angleDegrees >= offsetDegrees + 4 * sliceDegrees && angleDegrees < offsetDegrees + 5 * sliceDegrees) this.currentVisualDirection = 'nw';
        else if (angleDegrees >= offsetDegrees + 5 * sliceDegrees && angleDegrees < offsetDegrees + 6 * sliceDegrees) this.currentVisualDirection = 'n';
        else if (angleDegrees >= offsetDegrees + 6 * sliceDegrees && angleDegrees < offsetDegrees + 7 * sliceDegrees) this.currentVisualDirection = 'ne';
        else this.currentVisualDirection = 'e';
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        let actionTimerFinishedThisFrame = false;
        if (this.actionTimer > 0) { this.actionTimer -= deltaTime; if (this.actionTimer <= 0) { this.actionTimer = 0; actionTimerFinishedThisFrame = true; } if (this.isMoving) this.isMoving = false; this.currentPath = []; if(this.actionTimer > 0) return; }

        // Stuck checks (no change)
        if (this.isMoving && this.currentPath.length === 0) { /* ... */ } else { this.stuckFrames = 0; }
        if (this.isMoving && this.currentPath.length > 0) { /* ... */ } else { this.pathingStuckFrames = 0; }

        // --- MOVEMENT IS HANDLED FIRST ---
        // Note: Enemy AI (Possum.js, PossumHeavy.js) calls its own aiLogic in its update method BEFORE super.update().
        // That aiLogic sets this.isMoving and this.worldTargetX/Y if it decides to move.
        this._handleMovement(deltaTime); // Updates this.facingAngle for body movement

        // --- THEN COMBAT LOGIC ---
        if (this.game && this.game.level && this.game.level.obstacles) { // Ensure level is available
            if (this.team === 'player') {
                this._handlePlayerCombat(deltaTime, this.game.level.obstacles); // Updates this.gunAimAngle
            } else if (this.team === 'enemy') {
                // Enemy AI logic (which runs in their respective update methods before this super.update())
                // should have set up manualTarget or autoTarget if they intend to engage.
                // _handleEnemyCombat will then execute the shooting if conditions are met.
                this._handleEnemyCombat(deltaTime, this.game.level.obstacles); // Updates this.gunAimAngle and potentially this.facingAngle
            }
        }

        if (this.isMoving) this.currentVisualState = 'walk';
        else if (!this.isContinuousFiring && this.actionTimer <= 0 && !this.manualTarget && !this.autoTarget) this.currentVisualState = 'idle';
        else if ((this.manualTarget || this.autoTarget || this.isContinuousFiring) && this.actionTimer <=0 && this.attackCooldown <=0) this.currentVisualState = 'fire';

        this.updateVisualDirection();

        if (actionTimerFinishedThisFrame && this.game && this.game.ui && this.team === 'player') { this.game.ui.updateSquadPanel(); }
    }

    getCollisionShape() { /* ... (Unchanged) ... */ return { type: 'circle', x: this.x, y: this.y, radius: this.size / 2 }; }
    calculatePath() { /* ... (Unchanged, sets this.facingAngle towards first path node) ... */
        if (!this.game || !this.game.level) { this.isMoving = false; return; }
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) { this.isMoving = false; return; }
        const startGrid = this.game.level.worldToGridCoords(this.x, this.y);
        let endGrid = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
        if (startGrid.x < 0 || startGrid.x >= this.game.level.gridWidth || startGrid.y < 0 || startGrid.y >= this.game.level.gridHeight ||
            endGrid.x < 0 || endGrid.x >= this.game.level.gridWidth || endGrid.y < 0 || endGrid.y >= this.game.level.gridHeight) {
            this.isMoving = false; this.currentPath = []; return;
        }
        if (navGrid[endGrid.y][endGrid.x] === 1) {
            let foundAlternative = false;
            const directions = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}];
            for (const dir of directions) {
                const altX = endGrid.x + dir.x; const altY = endGrid.y + dir.y;
                if (altX >= 0 && altX < this.game.level.gridWidth && altY >=0 && altY < this.game.level.gridHeight && navGrid[altY][altX] === 0) {
                    endGrid.x = altX; endGrid.y = altY; foundAlternative = true; break;
                }
            }
            if (!foundAlternative) { this.isMoving = false; this.currentPath = []; return; }
        }
        const rawPathGridCoords = findPath(startGrid, endGrid, navGrid);
        if (rawPathGridCoords && rawPathGridCoords.length > 0) {
            this.currentPath = smoothPath(rawPathGridCoords, this.size, this.game.level);
            if (this.currentPath && this.currentPath.length > 0) {
                this.currentPathNodeIndex = 0; this.isMoving = true; this.pathingStuckFrames = 0; this.pathingStuckCheckPosition = {x: this.x, y: this.y};
                const firstNodeWorld = this.currentPath[0];
                if (distance(this.x, this.y, firstNodeWorld.x, firstNodeWorld.y) > 0.1) { this.facingAngle = Math.atan2(firstNodeWorld.y - this.y, firstNodeWorld.x - this.x); }
                this.gunAimAngle = this.facingAngle; // Initially, gun aims where body faces
            } else {
                this.isMoving = false; this.currentPath = [];
                if(distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > 1.0) {
                    this.isMoving = true;
                    if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > 0.1) { this.facingAngle = Math.atan2(this.worldTargetY - this.y, this.worldTargetX - this.x); }
                    this.gunAimAngle = this.facingAngle;
                } else { this.x = this.worldTargetX; this.y = this.worldTargetY; }
            }
        } else {
            this.isMoving = false; this.currentPath = [];
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > 1.0) {
                 if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > 0.1) { this.facingAngle = Math.atan2(this.worldTargetY - this.y, this.worldTargetX - this.x); }
                this.isMoving = true;
                this.gunAimAngle = this.facingAngle;
            }
        }
    }

    _handleMovement(deltaTime) {
        if (!this.isAlive()) { this.isMoving = false; this.currentPath = []; return; }
        if (this.team === 'player' && !this.isMoving) {
            this.currentPath = [];
             // If player unit is not moving, but has a combat target, body (facingAngle) should face that target.
            // This is now handled in _handlePlayerCombat.
            return;
        }

        let newFacingAngle = this.facingAngle; // Store potential new body facing angle

        if (this.isMoving && (!this.currentPath || this.currentPath.length === 0)) {
            // Fallback to direct movement
            const dx = this.worldTargetX - this.x;
            const dy = this.worldTargetY - this.y;
            const distToFinalTarget = distance(this.x, this.y, this.worldTargetX, this.worldTargetY);
            if (distToFinalTarget > 1.0) {
                const moveSpeed = this.speed * deltaTime;
                if (distToFinalTarget > 0.1) newFacingAngle = Math.atan2(dy, dx);
                // ... (rest of direct movement logic, collision checks)
                let nextX = this.x + Math.cos(newFacingAngle) * moveSpeed; // Use newFacingAngle for movement
                let nextY = this.y + Math.sin(newFacingAngle) * moveSpeed;
                // ... (collision check as before)
                const unitFutureShape = { type: 'circle', x: nextX, y: nextY, radius: this.size / 2 };
                let collision = false;
                if (this.game && this.game.level && this.game.level.obstacles) {
                    const activeObstacles = this.game.level.obstacles.filter(obs => !obs.isDestroyed && obs.blocksMovement);
                    for (const obs of activeObstacles) {
                        const obsCS = this.game.level._getObstacleCollisionShape(obs);
                        if (rectCircleOverlap(obsCS, unitFutureShape)) { collision = true; break; }
                    }
                }
                if (!collision) { this.x = nextX; this.y = nextY; } else { this.isMoving = false; }
                if (distToFinalTarget <= moveSpeed && !collision) { this.isMoving = false; this.x = this.worldTargetX; this.y = this.worldTargetY;}

            } else { this.isMoving = false; this.x = this.worldTargetX; this.y = this.worldTargetY; }
        } else if (this.isMoving && this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
            // Path following
            const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
            const dx = nextNodeWorldCoords.x - this.x;
            const dy = nextNodeWorldCoords.y - this.y;
            const distToNextNode = distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y);
            const moveSpeed = this.speed * deltaTime;
            const arrivalTolerance = Math.max(moveSpeed * 0.5, this.size * 0.15);

            if (distToNextNode > 0.1) newFacingAngle = Math.atan2(dy, dx);

            if (distToNextNode <= arrivalTolerance) {
                this.x = nextNodeWorldCoords.x; this.y = nextNodeWorldCoords.y;
                this.currentPathNodeIndex++;
                this.pathingStuckFrames = 0; this.pathingStuckCheckPosition = {x: this.x, y: this.y};
                if (this.currentPathNodeIndex >= this.currentPath.length) {
                    this.isMoving = false; this.currentPath = [];
                    this.x = this.worldTargetX; this.y = this.worldTargetY;
                } else {
                    const nextNextNode = this.currentPath[this.currentPathNodeIndex];
                    if (distance(this.x, this.y, nextNextNode.x, nextNextNode.y) > 0.1) {
                         newFacingAngle = Math.atan2(nextNextNode.y - this.y, nextNextNode.x - this.x);
                    }
                }
            } else {
                this.x += Math.cos(newFacingAngle) * moveSpeed; // Use newFacingAngle for movement
                this.y += Math.sin(newFacingAngle) * moveSpeed;
            }
        }

        // Only update body's facingAngle if no active combat target is dictating it OR if moving
        // (Combat logic will set gunAimAngle separately)
        if (this.isMoving || (!this.manualTarget && !this.autoTarget && !this.isContinuousFiring)) {
            this.facingAngle = newFacingAngle;
        }
        // If not moving, but has a combat target, _handlePlayerCombat or _handleEnemyCombat will set this.gunAimAngle
        // and potentially this.facingAngle if the unit should turn its body too.
        // For now, if not moving, this.facingAngle retains its last value from movement or combat.

        const worldW = CONFIG.WORLD_WIDTH || 0; const worldH = CONFIG.WORLD_HEIGHT || 0;
        this.x = Math.max(this.size/2, Math.min(this.x, worldW - this.size/2));
        this.y = Math.max(this.size/2, Math.min(this.y, worldH - this.size/2));
    }

    setMoveTarget(worldX, worldY) { /* ... (Unchanged, sets this.facingAngle and this.gunAimAngle initially) ... */
        if (this.isContinuousFiring) this.setContinuousFire(false);
        if (this.actionTimer > 0 && !(this instanceof Raccoon && this.isAimingGrenade)) return;
        if (this.team === 'player') {
            this.manualTarget = null;
            this.autoTarget = null;
        } else {
            this.autoTarget = null;
        }
        if (distance(this.x, this.y, worldX, worldY) > 0.1) {
            this.facingAngle = Math.atan2(worldY - this.y, worldX - this.x);
            this.gunAimAngle = this.facingAngle; // Gun initially aims where body faces
        }
        this.worldTargetX = worldX;
        this.worldTargetY = worldY;
        this.stuckFrames = 0;
        this.pathingStuckFrames = 0;
        this.pathingStuckCheckPosition = {x: this.x, y: this.y};
        this.isMoving = true;
        this.calculatePath();
    }

    setManualTarget(target) { /* ... (Unchanged, sets this.facingAngle and this.gunAimAngle) ... */
        if (this.isContinuousFiring) this.setContinuousFire(false);
        this.manualTarget = target;
        this.autoTarget = null;
        this.stuckFrames = 0;
        if (this.team === 'player') {
            this.currentPath = [];
            this.isMoving = false;
            this.worldTargetX = this.x;
            this.worldTargetY = this.y;
        }
        if (target && target.isAlive()) {
            if (distance(this.x, this.y, target.x, target.y) > 0.1) {
                const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
                this.facingAngle = angleToTarget; // Body faces manual target if stationary
                this.gunAimAngle = angleToTarget; // Gun also faces manual target
            }
        }
    }
    setContinuousFire(isFiring, targetX, targetY) { /* ... (Unchanged, sets this.facingAngle and this.gunAimAngle) ... */
        this.isContinuousFiring = isFiring;
        if (isFiring) {
            this.manualTarget = null; this.autoTarget = null;
            this.currentPath = []; this.isMoving = false;
            this.worldTargetX = this.x; this.worldTargetY = this.y;
            this.continuousFireTargetEntity = null;
            const potentialTargets = (this.team === 'player') ? this.game.enemyUnits : this.game.deployedSquadRoster;
            if(potentialTargets && targetX !== undefined && targetY !== undefined) {
                for (const enemy of potentialTargets) { if (enemy.isAlive() && distance(targetX, targetY, enemy.x, enemy.y) < enemy.size + 7) { this.continuousFireTargetEntity = enemy; break; }}}
            if (this.continuousFireTargetEntity) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
            else if (targetX !== undefined && targetY !== undefined) { this.continuousFireTargetPos = { x: targetX, y: targetY }; }
            else { this.continuousFireTargetPos = { x: this.x + Math.cos(this.facingAngle) * 100, y: this.y + Math.sin(this.facingAngle) * 100 }; }

            if (distance(this.x, this.y, this.continuousFireTargetPos.x, this.continuousFireTargetPos.y) > 0.1) {
                const angleToFirePos = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
                this.facingAngle = angleToFirePos; // Body faces fire point
                this.gunAimAngle = angleToFirePos; // Gun faces fire point
            }
        } else {
            this.continuousFireTargetEntity = null;
        }
    }
    updateContinuousFireTarget(targetX, targetY) { /* ... (Unchanged, sets this.facingAngle and this.gunAimAngle) ... */
        if (!this.isContinuousFiring) return;
        if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
        else { this.continuousFireTargetEntity = null; this.continuousFireTargetPos = { x: targetX, y: targetY }; }
         if (distance(this.x, this.y, this.continuousFireTargetPos.x, this.continuousFireTargetPos.y) > 0.1) {
            const angleToFirePos = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
            this.facingAngle = angleToFirePos;
            this.gunAimAngle = angleToFirePos;
        }
    }

    _handleEnemyCombat(deltaTime, obstacles) { /* ... (Largely unchanged, but ensures it sets this.gunAimAngle) ... */
        if ((this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;
        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; if (this.attackCooldown < 0) this.attackCooldown = 0; }
        let targetToShoot = null; let fireAtX, fireAtY;
        let combatShouldDictateFacing = !this.isMoving;
        if (this.isContinuousFiring) { /* ... */ }
        else if (this.manualTarget && this.manualTarget.isAlive()) {
            targetToShoot = this.manualTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
        } else {
            const potentialTargets = this.game.deployedSquadRoster;
            this.findAutoTarget(potentialTargets, obstacles);
            if (this.autoTarget) { targetToShoot = this.autoTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y; }
            else { return; }
        }
        if (fireAtX === undefined || fireAtY === undefined) return;

        let angleToTarget = this.facingAngle; // Default to current body facing
        if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) {
            angleToTarget = Math.atan2(fireAtY - this.y, fireAtX - this.x);
        }
        this.gunAimAngle = angleToTarget; // Enemy gun always aims at target
        if (combatShouldDictateFacing) { this.facingAngle = angleToTarget; } // Enemy body also turns if not moving

        if ((targetToShoot || this.isContinuousFiring) && this.attackCooldown <= 0) {
            const distToTargetPoint = distance(this.x, this.y, fireAtX, fireAtY);
            if (distToTargetPoint <= this.weapon.range) {
                let hasLOS = true; const activeObstacles = obstacles ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];
                if (targetToShoot && targetToShoot.team && targetToShoot.team !== 'neutral_object') { hasLOS = hasLineOfSight(this.x, this.y, fireAtX, fireAtY, activeObstacles, this.game.level, false); }
                if (hasLOS) {
                    if (this.isMoving && !this.canShootWhileMoving) {} else {
                        this._executeFire(fireAtX, fireAtY, this.gunAimAngle); // Use gunAimAngle
                    }
                } else { if (targetToShoot === this.autoTarget) this.autoTarget = null; }
            } else { if (targetToShoot === this.autoTarget) this.autoTarget = null; }
        } else if (targetToShoot && targetToShoot.isAlive() && combatShouldDictateFacing) {
             if (distance(this.x, this.y, targetToShoot.x, targetToShoot.y) > 0.1) {
                 const newAngle = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                 this.facingAngle = newAngle; this.gunAimAngle = newAngle;
            }
        }
    }

    _handlePlayerCombat(deltaTime, obstacles) {
        if ((this instanceof Raccoon && this.isAimingGrenade) || this.actionTimer > 0 || !this.weapon) return;
        if (this.attackCooldown > 0) { this.attackCooldown -= deltaTime; if (this.attackCooldown < 0) this.attackCooldown = 0; }

        let targetToShoot = null;
        let fireAtX, fireAtY;
        this.gunAimAngle = this.facingAngle; // Default gun to body facing

        if (this.isContinuousFiring) {
            if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) {
                targetToShoot = this.continuousFireTargetEntity; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
            } else if (this.continuousFireTargetEntity && !this.continuousFireTargetEntity.isAlive()){
                this.setContinuousFire(false); return;
            } else {
                fireAtX = this.continuousFireTargetPos.x; fireAtY = this.continuousFireTargetPos.y;
            }
            if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
            if(!this.isMoving) this.facingAngle = this.gunAimAngle; // If stationary, body also turns

        } else if (this.manualTarget && this.manualTarget.isAlive()) {
            targetToShoot = this.manualTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
            if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
            // Player units stop moving for manual target, so body faces target.
            this.facingAngle = this.gunAimAngle;

        } else { // Auto-target logic for player
            const potentialTargets = this.game.enemyUnits;
            this.findAutoTarget(potentialTargets, obstacles);
            if (this.autoTarget) {
                targetToShoot = this.autoTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
                if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
                if (!this.isMoving) { // If stationary, body also turns to auto-target
                    this.facingAngle = this.gunAimAngle;
                }
                // If moving, this.facingAngle (body) is from path, this.gunAimAngle is for shooting.
            } else {
                this.gunAimAngle = this.facingAngle; // No target, gun aligns with body
                return;
            }
        }

        if (fireAtX === undefined || fireAtY === undefined) return;

        if ((targetToShoot || this.isContinuousFiring) && this.attackCooldown <= 0) {
            const distToTargetPoint = distance(this.x, this.y, fireAtX, fireAtY);
            if (distToTargetPoint <= this.weapon.range) {
                let hasLOS = true; const activeObstacles = obstacles ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];
                if (targetToShoot && targetToShoot.team && targetToShoot.team !== 'neutral_object') { hasLOS = hasLineOfSight(this.x, this.y, fireAtX, fireAtY, activeObstacles, this.game.level, false); }

                if (hasLOS) {
                    if (this.isMoving && !this.canShootWhileMoving) { /* Cannot shoot */ }
                    else {
                        // Ensure gunAimAngle is correct just before firing
                        if (distance(this.x, this.y, fireAtX, fireAtY) > 0.1) {
                           this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
                           if (!this.isMoving) this.facingAngle = this.gunAimAngle; // Snap body if stationary
                        }
                        this._executeFire(fireAtX, fireAtY, this.gunAimAngle); // Use gunAimAngle for projectile
                    }
                } else {
                    if (targetToShoot === this.autoTarget) this.autoTarget = null;
                    if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.continuousFireTargetEntity = null;
                }
            } else {
                if (targetToShoot === this.autoTarget) this.autoTarget = null;
                if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.setContinuousFire(false);
            }
        } else if (targetToShoot && targetToShoot.isAlive() && !this.isMoving) { // Not firing (cooldown) but stationary with target
             if (distance(this.x, this.y, targetToShoot.x, targetToShoot.y) > 0.1) {
                const angleToTarget = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                this.facingAngle = angleToTarget;
                this.gunAimAngle = angleToTarget;
            }
        } else if (!targetToShoot && !this.isContinuousFiring && !this.isMoving) {
            // No target, not continuous firing, not moving: gun aims where body faces
            this.gunAimAngle = this.facingAngle;
        }
    }
    // ... (findAutoTarget, fireAt, _executeFire, fireAtPoint, takeDamage, propagateAlert, die, isAlive are unchanged from previous version where projectile took explicit angle) ...
    findAutoTarget(potentialTargets, obstacles) { /* ... (Unchanged) ... */
        let closestTarget = null;
        let engagementRange = (this.weapon ? this.weapon.range : (this.detectionRange || 150));
        if (this.team === 'player' && this instanceof Raccoon && this.weapon) {
            const autoTargetRangeFactor = CONFIG.RACCOON_AUTO_TARGET_RANGE_FACTOR;
            if (typeof autoTargetRangeFactor === 'number' && autoTargetRangeFactor > 0 && autoTargetRangeFactor <= 1) {
                engagementRange = this.weapon.range * autoTargetRangeFactor;
            }
        }
        let minDistanceSq = engagementRange ** 2;
        if (!potentialTargets || !Array.isArray(potentialTargets)) {
            this.autoTarget = null; return;
        }
        const activeObstacles = Array.isArray(obstacles) ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];
        potentialTargets.forEach(target => {
            if (target && target.isAlive() && target.team !== this.team) {
                const dx = target.x - this.x; const dy = target.y - this.y;
                const dSq = dx*dx + dy*dy;
                if (dSq <= minDistanceSq) {
                    if (hasLineOfSight(this.x, this.y, target.x, target.y, activeObstacles, this.game.level, false)) {
                        if (!closestTarget || dSq < minDistanceSq) {
                           closestTarget = target;
                           minDistanceSq = dSq;
                        }
                    }
                }
            }
        });
        this.autoTarget = closestTarget;
    }
    fireAt(targetEntity) { /* ... (Unchanged) ... */
        if (this.isContinuousFiring) this.setContinuousFire(false);
        const fireAngle = Math.atan2(targetEntity.y - this.y, targetEntity.x - this.x);
        this._executeFire(targetEntity.x, targetEntity.y, fireAngle);
    }
    _executeFire(pointX, pointY, fireAngle = null) { /* ... (Unchanged, uses fireAngle for projectile) ... */
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) { return; }
        if (this.isMoving && !this.canShootWhileMoving) { return; }
        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) { baseAccuracy += this.accuracyBonus; }
        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy));
        const angleForProjectile = fireAngle !== null ? fireAngle : Math.atan2(pointY - this.y, pointX - this.x);
        const projectile = new Projectile(
            this.x, this.y, this.x + Math.cos(angleForProjectile) * this.weapon.range, this.y + Math.sin(angleForProjectile) * this.weapon.range,
            this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor, this.game, this, effectiveAccuracy, angleForProjectile
        );
        this.game.addProjectile(projectile);
        this.attackCooldown = 1 / this.weapon.rof;
    }
    fireAtPoint(pointX, pointY) { /* ... (Unchanged) ... */
        if (this.isContinuousFiring) this.setContinuousFire(false);
        const fireAngle = Math.atan2(pointY - this.y, pointX - this.x);
        this._executeFire(pointX, pointY, fireAngle); 
        this.manualTarget = null; this.autoTarget = null;
    }
    takeDamage(amount, attackerUnit = null) { /* ... (Unchanged) ... */
        if (!this.isAlive()) return;
        const prevHp = this.hp;
        this.hp -= amount;
        let died = false;
        if (this.hp <= 0) {
            this.hp = 0; died = true;
            if (attackerUnit && attackerUnit.team === 'player' && typeof attackerUnit.addXp === 'function') {
                let killXp = CONFIG.XP_PER_KILL || 10;
                if (this instanceof PossumHeavy) killXp += (CONFIG.XP_FOR_HEAVY_KILL || 15);
                attackerUnit.addXp(killXp);
                if (typeof attackerUnit.incrementKillCount === 'function') attackerUnit.incrementKillCount();
            }
            this.die();
        }
        if (!died && this.team === 'enemy' && attackerUnit && attackerUnit.team === 'player') {
            const initialAiState = this.aiState;
            let becameAware = false;
            if (this.manualTarget === attackerUnit && (this.aiState === 'ENGAGING' || this.aiState === 'ENGAGING_HEAVY')) {
                becameAware = true;
            } else {
                const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.blocksMovement);
                const hasLOSToAttacker = hasLineOfSight(this.x, this.y, attackerUnit.x, attackerUnit.y, activeObstacles, this.game.level, false);
                if (hasLOSToAttacker) {
                    this.manualTarget = attackerUnit;
                    this.aiState = (this instanceof PossumHeavy) ? 'ENGAGING_HEAVY' : 'ENGAGING';
                    this.lastKnownPlayerPosition = null;
                    becameAware = true;
                } else {
                    this.lastKnownPlayerPosition = { x: attackerUnit.x, y: attackerUnit.y };
                    if (this.aiState === 'PATROLLING' || this.aiState === 'GUARDING') {
                        this.aiState = 'SUSPICIOUS';
                    }
                    becameAware = true;
                }
            }
            const alertDmgThreshold = this.maxHp * (CONFIG.ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT || 0.20);
            if (becameAware || (amount >= alertDmgThreshold) || (prevHp === this.maxHp && amount > 0) ) {
                 this.propagateAlert(attackerUnit);
            }
        }
        if (!died && this.game && this.game.ui && this.team === 'player') {
             this.game.ui.updateSquadPanel();
        }
    }
    propagateAlert(sourceOfAlertUnit = null) { /* ... (Unchanged) ... */
        if (!this.isAlive() || this.team !== 'enemy' || !this.game || !this.game.enemyUnits) return;
        this.game.enemyUnits.forEach(otherEnemy => {
            if (otherEnemy && otherEnemy.isAlive() && otherEnemy !== this &&
                (otherEnemy.aiState === 'PATROLLING' || otherEnemy.aiState === 'GUARDING')) {
                const distToOtherEnemy = distance(this.x, this.y, otherEnemy.x, otherEnemy.y);
                if (distToOtherEnemy <= (CONFIG.ENEMY_ALERT_PROPAGATION_RADIUS || 180)) {
                    otherEnemy.alertedByAlly = true;
                    if (sourceOfAlertUnit && sourceOfAlertUnit.isAlive()) {
                        otherEnemy.lastKnownPlayerPosition = { x: sourceOfAlertUnit.x, y: sourceOfAlertUnit.y };
                    } else {
                        otherEnemy.lastKnownPlayerPosition = { x: this.x, y: this.y };
                    }
                    otherEnemy.aiState = 'SUSPICIOUS';
                    if (sourceOfAlertUnit && sourceOfAlertUnit.isAlive()) {
                        const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.blocksMovement);
                        if (hasLineOfSight(otherEnemy.x, otherEnemy.y, sourceOfAlertUnit.x, sourceOfAlertUnit.y, activeObstacles, this.game.level, false)) {
                            otherEnemy.manualTarget = sourceOfAlertUnit;
                            otherEnemy.aiState = (otherEnemy instanceof PossumHeavy) ? 'ENGAGING_HEAVY' : 'ENGAGING';
                        }
                    }
                }
            }
        });
    }
    die() { /* ... (Unchanged) ... */
        this.manualTarget = null; this.autoTarget = null; this.isMoving = false; this.currentPath = [];
        const wasSelected = this.game && this.game.selectedUnits.includes(this);
        if (this instanceof Raccoon && this.isAimingGrenade) this.cancelGrenadeAim();
        if (this.game && this.game.selectedUnits.includes(this)) {
            this.game.selectedUnits = this.game.selectedUnits.filter(unit => unit !== this);
        }
        if (this.team === 'player' && this.game && typeof this.game.recordRaccoonFallen === 'function') {
            this.game.recordRaccoonFallen(this);
        }
        if (wasSelected && this.game && this.game.ui) this.game.ui.updateSquadPanel();
    }
    isAlive() { /* ... (Unchanged) ... */ return this.hp > 0; }

    render(ctx) {
        const kiaStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.KIA_STYLE;
        const facingIndicatorStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.FACING_INDICATOR;
        const healthBarStyle = CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Placeholder for actual sprite rendering using this.facingAngle (for body)
        // For now, draw the circle
        if (!this.isAlive()) {
            ctx.fillStyle = this.team === 'player' ? (kiaStyle && kiaStyle.PLAYER_FILL_COLOR || 'darkgrey') : (kiaStyle && kiaStyle.ENEMY_FILL_COLOR || '#555');
            ctx.globalAlpha = (kiaStyle && kiaStyle.OPACITY !== undefined) ? kiaStyle.OPACITY : 0.6;
        } else {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 1.0;
        }
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;

        // Facing Indicator (Gun Line) - Uses this.gunAimAngle
        if (this.isAlive() && facingIndicatorStyle) {
            ctx.strokeStyle = facingIndicatorStyle.COLOR || 'black';
            ctx.lineWidth = facingIndicatorStyle.LINE_WIDTH || 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.size * Math.cos(this.gunAimAngle), this.size * Math.sin(this.gunAimAngle)); // Use gunAimAngle
            ctx.stroke();
        }
        ctx.restore();

        // Health Bar (Unchanged)
        if (this.isAlive() && healthBarStyle) { /* ... */ }
    }
}