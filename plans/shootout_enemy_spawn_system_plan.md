# Shootout Enemy Spawn System Overhaul Plan

## Overview
Redesign the spawn configuration system to support per-enemy-type settings including:
- Individual scale/offset per enemy type
- Spawn probability weights
- Visual preview of each enemy sprite in dev mode

## New Data Structure

### Spawn Position Object
```javascript
{
  x: 100,                    // Spawn X position
  y: 200,                    // Spawn Y position
  peekDirection: 'right',    // Direction to peek (left/right/up)
  enemyConfigs: {            // Per-enemy-type configuration
    grunt: {
      enabled: true,         // Can this enemy spawn here?
      weight: 70,            // Spawn probability weight (0-100)
      peekOffset: 40,        // How far to peek out
      scale: 1.0             // Sprite scale
    },
    heavy: {
      enabled: true,
      weight: 30,
      peekOffset: 50,        // Heavy might need different offset
      scale: 1.2             // Heavy might need larger scale
    }
  }
}
```

### Migration from Old Format
Old format used `allowedEnemyTypes: ['grunt', 'heavy']` with shared `peekOffset` and `scale`.

Migration logic:
```javascript
function migrateSpawnPosition(pos) {
  if (pos.enemyConfigs) return pos; // Already migrated
  
  const oldTypes = pos.allowedEnemyTypes || ['grunt'];
  const enemyConfigs = {};
  
  // Define all available enemy types with defaults
  const allTypes = ['grunt', 'heavy'];
  
  allTypes.forEach(type => {
    enemyConfigs[type] = {
      enabled: oldTypes.includes(type),
      weight: oldTypes.includes(type) ? Math.floor(100 / oldTypes.length) : 0,
      peekOffset: pos.peekOffset || 40,
      scale: pos.scale || 1.0
    };
  });
  
  return {
    x: pos.x,
    y: pos.y,
    peekDirection: pos.peekDirection || 'right',
    enemyConfigs
  };
}
```

## Implementation Plan

### 1. Configuration (js/config.js)
- Define default enemy configs for each type
- Add enemy display names and colors for UI

### 2. ShootoutTarget.js
- Update constructor to accept enemy-specific offset/scale from position
- Store reference to which enemyConfig was used

### 3. ShootoutSpawner.js
- Update spawn logic to use weighted random selection
- Formula: Calculate total weight of enabled enemies, pick random number 0-total, select based on cumulative weights

### 4. Dev Mode UI Panel (index.html + style.css)
New panel layout:
```
Spawn Point #0

[Direction Buttons: ← ↑ →]

┌─ Grunt [✓] Weight: [====70====] ─┐
│  Offset: [====40====]  Scale: [==1.0==] │
└─ [Preview Sprite] ─┘

┌─ Heavy [✓] Weight: [====30====] ─┐
│  Offset: [====50====]  Scale: [==1.2==] │
└─ [Preview Sprite] ─┘

Position: (100, 200)
[🗑️ Delete Spawn]
```

### 5. ShootoutController.js - Dev Mode Rendering
- Draw preview sprites at peek position for each enabled enemy type
- Show weight percentages next to spawn point in debug overlay
- Draw connecting lines from tree to each enemy's peek position

### 6. ui.js - Panel Logic
- Generate enemy type sections dynamically
- Handle weight slider changes (ensure total doesn't exceed 100, or normalize)
- Update preview sprites when settings change
- Export/import with new format

### 7. Weight Calculation
Simple weighted random:
```javascript
function selectEnemyType(enemyConfigs) {
  const enabled = Object.entries(enemyConfigs)
    .filter(([type, config]) => config.enabled)
    .map(([type, config]) => ({ type, weight: config.weight }));
  
  if (enabled.length === 0) return 'grunt'; // Fallback
  
  const totalWeight = enabled.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const enemy of enabled) {
    random -= enemy.weight;
    if (random <= 0) return enemy.type;
  }
  
  return enabled[enabled.length - 1].type;
}
```

## UI Design Details

### Enemy Type Section (per type)
- **Enable checkbox**: Toggle if this enemy can spawn
- **Weight slider**: 0-100, determines spawn probability
- **Offset slider**: 10-200, how far enemy peeks from tree
- **Scale slider**: 0.5-2.0, sprite size multiplier
- **Preview canvas**: Shows the enemy sprite at current settings

### Weight Display
- Show percentage (e.g., "70%") next to slider
- Normalize weights if they don't sum to 100
- Visual indicator of relative probability

### Visual Preview in Dev Mode
- Draw each enemy's sprite at their calculated peek position
- Use different colors/tinting to distinguish types
- Show ghosted/transparent when disabled

## Files to Modify
1. js/config.js - Add enemy type defaults
2. js/shootout/ShootoutTarget.js - Use per-enemy settings
3. js/shootout/ShootoutSpawner.js - Weighted spawn logic
4. js/shootout/ShootoutController.js - Dev mode rendering, import/export
5. js/ui.js - Panel UI logic
6. index.html - New panel structure
7. style.css - Panel styling

## Backwards Compatibility
- Migration function runs when loading old configs
- Old `allowedEnemyTypes` converted to new `enemyConfigs`
- Shared `peekOffset` and `scale` applied to all enabled enemies initially
