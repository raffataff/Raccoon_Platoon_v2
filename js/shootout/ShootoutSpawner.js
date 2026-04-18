// js/shootout/ShootoutSpawner.js
// Manages spawning and positioning of shootout targets

class ShootoutSpawner {
    constructor(game) {
        this.game = game;
        this.activeTargets = [];
        this.treePositions = [];
        this.maxConcurrentTargets = CONFIG.SHOOTOUT_MODE.MAX_CONCURRENT_TARGETS;
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.SHOOTOUT_MODE.INITIAL_SPAWN_INTERVAL;
        this.difficultyMultiplier = 1.0;
        this.timeSinceLastDifficultyIncrease = 0;

        this.loadTreePositionsFromConfig();
    }

    loadTreePositionsFromConfig(backgroundKey = null) {
        // Use provided key or fall back to default
        const bgKey = backgroundKey || CONFIG.SHOOTOUT_MODE.DEFAULT_BACKGROUND;
        const positions = CONFIG.SHOOTOUT_MODE.BACKGROUNDS[bgKey].TREE_SPAWN_POSITIONS;

        if (positions && positions.length > 0) {
            this.treePositions = positions.map(pos => this.migrateSpawnPosition(pos));
        }
    }

    migrateSpawnPosition(pos) {
        const defaultConfigs = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS;
        const enemyConfigs = {};

        // Get existing type configs or start from defaults
        const sourceConfigs = pos.enemyConfigs || {};

        Object.keys(defaultConfigs).forEach(type => {
            const existing = sourceConfigs[type] || {};
            enemyConfigs[type] = {
                ...defaultConfigs[type],
                ...existing
            };
        });

        // If from old format (allowedEnemyTypes), handle 'enabled' and 'weight'
        if (!pos.enemyConfigs) {
            const oldTypes = pos.allowedEnemyTypes || ['grunt'];
            Object.keys(enemyConfigs).forEach(type => {
                const wasEnabled = oldTypes.includes(type);
                enemyConfigs[type].enabled = wasEnabled;
                enemyConfigs[type].weight = wasEnabled ? Math.floor(100 / oldTypes.length) : 0;
                // Old positions might have had these at the top level
                if (pos.peekOffset) enemyConfigs[type].peekOffset = pos.peekOffset;
                if (pos.scale) enemyConfigs[type].scale = pos.scale;
            });
        }

        return {
            x: pos.x,
            y: pos.y,
            peekDirection: pos.peekDirection || 'right',
            enemyConfigs,
            occupied: false
        };
    }

    setTreePositions(positions) {
        // Set custom tree positions (used for dev mode edited positions)
        if (positions && positions.length > 0) {
            this.treePositions = positions.map(pos => this.migrateSpawnPosition(pos));
        }
    }

    update(deltaTime) {
        // Update difficulty over time
        this.timeSinceLastDifficultyIncrease += deltaTime;
        if (this.timeSinceLastDifficultyIncrease >= CONFIG.SHOOTOUT_MODE.DIFFICULTY_INCREASE_INTERVAL) {
            this.increaseDifficulty();
            this.timeSinceLastDifficultyIncrease = 0;
        }

        // Update spawn timer
        this.spawnTimer -= deltaTime;

        // Spawn new target if conditions are met
        if (this.spawnTimer <= 0 && this.activeTargets.length < this.maxConcurrentTargets) {
            this.spawnTarget();
            this.spawnTimer = this.spawnInterval;
        }

        // Update all active targets
        for (let i = this.activeTargets.length - 1; i >= 0; i--) {
            const target = this.activeTargets[i];
            target.update(deltaTime);

            // Remove dead targets
            if (target.isMarkedForDeletion) {
                this.removeTarget(target);
            }
        }
    }

    spawnTarget() {
        // Find available tree positions (not occupied and no active target using it)
        const availablePositions = this.treePositions.filter(pos => {
            // Check if any active target is using this position
            const inUse = this.activeTargets.some(target =>
                target.treePosition.x === pos.x && target.treePosition.y === pos.y
            );
            return !inUse;
        });

        if (availablePositions.length === 0) return;

        // Pick random position
        const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];

