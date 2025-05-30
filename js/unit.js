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

        this.lastPosition = { x: x, y: y };
        this.currentVelocity = { x: 0, y: 0 };
        this.velocitySampleTime = 0.1;
        this.timeSinceLastVelocitySample = 0;

        this.lastDeltaX = 0;
        this.lastDeltaY = 0;


        this.canShootWhileMoving = true;
        this.weapon = null; this.autoTarget = null; this.manualTarget = null;

        this.stuckCheckPosition = { x: x, y: y };
        this.pathingStuckCheckPosition = { selfX: x, selfY: y, distToNode: Infinity };
        this.stuckFrames = 0;
        this.pathingStuckFrames = 0;
        this.lastRepathAttemptTime = 0;
        this.REPATH_STUCK_COOLDOWN = CONFIG.REPATH_STUCK_COOLDOWN || 0.75;

        this.lastOnStuckTime = 0;
        this.consecutiveStuckAttempts = 0;
        const constructorNameUpper = this.constructor.name.toUpperCase();
        this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL = (
            this.team === 'enemy' &&
            CONFIG.AI &&
            CONFIG.AI[constructorNameUpper] &&
            CONFIG.AI[constructorNameUpper].MAX_CONSECUTIVE_STUCK_ATTEMPTS
        ) ? CONFIG.AI[constructorNameUpper].MAX_CONSECUTIVE_STUCK_ATTEMPTS : 3;


        this.STUCK_FRAMES_THRESHOLD = CONFIG.UNIT_STUCK_FRAMES_THRESHOLD || 45;
        this.STUCK_FRAMES_THRESHOLD_PATHING = CONFIG.STUCK_FRAMES_THRESHOLD_PATHING || 30;

        this.attackCooldown = 0; this.actionTimer = 0; this.isMarkedForDeletion = false;
        this.facingAngle = Math.PI / 2; // Body's physical orientation
        this.gunAimAngle = this.facingAngle; // Direction gun is aimed
        this.isContinuousFiring = false; this.continuousFireTargetPos = { x: 0, y: 0 }; this.continuousFireTargetEntity = null;

        this.aiState = (this.team === 'enemy') ? 'PATROLLING' : 'IDLE';
        this.lastKnownPlayerPosition = null;
        this.alertedByAlly = false;

        this.currentVisualState = 'idle';
        this.currentVisualDirection = 's';
        this.spriteBaseName = 'unknown'; // Default
        if (this instanceof Raccoon) this.spriteBaseName = 'raccoon';
        else if (this instanceof PossumHeavy) this.spriteBaseName = 'possum_heavy';
        else if (this instanceof PossumGrunt) this.spriteBaseName = 'possum_grunt';


        this.isPhasing = false;
        this.phasingTimer = 0;
        this.assignedDeadSpritePath = null;
        this.deathRotationAngle = 0; 
    }


    updateVisualDirection(angleToUse) {
        const angle = angleToUse;
        const twoPi = Math.PI * 2;
        const normalizedAngle = ((angle % twoPi) + twoPi) % twoPi;

        const slice = Math.PI / 4;
        const offset = Math.PI / 8;

        if (normalizedAngle >= (7 * slice + offset) || normalizedAngle < (slice - offset)) {
            this.currentVisualDirection = 'e';
        } else if (normalizedAngle >= (slice - offset) && normalizedAngle < (2 * slice - offset)) {
            this.currentVisualDirection = 'se';
        } else if (normalizedAngle >= (2 * slice - offset) && normalizedAngle < (3 * slice - offset)) {
            this.currentVisualDirection = 's';
        } else if (normalizedAngle >= (3 * slice - offset) && normalizedAngle < (4 * slice - offset)) {
            this.currentVisualDirection = 'sw';
        } else if (normalizedAngle >= (4 * slice - offset) && normalizedAngle < (5 * slice - offset)) {
            this.currentVisualDirection = 'w';
        } else if (normalizedAngle >= (5 * slice - offset) && normalizedAngle < (6 * slice - offset)) {
            this.currentVisualDirection = 'nw';
        } else if (normalizedAngle >= (6 * slice - offset) && normalizedAngle < (7 * slice - offset)) {
            this.currentVisualDirection = 'n';
        } else {
            this.currentVisualDirection = 'ne';
        }
    }

    _updateVelocity(deltaTime) {
        this.timeSinceLastVelocitySample += deltaTime;
        if (this.timeSinceLastVelocitySample >= this.velocitySampleTime) {
            const dx = this.x - this.lastPosition.x;
            const dy = this.y - this.lastPosition.y;
            if (this.timeSinceLastVelocitySample > 1e-5) {
                this.currentVelocity.x = dx / this.timeSinceLastVelocitySample;
                this.currentVelocity.y = dy / this.timeSinceLastVelocitySample;
            } else {
                this.currentVelocity.x = 0;
                this.currentVelocity.y = 0;
            }
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
            this.timeSinceLastVelocitySample = 0;
        }
    }


    update(deltaTime) {
        if (!this.isAlive()) return;

        this._updateVelocity(deltaTime);

        if (this.isPhasing) {
            this.phasingTimer -= deltaTime;
            if (this.phasingTimer <= 0) {
                this.isPhasing = false;
                if (this.isMoving && distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id}] Phasing ended. Attempting repath to final target.`);
                    this.setMoveTarget(this.worldTargetX, this.worldTargetY);
                } else {
                    this.isMoving = false;
                }
            }
        }

        let actionTimerFinishedThisFrame = false;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.actionTimer = 0;
                actionTimerFinishedThisFrame = true;
            }
        }

        const currentTime = performance.now() / 1000;

        // Stuck frame counting logic
        if (this.isMoving) {
            if (this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
                const distToCurrentNode = distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y);
                const movedSignificantlyFromLastSelf = distance(this.x, this.y, this.pathingStuckCheckPosition.selfX, this.pathingStuckCheckPosition.selfY) > 0.75;
                if (distToCurrentNode >= (this.pathingStuckCheckPosition.distToNode || distToCurrentNode) - 0.75 && !movedSignificantlyFromLastSelf) {
                    this.pathingStuckFrames++;
                } else {
                    this.pathingStuckFrames = 0;
                }
                this.pathingStuckCheckPosition = { distToNode: distToCurrentNode, selfX: this.x, selfY: this.y };
                if (this.pathingStuckFrames > this.STUCK_FRAMES_THRESHOLD_PATHING && (currentTime - this.lastRepathAttemptTime > this.REPATH_STUCK_COOLDOWN) && !this.isPhasing) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id}] Stuck on path. Triggering onStuck.`);
                    this.lastRepathAttemptTime = currentTime;
                    if (typeof this.onStuck === 'function') this.onStuck('path_follow_stuck'); else { this.isMoving = false; this.currentPath = []; }
                    if(this.isMoving && this.currentPath && this.currentPath.length > 0 && this.currentPathNodeIndex < this.currentPath.length) {
                         const newNextNode = this.currentPath[this.currentPathNodeIndex];
                         this.pathingStuckCheckPosition = { distToNode: distance(this.x, this.y, newNextNode.x, newNextNode.y), selfX: this.x, selfY: this.y };
                    } else { this.pathingStuckCheckPosition = {distToNode: Infinity, selfX: this.x, selfY: this.y }; }
                }
            } else if (!this.currentPath || this.currentPath.length === 0) { // Direct movement
                if (distance(this.x, this.y, this.stuckCheckPosition.x, this.stuckCheckPosition.y) < 0.1) this.stuckFrames++; else { this.stuckFrames = 0; this.stuckCheckPosition.x = this.x; this.stuckCheckPosition.y = this.y; }
                if (this.stuckFrames > this.STUCK_FRAMES_THRESHOLD && !this.isPhasing) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id}] Stuck on direct move. Triggering onStuck.`);
                    if (typeof this.onStuck === 'function') this.onStuck('direct_move_stuck_no_path'); else this.isMoving = false;
                    this.stuckFrames = 0;
                }
            }
        } else { // Not isMoving
            this.stuckFrames = 0;
            this.pathingStuckFrames = 0;
            this.pathingStuckCheckPosition = {distToNode: Infinity, selfX: this.x, selfY: this.y };
        }

        this.lastDeltaX = 0;
        this.lastDeltaY = 0;
        this._handleMovement(deltaTime);

        // Determine gunAimAngle
        if (!(this instanceof Raccoon && this.isAimingGrenade)) {
            if (this.isContinuousFiring && this.continuousFireTargetPos) {
                if (distance(this.x, this.y, this.continuousFireTargetPos.x, this.continuousFireTargetPos.y) > 0.1) {
                    this.gunAimAngle = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
                }
            } else if (this.manualTarget && this.manualTarget.isAlive()) {
                if (distance(this.x, this.y, this.manualTarget.x, this.manualTarget.y) > 0.1) {
                    this.gunAimAngle = Math.atan2(this.manualTarget.y - this.y, this.manualTarget.x - this.x);
                }
            } else if (this.autoTarget && this.autoTarget.isAlive()) {
                 if (distance(this.x, this.y, this.autoTarget.x, this.autoTarget.y) > 0.1) {
                    this.gunAimAngle = Math.atan2(this.autoTarget.y - this.y, this.autoTarget.x - this.x);
                }
            }
        }

        // Combat logic
        if (this.game && this.game.level && this.game.level.obstacles) {
            if (this.team === 'player') {
                this._handlePlayerCombat(deltaTime, this.game.level.obstacles);
            } else if (this.team === 'enemy') {
                this._handleEnemyCombat(deltaTime, this.game.level.obstacles);
            }
        }

        // Determine visual animation state
        if (!this.isAlive()) {
            this.currentVisualState = 'death';
        } else if (this.isMoving) {
            this.currentVisualState = 'walk';
        } else if ((this.manualTarget || this.autoTarget || this.isContinuousFiring) && this.attackCooldown <= 0 && this.actionTimer <= 0 && !(this instanceof Raccoon && this.isAimingGrenade)) {
            this.currentVisualState = 'fire';
        } else {
            this.currentVisualState = 'idle';
        }

        if (this instanceof Raccoon && this.isAimingGrenade) {
        } else if (this instanceof Raccoon) {
            const isPotentiallyEngaging = (this.isContinuousFiring && this.continuousFireTargetPos) ||
                                       (this.manualTarget && this.manualTarget.isAlive()) ||
                                       (this.autoTarget && this.autoTarget.isAlive()); 
            if (isPotentiallyEngaging) {
                this.facingAngle = this.gunAimAngle; 
            } else if (this.isMoving && (Math.abs(this.lastDeltaX) > 1e-5 || Math.abs(this.lastDeltaY) > 1e-5)) {
                this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
            }
        } else if (this.team === 'enemy') { 
            const isActivelyEngagedForEnemy = (this.manualTarget && this.manualTarget.isAlive()) ||
                                          (this.autoTarget && this.autoTarget.isAlive() && this.attackCooldown <= 0);
            if (isActivelyEngagedForEnemy && !this.isMoving) { 
                this.facingAngle = this.gunAimAngle;
            } else if (this.isMoving && (Math.abs(this.lastDeltaX) > 1e-5 || Math.abs(this.lastDeltaY) > 1e-5)) {
                this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
            }
        } else if (this.isMoving && (Math.abs(this.lastDeltaX) > 1e-5 || Math.abs(this.lastDeltaY) > 1e-5)) {
            this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
        }

        const hasSpecificGunTarget = (this.isContinuousFiring && this.continuousFireTargetPos) ||
                                   (this.manualTarget && this.manualTarget.isAlive()) ||
                                   (this.autoTarget && this.autoTarget.isAlive());

        if (!(this instanceof Raccoon && this.isAimingGrenade) && !hasSpecificGunTarget) {
            this.gunAimAngle = this.facingAngle;
        }

        this.updateVisualDirection(this.facingAngle); 
        if (actionTimerFinishedThisFrame && this.game && this.game.ui && this.team === 'player') { this.game.ui.updateSquadPanel(); }
    }


    getCollisionShape() {
        return {
            type: 'circle',
            x: this.x,
            y: this.y,
            radius: this.size / 2 
        };
    }

    calculatePath(explicitStartGrid = null) {
        if (!this.game || !this.game.level) { this.isMoving = false; this.currentPath = []; return false; }
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) { this.isMoving = false; this.currentPath = []; return false; }

        const startGrid = explicitStartGrid || this.game.level.worldToGridCoords(this.x, this.y);
        const endGrid = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);

        if (startGrid.x < 0 || startGrid.x >= this.game.level.gridWidth || startGrid.y < 0 || startGrid.y >= this.game.level.gridHeight ||
            endGrid.x < 0 || endGrid.x >= this.game.level.gridWidth || endGrid.y < 0 || endGrid.y >= this.game.level.gridHeight) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Start/End grid out of bounds. Start:(${startGrid.x},${startGrid.y}), End:(${endGrid.x},${endGrid.y})`);
            this.isMoving = false; this.currentPath = []; return false;
        }
        if (navGrid[startGrid.y][startGrid.x] === 1 && !explicitStartGrid) {
             if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Unit's current pos (${this.x.toFixed(0)},${this.y.toFixed(0)}) maps to blocked startGrid (${startGrid.x},${startGrid.y}). Pathing aborted (will rely on onStuck or alternative start in setMoveTarget).`);
             if (explicitStartGrid) {
                 this.isMoving = false; this.currentPath = []; return false;
             }
        } else if (explicitStartGrid && navGrid[explicitStartGrid.y][explicitStartGrid.x] === 1) {
             if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Provided explicitStartGrid (${explicitStartGrid.x},${explicitStartGrid.y}) is blocked. Pathing aborted.`);
             this.isMoving = false; this.currentPath = []; return false;
        }


        const rawPathGridCoords = findPath(startGrid, endGrid, navGrid);

        if (rawPathGridCoords && rawPathGridCoords.length > 0) {
            this.currentPath = smoothPath(rawPathGridCoords, this.size, this.game.level);
            if (this.currentPath && this.currentPath.length > 0) {
                this.currentPathNodeIndex = 0;
                this.isMoving = true;
                this.pathingStuckFrames = 0;
                const firstNodeWorld = this.currentPath[0];
                 this.pathingStuckCheckPosition = {
                    distToNode: distance(this.x, this.y, firstNodeWorld.x, firstNodeWorld.y),
                    selfX: this.x, selfY: this.y
                };

                if (distance(this.x, this.y, firstNodeWorld.x, firstNodeWorld.y) > 0.1) {
                    this.facingAngle = Math.atan2(firstNodeWorld.y - this.y, firstNodeWorld.x - this.x);
                }
                if (!this.manualTarget && !this.autoTarget && !this.isContinuousFiring) {
                    this.gunAimAngle = this.facingAngle;
                }
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} calculatePath] Smoothed path len: ${this.currentPath.length}. isMoving=true.`);
                return true;
            } else {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] Smoothed path empty or null. isMoving=false.`);
                this.isMoving = false;
                this.currentPath = [];
                return false;
            }
        } else {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} calculatePath] NO RAW PATH from A*. isMoving=false.`);
            this.isMoving = false;
            this.currentPath = [];
            return false;
        }
    }

    _handleMovement(deltaTime) {
        if (!this.isAlive() || !this.isMoving || this.isPhasing) {
            if (this.isPhasing) {
                if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                    this.isMoving = false; this.lastDeltaX = 0; this.lastDeltaY = 0; return;
                }
                const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
                const moveSpeed = this.speed * deltaTime;
                const dxToNode = nextNodeWorldCoords.x - this.x;
                const dyToNode = nextNodeWorldCoords.y - this.y;
                const distToNextNode = Math.hypot(dxToNode, dyToNode);

                let phaseMoveX = 0, phaseMoveY = 0;
                if (distToNextNode > 1e-5) {
                    const moveRatio = Math.min(1, moveSpeed / distToNextNode);
                    phaseMoveX = dxToNode * moveRatio;
                    phaseMoveY = dyToNode * moveRatio;
                }

                this.x += phaseMoveX; this.y += phaseMoveY;
                this.lastDeltaX = phaseMoveX; 
                this.lastDeltaY = phaseMoveY;

                if (Math.abs(phaseMoveX) > 1e-5 || Math.abs(phaseMoveY) > 1e-5) {
                     this.facingAngle = Math.atan2(phaseMoveY, phaseMoveX);
                }


                if (distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y) <= Math.max(moveSpeed * 0.25, this.size * 0.1)) {
                    this.x = nextNodeWorldCoords.x; this.y = nextNodeWorldCoords.y;
                    this.currentPathNodeIndex++;
                    if (this.currentPathNodeIndex >= this.currentPath.length) {
                        this.isMoving = false; this.currentPath = [];
                        if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < this.size) {
                            this.isPhasing = false;
                        }
                    }
                }
                this.x = Math.max(this.size/2, Math.min(this.x, (CONFIG.WORLD_WIDTH ||0) - this.size/2));
                this.y = Math.max(this.size/2, Math.min(this.y, (CONFIG.WORLD_HEIGHT||0) - this.size/2));
                return;
            }
            if (!this.isAlive()) { this.isMoving = false; this.currentPath = []; }
            this.lastDeltaX = 0; this.lastDeltaY = 0;
            return;
        }

        if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
            this.isMoving = false; this.currentPath = []; this.currentPathNodeIndex = 0;
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < this.size) {
                this.x = this.worldTargetX; this.y = this.worldTargetY;
            }
            this.lastDeltaX = 0; this.lastDeltaY = 0;
            return;
        }

        const nextNodeWorldCoords = this.currentPath[this.currentPathNodeIndex];
        const moveSpeed = this.speed * deltaTime;
        const obstaclesForCollision = (this.game && this.game.level && this.game.level.obstacles)
            ? this.game.level.obstacles.filter(obs => obs.blocksMovement && !obs.isDestroyed)
            : [];

        if (!hasLineOfSight(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y, obstaclesForCollision, this.game.level, false)) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.warn(`[${this.id} _HM] LOS to next node (${nextNodeWorldCoords.x.toFixed(0)},${nextNodeWorldCoords.y.toFixed(0)}) blocked! Forcing stuck next frame.`);
            }
            this.pathingStuckFrames += Math.ceil(this.STUCK_FRAMES_THRESHOLD_PATHING / 2) +1;
            this.lastDeltaX = 0; this.lastDeltaY = 0;
            return;
        }

        const dxToNode = nextNodeWorldCoords.x - this.x;
        const dyToNode = nextNodeWorldCoords.y - this.y;
        const distToNextNode = Math.hypot(dxToNode, dyToNode);

        let desiredDeltaX = 0;
        let desiredDeltaY = 0;

        if (distToNextNode > 1e-5) {
            const moveRatio = Math.min(1, moveSpeed / distToNextNode);
            desiredDeltaX = dxToNode * moveRatio;
            desiredDeltaY = dyToNode * moveRatio;
        }

        let finalDeltaX = desiredDeltaX;
        let finalDeltaY = desiredDeltaY;

        if (distToNextNode > 1e-5) { 
            const potentialNewX_combined = this.x + desiredDeltaX;
            const potentialNewY_combined = this.y + desiredDeltaY;
            const collisionCheckRadius = this.size / 2 + 0.5;
            const unitBodyShape_combined = { type: 'circle', x: potentialNewX_combined, y: potentialNewY_combined, radius: collisionCheckRadius };

            let isCollisionWithDesiredMove = false;
            for (const obs of obstaclesForCollision) {
                const obsCS = this.game.level._getObstacleCollisionShape(obs);
                if ((obsCS.type === 'rectangle' && rectCircleOverlap(obsCS, unitBodyShape_combined)) ||
                    (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_combined))) {
                    isCollisionWithDesiredMove = true;
                    break;
                }
            }

            if (isCollisionWithDesiredMove) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Desired move collides. Attempting slide.`);
                let canMoveX = false;
                if (Math.abs(desiredDeltaX) > 1e-5) {
                    const unitBodyShape_X_Only = { type: 'circle', x: this.x + desiredDeltaX, y: this.y, radius: collisionCheckRadius };
                    let collisionX = false;
                    for (const obs of obstaclesForCollision) {
                        const obsCS = this.game.level._getObstacleCollisionShape(obs);
                        if ((obsCS.type === 'rectangle' && rectCircleOverlap(obsCS, unitBodyShape_X_Only)) ||
                            (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_X_Only))) {
                            collisionX = true; break;
                        }
                    }
                    if (!collisionX) canMoveX = true;
                }

                let canMoveY = false;
                if (Math.abs(desiredDeltaY) > 1e-5) {
                    const unitBodyShape_Y_Only = { type: 'circle', x: this.x, y: this.y + desiredDeltaY, radius: collisionCheckRadius };
                    let collisionY = false;
                    for (const obs of obstaclesForCollision) {
                        const obsCS = this.game.level._getObstacleCollisionShape(obs);
                        if ((obsCS.type === 'rectangle' && rectCircleOverlap(obsCS, unitBodyShape_Y_Only)) ||
                            (obsCS.type === 'circle' && circleOverlap(obsCS, unitBodyShape_Y_Only))) {
                            collisionY = true; break;
                        }
                    }
                    if (!collisionY) canMoveY = true;
                }

                if (canMoveX && !canMoveY) { 
                    finalDeltaY = 0;
                } else if (!canMoveX && canMoveY) { 
                    finalDeltaX = 0;
                } else if (canMoveX && canMoveY) { 
                    const angleToNode = Math.atan2(dyToNode, dxToNode);
                    const angleOfXMove = (desiredDeltaX >= 0) ? 0 : Math.PI;
                    const angleOfYMove = (desiredDeltaY >= 0) ? Math.PI / 2 : -Math.PI / 2;
                    let diffX = Math.abs(angleToNode - angleOfXMove); if (diffX > Math.PI) diffX = 2 * Math.PI - diffX;
                    let diffY = Math.abs(angleToNode - angleOfYMove); if (diffY > Math.PI) diffY = 2 * Math.PI - diffY;

                    if (diffX < diffY - 1e-3 && Math.abs(desiredDeltaX) > 1e-5) finalDeltaY = 0;
                    else if (diffY < diffX - 1e-3 && Math.abs(desiredDeltaY) > 1e-5) finalDeltaX = 0;
                    else if (Math.abs(desiredDeltaX) > Math.abs(desiredDeltaY) + 1e-4 && Math.abs(desiredDeltaX) > 1e-5) finalDeltaY = 0;
                    else if (Math.abs(desiredDeltaY) > 1e-5) finalDeltaX = 0;
                    else { finalDeltaX = 0; finalDeltaY = 0; }
                } else { 
                    finalDeltaX = 0; finalDeltaY = 0;
                }
            }
        }
        this.x += finalDeltaX;
        this.y += finalDeltaY;

        this.lastDeltaX = finalDeltaX; 
        this.lastDeltaY = finalDeltaY;

        const distToNextNodeAfterMove = distance(this.x, this.y, nextNodeWorldCoords.x, nextNodeWorldCoords.y);
        const arrivalTolerance = Math.max(moveSpeed * 0.3, this.size * 0.3);

        if (distToNextNodeAfterMove <= arrivalTolerance || (moveSpeed >= distToNextNode && distToNextNode > 1e-5 && Math.abs(finalDeltaX - desiredDeltaX) < 1e-4 && Math.abs(finalDeltaY - desiredDeltaY) < 1e-4 ) ) {
            this.x = nextNodeWorldCoords.x;
            this.y = nextNodeWorldCoords.y;
            this.currentPathNodeIndex++;
            this.pathingStuckFrames = 0;
            this.consecutiveStuckAttempts = 0;

            if (this.currentPathNodeIndex >= this.currentPath.length) {
                this.currentPath = []; this.currentPathNodeIndex = 0;
                if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) < arrivalTolerance * 1.5) {
                    this.isMoving = false;
                    this.x = this.worldTargetX; this.y = this.worldTargetY;
                    this.lastDeltaX = 0; this.lastDeltaY = 0; 
                } else if (this.isMoving) {
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _HM] Path ended, not at final target. Re-pathing.`);
                    this.setMoveTarget(this.worldTargetX, this.worldTargetY);
                }
            } else { 
                const nextNextNode = this.currentPath[this.currentPathNodeIndex];
                 this.pathingStuckCheckPosition = {
                    distToNode: distance(this.x, this.y, nextNextNode.x, nextNextNode.y),
                    selfX: this.x, selfY: this.y
                };
            }
        }

        const worldW = CONFIG.WORLD_WIDTH || 0; const worldH = CONFIG.WORLD_HEIGHT || 0;
        this.x = Math.max(this.size/2, Math.min(this.x, worldW - this.size/2));
        this.y = Math.max(this.size/2, Math.min(this.y, worldH - this.size/2));
    }


    setMoveTarget(worldX, worldY) {
        if (this.isContinuousFiring) this.setContinuousFire(false);
        if (this.actionTimer > 0 && !(this instanceof Raccoon && this.isAimingGrenade)) return false;

        if (this.team === 'player') {
            this.autoTarget = null;
        } else {
            this.autoTarget = null;
        }

        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] No navGrid available.`);
            this.isMoving = false; this.currentPath = []; return false;
        }

        let conceptualStartGrid = this.game.level.worldToGridCoords(this.x, this.y);
        if (conceptualStartGrid.x < 0 || conceptualStartGrid.x >= this.game.level.gridWidth ||
            conceptualStartGrid.y < 0 || conceptualStartGrid.y >= this.game.level.gridHeight ||
            navGrid[conceptualStartGrid.y][conceptualStartGrid.x] === 1) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] Current unit pos (${this.x.toFixed(0)},${this.y.toFixed(0)}) maps to blocked/invalid startGrid (${conceptualStartGrid.x},${conceptualStartGrid.y}). Finding alternative start.`);
            let foundValidStart = false;
            const searchRadius = 2;
            for (let r = 1; r <= searchRadius; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx === 0 && dy === 0 && r > 1) continue;
                        const checkX = conceptualStartGrid.x + dx;
                        const checkY = conceptualStartGrid.y + dy;
                        if (checkX >= 0 && checkX < this.game.level.gridWidth && checkY >= 0 && checkY < this.game.level.gridHeight && navGrid[checkY][checkX] === 0) {
                            conceptualStartGrid = {x: checkX, y: checkY};
                            foundValidStart = true;
                            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Using alternative start cell for pathing: (${checkX},${checkY}). Unit physically remains at current pos.`);
                            break;
                        }
                    }
                    if (foundValidStart) break;
                }
                if (foundValidStart) break;
            }
            if (!foundValidStart) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.error(`[${this.id} setMoveTarget] CRITICAL: Could not find any walkable start cell near unit for pathing. Pathing aborted.`);
                this.isMoving = false; this.currentPath = []; return false;
            }
        }

        const clampedWorldX = Math.max(this.size / 2, Math.min(worldX, CONFIG.WORLD_WIDTH - this.size / 2));
        const clampedWorldY = Math.max(this.size / 2, Math.min(worldY, CONFIG.WORLD_HEIGHT - this.size / 2));

        let targetGridX = Math.floor(clampedWorldX / this.game.level.gridCellSize);
        let targetGridY = Math.floor(clampedWorldY / this.game.level.gridCellSize);
        let finalWorldTargetX = clampedWorldX;
        let finalWorldTargetY = clampedWorldY;

        if (targetGridX < 0 || targetGridX >= this.game.level.gridWidth || targetGridY < 0 || targetGridY >= this.game.level.gridHeight) {
             if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] Target grid coords out of bounds AFTER clamping. Original: (${worldX.toFixed(0)},${worldY.toFixed(0)}), Clamped: (${clampedWorldX.toFixed(0)},${clampedWorldY.toFixed(0)})`);
            this.isMoving = false; this.currentPath = []; this.worldTargetX = this.x; this.worldTargetY = this.y; return false;
        }


        if (navGrid[targetGridY][targetGridX] === 1) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Original target cell (${targetGridX},${targetGridY}) is blocked. Searching for alternative.`);
            let foundAlternative = false;
            const directions = [ {x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}, {x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1},
                                 {x:0,y:-2},{x:0,y:2},{x:-2,y:0},{x:2,y:0},{x:-2,y:-2},{x:2,y:-2},{x:-2,y:2},{x:2,y:2}];
            for (const dir of directions) {
                const altGridX = targetGridX + dir.x;
                const altGridY = targetGridY + dir.y;
                if (altGridX >= 0 && altGridX < this.game.level.gridWidth &&
                    altGridY >= 0 && altGridY < this.game.level.gridHeight &&
                    navGrid[altGridY][altGridX] === 0) {

                    const altWorldCoords = this.game.level.gridToWorldCoords(altGridX, altGridY);
                    finalWorldTargetX = altWorldCoords.x;
                    finalWorldTargetY = altWorldCoords.y;
                    foundAlternative = true;
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} setMoveTarget] Found alternative walkable target at grid (${altGridX},${altGridY}), world (${finalWorldTargetX.toFixed(0)},${finalWorldTargetY.toFixed(0)}).`);
                    break;
                }
            }
            if (!foundAlternative) {
                if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] No walkable alternative found near blocked target. Move command failed.`);
                this.isMoving = false; this.currentPath = []; this.worldTargetX = this.x; this.worldTargetY = this.y; return false;
            }
        }

        this.worldTargetX = finalWorldTargetX;
        this.worldTargetY = finalWorldTargetY;

        if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > 0.1) {
            if (!this.manualTarget && !this.autoTarget && !this.isContinuousFiring) {
                this.facingAngle = Math.atan2(this.worldTargetY - this.y, this.worldTargetX - this.x);
                this.gunAimAngle = this.facingAngle;
            }
        }

        this.stuckFrames = 0;
        this.pathingStuckFrames = 0;

        if (this.calculatePath(conceptualStartGrid)) {
            return true;
        } else {
            this.isMoving = false;
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} setMoveTarget] calculatePath returned false. Move command failed.`);
            return false;
        }
    }
    setManualTarget(target) {
        if (this.isContinuousFiring) this.setContinuousFire(false); 
        this.manualTarget = target;
        this.autoTarget = null; 
        this.stuckFrames = 0; 
        if (target && target.isAlive()) {
            if (distance(this.x, this.y, target.x, target.y) > 0.1) {
                const angleToTarget = Math.atan2(target.y - this.y, target.x - this.x);
                this.gunAimAngle = angleToTarget; 
                if (!this.isMoving) { 
                    this.facingAngle = angleToTarget;
                }
            }
        }
    }
    setContinuousFire(isFiring, targetX, targetY) {
        this.isContinuousFiring = isFiring;
        if (isFiring) {
            this.manualTarget = null;
            this.autoTarget = null;
            this.continuousFireTargetEntity = null;
            const potentialTargets = (this.team === 'player') ? this.game.enemyUnits : this.game.deployedSquadRoster;
            if(potentialTargets && targetX !== undefined && targetY !== undefined) {
                for (const enemy of potentialTargets) { if (enemy.isAlive() && distance(targetX, targetY, enemy.x, enemy.y) < enemy.size + 7) { this.continuousFireTargetEntity = enemy; break; }}}
            if (this.continuousFireTargetEntity) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
            else if (targetX !== undefined && targetY !== undefined) { this.continuousFireTargetPos = { x: targetX, y: targetY }; }
            else { this.continuousFireTargetPos = { x: this.x + Math.cos(this.facingAngle) * 100, y: this.y + Math.sin(this.facingAngle) * 100 }; }

            if (distance(this.x, this.y, this.continuousFireTargetPos.x, this.continuousFireTargetPos.y) > 0.1) {
                const angleToFirePos = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
                this.facingAngle = angleToFirePos;
                this.gunAimAngle = angleToFirePos;
            }
        } else {
            this.continuousFireTargetEntity = null;
        }
    }
    updateContinuousFireTarget(targetX, targetY) {
        if (!this.isContinuousFiring) return;
        if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) { this.continuousFireTargetPos = { x: this.continuousFireTargetEntity.x, y: this.continuousFireTargetEntity.y }; }
        else { this.continuousFireTargetEntity = null; this.continuousFireTargetPos = { x: targetX, y: targetY }; }
         if (distance(this.x, this.y, this.continuousFireTargetPos.x, this.continuousFireTargetPos.y) > 0.1) {
            const angleToFirePos = Math.atan2(this.continuousFireTargetPos.y - this.y, this.continuousFireTargetPos.x - this.x);
            this.facingAngle = angleToFirePos;
            this.gunAimAngle = angleToFirePos;
        }
    }
    _handleEnemyCombat(deltaTime, obstacles) {
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

        let angleToTarget = this.facingAngle;
        if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) {
            angleToTarget = Math.atan2(fireAtY - this.y, fireAtX - this.x);
        }
        this.gunAimAngle = angleToTarget;
        if (combatShouldDictateFacing) { this.facingAngle = angleToTarget; }

        if ((targetToShoot || this.isContinuousFiring) && this.attackCooldown <= 0) {
            const distToTargetPoint = distance(this.x, this.y, fireAtX, fireAtY);
            if (distToTargetPoint <= this.weapon.range) {
                let hasLOS = true; const activeObstacles = obstacles ? obstacles.filter(o => !o.isDestroyed && o.blocksMovement) : [];
                if (targetToShoot && targetToShoot.team && targetToShoot.team !== 'neutral_object') { hasLOS = hasLineOfSight(this.x, this.y, fireAtX, fireAtY, activeObstacles, this.game.level, false); }
                if (hasLOS) {
                    if (this.isMoving && !this.canShootWhileMoving) {} else {
                        this._executeFire(fireAtX, fireAtY, this.gunAimAngle);
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
        this.gunAimAngle = this.facingAngle;

        if (this.isContinuousFiring) {
            if (this.continuousFireTargetEntity && this.continuousFireTargetEntity.isAlive()) {
                targetToShoot = this.continuousFireTargetEntity; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
            } else if (this.continuousFireTargetEntity && !this.continuousFireTargetEntity.isAlive()){
                this.setContinuousFire(false); return;
            } else {
                fireAtX = this.continuousFireTargetPos.x; fireAtY = this.continuousFireTargetPos.y;
            }
            if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
            if(!this.isMoving) this.facingAngle = this.gunAimAngle;

        } else if (this.manualTarget && this.manualTarget.isAlive()) {
            targetToShoot = this.manualTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
            if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
            this.facingAngle = this.gunAimAngle;

        } else {
            const potentialTargets = this.game.enemyUnits;
            this.findAutoTarget(potentialTargets, obstacles);
            if (this.autoTarget) {
                targetToShoot = this.autoTarget; fireAtX = targetToShoot.x; fireAtY = targetToShoot.y;
                if (distance(this.x,this.y,fireAtX,fireAtY) > 0.1) this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
                if (!this.isMoving) {
                    this.facingAngle = this.gunAimAngle;
                }
            } else {
                this.gunAimAngle = this.facingAngle;
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
                        if (distance(this.x, this.y, fireAtX, fireAtY) > 0.1) {
                           this.gunAimAngle = Math.atan2(fireAtY - this.y, fireAtX - this.x);
                           if (!this.isMoving) this.facingAngle = this.gunAimAngle;
                        }
                        this._executeFire(fireAtX, fireAtY, this.gunAimAngle);
                    }
                } else {
                    if (targetToShoot === this.autoTarget) this.autoTarget = null;
                    if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.continuousFireTargetEntity = null;
                }
            } else {
                if (targetToShoot === this.autoTarget) this.autoTarget = null;
                if (this.isContinuousFiring && this.continuousFireTargetEntity === targetToShoot) this.setContinuousFire(false);
            }
        } else if (targetToShoot && targetToShoot.isAlive() && !this.isMoving) {
             if (distance(this.x, this.y, targetToShoot.x, targetToShoot.y) > 0.1) {
                const angleToTarget = Math.atan2(targetToShoot.y - this.y, targetToShoot.x - this.x);
                this.facingAngle = angleToTarget;
                this.gunAimAngle = angleToTarget;
            }
        } else if (!targetToShoot && !this.isContinuousFiring && !this.isMoving) {
            this.gunAimAngle = this.facingAngle;
        }
    }
    findAutoTarget(potentialTargets, obstacles) {
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
    fireAt(targetEntity) {
        if (this.isContinuousFiring) this.setContinuousFire(false);
        const fireAngle = Math.atan2(targetEntity.y - this.y, targetEntity.x - this.x);
        this._executeFire(targetEntity.x, targetEntity.y, fireAngle);
    }

    _executeFire(pointX, pointY, fireAngle = null) {
        if (!this.weapon || this.actionTimer > 0 || this.attackCooldown > 0 || !this.isAlive()) { return; }
        if (this.isMoving && !this.canShootWhileMoving) { return; }

        let baseAccuracy = this.isMoving ? this.weapon.accuracyMoving : this.weapon.accuracyStationary;
        if (this.team === 'player' && this.accuracyBonus) { baseAccuracy += this.accuracyBonus; }
        const effectiveAccuracy = Math.min(1.0, Math.max(0.0, baseAccuracy));

        const angleForProjectile = fireAngle !== null ? fireAngle : Math.atan2(pointY - this.y, pointX - this.x);

        const projectile = new Projectile(
            this.x, this.y,
            this.x + Math.cos(angleForProjectile) * this.weapon.range, 
            this.y + Math.sin(angleForProjectile) * this.weapon.range,
            this.weapon.damage, this.weapon.projectileSpeed, this.weapon.projectileColor,
            this.game, this, effectiveAccuracy
        );
        this.game.addProjectile(projectile);
        
        const baseCooldown = 1 / this.weapon.rof;
        const jitterPercentage = (CONFIG.WEAPON_SETTINGS && CONFIG.WEAPON_SETTINGS.ROF_JITTER_PERCENTAGE !== undefined)
                                 ? CONFIG.WEAPON_SETTINGS.ROF_JITTER_PERCENTAGE
                                 : 0; // Default to 0 if not defined
        const jitter = Math.random() * baseCooldown * jitterPercentage;
        this.attackCooldown = baseCooldown + jitter;


        if (this.weapon.sfxFireKey && this.game && this.game.audioManager) {
            const sfxConfig = CONFIG.AUDIO_ASSETS[this.weapon.sfxFireKey];
            if (sfxConfig) {
                this.game.audioManager.play(this.weapon.sfxFireKey, { 
                    volume: sfxConfig.defaultVolume, 
                    pitchVariation: sfxConfig.pitchVariation
                });
            }
        }
    }

    fireAtPoint(pointX, pointY) {
        if (this.isContinuousFiring) this.setContinuousFire(false);
        const fireAngle = Math.atan2(pointY - this.y, pointX - this.x);
        this._executeFire(pointX, pointY, fireAngle);
        this.manualTarget = null;
        this.autoTarget = null;
    }

    takeDamage(amount, attackerUnit = null) {
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
            let becameAware = false;
            const activeObstacles = this.game.level.obstacles.filter(o => !o.isDestroyed && o.blocksMovement);
            const hasLOSToAttacker = hasLineOfSight(this.x, this.y, attackerUnit.x, attackerUnit.y, activeObstacles, this.game.level, false);

            if (this.manualTarget !== attackerUnit) {
                this.manualTarget = attackerUnit;
                becameAware = true;
            } else {
                becameAware = true;
            }

            this.lastKnownPlayerPosition = { x: attackerUnit.x, y: attackerUnit.y };

            const alertDmgThreshold = this.maxHp * (CONFIG.ENEMY_ALERT_ON_DMG_THRESHOLD_PERCENT || 0.10);
            if (becameAware || (amount >= alertDmgThreshold) || (prevHp === this.maxHp && amount > 0) ) {
                 this.propagateAlert(attackerUnit);
            }
        }

        if (!died && this.game && this.game.ui && this.team === 'player') {
             this.game.ui.updateSquadPanel();
        }
    }

    propagateAlert(sourceOfAlertUnit = null) {
        if (!this.isAlive() || this.team !== 'enemy' || !this.game || !this.game.enemyUnits) return;
        this.game.enemyUnits.forEach(otherEnemy => {
            if (otherEnemy && otherEnemy.isAlive() && otherEnemy !== this &&
                (otherEnemy.aiState === 'PATROLLING' || otherEnemy.aiState === 'GUARDING')) {
                const distToOtherEnemy = distance(this.x, this.y, otherEnemy.x, otherEnemy.y);
                if (distToOtherEnemy <= (CONFIG.ENEMY_ALERT_PROPAGATION_RADIUS || 180)) {
                    otherEnemy.alertedByAlly = true;
                    if (sourceOfAlertUnit && sourceOfAlertUnit.isAlive()) {
                        otherEnemy.lastKnownPlayerPosition = { x: sourceOfAlertUnit.x, y: sourceOfAlertUnit.y };
                        otherEnemy.manualTarget = sourceOfAlertUnit;
                        if (CONFIG.DEBUG_PATHING_UNIT_ID === otherEnemy.id) console.log(`[${otherEnemy.id} propagateAlert] Alerted by ${this.id}. Setting manualTarget to ${sourceOfAlertUnit.id}. Will transition in next AI tick.`);
                    } else {
                        otherEnemy.lastKnownPlayerPosition = { x: this.x, y: this.y };
                        otherEnemy.aiState = 'SUSPICIOUS';
                    }
                }
            }
        });
    }
    die() {
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

    isAlive() { return this.hp > 0; }

    onStuck(reason = 'unknown') {
        const currentTime = performance.now() / 1000;
        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
            console.warn(`[${this.id} onStuck BASE] Reason: ${reason}. AI State: ${this.aiState || 'N/A'}. Pos:(${this.x.toFixed(0)},${this.y.toFixed(0)}), Target:(${this.worldTargetX.toFixed(0)},${this.worldTargetY.toFixed(0)})`);
        }

        this.isMoving = false; 
        this.stuckFrames = 0;
        this.pathingStuckFrames = 0; 
        this.lastRepathAttemptTime = currentTime;

        if (currentTime - this.lastOnStuckTime < this.STUCK_RECOVERY_COOLDOWN_INTERNAL) {
            this.consecutiveStuckAttempts++;
        } else {
            this.consecutiveStuckAttempts = 1;
        }
        this.lastOnStuckTime = currentTime;

        const maxStuckBeforePhasing = this.MAX_CONSECUTIVE_STUCK_ATTEMPTS_INTERNAL + 2;
        if (this.consecutiveStuckAttempts >= maxStuckBeforePhasing && !this.isPhasing) {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.warn(`[${this.id} onStuck BASE] Max consecutive stuck attempts (${this.consecutiveStuckAttempts}). Initiating Phasing.`);
            }
            this.isPhasing = true;
            this.phasingTimer = CONFIG.UNIT_PHASING_DURATION || 0.75; 
            this.consecutiveStuckAttempts = 0;
            if (distance(this.x, this.y, this.worldTargetX, this.worldTargetY) > this.size * 1.5) { 
                 this.isMoving = true; 
                 if (!this.currentPath || this.currentPath.length === 0 || this.currentPathNodeIndex >= this.currentPath.length) {
                    const targetGridPos = this.game.level.worldToGridCoords(this.worldTargetX, this.worldTargetY);
                    this.currentPath = [this.game.level.gridToWorldCoords(targetGridPos.x, targetGridPos.y)];
                    this.currentPathNodeIndex = 0;
                 }
            } else {
                this.isMoving = false; 
            }
            return;
        }


        if (this.team === 'player') {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.log(`[${this.id} onStuck PLAYER] Player unit stuck. Stopping. Consecutive: ${this.consecutiveStuckAttempts}`);
            }
             this.currentPath = []; 
        } else {
            if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) {
                console.log(`[${this.id} onStuck BASE ENEMY] Fallback. Consecutive: ${this.consecutiveStuckAttempts}. Attempting desperate move.`);
            }
            if (typeof this._attemptDesperateMove === 'function') {
                if(!this._attemptDesperateMove()){
                     if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} onStuck BASE] Desperate move failed for enemy. Reverting to base AI state.`);
                     this.aiState = (this instanceof PossumHeavy) ? 'GUARDING' : 'PATROLLING';
                     this.currentPath = []; 
                     if (this.aiState === 'GUARDING' && typeof this.guardPost !== 'undefined' && this.guardPost) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
                     else if (this.aiState === 'PATROLLING' && typeof this.patrolPoint1 !== 'undefined' && this.patrolPoint1) this.setMoveTarget(this.patrolPoint1.x, this.patrolPoint1.y);
                }
            }
        }
    }

    _attemptDesperateMove() {
        const navGrid = this.game.level.getNavigationGrid();
        if (!navGrid) return false;

        const currentGridPos = this.game.level.worldToGridCoords(this.x, this.y);
        const desperateRadiusCells = (this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL !== undefined ? this.DESPERATE_STUCK_MOVE_RADIUS_CELLS_INTERNAL : 3);

        for (let attempt = 0; attempt < 15; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const radiusCells = Math.floor(1 + Math.random() * desperateRadiusCells);
            const desperateGridX = currentGridPos.x + Math.round(Math.cos(angle) * radiusCells);
            const desperateGridY = currentGridPos.y + Math.round(Math.sin(angle) * radiusCells);

            if (desperateGridX >= 0 && desperateGridX < this.game.level.gridWidth &&
                desperateGridY >= 0 && desperateGridY < this.game.level.gridHeight &&
                navGrid[desperateGridY][desperateGridX] === 0) {

                let walkableNeighbors = 0;
                const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
                for(const d of dirs) {
                    const nx = desperateGridX + d.x;
                    const ny = desperateGridY + d.y;
                    if (nx >= 0 && nx < this.game.level.gridWidth && ny >= 0 && ny < this.game.level.gridHeight && navGrid[ny][nx] === 0) {
                        walkableNeighbors++;
                    }
                }

                if (walkableNeighbors >= 2) {
                    const worldCoords = this.game.level.gridToWorldCoords(desperateGridX, desperateGridY);
                    if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.log(`[${this.id} _attemptDesperateMove] Found desperate spot (${desperateGridX},${desperateGridY}). Moving.`);
                    this.currentPath = []; 
                    this.setMoveTarget(worldCoords.x, worldCoords.y);
                    return true;
                }
            }
        }
        if (CONFIG.DEBUG_PATHING_UNIT_ID === this.id) console.warn(`[${this.id} _attemptDesperateMove] Could not find suitable desperate move spot.`);
        return false;
    }


    render(ctx) {
        const kiaStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.KIA_STYLE;
        const facingIndicatorStyle = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.FACING_INDICATOR;
        const healthBarStyle = CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR;

        ctx.save();
        ctx.translate(this.x, this.y); 

        if (this.isPhasing) {
            ctx.globalAlpha = CONFIG.UNIT_VISUALS.UNIT_PHASING_OPACITY || 0.5;
        }

        if (!this.isAlive() && this.currentVisualState !== 'death') {
            this.currentVisualState = 'death';
        }

        let spriteToDraw = null;
        let spriteScale = 1.0;
        let spriteWidth = 0; 
        let spriteHeight = 0; 
        let drawOffsetX = -this.size / 2; 
        let drawOffsetY = -this.size / 2; 

        if (this.isAlive()) {
            const actionFolder = 'idle';
            const spriteKey = `${this.spriteBaseName}_${actionFolder}_${this.currentVisualDirection}`;
            spriteToDraw = this.game.preloadedImages[spriteKey];

            if (!spriteToDraw) {
                const fallbackSpriteKey = `${this.spriteBaseName}_${actionFolder}_s`;
                spriteToDraw = this.game.preloadedImages[fallbackSpriteKey];
            }

            if (this instanceof Raccoon) {
                spriteScale = CONFIG.RACCOON_SPRITE_SCALE_FACTOR || 1.0;
            } else if (this instanceof PossumGrunt) {
                spriteScale = CONFIG.POSSUM_GRUNT_SPRITE_SCALE_FACTOR || 1.0;
            } else if (this instanceof PossumHeavy) {
                spriteScale = CONFIG.POSSUM_HEAVY_SPRITE_SCALE_FACTOR || 1.0;
            }

            if (spriteToDraw) {
                spriteWidth = spriteToDraw.naturalWidth * spriteScale;
                spriteHeight = spriteToDraw.naturalHeight * spriteScale;
                drawOffsetX = -spriteWidth / 2; 
                drawOffsetY = -spriteHeight / 2; 
            }
        } else { 
            let deadSpriteConfigPath = null;
            let deadSpriteConfigFiles = null;
            let deadSpriteConfigScale = 1.0;

            if (this instanceof Raccoon) {
                deadSpriteConfigPath = CONFIG.RACCOON_DEAD_SPRITE_PATH;
                deadSpriteConfigFiles = CONFIG.RACCOON_DEAD_SPRITE_FILES;
                deadSpriteConfigScale = CONFIG.RACCOON_DEAD_SPRITE_SCALE;
            } else if (this instanceof PossumGrunt) {
                deadSpriteConfigPath = CONFIG.POSSUM_GRUNT_DEAD_SPRITE_PATH;
                deadSpriteConfigFiles = CONFIG.POSSUM_GRUNT_DEAD_SPRITE_FILES;
                deadSpriteConfigScale = CONFIG.POSSUM_GRUNT_DEAD_SPRITE_SCALE;
            } else if (this instanceof PossumHeavy) {
                deadSpriteConfigPath = CONFIG.POSSUM_HEAVY_DEAD_SPRITE_PATH;
                deadSpriteConfigFiles = CONFIG.POSSUM_HEAVY_DEAD_SPRITE_FILES;
                deadSpriteConfigScale = CONFIG.POSSUM_HEAVY_DEAD_SPRITE_SCALE;
            }

            if (!this.assignedDeadSpritePath && deadSpriteConfigPath && deadSpriteConfigFiles && deadSpriteConfigFiles.length > 0) {
                const randomDeadFile = deadSpriteConfigFiles[Math.floor(Math.random() * deadSpriteConfigFiles.length)];
                this.assignedDeadSpritePath = deadSpriteConfigPath + randomDeadFile;
            }

            if (this.assignedDeadSpritePath) {
                spriteToDraw = this.game.preloadedImages[this.assignedDeadSpritePath];
            }
            spriteScale = deadSpriteConfigScale; 

            if (spriteToDraw) {
                spriteWidth = spriteToDraw.naturalWidth * spriteScale;
                spriteHeight = spriteToDraw.naturalHeight * spriteScale;
                drawOffsetX = -spriteWidth / 2; 
                drawOffsetY = -spriteHeight * 0.2; 
            }
            if (spriteToDraw) {
                ctx.rotate(this.deathRotationAngle);
            }
        }

        if (spriteToDraw) {
            ctx.drawImage(spriteToDraw, drawOffsetX, drawOffsetY, spriteWidth, spriteHeight);
        } else { 
            let originalAlpha = ctx.globalAlpha;
            if (!this.isAlive()) {
                ctx.fillStyle = this.team === 'player' ? (kiaStyle && kiaStyle.PLAYER_FILL_COLOR || 'darkgrey') : (kiaStyle && kiaStyle.ENEMY_FILL_COLOR || '#555');
                const baseOpacity = (kiaStyle && kiaStyle.OPACITY !== undefined) ? kiaStyle.OPACITY : 0.6;
                ctx.globalAlpha = this.isPhasing ? Math.min(originalAlpha, baseOpacity) : baseOpacity;
            } else {
                ctx.fillStyle = this.color;
            }
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2); 
            ctx.fill();
            ctx.globalAlpha = originalAlpha;
        }

        if (!this.isAlive() && spriteToDraw) {
            ctx.rotate(-this.deathRotationAngle); 
        }
        if (!this.isPhasing) {
             if (this.isAlive() || (!this.isAlive() && !(kiaStyle && kiaStyle.OPACITY !== undefined))) {
                ctx.globalAlpha = 1.0;
            }
        }

        if (this.isAlive() && CONFIG.UNIT_VISUALS.DRAW_GUN_AIM_INDICATOR && facingIndicatorStyle) {
            ctx.strokeStyle = facingIndicatorStyle.COLOR || 'black';
            ctx.lineWidth = facingIndicatorStyle.LINE_WIDTH || 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.size * 1.2 * Math.cos(this.gunAimAngle), this.size * 1.2 * Math.sin(this.gunAimAngle));
            ctx.stroke();
        }

        ctx.restore(); 
        if (this.isAlive() && healthBarStyle) {
            const barWidth = this.size * (healthBarStyle.WIDTH_MULTIPLIER || 1.5);
            const barHeight = healthBarStyle.HEIGHT || 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - (healthBarStyle.Y_OFFSET_BASE || 0) - barHeight - 5;
            const hpPercent = this.hp / this.maxHp;

            this.game.ctx.fillStyle = healthBarStyle.BG_COLOR || '#333333';
            this.game.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

            let fillColor = healthBarStyle.HP_COLOR_FULL || '#00CC00';
            if (hpPercent < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3)) {
                fillColor = healthBarStyle.HP_COLOR_LOW || '#CC0000';
            } else if (hpPercent < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) {
                fillColor = healthBarStyle.HP_COLOR_MEDIUM || '#CCCC00';
            }
            this.game.ctx.fillStyle = fillColor;
            this.game.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }
    }
}