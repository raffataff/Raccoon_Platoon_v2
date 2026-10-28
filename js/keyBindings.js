// js/keyBindings.js
// Rebindable keyboard controls.
//
// Every action in CONFIG.KEY_BINDINGS.ACTIONS is bound to one physical key
// (KeyboardEvent.code). InputHandler asks actionFor(event) instead of testing
// letters, so a rebind takes effect on the next key press. Binding a key that
// another action already uses swaps the two, so no action is ever left without a
// key by accident.
//
// The player's map is stored as the 'keyBindings' preference ({ ACTION: code }) and
// edited on Options → Controls (ui.js, _initKeyBindingOptions). No save impact.

class KeyBindings {
    static PREF_KEY = 'keyBindings';

    // Display names for codes that aren't simply "Key<letter>" / "Digit<n>".
    static LABELS = {
        Space: 'Space', Enter: 'Enter', Backspace: 'Bksp', Delete: 'Del', Insert: 'Ins',
        Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn',
        ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
        Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
        Backslash: '\\', IntlBackslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
        NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /',
        NumpadDecimal: 'Num .', NumpadEnter: 'Num Enter',
        Pause: 'Pause', ScrollLock: 'ScrLk', NumLock: 'NumLk', PrintScreen: 'PrtSc',
    };

    constructor() {
        this.cfg = CONFIG.KEY_BINDINGS;
        this.actions = this.cfg.ACTIONS;
        this._defs = new Map(this.actions.map(a => [a.key, a]));
        this._reserved = new Set(this.cfg.RESERVED);
        this.bindings = {};                 // action -> code ('' = unbound)
        this._codeToAction = new Map();     // code -> action, rebuilt on every change
        this.listeners = [];
        this._load(SaveManager.getPreference(KeyBindings.PREF_KEY, null));
        this._rebuildIndex();
    }

    // ---------------------------------------------------------------- lookups

    /** The action bound to this keyboard event's key, or null. Called on every keydown/keyup. */
    actionFor(event) {
        return this._codeToAction.get(KeyBindings.codeOf(event)) || null;
    }

    codeFor(action) {
        return this.bindings[action] || '';
    }

    /** Display label of the key bound to `action` ("E", "Space", "—" when unbound). */
    label(action) {
        return KeyBindings.codeLabel(this.codeFor(action));
    }

    getAction(action) {
        return this._defs.get(action) || null;
    }

    isReserved(code) {
        return this._reserved.has(code);
    }

    isDefault(action) {
        const def = this._defs.get(action);
        return !!def && this.codeFor(action) === def.code;
    }

    // ---------------------------------------------------------------- editing

    /**
     * Bind `action` to the key `code`. When another action already has that key, it takes
     * this action's old key instead. Returns the action that was swapped, or null.
     */
    set(action, code) {
        if (!this._defs.has(action) || !code || this.isReserved(code)) return null;
        const previous = this.codeFor(action);
        if (previous === code) return null;
        const other = this._codeToAction.get(code) || null;
        if (other) this.bindings[other] = previous;
        this.bindings[action] = code;
        this._commit();
        return other;
    }

    reset() {
        this._load(null);
        this._commit();
    }

    /** fn(keyBindings) runs after every change. */
    onChange(fn) {
        this.listeners.push(fn);
    }

    // ---------------------------------------------------------------- internals

    // Saved keys win, then defaults fill in actions the save doesn't mention (e.g. ones added
    // in a later version). A key claimed twice keeps its first action; the other is unbound.
    _load(raw) {
        const src = (raw && typeof raw === 'object') ? raw : {};
        const used = new Set();
        this.bindings = {};
        for (const a of this.actions) {
            const code = src[a.key];
            if (typeof code !== 'string' || !(a.key in src)) continue;
            if (code && (used.has(code) || this.isReserved(code))) {
                this.bindings[a.key] = '';
                continue;
            }
            this.bindings[a.key] = code;
            if (code) used.add(code);
        }
        for (const a of this.actions) {
            if (a.key in this.bindings) continue;
            this.bindings[a.key] = used.has(a.code) ? '' : a.code;
            used.add(a.code);
        }
    }

    _rebuildIndex() {
        this._codeToAction.clear();
        for (const a of this.actions) {
            const code = this.bindings[a.key];
            if (code) this._codeToAction.set(code, a.key);
        }
    }

    _commit() {
        this._rebuildIndex();
        SaveManager.savePreference(KeyBindings.PREF_KEY, this.bindings);
        for (const fn of this.listeners) fn(this);
    }

    // ---------------------------------------------------------------- key names

    /** KeyboardEvent.code, derived from .key when a browser/virtual keyboard leaves it empty. */
    static codeOf(event) {
        if (event.code) return event.code;
        const k = event.key || '';
        if (k === ' ') return 'Space';
        if (k.length === 1) {
            const upper = k.toUpperCase();
            if (upper >= 'A' && upper <= 'Z') return 'Key' + upper;
            if (k >= '0' && k <= '9') return 'Digit' + k;
        }
        return k;
    }

    static codeLabel(code) {
        if (!code) return '—';
        const named = KeyBindings.LABELS[code];
        if (named) return named;
        if (code.startsWith('Key')) return code.slice(3);
        if (code.startsWith('Digit')) return code.slice(5);
        if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
        return code;
    }
}
