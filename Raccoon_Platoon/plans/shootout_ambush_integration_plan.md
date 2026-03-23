# Shootout Ambush Integration Plan

## Overview
Integrate the existing Shootout Mode into the main campaign as dynamic ambush scenarios that occur at specific points in the mission lifecycle:
1. When "getting out of the heli" at the start of a new phase
2. When evacuating at the end of a mission

## Current System Analysis

### Existing Shootout Mode Files
- `js/shootout/ShootoutController.js` - Main controller for shootout gameplay
- `js/shootout/ShootoutSpawner.js` - Manages target spawning
- `js/shootout/ShootoutTarget.js` - Enemy unit with peek behavior
- Configuration in `js/config.js` under CONFIG.SHOOTOUT_MODE

### Integration Points in Game.js
- Line 107: Shootout controller instance variable
- Lines 3078-3186: Shootout mode methods (startShootoutMode, startShootoutRound, etc.)
- Preload logic for shootout assets in preloadMiscAssets()

## Key Requirements

### 1. Configuration
- Add ambush probability settings to config.js
- Add scenario-specific alert messages
- Configure night map support

### 2. Alert System
- Create visual alert screen with scenario-specific messages
- Show "Ambush!" or appropriate flavor text
- Display victory/defeat messages instead of shootout's end game screen

### 3. Shootout Controller Modifications
- Add method to start shootout without pre-game screen
- Add callback mechanism for when shootout ends (victory/defeat)
- Modify endRound() to not show game over screen
- Add support for scenario-specific configurations

### 4. Trigger Logic
- Mission start trigger: When getting out of the heli
- Evacuation trigger: When calling for extraction
- Random chance calculation using RNG
- Night mission detection

### 5. Night Map Support
- Ensure shootout uses night background when triggered during night missions
- Verify CONFIG.SHOOTOUT_MODE has night versions of all backgrounds

### 6. Procedural Generation
- Use pre-configured spawn point data from config.js
- Keep existing enemy type configurations
- Determine game mode (time attack or elimination)
- Set difficulty based on campaign phase

### 7. UI Modifications
- Create alert message elements
- Modify UI to handle shootout alerts and victory/defeat
- Ensure HUD is appropriate for shootout mode

## Implementation Steps

### Phase 1: Configuration
1. Add ambush probability settings to config.js
2. Add scenario-specific alert messages
3. Verify night map configurations

### Phase 2: Alert System
1. Create alert screen elements in index.html
2. Add showAlert() and hideAlert() methods to UI class
3. Implement scenario-specific message display

### Phase 3: Shootout Controller Enhancements
1. Add startAmbush() method
2. Modify endRound() to accept callback
3. Add scenario configuration support

### Phase 4: Trigger Logic
1. Add mission start trigger in game.js
2. Add evacuation trigger in game.js  
3. Implement random chance calculation
4. Add night mission detection

### Phase 5: Night Map Support
1. Verify night background images exist
2. Modify setNightMode() method if needed
3. Test night map rendering

### Phase 6: Spawn Point Configuration
1. Use existing spawn point data from config.js
2. No procedural randomization of spawn positions
3. No procedural randomization of enemy types
4. Utilize pre-configured spawn point data for all ambushes

### Phase 7: UI Integration
1. Add alert message elements to index.html
2. Modify UI to display shootout alerts
3. Add victory/defeat message display

### Phase 8: Testing
1. Test mission start ambush trigger
2. Test evacuation ambush trigger
3. Test night map support
4. Test difficulty scaling
5. Verify integration with campaign progression

## Technical Considerations

### Game States
- Add new game states for ambush scenarios: 'SHOOTOUT_AMBUSH'
- Ensure smooth transitions between states

### Audio
- Play appropriate music during ambushes (use MUSIC_SHOOTOUT)
- Add sound effects for alert messages

### Performance
- Optimize shootout rendering for integration
- Ensure no memory leaks when transitioning back to campaign mode

### RNG Consistency
- Use current mission seed for shootout scenario generation
- Ensure replayability by using deterministic randomness

## Risk Mitigation

### 1. Night Map Missing
- Fallback to daytime version if night background not available
- Log warning message

### 2. Shootout Controller Initialization
- Ensure controller is properly initialized before starting ambush
- Handle errors gracefully

### 3. State Transition Bugs
- Test all possible state transitions
- Add error handling for invalid states

### 4. Performance Issues
- Monitor FPS during shootouts
- Optimize rendering if needed

## Success Criteria

- Ambushes trigger randomly at mission start and evacuation
- Night missions use appropriate night maps
- Alert messages display correctly
- Victory/defeat conditions are properly handled
- Integration is seamless and doesn't break existing functionality

## Files to Modify

1. `js/config.js` - Add configuration settings
2. `js/shootout/ShootoutController.js` - Enhance shootout controller
3. `js/game.js` - Add trigger logic and integration methods
4. `js/ui.js` - Add alert message UI
5. `index.html` - Add alert screen elements
6. `style.css` - Style alert screen
