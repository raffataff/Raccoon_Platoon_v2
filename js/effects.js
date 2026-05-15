// js/effects.js

class PromotionEffect {
    constructor(x, y, gameInstance) {
        this.game = gameInstance; this.x = x; this.y = y;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.PROMOTION) ? CONFIG.VISUAL_EFFECTS.PROMOTION : {};
        this.text = this.effectConfig.TEXT || "PROMOTED!"; this.lifetime = this.effectConfig.LIFETIME || 1.5;
        this.elapsedTime = 0; this.isMarkedForDeletion = false; this.type = 'promotion_text'; this.opacity = 1;
        this.velocityY = this.effectConfig.VELOCITY_Y || -20; this.font = this.effectConfig.FONT || "bold 16px 'Consolas'";
        this.colorRGB = this.effectConfig.COLOR_RGB_FADE_START || [255, 223, 0];
    }
    update(deltaTime) { this.elapsedTime += deltaTime; this.y += this.velocityY * deltaTime; this.opacity = 1 - (this.elapsedTime / this.lifetime); if (this.elapsedTime >= this.lifetime || this.opacity <= 0) this.isMarkedForDeletion = true; }
    render(ctx) { ctx.font = this.font; ctx.fillStyle = `rgba(${this.colorRGB[0]}, ${this.colorRGB[1]}, ${this.colorRGB[2]}, ${Math.max(0, this.opacity)})`; ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y); ctx.textAlign = 'left'; }
}

class SpriteExplosionEffect {
    constructor(x, y, radius, gameInstance, type) {
        this.game = gameInstance;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.EXPLOSION) ? CONFIG.VISUAL_EFFECTS.EXPLOSION : {};
        this.spriteConfig = this.effectConfig[type] || {};

        this.image = this.game.preloadedImages[this.spriteConfig.SPRITE_PATH];
        this.frameWidth = this.spriteConfig.FRAME_WIDTH || 64;
        this.frameHeight = this.spriteConfig.FRAME_HEIGHT || 64;
        this.numFrames = this.spriteConfig.NUM_FRAMES || 16;
        this.animationSpeed = this.spriteConfig.ANIMATION_SPEED || 0.1;
        this.scale = this.spriteConfig.SCALE || 1.0;

        this.currentFrame = 0;
        this.animationTimer = 0;
        this.isMarkedForDeletion = false;
        this.lifetime = this.numFrames * this.animationSpeed;

        this.width = this.frameWidth * this.scale;
        this.height = this.frameHeight * this.scale;
        this.drawWidth = this.radius * 2 * this.scale;
        this.drawHeight = this.radius * 2 * this.scale;
    }

    update(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.numFrames) {
                this.isMarkedForDeletion = true;
            }
        }
    }

    render(ctx) {
        if (!this.image || this.isMarkedForDeletion) return;

        const sourceX = this.currentFrame * this.frameWidth;
        const sourceY = 0;

        ctx.drawImage(
            this.image,
            sourceX,
            sourceY,
            this.frameWidth,
            this.frameHeight,
            this.x - this.drawWidth / 2,
            this.y - this.drawHeight / 2,
            this.drawWidth,
            this.drawHeight
        );
    }
}

class ExplosionEffect {
    constructor(x, y, radius, gameInstance) {
        this.game = gameInstance;
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.EXPLOSION) ? CONFIG.VISUAL_EFFECTS.EXPLOSION : {};
        this.lifetime = this.effectConfig.LIFETIME || 0.5;
        this.elapsedTime = 0;
        this.isMarkedForDeletion = false;
        this.type = 'explosion';

