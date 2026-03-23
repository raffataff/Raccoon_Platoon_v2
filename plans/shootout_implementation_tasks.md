# Shootout Mode - Implementation Task Breakdown

This document provides a granular task list for implementing the Shootout mode. Each task is designed to be completed independently where possible.

---

## Phase 1: Core Framework & UI Setup

### Task 1.1: Add Configuration Constants
**File:** `js/config.js`
**Lines:** Add at end of CONFIG object

```javascript
SHOOTOUT_MODE: {
    ROUND_DURATION_SECONDS: 60,
    INITIAL_PLAYER_HEALTH: 100,
    INITIAL_SPAWN_INTERVAL: 2.0,
    MIN_SPAWN_INTERVAL: 0.5,
    MAX_CONCURRENT_TARGETS: 5,
    DIFFICULTY_INCREASE_RATE: 0.95,
    DIFFICULTY_INCREASE_INTERVAL: 10,
    PEEK_DURATION_BASE: 2.0,
    PEEK_DURATION_RANDOM: 1.5,
    REACTION_TIME_BASE: 1.0,
    REACTION_TIME_RANDOM: 0.5,
    SCORE_PER_HIT: 100,
    SCORE_PER_KILL: 500,
    ACCURACY_BONUS_THRESHOLD: 0.8,
    TIME_BONUS_MULTIPLIER: 10,
    CROSSHAIR_SIZE: 32,
    BACKGROUND_IMAGE: 'assets/images/shootouts/Jungle_Shootout_1.png',
    TREE_SPAWN_POSITIONS: [
        // x, y = hidden position behind tree
        // peekOffset = how far they move when peeking
        // peekDirection = 'left' | 'right' | 'up'
        // Possums always face south (toward player) in this mode
        {x: 200, y: 400, peekOffset: 40, peekDirection: 'right', scale: 0.8},
        {x: 450, y: 350, peekOffset: 40, peekDirection: 'left', scale: 0.9},
        {x: 700, y: 420, peekOffset: 40, peekDirection: 'right', scale: 0.7},
        {x: 950, y: 380, peekOffset: 40, peekDirection: 'left', scale: 1.0},
        {x: 1200, y: 410, peekOffset: 40, peekDirection: 'right', scale: 0.85},
        {x: 1450, y: 360, peekOffset: 40, peekDirection: 'left', scale: 0.9},
        {x: 1700, y: 400, peekOffset: 40, peekDirection: 'right', scale: 0.8},
        {x: 300, y: 500, peekOffset: 40, peekDirection: 'left', scale: 0.75},
        {x: 550, y: 480, peekOffset: 40, peekDirection: 'up', scale: 0.85},
        {x: 800, y: 520, peekOffset: 40, peekDirection: 'up', scale: 0.7},
        {x: 1050, y: 490, peekOffset: 40, peekDirection: 'left', scale: 0.9},
        {x: 1300, y: 510, peekOffset: 40, peekDirection: 'up', scale: 0.8},
        {x: 1550, y: 470, peekOffset: 40, peekDirection: 'right', scale: 0.85},
    ]
}
```

**Acceptance Criteria:**
- [ ] Config object added without syntax errors
- [ ] Game loads without console errors

---

### Task 1.2: Add Main Menu Button
**File:** `index.html`
**Lines:** Around line 21-28

Add new button after `newCampaignButton`:
```html
<button id="shootoutModeButton">Shootout Mode</button>
```

**Acceptance Criteria:**
- [ ] Button appears in main menu
- [ ] Button styled consistently with other menu buttons

---

### Task 1.3: Create Shootout Mode Screen HTML
**File:** `index.html`
**Location:** After `recruitMemorialScreen` div (around line 152)

Add three new screen divs:
1. `shootoutPreGameScreen` - Instructions and start button
2. `shootoutGameOverScreen` - Final score display
3. `shootoutHudOverlay` - In-game HUD elements

```html
<!-- Shootout Mode Screens -->
<div id="shootoutPreGameScreen" class="ui-panel" style="display: none;">
    <h2>JUNGLE SHOOTOUT</h2>
    <div class="shootout-instructions">
        <p>Possums are hiding in the trees!</p>
        <p>Shoot them before they shoot you!</p>
        <p>Aim with mouse, click to fire</p>
    </div>
    <div class="shootout-high-score">
        <span>High Score: </span><span id="shootoutHighScoreDisplay">0</span>
    </div>
    <div class="main-menu-buttons">
        <button id="startShootoutButton">Start</button>
        <button id="backFromShootoutButton">Back to Menu</button>
    </div>
</div>

<div id="shootoutGameOverScreen" class="ui-panel" style="display: none;">
    <h2 id="shootoutGameOverTitle">TIME'S UP!</h2>
    <div class="shootout-stats">
        <div class="stat-row">
            <span>Final Score:</span>
            <span id="shootoutFinalScore">0</span>
        </div>
        <div class="stat-row">
            <span>Accuracy:</span>
            <span id="shootoutFinalAccuracy">0%</span>
        </div>
        <div class="stat-row">
            <span>Grade:</span>
            <span id="shootoutGrade">F</span>
        </div>
        <div class="stat-row" id="newHighScoreRow" style="display: none;">
            <span class="new-high-score">NEW HIGH SCORE!</span>
        </div>
    </div>
    <div class="main-menu-buttons">
        <button id="playShootoutAgainButton">Play Again</button>
        <button id="shootoutToMainMenuButton">Main Menu</button>
    </div>
</div>

<!-- Shootout HUD Overlay (shown during gameplay) -->
<div id="shootoutHud" style="display: none;">
    <div id="shootoutHealthBar">
        <div id="shootoutHealthFill"></div>
    </div>
    <div id="shootoutScore">Score: <span>0</span></div>
    <div id="shootoutTimer">Time: <span>60</span></div>
    <div id="shootoutAccuracy">Accuracy: <span>0%</span></div>
</div>
```

