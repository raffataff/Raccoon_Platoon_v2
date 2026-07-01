class PossumAntiAirTurret {
    constructor(x, y, game, obstacle = null, variant = 1) {
        this.type = 'possum_anti_air_turret';
        this.team = 'enemy';
        this.x = x;
        this.y = y;
        this.game = game;
        this.obstacle = obstacle;
        this.variant = variant;

        this.isShutdown = false;
        this.interactionRadius = 120;

        this.width = 64;
        this.height = 64;

        this._loadSprites();
    }

    _loadSprites() {
        if (!this.game || !this.game.preloadedImages) return;

        const turretDir = 'assets/images/objects/possums/turrets/anti-air/';
        const spriteKey = `possum_anti_air_${this.variant}`;
        const spriteKeyDeactivated = `possum_anti_air_${this.variant}_deactivated`;

        const normalPath = turretDir + spriteKey + '.png';
        const deactivatedPath = turretDir + spriteKeyDeactivated + '.png';

        const normalImg = this.game.preloadedImages[normalPath];
        const deactivatedImg = this.game.preloadedImages[deactivatedPath];

        this.sprite = (normalImg && normalImg.naturalWidth > 0) ? normalImg : null;
        this.spriteDeactivated = (deactivatedImg && deactivatedImg.naturalWidth > 0) ? deactivatedImg : null;

        const turretConfig = CONFIG.POSSUM_ANTI_AIR_TURRET || {};
        const refSprite = this.sprite || this.spriteDeactivated;
        if (refSprite && refSprite.naturalWidth > 0) {
            const scale = turretConfig.spriteScale !== undefined ? turretConfig.spriteScale : 0.3;
            this.width = refSprite.naturalWidth * scale;
            this.height = refSprite.naturalHeight * scale;
        }
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    getNearestRaccoonInRange() {
        if (!this.game || !this.game.deployedSquadRoster) return null;

        const centerX = this.getCenterX();
        const centerY = this.getCenterY();

        let nearest = null;
        let nearestDist = Infinity;

        for (const raccoon of this.game.deployedSquadRoster) {
            if (!raccoon.isAlive()) continue;
            const dist = distance(centerX, centerY, raccoon.x, raccoon.y);
            if (dist > this.interactionRadius) continue;
            if (dist < nearestDist) {
                nearest = raccoon;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    shutdown() {
        this.isShutdown = true;
        const turretConfig = CONFIG.POSSUM_ANTI_AIR_TURRET || {};
        if (this.game && this.game.audioManager && turretConfig.sfxShutdownKey) {
            this.game.audioManager.play(turretConfig.sfxShutdownKey);
        }
    }

    update(deltaTime) {
    }

    render(ctx) {
        const sprite = this.isShutdown ? this.spriteDeactivated : this.sprite;
        if (sprite && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isShutdown ? '#444444' : '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = this.isShutdown ? '#00FF00' : '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    renderOverlay(ctx) {
        if (!this.isShutdown) {
            const nearbyRaccoon = this.getNearestRaccoonInRange();
            if (nearbyRaccoon) {
                ctx.font = "bold 14px 'Consolas'";
                ctx.fillStyle = '#00FF00';
                ctx.textAlign = 'center';
                ctx.shadowColor = "rgba(0,0,0,0.9)";
                ctx.shadowBlur = 4;
                ctx.fillText("Press E to Shut Down", this.x + this.width / 2, this.y - 25);
                ctx.shadowBlur = 0;
            }
        }
    }
}
