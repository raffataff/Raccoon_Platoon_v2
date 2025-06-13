class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasContainer = document.getElementById('canvas-container');
        this.ctx = this.canvas.getContext('2d');

        this.prerenderedBackgroundCanvas = document.createElement('canvas');
        this.prerenderedBackgroundCtx = this.prerenderedBackgroundCanvas.getContext('2d', { willReadFrequently: true });

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

        this.spatialGrid = null; 
        this.SPATIAL_GRID_CELL_SIZE = CONFIG.GRID_CELL_SIZE * 4; 
                                                                 
        this.projectilePool = new ObjectPool(Projectile, 50, this); // Initial size 50 for bullets
        this.grenadeProjectilePool = new ObjectPool(GrenadeProjectile, 10, this); // Initial size 10 for grenades

        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        this.fpsUpdateInterval = 1000; // milliseconds (update once per second)

        this.isDragging = false;
        this.draggedFarEnough = false;
        this.dragStartX = 0; this.dragStartY = 0;
        this.dragCurrentX = 0; this.dragCurrentY = 0;
        this.DRAG_THRESHOLD = CONFIG.INPUT_DRAG_THRESHOLD || 5;

        this.FORMATION_TYPES = ['HORIZONTAL', 'VERTICAL'];
        this.currentFormationIndex = 0;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        this.formationSpacingMultiplier = CONFIG.INITIAL_FORMATION_SPACING || 3.5;

        this.cameraX = 0; this.cameraY = 0;

        this.level = new Level(this);
        this.inputHandler = new InputHandler(this.canvas, this);
        this.ui = new UI(this);

        this.campaignRules = CAMPAIGN_RULES;
        this.campaignSeed = null;
        this.campaignSeedRNG = null; 
        this.currentPhaseSeedRNG = null; 
        this.currentMissionSeedRNG = null; 
        this.currentMissionSeed = null; 

        this.totalCampaignPhases = 0;
        this.campaignStructure = []; 

        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.currentMissionParams = null; 
        this.lastPlayedMusicKey = null;

        this.gameState = 'MAIN_MENU';
        this.previousGameState = null;

        this.missionEndDelayTimer = -1;
        this.MISSION_END_DELAY_SECONDS = 3.0;
        this.missionPendingOutcomeIsVictory = false;
        this.missionEndMessage = "";

        this.isGamePausedManually = false;

        this.isObjectiveComplete = false; 
        this.initialEnemyCount = 0;
        this.missionStartedAndPopulated = false;
        this.missionStartTime = 0;

        this.birdSpawnConfig = CONFIG.AMBIENT_EFFECTS ? CONFIG.AMBIENT_EFFECTS.FLYING_BIRD : null;
        this.nextBirdSpawnTime = 0;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);

        (async () => {
            await this.preloadAudioAssets();
            if (this.ui) {
                this.ui.showMainMenuScreen();
            }
            // Initialize lastFpsUpdateTime here, before the first gameLoop call
            this.lastFpsUpdateTime = performance.now(); 
            requestAnimationFrame(this.gameLoop); 
        })();
    }

    // --- NEW: Methods to get projectiles from pools ---
    getProjectileFromPool(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy) {
        const projectile = this.projectilePool.acquire();
        projectile.reset(startX, startY, targetX, targetY, damage, speed, color, shooterUnit, effectiveAccuracy);
        return projectile;
    }

    getGrenadeProjectileFromPool(startX, startY, targetX, targetY, shooterUnit) {
        const grenade = this.grenadeProjectilePool.acquire();
        grenade.reset(startX, startY, targetX, targetY, shooterUnit);
        return grenade;
    }
    // --- END NEW ---

    _weightedRandomSelect(items, rngInstance) {
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
        if (!templateString) return "";
        return templateString.replace(/{(\w+)}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    getLivingPlayerControlledUnits() {
        /* ... (Unchanged from previous complete version) ... */
        const livingRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [];
        const livingRescuedHostages = this.hostageUnits ? this.hostageUnits.filter(h => h.isRescued && h.isAlive()) : [];
        return [...livingRaccoons, ...livingRescuedHostages];
    }

    setNextBirdSpawnTimer(rngInstance = null) {
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
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
        await Promise.all(imagePromises);
    }

    async preloadUnitAssets() {
        /* ... (Unchanged from previous complete version) ... */
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
            }
        ];

        unitTypesToPreload.forEach(unitTypeConfig => {
            if (unitTypeConfig.basePath && unitTypeConfig.actions) {
                for (const actionKey in unitTypeConfig.actions) { 
                    unitTypeConfig.actions[actionKey].forEach(dir => {
                        const spriteKey = `${unitTypeConfig.name}_${actionKey}_${dir}`;
                        const spritePath = `${unitTypeConfig.basePath}${actionKey}/${spriteKey}.png`;

                        if (!this.preloadedImages[spriteKey]) { 
                            imagePromises.push(new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => { 
                                    this.preloadedImages[spriteKey] = img;  
                                    resolve(); 
                                };
                                img.onerror = () => { 
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
        // Add rescued kneeling sprites if they are different and you want to preload them
        // const rescuedHostageKneelingSprites = [ /* 'hostage_rescued_kneeling_s.png', ... */ ];

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
        /* ... (Unchanged from previous complete version) ... */
        const obstacleDefs = CONFIG.OBSTACLE_DEFINITIONS || [];
        const imagePromises = [];
        obstacleDefs.forEach(def => {
            let handledByDedicatedList = false;
            if ((def.type === 'decoration_grass' && CONFIG.GRASS_SPRITE_FILES) || (def.type === 'fence_barbed_straight_short' && CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES) || (def.type === 'fence_barbed_straight_long' && CONFIG.FENCE_BARBED_LONG_SPRITE_FILES) || (def.type === 'bush_medium' && CONFIG.BUSH_SPRITES_32PX_FILES) || (def.type === 'bush_large' && CONFIG.BUSH_SPRITES_64PX_FILES) || (def.type === 'rock_medium' && CONFIG.ROCK_SPRITES_32PX_FILES) || (def.type === 'rock_large' && CONFIG.ROCK_SPRITES_64PX_FILES) || (def.type === 'tree_palm_single' && CONFIG.PALM_TREE_SINGLE_SPRITE_FILES) || (def.type === 'tree_palm_double' && CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES) || (def.type === 'tree_palm_triple' && CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES) || (def.type === 'tree_palm_fallen' && CONFIG.PALM_TREE_FALLEN_SPRITE_FILES) || (def.type === 'pickup_health' && CONFIG.HEALTH_PICKUP_SPRITE_FILES) || (def.type === 'possum_hut' && CONFIG.POSSUM_HUT_SPRITE_FILES) ) {
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
        const listBasedSprites = [ { files: CONFIG.GRASS_SPRITE_FILES, path: CONFIG.GRASS_SPRITE_PATH, name: "grass" }, { files: CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES, path: CONFIG.FENCE_BARBED_SPRITE_PATH, name: "fence_barbed_straight_short" }, { files: CONFIG.FENCE_BARBED_LONG_SPRITE_FILES, path: CONFIG.FENCE_BARBED_SPRITE_PATH, name: "fence_barbed_straight_long" }, { files: CONFIG.BUSH_SPRITES_32PX_FILES, path: CONFIG.BUSH_SPRITES_32PX_PATH, name: "bush32" }, { files: CONFIG.BUSH_SPRITES_64PX_FILES, path: CONFIG.BUSH_SPRITES_64PX_PATH, name: "bush64" }, { files: CONFIG.ROCK_SPRITES_32PX_FILES, path: CONFIG.ROCK_SPRITES_32PX_PATH, name: "rock32" }, { files: CONFIG.ROCK_SPRITES_64PX_FILES, path: CONFIG.ROCK_SPRITES_64PX_PATH, name: "rock64" }, { files: CONFIG.PALM_TREE_SINGLE_SPRITE_FILES, path: CONFIG.PALM_TREE_SINGLE_SPRITE_PATH, name: "palm_single" }, { files: CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES, path: CONFIG.PALM_TREE_DOUBLE_SPRITE_PATH, name: "palm_double" }, { files: CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES, path: CONFIG.PALM_TREE_TRIPLE_SPRITE_PATH, name: "palm_triple" }, { files: CONFIG.PALM_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM_TREE_FALLEN_SPRITE_PATH, name: "palm_fallen" }, { files: CONFIG.HEALTH_PICKUP_SPRITE_FILES, path: CONFIG.HEALTH_PICKUP_SPRITE_PATH, name: "pickup_health" }, { files: CONFIG.POSSUM_HUT_SPRITE_FILES, path: CONFIG.POSSUM_HUT_SPRITE_PATH, name: "possum_hut" } ];
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
        /* ... (Unchanged from previous complete version) ... */
        if (CONFIG.AUDIO_ASSETS && this.audioManager) {
            for (const key in CONFIG.AUDIO_ASSETS) {
                const asset = CONFIG.AUDIO_ASSETS[key];
                if (typeof asset === 'object' && asset !== null && asset.hasOwnProperty('path')) {
                    this.audioManager.addSoundToLoadQueue(key, asset.path, asset.defaultVolume);
                }
            }
            await this.audioManager.loadAllSounds(
                (loaded, total, key, error) => {},
                () => {}
            );
        } else {
        }
    }

    generatePrerenderedBackground(worldWidth, worldHeight, seedForBackground) {
        /* ... (Unchanged from previous complete version) ... */
        this.prerenderedBackgroundCanvas.width = worldWidth;
        this.prerenderedBackgroundCanvas.height = worldHeight;
        const ctx = this.prerenderedBackgroundCtx;
        const localRng = new SeededRandom(seedForBackground); 

        ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
        ctx.fillRect(0, 0, worldWidth, worldHeight);

        if (CONFIG.GRASS_SPRITE_FILES && CONFIG.GRASS_SPRITE_FILES.length > 0 && CONFIG.GRASS_SPRITE_PATH) {
            const configuredTileSize = CONFIG.WORLD_GRASS_TILE_SIZE || 64;
            const overlapFactor = CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR !== undefined ? CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR : 0.2;
            const stepX = configuredTileSize * (1 - overlapFactor);
            const stepY = configuredTileSize * (1 - overlapFactor);

            for (let y = -configuredTileSize * overlapFactor; y < worldHeight; y += stepY) {
                for (let x = -configuredTileSize * overlapFactor; x < worldWidth; x += stepX) {
                    const randomSpriteName = localRng.pickFrom(CONFIG.GRASS_SPRITE_FILES); 
                    const spritePath = CONFIG.GRASS_SPRITE_PATH + randomSpriteName;
                    const grassImg = this.preloadedImages[spritePath];

                    if (grassImg) {
                        const offsetX = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5; 
                        const offsetY = (localRng.next() - 0.5) * configuredTileSize * overlapFactor * 0.5; 
                        const drawX = x + offsetX;
                        const drawY = y + offsetY;
                        ctx.drawImage(grassImg, drawX, drawY, configuredTileSize, configuredTileSize);
                    }
                }
            }
        }
        const testPixel = this.prerenderedBackgroundCtx.getImageData(Math.floor(this.prerenderedBackgroundCanvas.width / 2), Math.floor(this.prerenderedBackgroundCanvas.height / 2), 1, 1).data;
    }

    start() {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.masterRoster || this.masterRoster.length === 0) {
            this.initializeNewCampaign();
            if (!this.masterRoster || this.masterRoster.length === 0) {
                this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); return;
            }
        }
        if (this.getAvailableRecruits().length === 0 && this.masterRoster.length > 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS'; if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.ERROR_NO_INITIAL_RECRUITS); return;
        }

        if (this.generateAndSetCurrentMissionParams(this.currentPhaseIndex, this.currentMissionIndex)) {
            const currentPhaseData = this.campaignStructure[this.currentPhaseIndex];
            if (this.ui && currentPhaseData && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(currentPhaseData, this.currentMissionParams, this.getAvailableRecruits());
                this.gameState = 'PRE_MISSION_SELECT';
            } else {
                this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen();
            }
        } else {
            this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); alert(CONFIG.UI_TEXT_STRINGS.ERROR_LOAD_FIRST_MISSION_FAILED);
        }
    }

    async confirmSquadAndStartMission(selectedRecruitsForDeployment) {
        /* ... (Unchanged, but note that spatialGrid initialization is already there) ... */
        const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
        if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0 || selectedRecruitsForDeployment.length > maxSquadSize) {
            let alertMsg = (CONFIG.UI_TEXT_STRINGS.INVALID_SQUAD_SIZE_ALERT || "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString());
            if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0) { alertMsg = CONFIG.UI_TEXT_STRINGS.NO_RECRUITS_SELECTED_ALERT || "Select at least one Raccoon for the mission!"; }
            else if (selectedRecruitsForDeployment.length > maxSquadSize) { alertMsg = (CONFIG.UI_TEXT_STRINGS.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString());}
            alert(alertMsg);
            const currentPhaseDataForUI = this.campaignStructure[this.currentPhaseIndex] || 
                                          { name: "Phase Error", introduction: "Could not load phase details."};
            if (this.ui && currentPhaseDataForUI && this.currentMissionParams) { 
                this.ui.showPreMissionScreen_RecruitSelect( currentPhaseDataForUI, this.currentMissionParams, this.getAvailableRecruits() ); 
            }
            return;
        }
        this.gameState = 'LOADING_MISSION';
        if (this.ui && typeof this.ui.showLoadingScreen === 'function') { this.ui.showLoadingScreen("Preparing battlefield..."); } else { console.log("Loading mission..."); }

        await this.preloadLevelAssets();
        await this.preloadUnitAssets();
        await this.preloadMiscAssets();

        const musicSelectionRNG = this.currentMissionSeedRNG || this.campaignSeedRNG || new SeededRandom(Date.now());

        this.audioManager.stopAllLoopingSounds();
        const musicKeys = CONFIG.AUDIO_ASSETS.AMBIENT_MUSIC_TROPICAL_TROPICAL_KEYS;
        if (musicKeys && musicKeys.length > 0) {
            const randomMusicKey = musicSelectionRNG.pickFrom(musicKeys); 
            if (this.audioManager.sounds[randomMusicKey] && this.audioManager.sounds[randomMusicKey].loaded) {
                this.audioManager.play(randomMusicKey, { loop: true, volume: CONFIG.AUDIO_ASSETS[randomMusicKey]?.defaultVolume || 0.35 });
                this.lastPlayedMusicKey = randomMusicKey;
            } else {
            }
        }

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
        });

        this.isObjectiveComplete = false; 
        this.missionStartedAndPopulated = false;
        this.fallenRaccoonsThisMission = [];
        this.missionStartTime = performance.now();
        this.hostageUnits = []; 

        const worldWidth = (CONFIG.BASE_WORLD_WIDTH || 1000) * (this.currentMissionParams.baseParams.worldSizeFactor || 1);
        const worldHeight = (CONFIG.BASE_WORLD_HEIGHT || 800) * (this.currentMissionParams.baseParams.worldSizeFactor || 1);
        CONFIG.WORLD_WIDTH = worldWidth; CONFIG.WORLD_HEIGHT = worldHeight;
        
        if (this.spatialGrid) {
            this.spatialGrid.clear(); 
        }
        this.spatialGrid = new SpatialGrid(worldWidth, worldHeight, this.SPATIAL_GRID_CELL_SIZE, this); 


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
            const exterminateObj = this.currentMissionParams.objectives.find(obj => obj.type === "EXTERMINATE");
            if (exterminateObj) {
                // Set the initial total based on enemies present at mission start
                exterminateObj.totalToAchieve = this.initialEnemyCount;
                exterminateObj.currentProgress = 0; 
            }
        }

        this.level.obstacles.forEach(obs => {
            if (obs.blocksMovement || obs.providesCover || obs.isPickup || obs.type === 'extraction_zone') { 
                this.spatialGrid.addObject(obs);
            }
        });
        this.deployedSquadRoster.forEach(unit => this.spatialGrid.addObject(unit));
        this.enemyUnits.forEach(unit => this.spatialGrid.addObject(unit)); // Enemies spawned by Level are added here
        this.hostageUnits.forEach(unit => this.spatialGrid.addObject(unit)); // Hostages spawned by Level

        this.deployedSquadRoster.forEach((raccoon, index) => {
            if (playerSpawnLocations[index]) { raccoon.x = playerSpawnLocations[index].x; raccoon.y = playerSpawnLocations[index].y; raccoon.worldTargetX = raccoon.x; raccoon.worldTargetY = raccoon.y; raccoon.game = this;}
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
            
            this.cameraX = avgX - (this.canvas.width / 2);
            this.cameraY = avgY - (this.canvas.height / 2);
            
            this.clampCamera(); 
            
        } else { 
            this.cameraX = (CONFIG.WORLD_WIDTH - this.canvas.width) / 2; 
            this.cameraY = (CONFIG.WORLD_HEIGHT - this.canvas.height) / 2; 
            this.clampCamera(); 
        }

        this.gameState = 'RUNNING';

        if (this.ui && typeof this.ui.hideLoadingScreen === 'function') { this.ui.hideLoadingScreen(); }
        if (this.ui) { this.ui.hidePreMissionScreen(); this.ui.showHUD(); this.ui.updateObjective(); this.ui.updateFormationButton(this.currentFormationType); } 
        if (this.inputHandler) { this.inputHandler.isLMBHoldFiringActionActive = false; this.inputHandler.updateMouseCursor(); }

        this.lastTime = performance.now();
        this.setNextBirdSpawnTimer(this.level.rng); 
        this.missionEndDelayTimer = -1;
        this.missionPendingOutcomeIsVictory = false;
    }

    incrementObjectiveEnemyCount(count = 1) {
        if (this.currentMissionParams && this.currentMissionParams.objectives) {
            const exterminateObj = this.currentMissionParams.objectives.find(obj => obj.type === "EXTERMINATE");
            if (exterminateObj) {
                if (exterminateObj.totalToAchieve === undefined) { // Should have been set at mission start
                    exterminateObj.totalToAchieve = 0;
                }
                exterminateObj.totalToAchieve += count;
                // No need to update this.initialEnemyCount here, as that's for the start state.
                // The objective UI will reflect the new totalToAchieve.
                if (this.ui && this.gameState === 'RUNNING') {
                    this.ui.updateObjective();
                }
            }
        }
    }

    handleLMBFireActionStart(worldX, worldY) {
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
        if (!this.selectedUnits || this.selectedUnits.length === 0) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAlive() && unit.isPlayerDirectFiring) {
                unit.playerDirectFireTargetPos = { x: worldX, y: worldY };
            }
        });
    }

    handleLMBFireActionEnd() {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.selectedUnits) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon) {
                unit.isPlayerDirectFiring = false;
            }
        });
        if (this.ui) this.ui.updateSquadPanel();
    }

    handleSetManualTargetCommand(enemyUnit) {
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        if (this.inputHandler.isLMBHoldFiringActionActive) { this.handleLMBFireActionEnd(); this.inputHandler.isLMBHoldFiringActionActive = false; }

        let didCancelGrenade = false;
        if (this.selectedUnits) this.selectedUnits.forEach(u => { if (u instanceof Raccoon && u.isAimingGrenade) { u.cancelGrenadeAim(); didCancelGrenade = true; }});
        if(didCancelGrenade) { if(this.inputHandler) this.inputHandler.updateMouseCursor(); return; }

        if (this.selectedUnits && this.selectedUnits.length > 0) {
            const formationPoints = this.calculateFormationPoints(worldX, worldY, this.selectedUnits, this.currentFormationType);
            this.selectedUnits.forEach((unit, index) => {
                if (unit.isAlive() && unit.team === 'player') {
                    const targetPoint = formationPoints[index] || {x:worldX, y:worldY};
                    unit.setMoveTarget(targetPoint.x, targetPoint.y); 
                }
            });
        }
        if(this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    togglePause() {
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState === 'RUNNING') {
            this.previousGameState = this.gameState;
            this.gameState = 'PAUSED';
            this.isGamePausedManually = true;
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.ui) this.ui.showPauseMenuScreen();
        } else if (this.gameState === 'PAUSED' && this.isGamePausedManually) {
            this.gameState = this.previousGameState || 'RUNNING';
            this.isGamePausedManually = false;
            if (this.ui) this.ui.hidePauseMenuScreen();
            this.lastTime = performance.now(); 
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    restartCurrentMission() {
        /* ... (Unchanged from previous complete version) ... */
        if (this.currentMissionParams && this.getAvailableRecruits().length > 0) {
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.generateAndSetCurrentMissionParams(this.currentPhaseIndex, this.currentMissionIndex)) {
                const currentPhaseData = this.campaignStructure[this.currentPhaseIndex];
                if (this.ui && currentPhaseData && this.currentMissionParams) {
                    this.gameState = 'PRE_MISSION_SELECT';
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
        /* ... (Unchanged from previous complete version) ... */
        this.audioManager.stopAllLoopingSounds();
        this.lastPlayedMusicKey = null;
        this.gameState = 'MAIN_MENU';
        this.missionStartedAndPopulated = false;
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
            this.ui.showMainMenuScreen();
        }
    }

    initializeNewCampaign() {
        /* ... (Unchanged from previous complete version) ... */
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

        this.campaignSeed = this.campaignRules.PLAYER_STARTING_SEED !== undefined ?
            this.campaignRules.PLAYER_STARTING_SEED : Date.now();
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
        /* ... (Unchanged from previous complete version) ... */
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
                missionsInPhase: this.currentPhaseSeedRNG.nextInt(phaseRules.MISSIONS_PER_PHASE_RANGE[0], phaseRules.MISSIONS_PER_PHASE_RANGE[1])
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

        this.campaignStructure[phaseIdx] = {
            phaseNum: phaseIdx,
            name: phaseName,
            biome: selectedBiomeEntry.name,
            biomeDescription: selectedBiomeEntry.description,
            introduction: phaseIntro,
            conclusion: "",
            missionsInPhase: this.currentPhaseSeedRNG.nextInt(phaseRules.MISSIONS_PER_PHASE_RANGE[0], phaseRules.MISSIONS_PER_PHASE_RANGE[1])
        };
    }

    getAvailableRecruits() {
        /* ... (Unchanged from previous complete version) ... */
        return this.masterRoster.filter(r => r.isAlive());
    }

    resizeCanvas() {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.canvasContainer) this.canvasContainer = document.getElementById('canvas-container');
        if (!this.canvasContainer) return;
        const containerWidth = this.canvasContainer.offsetWidth; const containerHeight = this.canvasContainer.offsetHeight;
        this.canvas.width = Math.max(CONFIG.MIN_CANVAS_WIDTH || 800, containerWidth);
        this.canvas.height = Math.max(CONFIG.MIN_CANVAS_HEIGHT || 600, containerHeight);
        if (this.gameState === 'RUNNING') this.clampCamera();
    }

    clampCamera() {
        /* ... (Unchanged from previous complete version) ... */
        const worldWidth = CONFIG.WORLD_WIDTH || 0; 
        const worldHeight = CONFIG.WORLD_HEIGHT || 0;
        const canvasWidth = this.canvas.width || 0;
        const canvasHeight = this.canvas.height || 0;

        const maxX = Math.max(0, worldWidth - canvasWidth);
        const maxY = Math.max(0, worldHeight - canvasHeight);

        this.cameraX = Math.max(0, Math.min(this.cameraX, maxX));
        this.cameraY = Math.max(0, Math.min(this.cameraY, maxY));
    }
    
    generateAndSetCurrentMissionParams(phaseIdx, missionIdx) {
        /* ... (Unchanged from previous complete version) ... */
        const missionSpecificSeedValue = this.campaignSeed + (phaseIdx * 1000) + (missionIdx * 10);
        this.currentMissionSeedRNG = new SeededRandom(missionSpecificSeedValue);
        this.currentMissionSeed = missionSpecificSeedValue;

        if (!this.campaignStructure[phaseIdx]) {
            this._generatePhaseStructure(phaseIdx);
        }
        const currentPhaseInfo = this.campaignStructure[phaseIdx];
        if (!currentPhaseInfo) {
            this.currentMissionParams = null;
            return false;
        }
        const phaseBiome = currentPhaseInfo.biome;

        this.currentMissionParams = {
            baseParams: {},
            objectives: [] 
        }; 
        const baseP = this.currentMissionParams.baseParams;
        const objectivesArray = this.currentMissionParams.objectives;

        const baseParamsRules = this.campaignRules.BASE_PARAMETERS;
        const briefingParts = this.campaignRules.BRIEFING_PARTS;

        for (const key in baseParamsRules) {
            const rule = baseParamsRules[key];
            let value = rule.initial + (rule.perPhaseIncrement * phaseIdx);
            if (rule.max !== undefined) value = Math.min(value, rule.max);
            
            let randomnessRange = value * rule.randomnessFactor;
            value += this.currentMissionSeedRNG.nextFloat(-randomnessRange, randomnessRange);
            
            if (rule.max !== undefined) value = Math.min(value, rule.max);

            if (rule.roundToInt) value = Math.round(value);
            if (key.startsWith("num") || key.startsWith("min")) value = Math.max(0, value);
            
            baseP[key] = value;
        }
        
        let primaryObjectiveSelected = false;
        const objectivesInPool = [...this.campaignRules.OBJECTIVE_POOL]; 
        this.currentMissionSeedRNG.shuffleArray(objectivesInPool); 

        for (const objDef of objectivesInPool) {
            if ((objDef.isPrimary === undefined || objDef.isPrimary) && objDef.unlocksPhase <= phaseIdx && objDef.type !== "EXTERMINATE") { // Don't pick EXTERMINATE as initial primary here
                const newObjective = this._instantiateObjective(objDef, phaseIdx, true);
                if (newObjective) {
                    objectivesArray.push(newObjective);
                    primaryObjectiveSelected = true;
                    break; 
                }
            }
        }
        
        const exterminateDef = this.campaignRules.OBJECTIVE_POOL.find(o => o.type === "EXTERMINATE");
        if (exterminateDef) {
            const isExterminateNowPrimary = !primaryObjectiveSelected; // If no other primary was found, EXTERMINATE becomes it
            const newExterminateObjective = this._instantiateObjective(exterminateDef, phaseIdx, isExterminateNowPrimary);
            if (newExterminateObjective) {
                 objectivesArray.push(newExterminateObjective);
                 if(isExterminateNowPrimary) primaryObjectiveSelected = true; // Mark that a primary is now set
            }
        }

        // If still no primary (should not happen if EXTERMINATE is in pool), log error or default.
        if (!primaryObjectiveSelected && objectivesArray.length === 0 && exterminateDef) {
             console.warn("No primary objective selected, and EXTERMINATE somehow wasn't added. Forcing EXTERMINATE as primary.");
             const forcedExterminate = this._instantiateObjective(exterminateDef, phaseIdx, true);
             if (forcedExterminate) objectivesArray.push(forcedExterminate);
        }
        
        // TODO: Add logic for selecting additional secondary objectives based on numSecondaryObjectivesRange and canCoexistWith
        
        const missionNameParts = this.campaignRules.MISSION_NAME_PARTS;
        const biomeEntryForName = this.campaignRules.BIOME_POOL.find(b => b.name === phaseBiome) || {themeAdjectives: ["General"]};
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
            const primaryObj = objectivesArray.find(obj => obj.isPrimary);
            if (primaryObj) {
                combinedObjectiveDescription = this._getObjectiveDescriptionForBriefing(primaryObj, baseP) + ".";
            }
            objectivesArray.forEach(obj => {
                if (!obj.isPrimary) { // Only add secondary objectives here if they weren't the primary
                    if(primaryObj && obj.type === primaryObj.type) return; // Avoid repeating if EXTERMINATE was primary and is also listed as secondary
                    combinedObjectiveDescription += " Additionally, " + this._getObjectiveDescriptionForBriefing(obj, baseP).toLowerCase() + ".";
                }
            });
        } else {
            combinedObjectiveDescription = "secure the area"; 
        }

        const briefingTemplate = this.currentMissionSeedRNG.pickFrom(this.campaignRules.MISSION_BRIEFING_TEMPLATES);
        const biomeAdjForBriefing = this.currentMissionSeedRNG.pickFrom(briefingParts.BIOME_ADJECTIVES[phaseBiome] || briefingParts.BIOME_ADJECTIVES["TROPICAL"] || ["unknown"]);
        const locationNounForBriefing = this.currentMissionSeedRNG.pickFrom(briefingParts.LOCATION_NOUNS[phaseBiome] || briefingParts.LOCATION_NOUNS["TROPICAL"] || ["the area"]);

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

        this.tempSelectedForDeployment = []; 
        return true;
    }

    _getObjectiveDescriptionForBriefing(objectiveInstance, baseParams) {
        /* ... (Unchanged from previous complete version) ... */
        let desc = `Objective type ${objectiveInstance.type} not fully described.`; 
        const uiTextStrings = CONFIG.UI_TEXT_STRINGS;
        const templateKey = objectiveInstance.descriptionTemplateKey;
    
        if (templateKey && uiTextStrings[templateKey]) {
            desc = uiTextStrings[templateKey].split(':')[0].trim(); // Get the part before colon
            
            const templateData = {
                TARGET_NAME_PLURAL: objectiveInstance.targetNamePlural || "targets",
                TARGET_NAME_SINGULAR: objectiveInstance.targetNameSingular || "target",
                TOTAL_SPAWNED: objectiveInstance.totalToAchieve, // For rescue, totalToAchieve is numHostagesToSpawn
                MIN_TO_EVAC: objectiveInstance.minToAchieveForCompletion 
            };
            desc = this._fillTextTemplate(desc, templateData);

            if (objectiveInstance.type === "DESTROY_TARGET" && objectiveInstance.totalToAchieve > 0) {
                 desc += ` (${objectiveInstance.totalToAchieve})`;
            } else if (objectiveInstance.type === "RESCUE_HOSTAGES") {
                desc += ` (${objectiveInstance.totalToAchieve} to find, min ${objectiveInstance.minToAchieveForCompletion} to evac)`;
            }
        } else if (objectiveInstance.type === "EXTERMINATE") {
            desc = "eliminate all Possums";
        }
        return desc;
    }
    

    _instantiateObjective(objDef, phaseIdx, isPrimary) {
        /* ... (Unchanged from previous complete version) ... */
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
            statusText: "" 
        };

        if (objDef.type === "DESTROY_TARGET") {
            const availableTargetTypes = this.campaignRules.DESTROY_TARGET_TYPE_POOL.filter(t => t.unlocksPhase <= phaseIdx);
            if (availableTargetTypes.length === 0) return null; 

            const selectedTargetType = this._weightedRandomSelect(availableTargetTypes, this.currentMissionSeedRNG);
            if (!selectedTargetType) return null;

            newObj.targetTypeKey = selectedTargetType.targetTypeKey;
            newObj.targetNameSingular = selectedTargetType.nameSingular;
            newObj.targetNamePlural = selectedTargetType.namePlural;
            newObj.totalToAchieve = Math.max(1, Math.round(baseP.numDestroyTargets)); 
        } else if (objDef.type === "RESCUE_HOSTAGES") {
            newObj.totalToAchieve = Math.max(1, Math.round(baseP.numHostagesToSpawn)); 
            newObj.minToAchieveForCompletion = Math.max(1, Math.round(baseP.minHostagesToRescue));
            newObj.currentEvacuated = 0; // Initialize for UI
        } else if (objDef.type === "EXTERMINATE") {
            newObj.totalToAchieve = 0; 
        }
        return newObj;
    }


    recordRaccoonFallen(raccoon) {
        /* ... (Unchanged from previous complete version) ... */
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
        /* ... (Unchanged from previous complete version) ... */
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
        const newRecruitId = `RCN-MR${this.masterRoster.length + this.fallenRaccoonsGlobal.length + 1}-${rosterRng.nextInt(1000,9999)}`;
        this.masterRoster.push(new Raccoon(0, 0, this, newRecruitId, faceImageUrl, raccoonName));
    }

    initiateMissionEnd(isVictory) {
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT' || this.gameState === 'POST_MISSION_DEBRIEF') {
            return;
        }
        if (this.inputHandler.isLMBHoldFiringActionActive) {
            this.handleLMBFireActionEnd();
            this.inputHandler.isLMBHoldFiringActionActive = false;
        }

        this.missionPendingOutcomeIsVictory = isVictory;
        this.missionEndDelayTimer = this.MISSION_END_DELAY_SECONDS;
        this.gameState = isVictory ? 'MISSION_ENDING_VICTORY' : 'MISSION_ENDING_DEFEAT';

        if (isVictory) {
            this.missionEndMessage = CONFIG.UI_TEXT_STRINGS.POST_MISSION_SUCCESS || "MISSION SUCCESSFUL!";
        } else {
            this.missionEndMessage = CONFIG.UI_TEXT_STRINGS.POST_MISSION_FAILED || "MISSION FAILED!";
        }
    }

    actuallyEndMission(isVictory) {
        /* ... (Unchanged from previous complete version) ... */
        if (this.inputHandler.isLMBHoldFiringActionActive) {
            this.handleLMBFireActionEnd();
            this.inputHandler.isLMBHoldFiringActionActive = false;
        }
        this.deployedSquadRoster.forEach(unit => {
            if (unit instanceof Raccoon) {
                unit.isPlayerDirectFiring = false;
            }
        });

        this.audioManager.stopAllLoopingSounds();
        this.lastPlayedMusicKey = null;
        this.gameState = 'POST_MISSION_DEBRIEF';
        this.missionEndMessage = "";
        const missionDuration = (performance.now() - this.missionStartTime) / 1000;
        let enemiesKilledThisMission = this.enemyUnits ? this.enemyUnits.filter(e => !e.isAlive()).length : 0;

        if (isVictory) {
            const survivalXp = CONFIG.XP_PER_MISSION_SURVIVED || 0;
            if (survivalXp > 0 && this.deployedSquadRoster) {
                this.deployedSquadRoster.forEach(r => { if (r.isAlive()) r.addXp(survivalXp); });
            }
            const recruitsToAdd = CONFIG.NEW_RECRUITS_PER_MISSION_WIN || 0;
            const maxRoster = CONFIG.MAX_TOTAL_ROSTER_SIZE || Infinity;
            for (let i = 0; i < recruitsToAdd && this.masterRoster.length < maxRoster; i++) this.addNewRecruitToMasterRoster();
        }

        let newlyRecruitedFromMission = 0;
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
                        newRecruit.applyRankBonuses(true);
                        newRecruit.updateXpToNextRank();

                        if (this.masterRoster.length < (CONFIG.MAX_TOTAL_ROSTER_SIZE || 20)) {
                            this.masterRoster.push(newRecruit);
                            newlyRecruitedFromMission++;
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
            hostagesRecruitedCount: newlyRecruitedFromMission
        };

        if (this.ui) {
            this.ui.hideHUD();
            this.ui.showPostMissionScreen_Debrief(debriefData);
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
        this.missionEndDelayTimer = -1;
        this.hostageUnits = [];
    }

    proceedToNextLogicalStep() {
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState === 'CAMPAIGN_COMPLETE') {
            if (this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.CAMPAIGN_ALREADY_COMPLETE, true); return;
        }
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
                    objectives: [{type: "CAMPAIGN_WON", isComplete: true, descriptionTemplateKey:"OBJECTIVE_CAMPAIGN_WON_TEXT", isPrimary: true}],
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
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        this.currentFormationIndex = (this.currentFormationIndex + 1) % this.FORMATION_TYPES.length;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        if(this.ui) this.ui.updateFormationButton(this.currentFormationType);
    }

    setFormationSpacing(multiplier) {
        /* ... (Unchanged from previous complete version) ... */
        if (this.gameState === 'RUNNING') this.formationSpacingMultiplier = parseFloat(multiplier);
    }

    selectUnitsInCtrlDragRectangle() {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.draggedFarEnough || this.gameState !== 'RUNNING') return;
        const worldDragStartX = this.dragStartX + this.cameraX;
        const worldDragStartY = this.dragStartY + this.cameraY;
        const worldDragCurrentX = this.dragCurrentX + this.cameraX;
        const worldDragCurrentY = this.dragCurrentY + this.cameraY;

        const selectionRectX = Math.min(worldDragStartX, worldDragCurrentX);
        const selectionRectY = Math.min(worldDragStartY, worldDragCurrentY);
        const selectionRectWidth = Math.abs(worldDragCurrentX - worldDragStartX);
        const selectionRectHeight = Math.abs(worldDragCurrentY - worldDragStartY);
        let newlySelectedUnits = [];
        if(this.deployedSquadRoster) this.deployedSquadRoster.forEach(unit => {
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
        /* ... (Unchanged from previous complete version) ... */
        if (this.selectedUnits.length === 0) return;
        let aimingCancelled = false;
        if(this.selectedUnits) this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
        this.selectedUnits = [];
        if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
        if (this.inputHandler) this.inputHandler.updateMouseCursor(); else if (this.ui) this.ui.setCursor('default');
    }

    selectAllPlayerUnits() {
        /* ... (Unchanged from previous complete version) ... */
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

    addProjectile(projectile) { // This method now just adds to gameObjects and spatialGrid
        this.gameObjects.push(projectile);
        if (this.spatialGrid && projectile) {
            this.spatialGrid.addObject(projectile);
        }
    }

    addVisualEffect(type, data) {
        /* ... (Unchanged from previous complete version) ... */
        if (type === 'explosion' && data && data.x !== undefined && data.y !== undefined && data.radius !== undefined) {
            this.visualEffects.push(new ExplosionEffect(data.x, data.y, data.radius, this));
        } else if (type === 'promotion' && data && data.unitId) {
            const unit = this.deployedSquadRoster && this.deployedSquadRoster.find(r => r.id === data.unitId);
            if (unit) {
                this.visualEffects.push(new PromotionEffect(unit.x, unit.y - unit.size - 10, this));
            }
        } else if (type === 'extraction_zone' && data && data.obstacle) {
            this.visualEffects.push(new ExtractionZoneEffect(data.obstacle, this));
        }
    }

    checkMissionStatus() {
        if (this.gameState !== 'RUNNING' || !this.missionStartedAndPopulated || !this.currentMissionParams || !this.currentMissionParams.objectives) {
            return;
        }
    
        let allMandatoryObjectivesComplete = true; 
        let hasMandatoryObjectives = false;       
    
        this.currentMissionParams.objectives.forEach(obj => {
            if (!obj.isComplete) {
                if (obj.type === 'EXTERMINATE') {
                    obj.currentProgress = this.enemyUnits ? this.enemyUnits.filter(e => !e.isAlive()).length : 0;
                    // totalToAchieve is now dynamic and updated by incrementObjectiveEnemyCount
                    if (obj.totalToAchieve > 0 && obj.currentProgress >= obj.totalToAchieve) { 
                        obj.isComplete = true;
                    } else if (obj.totalToAchieve === 0 && (!this.enemyUnits || this.enemyUnits.every(e => !e.isAlive()))) { 
                        // This case handles scenarios where total might be 0 if no initial enemies
                        // AND no hut ever spawns anything (or all spawned are killed).
                        obj.isComplete = true;
                    }
                } else if (obj.type === 'DESTROY_TARGET') {
                    // ... (DESTROY_TARGET logic unchanged)
                    obj.currentProgress = this.level.missionTargetObstacles ? 
                                          this.level.missionTargetObstacles.filter(t => t.type === obj.targetTypeKey && t.isDestroyed && t.objectiveId === obj.id).length : 0;
                    if (obj.currentProgress >= obj.totalToAchieve) {
                        obj.isComplete = true;
                    }
                } else if (obj.type === 'RESCUE_HOSTAGES') {
                    // ... (RESCUE_HOSTAGES logic unchanged)
                    const rescuedAndAliveHostages = this.hostageUnits ? this.hostageUnits.filter(h => h.isRescued && h.isAlive()) : [];
                    obj.currentProgress = rescuedAndAliveHostages.length; 
                    obj.minToAchieveForCompletion = obj.minToAchieveForCompletion || 1; 

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
                    const primaryExterminateObjective = this.currentMissionParams.objectives.find(o => o.type === "EXTERMINATE" && o.isPrimary);
                    if (primaryExterminateObjective) {
                        enemiesClearedForThisRescue = primaryExterminateObjective.isComplete;
                    } else { 
                        enemiesClearedForThisRescue = this.enemyUnits.every(e => !e.isAlive());
                    }

                    if (obj.currentProgress >= obj.minToAchieveForCompletion && 
                        hostagesAtEvacCount >= obj.minToAchieveForCompletion &&
                        playerRaccoonInZone && 
                        enemiesClearedForThisRescue) {
                        obj.isComplete = true;
                    }
                }
            } 
    
            let isThisObjectiveMandatory = obj.isPrimary;
            if (obj.type === "EXTERMINATE") { 
                isThisObjectiveMandatory = true;
            }

            if (isThisObjectiveMandatory) {
                hasMandatoryObjectives = true;
                if (!obj.isComplete) {
                    allMandatoryObjectivesComplete = false;
                }
            }
        }); 
    
        if (!hasMandatoryObjectives && this.currentMissionParams.objectives.length > 0) {
            allMandatoryObjectivesComplete = this.currentMissionParams.objectives.every(obj => obj.isComplete);
        } else if (this.currentMissionParams.objectives.length === 0) {
            allMandatoryObjectivesComplete = true; 
        }

        const livingPlayerRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()).length : 0;
        if (livingPlayerRaccoons === 0 && this.deployedSquadRoster.length > 0) {
            if (this.gameState === 'RUNNING') { 
                this.initiateMissionEnd(false); 
            }
            return; 
        }
    
        if (allMandatoryObjectivesComplete && this.gameState === 'RUNNING') { 
            this.initiateMissionEnd(true); 
        }
    }

    spawnFlyingBirdFlock() {
        /* ... (Unchanged from previous complete version) ... */
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
                let targetCameraX = avgX - this.canvas.width / 2; let targetCameraY = avgY - this.canvas.height / 2;
                targetCameraX = Math.max(0, Math.min(targetCameraX, Math.max(0, (CONFIG.WORLD_WIDTH || 0) - this.canvas.width)));
                targetCameraY = Math.max(0, Math.min(targetCameraY, Math.max(0, (CONFIG.WORLD_HEIGHT || 0) - this.canvas.height)));
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

        // --- MODIFIED: Handle projectile pooling when filtering gameObjects ---
        this.gameObjects = this.gameObjects.filter(obj => {
            if(obj) {
                if (obj instanceof Projectile || obj instanceof GrenadeProjectile || obj instanceof FlyingBird || this.gameState === 'RUNNING') { 
                    obj.update(deltaTime);
                    if (this.spatialGrid && (obj instanceof Projectile || obj instanceof GrenadeProjectile)) {
                        if (obj.isMarkedForDeletion) {
                            this.spatialGrid.removeObject(obj);
                            // Release back to pool
                            if (obj instanceof Projectile) {
                                this.projectilePool.release(obj);
                            } else if (obj instanceof GrenadeProjectile) {
                                this.grenadeProjectilePool.release(obj);
                            }
                        } else {
                            this.spatialGrid.updateObject(obj);
                        }
                    } else if (obj.isMarkedForDeletion && (obj instanceof Projectile || obj instanceof GrenadeProjectile)) {
                        // Fallback release if spatialGrid somehow missed it, or for non-grid items
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
        // --- END MODIFIED ---


        this.visualEffects = this.visualEffects.filter(effect => {
            if(effect) effect.update(deltaTime);
            return effect && !effect.isMarkedForDeletion;
        });

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
        /* ... (Unchanged from previous version) ... */
        if (!this.ctx) { 
            return;
        }
        
        this.ctx.globalAlpha = 1.0; 
        this.ctx.globalCompositeOperation = 'source-over'; 

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        if (this.prerenderedBackgroundCanvas && this.prerenderedBackgroundCanvas.width > 0 && this.prerenderedBackgroundCanvas.height > 0) {
            try {
                this.ctx.drawImage(this.prerenderedBackgroundCanvas, 0, 0);
            } catch (e) {
            }
        } else {
            this.ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34'; 
            this.ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH || this.canvas.width, CONFIG.WORLD_HEIGHT || this.canvas.height);
        }

        if (CONFIG.DEBUG_DRAW_NAV_GRID_BLOCKED && this.level && this.level.navGrid) {
            const navGrid = this.level.navGrid;
            const cellSize = this.level.gridCellSize;
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(100, 0, 0, 0.1)'; 
            for (let y = 0; y < navGrid.length; y++) {
                for (let x = 0; x < navGrid[y].length; x++) {
                    if (navGrid[y][x] === 1) { 
                        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }
            this.ctx.restore();
        }
        

        let sortableObjects = [];
        if (this.deployedSquadRoster) {
            this.deployedSquadRoster.forEach(unit => {
                if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') { 
                    sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true });
                }
            });
        }
        if (this.enemyUnits) {
            this.enemyUnits.forEach(unit => {
                if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') {
                    sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true });
                }
            });
        }
        if (this.hostageUnits) {
            this.hostageUnits.forEach(unit => {
                if (unit && typeof unit.y === 'number' && typeof unit.size === 'number') {
                    sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true });
                }
            });
        }
        if (this.level.obstacles) {
            this.level.obstacles.forEach(obstacle => {
                const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null;
                let shouldSort = true;
                if (obstacle.type === 'border_wall' || (borderObstacleType && obstacle.type === borderObstacleType)) {
                    if(borderObstacleType && obstacle.type === borderObstacleType && !obstacle.imageNormal) {
                        shouldSort = false;
                    }
                }

                if (shouldSort && obstacle && typeof obstacle.y === 'number' && typeof obstacle.height === 'number' && (!obstacle.isDestroyed || (obstacle.isDestroyed && obstacle.imageDestroyed))) {
                    let sortYValue = obstacle.y + obstacle.height;
                    const collisionShape = obstacle.collisionShape ? this.level._getObstacleCollisionShape(obstacle) : null;
                    if (obstacle.type === 'tree_palm_single' || obstacle.type === 'tree_palm_double' || obstacle.type === 'tree_palm_triple') {
                        if (collisionShape && (collisionShape.type === 'rectangle' || collisionShape.type === 'ellipse')) {
                             sortYValue = collisionShape.y + (collisionShape.height || collisionShape.radiusY || obstacle.height * 0.1);
                        } else if (collisionShape && collisionShape.type === 'circle') {
                            sortYValue = collisionShape.y + collisionShape.radius;
                        }
                    } else if (collisionShape && collisionShape.type === 'ellipse') {
                        sortYValue = collisionShape.y + collisionShape.radiusY;
                    } else if (collisionShape && collisionShape.type === 'circle') {
                        sortYValue = collisionShape.y + collisionShape.radius;
                    }
                    if (typeof sortYValue === 'number' && !isNaN(sortYValue)) {
                        sortableObjects.push({ entity: obstacle, sortY: sortYValue, isUnit: false });
                    }
                }
            });
        }

        sortableObjects.sort((a, b) => {
            if (isNaN(a.sortY) || isNaN(b.sortY)) {
                return 0; 
            }
            return a.sortY - b.sortY;
        });

        sortableObjects.forEach((item, index) => {
            const obj = item.entity;
            if (!obj) {
                return;
            }
            try {
                if (item.isUnit) {
                    if (typeof obj.render === 'function') {
                        obj.render(this.ctx);
                    }
                } else { 
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
                    } else if ((!obj.isDecoration || !obj.imageNormal) && !obj.isDestroyed) { 
                        let obsColor = obj.color || '#555555';
                        this.ctx.fillStyle = obsColor;
                        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    }
                    
                    if (obj.destructible && !obj.isDestroyed && obj.hp < obj.maxHp && obj.hp > 0 && CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR) {
                        const healthBarStyle = CONFIG.UI_SETTINGS.HEALTH_BAR;
                        const hpBarHeight = healthBarStyle.HEIGHT || 4;
                        const hpBarWidth = Math.min(obj.width * 0.7, 60); 
                        const barX = obj.x + (obj.width - hpBarWidth) / 2;
                        const barY = obj.y - hpBarHeight - 4; 
                        this.ctx.fillStyle = healthBarStyle.BG_COLOR ||'#111';
                        this.ctx.fillRect(barX - 1, barY - 1, hpBarWidth + 2, hpBarHeight + 2);
                        let fillColor = healthBarStyle.HP_COLOR_FULL ||'#0c0';
                        const hpPercent = obj.hp / obj.maxHp;
                         if (hpPercent < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3)) {
                            fillColor = healthBarStyle.HP_COLOR_LOW || '#CC0000';
                        } else if (hpPercent < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) {
                            fillColor = healthBarStyle.HP_COLOR_MEDIUM || '#CCCC00';
                        }
                        this.ctx.fillStyle = fillColor;
                        this.ctx.fillRect(barX, barY, hpBarWidth * hpPercent, hpBarHeight);
                    }
                }
            } catch (e) {
            }
        });
        
        if (CONFIG.DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES && this.level && this.level.obstacles) {
            this.ctx.save(); this.ctx.globalAlpha = 0.5; this.ctx.lineWidth = 1;
            this.level.obstacles.forEach(obstacle => {
                if (obstacle.type === 'border_wall' && (obstacle.y === 0 || obstacle.y + obstacle.height === (CONFIG.WORLD_HEIGHT || this.canvas.height))) {
                     const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null;
                    if (borderObstacleType && obstacle.type === borderObstacleType) { return; }
                }
                const collisionShape = this.level._getObstacleCollisionShape(obstacle);
                if (!collisionShape) return;
                if (obstacle.isDestroyed && !obstacle.blocksMovement) {} 
                else if (obstacle.blocksMovement || obstacle.providesCover || obstacle.isPickup) {
                    if (collisionShape.type === 'rectangle') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta'); this.ctx.strokeRect(collisionShape.x, collisionShape.y, collisionShape.width, collisionShape.height); } 
                    else if (collisionShape.type === 'circle') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta'); this.ctx.beginPath(); this.ctx.arc(collisionShape.x, collisionShape.y, collisionShape.radius, 0, Math.PI * 2); this.ctx.stroke(); } 
                    else if (collisionShape.type === 'ellipse') { this.ctx.strokeStyle = obstacle.blocksMovement ? 'lime' : (obstacle.providesCover ? 'pink' : 'orange'); this.ctx.beginPath(); this.ctx.ellipse(collisionShape.x, collisionShape.y, collisionShape.radiusX, collisionShape.radiusY, 0, 0, Math.PI * 2); this.ctx.stroke(); }
                }
            });
            this.ctx.restore();
        }
        if (this.level && CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_SPAWN_AREAS) { this.level.renderHutSpawnAreas(this.ctx); }
        if (this.level && CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_HUT_STATUS_TEXT) {
            this.ctx.save(); this.ctx.fillStyle = "white"; this.ctx.font = "10px Arial"; this.ctx.textAlign = "center";
            (this.level.potentialSpawnerHuts || []).forEach(hut => {
                if (!hut.isDestroyed) {
                    let status = "POTENTIAL";
                    if (hut.isActivelySpawning) { status = hut.unitsToSpawnThisBurst > 0 ? `BURST (${hut.unitsToSpawnThisBurst} left, next in ${hut.timeUntilNextUnitInBurst.toFixed(1)}s)` : `ACTIVE (CD: ${hut.spawnCooldownTimer.toFixed(1)}s)`; }
                    this.ctx.fillText(status, hut.x + hut.width / 2, hut.y - 5);
                }
            });
            this.ctx.restore();
        }
        this.gameObjects.forEach(obj => { if (obj && typeof obj.render === 'function') { obj.render(this.ctx); } });
        this.visualEffects.forEach(effect => { if (effect && typeof effect.render === 'function') { effect.render(this.ctx); } });
        
        
        if(this.selectedUnits) {
            this.selectedUnits.forEach(unit => {
                if (unit && unit.isAlive() && unit.manualTarget && unit.manualTarget.isAlive() && !(unit instanceof Raccoon && unit.isAimingGrenade)) {
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; this.ctx.lineWidth = 1.5; this.ctx.setLineDash([4, 4]);
                    this.ctx.beginPath(); this.ctx.moveTo(unit.x, unit.y); this.ctx.lineTo(unit.manualTarget.x, unit.manualTarget.y); this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            });
        }
        const aimingRaccoon = this.selectedUnits && this.selectedUnits.find(unit => unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive());
        if (aimingRaccoon && this.inputHandler && this.inputHandler.mousePos) {
            const worldMouseX = this.inputHandler.mousePos.worldX; const worldMouseY = this.inputHandler.mousePos.worldY;
            const throwDist = distance(aimingRaccoon.x, aimingRaccoon.y, worldMouseX, worldMouseY);
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)'; this.ctx.beginPath(); this.ctx.arc(worldMouseX, worldMouseY, CONFIG.RACCOON_GRENADE_AOE_RADIUS, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.strokeStyle = 'rgb(111, 0, 255)'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.moveTo(aimingRaccoon.x, aimingRaccoon.y);
            if (throwDist > CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) {
                 const angle = Math.atan2(worldMouseY - aimingRaccoon.y, worldMouseX - aimingRaccoon.x);
                 const cappedX = aimingRaccoon.x + Math.cos(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX; const cappedY = aimingRaccoon.y + Math.sin(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX;
                 this.ctx.lineTo(cappedX, cappedY); this.ctx.stroke(); 
                 this.ctx.beginPath(); this.ctx.moveTo(cappedX, cappedY); this.ctx.setLineDash([5, 5]); this.ctx.lineTo(worldMouseX, worldMouseY); this.ctx.stroke(); this.ctx.setLineDash([]); 
            } else { this.ctx.lineTo(worldMouseX, worldMouseY); this.ctx.stroke(); }
        }
        if (this.isDragging && this.draggedFarEnough && this.inputHandler.isCtrlPressed) {
            const worldDragStartX = this.dragStartX + this.cameraX; const worldDragStartY = this.dragStartY + this.cameraY;
            const worldDragCurrentX = this.dragCurrentX + this.cameraX; const worldDragCurrentY = this.dragCurrentY + this.cameraY;
            this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)'; this.ctx.lineWidth = 1; this.ctx.fillStyle = 'rgba(50, 205, 50, 0.15)';
            const rectX = Math.min(worldDragStartX, worldDragCurrentX); const rectY = Math.min(worldDragStartY, worldDragCurrentY);
            const rectWidth = Math.abs(worldDragCurrentX - worldDragStartX); const rectHeight = Math.abs(worldDragCurrentY - worldDragStartY);
            this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight); this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }

        if (CONFIG.DEBUG_DRAW_SPATIAL_GRID && this.spatialGrid) { 
            this.spatialGrid.renderDebug(this.ctx, this.cameraX, this.cameraY);
        }

        this.ctx.restore(); 

        if (this.gameState === 'RUNNING' || this.gameState === 'PAUSED' || this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT') {
            this.ctx.font = "16px 'Consolas', 'Lucida Console', monospace";
            this.ctx.fillStyle = "rgba(255, 255, 0, 0.9)"; // Yellow, slightly transparent
            this.ctx.textAlign = "left";
            this.ctx.fillText(`FPS: ${this.fps}`, 10, 20); // Positioned at top-left
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
        /* ... (Unchanged from previous complete version) ... */
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
            this.gameState === 'MISSION_ENDING_DEFEAT') {
            try {
                this.update(deltaTime);
            } catch (e) {
                console.error("ERROR IN Game.update():", e);
                this.gameState = 'ERROR_STATE'; 
            }
        } else {
        }
        
        try {
            this.render(); 
        } catch (e) {
            console.error("ERROR IN Game.render():", e); // Added error logging for render
            this.gameState = 'ERROR_STATE';
        }

        if (this.gameState !== 'ERROR_STATE') { 
            requestAnimationFrame(this.gameLoop);
        } else {
            console.error("Game in ERROR_STATE. Halting game loop.");
        }
    }

    calculateFormationPoints(centerX, centerY, units, formationType = 'HORIZONTAL') {
        /* ... (Unchanged from previous complete version) ... */
        const points = []; const aliveUnits = units ? units.filter(u => u.isAlive()) : []; const numUnits = aliveUnits.length;
        if (numUnits === 0) return points; if (numUnits === 1) { points.push({ x: centerX, y: centerY }); return points; }
        const spacing = (CONFIG.RACCOON_SIZE * 2) * this.formationSpacingMultiplier;
        if (formationType === 'HORIZONTAL') {
            const totalWidth = (numUnits - 1) * spacing; let startX = centerX - totalWidth / 2;
            for (let i = 0; i < numUnits; i++) points.push({ x: startX + i * spacing, y: centerY });
        } else { // VERTICAL
            const totalHeight = (numUnits - 1) * spacing; let startY = centerY - totalHeight / 2;
            for (let i = 0; i < numUnits; i++) points.push({ x: centerX, y: startY + i * spacing });
        } return points;
    }
}


