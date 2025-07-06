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
    render(ctx) { ctx.font = this.font; ctx.fillStyle = `rgba(${this.colorRGB[0]}, ${this.colorRGB[1]}, ${this.colorRGB[2]}, ${Math.max(0, this.opacity)})`; ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y); ctx.textAlign = 'left';  }
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
        
        const colorIntensity = Math.floor(255 * (1 - progress*0.5)); 
        const gIntensity = Math.floor(255 * (1-progress)); 
        ctx.fillStyle = `rgba(${colorIntensity}, ${Math.floor(gIntensity*0.6)}, 0, ${alpha*0.7})`;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.currentRadius,0,Math.PI*2);
        ctx.fill();
        
        if (progress < 0.4) {
            ctx.fillStyle = `rgba(255,255,${Math.floor(150+105*(1-progress/0.4))},${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.currentRadius*0.5,0,Math.PI*2);
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
        this.pulses = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.isMarkedForDeletion = false;
        this.type = 'extraction_zone_beacon';
    }

    update(deltaTime) {
        const currentObstacle = this.game.level.obstacles.find(o => o.id === this.obstacleId);
        if (!currentObstacle) {
            this.isMarkedForDeletion = true;
            return;
        }
        this.obstacle = currentObstacle;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.pulses.push({
                currentRadius: 0,
                lifetime: 2.0,
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
    }

    render(ctx) {
        ctx.save();
        
        ctx.fillStyle = this.obstacle.color || 'rgba(60, 120, 255, 0.35)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        this.pulses.forEach(pulse => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(173, 216, 230, ${pulse.alpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.arc(this.centerX, this.centerY, pulse.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EVAC", this.centerX, this.centerY);

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