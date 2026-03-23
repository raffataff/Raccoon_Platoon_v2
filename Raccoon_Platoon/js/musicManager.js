// js/musicManager.js
// Music management system for Raccoon Platoon
// Handles layered audio (music + ambient) and state-based transitions

class MusicManager {
    constructor(audioManager) {
        this.audioManager = audioManager;
        
        // Current state tracking
        this.currentGameState = null;
        this.currentBiome = null;
        
        // Layered playback
        this.musicLayer = {
            key: null,
            instance: null,
            volume: 0.5,
            isPlaying: false
        };
        
        this.ambientLayer = {
            key: null,
            instance: null,
            volume: 0.4,
            isPlaying: false
        };
        
        // Crossfade settings
        this.crossfadeDuration = 1.0; // seconds
        
        // Configuration (will be set from CONFIG.AUDIO_MUSIC)
        this.config = null;
        
        console.log("[MusicManager] Initialized.");
    }

    /**
     * Initialize with configuration
     * @param {Object} audioMusicConfig - Configuration from CONFIG.AUDIO_MUSIC
     */
    init(audioMusicConfig) {
        this.config = audioMusicConfig;
        this.crossfadeDuration = audioMusicConfig.STATE_TRANSITION_TIME || 1.0;
        console.log("[MusicManager] Configuration loaded.");
    }

    /**
     * Set the current biome for music selection
     * @param {string} biomeType - Biome identifier (e.g., 'TROPICAL', 'TEMPERATE')
     */
    setBiome(biomeType) {
        this.currentBiome = biomeType;
        console.log(`[MusicManager] Biome set to: ${biomeType}`);
    }

    /**
     * Handle game state changes
     * @param {string} newState - The new game state
     * @param {Object} params - Optional parameters (biome, missionType, etc.)
     */
    onGameStateChange(newState, params = {}) {
        const previousState = this.currentGameState;
        this.currentGameState = newState;
        
        // Update biome if provided
        if (params.biome) {
            this.setBiome(params.biome);
        }
        
        console.log(`[MusicManager] Game state: ${previousState} -> ${newState}`);
        
        // Handle the state transition
        this.transitionToState(newState, params);
    }

    /**
     * Transition music based on game state
     * @param {string} state - New game state
     * @param {Object} params - Optional parameters
     */
    transitionToState(state, params = {}) {
        if (!this.config) {
            console.warn("[MusicManager] No config loaded, skipping transition.");
            return;
        }

        console.log(`[MusicManager] transitionToState: ${state}, current: ${this.currentGameState}`);
        
        const stateTracks = this.config.STATE_TRACKS;
        
        switch (state) {
            case 'MAIN_MENU':
            case 'PRE_MISSION_SELECT':
            case 'HOW_TO_PLAY':
                // All use main menu music - continue if already playing this track
                const menuTrack = stateTracks.MAIN_MENU;
                if (this.musicLayer.key !== menuTrack) {
                    this.playMusic(menuTrack, { fade: true });
                }
                // Don't stop ambient - keep it playing
                break;
                
            case 'LOADING_MISSION':
                this.playMusic(stateTracks.LOADING_MISSION, { fade: true, loop: true });
                // Don't stop ambient - it should continue through the video into gameplay
                break;
                
            case 'RUNNING':
                // Start mission music with ambient
                this.startMissionMusic(params);
                break;
                
            case 'MISSION_ENDING_VICTORY':
                // Play victory music, but don't stop ambient - continue it
                const victoryTrack = this.getBiomeVictoryTrack() || stateTracks.VICTORY;
                this.playMusic(victoryTrack, { fade: true, loop: false });
                // Keep ambient playing
                break;
                
            case 'MISSION_ENDING_DEFEAT':
                // Play defeat music, but don't stop ambient - continue it
                const defeatTrack = stateTracks.DEFEAT;
                this.playMusic(defeatTrack, { fade: true, loop: false });
                // Keep ambient playing
                break;
                
            case 'POST_MISSION_DEBRIEF':
                // Keep playing current victory/defeat music (no change)
                break;
                
            case 'PAUSED':
                // Mute music temporarily
                this.setMusicVolume(0);
                break;
                
            case 'SHOOTOUT_PRE_GAME':
            case 'SHOOTOUT_PLAYING':
            case 'SHOOTOUT_AMBUSH':
                const shootoutTrack = stateTracks.SHOOTOUT_PLAYING;
                if (this.musicLayer.key !== shootoutTrack) {
                    this.playMusic(shootoutTrack, { fade: true, loop: true });
                }
                this.stopAmbient();
                break;
                
            case 'CAMPAIGN_COMPLETE':
                this.playMusic(stateTracks.CAMPAIGN_COMPLETE, { fade: true });
                this.stopAmbient({ fade: true });
                break;
                
            case 'GAME_OVER_NO_RECRUITS':
                this.playMusic(stateTracks.GAME_OVER_NO_RECRUITS, { fade: true });
                this.stopAmbient({ fade: true });
                break;
                
            default:
                // Unknown state - no action
                console.log(`[MusicManager] No music action defined for state: ${state}`);
        }
    }

