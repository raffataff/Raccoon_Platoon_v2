// js/saveManager.js
// Handles save/load operations using browser localStorage

class SaveManager {
    static STORAGE_KEY = 'raccoon_platoon_saves';
    static PREFERENCES_KEY = 'raccoon_platoon_preferences';
    static MAX_SLOTS = 5;
    static SAVE_VERSION = 1;

    static getPreferences() {
        try {
            const stored = localStorage.getItem(this.PREFERENCES_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('Failed to load preferences:', e);
            return {};
        }
    }

    static savePreference(key, value) {
        try {
            const prefs = this.getPreferences();
            prefs[key] = value;
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.warn('Failed to save preference:', e);
        }
    }

    static getPreference(key, defaultValue = null) {
        const prefs = this.getPreferences();
        return prefs.hasOwnProperty(key) ? prefs[key] : defaultValue;
    }

    static getDismissalPreference(key, defaultValue = false) {
        return this.getPreference(`dismiss_${key}`, defaultValue);
    }

    static setDismissalPreference(key, value) {
        this.savePreference(`dismiss_${key}`, value);
    }

    static resetAllDismissalPreferences() {
        const prefs = this.getPreferences();
        const keysToRemove = Object.keys(prefs).filter(k => k.startsWith('dismiss_'));
        for (const k of keysToRemove) {
            delete prefs[k];
        }
        try {
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.warn('Failed to reset dismissal preferences:', e);
        }
    }

    /**
     * Get all save slot metadata (for displaying in UI)
     * @returns {Array} Array of save slot info objects
     */
    static getSaveSlots() {
        const saves = this._getAllSaves();
        const slots = [];
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            if (saves[i]) {
                slots.push({
                    slotIndex: i,
                    isEmpty: false,
                    slotName: saves[i].slotName || `Save ${i + 1}`,
                    timestamp: saves[i].timestamp,
                    timestampDisplay: this._formatTimestamp(saves[i].timestamp),
                    version: saves[i].version,
                    isNightMission: saves[i].data?.isNightMission || false
                });
            } else {
                slots.push({
                    slotIndex: i,
                    isEmpty: true,
                    slotName: `Empty Slot ${i + 1}`,
                    timestamp: null,
                    timestampDisplay: null,
                    version: null,
                    isNightMission: false
                });
            }
        }
        return slots;
    }

    /**
     * Get most recent save slot (for "Continue" button)
     * @returns {Object|null} Most recent save slot info or null
     */
    static getMostRecentSave() {
        const saves = this._getAllSaves();
        let mostRecent = null;
        let mostRecentTime = 0;

        for (let i = 0; i < this.MAX_SLOTS; i++) {
            if (saves[i] && saves[i].timestamp > mostRecentTime) {
                mostRecent = {
                    slotIndex: i,
                    ...saves[i]
                };
                mostRecentTime = saves[i].timestamp;
            }
        }
        return mostRecent;
    }

    /**
     * Save the current game state to a slot
     * @param {Game} game - The game instance
     * @param {number} slotIndex - Slot index (0-2)
     * @returns {boolean} Success
     */
    static saveToSlot(game, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
//            console.error('[SaveManager] Invalid slot index:', slotIndex);
            return false;
        }

        try {
            const saveData = this._serializeGameState(game);
            const saves = this._getAllSaves();
            saves[slotIndex] = saveData;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
            game.currentSaveSlot = slotIndex; // Update active slot
//            console.log(`[SaveManager] Saved to slot ${slotIndex + 1}:`, saveData.slotName);
            return true;
        } catch (error) {
//            console.error('[SaveManager] Failed to save:', error);
            return false;
        }
    }

    /**
     * Load game state from a slot
     * @param {Game} game - The game instance
     * @param {number} slotIndex - Slot index (0-2)
     * @returns {boolean} Success
     */
    static loadFromSlot(game, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
//            console.error('[SaveManager] Invalid slot index:', slotIndex);
            return false;
        }

        try {
            const saves = this._getAllSaves();
            const saveData = saves[slotIndex];

            if (!saveData) {
//                console.warn('[SaveManager] Slot is empty:', slotIndex);
                return false;
            }

            // Version check for future compatibility
            if (saveData.version !== this.SAVE_VERSION) {
//                console.warn(`[SaveManager] Save version mismatch. Save: ${saveData.version}, Current: ${this.SAVE_VERSION}`);
                // For now, attempt to load anyway. Future versions may need migration logic.
            }

            this._deserializeGameState(game, saveData.data);
            game.currentSaveSlot = slotIndex; // Update active slot
//            console.log(`[SaveManager] Loaded from slot ${slotIndex + 1}:`, saveData.slotName);
            return true;
        } catch (error) {
//            console.error('[SaveManager] Failed to load:', error);
            return false;
        }
    }

    /**
     * Delete a save slot
     * @param {number} slotIndex - Slot index (0-2)
     * @returns {boolean} Success
     */
    static deleteSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