**Acceptance Criteria:**
- [ ] Screens hidden by default
- [ ] Proper CSS classes applied
- [ ] All necessary elements have IDs

---

### Task 1.4: Add CSS Styling for Shootout UI
**File:** `style.css`
**Location:** Add new section at end

```css
/* Shootout Mode Styles */
#shootoutPreGameScreen {
    text-align: center;
}

#shootoutPreGameScreen h2 {
    font-family: 'Black Ops One', cursive;
    font-size: 3em;
    color: #4CAF50;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    margin-bottom: 30px;
}

.shootout-instructions {
    background: rgba(0, 0, 0, 0.6);
    padding: 20px;
    border-radius: 10px;
    margin: 20px auto;
    max-width: 400px;
}

.shootout-instructions p {
    margin: 10px 0;
    font-size: 1.2em;
}

.shootout-high-score {
    font-size: 1.5em;
    color: #FFD700;
    margin: 20px 0;
}

#shootoutHud {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
}

#shootoutHealthBar {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 200px;
    height: 30px;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid #fff;
    border-radius: 15px;
    overflow: hidden;
}

#shootoutHealthFill {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #ff4444, #ff8844);
    transition: width 0.3s ease;
}

#shootoutScore {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Black Ops One', cursive;
    font-size: 2em;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

#shootoutTimer {
    position: absolute;
    top: 20px;
    right: 20px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.8em;
    font-weight: bold;
    color: #fff;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

#shootoutTimer.warning {
    color: #ff4444;
    animation: pulse 1s infinite;
}

#shootoutAccuracy {
    position: absolute;
    bottom: 20px;
    left: 20px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.2em;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.shootout-stats {
    background: rgba(0, 0, 0, 0.7);
    padding: 30px;
    border-radius: 10px;
    margin: 20px auto;
    max-width: 350px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
    font-size: 1.3em;
}

#shootoutGrade {
    font-family: 'Black Ops One', cursive;
    font-size: 1.5em;
}

.new-high-score {
    color: #FFD700;
    font-weight: bold;
    animation: glow 1.5s ease-in-out infinite;
}

@keyframes glow {
    0%, 100% { text-shadow: 0 0 5px #FFD700; }
    50% { text-shadow: 0 0 20px #FFD700, 0 0 30px #FFD700; }
}
```

**Acceptance Criteria:**
- [ ] HUD elements positioned correctly
- [ ] Health bar has gradient fill
- [ ] Timer pulses when low
- [ ] All screens styled consistently with game theme

---

## Phase 2: Game State Management

### Task 2.1: Add Shootout Game States
**File:** `js/game.js`
**Location:** Constructor and state management methods

Add new game states to the gameState handling:

```javascript
// In constructor or existing gameState initialization:
// Existing states: 'MAIN_MENU', 'RUNNING', 'PAUSED', etc.
// New states for shootout mode:
// 'SHOOTOUT_PRE_GAME', 'SHOOTOUT_PLAYING', 'SHOOTOUT_PAUSED', 'SHOOTOUT_GAME_OVER'

// Add new properties in constructor:
this.shootoutController = null;
this.shootoutSpawner = null;
this.shootoutBackgroundImage = null;
this.shootoutHighScore = parseInt(localStorage.getItem('shootoutHighScore')) || 0;
```

**Acceptance Criteria:**
- [ ] New state constants understood by game
- [ ] Properties initialized

---

### Task 2.2: Implement State Transition Methods
**File:** `js/game.js`
**Location:** Add new methods

