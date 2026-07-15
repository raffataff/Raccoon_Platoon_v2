// js/grenadeRadialMenu.js
// Grenade-type picker, opened by holding G with a raccoon selected.
// Visuals and interaction come from the shared RadialMenu base (js/radialMenu.js);
// this class only builds the per-raccoon item list from the rank loadout.

class GrenadeRadialMenu extends RadialMenu {
    constructor(game) {
        super(game, CONFIG.GRENADE_RADIAL_MENU);
        this.idleCenterLines = ['PICK', 'TYPE'];
        this.disabledCenterText = 'EMPTY';
    }

    activate(screenX, screenY, raccoon) {
        if (!raccoon || typeof raccoon.getCarriedGrenadeTypes !== 'function') return;
        const typeKeys = raccoon.getCarriedGrenadeTypes();
        if (typeKeys.length === 0) return;

        const items = typeKeys.map(typeKey => {
            const typeCfg = CONFIG.GRENADE_TYPES[typeKey] || {};
            const ammo = raccoon.getGrenadeAmmo(typeKey);
            return {
                label: typeCfg.label || typeKey,
                iconChar: typeCfg.iconChar || '?',
                color: typeCfg.color || '#888888',
                badge: `×${ammo}`,
                disabled: ammo <= 0,
                typeKey: typeKey,
            };
        });

        super.activate(screenX, screenY, items, raccoon);
    }

    // Returns the selected grenade typeKey, or null.
    handleRelease() {
        const item = super.handleRelease();
        return item ? item.typeKey : null;
    }
}
