# Adding New Raccoon Units to Raccoon Platoon

This document provides a comprehensive overview of all components required to add new raccoon unit types to the game. Whether you're adding a new specialized class, a variant, or a completely new unit type, this guide covers every aspect of the implementation.

---

## Table of Contents

1. [Overview of Existing Architecture](#overview-of-existing-architecture)
2. [Core Unit Implementation](#core-unit-implementation)
3. [Configuration (config.js)](#configuration-configjs)
4. [Weapons System](#weapons-system)
5. [Visual Assets (Sprites)](#visual-assets-sprites)
6. [Audio Assets](#audio-assets)
7. [UI Integration](#ui-integration)
8. [Save/Load System](#saveload-system)
9. [Game Logic Integration](#game-logic-integration)
10. [Step-by-Step Implementation Checklist](#step-by-step-implementation-checklist)

---

## Overview of Existing Architecture

The game uses a class-based inheritance system for units:

```
Unit (base class - js/unit.js)
    ├── Raccoon (player units - js/raccoon.js)
    │   └── RaccoonHostage (rescuable units - js/raccoonHostage.js)
    └── Possum (enemy units - js/possum.js)
        ├── PossumGrunt
        ├── PossumHeavy
        ├── PossumBoss1
        ├── PossumRevolver
        └── PossumSniper
```

Currently, raccoons have rank-based variants (Private, Elite, Maverick) that use different sprite sets but share the same `Raccoon` class. New unit types can follow this pattern or create entirely new classes.

---

## Core Unit Implementation

### Option 1: Creating a New Raccoon Class

Create a new JavaScript file (e.g., `js/raccoonScout.js`):

```javascript
class RaccoonScout extends Raccoon {
    constructor(x, y, game, id, faceImageUrl, name, existingXP, existingRank, existingKills) {
        // Call parent constructor with custom CONFIG values
        super(x, y, game, id, faceImageUrl, name, existingXP, existingRank, existingKicks);
        
        // Override default weapon
        this.weapon = WEAPONS.SCOUT_RIFLE;
        
        // Override base stats
        this.maxHp = CONFIG.SCOUT_HP || 25;
        this.hp = this.maxHp;
        this.speed = CONFIG.SCOUT_SPEED || 250;
        this.size = CONFIG.SCOUT_SIZE || 10;
        
        // Class-specific properties
        this.isStealthed = false;
        this.stealthCooldown = 0;
        
        // Sprite configuration
        this.spriteBaseName = 'raccoon_scout';
        this.spriteScaleFactor = CONFIG.SCOUT_SPRITE_SCALE_FACTOR || 0.5;
    }
    
    // Override update for custom behavior
    update(deltaTime) {
        super.update(deltaTime);
        // Custom stealth logic here
    }
    
    // Class-specific abilities
    activateStealth() {
        if (this.stealthCooldown <= 0 && this.isAlive()) {
            this.isStealthed = true;
            this.stealthCooldown = CONFIG.SCOUT_STEALTH_COOLDOWN || 30;
        }
    }
}
```

### Option 2: Extending the Existing Raccoon Class

For rank-based variants (like the existing Private, Elite, Maverick), add logic to `js/raccoon.js`:

```javascript
// In the Raccoon constructor or applyRankBonuses method
if (this.rank === 'Scout') {
    // Apply scout-specific bonuses
    this.speed = CONFIG.SCOUT_RACCOON_SPEED || 250;
}
```

### Key Properties to Implement

| Property | Description | Where It's Used |
|----------|-------------|-----------------|
| `weapon` | Weapon object for combat | Combat system |
| `maxHp` | Maximum health points | Damage calculation |
| `hp` | Current health | Rendering, death checks |
| `speed` | Movement speed in pixels/sec | Movement system |
| `size` | Unit collision radius | Collision detection |
| `spriteBaseName` | Base path for sprite assets | Rendering |
| `spriteScaleFactor` | Scale multiplier for sprites | Rendering |
| `accuracyBonus` | Rank-based accuracy modifier | Combat |

---

## Configuration (config.js)

Add unit-specific configuration values in `js/config.js`. Group them logically with existing unit configurations.

### Base Stats Configuration

```javascript
// --- Units: Raccoon Scout ---
SCOUT_HP: 25,
SCOUT_SPEED: 250,
SCOUT_SIZE: 10,
SCOUT_COLOR: '#90EE90', // Light green for scout
SCOUT_DETECTION_RANGE: 300, // Better detection than standard
SCOUT_ENGAGEMENT_RANGE_MIN: 100,
SCOUT_ENGAGEMENT_RANGE_MAX: 600,
```

### Weapon Configuration

```javascript
// --- Weapons: Scout ---
SCOUT_RIFLE_DAMAGE: 10,
SCOUT_RIFLE_ROF: 6,
SCOUT_RIFLE_RANGE: 600,
SCOUT_RIFLE_PROJECTILE_SPEED: 550,
SCOUT_RIFLE_ACCURACY_STATIONARY: 0.92,
SCOUT_RIFLE_ACCURACY_MOVING: 0.70,
```

### Sprite Configuration

```javascript
SCOUT_SPRITE_PATH: 'assets/images/units/raccoon/scout/',
SCOUT_SPRITE_SCALE_FACTOR: 0.5,
SCOUT_DEAD_SPRITE_PATH: 'assets/images/units/raccoon/scout/dead/',
SCOUT_DEAD_SPRITE_FILES: ['scout_dead_1.png'],
SCOUT_DEAD_SPRITE_SCALE: 0.5,
```

### Ability Configuration

```javascript
SCOUT_STEALTH_DURATION: 10,
SCOUT_STEALTH_COOLDOWN: 30,
SCOUT_STEALTH_SPEED_BONUS: 1.5,
```

### Rank Progression Configuration

If the new unit has unique rank progression:

```javascript
SCOUT_RANK_THRESHOLDS: [
    { rankName: "Scout Recruit", xpNeeded: 0, statBoosts: {} },
    { rankName: "Pathfinder", xpNeeded: 150, statBoosts: { maxHpBonus: 5, accuracyBonus: 0.03 } },
    { rankName: "Ghost", xpNeeded: 500, statBoosts: { maxHpBonus: 15, accuracyBonus: 0.1, stealthBonus: true } }
],
```

---

## Weapons System

### Adding a New Weapon

In `js/weapon.js`, add to the `WEAPONS` object:

```javascript
SCOUT_RIFLE: new Weapon(
    'Scout Rifle',
    CONFIG.SCOUT_RIFLE_DAMAGE,
    CONFIG.SCOUT_RIFLE_ROF,
    CONFIG.SCOUT_RIFLE_RANGE,
    CONFIG.SCOUT_RIFLE_PROJECTILE_SPEED,
    CONFIG.PROJECTILE_COLOR_SCOUT, // Add to CONFIG
    CONFIG.SCOUT_RIFLE_ACCURACY_STATIONARY,
    CONFIG.SCOUT_RIFLE_ACCURACY_MOVING,
    'SCOUT_RIFLE_FIRE', // Audio key
    0.8 // Muzzle flash scale
),
```

### Weapon Properties

| Property | Description | Example |
|----------|-------------|---------|
| `name` | Display name | "Scout Rifle" |
| `damage` | Damage per hit | 10 |
| `rof` | Rate of fire (shots/sec) | 6 |
| `range` | Effective range in pixels | 600 |
| `projectileSpeed` | Bullet velocity | 550 |
| `accuracyStationary` | Accuracy when stationary (0-1) | 0.92 |
| `accuracyMoving` | Accuracy while moving (0-1) | 0.70 |
| `sfxFireKey` | Audio asset key | 'SCOUT_RIFLE_FIRE' |
| `muzzleFlashScale` | Visual scale | 0.8 |

---

## Visual Assets (Sprites)

### Required Sprite Categories

For a complete unit implementation, create sprites for:

1. **Idle sprites** (8 directions)
2. **Walk/Movement sprites** (8 directions)
3. **Fire sprites** (8 directions)
4. **Dead sprites** (multiple variants)
5. **Mugshot/Face sprite** (for UI)

### Directory Structure

```
assets/images/units/raccoon/
├── [variant_name]/
│   ├── idle/
│   │   ├── raccoon_variant_idle_e.png    # East
│   │   ├── raccoon_variant_idle_ne.png   # Northeast
│   │   ├── raccoon_variant_idle_n.png    # North
│   │   ├── raccoon_variant_idle_nw.png   # Northwest
│   │   ├── raccoon_variant_idle_s.png    # South
│   │   ├── raccoon_variant_idle_se.png   # Southeast
│   │   ├── raccoon_variant_idle_sw.png   # Southwest
│   │   └── raccoon_variant_idle_w.png    # West
│   ├── walk/                              # If different from idle
│   ├── fire/                              # Firing animation frames
│   ├── dead/
│   │   ├── raccoon_variant_dead_1.png
│   │   ├── raccoon_variant_dead_2.png
│   │   └── ...
│   └── mugshot/
│       └── raccoon_variant_mugshot.png    # For recruitment UI
```

### Sprite Requirements

- **Format**: PNG with transparency
- **Base resolution**: ~256x256 pixels (scalable)
- **Art style**: Consistent with existing units
- **Naming convention**: `{unit_type}_{state}_{direction}.png`

### Adding Sprites to CONFIG

```javascript
// In config.js
SCOUT_SPRITE_PATH: 'assets/images/units/raccoon/scout/',
SCOUT_SPRITE_FILES: {
    idle: {
        e: 'raccoon_scout_idle_e.png',
        ne: 'raccoon_scout_idle_ne.png',
        n: 'raccoon_scout_idle_n.png',
        nw: 'raccoon_scout_idle_nw.png',
        s: 'raccoon_scout_idle_s.png',
        se: 'raccoon_scout_idle_se.png',
        sw: 'raccoon_scout_idle_sw.png',
        w: 'raccoon_scout_idle_w.png'
    },
    dead: ['raccoon_scout_dead_1.png', 'raccoon_scout_dead_2.png']
},
```

---

## Audio Assets

### Required Audio Files

| Audio Type | Purpose | Format |
|------------|---------|--------|
| Fire SFX | Weapon firing sound | MP3 |
| Reload SFX | Reloading weapon | MP3 |
| Ability SFX | Special ability activation | MP3 |
| Death SFX | Unit death | MP3 |
| Footstep SFX | Movement sounds | MP3 |

### Adding Audio to CONFIG

In `js/config.js`, add to `AUDIO_ASSETS`:

```javascript
SCOUT_RIFLE_FIRE: { 
    path: 'assets/audio/sfx/scout_rifle_fire.mp3', 
    defaultVolume: 0.25, 
    pitchVariation: 0.15 
},
SCOUT_RELOAD: { 
    path: 'assets/audio/sfx/scout_reload.mp3', 
    defaultVolume: 0.2, 
    pitchVariation: 0.1 
},
SCOUT_ABILITY_STEALTH: { 
    path: 'assets/audio/sfx/scout_stealth_activate.mp3', 
    defaultVolume: 0.3, 
    pitchVariation: 0.05 
},
```

### Playing Audio in Unit

```javascript
// In unit class
fireWeapon() {
    // ... firing logic ...
    
    if (this.game && this.game.audioManager) {
        this.game.audioManager.play('SCOUT_RIFLE_FIRE');
    }
}
```

---

## UI Integration

### Recruitment UI

If the new unit type is selectable during recruitment:

1. **Add to available recruits generation** in `js/game.js`:
```javascript
// In recruit generation logic
const availableUnitTypes = ['standard', 'scout', 'heavy', 'sniper'];
const chosenType = availableUnitTypes[Math.floor(Math.random() * availableUnitTypes.length)];

if (chosenType === 'scout') {
    const scout = new RaccoonScout(0, 0, this, generateId(), faceImage, name);
    this.masterRoster.push(scout);
}
```

2. **Add unit type indicator** in recruitment cards:
```javascript
// In ui.js - recruitment card rendering
if (unit instanceof RaccoonScout) {
    cardElement.classList.add('recruit-scout');
    cardElement.innerHTML += '<span class="unit-class-badge">Scout</span>';
}
```

### Squad Panel

Update the squad panel display to show new stats:

```javascript
// In ui.js - squad panel update
updateSquadPanel() {
    // ... existing code ...
    
    // Add scout-specific indicators
    if (unit instanceof RaccoonScout && unit.isStealthed) {
        // Show stealth indicator
    }
}
```

### CSS Styling

Add new CSS classes in `style.css`:

```css
/* Unit type badges */
.unit-badge-scout {
    background-color: #90EE90;
    color: #006400;
}

.unit-badge-heavy {
    background-color: #CD853F;
    color: #4A2511;
}

/* Stealth indicator */
.stealth-active {
    opacity: 0.5;
    filter: grayscale(100%);
}
```

---

## Save/Load System

### Serialization

The game uses `saveManager.js` for persistence. New unit types must be properly serialized:

```javascript
// In saveManager.js - Raccoon serialization
serializeRaccoon(raccoon) {
    return {
        id: raccoon.id,
        name: raccoon.name,
        type: raccoon.constructor.name, // 'Raccoon', 'RaccoonScout', etc.
        faceImageUrl: raccoon.faceImageUrl,
        xp: raccoon.xp,
        rank: raccoon.rank,
        killCount: raccoon.killCount,
        hp: raccoon.hp,
        maxHp: raccoon.maxHp,
        // Add new unit type properties
        isStealthed: raccoon.isStealthed || false,
        // ... any other custom properties
    };
}
```

### Deserialization

```javascript
// In saveManager.js - Raccoon deserialization
deserializeRaccoon(data, game) {
    let raccoon;
    
    switch(data.type) {
        case 'RaccoonScout':
            raccoon = new RaccoonScout(0, 0, game, data.id, data.faceImageUrl, data.name);
            break;
        default:
            raccoon = new Raccoon(0, 0, game, data.id, data.faceImageUrl, data.name);
    }
    
    raccoon.xp = data.xp;
    raccoon.rank = data.rank;
    raccoon.killCount = data.killCount;
    raccoon.hp = data.hp;
    raccoon.maxHp = data.maxHp;
    
    return raccoon;
}
```

---

## Game Logic Integration

### Spawning in Missions

Add new unit type spawning in `js/game.js` or mission generation:

```javascript
// In mission start / unit deployment
deployRaccoonVariant(variantType, x, y) {
    let raccoon;
    
    switch(variantType) {
        case 'scout':
            raccoon = new RaccoonScout(x, y, this, generateId(), getFaceImage(), getRandomName());
            break;
        // ... other variants
    }
    
    this.deployedSquadRoster.push(raccoon);
    return raccoon;
}
```

### AI Behavior (if enemy unit)

For enemy variants, add AI behavior configuration in `config.js`:

```javascript
AI: {
    // ... existing AI configs ...
    
    SCOUT_POSSUM: {
        DETECTION_RANGE: 350,
        PATROL_MIN_RADIUS: 100,
        PATROL_MAX_RADIUS: 250,
        SNEAK_CHANCE: 0.4, // Chance to use stealth
        // ... other AI behaviors
    }
}
```

### Combat Integration

Ensure new weapons interact properly with the damage system:

```javascript
// In weapon.js - projectile damage handling
if (obj instanceof Unit && obj.isAlive() && obj.team !== this.shooterTeam) {
    const distToTarget = distance(this.x, this.y, obj.x, obj.y);
    if (distToTarget < obj.size + this.size) {
        let actualDamage = this.damage;
        
        // Apply damage type bonuses
        if (this.shooterUnit instanceof RaccoonScout && obj.team === 'enemy') {
            actualDamage *= 1.25; // Scout bonus against enemies
        }
        
        obj.takeDamage(actualDamage, this.shooterUnit);
    }
}
```

---

## Step-by-Step Implementation Checklist

Use this checklist when adding a new raccoon unit type:

### Phase 1: Core Implementation

- [ ] Create new unit class file (e.g., `js/raccoonVariant.js`)
- [ ] Extend Raccoon base class or create standalone
- [ ] Implement constructor with custom properties
- [ ] Override `update()` method for unique behavior
- [ ] Implement custom abilities as methods
- [ ] Register class in index.html script loading

### Phase 2: Configuration

- [ ] Add base stats to `CONFIG` (HP, speed, size, detection range)
- [ ] Add weapon configuration
- [ ] Add sprite paths and scale factors
- [ ] Add audio asset keys
- [ ] Add rank progression (if applicable)
- [ ] Add ability cooldowns and values

### Phase 3: Weapons

- [ ] Create Weapon object in `WEAPONS` constant
- [ ] Add projectile color to CONFIG
- [ ] Configure accuracy values
- [ ] Set muzzle flash scale

### Phase 4: Assets

- [ ] Create sprite directory structure
- [ ] Generate idle sprites (8 directions)
- [ ] Generate dead sprites (1-2 variants)
- [ ] Generate mugshot for UI
- [ ] Record and add audio files
- [ ] Test sprite scaling and positioning

### Phase 5: UI

- [ ] Add CSS classes for new unit type
- [ ] Update recruitment card rendering
- [ ] Update squad panel display
- [ ] Add unit type badges/indicators
- [ ] Add health bar customization (if needed)

### Phase 6: Save System

- [ ] Add serialization in `saveManager.js`
- [ ] Add deserialization support
- [ ] Test save/load with new unit type
- [ ] Verify XP and rank preservation

### Phase 7: Testing

- [ ] Test unit spawning
- [ ] Test combat and damage
- [ ] Test movement and pathfinding
- [ ] Test abilities (if any)
- [ ] Test UI interactions
- [ ] Test save/load cycle
- [ ] Test audio playback
- [ ] Test edge cases (death, promotion, etc.)

---

## Example: Adding a "Heavy Raccoon" Variant

Here's a quick reference for adding a tank-like heavy raccoon:

### 1. New Class (js/raccoonHeavy.js)

```javascript
class RaccoonHeavy extends Raccoon {
    constructor(x, y, game, id, faceImageUrl, name, existingXP, existingRank, existingKills) {
        super(x, y, game, id, faceImageUrl, name, existingXP, existingRank, existingKills);
        
        this.weapon = WEAPONS.HEAVY_MACHINE_GUN;
        this.maxHp = CONFIG.HEAVY_RACCOON_HP || 40;
        this.hp = this.maxHp;
        this.speed = CONFIG.HEAVY_RACCOON_SPEED || 120;
        this.size = CONFIG.HEAVY_RACCOON_SIZE || 16;
        
        this.spriteBaseName = 'raccoon_heavy';
        this.spriteScaleFactor = CONFIG.HEAVY_RACCOON_SPRITE_SCALE_FACTOR || 0.65;
        
        // Heavy units can provide cover
        this.providesCover = true;
        this.coverBonus = 0.3;
    }
}
```

### 2. CONFIG Additions

```javascript
HEAVY_RACCOON_HP: 40,
HEAVY_RACCOON_SPEED: 120,
HEAVY_RACCOON_SIZE: 16,
HEAVY_RACCOON_SPRITE_SCALE_FACTOR: 0.65,
HEAVY_RACCOON_COVER_BONUS: 0.3,
```

### 3. Weapon Addition

```javascript
HEAVY_MACHINE_GUN: new Weapon(
    'Heavy MG',
    CONFIG.HEAVY_MG_DAMAGE || 12,
    CONFIG.HEAVY_MG_ROF || 4,
    CONFIG.HEAVY_MG_RANGE || 450,
    CONFIG.HEAVY_MG_PROJECTILE_SPEED || 480,
    CONFIG.PROJECTILE_COLOR_HEAVY_RACCOON,
    CONFIG.HEAVY_MG_ACCURACY_STATIONARY || 0.85,
    CONFIG.HEAVY_MG_ACCURACY_MOVING || 0.40,
    'HEAVY_RACCOON_MG_FIRE',
    1.3
),
```

---

## Best Practices

1. **Follow existing patterns**: Study `Raccoon`, `RaccoonHostage`, and `Possum*` classes for consistent implementation
2. **Modular configuration**: Keep all tunable values in CONFIG for easy balancing
3. **Backward compatibility**: Ensure new units work with existing save files
4. **Consistent naming**: Follow established naming conventions for files, classes, and CONFIG keys
5. **Test incrementally**: Test each phase before moving to the next
6. **Document changes**: Update this document as you add new unit types

---

## Related Files

- [`js/unit.js`](js/unit.js) - Base unit class
- [`js/raccoon.js`](js/raccoon.js) - Player raccoon implementation
- [`js/weapon.js`](js/weapon.js) - Weapon definitions
- [`js/config.js`](js/config.js) - Game configuration
- [`js/game.js`](js/game.js) - Main game logic
- [`js/ui.js`](js/ui.js) - User interface
- [`js/saveManager.js`](js/saveManager.js) - Save/load system
- [`style.css`](style.css) - UI styling

---

*Last Updated: 2026-02-28*