    /**
     * Start mission music with ambient
     * @param {Object} params - Parameters including biome, isBossMission
     */
    startMissionMusic(params = {}) {
        if (!this.config) {
            console.warn("[MusicManager] startMissionMusic: No config");
            return;
        }
        
        const isBossMission = params.isBossMission || false;
        console.log(`[MusicManager] startMissionMusic called, biome: ${this.currentBiome}, isBossMission: ${isBossMission}`);
        
        // Always use TROPICAL biome (only biome implemented in game)
        const biome = 'TROPICAL';
        const biomeConfig = this.config.BIOME_TRACKS[biome];
        
        let combatTrack = null;
        
        // Check for boss mission music first
        if (isBossMission && this.config.MISSION_TYPE_TRACKS && this.config.MISSION_TYPE_TRACKS.BOSS) {
            const bossTracks = this.config.MISSION_TYPE_TRACKS.BOSS;
            if (bossTracks.combat && bossTracks.combat.length > 0) {
                const rng = params.rng || new SeededRandom(Date.now());
                combatTrack = rng.pickFrom(bossTracks.combat);
                console.log(`[MusicManager] Boss mission detected, using boss track: ${combatTrack}`);
            }
        }
        
        // Fall back to regular combat music if no boss track selected
        if (!combatTrack && biomeConfig && biomeConfig.combat && biomeConfig.combat.length > 0) {
            // Pick a random track from the combat playlist
            const rng = params.rng || new SeededRandom(Date.now());
            combatTrack = rng.pickFrom(biomeConfig.combat);
        }
        
        // Get ambient track
        let ambientTrack = null;
        if (biomeConfig && biomeConfig.ambient && biomeConfig.ambient.length > 0) {
            const rng = params.rng || new SeededRandom(Date.now());
            ambientTrack = rng.pickFrom(biomeConfig.ambient);
        }
        
        // Play both layers
        if (combatTrack) {
            this.playMusic(combatTrack, { fade: true, loop: true });
        }
        
        if (ambientTrack) {
            this.playAmbient(ambientTrack, { fade: true, loop: true });
        }
    }

    /**
     * Get the victory track for the current biome
     * @returns {string|null} Track key
     */
    getBiomeVictoryTrack() {
        if (!this.config || !this.currentBiome) return null;
        
        const biomeConfig = this.config.BIOME_TRACKS[this.currentBiome];
        return biomeConfig ? biomeConfig.victory : null;
    }

    /**
     * Play a music track with optional crossfade
     * @param {string} key - Audio asset key
     * @param {Object} options - Play options (fade, loop, volume)
     */
    playMusic(key, options = {}) {
        if (!key || !this.audioManager) return;
        
        const { fade = false, loop = true, volume = null } = options;
        
        // If same track is already playing, don't restart
        if (this.musicLayer.key === key && this.musicLayer.isPlaying) {
            return;
        }
        
        // Stop current music with fade if requested
        if (this.musicLayer.isPlaying && fade) {
            this.fadeOutMusic(() => {
                this._startMusic(key, loop, volume);
            });
        } else {
            this.stopMusic();
            this._startMusic(key, loop, volume);
        }
    }

    /**
     * Internal method to start music
     * @private
     */
    _startMusic(key, loop, volume) {
        const trackConfig = this.config && this.config.STATE_TRACKS ? null : null;
        const volumeValue = volume !== null ? volume : (this.config ? this.config.DEFAULT_MUSIC_VOLUME : 0.5);
        
        const instance = this.audioManager.play(key, { 
            loop: loop, 
            volume: volumeValue 
        });
        
        if (instance) {
            this.musicLayer.key = key;
            this.musicLayer.instance = instance;
            this.musicLayer.volume = volumeValue;
            this.musicLayer.isPlaying = true;
            console.log(`[MusicManager] Playing music: ${key}`);
        }
    }

    /**
     * Play ambient track
     * @param {string} key - Audio asset key
     * @param {Object} options - Play options (fade, loop)
     */
    playAmbient(key, options = {}) {
        if (!key || !this.audioManager) return;
        
        const { fade = false, loop = true } = options;
        
        // If same track is already playing, don't restart or fade
        if (this.ambientLayer.key === key && this.ambientLayer.isPlaying) {
            return;
        }
        
        if (this.ambientLayer.isPlaying && fade) {
            this.fadeOutAmbient(() => {
                this._startAmbient(key, loop);
            });
        } else {
            this.stopAmbient();
            this._startAmbient(key, loop);
        }
    }

