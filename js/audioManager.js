// js/audioManager.js
// complete
class AudioManager {
    constructor() {
        this.sounds = {}; // Stores { key: { audio: HTMLAudioElement, defaultVolume: X, path: Y, loaded: true } }
        this.isMuted = false;
        this.globalVolume = 1.0;
        this.sfxVolume = 1.0;
        this.loadQueue = [];
        this.loadedCount = 0;
        this.totalCount = 0;

        // --- NEW: For managing looping music (supports multiple concurrent loops) ---
        this.loopingSounds = new Map(); // Map<key, { instance: HTMLAudioElement, userVolume: number }>
        // ---

//        console.log("[AudioManager] Initialized.");
    }

    addSoundToLoadQueue(key, path, defaultVolume = 1.0) {
        this.loadQueue.push({ key, path, defaultVolume });
        this.totalCount = this.loadQueue.length;
    }

    async loadAllSounds(onProgress = null, onComplete = null) {
        if (this.loadQueue.length === 0) {
//            console.log("[AudioManager] No sounds in queue to load.");
            if (onComplete) onComplete();
            return;
        }
//        console.log(`[AudioManager] Starting to load ${this.loadQueue.length} sounds.`);
        this.loadedCount = 0;
        this.totalCount = this.loadQueue.length;

        const loadPromises = this.loadQueue.map(soundData => {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.src = soundData.path;
                audio.preload = 'auto'; 

                const soundKey = soundData.key; 

                audio.oncanplaythrough = () => {
                    if (this.sounds[soundKey] && this.sounds[soundKey].loaded) { 
                        resolve();
                        return;
                    }
                    this.sounds[soundKey] = {
                        audio: audio,
                        defaultVolume: soundData.defaultVolume,
                        path: soundData.path,
                        loaded: true
                    };
                    this.loadedCount++;
                    if (onProgress) onProgress(this.loadedCount, this.totalCount, soundKey);
                    resolve();
                };

                audio.onerror = (e) => {
//                    console.error(`[AudioManager] Error loading sound: ${soundKey} from ${soundData.path}`, e);
                    this.sounds[soundKey] = { audio: null, defaultVolume: 0, path: soundData.path, loaded: false, error: true }; 
                    this.loadedCount++; 
                    if (onProgress) onProgress(this.loadedCount, this.totalCount, soundKey, true);
                    resolve(); 
                };
                
                audio.onloadeddata = () => {
                     if (this.sounds[soundKey] && this.sounds[soundKey].loaded) {
                        resolve();
                        return;
                    }
                    if (!audio.readyState || audio.readyState < 2) { 
                    }
                     this.sounds[soundKey] = {
                        audio: audio,
                        defaultVolume: soundData.defaultVolume,
                        path: soundData.path,
                        loaded: true
                    };
                    this.loadedCount++;
                    if (onProgress) onProgress(this.loadedCount, this.totalCount, soundKey);
                    resolve();
                };

                audio.load(); 
            });
        });

        await Promise.all(loadPromises);
