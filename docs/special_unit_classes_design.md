# Special Unit Classes Design Document

## Current Implementation Analysis

### Existing Promotion System
The game currently uses a **linear rank-based promotion system** defined in `config.js`:

```
RANK_THRESHOLDS: [
    Recruit → Private → Corporal → Sergeant → Elite → Ghost
]
```

Each rank provides:
- **XP thresholds** for progression
- **Stat boosts** (maxHpBonus, accuracyBonus, bulletLifetimeBonus)
- **Night vision radius**
- **Default weapon** (MG variants: RACCOON_MACHINE_GUN → ... → RACCOON_GHOST_MG)

### Current Rank-to-Sprite Mapping
Each rank has an associated sprite set in `config.js`:
- `RACCOON_PRIVATE_SPRITE_PATH`
- `RACCOON_CORPORAL_SPRITE_PATH`
- etc.

### Maverick - Existing "Special Class"
Maverick exists as an outlier case (line 79-81, 106-107 in raccoon.js, config.js lines 106-107, 332-347):
- Has its own sprite: `raccoon_maverick`
- Has its own weapon: `RACCOON_MAVERICK_MG` (lower stats than standard MG)
- Works as a rank, but breaks the weapon progression

---

## Problem Statement

New unit types (Shotgunner, Tanker, RedBeret) cannot fit the current model because:

1. **Different weapon types** - Shotgunners use shotguns, not machine guns
2. **Different base stats** - Tankers need high HP/low speed, RedBerets need balanced stats
3. **Different role identity** - Class defines tactical role, not just rank

A **Class** (Specialization) system is needed that is separate from **Rank** (experience level).

---

## Recommended Architecture: Hybrid Class + Rank System

### Core Concept
A unit has TWO dimensions:
1. **Class/Specialization** - Defines base role, stats, and weapon type
2. **Rank** - Defines experience level and incremental improvements

Example: **"Ghost Shotgunner"** = Class: Shotgunner, Rank: Ghost

### Class Definitions

Each class should define:

```javascript
CLASS_DEFINITIONS: {
    RIFLEMAN: {
        name: "Rifleman",
        baseHp: 20,
        baseSpeed: 200,
        baseSize: 12,
        baseAccuracy: 0.0,        // Bonus applied on top of rank bonus
        preferredRange: [100, 300],
        defaultWeaponType: 'MG',   // Uses machine gun progression
        spriteBaseName: 'raccoon',
        canUseGrenades: true,
        promotionTree: 'STANDARD'  // References shared rank tree
    },
    SHOTGUNNER: {
        name: "Shotgunner",
        baseHp: 25,
        baseSpeed: 160,
        baseSize: 14,
        baseAccuracy: -0.05,      // Lower accuracy (short range weapon)
        preferredRange: [30, 100],
        defaultWeaponType: 'SHOTGUN',
        spriteBaseName: 'raccoon_shotgunner',
        canUseGrenades: true,
        promotionTree: 'SHOTGUNNER_STANDARD'
    },
    TANKER: {
        name: "Tanker",
        baseHp: 50,
        baseSpeed: 100,
        baseSize: 18,
        baseAccuracy: -0.1,       // Heavy armor reduces mobility/accuracy
        preferredRange: [50, 150],
        defaultWeaponType: 'HEAVY_MG',
        spriteBaseName: 'raccoon_tanker',
        canUseGrenades: false,
        promotionTree: 'TANKER_STANDARD'
    },
    REDBERET: {
        name: "RedBeret",
        baseHp: 15,
        baseSpeed: 250,
        baseSize: 10,
        baseAccuracy: 0.05,        // Elite soldiers - slightly better base
        preferredRange: [150, 400],
        defaultWeaponType: 'ASSAULT_RIFLE',
        spriteBaseName: 'raccoon_redberet',
        canUseGrenades: true,
        promotionTree: 'ELITE_STANDARD'
    }
}
```

### Rank System (Per-Class Promotion)

Each class maintains its own rank progression, but ranks can be **shared across classes**:

```javascript
// Shared rank definitions (can be referenced by multiple class trees)
SHARED_RANKS: [
    { rankName: "Recruit", xpNeeded: 0 },
    { rankName: "Private", xpNeeded: 300 },
    { rankName: "Corporal", xpNeeded: 600 },
    { rankName: "Sergeant", xpNeeded: 1200 },
    { rankName: "Elite", xpNeeded: 2400 },
    { rankName: "Ghost", xpNeeded: 4800 }
]

CLASS_RANK_BONUSES: {
    SHOTGUNNER: {
        Recruit: { maxHpBonus: 5, damageBonus: 1, rofBonus: 0 },
        Private: { maxHpBonus: 10, damageBonus: 2, rofBonus: 0 },
        // ... etc
    },
    TANKER: {
        Recruit: { maxHpBonus: 30, damageBonus: 0, armorBonus: 5 },
        Private: { maxHpBonus: 40, damageBonus: 0, armorBonus: 10 },
        // ... etc
    }
}
```

### Implementation in Raccoon Class

Modify `Raccoon` constructor to accept class type:

```javascript
class Raccoon extends Unit {
    constructor(x, y, game, id, faceImageUrl, name,
        existingXP = 0, existingRank = null, existingKills = 0,
        unitClass = 'RIFLEMAN')  // NEW: class parameter
    {
        // Initialize base stats from class definition
        const classDef = CONFIG.CLASS_DEFINITIONS[unitClass];
        
        super(x, y, game, 'player', 
            classDef.baseHp, 
            classDef.baseSpeed, 
            classDef.baseSize, 
            CONFIG.RACCOON_COLOR, 
            id);

        this.unitClass = unitClass;
        this.classDefinition = classDef;
        
        // Class determines sprite family
        this.spriteBaseName = classDef.spriteBaseName;
        this.spriteScaleFactor = CONFIG[`RACCOON_${unitClass}_SPRITE_SCALE_FACTOR`] || 0.5;
        
        // ... rest of initialization
    }
}
```

### Weapon Progression Per Class

Each class has its own weapon progression:

```javascript
CLASS_WEAPON_PROGRESSION: {
    RIFLEMAN: {
        Recruit: 'RACCOON_MACHINE_GUN',
        Private: 'RACCOON_PRIVATE_MG',
        Corporal: 'RACCOON_CORPORAL_MG',
        Sergeant: 'RACCOON_SERGEANT_MG',
        Elite: 'RACCOON_ELITE_MG',
        Ghost: 'RACCOON_GHOST_MG'
    },
    SHOTGUNNER: {
        Recruit: 'SHOTGUN_RECRUIT',
        Private: 'SHOTGUN_PRIVATE',
        Corporal: 'SHOTGUN_CORPORAL',
        Sergeant: 'SHOTGUN_SERGEANT',
        Elite: 'SHOTGUN_ELITE',
        Ghost: 'SHOTGUN_GHOST'
    },
    TANKER: {
        Recruit: 'TANKER_MG_RECRUIT',
        Private: 'TANKER_MG_PRIVATE',
        // ... Heavy weapons, lower ROF, high damage
    },
    REDBERET: {
        Recruit: 'REDBERET_AR_RECRUIT',
        Private: 'REDBERET_AR_PRIVATE',
        // ... Assault rifles - balanced performance
    }
}
```

### Class-Specific Weapon Definitions (New in config.js)

```javascript
// SHOTGUN variants
SHOTGUN_RECRUIT: {
    name: "S-1",
    damage: 15,        // High damage per shot
    rof: 1.5,          // Slow pump action
    range: 80,         // Short range
    projectileSpeed: 500,
    projectileColor: '#ff6600',
    accuracyStationary: 0.65,
    accuracyMoving: 0.40,
    sfxFireKey: 'SHOTGUN_FIRE',
    muzzleFlashScale: 1.3,
    bulletLifetime: 0.3,
    isDefaultWeapon: true,
    magazineSize: 2,
    maxAmmo: 24,
    pelletCount: 6     // Multiple pellets per shot
}

// HEAVY MG (for Tanker)
TANKER_MG_RECRUIT: {
    name: "HMG-1",
    damage: 12,
    rof: 4,
    range: 300,
    projectileSpeed: 450,
    projectileColor: '#ff0000',
    accuracyStationary: 0.75,
    accuracyMoving: 0.35,
    sfxFireKey: 'HEAVY_MG_FIRE',
    muzzleFlashScale: 1.8,
    bulletLifetime: 0.8,
    isDefaultWeapon: true,
    magazineSize: 50,
    maxAmmo: 200,
    armorPenetration: 0.3
}

// ASSAULT RIFLE (for RedBeret)
REDBERET_AR_RECRUIT: {
    name: "AR-1",
    damage: 8,
    rof: 9,
    range: 450,
    projectileSpeed: 650,
    projectileColor: '#00ff00',
    accuracyStationary: 0.88,
    accuracyMoving: 0.70,
    sfxFireKey: 'AR_FIRE',
    muzzleFlashScale: 0.9,
    bulletLifetime: 0.6,
    isDefaultWeapon: true,
    magazineSize: 35,
    maxAmmo: 280
}
```

