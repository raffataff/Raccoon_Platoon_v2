// js/audioManager.js
// complete
class AudioManager {
    constructor() {
        this.sounds = {}; // Stores { key: { audio: HTMLAudioElement, defaultVolume: X, path: Y } }
        this.isMuted = false;
        this.globalVolume = 1.0;
        this.loadQueue = [];
        this.loadedCount = 0;
        this.totalCount = 0;
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
                audio.preload = 'auto'; // Important for preloading

                const soundKey = soundData.key; // Capture for logging

                audio.oncanplaythrough = () => {
                    if (this.sounds[soundKey] && this.sounds[soundKey].loaded) { // Avoid double resolving
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
                    // console.log(`[AudioManager] Sound loaded: ${soundKey} (${this.loadedCount}/${this.totalCount})`);
                    resolve();
                };

                audio.onerror = (e) => {
                    console.error(`[AudioManager] Error loading sound: ${soundKey} from ${soundData.path}`, e);
                    this.sounds[soundKey] = { audio: null, defaultVolume: 0, path: soundData.path, loaded: false, error: true }; // Mark as error
                    this.loadedCount++; // Still count it as "processed" for progress
                    if (onProgress) onProgress(this.loadedCount, this.totalCount, soundKey, true);
                    resolve(); // Resolve even on error to not block Promise.all
                };

                // Fallback for browsers that might not fire canplaythrough consistently for all files
                // or if files are very small.
                audio.onloadeddata = () => {
                     if (this.sounds[soundKey] && this.sounds[soundKey].loaded) {
                        resolve();
                        return;
                    }
                     // If canplaythrough hasn't fired yet, consider it loaded enough with loadeddata
                    if (!audio.readyState || audio.readyState < 2) { // HTMLMediaElement.HAVE_CURRENT_DATA or more
                       // console.log(`[AudioManager] Sound data loaded (fallback): ${soundKey}`);
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

                audio.load(); // Explicitly call load
            });
        });

        await Promise.all(loadPromises);
        console.log("[AudioManager] All sounds processed.");
        this.loadQueue = []; // Clear the queue
        if (onComplete) onComplete();
    }

    playSound(key, playConfig = {}) {
        if (this.isMuted || !this.sounds[key] || !this.sounds[key].audio || this.sounds[key].error) {
            if (!this.isMuted && (!this.sounds[key] || this.sounds[key].error)) {
                // console.warn(`[AudioManager] Sound not loaded or error: ${key}`);
            }
            return;
        }

        const masterAudio = this.sounds[key].audio;
        const soundInstance = masterAudio.cloneNode(true); // Create a new instance to allow overlap

        const baseVolume = this.sounds[key].defaultVolume !== undefined ? this.sounds[key].defaultVolume : 0.5;
        const requestedVolume = playConfig.volume !== undefined ? playConfig.volume : 0.5;
        soundInstance.volume = this.globalVolume * baseVolume * requestedVolume;

        soundInstance.loop = playConfig.loop || false;

        if (playConfig.pitchVariation) {
            const randomPitch = 1.0 + (Math.random() - 0.5) * playConfig.pitchVariation * 2;
            if (soundInstance.mozPreservesPitch !== undefined) soundInstance.mozPreservesPitch = false;
            if (soundInstance.preservesPitch !== undefined) soundInstance.preservesPitch = false;
            soundInstance.playbackRate = Math.max(0.1, randomPitch); // Prevent negative or zero playback rate
        }

        soundInstance.play().catch(error => {
            // console.warn(`[AudioManager] Error playing sound ${key}:`, error);
        });
    }

    stopSound(key) {
        if (this.sounds[key] && this.sounds[key].audio && !this.sounds[key].error) {
            // This will only stop the original 'masterAudio'. Stopping cloned instances is harder.
            // For short SFX, this is usually not an issue. For looped music, you'd need a reference.
            this.sounds[key].audio.pause();
            this.sounds[key].audio.currentTime = 0;
        }
    }

    setGlobalVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        // Optionally update volume of currently playing sounds if you store references to them.
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            // Optionally pause all currently playing sounds if you store references.
            console.log("[AudioManager] Sounds Muted.");
        } else {
            console.log("[AudioManager] Sounds Unmuted.");
        }
        return this.isMuted;
    }
}