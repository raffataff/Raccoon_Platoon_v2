class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasContainer = document.getElementById('canvas-container');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        } else {
//            console.error("Fatal: Canvas element not found with ID:", canvasId);
            return;
        }

        this.prerenderedBackgroundCanvas = document.createElement('canvas');
        this.prerenderedBackgroundCtx = this.prerenderedBackgroundCanvas.getContext('2d', { willReadFrequently: true });

        // Night mission overlay canvas (offscreen)
        this.isNightMission = false;
        this.nightOverlayCanvas = document.createElement('canvas');
        this.nightOverlayCtx = this.nightOverlayCanvas.getContext('2d');

        this.masterRoster = [];
        this.deployedSquadRoster = [];
        this.fallenRaccoonsGlobal = [];
        this.fallenRaccoonsThisMission = [];
        this.tempSelectedForDeployment = [];
        this.lastDeployedSquadIds = [];

        this.gameObjects = [];
        this.enemyUnits = [];
        this.hostageUnits = [];
        this.selectedUnits = [];
        this.visualEffects = [];
        this.preloadedImages = {};
        this.audioManager = new AudioManager();
        this.musicManager = new MusicManager(this.audioManager);
        if (CONFIG.AUDIO_MUSIC) {
            this.musicManager.init(CONFIG.AUDIO_MUSIC);
        }

        this.spatialGrid = null;
        this.SPATIAL_GRID_CELL_SIZE = CONFIG.GRID_CELL_SIZE * 4;

        this.projectilePool = new ObjectPool(Projectile, 50, this);
        this.grenadeProjectilePool = new ObjectPool(GrenadeProjectile, 10, this);

        this.isDragging = false;
        this.draggedFarEnough = false;
        this.dragStartX = 0; this.dragStartY = 0;
        this.dragCurrentX = 0; this.dragCurrentY = 0;
        this.DRAG_THRESHOLD = CONFIG.INPUT_DRAG_THRESHOLD || 5;

        this.FORMATION_TYPES = ['HORIZONTAL', 'VERTICAL', 'SQUARE', 'DIAMOND'];
        this.currentFormationIndex = CONFIG.FORMATION_INDEX || 3; // Default to DIAMOND formation
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        this.formationSpacingMultiplier = CONFIG.INITIAL_FORMATION_SPACING || 3.5;

        this.cameraX = 0; this.cameraY = 0;
        this.cameraZoom = CONFIG.CAMERA_ZOOM || 1.0;

        this.level = new Level(this);
        this.inputHandler = new InputHandler(this.canvas, this);
        this.ui = new UI(this);

        this.campaignRules = CAMPAIGN_RULES;
        this.campaignSeed = null;
        this.campaignSeedRNG = null;
        this.currentPhaseSeedRNG = null;
        this.currentMissionSeedRNG = null;
        this.currentMissionSeed = null;

        this.currentSaveSlot = -1; // -1 means new campaign/unsaved
        this.totalCampaignPhases = 0;
        this.campaignStructure = [];

        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.currentMissionParams = null;
        this.lastPlayedMusicKey = null;

        this.gameState = 'MAIN_MENU';
        this.previousGameState = null;

        // Auto-save on page unload (for session persistence)
        // Only save during non-mission states to prevent infinite XP/death bugs
    /*    const MISSION_ACTIVE_STATES = ['RUNNING', 'LOADING_MISSION', 'SHOOTOUT_AMBUSH', 'SHOOTOUT_PLAYING', 'PAUSED', 'SHOOTOUT_PAUSED'];
        window.addEventListener('beforeunload', () => {
            if (this.campaignSeed && this.gameState !== 'MAIN_MENU' && !MISSION_ACTIVE_STATES.includes(this.gameState)) {
                SaveManager.autoSave(this);
            }
        });
    */
        this.missionEndDelayTimer = -1;
        this.MISSION_END_DELAY_SECONDS = 3.0;
        this.missionPendingOutcomeIsVictory = false;
        this.missionEndInitiated = false;
        this.missionEndMessage = "";
        this.pendingDebriefData = null;

        this.isGamePausedManually = false;

        this.isObjectiveComplete = false;
        this.initialEnemyCount = 0;
        this.missionStartedAndPopulated = false;
        this.missionStartTime = 0;

        this.birdSpawnConfig = CONFIG.AMBIENT_EFFECTS ? CONFIG.AMBIENT_EFFECTS.FLYING_BIRD : null;
        this.nextBirdSpawnTime = 0;

        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        this.fpsUpdateInterval = 1000;

        // --- NEW: Master Debug Flag ---
        this.isDebugVisualsActive = false;
        // --- END NEW ---

        // --- NEW: Shootout Mode Controller ---
        this.shootoutController = null;
        // --- END NEW ---

        // --- Ambush Success/Failure Tracking ---
        this.currentAmbushType = null;           // 'START' or 'EXTRACTION'
        this.ambushResult = null;                // 'VICTORY' or 'DEFEAT'
        this.takenHostageRaccoonId = null;        // ID of captured raccoon from failed ambush
        this.ambushesSurvivedThisMission = [];   // Track: ['START', 'EXTRACTION']
        // --- END Ambush Tracking ---

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);

        (async () => {
            this._showAssetLoadingScreen();
            
            const totalAssets = this._countTotalAssets();
            let loadedAssets = 0;
            const updateProgress = (text) => {
                loadedAssets++;
                const progress = Math.min((loadedAssets / totalAssets) * 100, 100);
                this._updateLoadingProgress(progress, text);
            };

            this._updateLoadingProgress(0, 'Loading audio...');
            await this.preloadAudioAssets();
            updateProgress('audio');

            const defaultWallpaper = CONFIG.MENU_WALLPAPERS.find(w => w.key === CONFIG.DEFAULT_MENU_WALLPAPER) || CONFIG.MENU_WALLPAPERS[0];
            const menuWallpaperPath = defaultWallpaper ? defaultWallpaper.path : 'assets/images/ui/wallpapers/1K/menu/raccoon_1_menu.jpg';
            if (!this.preloadedImages[menuWallpaperPath]) {
                const img = new Image();
                img.onload = () => { this.preloadedImages[menuWallpaperPath] = img; updateProgress('wallpaper'); };
                img.src = menuWallpaperPath;
            } else {
                updateProgress('wallpaper');
            }

            if (CONFIG.MENU_WALLPAPERS) {
                CONFIG.MENU_WALLPAPERS.forEach(wallpaper => {
                    if (!this.preloadedImages[wallpaper.path]) {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[wallpaper.path] = img; updateProgress('wallpaper'); };
                        img.src = wallpaper.path;
                    } else {
                        updateProgress('wallpaper');
                    }
                });
            }

            this._updateLoadingProgress(10, 'Loading unit sprites...');
            await this.preloadUnitAssets();
            updateProgress('units');

            this._updateLoadingProgress(40, 'Loading level assets...');
            await this.preloadLevelAssets();
            updateProgress('level');

            this._updateLoadingProgress(70, 'Loading misc assets...');
            await this.preloadMiscAssets();
            updateProgress('misc');

            this._updateLoadingProgress(100, 'Ready!');
            
            await new Promise(resolve => setTimeout(resolve, 300));

            this._hideAssetLoadingScreen();

            if (this.ui) {
                const savedWallpaper = SaveManager.getPreference('menuWallpaper', CONFIG.DEFAULT_MENU_WALLPAPER);
                this.ui.currentWallpaperKey = savedWallpaper;
                this.ui.showMainMenuScreen();
            }
            if (this.musicManager) {
                this.musicManager.onGameStateChange('MAIN_MENU');
            }
            this.lastFpsUpdateTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        })();
    }

    _countTotalAssets() {
        let count = 1;
        if (CONFIG.MENU_WALLPAPERS) count += CONFIG.MENU_WALLPAPERS.length;
        count += 3;
        count += 5;
        return Math.max(count, 50);
    }

    _showAssetLoadingScreen() {
        const loadingScreen = document.getElementById('assetLoadingScreen');
        const loadingBg = document.getElementById('assetLoadingBackground');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
        if (loadingBg && CONFIG.MENU_WALLPAPERS && CONFIG.MENU_WALLPAPERS.length > 0) {
            const defaultWp = CONFIG.MENU_WALLPAPERS.find(w => w.key === CONFIG.DEFAULT_MENU_WALLPAPER) || CONFIG.MENU_WALLPAPERS[0];
            if (defaultWp) {
                loadingBg.style.backgroundImage = `url('${defaultWp.path}')`;
            }
        }
    }

    _updateLoadingProgress(percent, text) {
        const bar = document.getElementById('loadingBar');
        const textEl = document.getElementById('loadingProgressText');
        if (bar) bar.style.width = `${percent}%`;
        if (textEl && text) textEl.textContent = text;
    }

    _hideAssetLoadingScreen() {
        const loadingScreen = document.getElementById('assetLoadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    toggleDebugVisuals() {
        this.isDebugVisualsActive = !this.isDebugVisualsActive;
//        console.log(`[Game] Debug Visuals Toggled: ${this.isDebugVisualsActive ? 'ON' : 'OFF'}`);
    }

    getProjectileFromPool(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy) {
        const projectile = this.projectilePool.acquire();
        let bulletLifetimeBonus = 0;
        if (shooterUnit && shooterUnit.team === 'player' && shooterUnit.rank) {
            const rankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === shooterUnit.rank);
            if (rankData && rankData.statBoosts && rankData.statBoosts.bulletLifetimeBonus) {
                bulletLifetimeBonus = rankData.statBoosts.bulletLifetimeBonus;
            }
        } else if (shooterUnit && shooterUnit.weapon && shooterUnit.weapon.bulletLifetime) {
            bulletLifetimeBonus = shooterUnit.weapon.bulletLifetime - CONFIG.PROJECTILES.BULLET.LIFETIME;
        }
        projectile.reset(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy, bulletLifetimeBonus);
        return projectile;
    }

    getGrenadeProjectileFromPool(startX, startY, targetX, targetY, shooterUnit) {
        const grenade = this.grenadeProjectilePool.acquire();
        grenade.reset(startX, startY, targetX, targetY, shooterUnit);
        return grenade;
    }

    _weightedRandomSelect(items, rngInstance) {
        if (!items || items.length === 0) return null;
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        if (totalWeight <= 0) {
            if (items.length > 0) return rngInstance.pickFrom(items);
            return null;
        }
        let randomVal = rngInstance.nextFloat(0, totalWeight);
        for (const item of items) {
            randomVal -= (item.weight || 1);
            if (randomVal <= 0) {
                return item;
            }
        }
        return items.length > 0 ? items[items.length - 1] : null;
    }

    _fillTextTemplate(templateString, data) {
        if (!templateString) return "";
        return templateString.replace(/{(\w+)}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    getLivingPlayerControlledUnits() {
        const livingRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [];
        const livingRescuedHostages = this.hostageUnits ? this.hostageUnits.filter(h => h.isRescued && h.isAlive()) : [];
        return [...livingRaccoons, ...livingRescuedHostages];
    }

    setNextBirdSpawnTimer(rngInstance = null) {
        const rng = rngInstance || (this.level && this.level.rng) || this.currentMissionSeedRNG || Math;
        if (this.birdSpawnConfig) {
            this.nextBirdSpawnTime = rng.nextFloat(
                (this.birdSpawnConfig.SPAWN_INTERVAL_MIN_SECONDS || 10),
                (this.birdSpawnConfig.SPAWN_INTERVAL_MAX_SECONDS || 20)
            );
        } else {
            this.nextBirdSpawnTime = Infinity;
        }
    }

    async preloadMiscAssets() {
        const imagePromises = [];
        if (this.birdSpawnConfig && this.birdSpawnConfig.TILE_SHEET_PATH) {
            const path = this.birdSpawnConfig.TILE_SHEET_PATH;
            if (!this.preloadedImages[path]) {
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                    img.onerror = () => { console.warn(`[Preload FAILED - Misc] Bird sheet: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                    img.src = path;
                }));
            }
        }
        // Preload shootout enemy tilesheets (grunt and heavy)
        if (CONFIG.SHOOTOUT_MODE && CONFIG.SHOOTOUT_MODE.ENEMY_TILESHEET) {
            const path = CONFIG.SHOOTOUT_MODE.ENEMY_TILESHEET.PATH;
            if (path && !this.preloadedImages[path]) {
//                console.log(`[Preload] Loading shootout enemy tilesheet: ${path}`);
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
//                        console.log(`[Preload] SUCCESS: Shootout enemy tilesheet loaded`);
                        this.preloadedImages[path] = img;
                        resolve();
                    };
                    img.onerror = (e) => {
//                        console.error(`[Preload FAILED - Misc] Shootout enemy tilesheet: '${path}'`, e);
                        this.preloadedImages[path] = null;
                        resolve();
                    };
                    img.src = path;
                }));
            } else if (path && this.preloadedImages[path]) {
//                console.log(`[Preload] Shootout enemy tilesheet already loaded: ${path}`);
            }
        }
        // Preload shootout heavy enemy tilesheet
        if (CONFIG.SHOOTOUT_MODE && CONFIG.SHOOTOUT_MODE.ENEMY_HEAVY_TILESHEET) {
            const path = CONFIG.SHOOTOUT_MODE.ENEMY_HEAVY_TILESHEET.PATH;
            if (path && !this.preloadedImages[path]) {
//                console.log(`[Preload] Loading shootout heavy enemy tilesheet: ${path}`);
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
//                        console.log(`[Preload] SUCCESS: Shootout heavy enemy tilesheet loaded`);
                        this.preloadedImages[path] = img;
                        resolve();
                    };
                    img.onerror = (e) => {
//                        console.error(`[Preload FAILED - Misc] Shootout heavy enemy tilesheet: '${path}'`, e);
                        this.preloadedImages[path] = null;
                        resolve();
                    };
                    img.src = path;
                }));
            } else if (path && this.preloadedImages[path]) {
//                console.log(`[Preload] Shootout heavy enemy tilesheet already loaded: ${path}`);
            }
        }
        // Preload shootout bullet mark sprites
        if (CONFIG.SHOOTOUT_MODE && CONFIG.SHOOTOUT_MODE.BULLET_MARKS) {
            const bulletMarksConfig = CONFIG.SHOOTOUT_MODE.BULLET_MARKS;
            // Preload enemy hit sprite
            if (bulletMarksConfig.ENEMY_HIT && bulletMarksConfig.ENEMY_HIT.PATH) {
                const enemyHitPath = bulletMarksConfig.ENEMY_HIT.PATH;
                if (!this.preloadedImages[enemyHitPath]) {
//                    console.log(`[Preload] Loading shootout bullet mark (enemy hit): ${enemyHitPath}`);
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
//                            console.log(`[Preload] SUCCESS: Bullet mark (enemy hit) loaded`);
                            this.preloadedImages[enemyHitPath] = img;
                            resolve();
                        };
                        img.onerror = (e) => {
//                            console.error(`[Preload FAILED - Misc] Bullet mark (enemy hit): '${enemyHitPath}'`, e);
                            this.preloadedImages[enemyHitPath] = null;
                            resolve();
                        };
                        img.src = enemyHitPath;
                    }));
                }
            }
            // Preload environment hit sprite
            if (bulletMarksConfig.ENVIRONMENT_HIT && bulletMarksConfig.ENVIRONMENT_HIT.PATH) {
                const envHitPath = bulletMarksConfig.ENVIRONMENT_HIT.PATH;
                if (!this.preloadedImages[envHitPath]) {
//                    console.log(`[Preload] Loading shootout bullet mark (environment hit): ${envHitPath}`);
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
//                            console.log(`[Preload] SUCCESS: Bullet mark (environment hit) loaded`);
                            this.preloadedImages[envHitPath] = img;
                            resolve();
                        };
                        img.onerror = (e) => {
//                            console.error(`[Preload FAILED - Misc] Bullet mark (environment hit): '${envHitPath}'`, e);
                            this.preloadedImages[envHitPath] = null;
                            resolve();
                        };
                        img.src = envHitPath;
                    }));
                }
            }
        }
        // Preload shootout bullet mark sprites
        if (CONFIG.SHOOTOUT_MODE && CONFIG.SHOOTOUT_MODE.BULLET_MARKS) {
            const bulletMarksConfig = CONFIG.SHOOTOUT_MODE.BULLET_MARKS;
            // Preload enemy hit sprite
            if (bulletMarksConfig.ENEMY_HIT && bulletMarksConfig.ENEMY_HIT.PATH) {
                const enemyHitPath = bulletMarksConfig.ENEMY_HIT.PATH;
                if (!this.preloadedImages[enemyHitPath]) {
//                    console.log(`[Preload] Loading shootout bullet mark (enemy hit): ${enemyHitPath}`);
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
//                            console.log(`[Preload] SUCCESS: Bullet mark (enemy hit) loaded`);
                            this.preloadedImages[enemyHitPath] = img;
                            resolve();
                        };
                        img.onerror = (e) => {
//                            console.error(`[Preload FAILED - Misc] Bullet mark (enemy hit): '${enemyHitPath}'`, e);
                            this.preloadedImages[enemyHitPath] = null;
                            resolve();
                        };
                        img.src = enemyHitPath;
                    }));
                }
            }
            // Preload environment hit sprite
            if (bulletMarksConfig.ENVIRONMENT_HIT && bulletMarksConfig.ENVIRONMENT_HIT.PATH) {
                const envHitPath = bulletMarksConfig.ENVIRONMENT_HIT.PATH;
                if (!this.preloadedImages[envHitPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            this.preloadedImages[envHitPath] = img;
                            resolve();
                        };
                        img.onerror = (e) => {
                            this.preloadedImages[envHitPath] = null;
                            resolve();
                        };
                        img.src = envHitPath;
                    }));
                }
            }
        }
        const grenadeSpriteConfig = CONFIG.PROJECTILES && CONFIG.PROJECTILES.GRENADE;
        if (grenadeSpriteConfig && grenadeSpriteConfig.SPRITE_PATH) {
            const path = grenadeSpriteConfig.SPRITE_PATH;
            if (!this.preloadedImages[path]) {
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                    img.onerror = () => { console.warn(`[Preload FAILED - Misc] Grenade sprite: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                    img.src = path;
                }));
            }
        }
        const ezConfig = CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.EXTRACTION_ZONE_SETTINGS;
        if (ezConfig && ezConfig.SPRITE_PATH) {
            const path = ezConfig.SPRITE_PATH;
            if (!this.preloadedImages[path]) {
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                    img.onerror = () => { console.warn(`[Preload FAILED - Misc] Extraction Zone: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                    img.src = path;
                }));
            }
        }

        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath) {
            for (const rank in rankIconConfig) {
                const path = rankIconPath + rankIconConfig[rank];
                if (!this.preloadedImages[path]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                        img.onerror = () => { console.warn(`[Preload FAILED - UI] Rank Icon: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                        img.src = path;
                    }));
                }
            }
        }

        if (CONFIG.UI_ASSETS) {
            if (CONFIG.UI_ASSETS.GRENADE_ICON) {
                const path = CONFIG.UI_ASSETS.GRENADE_ICON;
                if (!this.preloadedImages[path]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                        img.onerror = () => { console.warn(`[Preload FAILED - UI] Grenade Icon: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                        img.src = path;
                    }));
                }
            }
            if (CONFIG.UI_ASSETS.HEALTH_ICON) {
                const path = CONFIG.UI_ASSETS.HEALTH_ICON;
                if (!this.preloadedImages[path]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[path] = img; resolve(); };
                        img.onerror = () => { console.warn(`[Preload FAILED - UI] Health Icon: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                        img.src = path;
                    }));
                }
            }
        }

        const menuWallpaperPath = 'assets/images/ui/wallpapers/1K/menu/raccoon_1_menu.jpg';
        if (!this.preloadedImages[menuWallpaperPath]) {
            imagePromises.push(new Promise((resolve) => {
                const img = new Image();
                img.onload = () => { this.preloadedImages[menuWallpaperPath] = img; resolve(); };
                img.onerror = () => { console.warn(`[Preload FAILED - UI] Menu Wallpaper: '${menuWallpaperPath}'`); this.preloadedImages[menuWallpaperPath] = null; resolve(); };
                img.src = menuWallpaperPath;
            }));
        }

        await Promise.all(imagePromises);
    }

    async preloadUnitAssets() {
        const imagePromises = [];
        const unitTypesToPreload = [
            {
                name: 'raccoon',
                basePath: CONFIG.RACCOON_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_private',
                basePath: CONFIG.RACCOON_PRIVATE_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_corporal',
                basePath: CONFIG.RACCOON_CORPORAL_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_sergeant',
                basePath: CONFIG.RACCOON_SERGEANT_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_elite',
                basePath: CONFIG.RACCOON_ELITE_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_ghost',
                basePath: CONFIG.RACCOON_GHOST_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_maverick',
                basePath: CONFIG.RACCOON_MAVERICK_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'raccoon_hostage',
                basePath: 'assets/images/units/raccoon/hostage/', // Base path to the folder
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] }
            },
            {
                name: 'possum_grunt',
                basePath: CONFIG.POSSUM_GRUNT_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.POSSUM_GRUNT_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_GRUNT_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_heavy',
                basePath: CONFIG.POSSUM_HEAVY_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.POSSUM_HEAVY_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_HEAVY_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_sniper',
                basePath: CONFIG.POSSUM_SNIPER_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.POSSUM_SNIPER_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_SNIPER_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_boss_1',
                basePath: CONFIG.POSSUM_BOSS_1_SPRITE_PATH,
                actions: {
                    idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
                },
                deadPath: CONFIG.POSSUM_BOSS_1_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_BOSS_1_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_revolver',
                basePath: CONFIG.POSSUM_REVOLVER_SPRITE_PATH,
                actions: {
                    idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
                },
                deadPath: CONFIG.POSSUM_REVOLVER_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_REVOLVER_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_elite',
                basePath: CONFIG.POSSUM_ELITE_SPRITE_PATH,
                actions: {
                    idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
                },
                deadPath: CONFIG.POSSUM_ELITE_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_ELITE_DEAD_SPRITE_FILES
            }
        ];

        unitTypesToPreload.forEach(unitTypeConfig => {
            if (unitTypeConfig.basePath && unitTypeConfig.actions) {
                for (const actionKey in unitTypeConfig.actions) {
                    unitTypeConfig.actions[actionKey].forEach(dir => {
                        let filename;
                        if (unitTypeConfig.name === 'raccoon_hostage') {
                            filename = `hostage_idle_${dir}.png`;
                        } else {
                            filename = `${unitTypeConfig.name}_${actionKey}_${dir}.png`;
                        }
                        const spriteKey = `${unitTypeConfig.name}_${actionKey}_${dir}`;
                        const spritePath = `${unitTypeConfig.basePath}${actionKey}/${filename}`;

                        if (!this.preloadedImages[spriteKey]) {
                            imagePromises.push(new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => {
                                    this.preloadedImages[spriteKey] = img;
                                    resolve();
                                };
                                img.onerror = () => {
//                                    console.warn(`[Preload WARN - Unit] '${spritePath}'`);
                                    this.preloadedImages[spriteKey] = null;
                                    resolve();
                                };
                                img.src = spritePath;
                            }));
                        }
                    });
                }
            }
            if (unitTypeConfig.deadPath && unitTypeConfig.deadFiles) {
                unitTypeConfig.deadFiles.forEach(fileName => {
                    const fullPath = unitTypeConfig.deadPath + fileName;
                    if (!this.preloadedImages[fullPath]) {
                        imagePromises.push(new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                this.preloadedImages[fullPath] = img;
                                resolve();
                            };
                            img.onerror = () => {
//                                console.warn(`[Preload WARN - Dead Unit] '${fullPath}'`);
                                this.preloadedImages[fullPath] = null;
                                resolve();
                            };
                            img.src = fullPath;
                        }));
                    }
                });
            }
        });

        if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGE_PATH) {
            CONFIG.RACCOON_FACE_IMAGES.forEach(faceFile => {
                const faceKey = CONFIG.RACCOON_FACE_IMAGE_PATH + faceFile;
                if (!this.preloadedImages[faceKey]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            this.preloadedImages[faceKey] = img;
                            resolve();
                        };
                        img.onerror = () => {
                            this.preloadedImages[faceKey] = null;
                            resolve();
                        };
                        img.src = faceKey;
                    }));
                }
            });
        }
        const hostageBasePath = 'assets/images/units/raccoon/hostage/';
        const unrescuedHostageSprites = [
            'hostage_kneeling_s.png',
            'hostage_kneeling_sw.png',
            'hostage_kneeling_se.png'
        ];
        unrescuedHostageSprites.forEach(fileName => {
            const fullPath = hostageBasePath + fileName;
            if (!this.preloadedImages[fullPath]) {
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[fullPath] = img; resolve(); };
                    img.onerror = () => { console.warn(`[Preload WARN - Hostage] '${fullPath}'`); this.preloadedImages[fullPath] = null; resolve(); };
                    img.src = fullPath;
                }));
            }
        });
        await Promise.all(imagePromises);
    }

    async preloadLevelAssets() {
        const obstacleDefs = CONFIG.OBSTACLE_DEFINITIONS || [];
        const imagePromises = [];

        if (CONFIG.POSSUM_HUT_SPRITE_FILES && CONFIG.POSSUM_HUT_SPRITE_PATH) {
            const hutPath = CONFIG.POSSUM_HUT_SPRITE_PATH;
            CONFIG.POSSUM_HUT_SPRITE_FILES.forEach(pair => {
                const normalPath = hutPath + pair.normal;
                const destroyedPath = hutPath + pair.destroyed;
                if (pair.normal && !this.preloadedImages[normalPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[normalPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[normalPath] = null; resolve(); };
                        img.src = normalPath;
                    }));
                }
                if (pair.destroyed && !this.preloadedImages[destroyedPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[destroyedPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[destroyedPath] = null; resolve(); };
                        img.src = destroyedPath;
                    }));
                }
            });
        }

        if (CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES && CONFIG.POSSUM_HUT_ROUND_SPRITE_PATH) {
            const hutPath = CONFIG.POSSUM_HUT_ROUND_SPRITE_PATH;
            CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES.forEach(pair => {
                const normalPath = hutPath + pair.normal;
                const destroyedPath = hutPath + pair.destroyed;
                if (pair.normal && !this.preloadedImages[normalPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[normalPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[normalPath] = null; resolve(); };
                        img.src = normalPath;
                    }));
                }
                if (pair.destroyed && !this.preloadedImages[destroyedPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[destroyedPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[destroyedPath] = null; resolve(); };
                        img.src = destroyedPath;
                    }));
                }
            });
        }

        if (CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES && CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH) {
            const towerPath = CONFIG.POSSUM_RELAY_TOWER_SPRITE_PATH;
            CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES.forEach(pair => {
                const normalPath = towerPath + pair.normal;
                const destroyedPath = towerPath + pair.destroyed;
                if (pair.normal && !this.preloadedImages[normalPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[normalPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[normalPath] = null; resolve(); };
                        img.src = normalPath;
                    }));
                }
                if (pair.destroyed && !this.preloadedImages[destroyedPath]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[destroyedPath] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[destroyedPath] = null; resolve(); };
                        img.src = destroyedPath;
                    }));
                }
            });
        }

        const pickupSpritePairs = [
            { files: CONFIG.HEALTH_PICKUP_SPRITE_FILES, path: CONFIG.HEALTH_PICKUP_SPRITE_PATH },
            { files: CONFIG.AMMO_PICKUP_SPRITE_FILES, path: CONFIG.AMMO_PICKUP_SPRITE_PATH },
            { files: CONFIG.GRENADE_PICKUP_SPRITE_FILES, path: CONFIG.GRENADE_PICKUP_SPRITE_PATH }
        ];
        pickupSpritePairs.forEach(pickup => {
            if (pickup.files && pickup.path) {
                pickup.files.forEach(pair => {
                    const normalPath = pickup.path + pair.normal;
                    const destroyedPath = pickup.path + pair.destroyed;
                    if (pair.normal && !this.preloadedImages[normalPath]) {
                        imagePromises.push(new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => { this.preloadedImages[normalPath] = img; resolve(); };
                            img.onerror = () => { this.preloadedImages[normalPath] = null; resolve(); };
                            img.src = normalPath;
                        }));
                    }
                    if (pair.destroyed && !this.preloadedImages[destroyedPath]) {
                        imagePromises.push(new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => { this.preloadedImages[destroyedPath] = img; resolve(); };
                            img.onerror = () => { this.preloadedImages[destroyedPath] = null; resolve(); };
                            img.src = destroyedPath;
                        }));
                    }
                });
            }
        });

        obstacleDefs.forEach(def => {
            let handledByDedicatedList = false;
            if (
                (def.type === 'decoration_grass' && CONFIG.GRASS_SPRITE_FILES) ||
                (def.type === 'fence_barbed_straight_short' && CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES) ||
                (def.type === 'fence_barbed_straight_long' && CONFIG.FENCE_BARBED_LONG_SPRITE_FILES) ||
                (def.type === 'bush_medium' && CONFIG.BUSH_SPRITES_32PX_FILES) ||
                (def.type === 'bush_large' && CONFIG.TROPICAL_BUSH_LARGE_FILES) ||
                (def.type === 'rock_medium' && CONFIG.ROCK_SPRITES_32PX_FILES) ||
                (def.type === 'rock_large' && CONFIG.ROCK_SPRITES_64PX_FILES) ||
                (def.type === 'tree_palm_single' && CONFIG.PALM_TREE_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_double' && CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_triple' && CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_fallen' && CONFIG.PALM_TREE_FALLEN_SPRITE_FILES) ||
                (def.type === 'tree_palm2_fallen' && CONFIG.PALM2_TREE_FALLEN_SPRITE_FILES) ||
                (def.type === 'tree_deciduous_fallen' && CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_FILES) ||
                (def.type === 'tree_palm2_single' && CONFIG.PALM_TREE2_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree_palm2_double' && CONFIG.PALM_TREE2_DOUBLE_SPRITE_FILES) ||
                (def.type === 'tree_palm2_triple' && CONFIG.PALM_TREE2_TRIPLE_SPRITE_FILES) ||
                (def.type === 'tree_deciduous_single' && CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES) ||
                (def.type === 'tree4_deciduous_single' && CONFIG.TREE4_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree5_deciduous_single' && CONFIG.TREE5_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree_fan_single' && CONFIG.FAN_TREE_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree_fan_double' && CONFIG.FAN_TREE_DOUBLE_SPRITE_FILES) ||
                (def.type === 'tree_fan_triple' && CONFIG.FAN_TREE_TRIPLE_SPRITE_FILES) ||
                (def.type === 'palm_bush_small' && CONFIG.PALM_BUSH_SMALL_FILES) ||
                (def.type === 'palm_bush_large' && CONFIG.PALM_BUSH_LARGE_FILES) ||
                (def.type === 'pickup_health' && CONFIG.HEALTH_PICKUP_SPRITE_FILES) ||
                (def.type === 'pickup_ammo_crate' && CONFIG.AMMO_PICKUP_SPRITE_FILES) ||
                (def.type === 'pickup_grenade_crate' && CONFIG.GRENADE_PICKUP_SPRITE_FILES) ||
                (def.type === 'possum_hut' && CONFIG.POSSUM_HUT_SPRITE_FILES) ||
                (def.type === 'possum_hut_round' && CONFIG.POSSUM_HUT_ROUND_SPRITE_FILES) ||
                (def.type === 'possum_relay_tower' && CONFIG.POSSUM_RELAY_TOWER_SPRITE_FILES)) {
                handledByDedicatedList = true;
            }

            const spritesToLoadOnTemplate = [];
            if (!handledByDedicatedList) {
                if (def.spriteNormal) spritesToLoadOnTemplate.push({ path: def.spriteNormal, key: def.spriteNormal });
            }
            if (def.spriteDestroyed) {
                spritesToLoadOnTemplate.push({ path: def.spriteDestroyed, key: def.spriteDestroyed });
            }
            spritesToLoadOnTemplate.forEach(spriteInfo => {
                if (spriteInfo.path && !this.preloadedImages[spriteInfo.key]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => { this.preloadedImages[spriteInfo.key] = img; resolve(); };
                        img.onerror = () => { this.preloadedImages[spriteInfo.key] = null; resolve(); };
                        img.src = spriteInfo.path;
                    }));
                }
            });
        });
        const listBasedSprites = [
            { files: CONFIG.GRASS_SPRITE_FILES, path: CONFIG.GRASS_SPRITE_PATH, name: "grass" },
            { files: CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES, path: CONFIG.FENCE_BARBED_SPRITE_PATH, name: "fence_barbed_straight_short" },
            { files: CONFIG.FENCE_BARBED_LONG_SPRITE_FILES, path: CONFIG.FENCE_BARBED_SPRITE_PATH, name: "fence_barbed_straight_long" },
            { files: CONFIG.BUSH_SPRITES_32PX_FILES, path: CONFIG.BUSH_SPRITES_32PX_PATH, name: "bush32" },
            { files: CONFIG.TROPICAL_BUSH_LARGE_FILES, path: CONFIG.TROPICAL_BUSH_LARGE_PATH, name: "bush_large" },
            { files: CONFIG.ROCK_SPRITES_32PX_FILES, path: CONFIG.ROCK_SPRITES_32PX_PATH, name: "rock32" },
            { files: CONFIG.ROCK_SPRITES_64PX_FILES, path: CONFIG.ROCK_SPRITES_64PX_PATH, name: "rock64" },
            { files: CONFIG.PALM_TREE_SINGLE_SPRITE_FILES, path: CONFIG.PALM_TREE_SINGLE_SPRITE_PATH, name: "palm_single" },
            { files: CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES, path: CONFIG.PALM_TREE_DOUBLE_SPRITE_PATH, name: "palm_double" },
            { files: CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES, path: CONFIG.PALM_TREE_TRIPLE_SPRITE_PATH, name: "palm_triple" },
            { files: CONFIG.PALM_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM_TREE_FALLEN_SPRITE_PATH, name: "palm_fallen" },
            { files: CONFIG.PALM2_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM2_TREE_FALLEN_SPRITE_PATH, name: "palm2_fallen" },
            { files: CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_FILES, path: CONFIG.DECIDUOUS_TREE_FALLEN_SPRITE_PATH, name: "deciduous_fallen" },
            { files: CONFIG.PALM_TREE2_SINGLE_SPRITE_FILES, path: CONFIG.PALM_TREE2_SINGLE_SPRITE_PATH, name: "palm2_single" },
            { files: CONFIG.PALM_TREE2_DOUBLE_SPRITE_FILES, path: CONFIG.PALM_TREE2_DOUBLE_SPRITE_PATH, name: "palm2_double" },
            { files: CONFIG.PALM_TREE2_TRIPLE_SPRITE_FILES, path: CONFIG.PALM_TREE2_TRIPLE_SPRITE_PATH, name: "palm2_triple" },
            { files: CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_FILES, path: CONFIG.DECIDUOUS_TREE2_SINGLE_TALL_SPRITE_PATH, name: "deciduous_single" },
            { files: CONFIG.TREE4_SINGLE_SPRITE_FILES, path: CONFIG.TREE4_SINGLE_SPRITE_PATH, name: "tree4_deciduous_single" },
            { files: CONFIG.TREE5_SINGLE_SPRITE_FILES, path: CONFIG.TREE5_SINGLE_SPRITE_PATH, name: "tree5_deciduous_single" },
            { files: CONFIG.FAN_TREE_SINGLE_SPRITE_FILES, path: CONFIG.FAN_TREE_SINGLE_SPRITE_PATH, name: "tree_fan_single" },
            { files: CONFIG.FAN_TREE_DOUBLE_SPRITE_FILES, path: CONFIG.FAN_TREE_DOUBLE_SPRITE_PATH, name: "tree_fan_double" },
            { files: CONFIG.FAN_TREE_TRIPLE_SPRITE_FILES, path: CONFIG.FAN_TREE_TRIPLE_SPRITE_PATH, name: "tree_fan_triple" },
            { files: CONFIG.PALM_BUSH_SMALL_FILES, path: CONFIG.PALM_BUSH_SMALL_PATH, name: "palm_bush_small" },
            { files: CONFIG.PALM_BUSH_LARGE_FILES, path: CONFIG.PALM_BUSH_LARGE_PATH, name: "palm_bush_large" },
            { files: CONFIG.HEALTH_PICKUP_SPRITE_FILES, path: CONFIG.HEALTH_PICKUP_SPRITE_PATH, name: "pickup_health" },
            { files: CONFIG.AMMO_PICKUP_SPRITE_FILES, path: CONFIG.AMMO_PICKUP_SPRITE_PATH, name: "pickup_ammo_crate" },
            { files: CONFIG.GRENADE_PICKUP_SPRITE_FILES, path: CONFIG.GRENADE_PICKUP_SPRITE_PATH, name: "pickup_grenade_crate" },
            { files: CONFIG.MUD_SPRITE_FILES, path: CONFIG.MUD_SPRITE_PATH, name: "mud" }
        ];

        listBasedSprites.forEach(spriteSet => {
            const spriteFiles = spriteSet.files || []; const spritePathBase = spriteSet.path || '';
            if (spritePathBase && spriteFiles.length > 0) {
                spriteFiles.forEach(fileName => {
                    const fullPath = spritePathBase + fileName;
                    if (!this.preloadedImages[fullPath]) {
                        imagePromises.push(new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => { this.preloadedImages[fullPath] = img; resolve(); };
                            img.onerror = () => { this.preloadedImages[fullPath] = null; resolve(); };
                            img.src = fullPath;
                        }));
                    }
                });
            }
        });
        await Promise.all(imagePromises);
    }

    async preloadAudioAssets() {
        if (CONFIG.AUDIO_ASSETS && this.audioManager) {
            for (const key in CONFIG.AUDIO_ASSETS) {
                const asset = CONFIG.AUDIO_ASSETS[key];
                if (typeof asset === 'object' && asset !== null && asset.hasOwnProperty('path')) {
                    this.audioManager.addSoundToLoadQueue(key, asset.path, asset.defaultVolume);
                }
            }
            await this.audioManager.loadAllSounds(
                (loaded, total, key, error) => { },
                () => { }
            );
        } else {
        }
    }

    generatePrerenderedBackground(worldWidth, worldHeight, seedForBackground) {
        this.prerenderedBackgroundCanvas.width = worldWidth;
        this.prerenderedBackgroundCanvas.height = worldHeight;
        const ctx = this.prerenderedBackgroundCtx;
        const localRng = new SeededRandom(seedForBackground);

        ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
        ctx.fillRect(0, 0, worldWidth, worldHeight);

        if (CONFIG.GRASS_SPRITE_FILES && CONFIG.GRASS_SPRITE_FILES.length > 0 && CONFIG.GRASS_SPRITE_PATH) {
            const configuredTileSize = CONFIG.WORLD_GRASS_TILE_SIZE || 64;
            const overlapFactor = CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR !== undefined ? CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR : 0.2;
            const stepX = configuredTileSize * (1 - overlapFactor + 0.1);
            const stepY = configuredTileSize * (1 - overlapFactor);

            const skipChance = CONFIG.WORLD_GRASS_SKIP_CHANCE || 0.0;
            const skipMin = CONFIG.WORLD_GRASS_SKIP_MIN || 1;
            const skipMax = CONFIG.WORLD_GRASS_SKIP_MAX || 1;

            const mudSpritePath = CONFIG.MUD_SPRITE_PATH || '';
            const mudSpriteFiles = CONFIG.MUD_SPRITE_FILES || [];
            const hasMudSprites = mudSpriteFiles.length > 0;

            const noiseScaleX = (CONFIG.WORLD_MUD_NOISE_SCALE_X || 0.05);
            const noiseScaleY = (CONFIG.WORLD_MUD_NOISE_SCALE_Y || 0.05);
            const noiseThreshold = (CONFIG.WORLD_MUD_NOISE_THRESHOLD || 0.3);
            const noiseOctaves = (CONFIG.WORLD_MUD_NOISE_OCTAVES || 4);

            for (let y = -configuredTileSize * overlapFactor; y < worldHeight; y += stepY) {
                const rowOffset = (Math.floor((y + configuredTileSize * overlapFactor) / stepY) % 2 === 1) ? stepX / 2 : 0;
                for (let x = -configuredTileSize * overlapFactor; x < worldWidth; x += stepX) {
                    const effectiveX = x + rowOffset;

                    const noiseValue = (skipChance > 0) ? localRng.fbm(effectiveX * noiseScaleX, y * noiseScaleY, noiseOctaves, 2, 0.5) : 0;
                    const isMudTile = skipChance > 0 && noiseValue > noiseThreshold;

                    if (isMudTile) {
                        if (hasMudSprites) {
                            const randomMudSprite = localRng.pickFrom(mudSpriteFiles);
                            const mudSpriteFullPath = mudSpritePath + randomMudSprite;
                            const mudImg = this.preloadedImages[mudSpriteFullPath];
                            if (mudImg) {
                                const offsetX = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                                const offsetY = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                                const rotation = localRng.nextFloat(0, Math.PI * 2);
                                const drawX = effectiveX + offsetX;
                                const drawY = y + offsetY;
                                const centerX = drawX + configuredTileSize / 2;
                                const centerY = drawY + configuredTileSize / 2;
                                ctx.save();
                                ctx.translate(centerX, centerY);
                                ctx.rotate(rotation);
                                ctx.drawImage(mudImg, -configuredTileSize / 2, -configuredTileSize / 2, configuredTileSize, configuredTileSize);
                                ctx.restore();
                            } else {
                                ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
                                ctx.fillRect(effectiveX, y, configuredTileSize, configuredTileSize);
                            }
                        } else {
                            ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
                            ctx.fillRect(effectiveX, y, configuredTileSize, configuredTileSize);
                        }
                    } else {
                            const randomSpriteName = localRng.pickFrom(CONFIG.GRASS_SPRITE_FILES);
                            const spritePath = CONFIG.GRASS_SPRITE_PATH + randomSpriteName;
                            const grassImg = this.preloadedImages[spritePath];

                            if (grassImg) {
                                const offsetX = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                                const offsetY = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                                const drawX = effectiveX + offsetX;
                                const drawY = y + offsetY;
                                ctx.drawImage(grassImg, drawX, drawY, configuredTileSize, configuredTileSize);
                            }
                        }
                    }
                }
            }
        }
    

    start() {
        if (!this.masterRoster || this.masterRoster.length === 0) {
            this.initializeNewCampaign();
            if (!this.masterRoster || this.masterRoster.length === 0) {
                this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); return;
            }
        }
        // --- MODIFICATION START ---
        if (this.getAvailableRecruits().length === 0 && this.masterRoster.length > 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA);
            return;
        }
        // --- MODIFICATION END ---

        if (this.generateAndSetCurrentMissionParams(this.currentPhaseIndex, this.currentMissionIndex)) {
            const currentPhaseData = this.campaignStructure[this.currentPhaseIndex];
            if (this.ui && currentPhaseData && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(currentPhaseData, this.currentMissionParams, this.getAvailableRecruits());
                this.gameState = 'PRE_MISSION_SELECT';
                // Continue menu music for pre-mission
                if (this.musicManager) {
                    this.musicManager.onGameStateChange('PRE_MISSION_SELECT');
                }
            } else {
                this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen();
            }
        } else {
            this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); alert(CONFIG.UI_TEXT_STRINGS.ERROR_LOAD_FIRST_MISSION_FAILED);
        }
    }

    async confirmSquadAndStartMission(selectedRecruitsForDeployment) {
        const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
        if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0 || selectedRecruitsForDeployment.length > maxSquadSize) {
            let alertMsg = (CONFIG.UI_TEXT_STRINGS.INVALID_SQUAD_SIZE_ALERT || "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString());
            if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0) { alertMsg = CONFIG.UI_TEXT_STRINGS.NO_RECRUITS_SELECTED_ALERT || "Select at least one Raccoon for the mission!"; }
            else if (selectedRecruitsForDeployment.length > maxSquadSize) { alertMsg = (CONFIG.UI_TEXT_STRINGS.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()); }
            alert(alertMsg);
            const currentPhaseDataForUI = this.campaignStructure[this.currentPhaseIndex] ||
                { name: "Phase Error", introduction: "Could not load phase details." };
            if (this.ui && currentPhaseDataForUI && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(currentPhaseDataForUI, this.currentMissionParams, this.getAvailableRecruits());
            }
            return;
        }

        // Show video and wait for it to start playing before starting the 6-second timer
        let videoStartedPromise = Promise.resolve();
        let videoPathToShow;
        if (this.ui) {
            if (this.currentMissionIndex === 0) {
                const phaseStartVideoPaths = [
                    'assets/video/landing/Raccoon_Combat_Team_Deploys.mp4',
                //    'assets/video/landing/Helicopter_Landing_1.mp4',
                //    'assets/video/landing/Helicopter_Landing_2.mp4',
                //    'assets/video/landing/Helicopter_Landing_3.mp4',
                //    'assets/video/landing/Helicopter_Landing_4.mp4',
                //    'assets/video/landing/Helicopter_Landing_5.mp4',
                    'assets/video/landing/Helicopter_Landing_6.mp4',
                ];
                videoPathToShow = phaseStartVideoPaths[Math.floor(Math.random() * phaseStartVideoPaths.length)];
            } else {
                const videoPaths = [
                    'assets/video/raccoon_8.mp4',
                    'assets/video/raccoon_9.mp4',
                    'assets/video/raccoon_10.mp4',
                    'assets/video/raccoon_11.mp4',
                    'assets/video/raccoon_12.mp4',
                    'assets/video/raccoon_13.mp4',
                    'assets/video/raccoon_14.mp4',
                    'assets/video/raccoon_15.mp4',
                    'assets/video/raccoon_16.mp4',
                    'assets/video/raccoon_17.mp4',
                ];
                videoPathToShow = videoPaths[Math.floor(Math.random() * videoPaths.length)];
            }
            videoStartedPromise = this.ui.showVideoLoadingScreen(videoPathToShow);
        }

        this.gameState = 'LOADING_MISSION';

        this.masterRoster.forEach(r => {
            if (r.isNewlyRescued) r.isNewlyRescued = false;
            if (r.promotedThisMission) r.promotedThisMission = false;
        });

        // Wait for video to start playing BEFORE starting the 6-second timer
        // This ensures the timer only counts during actual video playback, not during loading
        await videoStartedPromise;

        // --- START AMBIENT IMMEDIATELY WHEN VIDEO STARTS ---
        // This ensures ambient plays during the video and carries over into the game
        // Stop music but NOT ambient so it continues through video into gameplay
        if (this.musicManager) {
            this.musicManager.stopMusic();
            const biome = this.currentMissionParams?.baseParams?.biome || 'TROPICAL';
            const biomeConfig = CONFIG.AUDIO_MUSIC && CONFIG.AUDIO_MUSIC.BIOME_TRACKS ? CONFIG.AUDIO_MUSIC.BIOME_TRACKS[biome] : null;
            if (biomeConfig && biomeConfig.ambient && biomeConfig.ambient.length > 0) {
                const rng = this.currentMissionSeedRNG || new SeededRandom(Date.now());
                const ambientTrack = rng.pickFrom(biomeConfig.ambient);
                this.musicManager.playAmbient(ambientTrack, { fade: true, loop: true });
            }
        }
        
        const minDisplayTimePromise = new Promise(resolve =>
            setTimeout(resolve, CONFIG.MIN_LOADING_VIDEO_DURATION_MS || 5000)
        );

        // Load assets (music now handled by MusicManager when mission starts)
        const loadingTasksPromise = (async () => {
            await this.preloadLevelAssets();
            await this.preloadUnitAssets();
            await this.preloadMiscAssets();

            this.deployedSquadRoster = selectedRecruitsForDeployment;
            this.lastDeployedSquadIds = this.deployedSquadRoster.map(r => r.id);

            this.deployedSquadRoster.forEach(r => {
                r.hp = r.maxHp; let startGrenades = CONFIG.RACCOON_STARTING_GRENADES || 0;
                if (r.rank === "Corporal") startGrenades += (CONFIG.GRENADE_BONUS_CORPORAL || 0);
                if (r.rank === "Sergeant") startGrenades += (CONFIG.GRENADE_BONUS_SERGEANT || 0);
                if (r.rank === "Elite") startGrenades += (CONFIG.GRENADE_BONUS_ELITE || 0);
                if (r.rank === "Ghost") startGrenades += (CONFIG.GRENADE_BONUS_GHOST || 0);
                r.grenadeAmmo = startGrenades; r.isMoving = false; r.manualTarget = null; r.autoTarget = null; r.actionTimer = 0; r.isAimingGrenade = false;
                r.isPlayerDirectFiring = false;
                r.isHoldingPosition = false;
                r.isHoldingFire = false;
                r.ammo = r.maxAmmo;
                r.currentMagazine = r.magazineSize;
                r.reloadTimer = 0;
                r.isReloading = false;
            });

            this.isObjectiveComplete = false;
            this.missionStartedAndPopulated = false;
            this.fallenRaccoonsThisMission = [];
            this.missionStartTime = performance.now();
            this.hostageUnits = [];

            let worldWidth = (CONFIG.BASE_WORLD_WIDTH || 1280) * (this.currentMissionParams.baseParams.worldWidthFactor || 1);
            let worldHeight = (CONFIG.BASE_WORLD_HEIGHT || 720) * (this.currentMissionParams.baseParams.worldHeightFactor || 1);

            if (this.canvas && this.canvas.width && this.canvas.height) {
                worldWidth = Math.max(worldWidth, this.canvas.width);
                worldHeight = Math.max(worldHeight, this.canvas.height);
            } else {
                worldWidth = Math.max(worldWidth, CONFIG.MIN_CANVAS_WIDTH || 800);
                worldHeight = Math.max(worldHeight, CONFIG.MIN_CANVAS_HEIGHT || 600);
            }

            CONFIG.WORLD_WIDTH = worldWidth;
            CONFIG.WORLD_HEIGHT = worldHeight;

            // --- MODIFICATION START: Create the Spatial Grid BEFORE level generation ---
            if (this.spatialGrid) {
                this.spatialGrid.clear();
            }
            this.spatialGrid = new SpatialGrid(worldWidth, worldHeight, this.SPATIAL_GRID_CELL_SIZE, this);
            // --- MODIFICATION END ---

            const playerSpawnLocations = this.level.generateLevelAndGetPlayerSpawns(
                worldWidth, worldHeight,
                this.currentMissionParams,
                this.deployedSquadRoster.length,
                this.preloadedImages,
                this.currentMissionSeed
            );

            this.generatePrerenderedBackground(worldWidth, worldHeight, this.currentMissionSeed);

            this.initialEnemyCount = this.enemyUnits.length;
            if (this.currentMissionParams && this.currentMissionParams.objectives) {
                this.currentMissionParams.objectives.forEach(obj => {
                    if (obj.type === "EXTERMINATE") {
                        obj.totalToAchieve = this.initialEnemyCount;
                        obj.currentProgress = 0;
                    } else if (obj.type === "ASSASSINATION") {
                        if (!obj.targetUnitId && obj.targetDetails) {
//                            console.error(`[Game] CRITICAL: Assassination target ${obj.targetDetails.name} (${obj.targetDetails.callsign}) for objective ${obj.id} FAILED TO SPAWN or link. Mission may be uncompletable or objectives need to change.`);
                        }
                    }
                });
                const hasPrimary = this.currentMissionParams.objectives.some(o => o.isPrimary);
                if (!hasPrimary) {
                    const exterminateObj = this.currentMissionParams.objectives.find(o => o.type === "EXTERMINATE");
                    if (exterminateObj) {
                        exterminateObj.isPrimary = true;
//                        console.warn("[Game] No primary objective found after setup, defaulting EXTERMINATE to primary.");
                    } else {
                        const defaultExtObj = this._instantiateObjective(this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTERMINATE"), this.currentPhaseIndex, true);
                        if (defaultExtObj) {
                            defaultExtObj.totalToAchieve = this.initialEnemyCount;
                            this.currentMissionParams.objectives.push(defaultExtObj);
//                            console.warn("[Game] No objectives found, adding default EXTERMINATE as primary.");
                        }
                    }
                }
            }

            // --- MODIFICATION: Grid is already created, so now we just add objects ---
            this.level.obstacles.forEach(obs => {
                if (obs.blocksMovement || obs.providesCover || obs.isPickup || obs.type === 'extraction_zone') {
                    this.spatialGrid.addObject(obs);
                }
            });
            this.deployedSquadRoster.forEach(unit => this.spatialGrid.addObject(unit));
            this.enemyUnits.forEach(unit => this.spatialGrid.addObject(unit));
            this.hostageUnits.forEach(unit => this.spatialGrid.addObject(unit));
            // --- MODIFICATION END ---

            this.deployedSquadRoster.forEach((raccoon, index) => {
                if (playerSpawnLocations[index]) { raccoon.x = playerSpawnLocations[index].x; raccoon.y = playerSpawnLocations[index].y; raccoon.worldTargetX = raccoon.x; raccoon.worldTargetY = raccoon.y; raccoon.game = this; }
                else { console.warn(`No spawn location for Raccoon ${index}. Fallback.`); raccoon.x = 100 + index * (CONFIG.RACCOON_SIZE * 3); raccoon.y = (CONFIG.WORLD_HEIGHT || 600) / 2; }
            });
            this.selectedUnits = [...this.deployedSquadRoster];
            this.gameObjects = [];
            this.visualEffects = [];

            this.inputHandler.isCtrlDragSelecting = false;
            this.isDragging = false;
            this.draggedFarEnough = false;

            if (this.deployedSquadRoster.length > 0) {
                let sumX = 0, sumY = 0;
                this.deployedSquadRoster.forEach(unit => {
                    sumX += unit.x;
                    sumY += unit.y;
                });
                const avgX = sumX / this.deployedSquadRoster.length;
                const avgY = sumY / this.deployedSquadRoster.length;
                const zoom = this.cameraZoom || 1.0;

                this.cameraX = avgX - (this.canvas.width / (2 * zoom));
                this.cameraY = avgY - (this.canvas.height / (2 * zoom));

                this.clampCamera();
            } else {
                const zoom = this.cameraZoom || 1.0;
                this.cameraX = (CONFIG.WORLD_WIDTH - this.canvas.width / zoom) / 2;
                this.cameraY = (CONFIG.WORLD_HEIGHT - this.canvas.height / zoom) / 2;
                this.clampCamera();
            }
        })();

        await Promise.all([loadingTasksPromise, minDisplayTimePromise]);

        // --- QUICK AMBUSH CHECK (during video, before it ends) ---
        // Determine if ambush will trigger - synchronous check
        const willTriggerAmbush = this.shouldTriggerAmbush('START');

        // --- Night Mission: set flag from generated params ---
        this.isNightMission = !!(this.currentMissionParams?.baseParams?.isNightMission);

        // Ambush integration: if we're in RUNNING state but have an active ambush, update shootout instead
        if (this.shootoutController && this.shootoutController.isAmbushMode && this.shootoutController.isRoundActive) {
            this.gameState = 'SHOOTOUT_AMBUSH';
        } else {
            this.gameState = 'RUNNING';
        }
        
        // Music will be started in finishMissionStart (after any ambush)
        
        if (this.ui) {
            this.ui.hideVideoLoadingScreen();
        }

        // --- Handle Ambush After Video Ends ---
        if (willTriggerAmbush) {
            const game = this;
            this.executeStartAmbush(function(success) {
                if (success) {
                    game.finishMissionStart();
                }
            });
        } else {
            this.finishMissionStart();
        }
    }

    /**
     * Finish mission startup (called after video and optional ambush)
     */
    finishMissionStart() {
        this.missionStartedAndPopulated = true;
        this.missionStartTime = performance.now();
        this.isObjectiveComplete = false;
        this.setNextBirdSpawnTimer();
        
        // Reset ambush state for new mission
        this.currentAmbushType = null;
        this.ambushResult = null;
        this.ambushesSurvivedThisMission = [];
        // Don't reset takenHostageRaccoonId here - it's needed for objective generation

        // Start campaign music now that mission is fully started (after any ambush)
        if (this.musicManager) {
            const biome = this.currentMissionParams?.baseParams?.biome || 'TROPICAL';
            const objectives = this.currentMissionParams?.objectives || [];
            const isBossMission = objectives.some(obj => {
                if (obj.type === 'ASSASSINATION' && obj.targetDetails) {
                    const targetKey = obj.targetDetails.assassinationTypeKey;
                    return targetKey === 'possum_boss_1' || targetKey === 'possum_revolver_boss';
                }
                return false;
            });
            this.musicManager.onGameStateChange('RUNNING', { 
                biome: biome, 
                rng: this.currentMissionSeedRNG,
                isBossMission: isBossMission
            });
        }

        if (this.ui) { this.ui.hidePreMissionScreen(); this.ui.showHUD(); this.ui.updateObjective(); this.ui.updateFormationButton(this.currentFormationType); }
        if (this.ui) { this.ui.updateNightMissionBadge(); }
        if (this.inputHandler) { this.inputHandler.isLMBHoldFiringActionActive = false; this.inputHandler.updateMouseCursor(); }

        this.lastTime = performance.now();
        this.setNextBirdSpawnTimer(this.level.rng);
        this.missionEndDelayTimer = -1;
        this.missionPendingOutcomeIsVictory = false;
        this.missionEndInitiated = false;
        this.pendingDebriefData = null;
    }

    /**
     * Execute the ambush - show alert and run shootout
     * @param {function} callback - Called when ambush ends
     */
    executeStartAmbush(callback) {
//        console.log('[Game] START AMBUSH TRIGGERED!');
        
        // Set flag so mission doesn't start while ambush alert is showing
        this.ambushTriggered = true;
        
        // Initialize shootout controller if needed
        this.initShootoutForAmbush();
        
        // Get random background and night mode setting
        const background = this.getRandomAmbushBackground();
        const isNight = this.isNightMission && CONFIG.SHOOTOUT_MODE.AMBUSH_NIGHT_MODE_ENABLED;
        
        // Store previous game state
        this.previousGameState = this.gameState;
        
        // Pre-configure shootout with background and start music BEFORE showing alert
        if (this.shootoutController) {
            this.shootoutController.setBackground(background);
            this.shootoutController.setNightMode(isNight);
            // Crossfade from campaign music to ambush music
            if (this.musicManager) {
                this.musicManager.playMusic(this.musicManager.config.STATE_TRACKS.SHOOTOUT_AMBUSH || this.musicManager.config.STATE_TRACKS.SHOOTOUT_PLAYING, { fade: true, loop: true });
            }
        }
        
        // Show ambush alert
        const game = this;
        const backgroundImagePath = CONFIG.SHOOTOUT_MODE.BACKGROUNDS[background]?.IMAGE;
        if (this.ui) {
            this.ui.showShootoutAmbushAlert('START_AMBUSH', function() {
                // Start the ambush
                game.shootoutController.startAmbush(background, isNight, function(result) {
                    // Ambush ended
//                    console.log('[Game] Start ambush ended with result:', result);
                    
                    // Handle ambush result (START type)
                    game.handleAmbushResult('START', result);
                    
                    if (callback) callback(result === 'VICTORY');
                });
            }, backgroundImagePath);
        } else {
            // No UI - just run ambush immediately
            this.shootoutController.startAmbush(background, isNight, function(result) {
                game.handleAmbushResult('START', result);
                if (callback) callback(result === 'VICTORY');
            });
        }
    }

    /**
     * Legacy method - kept for backward compatibility with extraction ambush
     * @param {function} callback - Callback when ambush ends
     */
    triggerStartAmbush(callback) {
        this.executeStartAmbush(callback);
    }

    /**
     * Handle the result of an ambush encounter
     * @param {string} ambushType - 'START' or 'EXTRACTION'
     * @param {string} result - 'VICTORY', 'TIME_UP', or 'DEFEAT'
     */
    handleAmbushResult(ambushType, result) {
        // Clear ambush triggered flag
        this.ambushTriggered = false;
        
        // Store the type
        this.currentAmbushType = ambushType;
        this.ambushResult = result;
        
        if (result === 'VICTORY') {
            // Ambush survived - track it
            this.ambushesSurvivedThisMission.push(ambushType);
//            console.log(`[Game] Ambush ${ambushType} SURVIVED!`);
            
            if (ambushType === 'START') {
                // START ambush: return to RUNNING (music handled by finishMissionStart)
                this.gameState = 'RUNNING';
//                console.log('[Game] Ambush ended, campaign will start music in finishMissionStart');
            } else {
                // EXTRACTION ambush: go directly to victory
                // CRITICAL: Reset missionEndInitiated flag that was set BEFORE the ambush started
                // This flag was set at line 2767 to prevent re-triggering during the ambush,
                // but now we need to allow initiateMissionEnd to proceed
                this.missionEndInitiated = false;
                this.initiateMissionEnd(true);
            }
        } else {
            // Ambush failed - handle capture and casualties
//            console.log(`[Game] Ambush ${ambushType} FAILED! Handling consequences...`);
            this.handleAmbushDefeat(ambushType);
        }
    }

    /**
     * Handle ambush defeat - capture highest rank, kill others, fail mission
     * @param {string} ambushType - 'START' or 'EXTRACTION'
     */
    handleAmbushDefeat(ambushType) {
        // Combine deployed squad + rescued hostages for victim selection
        const allAvailable = [];
        
        // Add living deployed raccoons
        if (this.deployedSquadRoster) {
            this.deployedSquadRoster.forEach(r => {
                if (r.isAlive()) {
                    allAvailable.push({ raccoon: r, source: 'deployed' });
                }
            });
        }
        
        // Add rescued hostages
        if (this.hostageUnits) {
            this.hostageUnits.forEach(h => {
                if (h.isRescued && h.isAlive()) {
                    allAvailable.push({ raccoon: h, source: 'hostage' });
                }
            });
        }
        
        // Find highest rank
        const rankPriority = { 'Ghost': 5, 'Elite': 4, 'Sergeant': 3, 'Corporal': 2, 'Private': 1, 'Recruit': 0 };
        allAvailable.sort((a, b) => {
            const rankA = rankPriority[a.raccoon.rank] || 0;
            const rankB = rankPriority[b.raccoon.rank] || 0;
            return rankB - rankA;
        });
        
        if (allAvailable.length > 0) {
            // Highest rank is captured
            const captured = allAvailable[0];
            this.takenHostageRaccoonId = captured.raccoon.id;
//            console.log(`[Game] ${captured.raccoon.name} (${captured.raccoon.rank}) CAPTURED!`);
            
            // Remove captured from deployed squad
            if (captured.source === 'deployed') {
                // Mark as not alive (removed from squad)
                captured.raccoon.hp = 0;
            } else {
                // Mark rescued hostage as killed
                captured.raccoon.hp = 0;
            }
        }
        
        // All other deployed raccoons are KIA
        if (this.deployedSquadRoster) {
            this.deployedSquadRoster.forEach(r => {
                if (r.isAlive() && r.id !== this.takenHostageRaccoonId) {
                    r.hp = 0; // Kill them
                    this.fallenRaccoonsThisMission.push(r);
                }
            });
        }
        
        // All rescued hostages are KIA too
        if (this.hostageUnits) {
            this.hostageUnits.forEach(h => {
                if (h.isRescued && h.isAlive() && h.id !== this.takenHostageRaccoonId) {
                    h.hp = 0;
                }
            });
        }
        
        // Trigger mission failure directly - don't change to RUNNING music first
        this.initiateMissionEnd(false);
    }

    /**
     * Continue with normal mission flow (extraction phase)
     */
    continueAfterVideoOrAmbush() {
        // This is a stub - the actual continuation logic is now in finishMissionStart()
    }

    incrementObjectiveEnemyCount(count = 1) {
        if (this.currentMissionParams && this.currentMissionParams.objectives) {
            const exterminateObj = this.currentMissionParams.objectives.find(obj => obj.type === "EXTERMINATE");
            if (exterminateObj) {
                if (exterminateObj.totalToAchieve === undefined) {
                    exterminateObj.totalToAchieve = 0;
                }
                exterminateObj.totalToAchieve += count;
                if (this.ui && this.gameState === 'RUNNING') {
                    this.ui.updateObjective();
                }
            }
        }
    }

    handleLMBFireActionStart(worldX, worldY) {
        if (!this.selectedUnits || this.selectedUnits.length === 0) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAlive() && typeof unit._executeFire === 'function') {
                unit.isPlayerDirectFiring = true;
                unit.playerDirectFireTargetPos = { x: worldX, y: worldY };
                const angle = Math.atan2(worldY - unit.y, worldX - unit.x);
                unit._executeFire(worldX, worldY, angle);
            }
        });
    }

    updateLMBFireActionTarget(worldX, worldY) {
        if (!this.selectedUnits || this.selectedUnits.length === 0) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAlive() && unit.isPlayerDirectFiring) {
                unit.playerDirectFireTargetPos = { x: worldX, y: worldY };
            }
        });
    }

    handleLMBFireActionEnd() {
        if (!this.selectedUnits) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon) {
                unit.isPlayerDirectFiring = false;
            }
        });
        if (this.ui) this.ui.updateSquadPanel();
    }

    handleSetManualTargetCommand(enemyUnit) {
        if (!this.selectedUnits || this.selectedUnits.length === 0 || !enemyUnit || !enemyUnit.isAlive()) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAlive()) {
                unit.isPlayerDirectFiring = false;
                unit.setManualTarget(enemyUnit);
                if (unit.isHoldingFire) {
                }
            }
        });
        if (this.ui) this.ui.updateSquadPanel();
    }

    handleGrenadeThrowConfirm(worldX, worldY) {
        if (this.gameState !== 'RUNNING' || !this.selectedUnits || this.selectedUnits.length === 0) return;

        const aimingRaccoons = this.selectedUnits.filter(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
        if (aimingRaccoons.length > 0) {
            const leadAimer = aimingRaccoons[0];

            let clickedEnemy = null;
            if (this.enemyUnits) {
                for (const enemy of this.enemyUnits) {
                    if (enemy.isAlive() && distance(worldX, worldY, enemy.x, enemy.y) < enemy.size + 5) {
                        clickedEnemy = enemy;
                        break;
                    }
                }
            }

            if (distance(leadAimer.x, leadAimer.y, worldX, worldY) <= CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) {
                leadAimer.confirmThrowGrenade(worldX, worldY);
            } else if (clickedEnemy) {
                if (leadAimer.isHoldingPosition) {
                } else {
                    leadAimer.moveToGrenadeRange(clickedEnemy);
                }
            } else {
            }

            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
    }

    handleRightClickCommand(worldX, worldY) {
        if (this.gameState !== 'RUNNING') return;
        if (this.inputHandler.isLMBHoldFiringActionActive) { this.handleLMBFireActionEnd(); this.inputHandler.isLMBHoldFiringActionActive = false; }

        let didCancelGrenade = false;
        if (this.selectedUnits) this.selectedUnits.forEach(u => { if (u instanceof Raccoon && u.isAimingGrenade) { u.cancelGrenadeAim(); didCancelGrenade = true; } });
        if (didCancelGrenade) { if (this.inputHandler) this.inputHandler.updateMouseCursor(); return; }

        if (this.selectedUnits && this.selectedUnits.length > 0) {
            const formationPoints = this.calculateFormationPoints(worldX, worldY, this.selectedUnits, this.currentFormationType);
            this.selectedUnits.forEach((unit, index) => {
                if (unit.isAlive() && unit.team === 'player') {
                    const targetPoint = formationPoints[index] || { x: worldX, y: worldY };
                    unit.setMoveTarget(targetPoint.x, targetPoint.y);
                }
            });
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    handleAutoBackupCommand() {
        if (this.gameState !== 'RUNNING') return;

        // Teammates only (raccoons in squad)
        const allLivingTeammates = this.deployedSquadRoster ? this.deployedSquadRoster.filter(unit => unit.isAlive()) : [];
        if (allLivingTeammates.length === 0) return;

        // Currently selected teammates
        const selectedTeammates = this.selectedUnits ? this.selectedUnits.filter(u => u instanceof Raccoon && u.isAlive() && !(u instanceof RaccoonHostage)) : [];

        if (selectedTeammates.length === 0) {
            if (this.ui) this.ui.showToast("Select a squad member to call for backup", "info");
            return;
        }

        const nonSelectedTeammates = allLivingTeammates.filter(u => !selectedTeammates.includes(u));

        if (nonSelectedTeammates.length === 0) {
            if (this.ui) this.ui.showToast("All teammates are already with you", "info");
            return;
        }

        // Calculate centroid of selected teammates
        let sumX = 0, sumY = 0;
        selectedTeammates.forEach(u => { sumX += u.x; sumY += u.y; });
        const centerX = sumX / selectedTeammates.length;
        const centerY = sumY / selectedTeammates.length;

        // Calculate formation positions for non-selected teammates around the selection centroid
        const formationPoints = this.calculateFormationPoints(centerX, centerY, nonSelectedTeammates, this.currentFormationType);

        nonSelectedTeammates.forEach((unit, index) => {
            const targetPoint = formationPoints[index] || { x: centerX, y: centerY };
            unit.setMoveTarget(targetPoint.x, targetPoint.y);
        });

        if (this.ui) this.ui.showToast("Backup requested!", "info");
        if (this.audioManager) this.audioManager.play('UI_BUTTON_CLICK');
    }


    togglePause() {
        if (this.gameState === 'RUNNING') {
            this.previousGameState = this.gameState;
            this.gameState = 'PAUSED';
            this.isGamePausedManually = true;
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.ui) this.ui.showPauseMenuScreen();
            // Mute music when paused
            if (this.musicManager) {
                this.musicManager.onGameStateChange('PAUSED');
            }
        } else if (this.gameState === 'PAUSED' && this.isGamePausedManually) {
            this.gameState = this.previousGameState || 'RUNNING';
            this.isGamePausedManually = false;
            if (this.ui) this.ui.hidePauseMenuScreen();
            this.lastTime = performance.now();
            // Resume music when unpaused
            if (this.musicManager) {
                this.musicManager.resumeFromPause();
            }
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    toggleShootoutPause() {
        if (this.gameState === 'SHOOTOUT_PLAYING') {
            this.previousGameState = this.gameState;
            this.gameState = 'SHOOTOUT_PAUSED';
            if (this.ui) this.ui.showShootoutPauseMenuScreen();
            // Mute music when paused
            if (this.musicManager) {
                this.musicManager.onGameStateChange('PAUSED');
            }
        } else if (this.gameState === 'SHOOTOUT_PAUSED') {
            this.gameState = 'SHOOTOUT_PLAYING';
            if (this.ui) this.ui.hideShootoutPauseMenuScreen();
            this.lastTime = performance.now();
            // Resume music when unpaused
            if (this.musicManager) {
                this.musicManager.resumeFromPause();
            }
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    restartCurrentMission() {
        // --- MODIFICATION START ---
        if (this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA);
            return;
        }
        // --- MODIFICATION END ---
        if (this.currentMissionParams && this.getAvailableRecruits().length > 0) {
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.generateAndSetCurrentMissionParams(this.currentPhaseIndex, this.currentMissionIndex)) {
                const currentPhaseData = this.campaignStructure[this.currentPhaseIndex];
                if (this.ui && currentPhaseData && this.currentMissionParams) {
                    this.gameState = 'PRE_MISSION_SELECT';
                    // Continue menu music for pre-mission
                    if (this.musicManager) {
                        this.musicManager.onGameStateChange('PRE_MISSION_SELECT');
                    }
                    this.ui.hideHUD();
                    this.ui.showPreMissionScreen_RecruitSelect(currentPhaseData, this.currentMissionParams, this.getAvailableRecruits());
                } else {
                    this.quitToMainMenu();
                }
            } else {
                this.quitToMainMenu();
            }
        } else {
            this.quitToMainMenu();
        }
    }

    quitToMainMenu() {
        this.audioManager.stopAllLoopingSounds();
        if (this.musicManager) {
            this.musicManager.stopAll();
            this.musicManager.onGameStateChange('MAIN_MENU');
        }
        this.lastPlayedMusicKey = null;
        this.gameState = 'MAIN_MENU';
        this.missionStartedAndPopulated = false;
        this.isNightMission = false;
        if (this.inputHandler && this.inputHandler.isLMBHoldFiringActionActive) {
            this.handleLMBFireActionEnd();
            this.inputHandler.isLMBHoldFiringActionActive = false;
        }
        this.deployedSquadRoster = [];
        this.selectedUnits = [];
        this.enemyUnits = [];
        this.hostageUnits = [];
        this.gameObjects = [];
        this.visualEffects = [];
        this.lastDeployedSquadIds = [];
        if (this.ui) {
            this.ui.hideHUD();
            this.ui.hidePostMissionScreen();
            this.ui.hidePauseMenuScreen();
            this.ui.updateNightMissionBadge();
            this.ui.showMainMenuScreen();
        }
    }

    initializeNewCampaign(isNew = true) {
        this.audioManager.stopAllLoopingSounds();
        this.lastPlayedMusicKey = null;
        this.masterRoster = [];
        this.fallenRaccoonsGlobal = [];
        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.deployedSquadRoster = [];
        this.selectedUnits = [];
        this.tempSelectedForDeployment = [];
        this.hostageUnits = [];
        this.campaignStructure = [];
        this.lastDeployedSquadIds = [];

        // --- MODIFICATION START: Seed generation logic ---
        if (isNew || !this.campaignSeed) {
            // Generate a brand new seed for a new campaign, or if one doesn't exist yet.
            this.campaignSeed = Date.now();
//            console.log(`[Game] New campaign created with seed: ${this.campaignSeed}`);
        }
        // If isNew is false, we intentionally do nothing, reusing the existing this.campaignSeed.
        // --- MODIFICATION END ---

        this.campaignSeedRNG = new SeededRandom(this.campaignSeed);
        this.totalCampaignPhases = this.campaignSeedRNG.nextInt(
            this.campaignRules.CAMPAIGN_LENGTH_PHASES_RANGE[0],
            this.campaignRules.CAMPAIGN_LENGTH_PHASES_RANGE[1]
        );
        this._generatePhaseStructure(0);

        const availableFaceImages = CONFIG.RACCOON_FACE_IMAGES ? [...CONFIG.RACCOON_FACE_IMAGES] : [];
        let nextRaccoonIdNum = 1;
        const initialSize = CONFIG.INITIAL_ROSTER_SIZE || 0;
        let currentLivingNames = [];
        const initialRosterRng = new SeededRandom(this.campaignSeed + 1);

        for (let i = 0; i < initialSize; i++) {
            let faceImageFile = 'default_face.png';
            if (availableFaceImages.length > 0) {
                const randomIndex = initialRosterRng.nextInt(0, availableFaceImages.length - 1);
                faceImageFile = availableFaceImages.splice(randomIndex, 1)[0];
            } else if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
                faceImageFile = initialRosterRng.pickFrom(CONFIG.RACCOON_FACE_IMAGES);
            }
            const faceImageUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
            const raccoonName = getRandomRaccoonName(currentLivingNames, initialRosterRng);
            currentLivingNames.push(raccoonName);
            const newRecruit = new Raccoon(0, 0, this, `RCN-MR${nextRaccoonIdNum++}`, faceImageUrl, raccoonName);
            this.masterRoster.push(newRecruit);
        }
        if (this.ui) {
            this.ui.hideHUD(); this.ui.hidePostMissionScreen(); this.ui.hideGameOverScreen(); this.ui.hideRecruitMemorialScreen();
        }
    }

    _generatePhaseStructure(phaseIdx) {
        if (this.campaignStructure[phaseIdx]) return;

        const phaseSeed = this.campaignSeed + (phaseIdx * 1000);
        this.currentPhaseSeedRNG = new SeededRandom(phaseSeed);

        const phaseRules = this.campaignRules.PHASE_GENERATION;
        const availableBiomes = this.campaignRules.BIOME_POOL.filter(b => b.unlocksPhase <= phaseIdx);
        if (availableBiomes.length === 0) {
            this.campaignStructure[phaseIdx] = {
                phaseNum: phaseIdx, name: `Phase ${phaseIdx + 1} (Biome Error)`, biome: this.campaignRules.BIOME_POOL[0].name,
                biomeDescription: this.campaignRules.BIOME_POOL[0].description,
                introduction: "Error: Could not determine biome for this phase.", conclusion: "",
                missionsInPhase: 3
            };
            return;
        }
        const selectedBiomeEntry = this._weightedRandomSelect(availableBiomes, this.currentPhaseSeedRNG);

        const phaseNamePrefix = this.currentPhaseSeedRNG.pickFrom(phaseRules.NAME_PARTS.PREFIXES);
        const phaseNameTheme = this.currentPhaseSeedRNG.pickFrom(selectedBiomeEntry.themeAdjectives || ["Mystery"]);
        const phaseNameDescriptor = this.currentPhaseSeedRNG.pickFrom(phaseRules.NAME_PARTS.DESCRIPTORS);
        const phaseName = `${phaseNamePrefix} ${phaseNameTheme} ${phaseNameDescriptor}`;

        const phaseObjectiveSummary = this.currentPhaseSeedRNG.pickFrom(phaseRules.OBJECTIVE_SUMMARIES_POOL);
        const introTemplate = this.currentPhaseSeedRNG.pickFrom(phaseRules.INTRODUCTION_TEMPLATES);
        const phaseIntro = this._fillTextTemplate(introTemplate, {
            phaseNum: phaseIdx + 1,
            phaseName: phaseName,
            biomeDescription: selectedBiomeEntry.description,
            phaseObjectiveSummary: phaseObjectiveSummary
        });

        const mppRule = phaseRules.missionsPerPhase;
        const minMissions = Math.round(mppRule.baseRange[0] + (mppRule.incrementPerPhase * phaseIdx));
        const maxMissions = Math.round(mppRule.baseRange[1] + (mppRule.incrementPerPhase * phaseIdx));

        const finalMinMissions = Math.min(minMissions, mppRule.maxRange[0]);
        const finalMaxMissions = Math.min(maxMissions, mppRule.maxRange[1]);

        const numMissions = this.currentPhaseSeedRNG.nextInt(finalMinMissions, finalMaxMissions);

        this.campaignStructure[phaseIdx] = {
            phaseNum: phaseIdx,
            name: phaseName,
            biome: selectedBiomeEntry.name,
            biomeDescription: selectedBiomeEntry.description,
            introduction: phaseIntro,
            conclusion: "",
            missionsInPhase: numMissions
        };
    }

    getAvailableRecruits() {
        return this.masterRoster.filter(r => {
            // Handle both Raccoon instances (with isAlive method) and plain data objects
            if (typeof r.isAlive === 'function') {
                return r.isAlive();
            }
            // For plain data objects, check hp or isDead flag
            return !r.isDead && (r.hp === undefined || r.hp > 0);
        }).sort((a, b) => {
            const xpA = a.xp || 0;
            const xpB = b.xp || 0;
            return xpB - xpA;
        });
    }

    resizeCanvas() {
        if (!this.canvasContainer) this.canvasContainer = document.getElementById('canvas-container');
        if (!this.canvasContainer) return;
        const containerWidth = this.canvasContainer.offsetWidth; const containerHeight = this.canvasContainer.offsetHeight;
        this.canvas.width = Math.max(CONFIG.MIN_CANVAS_WIDTH || 800, containerWidth);
        this.canvas.height = Math.max(CONFIG.MIN_CANVAS_HEIGHT || 600, containerHeight);
        if (this.gameState === 'RUNNING') this.clampCamera();
    }

    clampCamera() {
        const worldWidth = CONFIG.WORLD_WIDTH || 0;
        const worldHeight = CONFIG.WORLD_HEIGHT || 0;
        const canvasWidth = this.canvas.width || 0;
        const canvasHeight = this.canvas.height || 0;
        const zoom = this.cameraZoom || 1.0;

        // When zoomed in, the visible viewport is smaller, so adjust max camera bounds
        const visibleWidth = canvasWidth / zoom;
        const visibleHeight = canvasHeight / zoom;

        const maxX = Math.max(0, worldWidth - visibleWidth);
        const maxY = Math.max(0, worldHeight - visibleHeight);

        this.cameraX = Math.max(0, Math.min(this.cameraX, maxX));
        this.cameraY = Math.max(0, Math.min(this.cameraY, maxY));
    }

    _instantiateObjective(objDef, phaseIdx, isPrimary, forceSpecificTargetKey = null) {
        const baseP = this.currentMissionParams.baseParams;
        const newObj = {
            type: objDef.type,
            id: `${objDef.type.toLowerCase()}_${this.currentMissionSeedRNG.nextInt(100, 999)}`,
            descriptionTemplateKey: objDef.descriptionTemplateKey,
            completionCondition: objDef.completionCondition,
            isPrimary: isPrimary,
            isComplete: false,
            currentProgress: 0,
            totalToAchieve: 0,
            statusText: "",
            extractionZoneRevealed: false
        };

        if (objDef.type === "DESTROY_TARGET") {
            const availableTargetTypes = (this.campaignRules.DESTROY_TARGET_TYPE_POOL || []).filter(t => t.unlocksPhase <= phaseIdx);
            if (availableTargetTypes.length === 0) {
//                console.warn(`[Game] No available DESTROY_TARGET types for phase ${phaseIdx}.`);
                return null;
            }
            const selectedTargetType = this._weightedRandomSelect(availableTargetTypes, this.currentMissionSeedRNG);
            if (!selectedTargetType) {
//                console.warn(`[Game] Failed to select a DESTROY_TARGET type for phase ${phaseIdx}.`);
                return null;
            }
            newObj.targetTypeKeyPrefix = selectedTargetType.targetTypeKeyPrefix;
            newObj.targetNameSingular = selectedTargetType.nameSingular;
            newObj.targetNamePlural = selectedTargetType.namePlural;
            newObj.totalToAchieve = Math.max(1, Math.round(baseP.numDestroyTargets));
        } else if (objDef.type === "RESCUE_HOSTAGES") {
            newObj.totalToAchieve = Math.max(1, Math.round(baseP.numHostagesToSpawn));
            newObj.minToAchieveForCompletion = Math.max(1, Math.round(baseP.minHostagesToRescue));
            if (newObj.minToAchieveForCompletion > newObj.totalToAchieve) { // Sanity check
                newObj.minToAchieveForCompletion = newObj.totalToAchieve;
            }
            newObj.currentEvacuated = 0;
        } else if (objDef.type === "EXTERMINATE") {
            newObj.totalToAchieve = 0;
        } else if (objDef.type === "ASSASSINATION") {
            let selectedTargetInfo = null;
            if (forceSpecificTargetKey) {
                selectedTargetInfo = (this.campaignRules.ASSASSINATION_TARGET_POOL || []).find(t => t.assassinationTypeKey === forceSpecificTargetKey && t.unlocksPhase <= phaseIdx);
                if (!selectedTargetInfo) {
//                    console.warn(`[Game] Forced assassination targetKey '${forceSpecificTargetKey}' not found or not unlocked for phase ${phaseIdx}.`);
                }
            }

            if (!selectedTargetInfo) {
                const availableTargets = (this.campaignRules.ASSASSINATION_TARGET_POOL || []).filter(t => t.unlocksPhase <= phaseIdx);
                if (availableTargets.length === 0) {
//                    console.warn(`[Game] No available assassination targets for phase ${phaseIdx}. Assassination objective cannot be created.`);
                    return null;
                }
                selectedTargetInfo = this._weightedRandomSelect(availableTargets, this.currentMissionSeedRNG);
            }

            if (!selectedTargetInfo) {
//                console.warn("[Game] Failed to select an assassination target. Assassination objective cannot be created.");
                return null;
            }

            newObj.targetDetails = JSON.parse(JSON.stringify(selectedTargetInfo)); // Store a copy of target details
            newObj.targetUnitId = null;
            newObj.totalToAchieve = 1;
            newObj.currentProgress = 0;
        }
        return newObj;
    }

    _getObjectiveDescriptionForBriefing(objectiveInstance, baseParams) {
        let desc = `Objective type ${objectiveInstance.type} not fully described.`;
        const uiTextStrings = CONFIG.UI_TEXT_STRINGS;
        const templateKey = objectiveInstance.descriptionTemplateKey;

        if (templateKey && uiTextStrings[templateKey]) {
            let textToFormat = uiTextStrings[templateKey];

            if (objectiveInstance.type === "ASSASSINATION" && objectiveInstance.targetDetails) {
                desc = `neutralize high-value target: ${objectiveInstance.targetDetails.callsign || objectiveInstance.targetDetails.name || "VIP"}`;
            } else {
                desc = textToFormat.split(':')[0].trim();
                const templateData = {
                    TARGET_NAME_PLURAL: objectiveInstance.targetNamePlural || "targets",
                    TARGET_NAME_SINGULAR: objectiveInstance.targetNameSingular || "target",
                    TOTAL_SPAWNED: objectiveInstance.totalToAchieve,
                    MIN_TO_EVAC: objectiveInstance.minToAchieveForCompletion
                };
                desc = this._fillTextTemplate(desc, templateData);

                if (objectiveInstance.type === "DESTROY_TARGET" && objectiveInstance.totalToAchieve > 0) {
                    desc += ` (${objectiveInstance.totalToAchieve})`;
                } else if (objectiveInstance.type === "RESCUE_HOSTAGES") {
                    desc += ` (${objectiveInstance.totalToAchieve} to find, min ${objectiveInstance.minToAchieveForCompletion} to evac)`;
                }
            }

        } else if (objectiveInstance.type === "EXTERMINATE") {
            desc = "eliminate all Possums";
        }
        return desc;
    }

    generateAndSetCurrentMissionParams(phaseIdx, missionIdx) {
        const missionSpecificSeedValue = this.campaignSeed + (phaseIdx * 1000) + (missionIdx * 10);
//        console.log(`[Game] Generating mission P${phaseIdx}M${missionIdx} with seed: ${missionSpecificSeedValue} (campaignSeed: ${this.campaignSeed})`);
        this.currentMissionSeedRNG = new SeededRandom(missionSpecificSeedValue);
        this.currentMissionSeed = missionSpecificSeedValue;

        if (!this.campaignStructure[phaseIdx]) {
            this._generatePhaseStructure(phaseIdx);
        }
        const currentPhaseInfo = this.campaignStructure[phaseIdx];
        if (!currentPhaseInfo) { this.currentMissionParams = null; return false; }

        this.currentMissionParams = { baseParams: {}, objectives: [] };
        const baseP = this.currentMissionParams.baseParams;
        const objectivesArray = this.currentMissionParams.objectives;
        const baseParamsRules = this.campaignRules.BASE_PARAMETERS;
        const briefingParts = this.campaignRules.BRIEFING_PARTS;

        // --- MODIFICATION START ---
        for (const key in baseParamsRules) {
            const rule = baseParamsRules[key];
            let value;

            if (key === "numPrimaryObjectivesRange" || key === "numSecondaryObjectives") {
                value = rule;
            } else {
                // Check for unlock phase. If not unlocked, use the initial value (or 0 for chances).
                if (rule.unlocksPhase !== undefined && phaseIdx < rule.unlocksPhase) {
                    if (key.toLowerCase().includes('chance')) {
                        value = 0; // If a "chance" is not unlocked, it's 0.
                    } else {
                        value = rule.initial; // Otherwise, use its initial value.
                    }
                } else {
                    // It's unlocked, so calculate the scaled value.
                    if (rule.perPhaseGrowthFactor) {
                        // Apply compound growth for factors
                        value = rule.initial * Math.pow(1 + rule.perPhaseGrowthFactor, phaseIdx);
                    } else if (rule.perPhaseIncrement) {
                        // Apply linear increment for increments
                        value = rule.initial + (rule.perPhaseIncrement * phaseIdx);
                    } else {
                        value = rule.initial;
                    }
                }

                if (rule.max !== undefined) value = Math.min(value, rule.max);

                let randomnessRange = value * (rule.randomnessFactor || 0);
                value += this.currentMissionSeedRNG.nextFloat(-randomnessRange, randomnessRange);

                // Re-clamp after applying randomness
                if (rule.max !== undefined) value = Math.min(value, rule.max);
                if (rule.roundToInt) value = Math.round(value);

                // Final sanity check for non-negative values where it matters
                if (key.toLowerCase().includes('num') || key.toLowerCase().includes('min') || key.toLowerCase().includes('chance')) {
                    value = Math.max(0, value);
                }
            }
            baseP[key] = value;
        }
        // --- MODIFICATION END ---

        const numPrimariesToSelect = this.currentMissionSeedRNG.nextInt(
            baseP.numPrimaryObjectivesRange[0],
            baseP.numPrimaryObjectivesRange[1]
        );

        const secObjRule = baseP.numSecondaryObjectives;
        const minSec = Math.round(secObjRule.baseRange[0] + (secObjRule.incrementPerPhase * phaseIdx));
        const maxSec = Math.round(secObjRule.baseRange[1] + (secObjRule.incrementPerPhase * phaseIdx));

        const finalMinSec = Math.min(minSec, secObjRule.maxRange[0]);
        const finalMaxSec = Math.min(maxSec, secObjRule.maxRange[1]);

        const numSecondariesToSelect = this.currentMissionSeedRNG.nextInt(finalMinSec, finalMaxSec);

       // console.log(`[Game Gen] P${phaseIdx}M${missionIdx}: Selecting ${numPrimariesToSelect} Primaries, ${numSecondariesToSelect} Secondaries.`);

        const selectedObjectiveTypesThisMission = new Set();

        const isPhaseFinale = (missionIdx === currentPhaseInfo.missionsInPhase - 1);
        for (let i = 0; i < numPrimariesToSelect; i++) {
            let newPrimaryObjective = null;
            if (isPhaseFinale && i === 0) {
                const assassinationObjDefSource = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "ASSASSINATION" && o.isPhaseFinaleCandidate);
                if (assassinationObjDefSource && assassinationObjDefSource.unlocksPhase <= phaseIdx) {
                    const availableBosses = (this.campaignRules.ASSASSINATION_TARGET_POOL || [])
                        .filter(t => t.isBoss && t.unlocksPhase <= phaseIdx);
                    let bossToSpawnKey = null;
                    if (availableBosses.length > 0) {
                        const chosenBossInfo = this._weightedRandomSelect(availableBosses, this.currentMissionSeedRNG);
                        if (chosenBossInfo) bossToSpawnKey = chosenBossInfo.assassinationTypeKey;
                    }
                    if (bossToSpawnKey) {
                        const assassinationObjDefInstance = JSON.parse(JSON.stringify(assassinationObjDefSource));
                        newPrimaryObjective = this._instantiateObjective(assassinationObjDefInstance, phaseIdx, true, bossToSpawnKey);
                        if (newPrimaryObjective) console.log(`[Game Gen] Phase Finale Primary: ASSASSINATION (${bossToSpawnKey})`);
                        else console.warn(`[Game Gen] Phase Finale: Failed to instantiate ASSASSINATION for ${bossToSpawnKey}`);
                    } else { console.warn(`[Game Gen] Phase Finale: No BOSS target found for P${phaseIdx}.`); }
                } else { console.warn(`[Game Gen] Phase Finale: ASSASSINATION obj def not found/unlocked for P${phaseIdx}.`); }
            }

            if (!newPrimaryObjective) {
                const availablePrimaries = this.campaignRules.OBJECTIVE_POOL.filter(o =>
                    (o.isPrimary === undefined || o.isPrimary) &&
                    o.unlocksPhase <= phaseIdx &&
                    !selectedObjectiveTypesThisMission.has(o.type) &&
                    !(isPhaseFinale && o.type === "ASSASSINATION" && o.isPhaseFinaleCandidate)
                );
                if (availablePrimaries.length > 0) {
                    const chosenPrimaryDef = this._weightedRandomSelect(availablePrimaries, this.currentMissionSeedRNG);
                    if (chosenPrimaryDef) {
                        newPrimaryObjective = this._instantiateObjective(chosenPrimaryDef, phaseIdx, true);
                        if (newPrimaryObjective) console.log(`[Game Gen] Random Primary: ${newPrimaryObjective.type}`);
                        else console.warn(`[Game Gen] Failed to instantiate random primary: ${chosenPrimaryDef.type}`);
                    }
                }
            }

            if (newPrimaryObjective) {
                objectivesArray.push(newPrimaryObjective);
                selectedObjectiveTypesThisMission.add(newPrimaryObjective.type);
            } else if (i === 0) {
//                console.warn("[Game Gen] CRITICAL: Failed to select any primary objective. Defaulting to EXTERMINATE.");
                const exterminateDef = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTERMINATE");
                if (exterminateDef) {
                    const fallbackPrimary = this._instantiateObjective(exterminateDef, phaseIdx, true);
                    if (fallbackPrimary) {
                        objectivesArray.push(fallbackPrimary);
                        selectedObjectiveTypesThisMission.add(fallbackPrimary.type);
                    } else { console.error("[Game Gen] CRITICAL: Fallback EXTERMINATE also failed!"); }
                } else { console.error("[Game Gen] CRITICAL: No EXTERMINATE definition for fallback!"); }
                break;
            }
        }

        const primaryObjectiveTypes = new Set(objectivesArray.filter(o => o.isPrimary).map(o => o.type));
        for (let i = 0; i < numSecondariesToSelect; i++) {
            const availableSecondaries = this.campaignRules.OBJECTIVE_POOL.filter(o => {
                if (o.unlocksPhase > phaseIdx) return false;
                if (selectedObjectiveTypesThisMission.has(o.type) && (o.maxInstancesPerMission || 1) <= objectivesArray.filter(obj => obj.type === o.type).length) return false;

                let canCoexist = true;
                if (o.canCoexistWith) {
                    for (const primaryType of primaryObjectiveTypes) {
                        if (!o.canCoexistWith.includes(primaryType)) {
                            canCoexist = false; break;
                        }
                    }
                }
                if (!canCoexist) return false;

                for (const primaryObj of objectivesArray) {
                    if (primaryObj.isPrimary) {
                        const primaryDef = this.campaignRules.OBJECTIVE_POOL.find(def => def.type === primaryObj.type);
                        if (primaryDef && primaryDef.canCoexistWith && !primaryDef.canCoexistWith.includes(o.type)) {
                            return false;
                        }
                    }
                }
                return true;
            });

            if (availableSecondaries.length > 0) {
                const chosenSecondaryDef = this._weightedRandomSelect(availableSecondaries, this.currentMissionSeedRNG);
                if (chosenSecondaryDef) {
                    const newSecondaryObjective = this._instantiateObjective(chosenSecondaryDef, phaseIdx, false);
                    if (newSecondaryObjective) {
                        objectivesArray.push(newSecondaryObjective);
                        selectedObjectiveTypesThisMission.add(newSecondaryObjective.type);
                    } else {
//                        console.warn(`[Game Gen] Failed to instantiate secondary: ${chosenSecondaryDef.type}`);
                    }
                }
            } else {
//                console.log("[Game Gen] No more compatible secondary objectives to select.");
                break;
            }
        }

        const exterminateObjectiveExists = objectivesArray.some(obj => obj.type === "EXTERMINATE");
        if (!exterminateObjectiveExists) {
//            console.log("[Game Gen] 'Exterminate' not selected. Forcing as a secondary objective.");
            const exterminateDef = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTERMINATE");
            if (exterminateDef) {
                const fallbackExterminate = this._instantiateObjective(exterminateDef, phaseIdx, false);
                if (fallbackExterminate) {
                    objectivesArray.push(fallbackExterminate);
                } else {
//                    console.error("[Game Gen] CRITICAL: Fallback EXTERMINATE instantiation failed!");
                }
            } else {
//                console.error("[Game Gen] CRITICAL: Could not find EXTERMINATE definition for fallback!");
            }
        }

        if (objectivesArray.length === 0) {
//            console.warn("[Game Gen] No objectives selected at all. Adding default EXTERMINATE.");
            const exterminateDef = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTERMINATE");
            if (exterminateDef) {
                const fallbackExterminate = this._instantiateObjective(exterminateDef, phaseIdx, true);
                if (fallbackExterminate) objectivesArray.push(fallbackExterminate);
            }
        }

        // For phase finales, add EXTRACTION objective if not already present
        if (isPhaseFinale) {
            const hasExtractionObj = objectivesArray.some(o => o.type === 'EXTRACTION');
            if (!hasExtractionObj) {
                const extractionObjDef = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTRACTION");
                if (extractionObjDef) {
                    const extractionObj = this._instantiateObjective(JSON.parse(JSON.stringify(extractionObjDef)), phaseIdx, false);
                    if (extractionObj) {
                        objectivesArray.push(extractionObj);
//                        console.log("[Game Gen] Phase Finale: Added EXTRACTION objective.");
                    }
                }
            }
        }

        const phaseBiome = currentPhaseInfo.biome;
        const missionNameParts = this.campaignRules.MISSION_NAME_PARTS;
        const biomeEntryForName = this.campaignRules.BIOME_POOL.find(b => b.name === phaseBiome) || { themeAdjectives: ["General"] };
        const biomeThemeAdj = biomeEntryForName.themeAdjectives;

        let mNamePart1 = this.currentMissionSeedRNG.pickFrom(missionNameParts.ADJECTIVES);
        let mNamePart2 = this.currentMissionSeedRNG.pickFrom(biomeThemeAdj);
        let mNamePart3 = this.currentMissionSeedRNG.pickFrom(missionNameParts.NOUNS_GENERAL);
        if (this.currentMissionSeedRNG.chance(0.3)) {
            mNamePart2 = this.currentMissionSeedRNG.pickFrom(missionNameParts.LOCATIONS_GENERAL);
        }
        baseP.name = `${mNamePart1} ${mNamePart2} ${mNamePart3}`;

        let combinedObjectiveDescription = "";
        if (objectivesArray.length > 0) {
            const primaryObjInstanceToDescribe = objectivesArray.find(obj => obj.isPrimary);
            if (primaryObjInstanceToDescribe) {
                combinedObjectiveDescription = this._getObjectiveDescriptionForBriefing(primaryObjInstanceToDescribe, baseP) + ".";
            }
            objectivesArray.forEach(obj => {
                if (!obj.isPrimary) {
                    if (primaryObjInstanceToDescribe && obj.type === primaryObjInstanceToDescribe.type && obj.type !== "DESTROY_TARGET") return;
                    if (primaryObjInstanceToDescribe && obj.type === "DESTROY_TARGET" && primaryObjInstanceToDescribe.type === "DESTROY_TARGET" && obj.targetTypeKeyPrefix === primaryObjInstanceToDescribe.targetTypeKeyPrefix) return;

                    combinedObjectiveDescription += " Additionally, " + this._getObjectiveDescriptionForBriefing(obj, baseP).toLowerCase() + ".";
                }
            });
        } else {
            combinedObjectiveDescription = "secure the area";
        }

        const briefingTemplate = this.currentMissionSeedRNG.pickFrom(this.campaignRules.MISSION_BRIEFING_TEMPLATES);
        const biomeAdjForBriefing = this.currentMissionSeedRNG.pickFrom(briefingParts.BIOME_ADJECTIVES[phaseBiome] || briefingParts.BIOME_ADJECTIVES["FOREST"] || ["unknown"]);
        const locationNounForBriefing = this.currentMissionSeedRNG.pickFrom(briefingParts.LOCATION_NOUNS[phaseBiome] || briefingParts.LOCATION_NOUNS["FOREST"] || ["the area"]);

        baseP.briefing = this._fillTextTemplate(briefingTemplate, {
            missionName: baseP.name,
            biomeAdjective: biomeAdjForBriefing,
            biomeNoun: currentPhaseInfo.biomeDescription,
            locationNoun: locationNounForBriefing,
            enemyAdjective: this.currentMissionSeedRNG.pickFrom(briefingParts.ENEMY_ADJECTIVES),
            enemyCompositionHint: this.currentMissionSeedRNG.pickFrom(briefingParts.ENEMY_COMPOSITION_HINTS),
            objectiveDescription: combinedObjectiveDescription.trim(),
        });
        baseP.biome = phaseBiome;

        // --- Night Mission Roll ---
        const nightCfg = CONFIG.NIGHT_MISSION;
        const nightUnlocked = nightCfg && phaseIdx >= (nightCfg.UNLOCKS_PHASE !== undefined ? nightCfg.UNLOCKS_PHASE : 1);
        baseP.isNightMission = nightUnlocked && this.currentMissionSeedRNG.chance(nightCfg.CHANCE || 0.3);

        if (baseP.isNightMission && this.campaignRules.BRIEFING_PARTS.NIGHT_BRIEFING_PREFIXES) {
            const prefix = this.currentMissionSeedRNG.pickFrom(this.campaignRules.BRIEFING_PARTS.NIGHT_BRIEFING_PREFIXES);
            const suffix = this.currentMissionSeedRNG.pickFrom(this.campaignRules.BRIEFING_PARTS.NIGHT_BRIEFING_SUFFIXES);
            baseP.briefing = `${prefix} ${baseP.briefing} ${suffix}`;
            if (CONFIG.DEBUG_LOGGING) console.log('[Game Gen] Night mission selected for this mission.');
        }

        // --- Phase Finale Extraction Note ---
        if (isPhaseFinale) {
            const extractionNote = " Once all objectives are complete, proceed to the extraction zone for evac.";
            baseP.briefing += extractionNote;
            if (CONFIG.DEBUG_LOGGING) console.log('[Game Gen] Phase Finale: Added extraction note to briefing.');
        }

        this.tempSelectedForDeployment = [];
        
        // --- Check for taken hostage from failed ambush ---
        if (this.takenHostageRaccoonId) {
            // Find the captured raccoon's name
            const takenRaccoon = this.masterRoster.find(r => r.id === this.takenHostageRaccoonId);
            const takenRaccoonName = takenRaccoon ? takenRaccoon.name : 'Unknown';
            
            // Add RESCUE_TAKEN_HOSTAGE as a primary objective
            const rescueTakenObjective = {
                type: 'RESCUE_TAKEN_HOSTAGE',
                targetRaccoonId: this.takenHostageRaccoonId,
                targetRaccoonName: takenRaccoonName,
                isPrimary: true,
                totalToAchieve: 1,
                minToAchieveForCompletion: 1,
                description: `Rescue ${takenRaccoonName} from captivity`
            };
            
            objectivesArray.push(rescueTakenObjective);
//            console.log(`[Game Gen] Added RESCUE_TAKEN_HOSTAGE objective for ${takenRaccoonName}`);
            
            // Clear the taken hostage ID since it's now an objective
            this.takenHostageRaccoonId = null;
        }
        
        return true;
    }


    recordRaccoonFallen(raccoon) {
        if (raccoon && raccoon.team === 'player') {
            if (!this.fallenRaccoonsThisMission.find(r => r.id === raccoon.id)) {
                this.fallenRaccoonsThisMission.push({ id: raccoon.id, name: raccoon.name, rank: raccoon.rank, faceImageUrl: raccoon.faceImageUrl });
            }
            if (!this.fallenRaccoonsGlobal.find(r => r.id === raccoon.id)) {
                const phaseName = (this.campaignStructure[this.currentPhaseIndex])
                    ? this.campaignStructure[this.currentPhaseIndex].name
                    : CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT;
                this.fallenRaccoonsGlobal.push({
                    id: raccoon.id, name: raccoon.name, rank: raccoon.rank, faceImageUrl: raccoon.faceImageUrl,
                    missionDied: this.currentMissionParams.baseParams ? this.currentMissionParams.baseParams.name : (CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT),
                    phaseDied: phaseName
                });
            }
            if (this.ui) this.ui.updateSquadPanel();
        }
    }

    addNewRecruitToMasterRoster() {
        const currentLivingNames = this.masterRoster.filter(r => r.isAlive()).map(r => r.name);
        let faceImageFile = 'default_face.png';
        const rosterRng = this.campaignSeedRNG || new SeededRandom(Date.now());

        if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
            const livingFaceUrls = this.masterRoster.filter(r => r.isAlive()).map(r => r.faceImageUrl);
            let attempts = 0; const maxFaceAttempts = CONFIG.RACCOON_FACE_IMAGES.length * 2 + 5;
            do {
                faceImageFile = rosterRng.pickFrom(CONFIG.RACCOON_FACE_IMAGES);
                const potentialUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                if (!livingFaceUrls.includes(potentialUrl) || livingFaceUrls.length >= CONFIG.RACCOON_FACE_IMAGES.length) break;
                attempts++;
            } while (attempts < maxFaceAttempts);
        }
        const faceImageUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
        const raccoonName = getRandomRaccoonName(currentLivingNames, rosterRng);
        currentLivingNames.push(raccoonName);
        const newRecruitId = `RCN-MR${this.masterRoster.length + this.fallenRaccoonsGlobal.length + 1}-${rosterRng.nextInt(1000, 9999)}`;
        this.masterRoster.push(new Raccoon(0, 0, this, newRecruitId, faceImageUrl, raccoonName));
    }

    initiateMissionEnd(isVictory) {
        if (this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT' || this.gameState === 'POST_MISSION_DEBRIEF') {
            return;
        }
        
        if (this.missionEndInitiated) {
            return;
        }
        this.missionEndInitiated = true;
        
        if (this.inputHandler.isLMBHoldFiringActionActive) {
            this.handleLMBFireActionEnd();
            this.inputHandler.isLMBHoldFiringActionActive = false;
        }

        this.missionPendingOutcomeIsVictory = isVictory;
        this.missionEndDelayTimer = this.MISSION_END_DELAY_SECONDS;
        this.gameState = isVictory ? 'MISSION_ENDING_VICTORY' : 'MISSION_ENDING_DEFEAT';
        
        // Notify music manager to play victory/defeat music
        if (this.musicManager) {
            this.musicManager.onGameStateChange(this.gameState);
        }
        
        if (isVictory) {
            this.missionEndMessage = CONFIG.UI_TEXT_STRINGS.POST_MISSION_SUCCESS || "MISSION SUCCESSFUL!";
        } else {
            this.missionEndMessage = CONFIG.UI_TEXT_STRINGS.POST_MISSION_FAILED || "MISSION FAILED!";
        }
    }

    actuallyEndMission(isVictory) {
        // --- MODIFICATION START ---
        // This is the primary check for the "total loss" condition.
        if (!isVictory && this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            this.missionEndMessage = CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA; // Store message for UI
            if (this.ui) {
                this.ui.hideHUD();
                this.ui.showGameOverScreen(this.missionEndMessage);
            }
            return; // Exit here to prevent showing the normal debrief screen.
        }
        // --- MODIFICATION END ---

        if (this.inputHandler.isLMBHoldFiringActionActive) {
            this.handleLMBFireActionEnd();
            this.inputHandler.isLMBHoldFiringActionActive = false;
        }
        this.deployedSquadRoster.forEach(unit => {
            if (unit instanceof Raccoon) {
                unit.isPlayerDirectFiring = false;
            }
        });

        // Don't stop the music - keep playing victory/defeat track
        // this.audioManager.stopAllLoopingSounds();
        // this.lastPlayedMusicKey = null;
        this.gameState = 'POST_MISSION_DEBRIEF';
        
        // Auto-save campaign progress after mission ends
        SaveManager.autoSave(this);
        
        this.missionEndMessage = "";
        const missionDuration = (performance.now() - this.missionStartTime) / 1000;
        let enemiesKilledThisMission = this.enemyUnits ? this.enemyUnits.filter(e => !e.isAlive()).length : 0;

        if (isVictory) {
            const survivalXp = CONFIG.XP_PER_MISSION_SURVIVED || 0;
            if (survivalXp > 0 && this.deployedSquadRoster) {
                this.deployedSquadRoster.forEach(r => { if (r.isAlive()) r.addXp(survivalXp); });
            }
            // Ambush survival bonus XP
            const ambushXpBonus = CONFIG.XP_PER_AMBUSH_SURVIVED || 100;
            if (this.ambushesSurvivedThisMission.length > 0 && this.deployedSquadRoster) {
                const totalAmbushXp = ambushXpBonus * this.ambushesSurvivedThisMission.length;
                this.deployedSquadRoster.forEach(r => { if (r.isAlive()) r.addXp(totalAmbushXp); });
//                console.log(`[Game] Ambush survival bonus: +${totalAmbushXp} XP (${this.ambushesSurvivedThisMission.length} ambush(es))`);
            }
            const recruitsToAdd = CONFIG.NEW_RECRUITS_PER_MISSION_WIN || 0;
            const maxRoster = CONFIG.MAX_TOTAL_ROSTER_SIZE || Infinity;
            for (let i = 0; i < recruitsToAdd && this.masterRoster.length < maxRoster; i++) this.addNewRecruitToMasterRoster();
        }

        let newlyRecruitedRaccoons = [];
        const rescueObjective = this.currentMissionParams.objectives.find(obj => obj.type === 'RESCUE_HOSTAGES');
        if (isVictory && rescueObjective) {
            if (this.hostageUnits) {
                this.hostageUnits.forEach(hostage => {
                    if (hostage.isAlive() && hostage.isRescued) {
                        const currentRosterNames = this.masterRoster.map(r => r.name);
                        let faceImageFile = 'default_face.png';
                        const availableFaceImages = CONFIG.RACCOON_FACE_IMAGES ? [...CONFIG.RACCOON_FACE_IMAGES] : [];
                        let chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                        const rosterRng = this.campaignSeedRNG || new SeededRandom(Date.now());

                        if (availableFaceImages.length > 0) {
                            let attempts = 0;
                            const maxFaceAttempts = availableFaceImages.length * 2 + 5;
                            const existingFaceUrls = this.masterRoster.map(r => r.faceImageUrl);
                            do {
                                faceImageFile = rosterRng.pickFrom(availableFaceImages);
                                chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                                if (!existingFaceUrls.includes(chosenFaceUrl) || existingFaceUrls.length >= availableFaceImages.length) break;
                                attempts++;
                            } while (attempts < maxFaceAttempts);
                        } else if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
                            faceImageFile = rosterRng.pickFrom(CONFIG.RACCOON_FACE_IMAGES);
                            chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                        }

                        const newName = getRandomRaccoonName(currentRosterNames, rosterRng);
                        const newRecruit = new Raccoon(0, 0, this, `RCN-RES-${rosterRng.nextInt(1000, 9999)}-${this.masterRoster.length}`, chosenFaceUrl, newName);
                        newRecruit.rank = hostage.assignedRankOnRescue;
                        newRecruit.xp = hostage.assignedXpOnRescue || 0;
                        newRecruit.isNewlyRescued = true;
                        newRecruit.applyRankBonuses(true);
                        newRecruit.setRankBasedSprite();
                        newRecruit.updateXpToNextRank();

                        if (this.masterRoster.length < (CONFIG.MAX_TOTAL_ROSTER_SIZE || 20)) {
                            this.masterRoster.push(newRecruit);
                            newlyRecruitedRaccoons.push(newRecruit);
                        }
                    }
                });
            }
        }

        const currentPhaseData = this.campaignStructure[this.currentPhaseIndex] || { name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT, missionsInPhase: 0 };
        const isLastMissionInPhase = this.currentMissionIndex >= (currentPhaseData.missionsInPhase - 1);
        const isLastPhaseOfCampaign = this.currentPhaseIndex >= (this.totalCampaignPhases - 1);

        const debriefData = {
            isVictory: isVictory,
            phaseData: currentPhaseData,
            missionData: this.currentMissionParams.baseParams || { name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT },
            objectives: this.currentMissionParams.objectives,
            survivingRaccoons: this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [],
            fallenRaccoons: this.fallenRaccoonsThisMission,
            enemiesKilled: enemiesKilledThisMission,
            timeTaken: missionDuration.toFixed(1),
            campaignComplete: (isVictory && isLastMissionInPhase && isLastPhaseOfCampaign),
            newlyRecruitedRaccoons: newlyRecruitedRaccoons,
            hostagesRecruitedCount: newlyRecruitedRaccoons.length,
            // Ambush result info
            ambushResult: this.ambushResult,
            ambushesSurvived: this.ambushesSurvivedThisMission
        };

        if (this.ui) {
            this.ui.hideHUD();
        }

        if (isVictory) {
            this.pendingDebriefData = debriefData;
            if (isLastMissionInPhase) {
                this.gameState = 'EXTRACTION_VIDEO';
                this._playExtractionVideo();
            } else {
                this._showDebriefScreen();
            }
        } else {
            if (this.ui) {
                this.ui.showPostMissionScreen_Debrief(debriefData);
                if (this.inputHandler) this.inputHandler.updateMouseCursor();
            }
            this.missionEndDelayTimer = -1;
        }
        this.hostageUnits = [];
    }

    async _playExtractionVideo() {
        if (!this.ui) {
            this._showDebriefScreen();
            return;
        }
        const extractionVideoPaths = [
            'assets/video/extraction/extraction_takeoff_1.mp4',
        ];
        const videoPath = extractionVideoPaths[Math.floor(Math.random() * extractionVideoPaths.length)];
        await this.ui.playExtractionVideo(videoPath);
        this._showDebriefScreen();
    }

    _showDebriefScreen() {
        if (this.pendingDebriefData && this.ui) {
            this.ui.showPostMissionScreen_Debrief(this.pendingDebriefData);
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
            this.pendingDebriefData = null;
        }
        this.gameState = 'POST_MISSION_DEBRIEF';
        this.missionEndDelayTimer = -1;
    }

    proceedToNextLogicalStep() {
        if (this.gameState === 'CAMPAIGN_COMPLETE') {
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.CAMPAIGN_ALREADY_COMPLETE, true); return;
        }
        // --- MODIFICATION START ---
        if (this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA);
            return;
        }
        // --- MODIFICATION END ---
        this.currentMissionIndex++;

        const currentPhaseStructure = this.campaignStructure[this.currentPhaseIndex];
        if (!currentPhaseStructure) {
            this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); return;
        }

        if (this.currentMissionIndex >= currentPhaseStructure.missionsInPhase) {
            const phaseRules = this.campaignRules.PHASE_GENERATION;
            const conclusionRNG = this.currentPhaseSeedRNG || this.campaignSeedRNG;
            const casualtyReport = conclusionRNG.pickFrom(phaseRules.CASUALTY_REPORTS_POOL);
            const outcomeAdjective = conclusionRNG.pickFrom(phaseRules.OUTCOME_ADJECTIVES_POOL);
            const outcomeVerb = conclusionRNG.pickFrom(phaseRules.OUTCOME_VERBS_POOL);
            const conclusionTemplate = conclusionRNG.pickFrom(phaseRules.CONCLUSION_TEMPLATES);
            currentPhaseStructure.conclusion = this._fillTextTemplate(conclusionTemplate, {
                phaseNum: this.currentPhaseIndex + 1,
                phaseName: currentPhaseStructure.name,
                biomeDescription: currentPhaseStructure.biomeDescription,
                casualtyReport: casualtyReport,
                outcomeAdjective: outcomeAdjective,
                outcomeVerb: outcomeVerb
            });

            this.currentPhaseIndex++;
            this.currentMissionIndex = 0;
            if (this.currentPhaseIndex >= this.totalCampaignPhases) {
                this.gameState = 'CAMPAIGN_COMPLETE';
                const finalDebriefData = {
                    isVictory: true, campaignComplete: true,
                    phaseData: { name: CONFIG.UI_TEXT_STRINGS.CAMPAIGN_COMPLETE_PHASE_NAME, introduction: "The final battle is won!" },
                    missionData: { name: CONFIG.UI_TEXT_STRINGS.CAMPAIGN_COMPLETE_MISSION_NAME },
                    objectives: [{ type: "CAMPAIGN_WON", isComplete: true, descriptionTemplateKey: "OBJECTIVE_CAMPAIGN_WON_TEXT", isPrimary: true }],
                    survivingRaccoons: this.masterRoster.filter(r => r.isAlive()),
                    fallenRaccoons: this.fallenRaccoonsGlobal, enemiesKilled: "N/A", timeTaken: "N/A"
                };
                if (this.ui) this.ui.showPostMissionScreen_Debrief(finalDebriefData); return;
            }
            if (!this.campaignStructure[this.currentPhaseIndex]) {
                this._generatePhaseStructure(this.currentPhaseIndex);
            }
        }

        if (this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA); return;
        }

        if (this.generateAndSetCurrentMissionParams(this.currentPhaseIndex, this.currentMissionIndex)) {
            const nextPhaseData = this.campaignStructure[this.currentPhaseIndex];
            if (this.ui && nextPhaseData && this.currentMissionParams) {
                this.gameState = 'PRE_MISSION_SELECT';
                // Continue menu music for pre-mission
                if (this.musicManager) {
                    this.musicManager.onGameStateChange('PRE_MISSION_SELECT');
                }
                this.ui.showPreMissionScreen_RecruitSelect(nextPhaseData, this.currentMissionParams, this.getAvailableRecruits());
            } else {
                if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.ERROR_PREPARING_NEXT_BRIEFING);
                this.gameState = 'MAIN_MENU';
            }
        } else {
            this.gameState = 'CAMPAIGN_COMPLETE';
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.CAMPAIGN_CONCLUDED_NO_MORE_MISSIONS, true);
        }
    }

    toggleFormation() {
        if (this.gameState !== 'RUNNING') return;
        this.currentFormationIndex = (this.currentFormationIndex + 1) % this.FORMATION_TYPES.length;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        if (this.ui) this.ui.updateFormationButton(this.currentFormationType);
    }

    setFormationSpacing(multiplier) {
        if (this.gameState === 'RUNNING') this.formationSpacingMultiplier = parseFloat(multiplier);
    }

    selectUnitsInCtrlDragRectangle() {
        if (!this.draggedFarEnough || this.gameState !== 'RUNNING') return;
        const zoom = this.cameraZoom || 1.0;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const worldDragStartX = this.cameraX + (this.dragStartX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
        const worldDragStartY = this.cameraY + (this.dragStartY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);
        const worldDragCurrentX = this.cameraX + (this.dragCurrentX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
        const worldDragCurrentY = this.cameraY + (this.dragCurrentY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);

        const selectionRectX = Math.min(worldDragStartX, worldDragCurrentX);
        const selectionRectY = Math.min(worldDragStartY, worldDragCurrentY);
        const selectionRectWidth = Math.abs(worldDragCurrentX - worldDragStartX);
        const selectionRectHeight = Math.abs(worldDragCurrentY - worldDragStartY);
        let newlySelectedUnits = [];
        if (this.deployedSquadRoster) this.deployedSquadRoster.forEach(unit => {
            if (unit.isAlive() &&
                unit.x >= selectionRectX && unit.x <= selectionRectX + selectionRectWidth &&
                unit.y >= selectionRectY && unit.y <= selectionRectY + selectionRectHeight) {
                if (!newlySelectedUnits.includes(unit)) newlySelectedUnits.push(unit);
            }
        });
        const oldSelectionIds = this.selectedUnits.map(u => u.id).sort().join(',');
        const newSelectionIds = newlySelectedUnits.map(u => u.id).sort().join(',');

        if (oldSelectionIds !== newSelectionIds) {
            this.selectedUnits = newlySelectedUnits;
            let aimingCancelled = false;
            this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
            if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
    }

    deselectAllUnits() {
        if (this.selectedUnits.length === 0) return;
        let aimingCancelled = false;
        if (this.selectedUnits) this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
        this.selectedUnits = [];
        if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
        if (this.inputHandler) this.inputHandler.updateMouseCursor(); else if (this.ui) this.ui.setCursor('default');
    }

    selectAllPlayerUnits() {
        const allAliveUnits = this.deployedSquadRoster ? this.deployedSquadRoster.filter(unit => unit.isAlive()) : [];
        const currentSelectionIds = this.selectedUnits.map(u => u.id).sort().join(',');
        const allAliveUnitsIds = allAliveUnits.map(u => u.id).sort().join(',');
        if (currentSelectionIds !== allAliveUnitsIds) {
            let aimingCancelled = false;
            if (this.selectedUnits) this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
            this.selectedUnits = allAliveUnits;
            if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
    }

    addProjectile(projectile) {
        this.gameObjects.push(projectile);
        if (this.spatialGrid && projectile) {
            this.spatialGrid.addObject(projectile);
        }
    }

    checkMissionStatus() {
        if (this.gameState !== 'RUNNING' || !this.missionStartedAndPopulated || !this.currentMissionParams || !this.currentMissionParams.objectives) {
            return;
        }

        let allObjectivesNowComplete = true;

        if (this.currentMissionParams.objectives.length === 0) {
            allObjectivesNowComplete = this.enemyUnits.every(e => !e.isAlive());
        } else {
            this.currentMissionParams.objectives.forEach(obj => {
                if (obj.type === 'EXTERMINATE') {
                    obj.currentProgress = this.enemyUnits ? this.enemyUnits.filter(e => !e.isAlive()).length : 0;
                    if (obj.totalToAchieve === undefined) obj.totalToAchieve = this.initialEnemyCount;

                    obj.isComplete = (obj.currentProgress >= obj.totalToAchieve);

                } else if (!obj.isComplete) {
                    if (obj.type === 'DESTROY_TARGET') {
                        obj.currentProgress = this.level.missionTargetObstacles ?
                            this.level.missionTargetObstacles.filter(t => t.type.startsWith(obj.targetTypeKeyPrefix) && t.isDestroyed && t.objectiveId === obj.id).length : 0;
                        if (obj.currentProgress >= obj.totalToAchieve) {
                            obj.isComplete = true;
                        }
                    } else if (obj.type === 'RESCUE_HOSTAGES') {
                        const allHostages = this.hostageUnits || [];
                        const livingHostages = allHostages.filter(h => h.isAlive());
                        const deadHostages = allHostages.filter(h => !h.isAlive());
                        const rescuedAndAliveHostages = allHostages.filter(h => h.isRescued && h.isAlive());

                        // --- Dynamic objective adjustment for dead hostages ---
                        // Store original values for reference (set once)
                        if (obj._originalTotalToAchieve === undefined) {
                            obj._originalTotalToAchieve = obj.totalToAchieve;
                            obj._originalMinToAchieve = obj.minToAchieveForCompletion || 1;
                        }
                        // Adjust totals based on living hostages
                        // Allow minToAchieveForCompletion to be 0 when all hostages are dead
                        obj.totalToAchieve = livingHostages.length;
                        obj.hostagesKilled = deadHostages.length;
                        obj.minToAchieveForCompletion = Math.min(obj._originalMinToAchieve, livingHostages.length);
                        obj.currentProgress = rescuedAndAliveHostages.length;

                        // --- Extraction zone reveal logic ---
                        // Reveal the zone once all LIVING hostages are rescued (dead hostages don't block reveal)
                        // Extraction zone appears when all objectives (not including extraction) are complete AND all hostages rescued
                        const hasExtractionObjective = this.currentMissionParams.objectives.some(o => o.type === 'EXTRACTION');
                        const otherObjectivesComplete = this.currentMissionParams.objectives
                            .filter(o => o.type !== 'EXTRACTION' && o.type !== 'RESCUE_HOSTAGES')
                            .every(o => o.isComplete);
                        const allLivingHostagesFreed = allHostages.every(h => !h.isAlive() || h.isRescued);
                        const allHostagesRescued = obj.currentProgress >= obj.minToAchieveForCompletion;
                        
                        // Reveal extraction zone when: all other objectives complete AND all hostages rescued
                        if (!obj.extractionZoneRevealed && allHostages.length > 0 && otherObjectivesComplete && allLivingHostagesFreed && allHostagesRescued) {
                            obj.extractionZoneRevealed = true;
                            // Un-hide all extraction zones and create their visual effects
                            const extractionZoneObs = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
                            extractionZoneObs.forEach(ezObs => {
                                ezObs.isHidden = false;
                                this.addVisualEffect('extraction_zone', { obstacle: ezObs });
                            });
                            // Update objective text to guide player
                            if (CONFIG.UI_TEXT_STRINGS && CONFIG.UI_TEXT_STRINGS.OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION) {
                                obj.displayText = CONFIG.UI_TEXT_STRINGS.OBJECTIVE_RESCUE_PROCEED_TO_EXTRACTION;
                            }
                            if (this.ui) {
                                this.ui.updateObjective();
                                // Show popup notification for extraction available
                                const extractionMsg = CONFIG.UI_TEXT_STRINGS.EXTRACTION_ZONE_REVEALED || "Extraction Zone Revealed!";
                                this.ui.showToast(extractionMsg, 'success');
                            }
                            if (CONFIG.DEBUG_LOGGING) console.log('[Game] All objectives complete and hostages rescued! Extraction zone revealed.');
                        }

                        // If all hostages are dead and none were rescued, fail the mission (soft-lock prevention)
                        if (livingHostages.length === 0 && obj.currentProgress === 0) {
                            // No living hostages and none rescued — objective is unachievable
                            // Mark as failed and trigger mission failure
                            obj.statusText = "All hostages KIA - Objective Failed";
                            obj.isComplete = false;
                            // Force mission failure since primary objective cannot be completed
                            if (this.gameState === 'RUNNING') {
                                this.initiateMissionEnd(false);
                            }
                            return;
                        }

                        let hostagesAtEvacCount = 0;
                        let playerRaccoonInZone = false;
                        const extractionZones = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
                        if (extractionZones.length > 0) {
                            rescuedAndAliveHostages.forEach(hostage => {
                                for (const zone of extractionZones) {
                                    if (hostage.x >= zone.x && hostage.x <= zone.x + zone.width &&
                                        hostage.y >= zone.y && hostage.y <= zone.y + zone.height) {
                                        hostagesAtEvacCount++;
                                        break;
                                    }
                                }
                            });
                            if (this.deployedSquadRoster) {
                                for (const raccoon of this.deployedSquadRoster) {
                                    if (raccoon.isAlive()) {
                                        for (const zone of extractionZones) {
                                            if (raccoon.x >= zone.x && raccoon.x <= zone.x + zone.width &&
                                                raccoon.y >= zone.y && raccoon.y <= zone.y + zone.height) {
                                                playerRaccoonInZone = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (playerRaccoonInZone) break;
                                }
                            }
                        }
                        obj.currentEvacuated = hostagesAtEvacCount;
                        let enemiesClearedForThisRescue = false;
                        const exterminateObjective = this.currentMissionParams.objectives.find(o => o.type === "EXTERMINATE");
                        if (exterminateObjective) {
                            enemiesClearedForThisRescue = exterminateObjective.isComplete;
                        } else {
                            enemiesClearedForThisRescue = this.enemyUnits.every(e => !e.isAlive());
                        }
                        // RESCUE_HOSTAGES is only complete when hostages are IN the extraction zone, not just rescued
                        // hostagesAtEvacCount is calculated above and represents rescued hostages actually in the zone
                        if (hostagesAtEvacCount >= obj.minToAchieveForCompletion &&
                            enemiesClearedForThisRescue) {
                            obj.isComplete = true;
                            if (CONFIG.DEBUG_LOGGING) console.log('[Game] RESCUE_HOSTAGES objective complete (hostages evacuated + enemies cleared).');
                        }
                        if (!obj.isComplete && hasExtractionObjective) {
                            const allHostagesEvacuated = hostagesAtEvacCount >= obj.minToAchieveForCompletion;
                            if (allHostagesEvacuated && enemiesClearedForThisRescue) {
                                obj.isComplete = true;
                                if (CONFIG.DEBUG_LOGGING) console.log('[Game] RESCUE_HOSTAGES complete (with EXTRACTION objective present). EXTRACTION can now reveal zone.');
                            }
                        }
                    } else if (obj.type === 'ASSASSINATION') {
                        if (obj.targetUnitId) {
                            const targetUnit = this.enemyUnits.find(e => e.id === obj.targetUnitId);
                            if (!targetUnit || !targetUnit.isAlive()) {
                                obj.isComplete = true;
                                obj.currentProgress = 1;
                            }
                        }
                    } else if (obj.type === 'RESCUE_TAKEN_HOSTAGE') {
                        // Find the captured raccoon in hostage units
                        const targetHostage = this.hostageUnits?.find(h => h.originalRaccoonId === obj.targetRaccoonId || h.id === obj.targetRaccoonId);
                        if (targetHostage && targetHostage.isRescued && targetHostage.isAlive()) {
                            obj.isComplete = true;
                            obj.currentProgress = 1;
//                            console.log(`[Game] RESCUE_TAKEN_HOSTAGE completed: ${obj.targetRaccoonName} rescued!`);
                        }
                        if (!obj.isComplete && hasExtractionObjective && obj.currentProgress >= 1) {
                            obj.isComplete = true;
                            if (CONFIG.DEBUG_LOGGING) console.log('[Game] RESCUE_TAKEN_HOSTAGE complete (with EXTRACTION objective present).');
                        }
                    }
                }

                // EXTRACTION objective - always re-evaluate (handles hut spawns after extraction, re-entry after raccoon death)
                if (obj.type === 'EXTRACTION') {
                    const zoneStatus = this.checkRaccoonsInExtractionZone();
                    obj.currentProgress = zoneStatus.anyInZone ? 1 : 0;
                    obj.isComplete = zoneStatus.allInZone;

                    // Reveal extraction zone when ALL OTHER objectives are complete
                    // Don't include EXTRACTION itself in the check - circular dependency
                    if (!obj.extractionZoneRevealed) {
                        const otherObjectivesComplete = this.currentMissionParams.objectives
                            .filter(o => o.type !== 'EXTRACTION')
                            .every(o => o.isComplete);

                        if (otherObjectivesComplete) {
                            obj.extractionZoneRevealed = true;
                            const extractionZoneObs = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
                            extractionZoneObs.forEach(ezObs => {
                                ezObs.isHidden = false;
                                this.addVisualEffect('extraction_zone', { obstacle: ezObs });
                            });
                            // Update objective text to guide player
                            if (CONFIG.UI_TEXT_STRINGS && CONFIG.UI_TEXT_STRINGS.OBJECTIVE_EXTRACTION_PROCEED) {
                                obj.displayText = CONFIG.UI_TEXT_STRINGS.OBJECTIVE_EXTRACTION_PROCEED;
                            }
                            if (this.ui) {
                                this.ui.updateObjective();
                                // Show popup notification for extraction available
                                const extractionMsg = CONFIG.UI_TEXT_STRINGS.EXTRACTION_ZONE_REVEALED || "Extraction Zone Revealed!";
                                this.ui.showToast(extractionMsg, 'success');
                            }
                        }
                    }
                }

                if (!obj.isComplete) {
                    allObjectivesNowComplete = false;
                }
            });
        }

        const livingPlayerRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()).length : 0;
        if (livingPlayerRaccoons === 0 && this.deployedSquadRoster.length > 0) {
            if (this.gameState === 'RUNNING') {
                this.initiateMissionEnd(false);
            }
            return;
        }

        if (allObjectivesNowComplete && this.gameState === 'RUNNING' && !this.isInAmbush()) {
            const hasExtractionObjective = this.currentMissionParams && this.currentMissionParams.objectives &&
                this.currentMissionParams.objectives.some(o => o.type === 'EXTRACTION');
            
            // Check if there's a RESCUE_HOSTAGES objective and if extraction zone is revealed
            const hasRescueObjective = this.currentMissionParams && this.currentMissionParams.objectives &&
                this.currentMissionParams.objectives.some(o => o.type === 'RESCUE_HOSTAGES');
            const rescueObj = hasRescueObjective ? this.currentMissionParams.objectives.find(o => o.type === 'RESCUE_HOSTAGES') : null;
            const extractionZoneRevealed = rescueObj && rescueObj.extractionZoneRevealed;

            // Prevent ending mission for non-phase-finale missions with RESCUE_HOSTAGES until extraction happens
            if (hasRescueObjective && !hasExtractionObjective) {
                if (!extractionZoneRevealed) {
                    return;
                }
                const allHostagesInZone = this.checkAllRescuedHostagesInExtractionZone();
                if (!allHostagesInZone) {
                    return;
                }
            }

            // Prevent re-triggering extraction ambush after shootout ends
            if (this.missionEndInitiated) {
                return;
            }

            if (hasExtractionObjective && !this.missionEndInitiated) {
                // Phase finale - check for extraction ambush
                // Set missionEndInitiated BEFORE triggering ambush so the check doesn't re-run while ambush is active
                this.missionEndInitiated = true;
                const game = this;
                this.triggerExtractionAmbush(function(success) {
                    // Reset flag so initiateMissionEnd can proceed (will be re-set inside initiateMissionEnd)
                    game.missionEndInitiated = false;
                    if (success === false) {
                        game.initiateMissionEnd(true);
                    }
                });
            } else {
                // Not a phase finale - end mission immediately, no extraction ambush
                this.initiateMissionEnd(true);
            }
        }
    }

    spawnFlyingBirdFlock() {
        if (!this.birdSpawnConfig || !this.preloadedImages[this.birdSpawnConfig.TILE_SHEET_PATH] || !(this.level && this.level.rng)) return;

        const rng = this.level.rng;
        const direction = rng.chance(0.5) ? 1 : -1;
        const flockSize = rng.nextInt(this.birdSpawnConfig.FLOCK_SIZE_MIN, this.birdSpawnConfig.FLOCK_SIZE_MAX);

        const worldHeight = CONFIG.WORLD_HEIGHT || this.canvas.height;
        const minY = worldHeight * (this.birdSpawnConfig.MIN_Y_SPAWN_FACTOR || 0.1);
        const maxY = worldHeight * (this.birdSpawnConfig.MAX_Y_SPAWN_FACTOR || 0.6);
        const baseSpawnY = rng.nextFloat(minY, maxY);

        const birdWidth = (this.birdSpawnConfig.FRAME_WIDTH || 50) * (this.birdSpawnConfig.SCALE || 1);

        for (let i = 0; i < flockSize; i++) {
            let startX;
            if (direction === 1) {
                startX = -birdWidth - (i * (this.birdSpawnConfig.FLOCK_SPACING_X || 30)) - rng.nextFloat(0, 50);
            } else {
                startX = CONFIG.WORLD_WIDTH + birdWidth + (i * (this.birdSpawnConfig.FLOCK_SPACING_X || 30)) + rng.nextFloat(0, 50);
            }
            const startY = baseSpawnY + (rng.nextFloat(-1, 1)) * (this.birdSpawnConfig.FLOCK_SPACING_Y || 10) * 2 * i;

            const bird = new FlyingBird(this, startX, startY, direction);
            this.gameObjects.push(bird);
        }
    }

    update(deltaTime) {
        if (this.gameState === 'PAUSED') {
            return;
        }

        // Handle Shootout Mode (standalone)
        if (this.gameState === 'SHOOTOUT_PLAYING') {
            this.updateShootoutMode(deltaTime);
            return;
        }

        // Handle Shootout Ambush (integrated with campaign)
        if (this.gameState === 'SHOOTOUT_AMBUSH') {
            this.updateShootoutMode(deltaTime);
            // Check if ambush ended
            if (this.shootoutController && !this.shootoutController.isRoundActive) {
                // Ambush ended - just set state to RUNNING and restore HUD
                // DON'T change music here - handleAmbushResult handles music based on victory/defeat
//                console.log('[Game] SHOOTOUT_AMBUSH ended, setting gameState=RUNNING, missionEndInitiated=' + this.missionEndInitiated);
                this.gameState = 'RUNNING';
                // Clear ambush triggered flag - critical for mission completion check
                this.ambushTriggered = false;
                // Hide shootout HUD and restore campaign HUD
                if (this.ui) {
                    this.ui.hideShootoutHud();
                    this.ui.showHUD();
                    // Crossfade from shootout music back to campaign music
                    if (this.musicManager) {
                        this.musicManager.playMusic(this.musicManager.config.STATE_TRACKS.SHOOTOUT_AMBUSH || this.musicManager.config.STATE_TRACKS.SHOOTOUT_PLAYING, { fade: true, loop: true });
                    }
                }
            }
            return;
        }

        // Handle Extraction Video - state managed by _playExtractionVideo and _showDebriefScreen
        if (this.gameState === 'EXTRACTION_VIDEO') {
            return;
        }

        if (this.missionEndDelayTimer > 0) {
            this.missionEndDelayTimer -= deltaTime;
            if (this.missionEndDelayTimer <= 0) {
                this.missionEndDelayTimer = -1;
                this.actuallyEndMission(this.missionPendingOutcomeIsVictory);
                return;
            }
        }

        if (this.gameState !== 'RUNNING' &&
            this.gameState !== 'MISSION_ENDING_VICTORY' &&
            this.gameState !== 'MISSION_ENDING_DEFEAT') {
            return;
        }

        if (this.birdSpawnConfig && this.gameState === 'RUNNING') {
            this.nextBirdSpawnTime -= deltaTime;
            if (this.nextBirdSpawnTime <= 0) {
                this.spawnFlyingBirdFlock();
                this.setNextBirdSpawnTimer(this.level.rng);
            }
        }

        if (this.selectedUnits && this.selectedUnits.length > 0 && this.gameState === 'RUNNING') {
            let avgX = 0, avgY = 0, count = 0;
            this.selectedUnits.forEach(unit => { if (unit.isAlive()) { avgX += unit.x; avgY += unit.y; count++; } });
            if (count > 0) {
                avgX /= count; avgY /= count;
                const zoom = this.cameraZoom || 1.0;
                let targetCameraX = avgX - this.canvas.width / (2 * zoom); let targetCameraY = avgY - this.canvas.height / (2 * zoom);
                targetCameraX = Math.max(0, Math.min(targetCameraX, Math.max(0, (CONFIG.WORLD_WIDTH || 0) - this.canvas.width / zoom)));
                targetCameraY = Math.max(0, Math.min(targetCameraY, Math.max(0, (CONFIG.WORLD_HEIGHT || 0) - this.canvas.height / zoom)));
                this.cameraX += (targetCameraX - this.cameraX) * CONFIG.CAMERA_LERP_SPEED;
                this.cameraY += (targetCameraY - this.cameraY) * CONFIG.CAMERA_LERP_SPEED;
                if (Math.abs(this.cameraX - targetCameraX) < 0.5) this.cameraX = targetCameraX;
                if (Math.abs(this.cameraY - targetCameraY) < 0.5) this.cameraY = targetCameraY;
                this.clampCamera();
            }
        }

        const allUnitsInGame = [...(this.deployedSquadRoster || []), ...(this.enemyUnits || [])];
        if (this.hostageUnits) {
            allUnitsInGame.push(...this.hostageUnits);
        }

        allUnitsInGame.forEach(unit => {
            if (unit && typeof unit.update === 'function') {
                const oldGridCells = unit._spatialGridCells ? new Set(unit._spatialGridCells) : null;
                unit.update(deltaTime);
                if (this.spatialGrid && (unit.isMoving || unit.isMarkedForDeletion || !unit.isAlive() || !oldGridCells || !unit._spatialGridCells || ![...oldGridCells].every(cell => unit._spatialGridCells.has(cell)))) {
                    if (!unit.isAlive() || unit.isMarkedForDeletion) {
                        this.spatialGrid.removeObject(unit);
                    } else {
                        this.spatialGrid.updateObject(unit);
                    }
                }
            }
        });

        this.gameObjects = this.gameObjects.filter(obj => {
            if (obj) {
                if (obj instanceof Projectile || obj instanceof GrenadeProjectile || this.gameState === 'RUNNING') {
                    obj.update(deltaTime);
                    // --- OPTIMIZATION Phase 3: Don't add Projectiles to SpatialGrid ---
                    // Nothing collides WITH projectiles (except maybe shields, if implemented later).
                    // Projectiles query the grid themselves to hit Units/Obstacles.
                    // This saves massive overhead of updating thousands of bullets in the grid cells.

                    if (obj.isMarkedForDeletion && (obj instanceof Projectile || obj instanceof GrenadeProjectile)) {
                        if (this.spatialGrid) {
                            // Just in case it WAS in there (e.g. from older frames or logic), try remove once.
                            this.spatialGrid.removeObject(obj);
                        }
                        if (obj instanceof Projectile) {
                            this.projectilePool.release(obj);
                        } else if (obj instanceof GrenadeProjectile) {
                            this.grenadeProjectilePool.release(obj);
                        }
                    }
                }
            }
            return obj && !obj.isMarkedForDeletion;
        });

        this.visualEffects = this.visualEffects.filter(effect => {
            if (effect) effect.update(deltaTime);
            return effect && !effect.isMarkedForDeletion;
        });

        this.hostageUnits = this.hostageUnits.filter(h => !h.isMarkedForDeletion);

        if (!this.missionStartedAndPopulated && this.gameState === 'RUNNING') {
            this.missionStartedAndPopulated = true;
        }

        if (this.gameState === 'RUNNING') {
            this.checkMissionStatus();
            if (this.level && typeof this.level.updateHutSpawning === 'function') {
                this.level.updateHutSpawning(deltaTime);
            }
            if (this.ui) {
                this.ui.updateObjective();
            }
        }
    }

    render() {
        if (!this.ctx) {
//            console.warn("Game render called but this.ctx is not defined.");
            return;
        }

        // Handle Shootout Mode rendering separately
        if (this.gameState === 'SHOOTOUT_PRE_GAME') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Render shootout controller for dev mode (shows spawn boxes)
            if (this.shootoutController && this.shootoutController.isDevMode) {
                this.shootoutController.render(this.ctx);
            }
            return;
        }

        if (this.gameState === 'SHOOTOUT_PLAYING' || this.gameState === 'SHOOTOUT_PAUSED' || this.gameState === 'SHOOTOUT_AMBUSH') {
            // Clear and render shootout mode
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.shootoutController) {
                this.shootoutController.render(this.ctx);
            }
            return;
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        // Apply camera zoom - translate to center, scale, then translate by camera position
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.cameraZoom, this.cameraZoom);
        this.ctx.translate(-this.cameraX - this.canvas.width / (2 * this.cameraZoom), -this.cameraY - this.canvas.height / (2 * this.cameraZoom));

        if (this.prerenderedBackgroundCanvas && this.prerenderedBackgroundCanvas.width > 0 && this.prerenderedBackgroundCanvas.height > 0) {
            try { this.ctx.drawImage(this.prerenderedBackgroundCanvas, 0, 0); } catch (e) { }
        } else {
            this.ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
            this.ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH || this.canvas.width, CONFIG.WORLD_HEIGHT || this.canvas.height);
        }

        let sortableObjects = [];
        if (this.deployedSquadRoster) { this.deployedSquadRoster.forEach(unit => { if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') { const isDeadUnit = !unit.isAlive(); sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2) - (isDeadUnit ? 0.5 : 0), isUnit: true, isDead: isDeadUnit }); } }); }
        if (this.enemyUnits) { this.enemyUnits.forEach(unit => { if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') { const isDeadUnit = !unit.isAlive(); sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2) - (isDeadUnit ? 0.5 : 0), isUnit: true, isDead: isDeadUnit }); } }); }
        if (this.hostageUnits) { this.hostageUnits.forEach(unit => { if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') { const isDeadUnit = !unit.isAlive(); sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2) - (isDeadUnit ? 0.5 : 0), isUnit: true, isDead: isDeadUnit }); } }); }
                    // --- MODIFICATION START: Fix extraction zone not being drawn after isHidden=false ---
            // Added check for isHidden to allow extraction zones to appear when revealed
            if (this.level.obstacles) { this.level.obstacles.forEach(obstacle => { 
                if (obstacle.isHidden) return;
                const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null; 
                let shouldSort = true; 
                if (obstacle.type === 'border_wall' || (borderObstacleType && obstacle.type === borderObstacleType)) { 
                    if (borderObstacleType && obstacle.type === borderObstacleType && !obstacle.imageNormal) { 
                        shouldSort = false; 
                    } 
                } 
                if (shouldSort && obstacle && typeof obstacle.y === 'number' && typeof obstacle.height === 'number' && (!obstacle.isDestroyed || (obstacle.isDestroyed && obstacle.imageDestroyed))) { let sortYValue = obstacle.y + obstacle.height; const collisionShape = obstacle.collisionShape ? this.level._getObstacleCollisionShape(obstacle) : null;                 if (obstacle.type === 'tree_palm_single' || obstacle.type === 'tree_palm_double' || obstacle.type === 'tree_palm_triple' || obstacle.type === 'tree_deciduous_single' || obstacle.type === 'tree4_deciduous_single' || obstacle.type === 'tree_fan_single' || obstacle.type === 'tree_fan_double' || obstacle.type === 'tree_fan_triple') { if (collisionShape && (collisionShape.type === 'rectangle' || collisionShape.type === 'ellipse')) { sortYValue = collisionShape.y + (collisionShape.height || collisionShape.radiusY || obstacle.height * 0.1); } else if (collisionShape && collisionShape.type === 'circle') { sortYValue = collisionShape.y + collisionShape.radius; } } else if (collisionShape && collisionShape.type === 'ellipse') { sortYValue = collisionShape.y + collisionShape.radiusY; } else if (collisionShape && collisionShape.type === 'circle') { sortYValue = collisionShape.y + collisionShape.radius; } if (typeof sortYValue === 'number' && !isNaN(sortYValue)) { const isDestroyedObstacle = !!obstacle.isDestroyed; sortableObjects.push({ entity: obstacle, sortY: sortYValue - (isDestroyedObstacle ? 0.5 : 0), isUnit: false, isDestroyed: isDestroyedObstacle }); } } }); }
        const birdsToRenderLast = [];
        this.gameObjects.forEach(obj => {
            if (obj instanceof FlyingBird) {
                return;
            } else if (this.isProjectileOrBird(obj) && typeof obj.y === 'number') {
                sortableObjects.push({ entity: obj, sortY: obj.y, isUnit: true });
            } else if (obj && typeof obj.render === 'function') {
                obj.render(this.ctx);
            }
        });
        sortableObjects.sort((a, b) => { if (isNaN(a.sortY) || isNaN(b.sortY)) { return 0; } return a.sortY - b.sortY; });
        sortableObjects.forEach((item, index) => {
            const obj = item.entity; if (!obj) { return; } try {
                if (item.isUnit) { if (typeof obj.render === 'function') { obj.render(this.ctx); } } else {
                    // --- MODIFICATION START ---
                    this.ctx.save();
                    if (obj.isFlippedHorizontally) {
                        this.ctx.translate(obj.x + obj.width / 2, 0);
                        this.ctx.scale(-1, 1);
                        this.ctx.translate(-(obj.x + obj.width / 2), 0);
                    }

                    if (obj.isDestroyed && obj.imageDestroyed) {
                        let renderWidth, renderHeight, drawX, drawY;
                        if (obj.spriteDestroyedScale !== undefined && obj.spriteDestroyedScale !== null) {
                            renderWidth = obj.imageDestroyed.naturalWidth * obj.spriteDestroyedScale;
                            renderHeight = obj.imageDestroyed.naturalHeight * obj.spriteDestroyedScale;
                            drawX = obj.x + (obj.width / 2) - (renderWidth / 2);
                            drawY = obj.y + obj.height - renderHeight;
                        } else {
                            renderWidth = obj.width; renderHeight = obj.height; drawX = obj.x; drawY = obj.y;
                        }
                        if (obj.imageDestroyed && obj.imageDestroyed.naturalWidth > 0) this.ctx.drawImage(obj.imageDestroyed, drawX, drawY, renderWidth, renderHeight);
                    } else if (!obj.isDestroyed && obj.imageNormal) {
                        if (obj.imageNormal.naturalWidth > 0) this.ctx.drawImage(obj.imageNormal, obj.x, obj.y, obj.width, obj.height);
                    } else if (obj.type === 'extraction_zone') {
                        // Debug: extraction zone fallback draw
                    //    console.log('[Game] Drawing extraction zone fallback: isHidden=' + obj.isHidden + ', isDecoration=' + obj.isDecoration + ', imageNormal=' + obj.imageNormal);
                        let obsColor = obj.color || '#3C78FF'; 
                        this.ctx.fillStyle = obsColor; 
                        this.ctx.globalAlpha = 0.35;
                        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                        this.ctx.globalAlpha = 1.0;
                        // Draw border
                        this.ctx.strokeStyle = '#00FFD4';
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                    } else if ((!obj.isDecoration || !obj.imageNormal) && !obj.isDestroyed) {
                        let obsColor = obj.color || '#555555'; this.ctx.fillStyle = obsColor; this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    }

                    this.ctx.restore(); // Restore context after potential flip
                    // --- MODIFICATION END ---

                    if (obj.destructible && !obj.isDestroyed && obj.hp < obj.maxHp && obj.hp > 0 && CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR) { const healthBarStyle = CONFIG.UI_SETTINGS.HEALTH_BAR; const hpBarHeight = healthBarStyle.HEIGHT || 4; const hpBarWidth = Math.min(obj.width * 0.7, 60); const barX = obj.x + (obj.width - hpBarWidth) / 2; const barY = obj.y - hpBarHeight - 4; this.ctx.fillStyle = healthBarStyle.BG_COLOR || '#111'; this.ctx.fillRect(barX - 1, barY - 1, hpBarWidth + 2, hpBarHeight + 2); let fillColor = healthBarStyle.HP_COLOR_FULL || '#0c0'; const hpPercent = obj.hp / obj.maxHp; if (hpPercent < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3)) { fillColor = healthBarStyle.HP_COLOR_LOW || '#CC0000'; } else if (hpPercent < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) { fillColor = healthBarStyle.HP_COLOR_MEDIUM || '#D09040'; } this.ctx.fillStyle = fillColor; this.ctx.fillRect(barX, barY, hpBarWidth * hpPercent, hpBarHeight); }
                }
            } catch (e) { }
        });

        this.gameObjects.forEach(obj => {
            if (obj instanceof FlyingBird) {
                obj.render(this.ctx);
            }
        });

        if (this.isDebugVisualsActive) {
            this.ctx.save();

            // Draw Nav Grid
            if (CONFIG.DEBUG_DRAW_NAV_GRID_BLOCKED && this.level && this.level.navGrid) {
                const navGrid = this.level.navGrid; const cellSize = this.level.gridCellSize;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'; // Red for blocked
                for (let y = 0; y < navGrid.length; y++) {
                    for (let x = 0; x < navGrid[y].length; x++) {
                        if (navGrid[y][x] === 1) { // 1 means blocked
                            this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }
                    }
                }
            }

            // Draw Player Spawn Zones
            if (this.level) {
                if (this.level.playerSpawnZone) {
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; // Yellow tint
                    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                    this.ctx.lineWidth = 2;
                    this.ctx.fillRect(this.level.playerSpawnZone.x, this.level.playerSpawnZone.y, this.level.playerSpawnZone.width, this.level.playerSpawnZone.height);
                    this.ctx.strokeRect(this.level.playerSpawnZone.x, this.level.playerSpawnZone.y, this.level.playerSpawnZone.width, this.level.playerSpawnZone.height);
                }
                if (this.level.effectivePlayerSpawnZone) {
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; // Cyan tint
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
                    this.ctx.lineWidth = 2;
                    this.ctx.fillRect(this.level.effectivePlayerSpawnZone.x, this.level.effectivePlayerSpawnZone.y, this.level.effectivePlayerSpawnZone.width, this.level.effectivePlayerSpawnZone.height);
                    this.ctx.strokeRect(this.level.effectivePlayerSpawnZone.x, this.level.effectivePlayerSpawnZone.y, this.level.effectivePlayerSpawnZone.width, this.level.effectivePlayerSpawnZone.height);
                }
            }

            // --- NEW: Draw Quadrant Grid ---
            if (this.level && this.level.quadrantBoundaries) {
                const { minX, minY, maxX, maxY, cols, rows, width, height } = this.level.quadrantBoundaries;

                this.ctx.strokeStyle = 'rgba(255, 100, 255, 1.0)';
                this.ctx.lineWidth = 5;
                this.ctx.setLineDash([5, 10]);

                // Draw vertical lines
                for (let c = 1; c < cols; c++) {
                    const lineX = minX + c * width;
                    this.ctx.beginPath();
                    this.ctx.moveTo(lineX, minY);
                    this.ctx.lineTo(lineX, maxY);
                    this.ctx.stroke();
                }

                // Draw horizontal lines
                for (let r = 1; r < rows; r++) {
                    const lineY = minY + r * height;
                    this.ctx.beginPath();
                    this.ctx.moveTo(minX, lineY);
                    this.ctx.lineTo(maxX, lineY);
                    this.ctx.stroke();
                }

                this.ctx.setLineDash([]);
            }

            // Draw Obstacle Collision Shapes
            if (CONFIG.DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES && this.level && this.level.obstacles) { this.ctx.globalAlpha = 0.5; this.ctx.lineWidth = 1; this.level.obstacles.forEach(obstacle => { if (obstacle.type === 'border_wall' && (obstacle.y === 0 || obstacle.y + obstacle.height === (CONFIG.WORLD_HEIGHT || this.canvas.height))) { const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null; if (borderObstacleType && obstacle.type === borderObstacleType) { return; } } const collisionShape = this.level._getObstacleCollisionShape(obstacle); if (!collisionShape) return; if (obstacle.isDestroyed && !obstacle.blocksMovement) { } else if (obstacle.blocksMovement || obstacle.providesCover || obstacle.isPickup) { if (collisionShape.type === 'rectangle') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta'); this.ctx.strokeRect(collisionShape.x, collisionShape.y, collisionShape.width, collisionShape.height); } else if (collisionShape.type === 'circle') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta'); this.ctx.beginPath(); this.ctx.arc(collisionShape.x, collisionShape.y, collisionShape.radius, 0, Math.PI * 2); this.ctx.stroke(); } else if (collisionShape.type === 'ellipse') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'lime' : (obstacle.providesCover ? 'pink' : 'orange'); this.ctx.beginPath(); this.ctx.ellipse(collisionShape.x, collisionShape.y, collisionShape.radiusX, collisionShape.radiusY, 0, 0, Math.PI * 2); this.ctx.stroke(); } } }); }

            // Draw Hut Spawner Info
            if (this.level && CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_SPAWN_AREAS) { this.level.renderHutSpawnAreas(this.ctx); }
            if (this.level && CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_HUT_STATUS_TEXT) { this.ctx.fillStyle = "white"; this.ctx.font = "10px Arial"; this.ctx.textAlign = "center"; (this.level.potentialSpawnerHuts || []).forEach(hut => { if (!hut.isDestroyed) { let status = "POTENTIAL"; if (hut.isActivelySpawning) { status = hut.unitsToSpawnThisBurst > 0 ? `BURST (${hut.unitsToSpawnThisBurst} left, next in ${hut.timeUntilNextUnitInBurst.toFixed(1)}s)` : `ACTIVE (CD: ${hut.spawnCooldownTimer.toFixed(1)}s)`; } this.ctx.fillText(status, hut.x + hut.width / 2, hut.y - 5); } }); }

            // Draw Pathing Lines
            if (this.selectedUnits && this.selectedUnits.length > 0) {
                this.ctx.strokeStyle = 'rgba(50, 150, 255, 0.7)';
                this.ctx.fillStyle = 'rgba(50, 150, 255, 0.9)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([3, 3]);
                this.selectedUnits.forEach(unit => {
                    if (unit.isMoving && unit.currentPath && unit.currentPath.length > 0) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(unit.x, unit.y);
                        this.ctx.lineTo(unit.currentPath[0].x, unit.currentPath[0].y);
                        for (let i = 0; i < unit.currentPath.length - 1; i++) {
                            this.ctx.lineTo(unit.currentPath[i + 1].x, unit.currentPath[i + 1].y);
                        }
                        this.ctx.stroke();
                        unit.currentPath.forEach(node => {
                            this.ctx.beginPath();
                            this.ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }
                });
            }

            this.ctx.restore();
        }

        this.visualEffects.forEach(effect => { if (effect && typeof effect.render === 'function') { effect.render(this.ctx); } });

        if (this.selectedUnits) {
            this.selectedUnits.forEach((unit) => {
                if (
                    unit &&
                    unit.isAlive() &&
                    unit.manualTarget &&
                    unit.manualTarget.isAlive() &&
                    !(unit instanceof Raccoon && unit.isAimingGrenade)
                ) {
                    this.ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
                    this.ctx.lineWidth = 3;
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(unit.x, unit.y);
                    this.ctx.lineTo(unit.manualTarget.x, unit.manualTarget.y);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            });
        }
        const aimingRaccoon =
            this.selectedUnits &&
            this.selectedUnits.find(
                (unit) =>
                    unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive()
            );
        if (aimingRaccoon && this.inputHandler && this.inputHandler.mousePos) {
            const worldMouseX = this.inputHandler.mousePos.worldX;
            const worldMouseY = this.inputHandler.mousePos.worldY;
            const throwDist = distance(
                aimingRaccoon.x,
                aimingRaccoon.y,
                worldMouseX,
                worldMouseY
            );
            this.ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
            this.ctx.beginPath();
            this.ctx.arc(
                worldMouseX,
                worldMouseY,
                CONFIG.RACCOON_GRENADE_AOE_RADIUS,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.strokeStyle = "rgb(111, 0, 255)";
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(aimingRaccoon.x, aimingRaccoon.y);
            if (throwDist > CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) {
                const angle = Math.atan2(
                    worldMouseY - aimingRaccoon.y,
                    worldMouseX - aimingRaccoon.x
                );
                const cappedX =
                    aimingRaccoon.x +
                    Math.cos(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX;
                const cappedY =
                    aimingRaccoon.y +
                    Math.sin(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX;
                this.ctx.lineTo(cappedX, cappedY);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(cappedX, cappedY);
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineTo(worldMouseX, worldMouseY);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            } else {
                this.ctx.lineTo(worldMouseX, worldMouseY);
                this.ctx.stroke();
            }
        }
        if (
            this.isDragging &&
            this.draggedFarEnough &&
            this.inputHandler.isCtrlPressed
        ) {
            const zoom = this.cameraZoom || 1.0;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            const worldDragStartX = this.cameraX + (this.dragStartX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
            const worldDragStartY = this.cameraY + (this.dragStartY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);
            const worldDragCurrentX = this.cameraX + (this.dragCurrentX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
            const worldDragCurrentY = this.cameraY + (this.dragCurrentY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);
            this.ctx.strokeStyle = "rgba(50, 205, 50, 0.7)";
            this.ctx.lineWidth = 1;
            this.ctx.fillStyle = "rgba(50, 205, 50, 0.15)";
            const rectX = Math.min(worldDragStartX, worldDragCurrentX);
            const rectY = Math.min(worldDragStartY, worldDragCurrentY);
            const rectWidth = Math.abs(worldDragCurrentX - worldDragStartX);
            const rectHeight = Math.abs(worldDragCurrentY - worldDragStartY);
            this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }

        if (this.isDebugVisualsActive && CONFIG.DEBUG_DRAW_SPATIAL_GRID && this.spatialGrid) {
            this.spatialGrid.renderDebug(this.ctx, this.cameraX, this.cameraY);
        }

        this.ctx.restore();

        // --- Night Mission Darkness Overlay ---
        if (this.isNightMission && CONFIG.NIGHT_MISSION &&
            (this.gameState === 'RUNNING' || this.gameState === 'PAUSED' ||
                this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT')) {
            const nightCfg = CONFIG.NIGHT_MISSION;
            const oc = this.nightOverlayCanvas;
            const octx = this.nightOverlayCtx;
            oc.width = this.canvas.width;
            oc.height = this.canvas.height;

            const visionUnits = [
                ...(this.deployedSquadRoster || []),
                ...(this.hostageUnits || []).filter(h => h.isRescued)
            ];

            // Pass 1: Fill with full darkness
            octx.globalCompositeOperation = 'source-over';
            octx.fillStyle = nightCfg.OVERLAY_COLOR;
            octx.fillRect(0, 0, oc.width, oc.height);

            // Pass 2: Cut vision holes (fully transparent inside each circle)
            octx.globalCompositeOperation = 'destination-out';
            const zoom = this.cameraZoom || 1.0;
            visionUnits.forEach(unit => {
                if (!unit || !unit.isAlive()) return;
                const sx = (unit.x - this.cameraX) * zoom;
                const sy = (unit.y - this.cameraY) * zoom;
                const rankData = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === unit.rank);
                const baseRadius = (rankData && rankData.nightVisionRadius) || nightCfg.PLAYER_VISION_RADIUS || 220;
                const r = baseRadius * zoom;
                const soft = nightCfg.VISION_EDGE_SOFTNESS;
                const innerR = Math.max(0, r - soft);
                const grad = octx.createRadialGradient(sx, sy, innerR, sx, sy, r);
                grad.addColorStop(0, 'rgba(0,0,0,1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                octx.fillStyle = grad;
                octx.beginPath();
                octx.arc(sx, sy, r, 0, Math.PI * 2);
                octx.fill();
            });

            // Pass 3: Paint the residual tint into the transparent (vision) areas only.
            // destination-over draws BEHIND existing pixels, so it only fills where alpha=0
            // (the erased vision holes). Overlapping holes are already merged into one
            // transparent region, so the tint is applied uniformly — no stacking.
            const tintOpacity = nightCfg.VISION_TINT_OPACITY !== undefined ? nightCfg.VISION_TINT_OPACITY : 0.45;
            if (tintOpacity > 0) {
                octx.globalCompositeOperation = 'destination-over';
                octx.fillStyle = `rgba(0, 0, 20, ${tintOpacity})`;
                octx.fillRect(0, 0, oc.width, oc.height);
            }

            octx.globalCompositeOperation = 'source-over';
            this.ctx.drawImage(oc, 0, 0);
        }

        if (this.gameState === 'RUNNING' || this.gameState === 'PAUSED' || this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT') {
            this.ctx.font = "16px 'Consolas', 'Lucida Console', monospace";
            this.ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
            this.ctx.textAlign = "left";
            this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        }

        if ((this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT') && this.missionEndMessage) {
            this.ctx.save(); this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.font = "bold 48px 'Impact', 'Arial Black', sans-serif"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
            const textX = this.canvas.width / 2; const textY = this.canvas.height / 2;
            this.ctx.shadowColor = "rgba(0,0,0,0.7)"; this.ctx.shadowBlur = 5; this.ctx.shadowOffsetX = 2; this.ctx.shadowOffsetY = 2;
            if (this.missionPendingOutcomeIsVictory) { this.ctx.fillStyle = "#4CAF50"; } else { this.ctx.fillStyle = "#F44336"; }
            this.ctx.fillText(this.missionEndMessage, textX, textY);
            this.ctx.font = "24px 'Consolas', 'Lucida Console', monospace"; this.ctx.fillStyle = "#FFFFFF";
            const timeLeft = Math.ceil(Math.max(0, this.missionEndDelayTimer));
            this.ctx.fillText(`Continuing in ${timeLeft}s...`, textX, textY + 50);
            this.ctx.restore();
        }
    }

    gameLoop(timestamp) {
        const now = performance.now();
        if (!this.lastTime) {
            this.lastTime = now;
        }
        let deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        deltaTime = Math.min(deltaTime, CONFIG.MAX_DELTA_TIME_STEP || 0.1);
        if (deltaTime <= 0) {
            deltaTime = 1 / 60;
        }

        this.frameCount++;
        if (now - this.lastFpsUpdateTime > this.fpsUpdateInterval) {
            this.fps = Math.round(this.frameCount / (this.fpsUpdateInterval / 1000));
            this.frameCount = 0;
            this.lastFpsUpdateTime = now;
        }

        if (this.gameState === 'RUNNING' ||
            this.gameState === 'PAUSED' ||
            this.gameState === 'MISSION_ENDING_VICTORY' ||
            this.gameState === 'MISSION_ENDING_DEFEAT' ||
            this.gameState === 'SHOOTOUT_PLAYING' ||
            this.gameState === 'SHOOTOUT_AMBUSH') {
            try {
                this.update(deltaTime);
            } catch (e) {
//                console.error("ERROR IN Game.update():", e);
                this.gameState = 'ERROR_STATE';
            }
        }

        try {
            this.render();
        } catch (e) {
//            console.error("ERROR IN Game.render():", e);
            this.gameState = 'ERROR_STATE';
        }

        if (this.gameState !== 'ERROR_STATE') {
            requestAnimationFrame(this.gameLoop);
        } else {
//            console.error("Game in ERROR_STATE. Halting game loop.");
        }
    }

    calculateFormationPoints(centerX, centerY, units, formationType = 'HORIZONTAL') {
        const points = [];
        const aliveUnits = units ? units.filter(u => u.isAlive()) : [];
        const numUnits = aliveUnits.length;
        if (numUnits === 0) return points;
        if (numUnits === 1) {
            points.push({ x: centerX, y: centerY });
            return points;
        }

        const spacing = (CONFIG.RACCOON_SIZE * 2) * this.formationSpacingMultiplier;

        switch (formationType) {
            case 'VERTICAL': {
                const totalHeight = (numUnits - 1) * spacing;
                let startY = centerY - totalHeight / 2;
                for (let i = 0; i < numUnits; i++) {
                    points.push({ x: centerX, y: startY + i * spacing });
                }
                break;
            }

            case 'SQUARE': {
                const cols = 2;
                const numRows = Math.ceil(numUnits / cols);
                const totalHeight = (numRows - 1) * spacing;
                const startY = centerY - totalHeight / 2;

                for (let i = 0; i < numUnits; i++) {
                    const row = Math.floor(i / cols);
                    const col = i % cols;

                    const isLastRow = (row === numRows - 1);
                    const unitsInThisRow = (isLastRow && numUnits % cols !== 0) ? numUnits % cols : cols;

                    const totalWidth = (unitsInThisRow - 1) * spacing;
                    const startX = centerX - totalWidth / 2;

                    points.push({ x: startX + col * spacing, y: startY + row * spacing });
                }
                break;
            }

            case 'DIAMOND': {
                let rowsConfig;
                switch (numUnits) {
                    case 2: rowsConfig = [1, 1]; break;
                    case 3: rowsConfig = [1, 2]; break;
                    case 4: rowsConfig = [1, 2, 1]; break;
                    case 5: rowsConfig = [1, 2, 2]; break;
                    case 6: rowsConfig = [1, 2, 2, 1]; break;
                    case 7: rowsConfig = [1, 2, 2, 2]; break;
                    case 8: rowsConfig = [1, 2, 3, 2]; break; // Adjusted for a more diamond-like feel
                    default: rowsConfig = [numUnits]; break; // Fallback to a line
                }

                const totalHeight = (rowsConfig.length - 1) * spacing;
                const startY = centerY - totalHeight / 2;

                let unitIndex = 0;
                for (let row = 0; row < rowsConfig.length; row++) {
                    const unitsInRow = rowsConfig[row];
                    const totalWidth = (unitsInRow - 1) * spacing;
                    const startX = centerX - totalWidth / 2;
                    for (let col = 0; col < unitsInRow; col++) {
                        if (unitIndex < numUnits) {
                            points.push({ x: startX + col * spacing, y: startY + row * spacing });
                            unitIndex++;
                        }
                    }
                }
                break;
            }

            case 'HORIZONTAL':
            default: {
                const totalWidth = (numUnits - 1) * spacing;
                let startX = centerX - totalWidth / 2;
                for (let i = 0; i < numUnits; i++) {
                    points.push({ x: startX + i * spacing, y: centerY });
                }
                break;
            }
        }
        return points;
    }

    addVisualEffect(type, data) {
        if (type instanceof MuzzleFlashEffect || type instanceof BloodEffect || type instanceof SparkEffect || type instanceof WoodSplinterEffect || type instanceof LaserSightEffect) {
            this.visualEffects.push(type);
            return;
        }

        if (type === 'explosion' && data) {
            this.visualEffects.push(new ExplosionEffect(data.x, data.y, data.radius, this));
            return;
        }
        if (type === 'promotion' && data && data.unitId) {
            const unit = this.deployedSquadRoster && this.deployedSquadRoster.find(r => r.id === data.unitId);
            if (unit) {
                this.visualEffects.push(new PromotionEffect(unit.x, unit.y - unit.size - 10, this));
            }
            return;
        }
        if (type === 'extraction_zone' && data && data.obstacle) {
            this.visualEffects.push(new ExtractionZoneEffect(data.obstacle, this));
            return;
        }
        if (type === 'help_text' && data && data.parentUnit) {
            this.visualEffects.push(new HelpTextEffect(data.parentUnit, this));
            return;
        }
        if (type === 'blood' && data) {
            this.visualEffects.push(new BloodEffect(data.x, data.y, data.angle));
            return;
        }
        if (type === 'spark' && data) {
            this.visualEffects.push(new SparkEffect(data.x, data.y));
            return;
        }
        if (type === 'wood_splinter' && data) {
            this.visualEffects.push(new WoodSplinterEffect(data.x, data.y, data.angle));
            return;
        }
        if (type === 'muzzle_flash' && data) {
            this.visualEffects.push(new MuzzleFlashEffect(data.x, data.y, data.scale));
            return;
        }
        // --- MODIFICATION START: Corrected the pickup effect logic ---
        if (type === 'pickup' && data) {
            this.visualEffects.push(new PickupEffect(data.x, data.y, data.text, data.color, data.icon));
            return; // This was the missing statement
        }
        // --- MODIFICATION END ---
    }

    // --- SHOOTOUT MODE METHODS ---
    async startShootoutMode() {
        // Initialize shootout controller
        if (!this.shootoutController) {
            this.shootoutController = new ShootoutController(this);
            this.shootoutController.init();
        }

        // Preload unit assets (needed for possum_grunt sprites in Shootout mode)
        await this.preloadUnitAssets();

        // Set game state
        this.previousGameState = this.gameState;
        this.gameState = 'SHOOTOUT_PRE_GAME';
        
        // Play shootout music
        if (this.musicManager) {
            this.musicManager.onGameStateChange('SHOOTOUT_PRE_GAME');
        }

        // Show pre-game screen
        if (this.ui) {
            this.ui.showShootoutPreGameScreen();
        }
    }

    startShootoutRound(useCustomPositions = false) {
        if (!this.shootoutController) return;

        // Clear any existing game objects
        this.clearShootoutObjects();

        // Set game state
        this.gameState = 'SHOOTOUT_PLAYING';

        // Start the round (with optional custom positions from dev mode)
        this.shootoutController.startRound(useCustomPositions);

        // Show HUD
        if (this.ui) {
            this.ui.showShootoutHud();
        }
    }

    endShootoutRound() {
        if (!this.shootoutController) return;

        this.gameState = 'SHOOTOUT_GAME_OVER';
        this.shootoutController.endRound();
    }

    exitShootoutMode() {
        // Reset shootout controller
        if (this.shootoutController) {
            this.shootoutController.reset();
            // Disable dev mode if active
            if (this.shootoutController.isDevMode) {
                this.shootoutController.disableDevMode();
            }
        }

        // Clear shootout objects
        this.clearShootoutObjects();

        // Return to main menu
        this.gameState = 'MAIN_MENU';
        if (this.ui) {
            this.ui.showMainMenuScreen();
        }
    }

    returnToShootoutMenu() {
        // Reset shootout controller
        if (this.shootoutController) {
            this.shootoutController.reset();
            // Disable dev mode if active
            if (this.shootoutController.isDevMode) {
                this.shootoutController.disableDevMode();
            }
        }

        // Clear shootout objects
        this.clearShootoutObjects();

        // Return to shootout pre-game state
        this.gameState = 'SHOOTOUT_PRE_GAME';
        if (this.ui) {
            this.ui.showShootoutPreGameScreen();
        }
    }

    clearShootoutObjects() {
        // Clear any existing enemies from previous round
        this.enemies = [];
        this.enemyUnits = [];
        this.projectiles = [];
        this.visualEffects = [];
    }

    updateShootoutMode(deltaTime) {
        if (!this.shootoutController) return;
        this.shootoutController.update(deltaTime);
        // Note: Projectiles are handled by ShootoutTarget's visual bullet system, not real projectiles
    }

    renderShootoutMode(ctx) {
        if (!this.shootoutController) return;
        this.shootoutController.render(ctx);
    }
    // --- END SHOOTOUT MODE METHODS ---

    // --- SHOOTOUT AMBUSH INTEGRATION METHODS ---
    
    /**
     * Initialize shootout controller for ambush mode
     */
    initShootoutForAmbush() {
        if (!this.shootoutController) {
            this.shootoutController = new ShootoutController(this);
            this.shootoutController.init();
        }
    }

    /**
     * Check if an ambush should trigger based on random chance
     * @param {string} type - 'START' or 'EXTRACTION'
     * @returns {boolean}
     */
    shouldTriggerAmbush(type) {
        // Only trigger START ambush on 1st mission of each phase
        if (type === 'START' && this.currentMissionIndex !== 0) {
            return false;
        }
        if (this.currentPhaseIndex < CONFIG.SHOOTOUT_MODE.AMBUSH_UNLOCKS_PHASE) {
            return false;
        }
        const config = CONFIG.SHOOTOUT_MODE;
        const chance = type === 'START' 
            ? config.AMBUSH_START_CHANCE 
            : config.AMBUSH_EXTRACTION_CHANCE;
        
        return Math.random() < chance;
    }

    /**
     * Get a random background from ambush backgrounds
     * @returns {string}
     */
    getRandomAmbushBackground() {
        const backgrounds = CONFIG.SHOOTOUT_MODE.AMBUSH_BACKGROUNDS;
        return backgrounds[Math.floor(Math.random() * backgrounds.length)];
    }

    /**
     * Trigger an extraction ambush
     * @param {function} callback - Callback when ambush ends
     */
    triggerExtractionAmbush(callback) {
        if (!this.shouldTriggerAmbush('EXTRACTION')) {
            // No ambush, continue normally
            if (callback) callback(false);
            return;
        }

//        console.log('[Game] EXTRACTION AMBUSH TRIGGERED!');
        
        // Set flag so extraction doesn't proceed while ambush alert is showing
        this.ambushTriggered = true;
        
        // Initialize shootout controller if needed
        this.initShootoutForAmbush();
        
        // Get random background and night mode setting
        const background = this.getRandomAmbushBackground();
        const isNight = this.isNightMission && CONFIG.SHOOTOUT_MODE.AMBUSH_NIGHT_MODE_ENABLED;
        
        // Store previous game state
        this.previousGameState = this.gameState;

        // Pre-configure shootout with background and music BEFORE showing alert
        if (this.shootoutController) {
            this.shootoutController.setBackground(background);
            this.shootoutController.setNightMode(isNight);
            // Set game state to SHOOTOUT_AMBUSH so we render the shootout background behind alert
            this.gameState = 'SHOOTOUT_AMBUSH';
            // Crossfade from campaign music to ambush music
            if (this.musicManager) {
                this.musicManager.playMusic(this.musicManager.config.STATE_TRACKS.SHOOTOUT_AMBUSH || this.musicManager.config.STATE_TRACKS.SHOOTOUT_PLAYING, { fade: true, loop: true });
            }
        }

        const shootoutScoreEl = document.getElementById('shootoutScore');
        if (shootoutScoreEl) shootoutScoreEl.style.display = 'none';

        // Show ambush alert
        const game = this;
        const backgroundImagePath = CONFIG.SHOOTOUT_MODE.BACKGROUNDS[background]?.IMAGE;
        if (this.ui) {
            this.ui.showShootoutAmbushAlert('EXTRACTION_AMBUSH', function() {
                // Start the ambush
                game.shootoutController.startAmbush(background, isNight, function(result) {
                    // Ambush ended
//                    console.log('[Game] Extraction ambush ended with result:', result);
                    
                    // Handle ambush result (EXTRACTION type)
                    game.handleAmbushResult('EXTRACTION', result);
                    
                    // Return to campaign mode
                    if (callback) callback(result === 'VICTORY');
                });
            }, backgroundImagePath);
        }
    }

    /**
     * Check if all living raccoons are in an extraction zone
     * @returns {{ allInZone: boolean, anyInZone: boolean }}
     */
    checkRaccoonsInExtractionZone() {
        const extractionZones = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
        if (extractionZones.length === 0) return { allInZone: false, anyInZone: false };

        const livingRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [];
        if (livingRaccoons.length === 0) return { allInZone: false, anyInZone: false };

        let allInZone = true;
        let anyInZone = false;

        for (const raccoon of livingRaccoons) {
            let inZone = false;
            for (const zone of extractionZones) {
                if (raccoon.x >= zone.x && raccoon.x <= zone.x + zone.width &&
                    raccoon.y >= zone.y && raccoon.y <= zone.y + zone.height) {
                    inZone = true;
                    anyInZone = true;
                    break;
                }
            }
            if (!inZone) {
                allInZone = false;
                break;
            }
        }
        return { allInZone, anyInZone };
    }

    /**
     * Check if all living rescued hostages are in an extraction zone
     * @returns {boolean}
     */
    checkAllRescuedHostagesInExtractionZone() {
        const extractionZones = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
        if (extractionZones.length === 0) return false;

        const rescuedAndAliveHostages = (this.hostageUnits || []).filter(h => h.isRescued && h.isAlive());
        if (rescuedAndAliveHostages.length === 0) return true;

        for (const hostage of rescuedAndAliveHostages) {
            let inZone = false;
            for (const zone of extractionZones) {
                if (hostage.x >= zone.x && hostage.x <= zone.x + zone.width &&
                    hostage.y >= zone.y && hostage.y <= zone.y + zone.height) {
                    inZone = true;
                    break;
                }
            }
            if (!inZone) return false;
        }
        return true;
    }

    /**
     * Check if we are currently in an ambush
     * @returns {boolean}
     */
    isInAmbush() {
        if (this.ambushTriggered) return true;
        return this.shootoutController && this.shootoutController.isAmbushMode && this.shootoutController.isRoundActive;
    }

    /**
     * Handle player death during ambush
     */
    handleAmbushDefeat() {
        if (this.shootoutController && this.shootoutController.isAmbushMode) {
            this.shootoutController.endAmbush('defeat');
        }
    }

    isProjectileOrBird(obj) {
        return obj && (obj instanceof Projectile || obj instanceof GrenadeProjectile);
    }
}



window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
});