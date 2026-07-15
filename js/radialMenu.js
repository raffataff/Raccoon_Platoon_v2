// js/radialMenu.js
// RadialMenu — shared base class and standard visual design for ALL radial menus
// (grenade picker, scent menu, and future radials). Style comes from
// CONFIG.RADIAL_MENU_STYLE; subclasses may pass overrides but shouldn't need to.
//
// Readability strategy (battlefields are visually loud):
//   1. Full-screen dim separates the menu from the world.
//   2. A solid dark backdrop disc sits under the whole menu.
//   3. Segments are near-opaque dark fills with bright item-colored rims.
//   4. Labels sit on dark pill backgrounds; the center disc shows the hovered item.
//
// Subclass contract:
//   - Call super.activate(screenX, screenY, items, anchorUnit) with items shaped as
//     { label, iconChar, color, badge (string|null), disabled (bool), ...payload }.
//     Items are laid out first-at-bottom, proceeding counter-clockwise.
//   - handleRelease() returns the hovered item object (null if none/disabled);
//     subclasses map it to whatever their caller expects.
//   - Set this.idleCenterLines / this.disabledCenterText for the center readout.
//   - anchorUnit (optional): menu follows this unit's world position while open.

class RadialMenu {
    constructor(game, styleOverrides = null) {
        this.game = game;
        this._styleOverrides = styleOverrides;
        this._style = null;              // resolved at activate()
        this.isActive = false;
        this.hoveredIndex = -1;
        this.animProgress = 0;
        this.unitScreenX = 0;
        this.unitScreenY = 0;
        this.anchorUnit = null;
        this.items = [];
        this.idleCenterLines = [];       // center text when nothing is hovered
        this.disabledCenterText = 'N/A'; // center text when hovering a disabled item
    }

    activate(screenX, screenY, items, anchorUnit = null) {
        if (!items || items.length === 0) return;

        // Resolve style once per activation (no per-frame merging/allocation).
        this._style = Object.assign({}, RadialMenu.DEFAULT_STYLE, CONFIG.RADIAL_MENU_STYLE || {}, this._styleOverrides || {});

        const bottomAngle = Math.PI / 2;
        const anglePerSegment = (Math.PI * 2) / items.length;
        this.items = items.map((item, i) => Object.assign({}, item, {
            angle: bottomAngle - i * anglePerSegment,
            index: i,
        }));

        this.anchorUnit = anchorUnit;
        this.isActive = true;
        this.hoveredIndex = -1;
        this.animProgress = 0;
        this.unitScreenX = screenX;
        this.unitScreenY = screenY;
    }

    deactivate() {
        this.isActive = false;
        this.hoveredIndex = -1;
        this.anchorUnit = null;
    }

    update(deltaTime) {
        if (!this.isActive || !this._style) return;

        this.animProgress = Math.min(1, this.animProgress + deltaTime * (this._style.ANIMATION_SPEED || 12));

        // Follow the anchor unit if one was provided.
        if (this.anchorUnit && this.anchorUnit.isAlive && this.anchorUnit.isAlive() && this.game.worldToScreen) {
            const screen = this.game.worldToScreen(this.anchorUnit.x, this.anchorUnit.y);
            this.unitScreenX += (screen.x - this.unitScreenX) * 0.15;
            this.unitScreenY += (screen.y - this.unitScreenY) * 0.15;
        }

        this._updateHoveredIndex();
    }

    // Menu center after edge clamping — shared by render and hover detection so
    // selection stays accurate near screen edges.
    _clampedCenter() {
        const style = this._style;
        const canvas = this.game.canvas;
        const reach = (style.SEGMENT_OUTER_RADIUS || 108) + (style.LABEL_OFFSET || 16) + 70;
        const margin = style.EDGE_MARGIN || 40;
        return {
            x: Math.max(margin + reach, Math.min(canvas.width - margin - reach, this.unitScreenX)),
            y: Math.max(margin + reach, Math.min(canvas.height - margin - reach, this.unitScreenY)),
            reach: reach
        };
    }

