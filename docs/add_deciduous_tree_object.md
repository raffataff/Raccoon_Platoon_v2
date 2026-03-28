# Adding Deciduous Tree (tree1_single.png) to Game Objects

## Overview

This document outlines the changes needed to add a new deciduous tree sprite (`tree1_single.png`) as a spawnable game object, providing visual variety alongside existing palm trees.

## Sprite Location

- **Path**: `assets/images/objects/biomes/tropical/trees/tree1_single.png`
- **Location**: Same directory as palm tree sprites

## Implementation Plan

### 1. js/config.js

Add new sprite configuration and obstacle definition:

**Sprite Configuration (around line 670):**
```javascript
DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH: 'assets/images/objects/biomes/tropical/trees/',
DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES: ['tree1_single.png'],
```

**Obstacle Definition (after tree_palm_fallen, around line 795):**
```javascript
{
    type: 'tree_deciduous_single', name: 'Deciduous Tree Single', color: '#228B22',
    destructible: true, hp: 50, maxHp: 50,
    blocksMovement: true, providesCover: true,
    spawnWeight: 5, isDecoration: false,
    spriteScale: 1.3,
    collisionShape: { type: 'circle', offsetX: (w => w * 0.5), offsetY: (h => h * 0.98), radius: (w => w * 0.08) },
    // No spriteDestroyed - will use same stump or create new one
    canBeFlipped: true,
},
```

Note: Use palm tree stump for destroyed sprite or add a new one.

### 2. js/game.js

Three modifications required:

**a) Sprite loading check (around line 677):**
Add condition:
```javascript
(def.type === 'tree_deciduous_single' && CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES) ||
```

**b) listBasedSprites array (around line 713):**
Add entry:
```javascript
{ files: CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES, path: CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH, name: "deciduous_single" },
```

**c) Depth sorting logic (around line 2681):**
Add to the palm tree sorting condition:
```javascript
obstacle.type === 'tree_palm_single' || obstacle.type === 'tree_palm_double' || obstacle.type === 'tree_palm_triple' || obstacle.type === 'tree_deciduous_single'
```

### 3. js/levelGenerator.js

Add sprite selection handler (around line 730, after tree_palm_fallen):
```javascript
else if (template.type === 'tree_deciduous_single') { filesArray = CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES || []; pathBase = CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH || ''; useRandomSpriteFromList = true; }
```

## Testing

After implementation, verify:
1. New tree appears in level generation
2. Tree renders correctly with proper depth sorting
3. Tree can be destroyed (optional - if destructible)
4. Tree provides cover and blocks movement

## Reference: Existing Palm Tree Implementation

- Palm tree single: `tree_palm_single` type, spawnWeight: 5, spriteScale: 1.3
- Palm tree double: `tree_palm_double` type, spawnWeight: 5, spriteScale: 1.2
- Palm tree triple: `tree_palm_triple` type, spawnWeight: 5, spriteScale: 1.2
- All use collisionShape type: circle/ellipse at base of tree

The new deciduous tree follows the same pattern as palm trees to ensure consistent behavior in the game.