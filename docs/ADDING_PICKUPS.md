# Adding New Pickups to Raccoon Platoon

This guide explains how to add a new pickup type (like ammo crates) to the game.

## Overview

Pickups follow a consistent pattern:
1. Define the pickup in `config.js`
2. Handle sprite loading in `game.js`
3. Handle obstacle spawning in `levelGenerator.js`
4. Handle pickup application in `raccoon.js`

## Step 1: Add UI Icon (Optional)

In `js/config.js`, add an icon to `UI_ASSETS` for the visual effect when collected:

```javascript
UI_ASSETS: {
    GRENADE_ICON: 'assets/images/ui/icons/grenade_icon.png',
    HEALTH_ICON: 'assets/images/ui/icons/health_icon.png',
    AMMO_ICON: 'assets/images/ui/icons/ammo_icon.png'  // Add your icon
},
```

## Step 2: Add Sprite Paths

In `js/config.js`, add sprite paths for your pickup using the sprite pair format (normal and destroyed/empty sprites):

```javascript
AMMO_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/ammo/',
AMMO_PICKUP_SPRITE_FILES: [
    { normal: 'ammo_pickup_crate.png', destroyed: 'ammo_pickup_crate_empty.png' }
],
```

The FILES array uses objects with `normal` and `destroyed` keys to support the destroyed/empty sprite state.

## Step 3: Add Pickup Definition

In `js/config.js`, add an entry to `PICKUP_DEFINITIONS` (not `OBSTACLE_DEFINITIONS`):

```javascript
PICKUP_DEFINITIONS: [
    {
        type: 'pickup_ammo_crate',      // Unique identifier
        name: 'Ammo Crate',             // Display name
        color: '#4169E1',               // Debug color
        destructible: true, hp: 1, maxHp: 1,
        blocksMovement: false, providesCover: false,
        spawnWeight: 0.5,               // Spawn probability weight
        pickupType: 'ammo',              // Pickup type identifier
        pickupQuantity: 30,              // Amount to give
        spriteScale: 0.2,                // Sprite scale
        collisionShape: { type: 'rectangle', offsetX: (w => w * 0.0625), offsetY: (h => h * 0.0625), width: (w => w * 0.9), height: (h => h * 0.84) },
        isPickup: true,
        canBeFlipped: true,
    },
    // ... other pickups
],
```

Note: Do NOT add pickups to `OBSTACLE_DEFINITIONS`. They have their own separate array.

Key properties:
- `pickupType`: The identifier used in code to determine what effect to apply
- `pickupQuantity`: The amount to give when collected
- `isPickup: true`: Marks this as a pickup object
- `destructible: true, hp: 1`: Can be destroyed with one hit

## Step 4: Handle Sprite Loading in game.js

Pickup sprites use the sprite pair format and are loaded via dedicated sprite pair loading in `game.js` (around line 738):

```javascript
const pickupSpritePairs = [
    { files: CONFIG.HEALTH_PICKUP_SPRITE_FILES, path: CONFIG.HEALTH_PICKUP_SPRITE_PATH },
    { files: CONFIG.AMMO_PICKUP_SPRITE_FILES, path: CONFIG.AMMO_PICKUP_SPRITE_PATH },
    { files: CONFIG.GRENADE_PICKUP_SPRITE_FILES, path: CONFIG.GRENADE_PICKUP_SPRITE_PATH }
];
```

This loading handles both normal and destroyed sprites for all pickup types. The dedicated loading in `game.js` handles the sprite pair loading for huts and similar objects.

## Step 5: Handle Obstacle Spawning in levelGenerator.js

### Add sprite file handling (~line 833):

```javascript
else if (template.type === 'pickup_ammo_crate') { 
    filesArray = CONFIG.AMMO_PICKUP_SPRITE_FILES || []; 
    pathBase = CONFIG.AMMO_PICKUP_SPRITE_PATH || ''; 
    useRandomSpriteFromList = true; 
}
```

### Optional: Add dedicated spawn method

If you want pickups spawned near specific targets (like grenade/ammo crates near relay towers), add a spawn method:

```javascript
_spawnAmmoCrateNearTarget(targetX, targetY, targetWidth, targetHeight) {
    const ammoCrateDef = (CONFIG.OBSTACLE_DEFINITIONS || []).find(def => def.type === 'pickup_ammo_crate');
    if (!ammoCrateDef) return;
    
    // Calculate spawn position relative to target
    const crateOffsetX = targetWidth / 2 + 40;
    const crateOffsetY = 0;
    const crateX = targetX + crateOffsetX;
    const crateY = targetY + crateOffsetY;
    
    // Check bounds
    const playableMinX = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
    const playableMaxX = (CONFIG.WORLD_WIDTH || 800) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
    const playableMinY = CONFIG.LEVEL_GENERATION.BORDER_WIDTH + CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
    const playableMaxY = (CONFIG.WORLD_HEIGHT || 600) - CONFIG.LEVEL_GENERATION.BORDER_WIDTH - CONFIG.LEVEL_GENERATION.WORLD_MARGIN;
    
    const finalCrateX = Math.max(playableMinX, Math.min(crateX, playableMaxX - 30));
    const finalCrateY = Math.max(playableMinY, Math.min(crateY, playableMaxY - 30));
    
    // ... validation and spawning logic
}
```

Then call it where appropriate (e.g., near relay towers in `_spawnMissionTargetsForObjective`).

## Step 6: Handle Pickup Application in raccoon.js

In `js/raccoon.js`, modify the `applyPickup` method to handle your pickup type:

```javascript
applyPickup(pickupObstacle) {
    const pickupText = `+${pickupObstacle.pickupQuantity}`;
    let pickupColor = 'white';
    let pickupIcon = null;

    if (pickupObstacle.pickupType === 'grenade') {
        this.grenadeAmmo += pickupObstacle.pickupQuantity;
        pickupColor = '#F0E68C'; // Khaki
        pickupIcon = this.game.preloadedImages[CONFIG.UI_ASSETS.GRENADE_ICON];
    } else if (pickupObstacle.pickupType === 'ammo') {
        this.ammo += pickupObstacle.pickupQuantity;
        if (this.ammo > this.maxAmmo) {
            this.ammo = this.maxAmmo;  // Cap at max ammo
        }
        pickupColor = '#87CEEB'; // SkyBlue
        pickupIcon = this.game.preloadedImages[CONFIG.UI_ASSETS.AMMO_ICON];
    } else if (pickupObstacle.pickupType === 'health') {
        // Existing health pickup logic
    }

    // Visual effect and UI update
    if (this.game.addVisualEffect) {
        this.game.addVisualEffect('pickup', {
            x: this.x,
            y: this.y - this.size,
            text: pickupText,
            color: pickupColor,
            icon: pickupIcon
        });
    }
    
    if (this.game.ui) {
        this.game.ui.updateSquadPanel();
    }
}
```

## Pickup Spawning Configuration

Pickups have their own separate spawning system from regular obstacles. The count scales with mission phase.

In `js/config.js`, configure pickup spawning under `LEVEL_GENERATION.PICKUPS`:

```javascript
PICKUPS: {
    BASE_COUNT: 5,           // Base number of pickups per mission
    PHASE_INCREMENT: 2,      // Additional pickups per phase
    RANDOM_ADDITION_MAX: 3,  // Maximum random extra pickups
    PLACEMENT_MAX_ATTEMPTS: 15
},
```

Formula: `numPickups = BASE_COUNT + (phaseIndex * PHASE_INCREMENT) + random(0, RANDOM_ADDITION_MAX)`

Pickups are spawned in a dedicated loop in `levelGenerator.js` after the obstacle spawning loop. The `_getRandomPickupTemplate()` method handles weighted random selection from pickup definitions.

## Files Summary

| File | Changes Needed |
|------|-----------------|
| `js/config.js` | `UI_ASSETS`, sprite paths, `PICKUP_DEFINITIONS` entry |
| `js/game.js` | Sprite preloading (pickup sprite pair loading handles this automatically) |
| `js/levelGenerator.js` | Sprite handling in pickup loop (automatically handled for new pickup types) |
| `js/raccoon.js` | `applyPickup` method handling |

## Adding New Sprite Files

Place your sprite files in the configured folders:
- Pickup sprites: `assets/images/objects/pickups/[type]/` (e.g., `grenade/`, `ammo/`, `health/`)
- UI icons: `assets/images/ui/icons/`

Configure sprite paths in `js/config.js` using the sprite pair format:

```javascript
AMMO_PICKUP_SPRITE_PATH: 'assets/images/objects/pickups/ammo/',
AMMO_PICKUP_SPRITE_FILES: [
    { normal: 'ammo_pickup_crate.png', destroyed: 'ammo_pickup_crate_empty.png' }
],
```

Each pickup type should have its own folder under `pickups/` containing normal and destroyed sprite files.