---

## Sprite Asset Requirements

Each class needs sprite sets per rank, plus separate idle animation variants for visual variety:

```
assets/images/units/raccoon/
├── rifleman/
│   ├── recruit/
│   │   ├── idle/          # Multiple sprite variants for variety
│   │   │   ├── raccoon_rifleman_recruit_idle_e_1.png
│   │   │   ├── raccoon_rifleman_recruit_idle_e_2.png  (alternate)
│   │   │   └── raccoon_rifleman_recruit_idle_e_3.png  (alternate)
│   │   └── ...
│   ├── private/
│   └── ...
├── shotgunner/
│   ├── recruit/
│   └── ...
├── tanker/
│   ├── recruit/
│   └── ...
└── redberet/
    ├── recruit/
    └── ...
```

### Class Configuration with Sprite/Face Variants

```javascript
CLASS_DEFINITIONS: {
    RIFLEMAN: {
        name: "Rifleman",
        baseHp: 20,
        baseSpeed: 200,
        baseSize: 12,
        baseAccuracy: 0.0,
        preferredRange: [100, 300],
        defaultWeaponType: 'MG',
        spriteBaseName: 'raccoon_rifleman',
        
        // Type folders - each contains full directional sprite set
        spriteTypes: ['type1', 'type2', 'type3'],
        
        // Face image - same face used through all ranks except Ghost
        faceImage: 'rifleman_face1.png',
        ghostFaceImage: 'rifleman_ghost_face.png',
        
        canUseGrenades: true,
        promotionTree: 'STANDARD'
    },
    SHOTGUNNER: {
        name: "Shotgunner",
        baseHp: 25,
        baseSpeed: 160,
        baseSize: 14,
        baseAccuracy: -0.05,
        preferredRange: [30, 100],
        defaultWeaponType: 'SHOTGUN',
        spriteBaseName: 'raccoon_shotgunner',
        
        spriteTypes: ['type1', 'type2'],
        
        faceImage: 'shotgunner_face1.png',
        ghostFaceImage: 'shotgunner_ghost_face.png',
        
        canUseGrenades: true,
        promotionTree: 'SHOTGUNNER_STANDARD'
    },
    TANKER: {
        name: "Tanker",
        baseHp: 50,
        baseSpeed: 100,
        baseSize: 18,
        baseAccuracy: -0.1,
        preferredRange: [50, 150],
        defaultWeaponType: 'HEAVY_MG',
        spriteBaseName: 'raccoon_tanker',
        
        spriteTypes: ['type1', 'type2'],
        
        faceImage: 'tanker_face1.png',
        ghostFaceImage: 'tanker_ghost_face.png',
        
        canUseGrenades: false,
        promotionTree: 'TANKER_STANDARD'
    },
    REDBERET: {
        name: "RedBeret",
        baseHp: 15,
        baseSpeed: 250,
        baseSize: 10,
        baseAccuracy: 0.05,
        preferredRange: [150, 400],
        defaultWeaponType: 'ASSAULT_RIFLE',
        spriteBaseName: 'raccoon_redberet',
        
        spriteTypes: ['type1', 'type2', 'type3', 'type4'],
        
        faceImage: 'redberet_face1.png',
        ghostFaceImage: 'redberet_ghost_face.png',
        
        canUseGrenades: true,
        promotionTree: 'REDBERET_STANDARD'
    },
    MARINE: {
        
    }
}
```

### Rank-Specific Sprite/Face Overrides

Ranks define their sprite path and scale. Face stays constant through promotions (Recruit → Ghost) except at Ghost rank:

```javascript
CLASS_RANK_VISUALS: {
    RIFLEMAN: {
        Recruit: {
            spritePath: 'assets/images/units/raccoon/rifleman/recruit/',
            spriteScaleFactor: 0.45
        },
        Private: {
            spritePath: 'assets/images/units/raccoon/rifleman/private/',
            spriteScaleFactor: 0.50
        },
        Corporal: {
            spritePath: 'assets/images/units/raccoon/rifleman/corporal/',
            spriteScaleFactor: 0.55
        },
        Sergeant: {
            spritePath: 'assets/images/units/raccoon/rifleman/sergeant/',
            spriteScaleFactor: 0.58
        },
        Elite: {
            spritePath: 'assets/images/units/raccoon/rifleman/elite/',
            spriteScaleFactor: 0.62
        },
        Ghost: {
            spritePath: 'assets/images/units/raccoon/rifleman/ghost/',
            spriteScaleFactor: 0.68,
            // Ghost face is defined in CLASS_DEFINITIONS.ghostFaceImage
            // Face changes to this at Ghost rank
        }
    },
    SHOTGUNNER: {
        Recruit: {
            spritePath: 'assets/images/units/raccoon/shotgunner/recruit/',
            spriteScaleFactor: 0.50
        },
        Private: {
            spritePath: 'assets/images/units/raccoon/shotgunner/private/',
            spriteScaleFactor: 0.55
        },
        Corporal: {
            spritePath: 'assets/images/units/raccoon/shotgunner/corporal/',
            spriteScaleFactor: 0.58
        },
        Sergeant: {
            spritePath: 'assets/images/units/raccoon/shotgunner/sergeant/',
            spriteScaleFactor: 0.60
        },
        Elite: {
            spritePath: 'assets/images/units/raccoon/shotgunner/elite/',
            spriteScaleFactor: 0.63
        },
        Ghost: {
            spritePath: 'assets/images/units/raccoon/shotgunner/ghost/',
            spriteScaleFactor: 0.68
        }
    }
}
```

### Sprite Directory Structure

Each type folder contains the full set of directional sprites. Unit randomly selects one type at creation.

```
assets/images/units/raccoon/
├── rifleman/
│   ├── recruit/
│   │   ├── type1/           # All 8 directions for variant 1
│   │   │   ├── rifleman_recruit_idle_n.png
│   │   │   ├── rifleman_recruit_idle_ne.png
│   │   │   ├── rifleman_recruit_idle_e.png
│   │   │   ├── rifleman_recruit_idle_se.png
│   │   │   ├── rifleman_recruit_idle_s.png
│   │   │   ├── rifleman_recruit_idle_sw.png
│   │   │   ├── rifleman_recruit_idle_w.png
│   │   │   └── rifleman_recruit_idle_nw.png
│   │   ├── type2/           # All 8 directions for variant 2
│   │   └── type3/
│   ├── private/
│   │   ├── type1/
│   │   └── type2/
│   ├── corporal/
│   ├── sergeant/
│   ├── elite/
│   └── ghost/
│       ├── type1/
│       └── type2/
├── shotgunner/
│   ├── recruit/
│   │   ├── type1/
│   │   └── type2/
│   ├── private/
│   └── ghost/
├── tanker/
│   ├── recruit/
│   │   ├── type1/
│   │   └── type2/
│   └── ghost/
└── redberet/
    ├── recruit/
    │   ├── type1/
    │   ├── type2/
    │   ├── type3/
    │   └── type4/
    └── ghost/
```

### Face Image Directory Structure

Faces are class-specific, not rank-specific (until Ghost):

```
assets/images/raccoons/faces/
├── rifleman/
│   ├── rifleman_face1.png       # Used for Recruit through Elite
│   ├── rifleman_ghost_face.png  # Special Ghost face
│   └── rifleman_face2.png       # Alternate option
├── shotgunner/
│   ├── shotgunner_face1.png
│   ├── shotgunner_face2.png
│   └── shotgunner_ghost_face.png
├── tanker/
│   ├── tanker_face1.png
│   ├── tanker_face2.png
│   └── tanker_ghost_face.png
└── redberet/
    ├── redberet_face1.png
    ├── redberet_face2.png
    └── redberet_ghost_face.png
```

### Unit Creation Randomization

When creating a new unit, randomly select a sprite type. Face stays constant until Ghost rank.

