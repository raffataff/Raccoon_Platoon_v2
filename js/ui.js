// js/ui.js

class UI {
    constructor(game) {
        this.game = game;
        this.uiText = CONFIG.UI_TEXT_STRINGS || {};
        this.uiSettings = CONFIG.UI_SETTINGS || {};

        this.mainMenuScreen = document.getElementById('mainMenuScreen');
        this.newCampaignButton = document.getElementById('newCampaignButton');
        this.mainMenuMemorialButton = document.getElementById('mainMenuMemorialButton');
        this.howToPlayButton = document.getElementById('howToPlayButton');
        this.backFromHowToPlayButton = document.getElementById('backFromHowToPlayButton');
        this.howToPlayScreen = document.getElementById('howToPlayScreen');
        this.manualTabs = document.querySelectorAll('.manual-tab');
        this.manualPages = document.querySelectorAll('.manual-page');
        this.optionsButton = document.getElementById('optionsButton');
        this.preMissionScreen = document.getElementById('preMissionScreen');
        this.postMissionScreen = document.getElementById('postMissionScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.recruitMemorialScreen = document.getElementById('recruitMemorialScreen');
        this.memorialEntriesList = document.getElementById('memorialEntriesList');
        this.backFromMemorialButton = document.getElementById('backFromMemorialButton');
        this.viewMemorialButton = document.getElementById('viewMemorialButton');
        this.leftHudPanel = document.getElementById('left-hud-panel');
        this.squadPanel = document.getElementById('hud-squad');
        this.objectiveTextContainer = document.getElementById('objectiveTextContainer');
        this.objectivesPanel = document.getElementById('hud-objective');
        this.missionOutcomeText = document.getElementById('missionOutcome');
        this.preMissionPhaseTitle = document.getElementById('preMissionPhaseTitle');
        this.preMissionTitle = document.getElementById('preMissionTitle');
        this.preMissionBriefing = document.getElementById('preMissionBriefing');
        this.preMissionObjectivesList = document.getElementById('preMissionObjectivesList');
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
        this.videoLoadingScreen = document.getElementById('videoLoadingScreen');
        this.loadingVideoPlayer = document.getElementById('loadingVideoPlayer');

        this.gameOverMemorialButton = document.getElementById('gameOverMemorialButton'); // New button
        this.gameOverNewCampaignButton = document.getElementById('gameOverNewCampaignButton');

        // Save/Load UI elements
        this.continueGameButton = document.getElementById('continueGameButton');
        this.loadGameButton = document.getElementById('loadGameButton');
        this.saveGamePauseButton = document.getElementById('saveGamePauseButton');
        this.saveLoadModal = document.getElementById('saveLoadModal');
        this.saveLoadModalTitle = document.getElementById('saveLoadModalTitle');
        this.saveSlotsList = document.getElementById('saveSlotsList');
        this.exportSaveButton = document.getElementById('exportSaveButton');
        this.importSaveButton = document.getElementById('importSaveButton');
        this.closeSaveLoadModal = document.getElementById('closeSaveLoadModal');
        this.importFileInput = document.getElementById('importFileInput');
        this.currentSaveLoadMode = null; // 'save' or 'load'
        this.selectedSlotIndex = null;

        this._addSoundToButton(this.newCampaignButton, () => {
            if (this.game) {
                this.hideMainMenuScreen();
                // --- MODIFICATION: Explicitly start a new campaign ---
                this.game.initializeNewCampaign(true);
                this.game.start();
            }
        });

        // Continue button - loads most recent save (auto-save first, then manual saves)
        this._addSoundToButton(this.continueGameButton, () => {
            if (this.game) {
                // Try auto-save first
                if (SaveManager.autoLoad(this.game)) {
                    console.log('[UI] Continue: Loaded from auto-save');
                    this.hideMainMenuScreen();
                    this.game.start();
                    return;
                }
                
                // Fall back to manual save slots
                const mostRecent = SaveManager.getMostRecentSave();
                if (mostRecent) {
                    if (SaveManager.loadFromSlot(this.game, mostRecent.slotIndex)) {
                        this.hideMainMenuScreen();
                        this.game.start();
                        return;
                    }
                }
                
                console.log('[UI] Continue: No save found');
            }
        });

        // Load Game button - opens load modal
        this._addSoundToButton(this.loadGameButton, () => this.showSaveLoadModal('load'));

        // Save Game button in pause menu
        this._addSoundToButton(this.saveGamePauseButton, () => {
            if (this.game) {
                this.game.isGamePausedManually = true; // Keep game paused
                this.hidePauseMenuScreen();
                this.showSaveLoadModal('save');
            }
        });

        // Modal buttons
        this._addSoundToButton(this.closeSaveLoadModal, () => this.hideSaveLoadModal());
        this._addSoundToButton(this.exportSaveButton, () => this.handleExportSave());
        this._addSoundToButton(this.importSaveButton, () => {
            if (this.importFileInput) this.importFileInput.click();
        });

        // File import handler
        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => this.handleImportSave(e));
        }

        this.initManual();

