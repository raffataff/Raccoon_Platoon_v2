# Adding New Enemy Units to Raccoon Platoon

This document outlines all steps required to add a new enemy unit type to both Campaign and Shootout modes.

---

## Overview

Adding a new enemy unit requires modifications across multiple files:

1. **js/config.js** - Stats, AI settings, sprite paths, spawning pools
2. **js/weapon.js** - Weapon definition (unless reusing existing weapon)
3. **js/unit.js** - Sprite base name mapping
4. **js/[possumName].js** - Unit class with AI behavior
5. **js/levelGenerator.js** - Campaign spawning integration
6. **js/campaignRules.js** - Campaign rules (if boss/assassination target)
7. **js/game.js** - Preloading (if new sprite folders)
8. **assets/images/units/** - Sprite assets

---

## Step 1: Add Configuration in js/config.js

### 1.1 Base Stats

Add after the existing Possum configurations (around line 188):

```javascript
// --- Units: Possum Elite ---
POSSUM_ELITE_HP: 80,
POSSUM_ELITE_SPEED: 170,
POSSUM_ELITE_SIZE: 15,
POSSUM_ELITE_COLOR: '#8B4513',
```

### 1.2 Weapon Stats

```javascript
POSSUM_ELITE_WEAPON_DAMAGE: 12,
POSSUM_ELITE_WEAPON_ROF: 4,
POSSUM_ELITE_WEAPON_RANGE: 450,
POSSUM_ELITE_WEAPON_PROJECTILE_SPEED: 420,
POSSUM_ELITE_WEAPON_ACCURACY_STATIONARY: 0.80,
POSSUM_ELITE_WEAPON_ACCURACY_MOVING: 0.50,
```

### 1.3 Sprite Configuration

```javascript
POSSUM_ELITE_SPRITE_PATH: 'assets/images/units/possum_elite/',
POSSUM_ELITE_SPRITE_SCALE_FACTOR: 0.55,
POSSUM_ELITE_DEAD_SPRITE_PATH: 'assets/images/units/possum_elite/dead/',
POSSUM_ELITE_DEAD_SPRITE_FILES: ['possum_elite_dead1.png', 'possum_elite_dead2.png'],
POSSUM_ELITE_DEAD_SPRITE_SCALE: 0.5,
```

### 1.4 AI Configuration

Add in the AI section (around line 213):

```javascript
AI: {
    // ... existing AI configs ...
    
    POSSUM_ELITE: {
        DETECTION_RANGE: 320,
        PATROL_MIN_RADIUS: 100,
        PATROL_MAX_RADIUS: 250,
        PATROL_WAIT_BASE: 1.0,
        PATROL_WAIT_RANDOM_ADD: 1.5,
        CHASE_PREDICTION_TIME_FACTOR: 0.30,
        ENGAGE_RANGE_BUFFER: 25,
        MAX_CONSECUTIVE_STUCK_ATTEMPTS: 3,
    },
}
```

### 1.5 Guard Pack Configuration (for huts/towers)

Add in obstacle definitions (e.g., POSSUM_HUT_SPAWNING or unitPool):

```javascript
unitPool: [
    { type: 'possum_grunt', weight: 4 },
    { type: 'possum_heavy', weight: 1 },
    { type: 'possum_elite', weight: 1 }  // Add to pool
]
```

### 1.6 Campaign Scaling

In js/campaignRules.js, you may want to add elite unit chances:

```javascript
BASE_PARAMETERS: {
    // ... existing parameters ...
    eliteChance: { initial: 0.05, perPhaseGrowthFactor: 0.03, max: 0.25, randomnessFactor: 0.02, unlocksPhase: 4 },
}
```

---

## Step 2: Add Weapon in js/weapon.js

Add a new weapon definition (after existing Possum weapons):

```javascript
POSSUM_ELITE_WEAPON: new Weapon(
    'Elite Rifle',
    CONFIG.POSSUM_ELITE_WEAPON_DAMAGE,
    CONFIG.POSSUM_ELITE_WEAPON_ROF,
    CONFIG.POSSUM_ELITE_WEAPON_RANGE,
    CONFIG.POSSUM_ELITE_WEAPON_PROJECTILE_SPEED,
    '#8B4513',
    CONFIG.POSSUM_ELITE_WEAPON_ACCURACY_STATIONARY,
    CONFIG.POSSUM_ELITE_WEAPON_ACCURACY_MOVING,
    'enemy_shot'
),
```

Also add to the WEAPONS object export:

```javascript
const WEAPONS = {
    // ... existing weapons ...
    POSSUM_ELITE_WEAPON: POSSUM_ELITE_WEAPON,
};
```

---

## Step 3: Create Unit Class in js/possumElite.js

Create a new file based on possumSniper.js or possum.js:

```javascript
// js/possumElite.js

class PossumElite extends Unit {
    constructor(x, y, game, id) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_ELITE_HP, 
              CONFIG.POSSUM_ELITE_SPEED, 
              CONFIG.POSSUM_ELITE_SIZE, 
              CONFIG.POSSUM_ELITE_COLOR, 
              id || `PSME-${Date.now().toString(36).slice(-4)}`);

        this.deadSpritePathKey = 'POSSUM_ELITE_DEAD_SPRITE_PATH';
        this.deadSpriteFilesKey = 'POSSUM_ELITE_DEAD_SPRITE_FILES';
        this.deadSpriteScaleKey = 'POSSUM_ELITE_DEAD_SPRITE_SCALE';
        this.spriteBaseName = 'possum_elite';
        this.spriteScaleFactor = CONFIG.POSSUM_ELITE_SPRITE_SCALE_FACTOR;
        
        this.weapon = WEAPONS.POSSUM_ELITE_WEAPON;
        
        this.aiConfig = CONFIG.AI.POSSUM_ELITE || {};
        this.detectionRange = this.aiConfig.DETECTION_RANGE || 300;

        this.aiState = 'PATROLLING';
    }

    update(deltaTime) {
        if (!this.isAlive()) return;
        super.update(deltaTime);
    }

    _handleEnemyCombat(deltaTime, obstacles) {
        // Elite has grunt-like behavior but slightly better AI
        // Copy logic from PossumGrunt or customize as needed
    }
}
```

---

## Step 4: Register Sprite Base Name in js/unit.js

In the Unit constructor (around lines 67-79), add:

```javascript
} else if (this instanceof PossumElite) {
    this.spriteBaseName = 'possum_elite';
    this.spriteScaleFactor = CONFIG.POSSUM_ELITE_SPRITE_SCALE_FACTOR || 1.0;
}
```

---

## Step 5: Add to Script Includes in index.html

Ensure the new unit file is loaded:

```html
<script src="js/possumElite.js"></script>
```

Add it after other possum unit includes.

---

## Step 6: Campaign Mode Integration

### 6.1 Update Level Generator (js/levelGenerator.js)

Find where other possum units are spawned and add support for possum_elite:

```javascript
// In spawn logic, add case for 'possum_elite'
case 'possum_elite':
    newUnit = new PossumElite(spawnX, spawnY, this.game, id);
    break;
```

### 6.2 Update Campaign Rules (js/campaignRules.js)



---

## Step 7: Shootout Mode Integration

In js/config.js, add to SHOOTOUT_MODE section:

### 7.1 Add Tilesheet (Optional - for visual variety)

```javascript
ENEMY_ELITE_TILESHEET: {
    PATH: 'assets/images/shootouts/enemies/possum_elite_tile.png',
    FRAME_WIDTH: 128,
    FRAME_HEIGHT: 128,
    NUM_FRAMES: 4,
    SCALE: 1.0,
    TILE_SCALE: 0.75
},
```

### 7.2 Add to Default Enemy Configs

```javascript
DEFAULT_ENEMY_CONFIGS: {
    grunt: { enabled: true, weight: 60, peekOffset: 40, scale: 1.0, bulletOffset: { x: -3, y: 14 } },
    heavy: { enabled: false, weight: 25, peekOffset: 50, scale: 1.2, bulletOffset: { x: 5, y: 2 } },
    elite: { enabled: false, weight: 15, peekOffset: 45, scale: 1.1, bulletOffset: { x: -3, y: 12 } }
},
```

### 7.3 Add Enemy Type Definition

```javascript
ENEMY_TYPES: {
    grunt: { displayName: 'Grunt', color: '#A0522D', tilesheetKey: 'ENEMY_TILESHEET' },
    heavy: { displayName: 'Heavy', color: '#6A4A3A', tilesheetKey: 'ENEMY_HEAVY_TILESHEET' },
    elite: { displayName: 'Elite', color: '#8B4513', tilesheetKey: 'ENEMY_ELITE_TILESHEET' }
},
```

### 7.4 Update Spawn Point Configs

In BACKGROUND definitions, update enemyConfigs:

```javascript
TREE_SPAWN_POSITIONS: [
    { x: 345, y: 905, peekDirection: "right", enemyConfigs: {
        grunt: { enabled: true, weight: 60, peekOffset: 85, scale: 1.7 },
        elite: { enabled: true, weight: 40, peekOffset: 85, scale: 1.8 }
    }},
    // ... more positions
]
```

---

## Step 8: Preloading (js/game.js)

**CRITICAL:** If using new sprite folders, you MUST add the unit to the `preloadUnitAssets()` function in js/game.js. Without this, the game will only show a colored circle with no sprite.

In js/game.js, find the `preloadUnitAssets()` function (around line 406). Add your new unit to the `unitTypesToPreload` array:

```javascript
{
    name: 'possum_elite',
    basePath: CONFIG.POSSUM_ELITE_SPRITE_PATH,
    actions: {
        idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
    },
    deadPath: CONFIG.POSSUM_ELITE_DEAD_SPRITE_PATH,
    deadFiles: CONFIG.POSSUM_ELITE_DEAD_SPRITE_FILES
}
```

Place it after other possum entries (e.g., after `possum_revolver`). The sprite keys will be generated as:
- `possum_elite_idle_n.png`, `possum_elite_idle_ne.png`, etc.
- Dead sprites loaded from `POSSUM_ELITE_DEAD_SPRITE_PATH`

---

## Sprite Requirements

### Campaign Mode Sprites

Location: `assets/images/units/possum_elite/`

| Action | Directions | Files |
|--------|------------|-------|
| idle | n, ne, e, se, s, sw, w, nw | possum_elite_idle_[direction].png |
| walk | n, ne, e, se, s, sw, w, nw | possum_elite_walk_[direction].png |
| fire | n, ne, e, se, s, sw, w, nw | possum_elite_fire_[direction].png |

For now, only Idle sprites are used for all states

Dead sprites: `assets/images/units/possum_elite/dead/`
- possum_elite_dead1.png
- possum_elite_dead2.png

### Shootout Mode Sprites (Optional)

Location: `assets/images/shootouts/enemies/`
- possum_elite_tile.png (128x128, 4 frame animation)

---

## Quick Checklist

- [ ] Add stats in js/config.js (HP, speed, size, color)
- [ ] Add weapon stats in js/config.js
- [ ] Add sprite paths in js/config.js
- [ ] Add AI config in js/config.js
- [ ] Add weapon in js/weapon.js
- [ ] Create js/possumElite.js unit class
- [ ] Register sprite base name in js/unit.js
- [ ] Include script in index.html
- [ ] **Add to preloadUnitAssets() in js/game.js** (CRITICAL - or only fallback circle will show)
- [ ] Update campaign spawning (levelGenerator.js)
- [ ] Update shootout config (config.js)
- [ ] Add sprite assets
- [ ] Test in campaign mode
- [ ] Test in shootout mode

---

## Common Pitfalls

### Missing Sprite Preload (Only See Fallback Circle)

If your unit appears as only a colored circle in-game (no sprite visible), you likely forgot to add it to `preloadUnitAssets()` in js/game.js. The Unit constructor has a fallback that draws a simple colored circle when `spriteBaseName` sprites aren't found in `preloadedImages`.

**Solution:** Add the unit to the `unitTypesToPreload` array in js/game.js (see Step 8 above).

### Using hasLineOfSight Correctly

`hasLineOfSight` is a **global utility function** defined in `js/utils.js`, NOT a method on the Unit class. 

**INCORRECT (will cause "this.hasLineOfSight is not a function" error):**
```javascript
if (this.hasLineOfSight(target, obstacles)) {
    // ...
}
```

**CORRECT:**
```javascript
if (hasLineOfSight(this.x, this.y, target.x, target.y, obstacles.filter(o => o.blocksMovement && !o.isDestroyed), this.game.level)) {
    // ...
}
```

The function requires:
1. Source coordinates (`this.x`, `this.y`)
2. Target coordinates (`target.x`, `target.y`)
3. Filtered obstacles (only those that block movement and aren't destroyed)
4. The game level instance (`this.game.level`)

### Facing and Firing

The Unit base class handles facing rotation automatically. Do NOT use `this.faceTowards()` - it does not exist.

**INCORRECT (will cause "this.faceTowards is not a function" error):**
```javascript
this.faceTowards(target.x, target.y);
```

**CORRECT:** The base Unit class automatically handles facing when firing. Simply call:
```javascript
this._executeFire(target.x, target.y);
```

For firing, use `_executeFire(pointX, pointY)` method on the Unit class, not custom firing logic.

See other possum units (possum.js, possumHeavy.js, possumBoss1.js) for reference implementations.

---

## Example: Possum Elite (Already Has Sprites)

The possum_elite unit already has idle sprites in all 8 directions at:
`assets/images/units/possum_elite/idle/possum_elite_idle_[n|ne|e|se|s|sw|w|nw].png`

And dead sprites at:
`assets/images/units/possum_elite/dead/possum_elite_dead1.png`
`assets/images/units/possum_elite/dead/possum_elite_dead2.png`

This unit needs the code implementation following the steps above.