```javascript
enterShootoutMode() {
    this.previousGameState = this.gameState;
    this.gameState = 'SHOOTOUT_PRE_GAME';
    this.ui.showShootoutPreGameScreen(this.shootoutHighScore);
    this.preloadShootoutAssets();
}

startShootoutGame() {
    this.gameState = 'SHOOTOUT_PLAYING';
    this.ui.hideShootoutPreGameScreen();
    this.ui.showShootoutHud();
    
    // Initialize shootout systems
    this.shootoutController = new ShootoutController(this);
    this.shootoutSpawner = new ShootoutSpawner(this);
    
    // Reset cursor
    this.ui.setCursor('crosshair');
}

endShootoutMode(finalScore, accuracy) {
    this.gameState = 'SHOOTOUT_GAME_OVER';
    
    // Update high score if beaten
    const isNewHighScore = finalScore > this.shootoutHighScore;
    if (isNewHighScore) {
        this.shootoutHighScore = finalScore;
        localStorage.setItem('shootoutHighScore', finalScore);
    }
    
    this.ui.showShootoutGameOverScreen(finalScore, accuracy, isNewHighScore);
    this.ui.setCursor('default');
    
    // Cleanup
    this.shootoutController = null;
    this.shootoutSpawner = null;
}

quitShootoutToMainMenu() {
    this.gameState = 'MAIN_MENU';
    this.ui.hideShootoutScreens();
    this.ui.showMainMenuScreen();
    this.ui.setCursor('default');
    
    // Cleanup
    this.shootoutController = null;
    this.shootoutSpawner = null;
}

async preloadShootoutAssets() {
    const bgPath = CONFIG.SHOOTOUT_MODE.BACKGROUND_IMAGE;
    if (!this.preloadedImages[bgPath]) {
        await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.preloadedImages[bgPath] = img;
                this.shootoutBackgroundImage = img;
                resolve();
            };
            img.onerror = () => {
                console.warn('[Shootout] Failed to load background');
                resolve();
            };
            img.src = bgPath;
        });
    } else {
        this.shootoutBackgroundImage = this.preloadedImages[bgPath];
    }
}
```

**Acceptance Criteria:**
- [ ] Can enter shootout mode from main menu
- [ ] Can start game from pre-game screen
- [ ] Can end game and show results
- [ ] Can return to main menu
- [ ] High score persists

---

## Phase 3: Core Classes

### Task 3.1: Create ShootoutTarget Class
**File:** `js/shootout/shootoutTarget.js` (new file)

```javascript
class ShootoutTarget extends Unit {
    constructor(x, y, game, id, treeConfig) {
        super(x, y, game, 'enemy', 
              CONFIG.POSSUM_GRUNT_HP * 0.5, // Weaker for quick kills
              0, // No movement speed
              CONFIG.POSSUM_GRUNT_SIZE,
              CONFIG.POSSUM_GRUNT_COLOR, 
              id);
        
        this.treeConfig = treeConfig;
        this.hiddenX = treeConfig.x;      // Position behind tree (hidden)
        this.hiddenY = treeConfig.y;
        
        // Calculate peek position based on direction
        const offset = treeConfig.peekOffset || 40;
        switch(treeConfig.peekDirection) {
            case 'left':
                this.peekX = treeConfig.x - offset;
                this.peekY = treeConfig.y;
                break;
            case 'right':
                this.peekX = treeConfig.x + offset;
                this.peekY = treeConfig.y;
                break;
            case 'up':
                this.peekX = treeConfig.x;
                this.peekY = treeConfig.y - offset;
                break;
            default:
                this.peekX = treeConfig.x + offset;
                this.peekY = treeConfig.y;
        }
        
        // Start hidden
        this.x = this.hiddenX;
        this.y = this.hiddenY;
        
        this.currentState = 'HIDDEN'; // HIDDEN, PEEKING, SHOOTING, HIT, DEAD
        this.stateTimer = 0;
        
        this.peekDuration = CONFIG.SHOOTOUT_MODE.PEEK_DURATION_BASE + 
                           Math.random() * CONFIG.SHOOTOUT_MODE.PEEK_DURATION_RANDOM;
        this.reactionTime = CONFIG.SHOOTOUT_MODE.REACTION_TIME_BASE + 
                           Math.random() * CONFIG.SHOOTOUT_MODE.REACTION_TIME_RANDOM;
        
        this.weapon = WEAPONS.POSSUM_RIFLE;
        this.hasShot = false;
        
        // Visual - always facing south toward the player
        this.currentVisualState = 'idle';
        this.peekProgress = 0; // 0 = hidden, 1 = fully visible
        this.spriteBaseName = 'possum_grunt';
        this.spriteScaleFactor = treeConfig.scale * CONFIG.POSSUM_GRUNT_SPRITE_SCALE_FACTOR;
        
        // Always use south-facing sprite (facing camera)
        this.currentVisualDirection = 's';
        this.facingAngle = Math.PI / 2;
    }
    
    update(deltaTime) {
        if (!this.isAlive()) return;
        
        this.stateTimer += deltaTime;
        
        switch (this.currentState) {
            case 'HIDDEN':
                // Do nothing, wait for spawner to trigger peek
                break;
                
            case 'PEEKING':
                // Animate to peek position
                this.peekProgress = Math.min(1, this.stateTimer / 0.3); // 0.3s peek animation
                this.x = this.hiddenX + (this.peekX - this.hiddenX) * this.peekProgress;
                
                // Check if should shoot
                if (this.stateTimer >= this.reactionTime && !this.hasShot) {
                    this.currentState = 'SHOOTING';
                    this.stateTimer = 0;
                }
                
                // Check if should hide
                if (this.stateTimer >= this.peekDuration) {
                    this.startHiding();
                }
                break;
                
            case 'SHOOTING':
                // Fire at player
                if (!this.hasShot) {
                    this.shootAtPlayer();
                    this.hasShot = true;
                }
                
                // Hide after short delay
                if (this.stateTimer >= 0.5) {
                    this.startHiding();
                }
                break;
                
            case 'HIDING':
                // Animate back to hidden position
                this.peekProgress = Math.max(0, 1 - (this.stateTimer / 0.3));
                this.x = this.hiddenX + (this.peekX - this.hiddenX) * this.peekProgress;
                
                if (this.peekProgress <= 0) {
                    this.currentState = 'HIDDEN';
                    this.x = this.hiddenX;
                }
                break;
        }
        
        super.update(deltaTime);
    }
    
    startPeeking() {
        if (this.currentState === 'HIDDEN') {
            this.currentState = 'PEEKING';
            this.stateTimer = 0;
            this.hasShot = false;
        }
    }
    
    startHiding() {
        this.currentState = 'HIDING';
        this.stateTimer = 0;
    }
    
    shootAtPlayer() {
        // Fire at center of screen (player position)
        const targetX = this.game.canvas.width / 2;
        const targetY = this.game.canvas.height + 100; // Below screen (helicopter)
        
        const projectile = this.game.getProjectileFromPool(
            this.x, this.y,
            targetX, targetY,
            this.weapon.damage,
            this.weapon.projectileSpeed,
            this.weapon.projectileColor,
            this,
            this.weapon.accuracyStationary
        );
        
        this.game.gameObjects.push(projectile);
        
        // Play sound
        if (this.game.audioManager) {
            this.game.audioManager.play(this.weapon.sfxFireKey);
        }
    }
    
    takeDamage(amount, attacker) {
        const wasAlive = this.isAlive();
        super.takeDamage(amount, attacker);
        
        if (wasAlive && !this.isAlive()) {
            // Was killed
            this.currentState = 'DEAD';
            this.game.shootoutController.onTargetKilled(this);
        } else if (this.isAlive()) {
            // Just hit but not dead
            this.currentState = 'HIT';
            setTimeout(() => {
                if (this.isAlive()) {
                    this.startHiding();
                }
            }, 200);
        }
    }
    
    render(ctx, cameraX, cameraY) {
        // Don't render if fully hidden and not dead
        if (this.currentState === 'HIDDEN' && this.peekProgress <= 0) {
            return;
        }
        
        super.render(ctx, cameraX, cameraY);
    }
}
```

