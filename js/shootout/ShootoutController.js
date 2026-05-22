// js/shootout/ShootoutController.js
// Main controller for Shootout Mode gameplay

class ShootoutController {
    constructor(game) {
        this.game = game;
        this.spawner = null;

        this.backgroundImage = null;
        this.currentBackgroundKey = CONFIG.SHOOTOUT_MODE.DEFAULT_BACKGROUND || 'JUNGLE_AMBUSH';
        this.isNightMode = false;
        this.loadBackgroundImage();

        // Player state
        this.playerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.maxPlayerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.isPlayerAlive = true;

        // Score tracking
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;

        // Damage tracking
        this.totalDamageTaken = 0;
        this.maxDamageAllowed = CONFIG.SHOOTOUT_MODE.MAX_DAMAGE_ALLOWED;
        this.survivalBonus = 0;
        this.damageMultiplier = CONFIG.SHOOTOUT_MODE.DAMAGE_MULTIPLIER;

        // Timing
        this.roundDuration = CONFIG.SHOOTOUT_MODE.ROUND_DURATION_SECONDS;
        this.timeRemaining = this.roundDuration;
        this.isRoundActive = false;

        // Cursor/Aiming
        this.cursorPosition = { x: 0, y: 0 };
        this.crosshairSize = CONFIG.SHOOTOUT_MODE.CROSSHAIR_SIZE;

        // Fire cooldown
        this.fireCooldown = 0;
        this.FIRE_COOLDOWN_TIME = 0.15; // Seconds between shots

        // High score (persisted in localStorage)
        this.highScores = this.loadHighScores();

        // Game Mode
        this.gameMode = CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK;
        this.eliminationGoal = 0;
        this.timeElapsed = 0;

        // Dev Mode / Debug properties
        this.isDevMode = false;
        this.editableSpawnPositions = []; // Copy of positions for editing
        this.draggedSpawnIndex = -1;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedSpawnIndex = -1;
        this.isAddSpawnMode = false; // When true, clicking on canvas adds a new spawn

        // Damage visual feedback properties
        this.damageFlashTimer = 0;
        this.DAMAGE_FLASH_DURATION = 0.3; // seconds
        this.damageIndicators = []; // Array of directional damage indicators
        this.screenBloodSplatters = []; // Array of blood splatter effects on screen

        // Bullet tracking - moved from individual enemies to persist after enemy death
        this.bullets = []; // Array of active bullets: { startTime, travelTime, startX, startY, hasDealtDamage, damage, sourceX, sourceY, scale }

        // Blood stain tracking - persists on background until end of round
        this.bloodStains = []; // Array of blood stains: { x, y, size, rotation, opacity, type }

        // Falling blood droplets - animate before becoming stains
        this.fallingDroplets = []; // Array of falling droplets: { x, y, vx, vy, size, finalX, finalY, ...stainData }

        // Bullet mark tracking - persists on background until end of round
        this.bulletMarks = []; // Array of bullet marks: { x, y, scale, type, rotation }
        // type: 'enemy' for enemy hit, 'environment' for miss

        // Tweakable parameter: how far down the blood drops from the enemy's center
        this.BLOOD_VERTICAL_OFFSET = 95; // Pixels (positive is down)
        this.BLOOD_UPWARD_FORCE = -105;  // Pixels per second (negative is up)

        // Shuffle Mode
        this.isShuffleMode = false;

        // Ambush Mode (for campaign integration)
        this.isAmbushMode = false;
        this.ambushCallback = null; // Callback when ambush ends
    }

    init() {
        // Initialize spawner with positions from the current background
        this.spawner = new ShootoutSpawner(this.game);
        this.spawner.loadTreePositionsFromConfig(this.currentBackgroundKey);
    }

    loadBackgroundImage() {
        const bgConfig = CONFIG.SHOOTOUT_MODE.BACKGROUNDS[this.currentBackgroundKey];
        if (!bgConfig) {
//            console.error(`[Shootout] Background config not found for key: ${this.currentBackgroundKey}`);
            return;
        }

        let imagePath = bgConfig.IMAGE;
        if (this.isNightMode) {
            // Replace extension with _night + extension
            const lastDotIndex = imagePath.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                imagePath = imagePath.substring(0, lastDotIndex) + '_night' + imagePath.substring(lastDotIndex);
            } else {
                imagePath += '_night';
            }
        }

        this.backgroundImage = new Image();
        this.backgroundImage.src = imagePath;
        this.backgroundImage.onload = () => {
//            console.log(`[Shootout] Loaded background image: ${imagePath}`);
        };
        this.backgroundImage.onerror = () => {
//            console.warn(`[Shootout] Failed to load background image: ${imagePath}. Falling back to daytime.`);
            if (this.isNightMode) {
                const dayPath = bgConfig.IMAGE;
                this.backgroundImage.src = dayPath;
            }
        };
    }

    /**
     * Set the current background and update spawn positions
     * @param {string} backgroundKey 
     */
    setBackground(backgroundKey) {
        if (!CONFIG.SHOOTOUT_MODE.BACKGROUNDS[backgroundKey]) {
//            console.error(`[Shootout] Invalid background key: ${backgroundKey}`);
            return;
        }

        this.currentBackgroundKey = backgroundKey;
        this.loadBackgroundImage();

        // If we have a spawner, update its positions
        if (this.spawner && CONFIG.SHOOTOUT_MODE.BACKGROUNDS[this.currentBackgroundKey].TREE_SPAWN_POSITIONS) {
            this.spawner.setTreePositions(CONFIG.SHOOTOUT_MODE.BACKGROUNDS[this.currentBackgroundKey].TREE_SPAWN_POSITIONS);
        }

//        console.log(`[Shootout] Background set to: ${backgroundKey}`);
    }

    /**
     * Toggle night mode
     * @param {boolean} enabled 
     */
    setNightMode(enabled) {
        this.isNightMode = enabled;
        this.loadBackgroundImage();
//        console.log(`[Shootout] Night mode set to: ${enabled}`);
    }

    /**
     * Toggle shuffle mode on/off
     * @returns {boolean} The new shuffle mode state
     */
    toggleShuffleMode() {
        this.isShuffleMode = !this.isShuffleMode;
//        console.log(`[Shootout] Shuffle mode set to: ${this.isShuffleMode}`);
        return this.isShuffleMode;
    }

    /**
     * Select a random map different from the current one, with random night mode
     */
    selectRandomMap() {
        const backgrounds = CONFIG.SHOOTOUT_MODE.BACKGROUNDS;
        const allMapKeys = Object.keys(backgrounds);
        
        // Filter out current map to avoid immediate repeats
        const availableMaps = allMapKeys.filter(key => key !== this.currentBackgroundKey);
        
        // If only one map available or all filtered, use all maps
        const mapsToChooseFrom = availableMaps.length > 0 ? availableMaps : allMapKeys;
        
        // Random selection
        const randomIndex = Math.floor(Math.random() * mapsToChooseFrom.length);
        const selectedMap = mapsToChooseFrom[randomIndex];
        
        // Random night mode (50/50 chance)
        const useNightMode = Math.random() > 0.5;
        
        this.setBackground(selectedMap);
        this.setNightMode(useNightMode);
        
//        console.log(`[Shootout] Random map selected: ${selectedMap} (Night: ${useNightMode})`);
    }

    startRound(useDevPositions = false) {
        // Reset state
        this.playerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.isPlayerAlive = true;
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;

        // Reset bullet marks
        this.bulletMarks = [];

        // Reset damage tracking
        this.totalDamageTaken = 0;
        this.damagePenalty = 0;

        // Reset Advanced Stats
        this.advancedStats = {
            headshots: 0,
            totalPrecisionOffset: 0,
            reactionTimes: [],
            ttks: [],
            currentStreak: 0,
            maxStreak: 0
        };

        // Timer and Goals
        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION) {
            this.timeRemaining = Infinity;
            this.timeElapsed = 0;
            const min = CONFIG.SHOOTOUT_MODE.ELIMINATION_TARGET_MIN;
            const max = CONFIG.SHOOTOUT_MODE.ELIMINATION_TARGET_MAX;
            this.eliminationGoal = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            this.timeRemaining = this.roundDuration;
            this.eliminationGoal = 0;
            this.timeElapsed = 0;
        }

        this.isRoundActive = true;
        this.fireCooldown = 0;

        // Reset spawner
        if (this.spawner) {
            this.spawner.reset();
            // If using dev positions, update spawner with edited positions
            if (useDevPositions && this.isDevMode && this.editableSpawnPositions.length > 0) {
                this.spawner.setTreePositions(this.editableSpawnPositions);
            }
        } else {
            this.init();
        }

        // Hide cursor and use crosshair
        this.game.canvas.style.cursor = 'none';

        // Disable dev mode when starting actual gameplay
        if (this.isDevMode) {
            this.disableDevMode();
        }

        // Update UI
        this.updateUI();
    }

    /**
     * Start an ambush round for campaign integration
     * @param {string} backgroundKey - Optional background key from config
     * @param {boolean} isNight - Whether to use night mode
     * @param {function} callback - Callback function when ambush ends
     */
    startAmbush(backgroundKey = null, isNight = false, callback = null) {
//        console.log('[Shootout] startAmbush called, backgroundKey:', backgroundKey, 'isNight:', isNight);
        
        // Set ambush mode
        this.isAmbushMode = true;
        this.ambushCallback = callback;

        // Only set background/night if not already configured (prevents double initialization)
        if (backgroundKey && this.currentBackgroundKey !== backgroundKey) {
//            console.log('[Shootout] Calling setBackground...');
            this.setBackground(backgroundKey);
        }
        if (isNight !== this.isNightMode) {
//            console.log('[Shootout] Calling setNightMode...');
            this.setNightMode(isNight);
        }

        // Set game state (music already started in executeStartAmbush)
        this.game.gameState = 'SHOOTOUT_AMBUSH';

        // Randomly choose between TIME_ATTACK and ELIMINATION for ambush
        const ambushTimeAttackChance = CONFIG.SHOOTOUT_MODE.AMBUSH_TIME_ATTACK_CHANCE !== undefined 
            ? CONFIG.SHOOTOUT_MODE.AMBUSH_TIME_ATTACK_CHANCE 
            : 0.5;
        if (Math.random() < ambushTimeAttackChance) {
            this.gameMode = CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK;
        } else {
            this.gameMode = CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION;
        }

        // Reset state (same as startRound but with ambush settings)
        this.playerHealth = CONFIG.SHOOTOUT_MODE.INITIAL_PLAYER_HEALTH;
        this.isPlayerAlive = true;
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;

        // Reset bullet marks
        this.bulletMarks = [];

        // Reset damage tracking
        this.totalDamageTaken = 0;
        this.damagePenalty = 0;

        // Reset Advanced Stats
        this.advancedStats = {
            headshots: 0,
            totalPrecisionOffset: 0,
            reactionTimes: [],
            ttks: [],
            currentStreak: 0,
            maxStreak: 0
        };

        // Timer and Goals based on mode
        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION) {
            this.timeRemaining = Infinity;
            this.timeElapsed = 0;
            this.eliminationGoal = CONFIG.SHOOTOUT_MODE.AMBUSH_ELIMINATION_COUNT || 10;
        } else {
            this.timeRemaining = CONFIG.SHOOTOUT_MODE.AMBUSH_TIME_LIMIT || 30;
            this.eliminationGoal = 0;
            this.timeElapsed = 0;
        }

        this.isRoundActive = true;
        this.fireCooldown = 0;

        // Reset spawner with current background positions
        if (this.spawner) {
            this.spawner.reset();
        } else {
            this.init();
        }

        // Hide cursor and use crosshair
        this.game.canvas.style.cursor = 'none';

        // Update UI
        if (this.game.ui) {
            this.game.ui.showShootoutHud();
        }