```javascript
createNewRaccoon(game, unitClass = 'RIFLEMAN', rank = 'Recruit') {
    const classDef = CONFIG.CLASS_DEFINITIONS[unitClass];
    const rankVisuals = CONFIG.CLASS_RANK_VISUALS[unitClass]?.[rank] || {};
    
    // Select random sprite type (subfolder containing all directions)
    const spriteTypes = classDef.spriteTypes || ['type1'];
    const selectedType = spriteTypes[Math.floor(Math.random() * spriteTypes.length)];
    
    // Store selected type on unit for consistent sprite rendering
    const selectedSpritePath = `${rankVisuals.spritePath}${selectedType}/`;
    
    // Select face - use ghost face if Ghost rank, otherwise use class face
    const isGhostRank = rank === 'Ghost';
    const faceFile = isGhostRank ? classDef.ghostFaceImage : classDef.faceImage;
    const faceImageUrl = `assets/images/raccoons/faces/${unitClass.toLowerCase()}/${faceFile}`;
    
    return new Raccoon(x, y, game, null, faceImageUrl, name, 0, rank, 0, unitClass, selectedType);
}
```

### Sprite Loading Changes (game.js)

Update `preloadUnitAssets()` to handle type subfolders:

```javascript
async preloadUnitAssets() {
    const unitTypesToPreload = [];
    
    // Build list from CLASS_RANK_VISUALS and CLASS_DEFINITIONS
    for (const [className, ranks] of Object.entries(CONFIG.CLASS_RANK_VISUALS)) {
        const classDef = CONFIG.CLASS_DEFINITIONS[className];
        const spriteTypes = classDef?.spriteTypes || ['type1'];
        
        for (const [rankName, visuals] of Object.entries(ranks)) {
            // Preload each type variant for this rank
            for (const type of spriteTypes) {
                unitTypesToPreload.push({
                    name: `${className.toLowerCase()}_${rankName.toLowerCase()}_${type}`,
                    basePath: `${visuals.spritePath}${type}/`,
                    actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] }
                });
            }
        }
    }
    
    // Preload face images per class
    for (const [className, classDef] of Object.entries(CONFIG.CLASS_DEFINITIONS)) {
        // Standard face
        const facePath = `assets/images/raccoons/faces/${className.toLowerCase()}/${classDef.faceImage}`;
        // Ghost face
        const ghostFacePath = `assets/images/raccoons/faces/${className.toLowerCase()}/${classDef.ghostFaceImage}`;
        // ... preload promises
    }
}
```

---

## Class Selection UI

When recruiting new units or promoting, offer class selection:

```
┌─────────────────────────────┐
│   NEW RECRUIT OPTIONS       │
├─────────────────────────────┤
│ [1] Rifleman - Balanced     │
│ [2] Shotgunner - High DMG   │
│ [3] Tanker - High HP        │
│ [4] RedBeret - Fast/Accurate│
└─────────────────────────────┘
```

---

## Key Implementation Changes

### 1. config.js additions:
- `CLASS_DEFINITIONS` object
- `CLASS_WEAPON_PROGRESSION` object  
- `CLASS_RANK_BONUSES` object
- Weapon definitions for each class

### 2. raccoon.js changes:
- Add `unitClass` property
- Modify `setRankBasedSprite()` to use class
- Modify `applyRankBonuses()` to use class-specific bonuses
- Modify weapon assignment to use class progression

### 3. game.js changes:
- Add new sprite preloads for each class/rank combination
- Update roster creation UI for class selection

### 4. ui.js changes:
- Display class icon/badge in squad panel
- Add class selection UI for new recruits

---

## Migration Path for Existing Units

- Existing units convert to `RIFLEMAN` class with their current rank
- Preserve XP, rank, kills, equipment
- Future saves include class data

---

## Summary

| Aspect | Current | Proposed |
|--------|---------|----------|
| Class system | None (rank = class) | Separate class + rank |
| Weapon progression | Single tree (MG only) | Per-class trees |
| Stats | Uniform base + rank bonuses | Class-defined base + rank bonuses |
| Sprites | 6 rank variants | Class × Rank × Type (subfolder) |
| Faces | 30 shared generic faces | Class face (same until Ghost) |
| Promotion | Single linear track | Class-specific tracks |

This design allows new special classes while maintaining backward compatibility with existing units.