**Acceptance Criteria:**
- [ ] Class extends Unit properly
- [ ] State machine works correctly
- [ ] Peeking animation interpolates position
- [ ] Can be damaged and killed
- [ ] Fires at player when shooting

---

### Task 3.2: Create ShootoutSpawner Class
**File:** `js/shootout/shootoutSpawner.js` (new file)

```javascript
class ShootoutSpawner {
    constructor(game) {
        this.game = game;
        this.activeTargets = [];
        this.spawnTimer = 0;
        this.currentSpawnInterval = CONFIG.SHOOTOUT_MODE.INITIAL_SPAWN_INTERVAL;
        this.difficultyTimer = 0;
        this.gameTime = 0;
        this.availableTreePositions = [...CONFIG.SHOOTOUT_MODE.TREE_POSITIONS];
        this.occupiedPositions = new Set();
    }
    
    update(deltaTime) {
        this.gameTime += deltaTime;
        this.spawnTimer += deltaTime;
        this.difficultyTimer += deltaTime;
        
        // Increase difficulty periodically
        if (this.difficultyTimer >= CONFIG.SHOOTOUT_MODE.DIFFICULTY_INCREASE_INTERVAL) {
            this.increaseDifficulty();
            this.difficultyTimer = 0;
        }
        
        // Spawn new targets
        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.trySpawnTarget();
            this.spawnTimer = 0;
        }
        
        // Update existing targets
        this.activeTargets = this.activeTargets.filter(target => {
            target.update(deltaTime);
            
            // Remove dead targets after delay
            if (!target.isAlive() && target.deathTime) {
                if (this.gameTime - target.deathTime > 2.0) {
                    this.releasePosition(target.treeConfig);
                    return false;
                }
            }
            
            return true;
        });
    }
    
    trySpawnTarget() {
        const maxTargets = this.getMaxConcurrentTargets();
        
        if (this.activeTargets.length >= maxTargets) {
            return;
        }
        
        // Find available tree position
        const availablePositions = this.availableTreePositions.filter(
            pos => !this.occupiedPositions.has(pos)
        );
        
        if (availablePositions.length === 0) {
            return;
        }
        
        // Pick random position
        const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        this.occupiedPositions.add(position);
        
        // Create target
        const target = new ShootoutTarget(
            position.x,
            position.y,
            this.game,
            `shootout_target_${Date.now()}`,
            position
        );
        
        // Start peeking after short delay
        setTimeout(() => {
            if (target.isAlive()) {
                target.startPeeking();
            }
        }, 500 + Math.random() * 1000);
        
        this.activeTargets.push(target);
        this.game.gameObjects.push(target);
        this.game.enemyUnits.push(target);
    }
    
    increaseDifficulty() {
        this.currentSpawnInterval = Math.max(
            CONFIG.SHOOTOUT_MODE.MIN_SPAWN_INTERVAL,
            this.currentSpawnInterval * CONFIG.SHOOTOUT_MODE.DIFFICULTY_INCREASE_RATE
        );
    }
    
    getMaxConcurrentTargets() {
        // Gradually increase max targets
        const progress = this.gameTime / CONFIG.SHOOTOUT_MODE.ROUND_DURATION_SECONDS;
        const max = CONFIG.SHOOTOUT_MODE.MAX_CONCURRENT_TARGETS;
        return Math.max(2, Math.ceil(max * Math.min(1, progress + 0.3)));
    }
    
    releasePosition(treeConfig) {
        this.occupiedPositions.delete(treeConfig);
    }
    
    getAllTargets() {
        return this.activeTargets;
    }
    
    reset() {
        // Clean up all targets
        this.activeTargets.forEach(target => {
            target.hp = 0; // Kill them
        });
        this.activeTargets = [];
        this.occupiedPositions.clear();
        this.spawnTimer = 0;
        this.difficultyTimer = 0;
        this.gameTime = 0;
        this.currentSpawnInterval = CONFIG.SHOOTOUT_MODE.INITIAL_SPAWN_INTERVAL;
    }
}
```