    /**
     * Internal method to start ambient
     * @private
     */
    _startAmbient(key, loop) {
        const volumeValue = this.config ? this.config.DEFAULT_AMBIENT_VOLUME : 0.4;
        
        const instance = this.audioManager.play(key, { 
            loop: loop, 
            volume: volumeValue 
        });
        
        if (instance) {
            this.ambientLayer.key = key;
            this.ambientLayer.instance = instance;
            this.ambientLayer.volume = volumeValue;
            this.ambientLayer.isPlaying = true;
            console.log(`[MusicManager] Playing ambient: ${key}`);
        }
    }

    /**
     * Stop music with optional fade
     * @param {Object} options - Options (fade)
     */
    stopMusic(options = {}) {
        const { fade = false } = options;
        
        if (!this.musicLayer.isPlaying) return;
        
        if (fade && this.musicLayer.instance) {
            this.fadeOutMusic(() => {
                this._stopMusicInternal();
            });
        } else {
            this._stopMusicInternal();
        }
    }

    /**
     * Internal music stop
     * @private
     */
    _stopMusicInternal() {
        if (this.musicLayer.instance) {
            this.audioManager.stop(this.musicLayer.key);
        }
        this.musicLayer.key = null;
        this.musicLayer.instance = null;
        this.musicLayer.isPlaying = false;
    }

    /**
     * Stop ambient with optional fade
     * @param {Object} options - Options (fade)
     */
    stopAmbient(options = {}) {
        const { fade = false } = options;
        
        if (!this.ambientLayer.isPlaying) return;
        
        if (fade && this.ambientLayer.instance) {
            this.fadeOutAmbient(() => {
                this._stopAmbientInternal();
            });
        } else {
            this._stopAmbientInternal();
        }
    }

    /**
     * Internal ambient stop
     * @private
     */
    _stopAmbientInternal() {
        if (this.ambientLayer.instance) {
            this.audioManager.stop(this.ambientLayer.key);
        }
        this.ambientLayer.key = null;
        this.ambientLayer.instance = null;
        this.ambientLayer.isPlaying = false;
    }

    /**
     * Fade out music layer
     * @param {Function} onComplete - Callback when fade completes
     */
    fadeOutMusic(onComplete) {
        if (!this.musicLayer.instance || !this.musicLayer.isPlaying) {
            if (onComplete) onComplete();
            return;
        }

        const instance = this.musicLayer.instance;
        const startVolume = instance.volume || this.musicLayer.volume;
        const fadeSteps = 20;
        const stepDuration = (this.crossfadeDuration * 1000) / fadeSteps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = startVolume * (1 - (currentStep / fadeSteps));
            instance.volume = Math.max(0, newVolume);

            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                instance.pause();
                instance.currentTime = 0;
                instance.volume = startVolume; // Reset for next play
                if (onComplete) onComplete();
            }
        }, stepDuration);
    }

    /**
     * Fade out ambient layer
     * @param {Function} onComplete - Callback when fade completes
     */
    fadeOutAmbient(onComplete) {
        if (!this.ambientLayer.instance || !this.ambientLayer.isPlaying) {
            if (onComplete) onComplete();
            return;
        }

        const instance = this.ambientLayer.instance;
        const startVolume = instance.volume || this.ambientLayer.volume;
        const fadeSteps = 20;
        const stepDuration = (this.crossfadeDuration * 1000) / fadeSteps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = startVolume * (1 - (currentStep / fadeSteps));
            instance.volume = Math.max(0, newVolume);

            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                instance.pause();
                instance.currentTime = 0;
                instance.volume = startVolume;
                if (onComplete) onComplete();
            }
        }, stepDuration);
    }

    /**
     * Set music volume
     * @param {number} volume - Volume (0-1)
     */
    setMusicVolume(volume) {
        if (this.musicLayer.instance) {
            this.musicLayer.instance.volume = volume;
        }
        this.musicLayer.volume = volume;
    }

    /**
     * Set ambient volume
     * @param {number} volume - Volume (0-1)
     */
    setAmbientVolume(volume) {
        if (this.ambientLayer.instance) {
            this.ambientLayer.instance.volume = volume;
        }
        this.ambientLayer.volume = volume;
    }

    /**
     * Stop all music and ambient
     */
    stopAll() {
        this.stopMusic();
        this.stopAmbient();
    }

    /**
     * Resume music from pause (when unpausing)
     */
    resumeFromPause() {
        if (this.musicLayer.instance && this.musicLayer.key) {
            this.setMusicVolume(this.musicLayer.volume);
        }
    }

    /**
     * Get current music key
     * @returns {string|null}
     */
    getCurrentMusicKey() {
        return this.musicLayer.key;
    }

    /**
     * Get current ambient key
     * @returns {string|null}
     */
    getCurrentAmbientKey() {
        return this.ambientLayer.key;
    }
}
