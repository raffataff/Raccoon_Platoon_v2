# Adding a New Boss — Step-by-Step Guide

This document describes every file that must be created or modified to add a new boss type to the game. It uses `possum_boss_3` (a minigun-wielding boss) as the concrete example, but the process is the same for any new boss.

---

## Overview

Adding a boss requires changes to **10 files** (1 new, 9 modified):

| # | File | Action |
|---|------|--------|
| 1 | `js/possumBoss3.js` | **Create** — boss class with AI and firing logic |
| 2 | `js/config.js` | Add stat constants, weapon definition, AI config, audio SFX key |
| 3 | `js/unit.js` | Add `instanceof` check for sprite; add fire-skip if custom fire |
| 4 | `js/game.js` | Add sprite preload entry; add boss music detection |
| 5 | `js/levelGenerator.js` | Add spawn logic block |
| 6 | `js/campaignRules.js` | Add assassination target entry |
| 7 | `js/speechConfig.js` | Add hierarchy entry |
| 8 | `js/manualContent.js` | Add manual/encyclopedia entry |
| 9 | `index.html` | Add `<script>` tag |
| 10 | Asset files | Sprite sheets, bullet sprites, audio files |

---

## Step 1: Create the Boss Class — `js/possumBoss3.js`

Create a new file `js/possumBoss3.js` with a class that extends `Unit`. Two patterns exist:

### Pattern A — Custom Fire (like PossumBoss1)
Use this if the boss has complex multi-weapon logic, burst patterns, or grenade firing. The boss overrides `_handleEnemyCombat()` and its own `_executeFire()`, and the base class `Unit.update()` must be told to skip its standard `_executeFire()` for this boss.

### Pattern B — Standard Fire (like PossumRevolver)
Use this if the boss uses a single weapon with simple logic. The boss overrides `_handleEnemyCombat()` but calls `super._executeFire()` internally. No changes to `Unit.update()` are needed.

### Template (Pattern A — recommended for minigun boss):