    _updateHoveredIndex() {
        const input = this.game.inputHandler;
        if (!input) { this.hoveredIndex = -1; return; }

        const style = this._style;
        const center = this._clampedCenter();
        const mx = input.mousePos.screenX - center.x;
        const my = input.mousePos.screenY - center.y;
        const dist = Math.sqrt(mx * mx + my * my);

        // Generous outer bound: hovering past the ring (over the labels) still counts.
        if (dist < style.CENTER_GAP || dist > style.SEGMENT_OUTER_RADIUS + 60) {
            this.hoveredIndex = -1;
            return;
        }

        const mouseAngle = Math.atan2(my, mx);
        const segSpan = (Math.PI * 2) / this.items.length;
        let bestIndex = -1;
        let bestDiff = Infinity;

        for (const item of this.items) {
            let angleDiff = mouseAngle - item.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) < segSpan / 2 && Math.abs(angleDiff) < bestDiff) {
                bestDiff = Math.abs(angleDiff);
                bestIndex = item.index;
            }
        }

        this.hoveredIndex = bestIndex;
    }

    // Returns the hovered item object, or null if nothing selectable was hovered.
    handleRelease() {
        if (!this.isActive || this.hoveredIndex === -1) return null;
        const item = this.items.find(i => i.index === this.hoveredIndex);
        if (!item || item.disabled) return null;
        return item;
    }

    render(ctx) {
        if (!this.isActive || this.animProgress <= 0 || this.items.length === 0 || !this._style) return;

        const style = this._style;
        const canvas = this.game.canvas;
        const ease = this._easeOutBack(this.animProgress);

        ctx.save();

        // 1. Full-screen dim — pushes the battlefield back while choosing.
        ctx.fillStyle = `rgba(4, 6, 14, ${(style.SCREEN_DIM_ALPHA !== undefined ? style.SCREEN_DIM_ALPHA : 0.38) * this.animProgress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Keep the whole menu (ring + labels) on screen — same clamp as hover detection.
        const center = this._clampedCenter();
        const cx = center.x;
        const cy = center.y;
        const reach = center.reach;

        // 2. Backdrop disc under everything, soft-edged.
        const backdropR = reach * ease;
        const backdropGrad = ctx.createRadialGradient(cx, cy, backdropR * 0.35, cx, cy, backdropR);
        const backdropAlpha = (style.BACKDROP_ALPHA !== undefined ? style.BACKDROP_ALPHA : 0.85) * this.animProgress;
        backdropGrad.addColorStop(0, `rgba(10, 12, 25, ${backdropAlpha})`);
        backdropGrad.addColorStop(0.75, `rgba(10, 12, 25, ${backdropAlpha * 0.9})`);
        backdropGrad.addColorStop(1, 'rgba(10, 12, 25, 0)');
        ctx.fillStyle = backdropGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, backdropR, 0, Math.PI * 2);
        ctx.fill();

        // 3. Segments
        for (const item of this.items) {
            this._renderSegment(ctx, cx, cy, item, ease);
        }

        // 4. Center readout: hovered item name + badge, or the idle hint.
        this._renderCenter(ctx, cx, cy, ease);

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    _renderSegment(ctx, cx, cy, item, ease) {
        const style = this._style;
        const isHovered = this.hoveredIndex === item.index;
        const isDisabled = !!item.disabled;
        const color = item.color || '#888888';

        const segSpan = (Math.PI * 2) / this.items.length;
        const gap = style.SEGMENT_GAP_RADIANS || 0.05;
        const startAngle = item.angle - segSpan / 2 + gap / 2;
        const endAngle = item.angle + segSpan / 2 - gap / 2;
        const innerR = (style.SEGMENT_INNER_RADIUS || 40) * ease;
        const outerR = (style.SEGMENT_OUTER_RADIUS || 108) * ease;
        const fillAlpha = (style.SEGMENT_FILL_ALPHA !== undefined ? style.SEGMENT_FILL_ALPHA : 0.95) * this.animProgress;
        const disabledAlpha = style.DISABLED_SEGMENT_ALPHA !== undefined ? style.DISABLED_SEGMENT_ALPHA : 0.4;

        ctx.save();

        // Segment body: dark, near-opaque fill tinted by the item color.
        // Hovered: brighter tinted fill. Disabled: flat grey.
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();

        let bodyColor;
        if (isDisabled) {
            bodyColor = '#23252e';
        } else if (isHovered) {
            bodyColor = this._mixToward(color, '#0e1020', 0.45);
        } else {
            bodyColor = this._mixToward(color, '#0e1020', 0.72);
        }
        ctx.fillStyle = bodyColor;
        ctx.globalAlpha = fillAlpha;
        ctx.fill();

        // Bright item-colored rim: the color-coding carries identification.
        if (isHovered && !isDisabled) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 14;
        }
        ctx.strokeStyle = isDisabled ? 'rgba(255,255,255,0.15)' : color;
        ctx.lineWidth = isHovered && !isDisabled ? 3 : 2;
        ctx.globalAlpha = this.animProgress * (isDisabled ? disabledAlpha : (isHovered ? 1.0 : 0.85));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Icon (+ optional badge) inside the segment.
        const iconR = (innerR + outerR) * 0.5;
        const ix = cx + Math.cos(item.angle) * iconR;
        const iy = cy + Math.sin(item.angle) * iconR;
        const iconSize = (style.ICON_SIZE || 24) * ease;
        const hasBadge = item.badge !== null && item.badge !== undefined;
        const contentAlpha = this.animProgress * (isDisabled ? disabledAlpha + 0.15 : 1.0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${iconSize}px sans-serif`;
        ctx.globalAlpha = contentAlpha;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = isDisabled ? '#777777' : '#ffffff';
        ctx.fillText(item.iconChar || '?', ix, hasBadge ? iy - 6 : iy);

        if (hasBadge) {
            const badgeSize = (style.BADGE_FONT_SIZE || 13) * ease;
            ctx.font = `bold ${badgeSize}px 'Consolas', 'Lucida Console', monospace`;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.strokeText(item.badge, ix, iy + iconSize * 0.62);
            ctx.fillStyle = isDisabled ? '#cc6666' : '#ffffff';
            ctx.fillText(item.badge, ix, iy + iconSize * 0.62);
        }
        ctx.shadowBlur = 0;

        // Label on a dark pill outside the ring.
        const labelText = item.label || '?';
        const fontSize = (style.LABEL_FONT_SIZE || 13) * ease;
        ctx.font = `bold ${fontSize}px 'Consolas', 'Lucida Console', monospace`;
        const textW = ctx.measureText(labelText).width;
        const pillH = fontSize + 8;
        const pillW = textW + 16;
        const labelR = outerR + (style.LABEL_OFFSET || 16) * ease + pillH / 2;
        const cosA = Math.cos(item.angle);
        const sinA = Math.sin(item.angle);
        // Push the pill outward horizontally so side labels clear the ring.
        const lx = cx + cosA * labelR + cosA * (pillW / 2) * 0.8;
        const ly = cy + sinA * labelR;

        ctx.globalAlpha = this.animProgress * (isDisabled ? disabledAlpha + 0.2 : 1.0);
        ctx.fillStyle = 'rgba(8, 10, 20, 0.9)';
        this._roundRect(ctx, lx - pillW / 2, ly - pillH / 2, pillW, pillH, pillH / 2);
        ctx.fill();
        if (isHovered && !isDisabled) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            this._roundRect(ctx, lx - pillW / 2, ly - pillH / 2, pillW, pillH, pillH / 2);
            ctx.stroke();
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDisabled ? '#888888' : (isHovered ? '#ffffff' : color);
        ctx.fillText(labelText, lx, ly + 1);

        ctx.restore();
    }

    _renderCenter(ctx, cx, cy, ease) {
        const style = this._style;
        const r = (style.CENTER_CIRCLE_RADIUS || 34) * ease;
        const hovered = this.hoveredIndex !== -1 ? this.items.find(i => i.index === this.hoveredIndex) : null;
        const hoveredValid = hovered && !hovered.disabled;
        const accent = hoveredValid ? (hovered.color || '#ffffff') : 'rgba(255,255,255,0.35)';

        ctx.save();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = style.BG_COLOR || '#10121f';
        ctx.globalAlpha = this.animProgress * 0.95;
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = this.animProgress;
        if (hoveredValid) {
            const hasBadge = hovered.badge !== null && hovered.badge !== undefined;
            ctx.font = `bold ${Math.max(10, 12 * ease)}px 'Consolas', 'Lucida Console', monospace`;
            ctx.fillStyle = accent;
            ctx.fillText(hovered.label || '', cx, hasBadge ? cy - 8 : cy);
            if (hasBadge) {
                ctx.font = `bold ${Math.max(9, 11 * ease)}px 'Consolas', 'Lucida Console', monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(hovered.badge, cx, cy + 9);
            }
        } else if (hovered && hovered.disabled) {
            ctx.font = `bold ${Math.max(9, 11 * ease)}px 'Consolas', 'Lucida Console', monospace`;
            ctx.fillStyle = '#cc6666';
            ctx.fillText(this.disabledCenterText, cx, cy);
        } else {
            ctx.font = `bold ${Math.max(9, 10 * ease)}px 'Consolas', 'Lucida Console', monospace`;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const lines = this.idleCenterLines;
            if (lines.length === 1) {
                ctx.fillText(lines[0], cx, cy);
            } else if (lines.length > 1) {
                ctx.fillText(lines[0], cx, cy - 7);
                ctx.fillText(lines[1], cx, cy + 7);
            }
        }

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    _easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    // Mix a hex color toward another color by t (0 = unchanged, 1 = fully target).
    _mixToward(hexColor, targetHex, t) {
        const parse = (hex) => {
            const h = hex.startsWith('#') ? hex.slice(1) : hex;
            if (h.length === 3) {
                return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
            }
            return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
        };
        try {
            const [r1, g1, b1] = parse(hexColor);
            const [r2, g2, b2] = parse(targetHex);
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            return `rgb(${r},${g},${b})`;
        } catch (e) {
            return hexColor;
        }
    }
}

// Fallback style if CONFIG.RADIAL_MENU_STYLE is missing (kept in sync with config.js).
RadialMenu.DEFAULT_STYLE = {
    CENTER_GAP: 28,
    SEGMENT_INNER_RADIUS: 40,
    SEGMENT_OUTER_RADIUS: 108,
    SEGMENT_GAP_RADIANS: 0.05,
    CENTER_CIRCLE_RADIUS: 34,
    BG_COLOR: '#10121f',
    BACKDROP_ALPHA: 0.85,
    SCREEN_DIM_ALPHA: 0.38,
    SEGMENT_FILL_ALPHA: 0.95,
    HOVER_BRIGHTNESS: 1.35,
    ICON_SIZE: 24,
    BADGE_FONT_SIZE: 13,
    LABEL_FONT_SIZE: 13,
    LABEL_OFFSET: 16,
    ANIMATION_SPEED: 12,
    EDGE_MARGIN: 40,
    DISABLED_SEGMENT_ALPHA: 0.4,
};
