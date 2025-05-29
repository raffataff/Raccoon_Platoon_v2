// js/audioManager.js
// complete
class AudioManager {
    constructor() {
        this.sounds = {}; // Stores { key: { audio: HTMLAudioElement, defaultVolume: X, path: Y, loaded: true } }
        this.isMuted = false;
        this.globalVolume = 1.0;
        this.loadQueue = [];
        this.loadedCount = 0;
        this.totalCount = 0;

        // --- NEW: For managing looping music ---
        this.currentLoopingSound = {
            key: null,
            instance: null,
            userVolume: 1.0 // Stores the volume set by playConfig for this specific track
        };
        // ---

        console.log("[AudioManager] Initialized.");
    }

    addSoundToLoadQueue(key, path, defaultVolume = 1.0) {
        this.loadQueue.push({ key, path, defaultVolume });
        this.totalCount = this.loadQueue.length;
    }

    async loadAllSounds(onProgress = null, onComplete = null) {
        if (this.loadQueue.length === 0) {
            console.log("[AudioManager] No sounds in queue to load.");
            if (onComplete) onComplete();
            return;
        }
        console.log(`[AudioManager] Starting to load ${this.loadQueue.length} sounds.`);
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
                    console.error(`[AudioManager] Error loading sound: ${soundKey} from ${soundData.path}`, e);
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
        console.log("[AudioManager] All sounds processed.");
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
        const requestedVolume = playConfig.volume !== undefined ? playConfig.volume : 1.0; // Default to 1.0 for specific volume
        const finalEffectiveVolume = this.globalVolume * baseVolume * requestedVolume;

        if (playConfig.loop) {
            // Stop any currently looping sound
            if (this.currentLoopingSound.instance && this.currentLoopingSound.key !== key) {
                this.currentLoopingSound.instance.pause();
                this.currentLoopingSound.instance.currentTime = 0;
            }
            
            // Use the master audio instance for looping
            masterAudio.loop = true;
            masterAudio.volume = this.isMuted ? 0 : finalEffectiveVolume;
            
            masterAudio.play().catch(error => {
                // console.warn(`[AudioManager] Error playing looping sound ${key}:`, error);
            });
            
            this.currentLoopingSound.key = key;
            this.currentLoopingSound.instance = masterAudio;
            this.currentLoopingSound.userVolume = requestedVolume; // Store the volume specifically requested for this track
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
            if (this.currentLoopingSound.key === key && this.currentLoopingSound.instance) {
                this.currentLoopingSound.instance.pause();
                this.currentLoopingSound.instance.currentTime = 0;
                this.currentLoopingSound.key = null;
                this.currentLoopingSound.instance = null;
                this.currentLoopingSound.userVolume = 1.0;
            } else if (this.sounds[key] && this.sounds[key].audio && !this.sounds[key].error) {
                // This stops the master audio, primarily for SFX if needed,
                // but cloned SFX instances won't be affected.
                this.sounds[key].audio.pause();
                this.sounds[key].audio.currentTime = 0;
            }
        } else if (keyOrInstance instanceof HTMLAudioElement) { // Instance provided
            const instance = keyOrInstance;
            instance.pause();
            instance.currentTime = 0;
            if (this.currentLoopingSound.instance === instance) {
                this.currentLoopingSound.key = null;
                this.currentLoopingSound.instance = null;
                this.currentLoopingSound.userVolume = 1.0;
            }
        }
    }

    stopAllLoopingSounds() {
        if (this.currentLoopingSound.instance) {
            this.currentLoopingSound.instance.pause();
            this.currentLoopingSound.instance.currentTime = 0;
            console.log(`[AudioManager] Stopped looping track: ${this.currentLoopingSound.key}`);
        }
        this.currentLoopingSound.key = null;
        this.currentLoopingSound.instance = null;
        this.currentLoopingSound.userVolume = 1.0;
    }


    setGlobalVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume of the currently playing looping sound
        if (this.currentLoopingSound.instance && this.sounds[this.currentLoopingSound.key]) {
            const soundData = this.sounds[this.currentLoopingSound.key];
            const baseVolume = soundData.defaultVolume;
            const userVolume = this.currentLoopingSound.userVolume; // Use the stored user-set volume for this track
            this.currentLoopingSound.instance.volume = this.isMuted ? 0 : (this.globalVolume * baseVolume * userVolume);
        }
        // SFX volumes are set at the time of play based on the globalVolume then.
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentLoopingSound.instance && this.sounds[this.currentLoopingSound.key]) {
            if (this.isMuted) {
                this.currentLoopingSound.instance.volume = 0;
                console.log("[AudioManager] Looping Music Muted.");
            } else {
                const soundData = this.sounds[this.currentLoopingSound.key];
                const baseVolume = soundData.defaultVolume;
                const userVolume = this.currentLoopingSound.userVolume;
                this.currentLoopingSound.instance.volume = this.globalVolume * baseVolume * userVolume;
                console.log("[AudioManager] Looping Music Unmuted.");
            }
        } else {
             console.log(this.isMuted ? "[AudioManager] Sounds Muted." : "[AudioManager] Sounds Unmuted.");
        }
        return this.isMuted;
    }
}