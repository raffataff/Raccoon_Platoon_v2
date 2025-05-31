// js/ui.js
// complete
class UI {
    constructor(game) {
        this.game = game;
        this.uiText = CONFIG.UI_TEXT_STRINGS || {};
        this.uiSettings = CONFIG.UI_SETTINGS || {};

        // Main Menu Elements
        this.mainMenuScreen = document.getElementById('mainMenuScreen');
        this.newCampaignButton = document.getElementById('newCampaignButton');
        this.mainMenuMemorialButton = document.getElementById('mainMenuMemorialButton');
        this.optionsButton = document.getElementById('optionsButton');

        // Other Screens & Panels
        this.preMissionScreen = document.getElementById('preMissionScreen');
        this.postMissionScreen = document.getElementById('postMissionScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.recruitMemorialScreen = document.getElementById('recruitMemorialScreen');
        this.memorialEntriesContainer = document.getElementById('memorialEntriesContainer');
        this.backFromMemorialButton = document.getElementById('backFromMemorialButton');
        this.viewMemorialButton = document.getElementById('viewMemorialButton');
        this.leftHudPanel = document.getElementById('left-hud-panel');
        this.squadPanel = document.getElementById('hud-squad');
        this.objectiveText = document.getElementById('objectiveText');
        this.missionOutcomeText = document.getElementById('missionOutcome');
        this.preMissionPhaseTitle = document.getElementById('preMissionPhaseTitle');
        this.preMissionTitle = document.getElementById('preMissionTitle');
        this.preMissionBriefing = document.getElementById('preMissionBriefing');
        this.availableRecruitsList = document.getElementById('availableRecruitsList');
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


        // --- Event Listeners ---
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
                if (this.game.loadMissionData(this.game.currentPhaseIndex, this.game.currentMissionIndex)) {
                    this.showPreMissionScreen_RecruitSelect(
                        this.game.campaignData[this.game.currentPhaseIndex],
                        this.game.currentMissionParams,
                        this.game.getAvailableRecruits()
                    );
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

        this._addSoundToButton(this.viewMemorialButton, () => this.showRecruitMemorialScreen());

        this._addSoundToButton(this.backFromMemorialButton, () => {
            this.hideRecruitMemorialScreen();
            if (this.game && this.game.gameState === 'POST_MISSION_DEBRIEF' && this.postMissionScreen) {
                 this.postMissionScreen.style.display = 'flex';
            } else if (this.game && this.game.gameState === 'MAIN_MENU' && this.mainMenuScreen) {
                 this.mainMenuScreen.style.display = 'flex';
            }
        });
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
        if (!this.availableRecruitsList || !this.deployedSquadList || !this.game) return;
        const allMasterRosterRecruits = this.game.getAvailableRecruits();
        const tempSelectedIds = this.game.tempSelectedForDeployment.map(r => r.id);
        this.availableRecruitsList.innerHTML = ''; this.deployedSquadList.innerHTML = '';

        allMasterRosterRecruits.forEach(recruit => {
            if (!tempSelectedIds.includes(recruit.id)) {
                this.availableRecruitsList.appendChild(this._createRecruitSelectionCard(recruit, false));
            }
        });
        const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
        const currentCount = this.game.tempSelectedForDeployment ? this.game.tempSelectedForDeployment.length : 0;
        const titleElement = document.getElementById('deployedSquadTitle');
        if (titleElement) {
            const countSpan = document.getElementById('deployedCountDisplay');
            const maxSpan = document.getElementById('maxSquadSizeDisplay');
            if(countSpan) countSpan.textContent = currentCount.toString();
            if(maxSpan) maxSpan.textContent = maxSquadSize.toString();
        }
        if (this.game.tempSelectedForDeployment && this.game.tempSelectedForDeployment.length > 0) {
            this.game.tempSelectedForDeployment.forEach(recruit => {
                this.deployedSquadList.appendChild(this._createRecruitSelectionCard(recruit, true));
            });
        } else {
            const p = document.createElement('p');
            p.textContent = this.uiText.DEPLOY_LIST_EMPTY_PLACEHOLDER || "Click recruits on the left to deploy.";
            p.style.textAlign = "center"; p.style.padding = "10px"; p.style.color = "#888";
            this.deployedSquadList.appendChild(p);
        }
        const startBtn = document.getElementById('startMissionButton');
        if(startBtn) startBtn.disabled = !(currentCount > 0);
    }

    showPreMissionScreen_RecruitSelect(phaseData, missionData, availableRecruits) {
        if (!this.preMissionScreen || !this.availableRecruitsList || !this.deployedSquadList) return;
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if(this.leftHudPanel) this.leftHudPanel.style.display = 'none';

        if (!phaseData || !missionData) {
            if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = this.uiText.PREMISSION_ERROR_PHASE_TITLE || "Campaign Error";
            if(this.preMissionTitle) this.preMissionTitle.textContent = this.uiText.PREMISSION_ERROR_MISSION_TITLE || "Error Loading Mission";
            if(this.preMissionBriefing) this.preMissionBriefing.textContent = this.uiText.PREMISSION_ERROR_BRIEFING || "Could not load mission details.";
            this.preMissionScreen.style.display = 'flex'; this.setCursor('default');
            return;
        }
        if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = phaseData.name;
        if(this.preMissionTitle) this.preMissionTitle.textContent = missionData.name;
        if(this.preMissionBriefing) this.preMissionBriefing.textContent = missionData.briefing;
        if (this.game) this.game.tempSelectedForDeployment = [];
        this.refreshRecruitSelectionLists();
        this.preMissionScreen.style.display = 'flex'; this.setCursor('default');
    }

    showPostMissionScreen_Debrief(debriefData) {
        if (!this.postMissionScreen || !debriefData) return;
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if(this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        const { isVictory, phaseData, missionData, survivingRaccoons, fallenRaccoons, enemiesKilled, timeTaken, campaignComplete } = debriefData;

        if(this.missionOutcomeText) this.missionOutcomeText.textContent = isVictory ? (this.uiText.POST_MISSION_SUCCESS || "MISSION SUCCESSFUL!") : (this.uiText.POST_MISSION_FAILED || "MISSION FAILED!");
        const postMissionInfoEl = document.getElementById('postMissionInfo');
        if(postMissionInfoEl && phaseData && missionData) postMissionInfoEl.textContent = `${phaseData.name || ""} - ${missionData.name || ""}`;
        const statTimeTakenEl = document.getElementById('statTimeTaken');
        if (statTimeTakenEl) statTimeTakenEl.textContent = timeTaken + "s";
        const statEnemiesKilledEl = document.getElementById('statEnemiesKilled');
        if (statEnemiesKilledEl) statEnemiesKilledEl.textContent = enemiesKilled.toString();

        const survivorListEl = document.getElementById('survivorList');
        if (survivorListEl) {
            survivorListEl.innerHTML = '';
            if (survivingRaccoons && survivingRaccoons.length > 0) {
                survivingRaccoons.forEach(r => { const li = document.createElement('li'); li.textContent = `${r.name || r.id} - Rank: ${r.rank}, XP: ${r.xp}`; survivorListEl.appendChild(li); });
            } else {
                const li = document.createElement('li');
                li.textContent = isVictory ? (this.uiText.POST_MISSION_SURVIVORS_NONE_VICTORY || "Mission accomplished, but no Raccoons survived.") : (this.uiText.POST_MISSION_SURVIVORS_NONE_DEFEAT || "All deployed Raccoons KIA.");
                survivorListEl.appendChild(li);
            }
        }
        const fallenListEl = document.getElementById('fallenList');
        if (fallenListEl) {
            fallenListEl.innerHTML = '';
            if (fallenRaccoons && fallenRaccoons.length > 0) {
                fallenRaccoons.forEach(fallenBrief => { const fallenFull = this.game.fallenRaccoonsGlobal.find(frg => frg.id === fallenBrief.id) || fallenBrief; const li = document.createElement('li'); li.textContent = `${fallenFull.name || fallenBrief.id} - (Rank: ${fallenBrief.rank})`; fallenListEl.appendChild(li); });
            } else { const li = document.createElement('li'); li.textContent = this.uiText.POST_MISSION_FALLEN_NONE || "No casualties this mission."; fallenListEl.appendChild(li); }
        }

        const nextMissionBtn = document.getElementById('nextMissionButton');
        const retryMissionBtn = document.getElementById('retryMissionButton');
        const viewMemorialBtn = document.getElementById('viewMemorialButton');
        if (viewMemorialBtn) viewMemorialBtn.style.display = (this.game && this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0) ? 'inline-block' : 'none';

        if (campaignComplete && isVictory) {
            if (nextMissionBtn) { nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_RESTART_CAMPAIGN || "Restart Campaign"; nextMissionBtn.style.display = 'inline-block'; nextMissionBtn.disabled = false; }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else if (isVictory) {
            if (nextMissionBtn) {
                 nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_NEXT_MISSION || "Next Mission";
                 const currentPhase = this.game.campaignData[this.game.currentPhaseIndex];
                 if (currentPhase && this.game.currentMissionIndex === currentPhase.missions.length - 1) {
                     if (this.game.campaignData[this.game.currentPhaseIndex + 1]) {
                         nextMissionBtn.textContent = (this.uiText.BUTTON_TEXT_START_PHASE_PREFIX || "Start ") + this.game.campaignData[this.game.currentPhaseIndex + 1].name;
                     } else {
                         nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_CAMPAIGN_COMPLETE || "View Final Stats";
                     }
                 }
                 nextMissionBtn.style.display = 'inline-block'; nextMissionBtn.disabled = false;
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else {
            if (nextMissionBtn) nextMissionBtn.style.display = 'none';
            if (retryMissionBtn) { retryMissionBtn.textContent = this.uiText.BUTTON_TEXT_RETRY_MISSION || "Retry Mission"; retryMissionBtn.style.display = 'inline-block'; retryMissionBtn.disabled = !(this.game && this.game.getAvailableRecruits().length > 0); }
        }
        this.postMissionScreen.style.display = 'flex'; this.setCursor('default');
    }

    showRecruitMemorialScreen() {
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
                    <div><span class.field-label">${this.uiText.MEMORIAL_LABEL_PHASE || "During:"}</span> <span class="field-value">${fallen.phaseDied || (this.uiText.UNKNOWN_PHASE_TEXT || "Unknown Phase")}</span></div>`;
                entryDiv.appendChild(infoDiv); this.memorialEntriesContainer.appendChild(entryDiv);
            });
        } else {
            this.memorialEntriesContainer.innerHTML = `<p style="text-align: center; padding: 20px;">${this.uiText.MEMORIAL_NO_FALLEN || "No Raccoons have fallen... yet."}</p>`;
        }
        this.recruitMemorialScreen.style.display = 'flex'; this.setCursor('default');
    }

    showPauseMenuScreen() {
        if (!this.pauseMenuScreen) return;
        this.pauseMenuScreen.style.display = 'flex';
        this.setCursor('default');
        if (this.restartMissionPauseButton && this.game) {
            this.restartMissionPauseButton.disabled = !(this.game.getAvailableRecruits().length > 0 && this.game.currentMissionParams);
        }
    }

    hidePauseMenuScreen() {
        if (this.pauseMenuScreen) {
            this.pauseMenuScreen.style.display = 'none';
        }
    }

    showHUD() {
        if(this.leftHudPanel) this.leftHudPanel.style.display = 'flex';
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
             this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
             this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
         if(this.game && this.game.ui && this.game.currentFormationType) this.updateFormationButton(this.game.currentFormationType);
         this.updateSquadPanel();
         this.updateObjective(); // Call to initialize objective text
    }
    hideHUD() { if (this.leftHudPanel) this.leftHudPanel.style.display = 'none'; }

    updateObjective() { // Removed 'text' parameter as it's now dynamic
        if (this.objectiveText && this.game && this.game.currentMissionParams) {
            const params = this.game.currentMissionParams;
            let objectiveStr = params.name || (this.uiText.DEFAULT_OBJECTIVE_TEXT || "Complete Objective");

            if (params.objectiveType === "EXTERMINATE") {
                const aliveEnemies = this.game.enemyUnits ? this.game.enemyUnits.filter(e => e.isAlive()).length : 0;
                const totalEnemies = this.game.initialEnemyCount || (this.game.enemyUnits ? this.game.enemyUnits.length : 0);
                if (totalEnemies > 0) { // Only show count if enemies were expected
                    objectiveStr = `Eliminate Possums: ${totalEnemies - aliveEnemies} / ${totalEnemies}`;
                } else if (this.game.missionStartedAndPopulated && aliveEnemies === 0) {
                     objectiveStr = `All Possums Eliminated!`; // Or specific message
                } else {
                    objectiveStr = `Eliminate All Possums`;
                }
            } else if (params.objectiveType === "RESCUE_HOSTAGES") {
                const rescuedAliveCount = this.game.hostageUnits ? this.game.hostageUnits.filter(h => h.isRescued && h.isAlive()).length : 0;
                const totalToSpawn = params.numHostagesToSpawn || (this.game.level && this.game.level.initialHostageCount) || 0;
                const minToWin = params.minHostagesToRescueForWin || (CONFIG.HOSTAGE_SETTINGS && CONFIG.HOSTAGE_SETTINGS.MIN_HOSTAGES_TO_RESCUE_FOR_WIN) || 1;
                objectiveStr = `Rescue Hostages: ${rescuedAliveCount} / ${minToWin} (Min)`;
                if (totalToSpawn > 0 && rescuedAliveCount >= totalToSpawn && this.game.hostageUnits.every(h=> h.isRescued || !h.isAlive())) {
                    objectiveStr = `All Hostages Rescued!`;
                } else if (totalToSpawn > 0 && rescuedAliveCount >= minToWin) {
                     objectiveStr = `Hostages Rescued: ${rescuedAliveCount} / ${minToWin} (Min) - Proceed to extraction!`; // If extraction is next step
                }
            }
            // Add more objective types here if needed

            this.objectiveText.textContent = objectiveStr;
        } else if (this.objectiveText) {
            this.objectiveText.textContent = (this.uiText.UNKNOWN_OBJECTIVE_TEXT || "Unknown Objective");
        }
    }
    
    // NEW method to be called when a hostage is rescued or dies, to update the count
    updateHostageStatus(hostage, wasRescuedAndIsAlive) {
        if (this.game.currentMissionParams && this.game.currentMissionParams.objectiveType === 'RESCUE_HOSTAGES') {
            this.updateObjective(); // Re-calculate and update the objective text
        }
    }


    updateFormationButton(formationType) {
        if (this.toggleFormationButton && formationType) {
            this.toggleFormationButton.textContent = `Formation: ${formationType.charAt(0).toUpperCase() + formationType.slice(1).toLowerCase()}`;
        }
    }

    updateSquadPanel() {
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

            const isKIA = !raccoon.isAlive(); let statusText = 'Active';
            if (isKIA) statusText = 'KIA';
            else if (raccoon.isAimingGrenade) statusText = 'Aiming Grnd';
            else if (raccoon.isPlayerDirectFiring) statusText = 'Firing MG';
            else if (raccoon.actionTimer > 0) statusText = 'Busy';
            else if (raccoon.manualTarget) statusText = 'Targeting';
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