        this.particles = [];
        const particleCount = 20 + (radius / 4);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (radius * 0.8) + (radius * 0.2);
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                lifetime: Math.random() * 0.8 + 0.4,
                alpha: 1.0,
                size: Math.random() * 3 + 1
            });
        }
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.currentRadius = (this.elapsedTime / this.lifetime) * this.maxRadius;
        if (this.elapsedTime >= this.lifetime) {
            this.isMarkedForDeletion = true;
        }

        this.particles.forEach(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.lifetime -= deltaTime;
            if (p.lifetime <= 0) {
                p.alpha = 0;
            } else {
                p.alpha = p.lifetime / 1.2;
            }
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
    }

    render(ctx) {
        const progress = this.elapsedTime / this.lifetime;
        const alpha = 1 - progress;

        const colorIntensity = Math.floor(255 * (1 - progress * 0.5));
        const gIntensity = Math.floor(255 * (1 - progress));
        ctx.fillStyle = `rgba(${colorIntensity}, ${Math.floor(gIntensity * 0.6)}, 0, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();

        if (progress < 0.4) {
            ctx.fillStyle = `rgba(255,255,${Math.floor(150 + 105 * (1 - progress / 0.4))},${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(200, 150, 50, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class ExtractionZoneEffect {
    constructor(obstacle, gameInstance) {
        this.game = gameInstance;
        this.obstacleId = obstacle.id;
        this.obstacle = obstacle;
        this.x = obstacle.x;
        this.y = obstacle.y;
        this.width = obstacle.width;
        this.height = obstacle.height;
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        this.maxRadius = Math.min(this.width, this.height) / 2;
        this.isMarkedForDeletion = false;
        this.type = 'extraction_zone_beacon';

        // Config
        const ezCfg = (CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.EXTRACTION_ZONE_SETTINGS) || {};
        this.primaryColor = ezCfg.PRIMARY_COLOR || '#00FFD4';
        this.accentColor = ezCfg.ACCENT_COLOR || '#FFFFFF';
        this.glowColor = ezCfg.GLOW_COLOR || 'rgba(0, 255, 212, 0.15)';
        this.bracketLength = ezCfg.BRACKET_LENGTH || 20;
        this.bracketThickness = ezCfg.BRACKET_THICKNESS || 3;
        this.labelText = ezCfg.LABEL_TEXT || 'EXTRACT';

        // Parse primary color to RGB for alpha manipulation
        this._primaryRGB = this._hexToRGB(this.primaryColor);
        this._accentRGB = this._hexToRGB(this.accentColor);

        // Reveal animation
        this.revealDuration = ezCfg.REVEAL_DURATION || 1.5;
        this.revealTimer = 0;
        this.revealProgress = 0; // 0 to 1
        this.isFullyRevealed = false;

        // Pulse rings
        this.pulses = [];
        this.pulseSpawnTimer = 0;
        this.pulseSpawnInterval = ezCfg.PULSE_SPAWN_INTERVAL || 2.0;
        this.pulseLifetime = ezCfg.PULSE_LIFETIME || 2.5;

        // Scan line
        this.scanLineY = 0;
        this.scanLineSpeed = ezCfg.SCAN_LINE_SPEED || 80;
        this.scanLineDirection = 1;

        // Particles
        this.particles = [];
        const particleCount = ezCfg.PARTICLE_COUNT || 20;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this._createParticle(true));
        }

        // Glow breathing
        this.glowPhase = 0;

        // Bracket animation
        this.bracketPhase = 0;
    }

    _hexToRGB(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 212 };
    }

    _createParticle(randomizeY) {
        return {
            x: this.x + Math.random() * this.width,
            y: randomizeY ? (this.y + Math.random() * this.height) : (this.y + this.height + Math.random() * 10),
            speedY: -(15 + Math.random() * 30),
            speedX: (Math.random() - 0.5) * 10,
            size: 1 + Math.random() * 2.5,
            alpha: 0.3 + Math.random() * 0.5,
            flickerPhase: Math.random() * Math.PI * 2
        };
    }

    update(deltaTime) {
        const currentObstacle = this.game.level.obstacles.find(o => o.id === this.obstacleId);
        if (!currentObstacle) {
            this.isMarkedForDeletion = true;
            return;
        }
        this.obstacle = currentObstacle;

        // Reveal animation
        if (!this.isFullyRevealed) {
            this.revealTimer += deltaTime;
            this.revealProgress = Math.min(1.0, this.revealTimer / this.revealDuration);
            if (this.revealProgress >= 1.0) {
                this.isFullyRevealed = true;
            }
        }

        const masterAlpha = this.revealProgress;

        // Pulse rings
        this.pulseSpawnTimer += deltaTime;
        if (this.pulseSpawnTimer >= this.pulseSpawnInterval && masterAlpha > 0.3) {
            this.pulseSpawnTimer = 0;
            this.pulses.push({
                currentRadius: 0,
                lifetime: this.pulseLifetime,
                elapsed: 0,
                alpha: 1.0
            });
        }
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const pulse = this.pulses[i];
            pulse.elapsed += deltaTime;
            if (pulse.elapsed >= pulse.lifetime) {
                this.pulses.splice(i, 1);
            } else {
                const progress = pulse.elapsed / pulse.lifetime;
                pulse.currentRadius = this.maxRadius * progress;
                pulse.alpha = 1.0 - progress;
            }
        }

        // Scan line
        this.scanLineY += this.scanLineSpeed * this.scanLineDirection * deltaTime;
        if (this.scanLineY > this.height) {
            this.scanLineY = this.height;
            this.scanLineDirection = -1;
        } else if (this.scanLineY < 0) {
            this.scanLineY = 0;
            this.scanLineDirection = 1;
        }

        // Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.y += p.speedY * deltaTime;
            p.x += p.speedX * deltaTime;
            p.flickerPhase += deltaTime * 5;
            // Respawn if above zone
            if (p.y < this.y - 10) {
                this.particles[i] = this._createParticle(false);
            }
            // Keep within horizontal bounds loosely
            if (p.x < this.x - 5 || p.x > this.x + this.width + 5) {
                p.speedX = -p.speedX;
            }
        }

        // Glow breathing
        this.glowPhase += deltaTime * 1.5;

        // Bracket animation
        this.bracketPhase += deltaTime * 2.0;
    }

    render(ctx) {
        if (this.revealProgress <= 0) return;

        const masterAlpha = this.revealProgress;

        ctx.save();

        // --- Background glow (breathing) ---
        const breathFactor = 0.5 + 0.5 * Math.sin(this.glowPhase);
        const glowAlpha = (0.08 + 0.08 * breathFactor) * masterAlpha;
        ctx.fillStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${glowAlpha})`;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // --- Subtle grid pattern ---
        const gridSpacing = 20;
        ctx.strokeStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${0.06 * masterAlpha})`;
        ctx.lineWidth = 0.5;
        for (let gx = this.x; gx <= this.x + this.width; gx += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(gx, this.y);
            ctx.lineTo(gx, this.y + this.height);
            ctx.stroke();
        }
        for (let gy = this.y; gy <= this.y + this.height; gy += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(this.x, gy);
            ctx.lineTo(this.x + this.width, gy);
            ctx.stroke();
        }

        // --- Scan line ---
        const scanY = this.y + this.scanLineY;
        const scanGrad = ctx.createLinearGradient(this.x, scanY - 8, this.x, scanY + 8);
        scanGrad.addColorStop(0, `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, 0)`);
        scanGrad.addColorStop(0.5, `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${0.4 * masterAlpha})`);
        scanGrad.addColorStop(1, `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, 0)`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(this.x, scanY - 8, this.width, 16);
        // Bright center line
        ctx.strokeStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${0.7 * masterAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 4, scanY);
        ctx.lineTo(this.x + this.width - 4, scanY);
        ctx.stroke();

        // --- Particles ---
        for (const p of this.particles) {
            const flickerAlpha = 0.5 + 0.5 * Math.sin(p.flickerPhase);
            const pAlpha = p.alpha * flickerAlpha * masterAlpha;
            ctx.fillStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Pulse rings ---
        this.pulses.forEach(pulse => {
            const ringAlpha = pulse.alpha * 0.6 * masterAlpha;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${ringAlpha})`;
            ctx.lineWidth = 2 + pulse.alpha;
            ctx.arc(this.centerX, this.centerY, pulse.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // --- Corner brackets ---
        const bLen = this.bracketLength;
        const bThick = this.bracketThickness;
        // Animate bracket offset slightly
        const bPulse = 1 + 0.08 * Math.sin(this.bracketPhase);
        const bAlpha = (0.8 + 0.2 * Math.sin(this.bracketPhase * 0.7)) * masterAlpha;
        ctx.strokeStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${bAlpha})`;
        ctx.lineWidth = bThick;
        ctx.lineCap = 'round';

        const inset = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(this.x + inset, this.y + inset + bLen * bPulse);
        ctx.lineTo(this.x + inset, this.y + inset);
        ctx.lineTo(this.x + inset + bLen * bPulse, this.y + inset);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - inset - bLen * bPulse, this.y + inset);
        ctx.lineTo(this.x + this.width - inset, this.y + inset);
        ctx.lineTo(this.x + this.width - inset, this.y + inset + bLen * bPulse);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(this.x + inset, this.y + this.height - inset - bLen * bPulse);
        ctx.lineTo(this.x + inset, this.y + this.height - inset);
        ctx.lineTo(this.x + inset + bLen * bPulse, this.y + this.height - inset);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - inset - bLen * bPulse, this.y + this.height - inset);
        ctx.lineTo(this.x + this.width - inset, this.y + this.height - inset);
        ctx.lineTo(this.x + this.width - inset, this.y + this.height - inset - bLen * bPulse);
        ctx.stroke();

        // --- Center diamond/crosshair ---
        const chSize = 6;
        ctx.strokeStyle = `rgba(${this._accentRGB.r}, ${this._accentRGB.g}, ${this._accentRGB.b}, ${0.5 * masterAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY - chSize);
        ctx.lineTo(this.centerX + chSize, this.centerY);
        ctx.lineTo(this.centerX, this.centerY + chSize);
        ctx.lineTo(this.centerX - chSize, this.centerY);
        ctx.closePath();
        ctx.stroke();

        // --- "EXTRACT" label ---
        const labelAlpha = (0.8 + 0.2 * Math.sin(this.glowPhase * 1.3)) * masterAlpha;
        ctx.fillStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${labelAlpha})`;
        ctx.font = "bold 14px 'Consolas', 'Lucida Console', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Glow behind text
        ctx.shadowColor = this.primaryColor;
        ctx.shadowBlur = 10 * masterAlpha;
        ctx.fillText(this.labelText, this.centerX, this.centerY + chSize + 16);
        ctx.shadowBlur = 0;

        // --- Outer border (dashed, subtle) ---
        ctx.strokeStyle = `rgba(${this._primaryRGB.r}, ${this._primaryRGB.g}, ${this._primaryRGB.b}, ${0.2 * masterAlpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.setLineDash([]);

        ctx.restore();
    }
}

class HelpTextEffect {
    constructor(parentUnit, gameInstance) {
        this.parentUnit = parentUnit;
        this.game = gameInstance;
        this.config = CONFIG.VISUAL_EFFECTS.HOSTAGE_HELP_TEXT || {};

        this.text = (this.config.TEXT_OPTIONS && this.config.TEXT_OPTIONS.length > 0)
            ? this.config.TEXT_OPTIONS[Math.floor(Math.random() * this.config.TEXT_OPTIONS.length)]
            : "Help!";

        this.lifetime = this.config.LIFETIME_SECONDS || 2.0;
        this.elapsedTime = 0;
        this.isMarkedForDeletion = false;
        this.type = 'help_text';
        this.opacity = 1.0;

        this.yOffset = this.config.Y_OFFSET || -40;
        this.font = this.config.FONT || "bold 18px Arial";
        this.color = this.config.COLOR || "yellow";
        this.fadeOutStart = this.lifetime * (this.config.FADE_OUT_START_PERCENT || 0.7);
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        if (!this.parentUnit || !this.parentUnit.isAlive() || this.parentUnit.isRescued || this.elapsedTime >= this.lifetime) {
            this.isMarkedForDeletion = true;
            return;
        }

        if (this.elapsedTime > this.fadeOutStart) {
            const fadeDuration = this.lifetime - this.fadeOutStart;
            const timeIntoFade = this.elapsedTime - this.fadeOutStart;
            this.opacity = 1.0 - (timeIntoFade / fadeDuration);
        }
    }

    render(ctx) {
        if (!this.parentUnit) return;

        ctx.save();
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const renderX = this.parentUnit.x;
        const renderY = this.parentUnit.y + this.yOffset;

        ctx.fillText(this.text, renderX, renderY);

        ctx.restore();
    }
}

class MuzzleFlashEffect {
    constructor(x, y, scale = 1.0) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.lifetime = 0.05;
        this.isMarkedForDeletion = false;
        this.type = 'muzzle_flash';
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        const radius = 6 * this.scale;
        const spikes = 5;
        const rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        let step = Math.PI / spikes;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.strokeStyle = "rgba(255, 255, 204, 0.8)";
        ctx.fillStyle = "rgba(255, 223, 100, 0.9)";
        ctx.lineWidth = 1.5 * this.scale;
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        for (let i = 0; i < spikes; i++) {
            x = Math.cos(rot + step * i) * radius;
            y = Math.sin(rot + step * i) * radius;
            ctx.lineTo(x, y);
            x = Math.cos(rot + step * i + step / 2) * (radius * 0.4);
            y = Math.sin(rot + step * i + step / 2) * (radius * 0.4);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.restore();
    }
}

class BloodEffect {
    constructor(x, y, angle) {
        this.type = 'blood';
        this.isMarkedForDeletion = false;
        this.particles = [];
        const particleCount = 7 + Math.floor(Math.random() * 5);

        for (let i = 0; i < particleCount; i++) {
            const speed = Math.random() * 80 + 40;
            const spread = Math.PI / 3;
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(particleAngle) * speed,
                vy: Math.sin(particleAngle) * speed,
                lifetime: Math.random() * 0.4 + 0.2,
                size: Math.random() * 2 + 1,
                color: Math.random() > 0.3 ? 'rgba(180, 0, 0, 0.8)' : 'rgba(140, 0, 0, 0.7)'
            });
        }
    }

    update(deltaTime) {
        let allDone = true;
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.vx *= 0.9;
                p.vy *= 0.9;
                p.lifetime -= deltaTime;
                allDone = false;
            }
        });
        if (allDone) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

class SparkEffect {
    constructor(x, y) {
        this.type = 'spark';
        this.isMarkedForDeletion = false;
        this.particles = [];
        const particleCount = 4 + Math.floor(Math.random() * 4);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 60;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                lifetime: Math.random() * 0.2 + 0.1,
                len: Math.random() * 4 + 2
            });
        }
    }

    update(deltaTime) {
        let allDone = true;
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.lifetime -= deltaTime;
                allDone = false;
            }
        });
        if (allDone) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.strokeStyle = `rgba(255, 255, 220, 0.9)`;
        ctx.lineWidth = 1.5;
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                const tailX = p.x - p.vx * 0.05;
                const tailY = p.y - p.vy * 0.05;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }
        });
    }
}

class WoodSplinterEffect {
    constructor(x, y, impactAngle) {
        this.type = 'wood_splinter';
        this.isMarkedForDeletion = false;
        this.particles = [];
        const particleCount = 5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < particleCount; i++) {
            const speed = Math.random() * 60 + 30;
            const spread = Math.PI / 2.5;
            const particleAngle = impactAngle + (Math.random() - 0.5) * spread;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(particleAngle) * speed,
                vy: Math.sin(particleAngle) * speed,
                lifetime: Math.random() * 0.5 + 0.3,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 4,
                width: Math.random() * 3 + 2,
                height: Math.random() * 1 + 1,
                color: Math.random() > 0.5 ? '#8B4513' : '#A0522D'
            });
        }
    }

    update(deltaTime) {
        let allDone = true;
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.vy += 80 * deltaTime;
                p.vx *= 0.97;
                p.vy *= 0.97;
                p.angle += p.rotationSpeed * deltaTime;
                p.lifetime -= deltaTime;
                allDone = false;
            }
        });
        if (allDone) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
                ctx.restore();
            }
        });
    }
}

class LaserSightEffect {
    constructor(shooter, target) {
        this.type = 'laser_sight';
        this.shooter = shooter;
        this.target = target;
        this.isMarkedForDeletion = false;

        this.config = CONFIG.VISUAL_EFFECTS.LASER_SIGHT || {};
        this.startTime = performance.now();
        this.duration = (CONFIG.AI.POSSUM_SNIPER?.SETUP_TIME_SECONDS || 1.5) * 1000;
    }

    update(deltaTime) {
        if (!this.shooter.isAlive() || !this.target.isAlive() || this.shooter.aiState !== 'AIMING') {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        if (this.isMarkedForDeletion) return;

        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1.0);

        const alpha = 0.1 + progress * 0.8;
        const width = 0.5 + progress * 1.5;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.shooter.x, this.shooter.y);
        ctx.lineTo(this.target.x, this.target.y);
        ctx.stroke();
        ctx.restore();
    }
}

class PickupEffect {
    constructor(x, y, text, color, iconImage = null) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.icon = iconImage;
        this.type = 'pickup_text';

        const config = CONFIG.VISUAL_EFFECTS.PICKUP || {};
        this.lifetime = config.LIFETIME || 1.5;
        this.velocityY = config.VELOCITY_Y || -20;
        this.font = config.FONT || "bold 18px 'Consolas'";
        this.iconSize = config.ICON_SIZE || 24;

        // This property is no longer needed for inline rendering
        // this.iconYOffset = config.ICON_Y_OFFSET || -10;

        this.elapsedTime = 0;
        this.opacity = 1.0;
        this.isMarkedForDeletion = false;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.y += this.velocityY * deltaTime;
        this.opacity = 1 - (this.elapsedTime / this.lifetime);
        if (this.elapsedTime >= this.lifetime || this.opacity <= 0) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Align text and icon vertically
        ctx.font = this.font;
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 4;

        // --- MODIFICATION START: Inline Rendering Logic ---
        const iconTextGap = 4;
        let totalWidth = 0;
        let textMetrics = ctx.measureText(this.text);
        totalWidth += textMetrics.width;

        if (this.icon) {
            totalWidth += this.iconSize + iconTextGap;
        }

        let currentX = this.x - totalWidth / 2;

        // Draw icon first, on the left
        if (this.icon) {
            ctx.drawImage(this.icon, currentX, this.y - this.iconSize / 2, this.iconSize, this.iconSize);
            currentX += this.iconSize + iconTextGap;
        }

        // Draw text to the right of the icon
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, currentX + textMetrics.width / 2, this.y); // Adjust for centering the text part
        // --- MODIFICATION END ---

        ctx.restore();
    }
}
class SpeechBubbleEffect {
    constructor(parentUnit, text, gameInstance, color) {
        this.parentUnit = parentUnit;
        this.game = gameInstance;
        this.text = text;
        this.color = color || "#FFFFFF";
        this.lifetime = SPEECH_CONFIG.GLOBAL.BUBBLE_LIFETIME;
        this.elapsedTime = 0;
        this.isMarkedForDeletion = false;
        this.type = 'speech_bubble';
        this.opacity = 1.0;
        this.yOffset = SPEECH_CONFIG.GLOBAL.BUBBLE_Y_OFFSET;
        this.font = SPEECH_CONFIG.GLOBAL.BUBBLE_FONT;
        this.maxWidth = SPEECH_CONFIG.GLOBAL.BUBBLE_MAX_WIDTH;
        this.padding = SPEECH_CONFIG.GLOBAL.BUBBLE_PADDING;
        this.bgAlpha = SPEECH_CONFIG.GLOBAL.BUBBLE_BG_ALPHA;
        this.fadeStart = this.lifetime * SPEECH_CONFIG.GLOBAL.BUBBLE_FADE_START;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        if (!this.parentUnit || !this.parentUnit.isAlive() || this.elapsedTime >= this.lifetime) {
            this.isMarkedForDeletion = true;
            return;
        }
        if (this.elapsedTime > this.fadeStart) {
            const fadeDuration = this.lifetime - this.fadeStart;
            this.opacity = 1.0 - ((this.elapsedTime - this.fadeStart) / fadeDuration);
        }
    }

    render(ctx) {
        if (!this.parentUnit) return;

        ctx.save();
        ctx.font = this.font;
        ctx.globalAlpha = this.opacity;

        const words = this.text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > this.maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = 16;
        const textWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const bubbleWidth = textWidth + this.padding * 2;
        const bubbleHeight = lines.length * lineHeight + this.padding * 2;
        const renderX = this.parentUnit.x;
        const renderY = this.parentUnit.y + this.yOffset - bubbleHeight;
        const r = 6;

        ctx.fillStyle = 'rgba(0, 0, 0, ' + this.bgAlpha * this.opacity + ')';
        ctx.beginPath();
        ctx.moveTo(renderX - bubbleWidth / 2 + r, renderY);
        ctx.lineTo(renderX + bubbleWidth / 2 - r, renderY);
        ctx.arcTo(renderX + bubbleWidth / 2, renderY, renderX + bubbleWidth / 2, renderY + r, r);
        ctx.lineTo(renderX + bubbleWidth / 2, renderY + bubbleHeight - r);
        ctx.arcTo(renderX + bubbleWidth / 2, renderY + bubbleHeight, renderX + bubbleWidth / 2 - r, renderY + bubbleHeight, r);
        ctx.lineTo(renderX - bubbleWidth / 2 + r, renderY + bubbleHeight);
        ctx.arcTo(renderX - bubbleWidth / 2, renderY + bubbleHeight, renderX - bubbleWidth / 2, renderY + bubbleHeight - r, r);
        ctx.lineTo(renderX - bubbleWidth / 2, renderY + r);
        ctx.arcTo(renderX - bubbleWidth / 2, renderY, renderX - bubbleWidth / 2 + r, renderY, r);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 * this.opacity) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, ' + this.bgAlpha * this.opacity + ')';
        ctx.beginPath();
        ctx.moveTo(renderX - 6, renderY + bubbleHeight);
        ctx.lineTo(renderX + 6, renderY + bubbleHeight);
        ctx.lineTo(renderX, renderY + bubbleHeight + 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 3;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], renderX, renderY + this.padding + i * lineHeight);
        }

        ctx.restore();
    }
}
