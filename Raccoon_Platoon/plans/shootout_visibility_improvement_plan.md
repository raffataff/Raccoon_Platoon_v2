# Shootout Mode Visibility Improvement Plan

## Problem Statement
Currently, enemies in Shootout mode have a slight delay when becoming visible/invisible when peeking. The visibility is state-based (`PEEKING` or `SHOOTING`) rather than position-based, which creates a disconnect between when they visually appear and when they should be shootable.

## Desired Behavior
1. **Position-based visibility**: Enemies should only be visible when they are physically outside the spawn box/tree
2. **Immediate hiding**: When enemies "un-peek" (move back into spawn box), they should become invisible once they start moving back
3. **Dynamic/gradual effect**: Ideally, visibility should fade gradually to look like they're moving behind something

## Current Implementation Analysis

### ShootoutTarget.js
- `isVisible()`: Returns `true` only when `currentState` is `PEEKING` or `SHOOTING`
- `updatePosition()`: Uses lerp interpolation between `treePosition` (hidden) and `peekPosition` (visible)
- `render()`: Has a hard cutoff - renders if `distToTree < 2` for HIDDEN state

### Key Data Points
- `peekOffset`: Distance from tree to peek position (40-55 pixels depending on spawn point)
- `treePosition`: Hidden position behind tree/rock
- `peekPosition`: Fully exposed position
- Lerp speed: `10 * deltaTime` for smooth movement

## Proposed Solution

### 1. Position-Based Visibility Calculation
Replace state-based visibility with position-based calculation:

```javascript
// Calculate how far the enemy has moved from the tree (0.0 = hidden, 1.0 = fully peeking)
getPeekProgress() {
    const dx = this.x - this.treePosition.x;
    const dy = this.y - this.treePosition.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    return Math.min(currentDist / this.peekOffset, 1.0);
}
```

### 2. Visibility Threshold
Add a configurable threshold for when enemies become visible:

```javascript
// In config.js
SHOOTOUT_MODE: {
    // ... existing settings ...
    VISIBILITY_THRESHOLD: 0.25,  // 25% of peek distance before becoming visible
    FADE_ZONE_SIZE: 0.15,        // 15% transition zone for smooth fade
}
```

### 3. Gradual Opacity in render()
Modify the `render()` method to apply dynamic opacity:

```javascript
render(ctx, cameraX, cameraY) {
    if (this.currentState === 'DEAD') return;
    
    const peekProgress = this.getPeekProgress();
    
    // Don't render if completely hidden
    if (peekProgress <= 0) return;
    
    // Calculate opacity based on peek progress
    const visibilityThreshold = CONFIG.SHOOTOUT_MODE.VISIBILITY_THRESHOLD;
    const fadeZone = CONFIG.SHOOTOUT_MODE.FADE_ZONE_SIZE;
    
    let opacity = 1.0;
    if (peekProgress < visibilityThreshold + fadeZone) {
        // In fade zone - calculate gradual opacity
        opacity = Math.max(0, (peekProgress - visibilityThreshold) / fadeZone);
    }
    
    if (opacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // ... rest of rendering ...
    
    ctx.restore();
}
```

### 4. Updated isVisible() for Hit Detection
Update `isVisible()` to use position threshold for hit detection:

```javascript
isVisible() {
    const peekProgress = this.getPeekProgress();
    return peekProgress >= CONFIG.SHOOTOUT_MODE.VISIBILITY_THRESHOLD;
}
```

## Visual Behavior

### Peeking Out (Hidden -> Peeking)
1. Enemy starts at tree position (opacity = 0, not visible)
2. As they move out:
   - 0-25% distance: Still invisible (behind tree)
   - 25-40% distance: Fading in (emerging from behind tree)
   - 40%+ distance: Fully visible (opacity = 1.0)

### Un-peeking (Peeking -> Hidden)
1. Enemy starts moving back toward tree
2. As they move in:
   - 40%+ distance: Fully visible
   - 25-40% distance: Fading out (going behind tree)
   - Below 25%: Invisible (behind tree)

## Implementation Steps

1. **Add configuration options** to `CONFIG.SHOOTOUT_MODE`:
   - `VISIBILITY_THRESHOLD`: 0.25 (25% of peek distance)
   - `FADE_ZONE_SIZE`: 0.15 (15% fade transition)

2. **Modify `ShootoutTarget` class**:
   - Add `getPeekProgress()` method
   - Update `isVisible()` to use position-based check
   - Override `render()` to apply dynamic opacity

3. **Update visibility logic in `ShootoutSpawner`**:
   - `getVisibleTargets()` will automatically use the updated `isVisible()`
   - `checkHit()` already filters by visible targets

## Benefits

1. **Accurate visibility**: Enemies are only visible when they're actually outside the spawn area
2. **Immediate hiding**: No delay when enemies start moving back
3. **Smooth transitions**: Gradual fade creates realistic "moving behind cover" effect
4. **Configurable**: Thresholds can be tuned without code changes
5. **Consistent**: Visibility for rendering and hit detection use the same logic

## Optional Enhancements (Future)

1. **Directional fade**: Fade based on which direction they're peeking from
2. **Per-spawn-point thresholds**: Different trees/rocks could have different visibility thresholds
3. **Sprite-based clipping**: Use actual tree sprite as a mask for more realistic hiding