//            console.error('[SaveManager] Invalid slot index:', slotIndex);
            return false;
        }

        try {
            const saves = this._getAllSaves();
            saves[slotIndex] = null;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
//            console.log(`[SaveManager] Deleted slot ${slotIndex + 1}`);
            return true;
        } catch (error) {
//            console.error('[SaveManager] Failed to delete:', error);
            return false;
        }
    }

    /**
     * Export a save slot as JSON string (for download)
     * @param {number} slotIndex - Slot index (0-2)
     * @returns {string|null} JSON string or null
     */
    static exportSave(slotIndex) {
        try {
            const saves = this._getAllSaves();
            const saveData = saves[slotIndex];
            if (!saveData) {
//                console.warn('[SaveManager] Cannot export empty slot:', slotIndex);
                return null;
            }
            return JSON.stringify(saveData, null, 2);
        } catch (error) {
//            console.error('[SaveManager] Failed to export:', error);
            return null;
        }
    }

    /**
     * Import a save from JSON string
     * @param {string} jsonString - JSON save data
     * @param {number} slotIndex - Slot to import into
     * @returns {boolean} Success
     */
    static importSave(jsonString, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
//            console.error('[SaveManager] Invalid slot index:', slotIndex);
            return false;
        }

        try {
            const saveData = JSON.parse(jsonString);

            // Basic validation
            if (!saveData.version || !saveData.data || !saveData.data.campaignSeed) {
//                console.error('[SaveManager] Invalid save file format');
                return false;
            }

            const saves = this._getAllSaves();
            saves[slotIndex] = saveData;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
//            console.log(`[SaveManager] Imported to slot ${slotIndex + 1}`);
            return true;
        } catch (error) {
//            console.error('[SaveManager] Failed to import:', error);
            return false;
        }
    }

    /**
     * Check if any saves exist
     * @returns {boolean}
     */
    static hasSaves() {
        const saves = this._getAllSaves();
        return saves.some(s => s !== null);
    }

    /**
     * Auto-save current campaign progress to the campaign's save slot
     * @param {Game} game - The game instance
     * @returns {boolean} Success
     */
    static autoSave(game) {
        if (!game || !game.campaignSeed) {
            return false;
        }

        try {
            const slotIndex = this.findSlotForCampaign(game.campaignSeed);
            return this.saveToSlot(game, slotIndex);
        } catch (error) {
            return false;
        }
    }

    /**
     * Auto-load campaign progress (for session restoration)
     * @param {Game} game - The game instance
     * @returns {boolean} Success
     */
    static autoLoad(game) {
        try {
            if (!game) return false;

            const saves = this._getAllSaves();
            
            // If we have a campaign seed, find the matching slot
            if (game.campaignSeed) {
                const slotIndex = this.findSlotForCampaign(game.campaignSeed);
                if (saves[slotIndex]) {
                    return this.loadFromSlot(game, slotIndex);
                }
            }

            // No campaign seed or no matching slot - find most recent save
            const mostRecent = this.getMostRecentSave();
            if (mostRecent) {
                return this.loadFromSlot(game, mostRecent.slotIndex);
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Find a save slot for a campaign (by seed) or fallback to empty/most recent slot
     * @param {number} campaignSeed - The campaign seed
     * @returns {number} Slot index to use
     */
    static findSlotForCampaign(campaignSeed) {
        const saves = this._getAllSaves();

        // First, look for a slot with matching campaign seed
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            if (saves[i] && saves[i].data && saves[i].data.campaignSeed === campaignSeed) {
//                console.log(`[SaveManager] Found matching slot ${i} for seed ${campaignSeed}`);
                return i;
            }
        }

        // No match found - find first empty slot
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            if (!saves[i]) {
//                console.log(`[SaveManager] Using empty slot ${i} for continued campaign`);
                return i;
            }
        }

        // All slots full - use most recent slot
        let mostRecentIdx = 0;
        let mostRecentTime = 0;
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            if (saves[i] && saves[i].timestamp > mostRecentTime) {
                mostRecentTime = saves[i].timestamp;
                mostRecentIdx = i;
            }
        }
//        console.log(`[SaveManager] All slots full, using most recent slot ${mostRecentIdx} for continued campaign`);
        return mostRecentIdx;
    }

    /**
     * Check if an auto-save exists (now delegates to hasSaves since auto-saves go to slots)
     * @returns {boolean}
     */
    static hasAutoSave() {
        return this.hasSaves();
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Get all saves from localStorage
     * @private
     */
    static _getAllSaves() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const saves = JSON.parse(data);
                // Ensure array has correct length
                while (saves.length < this.MAX_SLOTS) saves.push(null);
                return saves;
            }
        } catch (error) {
//            console.error('[SaveManager] Failed to read saves:', error);
        }
        return [null, null, null];
    }

    /**
     * Serialize game state to saveable format
     * @private
     */
    static _serializeGameState(game) {
        const phaseData = game.campaignStructure[game.currentPhaseIndex];
        const phaseName = phaseData ? phaseData.name : `Phase ${game.currentPhaseIndex + 1}`;
        const rosterCount = game.masterRoster ? game.masterRoster.length : 0;

        const slotName = `Phase ${game.currentPhaseIndex + 1}: ${phaseName} - Mission ${game.currentMissionIndex + 1} | ${rosterCount} Raccoons`;
        
//        console.log(`[SaveManager] Saving campaignSeed: ${game.campaignSeed}, phase: ${game.currentPhaseIndex}, mission: ${game.currentMissionIndex}`);

        return {
            version: this.SAVE_VERSION,
            timestamp: Date.now(),
            slotName: slotName,
            data: {
                campaignSeed: game.campaignSeed,
                campaignSeedRNGState: game.campaignSeedRNG ? game.campaignSeedRNG.seed : null,
                totalCampaignPhases: game.totalCampaignPhases,
                currentPhaseIndex: game.currentPhaseIndex,
                currentMissionIndex: game.currentMissionIndex,
                isNightMission: game.isNightMission,
                masterRoster: this._serializeRoster(game.masterRoster),
                fallenRaccoonsGlobal: this._serializeFallenRaccoons(game.fallenRaccoonsGlobal),
                lastDeployedSquadIds: game.lastDeployedSquadIds || [],
                enemiesKilledThisPhase: game.enemiesKilledThisPhase || 0,
                hostagesRescuedThisPhase: game.hostagesRescuedThisPhase || 0,
                fallenRaccoonsThisPhase: (game.fallenRaccoonsThisPhase || []).map(f => ({
                    id: f.id, name: f.name, rank: f.rank, killCount: f.killCount,
                    faceImageUrl: f.faceImageUrl, spriteBaseName: f.spriteBaseName,
                    missionName: f.missionName
                })),
                newRecruitsThisPhase: (game.newRecruitsThisPhase || []).map(r => ({
                    id: r.id, name: r.name, rank: r.rank, killCount: r.killCount,
                    xp: r.xp, faceImageUrl: r.faceImageUrl, spriteBaseName: r.spriteBaseName
                })),
                promotedRaccoonsThisPhase: (game.promotedRaccoonsThisPhase || []).map(r => ({
                    id: r.id, name: r.name, rank: r.rank, previousRank: r.previousRank,
                    killCount: r.killCount, xp: r.xp, faceImageUrl: r.faceImageUrl,
                    spriteBaseName: r.spriteBaseName
                })),
                missionResultsThisPhase: (game.missionResultsThisPhase || []).map(m => ({
                    name: m.name, isVictory: m.isVictory, enemiesKilled: m.enemiesKilled,
                    timeTaken: m.timeTaken,
                    fallenRaccoons: m.fallenRaccoons || [],
                    raccoonKills: m.raccoonKills ? Array.from(m.raccoonKills.entries()) : [],
                    objectives: m.objectives || []
                })),
                raccoonKillsThisPhase: game.raccoonKillsThisPhase ? Array.from(game.raccoonKillsThisPhase.entries()) : [],
                phaseStartTime: game.phaseStartTime || 0,
                phaseStartRosterSnapshot: (game.phaseStartRosterSnapshot || []).map(r => ({
                    id: r.id, name: r.name, rank: r.rank, xp: r.xp,
                    killCount: r.killCount, faceImageUrl: r.faceImageUrl,
                    spriteBaseName: r.spriteBaseName
                })),
                killsAtPhaseStart: game.killsAtPhaseStart ? Array.from(game.killsAtPhaseStart.entries()) : []
            }
        };
    }

    /**
     * Deserialize save data into game state
     * @private
     */
    static _deserializeGameState(game, data) {
        // Stop any ongoing game activities (but don't stop main menu music)
//        console.log('[SaveManager] Not stopping looping sounds (keeping main menu music playing)');
        // game.audioManager.stopAllLoopingSounds();
        // game.lastPlayedMusicKey = null;

        // Restore campaign seed and RNG
//        console.log(`[SaveManager] Loading campaignSeed: ${data.campaignSeed}, phase: ${data.currentPhaseIndex}, mission: ${data.currentMissionIndex}`);
        
        // Validate campaign seed - if invalid, generate a new one but warn about it
        if (!data.campaignSeed || isNaN(data.campaignSeed) || data.campaignSeed === 0) {
//            console.warn('[SaveManager] WARNING: Invalid campaignSeed in save data! This may cause non-deterministic mission generation.');
            game.campaignSeed = Date.now();
        } else {
            game.campaignSeed = data.campaignSeed;
        }
        
        game.campaignSeedRNG = new SeededRandom(game.campaignSeed);

        // Restore RNG state if saved (for exact sequence matching)
        if (data.campaignSeedRNGState) {
            game.campaignSeedRNG.seed = data.campaignSeedRNGState;
//            console.log(`[SaveManager] Restored RNG state: ${data.campaignSeedRNGState}`);
        }
        game.totalCampaignPhases = data.totalCampaignPhases;

        // Restore progress
        game.currentPhaseIndex = data.currentPhaseIndex;
        game.currentMissionIndex = data.currentMissionIndex;
        game.isNightMission = data.isNightMission || false;

        // Clear current state
        game.deployedSquadRoster = [];
        game.selectedUnits = [];
        game.tempSelectedForDeployment = [];
        game.hostageUnits = [];
        game.campaignStructure = [];
        game.enemyUnits = [];
        game.gameObjects = [];
        game.visualEffects = [];

        // Regenerate campaign structure up to current phase
        for (let i = 0; i <= data.currentPhaseIndex; i++) {
            game._generatePhaseStructure(i);
        }

        // Restore roster
        game.masterRoster = this._deserializeRoster(data.masterRoster, game);
        game.fallenRaccoonsGlobal = data.fallenRaccoonsGlobal || [];
        game.lastDeployedSquadIds = data.lastDeployedSquadIds || [];

        // Restore phase accumulator stats
        game.enemiesKilledThisPhase = data.enemiesKilledThisPhase || 0;
        game.hostagesRescuedThisPhase = data.hostagesRescuedThisPhase || 0;
        game.fallenRaccoonsThisPhase = data.fallenRaccoonsThisPhase || [];
        game.newRecruitsThisPhase = data.newRecruitsThisPhase || [];
        game.promotedRaccoonsThisPhase = data.promotedRaccoonsThisPhase || [];
        game.missionResultsThisPhase = data.missionResultsThisPhase || [];
        game.raccoonKillsThisPhase = new Map(data.raccoonKillsThisPhase || []);
        game.phaseStartTime = data.phaseStartTime || 0;
        game.phaseStartRosterSnapshot = data.phaseStartRosterSnapshot || [];
        game.killsAtPhaseStart = new Map(data.killsAtPhaseStart || []);

        // Set game state to main menu (ready to start)
        game.gameState = 'LOADED_READY';
    }

    /**
     * Serialize raccoon roster to plain objects
     * @private
     */
    static _serializeRoster(roster) {
        if (!roster) return [];
        return roster.map(raccoon => ({
            id: raccoon.id,
            name: raccoon.name,
            faceImageUrl: raccoon.faceImageUrl,
            xp: raccoon.xp,
            rank: raccoon.rank,
            killCount: raccoon.killCount || 0,
            maxHp: raccoon.maxHp,
            hp: raccoon.hp
        }));
    }

    /**
     * Deserialize roster back to Raccoon instances
     * @private
     */
    static _deserializeRoster(rosterData, game) {
        if (!rosterData) return [];
        return rosterData.map(data => {
            const raccoon = new Raccoon(
                0, 0, game,
                data.id,
                data.faceImageUrl,
                data.name,
                data.xp,
                data.rank,
                data.killCount
            );
            // Restore HP if it was saved lower than max
            if (data.hp !== undefined && data.hp < raccoon.maxHp) {
                raccoon.hp = data.hp;
            }
            return raccoon;
        });
    }

    /**
     * Serialize fallen raccoons (simpler format since they're just memorial data)
     * @private
     */
    static _serializeFallenRaccoons(fallen) {
        if (!fallen) return [];
        return fallen.map(f => ({
            id: f.id,
            name: f.name,
            faceImageUrl: f.faceImageUrl,
            rank: f.rank,
            killCount: f.killCount || 0,
            missionDied: f.missionDied,
            phaseDied: f.phaseDied
        }));
    }

    /**
     * Format timestamp for display
     * @private
     */
    static _formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const options = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString(undefined, options);
    }
}