        this._addSoundToButton(this.mainMenuMemorialButton, () => this.showRecruitMemorialScreen());
        this._addSoundToButton(this.startMissionButton, () => {
            if (this.game) {
                const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
                const currentCount = this.game.tempSelectedForDeployment ? this.game.tempSelectedForDeployment.length : 0;
                if (currentCount > 0 && currentCount <= maxSquadSize) {
                    // Auto-save before mission
                    if (!this._autoSaveBeforeMission()) {
                        return; // Auto-save failed (user needs to pick a slot), abort start
                    }
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
                    this.nextMissionButton.textContent === (this.uiText.BUTTON_TEXT_CAMPAIGN_COMPLETE || "View Final Stats")) {
                    // --- MODIFICATION: Explicitly restart the SAME campaign ---
                    this.game.initializeNewCampaign(false);
                    this.game.start();
                } else {
                    // Proceed to next mission first (which updates indices and shows pre-mission screen)
                    this.game.proceedToNextLogicalStep();
                    // THEN auto-save after the transition is complete (with correct updated indices)
                    if (!this._autoSaveBeforeMission()) return;
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
            // --- MODIFICATION: Explicitly restart the SAME campaign ---
            if (this.game) { this.game.initializeNewCampaign(false); this.game.start(); }
        });
        this._addSoundToButton(this.gameOverNewCampaignButton, () => {
            // --- MODIFICATION: Explicitly start a NEW campaign ---
            if (this.game) { this.game.initializeNewCampaign(true); this.game.start(); }
        });
        this._addSoundToButton(this.toggleFormationButton, () => {
            if (this.game && typeof this.game.toggleFormation === 'function') this.game.toggleFormation();
        });
        this._addSoundToButton(this.viewMemorialButton, () => this.showRecruitMemorialScreen());
        this._addSoundToButton(this.backFromMemorialButton, () => {
            this.hideRecruitMemorialScreen();
            if (this.game && (this.game.gameState === 'POST_MISSION_DEBRIEF' || this.game.gameState === 'GAME_OVER_NO_RECRUITS') && this.postMissionScreen.style.display === 'flex') {
                // Do nothing, stay on post-mission/game-over
            } else if (this.game && this.game.gameState === 'GAME_OVER_NO_RECRUITS') {
                this.showGameOverScreen(this.game.gameOverMessage || CONFIG.UI_TEXT_STRINGS.GAMEOVER_ALL_RECRUITS_KIA);
            }
            else if (this.game && this.game.gameState === 'POST_MISSION_DEBRIEF' && this.postMissionScreen) {
                this.postMissionScreen.style.display = 'flex';
            } else if (this.game && this.game.gameState === 'MAIN_MENU' && this.mainMenuScreen) {
                this.mainMenuScreen.style.display = 'flex';
            }
        });
        this._addSoundToButton(this.gameOverMemorialButton, () => this.showRecruitMemorialScreen());
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game) {
            const initialSpacing = (this.game && this.game.formationSpacingMultiplier !== undefined) ? this.game.formationSpacingMultiplier : (CONFIG.INITIAL_FORMATION_SPACING || 3.5);
            this.formationSpacingSlider.value = initialSpacing.toString();
            if (this.spacingValueDisplay) this.spacingValueDisplay.textContent = initialSpacing.toFixed(1);
            this.formationSpacingSlider.addEventListener('input', () => {
                const newMultiplier = parseFloat(this.formationSpacingSlider.value);
                if (this.game) this.game.setFormationSpacing(newMultiplier);
                if (this.spacingValueDisplay) this.spacingValueDisplay.textContent = newMultiplier.toFixed(1);
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

        // --- SHOOTOUT MODE UI ELEMENTS ---
        this.shootoutModeButton = document.getElementById('shootoutModeButton');
        this.shootoutPreGameScreen = document.getElementById('shootoutPreGameScreen');
        this.shootoutGameOverScreen = document.getElementById('shootoutGameOverScreen');
        this.shootoutHud = document.getElementById('shootoutHud');
        this.startShootoutButton = document.getElementById('startShootoutButton');
        this.backFromShootoutButton = document.getElementById('backFromShootoutButton');
        this.playShootoutAgainButton = document.getElementById('playShootoutAgainButton');
        this.shootoutToMainMenuButton = document.getElementById('shootoutToMainMenuButton');
        this.backToShootoutMenuButton = document.getElementById('backToShootoutMenuButton');
        this.shootoutHighScoreDisplay = document.getElementById('shootoutHighScoreDisplay');
        this.shootoutEliminationHighScoreDisplay = document.getElementById('shootoutEliminationHighScoreDisplay');
        this.shootoutFinalScore = document.getElementById('shootoutFinalScore');
        this.shootoutFinalAccuracy = document.getElementById('shootoutFinalAccuracy');
        this.shootoutGrade = document.getElementById('shootoutGrade');
        this.shootoutDamageTaken = document.getElementById('shootoutDamageTaken');
        this.shootoutDamagePenalty = document.getElementById('shootoutDamagePenalty');
        this.newHighScoreRow = document.getElementById('newHighScoreRow');
        this.shootoutMapList = document.getElementById('shootoutMapList');

        // Shuffle Mode
        this.shuffleModeToggle = document.getElementById('shuffleModeToggle');
        this.startNextRoundButton = document.getElementById('startNextRoundButton');

        // Mode Selection
        this.modeTimeAttackButton = document.getElementById('modeTimeAttackButton');
        this.modeEliminationButton = document.getElementById('modeEliminationButton');
        this.shootoutModeDescription = document.getElementById('shootoutModeDescription');
        this.shootoutGoalHud = document.getElementById('shootoutGoal');

        // --- SHOOTOUT DEV MODE UI ELEMENTS ---
        this.toggleDevModeButton = document.getElementById('toggleDevModeButton');
        this.shootoutDevOverlay = document.getElementById('shootoutDevOverlay');
        this.copySpawnConfigButton = document.getElementById('copySpawnConfigButton');
        this.resetSpawnPositionsButton = document.getElementById('resetSpawnPositionsButton');
        this.toggleAddSpawnModeButton = document.getElementById('toggleAddSpawnModeButton');
        this.exitDevModeButton = document.getElementById('exitDevModeButton');
        this.deleteSpawnButton = document.getElementById('deleteSpawnButton');
        this.devStatusMessage = document.getElementById('devStatusMessage');

        // --- SPAWN PROPERTIES PANEL ELEMENTS ---
        this.spawnPropertiesPanel = document.getElementById('spawnPropertiesPanel');
        this.selectedSpawnIndex = document.getElementById('selectedSpawnIndex');
        this.enemyConfigContainer = document.getElementById('enemyConfigContainer');
        this.spawnPosX = document.getElementById('spawnPosX');
        this.spawnPosY = document.getElementById('spawnPosY');
        this.directionButtons = document.querySelectorAll('.dir-btn');

        // Shootout button listeners
        if (this.shootoutModeButton) {
            this._addSoundToButton(this.shootoutModeButton, async () => {
                if (this.game) {
                    await this.game.startShootoutMode();
                }
            });
        }

        // --- SHOOTOUT PAUSE MENU ELEMENTS ---
        this.shootoutPauseMenuScreen = document.getElementById('shootoutPauseMenuScreen');
        this.shootoutResumeGameButton = document.getElementById('shootoutResumeGameButton');
        this.shootoutRestartButton = document.getElementById('shootoutRestartButton');
        this.shootoutMenuPauseButton = document.getElementById('shootoutMenuPauseButton');

        // Shootout pause menu button listeners
        if (this.shootoutResumeGameButton) {
            this._addSoundToButton(this.shootoutResumeGameButton, () => {
                if (this.game) this.game.toggleShootoutPause();
            });
        }

        if (this.shootoutRestartButton) {
            this._addSoundToButton(this.shootoutRestartButton, () => {
                if (this.game) {
                    this.hideShootoutPauseMenuScreen();
                    this.game.startShootoutRound();
                }
            });
        }

        if (this.shootoutMenuPauseButton) {
            this._addSoundToButton(this.shootoutMenuPauseButton, () => {
                if (this.game) {
                    this.hideShootoutPauseMenuScreen();
                    this.game.exitShootoutMode();
                }
            });
        }

        // Mode Selection Listeners
        if (this.modeTimeAttackButton) {
            this._addSoundToButton(this.modeTimeAttackButton, () => {
                if (this.game && this.game.shootoutController) {
                    this.game.shootoutController.gameMode = CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK;
                    this.modeTimeAttackButton.classList.add('active');
                    this.modeEliminationButton.classList.remove('active');
                    if (this.shootoutModeDescription) this.shootoutModeDescription.textContent = "Survive for 60 seconds and get the highest score!";
                }
            });
        }

        if (this.modeEliminationButton) {
            this._addSoundToButton(this.modeEliminationButton, () => {
                if (this.game && this.game.shootoutController) {
                    this.game.shootoutController.gameMode = CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION;
                    this.modeEliminationButton.classList.add('active');
                    this.modeTimeAttackButton.classList.remove('active');
                    if (this.shootoutModeDescription) this.shootoutModeDescription.textContent = "Eliminate all targets as quickly as possible!";
                }
            });
        }

        if (this.startShootoutButton) {
            this._addSoundToButton(this.startShootoutButton, () => {
                if (this.game) {
                    this.hideShootoutPreGameScreen();
                    this.game.startShootoutRound();
                }
            });
        }

        if (this.backFromShootoutButton) {
            this._addSoundToButton(this.backFromShootoutButton, () => {
                this.hideShootoutPreGameScreen();
                if (this.game) {
                    this.game.exitShootoutMode();
                }
            });
        }

        if (this.playShootoutAgainButton) {
            this._addSoundToButton(this.playShootoutAgainButton, () => {
                this.hideShootoutGameOverScreen();
                if (this.game) {
                    this.game.startShootoutRound();
                }
            });
        }

        if (this.shootoutToMainMenuButton) {
            this._addSoundToButton(this.shootoutToMainMenuButton, () => {
                this.hideShootoutGameOverScreen();
                if (this.game) {
                    this.game.exitShootoutMode();
                }
            });
        }

        if (this.backToShootoutMenuButton) {
            this._addSoundToButton(this.backToShootoutMenuButton, () => {
                this.hideShootoutGameOverScreen();
                if (this.game) {
                    this.game.returnToShootoutMenu();
                }
            });
        }

        // Shuffle Mode toggle
        if (this.shuffleModeToggle) {
            this.shuffleModeToggle.addEventListener('change', (e) => {
                if (this.game && this.game.shootoutController) {
                    this.game.shootoutController.toggleShuffleMode();
                }
            });
        }

        // Start Next Round button (for shuffle mode)
        if (this.startNextRoundButton) {
            this._addSoundToButton(this.startNextRoundButton, () => {
                if (this.game && this.game.shootoutController) {
                    // If shuffle mode is on, select a random map
                    if (this.game.shootoutController.isShuffleMode) {
                        this.game.shootoutController.selectRandomMap();
                    }
                }
                this.hideShootoutGameOverScreen();
                if (this.game) {
                    this.game.startShootoutRound();
                }
            });
        }

        // Dev Mode button listeners
        if (this.toggleDevModeButton) {
            this._addSoundToButton(this.toggleDevModeButton, () => {
                this.toggleDevMode();
            });
        }

        if (this.copySpawnConfigButton) {
            this._addSoundToButton(this.copySpawnConfigButton, () => {
                this.copySpawnConfigToClipboard();
            });
        }

        if (this.resetSpawnPositionsButton) {
            this._addSoundToButton(this.resetSpawnPositionsButton, () => {
                this.resetSpawnPositions();
            });
        }

        if (this.toggleAddSpawnModeButton) {
            this._addSoundToButton(this.toggleAddSpawnModeButton, () => {
                this.toggleAddSpawnMode();
            });
        }

        if (this.deleteSpawnButton) {
            this._addSoundToButton(this.deleteSpawnButton, () => {
                this.deleteSelectedSpawn();
            });
        }

        if (this.exitDevModeButton) {
            this._addSoundToButton(this.exitDevModeButton, () => {
                this.toggleDevMode(); // Toggle off
            });
        }

        // Spawn Properties Panel - Direction buttons
        if (this.directionButtons) {
            this.directionButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const direction = btn.dataset.dir;
                    this.updateSelectedSpawnDirection(direction);
                });
            });
        }

