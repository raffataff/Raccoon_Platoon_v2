// js/scentmarker.js
// Scent Marker system — raccoon waypoint markers with radial menu placement

class ScentMarker {
    constructor(worldX, worldY, markerType, markerId) {
        this.worldX = worldX;
        this.worldY = worldY;
        this.markerType = markerType;
        this.markerId = markerId || `scent_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        this.createdAt = performance.now() / 1000;
        this.isMarkedForDeletion = false;
        this.cfg = CONFIG.SCENT_MARKERS;
    }

    get age() {
        return performance.now() / 1000 - this.createdAt;
    }

    get typeConfig() {
        return this.cfg.TYPES[this.markerType] || this.cfg.TYPES.HOSTAGE;
    }

    get isFading() {
        const fadeStart = this.cfg.FADE_START_TIME;
        return this.age > fadeStart;
    }

    get opacity() {
        if (!this.isFading) return 1.0;
        const fadeProgress = (this.age - this.cfg.FADE_START_TIME) / this.cfg.FADE_DURATION;
        return Math.max(0, 1.0 - fadeProgress);
    }

    update(deltaTime) {
        if (this.opacity <= 0) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx, game) {
        if (this.isMarkedForDeletion) return;
        const renderCfg = this.cfg.RENDER;
        const typeCfg = this.typeConfig;
        const opacity = this.opacity;
        if (opacity <= 0) return;

        const now = performance.now() / 1000;
        const canvas = game.canvas;
        const zoom = game.cameraZoom || 1.0;

        const screen = game.worldToScreen(this.worldX, this.worldY);
        const sx = screen.x;
        const sy = screen.y;

        const pulse = 1.0 + Math.sin(now * renderCfg.PULSE_SPEED) * renderCfg.PULSE_AMOUNT;
        const isOnScreen =
            sx >= -renderCfg.WORLD_MARKER_ON_SCREEN_MARGIN &&
            sx <= canvas.width + renderCfg.WORLD_MARKER_ON_SCREEN_MARGIN &&
            sy >= -renderCfg.WORLD_MARKER_ON_SCREEN_MARGIN &&
            sy <= canvas.height + renderCfg.WORLD_MARKER_ON_SCREEN_MARGIN;

        const sniffActive = game.scentSniffActive && now < game.scentSniffExpiry;

        if (!isOnScreen && !sniffActive) {
            ctx.restore();
            return;
        }

        ctx.save();

        if (sniffActive) {
            let sniffFadeOpacity = 1.0;
            const sniffDuration = this.cfg.RADIAL_MENU.SNIFF_DURATION || 10;
            const sniffElapsed = now - (game.scentSniffExpiry - sniffDuration);
            const sniffProgress = sniffElapsed / sniffDuration;
            sniffFadeOpacity = sniffProgress < 0.5 ? 1.0 : Math.max(0, 1.0 - (sniffProgress - 0.5) * 2);
            this._renderEdgeArrow(ctx, sx, sy, typeCfg, renderCfg, pulse, zoom, opacity * sniffFadeOpacity, now, game);
        } else {
            this._renderWorldMarker(ctx, sx, sy, typeCfg, renderCfg, pulse, zoom, opacity, now);
        }

        ctx.restore();
    }

    _renderWorldMarker(ctx, sx, sy, typeCfg, renderCfg, pulse, zoom, opacity, now) {
        const outerR = renderCfg.OUTER_RING_RADIUS * pulse * Math.sqrt(zoom);
        const innerR = renderCfg.INNER_CIRCLE_RADIUS * Math.sqrt(zoom);

        ctx.globalAlpha = opacity;

        ctx.shadowColor = typeCfg.glowColor;
        ctx.shadowBlur = 12 * zoom;

        ctx.beginPath();
        ctx.moveTo(sx + outerR, sy);
        ctx.arc(sx, sy, outerR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = typeCfg.glowColor;
        ctx.fill();

        ctx.shadowColor = typeCfg.color;
        ctx.shadowBlur = 6 * zoom;
        ctx.strokeStyle = typeCfg.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (typeCfg.iconChar) {
            const iconSize = renderCfg.ICON_SIZE * Math.sqrt(zoom);
            ctx.font = `bold ${iconSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = typeCfg.color;
            ctx.fillText(typeCfg.iconChar, sx, sy + 1);
        }

        if (typeCfg.label) {
            const fontSize = renderCfg.LABEL_FONT_SIZE * Math.pow(zoom, 0.5);
            ctx.font = `bold ${fontSize}px 'Consolas', 'Lucida Console', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = typeCfg.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(typeCfg.label, sx, sy + outerR + 4);
            ctx.shadowBlur = 0;
        }

        const t = (now * 0.8) % 1;
        const shimmerR = innerR + (outerR - innerR) * t;
        const shimmerAlpha = (1 - t) * 0.3;
        ctx.beginPath();
        ctx.moveTo(sx + shimmerR, sy);
        ctx.arc(sx, sy, shimmerR, 0, Math.PI * 2);
        ctx.strokeStyle = typeCfg.color;
        ctx.globalAlpha = opacity * shimmerAlpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.globalAlpha = 1.0;
    }

    _renderEdgeArrow(ctx, sx, sy, typeCfg, renderCfg, pulse, zoom, opacity, now, game) {
        const canvas = game.canvas;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = sx - cx;
        const dy = sy - cy;
        const angle = Math.atan2(dy, dx);

        const edgeDist = Math.min(canvas.width, canvas.height) / 2 - renderCfg.EDGE_MARGIN;
        const arrowDist = edgeDist - renderCfg.ARROW_OFFSET;
        const ax = cx + Math.cos(angle) * arrowDist;
        const ay = cy + Math.sin(angle) * arrowDist;

        const arrowSize = renderCfg.ARROW_SIZE * pulse;

        ctx.globalAlpha = opacity;

        ctx.translate(ax, ay);
        ctx.rotate(angle);

        ctx.shadowColor = typeCfg.glowColor;
        ctx.shadowBlur = 6;
        ctx.fillStyle = typeCfg.color;
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.5);
        ctx.lineTo(-arrowSize * 0.2, 0);
        ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.rotate(-angle);

        if (typeCfg.iconChar) {
            const iconSize = (renderCfg.ICON_SIZE * 0.5);
            ctx.font = `bold ${iconSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1a1a2e';
            ctx.fillText(typeCfg.iconChar, 0, 0);
        }

        if (typeCfg.label) {
            const fontSize = renderCfg.LABEL_FONT_SIZE * 0.9;
            ctx.font = `bold ${fontSize}px 'Consolas', 'Lucida Console', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = typeCfg.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(typeCfg.label, 0, -arrowSize - 6);
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1.0;
    }
}

// Scent radial menu (hold Q). Uses the shared RadialMenu base (js/radialMenu.js) for
// the standard look; this class only builds the item list: one segment per marker
// type, plus Remove and Sniff actions. Each item carries an `action` payload that
// game.handleScentMenuKeyUp() consumes.
class ScentRadialMenu extends RadialMenu {
    constructor(game) {
        // No style overrides — the whole point is the standard design.
        super(game);
        this.idleCenterLines = ['SCENT'];
    }

    activate(unitScreenX, unitScreenY) {
        const radCfg = (CONFIG.SCENT_MARKERS && CONFIG.SCENT_MARKERS.RADIAL_MENU) || {};
        const types = (CONFIG.SCENT_MARKERS && CONFIG.SCENT_MARKERS.TYPES) || {};

        const items = [];
        for (const typeKey of Object.keys(types)) {
            const typeCfg = types[typeKey];
            items.push({
                label: typeCfg.label || typeKey,
                iconChar: typeCfg.iconChar || '?',
                color: typeCfg.color || '#888888',
                badge: null,
                disabled: false,
                action: { action: 'place', markerType: typeKey },
            });
        }
        items.push({
            label: radCfg.REMOVE_LABEL || 'Remove Marker',
            iconChar: '✕',
            color: radCfg.REMOVE_COLOR || '#FF4444',
            badge: null,
            disabled: false,
            action: { action: 'remove' },
        });
        items.push({
            label: radCfg.SNIFF_LABEL || 'Sniff',
            iconChar: '¡',
            color: radCfg.SNIFF_COLOR || '#DDA0DD',
            badge: null,
            disabled: false,
            action: { action: 'sniff' },
        });

        super.activate(unitScreenX, unitScreenY, items, null);
    }

    // Legacy interface used by game.handleScentMenuKeyUp(): returns the hovered
    // item's action payload ({action: 'place'|'remove'|'sniff', ...}) or null.
    handleClick() {
        const item = this.handleRelease();
        return item ? item.action : null;
    }
}