**Acceptance Criteria:**
- [ ] Spawns targets at tree positions
- [ ] Respects max concurrent targets limit
- [ ] Difficulty increases over time
- [ ] Doesn't spawn at occupied positions
- [ ] Properly cleans up dead targets

---

### Task 3.3: Create ShootoutController Class
**File:** `js/shootout/shootoutController.js` (new file)

```javascript
class ShootoutController {
    constructor(game) {
        this.game = game;
        
        // Player state
        this.playerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.maxPlayerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.isPlayerAlive = true;
        
        // Score tracking
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;
        
        // Timing
        this.timeRemaining = CONFIG.SHOOTOUT_MODE.ROUND_DURATION_SECONDS;
        
        // Aiming
        this.cursorPosition = { x: 0, y: 0 };
        
        // Shooting
        this.fireCooldown = 0;
        this.FIRE_RATE = 0.15; // Seconds between shots
        
        // Weapon
        this.weapon = WEAPONS.RACCOON_MACHINE_GUN;
    }
    
    update(deltaTime) {
        if (!this.isPlayerAlive) return;
        
        // Update timer
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.endGame();
            return;
        }
        
        // Update fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }
        
        // Update UI
        this.updateUI();
    }
    
    handleMouseMove(screenX, screenY) {
        this.cursorPosition.x = screenX;
        this.cursorPosition.y = screenY;
    }
    
    handleFire() {
        if (!this.isPlayerAlive || this.fireCooldown > 0) return;
        
        this.fireCooldown = this.FIRE_RATE;
        this.shotsFired++;
        
        // Play fire sound
        if (this.game.audioManager) {
            this.game.audioManager.play(this.weapon.sfxFireKey);
        }
        
        // Muzzle flash effect at crosshair position
        this.addMuzzleFlashEffect(this.cursorPosition.x, this.cursorPosition.y);
        
        // Instant hit detection at cursor position (point-and-click arcade style)
        // No projectile creation/rendering - bullets hit instantly at crosshair
        this.checkHitAtPosition(this.cursorPosition.x, this.cursorPosition.y);
    }
    
    addMuzzleFlashEffect(x, y) {
        // Create brief muzzle flash at cursor position
        // This gives feedback that a shot was fired
        // Implementation: expanding circle that fades quickly
    }
    
    checkHitAtPosition(cursorX, cursorY) {
        // Point-and-click hit detection on possum sprites
        const targets = this.game.shootoutSpawner.getAllTargets();
        
        let hitSomething = false;
        
        for (const target of targets) {
            if (!target.isAlive()) continue;
            if (target.currentState === 'HIDDEN') continue;
            
            // Check if cursor is over the possum sprite
            // Use sprite size for hit detection (the possum IS the hitbox)
            const hitRadius = target.size * target.spriteScaleFactor;
            const dist = Math.sqrt(
                (cursorX - target.x) ** 2 + 
                (cursorY - target.y) ** 2
            );
            
            if (dist <= hitRadius) {
                // Hit! (Instant - no projectile travel)
                target.takeDamage(this.weapon.damage, { team: 'player' });
                this.shotsHit++;
                hitSomething = true;
                
                // Add hit effect
                this.addHitEffect(target.x, target.y);
                
                // Play hit sound
                if (this.game.audioManager) {
                    this.game.audioManager.play('POSSUM_HIT');
                }
                
                // Score for hit
                this.addScore(CONFIG.SHOOTOUT_MODE.SCORE_PER_HIT);
                
                break; // Only hit one target per click
            }
        }
    }
    
    addHitEffect(x, y) {
        // Create visual hit effect
        if (this.game.visualEffects) {
            // Reuse existing effect system or create simple particle
        }
    }
    
    onTargetKilled(target) {
        this.targetsKilled++;
        this.addScore(CONFIG.SHOOTOUT_MODE.SCORE_PER_KILL);
        
        // Check for quick kill bonus
        if (target.stateTimer < 0.5) {
            this.addScore(200); // Quick kill bonus
        }
    }
    
    takeDamage(amount) {
        if (!this.isPlayerAlive) return;
        
        this.playerHealth -= amount;
        
        // Screen shake effect
        this.triggerScreenShake();
        
        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.isPlayerAlive = false;
            this.endGame();
        }
    }
    
    triggerScreenShake() {
        // Add screen shake to game camera
        // Implementation depends on existing camera system
    }
    
    addScore(points) {
        this.score += points;
    }
    
    getAccuracy() {
        if (this.shotsFired === 0) return 0;
        return Math.round((this.shotsHit / this.shotsFired) * 100);
    }
    
    updateUI() {
        // Update HUD elements
        this.game.ui.updateShootoutHud({
            score: this.score,
            timeRemaining: Math.ceil(this.timeRemaining),
            health: this.playerHealth,
            maxHealth: this.maxPlayerHealth,
            accuracy: this.getAccuracy(),
            shotsFired: this.shotsFired,
            shotsHit: this.shotsHit
        });
    }
    
    endGame() {
        const finalScore = this.score + 
            Math.floor(this.timeRemaining * CONFIG.SHOOTOUT_MODE.TIME_BONUS_MULTIPLIER);
        
        const accuracy = this.getAccuracy();
        
        // Apply accuracy bonus
        if (accuracy >= CONFIG.SHOOTOUT_MODE.ACCURACY_BONUS_THRESHOLD * 100) {
            finalScore += 1000;
        }
        
        this.game.endShootoutMode(finalScore, accuracy);
    }
    
    reset() {
        this.playerHealth = this.maxPlayerHealth;
        this.isPlayerAlive = true;
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;
        this.timeRemaining = CONFIG.SHOOTOUT_MODE.ROUND_DURATION_SECONDS;
        this.fireCooldown = 0;
    }
}
```