```javascript
// js/possumBoss3.js

class PossumBoss3 extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy',
              CONFIG.POSSUM_BOSS_3_HP,
              CONFIG.POSSUM_BOSS_3_SPEED,
              CONFIG.POSSUM_BOSS_3_SIZE,
              CONFIG.POSSUM_BOSS_3_COLOR,
              id || `BOSS3-${Date.now().toString(36).slice(-4)}`);

        this.turnRate = CONFIG.POSSUM_BOSS_3_TURN_RATE;
        this.deadSpritePathKey = 'POSSUM_BOSS_3_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_BOSS_3_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_BOSS_3_DEAD_SPRITE_SCALE';

        this.weaponName = CONFIG.POSSUM_BOSS_3_DEFAULT_WEAPON || 'POSSUM_BOSS_3_WEAPON';
        this.canShootWhileMoving = false; // or true for mobile bosses

        this.bossAIConfig = CONFIG.AI.POSSUM_BOSS_3 || {};
        this.detectionRange = this.bossAIConfig.DETECTION_RANGE || 500;

        this.aiState = 'GUARDING';
        this.guardPost = { x: x, y: y };
        this.actionTimer = 0;
        this.xpValue = CONFIG.XP_FOR_BOSS_3_KILL || 250;

        // Chase tuning (from AI config)
        this.CHASE_DESTINATION_REFRESH_INTERVAL = this.bossAIConfig.CHASE_DESTINATION_REFRESH_INTERVAL || 1.0;
        this.MIN_CHASE_DEVIATION_UPDATE_INTERVAL = this.bossAIConfig.MIN_CHASE_DEVIATION_UPDATE_INTERVAL || 0.5;
        this.CHASE_TARGET_DEVIATION_THRESHOLD_SQ = (this.bossAIConfig.CHASE_TARGET_DEVIATION_THRESHOLD_CELLS * CONFIG.GRID_CELL_SIZE) ** 2 || (4 * CONFIG.GRID_CELL_SIZE) ** 2;
        this.timeSinceLastChaseDestUpdate = 0;
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
        }
        if (this.aiState === 'ENGAGING_CHASING') {
            this.timeSinceLastChaseDestUpdate += deltaTime;
        }
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        let target = this.manualTarget || this.autoTarget;
        if (!target || !target.isAlive()) {
            this.findAutoTarget(this.game.getLivingPlayerControlledUnits(), obstacles);
            target = this.autoTarget;
        }

        if (!target) {
            this.aiState = 'GUARDING';
            if (distance(this.x, this.y, this.guardPost.x, this.guardPost.y) > 10) {
                if (!this.isMoving) this.setMoveTarget(this.guardPost.x, this.guardPost.y);
            } else {
                this.isMoving = false;
            }
            return;
        }

        this.manualTarget = target;
        const dist = distance(this.x, this.y, target.x, target.y);
        const hasLOS = hasLineOfSight(this.x, this.y, target.x, target.y, this.game.level.activeObstacles, this.game.level);

        this.gunAimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        if (hasLOS && dist <= this.weapon.range) {
            this.isMoving = false;
            this.currentPath = [];
            this.aiState = 'ENGAGING_SHOOTING';

            if (this.actionTimer <= 0 && this.attackCooldown <= 0) {
                this._executeFire(target.x, target.y, deltaTime);
            }
            return;
        }

        this.aiState = 'ENGAGING_CHASING';
        // ... chase logic (see PossumBoss1 for full predictive chase pattern)
    }

    _executeFire(targetX, targetY, deltaTime) {
        if (!this.game || !this.weapon) return;
        const weapon = this.weapon;

        this.gunAimAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.facingAngle = lerpAngle(this.facingAngle, this.gunAimAngle, this.turnRate * deltaTime);

        const fireAngle = this.gunAimAngle;
        const accuracy = this.isMoving ? weapon.accuracyMoving : weapon.accuracyStationary;

        const projectile = this.game.getProjectileFromPool(
            this.x, this.y,
            this.x + Math.cos(fireAngle) * weapon.range,
            this.y + Math.sin(fireAngle) * weapon.range,
            weapon.damage,
            weapon.projectileSpeed,
            weapon.projectileColor,
            this,
            accuracy
        );
        this.game.addProjectile(projectile);

        if (weapon.sfxFireKey && this.game.audioManager) {
            this.game.audioManager.play(weapon.sfxFireKey);
        }

        this.attackCooldown = 1 / weapon.rof;
    }

    die() {
        super.die();
        if (this.game) {
            const explosionRadius = this.bossAIConfig.DEATH_EXPLOSION_RADIUS;
            if (explosionRadius > 0) {
                this.game.addVisualEffect('barrel_explosion', { x: this.x, y: this.y, radius: explosionRadius });
            }
            const sfxKey = this.bossAIConfig.DEATH_EXPLOSION_SFX;
            if (sfxKey && this.game.audioManager) {
                this.game.audioManager.play(sfxKey);
            }
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
```

**Key points:**
- Always call `super.die()` in the `die()` override, then complete the assassination objective.
- The `die()` method finds the matching `ASSASSINATION` objective by comparing `targetUnitId === this.id`.
- Set `this.xpValue` in the constructor to control XP reward on kill.
- Use `this.actionTimer` for major cooldowns (between bursts/volleys) and `this.attackCooldown` for rate-of-fire (managed by base class).

---

## Step 2: Add Config Constants — `js/config.js`

Add the following sections to `config.js`. Search for the existing boss constants (around line 204) to find the right location.

### 2a. Stat Constants (around line 204, after existing boss constants)

```javascript
    // --- Possum Boss 3 ---
    POSSUM_BOSS_3_HP: 300,
    POSSUM_BOSS_3_SPEED: 150,
    POSSUM_BOSS_3_SIZE: 22,
    POSSUM_BOSS_3_COLOR: '#4a2810',
    POSSUM_BOSS_3_DEFAULT_WEAPON: 'POSSUM_BOSS_3_WEAPON',
    POSSUM_BOSS_3_SPRITE_PATH: 'assets/images/units/possum_boss_3/',
    POSSUM_BOSS_3_SPRITE_SCALE_FACTOR: 0.7,
    POSSUM_BOSS_3_DEAD_SPRITE_PATH: 'assets/images/units/possum_boss_3/dead/',
    POSSUM_BOSS_3_DEAD_SPRITE_FILES: ['possum_boss3_dead1.png', 'possum_boss3_dead2.png'],
    POSSUM_BOSS_3_DEAD_SPRITE_SCALE: 0.4,
    PROJECTILE_COLOR_POSSUM_BOSS_3: '#FF4500',
    XP_FOR_BOSS_3_KILL: 250,
    POSSUM_BOSS_3_TURN_RATE: 6.0,
```

