// js/game.js
// complete
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasContainer = document.getElementById('canvas-container');
        this.ctx = this.canvas.getContext('2d');

        this.masterRoster = [];
        this.deployedSquadRoster = [];
        this.fallenRaccoonsGlobal = [];
        this.fallenRaccoonsThisMission = [];
        this.tempSelectedForDeployment = [];

        this.gameObjects = []; 
        this.enemyUnits = [];
        this.selectedUnits = [];
        this.visualEffects = []; 
        this.preloadedImages = {}; 

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

        this.gameState = 'MAIN_MENU';
        this.missionObjective = null;
        this.isObjectiveComplete = false;
        this.initialEnemyCount = 0;
        this.missionStartedAndPopulated = false;
        this.missionStartTime = 0;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);

        if (this.ui) {
            this.ui.showMainMenuScreen();
        }
        this.gameLoop();
    }

    async preloadLevelAssets() {
        const obstacleDefs = CONFIG.OBSTACLE_DEFINITIONS || [];
        const imagePromises = [];
         console.log("[Game] Preloading level assets...");

        obstacleDefs.forEach(def => {
            let handledByDedicatedList = false;
            if ((def.type === 'decoration_grass' && CONFIG.GRASS_SPRITE_FILES) ||
                (def.type === 'bush_medium' && CONFIG.BUSH_SPRITES_32PX_FILES) ||
                (def.type === 'bush_large' && CONFIG.BUSH_SPRITES_64PX_FILES) ||
                (def.type === 'rock_small' && CONFIG.ROCK_SPRITES_16PX_FILES) ||
                (def.type === 'rock_medium' && CONFIG.ROCK_SPRITES_32PX_FILES) ||
                (def.type === 'rock_large' && CONFIG.ROCK_SPRITES_64PX_FILES) ||
                (def.type === 'tree_palm_tall' && CONFIG.PALM_TREE_TALL_SPRITE_FILES) ||
                (def.type === 'tree_palm_medium' && CONFIG.PALM_TREE_MEDIUM_SPRITE_FILES) ||
                (def.type === 'possum_hut' && CONFIG.POSSUM_HUT_SPRITE_FILES) 
            ) {
                handledByDedicatedList = true;
            }
            const spritesToLoadOnTemplate = [];
            if (!handledByDedicatedList) {
                if (def.spriteNormal) spritesToLoadOnTemplate.push({ path: def.spriteNormal, key: def.spriteNormal });
            }
            // --- MODIFICATION: Always try to load spriteDestroyed if defined, regardless of handledByDedicatedList ---
            // This is because even if normal sprite comes from a list (like possum_hut), destroyed sprite is specific.
            if (def.spriteDestroyed) {
                 spritesToLoadOnTemplate.push({ path: def.spriteDestroyed, key: def.spriteDestroyed });
            }
            // --- END MODIFICATION ---

            spritesToLoadOnTemplate.forEach(spriteInfo => {
                if (spriteInfo.path && !this.preloadedImages[spriteInfo.key]) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            this.preloadedImages[spriteInfo.key] = img;
                            resolve();
                        };
                        img.onerror = () => {
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
            { files: CONFIG.BUSH_SPRITES_32PX_FILES, path: CONFIG.BUSH_SPRITES_32PX_PATH, name: "bush32" },
            { files: CONFIG.BUSH_SPRITES_64PX_FILES, path: CONFIG.BUSH_SPRITES_64PX_PATH, name: "bush64" },
            { files: CONFIG.ROCK_SPRITES_16PX_FILES, path: CONFIG.ROCK_SPRITES_16PX_PATH, name: "rock16" },
            { files: CONFIG.ROCK_SPRITES_32PX_FILES, path: CONFIG.ROCK_SPRITES_32PX_PATH, name: "rock32" },
            { files: CONFIG.ROCK_SPRITES_64PX_FILES, path: CONFIG.ROCK_SPRITES_64PX_PATH, name: "rock64" },
            { files: CONFIG.PALM_TREE_TALL_SPRITE_FILES, path: CONFIG.PALM_TREE_TALL_SPRITE_PATH, name: "palm_tall" },
            { files: CONFIG.PALM_TREE_MEDIUM_SPRITE_FILES, path: CONFIG.PALM_TREE_MEDIUM_SPRITE_PATH, name: "palm_medium" },
            { files: CONFIG.POSSUM_HUT_SPRITE_FILES, path: CONFIG.POSSUM_HUT_SPRITE_PATH, name: "possum_hut" } // Normal hut sprites
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
        });
        await Promise.all(imagePromises);
        console.log("[Game] Level assets preloading complete. Preloaded unique image paths:", Object.keys(this.preloadedImages).length);
    }

    start() { /* ... (Unchanged from previous complete version) ... */
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

    async confirmSquadAndStartMission(selectedRecruitsForDeployment) { /* ... (Unchanged from previous complete version) ... */
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
        this.deployedSquadRoster = selectedRecruitsForDeployment;
        this.deployedSquadRoster.forEach(r => {
            r.hp = r.maxHp; let startGrenades = CONFIG.RACCOON_STARTING_GRENADES || 0;
            if (r.rank === "Corporal") startGrenades += (CONFIG.GRENADE_BONUS_CORPORAL || 2); 
            if (r.rank === "Sergeant") startGrenades += (CONFIG.GRENADE_BONUS_SERGEANT || 3); 
            if (r.rank === "Elite") startGrenades += (CONFIG.GRENADE_BONUS_ELITE || 4);
            if (r.rank === "Ghost") startGrenades += (CONFIG.GRENADE_BONUS_GHOST || 5);
            r.grenadeAmmo = startGrenades; r.isMoving = false; r.manualTarget = null; r.autoTarget = null; r.actionTimer = 0; r.isAimingGrenade = false; r.isContinuousFiring = false; 
        });
        this.gameState = 'RUNNING'; this.isObjectiveComplete = false; this.missionStartedAndPopulated = false; this.fallenRaccoonsThisMission = []; this.missionStartTime = performance.now();
        const worldWidth = (CONFIG.BASE_WORLD_WIDTH || 1000) * (this.currentMissionParams.worldSizeFactor || 1); const worldHeight = (CONFIG.BASE_WORLD_HEIGHT || 800) * (this.currentMissionParams.worldSizeFactor || 1);
        CONFIG.WORLD_WIDTH = worldWidth; CONFIG.WORLD_HEIGHT = worldHeight;
        const playerSpawnLocations = this.level.generateLevelAndGetPlayerSpawns(worldWidth, worldHeight, this.currentMissionParams, this.deployedSquadRoster.length, this.preloadedImages);
        this.initialEnemyCount = this.enemyUnits ? this.enemyUnits.length : 0;
        console.log(`[Game] Initial enemy count set to: ${this.initialEnemyCount}`);
        this.deployedSquadRoster.forEach((raccoon, index) => {
            if (playerSpawnLocations[index]) { raccoon.x = playerSpawnLocations[index].x; raccoon.y = playerSpawnLocations[index].y; raccoon.targetX = raccoon.x; raccoon.targetY = raccoon.y; raccoon.game = this;}
            else { console.warn(`No spawn location for Raccoon ${index}. Fallback.`); raccoon.x = 100 + index * (CONFIG.RACCOON_SIZE * 3); raccoon.y = (CONFIG.WORLD_HEIGHT || 600) / 2; }
        });
        this.selectedUnits = [...this.deployedSquadRoster]; this.gameObjects = []; this.visualEffects = []; this.isDragging = false; this.draggedFarEnough = false;
        if (this.deployedSquadRoster.length > 0) {
            let avgX = 0, avgY = 0; this.deployedSquadRoster.forEach(unit => { avgX += unit.x; avgY += unit.y; }); avgX /= this.deployedSquadRoster.length; avgY /= this.deployedSquadRoster.length;
            this.cameraX = avgX - this.canvas.width / 2; this.cameraY = avgY - this.canvas.height / 2; this.clampCamera();
        } else { this.cameraX = (CONFIG.WORLD_WIDTH - this.canvas.width) / 2; this.cameraY = (CONFIG.WORLD_HEIGHT - this.canvas.height) / 2; this.clampCamera(); }
        if (this.ui && typeof this.ui.hideLoadingScreen === 'function') { this.ui.hideLoadingScreen(); }
        if (this.ui) { this.ui.hidePreMissionScreen(); this.ui.showHUD(); this.ui.updateObjective(this.currentMissionParams.name); this.ui.updateFormationButton(this.currentFormationType); }
        if (this.inputHandler) { this.inputHandler.isShiftHoldFiring = false; this.inputHandler.updateMouseCursor(); } 
        this.lastTime = performance.now();
    }

    handleShiftHoldStart(worldX, worldY) { /* ... (Unchanged from previous complete version) ... */
        if (!this.selectedUnits || this.selectedUnits.length === 0) return;
        this.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAimingGrenade) unit.cancelGrenadeAim();
            if (typeof unit.setContinuousFire === 'function') unit.setContinuousFire(true, worldX, worldY);
        });
        if (this.ui) this.ui.updateSquadPanel();
    }

    updateShiftHoldTarget(worldX, worldY) { /* ... (Unchanged from previous complete version) ... */
        if (!this.selectedUnits || this.selectedUnits.length === 0) return;
        this.selectedUnits.forEach(unit => {
            if (unit.isContinuousFiring && typeof unit.updateContinuousFireTarget === 'function') {
                unit.updateContinuousFireTarget(worldX, worldY);
            }
        });
    }

    handleShiftHoldEnd() { /* ... (Unchanged from previous complete version) ... */
        if (!this.selectedUnits) return;
        this.selectedUnits.forEach(unit => {
            if (typeof unit.setContinuousFire === 'function' && unit.isContinuousFiring) {
                unit.setContinuousFire(false);
            }
        });
        if (this.ui) this.ui.updateSquadPanel();
    }

    handlePrimaryLeftClick(worldX, worldY) { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        if (this.inputHandler.isShiftHoldFiring) { this.handleShiftHoldEnd(); this.inputHandler.isShiftHoldFiring = false; }
        let selectionChanged = false;
        const aimingRaccoons = this.selectedUnits ? this.selectedUnits.filter(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive()) : [];
        if (aimingRaccoons.length > 0) {
            const leaderAimer = aimingRaccoons[0]; let clickedEnemy = null;
            if(this.enemyUnits) this.enemyUnits.forEach(e => { if (e.isAlive() && distance(worldX,worldY,e.x,e.y) < e.size+5) clickedEnemy=e; });
            if (distance(leaderAimer.x,leaderAimer.y,worldX,worldY) <= CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) leaderAimer.confirmThrowGrenade(worldX,worldY);
            else if (clickedEnemy) leaderAimer.moveToGrenadeRange(clickedEnemy);
            if(this.inputHandler) this.inputHandler.updateMouseCursor(); return;
        }
        let clickedPlayerUnit = null;
        if(this.deployedSquadRoster) for(const u of this.deployedSquadRoster){ if(u.isAlive()&&distance(worldX,worldY,u.x,u.y)<u.size+7){clickedPlayerUnit=u;break;}}
        if (clickedPlayerUnit) { if (this.selectedUnits.length !== 1 || this.selectedUnits[0] !== clickedPlayerUnit) { this.selectedUnits = [clickedPlayerUnit]; selectionChanged = true; }}
        else {
            let clickedEnemy = null;
            if(this.enemyUnits) this.enemyUnits.forEach(e=>{if(e.isAlive()&&distance(worldX,worldY,e.x,e.y)<e.size+5)clickedEnemy=e;});
            if (clickedEnemy) { if(this.selectedUnits)this.selectedUnits.forEach(u=>{if(u.isAlive()&&u.team==='player')u.setManualTarget(clickedEnemy);});}
            else { if (this.selectedUnits.length > 0) this.deselectAllUnits(); }
        }
        if (selectionChanged && this.ui) this.ui.updateSquadPanel();
        if(this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    handleShiftFireAtPointCommand(worldX, worldY) { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING' || !this.selectedUnits || this.selectedUnits.length === 0) return;
        if (this.inputHandler.isShiftHoldFiring) { this.handleShiftHoldEnd(); this.inputHandler.isShiftHoldFiring = false; }

        const aimingRaccoons = this.selectedUnits.filter(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
        if (aimingRaccoons.length > 0) {
            const leaderAimer = aimingRaccoons[0]; let clickedEnemy = null;
            if(this.enemyUnits) this.enemyUnits.forEach(e=>{if(e.isAlive()&&distance(worldX,worldY,e.x,e.y)<e.size+5)clickedEnemy=e;});
            if(distance(leaderAimer.x,leaderAimer.y,worldX,worldY) <= CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) leaderAimer.confirmThrowGrenade(worldX,worldY);
            else if (clickedEnemy) leaderAimer.moveToGrenadeRange(clickedEnemy);
            return;
        }
        this.selectedUnits.forEach(unit => { if (unit.isAlive() && typeof unit.fireAtPoint === 'function') unit.fireAtPoint(worldX, worldY); });
        if (this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    handleRightClickCommand(worldX, worldY) { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        if (this.inputHandler.isShiftHoldFiring) { this.handleShiftHoldEnd(); this.inputHandler.isShiftHoldFiring = false; }
        let didCancelGrenade = false;
        if (this.selectedUnits) this.selectedUnits.forEach(u => { if (u instanceof Raccoon && u.isAimingGrenade) { u.cancelGrenadeAim(); didCancelGrenade = true; }});
        if(didCancelGrenade) { if(this.inputHandler) this.inputHandler.updateMouseCursor(); return; }
        if (this.selectedUnits && this.selectedUnits.length > 0) {
            const formationPoints = this.calculateFormationPoints(worldX, worldY, this.selectedUnits, this.currentFormationType);
            this.selectedUnits.forEach((unit, index) => { if (unit.isAlive() && unit.team === 'player') { const targetPoint = formationPoints[index] || {x:worldX, y:worldY}; unit.setMoveTarget(targetPoint.x, targetPoint.y);}});
        }
        if(this.inputHandler) this.inputHandler.updateMouseCursor();
    }

    initializeNewCampaign() { /* ... (Unchanged from previous complete version) ... */
        this.masterRoster = [];
        this.fallenRaccoonsGlobal = [];
        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.deployedSquadRoster = [];
        this.selectedUnits = [];
        this.tempSelectedForDeployment = [];
        this.preloadedImages = {}; 

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

    getAvailableRecruits() { /* ... (Unchanged from previous complete version) ... */
        return this.masterRoster.filter(r => r.isAlive());
    }

    resizeCanvas() { /* ... (Unchanged from previous complete version) ... */
        if (!this.canvasContainer) this.canvasContainer = document.getElementById('canvas-container');
        if (!this.canvasContainer) return;
        const containerWidth = this.canvasContainer.offsetWidth; const containerHeight = this.canvasContainer.offsetHeight;
        this.canvas.width = Math.max(CONFIG.MIN_CANVAS_WIDTH || 800, containerWidth);
        this.canvas.height = Math.max(CONFIG.MIN_CANVAS_HEIGHT || 600, containerHeight);
        if (this.gameState === 'RUNNING') this.clampCamera();
    }

    clampCamera() { /* ... (Unchanged from previous complete version) ... */
        const worldWidth = CONFIG.WORLD_WIDTH || 0; const worldHeight = CONFIG.WORLD_HEIGHT || 0;
        this.cameraX = Math.max(0, Math.min(this.cameraX, Math.max(0, worldWidth - this.canvas.width)));
        this.cameraY = Math.max(0, Math.min(this.cameraY, Math.max(0, worldHeight - this.canvas.height)));
    }

    loadMissionData(phaseIdx, missionIdx) { /* ... (Unchanged from previous complete version) ... */
        if (this.campaignData && this.campaignData[phaseIdx] && this.campaignData[phaseIdx].missions && this.campaignData[phaseIdx].missions[missionIdx]) {
            this.currentPhaseIndex = phaseIdx; this.currentMissionIndex = missionIdx;
            this.currentMissionParams = this.campaignData[phaseIdx].missions[missionIdx];
            this.tempSelectedForDeployment = []; return true;
        }
        this.currentMissionParams = null; return false;
    }

    recordRaccoonFallen(raccoon) { /* ... (Unchanged from previous complete version) ... */
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

    addNewRecruitToMasterRoster() { /* ... (Unchanged from previous complete version) ... */
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

    endMission(isVictory) { /* ... (Unchanged from previous complete version) ... */
        this.gameState = 'POST_MISSION_DEBRIEF';
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
        const debriefData = {
            isVictory: isVictory,
            phaseData: this.campaignData[this.currentPhaseIndex] || {name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT},
            missionData: this.currentMissionParams || {name: CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT},
            survivingRaccoons: this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [],
            fallenRaccoons: this.fallenRaccoonsThisMission, enemiesKilled: enemiesKilledThisMission, timeTaken: missionDuration.toFixed(1),
            campaignComplete: (!this.campaignData[this.currentPhaseIndex + (isVictory && this.currentMissionIndex >= (this.campaignData[this.currentPhaseIndex].missions.length -1) ? 1 : 0)] && isVictory)
        };
        if (this.ui) { this.ui.hideHUD(); this.ui.showPostMissionScreen_Debrief(debriefData); if (this.inputHandler) this.inputHandler.updateMouseCursor(); }
    }

    proceedToNextLogicalStep() { /* ... (Unchanged from previous complete version) ... */
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

    toggleFormation() { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        this.currentFormationIndex = (this.currentFormationIndex + 1) % this.FORMATION_TYPES.length;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        if(this.ui) this.ui.updateFormationButton(this.currentFormationType);
    }

    setFormationSpacing(multiplier) { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState === 'RUNNING') this.formationSpacingMultiplier = parseFloat(multiplier);
    }

    selectUnitsInDragRectangle() {
        if (!this.draggedFarEnough || this.gameState !== 'RUNNING') return;

        // dragStartX/Y and dragCurrentX/Y are UNCALED screen coordinates from InputHandler
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const scaledDragStartX = this.dragStartX * scaleX;
        const scaledDragStartY = this.dragStartY * scaleY;
        const scaledDragCurrentX = this.dragCurrentX * scaleX;
        const scaledDragCurrentY = this.dragCurrentY * scaleY;

        const worldDragStartX = scaledDragStartX + this.cameraX;
        const worldDragStartY = scaledDragStartY + this.cameraY;
        const worldDragCurrentX = scaledDragCurrentX + this.cameraX;
        const worldDragCurrentY = scaledDragCurrentY + this.cameraY;

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
        // ... (rest of the method is the same)
        const oldSelectionIds = this.selectedUnits.map(u => u.id).sort().join(',');
        const newSelectionIds = newlySelectedUnits.map(u => u.id).sort().join(',');
        if (oldSelectionIds !== newSelectionIds) {
            this.selectedUnits = newlySelectedUnits;
            let aimingCancelled = false;
            this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
            if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        }
        this.isDragging = false; this.draggedFarEnough = false;
    }

    deselectAllUnits() { /* ... (Unchanged from previous complete version) ... */
        if (this.selectedUnits.length === 0) return;
        let aimingCancelled = false;
        if(this.selectedUnits) this.selectedUnits.forEach(unit => { if (unit instanceof Raccoon && unit.isAimingGrenade) { unit.cancelGrenadeAim(); aimingCancelled = true; } });
        this.selectedUnits = [];
        if (!aimingCancelled && this.ui) this.ui.updateSquadPanel();
        if (this.inputHandler) this.inputHandler.updateMouseCursor(); else if (this.ui) this.ui.setCursor('default');
    }

    selectAllPlayerUnits() { /* ... (Unchanged from previous complete version) ... */
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

    addProjectile(projectile) { /* ... (Unchanged from previous complete version) ... */
        this.gameObjects.push(projectile);
    }

    addVisualEffect(type, x, y, radiusOrId) { /* ... (Unchanged from previous complete version) ... */
        if (type === 'explosion') this.visualEffects.push(new ExplosionEffect(x, y, radiusOrId, this));
        else if (type === 'promotion') {
            const unit = this.deployedSquadRoster && this.deployedSquadRoster.find(r => r.id === radiusOrId);
            if (unit) this.visualEffects.push(new PromotionEffect(unit.x, unit.y - unit.size - 10, this));
        }
    }

    checkMissionStatus() { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING' || !this.missionStartedAndPopulated) return;
        if (this.currentMissionParams && this.currentMissionParams.objectiveType === 'EXTERMINATE') {
            this.isObjectiveComplete = this.enemyUnits ? this.enemyUnits.every(e => !e.isAlive()) : true;
            if (this.initialEnemyCount === 0 && (!this.enemyUnits || this.enemyUnits.length === 0)) this.isObjectiveComplete = true; 
        } else { this.isObjectiveComplete = false; /* Other objective types later */ }

        if (this.isObjectiveComplete) this.endMission(true);
        else if (this.deployedSquadRoster && this.deployedSquadRoster.length > 0 && this.deployedSquadRoster.every(unit => !unit.isAlive())) this.endMission(false);
    }

    update(deltaTime) { /* ... (Unchanged from previous complete version) ... */
        if (this.gameState !== 'RUNNING') return;
        if (this.inputHandler.isShiftPressed && 
            this.inputHandler.isLeftMouseDown && 
            !this.inputHandler.isShiftHoldFiring && 
            this.inputHandler.shiftLmbDownTime > 0 && 
            (performance.now() - this.inputHandler.shiftLmbDownTime > (this.inputHandler.TAP_THRESHOLD_MS || 150) )) {
            
            this.inputHandler.isShiftHoldFiring = true;
            this.handleShiftHoldStart(this.inputHandler.mousePos.worldX, this.inputHandler.mousePos.worldY);
        }
        if (this.selectedUnits && this.selectedUnits.length > 0) {
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
        allUnitsInGame.forEach(unit => {
            if (unit && typeof unit.update === 'function') {
                unit.update(deltaTime); 
            }
        });
        this.gameObjects = this.gameObjects.filter(obj => { if(obj) obj.update(deltaTime); return obj && !obj.isMarkedForDeletion; });
        this.visualEffects = this.visualEffects.filter(effect => { if(effect) effect.update(deltaTime); return effect && !effect.isMarkedForDeletion; });
        if (!this.missionStartedAndPopulated) this.missionStartedAndPopulated = true;
        this.checkMissionStatus();
    }

    render() { /* ... (Unchanged from previous complete version, but assuming the debug log for possum_hut is still there if needed) ... */
        if (!this.ctx || !this.level) {
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        this.ctx.fillStyle = CONFIG.DEFAULT_WORLD_BACKGROUND_COLOR || '#385434';
        const worldWidth = CONFIG.WORLD_WIDTH || this.canvas.width; 
        const worldHeight = CONFIG.WORLD_HEIGHT || this.canvas.height; 
        this.ctx.fillRect(0, 0, worldWidth, worldHeight);

        let sortableObjects = [];

        if (this.deployedSquadRoster) {
            this.deployedSquadRoster.forEach(unit => {
                if (unit && unit.isAlive()) {
                    sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true });
                }
            });
        }
        if (this.enemyUnits) {
            this.enemyUnits.forEach(unit => {
                if (unit && unit.isAlive()) {
                    sortableObjects.push({ entity: unit, sortY: unit.y + (unit.size / 2), isUnit: true });
                }
            });
        }

        if (this.level.obstacles) {
            this.level.obstacles.forEach(obstacle => {
                if (obstacle.type === 'border_wall') return; 

                if (!obstacle.isDestroyed || (obstacle.isDestroyed && obstacle.imageDestroyed)) {
                    let sortYValue;
                    sortYValue = obstacle.y + obstacle.height;
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
                    this.ctx.drawImage(obj.imageDestroyed, obj.x, obj.y, obj.width, obj.height);
                } else if (!obj.isDestroyed && obj.imageNormal) {
                    this.ctx.drawImage(obj.imageNormal, obj.x, obj.y, obj.width, obj.height);
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

                if (obj.destructible && !obj.isDestroyed && obj.hp < obj.maxHp && obj.hp > 0) {
                    const hpBarHeight = (CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR && CONFIG.UI_SETTINGS.HEALTH_BAR.HEIGHT) || 4;
                    const hpBarWidth = Math.min(obj.width * 0.7, 60);
                    const barX = obj.x + (obj.width - hpBarWidth) / 2;
                    const barY = obj.y - hpBarHeight - 4; 

                    this.ctx.fillStyle = (CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR && CONFIG.UI_SETTINGS.HEALTH_BAR.BG_COLOR) ||'#111';
                    this.ctx.fillRect(barX - 1, barY - 1, hpBarWidth + 2, hpBarHeight + 2);
                    this.ctx.fillStyle = (CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR && CONFIG.UI_SETTINGS.HEALTH_BAR.HP_COLOR_LOW_BG) || '#c00'; 
                    this.ctx.fillRect(barX, barY, hpBarWidth, hpBarHeight);
                    this.ctx.fillStyle = (CONFIG.UI_SETTINGS && CONFIG.UI_SETTINGS.HEALTH_BAR && CONFIG.UI_SETTINGS.HEALTH_BAR.HP_COLOR_FULL) ||'#0c0'; 
                    this.ctx.fillRect(barX, barY, hpBarWidth * (obj.hp / obj.maxHp), hpBarHeight);
                }
            }
        });

        this.gameObjects.forEach(obj => {
            if (obj && typeof obj.render === 'function') {
                obj.render(this.ctx);
            }
        });

        this.visualEffects.forEach(effect => {
            if (effect && typeof effect.render === 'function' && effect.type !== 'explosion_ground_mark') { 
                effect.render(this.ctx);
            }
        });

        if(this.selectedUnits) {
            this.selectedUnits.forEach(unit => {
                if (unit && unit.isAlive()) {
                    this.ctx.strokeStyle = '#00FF00'; 
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(unit.x, unit.y, unit.size + 4, 0, Math.PI * 2); 
                    this.ctx.stroke();
                }
            });
        }

        if(this.selectedUnits) {
            this.selectedUnits.forEach(unit => {
                if (unit && unit.isAlive() && unit.manualTarget && unit.manualTarget.isAlive() && !(unit instanceof Raccoon && unit.isAimingGrenade)) {
                     this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; 
                     this.ctx.lineWidth = 1;
                     this.ctx.setLineDash([3, 3]); 
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

            this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; 
            this.ctx.lineWidth = 1;
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

        if (this.isDragging && this.draggedFarEnough) {
            const dragRectWorldStartX = this.dragStartX + this.cameraX;
            const dragRectWorldStartY = this.dragStartY + this.cameraY;
            const dragRectWorldCurrentX = this.dragCurrentX + this.cameraX;
            const dragRectWorldCurrentY = this.dragCurrentY + this.cameraY;

            this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.fillStyle = 'rgba(50, 205, 50, 0.15)';

            const rectX = Math.min(dragRectWorldStartX, dragRectWorldCurrentX);
            const rectY = Math.min(dragRectWorldStartY, dragRectWorldCurrentY);
            const rectWidth = Math.abs(dragRectWorldCurrentX - dragRectWorldStartX);
            const rectHeight = Math.abs(dragRectWorldCurrentY - dragRectWorldStartY);

            this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }

        this.ctx.restore(); 
    }

    gameLoop(timestamp) { /* ... (Unchanged from previous complete version) ... */
        const now = performance.now(); if (!this.lastTime) this.lastTime = now;
        const deltaTime = Math.min((now - this.lastTime) / 1000, CONFIG.MAX_DELTA_TIME_STEP || 0.1);
        this.lastTime = now;
        if (this.gameState === 'RUNNING') this.update(deltaTime);
        this.render(); requestAnimationFrame(this.gameLoop);
    }

    calculateFormationPoints(centerX, centerY, units, formationType = 'HORIZONTAL') { /* ... (Unchanged from previous complete version) ... */
        const points = []; const aliveUnits = units ? units.filter(u => u.isAlive()) : []; const numUnits = aliveUnits.length;
        if (numUnits === 0) return points; if (numUnits === 1) { points.push({ x: centerX, y: centerY }); return points; }
        const spacing = (CONFIG.RACCOON_SIZE * 2) * this.formationSpacingMultiplier;
        if (formationType === 'HORIZONTAL') {
            const totalWidth = (numUnits - 1) * spacing; let startX = centerX - totalWidth / 2;
            for (let i = 0; i < numUnits; i++) points.push({ x: startX + i * spacing, y: centerY });
        } else { 
            const totalHeight = (numUnits - 1) * spacing; let startY = centerY - totalHeight / 2;
            for (let i = 0; i < numUnits; i++) points.push({ x: centerX, y: startY + i * spacing });
        } return points;
    }
}

class PromotionEffect { /* ... (Unchanged from previous complete version) ... */
    constructor(x, y, gameInstance) {
        this.game = gameInstance; this.x = x; this.y = y;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.PROMOTION) ? CONFIG.VISUAL_EFFECTS.PROMOTION : {};
        this.text = this.effectConfig.TEXT || "PROMOTED!"; this.lifetime = this.effectConfig.LIFETIME || 1.5;
        this.elapsedTime = 0; this.isMarkedForDeletion = false; this.type = 'promotion_text'; this.opacity = 1;
        this.velocityY = this.effectConfig.VELOCITY_Y || -20; this.font = this.effectConfig.FONT || "bold 16px 'Consolas'";
        this.colorRGB = this.effectConfig.COLOR_RGB_FADE_START || [255, 223, 0];
    }
    update(deltaTime) { this.elapsedTime += deltaTime; this.y += this.velocityY * deltaTime; this.opacity = 1 - (this.elapsedTime / this.lifetime); if (this.elapsedTime >= this.lifetime || this.opacity <= 0) this.isMarkedForDeletion = true; }
    render(ctx) { ctx.font = this.font; ctx.fillStyle = `rgba(${this.colorRGB[0]}, ${this.colorRGB[1]}, ${this.colorRGB[2]}, ${Math.max(0, this.opacity)})`; ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y); ctx.textAlign = 'left'; }
}

class ExplosionEffect { /* ... (Unchanged from previous complete version) ... */
    constructor(x, y, radius, gameInstance) {
        this.game = gameInstance; this.x = x; this.y = y; this.maxRadius = radius; this.currentRadius = 0;
        this.effectConfig = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.EXPLOSION) ? CONFIG.VISUAL_EFFECTS.EXPLOSION : {};
        this.lifetime = this.effectConfig.LIFETIME || 0.5; this.elapsedTime = 0; this.isMarkedForDeletion = false; this.type = 'explosion';
    }
    update(deltaTime) { this.elapsedTime += deltaTime; this.currentRadius = (this.elapsedTime / this.lifetime) * this.maxRadius; if (this.elapsedTime >= this.lifetime) this.isMarkedForDeletion = true; }
    render(ctx) {
        const progress = this.elapsedTime / this.lifetime; const alpha = 1 - progress;
        const colorIntensity = Math.floor(255 * (1 - progress*0.5)); const gIntensity = Math.floor(255 * (1-progress));
        ctx.fillStyle = `rgba(${colorIntensity}, ${Math.floor(gIntensity*0.6)}, 0, ${alpha*0.7})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.currentRadius,0,Math.PI*2); ctx.fill();
        if (progress < 0.4) { ctx.fillStyle = `rgba(255,255,${Math.floor(150+105*(1-progress/0.4))},${alpha})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.currentRadius*0.5,0,Math.PI*2); ctx.fill(); }
    }
}

window.addEventListener('DOMContentLoaded', () => { new Game('gameCanvas'); });