**Acceptance Criteria:**
- [ ] Tracks player health, score, time
- [ ] Handles mouse input for aiming
- [ ] Fires projectiles on click
- [ ] Detects hits on visible targets
- [ ] Updates UI each frame
- [ ] Ends game when time expires or health depleted

---

## Phase 4: UI Integration

### Task 4.1: Add UI Methods for Shootout
**File:** `js/ui.js`
**Location:** Add new methods to UI class

```javascript
// Pre-game screen
showShootoutPreGameScreen(highScore) {
    this.hideAllScreens();
    const screen = document.getElementById('shootoutPreGameScreen');
    const highScoreDisplay = document.getElementById('shootoutHighScoreDisplay');
    
    if (highScoreDisplay) {
        highScoreDisplay.textContent = highScore.toLocaleString();
    }
    
    if (screen) {
        screen.style.display = 'flex';
    }
}

// HUD
showShootoutHud() {
    const hud = document.getElementById('shootoutHud');
    if (hud) {
        hud.style.display = 'block';
    }
}

hideShootoutHud() {
    const hud = document.getElementById('shootoutHud');
    if (hud) {
        hud.style.display = 'none';
    }
}

updateShootoutHud(data) {
    // Update score
    const scoreEl = document.querySelector('#shootoutScore span');
    if (scoreEl) scoreEl.textContent = data.score.toLocaleString();
    
    // Update timer
    const timerEl = document.querySelector('#shootoutTimer span');
    if (timerEl) {
        timerEl.textContent = data.timeRemaining;
        const timerContainer = document.getElementById('shootoutTimer');
        if (data.timeRemaining <= 10) {
            timerContainer.classList.add('warning');
        } else {
            timerContainer.classList.remove('warning');
        }
    }
    
    // Update health bar
    const healthFill = document.getElementById('shootoutHealthFill');
    if (healthFill) {
        const healthPercent = (data.health / data.maxHealth) * 100;
        healthFill.style.width = healthPercent + '%';
    }
    
    // Update accuracy
    const accuracyEl = document.querySelector('#shootoutAccuracy span');
    if (accuracyEl) {
        accuracyEl.textContent = data.accuracy + '%';
    }
}

// Game over screen
showShootoutGameOverScreen(finalScore, accuracy, isNewHighScore) {
    this.hideAllScreens();
    this.hideShootoutHud();
    
    const screen = document.getElementById('shootoutGameOverScreen');
    const titleEl = document.getElementById('shootoutGameOverTitle');
    const scoreEl = document.getElementById('shootoutFinalScore');
    const accuracyEl = document.getElementById('shootoutFinalAccuracy');
    const gradeEl = document.getElementById('shootoutGrade');
    const newHighRow = document.getElementById('newHighScoreRow');
    
    // Calculate grade
    const grade = this.calculateGrade(finalScore);
    
    if (titleEl) {
        titleEl.textContent = this.game && this.game.shootoutController && 
                             this.game.shootoutController.isPlayerAlive ? 
                             "TIME'S UP!" : "KIA";
    }
    if (scoreEl) scoreEl.textContent = finalScore.toLocaleString();
    if (accuracyEl) accuracyEl.textContent = accuracy + '%';
    if (gradeEl) {
        gradeEl.textContent = grade;
        gradeEl.style.color = this.getGradeColor(grade);
    }
    if (newHighRow) {
        newHighRow.style.display = isNewHighScore ? 'flex' : 'none';
    }
    
    if (screen) {
        screen.style.display = 'flex';
    }
}

calculateGrade(score) {
    if (score >= 10000) return 'S';
    if (score >= 8000) return 'A';
    if (score >= 6000) return 'B';
    if (score >= 4000) return 'C';
    if (score >= 2000) return 'D';
    return 'F';
}

getGradeColor(grade) {
    const colors = {
        'S': '#FFD700', // Gold
        'A': '#00FF00', // Green
        'B': '#87CEEB', // Light Blue
        'C': '#FFA500', // Orange
        'D': '#FF6347', // Tomato
        'F': '#FF0000'  // Red
    };
    return colors[grade] || '#FFFFFF';
}

// Hide all shootout screens
hideShootoutScreens() {
    const preGame = document.getElementById('shootoutPreGameScreen');
    const gameOver = document.getElementById('shootoutGameOverScreen');
    
    if (preGame) preGame.style.display = 'none';
    if (gameOver) gameOver.style.display = 'none';
    
    this.hideShootoutHud();
}

// Helper to hide all main screens
hideAllScreens() {
    this.hideMainMenuScreen();
    this.hidePreMissionScreen();
    this.hidePostMissionScreen();
    this.hideGameOverScreen();
    this.hideHowToPlayScreen();
    this.hideRecruitMemorialScreen();
    this.hidePauseMenuScreen();
}
```