### 2b. Weapon Definition (inside `WEAPON_DEFINITIONS`, around line 413)

```javascript
        POSSUM_BOSS_3_WEAPON: {
            name: "Possum Boss 3 Minigun",
            damage: 8,
            rof: 20,
            range: 500,
            projectileSpeed: 700,
            projectileColor: '#FF4500',
            accuracyStationary: 0.70,
            accuracyMoving: 0.35,
            sfxFireKey: 'POSSUM_BOSS_3_WEAPON_FIRE',
            muzzleFlashScale: 1.5,
            bulletLifetime: 1.8,
            bulletSpritePath: 'assets/images/projectiles/bullet_gold_boss.png',
            bulletSpriteScale: 0.2,
            isDefaultWeapon: true,
            maxAmmo: Infinity
        },
```

**Weapon parameter reference:**
| Param | Description |
|-------|-------------|
| `name` | Display name |
| `damage` | Damage per projectile |
| `rof` | Rounds per second (use `0.25` for "1 shot every 4s" style) |
| `range` | Maximum firing distance in pixels |
| `projectileSpeed` | Speed of projectile in pixels/sec |
| `projectileColor` | Hex color of projectile |
| `accuracyStationary` | 1.0 = perfect, lower = more spread |
| `accuracyMoving` | Accuracy while moving (defaults to 75% of stationary) |
| `sfxFireKey` | Key in `AUDIO_ASSETS` for the firing sound |
| `muzzleFlashScale` | Visual muzzle flash size multiplier |
| `bulletLifetime` | How long the bullet lives in seconds |
| `bulletSpritePath` | Path to bullet sprite image |
| `bulletSpriteScale` | Scale of bullet sprite |
| `grenadeSpritePath` | (grenade weapons only) Path to grenade sprite |
| `grenadeSpriteScale` | (grenade weapons only) Scale of grenade sprite |

### 2c. AI Config (inside `CONFIG.AI`, around line 708)

```javascript
        POSSUM_BOSS_3: {
            ARENA_RADIUS: 250,
            DETECTION_RANGE: 550,
            MIN_ENGAGEMENT_DISTANCE: 120,
            BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER: 1500,

            DEATH_EXPLOSION_RADIUS: 200,
            DEATH_EXPLOSION_SFX: 'GRENADE_EXPLODE',

            CHASE_DESTINATION_REFRESH_INTERVAL: 1.0,
            MIN_CHASE_DEVIATION_UPDATE_INTERVAL: 0.5,
            CHASE_TARGET_DEVIATION_THRESHOLD_CELLS: 4,

            initialGuardPack: {
                enabled: true,
                countRange: [2, 5],
                countPerPhaseBonus: 0,
                spawnRadius: 120,
                unitPool: [
                    { type: 'possum_grunt', weight: 2 },
                    { type: 'possum_sniper', weight: 1 },
                    { type: 'possum_heavy', weight: 3 },
                    { type: 'possum_elite', weight: 2 }
                ]
            }
        },
```

### 2d. Audio Asset (inside `CONFIG.AUDIO_ASSETS`, around line 1774)

```javascript
        POSSUM_BOSS_3_WEAPON_FIRE: { path: 'assets/audio/sfx/gun_possum_heavy.ogg', defaultVolume: 0.3, pitchVariation: 0.1 },
```

---

## Step 3: Add instanceof Check — `js/unit.js`

### 3a. Sprite assignment (around line 95)

Find the `if/else if` chain that sets `spriteBaseName` and `spriteScaleFactor`. Add:

```javascript
        } else if (this instanceof PossumBoss3) {
            this.spriteBaseName = 'possum_boss_3';
            this.spriteScaleFactor = CONFIG.POSSUM_BOSS_3_SPRITE_SCALE_FACTOR || 1.0;
```

### 3b. Fire skip (around line 285) — ONLY if using Pattern A (custom fire)

If the boss overrides `_executeFire()` with custom logic (like PossumBoss1), add it to the skip check:

```javascript
            if (!(this instanceof PossumBoss1) && !(this instanceof PossumBoss3)) {
```

If using Pattern B (standard fire via `super._executeFire()`), skip this step.

---

## Step 4: Sprite Preloading — `js/game.js`

### 4a. Preload entry (around line 740, inside `unitTypesToPreload` array)

Add a new entry to the array:

```javascript
            {
                name: 'possum_boss_3',
                basePath: CONFIG.POSSUM_BOSS_3_SPRITE_PATH,
                actions: {
                    idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
                },
                deadPath: CONFIG.POSSUM_BOSS_3_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_BOSS_3_DEAD_SPRITE_FILES
            },
```

### 4b. Boss music detection (around line 1633)

Add the boss key to the `isBossMission` check so boss battle music plays:

```javascript
                    return targetKey === 'possum_boss_1' || targetKey === 'possum_revolver_boss' || targetKey === 'possum_boss_3';
```

---

## Step 5: Level Spawning — `js/levelGenerator.js`

Around line 1091, find the `if/else if` chain that checks `assassinationTypeKey`. Add a new `else if` block following the exact pattern of the existing boss blocks:

```javascript
            } else if (targetInfo.assassinationTypeKey === 'possum_boss_3') {
                let bossX, bossY, bossSpawned = false;
                const bossMaxAttempts = 50;
                const bossArenaRadius = CONFIG.AI.POSSUM_BOSS_3.ARENA_RADIUS || 200;
                const bossMinDistFromPlayer = CONFIG.AI.POSSUM_BOSS_3.BOSS_SPAWN_MIN_DISTANCE_FROM_PLAYER || 600;
                const playerSpawnCenterX = playerSpawnZone.x + playerSpawnZone.width / 2;
                const playerSpawnCenterY = playerSpawnZone.y + playerSpawnZone.height / 2;

                const bossSpawnMinX = playableMinX + bossArenaRadius;
                const bossSpawnMaxX = playableMaxX - bossArenaRadius;
                const bossSpawnMinY = playableMinY + bossArenaRadius;
                const bossSpawnMaxY = playableMinY + (playableHeight * 0.7) - bossArenaRadius;

                for (let attempt = 0; attempt < bossMaxAttempts; attempt++) {
                    bossX = this.rng.nextFloat(bossSpawnMinX, bossSpawnMaxX);
                    bossY = this.rng.nextFloat(bossSpawnMinY, bossSpawnMaxY);

                    const distToPlayer = distance(bossX, bossY, playerSpawnCenterX, playerSpawnCenterY);
                    if (distToPlayer < bossMinDistFromPlayer) continue;

                    const arenaZoneShape = { type: 'circle', x: bossX, y: bossY, radius: bossArenaRadius };
                    if (!this._isPlacementInvalid(arenaZoneShape, { isDecoration: false }, this.level.obstacles, extraKeepOutZones)) {
                        const boss = new PossumBoss3(bossX, bossY, this.game);
                        this.game.enemyUnits.push(boss);
                        allSpawnedEnemiesDuringGen.push(boss);
                        if (this.game.spatialGrid) {
                            this.game.spatialGrid.addObject(boss);
                        }
                        assassinationObjectiveInstance.targetUnitId = boss.id;
                        bossSpawned = true;

                        const bossDefinition = { initialGuardPack: (CONFIG.AI.POSSUM_BOSS_3 && CONFIG.AI.POSSUM_BOSS_3.initialGuardPack) ? CONFIG.AI.POSSUM_BOSS_3.initialGuardPack : { enabled: false } };
                        this._spawnInitialGuardsForObject(boss, bossDefinition, allSpawnedEnemiesDuringGen);

                        const arenaKeepOutRect = {
                            x: bossX - bossArenaRadius,
                            y: bossY - bossArenaRadius,
                            width: bossArenaRadius * 2,
                            height: bossArenaRadius * 2
                        };
                        extraKeepOutZones.push(arenaKeepOutRect);
                        break;
                    }
                }
                if (!bossSpawned {
                    // spawn failed — boss won't appear this mission
                }
            }
```

**Key points:**
- The `assassinationTypeKey` string must match the one used in `campaignRules.js`.
- The class constructor call (`new PossumBoss3(...)`) must match your class name.
- The `CONFIG.AI.POSSUM_BOSS_3` reference must match your AI config key.

---

## Step 6: Campaign Assassination Target — `js/campaignRules.js`

Inside the `ASSASSINATION_TARGET_POOL` array (around line 160), add one or more entries:

```javascript
        {
            assassinationTypeKey: "possum_boss_3",
            name: "Your Boss Name", callsign: "YourCallsign",
            description: "A description of the boss.",
            weight: 3, unlocksPhase: 3, isBoss: true
        },
```

