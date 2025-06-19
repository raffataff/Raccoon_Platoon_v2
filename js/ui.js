// js/ui.js
class UI {
    constructor(game) {
        this.game = game;
        this.uiText = CONFIG.UI_TEXT_STRINGS || {};
        this.uiSettings = CONFIG.UI_SETTINGS || {};

        this.mainMenuScreen = document.getElementById('mainMenuScreen');
        this.newCampaignButton = document.getElementById('newCampaignButton');
        this.mainMenuMemorialButton = document.getElementById('mainMenuMemorialButton');
        this.optionsButton = document.getElementById('optionsButton');

        this.preMissionScreen = document.getElementById('preMissionScreen');
        this.postMissionScreen = document.getElementById('postMissionScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.recruitMemorialScreen = document.getElementById('recruitMemorialScreen');
        this.memorialEntriesContainer = document.getElementById('memorialEntriesContainer');
        this.backFromMemorialButton = document.getElementById('backFromMemorialButton');
        this.viewMemorialButton = document.getElementById('viewMemorialButton');
        this.leftHudPanel = document.getElementById('left-hud-panel');
        this.squadPanel = document.getElementById('hud-squad');
        this.objectiveTextContainer = document.getElementById('objectiveTextContainer'); 

        this.missionOutcomeText = document.getElementById('missionOutcome');
        
        this.preMissionPhaseTitle = document.getElementById('preMissionPhaseTitle');
        this.preMissionTitle = document.getElementById('preMissionTitle');
        this.preMissionBriefing = document.getElementById('preMissionBriefing');
        this.preMissionObjectivesList = document.getElementById('preMissionObjectivesList');
        this.availableRecruitsGrid = document.getElementById('availableRecruitsGrid');
        this.deployedSquadList = document.getElementById('deployedSquadList');

        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.restartCampaignButton = document.getElementById('restartCampaignButton');
        this.toggleFormationButton = document.getElementById('toggleFormationButton');
        this.formationSpacingSlider = document.getElementById('formationSpacingSlider');
        this.spacingValueDisplay = document.getElementById('spacingValueDisplay');
        this.pauseMenuScreen = document.getElementById('pauseMenuScreen');
        this.resumeGameButton = document.getElementById('resumeGameButton');
        this.restartMissionPauseButton = document.getElementById('restartMissionPauseButton');
        this.mainMenuPauseButton = document.getElementById('mainMenuPauseButton');
        this.startMissionButton = document.getElementById('startMissionButton');
        this.retryMissionButton = document.getElementById('retryMissionButton');
        this.nextMissionButton = document.getElementById('nextMissionButton');

        this.videoLoadingScreen = document.getElementById('videoLoadingScreen');
        this.loadingVideoPlayer = document.getElementById('loadingVideoPlayer');
        
        this._addSoundToButton(this.newCampaignButton, () => {
            if (this.game) {
                this.hideMainMenuScreen();
                this.game.initializeNewCampaign();
                this.game.start();
            }
        });
        this._addSoundToButton(this.mainMenuMemorialButton, () => this.showRecruitMemorialScreen());

        this._addSoundToButton(this.startMissionButton, () => {
            if (this.game) {
                const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
                const currentCount = this.game.tempSelectedForDeployment ? this.game.tempSelectedForDeployment.length : 0;
                if (currentCount > 0 && currentCount <= maxSquadSize) {
                    this.game.confirmSquadAndStartMission(this.game.tempSelectedForDeployment);
                } else if (currentCount > maxSquadSize) {
                    alert((this.uiText.START_MISSION_BUTTON_ALERT_MAX_SIZE || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()));
                } else {
                    alert(this.uiText.START_MISSION_BUTTON_ALERT_MIN_SIZE || "Select at least one Raccoon for the mission!");
                }
            }
        });

        this._addSoundToButton(this.retryMissionButton, () => {
             if (this.game) {
                if (this.game.generateAndSetCurrentMissionParams(this.game.currentPhaseIndex, this.game.currentMissionIndex)) { 
                    const currentPhaseData = this.game.campaignStructure[this.game.currentPhaseIndex]; 
                    if (currentPhaseData && this.game.currentMissionParams) {
                        this.showPreMissionScreen_RecruitSelect(
                            currentPhaseData,
                            this.game.currentMissionParams, 
                            this.game.getAvailableRecruits()
                        );
                    } else {
                        console.error("UI: Failed to get phase data or mission params for retry pre-mission screen.");
                        this.game.quitToMainMenu(); 
                    }
                } else {
                    this.showGameOverScreen(this.uiText.ERROR_LOADING_MISSION_RETRY || "Error reloading mission for retry.");
                }
            }
        });
        this._addSoundToButton(this.nextMissionButton, () => {
            if (this.game) {
                if (this.nextMissionButton.textContent === (this.uiText.BUTTON_TEXT_RESTART_CAMPAIGN || "Restart Campaign") ||
                    this.nextMissionButton.textContent === (this.uiText.BUTTON_TEXT_CAMPAIGN_COMPLETE || "View Final Stats") ) {
                    this.game.initializeNewCampaign();
                    this.game.start();
                } else {
                    this.game.proceedToNextLogicalStep();
                }
            }
        });
        this._addSoundToButton(this.resumeGameButton, () => {
            if (this.game) this.game.togglePause();
        });
        this._addSoundToButton(this.restartMissionPauseButton, () => {
            if (this.game) {
                this.hidePauseMenuScreen();
                this.game.restartCurrentMission();
            }
        });
        this._addSoundToButton(this.mainMenuPauseButton, () => {
            if (this.game) {
                this.hidePauseMenuScreen();
                this.game.quitToMainMenu();
            }
        });
        this._addSoundToButton(this.restartCampaignButton, () => {
             if (this.game) { this.game.initializeNewCampaign(); this.game.start(); }
        });
        this._addSoundToButton(this.toggleFormationButton, () => {
            if (this.game && typeof this.game.toggleFormation === 'function') this.game.toggleFormation();
        });
        this._addSoundToButton(this.viewMemorialButton, () => this.showRecruitMemorialScreen());
        this._addSoundToButton(this.backFromMemorialButton, () => {
            this.hideRecruitMemorialScreen();
            if (this.game && this.game.gameState === 'POST_MISSION_DEBRIEF' && this.postMissionScreen) {
                 this.postMissionScreen.style.display = 'flex';
            } else if (this.game && this.game.gameState === 'MAIN_MENU' && this.mainMenuScreen) {
                 this.mainMenuScreen.style.display = 'flex';
            }
        });

        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game) {
            const initialSpacing = (this.game && this.game.formationSpacingMultiplier !== undefined) ? this.game.formationSpacingMultiplier : (CONFIG.INITIAL_FORMATION_SPACING || 3.5);
            this.formationSpacingSlider.value = initialSpacing.toString();
            if (this.spacingValueDisplay) this.spacingValueDisplay.textContent = initialSpacing.toFixed(1);
            this.formationSpacingSlider.addEventListener('input', () => {
                const newMultiplier = parseFloat(this.formationSpacingSlider.value);
                if(this.game) this.game.setFormationSpacing(newMultiplier);
                if(this.spacingValueDisplay) this.spacingValueDisplay.textContent = newMultiplier.toFixed(1);
            });
        }
        if (this.squadPanel) {
            this.squadPanel.addEventListener('click', (event) => {
                if (!this.game || this.game.gameState !== 'RUNNING') return;
                const clickedCard = event.target.closest('.squad-member');
                if (clickedCard && clickedCard.dataset.id) {
                    const clickedRaccoonId = clickedCard.dataset.id;
                    const raccoon = this.game.deployedSquadRoster.find(r => r.id === clickedRaccoonId);
                    if (raccoon && raccoon.isAlive()) {
                        const isCtrlPressed = event.ctrlKey || event.metaKey;
                        if (isCtrlPressed) {
                            const indexInSelection = this.game.selectedUnits.findIndex(u => u.id === raccoon.id);
                            if (indexInSelection > -1) this.game.selectedUnits.splice(indexInSelection, 1);
                            else this.game.selectedUnits.push(raccoon);
                        } else { this.game.selectedUnits = [raccoon]; }
                        this.updateSquadPanel();
                        if (this.game.inputHandler) this.game.inputHandler.updateMouseCursor();
                    }
                }
            });
        }
        
        this._applyHoverSoundsToAllButtons();
    }