**Acceptance Criteria:**
- [ ] Pre-game screen shows correctly
- [ ] HUD updates in real-time
- [ ] Game over shows final stats and grade
- [ ] High score indicator works

---

### Task 4.2: Wire Up UI Event Listeners
**File:** `js/ui.js`
**Location:** Constructor or init method

```javascript
// In UI constructor, add event listeners:

const shootoutButton = document.getElementById('shootoutModeButton');
const startShootoutButton = document.getElementById('startShootoutButton');
const backFromShootoutButton = document.getElementById('backFromShootoutButton');
const playAgainButton = document.getElementById('playShootoutAgainButton');
const shootoutToMenuButton = document.getElementById('shootoutToMainMenuButton');

if (shootoutButton) {
    this._addSoundToButton(shootoutButton, () => {
        if (this.game) {
            this.game.enterShootoutMode();
        }
    });
}

if (startShootoutButton) {
    this._addSoundToButton(startShootoutButton, () => {
        if (this.game) {
            this.game.startShootoutGame();
        }
    });
}

if (backFromShootoutButton) {
    this._addSoundToButton(backFromShootoutButton, () => {
        if (this.game) {
            this.game.quitShootoutToMainMenu();
        }
    });
}

if (playAgainButton) {
    this._addSoundToButton(playAgainButton, () => {
        if (this.game) {
            this.game.startShootoutGame();
        }
    });
}

if (shootoutToMenuButton) {
    this._addSoundToButton(shootoutToMenuButton, () => {
        if (this.game) {
            this.game.quitShootoutToMainMenu();
        }
    });
}
```

**Acceptance Criteria:**
- [ ] All buttons work
- [ ] Sounds play on button clicks
- [ ] Correct game methods called

---

## Phase 5: Input & Rendering

### Task 5.1: Update Input Handler
**File:** `js/input.js`

Modify mouse event handlers to support shootout mode:

```javascript
handleMouseDown(event) {
    if (!this.game) return;
    
    // Handle shootout mode input
    if (this.game.gameState === 'SHOOTOUT_PLAYING') {
        if (event.button === 0) { // Left click to fire
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const screenX = (event.clientX - rect.left) * scaleX;
            const screenY = (event.clientY - rect.top) * scaleY;
            
            this.game.shootoutController.handleMouseMove(screenX, screenY);
            this.game.shootoutController.handleFire();
        }
        return; // Don't process other inputs during shootout
    }
    
    // ... existing campaign mode input handling
}

handleMouseMove(event) {
    if (!this.game) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    
    // Handle shootout aiming
    if (this.game.gameState === 'SHOOTOUT_PLAYING') {
        this.game.shootoutController.handleMouseMove(screenX, screenY);
        return;
    }
    
    // ... existing campaign mode mouse handling
}
```

**Acceptance Criteria:**
- [ ] Mouse movement tracked in shootout mode
- [ ] Clicking fires weapon
- [ ] Campaign mode input still works

---

### Task 5.2: Update Game Loop for Shootout
**File:** `js/game.js`