//        console.log("[AudioManager] All sounds processed.");
        this.loadQueue = []; 
        if (onComplete) onComplete();
    }

    play(key, playConfig = {}) {
        if (!this.sounds[key] || !this.sounds[key].audio || this.sounds[key].error) {
            if (!this.isMuted && (!this.sounds[key] || this.sounds[key].error)) {
                // console.warn(`[AudioManager] Sound not loaded or error: ${key}`);
            }
            return null;
        }

        const masterAudio = this.sounds[key].audio;
        const baseVolume = this.sounds[key].defaultVolume !== undefined ? this.sounds[key].defaultVolume : 0.5;
        const requestedVolume = playConfig.volume !== undefined ? playConfig.volume : 1.0;
        const sfxMultiplier = playConfig.loop ? 1.0 : this.sfxVolume;
        const finalEffectiveVolume = this.globalVolume * sfxMultiplier * baseVolume * requestedVolume;

        if (playConfig.loop) {
            // Allow multiple concurrent looping sounds (music + ambient)
            // Check if this specific key is already playing
            if (this.loopingSounds.has(key)) {
                // Already playing this key - just update volume and ensure it's playing
                const existing = this.loopingSounds.get(key);
                existing.instance.volume = this.isMuted ? 0 : finalEffectiveVolume;
                existing.instance.play().catch(() => {});
                existing.userVolume = requestedVolume;
                return existing.instance;
            }
            
            // Stop any currently looping sound only if we need to manage a single slot
            // But for multi-track support, we DON'T stop existing loops - we add this one
            
            // Use the master audio instance for looping
            masterAudio.loop = true;
            masterAudio.volume = this.isMuted ? 0 : finalEffectiveVolume;
            
            masterAudio.play().catch(error => {
                // console.warn(`[AudioManager] Error playing looping sound ${key}:`, error);
            });
            
            this.loopingSounds.set(key, {
                instance: masterAudio,
                userVolume: requestedVolume
            });
            return masterAudio;

        } else { // Play as a one-shot sound effect (cloned)
            if (this.isMuted) return null;

            const soundInstance = masterAudio.cloneNode(true);
            soundInstance.volume = finalEffectiveVolume;
            soundInstance.loop = false; // Ensure it's not looping

            if (playConfig.pitchVariation) {
                const randomPitch = 1.0 + (Math.random() - 0.5) * playConfig.pitchVariation * 2;
                if (soundInstance.mozPreservesPitch !== undefined) soundInstance.mozPreservesPitch = false;
                if (soundInstance.preservesPitch !== undefined) soundInstance.preservesPitch = false;
                soundInstance.playbackRate = Math.max(0.1, randomPitch); 
            }

            soundInstance.play().catch(error => {
                // console.warn(`[AudioManager] Error playing sound ${key}:`, error);
            });
            return soundInstance;
        }
    }

    stop(keyOrInstance) {
        if (typeof keyOrInstance === 'string') { // Key provided
            const key = keyOrInstance;
            if (this.loopingSounds.has(key)) {
                const soundObj = this.loopingSounds.get(key);
                if (soundObj && soundObj.instance) {
                    soundObj.instance.pause();
                    soundObj.instance.currentTime = 0;
                }
                this.loopingSounds.delete(key);
            } else if (this.sounds[key] && this.sounds[key].audio && !this.sounds[key].error) {
                // This stops the master audio, primarily for SFX if needed,
                // but cloned SFX instances won't be affected.
                this.sounds[key].audio.pause();
                this.sounds[key].audio.currentTime = 0;
            }
        } else if (keyOrInstance instanceof HTMLAudioElement) { // Instance provided
            const instance = keyOrInstance;
            // Find which key this instance belongs to and remove it
            for (const [key, soundObj] of this.loopingSounds) {
                if (soundObj.instance === instance) {
                    instance.pause();
                    instance.currentTime = 0;
                    this.loopingSounds.delete(key);
                    break;
                }
            }
        }
    }

    stopAllLoopingSounds() {
        for (const [key, soundObj] of this.loopingSounds) {
            if (soundObj && soundObj.instance) {
                soundObj.instance.pause();
                soundObj.instance.currentTime = 0;
            }
        }
        this.loopingSounds.clear();
//        console.log("[AudioManager] Stopped all looping sounds.");
    }


    setGlobalVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume of all currently playing looping sounds
        for (const [key, soundObj] of this.loopingSounds) {
            if (soundObj.instance && this.sounds[key]) {
                const soundData = this.sounds[key];
                const baseVolume = soundData.defaultVolume;
                const userVolume = soundObj.userVolume;
                soundObj.instance.volume = this.isMuted ? 0 : (this.globalVolume * baseVolume * userVolume);
            }
        }
        // SFX volumes are set at the time of play based on the globalVolume then.
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Update volume for all looping sounds
        for (const [key, soundObj] of this.loopingSounds) {
            if (soundObj.instance && this.sounds[key]) {
                const soundData = this.sounds[key];
                const baseVolume = soundData.defaultVolume;
                const userVolume = soundObj.userVolume;
                soundObj.instance.volume = this.isMuted ? 0 : (this.globalVolume * baseVolume * userVolume);
            }
        }
        
        if (this.isMuted) {
//            console.log("[AudioManager] Looping Music Muted.");
        } else {
//            console.log("[AudioManager] Looping Music Unmuted.");
        }
        return this.isMuted;
    }
}