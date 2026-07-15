// js/possumScientist.js
// Evil possum scientists used as non-boss assassination targets.
// They do NOT fight: they just wander a large area of the map. Bodyguards
// (spawned by the level generator) do the fighting for them.

const SCIENTIST_WANDER_MARGIN = 60;

// Extends Unit directly (NOT PossumGrunt): the grunt constructor only takes
// (x, y, game, id) and would swallow the custom hp/size/id we pass.
class PossumScientist extends Unit {
    constructor(x, y, game, id, typeKey) {
        const cfgPrefix = typeKey === 'possum_scientist_2' ? 'POSSUM_SCIENTIST_2' : 'POSSUM_SCIENTIST_1';

        super(
            x, y, game, 'enemy',
            CONFIG[`${cfgPrefix}_HP`],
            CONFIG[`${cfgPrefix}_SPEED`],
            CONFIG[`${cfgPrefix}_SIZE`],
            CONFIG[`${cfgPrefix}_COLOR`],
            id || `SCI-${typeKey === 'possum_scientist_2' ? '2' : '1'}-${Date.now().toString(36).slice(-4)}`
        );

        // Override grunt sprite assignment (instanceof PossumGrunt forced 'possum_grunt').
        this.spriteBaseName = typeKey === 'possum_scientist_2' ? 'possum_scientist_type2' : 'possum_scientist_type1';
        this.spriteScaleFactor = CONFIG[`${cfgPrefix}_SPRITE_SCALE_FACTOR`] || 0.5;

        // Dead body reuses the grunt corpse sprites (no dedicated dead set yet).
        this.deadSpritePathKey = CONFIG[`${cfgPrefix}_DEAD_SPRITE_PATH_KEY`];
        this.deadSpriteFilesKey = CONFIG[`${cfgPrefix}_DEAD_SPRITE_FILES_KEY`];
        this.deadSpriteScaleKey = CONFIG[`${cfgPrefix}_DEAD_SPRITE_SCALE_KEY`];

        this.turnRate = CONFIG[`${cfgPrefix}_TURN_RATE`] || 8.0;

        // Researchers do NOT fight. Strip the weapon so they never acquire
        // targets or fire.
        this.weaponName = null;
        this.weapon = null;

        // Keep a reference to the scientist AI config (used for guard-pack data).
        this.scientistAIConfig = (CONFIG.AI && CONFIG.AI[cfgPrefix]) ? CONFIG.AI[cfgPrefix] : {};
        this.detectionRange = 0; // Unaware of the player; just wanders.

        this.aiState = 'WANDERING';
        this.currentWanderPoint = null;
        this.wanderWaitTimer = Math.random() * 1.5;
        this.xpValue = CONFIG[`XP_FOR_${cfgPrefix}_KILL`] || 120;
    }

    pickWanderPoint() {
        const lvl = this.game && this.game.level;
        const minX = (lvl && lvl.playableMinX !== undefined) ? lvl.playableMinX : 0;
        const maxX = (lvl && lvl.playableMaxX !== undefined) ? lvl.playableMaxX : (CONFIG.WORLD_WIDTH || 1920);
        const minY = (lvl && lvl.playableMinY !== undefined) ? lvl.playableMinY : 0;
        const maxY = (lvl && lvl.playableMaxY !== undefined) ? lvl.playableMaxY : (CONFIG.WORLD_HEIGHT || 1080);
        const margin = SCIENTIST_WANDER_MARGIN;

        let pX, pY, attempts = 0;
        do {
            pX = (this.rng ? this.rng.nextFloat(minX + margin, maxX - margin)
                          : (minX + margin + Math.random() * (maxX - minX - 2 * margin)));
            pY = (this.rng ? this.rng.nextFloat(minY + margin, maxY - margin)
                          : (minY + margin + Math.random() * (maxY - minY - 2 * margin)));

            if (lvl && lvl.isSpawnPointClear && lvl.isSpawnPointClear(pX, pY, this.size, lvl.obstacles)) {
                break;
            }
            attempts++;
        } while (attempts < 20);

        return { x: pX, y: pY };
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        // No targeting, no shooting — pure wandering across the map.
        if (this.aiState === 'WANDERING') {
            if (this.wanderWaitTimer > 0) {
                this.wanderWaitTimer -= deltaTime;
                if (this.isMoving) { this.isMoving = false; this.currentPath = []; }
                return;
            }

            if (!this.isMoving) {
                const arrived = this.currentWanderPoint &&
                    distance(this.x, this.y, this.currentWanderPoint.x, this.currentWanderPoint.y) <= this.size * 1.0;
                if (arrived) {
                    this.currentWanderPoint = null;
                    this.wanderWaitTimer = 1.0 + Math.random() * 2.5;
                    return;
                }
                const pt = this.pickWanderPoint();
                if (this.setMoveTarget(pt.x, pt.y)) {
                    this.currentWanderPoint = pt;
                } else {
                    this.wanderWaitTimer = 0.5 + Math.random();
                }
            }
        }
    }

    die() {
        super.die();
        if (this.game) {
            const assassinateObjective = this.game.currentMissionParams?.objectives.find(obj =>
                obj.type === "ASSASSINATION" && obj.targetUnitId === this.id
            );
            if (assassinateObjective && !assassinateObjective.isComplete) {
                assassinateObjective.isComplete = true;
                assassinateObjective.currentProgress = 1;
            }
        }
    }
}

class PossumScientist1 extends PossumScientist {
    constructor(x, y, game, id) {
        super(x, y, game, id, 'possum_scientist_1');
    }
}

class PossumScientist2 extends PossumScientist {
    constructor(x, y, game, id) {
        super(x, y, game, id, 'possum_scientist_2');
    }
}