class PromotionEffect {
    /* ... (Unchanged from previous complete version) ... */
    constructor(x, y, gameInstance) {
        this.game = gameInstance; this.x = x; this.y = y;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.PROMOTION) ? CONFIG.VISUAL_EFFECTS.PROMOTION : {};
        this.text = this.effectConfig.TEXT || "PROMOTED!"; this.lifetime = this.effectConfig.LIFETIME || 1.5;
        this.elapsedTime = 0; this.isMarkedForDeletion = false; this.type = 'promotion_text'; this.opacity = 1;
        this.velocityY = this.effectConfig.VELOCITY_Y || -20; this.font = this.effectConfig.FONT || "bold 16px 'Consolas'";
        this.colorRGB = this.effectConfig.COLOR_RGB_FADE_START || [255, 223, 0]; 
    }
    update(deltaTime) { this.elapsedTime += deltaTime; this.y += this.velocityY * deltaTime; this.opacity = 1 - (this.elapsedTime / this.lifetime); if (this.elapsedTime >= this.lifetime || this.opacity <= 0) this.isMarkedForDeletion = true; }
    render(ctx) { ctx.font = this.font; ctx.fillStyle = `rgba(${this.colorRGB[0]}, ${this.colorRGB[1]}, ${this.colorRGB[2]}, ${Math.max(0, this.opacity)})`; ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y); ctx.textAlign = 'left';  }
}

