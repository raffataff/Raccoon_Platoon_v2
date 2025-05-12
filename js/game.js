// js/game.js
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
        
        this.isDragging = false;
        this.draggedFarEnough = false; 
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        this.DRAG_THRESHOLD = 5; 

        this.FORMATION_TYPES = ['HORIZONTAL', 'VERTICAL']; 
        this.currentFormationIndex = 0; 
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        this.formationSpacingMultiplier = 3.5; 
        
        this.cameraX = 0;
        this.cameraY = 0;
        
        this.level = new Level(this); 
        this.inputHandler = new InputHandler(this.canvas, this); 
        this.ui = new UI(this); 

        this.campaignData = CAMPAIGN_DATA; 
        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.currentMissionParams = null; 
        
        this.gameState = 'PRE_CAMPAIGN_INIT'; 
        this.missionObjective = null;
        this.isObjectiveComplete = false;
        this.initialEnemyCount = 0; 
        this.missionStartedAndPopulated = false; 
        this.missionStartTime = 0; 

        this.resizeCanvas(); 
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this); 

        // Initialize and start the game flow
        this.initializeNewCampaign(); 
        this.start(); 
    }

    initializeNewCampaign() {
        console.log("[Game.initializeNewCampaign] Initializing new campaign roster...");
        this.masterRoster = []; // Ensure it's truly empty
        this.fallenRaccoonsGlobal = []; 
        this.currentPhaseIndex = 0;
        this.currentMissionIndex = 0;
        this.deployedSquadRoster = []; // Clear deployed squad too
        this.selectedUnits = [];       // And selection
        
        const availableFaceImages = [...CONFIG.RACCOON_FACE_IMAGES];
        let nextRaccoonIdNum = 1;

        for (let i = 0; i < CONFIG.INITIAL_ROSTER_SIZE; i++) {
            let faceImageFile = CONFIG.RACCOON_FACE_IMAGES[0];
            if (availableFaceImages.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableFaceImages.length);
                faceImageFile = availableFaceImages.splice(randomIndex, 1)[0];
            } else if (CONFIG.RACCOON_FACE_IMAGES.length > 0) {
                faceImageFile = CONFIG.RACCOON_FACE_IMAGES[(this.masterRoster.length + nextRaccoonIdNum) % CONFIG.RACCOON_FACE_IMAGES.length];
            }
            const faceImageUrl = CONFIG.RACCOON_FACE_IMAGE_PATH + faceImageFile;
            
            // Create Raccoon with initial 0 XP, default rank, 0 kills
            const newRecruit = new Raccoon(0, 0, this, `RCN-MR${nextRaccoonIdNum++}`, faceImageUrl, 0, null, 0);
            this.masterRoster.push(newRecruit);
            console.log(`    Added ${newRecruit.id} to masterRoster. HP: ${newRecruit.hp}, Alive: ${newRecruit.isAlive()}`);
        }
        console.log(`[Game.initializeNewCampaign] Initial master roster created with ${this.masterRoster.length} recruits.`);
        this.gameState = 'PRE_CAMPAIGN'; // Set state to allow progression to pre-mission screen
    }
    
    getAvailableRecruits() {
        return this.masterRoster.filter(r => r.isAlive());
    }

    start() { 
        console.log(`[Game.start] Called. Current gameState: ${this.gameState}`);
        // If it's still in PRE_CAMPAIGN_INIT, something went wrong, or it's the very first call.
        if (this.gameState === 'PRE_CAMPAIGN_INIT') { 
             this.initializeNewCampaign(); // Should have been called by constructor, but as a safeguard.
        }

        const availableRecruits = this.getAvailableRecruits();
        console.log(`[Game.start] Available recruits: ${availableRecruits.length}, Master roster size: ${this.masterRoster.length}`);

        if (availableRecruits.length === 0 && this.masterRoster.length > 0) {
            console.error("[Game.start] GAME OVER - No available recruits in master roster!");
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if (this.ui) this.ui.showGameOverScreen("All Raccoons KIA! Operation Failed Utterly.");
            return;
        } else if (this.masterRoster.length === 0 ) { // No recruits AT ALL (e.g., INITIAL_ROSTER_SIZE was 0)
             console.error("[Game.start] FATAL: Master roster is empty. Cannot start campaign.");
             // This case should ideally show an error and not let player proceed
             if (this.ui) this.ui.showGameOverScreen("Roster catastrophically empty. Please check CONFIG.");
             return;
        }

        // Proceed to load mission data for the pre-mission screen
        if (this.loadMissionData(this.currentPhaseIndex, this.currentMissionIndex)) {
            console.log("[Game.start] Mission data loaded. Showing recruit selection screen.");
            if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(
                    this.campaignData[this.currentPhaseIndex], 
                    this.currentMissionParams,
                    availableRecruits // Pass the filtered available recruits
                );
            } else {
                console.error("[Game.start] UI or campaign data not ready for preMissionScreen_RecruitSelect.");
                 if (this.ui) this.ui.showGameOverScreen("Error preparing mission briefing.");
            }
        } else {
            console.log("[Game.start] Failed to load mission data. Assuming end of campaign.");
            this.gameState = 'CAMPAIGN_COMPLETE'; 
            if (this.ui) this.ui.showGameOverScreen("Campaign Concluded or Error Loading Next Mission!", true);
        }
    }
    
    // ... (rest of Game.js: loadMissionData, confirmSquadAndStartMission, etc. as previously provided)
    // Ensure they are the versions from the last successful "persistent roster" implementation.
    // Key parts of confirmSquadAndStartMission:
    //   - this.deployedSquadRoster = selectedRecruitReferences;
    //   - Reset HP/ammo for deployed units.
    //   - Call this.level.generateLevelAndGetPlayerSpawns(...)
    //   - Place deployed raccoons using returned spawn locations.
    //   - Set this.selectedUnits = [...this.deployedSquadRoster];
    //   - Initialize camera based on deployed squad.
    //   - Call ui.showHUD(), ui.updateSquadPanel(this.deployedSquadRoster)
    resizeCanvas() {
        if (!this.canvasContainer) { 
            this.canvasContainer = document.getElementById('canvas-container');
            if (!this.canvasContainer) {
                console.error("Canvas container not found for resize!");
                return;
            }
        }
        const containerWidth = this.canvasContainer.offsetWidth;
        const containerHeight = this.canvasContainer.offsetHeight;

        this.canvas.width = Math.max(CONFIG.MIN_CANVAS_WIDTH || 800, containerWidth);
        this.canvas.height = Math.max(CONFIG.MIN_CANVAS_HEIGHT || 600, containerHeight);

        if (this.gameState === 'RUNNING') {
            this.clampCamera();
        }
    }
    
    clampCamera() {
        const currentViewportWidth = this.canvas.width;
        const currentViewportHeight = this.canvas.height;
        const worldWidth = typeof CONFIG.WORLD_WIDTH === 'number' ? CONFIG.WORLD_WIDTH : 0;
        const worldHeight = typeof CONFIG.WORLD_HEIGHT === 'number' ? CONFIG.WORLD_HEIGHT : 0;

        this.cameraX = Math.max(0, Math.min(this.cameraX, worldWidth - currentViewportWidth));
        this.cameraY = Math.max(0, Math.min(this.cameraY, worldHeight - currentViewportHeight));
    }
    
    loadMissionData(phaseIdx, missionIdx) {
        if (this.campaignData && this.campaignData[phaseIdx] && this.campaignData[phaseIdx].missions && this.campaignData[phaseIdx].missions[missionIdx]) {
            this.currentPhaseIndex = phaseIdx;
            this.currentMissionIndex = missionIdx;
            this.currentMissionParams = this.campaignData[phaseIdx].missions[missionIdx];
            this.tempSelectedForDeployment = []; 
            return true;
        }
        this.currentMissionParams = null; 
        return false; 
    }

    confirmSquadAndStartMission(selectedRecruitsForDeployment) {
        if (!selectedRecruitsForDeployment || selectedRecruitsForDeployment.length === 0 || selectedRecruitsForDeployment.length > CONFIG.MAX_SQUAD_SIZE_MVP) {
            alert(`Invalid squad size. Select 1 to ${CONFIG.MAX_SQUAD_SIZE_MVP} recruits.`);
            if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect( 
                    this.campaignData[this.currentPhaseIndex], 
                    this.currentMissionParams,
                    this.getAvailableRecruits()
                );
            }
            return;
        }

        this.deployedSquadRoster = selectedRecruitsForDeployment;
        this.deployedSquadRoster.forEach(r => { 
            r.hp = r.maxHp; 
            r.grenadeAmmo = (r.rank === "Sergeant" ? 2 : CONFIG.RACCOON_STARTING_GRENADES + (r.rank === "Corporal" ? 1: 0)); 
            r.isMoving = false;
            r.manualTarget = null;
            r.autoTarget = null;
            r.actionTimer = 0;
            r.isAimingGrenade = false;
        });

        this.gameState = 'RUNNING';
        this.isObjectiveComplete = false;
        this.missionStartedAndPopulated = false; 
        this.fallenRaccoonsThisMission = []; 
        this.missionStartTime = performance.now(); 
        
        const worldWidth = CONFIG.BASE_WORLD_WIDTH * (this.currentMissionParams.worldSizeFactor || 1);
        const worldHeight = CONFIG.BASE_WORLD_HEIGHT * (this.currentMissionParams.worldSizeFactor || 1);
        
        CONFIG.WORLD_WIDTH = worldWidth; 
        CONFIG.WORLD_HEIGHT = worldHeight; 

        const playerSpawnLocations = this.level.generateLevelAndGetPlayerSpawns(
            worldWidth, worldHeight, 
            this.currentMissionParams, 
            this.deployedSquadRoster.length 
        ); 
        this.initialEnemyCount = this.enemyUnits.length; 

        this.deployedSquadRoster.forEach((raccoon, index) => {
            if (playerSpawnLocations[index]) {
                raccoon.x = playerSpawnLocations[index].x;
                raccoon.y = playerSpawnLocations[index].y;
                raccoon.targetX = raccoon.x; 
                raccoon.targetY = raccoon.y;
                raccoon.game = this; 
            } else {
                raccoon.x = 100 + index * 30; raccoon.y = (CONFIG.WORLD_HEIGHT || this.canvas.height) / 2; 
            }
        });
        
        this.selectedUnits = [...this.deployedSquadRoster]; 
        
        this.gameObjects = [];   
        this.visualEffects = []; 
        this.isDragging = false; 
        this.draggedFarEnough = false;

        // Initialize camera position based on the NOW DEPLOYED squad
        if (this.deployedSquadRoster && this.deployedSquadRoster.length > 0) { // Check deployedSquadRoster
            let avgX = 0, avgY = 0;
            this.deployedSquadRoster.forEach(unit => { avgX += unit.x; avgY += unit.y; });
            avgX /= this.deployedSquadRoster.length;
            
            this.cameraX = avgX - this.canvas.width / 2; 
            this.cameraY = avgY - this.canvas.height / 2; 
            this.clampCamera(); 
        } else { 
            // Fallback if no units deployed (shouldn't happen if confirmSquadAndStartMission validates squad size)
            this.cameraX = (CONFIG.WORLD_WIDTH - this.canvas.width) / 2;
            this.cameraY = (CONFIG.WORLD_HEIGHT - this.canvas.height) / 2;
            this.clampCamera();
        }

        if (this.ui) {
            this.ui.hidePreMissionScreen();
            this.ui.showHUD(); 
            this.ui.updateObjective(this.currentMissionParams.name); 
            this.ui.updateSquadPanel(this.deployedSquadRoster); 
            this.ui.updateFormationButton(this.currentFormationType); 
        }
        if (this.inputHandler) this.inputHandler.updateMouseCursor(); 

        if (!this.lastTime) { 
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        } else { 
            this.lastTime = performance.now();
        }
    }
    
    recordRaccoonFallen(raccoon) {
        if (raccoon && raccoon.team === 'player') {
            if (!this.fallenRaccoonsThisMission.find(r => r.id === raccoon.id)) {
                this.fallenRaccoonsThisMission.push({
                    id: raccoon.id, 
                    rank: raccoon.rank,
                    faceImageUrl: raccoon.faceImageUrl 
                });
            }
            const alreadyInGlobalFallen = this.fallenRaccoonsGlobal.find(r => r.id === raccoon.id);
            if (!alreadyInGlobalFallen) {
                this.fallenRaccoonsGlobal.push({
                    id: raccoon.id, rank: raccoon.rank, faceImageUrl: raccoon.faceImageUrl,
                    missionDied: this.currentMissionParams ? this.currentMissionParams.name : "Unknown Mission",
                    phaseDied: (this.campaignData && this.campaignData[this.currentPhaseIndex]) ? this.campaignData[this.currentPhaseIndex].name : "Unknown Phase"
                });
            }
        }
    }

    addNewRecruitToMasterRoster() {
        if (!this.game) return; 
        const availableFaceImages = [...CONFIG.RACCOON_FACE_IMAGES];
        let faceImageFile = CONFIG.RACCOON_FACE_IMAGES[0]; 
        
        let attempts = 0;
        do {
            const randomIndex = Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length);
            faceImageFile = CONFIG.RACCOON_FACE_IMAGES[randomIndex];
            attempts++;
        } while (this.masterRoster.find(r => r.faceImageUrl && r.faceImageUrl.endsWith(faceImageFile)) && attempts < CONFIG.RACCOON_FACE_IMAGES.length * 2);


        const faceImageUrl = CONFIG.RACCOON_FACE_IMAGE_PATH + faceImageFile;
        const newRecruitId = `RCN-MR${this.masterRoster.length + this.fallenRaccoonsGlobal.length + 1 + Math.floor(Math.random()*100)}`;
        
        const newRecruit = new Raccoon(0, 0, this, newRecruitId, faceImageUrl); 
        this.masterRoster.push(newRecruit);
    }

    endMission(isVictory) {
        this.gameState = 'POST_MISSION_DEBRIEF'; 
        const missionDuration = (performance.now() - this.missionStartTime) / 1000; 
        
        let enemiesKilledThisMission = 0;
        if(this.enemyUnits) this.enemyUnits.forEach(e => { if (!e.isAlive()) enemiesKilledThisMission++;});

        if (isVictory) {
            const survivalXp = CONFIG.XP_PER_MISSION_SURVIVED || 0;
            if (survivalXp > 0 && this.deployedSquadRoster) { 
                this.deployedSquadRoster.forEach(raccoon => {
                    if (raccoon.isAlive() && typeof raccoon.addXp === 'function') {
                        raccoon.addXp(survivalXp); 
                    }
                });
            }
            if (this.masterRoster.length < (CONFIG.MAX_TOTAL_ROSTER_SIZE || 20)) { 
                 for (let i=0; i < (CONFIG.NEW_RECRUITS_PER_MISSION_WIN || 0); i++) {
                    this.addNewRecruitToMasterRoster();
                }
            }
        }

        const debriefData = {
            isVictory: isVictory,
            phaseData: this.campaignData && this.campaignData[this.currentPhaseIndex] ? this.campaignData[this.currentPhaseIndex] : {name: "Unknown Phase"},
            missionData: this.currentMissionParams || {name: "Unknown Mission"},
            survivingRaccoons: this.deployedSquadRoster ? this.deployedSquadRoster.filter(r => r.isAlive()) : [],
            fallenRaccoons: this.fallenRaccoonsThisMission, 
            enemiesKilled: enemiesKilledThisMission,
            timeTaken: missionDuration.toFixed(1),
            campaignComplete: false 
        };

        if (this.ui) {
            this.ui.hideHUD(); 
            this.ui.showPostMissionScreen_Debrief(debriefData); 
            if (this.inputHandler) this.inputHandler.updateMouseCursor(); 
        }
    }
    
    proceedToNextLogicalStep() { 
        if (this.gameState === 'CAMPAIGN_COMPLETE') {
            if(this.ui) this.ui.showGameOverScreen("Campaign Already Complete! You Win!", true);
            return;
        }
        
        if (this.isObjectiveComplete) { 
            this.currentMissionIndex++;
            const currentPhaseData = this.campaignData ? this.campaignData[this.currentPhaseIndex] : null;
            if (!currentPhaseData || this.currentMissionIndex >= currentPhaseData.missions.length) {
                this.currentPhaseIndex++;
                this.currentMissionIndex = 0;
                if (!this.campaignData || !this.campaignData[this.currentPhaseIndex]) {
                    console.log("ENTIRE CAMPAIGN COMPLETE!");
                    this.gameState = 'CAMPAIGN_COMPLETE'; 
                    if(this.ui) this.ui.showGameOverScreen("Campaign Victorious!", true, true); 
                    return;
                }
            }
        }

        if (this.getAvailableRecruits().length === 0) {
            console.log("GAME OVER - No available recruits for next mission!");
            this.gameState = 'GAME_OVER_NO_RECRUITS';
            if(this.ui) this.ui.showGameOverScreen("All Raccoons KIA. Operation Failed.");
            return;
        }

        if (this.loadMissionData(this.currentPhaseIndex, this.currentMissionIndex)) {
             if (this.ui && this.campaignData && this.campaignData[this.currentPhaseIndex] && this.currentMissionParams) {
                this.ui.showPreMissionScreen_RecruitSelect(
                    this.campaignData[this.currentPhaseIndex], 
                    this.currentMissionParams,
                    this.getAvailableRecruits()
                );
            } else {
                console.error("UI or campaign data not ready for preMissionScreen_RecruitSelect after proceeding.");
                 if(this.ui) this.ui.showGameOverScreen("Error preparing next mission briefing.");
            }
        } else {
            console.error("Failed to load data for the next mission/phase. Assuming end of campaign.");
            this.gameState = 'CAMPAIGN_COMPLETE'; 
            if(this.ui) this.ui.showGameOverScreen("Campaign Concluded (or data error)!", true);
        }
    }
    
    toggleFormation() {
        if (this.gameState !== 'RUNNING') return;
        this.currentFormationIndex = (this.currentFormationIndex + 1) % this.FORMATION_TYPES.length;
        this.currentFormationType = this.FORMATION_TYPES[this.currentFormationIndex];
        if(this.ui) this.ui.updateFormationButton(this.currentFormationType); 
    }

    setFormationSpacing(multiplier) {
        if (this.gameState !== 'RUNNING') return;
        this.formationSpacingMultiplier = parseFloat(multiplier);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'RUNNING') return;

        if (this.selectedUnits && this.selectedUnits.length > 0) { 
            let avgX = 0;
            let avgY = 0;
            let count = 0;
            this.selectedUnits.forEach(unit => {
                if (unit.isAlive()) { 
                    avgX += unit.x;
                    avgY += unit.y;
                    count++;
                }
            });
            if (count > 0) {
                avgX /= count;
                avgY /= count;

                let targetCameraX = avgX - this.canvas.width / 2;
                let targetCameraY = avgY - this.canvas.height / 2;
                
                targetCameraX = Math.max(0, Math.min(targetCameraX, CONFIG.WORLD_WIDTH - this.canvas.width));
                targetCameraY = Math.max(0, Math.min(targetCameraY, CONFIG.WORLD_HEIGHT - this.canvas.height));
                
                this.cameraX += (targetCameraX - this.cameraX) * CONFIG.CAMERA_LERP_SPEED;
                this.cameraY += (targetCameraY - this.cameraY) * CONFIG.CAMERA_LERP_SPEED;

                if (Math.abs(this.cameraX - targetCameraX) < 0.5) this.cameraX = targetCameraX;
                if (Math.abs(this.cameraY - targetCameraY) < 0.5) this.cameraY = targetCameraY;
                
                this.clampCamera(); 
            }
        } 

        const allUnitsInGame = [];
        if(this.deployedSquadRoster) allUnitsInGame.push(...this.deployedSquadRoster); 
        if(this.enemyUnits) allUnitsInGame.push(...this.enemyUnits);

        allUnitsInGame.forEach(unit => {
            if (unit && typeof unit.update === 'function') {
                unit.update(deltaTime);
            }
        });
        
        this.gameObjects = this.gameObjects.filter(obj => {
            if (obj && typeof obj.update === 'function') {
                obj.update(deltaTime);
            }
            return obj && !obj.isMarkedForDeletion;
        });

        this.visualEffects = this.visualEffects.filter(effect => {
            if (effect && typeof effect.update === 'function') { 
                effect.update(deltaTime);
                return !effect.isMarkedForDeletion;
            }
            return false;
        });

        if (!this.missionStartedAndPopulated) {
            this.missionStartedAndPopulated = true; 
        }
        this.checkMissionStatus();
    }
    render() {
        if (!this.ctx || !this.level) return; 

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        
        this.ctx.fillStyle = '#385434'; 
        this.ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT); 

        if(this.level.obstacles) this.level.obstacles.forEach(obstacle => { 
            if (!obstacle.isDestroyed) { 
                let obsColor = obstacle.color || '#555555';
                if (obstacle.destructible && obstacle.hp < obstacle.maxHp && obstacle.hp > 0) { 
                    const damageRatio = Math.max(0, obstacle.hp / obstacle.maxHp); 
                    let r = parseInt(obsColor.substring(1, 3), 16);
                    let g = parseInt(obsColor.substring(3, 5), 16);
                    let b = parseInt(obsColor.substring(5, 7), 16);
                    
                    const greyVal = 80;
                    r = Math.floor(r * damageRatio + greyVal * (1 - damageRatio));
                    g = Math.floor(g * damageRatio + greyVal * (1 - damageRatio));
                    b = Math.floor(b * damageRatio + greyVal * (1 - damageRatio));
                    obsColor = `rgb(${r},${g},${b})`;
                }
                this.ctx.fillStyle = obsColor;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                if (obstacle.destructible && obstacle.hp < obstacle.maxHp && obstacle.hp > 0) { 
                    const hpBarHeight = 6;
                    const hpBarWidth = Math.min(obstacle.width * 0.7, 60); 
                    const barX = obstacle.x + (obstacle.width - hpBarWidth) / 2;
                    const barY = obstacle.y - hpBarHeight - 4; 
                    
                    this.ctx.fillStyle = '#111'; 
                    this.ctx.fillRect(barX - 1, barY - 1, hpBarWidth + 2, hpBarHeight + 2);
                    this.ctx.fillStyle = '#c00'; 
                    this.ctx.fillRect(barX, barY, hpBarWidth, hpBarHeight);
                    this.ctx.fillStyle = '#0c0'; 
                    this.ctx.fillRect(barX, barY, hpBarWidth * (obstacle.hp / obstacle.maxHp), hpBarHeight);
                }

            } else { 
                this.ctx.fillStyle = 'rgba(50, 40, 30, 0.7)'; 
                this.ctx.fillRect(
                    obstacle.x + obstacle.width * 0.1, 
                    obstacle.y + obstacle.height * 0.1, 
                    obstacle.width * 0.8, 
                    obstacle.height * 0.8
                );
            }
        });
        
        this.visualEffects.forEach(effect => {
            if (effect && typeof effect.render === 'function' && effect.type === 'explosion_ground_mark') { 
                effect.render(this.ctx);
            }
        });

        const unitsToRenderOnMap = [];
        if(this.deployedSquadRoster) unitsToRenderOnMap.push(...this.deployedSquadRoster);
        if(this.enemyUnits) unitsToRenderOnMap.push(...this.enemyUnits);

        unitsToRenderOnMap.forEach(unit => {
            if (unit && typeof unit.render === 'function') {
                unit.render(this.ctx);
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

        if(this.selectedUnits) this.selectedUnits.forEach(unit => { 
            if (unit && unit.isAlive()) {
                this.ctx.strokeStyle = '#00FF00'; 
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(unit.x, unit.y, unit.size + 4, 0, Math.PI * 2); 
                this.ctx.stroke();
            }
        });

        if(this.selectedUnits) this.selectedUnits.forEach(unit => { 
            if (unit && unit.isAlive() && unit.manualTarget && unit.manualTarget.isAlive() && !(unit.isAimingGrenade)) { 
                 this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; 
                 this.ctx.lineWidth = 1;
                 this.ctx.beginPath();
                 this.ctx.moveTo(unit.x, unit.y);
                 this.ctx.lineTo(unit.manualTarget.x, unit.manualTarget.y);
                 this.ctx.stroke();
            }
        });

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

    gameLoop(timestamp) {
        const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1); 
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();
        
        if (this.gameState === 'RUNNING' && this.ui) { 
            this.ui.updateSquadPanel(this.deployedSquadRoster); 
        }

        requestAnimationFrame(this.gameLoop);
    }


    handleMapClick(worldX, worldY, isRightClick) { 
        if (this.gameState !== 'RUNNING') {
            return;
        }

        let clickedOnEnemyUnit = null;
        if(this.enemyUnits) this.enemyUnits.forEach(enemy => { 
            if (enemy.isAlive() && distance(worldX, worldY, enemy.x, enemy.y) < enemy.size + 5) {
                clickedOnEnemyUnit = enemy;
            }
        });


        let clickedOnShootableObstacle = null;
        if (!clickedOnEnemyUnit && this.level && this.level.obstacles) { 
            for (const obs of this.level.obstacles) {
                if (obs.destructible && obs.type === 'explosive_barrel' && !obs.isDestroyed &&
                    worldX >= obs.x && worldX <= obs.x + obs.width &&
                    worldY >= obs.y && worldY <= obs.y + obs.height) {
                    clickedOnShootableObstacle = obs;
                    break;
                }
            }
        }

        const aimingRaccoons = this.selectedUnits ? this.selectedUnits.filter( 
            unit => unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive()
        ) : [];

        if (aimingRaccoons.length > 0) {
            const leaderAimer = aimingRaccoons[0]; 
            if (isRightClick) { 
                aimingRaccoons.forEach(r => r.cancelGrenadeAim());
            } else { 
                const distToClickPoint = distance(leaderAimer.x, leaderAimer.y, worldX, worldY); 
                if (distToClickPoint <= CONFIG.RACCOON_GRENADE_THROW_RANGE_MAX) {
                    leaderAimer.confirmThrowGrenade(worldX, worldY); 
                } else { 
                    if (clickedOnEnemyUnit) {
                        leaderAimer.moveToGrenadeRange(clickedOnEnemyUnit);
                    }
                }
            }
            return;  
        }

        if (isRightClick) { 
            if (this.selectedUnits && this.selectedUnits.length > 0) { 
                const formationPoints = this.calculateFormationPoints(worldX, worldY, this.selectedUnits, this.currentFormationType); 
                
                this.selectedUnits.forEach((unit, index) => {
                    if (unit.isAlive() && unit.team === 'player') {
                        const targetPoint = formationPoints[index] || {x: worldX, y: worldY}; 
                        unit.setMoveTarget(targetPoint.x, targetPoint.y); 
                    }
                });
            }
        } else { 
            if (clickedOnEnemyUnit) { 
                if(this.selectedUnits) this.selectedUnits.forEach(playerUnit => { 
                    if (playerUnit.isAlive() && playerUnit.team === 'player') {
                        playerUnit.setManualTarget(clickedOnEnemyUnit); 
                    }
                });
            } else if (clickedOnShootableObstacle) { 
                if(this.selectedUnits) this.selectedUnits.forEach(playerUnit => { 
                    if (playerUnit.isAlive() && playerUnit.team === 'player' && playerUnit.weapon) {
                        const obstacleTargetPoint = {
                            x: clickedOnShootableObstacle.x + clickedOnShootableObstacle.width / 2,
                            y: clickedOnShootableObstacle.y + clickedOnShootableObstacle.height / 2,
                            isAlive: () => !clickedOnShootableObstacle.isDestroyed, 
                            team: 'neutral_object' 
                        };
                        playerUnit.setManualTarget(obstacleTargetPoint);
                    }
                });
            } else { 
                let clickedOnPlayerUnit = null;
                if(this.deployedSquadRoster) this.deployedSquadRoster.forEach(playerUnit => { 
                     if (playerUnit.isAlive() && distance(worldX, worldY, playerUnit.x, playerUnit.y) < playerUnit.size + 5) { 
                        clickedOnPlayerUnit = playerUnit;
                    }
                });
                if (clickedOnPlayerUnit) { 
                    this.selectedUnits = [clickedOnPlayerUnit]; 
                } else { 
                    this.deselectAllUnits();
                }
            }
        }
    }
    
    calculateFormationPoints(centerX, centerY, units, formationType = 'HORIZONTAL') {
        const points = [];
        const numUnits = units ? units.length : 0; 
        if (numUnits === 0) return points;
        if (numUnits === 1) { 
            points.push({ x: centerX, y: centerY });
            return points;
        }

        const spacing = CONFIG.RACCOON_SIZE * this.formationSpacingMultiplier; 

        if (formationType === 'HORIZONTAL') {
            const totalWidth = (numUnits - 1) * spacing;
            let startX = centerX - totalWidth / 2;
            for (let i = 0; i < numUnits; i++) {
                points.push({
                    x: startX + i * spacing,
                    y: centerY 
                });
            }
        } else if (formationType === 'VERTICAL') {
            const totalHeight = (numUnits - 1) * spacing;
            let startY = centerY - totalHeight / 2;
            for (let i = 0; i < numUnits; i++) {
                points.push({
                    x: centerX,
                    y: startY + i * spacing
                });
            }
        } else { 
             const totalWidth = (numUnits - 1) * spacing;
            let startX = centerX - totalWidth / 2;
            for (let i = 0; i < numUnits; i++) {
                points.push({
                    x: startX + i * spacing,
                    y: centerY 
                });
            }
        }
        return points;
    }

    selectUnitsInDragRectangle() { 
        if (!this.draggedFarEnough) return; 

        const worldDragStartX = this.dragStartX + this.cameraX;
        const worldDragStartY = this.dragStartY + this.cameraY;
        const worldDragCurrentX = this.dragCurrentX + this.cameraX;
        const worldDragCurrentY = this.dragCurrentY + this.cameraY;

        const rectX = Math.min(worldDragStartX, worldDragCurrentX);
        const rectY = Math.min(worldDragStartY, worldDragCurrentY);
        const rectWidth = Math.abs(worldDragCurrentX - worldDragStartX);
        const rectHeight = Math.abs(worldDragCurrentY - worldDragStartY);

        let newlySelectedUnits = [];
        
        if(this.deployedSquadRoster) this.deployedSquadRoster.forEach(unit => { 
            if (unit.isAlive()) {
                if (unit.x >= rectX && unit.x <= rectX + rectWidth &&
                    unit.y >= rectY && unit.y <= rectY + rectHeight) {
                    if (!newlySelectedUnits.includes(unit)) { 
                       newlySelectedUnits.push(unit);
                    }
                }
            }
        });
        
        this.selectedUnits = newlySelectedUnits;

        if(this.selectedUnits) this.selectedUnits.forEach(unit => { 
            if (unit instanceof Raccoon && unit.isAimingGrenade) {
                unit.cancelGrenadeAim(); 
            }
        });

        if(this.ui) this.ui.updateSquadPanel(this.deployedSquadRoster); 
    }
    
    deselectAllUnits() {
        const wasAiming = this.selectedUnits && this.selectedUnits.some(unit => unit instanceof Raccoon && unit.isAimingGrenade); 
        if(this.selectedUnits) this.selectedUnits.forEach(unit => { 
            if (unit instanceof Raccoon && unit.isAimingGrenade) {
                unit.cancelGrenadeAim(); 
            }
        });
        this.selectedUnits = [];
        if(this.ui) this.ui.updateSquadPanel(this.deployedSquadRoster); 
        if (wasAiming || (this.inputHandler && this.inputHandler.mousePos)) { 
             if (this.inputHandler) this.inputHandler.updateMouseCursor();
        } else {
            if (this.ui) this.ui.setCursor('default'); 
        }
    }
    
    selectAllPlayerUnits() { 
        const wasAiming = this.selectedUnits && this.selectedUnits.some(unit => unit instanceof Raccoon && unit.isAimingGrenade); 
        this.selectedUnits = this.deployedSquadRoster ? this.deployedSquadRoster.filter(unit => unit.isAlive()) : []; 
        if(this.selectedUnits) this.selectedUnits.forEach(unit => { 
            if (unit instanceof Raccoon && unit.isAimingGrenade) {
                unit.cancelGrenadeAim();
            }
        });
        if(this.ui) this.ui.updateSquadPanel(this.deployedSquadRoster); 
        if (wasAiming || (this.inputHandler && this.inputHandler.mousePos)) {
            if (this.inputHandler) this.inputHandler.updateMouseCursor();
        } else {
            if (this.ui) this.ui.setCursor('default');
        }
    }

    addProjectile(projectile) {
        this.gameObjects.push(projectile);
    }

    addVisualEffect(type, x, y, radius) { 
        if (type === 'explosion') {
            this.visualEffects.push(new ExplosionEffect(x, y, radius));
        } else if (type === 'promotion') {
            const unit = this.deployedSquadRoster && this.deployedSquadRoster.find(r => r.id === radius);  
            if (unit) { 
                this.visualEffects.push(new PromotionEffect(unit.x, unit.y - unit.size - 10, "PROMOTED!"));
            }
        }
    }

    checkMissionStatus() {
        if (this.gameState !== 'RUNNING' || !this.missionStartedAndPopulated) {
            return;
        }

        if (this.missionObjective && this.missionObjective.type === 'EXTERMINATE') {
            const allEnemiesDefeated = this.enemyUnits && this.enemyUnits.length > 0 ? 
                                       this.enemyUnits.every(enemy => !enemy.isAlive()) : 
                                       this.initialEnemyCount === 0; 

            if (this.initialEnemyCount > 0 && allEnemiesDefeated) {
                this.isObjectiveComplete = true;
            } else if (this.initialEnemyCount === 0 ) { 
                this.isObjectiveComplete = true; 
            }else {
                this.isObjectiveComplete = false;
            }
        }
        
        if (this.isObjectiveComplete) {
            this.endMission(true);
        } else {
            const allPlayerUnitsLost = this.deployedSquadRoster && this.deployedSquadRoster.length > 0 && this.deployedSquadRoster.every(unit => !unit.isAlive());
            if (allPlayerUnitsLost) {
                this.endMission(false);
            }
        }
    }
}

// ... (PromotionEffect, ExplosionEffect classes, and window.onload)
class PromotionEffect { 
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.lifetime = 1.5; 
        this.elapsedTime = 0;
        this.isMarkedForDeletion = false;
        this.type = 'promotion_text';
        this.opacity = 1;
        this.velocityY = -20; 
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.y += this.velocityY * deltaTime;
        this.opacity = 1 - (this.elapsedTime / this.lifetime);

        if (this.elapsedTime >= this.lifetime || this.opacity <=0) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.font = "bold 16px 'Consolas', 'Lucida Console', monospace";
        ctx.fillStyle = `rgba(255, 223, 0, ${Math.max(0, this.opacity)})`; 
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.textAlign = 'left'; 
    }
}
class ExplosionEffect { 
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.lifetime = 0.5; 
        this.elapsedTime = 0;
        this.isMarkedForDeletion = false;
        this.type = 'explosion';
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.currentRadius = (this.elapsedTime / this.lifetime) * this.maxRadius;
        if (this.elapsedTime >= this.lifetime) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        const progress = this.elapsedTime / this.lifetime;
        const alpha = 1 - progress;
        const colorIntensity = Math.floor(255 * (1 - progress * 0.5));

        ctx.fillStyle = `rgba(${colorIntensity}, ${Math.floor(colorIntensity * 0.6)}, 0, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();

        if (progress < 0.3) { 
             ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
             ctx.beginPath();
             ctx.arc(this.x, this.y, this.currentRadius * 0.5, 0, Math.PI * 2);
             ctx.fill();
        }
    }
}


window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
    // game.start(); // Game.start() is now called at the end of the Game constructor
});