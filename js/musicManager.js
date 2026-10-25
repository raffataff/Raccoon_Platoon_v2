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
            // Fallback slider level until the UI applies the saved preference (init() reads CONFIG).
            volume: 0.5,
            // Slider-owned level (0..1). setMusicVolume writes it; nothing else may.
            userVolume: undefined,
            isPlaying: false,
            fadeTimer: null,   // setInterval handle while a fade-out owns the instance
            pendingKey: null   // track that starts when the current fade-out finishes
        };

        this.ambientLayer = {
            key: null,
            instance: null,
            volume: 0.4,
            userVolume: undefined,
            isPlaying: false,
            fadeTimer: null,
            pendingKey: null
        };

        // Crossfade settings
        this.crossfadeDuration = 1.0;
        this.masterVolume = 1.0;
        // Music is held silent while the game is paused, without touching the slider level.
        this.isMusicPauseMuted = false;

        // Configuration (will be set from CONFIG.AUDIO_MUSIC)
        this.config = null;
        
//        console.log("[MusicManager] Initialized.");
    }

    /**
     * Initialize with configuration
     * @param {Object} audioMusicConfig - Configuration from CONFIG.AUDIO_MUSIC
     */
    init(audioMusicConfig) {
        this.config = audioMusicConfig;
        this.crossfadeDuration = audioMusicConfig.STATE_TRANSITION_TIME || 1.0;
        if (audioMusicConfig.DEFAULT_MUSIC_VOLUME !== undefined) this.musicLayer.volume = audioMusicConfig.DEFAULT_MUSIC_VOLUME;
        if (audioMusicConfig.DEFAULT_AMBIENT_VOLUME !== undefined) this.ambientLayer.volume = audioMusicConfig.DEFAULT_AMBIENT_VOLUME;
//        console.log("[MusicManager] Configuration loaded.");
    }

    /**
     * Set the current biome for music selection
     * @param {string} biomeType - Biome identifier (e.g., 'TROPICAL', 'TEMPERATE')
     */
    setBiome(biomeType) {
        this.currentBiome = biomeType;
//        console.log(`[MusicManager] Biome set to: ${biomeType}`);
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
        
//        console.log(`[MusicManager] Game state: ${previousState} -> ${newState}`);
        
        // Handle the state transition
        this.transitionToState(newState, params);

        // Leaving pause by any route (resume, restart, quit to menu) lifts the pause mute.
        // Done after the transition so a track that has just started fading out stays silent.
        if (newState !== 'PAUSED' && this.isMusicPauseMuted) {
            this.isMusicPauseMuted = false;
            this._applyLayerVolume(this.musicLayer);
        }
    }

    /**
     * Transition music based on game state
     * @param {string} state - New game state
     * @param {Object} params - Optional parameters
     */
    transitionToState(state, params = {}) {
        if (!this.config) {
//            console.warn("[MusicManager] No config loaded, skipping transition.");
            return;
        }

//        console.log(`[MusicManager] transitionToState: ${state}, current: ${this.currentGameState}`);
        
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
                // Play victory music, and stop ambient
                const victoryTrack = this.getBiomeVictoryTrack() || stateTracks.VICTORY;
                this.playMusic(victoryTrack, { fade: true, loop: false });
                this.stopAmbient({ fade: true });
                break;
                
            case 'MISSION_ENDING_DEFEAT':
                // Play defeat music, and stop ambient
                const defeatTrack = stateTracks.DEFEAT;
                this.playMusic(defeatTrack, { fade: true, loop: false });
                this.stopAmbient({ fade: true });
                break;
                
            case 'POST_MISSION_DEBRIEF':
                // Keep playing current victory/defeat music (no change)
                break;

            case 'END_OF_PHASE_DEBRIEF':
                break;
                
            case 'PAUSED':
                // Mute music temporarily. The slider level is left alone, so a change made
                // in the pause menu still applies on resume.
                this.isMusicPauseMuted = true;
                this._applyLayerVolume(this.musicLayer);
                break;
                
            case 'SHOOTOUT_PRE_GAME':
            case 'SHOOTOUT_PLAYING':
            case 'SHOOTOUT_AMBUSH':
//                console.log(`[MusicManager] SHOOTOUT state handling, musicLayer.key: ${this.musicLayer.key}, musicLayer.isPlaying: ${this.musicLayer.isPlaying}`);
                const shootoutTrack = stateTracks.SHOOTOUT_AMBUSH || stateTracks.SHOOTOUT_PLAYING;
//                console.log(`[MusicManager] shootoutTrack: ${shootoutTrack}`);
                if (this.musicLayer.key !== shootoutTrack) {
//                    console.log(`[MusicManager] Playing shootout music: ${shootoutTrack}`);
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
//                console.log(`[MusicManager] No music action defined for state: ${state}`);
        }
    }

    /**
     * Start mission music with ambient
     * @param {Object} params - Parameters including biome, isBossMission
     */
    startMissionMusic(params = {}) {
        if (!this.config) {
//            console.warn("[MusicManager] startMissionMusic: No config");
            return;
        }
        
        const isBossMission = params.isBossMission || false;
//        console.log(`[MusicManager] startMissionMusic called, biome: ${this.currentBiome}, isBossMission: ${isBossMission}, ambientLayer.isPlaying: ${this.ambientLayer.isPlaying}`);
        
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
//                console.log(`[MusicManager] Boss mission detected, using boss track: ${combatTrack}`);
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
        
        // Play music layer only - skip ambient if already playing from video
        // This ensures ambient continues from video without restarting
        if (combatTrack) {
            this.playMusic(combatTrack, { fade: true, loop: false });
        }
        
        // Only start ambient if not already playing
//        console.log(`[MusicManager] Checking ambient: isPlaying=${this.ambientLayer.isPlaying}, hasTrack=${!!ambientTrack}`);
        if (!this.ambientLayer.isPlaying && ambientTrack) {
//            console.log(`[MusicManager] Restarting ambient: ${ambientTrack}`);
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

        // If same track is already playing (or queued behind the current fade-out), don't restart
        const activeKey = this.musicLayer.fadeTimer ? this.musicLayer.pendingKey : this.musicLayer.key;
        if (activeKey === key && this.musicLayer.isPlaying) {
            return;
        }

        // Stop current music with fade if requested
        if (this.musicLayer.isPlaying && fade) {
            this.fadeOutMusic(() => {
                this._startMusic(key, loop, volume);
            });
            if (this.musicLayer.fadeTimer) this.musicLayer.pendingKey = key;
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
        // Honour the user's current slider level when no explicit volume is passed.
        const volumeValue = volume !== null ? volume : this._userVolume(this.musicLayer);

        const instance = this.audioManager.play(key, {
            loop: loop,
            volume: volumeValue,
            asElement: true // fades and pauses need the <audio> element, even for a non-looping track
        });

        if (instance) {
            this.musicLayer.key = key;
            this.musicLayer.instance = instance;
            this.musicLayer.isPlaying = true;
            // AudioManager scales non-looping tracks by the SFX slider and ignores pause;
            // music follows master × track level × music slider only.
            instance.volume = this._targetVolume(this.musicLayer, volumeValue);
            // Note: do NOT overwrite this.musicLayer.userVolume here — the slider owns it.
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

        // If same track is already playing (or queued behind the current fade-out), don't restart or fade
        const activeKey = this.ambientLayer.fadeTimer ? this.ambientLayer.pendingKey : this.ambientLayer.key;
        if (activeKey === key && this.ambientLayer.isPlaying) {
            return;
        }

        if (this.ambientLayer.isPlaying && fade) {
            this.fadeOutAmbient(() => {
                this._startAmbient(key, loop);
            });
            if (this.ambientLayer.fadeTimer) this.ambientLayer.pendingKey = key;
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
        // Honour the current ambient slider value.
        const volumeValue = this._userVolume(this.ambientLayer);

        const instance = this.audioManager.play(key, {
            loop: loop,
            volume: volumeValue,
            asElement: true // fades and pauses need the <audio> element, even for a non-looping track
        });

        if (instance) {
            this.ambientLayer.key = key;
            this.ambientLayer.instance = instance;
            this.ambientLayer.isPlaying = true;
            instance.volume = this._targetVolume(this.ambientLayer, volumeValue);
            // Do NOT overwrite this.ambientLayer.userVolume here.
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
        this._stopLayer(this.musicLayer);
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
        this._stopLayer(this.ambientLayer);
    }

    /**
     * Stop a layer immediately, cancelling any fade (and the track queued behind it).
     * @private
     */
    _stopLayer(layer) {
        this._cancelFade(layer);
        if (layer.instance) {
            this.audioManager.stop(layer.key);
            // Non-looping tracks are clones AudioManager doesn't track, so stop the instance itself.
            layer.instance.pause();
            layer.instance.currentTime = 0;
        }
        layer.key = null;
        layer.instance = null;
        layer.isPlaying = false;
    }

    /**
     * Fade out music layer
     * @param {Function} onComplete - Callback when fade completes
     */
    fadeOutMusic(onComplete) {
        this._fadeOutLayer(this.musicLayer, onComplete);
    }

    /**
     * Fade out ambient layer
     * @param {Function} onComplete - Callback when fade completes
     */
    fadeOutAmbient(onComplete) {
        this._fadeOutLayer(this.ambientLayer, onComplete);
    }

    /**
     * Fade a layer's instance to silence, then pause it. A newer fade on the same
     * layer replaces this one (its onComplete is dropped).
     * @private
     */
    _fadeOutLayer(layer, onComplete) {
        this._cancelFade(layer);
        if (!layer.instance || !layer.isPlaying) {
            if (onComplete) onComplete();
            return;
        }

        const instance = layer.instance;
        // Fade from what is audible right now. A volume of 0 is a real value (slider at 0),
        // never a cue to fall back to a default level.
        const startVolume = instance.volume;
        const fadeSteps = 20;
        const stepDuration = (this.crossfadeDuration * 1000) / fadeSteps;
        let currentStep = 0;

        layer.fadeTimer = setInterval(() => {
            currentStep++;
            const newVolume = startVolume * (1 - (currentStep / fadeSteps));
            // min() keeps a slider/pause drop made mid-fade from being undone by the next step.
            instance.volume = Math.max(0, Math.min(instance.volume, newVolume));

            if (currentStep >= fadeSteps) {
                this._cancelFade(layer);
                this.audioManager.stop(instance);
                instance.pause();
                instance.currentTime = 0;
                if (onComplete) onComplete();
            }
        }, stepDuration);
    }

    /** @private */
    _cancelFade(layer) {
        if (layer.fadeTimer) {
            clearInterval(layer.fadeTimer);
            layer.fadeTimer = null;
        }
        layer.pendingKey = null;
    }

    /** Slider level for a layer (0..1), or its default before the UI has applied one. @private */
    _userVolume(layer) {
        return layer.userVolume !== undefined ? layer.userVolume : layer.volume;
    }

    /**
     * Element volume a layer should play at: master × the track's CONFIG level × slider.
     * Music is held at 0 while paused.
     * @private
     */
    _targetVolume(layer, userVolume = this._userVolume(layer)) {
        if (layer === this.musicLayer && this.isMusicPauseMuted) return 0;
        const sound = layer.key ? this.audioManager.sounds[layer.key] : null;
        const baseVolume = sound && sound.defaultVolume !== undefined ? sound.defaultVolume : 0.5;
        return Math.max(0, Math.min(1, this.masterVolume * baseVolume * userVolume));
    }

    /**
     * Push a layer's target volume onto its playing instance. While a fade-out owns the
     * instance the volume is only ever lowered, so muting is immediate but nothing re-swells.
     * @private
     */
    _applyLayerVolume(layer) {
        const instance = layer.instance;
        if (!instance) return;
        const target = this._targetVolume(layer);
        instance.volume = layer.fadeTimer ? Math.min(instance.volume, target) : target;
    }

    /**
     * Set music volume
     * @param {number} volume - Volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicLayer.userVolume = volume;
        this._applyLayerVolume(this.musicLayer);
    }

    /**
     * Set ambient volume
     * @param {number} volume - Volume (0-1)
     */
    setAmbientVolume(volume) {
        this.ambientLayer.userVolume = volume;
        this._applyLayerVolume(this.ambientLayer);
    }

    /**
     * Set master volume (applies to both layers)
     * @param {number} volume - Volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = volume;
        this._applyLayerVolume(this.musicLayer);
        this._applyLayerVolume(this.ambientLayer);
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
        this.isMusicPauseMuted = false;
        this._applyLayerVolume(this.musicLayer);
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
