# Shootout Shuffle Mode Implementation Plan

## Overview
Add a shuffle/random mode to Shootout that randomly selects maps and optionally chooses daytime/nighttime variants. The feature includes UI elements to toggle shuffle mode and a "Start Next Round" button on the game over screen.

## Architecture

### Data Flow
```
Pre-Game Screen                    Game                        Game Over Screen
      |                              |                               |
      | Toggle Shuffle ON           |                               |
      |----------------------------->|                               |
      |                              |                               |
      | Start Round (shuffle ON)     |                               |
      |----------------------------->| Round Complete               |
      |                              |------------------------------>|
      |                              |                               | User clicks
      |                              |                               | "Start Next Round"
      |                              |<------------------------------|
      |                              | Selects random map           |
      |                              | Starts new round             |
      |                              |------------------------------>|
```

## Implementation Details

### 1. ShootoutController (js/shootout/ShootoutController.js)

**New Properties:**
- `isShuffleMode: boolean` - Whether shuffle mode is enabled
- `lastSelectedMapKey: string` - Stores the last selected map to avoid immediate repeats

**New Methods:**
- `toggleShuffleMode()` - Toggle shuffle mode on/off
- `selectRandomMap()` - Randomly select a map and optionally night mode
  - Get all background keys from `CONFIG.SHOOTOUT_MODE.BACKGROUNDS`
  - Filter out the current map to avoid immediate repeats
  - Randomly pick from remaining maps
  - 50/50 chance for night mode
  - Call `setBackground()` and `setNightMode()`

### 2. Pre-Game Screen UI (index.html)

**New Element:**
```html
<div class="shootout-shuffle-toggle">
    <label class="toggle-switch">
        <input type="checkbox" id="shuffleModeToggle">
        <span class="slider"></span>
    </label>
    <span>Shuffle Maps (Random)</span>
</div>
```

**Placement:** After the map selection container, before high scores

### 3. Game Over Screen UI (index.html)

**New Element:**
```html
<button id="startNextRoundButton" class="game-over-button action-secondary">START NEXT ROUND</button>
```

**Placement:** Next to "Deploy Again" button in the button container

### 4. UI Wiring (js/ui.js)

**New References:**
- `this.shuffleModeToggle` - Checkbox for shuffle toggle
- `this.startNextRoundButton` - Button for starting next round

**New Event Handlers:**
1. Shuffle toggle click handler:
   - Call `this.game.shootoutController.toggleShuffleMode()`
   - Update visual state of toggle

2. Start Next Round button click handler:
   - If shuffle mode is enabled:
     - Call `this.game.shootoutController.selectRandomMap()`
   - Call `this.game.startShootoutRound()`
   - Hide game over screen, show HUD

**Play Again (Existing):**
- `playShootoutAgainButton` should continue to use current map (no change needed)

### 5. Styling (style.css)

**Toggle Switch Style:**
```css
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: 0.4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #ffd700;
}

input:checked + .slider:before {
    transform: translateX(26px);
}
```

## Map Selection Logic

```javascript
selectRandomMap() {
    const backgrounds = CONFIG.SHOOTOUT_MODE.BACKGROUNDS;
    const availableMaps = Object.keys(backgrounds).filter(
        key => key !== this.currentBackgroundKey
    );
    
    // If only one map available, use it
    if (availableMaps.length === 0) {
        availableMaps = Object.keys(backgrounds);
    }
    
    // Random selection
    const randomIndex = Math.floor(Math.random() * availableMaps.length);
    const selectedMap = availableMaps[randomIndex];
    
    // Random night mode (50/50)
    const useNightMode = Math.random() > 0.5;
    
    this.setBackground(selectedMap);
    this.setNightMode(useNightMode);
    
    console.log(`[Shootout] Random map selected: ${selectedMap} (Night: ${useNightMode})`);
}
```

## Edge Cases

1. **Single Map:** If only one map is configured, shuffle will just toggle night mode
2. **No Night Image:** If night image fails to load, falls back to daytime (existing behavior)
3. **Dev Mode:** When shuffle is on and dev mode is enabled, starting a round should still randomize the map
4. **State Persistence:** Shuffle mode state should persist while in the shootout session (between rounds)

## Files to Modify

1. **js/shootout/ShootoutController.js**
   - Add shuffle mode properties and methods

2. **index.html**
   - Add shuffle toggle to pre-game screen
   - Add "Start Next Round" button to game over screen

3. **style.css**
   - Add toggle switch styling

4. **js/ui.js**
   - Wire up toggle and button event handlers
