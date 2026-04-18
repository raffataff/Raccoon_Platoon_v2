// js/shootout/ShootoutTarget.js
// Possum enemy for Shootout Mode with peek behavior

class ShootoutTarget extends Unit {
    // Static debug flag to toggle hitbox visibility
    static DEBUG_SHOW_HITBOX = false;

    // Hitbox size multiplier - increase this to make hitboxes larger
    static HITBOX_SIZE_MULTIPLIER = 2.5;

    constructor(treePosition, game, id, enemyType = 'grunt') {
        // Use different stats based on enemy type (must be determined before super())
        const hp = enemyType === 'heavy' ? CONFIG.POSSUM_HEAVY_HP : CONFIG.POSSUM_GRUNT_HP;
        const size = enemyType === 'heavy' ? CONFIG.POSSUM_HEAVY_SIZE : CONFIG.POSSUM_GRUNT_SIZE;
        const color = enemyType === 'heavy' ? CONFIG.POSSUM_HEAVY_COLOR : CONFIG.POSSUM_GRUNT_COLOR;

        // Possums in shootout mode face south (toward player)
        // Start hidden behind tree
        super(
            treePosition.x,
            treePosition.y,
            game,
            'enemy',
            hp,
            0, // No movement speed
            size,
            color,
            id
        );

        this.enemyType = enemyType; // 'grunt' or 'heavy'

        // Use different weapons based on enemy type
        this.weaponName = enemyType === 'heavy' ? 
            (CONFIG.SHOOTOUT_HEAVY_DEFAULT_WEAPON || 'POSSUM_HEAVY_WEAPON') : 
            (CONFIG.SHOOTOUT_GRUNT_DEFAULT_WEAPON || 'POSSUM_RIFLE');

        // Tree position (hidden position)
        this.treePosition = { x: treePosition.x, y: treePosition.y };
        this.peekDirection = treePosition.peekDirection || 'right';
        this.peekOffset = treePosition.peekOffset || 40;
        this.scale = treePosition.scale || 1.0;

        // bulletOffset from enemy type config (global, not per-spawn-position)
        const defaultBulletOffset = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS[enemyType]?.bulletOffset || { x: 5, y: 20 };
        this.bulletOffset = treePosition.bulletOffset || defaultBulletOffset;

        // Calculate peek position based on direction
        this.peekPosition = this.calculatePeekPosition();

        // State machine
        this.currentState = 'HIDDEN'; // HIDDEN, PEEKING, AIMING, SHOOTING, HIT, DEAD
        this.stateTimer = 0;

        // Peek behavior
        this.peekDuration = CONFIG.SHOOTOUT_MODE.PEEK_DURATION_BASE +
            Math.random() * CONFIG.SHOOTOUT_MODE.PEEK_DURATION_RANDOM;
        this.reactionTime = CONFIG.SHOOTOUT_MODE.REACTION_TIME_BASE +
            Math.random() * CONFIG.SHOOTOUT_MODE.REACTION_TIME_RANDOM;

        // Shooting - New telegraphed attack system
        this.hasFired = false;
        this.fireCooldown = 0;

        // Warning system (configurable duration before shooting)
        this.warningTimer = 0;
        this.showWarning = false;

        // Note: Bullets are now managed by ShootoutController to persist after enemy death

        // Visuals - always face south (toward player)
        this.facingAngle = Math.PI / 2; // South
        this.gunAimAngle = Math.PI / 2;

        // Hit/death tracking
        this.isHit = false;
        this.hitTimer = 0;

        // Random delay before first peek
        this.hiddenTimer = Math.random() * 2.0;

        // Advanced Stats Tracking
        this.visibleStartTime = null; // Set when first becomes visible
        this.firstHitTime = null;    // Set when first hit
    }

    calculatePeekPosition() {
        let peekX = this.treePosition.x;
        let peekY = this.treePosition.y;

        switch (this.peekDirection) {
            case 'left':
                peekX -= this.peekOffset;
                break;
            case 'right':
                peekX += this.peekOffset;
                break;
            case 'up':
                peekY -= this.peekOffset;
                break;
        }

        return { x: peekX, y: peekY };
    }

    update(deltaTime) {
        if (this.currentState === 'DEAD') return;
        if (this.currentState === 'HIT') {
            this.hitTimer -= deltaTime;
            if (this.hitTimer <= 0) {
                this.currentState = 'DEAD';
                this.isMarkedForDeletion = true;
            }
            return;
        }

        // Update cooldowns
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }

        // State machine
        switch (this.currentState) {
            case 'HIDDEN':
                this.updateHidden(deltaTime);
                break;
            case 'PEEKING':
                this.updatePeeking(deltaTime);
                break;
            case 'AIMING':
                this.updateAiming(deltaTime);
                break;
            case 'SHOOTING':
                this.updateShooting(deltaTime);
                break;
        }

        // Update position based on state
        this.updatePosition(deltaTime);

        // Track visibility for reaction time calculation
        if (this.visibleStartTime === null && this.isVisible()) {
            this.visibleStartTime = performance.now();
        }

        // Always face south toward player
        this.facingAngle = Math.PI / 2;
        this.gunAimAngle = Math.PI / 2;
    }

    updateHidden(deltaTime) {
        this.hiddenTimer -= deltaTime;

        if (this.hiddenTimer <= 0) {
            this.peek();
        }
    }

    updatePeeking(deltaTime) {
        this.stateTimer -= deltaTime;

        // Check if it's time to start aiming (warning phase)
        const timePeeking = (CONFIG.SHOOTOUT_MODE.PEEK_DURATION_BASE +
            Math.random() * CONFIG.SHOOTOUT_MODE.PEEK_DURATION_RANDOM) -
            this.stateTimer;

        if (timePeeking >= this.reactionTime && !this.hasFired && this.currentState !== 'AIMING' && this.currentState !== 'SHOOTING') {
            // Start aiming sequence with warning
            this.currentState = 'AIMING';
            this.warningTimer = CONFIG.SHOOTOUT_MODE.WARNING_DURATION;
            this.showWarning = true;
        }

        // Hide if peek duration expired
        if (this.stateTimer <= 0) {
            this.hide();
        }
    }

    updateAiming(deltaTime) {
        // Aiming phase: show warning icon and aiming sprite
        this.warningTimer -= deltaTime;
        this.showWarning = this.warningTimer > 0;

        if (this.warningTimer <= 0) {
            // Aiming complete - transition to shooting
            this.currentState = 'SHOOTING';
            this.showWarning = false;
        }

        // Hide if peek duration expired
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
            this.hide();
        }
    }

    updateShooting(deltaTime) {
        // Shooting phase: fire immediately (warning was in AIMING phase)
        if (!this.hasFired) {
            // Fire the shot immediately
            this.startVisualBulletAttack();
        }

        // After firing, decide whether to hide or shoot again
        if (this.hasFired) {
            this.stateTimer -= deltaTime;

            // Calculate travel time
            const baseTime = CONFIG.SHOOTOUT_MODE.BASE_TRAVEL_TIME;
            const scaleFactor = CONFIG.SHOOTOUT_MODE.TRAVEL_TIME_SCALE_FACTOR;
            const travelTime = baseTime / Math.max(this.scale * scaleFactor, 0.3);

            // Wait for bullet travel time plus a small buffer, then decide next action
            if (this.stateTimer <= -travelTime * 0.5) {
                // Random chance: 60% hide, 40% shoot again
                if (Math.random() < 0.6) {
                    // Hide and retreat
                    this.hide();
                } else {
                    // Continue shooting - go back to aiming for another shot
                    this.hasFired = false;
                    this.currentState = 'AIMING';
                    this.warningTimer = CONFIG.SHOOTOUT_MODE.WARNING_DURATION;
                    this.showWarning = true;
                }
            }
        }
    }

    startVisualBulletAttack() {
        this.hasFired = true;
        this.showWarning = false;

        // Add bullet to controller - it will persist even if this enemy dies
        if (this.game && this.game.shootoutController) {
            const damage = this.weapon ? this.weapon.damage : 10;
            const sfxFireKey = this.weapon ? this.weapon.sfxFireKey : null;
            this.game.shootoutController.addBullet(this.x, this.y, damage, this.scale, this.bulletOffset.x, this.bulletOffset.y, sfxFireKey);
        }
    }

    dealDamageToPlayer() {
        if (!this.game || !this.game.shootoutController) return;

        // Apply damage to player, passing the enemy's position for directional feedback
        const damage = this.weapon ? this.weapon.damage : 10;
        this.game.shootoutController.takeDamage(damage, this.x, this.y);
    }

    updatePosition(deltaTime) {
        // Smoothly interpolate position based on state
        let targetX = this.treePosition.x;
        let targetY = this.treePosition.y;

        if (this.currentState === 'PEEKING' || this.currentState === 'AIMING' || this.currentState === 'SHOOTING') {
            targetX = this.peekPosition.x;
            targetY = this.peekPosition.y;
        }

        // Lerp toward target position
        const lerpSpeed = 10 * deltaTime;
        this.x += (targetX - this.x) * lerpSpeed;
        this.y += (targetY - this.y) * lerpSpeed;
    }

    peek() {
        this.currentState = 'PEEKING';
        this.stateTimer = this.peekDuration;
        this.hasFired = false;

        // Recalculate reaction time for variety
        this.reactionTime = CONFIG.SHOOTOUT_MODE.REACTION_TIME_BASE +
            Math.random() * CONFIG.SHOOTOUT_MODE.REACTION_TIME_RANDOM;
    }

    hide() {
        this.currentState = 'HIDDEN';
        this.hiddenTimer = 1.0 + Math.random() * 2.0; // Random delay before peeking again
        this.hasFired = false;
        this.showWarning = false;
        this.warningTimer = 0;
        this.visualBullet = null;
    }

    onHit(damage) {
        if (this.currentState === 'HIT' || this.currentState === 'DEAD') return;

        // Record first hit time for reaction stats
        if (this.firstHitTime === null) {
            this.firstHitTime = performance.now();
        }

        this.hp -= damage;
        this.isHit = true;

        if (this.hp <= 0) {
            this.currentState = 'HIT';
            this.hitTimer = 0.5; // Time to show hit animation before death

            // Notify controller of kill
            if (this.game && this.game.shootoutController) {
                this.game.shootoutController.onTargetKilled(this);
            }
        } else {
            // Hit but not dead - flash and hide
            this.hide();
        }
    }

    getHitbox() {
        // Return hitbox for shooting detection
        // Apply size multiplier to make hitbox larger and more forgiving
        // Width is the base size, height is 2x width for a taller hitbox
        const offsetX = 10;
        const width = this.size * this.scale * ShootoutTarget.HITBOX_SIZE_MULTIPLIER + offsetX;
        const height = (width ) * 2; // Twice as tall as wide
        return {
            x: this.x - width / 2,
            y: this.y - height / 2,
            width: width,
            height: height
        };
    }

    getPeekProgress() {
        // Calculate how far the enemy has moved from the tree position
        // Returns 0.0 when fully hidden, 1.0 when fully peeking
        const dx = this.x - this.treePosition.x;
        const dy = this.y - this.treePosition.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        return Math.min(currentDist / this.peekOffset, 1.0);
    }

    isVisible() {
        // Target is visible based on position, not just state
        const peekProgress = this.getPeekProgress();
        const visibilityThreshold = this.getVisibilityThreshold();
        return peekProgress >= visibilityThreshold;
    }

    /**
     * Calculate the visibility threshold based on peek offset
     * Small peek offset = harder to see (higher threshold)
     * Large peek offset = easier to see (lower threshold)
     * @returns {number} The visibility threshold (0.0 - 1.0)
     */
    getVisibilityThreshold() {
        const config = CONFIG.SHOOTOUT_MODE;

        // If dynamic threshold is disabled, use static value
        if (!config.DYNAMIC_VISIBILITY_THRESHOLD) {
            return config.VISIBILITY_THRESHOLD;
        }

        // Get config values
        const minOffset = config.PEEK_OFFSET_MIN || 20;
        const maxOffset = config.PEEK_OFFSET_MAX || 200;
        const thresholdHidden = config.VISIBILITY_THRESHOLD_WHEN_HIDDEN || 0.7;
        const thresholdExposed = config.VISIBILITY_THRESHOLD_WHEN_EXPOSED || 0.3;

        // Normalize the current peek offset to 0-1 range
        const normalizedOffset = Math.max(0, Math.min(1,
            (this.peekOffset - minOffset) / (maxOffset - minOffset)
        ));

        // Linear interpolation: higher threshold when barely exposed, lower when fully exposed
        return thresholdHidden - (normalizedOffset * (thresholdHidden - thresholdExposed));
    }

    /**
     * Check if a hit at the given world coordinates is a headshot
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {boolean}
     */
    isHeadshot(worldX, worldY) {
        const hitbox = this.getHitbox();
        const headshotThreshold = CONFIG.SHOOTOUT_MODE.HEADSHOT_THRESHOLD || 0.3;
        const headTop = hitbox.y;
        const headBottom = hitbox.y + (hitbox.height * headshotThreshold);

        return worldY >= headTop && worldY <= headBottom;
    }

    render(ctx, cameraX, cameraY) {
        // Render dead enemies too (they show the dead frame from tilesheet)

        // Calculate peek progress and visibility
        const peekProgress = this.getPeekProgress();
        const visibilityThreshold = this.getVisibilityThreshold();
        const fadeZone = CONFIG.SHOOTOUT_MODE.FADE_ZONE_SIZE;

        // Calculate opacity based on peek progress
        let opacity = 1.0;
        if (peekProgress < visibilityThreshold) {
            // Below threshold - completely invisible
            opacity = 0.0;
        } else if (peekProgress < visibilityThreshold + fadeZone) {
            // In fade zone - calculate gradual opacity
            opacity = (peekProgress - visibilityThreshold) / fadeZone;
        }

        // Don't render if completely hidden
        if (opacity <= 0) return;

        // Apply opacity for gradual fade effect
        ctx.save();
        ctx.globalAlpha = opacity;

        // Render using tilesheet for all states
        this.renderTilesheet(ctx);

        // Draw warning exclamation mark
        if (this.showWarning) {
            this.drawWarning(ctx);
        }

        // Restore opacity
        ctx.restore();

        // Note: Bullets are now drawn by ShootoutController to persist after enemy death

        // Draw hitbox if debug mode is enabled (only when visible enough)
        if (ShootoutTarget.DEBUG_SHOW_HITBOX && opacity > 0.5) {
            this.drawHitbox(ctx);
        }
    }

    drawWarning(ctx) {
        // Scale warning icon with enemy scale so it stays proportional
        const scale = this.scale || 1;
        // Use a minimum scale factor of 0.5 to prevent it being too small on tiny sprites
        const scaleFactor = Math.max(scale, 0.5);

        // Draw exclamation mark above enemy
        const bounce = Math.sin(performance.now() / 100) * 3 * scaleFactor; // Bouncing animation
        const x = this.x;
        const y = this.y - (60 * scaleFactor) + bounce;

        // Draw white exclamation mark
        ctx.fillStyle = 'white';
        ctx.font = `bold ${24 * scaleFactor}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', x, y + 2 * scaleFactor);

        // Draw warning circle expanding
        const pulse = (Math.sin(performance.now() / 150) + 1) / 2; // 0 to 1
        ctx.strokeStyle = `rgba(255, 32, 32, ${0.8 - pulse * 0.5})`;
        ctx.lineWidth = 3 * scaleFactor;
        ctx.beginPath();
        ctx.arc(x, y, (10 + pulse * 15) * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawHitbox(ctx) {
        const hitbox = this.getHitbox();

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';

        // Draw hitbox rectangle
        ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

        // Draw center point
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderTilesheet(ctx) {
        // Get tilesheet configuration based on enemy type
        const tilesheetConfig = this.enemyType === 'heavy'
            ? CONFIG.SHOOTOUT_MODE?.ENEMY_HEAVY_TILESHEET
            : CONFIG.SHOOTOUT_MODE?.ENEMY_TILESHEET;
        if (!tilesheetConfig) {
            return;
        }

        // Get the tilesheet image
        let image = this.game.preloadedImages[tilesheetConfig.PATH];

        // If not preloaded, try to load on-demand (fallback)
        if (!image) {
            this._loggedMissingImage = true;

            // On-demand loading fallback - only try once
            if (!this._loadingImage && !this._loadAttempted) {
                this._loadAttempted = true;
                this._loadingImage = new Image();
                this._loadingImage.onload = () => {
                    this.game.preloadedImages[tilesheetConfig.PATH] = this._loadingImage;
                    this._loadingImage = null;
                };
                this._loadingImage.onerror = (e) => {
                    this._loadingImage = null;
                };
                this._loadingImage.src = tilesheetConfig.PATH;
            }
            return;
        }

        // Determine which frame to show
        // Frame 0: Idle (HIDDEN, PEEKING)
        // Frame 1: Aiming (AIMING state - warning shown)
        // Frame 2: Shooting (SHOOTING state)
        // Frame 3: Dead (HIT state)
        let frameIndex = 0;
        if (this.currentState === 'AIMING') {
            frameIndex = 1;
        } else if (this.currentState === 'SHOOTING') {
            frameIndex = 2;
        } else if (this.currentState === 'HIT' || this.currentState === 'DEAD') {
            frameIndex = 3;
        }

        // Calculate source rectangle from tilesheet
        const frameWidth = tilesheetConfig.FRAME_WIDTH;
        const frameHeight = tilesheetConfig.FRAME_HEIGHT;
        const sourceX = frameIndex * frameWidth;
        const sourceY = 0; // All frames in a single row

        // Calculate render size with scale
        const baseScale = (tilesheetConfig.TILE_SCALE || 0.5) * this.scale;
        const renderWidth = frameWidth * baseScale;
        const renderHeight = frameHeight * baseScale;

        // Calculate draw position (centered on unit position)
        const drawX = this.x - renderWidth / 2;
        const drawY = this.y - renderHeight / 2;

        // Draw the sprite from tilesheet
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            frameWidth,
            frameHeight,
            drawX,
            drawY,
            renderWidth,
            renderHeight
        );
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShootoutTarget;
}