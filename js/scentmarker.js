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

class ScentRadialMenu {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.hoveredIndex = -1;
        this.animProgress = 0;
        this.segmentAngles = [];
        this.unitScreenX = 0;
        this.unitScreenY = 0;
        this.driftOffset = { x: 0, y: 0 };
        this.lastDriftChange = 0;
        this.childMarkerItems = [];
        this._buildSegments();
    }

    _buildSegments() {
        const radCfg = this.game.config
            ? this.game.config.SCENT_MARKERS.RADIAL_MENU
            : CONFIG.SCENT_MARKERS.RADIAL_MENU;
        const typeKeys = Object.keys(CONFIG.SCENT_MARKERS.TYPES);
        const totalSegments = typeKeys.length + 2;
        const segmentCount = totalSegments;
        const bottomAngle = Math.PI / 2;
        const totalSpan = Math.PI * 2;
        const anglePerSegment = totalSpan / segmentCount;

        this.segmentAngles = [];
        const startAngle = bottomAngle + totalSpan - anglePerSegment;

        for (let i = 0; i < segmentCount; i++) {
            let angle = startAngle - i * anglePerSegment;
            this.segmentAngles.push(angle);
        }

        this.childMarkerItems = [];
        for (let i = 0; i < typeKeys.length; i++) {
            this.childMarkerItems.push({
                typeKey: typeKeys[i],
                typeConfig: CONFIG.SCENT_MARKERS.TYPES[typeKeys[i]],
                angle: this.segmentAngles[i],
                index: i,
            });
        }

        const removeIndex = typeKeys.length;
        this.removeItem = {
            label: radCfg.REMOVE_LABEL,
            color: radCfg.REMOVE_COLOR,
            hoverColor: radCfg.REMOVE_HOVER_COLOR,
            angle: this.segmentAngles[removeIndex],
            index: removeIndex,
        };

        const sniffIndex = typeKeys.length + 1;
        this.sniffItem = {
            label: radCfg.SNIFF_LABEL,
            color: radCfg.SNIFF_COLOR,
            hoverColor: radCfg.SNIFF_HOVER_COLOR,
            iconChar: '\u00A1',
            angle: this.segmentAngles[sniffIndex],
            index: sniffIndex,
        };
    }

    activate(unitScreenX, unitScreenY) {
        this.isActive = true;
        this.hoveredIndex = -1;
        this.animProgress = 0;
        this.unitScreenX = unitScreenX;
        this.unitScreenY = unitScreenY;
        this.driftOffset = { x: 0, y: 0 };
        this.lastDriftChange = performance.now() / 1000;
    }

    deactivate() {
        this.isActive = false;
        this.hoveredIndex = -1;
    }

    update(deltaTime) {
        if (!this.isActive) return;

        const radCfg = CONFIG.SCENT_MARKERS.RADIAL_MENU;
        this.animProgress = Math.min(1, this.animProgress + deltaTime * radCfg.ANIMATION_SPEED);

        const now = performance.now() / 1000;
        if (now - this.lastDriftChange > radCfg.DRIFT_INTERVAL) {
            this.lastDriftChange = now;
            this.driftOffset.x = (Math.random() - 0.5) * radCfg.DRIFT_AMOUNT;
            this.driftOffset.y = (Math.random() - 0.5) * radCfg.DRIFT_AMOUNT;
        } else {
            const lerpSpeed = radCfg.DRIFT_SPEED;
            this.driftOffset.x += ((Math.random() - 0.5) * radCfg.DRIFT_AMOUNT - this.driftOffset.x) * lerpSpeed * deltaTime;
            this.driftOffset.y += ((Math.random() - 0.5) * radCfg.DRIFT_AMOUNT - this.driftOffset.y) * lerpSpeed * deltaTime;
        }

        this._updateHoveredIndex();
    }

    _updateHoveredIndex() {
        const input = this.game.inputHandler;
        if (!input) {
            this.hoveredIndex = -1;
            return;
        }

        const radCfg = CONFIG.SCENT_MARKERS.RADIAL_MENU;
        const cx = this.unitScreenX + this.driftOffset.x;
        const cy = this.unitScreenY + this.driftOffset.y;
        const mx = input.mousePos.screenX - cx;
        const my = input.mousePos.screenY - cy;
        const dist = Math.sqrt(mx * mx + my * my);

        if (dist < radCfg.CENTER_GAP || dist > radCfg.SEGMENT_OUTER_RADIUS + 10) {
            this.hoveredIndex = -1;
            return;
        }

        let mouseAngle = Math.atan2(my, mx);

        let bestIndex = -1;
        let bestDist = Infinity;

        const checkSegments = [
            ...this.childMarkerItems.map(s => ({ angle: s.angle, index: s.index })),
            { angle: this.removeItem.angle, index: this.removeItem.index },
            { angle: this.sniffItem.angle, index: this.sniffItem.index },
        ];

        for (const seg of checkSegments) {
            const gap = radCfg.SEGMENT_GAP_RADIANS;
            const segCount = this.segmentAngles.length;
            const segSpan = (Math.PI * 2) / segCount;
            let angleDiff = mouseAngle - seg.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < segSpan / 2 - gap / 2) {
                const d = Math.abs(angleDiff);
                if (d < bestDist) {
                    bestDist = d;
                    bestIndex = seg.index;
                }
            }
        }

        this.hoveredIndex = bestIndex;
    }

    handleClick() {
        if (!this.isActive) return null;

        if (this.hoveredIndex === -1) return null;

        const typeMatch = this.childMarkerItems.find(s => s.index === this.hoveredIndex);
        if (typeMatch) {
            return { action: 'place', markerType: typeMatch.typeKey };
        }

        if (this.hoveredIndex === this.removeItem.index) {
            return { action: 'remove' };
        }

        if (this.hoveredIndex === this.sniffItem.index) {
            return { action: 'sniff' };
        }

        return null;
    }

    render(ctx) {
        if (!this.isActive || this.animProgress <= 0) return;

        const radCfg = CONFIG.SCENT_MARKERS.RADIAL_MENU;
        const cx = this.unitScreenX + this.driftOffset.x;
        const cy = this.unitScreenY + this.driftOffset.y;
        const ease = this._easeOutBack(this.animProgress);

        ctx.save();

        const canvas = this.game.canvas;
        const margin = radCfg.EDGE_MARGIN;
        const clampedX = Math.max(margin + radCfg.RADIUS, Math.min(canvas.width - margin - radCfg.RADIUS, cx));
        const clampedY = Math.max(margin + radCfg.RADIUS, Math.min(canvas.height - margin - radCfg.RADIUS, cy));
        if (clampedX !== cx || clampedY !== cy) {
            ctx.translate(clampedX - cx, clampedY - cy);
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radCfg.CENTER_CIRCLE_RADIUS * ease, 0, Math.PI * 2);
        ctx.fillStyle = radCfg.BG_COLOR;
        ctx.globalAlpha = radCfg.BG_ALPHA * this.animProgress;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        for (const seg of this.childMarkerItems) {
            this._renderSegment(ctx, cx, cy, seg.angle, seg.typeConfig.color, seg.typeConfig.iconChar,
                seg.typeConfig.label, seg.index, ease, seg.typeConfig.color);
        }

        this._renderSegment(ctx, cx, cy, this.removeItem.angle, this.removeItem.color, '\u2715',
            this.removeItem.label, this.removeItem.index, ease, this.removeItem.hoverColor);

        this._renderSegment(ctx, cx, cy, this.sniffItem.angle, this.sniffItem.color, '\u00A1',
            this.sniffItem.label, this.sniffItem.index, ease, this.sniffItem.hoverColor);

        ctx.beginPath();
        ctx.arc(cx, cy, radCfg.CENTER_GAP * ease, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.globalAlpha = this.animProgress * 0.6;
        ctx.fill();

        for (const seg of this.childMarkerItems) {
            this._renderConnectorLine(ctx, cx, cy, seg.angle, seg.typeConfig.color, ease);
        }
        this._renderConnectorLine(ctx, cx, cy, this.removeItem.angle, this.removeItem.color, ease);
        this._renderConnectorLine(ctx, cx, cy, this.sniffItem.angle, this.sniffItem.color, ease);

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    _renderSegment(ctx, cx, cy, segmentCenterAngle, color, iconChar, label, index, ease, hoverColor) {
        const radCfg = CONFIG.SCENT_MARKERS.RADIAL_MENU;
        const isHovered = this.hoveredIndex === index;
        const segCount = this.segmentAngles.length;
        const segSpan = (Math.PI * 2) / segCount;
        const gap = radCfg.SEGMENT_GAP_RADIANS;
        const startAngle = segmentCenterAngle - segSpan / 2 + gap / 2;
        const endAngle = segmentCenterAngle + segSpan / 2 - gap / 2;
        const innerR = radCfg.SEGMENT_INNER_RADIUS * ease;
        const outerR = radCfg.SEGMENT_OUTER_RADIUS * ease;

        ctx.save();

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();

        if (isHovered) {
            ctx.shadowColor = hoverColor;
            ctx.shadowBlur = 15;
            ctx.fillStyle = this._adjustBrightness(color, radCfg.HOVER_BRIGHTNESS);
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
        }

        ctx.globalAlpha = (isHovered ? 0.45 : 0.3) * this.animProgress;
        ctx.fill();

        ctx.strokeStyle = isHovered ? hoverColor : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.globalAlpha = this.animProgress * (isHovered ? 0.9 : 0.5);
        ctx.stroke();

        ctx.shadowBlur = 0;

        const midAngle = segmentCenterAngle;
        const iconR = (innerR + outerR) * 0.5;
        const ix = cx + Math.cos(midAngle) * iconR;
        const iy = cy + Math.sin(midAngle) * iconR;

        const iconSize = radCfg.ICON_SIZE * ease;
        ctx.font = `bold ${iconSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = this.animProgress * (isHovered ? 1.0 : 0.8);
        ctx.fillStyle = isHovered ? radCfg.HOVER_COLOR : '#ffffff';
        ctx.fillText(iconChar, ix, iy + 1);

        const labelR = outerR + radCfg.LABEL_OFFSET * ease;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        const fontSize = radCfg.LABEL_FONT_SIZE * ease;
        ctx.font = `bold ${fontSize}px 'Consolas', 'Lucida Console', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = isHovered ? hoverColor : '#cccccc';
        ctx.globalAlpha = this.animProgress * (isHovered ? 1.0 : 0.7);
        ctx.fillText(label, lx, ly);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    _renderConnectorLine(ctx, cx, cy, angle, color, ease) {
        const radCfg = CONFIG.SCENT_MARKERS.RADIAL_MENU;
        const innerR = radCfg.CENTER_CIRCLE_RADIUS * ease;
        const startR = innerR + 2;
        const endR = radCfg.SEGMENT_INNER_RADIUS * ease - 2;

        if (endR <= startR) return;

        const x1 = cx + Math.cos(angle) * startR;
        const y1 = cy + Math.sin(angle) * startR;
        const x2 = cx + Math.cos(angle) * endR;
        const y2 = cy + Math.sin(angle) * endR;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = this.animProgress * 0.25;
        ctx.stroke();
    }

    _easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    _adjustBrightness(hexColor, factor) {
        let r, g, b;
        if (hexColor.startsWith('#')) {
            const hex = hexColor.slice(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else {
            return hexColor;
        }
        r = Math.min(255, Math.floor(r * factor));
        g = Math.min(255, Math.floor(g * factor));
        b = Math.min(255, Math.floor(b * factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}