class ExplosionEffect {
    /* ... (Unchanged from previous complete version) ... */
    constructor(x, y, radius, gameInstance) {
        this.game = gameInstance; this.x = x; this.y = y; this.maxRadius = radius; this.currentRadius = 0;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.EXPLOSION) ? CONFIG.VISUAL_EFFECTS.EXPLOSION : {};
        this.lifetime = this.effectConfig.LIFETIME || 0.5; this.elapsedTime = 0; this.isMarkedForDeletion = false; this.type = 'explosion';
    }
    update(deltaTime) { this.elapsedTime += deltaTime; this.currentRadius = (this.elapsedTime / this.lifetime) * this.maxRadius; if (this.elapsedTime >= this.lifetime) this.isMarkedForDeletion = true; }
    render(ctx) {
        const progress = this.elapsedTime / this.lifetime; const alpha = 1 - progress;
        
        const colorIntensity = Math.floor(255 * (1 - progress*0.5)); 
        const gIntensity = Math.floor(255 * (1-progress)); 
        ctx.fillStyle = `rgba(${colorIntensity}, ${Math.floor(gIntensity*0.6)}, 0, ${alpha*0.7})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.currentRadius,0,Math.PI*2); ctx.fill();
        
        if (progress < 0.4) { ctx.fillStyle = `rgba(255,255,${Math.floor(150+105*(1-progress/0.4))},${alpha})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.currentRadius*0.5,0,Math.PI*2); ctx.fill(); }
    }
}

