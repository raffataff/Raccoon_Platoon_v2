// js/game.js
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasContainer = document.getElementById('canvas-container');
        this.ctx = this.canvas.getContext('2d');

        this.prerenderedBackgroundCanvas = document.createElement('canvas');
        this.prerenderedBackgroundCtx = this.prerenderedBackgroundCanvas.getContext('2d');

        this.masterRoster = [];
        this.deployedSquadRoster = [];
        this.fallenRaccoonsGlobal = [];
        this.fallenRaccoonsThisMission = [];
        this.tempSelectedForDeployment = [];

        this.gameObjects = [];
        this.enemyUnits = [];
        this.hostageUnits = []; 
        this.selectedUnits = [];
        this.visualEffects = [];
        this.preloadedImages = {};
        this.audioManager = new AudioManager();

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

        this.campaignData = CAMPAIGN_DATA;
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

        this.missionObjective = null;
        this.isObjectiveComplete = false;
        this.initialEnemyCount = 0;
        this.missionStartedAndPopulated = false;
        this.missionStartTime = 0;

        this.birdSpawnConfig = CONFIG.AMBIENT_EFFECTS ? CONFIG.AMBIENT_EFFECTS.FLYING_BIRD : null;
        this.nextBirdSpawnTime = 0;
        this.setNextBirdSpawnTimer();

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);

        (async () => {
            await this.preloadAudioAssets();
            if (this.ui) {
                this.ui.showMainMenuScreen();
            }
            this.gameLoop();
        })();
    }

    getLivingPlayerControlledUnits() {
        const livingRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [];
        const livingRescuedHostages = this.hostageUnits ? this.hostageUnits.filter(h => h.isRescued && h.isAlive()) : [];
        return [...livingRaccoons, ...livingRescuedHostages];
    }

    setNextBirdSpawnTimer() {
        if (this.birdSpawnConfig) {
            this.nextBirdSpawnTime = (this.birdSpawnConfig.SPAWN_INTERVAL_MIN_SECONDS || 10) +
                                     Math.random() * ((this.birdSpawnConfig.SPAWN_INTERVAL_MAX_SECONDS || 20) -
                                                      (this.birdSpawnConfig.SPAWN_INTERVAL_MIN_SECONDS || 10));
        } else {
            this.nextBirdSpawnTime = Infinity;
        }
    }

    async preloadMiscAssets() {
        const imagePromises = [];
        console.log("[Game] Preloading miscellaneous assets...");

        if (this.birdSpawnConfig && this.birdSpawnConfig.TILE_SHEET_PATH) {
            const path = this.birdSpawnConfig.TILE_SHEET_PATH;
            if (!this.preloadedImages[path]) {
                imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[path] = img; console.log(`[Preload SUCCESS - Misc] Bird sheet: '${path}'`); resolve(); };
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
                    img.onload = () => { this.preloadedImages[path] = img; console.log(`[Preload SUCCESS - Misc] Grenade sprite: '${path}'`); resolve(); };
                    img.onerror = () => { console.warn(`[Preload FAILED - Misc] Grenade sprite: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                    img.src = path;
                }));
            }
        }
        
        // Preload extraction zone sprite if defined
        const ezConfig = CONFIG.LEVEL_GENERATION && CONFIG.LEVEL_GENERATION.EXTRACTION_ZONE_SETTINGS;
        if (ezConfig && ezConfig.SPRITE_PATH) {
            const path = ezConfig.SPRITE_PATH;
            if (!this.preloadedImages[path]) {
                 imagePromises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { this.preloadedImages[path] = img; console.log(`[Preload SUCCESS - Misc] Extraction Zone: '${path}'`); resolve(); };
                    img.onerror = () => { console.warn(`[Preload FAILED - Misc] Extraction Zone: '${path}'`); this.preloadedImages[path] = null; resolve(); };
                    img.src = path;
                }));
            }
        }


        await Promise.all(imagePromises);
        console.log("[Game] Miscellaneous assets preloading processed.");
    }



    async preloadUnitAssets() {
        const imagePromises = [];
        console.log("[Game] Preloading unit assets...");

        const unitTypesToPreload = [
            {
                name: 'raccoon', 
                basePath: CONFIG.RACCOON_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], walk: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], fire: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.RACCOON_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.RACCOON_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_grunt',
                basePath: CONFIG.POSSUM_GRUNT_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], walk: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], fire: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.POSSUM_GRUNT_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_GRUNT_DEAD_SPRITE_FILES
            },
            {
                name: 'possum_heavy',
                basePath: CONFIG.POSSUM_HEAVY_SPRITE_PATH,
                actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], walk: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], fire: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
                deadPath: CONFIG.POSSUM_HEAVY_DEAD_SPRITE_PATH,
                deadFiles: CONFIG.POSSUM_HEAVY_DEAD_SPRITE_FILES
            }
        ];

        unitTypesToPreload.forEach(unitTypeConfig => {
            if (unitTypeConfig.basePath && unitTypeConfig.actions) {
                for (const action in unitTypeConfig.actions) {
                    unitTypeConfig.actions[action].forEach(dir => {
                        const spriteKey = `${unitTypeConfig.name}_${action}_${dir}`;
                        const spritePath = `${unitTypeConfig.basePath}${action}/${spriteKey}.png`;

                        if (!this.preloadedImages[spriteKey]) {
                            imagePromises.push(new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => { this.preloadedImages[spriteKey] = img; resolve(); };
                                img.onerror = () => { console.warn(`[Preload] Failed: ${spritePath}`); this.preloadedImages[spriteKey] = null; resolve(); };
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
                            img.onload = () => { this.preloadedImages[fullPath] = img; resolve(); };
                            img.onerror = () => { console.warn(`[Preload] Failed dead sprite: ${fullPath}`); this.preloadedImages[fullPath] = null; resolve(); };
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
                        img.onload = () => { this.preloadedImages[faceKey] = img; resolve(); };
                        img.onerror = () => { console.warn(`[Preload] Failed Raccoon face: ${faceKey}`); this.preloadedImages[faceKey] = null; resolve(); };
                        img.src = faceKey;
                    }));
                }
            });
        }

        await Promise.all(imagePromises);
        console.log("[Game] Unit assets preloading processed.");
    }


    async preloadLevelAssets() {
        const obstacleDefs = CONFIG.OBSTACLE_DEFINITIONS || [];
        const imagePromises = [];
         console.log("[Game] Preloading level assets...");

        obstacleDefs.forEach(def => {
            let handledByDedicatedList = false;
            if ((def.type === 'decoration_grass' && CONFIG.GRASS_SPRITE_FILES) ||
                (def.type === 'fence_barbed_straight_short' && CONFIG.FENCE_BARBED_SHORT_SPRITE_FILES) ||
                (def.type === 'fence_barbed_straight_long' && CONFIG.FENCE_BARBED_LONG_SPRITE_FILES) ||
                (def.type === 'bush_medium' && CONFIG.BUSH_SPRITES_32PX_FILES) ||
                (def.type === 'bush_large' && CONFIG.BUSH_SPRITES_64PX_FILES) ||
                (def.type === 'rock_medium' && CONFIG.ROCK_SPRITES_32PX_FILES) ||
                (def.type === 'rock_large' && CONFIG.ROCK_SPRITES_64PX_FILES) ||
                (def.type === 'tree_palm_single' && CONFIG.PALM_TREE_SINGLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_double' && CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_triple' && CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES) ||
                (def.type === 'tree_palm_fallen' && CONFIG.PALM_TREE_FALLEN_SPRITE_FILES) ||
                (def.type === 'pickup_health' && CONFIG.HEALTH_PICKUP_SPRITE_FILES) ||
                (def.type === 'possum_hut' && CONFIG.POSSUM_HUT_SPRITE_FILES)
            ) {
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
                        img.onload = () => {
                            this.preloadedImages[spriteInfo.key] = img;
                            resolve();
                        };
                        img.onerror = () => {
                            console.warn(`[Preload FAILED - Level Asset] ${spriteInfo.key} from ${spriteInfo.path}`);
                            this.preloadedImages[spriteInfo.key] = null;
                            resolve();
                        };
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
            { files: CONFIG.BUSH_SPRITES_64PX_FILES, path: CONFIG.BUSH_SPRITES_64PX_PATH, name: "bush64" },
            { files: CONFIG.ROCK_SPRITES_32PX_FILES, path: CONFIG.ROCK_SPRITES_32PX_PATH, name: "rock32" },
            { files: CONFIG.ROCK_SPRITES_64PX_FILES, path: CONFIG.ROCK_SPRITES_64PX_PATH, name: "rock64" },
            { files: CONFIG.PALM_TREE_SINGLE_SPRITE_FILES, path: CONFIG.PALM_TREE_SINGLE_SPRITE_PATH, name: "palm_single" },
            { files: CONFIG.PALM_TREE_DOUBLE_SPRITE_FILES, path: CONFIG.PALM_TREE_DOUBLE_SPRITE_PATH, name: "palm_double" },
            { files: CONFIG.PALM_TREE_TRIPLE_SPRITE_FILES, path: CONFIG.PALM_TREE_TRIPLE_SPRITE_PATH, name: "palm_triple" },
            { files: CONFIG.PALM_TREE_FALLEN_SPRITE_FILES, path: CONFIG.PALM_TREE_FALLEN_SPRITE_PATH, name: "palm_fallen" },
            { files: CONFIG.HEALTH_PICKUP_SPRITE_FILES, path: CONFIG.HEALTH_PICKUP_SPRITE_PATH, name: "pickup_health" },
            { files: CONFIG.POSSUM_HUT_SPRITE_FILES, path: CONFIG.POSSUM_HUT_SPRITE_PATH, name: "possum_hut" }
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
                            img.onerror = () => { console.error(`[Preload] Failed to load ${spriteSet.name} asset: ${fullPath}`); this.preloadedImages[fullPath] = null; resolve(); };
                            img.src = fullPath;
                        }));
                    }
                });
            }
        }

    );
        await Promise.all(imagePromises);
        console.log("[Game] Level assets preloading processed.");
    }

    async preloadAudioAssets() {
        console.log("[Game] Queuing audio assets for loading...");
        if (CONFIG.AUDIO_ASSETS && this.audioManager) {
            for (const key in CONFIG.AUDIO_ASSETS) {
                const asset = CONFIG.AUDIO_ASSETS[key];
                if (typeof asset === 'object' && asset !== null && asset.hasOwnProperty('path')) {
                    this.audioManager.addSoundToLoadQueue(key, asset.path, asset.defaultVolume);
                }
            }
            await this.audioManager.loadAllSounds(
                (loaded, total, key, error) => {
                },
                () => {
                    console.log("[Game] All audio assets processed.");
                }
            );
        } else {
            console.log("[Game] No audio assets defined in CONFIG or AudioManager not found.");
        }
    }


    generatePrerenderedBackground(worldWidth, worldHeight) {
        this.prerenderedBackgroundCanvas.width = worldWidth;
        this.prerenderedBackgroundCanvas.height = worldHeight;
        const ctx = this.prerenderedBackgroundCtx;

        ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
        ctx.fillRect(0, 0, worldWidth, worldHeight);

        if (CONFIG.GRASS_SPRITE_FILES && CONFIG.GRASS_SPRITE_FILES.length > 0 && CONFIG.GRASS_SPRITE_PATH) {
            const configuredTileSize = CONFIG.WORLD_GRASS_TILE_SIZE || 64;
            const overlapFactor = CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR !== undefined ? CONFIG.WORLD_GRASS_TILE_OVERLAP_FACTOR : 0.2;
            const stepX = configuredTileSize * (1 - overlapFactor);
            const stepY = configuredTileSize * (1 - overlapFactor);

            for (let y = -configuredTileSize * overlapFactor; y < worldHeight; y += stepY) {
                for (let x = -configuredTileSize * overlapFactor; x < worldWidth; x += stepX) {
                    const randomSpriteName = CONFIG.GRASS_SPRITE_FILES[Math.floor(Math.random() * CONFIG.GRASS_SPRITE_FILES.length)];
                    const spritePath = CONFIG.GRASS_SPRITE_PATH + randomSpriteName;
                    const grassImg = this.preloadedImages[spritePath];

                    if (grassImg) {
                        const offsetX = (Math.random() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                        const offsetY = (Math.random() - 0.5) * configuredTileSize * overlapFactor * 0.5;
                        const drawX = x + offsetX;
                        const drawY = y + offsetY;
                        ctx.drawImage(grassImg, drawX, drawY, configuredTileSize, configuredTileSize);
                    }
                }
            }
        }
        console.log("[Game] Prerendered background generated.");
    }


    start() {
        if (!this.masterRoster || this.masterRoster.length === 0) {
            console.error("Campaign not initialized before starting."); this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); return;
        }
        if (this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS'; if(this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.ERROR_NO_INITIAL_RECRUITS); return;
        }
        if (this.loadMissionData(0, 0)) {
            if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(this.campaignData[this.currentPhaseIndex], this.currentMissionParams, this.getAvailableRecruits());
                this.gameState = 'PRE_MISSION_SELECT';
            } else { this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); }
        } else {
            this.gameState = 'MAIN_MENU'; if (this.ui) this.ui.showMainMenuScreen(); alert(CONFIG.UI_TEXT_STRINGS.ERROR_LOAD_FIRST_MISSION_FAILED);
        }
    }

    async confirmSquadAndStartMission(selectedRecruitsForDeployment) {
        const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
        if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0 || selectedRecruitsForDeployment.length > maxSquadSize) {
            let alertMsg = (CONFIG.UI_TEXT_STRINGS.INVALID_SQUAD_SIZE_ALERT || "Invalid squad size. Select 1 to {MAX_SQUAD_SIZE} recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString());
            if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0) { alertMsg = CONFIG.UI_TEXT_STRINGS.NO_RECRUITS_SELECTED_ALERT || "Select at least one Raccoon for the mission!"; }
            else if (selectedRecruitsForDeployment.length > maxSquadSize) { alertMsg = (CONFIG.UI_TEXT_STRINGS.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString());}
            alert(alertMsg);
            if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) { this.ui.showPreMissionScreen_RecruitSelect( this.campaignData[this.currentPhaseIndex], this.currentMissionParams, this.getAvailableRecruits() ); }
            return;
        }
        this.gameState = 'LOADING_MISSION';
        if (this.ui && typeof this.ui.showLoadingScreen === 'function') { this.ui.showLoadingScreen("Preparing battlefield..."); } else { console.log("Loading mission..."); }

        await this.preloadLevelAssets();
        await this.preloadUnitAssets();
        await this.preloadMiscAssets();

        this.audioManager.stopAllLoopingSounds();
        const musicKeys = CONFIG.AUDIO_ASSETS.AMBIENT_MUSIC_TROPICAL_FOREST_KEYS;
        if (musicKeys && musicKeys.length > 0) {
            const randomMusicKey = musicKeys[Math.floor(Math.random() * musicKeys.length)];
            if (this.audioManager.sounds[randomMusicKey] && this.audioManager.sounds[randomMusicKey].loaded) {
                this.audioManager.play(randomMusicKey, { loop: true, volume: CONFIG.AUDIO_ASSETS[randomMusicKey]?.defaultVolume || 0.35 });
                this.lastPlayedMusicKey = randomMusicKey;
                console.log(`[Game] Started looping music: ${randomMusicKey}`);
            } else {
                console.warn(`[Game] Ambient music track ${randomMusicKey} not loaded or found.`);
            }
        }

        this.deployedSquadRoster = selectedRecruitsForDeployment;
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

        const worldWidth = (CONFIG.BASE_WORLD_WIDTH || 1000) * (this.currentMissionParams.worldSizeFactor || 1);
        const worldHeight = (CONFIG.BASE_WORLD_HEIGHT || 800) * (this.currentMissionParams.worldSizeFactor || 1);
        CONFIG.WORLD_WIDTH = worldWidth; CONFIG.WORLD_HEIGHT = worldHeight;

        this.generatePrerenderedBackground(worldWidth, worldHeight);

        const playerSpawnLocations = this.level.generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, this.currentMissionParams, this.deployedSquadRoster.length, this.preloadedImages);

        this.initialEnemyCount = this.enemyUnits ? this.enemyUnits.length : 0;
        console.log(`[Game confirmSquadAndStartMission] Initial enemy count set to: ${this.initialEnemyCount}`);

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
            let avgX = 0, avgY = 0; this.deployedSquadRoster.forEach(unit => { avgX += unit.x; avgY += unit.y; }); avgX /= this.deployedSquadRoster.length; avgY /= this.deployedSquadRoster.length;
            this.cameraX = avgX - this.canvas.width / 2; this.cameraY = avgY - this.canvas.height / 2; this.clampCamera();
        } else { this.cameraX = (CONFIG.WORLD_WIDTH - this.canvas.width) / 2; this.cameraY = (CONFIG.WORLD_HEIGHT - this.canvas.height) / 2; this.clampCamera(); }

        this.gameState = 'RUNNING';

        if (this.ui && typeof this.ui.hideLoadingScreen === 'function') { this.ui.hideLoadingScreen(); }
        if (this.ui) { this.ui.hidePreMissionScreen(); this.ui.showHUD(); this.ui.updateObjective(); this.ui.updateFormationButton(this.currentFormationType); } 
        if (this.inputHandler) { this.inputHandler.isLMBHoldFiringActionActive = false; this.inputHandler.updateMouseCursor(); }

        this.lastTime = performance.now();
        this.setNextBirdSpawnTimer();
        this.missionEndDelayTimer = -1;
        this.missionPendingOutcomeIsVictory = false;
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
                     console.log(`Unit ${unit.id} is Holding Fire. Manual target ${enemyUnit.id} set but will not engage automatically.`);
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
                    console.log(`Raccoon ${leadAimer.id} is Holding Position, cannot move to throw grenade at out-of-range target.`);
                } else {
                    leadAimer.moveToGrenadeRange(clickedEnemy);
                }
            } else {
                console.log("Grenade target out of max range and not an enemy.");
            }

            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
    }


    handleRightClickCommand(worldX, worldY) {
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
        if (this.gameState === 'RUNNING') {
            this.previousGameState = this.gameState;
            this.gameState = 'PAUSED';
            this.isGamePausedManually = true;
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.ui) this.ui.showPauseMenuScreen();
            console.log("Game Paused");
        } else if (this.gameState === 'PAUSED' && this.isGamePausedManually) {
            this.gameState = this.previousGameState || 'RUNNING';
            this.isGamePausedManually = false;
            if (this.ui) this.ui.hidePauseMenuScreen();
            this.lastTime = performance.now();
            console.log("Game Resumed");
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    restartCurrentMission() {
        if (this.currentMissionParams && this.getAvailableRecruits().length > 0) {
            console.log("Restarting current mission...");
            if (this.inputHandler.isLMBHoldFiringActionActive) {
                this.handleLMBFireActionEnd();
                this.inputHandler.isLMBHoldFiringActionActive = false;
            }
            if (this.loadMissionData(this.currentPhaseIndex, this.currentMissionIndex)) {
                if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                    this.gameState = 'PRE_MISSION_SELECT';
                    this.ui.hideHUD();
                    this.ui.showPreMissionScreen_RecruitSelect(this.campaignData[this.currentPhaseIndex], this.currentMissionParams, this.getAvailableRecruits());
                }
            }
        } else {
            console.warn("Cannot restart mission: No mission loaded or no recruits available.");
            this.quitToMainMenu();
        }
    }

     quitToMainMenu() {
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
        if (this.ui) {
            this.ui.hideHUD();
            this.ui.hidePostMissionScreen();
            this.ui.hidePauseMenuScreen();
            this.ui.showMainMenuScreen();
        }
        console.log("Quit to Main Menu");
    }

    initializeNewCampaign() {
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

        const availableFaceImages = CONFIG.RACCOON_FACE_IMAGES ? [...CONFIG.RACCOON_FACE_IMAGES] : [];
        let nextRaccoonIdNum = 1;
        const initialSize = CONFIG.INITIAL_ROSTER_SIZE || 0;
        let currentRosterNames = [];

        for (let i = 0; i < initialSize; i++) {
            let faceImageFile = 'default_face.png';
            if (availableFaceImages.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableFaceImages.length);
                faceImageFile = availableFaceImages.splice(randomIndex, 1)[0];
            } else if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
                faceImageFile = CONFIG.RACCOON_FACE_IMAGES[(nextRaccoonIdNum - 1) % CONFIG.RACCOON_FACE_IMAGES.length];
            }
            const faceImageUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
            const raccoonName = getRandomRaccoonName(currentRosterNames);
            currentRosterNames.push(raccoonName);
            const newRecruit = new Raccoon(0, 0, this, `RCN-MR${nextRaccoonIdNum++}`, faceImageUrl, raccoonName);
            this.masterRoster.push(newRecruit);
        }
        if(this.ui) {
            this.ui.hideHUD(); this.ui.hidePostMissionScreen(); this.ui.hideGameOverScreen(); this.ui.hideRecruitMemorialScreen();
        }
    }
    getAvailableRecruits() {
        return this.masterRoster.filter(r => r.isAlive());
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
        const worldWidth = CONFIG.WORLD_WIDTH || 0; const worldHeight = CONFIG.WORLD_HEIGHT || 0;
        this.cameraX = Math.max(0, Math.min(this.cameraX, Math.max(0, worldWidth - this.canvas.width)));
        this.cameraY = Math.max(0, Math.min(this.cameraY, Math.max(0, worldHeight - this.canvas.height)));
    }
    loadMissionData(phaseIdx, missionIdx) {
        if (this.campaignData && this.campaignData[phaseIdx] && this.campaignData[phaseIdx].missions && this.campaignData[phaseIdx].missions[missionIdx]) {
            this.currentPhaseIndex = phaseIdx; this.currentMissionIndex = missionIdx;
            this.currentMissionParams = this.campaignData[phaseIdx].missions[missionIdx];
            this.tempSelectedForDeployment = []; return true;
        }
        this.currentMissionParams = null; return false;
    }
    recordRaccoonFallen(raccoon) {
        if (raccoon && raccoon.team === 'player') {
            if (!this.fallenRaccoonsThisMission.find(r => r.id === raccoon.id)) {
                this.fallenRaccoonsThisMission.push({ id: raccoon.id, name: raccoon.name, rank: raccoon.rank, faceImageUrl: raccoon.faceImageUrl });
            }
            if (!this.fallenRaccoonsGlobal.find(r => r.id === raccoon.id)) {
                this.fallenRaccoonsGlobal.push({
                    id: raccoon.id, name: raccoon.name, rank: raccoon.rank, faceImageUrl: raccoon.faceImageUrl,
                    missionDied: this.currentMissionParams ? this.currentMissionParams.name : (CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT),
                    phaseDied: (this.campaignData && this.campaignData[this.currentPhaseIndex]) ? this.campaignData[this.currentPhaseIndex].name : (CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT)
                });
            }
            if (this.ui) this.ui.updateSquadPanel();
        }
    }
    addNewRecruitToMasterRoster() {
        const currentLivingNames = this.masterRoster.filter(r => r.isAlive()).map(r => r.name);
        let faceImageFile = 'default_face.png';
        if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
            const livingFaceUrls = this.masterRoster.filter(r => r.isAlive()).map(r => r.faceImageUrl);
            let attempts = 0; const maxFaceAttempts = CONFIG.RACCOON_FACE_IMAGES.length * 2 + 5;
            do {
                faceImageFile = CONFIG.RACCOON_FACE_IMAGES[Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length)];
                const potentialUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                if (!livingFaceUrls.includes(potentialUrl) || livingFaceUrls.length >= CONFIG.RACCOON_FACE_IMAGES.length) break;
                attempts++;
            } while (attempts < maxFaceAttempts);
        }
        const faceImageUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
        const raccoonName = getRandomRaccoonName(currentLivingNames);
        const newRecruitId = `RCN-MR${this.masterRoster.length + this.fallenRaccoonsGlobal.length + 1}-${Math.random().toString(36).slice(-4)}`;
        this.masterRoster.push(new Raccoon(0, 0, this, newRecruitId, faceImageUrl, raccoonName));
    }

    initiateMissionEnd(isVictory) {
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
            for (let i=0; i < recruitsToAdd && this.masterRoster.length < maxRoster; i++) this.addNewRecruitToMasterRoster();
        }
        
        let newlyRecruitedFromMission = 0;
        if (isVictory && this.currentMissionParams && this.currentMissionParams.objectiveType === 'RESCUE_HOSTAGES') {
            if (this.hostageUnits) { 
                this.hostageUnits.forEach(hostage => {
                    if (hostage.isAlive() && hostage.isRescued) {
                        const currentRosterNames = this.masterRoster.map(r => r.name); 
                        let faceImageFile = 'default_face.png';
                        const availableFaceImages = CONFIG.RACCOON_FACE_IMAGES ? [...CONFIG.RACCOON_FACE_IMAGES] : [];
                        let chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;

                        if (availableFaceImages.length > 0) {
                            let attempts = 0;
                            const maxFaceAttempts = availableFaceImages.length * 2 + 5; 
                            const existingFaceUrls = this.masterRoster.map(r => r.faceImageUrl);
                            do {
                                faceImageFile = availableFaceImages[Math.floor(Math.random() * availableFaceImages.length)];
                                chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                                if (!existingFaceUrls.includes(chosenFaceUrl) || existingFaceUrls.length >= availableFaceImages.length) break;
                                attempts++;
                            } while (attempts < maxFaceAttempts);
                        } else if (CONFIG.RACCOON_FACE_IMAGES && CONFIG.RACCOON_FACE_IMAGES.length > 0) {
                             faceImageFile = CONFIG.RACCOON_FACE_IMAGES[(this.masterRoster.length + newlyRecruitedFromMission) % CONFIG.RACCOON_FACE_IMAGES.length];
                             chosenFaceUrl = (CONFIG.RACCOON_FACE_IMAGE_PATH || 'assets/images/raccoons/') + faceImageFile;
                        }

                        const newName = getRandomRaccoonName(currentRosterNames);
                        
                        const newRecruit = new Raccoon(0, 0, this, `RCN-RES-${Date.now().toString(36).slice(-4)}-${this.masterRoster.length}`, chosenFaceUrl, newName);
                        newRecruit.rank = hostage.assignedRankOnRescue;
                        newRecruit.xp = hostage.assignedXpOnRescue || 0;
                        newRecruit.applyRankBonuses(true);
                        newRecruit.updateXpToNextRank();

                        if (this.masterRoster.length < (CONFIG.MAX_TOTAL_ROSTER_SIZE || 20)) {
                            this.masterRoster.push(newRecruit);
                            newlyRecruitedFromMission++;
                            console.log(`Rescued hostage ${hostage.id} added to roster as ${newRecruit.name} (Rank: ${newRecruit.rank})`);
                        } else {
                            console.log(`Rescued hostage ${hostage.id} survived, but roster is full.`);
                        }
                    }
                });
            }
        }
        
        const debriefData = {
            isVictory: isVictory,
            phaseData: this.campaignData[this.currentPhaseIndex] || {name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT},
            missionData: this.currentMissionParams || {name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT},
            survivingRaccoons: this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [],
            fallenRaccoons: this.fallenRaccoonsThisMission, 
            enemiesKilled: enemiesKilledThisMission, 
            timeTaken: missionDuration.toFixed(1),
            campaignComplete: (!this.campaignData[this.currentPhaseIndex + (isVictory && this.currentMissionIndex >= (this.campaignData[this.currentPhaseIndex].missions.length -1) ? 1 : 0)] && isVictory),
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
        if (this.gameState === 'CAMPAIGN_COMPLETE') {
            if(this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.CAMPAIGN_ALREADY_COMPLETE, true); return;
        }
        this.currentMissionIndex++;
        const currentPhaseData = this.campaignData[this.currentPhaseIndex];
        if (!currentPhaseData || this.currentMissionIndex >= currentPhaseData.missions.length) {
            this.currentPhaseIndex++; this.currentMissionIndex = 0;
            if (!this.campaignData[this.currentPhaseIndex]) {
                this.gameState = 'CAMPAIGN_COMPLETE';
                const finalDebriefData = {
                    isVictory: true, campaignComplete: true,
                    phaseData: {name: CONFIG.UI_TEXT_STRINGS.CAMPAIGN_COMPLETE_PHASE_NAME}, missionData: {name: CONFIG.UI_TEXT_STRINGS.CAMPAIGN_COMPLETE_MISSION_NAME},
                    survivingRaccoons: this.masterRoster.filter(r => r.isAlive()), fallenRaccoons: this.fallenRaccoonsGlobal, enemiesKilled: "N/A", timeTaken: "N/A"
                };
                if(this.ui) this.ui.showPostMissionScreen_Debrief(finalDebriefData); return;
            }
        }
        if (this.getAvailableRecruits().length === 0) {
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if(this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA); return;
        }
        if (this.loadMissionData(this.currentPhaseIndex, this.currentMissionIndex)) {
             if (this.ui && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                 this.gameState = 'PRE_MISSION_SELECT';
                this.ui.showPreMissionScreen_RecruitSelect( this.campaignData[this.currentPhaseIndex], this.currentMissionParams, this.getAvailableRecruits() );
            } else {
                 if(this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.ERROR_PREPARING_NEXT_BRIEFING); this.gameState = 'MAIN_MENU';
            }
        } else {
            this.gameState = 'CAMPAIGN_COMPLETE';
            if(this.ui) this.ui.showGameOverScreen(CONFIG.UI_TEXT_STRINGS.CAMPAIGN_CONCLUDED_NO_MORE_MISSIONS, true);
        }
    }
    toggleFormation() {
        if (this.gameState !== 'RUNNING') return;
        this.currentFormationIndex = (this.currentFormationIndex + 1) % this.FORMATION_TYPES.length;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        if(this.ui) this.ui.updateFormationButton(this.currentFormationType);
    }
    setFormationSpacing(multiplier) {
        if (this.gameState === 'RUNNING') this.formationSpacingMultiplier = parseFloat(multiplier);
    }

    selectUnitsInCtrlDragRectangle() {
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
        if (this.selectedUnits.length === 0) return;
        let aimingCancelled = false;
        if(this.selectedUnits) this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
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
    }
    addVisualEffect(type, x, y, radiusOrId) {
        if (type === 'explosion') this.visualEffects.push(new ExplosionEffect(x, y, radiusOrId, this));
        else if (type === 'promotion') {
            const unit = this.deployedSquadRoster && this.deployedSquadRoster.find(r => r.id === radiusOrId);
            if (unit) this.visualEffects.push(new PromotionEffect(unit.x, unit.y - unit.size - 10, this));
        }
    }
    checkMissionStatus() {
        if (this.gameState !== 'RUNNING' || !this.missionStartedAndPopulated) {
            return;
        }
    
        let objectiveMet = false;
        const aliveEnemies = this.enemyUnits ? this.enemyUnits.filter(e => e.isAlive()).length : 0;
        const allInitialEnemiesDefeated = (this.initialEnemyCount > 0 && aliveEnemies === 0 && this.enemyUnits.every(e => !e.isAlive())) || (this.initialEnemyCount === 0 && aliveEnemies === 0);
    
        if (this.currentMissionParams && this.currentMissionParams.objectiveType === 'EXTERMINATE') {
            if (allInitialEnemiesDefeated) {
                objectiveMet = true;
            }
        } else if (this.currentMissionParams && this.currentMissionParams.objectiveType === 'RESCUE_HOSTAGES') {
            const minToRescue = this.currentMissionParams.minHostagesToRescueForWin !== undefined
                ? this.currentMissionParams.minHostagesToRescueForWin
                : (CONFIG.HOSTAGE_SETTINGS && CONFIG.HOSTAGE_SETTINGS.MIN_HOSTAGES_TO_RESCUE_FOR_WIN !== undefined
                    ? CONFIG.HOSTAGE_SETTINGS.MIN_HOSTAGES_TO_RESCUE_FOR_WIN
                    : 1);
    
            const rescuedAndAliveHostages = this.hostageUnits ? this.hostageUnits.filter(h => h.isRescued && h.isAlive()) : [];
            const rescuedAndAliveCount = rescuedAndAliveHostages.length;
    
            if (rescuedAndAliveCount >= minToRescue && allInitialEnemiesDefeated) {
                // All primary conditions met, now check extraction
                const extractionZones = this.level.obstacles.filter(obs => obs.type === 'extraction_zone');
                if (extractionZones.length > 0) {
                    let hostagesInZoneCount = 0;
                    let playerRaccoonInZone = false;
    
                    rescuedAndAliveHostages.forEach(hostage => {
                        for (const zone of extractionZones) {
                            if (hostage.x >= zone.x && hostage.x <= zone.x + zone.width &&
                                hostage.y >= zone.y && hostage.y <= zone.y + zone.height) {
                                hostagesInZoneCount++;
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
                    
                    // Ensure enough distinct hostages are in an extraction zone
                    // This simple count assumes any rescued hostage in any zone counts.
                    // If you need specific hostages or specific zones, logic would be more complex.
                    if (hostagesInZoneCount >= minToRescue && playerRaccoonInZone) {
                        objectiveMet = true;
                        console.log(`[Game checkMissionStatus] RESCUE objective met: ${rescuedAndAliveCount}/${minToRescue} hostages rescued, all enemies defeated, AND required hostages + player in extraction zone.`);
                    } else {
                         // console.log(`[Game checkMissionStatus] RESCUE: Hostages/Player not in extraction. Hostages in Zone: ${hostagesInZoneCount}/${minToRescue}. Player in Zone: ${playerRaccoonInZone}`);
                    }
                } else {
                    console.warn("[Game checkMissionStatus] RESCUE objective: No extraction zones found on map!");
                    // objectiveMet remains false, as extraction is impossible
                }
            } else {
                // console.log(`[Game checkMissionStatus] RESCUE: Primary conditions not met. Rescued: ${rescuedAndAliveCount}/${minToRescue}. Enemies defeated: ${allInitialEnemiesDefeated}`);
            }
        } else {
            if (this.currentMissionParams && allInitialEnemiesDefeated) {
                objectiveMet = true; 
            }
        }
    
        const livingPlayerRaccoons = this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()).length : 0;
        if (livingPlayerRaccoons === 0 && this.deployedSquadRoster.length > 0) {
            console.log(`[Game checkMissionStatus] All deployed Raccoons KIA! Initiating mission end (defeat).`);
            this.initiateMissionEnd(false);
            return; 
        }
    
        if (objectiveMet) {
            console.log(`[Game checkMissionStatus] Objective Met! Initiating mission end (victory).`);
            this.initiateMissionEnd(true);
        }
    }
    spawnFlyingBirdFlock() {
        if (!this.birdSpawnConfig || !this.preloadedImages[this.birdSpawnConfig.TILE_SHEET_PATH]) return;

        const direction = Math.random() < 0.5 ? 1 : -1;
        const flockSize = Math.floor(this.birdSpawnConfig.FLOCK_SIZE_MIN + Math.random() * (this.birdSpawnConfig.FLOCK_SIZE_MAX - this.birdSpawnConfig.FLOCK_SIZE_MIN + 1));

        const worldHeight = CONFIG.WORLD_HEIGHT || this.canvas.height;
        const minY = worldHeight * (this.birdSpawnConfig.MIN_Y_SPAWN_FACTOR || 0.1);
        const maxY = worldHeight * (this.birdSpawnConfig.MAX_Y_SPAWN_FACTOR || 0.6);
        const baseSpawnY = minY + Math.random() * (maxY - minY);

        const birdWidth = (this.birdSpawnConfig.FRAME_WIDTH || 50) * (this.birdSpawnConfig.SCALE || 1);

        for (let i = 0; i < flockSize; i++) {
            let startX;
            if (direction === 1) {
                startX = -birdWidth - (i * (this.birdSpawnConfig.FLOCK_SPACING_X || 30)) - Math.random() * 50;
            } else {
                startX = CONFIG.WORLD_WIDTH + birdWidth + (i * (this.birdSpawnConfig.FLOCK_SPACING_X || 30)) + Math.random() * 50;
            }
            const startY = baseSpawnY + (Math.random() - 0.5) * (this.birdSpawnConfig.FLOCK_SPACING_Y || 10) * 2 * i;

            const bird = new FlyingBird(this, startX, startY, direction);
            this.gameObjects.push(bird);
        }
        if (CONFIG.DEBUG_PATHING_UNIT_ID) console.log(`Spawned bird flock of ${flockSize} flying ${direction === 1 ? 'right' : 'left'}`);
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
                this.setNextBirdSpawnTimer();
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
                unit.update(deltaTime);
            }
        });

        this.gameObjects = this.gameObjects.filter(obj => {
            if(obj) {
                if (obj instanceof Projectile || obj instanceof FlyingBird || this.gameState === 'RUNNING') {
                    obj.update(deltaTime);
                }
            }
            return obj && !obj.isMarkedForDeletion;
        });

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
        if (!this.ctx || !this.level) {
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        if (this.prerenderedBackgroundCanvas.width > 0 && this.prerenderedBackgroundCanvas.height > 0) {
            this.ctx.drawImage(this.prerenderedBackgroundCanvas, 0, 0);
        } else {
            this.ctx.fillStyle = CONFIG.WORLD_BASE_MUD_COLOR || '#6B4F34';
            this.ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH || this.canvas.width, CONFIG.WORLD_HEIGHT || this.canvas.height);
        }

        if (CONFIG.DEBUG_DRAW_NAV_GRID_BLOCKED && this.level && this.level.navGrid && this.level.gridCellSize > 0) {
            const grid = this.level.navGrid;
            const cellSize = this.level.gridCellSize;
            this.ctx.globalAlpha = 0.45;
            this.ctx.fillStyle = "rgba(85, 44, 11, 0.73)";

            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[y].length; x++) {
                    if (grid[y][x] === 1) {
                        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }
            this.ctx.globalAlpha = 1.0;
        }

        let sortableObjects = [];
        if (this.deployedSquadRoster) { this.deployedSquadRoster.forEach(unit => { if (unit) { sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true }); } }); }
        if (this.enemyUnits) { this.enemyUnits.forEach(unit => { if (unit) { sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true }); } }); }
        if (this.hostageUnits) {
            this.hostageUnits.forEach(unit => {
                if (unit) { sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true }); }
            });
        }
        if (this.level.obstacles) {
            this.level.obstacles.forEach(obstacle => {
                if (obstacle.type === 'border_wall' && (obstacle.y === 0 || obstacle.y + obstacle.height === (CONFIG.WORLD_HEIGHT || this.canvas.height))) {
                    const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null;
                    if (borderObstacleType) {
                        return; 
                    }
                }


                if (!obstacle.isDestroyed || (obstacle.isDestroyed && obstacle.imageDestroyed)) {
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
                    sortableObjects.push({ entity: obstacle, sortY: sortYValue, isUnit: false });
                }
            });
        }
        sortableObjects.sort((a, b) => a.sortY - b.sortY);

        sortableObjects.forEach(item => {
            const obj = item.entity;
            if (item.isUnit) {
                obj.render(this.ctx);
            } else { 
                if (obj.isDestroyed && obj.imageDestroyed) {
                    let renderWidth, renderHeight, drawX, drawY;
                    if (obj.spriteDestroyedScale !== undefined && obj.spriteDestroyedScale !== null) {
                        renderWidth = obj.imageDestroyed.naturalWidth * obj.spriteDestroyedScale;
                        renderHeight = obj.imageDestroyed.naturalHeight * obj.spriteDestroyedScale;
                        drawX = obj.x + (obj.width / 2) - (renderWidth / 2); 
                        drawY = obj.y + obj.height - renderHeight; 
                    } else { 
                        renderWidth = obj.width;
                        renderHeight = obj.height;
                        drawX = obj.x;
                        drawY = obj.y;
                    }
                    this.ctx.drawImage(obj.imageDestroyed, drawX, drawY, renderWidth, renderHeight);

                } else if (!obj.isDestroyed && obj.imageNormal) {
                    this.ctx.drawImage(obj.imageNormal, obj.x, obj.y, obj.width, obj.height);

                } else if (obj.type === 'extraction_zone' && !obj.imageNormal) { // Fallback for extraction zone
                    this.ctx.fillStyle = obj.color || 'rgba(0,0,255,0.3)';
                    this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    this.ctx.strokeStyle = 'rgba(200,200,255,0.8)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    this.ctx.font = "bold 16px Arial";
                    this.ctx.textAlign = "center";
                    this.ctx.fillText("EVAC", obj.x + obj.width/2, obj.y + obj.height/2 + 6);

                } else if (!obj.isDecoration || !obj.imageNormal) { 
                    let obsColor = obj.color || '#555555';
                    if (obj.isDestroyed) { 
                        obsColor = 'rgba(50, 40, 30, 0.7)';
                    } else if (obj.destructible && obj.hp < obj.maxHp && obj.hp > 0 && obj.color) {
                        const damageRatio = Math.max(0, obj.hp / obj.maxHp);
                        if (/^#[0-9A-F]{6}$/i.test(obsColor)) { 
                            let r = parseInt(obsColor.substring(1,3),16);
                            let g = parseInt(obsColor.substring(3,5),16);
                            let b = parseInt(obsColor.substring(5,7),16);
                            const greyVal = 80; 
                            r = Math.floor(r*damageRatio + greyVal*(1-damageRatio));
                            g = Math.floor(g*damageRatio + greyVal*(1-damageRatio));
                            b = Math.floor(b*damageRatio + greyVal*(1-damageRatio));
                            obsColor = `rgb(${r},${g},${b})`;
                        }
                    }
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
        });

        if (CONFIG.DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES && this.level && this.level.obstacles) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            this.ctx.lineWidth = 1;

            this.level.obstacles.forEach(obstacle => {
                if (obstacle.type === 'border_wall' && (obstacle.y === 0 || obstacle.y + obstacle.height === (CONFIG.WORLD_HEIGHT || this.canvas.height))) {
                     const borderObstacleType = CONFIG.LEVEL_GENERATION ? CONFIG.LEVEL_GENERATION.BORDER_OBSTACLE_TYPE : null;
                    if (borderObstacleType) {
                        return; 
                    }
                }


                const collisionShape = this.level._getObstacleCollisionShape(obstacle);
                if (!collisionShape) return;

                if (obstacle.isDestroyed && !obstacle.blocksMovement) {
                } else if (obstacle.blocksMovement || obstacle.providesCover || obstacle.isPickup) {
                    if (collisionShape.type === 'rectangle') {
                        this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta');
                        this.ctx.strokeRect(collisionShape.x, collisionShape.y, collisionShape.width, collisionShape.height);
                    } else if (collisionShape.type === 'circle') {
                        this.ctx.strokeStyle = obstacle.blocksMovement ? 'yellow' : (obstacle.providesCover ? 'cyan' : 'magenta');
                        this.ctx.beginPath();
                        this.ctx.arc(collisionShape.x, collisionShape.y, collisionShape.radius, 0, Math.PI * 2);
                        this.ctx.stroke();
                    } else if (collisionShape.type === 'ellipse') {
                        this.ctx.strokeStyle = obstacle.blocksMovement ? 'lime' : (obstacle.providesCover ? 'pink' : 'orange');
                        this.ctx.beginPath();
                        this.ctx.ellipse(collisionShape.x, collisionShape.y, collisionShape.radiusX, collisionShape.radiusY, 0, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                }
            });
            this.ctx.restore();
        }

        if (this.level && CONFIG.ENEMY_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING && CONFIG.ENEMY_SPAWNING.POSSUM_HUT_SPAWNING.DEBUG_DRAW_SPAWN_AREAS) {
            this.level.renderHutSpawnAreas(this.ctx);
        }

        this.gameObjects.forEach(obj => { if (obj && typeof obj.render === 'function') { obj.render(this.ctx); } });
        this.visualEffects.forEach(effect => { if (effect && typeof effect.render === 'function' && effect.type !== 'explosion_ground_mark') { effect.render(this.ctx); } });

        if(this.selectedUnits) {
            this.selectedUnits.forEach(unit => {
                if (unit && unit.isAlive()) {
                    this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    const selectRadiusX = unit.size + 13; 
                    const selectRadiusY = unit.size + 13; 
                    this.ctx.ellipse(unit.x, unit.y + unit.size * 0.2, selectRadiusX, selectRadiusY, 0, 0, Math.PI * 2); 
                    this.ctx.stroke();
                }
            });
        }
        if(this.selectedUnits) {
            this.selectedUnits.forEach(unit => {
                if (unit && unit.isAlive() && unit.manualTarget && unit.manualTarget.isAlive() && !(unit instanceof Raccoon && unit.isAimingGrenade)) {
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(unit.x, unit.y);
                    this.ctx.lineTo(unit.manualTarget.x, unit.manualTarget.y);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            });
        }

        
        const aimingRaccoon = this.selectedUnits && this.selectedUnits.find(unit => unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive());
        if (aimingRaccoon && this.inputHandler && this.inputHandler.mousePos) {
            const worldMouseX = this.inputHandler.mousePos.worldX;
            const worldMouseY = this.inputHandler.mousePos.worldY;
            const throwDist = distance(aimingRaccoon.x, aimingRaccoon.y, worldMouseX, worldMouseY);
            
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(worldMouseX, worldMouseY, CONFIG.RACCOON_GRENADE_AOE_RADIUS, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'rgb(111, 0, 255)'; 
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(aimingRaccoon.x, aimingRaccoon.y);
            if (throwDist > CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) {
                 
                 const angle = Math.atan2(worldMouseY - aimingRaccoon.y, worldMouseX - aimingRaccoon.x);
                 const cappedX = aimingRaccoon.x + Math.cos(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX;
                 const cappedY = aimingRaccoon.y + Math.sin(angle) * CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX;
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

        
        if (this.isDragging && this.draggedFarEnough && this.inputHandler.isCtrlPressed) {
            const worldDragStartX = this.dragStartX + this.cameraX;
            const worldDragStartY = this.dragStartY + this.cameraY;
            const worldDragCurrentX = this.dragCurrentX + this.cameraX;
            const worldDragCurrentY = this.dragCurrentY + this.cameraY;

            this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)'; 
            this.ctx.lineWidth = 1;
            this.ctx.fillStyle = 'rgba(50, 205, 50, 0.15)';
            const rectX = Math.min(worldDragStartX, worldDragCurrentX);
            const rectY = Math.min(worldDragStartY, worldDragCurrentY);
            const rectWidth = Math.abs(worldDragCurrentX - worldDragStartX);
            const rectHeight = Math.abs(worldDragCurrentY - worldDragStartY);
            this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }

        this.ctx.restore(); 

        
        if ((this.gameState === 'MISSION_ENDING_VICTORY' || this.gameState === 'MISSION_ENDING_DEFEAT') && this.missionEndMessage) {
            this.ctx.save();
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = "bold 48px 'Impact', 'Arial Black', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";

            const textX = this.canvas.width / 2;
            const textY = this.canvas.height / 2;

            
            this.ctx.shadowColor = "rgba(0,0,0,0.7)";
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;

            if (this.missionPendingOutcomeIsVictory) {
                this.ctx.fillStyle = "#4CAF50"; 
            } else {
                this.ctx.fillStyle = "#F44336"; 
            }
            this.ctx.fillText(this.missionEndMessage, textX, textY);

            
            this.ctx.font = "24px 'Consolas', 'Lucida Console', monospace";
            this.ctx.fillStyle = "#FFFFFF"; 
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

        
        if (this.gameState === 'RUNNING' ||
            this.gameState === 'PAUSED' || 
            this.gameState === 'MISSION_ENDING_VICTORY' ||
            this.gameState === 'MISSION_ENDING_DEFEAT') {
            this.update(deltaTime);
        } else {
            
        }

        
        try {
            this.render();
        } catch (e) {
            console.error("ERROR IN RENDER FUNCTION:", e);
            
        }
        requestAnimationFrame(this.gameLoop);
    }

    calculateFormationPoints(centerX, centerY, units, formationType = 'HORIZONTAL') {
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


window.addEventListener('DOMContentLoaded', () => { new Game('gameCanvas'); });