        // Add shootout buttons to hover sounds
        const shootoutButtons = [
            this.shootoutModeButton, this.startShootoutButton, this.backFromShootoutButton,
            this.playShootoutAgainButton, this.backToShootoutMenuButton, this.shootoutToMainMenuButton,
            this.startNextRoundButton, this.toggleDevModeButton, this.copySpawnConfigButton, this.resetSpawnPositionsButton,
            this.toggleAddSpawnModeButton, this.exitDevModeButton, this.deleteSpawnButton
        ];
        shootoutButtons.forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    if (this.game && this.game.audioManager && !button.disabled) {
                        this.game.audioManager.play('UI_BUTTON_HOVER');
                    }
                });
            }
        });
        // --- END SHOOTOUT MODE UI ELEMENTS ---

        // Prevent context menu on HUD elements during campaign gameplay
        if (this.leftHudPanel) {
            this.leftHudPanel.addEventListener('contextmenu', (event) => {
                if (this.game && this.game.campaignSeed && this.game.gameState === 'RUNNING') {
                    event.preventDefault();
                }
            });
        }

        if (this.objectivesPanel) {
            this.objectivesPanel.addEventListener('contextmenu', (event) => {
                if (this.game && this.game.campaignSeed && this.game.gameState === 'RUNNING') {
                    event.preventDefault();
                }
            });
        }
    }

    showVideoLoadingScreen(videoPath) {
        if (!this.videoLoadingScreen || !this.loadingVideoPlayer) return Promise.resolve();

        this.loadingVideoPlayer.src = videoPath;
        this.loadingVideoPlayer.load();
        
        // Return a promise that resolves when video starts playing
        // This ensures the 6-second timer doesn't start until video is actually playing
        const videoPlayPromise = this.loadingVideoPlayer.play().then(() => {
            console.log("Video started playing successfully");
            return true;
        }).catch(error => {
            console.warn("Video autoplay was prevented. User interaction might be required.", error);
            // Fallback to a static loading screen if video fails - still resolve after a delay
            return new Promise(resolve => setTimeout(resolve, 2000));
        });

        this.videoLoadingScreen.style.display = 'flex';
        setTimeout(() => {
            this.videoLoadingScreen.classList.add('visible');
        }, 10);

        return videoPlayPromise;
    }

    hideVideoLoadingScreen() {
        if (!this.videoLoadingScreen || !this.loadingVideoPlayer) return;

        this.videoLoadingScreen.classList.remove('visible');

        setTimeout(() => {
            this.videoLoadingScreen.style.display = 'none';
            this.loadingVideoPlayer.pause();
            this.loadingVideoPlayer.src = '';
        }, 500);
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
            this.backFromMemorialButton,
            this.gameOverMemorialButton,
            this.gameOverNewCampaignButton,
            // Save/Load buttons
            this.continueGameButton, this.loadGameButton, this.saveGamePauseButton,
            this.exportSaveButton, this.importSaveButton, this.closeSaveLoadModal
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
        this.hideSaveLoadModal();
        this.hideHowToPlayScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        if (this.mainMenuMemorialButton && this.game) {
            this.mainMenuMemorialButton.disabled = !(this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0);
        }
        // Update Continue button state
        if (this.continueGameButton) {
            const hasManualSaves = SaveManager.hasSaves();
            const hasAutoSave = SaveManager.hasAutoSave();
            this.continueGameButton.disabled = !(hasManualSaves || hasAutoSave);
        }
        this.mainMenuScreen.style.display = 'flex'; this.setCursor('default');
    }
    hideMainMenuScreen() { if (this.mainMenuScreen) this.mainMenuScreen.style.display = 'none'; }
    hidePreMissionScreen() { if (this.preMissionScreen) this.preMissionScreen.style.display = 'none'; }
    hidePostMissionScreen() { if (this.postMissionScreen) this.postMissionScreen.style.display = 'none'; }
    hideGameOverScreen() { if (this.gameOverScreen) this.gameOverScreen.style.display = 'none'; }
    hideRecruitMemorialScreen() {
        if (this.recruitMemorialScreen) this.recruitMemorialScreen.style.display = 'none';
    }

    // --- SHOOTOUT MODE UI METHODS ---
    showShootoutPreGameScreen() {
        this.hideMainMenuScreen();
        this.hideHowToPlayScreen();
        if (this.shootoutPreGameScreen) {
            // Update high score display
            if (this.shootoutHighScoreDisplay && this.game && this.game.shootoutController) {
                this.shootoutHighScoreDisplay.textContent = this.game.shootoutController.highScores[CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK] || 0;
            }
            if (this.shootoutEliminationHighScoreDisplay && this.game && this.game.shootoutController) {
                this.shootoutEliminationHighScoreDisplay.textContent = this.game.shootoutController.highScores[CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION] || 0;
            }

            // Reset mode toggle to match controller's current state
            if (this.game && this.game.shootoutController) {
                const currentMode = this.game.shootoutController.gameMode;
                if (this.modeTimeAttackButton && this.modeEliminationButton) {
                    this.modeTimeAttackButton.classList.toggle('active', currentMode === CONFIG.SHOOTOUT_MODE.MODES.TIME_ATTACK);
                    this.modeEliminationButton.classList.toggle('active', currentMode === CONFIG.SHOOTOUT_MODE.MODES.ELIMINATION);
                }
            }

            this.populateShootoutMapList();

            this.shootoutPreGameScreen.style.display = 'flex';
        }
        // Ensure dev overlay is hidden when showing pre-game screen
        if (this.shootoutDevOverlay) {
            this.shootoutDevOverlay.style.display = 'none';
        }
    }

    populateShootoutMapList() {
        if (!this.shootoutMapList || !this.game || !this.game.shootoutController) return;

        this.shootoutMapList.innerHTML = '';
        const backgrounds = CONFIG.SHOOTOUT_MODE.BACKGROUNDS;
        const currentBg = this.game.shootoutController.currentBackgroundKey;
        const isNight = this.game.shootoutController.isNightMode;

        Object.keys(backgrounds).forEach(key => {
            const bg = backgrounds[key];
            const card = document.createElement('div');
            card.className = 'map-card';
            if (key === currentBg) card.classList.add('selected');
            if (isNight) card.classList.add('night-mode');
            card.style.backgroundImage = `url('${bg.IMAGE}')`;

            // Night Mode Toggle
            const nightToggle = document.createElement('div');
            nightToggle.className = 'night-toggle' + (isNight ? ' active' : '');
            nightToggle.title = 'Toggle Night Mode';
            nightToggle.innerHTML = `<span class="icon">${isNight ? '🌙' : '☀️'}</span>`;

            nightToggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't select the map just yet
                if (this.game.audioManager) {
                    this.game.audioManager.play('UI_BUTTON_CLICK');
                }
                const newNightState = !this.game.shootoutController.isNightMode;
                this.game.shootoutController.setNightMode(newNightState);
                this.populateShootoutMapList(); // Refresh all cards
            });
            card.appendChild(nightToggle);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'map-card-name';
            nameDiv.textContent = (bg.NAME || key) + (isNight ? ' (Night)' : '');
            card.appendChild(nameDiv);

            card.addEventListener('click', () => {
                if (this.game.audioManager) {
                    this.game.audioManager.play('UI_BUTTON_CLICK');
                }
                this.game.shootoutController.setBackground(key);
                this.populateShootoutMapList(); // Refresh selection
            });

            this.shootoutMapList.appendChild(card);
        });
    }

    hideShootoutPreGameScreen() {
        if (this.shootoutPreGameScreen) this.shootoutPreGameScreen.style.display = 'none';
    }

    showShootoutGameOver(stats) {
        this.hideShootoutHud();
        if (this.shootoutGameOverScreen) {

            // Set dynamic title based on the reason for the game over
            const titleElement = document.getElementById('shootoutGameOverTitle');
            if (titleElement) {
                switch (stats.endReason) {
                    case 'health':
                        titleElement.textContent = "KILLED IN ACTION";
                        titleElement.style.color = "#ff6e6e";
                        break;
                    case 'clear':
                        titleElement.textContent = "ALL TARGETS ELIMINATED";
                        titleElement.style.color = "#4CAF50";
                        break;
                    case 'time':
                    default:
                        titleElement.textContent = "TIME'S UP!";
                        titleElement.style.color = "#ffbd4a";
                        break;
                }
            }

            // Core Stats
            if (this.shootoutFinalScore) this.shootoutFinalScore.textContent = stats.score;
            if (this.shootoutFinalAccuracy) this.shootoutFinalAccuracy.textContent = stats.accuracy + '%';

            // Fix duplicate grade ID and set both
            if (this.shootoutGrade) this.shootoutGrade.textContent = stats.grade;
            const statGradeDisplay = document.getElementById('shootoutStatGrade');
            if (statGradeDisplay) statGradeDisplay.textContent = stats.grade;

            // Get the grade-hex container for styling
            const gradeHexElement = document.querySelector('.grade-hex');

            // Set CSS classes for color coding on grade displays
            const gradeElements = [this.shootoutGrade, statGradeDisplay, gradeHexElement];
            gradeElements.forEach(el => {
                if (!el) return;
                
                // Build class name based on grade
                const gradeClass = 'grade-' + stats.grade.toLowerCase();
                
                // clear previous classes
                if (el.classList.contains('grade-letter')) {
                    el.className = 'grade-letter grade-text';
                } else if (el.classList.contains('grade-hex')) {
                    el.className = 'grade-hex';
                } else {
                    el.className = 'stat-value grade-display';
                }

                // Add the grade-specific class
                el.classList.add(gradeClass);

                // Add quality class for color
                if (stats.grade === 'S' || stats.grade === 'A') el.classList.add('good');
                else if (stats.grade === 'B' || stats.grade === 'C') el.classList.add('warning');
                else if (stats.grade === 'D' || stats.grade === 'F') el.classList.add('bad');
            });

            if (this.newHighScoreRow) {
                this.newHighScoreRow.style.display = stats.isNewHighScore ? 'flex' : 'none';
            }

            // Advanced Metrics
            if (this.shootoutDamageTaken) this.shootoutDamageTaken.textContent = Math.round(stats.totalDamageTaken);
            if (this.shootoutDamagePenalty) {
                const bonus = Math.round(stats.damagePenalty);
                this.shootoutDamagePenalty.textContent = bonus;

                // Color coding for Survival Bonus
                this.shootoutDamagePenalty.classList.remove('good', 'warning', 'bad');
                if (bonus >= 800) this.shootoutDamagePenalty.classList.add('good');
                else if (bonus >= 400) this.shootoutDamagePenalty.classList.add('warning');
                else this.shootoutDamagePenalty.classList.add('bad');
            }

            const timeBonusElement = document.getElementById('timeBonus');
            if (timeBonusElement) timeBonusElement.textContent = Math.round(stats.timeBonus);

            // Performance Breakdown
            const totalHitsElement = document.getElementById('totalHits');
            if (totalHitsElement) totalHitsElement.textContent = stats.hits;

            const totalKillsElement = document.getElementById('totalKills');
            if (totalKillsElement) totalKillsElement.textContent = stats.kills;

            const shotsFiredElement = document.getElementById('shotsFired');
            if (shotsFiredElement) shotsFiredElement.textContent = stats.shotsFired;

            // Advanced Stats
            const maxStreakElement = document.getElementById('maxStreak');
            if (maxStreakElement) maxStreakElement.textContent = stats.maxStreak;

            const headshotPctElement = document.getElementById('headshotPct');
            if (headshotPctElement) headshotPctElement.textContent = stats.headshotPct + '%';

            const avgReactionElement = document.getElementById('avgReaction');
            if (avgReactionElement) avgReactionElement.textContent = stats.avgReaction + 'ms';

            const avgTTKElement = document.getElementById('avgTTK');
            if (avgTTKElement) avgTTKElement.textContent = stats.avgTTK + 'ms';

            const avgOffsetElement = document.getElementById('avgOffset');
            if (avgOffsetElement) avgOffsetElement.textContent = stats.avgOffset + 'px';

            this.shootoutGameOverScreen.style.display = 'flex';

            // Show/hide Start Next Round button based on shuffle mode
            if (this.startNextRoundButton) {
                const isShuffleMode = this.game && this.game.shootoutController && this.game.shootoutController.isShuffleMode;
                this.startNextRoundButton.style.display = isShuffleMode ? 'inline-block' : 'none';
            }

            // Allow display change to process before adding visible class for CSS transition
            setTimeout(() => {
                this.shootoutGameOverScreen.classList.add('visible');
            }, 10);

            // Hide buttons initially, then show after delay
            this.setShootoutGameOverButtonsVisible(false);

            // Delay before showing buttons to prevent accidental clicks
            const buttonDelay = CONFIG.SHOOTOUT_MODE.GAME_OVER_BUTTON_DELAY || 1.5;
            setTimeout(() => {
                this.setShootoutGameOverButtonsVisible(true);
            }, buttonDelay * 1000);
        }
    }

    setShootoutGameOverButtonsVisible(visible) {
        if (!this.shootoutGameOverScreen) return;

        // Find buttons in the game over screen
        const buttons = this.shootoutGameOverScreen.querySelectorAll('button, .btn');
        buttons.forEach(btn => {
            btn.style.opacity = visible ? '1' : '0';
            btn.style.pointerEvents = visible ? 'auto' : 'none';
            btn.style.transition = 'opacity 0.3s ease';
        });
    }

    hideShootoutGameOverScreen() {
        if (this.shootoutGameOverScreen) {
            this.shootoutGameOverScreen.classList.remove('visible');
            setTimeout(() => {
                this.shootoutGameOverScreen.style.display = 'none';
            }, 300); // Wait for the opacity transition
        }
    }

    showShootoutHud() {
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        if (this.preMissionScreen) this.preMissionScreen.style.display = 'none';
        if (this.shootoutHud) this.shootoutHud.style.display = 'block';
    }

    hideShootoutHud() {
        if (this.shootoutHud) this.shootoutHud.style.display = 'none';
    }

    // --- DEV MODE METHODS ---
    toggleDevMode() {
        if (!this.game || !this.game.shootoutController) return;

        const isDevMode = this.game.shootoutController.toggleDevMode();

        // Update UI
        if (this.toggleDevModeButton) {
            this.toggleDevModeButton.textContent = isDevMode ? 'Dev Mode: ON' : 'Dev Mode: OFF';
            this.toggleDevModeButton.classList.toggle('active', isDevMode);
        }

        // Show/hide the floating dev overlay
        if (this.shootoutDevOverlay) {
            this.shootoutDevOverlay.style.display = isDevMode ? 'block' : 'none';
        }

        // When entering dev mode, hide the pre-game screen to show only canvas + spawn boxes
        // When exiting dev mode, show the pre-game screen again
        if (this.shootoutPreGameScreen) {
            this.shootoutPreGameScreen.style.display = isDevMode ? 'none' : 'flex';
        }

        // Clear any status message
        this.showDevStatus('', '');

        // Reset Add Spawn Mode button state
        if (this.toggleAddSpawnModeButton) {
            this.toggleAddSpawnModeButton.textContent = '+ Add Spawn';
            this.toggleAddSpawnModeButton.classList.remove('active');
        }

        // If entering dev mode, trigger a render to show spawn points
        // Stay in SHOOTOUT_PRE_GAME state - background + spawn boxes only
        if (isDevMode) {
            this.game.render();
        }
    }

    async copySpawnConfigToClipboard() {
        if (!this.game || !this.game.shootoutController) return;

        const jsonConfig = this.game.shootoutController.getSpawnPositionsAsJSON();

        try {
            await navigator.clipboard.writeText(jsonConfig);
            this.showDevStatus('Config copied to clipboard!', 'success');
            console.log('Spawn Config:\n', jsonConfig);
        } catch (err) {
            // Fallback: show in console and display error
            console.log('Spawn Config (copy manually):\n', jsonConfig);
            this.showDevStatus('Failed to copy. See console for JSON.', 'error');
        }
    }

    resetSpawnPositions() {
        if (!this.game || !this.game.shootoutController) return;

        // Reset to default config positions
        this.game.shootoutController.initializeEditablePositions();
        this.showDevStatus('Positions reset to default', 'success');

        // Hide properties panel
        if (this.spawnPropertiesPanel) {
            this.spawnPropertiesPanel.style.display = 'none';
        }

        // Re-render to show reset positions (works in both PRE_GAME and PLAYING states)
        if (this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_PLAYING') {
            this.game.render();
        }
    }

    toggleAddSpawnMode() {
        if (!this.game || !this.game.shootoutController) return;

        const isAddMode = this.game.shootoutController.toggleAddSpawnMode();

        // Update button state
        if (this.toggleAddSpawnModeButton) {
            this.toggleAddSpawnModeButton.textContent = isAddMode ? '+ Click to Add' : '+ Add Spawn';
            this.toggleAddSpawnModeButton.classList.toggle('active', isAddMode);
        }

        // Show status message
        if (isAddMode) {
            this.showDevStatus('Click anywhere to add a new spawn point', 'info');
        } else {
            this.showDevStatus('', '');
        }

        // Re-render to show/hide add mode overlay
        if (this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_PLAYING') {
            this.game.render();
        }
    }

    deleteSelectedSpawn() {
        if (!this.game || !this.game.shootoutController) return;

        const selectedIndex = this.game.shootoutController.selectedSpawnIndex;
        if (selectedIndex === -1) {
            this.showDevStatus('No spawn point selected', 'error');
            return;
        }

        // Confirm deletion for safety
        if (!confirm(`Are you sure you want to delete spawn point #${selectedIndex}?`)) {
            return;
        }

        // Remove the spawn
        this.game.shootoutController.removeSpawnPosition(selectedIndex);

        // Hide properties panel
        if (this.spawnPropertiesPanel) {
            this.spawnPropertiesPanel.style.display = 'none';
        }

        // Show success message
        this.showDevStatus('Spawn point deleted', 'success');

        // Re-render to show updated positions
        if (this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_PLAYING') {
            this.game.render();
        }
    }

    // Update the properties panel with the selected spawn point's data
    updateSpawnPropertiesPanel(spawnIndex) {
        if (!this.game || !this.game.shootoutController) return;

        const positions = this.game.shootoutController.getEditableSpawnPositions();
        if (spawnIndex < 0 || spawnIndex >= positions.length) {
            // Hide panel if no valid selection
            if (this.spawnPropertiesPanel) {
                this.spawnPropertiesPanel.style.display = 'none';
            }
            return;
        }

        const pos = positions[spawnIndex];

        // Show panel
        if (this.spawnPropertiesPanel) {
            this.spawnPropertiesPanel.style.display = 'block';
        }

        // Update index display
        if (this.selectedSpawnIndex) {
            this.selectedSpawnIndex.textContent = `#${spawnIndex}`;
        }

        // Update direction buttons
        if (this.directionButtons) {
            this.directionButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.dir === pos.peekDirection);
            });
        }

        // Generate enemy config sections
        this.generateEnemyConfigSections(pos.enemyConfigs);

        // Update coordinates
        if (this.spawnPosX) {
            this.spawnPosX.textContent = pos.x;
        }
        if (this.spawnPosY) {
            this.spawnPosY.textContent = pos.y;
        }
    }

    // Generate enemy configuration sections dynamically
    generateEnemyConfigSections(enemyConfigs) {
        if (!this.enemyConfigContainer) return;

        const enemyTypes = CONFIG.SHOOTOUT_MODE.ENEMY_TYPES;
        const defaultConfigs = CONFIG.SHOOTOUT_MODE.DEFAULT_ENEMY_CONFIGS;

        this.enemyConfigContainer.innerHTML = '';

        Object.entries(enemyTypes).forEach(([type, typeDef]) => {
            const config = enemyConfigs[type] || defaultConfigs[type];
            const section = this.createEnemyConfigSection(type, typeDef, config);
            this.enemyConfigContainer.appendChild(section);
        });
    }

    // Create a single enemy configuration section
    createEnemyConfigSection(type, typeDef, config) {
        const section = document.createElement('div');
        section.className = `enemy-config-section ${config.enabled ? '' : 'disabled'}`;
        section.dataset.enemyType = type;

        const header = document.createElement('div');
        header.className = 'enemy-config-header';

        const title = document.createElement('div');
        title.className = 'enemy-config-title';
        title.style.color = typeDef.color;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = config.enabled;
        checkbox.addEventListener('change', (e) => {
            this.updateEnemyConfig(type, 'enabled', e.target.checked);
            section.classList.toggle('disabled', !e.target.checked);
        });

        const label = document.createElement('span');
        label.textContent = typeDef.displayName;

        title.appendChild(checkbox);
        title.appendChild(label);

        // Show in dev mode checkbox
        const showControl = document.createElement('div');
        showControl.className = 'enemy-show-control';
        showControl.style.marginLeft = '10px';

        const showCheckbox = document.createElement('input');
        showCheckbox.type = 'checkbox';
        showCheckbox.checked = config.showInDevMode !== false;
        showCheckbox.title = 'Show sprite in Dev Mode';
        showCheckbox.addEventListener('change', (e) => {
            this.updateEnemyConfig(type, 'showInDevMode', e.target.checked);
        });

        const showLabel = document.createElement('span');
        showLabel.textContent = '👁️';
        showLabel.style.fontSize = '12px';
        showLabel.style.marginLeft = '2px';
        showLabel.title = 'Show sprite in Dev Mode';

        showControl.appendChild(showCheckbox);
        showControl.appendChild(showLabel);
        title.appendChild(showControl);

        // Weight control
        const weightControl = document.createElement('div');
        weightControl.className = 'enemy-weight-control';

        const weightSlider = document.createElement('input');
        weightSlider.type = 'range';
        weightSlider.className = 'enemy-weight-slider';
        weightSlider.min = '0';
        weightSlider.max = '100';
        weightSlider.value = config.weight;
        weightSlider.addEventListener('input', (e) => {
            weightValue.textContent = e.target.value + '%';
            this.updateEnemyConfig(type, 'weight', parseInt(e.target.value, 10));
        });

        const weightValue = document.createElement('span');
        weightValue.className = 'enemy-weight-value';
        weightValue.textContent = config.weight + '%';

        weightControl.appendChild(weightSlider);
        weightControl.appendChild(weightValue);

        header.appendChild(title);
        header.appendChild(weightControl);

        // Sliders row
        const slidersRow = document.createElement('div');
        slidersRow.className = 'enemy-config-sliders';

        // Offset slider
        const offsetRow = document.createElement('div');
        offsetRow.className = 'enemy-slider-row';

        const offsetLabel = document.createElement('label');
        offsetLabel.textContent = 'Peek Offset';

        const offsetSlider = document.createElement('input');
        offsetSlider.type = 'range';
        offsetSlider.min = '10';
        offsetSlider.max = '200';
        offsetSlider.step = '5';
        offsetSlider.value = config.peekOffset;
        offsetSlider.addEventListener('input', (e) => {
            offsetValue.textContent = e.target.value;
            this.updateEnemyConfig(type, 'peekOffset', parseInt(e.target.value, 10));
        });

        const offsetValue = document.createElement('span');
        offsetValue.className = 'value-display';
        offsetValue.textContent = config.peekOffset;

        offsetRow.appendChild(offsetLabel);
        offsetRow.appendChild(offsetSlider);
        offsetRow.appendChild(offsetValue);

        // Scale slider
        const scaleRow = document.createElement('div');
        scaleRow.className = 'enemy-slider-row';

        const scaleLabel = document.createElement('label');
        scaleLabel.textContent = 'Scale';

        const scaleSlider = document.createElement('input');
        scaleSlider.type = 'range';
        scaleSlider.min = '0.2';
        scaleSlider.max = '4.0';
        scaleSlider.step = '0.1';
        scaleSlider.value = config.scale;
        scaleSlider.addEventListener('input', (e) => {
            scaleValue.textContent = parseFloat(e.target.value).toFixed(1);
            this.updateEnemyConfig(type, 'scale', parseFloat(e.target.value));
        });

        const scaleValue = document.createElement('span');
        scaleValue.className = 'value-display';
        scaleValue.textContent = config.scale.toFixed(1);

        scaleRow.appendChild(scaleLabel);
        scaleRow.appendChild(scaleSlider);
        scaleRow.appendChild(scaleValue);

        slidersRow.appendChild(offsetRow);
        slidersRow.appendChild(scaleRow);

        section.appendChild(header);
        section.appendChild(slidersRow);

        return section;
    }

    // Update a specific enemy configuration value
    updateEnemyConfig(enemyType, property, value) {
        if (!this.game || !this.game.shootoutController) return;

        const selectedIndex = this.game.shootoutController.selectedSpawnIndex;
        if (selectedIndex === -1) return;

        const pos = this.game.shootoutController.getEditableSpawnPositions()[selectedIndex];
        if (!pos.enemyConfigs[enemyType]) return;

        pos.enemyConfigs[enemyType][property] = value;

        // Re-render to show updated settings
        this.game.render();
    }

    // Update the direction of the selected spawn point
    updateSelectedSpawnDirection(direction) {
        if (!this.game || !this.game.shootoutController) return;

        const selectedIndex = this.game.shootoutController.selectedSpawnIndex;
        if (selectedIndex === -1) return;

        this.game.shootoutController.updateSpawnPosition(selectedIndex, {
            peekDirection: direction
        });

        // Update UI to show new direction
        if (this.directionButtons) {
            this.directionButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.dir === direction);
            });
        }

        // Re-render to show updated direction
        this.game.render();
    }

    // Update just the coordinate display (for drag operations)
    updateSpawnCoordinates(x, y) {
        if (this.spawnPosX) {
            this.spawnPosX.textContent = x;
        }
        if (this.spawnPosY) {
            this.spawnPosY.textContent = y;
        }
    }

    showDevStatus(message, type) {
        if (this.devStatusMessage) {
            this.devStatusMessage.textContent = message;
            this.devStatusMessage.className = 'dev-overlay-status' + (type ? ' ' + type : '');

            // Clear message after 3 seconds
            if (message) {
                setTimeout(() => {
                    if (this.devStatusMessage.textContent === message) {
                        this.devStatusMessage.textContent = '';
                        this.devStatusMessage.className = 'dev-overlay-status';
                    }
                }, 3000);
            }
        }
    }
    // --- END SHOOTOUT MODE UI METHODS ---

    initManual() {
        const navContainer = document.querySelector('.manual-nav');
        const pagesContainer = document.querySelector('.manual-pages');
        if (!navContainer || !pagesContainer || typeof MANUAL_CONTENT === 'undefined') return;

        navContainer.innerHTML = '';
        pagesContainer.innerHTML = '';

        MANUAL_CONTENT.forEach((page, index) => {
            // Tab
            const tab = document.createElement('button');
            tab.className = `manual-tab ${index === 0 ? 'active' : ''}`;
            tab.setAttribute('data-target', page.id);
            tab.textContent = page.tabTitle;
            navContainer.appendChild(tab);

            // Page
            const pageDiv = document.createElement('div');
            pageDiv.id = page.id;
            pageDiv.className = `manual-page ${index === 0 ? 'active' : ''}`;

            page.sections.forEach(section => {
                if (section.type === 'header') {
                    const h3 = document.createElement('h3');
                    h3.textContent = section.content;
                    if (section.style) h3.setAttribute('style', section.style);
                    pageDiv.appendChild(h3);
                } else if (section.type === 'header-small') {
                    const h4 = document.createElement('h4');
                    h4.textContent = section.content;
                    if (section.style) h4.setAttribute('style', section.style);
                    pageDiv.appendChild(h4);
                } else if (section.type === 'paragraph') {
                    const p = document.createElement('p');
                    p.textContent = section.content;
                    pageDiv.appendChild(p);
                } else if (section.type === 'list') {
                    const ul = document.createElement('ul');
                    section.items.forEach(item => {
                        const li = document.createElement('li');
                        li.innerHTML = `${item.label ? `<strong ${item.color ? `style="color: ${item.color}"` : ''}>${item.label}:</strong> ` : ''}${item.text}`;
                        ul.appendChild(li);
                    });
                    pageDiv.appendChild(ul);
                } else if (section.type === 'controls') {
                    const grid = document.createElement('div');
                    grid.className = 'control-grid';
                    section.items.forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'control-row';
                        row.innerHTML = `<span class="key">${item.key}</span> <span>${item.desc}</span>`;
                        grid.appendChild(row);
                    });
                    pageDiv.appendChild(grid);
                } else if (section.type === 'enemy-list') {
                    const enemyList = document.createElement('div');
                    enemyList.className = 'enemy-list';
                    section.items.forEach(enemy => {
                        const item = document.createElement('div');
                        item.className = 'enemy-item';
                        item.innerHTML = `
                            <div class="enemy-image" style="background-image: url('${enemy.image}')"></div>
                            <div class="enemy-info">
                                <div class="enemy-name">${enemy.name}</div>
                                <div class="enemy-description">${enemy.description}</div>
                            </div>
                        `;
                        enemyList.appendChild(item);
                    });
                    pageDiv.appendChild(enemyList);
                }
            });
            pagesContainer.appendChild(pageDiv);
        });

        // Re-select tabs and pages for the click handlers
        this.manualTabs = document.querySelectorAll('.manual-tab');
        this.manualPages = document.querySelectorAll('.manual-page');

        // Setup listeners
        this.manualTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                this.switchManualPage(targetId);
                if (this.game && this.game.audioManager) this.game.audioManager.play('UI_BUTTON_CLICK');
            });
            tab.addEventListener('mouseenter', () => {
                if (this.game && this.game.audioManager) this.game.audioManager.play('UI_BUTTON_HOVER');
            });
        });

        // Setup howToPlay back button manually as it's not part of the dynamic generation but needs listeners re-bound if affected
        // (Actually howToPlayButton and backFromHowToPlayButton are in index.html and don't change, but we need to re-bind their logic here)
        this._addSoundToButton(this.howToPlayButton, () => this.showHowToPlayScreen());
        this._addSoundToButton(this.backFromHowToPlayButton, () => {
            if (this.game && this.game.gameState === 'MAIN_MENU') {
                this.showMainMenuScreen();
            } else {
                this.hideHowToPlayScreen();
            }
        });
    }

    showHowToPlayScreen() {
        if (this.mainMenuScreen) this.mainMenuScreen.style.display = 'none';
        if (this.howToPlayScreen) this.howToPlayScreen.style.display = 'flex';
        // Reset to overview
        this.switchManualPage('manual-overview');
    }

    switchManualPage(targetId) {
        if (!this.manualTabs || !this.manualPages) return;

        // Update Tabs
        this.manualTabs.forEach(tab => {
            if (tab.getAttribute('data-target') === targetId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update Pages
        this.manualPages.forEach(page => {
            if (page.id === targetId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
    }

    hideHowToPlayScreen() {
        if (this.howToPlayScreen) this.howToPlayScreen.style.display = 'none';
    }

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

    _createRosterCard(recruit) {
        const card = document.createElement('li');
        card.className = 'roster-card';
        card.dataset.raccoonId = recruit.id;

        if (recruit.isNewlyRescued) {
            card.classList.add('new-recruit');
        }

        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[recruit.rank]) {
            const rankIconDiv = document.createElement('div');
            rankIconDiv.className = 'rank-icon';
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[recruit.rank]}')`;
            card.appendChild(rankIconDiv);
        }

        const faceDiv = document.createElement('div');
        faceDiv.className = 'roster-card-face';
        faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'roster-card-name';
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

        const faceDiv = document.createElement('div');
        faceDiv.className = 'recruit-card-face';
        if (recruit.faceImageUrl) {
            faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'recruit-card-info';
        infoDiv.innerHTML = `
            <div class="name">${recruit.name || recruit.id}</div>
            <div class="rank">Rank: ${recruit.rank || 'Recruit'}</div>
            <div class="xp">XP: ${recruit.xp}</div>`;

        card.appendChild(faceDiv);
        card.appendChild(infoDiv);

        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[recruit.rank]) {
            const rankIconDiv = document.createElement('div');
            rankIconDiv.className = 'rank-icon';
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[recruit.rank]}')`;
            card.appendChild(rankIconDiv);
        }

        card.addEventListener('click', () => {
            if (this.game && this.game.audioManager) this.game.audioManager.play('UI_BUTTON_CLICK');
            if (!this.game) return;
            this.game.tempSelectedForDeployment = this.game.tempSelectedForDeployment.filter(r => r.id !== recruit.id);
            this.refreshRecruitSelectionLists();
        });
        return card;
    }

    refreshRecruitSelectionLists() {
        if (!this.availableRecruitsList || !this.deployedSquadList || !this.game) return;

        const allMasterRosterRecruits = this.game.getAvailableRecruits();
        const tempSelectedIds = this.game.tempSelectedForDeployment.map(r => r.id);

        this.availableRecruitsList.innerHTML = '';
        this.deployedSquadList.innerHTML = '';

        allMasterRosterRecruits.forEach(recruit => {
            if (!tempSelectedIds.includes(recruit.id)) {
                this.availableRecruitsList.appendChild(this._createRosterCard(recruit));
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
            if (this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = this.uiText.PREMISSION_ERROR_PHASE_TITLE || "Campaign Error";
            if (this.preMissionTitle) this.preMissionTitle.textContent = this.uiText.PREMISSION_ERROR_MISSION_TITLE || "Error Loading Mission";
            if (this.preMissionBriefing) this.preMissionBriefing.textContent = this.uiText.PREMISSION_ERROR_BRIEFING || "Could not load mission details.";
            if (this.preMissionObjectivesList) this.preMissionObjectivesList.innerHTML = '<li>Error loading objectives.</li>';
            this.preMissionScreen.style.display = 'flex';
            this.setCursor('default');
            return;
        }

        const phaseNumText = `Phase ${this.game.currentPhaseIndex + 1} / ${this.game.totalCampaignPhases}`;
        const missionNumText = `Mission ${this.game.currentMissionIndex + 1} / ${phaseData.missionsInPhase}`;
        if (this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = `${phaseData.name} (${phaseNumText} - ${missionNumText})`;

        if (this.preMissionTitle) this.preMissionTitle.textContent = missionData.baseParams.name || CONFIG.UI_TEXT_STRINGS.UNKNOWN_MISSION_TEXT;

        // Night mission badge in briefing
        const briefingSection = document.getElementById('briefingSection');
        const existingNightBadge = briefingSection ? briefingSection.querySelector('.night-mission-briefing-badge') : null;
        if (existingNightBadge) existingNightBadge.remove();
        if (missionData.baseParams.isNightMission && briefingSection) {
            const nightBadge = document.createElement('div');
            nightBadge.className = 'night-mission-briefing-badge';
            nightBadge.textContent = '🌙 NIGHT MISSION';
            const h4 = briefingSection.querySelector('h4');
            if (h4) h4.insertAdjacentElement('afterend', nightBadge);
            else briefingSection.prepend(nightBadge);
        }

        if (this.preMissionBriefing) this.preMissionBriefing.textContent = missionData.baseParams.briefing || "No briefing available.";

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

        // --- DEBUG: Add Test Raccoon Controls to Header ---
        const availableRecruitsTitle = document.getElementById('availableRecruitsTitle');
        if (availableRecruitsTitle) {
            // Remove existing debug controls if any
            const existingDebug = availableRecruitsTitle.parentElement.querySelector('.debug-test-controls');
            if (existingDebug) existingDebug.remove();

            const debugControls = document.createElement('div');
            debugControls.className = 'debug-test-controls';
            debugControls.style.cssText = 'margin-top: 0px; padding: 8px; border: 2px dashed orange; background: rgba(255,165,0,0.1); display: flex; align-items: center; gap: 8px; font-size: 12px;';

            const debugLabel = document.createElement('span');
            debugLabel.textContent = 'DEBUG: Add Test Unit:';
            debugLabel.style.cssText = 'font-weight: bold; color: orange;';
            debugControls.appendChild(debugLabel);

            const rankSelect = document.createElement('select');
            rankSelect.id = 'debug-test-rank-select';
            rankSelect.style.cssText = 'padding: 4px; font-size: 12px;';

            const ranks = ['Recruit', 'Private', 'Corporal', 'Sergeant', 'Elite', 'Ghost'];
            ranks.forEach(rank => {
                const option = document.createElement('option');
                option.value = rank;
                option.textContent = rank;
                rankSelect.appendChild(option);
            });
            debugControls.appendChild(rankSelect);

            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add';
            addBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; font-size: 12px;';
            addBtn.addEventListener('click', () => {
                const selectedRank = rankSelect.value;
                const xpForRank = CONFIG.RANK_THRESHOLDS.find(r => r.rankName === selectedRank)?.xpNeeded || 0;
                const testRecruit = {
                    id: `test-${Date.now()}`,
                    name: `Test ${selectedRank}`,
                    faceImageUrl: `${CONFIG.RACCOON_FACE_IMAGE_PATH}${CONFIG.RACCOON_FACE_IMAGES[Math.floor(Math.random() * CONFIG.RACCOON_FACE_IMAGES.length)]}`,
                    xp: xpForRank,
                    rank: selectedRank,
                    killCount: 0,
                    isPromoted: false
                };
                this.game.masterRoster.push(testRecruit);
                this.refreshRecruitSelectionLists();
                console.log(`[DEBUG] Added test unit: ${testRecruit.name} with rank ${selectedRank}, XP: ${xpForRank}`);
            });
            debugControls.appendChild(addBtn);

            availableRecruitsTitle.insertAdjacentElement('afterend', debugControls);
        }
        // --- END DEBUG CONTROLS ---

        this.preMissionScreen.style.display = 'flex';
        this.setCursor('default');
    }

    // --- NEW: Create unit card with vertical layout (face, details, sprite) ---
    _createPostMissionRecruitCard(recruit, type) {
        const card = document.createElement('div');
        card.className = 'unit-card';

        // Sprite Section (top)
        const spriteSection = document.createElement('div');
        spriteSection.className = 'unit-card-sprite-section';

        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'card-sprite';

        // Build sprite URLs based on rank
        const spriteBaseName = recruit.spriteBaseName || 'raccoon';
        const spritePath = this._getSpritePathForRank(recruit.rank);
        const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        // Store sprite URLs in CSS custom properties for animation
        directions.forEach(dir => {
            const spriteKey = `${spriteBaseName}_idle_${dir}`;
            const spriteUrl = this.game?.preloadedImages?.[spriteKey] 
                ? this.game.preloadedImages[spriteKey].src 
                : `${spritePath}idle/${spriteBaseName}_idle_${dir}.png`;
            spriteDiv.style.setProperty(`--sprite-${dir}`, `url('${spriteUrl}')`);
        });

        // For fallen units, use dead sprite
        if (type === 'fallen') {
            const deadPath = CONFIG.RACCOON_DEAD_SPRITE_PATH || 'assets/images/units/raccoon/dead/';
            const deadFiles = CONFIG.RACCOON_DEAD_SPRITE_FILES || ['raccoon_dead.png'];
            const deadSpriteUrl = deadPath + deadFiles[0];
            directions.forEach(dir => {
                spriteDiv.style.setProperty(`--sprite-${dir}`, `url('${deadSpriteUrl}')`);
            });
        }

        spriteSection.appendChild(spriteDiv);
        card.appendChild(spriteSection);

        // Info Row (Face left, Details right)
        const infoRow = document.createElement('div');
        infoRow.className = 'unit-card-info-row';

        // Face Section (left)
        const faceSection = document.createElement('div');
        faceSection.className = 'unit-card-face-section';
        
        const faceDiv = document.createElement('div');
        faceDiv.className = 'card-face';
        faceDiv.style.backgroundImage = `url('${recruit.faceImageUrl}')`;
        faceSection.appendChild(faceDiv);
        infoRow.appendChild(faceSection);

        // Details Section (right)
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'unit-card-details';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = recruit.name;
        detailsDiv.appendChild(nameDiv);

        // Rank and XP
        if (type === 'fallen') {
            const rankDiv = document.createElement('div');
            rankDiv.className = 'card-rank';
            rankDiv.textContent = recruit.rank || 'Recruit';
            detailsDiv.appendChild(rankDiv);

            const xpDiv = document.createElement('div');
            xpDiv.className = 'card-status kia';
            xpDiv.textContent = 'KIA';
            detailsDiv.appendChild(xpDiv);
        } else if (type === 'survivor' && recruit.promotedThisMission) {
            card.classList.add('is-promoted');
            const rankConfig = CONFIG.RANK_THRESHOLDS;
            const currentRankIndex = rankConfig.findIndex(r => r.rankName === recruit.rank);
            const prevRank = currentRankIndex > 0 ? rankConfig[currentRankIndex - 1].rankName : "Recruit";

            const rankDiv = document.createElement('div');
            rankDiv.className = 'card-rank';
            rankDiv.innerHTML = `<span class="rank-text-old">${prevRank}</span> <span class="rank-arrow">▶</span> <span class="rank-text-new">${recruit.rank}</span>`;
            detailsDiv.appendChild(rankDiv);

            const xpDiv = document.createElement('div');
            xpDiv.className = 'card-xp';
            xpDiv.textContent = `XP: ${recruit.xp}`;
            detailsDiv.appendChild(xpDiv);

            const promoDiv = document.createElement('div');
            promoDiv.className = 'card-status promoted';
            promoDiv.textContent = 'PROMOTED!';
            detailsDiv.appendChild(promoDiv);
        } else {
            const rankDiv = document.createElement('div');
            rankDiv.className = 'card-rank';
            rankDiv.textContent = recruit.rank || 'Recruit';
            detailsDiv.appendChild(rankDiv);

            const xpDiv = document.createElement('div');
            xpDiv.className = 'card-xp';
            xpDiv.textContent = `XP: ${recruit.xp}`;
            detailsDiv.appendChild(xpDiv);
        }

        infoRow.appendChild(detailsDiv);
        card.appendChild(infoRow);

        if (type === 'fallen') {
            card.classList.add('fallen');
        }

        return card;
    }

    // Helper to get sprite path based on rank
    _getSpritePathForRank(rank) {
        const rankPaths = {
            'Private': CONFIG.RACCOON_PRIVATE_SPRITE_PATH || 'assets/images/units/raccoon/private/',
            'Corporal': CONFIG.RACCOON_CORPORAL_SPRITE_PATH || 'assets/images/units/raccoon/corporal/',
            'Sergeant': CONFIG.RACCOON_SERGEANT_SPRITE_PATH || 'assets/images/units/raccoon/sergeant/',
            'Elite': CONFIG.RACCOON_ELITE_SPRITE_PATH || 'assets/images/units/raccoon/elite/',
            'Ghost': CONFIG.RACCOON_GHOST_SPRITE_PATH || 'assets/images/units/raccoon/ghost/',
            'Maverick': CONFIG.RACCOON_MAVERICK_SPRITE_PATH || 'assets/images/units/raccoon/maverick/'
        };
        return rankPaths[rank] || CONFIG.RACCOON_SPRITE_PATH || 'assets/images/units/raccoon/recruit/';
    }

    showPostMissionScreen_Debrief(debriefData) {
        if (!this.postMissionScreen || !debriefData) return;
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';

        const { isVictory, phaseData, missionData, objectives,
            survivingRaccoons, fallenRaccoons, enemiesKilled,
            timeTaken, campaignComplete, newlyRecruitedRaccoons,
            ambushResult, ambushesSurvived } = debriefData;

        const objectiveListEl = document.getElementById('objectiveStatusList');

        if (this.missionOutcomeText) this.missionOutcomeText.textContent = isVictory ? (this.uiText.POST_MISSION_SUCCESS || "MISSION SUCCESSFUL!") : (this.uiText.POST_MISSION_FAILED || "MISSION FAILED!");

        // Add ambush result to objectives display (check ambushResult directly, not isVictory)
        if (ambushResult || (ambushesSurvived && ambushesSurvived.length > 0)) {
            const ambushXp = (CONFIG.XP_PER_AMBUSH_SURVIVED || 100) * (ambushesSurvived ? ambushesSurvived.length : 0);
            const isAmbushSuccess = ambushResult === 'VICTORY';
            const ambushObjectiveText = isAmbushSuccess 
                ? `AMBUSH SURVIVED (+${ambushXp} XP)`
                : 'AMBUSH FAILED - Mission Compromised!';
            const ambushLi = document.createElement('li');
            ambushLi.innerHTML = `<span class="obj-text">${ambushObjectiveText}</span><span class="obj-status">${isAmbushSuccess ? 'SURVIVED' : 'FAILED'}</span>`;
            ambushLi.classList.add(isAmbushSuccess ? 'completed' : 'failed');
            if (objectiveListEl) objectiveListEl.appendChild(ambushLi);
        }

        const postMissionInfoEl = document.getElementById('postMissionInfo');
        if (postMissionInfoEl && phaseData && missionData) {
            const phaseNumText = `Phase ${this.game.currentPhaseIndex + 1}`;
            const missionNumText = `Mission ${this.game.currentMissionIndex + 1} / ${phaseData.missionsInPhase}`;
            postMissionInfoEl.textContent = `${phaseData.name} | ${missionData.name} | (${phaseNumText} - ${missionNumText})`;
        }

        const statTimeTakenEl = document.getElementById('statTimeTaken');
        const statEnemiesKilledEl = document.getElementById('statEnemiesKilled');
        const statHostagesRecruitedEl = document.getElementById('statHostagesRecruited');
        const newRecruitsListEl = document.getElementById('newRecruitsList');
        const rosterStatusListEl = document.getElementById('rosterStatusList');

        if (objectiveListEl) {
            objectiveListEl.innerHTML = '';
            if (objectives && objectives.length > 0) {
                objectives.forEach(obj => {
                    const li = document.createElement('li');
                    let text = `${obj.isPrimary ? '(Primary)' : '(Secondary)'} ${obj.type.replace('_', ' ')}`;
                    // Show hostage KIA info on the post-mission screen
                    if (obj.type === 'RESCUE_HOSTAGES' && obj.hostagesKilled && obj.hostagesKilled > 0) {
                        text += ` (${obj.hostagesKilled} KIA)`;
                    }
                    li.innerHTML = `<span class="obj-text">${text}</span><span class="obj-status">${obj.isComplete ? 'COMPLETED' : 'FAILED'}</span>`;
                    li.classList.add(obj.isComplete ? 'completed' : 'failed');
                    objectiveListEl.appendChild(li);
                });
            }
        }

        if (statTimeTakenEl) statTimeTakenEl.textContent = timeTaken + "s";
        if (statEnemiesKilledEl) statEnemiesKilledEl.textContent = enemiesKilled.toString();
        if (statHostagesRecruitedEl) statHostagesRecruitedEl.textContent = (newlyRecruitedRaccoons || []).length.toString();

        if (rosterStatusListEl) {
            rosterStatusListEl.innerHTML = '';
            if (survivingRaccoons && survivingRaccoons.length > 0) {
                survivingRaccoons.forEach(r => rosterStatusListEl.appendChild(this._createPostMissionRecruitCard(r, 'survivor')));
            }
            if (fallenRaccoons && fallenRaccoons.length > 0) {
                fallenRaccoons.forEach(r => rosterStatusListEl.appendChild(this._createPostMissionRecruitCard(r, 'fallen')));
            }
            if (survivingRaccoons.length === 0 && fallenRaccoons.length === 0) {
                rosterStatusListEl.innerHTML = `<div class="no-entry">${isVictory ? (this.uiText.POST_MISSION_SURVIVORS_NONE_VICTORY || "Mission accomplished, but no Raccoons survived.") : (this.uiText.POST_MISSION_SURVIVORS_NONE_DEFEAT || "All deployed Raccoons KIA.")}</div>`;
            }
        }

        const newRecruitsContainer = document.getElementById('newRecruitsContainer');
        if (newRecruitsListEl && newRecruitsContainer) {
            newRecruitsListEl.innerHTML = '';
            if (newlyRecruitedRaccoons && newlyRecruitedRaccoons.length > 0) {
                newRecruitsContainer.style.display = 'flex';
                newlyRecruitedRaccoons.forEach(r => newRecruitsListEl.appendChild(this._createPostMissionRecruitCard(r, 'new')));
            } else {
                newRecruitsContainer.style.display = 'none';
            }
        }

        const nextMissionBtn = document.getElementById('nextMissionButton');
        const retryMissionBtn = document.getElementById('retryMissionButton');
        const viewMemorialBtn = document.getElementById('viewMemorialButton');

        if (viewMemorialBtn) { viewMemorialBtn.style.display = (this.game?.fallenRaccoonsGlobal?.length > 0) ? 'inline-block' : 'none'; }
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
                        if (this.game.campaignStructure[this.game.currentPhaseIndex + 1]?.name) {
                            nextPhaseName = this.game.campaignStructure[this.game.currentPhaseIndex + 1].name;
                        }
                        nextMissionBtn.textContent = (this.uiText.BUTTON_TEXT_START_PHASE_PREFIX || "Start ") + nextPhaseName;
                    } else {
                        nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_CAMPAIGN_COMPLETE || "View Final Stats";
                    }
                } else {
                    nextMissionBtn.textContent = this.uiText.BUTTON_TEXT_NEXT_MISSION || "Next Mission";
                }
                nextMissionBtn.style.display = 'inline-block';
                nextMissionBtn.disabled = false;
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else {
            if (nextMissionBtn) nextMissionBtn.style.display = 'none';
            if (retryMissionBtn) {
                retryMissionBtn.textContent = this.uiText.BUTTON_TEXT_RETRY_MISSION || "Retry Mission";
                retryMissionBtn.style.display = 'inline-block';
                retryMissionBtn.disabled = !(this.game?.getAvailableRecruits().length > 0);
            }
        }

        this.postMissionScreen.style.display = 'flex';
        this.setCursor('default');
    }

    showGameOverScreen(message, isCampaignVictory = false) {
        if (!this.gameOverScreen) return;
        if (this.gameOverTitle) {
            this.gameOverTitle.textContent = isCampaignVictory ? (this.uiText.GAMEOVER_VICTORY_TITLE || "CAMPAIGN COMPLETE!") : (this.uiText.GAMEOVER_DEFEAT_TITLE || "GAME OVER");
            if (isCampaignVictory) this.gameOverTitle.classList.add('victory');
            else this.gameOverTitle.classList.remove('victory');
        }
        if (this.gameOverMessage) this.gameOverMessage.textContent = message;

        // --- MODIFICATION START ---
        if (this.gameOverMemorialButton && this.game) {
            const hasFallen = this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0;
            this.gameOverMemorialButton.style.display = hasFallen ? 'inline-block' : 'none';
        }
        // --- MODIFICATION END ---

        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideRecruitMemorialScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        this.gameOverScreen.style.display = 'flex'; this.setCursor('default');
    }

    showRecruitMemorialScreen() {
        if (!this.recruitMemorialScreen || !this.game || !this.memorialEntriesList) return;
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';

        this.memorialEntriesList.innerHTML = '';
        if (this.game.fallenRaccoonsGlobal && this.game.fallenRaccoonsGlobal.length > 0) {
            this.game.fallenRaccoonsGlobal.forEach(fallen => {
                const entryLi = document.createElement('li');
                entryLi.className = 'memorial-entry';

                const faceDiv = document.createElement('div');
                faceDiv.className = 'memorial-face';
                faceDiv.style.backgroundImage = `url('${fallen.faceImageUrl}')`;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'memorial-info';
                infoDiv.innerHTML = `
                    <div class="memorial-name">${fallen.name || fallen.id}</div>
                    <div class="memorial-detail"><span>Rank Achieved:</span> ${fallen.rank || 'Recruit'}</div>
                    <div class="memorial-detail"><span>Fell In:</span> ${fallen.missionDied || 'Unknown Mission'}</div>
                    <div class="memorial-detail"><span>During:</span> ${fallen.phaseDied || 'Unknown Phase'}</div>
                `;

                const rankIconContainer = document.createElement('div');
                rankIconContainer.className = 'memorial-rank-icon';
                const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
                const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
                if (rankIconConfig && rankIconPath && rankIconConfig[fallen.rank]) {
                    rankIconContainer.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[fallen.rank]}')`;
                }

                entryLi.appendChild(faceDiv);
                entryLi.appendChild(infoDiv);
                entryLi.appendChild(rankIconContainer);
                this.memorialEntriesList.appendChild(entryLi);
            });
        } else {
            this.memorialEntriesList.innerHTML = `<li class="no-entry">${this.uiText.MEMORIAL_NO_FALLEN || "No Raccoons have fallen... yet."}</li>`;
        }

        this.recruitMemorialScreen.style.display = 'flex';
        this.setCursor('default');
    }

    showPauseMenuScreen() {
        if (!this.pauseMenuScreen) return;
        this.pauseMenuScreen.style.display = 'flex';
        this.setCursor('default');
        // --- MODIFICATION START ---
        if (this.restartMissionPauseButton && this.game) {
            const canRestart = this.game.getAvailableRecruits().length > 0 && this.game.currentMissionParams;
            this.restartMissionPauseButton.disabled = !canRestart;
        }
        // --- MODIFICATION END ---
    }

    hidePauseMenuScreen() {
        if (this.pauseMenuScreen) {
            this.pauseMenuScreen.style.display = 'none';
        }
    }

    showShootoutPauseMenuScreen() {
        if (!this.shootoutPauseMenuScreen) return;
        this.shootoutPauseMenuScreen.style.display = 'flex';
        this.setCursor('default');
    }

    hideShootoutPauseMenuScreen() {
        if (this.shootoutPauseMenuScreen) {
            this.shootoutPauseMenuScreen.style.display = 'none';
        }
    }

    // --- REUSABLE FULLSCREEN ALERT ---
    showFullscreenAlert(options, callback) {
        // options: { title, message, instruction, titleColor, borderColor, backgroundImage, autoDuration }
        // callback: function to call when alert is dismissed
        
        const alertScreen = document.getElementById('fullscreenAlertScreen');
        const alertBg = document.getElementById('fullscreenAlertBackground');
        const alertContent = document.getElementById('fullscreenAlertContent');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertInstruction = document.getElementById('alertInstruction');
        const alertTimer = document.getElementById('alertTimer');
        
        if (!alertScreen) {
            console.error('[UI] Fullscreen alert screen not found!');
            setTimeout(callback, 500);
            return;
        }
        
        // Set content
        alertTitle.textContent = options.title || 'ALERT!';
        alertMessage.textContent = options.message || '';
        alertInstruction.textContent = options.instruction || '';

        // Handle timer
        if (options.autoDuration) {
            alertTimer.style.display = 'block';
            alertTimer.style.setProperty('--timer-duration', `${options.autoDuration}ms`);
            alertTimer.classList.remove('timer-active');
        } else {
            alertTimer.style.display = 'none';
            alertTimer.classList.remove('timer-active');
        }

        // Apply styling
        if (options.titleColor) {
            alertTitle.style.color = options.titleColor;
        }
        if (options.borderColor) {
            alertContent.style.borderColor = options.borderColor;
        }
        
        // Handle background
        if (options.backgroundImage) {
            alertBg.style.backgroundImage = `url(${options.backgroundImage})`;
            alertBg.classList.remove('no-image');
        } else {
            alertBg.style.backgroundImage = 'none';
            alertBg.classList.add('no-image');
        }
        
        // Show alert
        alertScreen.style.display = 'flex';

        // Start timer animation if auto duration
        if (options.autoDuration) {
            setTimeout(() => alertTimer.classList.add('timer-active'), 10);
        }

        // Store callback and timer reference
        this._fullscreenAlertCallback = callback;
        this._fullscreenAlertTimer = null;
        
        const dismissAlert = () => {
            if (this._fullscreenAlertTimer) {
                clearTimeout(this._fullscreenAlertTimer);
                this._fullscreenAlertTimer = null;
            }
            alertScreen.style.display = 'none';
            document.removeEventListener('click', clickHandler);

            // Reset timer
            alertTimer.classList.remove('timer-active');
            alertTimer.style.display = 'none';

            if (this._fullscreenAlertCallback) {
                this._fullscreenAlertCallback();
                this._fullscreenAlertCallback = null;
            }
        };
        
        const clickHandler = () => {
            dismissAlert();
        };
        
        setTimeout(() => {
            document.addEventListener('click', clickHandler);
        }, 200);
        
        // Auto-dismiss after duration
        const autoDuration = options.autoDuration || CONFIG.SHOOTOUT_MODE.AMBUSH_ALERT_DURATION || 3000;
        this._fullscreenAlertTimer = setTimeout(() => {
            dismissAlert();
        }, autoDuration);
    }

    hideFullscreenAlert() {
        const alertScreen = document.getElementById('fullscreenAlertScreen');
        if (alertScreen) {
            alertScreen.style.display = 'none';
        }
    }

    // --- SHOOTOUT AMBUSH UI METHODS ---
    showShootoutAmbushAlert(scenarioType, callback, backgroundImage) {
        // scenarioType: 'START_AMBUSH' or 'EXTRACTION_AMBUSH'
        // callback: function to call when player clicks to start the ambush
        // backgroundImage: optional image URL for background
        
        console.log('[UI] showShootoutAmbushAlert called, scenarioType:', scenarioType, 'backgroundImage:', backgroundImage);
        
        // Get random message from config
        const messages = CONFIG.SHOOTOUT_MODE.AMBUSH_ALERT_MESSAGES[scenarioType];
        console.log('[UI] messages:', messages);
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Set title and styling based on scenario
        let title, titleColor, borderColor;
        if (scenarioType === 'START_AMBUSH') {
            title = 'AMBUSH!';
            titleColor = '#ff4444';
            borderColor = '#ff4444';
        } else {
            title = 'EXTRACTION UNDER FIRE!';
            titleColor = '#ff8844';
            borderColor = '#ff8844';
        }
        
        // Hide pre mission screen when showing ambush alert
        this.hidePreMissionScreen();
        
        // Use the reusable fullscreen alert
        this.showFullscreenAlert({
            title: title,
            message: message,
            titleColor: titleColor,
            borderColor: borderColor,
            backgroundImage: backgroundImage,
            autoDuration: CONFIG.SHOOTOUT_MODE.AMBUSH_ALERT_DURATION || 3000
        }, callback);
    }

    hideShootoutAmbushAlert() {
        this.hideFullscreenAlert();
    }

    showShootoutAmbushResult(result, callback) {
        // result: 'VICTORY', 'DEFEAT', or 'TIME_UP'
        // callback: function to call when done viewing result
        
        // Get random message from config
        const messages = CONFIG.SHOOTOUT_MODE.AMBUSH_RESULT_MESSAGES[result];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Get result screen elements
        const resultScreen = document.getElementById('shootoutAmbushResultScreen');
        const resultTitle = document.getElementById('ambushResultTitle');
        const resultMessage = document.getElementById('ambushResultMessage');
        
        if (!resultScreen) {
            console.error('[UI] Ambush result screen not found!');
            setTimeout(callback, 1500);
            return;
        }
        
        // Set title and colors based on result
        if (result === 'VICTORY' || result === 'TIME_UP') {
            resultTitle.textContent = result === 'TIME_UP' ? 'SURVIVED!' : 'AREA CLEAR!';
            resultScreen.classList.remove('defeat');
            resultScreen.classList.add('victory');
        } else {
            resultTitle.textContent = 'MISSION FAILED';
            resultScreen.classList.remove('victory');
            resultScreen.classList.add('defeat');
        }
        
        // Set message
        resultMessage.textContent = message;
        
        // Show the result screen
        resultScreen.style.display = 'flex';
        
        // Auto-hide after delay and call callback
        setTimeout(() => {
            resultScreen.style.display = 'none';
            if (callback) callback();
        }, 2000);
    }

    hideShootoutAmbushResult() {
        const resultScreen = document.getElementById('shootoutAmbushResultScreen');
        if (resultScreen) {
            resultScreen.style.display = 'none';
        }
    }

    showHUD() {
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'flex';
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
            this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
            this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
        if (this.game && this.game.ui && this.game.currentFormationType) this.updateFormationButton(this.game.currentFormationType);
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
            // Skip EXTRACTION objective if extraction zone hasn't been revealed yet
            if (obj.type === 'EXTRACTION' && !obj.extractionZoneRevealed) {
                return;
            }

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
                MIN_TO_EVAC: obj.minToAchieveForCompletion || 0,
                KIA_TEXT: (obj.hostagesKilled && obj.hostagesKilled > 0) ? ` | ${obj.hostagesKilled} KIA` : "",
                HOSTAGES_KILLED: obj.hostagesKilled || 0
            };

            objectiveStr = this.uiText[obj.descriptionTemplateKey] || `Objective: ${obj.type}`;
            objectiveStr = this.game._fillTextTemplate(objectiveStr, templateData);

            if (obj.type === "ASSASSINATION" && obj.targetDetails) {
                const targetName = obj.targetDetails.name || "VIP";
                const targetCallsign = obj.targetDetails.callsign || obj.targetDetails.name || "TARGET";

                let objectiveText = (this.uiText[obj.descriptionTemplateKey] || "Eliminate: {TARGET_CALLSIGN}")
                    .replace("{TARGET_CALLSIGN}", targetCallsign)
                    .replace("{TARGET_NAME}", targetName);

                if (obj.isComplete) {
                    objectiveText += " - ELIMINATED";
                } else {
                    const targetUnit = this.game.enemyUnits.find(e => e.id === obj.targetUnitId);
                    if (targetUnit && targetUnit.isAlive()) {
                        objectiveText += ` (HP: ${Math.round(targetUnit.hp)}/${targetUnit.maxHp})`;
                    } else if (obj.targetUnitId && (!targetUnit || !targetUnit.isAlive())) {
                    } else if (!obj.targetUnitId) {
                        objectiveText += " - (AWAITING TARGET)";
                    }
                }
                objectiveStr = objectiveText;
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
        if (this.game.currentMissionParams && this.game.currentMissionParams.objectives) {
            const rescueObjective = this.game.currentMissionParams.objectives.find(obj => obj.type === 'RESCUE_HOSTAGES');
            if (rescueObjective) {
                this.updateObjective();
            }
        }
    }

    updateNightMissionBadge() {
        const badge = document.getElementById('night-mission-badge');
        if (!badge) return;
        if (this.game && this.game.isNightMission) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
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
            } else if (!selectedUnits.includes(raccoon)) {
                memberDiv.style.borderColor = ''; memberDiv.style.borderWidth = ''; memberDiv.style.borderStyle = '';
            }

            const isKIA = !raccoon.isAlive();
            let statusText = 'Active';
            if (isKIA) {
                statusText = 'KIA';
            } else if (raccoon.isReloading) {
                statusText = 'Reloading';
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
                <div><span class="label">Ammo:</span> <span class="value">${raccoon.currentMagazine !== undefined ? raccoon.currentMagazine : '-'} / ${raccoon.ammo !== undefined ? raccoon.ammo : '-'}</span></div>
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

    // ==================== SAVE/LOAD MODAL METHODS ====================

    showSaveLoadModal(mode) {
        this.currentSaveLoadMode = mode; // 'save' or 'load'
        this.selectedSlotIndex = null;

        if (this.saveLoadModalTitle) {
            this.saveLoadModalTitle.textContent = mode === 'save' ? 'Save Game' : 'Load Game';
        }

        // Show export button only in save mode
        if (this.exportSaveButton) {
            this.exportSaveButton.style.display = mode === 'save' ? 'inline-block' : 'none';
        }

        this.populateSaveSlots();

        if (this.saveLoadModal) {
            this.saveLoadModal.style.display = 'flex';
        }
    }

    hideSaveLoadModal() {
        if (this.saveLoadModal) {
            this.saveLoadModal.style.display = 'none';
        }
        this.selectedSlotIndex = null;

        // If we came from pause menu and are in save mode, show pause menu again
        if (this.currentSaveLoadMode === 'save' && this.game && this.game.gameState === 'PAUSED') {
            this.showPauseMenuScreen();
        }
        this.currentSaveLoadMode = null;
    }

    populateSaveSlots() {
        if (!this.saveSlotsList) return;

        this.saveSlotsList.innerHTML = '';
        const slots = SaveManager.getSaveSlots();

        slots.forEach((slot, index) => {
            const card = document.createElement('div');
            card.className = 'save-slot-card' + (slot.isEmpty ? ' empty' : '');
            card.dataset.slotIndex = index;

            const slotNumber = document.createElement('div');
            slotNumber.className = 'save-slot-number';
            slotNumber.textContent = `${index + 1}`;
            card.appendChild(slotNumber);

            const slotInfo = document.createElement('div');
            slotInfo.className = 'save-slot-info';

            if (slot.isEmpty) {
                slotInfo.innerHTML = `<div class="save-slot-empty-text">Empty Slot</div>`;
            } else {
                slotInfo.innerHTML = `
                    <div class="save-slot-name">${slot.slotName}</div>
                    <div class="save-slot-timestamp">${slot.timestampDisplay}</div>
                `;
            }
            card.appendChild(slotInfo);

            // Delete button for non-empty slots
            if (!slot.isEmpty) {
                const actions = document.createElement('div');
                actions.className = 'save-slot-actions';
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'save-slot-delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.game && this.game.audioManager) {
                        this.game.audioManager.play('UI_BUTTON_CLICK');
                    }
                    // Simple deletion without blocking confirm
                    SaveManager.deleteSlot(index);
                    this.showToast(`Deleted save slot ${index + 1}`, 'success');
                    this.populateSaveSlots();
                });
                actions.appendChild(deleteBtn);
                card.appendChild(actions);
            }

            // Click handler for slot selection
            card.addEventListener('click', () => {
                if (this.game && this.game.audioManager) {
                    this.game.audioManager.play('UI_BUTTON_CLICK');
                }
                this.handleSlotClick(index, slot.isEmpty);
            });

            this.saveSlotsList.appendChild(card);
        });
    }

    handleSlotClick(slotIndex, isEmpty) {
        if (this.currentSaveLoadMode === 'save') {
            // Saving to slot
            if (!isEmpty) {
                const slots = SaveManager.getSaveSlots();
                if (!confirm(`Overwrite save "${slots[slotIndex].slotName}"?`)) {
                    return;
                }
            }

            if (SaveManager.saveToSlot(this.game, slotIndex)) {
                this.showToast('Game saved!', 'success');
                this.hideSaveLoadModal();
            } else {
                this.showToast('Failed to save game', 'error');
            }

        } else if (this.currentSaveLoadMode === 'load') {
            // Loading from slot
            if (isEmpty) {
                return; // Can't load from empty slot
            }

            if (SaveManager.loadFromSlot(this.game, slotIndex)) {
                this.hideSaveLoadModal();
                this.hideMainMenuScreen();
                this.game.start();
            } else {
                this.showToast('Failed to load save', 'error');
            }
        }
    }

    handleExportSave() {
        // Find first non-empty slot to export, or prompt user
        const slots = SaveManager.getSaveSlots();
        const nonEmpty = slots.filter(s => !s.isEmpty);

        if (nonEmpty.length === 0) {
            this.showToast('No saves to export', 'warning');
            return;
        }

        // If only one save, export it directly
        // Otherwise, export the most recent
        let slotToExport = 0;
        let mostRecentTime = 0;
        slots.forEach((slot, idx) => {
            if (!slot.isEmpty && slot.timestamp > mostRecentTime) {
                mostRecentTime = slot.timestamp;
                slotToExport = idx;
            }
        });

        const jsonData = SaveManager.exportSave(slotToExport);
        if (jsonData) {
            const filename = `raccoon_platoon_save_slot${slotToExport + 1}.json`;
            this._downloadFile(filename, jsonData);
            this.showToast(`Exported as ${filename}`, 'success');
        } else {
            this.showToast('Failed to export save', 'error');
        }
    }

    handleImportSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;

                // Find first empty slot, or slot 0
                const slots = SaveManager.getSaveSlots();
                let targetSlot = slots.findIndex(s => s.isEmpty);
                if (targetSlot === -1) {
                    targetSlot = 0; // Overwrite slot 0 if all full
                }

                if (SaveManager.importSave(jsonString, targetSlot)) {
                    this.showToast(`Imported to slot ${targetSlot + 1}`, 'success');
                    this.populateSaveSlots();
                } else {
                    this.showToast('Invalid save file format', 'error');
                }
            } catch (error) {
                console.error('[UI] Import error:', error);
                this.showToast('Failed to read save file', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input so same file can be selected again
        event.target.value = '';
    }

    _downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', or 'warning'
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                if (toast.parentElement) {
                    container.removeChild(toast);
                }
            });
        }, 3000);
    }

    /**
     * Attempts to auto-save game before mission start.
     * Returns true if saved successfully, false if user action required (e.g. all slots full)
     */
    _autoSaveBeforeMission() {
        if (!this.game) return false;

        try {
            // Case 1: Already playing on a specific slot? Continue using it.
            if (this.game.currentSaveSlot !== -1) {
                if (SaveManager.saveToSlot(this.game, this.game.currentSaveSlot)) {
                    this.showToast(`Auto-saved to Slot ${this.game.currentSaveSlot + 1}`, 'success');
                    return true;
                }
                this.showToast('Auto-save failed', 'error');
                return true; // Still let them play, just failed to write
            }

            // Case 2: New campaign (unsaved). specific slot? Find first empty.
            const slots = SaveManager.getSaveSlots();
            const emptySlotIndex = slots.findIndex(s => s.isEmpty);

            if (emptySlotIndex !== -1) {
                // Found an empty slot, claim it!
                if (SaveManager.saveToSlot(this.game, emptySlotIndex)) {
                    this.showToast(`Auto-saved to Slot ${emptySlotIndex + 1}`, 'success');
                    return true;
                }
            }

            // Case 3: New campaign, but ALL slots full. Ask user.
            this.showToast('Slots full! Please select a save slot.', 'warning');
            this.showSaveLoadModal('save');
            return false; // Abort mission start so they can save

        } catch (error) {
            console.error('[Auto-Save] Error:', error);
            return true; // Don't block gameplay on error
        }
    }
}