class ExtractionZoneEffect {
    /* ... (Unchanged from previous complete version) ... */
    constructor(obstacle, gameInstance) {
        this.game = gameInstance;
        this.obstacleId = obstacle.id; // Store ID, not reference
        this.obstacle = obstacle; 
        this.x = obstacle.x;
        this.y = obstacle.y;
        this.width = obstacle.width;
        this.height = obstacle.height;
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        this.maxRadius = Math.min(this.width, this.height) / 2;
        this.pulses = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.isMarkedForDeletion = false;
        this.type = 'extraction_zone_beacon';
    }

    update(deltaTime) {
        const currentObstacle = this.game.level.obstacles.find(o => o.id === this.obstacleId);
        if (!currentObstacle) {
            this.isMarkedForDeletion = true;
            return;
        }
        this.obstacle = currentObstacle;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.pulses.push({
                currentRadius: 0,
                lifetime: 2.0,
                elapsed: 0,
            });
        }

        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const pulse = this.pulses[i];
            pulse.elapsed += deltaTime;
            if (pulse.elapsed >= pulse.lifetime) {
                this.pulses.splice(i, 1);
            } else {
                const progress = pulse.elapsed / pulse.lifetime;
                pulse.currentRadius = this.maxRadius * progress;
                pulse.alpha = 1.0 - progress;
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        ctx.fillStyle = this.obstacle.color || 'rgba(60, 120, 255, 0.35)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        this.pulses.forEach(pulse => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(173, 216, 230, ${pulse.alpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.arc(this.centerX, this.centerY, pulse.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EVAC", this.centerX, this.centerY);

        ctx.restore();
    }
}


window.addEventListener('DOMContentLoaded', () => { 
    new Game('gameCanvas'); 
});