//        console.log(`[Shootout] Ambush started! Mode: ${this.gameMode}, Night: ${isNight}, Background: ${this.currentBackgroundKey}`);
    }

    /**
     * End the ambush and handle callback
     * @param {string} reason - 'clear', 'time', or 'defeat'
     */
    endAmbush(reason = 'clear') {
        if (!this.isAmbushMode) return;

//        console.log('[Shootout] endAmbush called, reason:', reason);
        
        const callback = this.ambushCallback;
        
        // Flag that this is an ambush end (checked in endRound before clearing isAmbushMode)
        this._endingAmbush = true;
        this.isAmbushMode = false;
        this.ambushCallback = null;

        // End the round with callback
        this.endRound(reason, callback);
    }

    endRound(reason = 'time', callback = null) {
//        console.log('[Shootout] endRound called, reason:', reason, 'isAmbushMode:', this.isAmbushMode, '_endingAmbush:', this._endingAmbush);
        
        // Handle ambush mode differently - use _endingAmbush flag since isAmbushMode is cleared by endAmbush
        if (this._endingAmbush) {
            this._endingAmbush = false;
//            console.log('[Shootout] Processing ambush result...');
            
            // Campaign ambushes: only 'health' (death) is defeat, all other outcomes are VICTORY
            let result = (reason === 'health') ? 'DEFEAT' : 'VICTORY';
            
            // Clear round state so update() doesn't run again
            this.isRoundActive = false;
            this.game.canvas.style.cursor = 'default';

            // Signal that ambush result is pending — prevents update() from
            // transitioning to RUNNING before handleAmbushResult processes the outcome
            this.game.ambushResultPending = true;

            // Show ambush result and call callback
//            console.log('[Shootout] Showing ambush result, callback exists:', !!callback);
            if (this.game.ui) {
                this.game.ui.showShootoutAmbushResult(result, () => {
//                    console.log('[Shootout] Ambush result UI dismissed, calling callback with:', result);
                    if (callback) callback(result);
                    else console.log('[Shootout] WARNING: callback was null!');
                });
            } else if (callback) {
                callback(result);
            }
            return;
        }
        
        this.isRoundActive = false;
        this.game.canvas.style.cursor = 'default';

        // Calculate survival bonus
        this.calculateSurvivalBonus();

        // Calculate the enhanced final score
        const finalScore = this.calculateEnhancedScore();

        // Check for high score (only for non-ambush mode)
        const isNewHighScore = !this._endingAmbush && finalScore > (this.highScores[this.gameMode] || 0);
        if (isNewHighScore) {
            this.highScores[this.gameMode] = finalScore;
            this.saveHighScores();
        }

        // Clear blood stains and effects when game ends
        this.bloodStains = [];
        this.fallingDroplets = [];
        this.bullets = [];
        this.bulletMarks = [];

        // Calculate time bonus based on mode
        let timeBonus = 0;
        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK) {
            timeBonus = Math.ceil(this.timeRemaining) * 10;
        } else if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION && reason === 'clear') {
            const parTime = this.eliminationGoal * CONFIG.SHOOTOUT_MODE.ELIMINATION_PAR_TIME_PER_TARGET;
            const timeDiff = parTime - this.timeElapsed;
            if (timeDiff > 0) {
                // Award 20 points for every second under par time
                timeBonus = Math.ceil(timeDiff) * 20;
            }
        }

        // Calculate advanced final stats
        const avgReaction = this.advancedStats.reactionTimes.length > 0
            ? this.advancedStats.reactionTimes.reduce((a, b) => a + b, 0) / this.advancedStats.reactionTimes.length
            : 0;

        const avgTTK = this.advancedStats.ttks.length > 0
            ? this.advancedStats.ttks.reduce((a, b) => a + b, 0) / this.advancedStats.ttks.length
            : 0;

        const avgOffset = this.shotsHit > 0
            ? this.advancedStats.totalPrecisionOffset / this.shotsHit
            : 0;

        const headshotPct = this.shotsHit > 0
            ? Math.round((this.advancedStats.headshots / this.shotsHit) * 100)
            : 0;

        // Show game over screen with comprehensive stats object
        if (this.game.ui) {
            this.game.ui.showShootoutGameOver({
                score: finalScore,
                baseScore: this.score,
                accuracy: this.getAccuracy(),
                isNewHighScore: isNewHighScore,
                totalDamageTaken: this.totalDamageTaken,
                damagePenalty: this.survivalBonus, // Send survival bonus instead of penalty
                timeBonus: timeBonus,
                hits: this.shotsHit,
                kills: this.targetsKilled,
                shotsFired: this.shotsFired,
                grade: this.getGrade(finalScore),
                endReason: reason,
                gameMode: this.gameMode, // Pass gameMode down for UI rendering

                // Advanced Stats
                headshotPct: headshotPct,
                avgReaction: Math.round(avgReaction),
                avgTTK: Math.round(avgTTK),
                avgOffset: Math.round(avgOffset),
                maxStreak: this.advancedStats.maxStreak
            });
        }
    }

    update(deltaTime) {
        // Don't update if ambush is ending (prevents double endRound)
        if (this._endingAmbush) return;
        if (!this.isRoundActive) return;

        // Track elapsed time for both modes (used for Elimination scoring)
        this.timeElapsed += deltaTime;

        // Update timer/win condition based on mode
        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK) {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                if (this.isAmbushMode) {
                    this.endAmbush('time');
                } else {
                    this.endRound('time');
                }
                return;
            }
        } else if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION) {
            if (this.targetsKilled >= this.eliminationGoal) {
                if (this.isAmbushMode) {
                    this.endAmbush('clear');
                } else {
                    this.endRound('clear');
                }
                return;
            }
        }

        // Update fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }

        // Update damage flash timer
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
            if (this.damageFlashTimer < 0) {
                this.damageFlashTimer = 0;
            }
        }

        // Update damage indicators
        this.damageIndicators = this.damageIndicators.filter(indicator => {
            indicator.timer -= deltaTime;
            return indicator.timer > 0;
        });

        // Update screen blood splatters
        this.screenBloodSplatters = this.screenBloodSplatters.filter(splatter => {
            splatter.timer -= deltaTime;
            return splatter.timer > 0;
        });

        // Update bullets (independent of enemies)
        this.updateBullets(deltaTime);

        // Update falling blood droplets
        this.updateFallingDroplets(deltaTime);

        // Update spawner and targets
        if (this.spawner) {
            this.spawner.update(deltaTime);
        }

        // Update UI
        this.updateUI();
    }

    handleMouseMove(screenX, screenY) {
        const scales = this.getScaleFactors();
        this.cursorPosition.x = screenX / scales.x;
        this.cursorPosition.y = screenY / scales.y;
    }

    getScaleFactors() {
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;
        return {
            x: this.game.canvas.width / nativeWidth,
            y: this.game.canvas.height / nativeHeight
        };
    }

    handleFire() {
        if (!this.isRoundActive || !this.isPlayerAlive) return;
        if (this.fireCooldown > 0) return;

        // Increment shots fired
        this.shotsFired++;

        // Set cooldown
        this.fireCooldown = this.FIRE_COOLDOWN_TIME;

        // Convert screen position to world position (which is now native 1920x1080)
        const worldPos = this.screenToWorld(this.cursorPosition.x, this.cursorPosition.y);

        // Check for hit
        if (this.spawner) {
            const hitTarget = this.spawner.checkHit(worldPos.x, worldPos.y);

            if (hitTarget) {
                // Hit!
                this.shotsHit++;

                // Advanced stats: Headshot
                if (hitTarget.isHeadshot(worldPos.x, worldPos.y)) {
                    this.advancedStats.headshots++;
                }

                // Advanced stats: Precision Offset
                const dx = worldPos.x - hitTarget.x;
                const dy = worldPos.y - hitTarget.y;
                const offset = Math.sqrt(dx * dx + dy * dy);
                this.advancedStats.totalPrecisionOffset += offset;

                // Advanced stats: Reaction Time (first hit on this target)
                if (hitTarget.firstHitTime && hitTarget.visibleStartTime) {
                    const reaction = hitTarget.firstHitTime - hitTarget.visibleStartTime;
                    this.advancedStats.reactionTimes.push(reaction);
                }

                // Advanced stats: Streak
                this.advancedStats.currentStreak++;
                this.advancedStats.maxStreak = Math.max(this.advancedStats.maxStreak, this.advancedStats.currentStreak);

                hitTarget.onHit(this.getPlayerDamage());
                this.addScore(CONFIG.SHOOTOUT_MODE.SCORE_PER_HIT);

                // Add bullet mark at hit location
                this.addBulletMark(worldPos.x, worldPos.y, 'enemy', hitTarget);

                // Play hit sound
                if (this.game.audioManager) {
                    this.game.audioManager.play(CONFIG.SHOOTOUT_MODE.PLAYER_FIRE_SFX);
                }
            } else {
                // Miss
                this.advancedStats.currentStreak = 0;

                // Add bullet mark at cursor position (missed shot)
                this.addBulletMark(worldPos.x, worldPos.y, 'environment', null);

                // play sound anyway
                if (this.game.audioManager) {
                    this.game.audioManager.play(CONFIG.SHOOTOUT_MODE.PLAYER_FIRE_SFX);
                }
            }
        }

        // Create muzzle flash effect at cursor
        this.createMuzzleFlash();
    }

    getPlayerDamage() {
        // Player does massive damage in shootout mode for 1-hit kills
        return 25; // Guaranteed one-shot kill
    }

    onTargetKilled(target) {
        this.targetsKilled++;
        this.addScore(CONFIG.SHOOTOUT_MODE.SCORE_PER_KILL);

        // Advanced stats: TTK (Time to Kill)
        if (target.visibleStartTime) {
            const ttk = performance.now() - target.visibleStartTime;
            this.advancedStats.ttks.push(ttk);
        }

        // Add persistent blood stain to background
        this.addBloodStain(target.x, target.y, target.scale);

        // Create death effect (temporary particles)
        if (this.game.addVisualEffect) {
            this.game.addVisualEffect('blood', {
                x: target.x,
                y: target.y,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    addBloodStain(x, y, scale) {
        // Calculate the "ground" position relative to the target's center
        const groundY = y + (this.BLOOD_VERTICAL_OFFSET * scale);

        // Create falling blood droplets that will stain when they hit the ground
        const numFalling = 5 + Math.floor(Math.random() * 4); // 5-8 falling droplets per kill

        for (let i = 0; i < numFalling; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 25 * scale;
            const finalX = x + Math.cos(angle) * distance * 1.1;
            const finalY = groundY + Math.sin(angle) * (distance * 0.5) ; // Flatten the splatter area

            // Start position - higher up (enemy's body height)
            const startX = finalX + (Math.random() - 0.5) * 15;
            const startY = y - 20 - Math.random() * 15; // Start above the enemy center

            // Pre-calculate stain data
            const droplets = [];
            const numDroplets = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numDroplets; j++) {
                droplets.push({
                    angle: Math.random() * Math.PI * 2,
                    dist: 0.5 + Math.random() * 0.8,
                    size: 0.1 + Math.random() * 0.15
                });
            }

            // Create falling droplet
            this.fallingDroplets.push({
                x: startX,
                y: startY,
                vx: (finalX - startX) * 1.5, // Horizontal velocity toward final position
                vy: this.BLOOD_UPWARD_FORCE * (0.7 + Math.random() * 0.8), // Initial upward pop (fixed speed regardless of scale)
                finalX: finalX,
                finalY: finalY,
                size: (3 + Math.random() * 10) * scale,
                rotation: Math.random() * Math.PI * 2,
                opacity: 0.4 + Math.random() * 0.2,
                type: Math.floor(Math.random() * 3),
                colorVariation: Math.random(),
                droplets: droplets,
                shapeVariation: Array(6).fill(0).map(() => 0.6 + Math.random() * 0.4),
                landed: false
            });
        }

        // Add central pool as falling droplet too
        const poolDroplets = [];
        for (let j = 0; j < 4; j++) {
            poolDroplets.push({
                angle: Math.random() * Math.PI * 20,
                dist: 0.5 + Math.random() * 2.5,
                size: 0.15 + Math.random() * 0.15
            });
        }

        const poolFinalX = x + (Math.random() - 0.5) * 16;
        const poolFinalY = groundY + (Math.random() - 0.5) * 50;

        this.fallingDroplets.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y - 15 - Math.random() * 10,
            vx: (poolFinalX - x) * 1.2,
            vy: this.BLOOD_UPWARD_FORCE * 0.5, // Slight upward pop for the main pool too (fixed speed regardless of scale)
            finalX: poolFinalX,
            finalY: poolFinalY,
            size: (12 + Math.random() * 8) * scale,
            rotation: Math.random() * Math.PI * 2,
            opacity: 0.85 + Math.random() * 0.15,
            type: 3, // Pool type
            colorVariation: Math.random(),
            droplets: poolDroplets,
            shapeVariation: Array(8).fill(0).map(() => 0.5 + Math.random() * 0.5),
            landed: false
        });
    }

    /**
     * Add a bullet mark at the specified location
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {string} type - 'enemy' for enemy hit, 'environment' for miss
     * @param {object} target - The target that was hit (for enemy marks)
     */
    addBulletMark(x, y, type, target = null) {
        // Get scale from config based on type
        const config = CONFIG.SHOOTOUT_MODE.BULLET_MARKS[type.toUpperCase() + '_HIT'];
        const baseScale = config ? config.DEFAULT_SCALE : 0.5;
        
        // Scale the bullet mark based on target scale (for enemy hits)
        // For environment hits, we use a smaller fixed scale
        let scale = baseScale;
        if (type === 'enemy' && target) {
            scale = baseScale * target.scale;
        }
        
        // Add some random rotation for variety
        const rotation = Math.random() * Math.PI * 2;
        
        this.bulletMarks.push({
            x: x,
            y: y,
            scale: scale,
            type: type,
            rotation: rotation,
            targetId: target ? target.id : null  // Store target ID instead of reference
        });
    }

    updateFallingDroplets(deltaTime) {
        const gravity = 400; // Pixels per second squared

        this.fallingDroplets = this.fallingDroplets.filter(droplet => {
            if (droplet.landed) {
                // Droplet has already landed, should be removed
                return false;
            }

            // Apply gravity
            droplet.vy += gravity * deltaTime;

            // Update position
            droplet.x += droplet.vx * deltaTime;
            droplet.y += droplet.vy * deltaTime;

            // Check if hit the ground
            if (droplet.y >= droplet.finalY) {
                // Convert to permanent stain
                this.bloodStains.push({
                    x: droplet.finalX,
                    y: droplet.finalY,
                    size: droplet.size,
                    rotation: droplet.rotation,
                    opacity: droplet.opacity,
                    type: droplet.type,
                    colorVariation: droplet.colorVariation,
                    droplets: droplet.droplets,
                    shapeVariation: droplet.shapeVariation
                });

                droplet.landed = true;
                return false; // Remove from falling droplets
            }

            return true; // Keep falling
        });
    }

    drawFallingDroplets(ctx) {
        this.fallingDroplets.forEach(droplet => {
            ctx.save();
            ctx.translate(droplet.x, droplet.y);

            // Draw falling droplet as a stretched oval
            const redIntensity = Math.floor(130 + droplet.colorVariation * 30);
            const greenIntensity = Math.floor(10 + droplet.colorVariation * 15);
            const blueIntensity = Math.floor(10 + droplet.colorVariation * 10);

            ctx.fillStyle = `rgba(${redIntensity}, ${greenIntensity}, ${blueIntensity}, ${droplet.opacity})`;

            // Draw oval shape stretched by velocity
            ctx.beginPath();
            ctx.ellipse(0, 0, droplet.size * 0.4, droplet.size * (0.8 + Math.abs(droplet.vy) * 0.002), 0, 20, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawBloodStains(ctx) {
        this.bloodStains.forEach(stain => {
            ctx.save();
            ctx.translate(stain.x, stain.y);
            ctx.rotate(stain.rotation);

            // Vary the blood color slightly for realism
            const redIntensity = Math.floor(130 + stain.colorVariation * 30);
            const greenIntensity = Math.floor(10 + stain.colorVariation * 15);
            const blueIntensity = Math.floor(10 + stain.colorVariation * 10);

            if (stain.type === 3) {
                // Blood pool - irregular but static shape
                ctx.fillStyle = `rgba(${redIntensity}, ${greenIntensity}, ${blueIntensity}, ${stain.opacity})`;
                ctx.beginPath();
                const points = 8;
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const radius = stain.size * stain.shapeVariation[i];
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();

                // Pre-calculated droplets around pool
                ctx.fillStyle = `rgba(${redIntensity - 20}, ${greenIntensity - 5}, ${blueIntensity - 5}, ${stain.opacity * 0.6})`;
                stain.droplets.forEach(d => {
                    ctx.beginPath();
                    ctx.arc(
                        Math.cos(d.angle) * stain.size * d.dist,
                        Math.sin(d.angle) * stain.size * d.dist,
                        stain.size * d.size, 0, Math.PI * 2
                    );
                    ctx.fill();
                });

                // Darker center
                ctx.fillStyle = `rgba(${redIntensity - 50}, ${greenIntensity - 10}, ${blueIntensity - 10}, ${stain.opacity * 1.1})`;
                ctx.beginPath();
                ctx.arc(0, 0, stain.size * 0.35, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Splatter drops - more realistic blood splatter shape
                ctx.fillStyle = `rgba(${redIntensity}, ${greenIntensity}, ${blueIntensity}, ${stain.opacity})`;

                // Main splatter body - irregular blob
                ctx.beginPath();
                const points = 6;
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const radius = stain.size * stain.shapeVariation[i];
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        // Use quadratic curves for smoother blob shape
                        const prevAngle = ((i - 1) / points) * Math.PI * 2;
                        const prevRadius = stain.size * stain.shapeVariation[i - 1];
                        const cpx = Math.cos(prevAngle + 0.3) * prevRadius * 1.2;
                        const cpy = Math.sin(prevAngle + 0.3) * prevRadius * 1.2;
                        ctx.quadraticCurveTo(cpx, cpy, px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();

                // Pre-calculated droplets around splatter (static)
                ctx.fillStyle = `rgba(${redIntensity}, ${greenIntensity}, ${blueIntensity}, ${stain.opacity * 0.5})`;
                stain.droplets.forEach(d => {
                    ctx.beginPath();
                    ctx.arc(
                        Math.cos(d.angle) * stain.size * d.dist,
                        Math.sin(d.angle) * stain.size * d.dist,
                        stain.size * d.size, 0, Math.PI * 2
                    );
                    ctx.fill();
                });
            }

            ctx.restore();
        });
    }

    /**
     * Draw environment bullet marks (misses) - behind enemies
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawEnvironmentBulletMarks(ctx) {
        this.ensureBulletMarkSpritesLoaded();

        const envPath = CONFIG.SHOOTOUT_MODE.BULLET_MARKS['ENVIRONMENT_HIT']?.PATH;
        const envSprite = this.game.preloadedImages[envPath];
        if (!envSprite) return;

        this.bulletMarks.forEach(mark => {
            if (mark.type !== 'environment') return;

            ctx.save();
            ctx.translate(mark.x, mark.y);
            ctx.rotate(mark.rotation);

            const width = envSprite.width * mark.scale;
            const height = envSprite.height * mark.scale;
            ctx.drawImage(envSprite, -width / 2, -height / 2, width, height);

            ctx.restore();
        });
    }

    /**
     * Draw enemy bullet marks (hits) - in front of enemies
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawEnemyBulletMarks(ctx) {
        this.ensureBulletMarkSpritesLoaded();

        const enemyPath = CONFIG.SHOOTOUT_MODE.BULLET_MARKS['ENEMY_HIT']?.PATH;
        const enemySprite = this.game.preloadedImages[enemyPath];
        if (!enemySprite) return;

        const activeTargetIds = new Set();
        if (this.spawner && this.spawner.activeTargets) {
            this.spawner.activeTargets.forEach(t => activeTargetIds.add(t.id));
        }

        this.bulletMarks.forEach(mark => {
            if (mark.type !== 'enemy') return;

            if (mark.targetId !== null && !activeTargetIds.has(mark.targetId)) {
                return;
            }

            ctx.save();
            ctx.translate(mark.x, mark.y);
            ctx.rotate(mark.rotation);

            const width = enemySprite.width * mark.scale;
            const height = enemySprite.height * mark.scale;
            ctx.drawImage(enemySprite, -width / 2, -height / 2, width, height);

            ctx.restore();
        });
    }

    /**
     * Lazy load bullet mark sprites if not already loaded
     */
    ensureBulletMarkSpritesLoaded() {
        if (!CONFIG.SHOOTOUT_MODE || !CONFIG.SHOOTOUT_MODE.BULLET_MARKS) return;
        
        const bulletMarksConfig = CONFIG.SHOOTOUT_MODE.BULLET_MARKS;
        
        // Load enemy hit sprite if needed
        if (bulletMarksConfig.ENEMY_HIT && bulletMarksConfig.ENEMY_HIT.PATH) {
            const path = bulletMarksConfig.ENEMY_HIT.PATH;
            if (!this.game.preloadedImages[path]) {
//                console.log('[BulletMark] Lazy loading enemy sprite...');
                const img = new Image();
                img.onload = () => {
                    this.game.preloadedImages[path] = img;
//                    console.log('[BulletMark] Enemy sprite loaded!');
                };
                img.onerror = () => {
//                    console.error('[BulletMark] Failed to load enemy sprite:', path);
                };
                img.src = path;
            }
        }
        
        // Load environment hit sprite if needed
        if (bulletMarksConfig.ENVIRONMENT_HIT && bulletMarksConfig.ENVIRONMENT_HIT.PATH) {
            const path = bulletMarksConfig.ENVIRONMENT_HIT.PATH;
            if (!this.game.preloadedImages[path]) {
//                console.log('[BulletMark] Lazy loading environment sprite...');
                const img = new Image();
                img.onload = () => {
                    this.game.preloadedImages[path] = img;
//                    console.log('[BulletMark] Environment sprite loaded!');
                };
                img.onerror = () => {
//                    console.error('[BulletMark] Failed to load environment sprite:', path);
                };
                img.src = path;
            }
        }
    }

    takeDamage(amount, sourceX, sourceY) {
        if (!this.isPlayerAlive) return;

        this.playerHealth -= amount;
        this.totalDamageTaken += amount;

        // Screen shake effect - enhanced for more impact
        if (this.game.camera) {
            this.game.camera.shake(0.5, 8); // Increased duration and intensity
        }

        // Trigger screen-wide red flash
        this.damageFlashTimer = this.DAMAGE_FLASH_DURATION;

        // Add directional damage indicator if source position is provided
        if (sourceX !== undefined && sourceY !== undefined) {
            this.addDamageIndicator(sourceX, sourceY);
        }

        // Add screen blood splatter effect
        this.addScreenBloodSplatter();

        // Use game's visual effects system if available
        if (this.game.addVisualEffect) {
            // Add blood splatter near crosshair
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            this.game.addVisualEffect('blood', {
                x: this.cursorPosition.x + offsetX,
                y: this.cursorPosition.y + offsetY,
                angle: Math.random() * Math.PI * 2
            });
        }

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.isPlayerAlive = false;
            if (this.isAmbushMode) {
                this.endAmbush('health');
            } else {
                this.endRound('health');
            }
        }

        this.updateUI();
    }

    addBullet(startX, startY, damage, scale, offsetX, offsetY, sfxFireKey) {
        // Fallback to reasonable defaults if for some reason offsets aren't passed
        const offX = (offsetX !== undefined) ? offsetX : 5;
        const offY = (offsetY !== undefined) ? offsetY : 20;
        // Calculate travel time based on scale (smaller = further = longer)
        const baseTime = CONFIG.SHOOTOUT_MODE.BASE_TRAVEL_TIME;
        const scaleFactor = CONFIG.SHOOTOUT_MODE.TRAVEL_TIME_SCALE_FACTOR;
        const travelTime = baseTime / Math.max(scale * scaleFactor, 0.3);

        this.bullets.push({
            startTime: performance.now(),
            travelTime: travelTime,
            startX: startX,
            startY: startY,
            hasDealtDamage: false,
            damage: damage,
            sourceX: startX,
            sourceY: startY,
            scale: scale || 1.0,
            offsetX: offX,
            offsetY: offY
        });

        // Play sound - use the weapon's sfxFireKey if provided, otherwise fallback to POSSUM_RIFLE_FIRE
        if (this.game.audioManager) {
            const soundKey = sfxFireKey || 'POSSUM_RIFLE_FIRE';
            const sfxConfig = CONFIG.AUDIO_ASSETS[soundKey];
            if (sfxConfig) {
                this.game.audioManager.play(soundKey, { volume: sfxConfig.defaultVolume, pitchVariation: sfxConfig.pitchVariation });
            } else {
                this.game.audioManager.play('POSSUM_RIFLE_FIRE');
            }
        }
    }

    updateBullets(deltaTime) {
        const now = performance.now();

        this.bullets = this.bullets.filter(bullet => {
            const elapsed = (now - bullet.startTime) / 1000; // Convert to seconds
            const progress = elapsed / bullet.travelTime;

            // Check if bullet reached player
            if (progress >= 1.0 && !bullet.hasDealtDamage) {
                // Deal damage to player
                this.takeDamage(bullet.damage, bullet.sourceX, bullet.sourceY);
                bullet.hasDealtDamage = true;
            }

            // Remove bullet after it's complete (1.5x travel time)
            return progress < 1.5;
        });
    }

    drawBullets(ctx) {
        const now = performance.now();

        this.bullets.forEach(bullet => {
            const elapsed = now - bullet.startTime;
            const progress = Math.min(elapsed / (bullet.travelTime * 1000), 1.0);

            // Bullet stays at enemy position, only scales up to simulate getting closer
            // Account for enemy-specific offset, scaled by the enemy's size
            const bulletX = bullet.startX + (bullet.offsetX * bullet.scale);
            const bulletY = bullet.startY + (bullet.offsetY * bullet.scale);

            // Calculate bullet size - grows as it gets "closer"
            const bulletSize = bullet.scale * (2 + progress * 10);

            // Draw bullet glow
            ctx.fillStyle = `rgba(255, 200, 100, ${0.6 + progress * 0.4})`;
            ctx.beginPath();
            ctx.arc(bulletX, bulletY, bulletSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Draw orange bullet
            ctx.fillStyle = `rgba(255, 150, 50, ${0.7 + progress * 0.3})`;
            ctx.beginPath();
            ctx.arc(bulletX, bulletY, bulletSize * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Draw red bullet core
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(bulletX, bulletY, bulletSize, 0, Math.PI * 2);
            ctx.fill();

        });
    }

    addDamageIndicator(sourceX, sourceY) {
        // Calculate angle from player to damage source
        const playerPos = this.getPlayerPosition();
        const dx = sourceX - playerPos.x;
        const dy = sourceY - playerPos.y;
        const angle = Math.atan2(dy, dx);

        this.damageIndicators.push({
            angle: angle,
            timer: 1.0, // Show for 1 second
            maxTimer: 1.0
        });
    }

    addScreenBloodSplatter() {
        const count = Math.floor(Math.random() * 2) + 1;
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;

        for (let i = 0; i < count; i++) {
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            if (edge === 0) {
                // Top
                x = Math.random() * nativeWidth;
                y = -20;
            } else if (edge === 1) {
                // Right
                x = nativeWidth + 20;
                y = Math.random() * nativeHeight;
            } else if (edge === 2) {
                // Bottom
                x = Math.random() * nativeWidth;
                y = nativeHeight + 20;
            } else {
                // Left
                x = -20;
                y = Math.random() * nativeHeight;
            }

            this.screenBloodSplatters.push({
                x: x,
                y: y,
                size: 30 + Math.random() * 40,
                timer: 0.8 + Math.random() * 0.4,
                maxTimer: 1.2,
                rotation: Math.random() * Math.PI * 2,
                opacity: 0.6 + Math.random() * 0.4
            });
        }
    }

    addScore(points) {
        this.score += points;
    }

    getAccuracy() {
        if (this.shotsFired === 0) return 0;
        return Math.round((this.shotsHit / this.shotsFired) * 100);
    }

    calculateSurvivalBonus() {
        // give 1000 points if the player has taken 0 damage, and reduce it down per damage taken
        const survivalBonusMax = 1000;
        const damagePercent = Math.min(1, this.totalDamageTaken / this.maxDamageAllowed);
        this.survivalBonus = Math.round(survivalBonusMax * (1 - damagePercent));

        // Return for use in score calculation
        return this.survivalBonus;
    }

    calculateEnhancedScore() {
        const baseScore = this.score;
        const accuracy = this.getAccuracy() / 100;

        let timeBonus = 0;
        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK) {
            timeBonus = Math.ceil(this.timeRemaining) * 10;
        } else if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION && this.targetsKilled >= this.eliminationGoal) {
            const parTime = this.eliminationGoal * CONFIG.SHOOTOUT_MODE.ELIMINATION_PAR_TIME_PER_TARGET;
            const timeDiff = parTime - this.timeElapsed;
            if (timeDiff > 0) {
                timeBonus = Math.ceil(timeDiff) * 20;
            }
        }

        // Accuracy bonus multiplier
        let accuracyBonus = 1.0;
        if (this.shotsFired > 0) {
            accuracyBonus = accuracy >= 0.9 ? 1.5 :
                accuracy >= 0.8 ? 1.2 :
                    accuracy >= 0.7 ? 1.1 : 1.0;
        }

        // Kill efficiency bonus
        const killEfficiencyBonus = this.targetsKilled > 0 ?
            (this.targetsKilled / Math.max(this.shotsFired, 1)) * 200 : 0;

        // Calculate survival bonus
        const survivalBonus = this.calculateSurvivalBonus();

        // Final score calculation
        // New formula: (base + time + efficiency) * accuracy + survival
        const finalScore = (baseScore + timeBonus + killEfficiencyBonus) * accuracyBonus + survivalBonus;

        return Math.max(0, Math.round(finalScore)); // Use Math.round to avoid decimals
    }

    getGrade(precalculatedScore = null) {
        const accuracy = this.getAccuracy() / 100;
        const finalScore = precalculatedScore !== null ? precalculatedScore : this.calculateEnhancedScore();
        const damageEfficiency = 1 - (Math.min(this.totalDamageTaken, this.maxDamageAllowed) / this.maxDamageAllowed);

        // Grade based on score, accuracy, and damage efficiency
        if (finalScore >= 10000 && accuracy >= 0.9 && damageEfficiency >= 0.8) return 'S';
        if (finalScore >= 8000 && accuracy >= 0.8 && damageEfficiency >= 0.6) return 'A';
        if (finalScore >= 6000 && accuracy >= 0.7 && damageEfficiency >= 0.4) return 'B';
        if (finalScore >= 4000 && accuracy >= 0.6 && damageEfficiency >= 0.2) return 'C';
        if (finalScore >= 2000) return 'D';
        return 'F';
    }

    screenToWorld(screenX, screenY) {
        // In shootout mode with native scaling, cursorPosition is already in native coordinates.
        // If screenX/screenY are raw screen coordinates, they need to be scaled.
        // However, handleMouseMove already scales them to native coordinates.
        // So screenToWorld in shootout mode is essentially a 1:1 mapping of native to world.
        return { x: screenX, y: screenY };
    }

    worldToScreen(worldX, worldY) {
        // Reverse of screenToWorld: mapping native/world back to "normalized" screen for this controller.
        return { x: worldX, y: worldY };
    }

    getPlayerPosition() {
        // Player is at the center-bottom of the screen (in native 1920x1080 space)
        // (representing the helicopter gunner position)
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;
        return {
            x: nativeWidth / 2,
            y: nativeHeight - 50
        };
    }

    createMuzzleFlash() {
        // Visual effect at cursor position
        if (this.game.effectManager) {
            this.game.effectManager.createMuzzleFlash(
                this.cursorPosition.x,
                this.cursorPosition.y
            );
        }
    }

    updateUI() {
        if (!this.game.ui) return;

        // Update HUD elements
        const healthFill = document.getElementById('shootoutHealthFill');
        if (healthFill) {
            const healthPercent = (this.playerHealth / this.maxPlayerHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
        }

        const scoreElement = document.querySelector('#shootoutScore span');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }

        const timerElement = document.querySelector('#shootoutTimer');
        const timerSpan = timerElement?.querySelector('span');
        const goalElement = document.querySelector('#shootoutGoal');
        const goalSpan = goalElement?.querySelector('span');

        if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK) {
            if (timerElement) timerElement.style.display = 'block';
            if (goalElement) goalElement.style.display = 'none';
            if (timerSpan) {
                timerSpan.textContent = Math.ceil(this.timeRemaining);
            }
        } else if (this.gameMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION) {
            if (timerElement) timerElement.style.display = 'block';
            if (goalElement) goalElement.style.display = 'block';
            if (timerSpan) {
                // timeElapsed counts UP in elimination mode
                timerSpan.textContent = Math.floor(this.timeElapsed);
            }
            if (goalSpan) {
                goalSpan.textContent = `${this.targetsKilled}/${this.eliminationGoal}`;
            }
        }

        const accuracyElement = document.querySelector('#shootoutAccuracy span');
        if (accuracyElement) {
            accuracyElement.textContent = `${this.getAccuracy()}%`;
        }
    }

    render(ctx) {
        // Render in active round, dev mode, or during ambush alert
        if (!this.isRoundActive && !this.isDevMode && !this.isAmbushMode) return;

        ctx.save();

        // Apply scaling to native resolution (1920x1080)
        const scales = this.getScaleFactors();
        ctx.scale(scales.x, scales.y);

        // Draw background
        this.drawBackground(ctx);

        // Draw blood stains on background (persists until end of round)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawBloodStains(ctx);
        }

        // Draw falling blood droplets (animate before becoming stains)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawFallingDroplets(ctx);
        }

        // Draw bullet marks (behind enemies)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawEnvironmentBulletMarks(ctx);
        }

        // Draw targets (possums) - only in normal mode
        if (this.spawner && !this.isDevMode) {
            this.spawner.render(ctx);
        }

        // Draw enemy bullet marks (in front of enemies)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawEnemyBulletMarks(ctx);
        }

        // Draw bullets (independent of enemies, drawn on top of them)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawBullets(ctx);
        }

        // Draw debug overlay in dev mode
        if (this.isDevMode) {
            this.drawDebugOverlay(ctx);
        }

        // Draw crosshair at cursor position (only in normal mode)
        if (!this.isDevMode) {
            this.drawCrosshair(ctx);
        }

        // Draw muzzle flash if firing
        if (this.fireCooldown > this.FIRE_COOLDOWN_TIME * 0.5) {
            this.drawMuzzleFlash(ctx);
        }

        // Draw damage visual effects (only during gameplay)
        if (this.isRoundActive && !this.isDevMode) {
            this.drawDamageEffects(ctx);
        }

        ctx.restore();
    }

    drawDamageEffects(ctx) {
        // Draw screen-wide red flash when taking damage
        if (this.damageFlashTimer > 0) {
            const flashIntensity = this.damageFlashTimer / this.DAMAGE_FLASH_DURATION;
            const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
            const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;

            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity * 0.4})`;
            ctx.fillRect(0, 0, nativeWidth, nativeHeight);
            ctx.restore();
        }

        // Draw directional damage indicators
        this.damageIndicators.forEach(indicator => {
            this.drawDamageIndicator(ctx, indicator);
        });

        // Draw screen blood splatters
        this.screenBloodSplatters.forEach(splatter => {
            this.drawBloodSplatter(ctx, splatter);
        });
    }

    drawDamageIndicator(ctx, indicator) {
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;
        const centerX = nativeWidth / 2;
        const centerY = nativeHeight / 2;
        const radius = Math.min(nativeWidth, nativeHeight) * 0.35;

        // Calculate position on screen edge based on angle
        const indicatorX = centerX + Math.cos(indicator.angle) * radius;
        const indicatorY = centerY + Math.sin(indicator.angle) * radius;

        // Fade out as timer decreases
        const alpha = indicator.timer / indicator.maxTimer;

        ctx.save();
        ctx.translate(indicatorX, indicatorY);
        ctx.rotate(indicator.angle);

        // Draw arrow pointing to damage source
        ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 2;

        // Arrow shape
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Red glow around arrow
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10 * alpha;
        ctx.fill();

        ctx.restore();
    }

    drawBloodSplatter(ctx, splatter) {
        const alpha = (splatter.timer / splatter.maxTimer) * splatter.opacity;

        ctx.save();
        ctx.translate(splatter.x, splatter.y);
        ctx.rotate(splatter.rotation);

        // Draw blood splatter shape
        ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
        ctx.beginPath();

        // Create irregular splatter shape
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = splatter.size * (0.5 + Math.random() * 0.5);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Add some "droplets"
        ctx.fillStyle = `rgba(100, 0, 0, ${alpha * 0.8})`;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = splatter.size * (0.7 + Math.random() * 0.5);
            const size = splatter.size * 0.15;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                size, 0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    drawBackground(ctx) {
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;

        if (this.backgroundImage && this.backgroundImage.complete) {
            // Draw background image to fill the native coordinate space
            ctx.drawImage(this.backgroundImage, 0, 0, nativeWidth, nativeHeight);
        } else {
            // Fallback: draw jungle-colored background
            ctx.fillStyle = '#1a3d1a';
            ctx.fillRect(0, 0, nativeWidth, nativeHeight);
        }
    }

    drawCrosshair(ctx) {
        const x = this.cursorPosition.x;
        const y = this.cursorPosition.y;
        const size = this.crosshairSize;
        const halfSize = size / 2;

        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;

        // Draw crosshair lines
        ctx.beginPath();
        // Top
        ctx.moveTo(x, y - halfSize - 5);
        ctx.lineTo(x, y - 5);
        // Bottom
        ctx.moveTo(x, y + 5);
        ctx.lineTo(x, y + halfSize + 5);
        // Left
        ctx.moveTo(x - halfSize - 5, y);
        ctx.lineTo(x - 5, y);
        // Right
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + halfSize + 5, y);
        ctx.stroke();

        // Draw center dot
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawMuzzleFlash(ctx) {
        const x = this.cursorPosition.x;
        const y = this.cursorPosition.y;

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 100, ${0.8 * (this.fireCooldown / this.FIRE_COOLDOWN_TIME)})`;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // High score persistence
    loadHighScores() {
        try {
            const saved = localStorage.getItem('raccoonPlatoon_shootoutHighScores');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Handle migration from old format
                if (typeof parsed === 'number') {
                    return { [CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK]: parsed };
                }
                return parsed;
            }
            // Check for really old single score format
            const oldSaved = localStorage.getItem('raccoonPlatoon_shootoutHighScore');
            if (oldSaved) {
                return { [CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK]: parseInt(oldSaved, 10) };
            }
            return {};
        } catch (e) {
            return {};
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('raccoonPlatoon_shootoutHighScores', JSON.stringify(this.highScores));
        } catch (e) {
            // Ignore storage errors
        }
    }

    reset() {
        this.isRoundActive = false;
        this.playerHealth = this.maxPlayerHealth;
        this.isPlayerAlive = true;
        this.score = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsKilled = 0;
        this.timeRemaining = this.roundDuration;

        // Reset damage tracking
        this.totalDamageTaken = 0;
        this.damagePenalty = 0;

        // Clear blood stains from previous round
        this.bloodStains = [];

        // Clear falling droplets
        this.fallingDroplets = [];

        // Clear any active bullets
        this.bullets = [];

        if (this.spawner) {
            this.spawner.reset();
        }
    }

    // ============ DEV MODE / DEBUG METHODS ============

    enableDevMode() {
        this.isDevMode = true;
        this.isAddSpawnMode = false;
        this.initializeEditablePositions();
    }

    disableDevMode() {
        this.isDevMode = false;
        this.isAddSpawnMode = false;
        this.isDragging = false;
        this.draggedSpawnIndex = -1;
        this.selectedSpawnIndex = -1;
    }

    toggleDevMode() {
        if (this.isDevMode) {
            this.disableDevMode();
        } else {
            this.enableDevMode();
        }
        return this.isDevMode;
    }

    toggleAddSpawnMode() {
        if (!this.isDevMode) return false;
        this.isAddSpawnMode = !this.isAddSpawnMode;
        // When entering add mode, deselect current spawn
        if (this.isAddSpawnMode) {
            this.selectedSpawnIndex = -1;
            if (this.game && this.game.ui) {
                this.game.ui.updateSpawnPropertiesPanel(-1);
            }
        }
        return this.isAddSpawnMode;
    }

    addSpawnAtPosition(screenX, screenY) {
        if (!this.isDevMode) return null;

        const scales = this.getScaleFactors();
        const nativeX = screenX / scales.x;
        const nativeY = screenY / scales.y;

        const defaultConfigs = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS;
        const newPos = this.addSpawnPosition({
            x: Math.round(nativeX),
            y: Math.round(nativeY),
            peekDirection: 'right',
            enemyConfigs: JSON.parse(JSON.stringify(defaultConfigs)) // Deep copy defaults
        });

        // Exit add mode after adding
        this.isAddSpawnMode = false;

        // Select the newly created spawn
        if (newPos) {
            this.selectedSpawnIndex = newPos.id;
            if (this.game && this.game.ui) {
                this.game.ui.updateSpawnPropertiesPanel(newPos.id);
            }
        }

        return newPos;
    }

    initializeEditablePositions() {
        // Copy spawn positions from config for editing based on CURRENT background
        const bgKey = this.currentBackgroundKey;
        const positions = CONFIG.SHOOTOUT_MODE.BACKGROUNDS[bgKey].TREE_SPAWN_POSITIONS;
        // If we have a spawner, update its positions
        if (this.spawner && CONFIG.SHOOTOUT_MODE.BACKGROUNDS[this.currentBackgroundKey].TREE_SPAWN_POSITIONS) {
            this.spawner.setTreePositions(CONFIG.SHOOTOUT_MODE.BACKGROUNDS[this.currentBackgroundKey].TREE_SPAWN_POSITIONS);
        }
        // Deep copy and migrate so we don't modify config directly
        this.editableSpawnPositions = positions.map((pos, index) => this.migratePositionToNewFormat({
            ...pos,
            id: index
        }));
    }

    migratePositionToNewFormat(pos) {
        // Already migrated (new format with enemyConfigs)
        if (pos.enemyConfigs) {
            return pos;
        }

        // Migrate from old format (allowedEnemyTypes with shared offset/scale)
        const oldTypes = pos.allowedEnemyTypes || ['grunt'];
        const defaultConfigs = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS;
        const enemyConfigs = {};

        Object.keys(defaultConfigs).forEach(type => {
            const wasEnabled = oldTypes.includes(type);
            enemyConfigs[type] = {
                enabled: wasEnabled,
                weight: wasEnabled ? Math.floor(100 / oldTypes.length) : 0,
                peekOffset: pos.peekOffset || defaultConfigs[type].peekOffset,
                scale: pos.scale || defaultConfigs[type].scale,
                showInDevMode: true
            };
        });

        return {
            id: pos.id,
            x: pos.x,
            y: pos.y,
            peekDirection: pos.peekDirection || 'right',
            enemyConfigs
        };
    }

    handleDevModeMouseDown(screenX, screenY) {
        if (!this.isDevMode) return false;

        const scales = this.getScaleFactors();
        const nativeX = screenX / scales.x;
        const nativeY = screenY / scales.y;

        // If in add spawn mode, add a new spawn at this position
        if (this.isAddSpawnMode) {
            this.addSpawnAtPosition(screenX, screenY);
            return true; // Handled
        }

        // Check if clicking on a spawn point
        const boxSize = CONFIG.SHOOTOUT_MODE.DEBUG_SPAWN_AREA_SIZE;
        const halfBox = boxSize / 2;

        for (let i = 0; i < this.editableSpawnPositions.length; i++) {
            const pos = this.editableSpawnPositions[i];
            if (nativeX >= pos.x - halfBox &&
                nativeX <= pos.x + halfBox &&
                nativeY >= pos.y - halfBox &&
                nativeY <= pos.y + halfBox) {

                this.isDragging = true;
                this.draggedSpawnIndex = i;
                this.selectedSpawnIndex = i;
                this.dragOffset = {
                    x: nativeX - pos.x,
                    y: nativeY - pos.y
                };

                // Update the properties panel in UI
                if (this.game && this.game.ui) {
                    this.game.ui.updateSpawnPropertiesPanel(i);
                }

                return true; // Handled
            }
        }

        // Clicked outside, deselect
        this.selectedSpawnIndex = -1;

        // Hide properties panel
        if (this.game && this.game.ui) {
            this.game.ui.updateSpawnPropertiesPanel(-1);
        }

        return false;
    }

    handleDevModeMouseMove(screenX, screenY) {
        if (!this.isDevMode || !this.isDragging || this.draggedSpawnIndex === -1) {
            return false;
        }

        const scales = this.getScaleFactors();
        const nativeX = screenX / scales.x;
        const nativeY = screenY / scales.y;

        // Update the dragged position
        const pos = this.editableSpawnPositions[this.draggedSpawnIndex];
        pos.x = Math.round(nativeX - this.dragOffset.x);
        pos.y = Math.round(nativeY - this.dragOffset.y);

        // Update the coordinates in the properties panel
        if (this.game && this.game.ui) {
            this.game.ui.updateSpawnCoordinates(pos.x, pos.y);
        }

        return true; // Handled
    }

    handleDevModeMouseUp() {
        if (!this.isDevMode) return false;

        const wasDragging = this.isDragging;
        this.isDragging = false;
        this.draggedSpawnIndex = -1;
        return wasDragging;
    }

    drawDebugOverlay(ctx) {
        if (!this.isDevMode) return;

        const boxSize = CONFIG.SHOOTOUT_MODE.DEBUG_SPAWN_AREA_SIZE;
        const halfBox = boxSize / 2;

        ctx.save();

        // Draw each spawn position
        this.editableSpawnPositions.forEach((pos, index) => {
            const isSelected = index === this.selectedSpawnIndex;
            const isDragging = index === this.draggedSpawnIndex && this.isDragging;

            // Draw box around spawn area
            ctx.fillStyle = isSelected
                ? 'rgba(0, 255, 255, 0.4)' // Cyan when selected
                : CONFIG.SHOOTOUT_MODE.DEBUG_SPAWN_AREA_COLOR;

            if (isDragging) {
                ctx.fillStyle = 'rgba(255, 165, 0, 0.5)'; // Orange when dragging
            }

            ctx.fillRect(pos.x - halfBox, pos.y - halfBox, boxSize, boxSize);

            // Draw border
            ctx.strokeStyle = isSelected ? '#00FFFF' : '#FFFF00';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(pos.x - halfBox, pos.y - halfBox, boxSize, boxSize);

            // Draw peek direction line
            this.drawPeekDirectionLine(ctx, pos);

            // Draw coordinate text
            this.drawCoordinateText(ctx, pos, index);
        });

        // Draw "Add Spawn Mode" indicator overlay
        if (this.isAddSpawnMode) {
            this.drawAddSpawnModeOverlay(ctx);
        }

        ctx.restore();
    }

    drawAddSpawnModeOverlay(ctx) {
        const nativeWidth = CONFIG.SHOOTOUT_MODE.NATIVE_WIDTH || 1920;
        const nativeHeight = CONFIG.SHOOTOUT_MODE.NATIVE_HEIGHT || 1080;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 100, 0, 0.15)';
        ctx.fillRect(0, 0, nativeWidth, nativeHeight);

        // Draw border around canvas
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(10, 10, nativeWidth - 20, nativeHeight - 20);
        ctx.setLineDash([]);

        // Draw "ADD SPAWN MODE" text at top
        ctx.font = 'bold 24px "Black Ops One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('ADD SPAWN MODE', nativeWidth / 2 + 2, 22);

        // Text
        ctx.fillStyle = '#00FF00';
        ctx.fillText('ADD SPAWN MODE', nativeWidth / 2, 20);

        // Draw instruction text
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillStyle = '#CCFFCC';
        ctx.fillText('Click anywhere on the canvas to add a new spawn point', nativeWidth / 2, 50);
    }

    drawPeekDirectionLine(ctx, pos) {
        // Draw a preview for each enabled enemy type at its specific offset
        const enemyTypes = CONFIG.SHOOTOUT_MODE.ENEMY_TYPES;
        const baseDirection = pos.peekDirection || 'right';

        // Safety check to prevent crash if enemyConfigs is missing (e.g. during adding)
        if (!pos.enemyConfigs) {
            return;
        }

        Object.entries(pos.enemyConfigs).forEach(([type, config]) => {
            // Skip if not enabled or if showInDevMode is explicitly false
            if (!config.enabled || config.showInDevMode === false) {
                return;
            }

            // Calculate peek position based on enemy-specific offset
            const offset = config.peekOffset;
            let peekX = pos.x;
            let peekY = pos.y;

            switch (baseDirection) {
                case 'left':
                    peekX -= offset;
                    break;
                case 'right':
                    peekX += offset;
                    break;
                case 'up':
                    peekY -= offset;
                    break;
                case 'down':
                    peekY += offset;
                    break;
            }

            // Draw dashed line from spawn to peek position (color-coded by enemy type)
            const typeColor = enemyTypes[type]?.color || '#FFFFFF';
            ctx.strokeStyle = typeColor;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(peekX, peekY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            // Draw enemy sprite preview at peek position
            this.drawEnemyPreviewAtPeek(ctx, peekX, peekY, type, config);
        });
    }

    drawPossumPreviewAtPeek(ctx, peekX, peekY, pos) {
        // Get tilesheet configuration
        const tilesheetConfig = CONFIG.SHOOTOUT_MODE?.ENEMY_TILESHEET;
        if (!tilesheetConfig) return;

        const path = tilesheetConfig.PATH;

        // Get or load the tilesheet image
        let image = this.game.preloadedImages[path];

        // If not preloaded, try to load it on-demand
        if (!image) {
            // Start loading the image if not already attempted
            if (!this._tilesheetLoading) {
                this._tilesheetLoading = true;
                img.onload = () => {
                    this.game.preloadedImages[path] = img;
                    this._tilesheetLoading = false;
                    // Trigger a re-render to show the loaded image
                    if (this.isDevMode && this.game) {
                        this.game.render();
                    }
                };
                img.onerror = () => {
                    this.game.preloadedImages[path] = null;
                    this._tilesheetLoading = false;
                };
                img.src = path;
            }

            // Fallback: draw a placeholder
            this.drawPossumPreviewFallback(ctx, peekX, peekY, pos);
            return;
        }

        // If image is still loading (not complete yet)
        if (!image.complete) {
            this.drawPossumPreviewFallback(ctx, peekX, peekY, pos);
            return;
        }

        // Frame 1 is the peeking/shooting frame
        const frameIndex = 1;
        const frameWidth = tilesheetConfig.FRAME_WIDTH;
        const frameHeight = tilesheetConfig.FRAME_HEIGHT;
        const sourceX = frameIndex * frameWidth;
        const sourceY = 0;

        // Calculate render size with scale
        const baseScale = (tilesheetConfig.TILE_SCALE || 0.5) * (pos.scale || 1.0);
        const renderWidth = frameWidth * baseScale;
        const renderHeight = frameHeight * baseScale;

        // Calculate draw position (centered on peek position)
        const drawX = peekX - renderWidth / 2;
        const drawY = peekY - renderHeight / 2;

        // Draw the sprite with semi-transparency to indicate it's a preview
        ctx.save();
        ctx.globalAlpha = 0.7;

        // Draw the sprite from tilesheet
        ctx.drawImage(
            image,
            sourceX, sourceY, frameWidth, frameHeight,
            drawX, drawY, renderWidth, renderHeight
        );

        ctx.restore();

        // Draw a subtle border around the sprite
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, renderWidth, renderHeight);
    }

    drawEnemyPreviewAtPeek(ctx, peekX, peekY, enemyType, config) {
        // Get tilesheet configuration for this enemy type
        const enemyTypeDef = CONFIG.SHOOTOUT_MODE.ENEMY_TYPES[enemyType];
        const tilesheetConfigKey = enemyTypeDef?.tilesheetKey || 'ENEMY_TILESHEET';
        const tilesheetConfig = CONFIG.SHOOTOUT_MODE[tilesheetConfigKey];
        if (!tilesheetConfig) {
//            console.warn(`[drawEnemyPreviewAtPeek] No tilesheet config for ${enemyType}`);
            return;
        }

        const path = tilesheetConfig.PATH;
        let image = this.game.preloadedImages[path];

        // If not preloaded, try to load on-demand
        if (!image || !image.complete) {
            // Start loading the image
            if (!this._loadingTilesheets) {
                this._loadingTilesheets = {};
            }
            if (!this._loadingTilesheets[path]) {
                this._loadingTilesheets[path] = true;
                const img = new Image();
                img.onload = () => {
                    this.game.preloadedImages[path] = img;
                    this._loadingTilesheets[path] = false;
                    // Trigger re-render to show loaded image
                    if (this.isDevMode && this.game) {
                        this.game.render();
                    }
                };
                img.onerror = () => {
                    this.game.preloadedImages[path] = null;
                    this._loadingTilesheets[path] = false;
                };
                img.src = path;
            }
            // Draw fallback while loading
            this.drawEnemyPreviewFallback(ctx, peekX, peekY, enemyType, config);
            return;
        }

        // Frame 1 is the peeking/aiming frame
        const frameIndex = 1;
        const frameWidth = tilesheetConfig.FRAME_WIDTH;
        const frameHeight = tilesheetConfig.FRAME_HEIGHT;
        const sourceX = frameIndex * frameWidth;
        const sourceY = 0;

        // Calculate render size with enemy-specific scale
        const baseScale = (tilesheetConfig.TILE_SCALE || 0.5) * (config.scale || 1.0);
        const renderWidth = frameWidth * baseScale;
        const renderHeight = frameHeight * baseScale;

        // Calculate draw position (centered on peek position)
        const drawX = peekX - renderWidth / 2;
        const drawY = peekY - renderHeight / 2;

        // Draw the sprite with semi-transparency to indicate it's a preview
        ctx.save();
        ctx.globalAlpha = 0.7;

        ctx.drawImage(
            image,
            sourceX, sourceY, frameWidth, frameHeight,
            drawX, drawY, renderWidth, renderHeight
        );

        ctx.restore();

        // Draw a subtle border around the sprite (color-coded by enemy type)
        ctx.strokeStyle = enemyTypeDef?.color || 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, renderWidth, renderHeight);
    }

    drawEnemyPreviewFallback(ctx, peekX, peekY, enemyType, config) {
        // Draw a highly visible placeholder when image is not loaded
        const scale = config.scale || 1.0;
        const size = 25 * scale;
        const enemyTypeDef = CONFIG.SHOOTOUT_MODE.ENEMY_TYPES[enemyType];
        const color = enemyTypeDef?.color || '#FF0000';

        // Draw filled circle
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(peekX, peekY, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1.0;
        ctx.stroke();

        // Draw X mark
        ctx.beginPath();
        ctx.moveTo(peekX - size / 2, peekY - size / 2);
        ctx.lineTo(peekX + size / 2, peekY + size / 2);
        ctx.moveTo(peekX + size / 2, peekY - size / 2);
        ctx.lineTo(peekX - size / 2, peekY + size / 2);
        ctx.stroke();

        // Draw enemy type label with background
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        const label = enemyType.toUpperCase();
        const textY = peekY + size + 15;

        // Text background
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(peekX - textWidth / 2 - 4, textY - 10, textWidth + 8, 14);

        // Text
        ctx.fillStyle = color;
        ctx.fillText(label, peekX, textY);
    }

    drawCoordinateText(ctx, pos, index) {
        // Text labels removed for cleaner Dev Mode UI as info is in the side panel
    }

    getSpawnPositionsAsJSON() {
        const defaultConfigs = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS;
        const exportData = this.editableSpawnPositions.map(pos => {
            const enemyConfigs = {};
            Object.keys(pos.enemyConfigs).forEach(type => {
                const config = pos.enemyConfigs[type];
                enemyConfigs[type] = {
                    enabled: config.enabled,
                    weight: config.weight,
                    peekOffset: config.peekOffset,
                    scale: config.scale,
                    showInDevMode: config.showInDevMode
                };
            });
            return {
                x: pos.x,
                y: pos.y,
                peekDirection: pos.peekDirection,
                enemyConfigs
            };
        });

        return JSON.stringify(exportData);
    }

    getEditableSpawnPositions() {
        return this.editableSpawnPositions;
    }

    setEditableSpawnPositions(positions) {
        this.editableSpawnPositions = positions.map((pos, index) => this.migratePositionToNewFormat({
            ...pos,
            id: index
        }));
    }

    updateSpawnPosition(index, updates) {
        if (index >= 0 && index < this.editableSpawnPositions.length) {
            Object.assign(this.editableSpawnPositions[index], updates);
        }
    }

    addSpawnPosition(pos) {
        // Ensure new position is migrated to latest format
        const migratedPos = this.migratePositionToNewFormat({
            ...pos,
            id: this.editableSpawnPositions.length
        });

        this.editableSpawnPositions.push(migratedPos);
        return migratedPos;
    }

    removeSpawnPosition(index) {
        if (index >= 0 && index < this.editableSpawnPositions.length) {
            this.editableSpawnPositions.splice(index, 1);
            // Re-index
            this.editableSpawnPositions.forEach((pos, i) => pos.id = i);
            if (this.selectedSpawnIndex === index) {
                this.selectedSpawnIndex = -1;
            }
        }
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShootoutController;
}