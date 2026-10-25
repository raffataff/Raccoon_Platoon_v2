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

        // One-shot SFX play through the Web Audio API from clips decoded once at load
        // (sounds[key].buffer): a buffer source per shot instead of a new <audio> element, which
        // in a big firefight (hundreds of shots a second) cost more main-thread time than the
        // whole game update. Music, ambience and long clips stay on <audio> (CONFIG.AUDIO_SFX).
        this.context = null;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) this.context = new Ctx();
        } catch (e) {
            this.context = null;
        }
        if (this.context) {
            // Browsers start the context suspended until the first user gesture.
            const resume = () => { if (this.context.state === 'suspended') this.context.resume().catch(() => {}); };
            window.addEventListener('pointerdown', resume, true);
            window.addEventListener('keydown', resume, true);
        }

//        console.log("[AudioManager] Initialized.");
    }

    // Decodes the short clips (CONFIG.AUDIO_SFX.BUFFER_MAX_SECONDS) into AudioBuffers in the
    // background; until a clip's buffer is ready, its one-shots use the <audio> path.
    _decodeShortClips() {
        const cfg = CONFIG.AUDIO_SFX;
        if (!this.context || !cfg || !cfg.WEB_AUDIO_ENABLED) return;
        const decoded = new Map(); // path -> Promise<AudioBuffer|null>, files shared by several keys decode once
        for (const key in this.sounds) {
            const sound = this.sounds[key];
            if (!sound.loaded || !sound.audio || sound.buffer || sound.decoding) continue;
            const duration = sound.audio.duration;
            if (!(duration > 0) || duration > cfg.BUFFER_MAX_SECONDS) continue;
            sound.decoding = true;
            let pending = decoded.get(sound.path);
            if (!pending) {
                pending = fetch(sound.path)
                    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))
                    .then(data => this.context.decodeAudioData(data))
                    .catch(() => null);
                decoded.set(sound.path, pending);
            }
            pending.then(buffer => { sound.buffer = buffer; sound.decoding = false; });
        }
    }

    // One-shot through Web Audio: buffer source (pitch via playbackRate) -> per-voice gain -> out.
    // Returns false when the clip can't go this way, so the caller falls back to <audio>.
    _playBuffer(key, sound, volume, pitchVariation) {
        const ctx = this.context;
        const cfg = CONFIG.AUDIO_SFX;
        if (!sound.buffer || !ctx || ctx.state !== 'running' || !cfg || !cfg.WEB_AUDIO_ENABLED) return false;
        // A firefight fires the same clip far more often than anyone can hear apart. Within a few ms
        // of the last start it is skipped; past a few overlapping copies the oldest one fades out
        // to make room, so the newest shots are always heard without piling up into clipping.
        const now = ctx.currentTime;
        if (sound.lastStart !== undefined && (now - sound.lastStart) * 1000 < cfg.MIN_RETRIGGER_MS) return true;
        sound.lastStart = now;
        const voices = sound.voices || (sound.voices = []);
        if (voices.length >= cfg.MAX_VOICES_PER_KEY) {
            const oldest = voices.shift();
            oldest.gain.gain.setTargetAtTime(0, now, 0.005);
            oldest.source.stop(now + 0.03);
        }

        const source = ctx.createBufferSource();
        source.buffer = sound.buffer;
        if (pitchVariation) {
            source.playbackRate.value = Math.max(0.1, 1.0 + (Math.random() - 0.5) * pitchVariation * 2);
        }
        const gain = ctx.createGain();
        gain.gain.value = Math.max(0, Math.min(1, volume));
        source.connect(gain);
        gain.connect(ctx.destination);
        const voice = { source, gain };
        voices.push(voice);
        source.onended = () => {
            const i = voices.indexOf(voice);
            if (i !== -1) voices.splice(i, 1);
            source.disconnect();
            gain.disconnect();
        };
        source.start();
        return true;
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
        this._decodeShortClips();
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
            // Callers that keep the returned element (music tracks: volume, fades, pause) ask for one.
            if (!playConfig.asElement) {
                if (finalEffectiveVolume <= 0) return null;
                if (this._playBuffer(key, this.sounds[key], finalEffectiveVolume, playConfig.pitchVariation)) return null;
            }

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