| Field | Description |
|-------|-------------|
| `assassinationTypeKey` | Unique key — must match the key used in `levelGenerator.js` |
| `name` | Display name shown in briefings |
| `callsign` | Short callsign used in UI text |
| `description` | Flavor text shown in briefings |
| `weight` | Relative selection weight (higher = more common) |
| `unlocksPhase` | Campaign phase when this boss becomes available |
| `isBoss` | Must be `true` for boss-level targets (controls music, filtering) |

You can add multiple entries with the same `assassinationTypeKey` but different names/callsigns for variety.

---

## Step 7: Speech Config — `js/speechConfig.js`

Add the boss to `POSSUM_TYPE_HIERARCHY` (around line 6):

```javascript
    POSSUM_TYPE_HIERARCHY: {
        "PossumGrunt": 1,
        "PossumSniper": 2,
        "PossumHeavy": 2,
        "PossumRevolver": 3,
        "PossumElite": 4,
        "PossumBoss1": 5,
        "PossumBoss3": 5
    },
```

The number is the hierarchy rank (higher = more important). Bosses should be 5.

---

## Step 8: Manual/Encyclopedia Entry — `js/manualContent.js`

Around line 169, inside the enemy units array, add:

```javascript
                    {
                        name: "Your Boss Name (Boss)",
                        image: "assets/images/units/possum_boss_3/idle/possum_boss_3_idle_se.png",
                        description: "A description of the boss for the manual."
                    },
```

---

## Step 9: Script Tag — `index.html`

Add the script tag in the correct loading order (around line 736). Boss files must be loaded **after** `unit.js`, `config.js`, and `weapon.js`, but **before** `levelGenerator.js` and `game.js`:

```html
    <script src="js/possumBoss1.js"></script>
    <script src="js/possumRevolver.js"></script>
    <script src="js/possumBoss3.js"></script>  <!-- add here -->
    <script src="js/possumElite.js"></script>
```

---

## Step 10: Asset Files

### Required Sprites

| Asset | Path Convention | Notes |
|-------|----------------|-------|
| Idle sprites (8 directions) | `assets/images/units/possum_boss_3/idle/possum_boss_3_idle_{dir}.png` | Directions: `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw` |
| Dead sprites | `assets/images/units/possum_boss_3/dead/possum_boss3_dead1.png` | At least 1 dead sprite |
| Bullet sprite | `assets/images/projectiles/bullet_*.png` | Can reuse existing bullet sprites |

### Required Audio

| Asset | Path Convention | Notes |
|-------|----------------|-------|
| Weapon fire SFX | `assets/audio/sfx/*.ogg` or `.mp3` | Register in `CONFIG.AUDIO_ASSETS` |
| Death explosion SFX | Reuse existing (e.g., `GRENADE_EXPLODE`) | Set via `DEATH_EXPLOSION_SFX` in AI config |

---

## Quick Checklist

When adding a new boss, verify every item:

- [ ] `js/possumBoss3.js` — class created, extends `Unit`, overrides `die()` to complete assassination objective
- [ ] `js/config.js` — stat constants added (HP, SPEED, SIZE, COLOR, WEAPON, SPRITE_PATH, etc.)
- [ ] `js/config.js` — `WEAPON_DEFINITIONS` entry added
- [ ] `js/config.js` — `CONFIG.AI.POSSUM_BOSS_3` block added
- [ ] `js/config.js` — `AUDIO_ASSETS` SFX key added
- [ ] `js/unit.js` — `instanceof PossumBoss3` added to sprite chain
- [ ] `js/unit.js` — `instanceof PossumBoss3` added to fire-skip check (Pattern A only)
- [ ] `js/game.js` — sprite preload entry added
- [ ] `js/game.js` — boss music detection updated
- [ ] `js/levelGenerator.js` — spawn block added with matching `assassinationTypeKey`
- [ ] `js/campaignRules.js` — `ASSASSINATION_TARGET_POOL` entry added
- [ ] `js/speechConfig.js` — `POSSUM_TYPE_HIERARCHY` entry added
- [ ] `js/manualContent.js` — manual entry added
- [ ] `index.html` — `<script>` tag added in correct order
- [ ] Idle sprites (8 directions) exist in the correct folder
- [ ] Dead sprites exist in the correct folder
- [ ] Bullet sprite exists (or reuse existing)
- [ ] Audio file exists and is registered in `AUDIO_ASSETS`