```javascript
update(deltaTime) {
    if (this.gameState === 'PAUSED') return;
    
    // Handle shootout mode updates
    if (this.gameState === 'SHOOTOUT_PLAYING') {
        if (this.shootoutController) {
            this.shootoutController.update(deltaTime);
        }
        if (this.shootoutSpawner) {
            this.shootoutSpawner.update(deltaTime);
        }
        
        // Update projectiles
        this.gameObjects = this.gameObjects.filter(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
            return !obj.isMarkedForDeletion;
        });
        
        // Check for projectile hits on player
        this.checkPlayerProjectileHits();
        
        return; // Skip campaign update logic
    }
    
    // ... existing campaign mode update logic
}

checkPlayerProjectileHits() {
    if (!this.shootoutController || !this.shootoutController.isPlayerAlive) return;
    
    const playerX = this.canvas.width / 2;
    const playerY = this.canvas.height + 100;
    const playerHitRadius = 50;
    
    this.gameObjects.forEach(obj => {
        if (obj instanceof Projectile && obj.shooterUnit && obj.shooterUnit.team === 'enemy') {
            const dist = Math.sqrt(
                (obj.x - playerX) ** 2 + 
                (obj.y - playerY) ** 2
            );
            
            if (dist <= playerHitRadius) {
                this.shootoutController.takeDamage(obj.damage);
                obj.isMarkedForDeletion = true;
            }
        }
    });
}

render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Handle shootout rendering
    if (this.gameState === 'SHOOTOUT_PLAYING' || 
        this.gameState === 'SHOOTOUT_PAUSED') {
        this.renderShootoutMode();
        return;
    }
    
    // ... existing campaign mode rendering
}

renderShootoutMode() {
    // Draw background
    if (this.shootoutBackgroundImage) {
        // Scale background to fit canvas while maintaining aspect ratio
        const bg = this.shootoutBackgroundImage;
        const canvasAspect = this.canvas.width / this.canvas.height;
        const bgAspect = bg.width / bg.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasAspect > bgAspect) {
            drawWidth = this.canvas.width;
            drawHeight = drawWidth / bgAspect;
            drawX = 0;
            drawY = (this.canvas.height - drawHeight) / 2;
        } else {
            drawHeight = this.canvas.height;
            drawWidth = drawHeight * bgAspect;
            drawX = (this.canvas.width - drawWidth) / 2;
            drawY = 0;
        }
        
        this.ctx.drawImage(bg, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Fallback background
        this.ctx.fillStyle = '#1a3d1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw game objects (targets, projectiles)
    // Sort by layer (back trees first, then front trees)
    const sortedObjects = this.gameObjects.sort((a, b) => {
        const layerA = a.treeConfig ? (a.treeConfig.layer === 'back' ? 0 : 1) : 0;
        const layerB = b.treeConfig ? (b.treeConfig.layer === 'back' ? 0 : 1) : 0;
        return layerA - layerB;
    });
    
    sortedObjects.forEach(obj => {
        if (obj.render) {
            obj.render(this.ctx, 0, 0); // No camera offset in shootout mode
        }
    });
    
    // Draw visual effects
    this.visualEffects.forEach(effect => {
        if (effect.render) {
            effect.render(this.ctx);
        }
    });
}
```

**Acceptance Criteria:**
- [ ] Background renders correctly
- [ ] Targets render in correct order (back to front)
- [ ] Projectiles visible
- [ ] UI overlay renders on top

---

## Phase 6: Integration & Testing

### Task 6.1: Include New Scripts
**File:** `index.html`
**Location:** Before closing `</body>` tag

Add script tags for new classes:

```html
<!-- Shootout Mode Scripts -->
<script src="js/shootout/shootoutTarget.js"></script>
<script src="js/shootout/shootoutSpawner.js"></script>
<script src="js/shootout/shootoutController.js"></script>
```

**Acceptance Criteria:**
- [ ] Scripts load without 404 errors
- [ ] Classes available in game

---

### Task 6.2: Final Integration Checklist

Before considering the mode complete, verify:

**Functionality:**
- [ ] Can access shootout from main menu
- [ ] Pre-game screen shows instructions and high score
- [ ] Game starts and background loads
- [ ] Targets spawn at tree positions
- [ ] Targets peek out from behind trees
- [ ] Can aim with mouse
- [ ] Clicking fires weapon
- [ ] Hits register on visible targets
- [ ] Targets fire back at player
- [ ] Player takes damage when hit
- [ ] Score increases correctly
- [ ] Timer counts down
- [ ] Game ends when time runs out
- [ ] Game ends when health reaches 0
- [ ] Game over screen shows correct stats
- [ ] Grade calculated correctly
- [ ] High score saves to localStorage
- [ ] Can play again
- [ ] Can return to main menu
- [ ] Campaign mode still works normally

**Visual:**
- [ ] Background image displays correctly
- [ ] Targets render with proper scale
- [ ] Depth sorting works (back vs front trees)
- [ ] HUD displays all info clearly
- [ ] Crosshair cursor visible
- [ ] Hit effects visible
- [ ] Health bar updates smoothly
- [ ] Timer pulses when low

**Audio:**
- [ ] Weapon fire sound plays
- [ ] Hit sound plays (if implemented)
- [ ] Menu sounds work

**Performance:**
- [ ] Maintains 60 FPS
- [ ] No memory leaks (targets cleanup)
- [ ] Responsive controls

---

## Summary

This implementation adds a complete arcade-style "Shootout" mode to Raccoon Platoon with:

1. **Main Menu Integration** - New button to access mode
2. **Pre-Game Screen** - Instructions and high score display  
3. **Core Gameplay** - FPS-style with crosshair, point-and-click shooting (instant hit, no heli image)
4. **Enemy System** - Possums spawn behind trees, peek out, use south-facing sprites as hitboxes
5. **Progression** - Increasing difficulty over 60 seconds
6. **Scoring** - Points for hits/kills, accuracy tracking
7. **Game Over** - Final score, grade, high score persistence
8. **Clean Integration** - Doesn't interfere with existing campaign

The mode is designed to be extensible for future enhancements like additional backgrounds, enemy types, and campaign integration.
