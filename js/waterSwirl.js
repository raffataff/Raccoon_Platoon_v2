// js/waterSwirl.js

class WaterSwirlEffect {
    constructor(obstacle) {
        this.obstacle = obstacle;
        this.time = Math.random() * 100;

        const def = obstacle.swirlRegion || {};
        this.centerX = obstacle.width * (def.centerX !== undefined ? def.centerX : 0.5);
        this.centerY = obstacle.height * (def.centerY !== undefined ? def.centerY : 0.5);
        this.radius = Math.min(obstacle.width, obstacle.height) * (def.radius !== undefined ? def.radius : 0.5);

        this._cachedLayer = null;
        this._cachedLayerKey = null;
    }

    update(deltaTime) {
        this.time += deltaTime;
    }

    _prerenderLayer(image) {
        const key = image.src + '_' + this.obstacle.width + '_' + this.obstacle.height;
        if (key === this._cachedLayerKey && this._cachedLayer) return;

        const w = this.obstacle.width;
        const h = this.obstacle.height;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.radius;

        const layer = document.createElement('canvas');
        layer.width = w;
        layer.height = h;
        const lctx = layer.getContext('2d');

        lctx.drawImage(image, 0, 0, w, h);

        lctx.globalCompositeOperation = 'destination-in';
        lctx.beginPath();
        lctx.arc(cx, cy, r, 0, Math.PI * 2);
        lctx.fill();

        this._cachedLayer = layer;
        this._cachedLayerKey = key;
    }

    render(ctx, image) {
        if (!image || image.naturalWidth <= 0) return;

        const cfg = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.WATER_SWIRL) || {};
        if (cfg.ENABLED === false) {
            ctx.drawImage(image, this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);
            return;
        }

        this._prerenderLayer(image);

        const w = this.obstacle.width;
        const h = this.obstacle.height;
        const t = this.time;
        const cx = this.centerX;
        const cy = this.centerY;

        const driftAmp = cfg.DRIFT_AMPLITUDE || 1.5;
        const driftSpeedX = cfg.DRIFT_SPEED_X || 0.3;
        const driftSpeedY = cfg.DRIFT_SPEED_Y || 0.4;
        const swirl = cfg.SWIRL_STRENGTH || 0.15;

        const offsetX = Math.sin(t * driftSpeedY) * driftAmp;
        const offsetY = Math.cos(t * driftSpeedX) * driftAmp;
        const angle = Math.sin(t * 0.5) * swirl;

        const ox = this.obstacle.x;
        const oy = this.obstacle.y;

        ctx.drawImage(image, ox, oy, w, h);

        ctx.save();
        ctx.beginPath();
        ctx.arc(ox + cx, oy + cy, this.radius, 0, Math.PI * 2);
        ctx.clip();

        ctx.translate(ox + cx + offsetX, oy + cy + offsetY);
        ctx.rotate(angle);
        ctx.translate(-(ox + cx), -(oy + cy));

        ctx.globalAlpha = 0.6;
        ctx.drawImage(this._cachedLayer, ox, oy);

        ctx.restore();
    }
}
