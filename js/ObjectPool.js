// js/ObjectPool.js

class ObjectPool {
    constructor(ObjectClass, initialSize = 10, gameInstance = null, ...args) {
        this.ObjectClass = ObjectClass; // The class of objects this pool will manage
        this.pool = [];                 // Stores available (inactive) objects
        this.game = gameInstance;       // Reference to the game, if needed by the ObjectClass constructor
        this.creationArgs = args;       // Additional arguments for the ObjectClass constructor

        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            const obj = this._createObject();
            this.pool.push(obj);
        }
        console.log(`[ObjectPool] Initialized for ${ObjectClass.name} with ${initialSize} objects.`);
    }

    _createObject() {
        // For Projectile and GrenadeProjectile, the constructor signature is complex
        // and often relies on runtime data. We'll handle the full initialization in 'acquire'.
        // Here, we just create an instance. The 'reset' method will do the heavy lifting.
        const obj = new this.ObjectClass(...this._getPlaceholderCreationArgs());
        obj._pooled = true; // Mark it as a pooled object
        obj.isActiveInPool = false; // Custom flag to track if it's currently in use from the pool
        return obj;
    }

    _getPlaceholderCreationArgs() {
        // Provides minimal valid arguments for initial object construction.
        // This needs to match the signature of the ObjectClass constructor
        // but values can be placeholders as `reset` will set them properly.
        if (this.ObjectClass.name === "Projectile") {
            // startX, startY, targetX, targetY, damage, speed, color, game, shooterUnit, effectiveAccuracy
            return [0, 0, 0, 0, 0, 0, '#FFF', this.game, null, 1.0];
        } else if (this.ObjectClass.name === "GrenadeProjectile") {
            // startX, startY, targetX, targetY, game, shooterUnit
            return [0, 0, 0, 0, this.game, null];
        }
        return this.creationArgs; // Fallback for other types
    }


    acquire() {
        let obj = null;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            // Pool is empty, create a new one (consider logging this if it happens often)
            console.warn(`[ObjectPool] Pool for ${this.ObjectClass.name} empty. Creating new object.`);
            obj = this._createObject();
        }
        obj.isActiveInPool = true;
        return obj;
    }

    release(obj) {
        if (obj && obj._pooled && obj.isActiveInPool) {
            obj.isActiveInPool = false;
            // Optional: Call a reset method on the object if it exists
            if (typeof obj.reset === 'function') {
                // The reset method should take the necessary parameters to re-initialize the object
                // For now, we'll let the calling code (e.g., Game.js) handle re-initialization.
                // Or, the reset method itself could be designed to be parameterless if state is reset internally.
            }
            this.pool.push(obj);
        } else if (obj && obj._pooled && !obj.isActiveInPool) {
            // Already released, do nothing or log warning.
        } else if (obj) {
            console.warn(`[ObjectPool] Attempted to release non-pooled or unknown state object:`, obj);
        }
    }

    getPoolSize() {
        return this.pool.length;
    }

    getActiveCount() {
        // This requires iterating or maintaining a separate count.
        // For now, we can infer it based on initial size and current pool length,
        // assuming initialSize objects were created. This is an approximation if new ones are made on demand.
        // A more robust way is to have isActiveInPool set and count them.
        let active = 0;
        // This is not very efficient for large numbers of objects NOT in the pool.
        // If an exact active count is needed frequently, Game.js should track active pooled objects.
        return `Pool for ${this.ObjectClass.name}: ${this.pool.length} available. (Active count not directly tracked by pool)`;
    }
}