    _addSoundToButton(buttonElement, clickCallback) {
        if (buttonElement) {
            buttonElement.addEventListener('click', () => {
                if (this.game && this.game.audioManager) {
                    this.game.audioManager.play('UI_BUTTON_CLICK');
                }
                if (clickCallback) {
                    clickCallback();
                }
            });
        }
    }

    _applyHoverSoundsToAllButtons() {
        const buttons = [
            this.newCampaignButton, this.mainMenuMemorialButton, this.optionsButton,
            this.startMissionButton, this.retryMissionButton, this.nextMissionButton,
            this.resumeGameButton, this.restartMissionPauseButton, this.mainMenuPauseButton,
            this.restartCampaignButton, this.toggleFormationButton, this.viewMemorialButton,
            this.backFromMemorialButton
        ];

        buttons.forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    if (this.game && this.game.audioManager && !button.disabled) {
                        this.game.audioManager.play('UI_BUTTON_HOVER');
                    }
                });
            }
        });
    }

    showVideoLoadingScreen(videoPath) {
        if (!this.videoLoadingScreen || !this.loadingVideoPlayer) return;

        this.loadingVideoPlayer.src = videoPath;
        this.loadingVideoPlayer.load();
        this.loadingVideoPlayer.play().catch(error => {
            console.warn("Video autoplay was prevented. User interaction might be required.", error);
            // Fallback to a static loading screen if video fails
        });

        this.videoLoadingScreen.style.display = 'flex';
        // A tiny delay to allow the display property to apply before changing opacity
        setTimeout(() => {
            this.videoLoadingScreen.classList.add('visible');
        }, 10);
    }

    hideVideoLoadingScreen() {
        if (!this.videoLoadingScreen || !this.loadingVideoPlayer) return;

        this.videoLoadingScreen.classList.remove('visible');

        // After the fade-out transition ends, hide the element and pause the video
        setTimeout(() => {
            this.videoLoadingScreen.style.display = 'none';
            this.loadingVideoPlayer.pause();
            this.loadingVideoPlayer.src = ''; // Clear source to free up memory
        }, 500); // This duration should match the CSS transition duration
    }
    
    // ... (showMainMenuScreen, hideMainMenuScreen, etc. - all other UI methods from your existing UI.js)
    showMainMenuScreen() {
        if (!this.mainMenuScreen) return;
        this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        if (this.mainMenuMemorialButton && this.game) {
            this.mainMenuMemorialButton.disabled = !(this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0);
        }
        this.mainMenuScreen.style.display = 'flex'; this.setCursor('default');
    }
    hideMainMenuScreen() { if (this.mainMenuScreen) this.mainMenuScreen.style.display = 'none'; }
    hidePreMissionScreen() { if(this.preMissionScreen) this.preMissionScreen.style.display = 'none'; }
    hidePostMissionScreen() { if(this.postMissionScreen) this.postMissionScreen.style.display = 'none'; }
    hideGameOverScreen() { if(this.gameOverScreen) this.gameOverScreen.style.display = 'none'; }
    hideRecruitMemorialScreen() { if (this.recruitMemorialScreen) this.recruitMemorialScreen.style.display = 'none'; }

    showGameOverScreen(message, isCampaignVictory = false) {
        if (!this.gameOverScreen) return;
        if (this.gameOverTitle) {
            this.gameOverTitle.textContent = isCampaignVictory ? (this.uiText.GAMEOVER_VICTORY_TITLE || "CAMPAIGN COMPLETE!") : (this.uiText.GAMEOVER_DEFEAT_TITLE || "GAME OVER");
            if (isCampaignVictory) this.gameOverTitle.classList.add('victory');
            else this.gameOverTitle.classList.remove('victory');
        }
        if (this.gameOverMessage) this.gameOverMessage.textContent = message;
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideRecruitMemorialScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        this.gameOverScreen.style.display = 'flex'; this.setCursor('default');
    }

    _createRecruitGridCard(recruit) {
        const card = document.createElement('li');
        card.className = 'recruit-grid-card';
        card.dataset.raccoonId = recruit.id;

        if (recruit.isNewlyRescued) {
            card.classList.add('new-recruit');
        }

        // --- NEW: Add Rank Icon ---
        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[recruit.rank]) {
            const rankIconDiv = document.createElement('div');
            rankIconDiv.className = 'rank-icon';
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[recruit.rank]}')`;
            card.appendChild(rankIconDiv);
        }
        // --- END NEW ---

        const faceDiv = document.createElement('div');
        faceDiv.className = 'recruit-card-face';
        if (recruit.faceImageUrl) {
            faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;
        } else {
            faceDiv.style.backgroundColor = this.uiSettings.RECRUIT_CARD?.DEFAULT_FACE_BG_COLOR || '#555';
        }
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'recruit-card-name';
        nameDiv.textContent = recruit.name || recruit.id;
        
        card.appendChild(faceDiv);
        card.appendChild(nameDiv);

        card.addEventListener('click', () => {
            if (this.game && this.game.audioManager) this.game.audioManager.play('UI_BUTTON_CLICK');
            if (!this.game) return;

            const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
            if (this.game.tempSelectedForDeployment.length < maxSquadSize) {
                this.game.tempSelectedForDeployment.push(recruit);
                this.refreshRecruitSelectionLists();
            } else {
                alert((this.uiText.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()));
            }
        });
        return card;
    }

    _createDeployedCard(recruit) {
        const card = document.createElement('li');
        card.className = 'deployed-squad-card'; 
        card.dataset.raccoonId = recruit.id;
        
        // --- NEW: Add Rank Icon ---
        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[recruit.rank]) {
            const rankIconDiv = document.createElement('div');
            rankIconDiv.className = 'rank-icon';
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[recruit.rank]}')`;
            card.appendChild(rankIconDiv);
        }
        // --- END NEW ---
        
        const faceDiv = document.createElement('div');
        faceDiv.className = 'recruit-card-face';
        if (recruit.faceImageUrl) {
            faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'recruit-card-info';
        // --- MODIFIED: Changed HP to XP ---
        infoDiv.innerHTML = `
            <div class="name">${recruit.name || recruit.id}</div>
            <div class="rank">Rank: ${recruit.rank || 'Recruit'}</div>
            <div class="xp">XP: ${recruit.xp}</div>`;
        // --- END MODIFIED ---
        
        card.appendChild(faceDiv);
        card.appendChild(infoDiv);

        card.addEventListener('click', () => {
            if (this.game && this.game.audioManager) this.game.audioManager.play('UI_BUTTON_CLICK');
            if (!this.game) return;
            this.game.tempSelectedForDeployment = this.game.tempSelectedForDeployment.filter(r => r.id !== recruit.id);
            this.refreshRecruitSelectionLists();
        });
        return card;
    }

    _createRecruitSelectionCard(recruit, isSelectedForDeploymentContext) {
        const card = document.createElement('li');
        card.classList.add('recruit-selection-card');
        card.dataset.raccoonId = recruit.id;
        const isActuallySelected = this.game && this.game.tempSelectedForDeployment.find(r => r.id === recruit.id);
        if (isActuallySelected) card.classList.add('selected-for-deploy');

        const faceDiv = document.createElement('div');
        faceDiv.classList.add('recruit-card-face');
        if (recruit.faceImageUrl) {
            faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;
        } else {
            faceDiv.style.backgroundColor = (this.uiSettings.RECRUIT_CARD && this.uiSettings.RECRUIT_CARD.DEFAULT_FACE_BG_COLOR) || '#555';
        }

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('recruit-card-info');
        infoDiv.innerHTML = `
            <div class="id-name">${recruit.name || recruit.id}</div>
            <div class="rank">Rank: ${recruit.rank || 'Recruit'}</div>
            <div class="hp">HP: ${recruit.hp} / ${recruit.maxHp}</div>
            <div class="xp">XP: ${recruit.xp || 0}</div>`;
        card.appendChild(faceDiv); card.appendChild(infoDiv);

        card.addEventListener('mouseenter', () => {
            if (this.game && this.game.audioManager) {
                this.game.audioManager.play('UI_BUTTON_HOVER', { volume: 0.2 });
            }
        });

        card.addEventListener('click', () => {
            if (this.game && this.game.audioManager) {
                this.game.audioManager.play('UI_BUTTON_CLICK');
            }
            if (!this.game) return;
            const currentlyInDeployed = this.game.tempSelectedForDeployment.find(depR => depR.id === recruit.id);
            const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
            if (currentlyInDeployed) {
                this.game.tempSelectedForDeployment = this.game.tempSelectedForDeployment.filter(depR => depR.id !== recruit.id);
            } else {
                if (this.game.tempSelectedForDeployment.length < maxSquadSize) {
                    this.game.tempSelectedForDeployment.push(recruit);
                } else {
                     alert((this.uiText.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()));
                    return;
                }
            }
            this.refreshRecruitSelectionLists();
        });
        return card;
    }

    refreshRecruitSelectionLists() {
        if (!this.availableRecruitsGrid || !this.deployedSquadList || !this.game) return;
        
        const allMasterRosterRecruits = this.game.getAvailableRecruits();
        const tempSelectedIds = this.game.tempSelectedForDeployment.map(r => r.id);

        this.availableRecruitsGrid.innerHTML = '';
        this.deployedSquadList.innerHTML = '';

        allMasterRosterRecruits.forEach(recruit => {
            if (!tempSelectedIds.includes(recruit.id)) {
                this.availableRecruitsGrid.appendChild(this._createRecruitGridCard(recruit));
            }
        });

        const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
        const currentCount = this.game.tempSelectedForDeployment.length;

        const countSpan = document.getElementById('deployedCountDisplay');
        const maxSpan = document.getElementById('maxSquadSizeDisplay');
        if (countSpan) countSpan.textContent = currentCount.toString();
        if (maxSpan) maxSpan.textContent = maxSquadSize.toString();

        if (currentCount > 0) {
            this.game.tempSelectedForDeployment.forEach(recruit => {
                this.deployedSquadList.appendChild(this._createDeployedCard(recruit));
            });
        } else {
            const p = document.createElement('li');
            p.className = 'empty-slot-placeholder';
            p.textContent = this.uiText.DEPLOY_LIST_EMPTY_PLACEHOLDER || "Click recruits on the left to deploy.";
            this.deployedSquadList.appendChild(p);
        }

        if (this.startMissionButton) this.startMissionButton.disabled = !(currentCount > 0);
    }
    
    showPreMissionScreen_RecruitSelect(phaseData, missionData, availableRecruits) {
        if (!this.preMissionScreen) return;
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';

        if (!phaseData || !missionData || !missionData.baseParams || !missionData.objectives) { 
            if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = this.uiText.PREMISSION_ERROR_PHASE_TITLE || "Campaign Error";
            if(this.preMissionTitle) this.preMissionTitle.textContent = this.uiText.PREMISSION_ERROR_MISSION_TITLE || "Error Loading Mission";
            if(this.preMissionBriefing) this.preMissionBriefing.textContent = this.uiText.PREMISSION_ERROR_BRIEFING || "Could not load mission details.";
            if(this.preMissionObjectivesList) this.preMissionObjectivesList.innerHTML = '<li>Error loading objectives.</li>';
            this.preMissionScreen.style.display = 'flex';
            this.setCursor('default');
            return;
        }

        if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = phaseData.name || CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT;
        if(this.preMissionTitle) this.preMissionTitle.textContent = missionData.baseParams.name || CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT;
        if(this.preMissionBriefing) this.preMissionBriefing.textContent = missionData.baseParams.briefing || "No briefing available.";
        
        if (this.preMissionObjectivesList) {
            this.preMissionObjectivesList.innerHTML = '';
            if (missionData.objectives && missionData.objectives.length > 0) {
                missionData.objectives.forEach(obj => {
                    const li = document.createElement('li');
                    li.className = obj.isPrimary ? 'primary-objective' : 'secondary-objective';
                    let objectiveText = this.uiText[obj.descriptionTemplateKey] || `Objective: ${obj.type}`;
                    
                    const templateData = {
                        CURRENT: obj.currentProgress, TOTAL: obj.totalToAchieve,    
                        TARGET_NAME_PLURAL: obj.targetNamePlural || "targets",
                        TARGET_NAME_SINGULAR: obj.targetNameSingular || "target",
                        TARGET_CALLSIGN: obj.targetDetails ? obj.targetDetails.callsign : "VIP",
                        TARGET_NAME: obj.targetDetails ? obj.targetDetails.name : "VIP",
                        CURRENT_RESCUED: 0, TOTAL_SPAWNED: obj.totalToAchieve, 
                        CURRENT_EVACUATED: 0, MIN_TO_EVAC: obj.minToAchieveForCompletion || 0
                    };
                    objectiveText = this.game._fillTextTemplate(objectiveText, templateData);
                    
                    if (obj.type === "RESCUE_HOSTAGES") {
                        objectiveText = `Rescue Hostages (${obj.totalToAchieve} to find, min ${obj.minToAchieveForCompletion} to evac)`;
                    } else if (obj.type === "DESTROY_TARGET" || obj.type === "EXTERMINATE") {
                         objectiveText = objectiveText.split(':')[0].trim();
                    } else if (obj.type === "ASSASSINATION" && obj.targetDetails) {
                         objectiveText = "Assassinate HVT: " + (obj.targetDetails.callsign || "VIP");
                    }
                    
                    li.textContent = `(${obj.isPrimary ? 'Primary' : 'Secondary'}) ${objectiveText}`;
                    this.preMissionObjectivesList.appendChild(li);
                });
            } else {
                this.preMissionObjectivesList.innerHTML = '<li>No specific objectives defined.</li>';
            }
        }
        
        if (this.game) {
            this.game.tempSelectedForDeployment = []; 
            if (this.game.lastDeployedSquadIds && this.game.lastDeployedSquadIds.length > 0) {
                const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
                this.game.lastDeployedSquadIds.forEach(id => {
                    if (this.game.tempSelectedForDeployment.length < maxSquadSize) {
                        const recruit = availableRecruits.find(r => r.id === id && r.isAlive());
                        if (recruit) {
                            this.game.tempSelectedForDeployment.push(recruit);
                        }
                    }
                });
            }
        }
        
        this.refreshRecruitSelectionLists();
        this.preMissionScreen.style.display = 'flex'; 
        this.setCursor('default');
    }

    showPostMissionScreen_Debrief(debriefData) {
        if (!this.postMissionScreen || !debriefData) return;
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if(this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        
        const { isVictory, phaseData, missionData, objectives, 
                survivingRaccoons, fallenRaccoons, enemiesKilled, 
                timeTaken, campaignComplete, newlyRecruitedRaccoons } = debriefData;
    
        if(this.missionOutcomeText) this.missionOutcomeText.textContent = isVictory ? (this.uiText.POST_MISSION_SUCCESS || "MISSION SUCCESSFUL!") : (this.uiText.POST_MISSION_FAILED || "MISSION FAILED!");
        
        const postMissionInfoEl = document.getElementById('postMissionInfo');
        // --- MODIFIED: Removed incorrect .baseParams access ---
        if(postMissionInfoEl && phaseData && missionData) { 
             postMissionInfoEl.textContent = `${phaseData.name || CONFIG.UI_TEXT_STRINGS.UNKNOWN_PHASE_TEXT} - ${missionData.name || CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT}`;
        }
        // --- END MODIFIED ---
    
        const objectiveListEl = document.getElementById('objectiveStatusList');
        const statTimeTakenEl = document.getElementById('statTimeTaken');
        const statEnemiesKilledEl = document.getElementById('statEnemiesKilled');
        const statHostagesRecruitedEl = document.getElementById('statHostagesRecruited');
        const survivorListEl = document.getElementById('survivorList');
        const newRecruitsListEl = document.getElementById('newRecruitsList');
        const fallenListEl = document.getElementById('fallenList');
    
        if (objectiveListEl) {
            objectiveListEl.innerHTML = '';
            if (objectives && objectives.length > 0) {
                objectives.forEach(obj => {
                    const li = document.createElement('li');
                    let text = `${obj.isPrimary ? '(Primary)' : '(Secondary)'} ${obj.type.replace('_', ' ')}`;
                    li.innerHTML = `<span class="obj-status">${obj.isComplete ? 'COMPLETED' : 'FAILED'}</span> <span class="obj-text">${text}</span>`;
                    li.classList.add(obj.isComplete ? 'completed' : 'failed');
                    objectiveListEl.appendChild(li);
                });
            }
        }
    
        if (statTimeTakenEl) statTimeTakenEl.textContent = timeTaken + "s";
        if (statEnemiesKilledEl) statEnemiesKilledEl.textContent = enemiesKilled.toString();
        if (statHostagesRecruitedEl) statHostagesRecruitedEl.textContent = (newlyRecruitedRaccoons || []).length.toString();
    
        if (survivorListEl) {
            survivorListEl.innerHTML = '';
            if (survivingRaccoons && survivingRaccoons.length > 0) {
                survivingRaccoons.forEach(r => { 
                    const li = document.createElement('li');
                    const promotionText = r.promotedThisMission ? ' <span class="promotion-indicator">(PROMOTED!)</span>' : '';
                    li.innerHTML = `<span>${r.name || r.id}</span> <span>Rank: ${r.rank}</span> <span>XP: ${r.xp}${promotionText}</span>`; 
                    survivorListEl.appendChild(li); 
                });
            } else {
                survivorListEl.innerHTML = `<li>${isVictory ? (this.uiText.POST_MISSION_SURVIVORS_NONE_VICTORY || "Mission accomplished, but no Raccoons survived.") : (this.uiText.POST_MISSION_SURVIVORS_NONE_DEFEAT || "All deployed Raccoons KIA.")}</li>`;
            }
        }
    
        const newRecruitsContainer = document.getElementById('newRecruitsContainer');
        if (newRecruitsListEl && newRecruitsContainer) {
            newRecruitsListEl.innerHTML = '';
            if (newlyRecruitedRaccoons && newlyRecruitedRaccoons.length > 0) {
                newRecruitsContainer.style.display = 'block';
                newlyRecruitedRaccoons.forEach(r => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${r.name || r.id}</span> <span>Rank: ${r.rank}</span> <span>XP: ${r.xp}</span>`; 
                    newRecruitsListEl.appendChild(li);
                });
            } else {
                newRecruitsContainer.style.display = 'none';
            }
        }
    
        if (fallenListEl) {
            fallenListEl.innerHTML = '';
            if (fallenRaccoons && fallenRaccoons.length > 0) {
                fallenRaccoons.forEach(fallenBrief => { 
                    const li = document.createElement('li'); 
                    li.innerHTML = `<span>${fallenBrief.name || fallenBrief.id}</span> <span>(Rank: ${fallenBrief.rank})</span>`; 
                    fallenListEl.appendChild(li); 
                });
            } else { 
                fallenListEl.innerHTML = `<li>${this.uiText.POST_MISSION_FALLEN_NONE || "No casualties this mission."}</li>`; 
            }
        }
    
        const nextMissionBtn = document.getElementById('nextMissionButton');
        const retryMissionBtn = document.getElementById('retryMissionButton');
        const viewMemorialBtn = document.getElementById('viewMemorialButton');
        
        if (viewMemorialBtn) {
            viewMemorialBtn.style.display = (this.game && this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0) ? 'inline-block' : 'none';
        }
        if (campaignComplete && isVictory) {
            if (nextMissionBtn) { nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_RESTART_CAMPAIGN || "Restart Campaign"; nextMissionBtn.style.display = 'inline-block'; nextMissionBtn.disabled = false; }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else if (isVictory) {
            if (nextMissionBtn) {
                 const currentPhaseStructure = debriefData.phaseData; 
                 const missionsInThisPhase = currentPhaseStructure.missionsInPhase;
                 const isEndOfCurrentPhase = this.game.currentMissionIndex >= (missionsInThisPhase - 1);
                 if (isEndOfCurrentPhase) { 
                     const isEndOfCampaign = this.game.currentPhaseIndex + 1 >= this.game.totalCampaignPhases;
                     if (!isEndOfCampaign) { 
                         let nextPhaseName = `Phase ${this.game.currentPhaseIndex + 2}`; 
                         if (this.game.campaignStructure[this.game.currentPhaseIndex + 1] && this.game.campaignStructure[this.game.currentPhaseIndex + 1].name) {
                             nextPhaseName = this.game.campaignStructure[this.game.currentPhaseIndex + 1].name;
                         }
                         nextMissionBtn.textContent = (this.uiText.BUTTON_TEXT_START_PHASE_PREFIX || "Start ") + nextPhaseName;
                     } else { 
                         nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_CAMPAIGN_COMPLETE || "View Final Stats";
                     }
                 } else {
                     nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_NEXT_MISSION || "Next Mission";
                 }
                 nextMissionBtn.style.display = 'inline-block'; nextMissionBtn.disabled = false;
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else { // Mission Failed
            if (nextMissionBtn) nextMissionBtn.style.display = 'none';
            if (retryMissionBtn) { 
                retryMissionBtn.textContent = this.uiText.BUTTON_TEXT_RETRY_MISSION || "Retry Mission"; 
                retryMissionBtn.style.display = 'inline-block'; 
                retryMissionBtn.disabled = !(this.game && this.game.getAvailableRecruits().length > 0); 
            }
        }
    
        this.postMissionScreen.style.display = 'flex'; 
        this.setCursor('default');
    }

    showRecruitMemorialScreen() {
        // ... (unchanged)
        if (!this.recruitMemorialScreen || !this.game || !this.memorialEntriesContainer) return;
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        this.memorialEntriesContainer.innerHTML = '';
        if (this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0) {
            this.game.fallenRaccoonsGlobal.forEach(fallen => {
                const entryDiv = document.createElement('div'); entryDiv.classList.add('memorial-entry');
                const faceDiv = document.createElement('div'); faceDiv.classList.add('memorial-entry-face');
                if (fallen.faceImageUrl) faceDiv.style.backgroundImage = `url('${fallen.faceImageUrl}')`;
                else faceDiv.style.backgroundColor = (this.uiSettings.MEMORIAL_CARD && this.uiSettings.MEMORIAL_CARD.DEFAULT_FACE_BG_COLOR) || '#333';
                entryDiv.appendChild(faceDiv);
                const infoDiv = document.createElement('div'); infoDiv.classList.add('memorial-entry-info');
                infoDiv.innerHTML = `
                    <div><span class="field-label">${this.uiText.MEMORIAL_LABEL_NAME || "Name:"}</span> <span class="field-value">${fallen.name || fallen.id}</span></div>
                    <div><span class="field-label">${this.uiText.MEMORIAL_LABEL_RANK || "Rank Achieved:"}</span> <span class="field-value">${fallen.rank || 'Recruit'}</span></div>
                    <div><span class.field-label">${this.uiText.MEMORIAL_LABEL_MISSION || "Fell In:"}</span> <span class="field-value">${fallen.missionDied || (this.uiText.UNKNOWN_MISSION_TEXT || "Unknown Mission")}</span></div>
                    <div><span class="field-label">${this.uiText.MEMORIAL_LABEL_PHASE || "During:"}</span> <span class="field-value">${fallen.phaseDied || (this.uiText.UNKNOWN_PHASE_TEXT || "Unknown Phase")}</span></div>`;
                entryDiv.appendChild(infoDiv); this.memorialEntriesContainer.appendChild(entryDiv);
            });
        } else {
            this.memorialEntriesContainer.innerHTML = `<p style="text-align: center; padding: 20px;">${this.uiText.MEMORIAL_NO_FALLEN || "No Raccoons have fallen... yet."}</p>`;
        }
        this.recruitMemorialScreen.style.display = 'flex'; this.setCursor('default');
    }

    showPauseMenuScreen() {
        // ... (unchanged)
        if (!this.pauseMenuScreen) return;
        this.pauseMenuScreen.style.display = 'flex';
        this.setCursor('default');
        if (this.restartMissionPauseButton && this.game) {
            this.restartMissionPauseButton.disabled = !(this.game.getAvailableRecruits().length > 0 && this.game.currentMissionParams);
        }
    }

    hidePauseMenuScreen() {
        // ... (unchanged)
        if (this.pauseMenuScreen) {
            this.pauseMenuScreen.style.display = 'none';
        }
    }

    showHUD() {
        // ... (unchanged)
        if(this.leftHudPanel) this.leftHudPanel.style.display = 'flex';
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
             this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
             this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
         if(this.game && this.game.ui && this.game.currentFormationType) this.updateFormationButton(this.game.currentFormationType);
         this.updateSquadPanel();
         this.updateObjective(); 
    }
    hideHUD() { if (this.leftHudPanel) this.leftHudPanel.style.display = 'none'; }

    updateObjective() { 
        const objectiveDisplayElement = this.objectiveTextContainer || document.getElementById('objectiveText'); 

        if (!objectiveDisplayElement || !this.game || !this.game.currentMissionParams || !this.game.currentMissionParams.objectives) {
            if (objectiveDisplayElement) objectiveDisplayElement.innerHTML = `<span>${this.uiText.UNKNOWN_OBJECTIVE_TEXT || "Unknown Objective"}</span>`;
            return;
        }

        objectiveDisplayElement.innerHTML = ''; 
        const objectives = this.game.currentMissionParams.objectives;

        if (objectives.length === 0) {
            objectiveDisplayElement.innerHTML = `<span>${this.uiText.DEFAULT_OBJECTIVE_TEXT || "Complete the mission!"}</span>`;
            return;
        }
        
        objectives.forEach(obj => {
            const p = document.createElement('p');
            p.style.margin = '2px 0'; 
            p.style.fontSize = '0.9em'; 
            let objectiveStr;
            
            const templateData = {
                CURRENT: obj.currentProgress,
                TOTAL: obj.totalToAchieve,
                TARGET_NAME_PLURAL: obj.targetNamePlural || "targets",
                TARGET_NAME_SINGULAR: obj.targetNameSingular || "target",
                TARGET_CALLSIGN: obj.targetDetails ? obj.targetDetails.callsign : "VIP", // For Assassination
                TARGET_NAME: obj.targetDetails ? obj.targetDetails.name : "VIP",       // For Assassination
                CURRENT_RESCUED: obj.currentProgress, 
                TOTAL_SPAWNED: obj.totalToAchieve,    
                CURRENT_EVACUATED: obj.currentEvacuated || 0,
                MIN_TO_EVAC: obj.minToAchieveForCompletion || 0
            };
            
            objectiveStr = this.uiText[obj.descriptionTemplateKey] || `Objective: ${obj.type}`;
            objectiveStr = this.game._fillTextTemplate(objectiveStr, templateData);

            // Specific formatting for assassination if needed AFTER filling template
            if (obj.type === "ASSASSINATION" && obj.targetDetails) {
                const targetName = obj.targetDetails.name || "VIP";
                const targetCallsign = obj.targetDetails.callsign || obj.targetDetails.name || "TARGET";
                
                let objectiveText = (this.uiText[obj.descriptionTemplateKey] || "Eliminate: {TARGET_CALLSIGN}")
                    .replace("{TARGET_CALLSIGN}", targetCallsign)
                    .replace("{TARGET_NAME}", targetName); // In case your template uses {TARGET_NAME}

                if (obj.isComplete) {
                    objectiveText += " - ELIMINATED";
                } else {
                    const targetUnit = this.game.enemyUnits.find(e => e.id === obj.targetUnitId);
                    if (targetUnit && targetUnit.isAlive()) {
                        objectiveText += ` (HP: ${Math.round(targetUnit.hp)}/${targetUnit.maxHp})`; // Show Boss HP
                    } else if (obj.targetUnitId && (!targetUnit || !targetUnit.isAlive())) {
                        // This case means the objective is not yet complete, but the targetUnit is gone/dead.
                        // This should lead to obj.isComplete being true soon via checkMissionStatus.
                        // For the UI, we can just show the name until it updates to ELIMINATED.
                    } else if (!obj.targetUnitId) {
                        objectiveText += " - (AWAITING TARGET)"; // If boss hasn't spawned/linked yet
                    }
                }
                objectiveStr = objectiveText; // This was missing; assign to objectiveStr
            }


            if (obj.isComplete) {
                p.innerHTML = `<span style="color: lightgreen; text-decoration: line-through;">${obj.isPrimary ? '(P) ' : '(S) '}${objectiveStr}</span>`;
            } else {
                p.innerHTML = `<span>${obj.isPrimary ? '(P) ' : '(S) '}${objectiveStr}</span>`;
            }
            objectiveDisplayElement.appendChild(p);
        });
    }
    
    updateHostageStatus(hostage, wasRescuedAndIsAlive) {
        // ... (unchanged)
        if (this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
            const rescueObjective = this.game.currentMissionParams.objectives.find(obj => obj.type === 'RESCUE_HOSTAGES');
            if (rescueObjective) {
                this.updateObjective(); 
            }
        }
    }


    updateFormationButton(formationType) {
        // ... (unchanged)
        if (this.toggleFormationButton && formationType) {
            this.toggleFormationButton.textContent = `Formation: ${formationType.charAt(0).toUpperCase() + formationType.slice(1).toLowerCase()}`;
        }
    }

    updateSquadPanel() {
        // ... (unchanged)
        if (!this.game || !this.squadPanel || !this.game.deployedSquadRoster) {
             if (this.squadPanel) this.squadPanel.innerHTML = `<p>${this.uiText.HUD_NO_SQUAD_DEPLOYED || "No squad deployed."}</p>`;
             return;
        }
        const displaySquad = this.game.deployedSquadRoster;
        const selectedUnits = this.game.selectedUnits || [];
        this.squadPanel.innerHTML = '';
        displaySquad.forEach((raccoon) => {
            if (!raccoon) return;
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('squad-member');
            memberDiv.dataset.id = raccoon.id;
            if (selectedUnits.includes(raccoon)) memberDiv.classList.add('selected');
            if (raccoon.faceImageUrl) memberDiv.style.backgroundImage = `url('${raccoon.faceImageUrl}')`;

            if (raccoon.isAimingGrenade) {
                memberDiv.style.borderColor = (CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.GRENADE_AIM_INDICATOR && CONFIG.UNIT_VISUALS.GRENADE_AIM_INDICATOR.COLOR) || 'orange';
                memberDiv.style.borderWidth = '2px'; memberDiv.style.borderStyle = 'solid';
            } else if (!selectedUnits.includes(raccoon)){
                 memberDiv.style.borderColor = ''; memberDiv.style.borderWidth = ''; memberDiv.style.borderStyle = '';
            }

            const isKIA = !raccoon.isAlive(); 
            let statusText = 'Active';
            if (isKIA) {
                statusText = 'KIA';
            } else if (raccoon.isAimingGrenade) {
                statusText = 'Aiming Grnd';
            } else if (raccoon.isPlayerDirectFiring) {
                statusText = 'Firing MG';
            } else if (raccoon.actionTimer > 0) {
                statusText = 'Busy';
            } else if (raccoon.manualTarget) {
                statusText = 'Targeting';
            }

            const statusClass = isKIA ? 'status-kia' : '';
            const hpPercent = isKIA ? 0 : Math.max(0, (raccoon.hp / raccoon.maxHp)) * 100;

            const healthBarStyle = (this.uiSettings.HEALTH_BAR) || {};
            let hpColor = healthBarStyle.HP_COLOR_FULL || '#70A060';
            if (hpPercent < (healthBarStyle.LOW_HP_THRESHOLD_PERCENT || 0.3) * 100) hpColor = healthBarStyle.HP_COLOR_LOW || '#A85050';
            else if (hpPercent < (healthBarStyle.MEDIUM_HP_THRESHOLD_PERCENT || 0.6) * 100) hpColor = healthBarStyle.HP_COLOR_MEDIUM || '#D09040';

            const infoOverlay = document.createElement('div');
            infoOverlay.classList.add('squad-member-info-overlay');
            infoOverlay.innerHTML = `
                <div><span class="label">Name:</span> <span class="value">${raccoon.name || raccoon.id}</span></div>
                <div><span class="label">Rank:</span> <span class="value">${raccoon.rank || 'Recruit'}</span></div>
                <div><span class="label">HP:</span> <span class="value">${Math.max(0, Math.round(raccoon.hp))} / ${raccoon.maxHp}</span></div>
                <div><span class="label">Grenades:</span> <span class="value">${raccoon.grenadeAmmo !== undefined ? raccoon.grenadeAmmo : 'N/A'}</span></div>
                <div><span class="label">Status:</span> <span class="value ${statusClass}">${statusText}</span></div>
                <div><span class="label">XP:</span> <span class="value">${raccoon.xp !== undefined ? raccoon.xp : 0}</span></div>
                ${raccoon.xpToNextRank !== Infinity ? `<div><span class="label">Next:</span> <span class="value">${raccoon.xpToNextRank} XP</span></div>` : ''}
                <div class="health-bar-container">
                    <div class="health-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
                </div>`;
            memberDiv.appendChild(infoOverlay); this.squadPanel.appendChild(memberDiv);
        });
    }

    setCursor(styleName) {
        // ... (unchanged)
        if (this.game && this.game.canvas) {
            this.game.canvas.classList.remove(
                'cursor-default', 'cursor-attack', 'cursor-cell',
                'cursor-target-mode-default', 'cursor-target-mode-enemy'
            );
            this.game.canvas.style.cursor = '';

            if (styleName === 'attack') this.game.canvas.classList.add('cursor-attack');
            else if (styleName === 'cell') this.game.canvas.classList.add('cursor-cell');
            else if (styleName === 'target-mode-default') this.game.canvas.classList.add('cursor-target-mode-default');
            else if (styleName === 'target-enemy-hover') this.game.canvas.classList.add('cursor-target-mode-enemy');
            else {
                this.game.canvas.classList.add('cursor-default');
                if (styleName !== 'default' && styleName !== 'attack' && styleName !== 'cell' &&
                    styleName !== 'target-mode-default' && styleName !== 'target-enemy-hover') {
                    this.game.canvas.style.cursor = styleName;
                } else {
                    this.game.canvas.style.cursor = 'default';
                }
            }
        }
    }
}