        // Select enemy type using weighted random selection
        const enemyType = this.selectEnemyTypeByWeight(position.enemyConfigs);
        const enemyConfig = position.enemyConfigs[enemyType];

        // Create spawn data with enemy-specific settings
        const spawnData = {
            x: position.x,
            y: position.y,
            peekDirection: position.peekDirection,
            peekOffset: enemyConfig.peekOffset,
            scale: enemyConfig.scale
        };

        // Create new target with selected enemy type
        const target = new ShootoutTarget(spawnData, this.game, null, enemyType);
        this.activeTargets.push(target);

        // Add to game's enemy list for rendering and collision
        if (this.game.enemies) {
            this.game.enemies.push(target);
        }
    }

    selectEnemyTypeByWeight(enemyConfigs) {
        // Get enabled enemies with their weights
        const enabled = Object.entries(enemyConfigs)
            .filter(([type, config]) => config.enabled)
            .map(([type, config]) => ({ type, weight: config.weight }));

        if (enabled.length === 0) return 'grunt'; // Fallback
        if (enabled.length === 1) return enabled[0].type;

        // Calculate total weight
        const totalWeight = enabled.reduce((sum, e) => sum + e.weight, 0);
        if (totalWeight <= 0) return enabled[0].type;

        // Weighted random selection
        let random = Math.random() * totalWeight;
        for (const enemy of enabled) {
            random -= enemy.weight;
            if (random <= 0) return enemy.type;
        }

        return enabled[enabled.length - 1].type;
    }

    removeTarget(target) {
        const index = this.activeTargets.indexOf(target);
        if (index > -1) {
            this.activeTargets.splice(index, 1);
        }

        // Also remove from game's enemy list
        if (this.game.enemies) {
            const enemyIndex = this.game.enemies.indexOf(target);
            if (enemyIndex > -1) {
                this.game.enemies.splice(enemyIndex, 1);
            }
        }
    }

    increaseDifficulty() {
        // Increase difficulty by reducing spawn interval
        this.spawnInterval *= CONFIG.SHOOTOUT_MODE.DIFFICULTY_INCREASE_RATE;
        this.spawnInterval = Math.max(
            this.spawnInterval,
            CONFIG.SHOOTOUT_MODE.MIN_SPAWN_INTERVAL
        );

        // Cap max concurrent targets
        this.maxConcurrentTargets = Math.min(
            this.maxConcurrentTargets + 0.5,
            CONFIG.SHOOTOUT_MODE.MAX_CONCURRENT_TARGETS + 2
        );
    }

    getAllTargets() {
        return this.activeTargets;
    }

    getVisibleTargets() {
        return this.activeTargets.filter(target => target.isVisible());
    }

    reset() {
        // Clear all active targets
        this.activeTargets = [];
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.SHOOTOUT_MODE.INITIAL_SPAWN_INTERVAL;
        this.difficultyMultiplier = 1.0;
        this.timeSinceLastDifficultyIncrease = 0;
    }

    // Check if a shot hits any target
    checkHit(worldX, worldY) {
        // Only check visible targets
        const visibleTargets = this.getVisibleTargets();

        for (const target of visibleTargets) {
            const hitbox = target.getHitbox();

            if (worldX >= hitbox.x &&
                worldX <= hitbox.x + hitbox.width &&
                worldY >= hitbox.y &&
                worldY <= hitbox.y + hitbox.height) {
                return target;
            }
        }

        return null;
    }

    // Render all active targets
    render(ctx) {
        for (const target of this.activeTargets) {
            target.render(ctx);
        }
    }

    // Get count of targets in each state (for debugging)
    getStateCounts() {
        const counts = { HIDDEN: 0, PEEKING: 0, AIMING: 0, SHOOTING: 0, HIT: 0, DEAD: 0 };
        for (const target of this.activeTargets) {
            counts[target.currentState]++;
        }
        return counts;
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShootoutSpawner;
}