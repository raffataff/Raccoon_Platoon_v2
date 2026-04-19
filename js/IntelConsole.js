// js/IntelConsole.js
class IntelConsole {
    constructor(x, y, game, id, spriteVariant = null) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.id = id;
        this.type = 'intel_console';

        // Sprite variant - randomly selected at placement time
        // Each variant can have different dimensions
        this.spriteVariant = spriteVariant;
        if (this.spriteVariant === null) {
            const variants = CONFIG.INTEL.SPRITE_FILES;
            this.spriteVariant = variants[Math.floor(Math.random() * variants.length)];
        }

        // State - HANDS-FREE: hack continues even if raccoon leaves
        this.isHacked = false;
        this.isBeingHacked = false;
        this.hackTimer = 0;
        this.hackDuration = 0;
        this.hackingRaccoon = null;
        this.spawnTimer = 0;
        this.totalSpawnedThisHack = 0;

        // Sprites - loaded from game preloaded images
        this.imageOn = null;
        this.imageOff = null;
        this._loadSprites();

        // Dimensions (will be set after sprite loading)
        this.width = 64;
        this.height = 64;

        // Interaction
        this.interactionRadius = CONFIG.INTEL.INTERACTION_RADIUS;
        this.spawnDistance = CONFIG.INTEL.SPAWN_DISTANCE;
    }

    _loadSprites() {
        if (!this.game || !this.game.preloadedImages) return;

        const onPath = CONFIG.INTEL.SPRITE_PATH + this.spriteVariant.on;
        const offPath = CONFIG.INTEL.SPRITE_PATH + this.spriteVariant.off;

        this.imageOn = this.game.preloadedImages[onPath];
        this.imageOff = this.game.preloadedImages[offPath];

        if (this.imageOn && this.imageOn.naturalWidth > 0) {
            const scale = CONFIG.INTEL.SPRITE_SCALE;
            this.width = this.imageOn.naturalWidth * scale;
            this.height = this.imageOn.naturalHeight * scale;
        }
    }

    update(deltaTime) {
        if (this.isBeingHacked && !this.isHacked) {
            this.hackTimer -= deltaTime;

            // PERIODIC ENEMY SPAWNING during hack
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.spawnEnemiesDuringHack();
                const phase = this.game.currentPhaseIndex || 0;
                const baseInterval = (CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval && CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval.initial) || 3.0;
                const decrement = (CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval && CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval.perPhaseDecrement) || 0.2;
                const minVal = (CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval && CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval.min) || 1.0;
                this.spawnTimer = Math.max(minVal, baseInterval - (phase * decrement));
            }

            if (this.hackTimer <= 0) {
                this.completeHack();
            }
        }
    }

    render(ctx) {
        if (!this.imageOn || !this.imageOff) {
            this._loadSprites();
        }

        const sprite = this.isHacked ? this.imageOff : this.imageOn;
        if (sprite && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback - draw placeholder rectangle
            ctx.fillStyle = this.isHacked ? '#333333' : '#4A90D9';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#00FF00';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // Draw hack progress bar if being hacked
        if (this.isBeingHacked && !this.isHacked) {
            const progress = 1 - (this.hackTimer / this.hackDuration);
            const barWidth = 60;
            const barHeight = 8;
            const barX = this.x + (this.width - barWidth) / 2;
            const barY = this.y - 20;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(barX, barY, barWidth * Math.max(0, progress), barHeight);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Draw "HACKING..." text
            ctx.font = "bold 12px 'Consolas'";
            ctx.fillStyle = '#00FF00';
            ctx.textAlign = 'center';
            ctx.fillText("HACKING", this.x + this.width / 2, this.y - 25);
        }

        // Draw "Press E to Hack" prompt if raccoon is nearby and not hacked
        if (!this.isHacked && !this.isBeingHacked) {
            const nearbyRaccoon = this.getNearestRaccoonInRange();
            if (nearbyRaccoon) {
                ctx.font = "bold 14px 'Consolas'";
                ctx.fillStyle = '#00FF00';
                ctx.textAlign = 'center';
                ctx.shadowColor = "rgba(0,0,0,0.9)";
                ctx.shadowBlur = 4;
                ctx.fillText("Press E to Hack", this.x + this.width / 2, this.y - 25);
                ctx.shadowBlur = 0;
            }
        }
    }

    startHack(raccoon, duration) {
        this.isBeingHacked = true;
        this.hackingRaccoon = raccoon;
        this.hackTimer = duration;
        this.hackDuration = duration;
        this.totalSpawnedThisHack = 0;

        // Set initial spawn timer
        const baseInterval = (CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval && CAMPAIGN_RULES.BASE_PARAMETERS.intelSpawnInterval.initial) || 3.0;
        this.spawnTimer = baseInterval;
    }

    completeHack() {
        console.log(`[INTEL HACK] Hack complete on console ${this.id}! Total enemies spawned: ${this.totalSpawnedThisHack}`);
        this.isHacked = true;
        this.isBeingHacked = false;
        this.hackingRaccoon = null;
    }

    spawnEnemiesDuringHack() {
        if (!this.game) return;

        const phase = this.game.currentPhaseIndex || 0;
        const params = CAMPAIGN_RULES.BASE_PARAMETERS;

        // Check total spawn limit per console
        const limitBase = params.intelSpawnTotalLimit?.initial || 5;
        const limitInc = params.intelSpawnTotalLimit?.perPhaseIncrement || 2;
        const limitMax = params.intelSpawnTotalLimit?.max || 20;
        const spawnLimit = Math.min(limitBase + (phase * limitInc), limitMax);

        if (this.totalSpawnedThisHack >= spawnLimit) return;

        const chanceBase = params.intelSpawnChance?.initial || 0.3;
        const chanceGrowth = params.intelSpawnChance?.perPhaseGrowthFactor || 0.1;
        const chanceMax = params.intelSpawnChance?.max || 0.8;
        const spawnChance = Math.min(chanceBase + (phase * chanceGrowth), chanceMax);

        if (Math.random() < spawnChance) {
            const minBase = params.intelSpawnCountMin?.initial || 1;
            const minInc = params.intelSpawnCountMin?.perPhaseIncrement || 0.5;
            const minMax = params.intelSpawnCountMin?.max || 5;
            const countMin = Math.min(Math.floor(minBase + (phase * minInc)), minMax);

            const maxBase = params.intelSpawnCountMax?.initial || 2;
            const maxInc = params.intelSpawnCountMax?.perPhaseIncrement || 1;
            const maxMaxVal = params.intelSpawnCountMax?.max || 8;
            const countMax = Math.min(Math.floor(maxBase + (phase * maxInc)), maxMaxVal);

            let spawnCount = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
            // Cap by remaining spawn budget for this console
            spawnCount = Math.min(spawnCount, spawnLimit - this.totalSpawnedThisHack);

            for (let i = 0; i < spawnCount; i++) {
                const unitType = this.getRandomUnitType(phase);
                const spawnPos = this.getRandomSpawnPosition();
                this.game.spawnEnemyAtLocation(spawnPos.x, spawnPos.y, unitType, this.x + this.width / 2, this.y + this.height / 2);
                this.totalSpawnedThisHack++;
            }
            console.log(`[INTEL HACK] Spawned ${spawnCount} enemies on console ${this.id}! Total on this console: ${this.totalSpawnedThisHack}/${spawnLimit}`);
        }
    }

    getRandomSpawnPosition() {
        const angle = Math.random() * Math.PI * 2;
        const radius = this.spawnDistance;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }

    getRandomUnitType(phase) {
        const pool = [
            { type: 'possum_grunt', weight: 10 },
            { type: 'possum_heavy', weight: 4, unlocksPhase: 2 },
            { type: 'possum_sniper', weight: 2, unlocksPhase: 4 },
            { type: 'possum_elite', weight: 1, unlocksPhase: 6 }
        ];

        const available = pool.filter(u => !u.unlocksPhase || u.unlocksPhase <= phase);
        const totalWeight = available.reduce((sum, u) => sum + u.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const unit of available) {
            rand -= unit.weight;
            if (rand <= 0) return unit.type;
        }
        return 'possum_grunt';
    }

    getNearestRaccoonInRange() {
        if (!this.game || !this.game.deployedSquadRoster) return null;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        let nearest = null;
        let nearestDist = Infinity;

        for (const raccoon of this.game.deployedSquadRoster) {
            if (!raccoon.isAlive()) continue;
            const dist = distance(centerX, centerY, raccoon.x, raccoon.y);
            if (dist <= this.interactionRadius && dist < nearestDist) {
                nearest = raccoon;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }
}