// js/ui.js

class UI {
    constructor(game) {
        this.game = game;
        this.uiText = CONFIG.UI_TEXT_STRINGS || {};
        this.uiSettings = CONFIG.UI_SETTINGS || {};

        this.mainMenuScreen = document.getElementById('mainMenuScreen');
        this.mainMenuWallpaper = document.getElementById('mainMenuWallpaper');
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
        this.pauseOptionsButton = document.getElementById('pauseOptionsButton');
        this.resumeGameButton = document.getElementById('resumeGameButton');
        this.restartMissionPauseButton = document.getElementById('restartMissionPauseButton');
        this.mainMenuPauseButton = document.getElementById('mainMenuPauseButton');
        this.startMissionButton = document.getElementById('startMissionButton');
        this.retryMissionButton = document.getElementById('retryMissionButton');
        this.nextMissionButton = document.getElementById('nextMissionButton');
        this.videoLoadingScreen = document.getElementById('videoLoadingScreen');
        this.loadingVideoPlayer = document.getElementById('loadingVideoPlayer');
        this.extractionVideoScreen = document.getElementById('extractionVideoScreen');
        this.extractionVideoPlayer = document.getElementById('extractionVideoPlayer');

        this.gameOverMemorialButton = document.getElementById('gameOverMemorialButton'); // New button
        this.gameOverNewCampaignButton = document.getElementById('gameOverNewCampaignButton');

        this.endOfPhaseScreen = document.getElementById('endOfPhaseScreen');
        this.phaseDebriefTitle = document.getElementById('phaseDebriefTitle');
        this.phaseDebriefSubtitle = document.getElementById('phaseDebriefSubtitle');
        this.phaseDebriefTabs = document.querySelectorAll('.phase-debrief-tab');
        this.phaseDebriefTabContents = document.querySelectorAll('.phase-debrief-tab-content');
        this.viewMemorialFromPhaseBtn = document.getElementById('viewMemorialFromPhaseBtn');
        this.continueFromPhaseDebriefBtn = document.getElementById('continueFromPhaseDebriefBtn');

        // Options window (shared by the main menu, mission pause and shootout pause)
        this.optionsMenuScreen = document.getElementById('optionsMenuScreen');
        this.backFromOptionsButton = document.getElementById('backFromOptionsButton');
        this.wallpaperSelectionGrid = document.getElementById('wallpaperSelectionGrid');
        this.currentWallpaperKey = SaveManager.getPreference('menuWallpaper', CONFIG.DEFAULT_MENU_WALLPAPER) || 'raccoon_marine_3';
        this.menuWallpaperShuffleEnabled = SaveManager.getPreference('menuWallpaperShuffle', CONFIG.OPTIONS.DEFAULTS.menuWallpaperShuffle);
        this.lastObjectiveMode = SaveManager.getPreference('lastObjectiveMode', CONFIG.OPTIONS.DEFAULTS.lastObjectiveMode);

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
        this.pendingNewCampaignSave = false; // Tracks if we're saving as part of "New Campaign" flow

        this._addSoundToButton(this.newCampaignButton, () => {
            if (this.game) {
                this.hideMainMenuScreen();
                this.game.initializeNewCampaign(true);
                this.pendingNewCampaignSave = true;
                this.showSaveLoadModal('save');
            }
        });

        // Continue button - loads most recent save (auto-save first, then manual saves)
        this._addSoundToButton(this.continueGameButton, () => {
            if (this.game) {
                // Try auto-save first
                if (SaveManager.autoLoad(this.game)) {
//                    console.log('[UI] Continue: Loaded from auto-save');
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
                
//                console.log('[UI] Continue: No save found');
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
        this._initOptionsMenu();
        this._initCursorOptions();

        this._addSoundToButton(this.mainMenuMemorialButton, () => this.showRecruitMemorialScreen());
        this._addSoundToButton(this.startMissionButton, () => {
            if (this.game) {
                const maxSquadSize = CONFIG.MAX_SQUAD_SIZE_MVP || 4;
                const currentCount = this.game.tempSelectedForDeployment ? this.game.tempSelectedForDeployment.length : 0;
                const minSize = 1;
                if (currentCount >= minSize && currentCount <= maxSquadSize) {
                    this.game.confirmSquadAndStartMission(this.game.tempSelectedForDeployment);
                } else if (currentCount > maxSquadSize) {
                    this.showToast((this.uiText.START_MISSION_BUTTON_ALERT_MAX_SIZE || "Max squad size is {MAX_SQUAD_SIZE}. Please deselect some recruits.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()), 'warning');
                } else if (currentCount < minSize) {
                    this.showToast(this.uiText.START_MISSION_BUTTON_ALERT_MIN_SIZE || "Select at least one Raccoon for the mission!", 'warning');
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
                        // Autosave after retry so player can leave and resume
                        if (this.game.currentSaveSlot !== -1) {
                            if (SaveManager.autoSave(this.game)) {
                                this.showToast(`Auto-saved to Slot ${this.game.currentSaveSlot + 1}`, 'success');
                            }
                        }
                    } else {
//                        console.error("UI: Failed to get phase data or mission params for retry pre-mission screen.");
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
                    // Autosave AFTER mission index advances so reload picks up the new mission
                    if (this.game && this.game.currentSaveSlot !== -1) {
                        if (SaveManager.autoSave(this.game)) {
                            this.showToast(`Auto-saved to Slot ${this.game.currentSaveSlot + 1}`, 'success');
                        }
                    }
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
        this._addSoundToButton(this.pauseOptionsButton, () => this.showOptionsMenu('pause'));
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
            } else if (this.game && this.game.gameState === 'END_OF_PHASE_DEBRIEF' && this.endOfPhaseScreen) {
                this.endOfPhaseScreen.style.display = 'flex';
            } else if (this.game && this.game.gameState === 'MAIN_MENU' && this.mainMenuScreen) {
                this.mainMenuScreen.style.display = 'flex';
            }
        });
        this._addSoundToButton(this.gameOverMemorialButton, () => this.showRecruitMemorialScreen());
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game) {
            const initialSpacing = (this.game && this.game.formationSpacingMultiplier !== undefined) ? this.game.formationSpacingMultiplier : (CONFIG.INITIAL_FORMATION_SPACING || 1.5);
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
        this.shootoutOptionsButton = document.getElementById('shootoutOptionsButton');
        this.shootoutRestartButton = document.getElementById('shootoutRestartButton');
        this.shootoutMenuPauseButton = document.getElementById('shootoutMenuPauseButton');

        // Shootout pause menu button listeners
        if (this.shootoutResumeGameButton) {
            this._addSoundToButton(this.shootoutResumeGameButton, () => {
                if (this.game) this.game.toggleShootoutPause();
            });
        }

        this._addSoundToButton(this.shootoutOptionsButton, () => this.showOptionsMenu('shootout'));

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

        // --- DEBUG PANEL ELEMENTS ---
        this.debugPanel = document.getElementById('debugPanel');
        this.debugPanelClose = document.getElementById('debugPanelClose');
        if (this.debugPanelClose) {
            this.debugPanelClose.addEventListener('click', () => {
                if (this.game) {
                    this.game.isDebugVisualsActive = false;
                    this.updateDebugPanelVisibility();
                }
            });
        }

        // Checkbox event listeners
        const dbgToggles = [
            ['dbgNavGridBlocked', () => this.game && this.game.toggleDebugNavGridBlocked()],
            ['dbgNavGridTiles', () => this.game && this.game.toggleDebugNavGridTiles()],
            ['dbgSpatialGrid', () => this.game && this.game.toggleDebugSpatialGrid()],
            ['dbgObstacleShapes', () => this.game && this.game.toggleDebugObstacleShapes()],
            ['dbgObstacleNames', () => this.game && this.game.toggleDebugObstacleNames()],
            ['dbgPathingBounds', () => this.game && this.game.toggleDebugPathingBounds()],
            ['dbgBulletSizes', () => this.game && this.game.toggleDebugBulletSizes()],
            ['dbgHutSpawnAreas', () => this.game && this.game.toggleDebugHutSpawnAreas()],
            ['dbgHutStatus', () => this.game && this.game.toggleDebugHutStatus()],
        ];
        dbgToggles.forEach(([id, handler]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => handler());
            }
        });

        // Prevent debug panel clicks from propagating to the game canvas
        if (this.debugPanel) {
            this.debugPanel.addEventListener('mousedown', (e) => e.stopPropagation());
            this.debugPanel.addEventListener('click', (e) => e.stopPropagation());
        }

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

        // Drop focus from the button that started the mission, so Space/Enter during the
        // video can't "click" it again behind the overlay.
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }

        const game = this.game;
        if (game && game.audioManager) {
            this.loadingVideoPlayer.volume = game.audioManager.globalVolume * game.audioManager.sfxVolume;
        }

        this.loadingVideoPlayer.src = videoPath;
        this.loadingVideoPlayer.load();
        
        // Return a promise that resolves when video starts playing
        // This ensures the 6-second timer doesn't start until video is actually playing
        const videoPlayPromise = this.loadingVideoPlayer.play().then(() => {
//            console.log("Video started playing successfully");
            return true;
        }).catch(error => {
//            console.warn("Video autoplay was prevented. User interaction might be required.", error);
            // Fallback to a static loading screen if video fails - still resolve after a delay
            return new Promise(resolve => setTimeout(resolve, 2000));
        });

        this.videoLoadingScreen.style.display = 'flex';
        setTimeout(() => {
            this.videoLoadingScreen.classList.add('visible');
        }, 10);

        return videoPlayPromise;
    }

    /**
     * Ms until the fade-out must start for it to end on the loading clip's last frame
     * (clip time left minus the overlay's 0.5s fade). Infinity if the length is unknown.
     */
    getLoadingVideoFadeLeadMs() {
        const video = this.loadingVideoPlayer;
        if (!video || !isFinite(video.duration) || video.duration <= 0) return Infinity;
        return Math.max(0, (video.duration - video.currentTime) * 1000 - 500);
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

    playExtractionVideo(videoPath) {
        if (!this.extractionVideoScreen || !this.extractionVideoPlayer) {
            console.warn('[ExtractionVideo] Missing extraction video elements');
            return Promise.resolve();
        }

        // Clean up any previous listeners and state
        this.extractionVideoPlayer.pause();
        this.extractionVideoPlayer.removeAttribute('src');
        this.extractionVideoPlayer.load();

        console.log('[ExtractionVideo] Loading video:', videoPath);
        this.extractionVideoPlayer.src = videoPath;
        this.extractionVideoPlayer.load();

        const game = this.game;
        if (game && game.audioManager) {
            this.extractionVideoPlayer.volume = game.audioManager.globalVolume * game.audioManager.sfxVolume;
        }

        this.extractionVideoScreen.style.display = 'flex';
        setTimeout(() => {
            this.extractionVideoScreen.classList.add('visible');
        }, 10);

        return new Promise((resolve) => {
            const handleEnded = () => {
                this.extractionVideoPlayer.removeEventListener('ended', handleEnded);
                this.extractionVideoPlayer.removeEventListener('error', handleError);
                this.hideExtractionVideoScreen();
                resolve();
            };
            const handleError = (e) => {
                const videoError = e.target.error;
                let errorMsg = 'Unknown error';
                if (videoError) {
                    switch (videoError.code) {
                        case MediaError.MEDIA_ERR_ABORTED:
                            errorMsg = 'Aborted';
                            break;
                        case MediaError.MEDIA_ERR_NETWORK:
                            errorMsg = 'Network error';
                            break;
                        case MediaError.MEDIA_ERR_DECODE:
                            errorMsg = 'Decode error (corrupt or unsupported format)';
                            break;
                        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMsg = 'Format not supported';
                            break;
                    }
                }
                console.error('[ExtractionVideo] Video error:', errorMsg, 'path:', videoPath, 'error:', videoError);
                this.extractionVideoPlayer.removeEventListener('ended', handleEnded);
                this.extractionVideoPlayer.removeEventListener('error', handleError);
                this.hideExtractionVideoScreen();
                resolve();
            };
            this.extractionVideoPlayer.addEventListener('ended', handleEnded);
            this.extractionVideoPlayer.addEventListener('error', handleError);
            this.extractionVideoPlayer.play().catch((err) => {
                console.warn('[ExtractionVideo] Play failed:', err);
                resolve();
            });
        });
    }

    hideExtractionVideoScreen() {
        if (!this.extractionVideoScreen || !this.extractionVideoPlayer) return;

        this.extractionVideoScreen.classList.remove('visible');

        setTimeout(() => {
            this.extractionVideoScreen.style.display = 'none';
            this.extractionVideoPlayer.pause();
            this.extractionVideoPlayer.src = '';
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
            this.backFromMemorialButton, this.backFromOptionsButton,
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
        this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen(); this.hideEndOfPhaseScreen();
        this.hideSaveLoadModal();
        this.hideHowToPlayScreen();
        this.hideOptionsMenu(false);
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
        this.mainMenuScreen.style.display = 'flex';
        if (this.mainMenuWallpaper) {
            this.mainMenuWallpaper.style.display = 'block';
            if (this.menuWallpaperShuffleEnabled) {
                const randomWallpaper = CONFIG.MENU_WALLPAPERS[Math.floor(Math.random() * CONFIG.MENU_WALLPAPERS.length)];
                this.applyWallpaper(randomWallpaper.key, false);
            } else {
                this.applyWallpaper(this.currentWallpaperKey, false);
            }
        }
        this.setCursor('default');
    }
    hideMainMenuScreen() {
        if (this.mainMenuScreen) this.mainMenuScreen.style.display = 'none';
        if (this.mainMenuWallpaper) this.mainMenuWallpaper.style.display = 'none';
    }
    hidePreMissionScreen() { if (this.preMissionScreen) this.preMissionScreen.style.display = 'none'; }
    hidePostMissionScreen() { if (this.postMissionScreen) this.postMissionScreen.style.display = 'none'; }
    hideGameOverScreen() { if (this.gameOverScreen) this.gameOverScreen.style.display = 'none'; }
    hideRecruitMemorialScreen() {
        if (this.recruitMemorialScreen) this.recruitMemorialScreen.style.display = 'none';
    }
    hideEndOfPhaseScreen() { if (this.endOfPhaseScreen) this.endOfPhaseScreen.style.display = 'none'; }

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

            this.shootoutPreGameScreen.style.display = '';
            this.shootoutPreGameScreen.classList.add('visible');
        }
        // Ensure dev overlay is hidden when showing pre-game screen
        if (this.shootoutDevOverlay) {
            this.shootoutDevOverlay.style.display = 'none';
        }
    }

    populateShootoutMapList() {
        if (!this.shootoutMapList || !this.game || !this.game.shootoutController) return;

        this.shootoutMapList.innerHTML = '';

        // Aggregate all biome-specific backgrounds into a single map
        const allBackgrounds = {};
        if (typeof CONFIG !== 'undefined' && CONFIG.BIOMES) {
            for (const biomeName of Object.keys(CONFIG.BIOMES)) {
                const biome = CONFIG.BIOMES[biomeName];
                if (biome.shootoutBackgrounds) {
                    for (const [key, bg] of Object.entries(biome.shootoutBackgrounds)) {
                        if (!allBackgrounds[key]) {
                            allBackgrounds[key] = bg;
                        }
                    }
                }
            }
        }

        const currentBg = this.game.shootoutController.currentBackgroundKey;
        const isNight = this.game.shootoutController.isNightMode;

        const bgKeys = Object.keys(allBackgrounds);
        if (bgKeys.length === 0) return;

        bgKeys.forEach(key => {
            const bg = allBackgrounds[key];
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
                e.stopPropagation();
                if (this.game.audioManager) {
                    this.game.audioManager.play('UI_BUTTON_CLICK');
                }
                const newNightState = !this.game.shootoutController.isNightMode;
                this.game.shootoutController.setNightMode(newNightState);
                this.populateShootoutMapList();
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
                this.populateShootoutMapList();
            });

            this.shootoutMapList.appendChild(card);
        });
    }

    hideShootoutPreGameScreen() {
        if (this.shootoutPreGameScreen) {
            this.shootoutPreGameScreen.style.display = 'none';
            this.shootoutPreGameScreen.classList.remove('visible');
        }
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
        if (this.objectivesPanel) this.objectivesPanel.style.display = 'none';
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
            this.shootoutPreGameScreen.style.display = isDevMode ? 'none' : '';
            if (isDevMode) {
                this.shootoutPreGameScreen.classList.remove('visible');
            } else {
                this.shootoutPreGameScreen.classList.add('visible');
            }
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
//            console.log('Spawn Config:\n', jsonConfig);
        } catch (err) {
            // Fallback: show in console and display error
//            console.log('Spawn Config (copy manually):\n', jsonConfig);
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

    async deleteSelectedSpawn() {
        if (!this.game || !this.game.shootoutController) return;

        const selectedIndex = this.game.shootoutController.selectedSpawnIndex;
        if (selectedIndex === -1) {
            this.showDevStatus('No spawn point selected', 'error');
            return;
        }

        const confirmed = await this.showConfirmDialog(
            `Are you sure you want to delete spawn point #${selectedIndex}?`
        );
        if (!confirmed) {
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
        scaleSlider.min = '0.1';
        scaleSlider.max = '1.0';
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
        this._manualKeySpans = []; // { span, item } for control rows that follow key bindings

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
                        if (item.actions) this._manualKeySpans.push({ span: row.firstElementChild, item });
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
        this._refreshManualKeyLabels();
        // Reset to overview
        this.switchManualPage('manual-overview');
    }

    // Control rows show the player's current keys; untouched bindings keep the manual's own text ("1 - 4").
    _refreshManualKeyLabels() {
        const kb = this.game && this.game.keyBindings;
        if (!kb || !this._manualKeySpans) return;
        for (const { span, item } of this._manualKeySpans) {
            span.textContent = item.actions.every(a => kb.isDefault(a))
                ? item.key
                : (item.prefix || '') + item.actions.map(a => kb.label(a)).join(' ');
        }
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

    // ==================== OPTIONS WINDOW ====================
    // One window, opened from the main menu, the mission pause menu and the shootout pause
    // menu; Back (or Esc) returns to whichever opened it. Every [data-option] control in it
    // is bound to an entry of _buildOptionDefs(), so a new setting is one def here plus one
    // row of markup in index.html (and its default in CONFIG.OPTIONS.DEFAULTS).

    _initOptionsMenu() {
        const screen = this.optionsMenuScreen;
        if (!screen || !this.game) return;

        this._optionDefs = this._buildOptionDefs();
        this._optionControls = {};          // option key -> its control elements
        this._optionsTab = 'graphics';      // remembered between visits
        this._optionsReturnTo = null;       // menu panel to show again on Back
        this._optionsInfoRow = null;        // row the info strip currently describes
        this._rebindAction = null;          // key binding waiting for a key press
        this._masterVolume = 1;
        this._muteInBackground = false;
        this._pauseOnFocusLoss = false;
        this._inBackground = document.hidden || !document.hasFocus();
        this._speechAllowedByConfig = SPEECH_CONFIG.GLOBAL.SPEECH_ENABLED;

        this._optionsTabs = [...screen.querySelectorAll('.opt-tab')];
        this._optionsPages = [...screen.querySelectorAll('.opt-page')];
        this._optionsInfo = screen.querySelector('.opt-info');
        this._optionsInfoTitle = document.getElementById('optionsInfoTitle');
        this._optionsInfoText = document.getElementById('optionsInfoText');
        this._optionsContextBadge = document.getElementById('optionsContextBadge');
        this._optionsResetButton = document.getElementById('optionsResetTabButton');

        this._buildOptionControls();
        this._initKeyBindingOptions();

        // Push every saved setting into the game; atBoot: false ones the Game reads itself.
        for (const key of Object.keys(this._optionDefs)) {
            const def = this._optionDefs[key];
            if (def.atBoot !== false) def.apply(this._getOption(key));
        }

        for (const tab of this._optionsTabs) {
            tab.addEventListener('click', () => this._switchOptionsTab(tab.dataset.tab));
        }
        screen.querySelector('.opt-tabs').addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const tabs = this._optionsTabs;
            const i = tabs.findIndex(t => t.dataset.tab === this._optionsTab);
            const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
            this._switchOptionsTab(next.dataset.tab);
            next.focus();
        });

        // Menu sounds for everything in the window (its buttons don't use _addSoundToButton).
        screen.addEventListener('click', (e) => {
            if (e.target.closest('button, .wallpaper-option') && this.game.audioManager) {
                this.game.audioManager.play('UI_BUTTON_CLICK');
            }
        });
        screen.addEventListener('mouseover', (e) => {
            const btn = e.target.closest('.opt-tab, .opt-footer button');
            if (btn && !btn.contains(e.relatedTarget) && this.game.audioManager) {
                this.game.audioManager.play('UI_BUTTON_HOVER');
            }
        });

        // The info strip describes the row under the pointer or holding keyboard focus.
        const describeRow = (e) => {
            const row = e.target.closest('.opt-row[data-desc]');
            if (row && row !== this._optionsInfoRow) this._setOptionsInfo(row);
        };
        screen.addEventListener('mouseover', describeRow);
        screen.addEventListener('focusin', describeRow);

        this._addSoundToButton(this.optionsButton, () => this.showOptionsMenu('menu'));
        this.backFromOptionsButton.addEventListener('click', () => this.hideOptionsMenu());
        this._optionsResetButton.addEventListener('click', () => this._onResetOptionsTab());
        document.getElementById('optionsRestorePromptsButton').addEventListener('click', () => {
            SaveManager.resetAllDismissalPreferences();
            this._setOptionsInfo(null, 'Prompts restored', 'Every confirmation you hid with "Don\'t show this again" will appear again.', true);
        });

        // Esc backs out of the window (or cancels a rebind) instead of reaching the game's
        // key handling, which would unpause underneath it.
        window.addEventListener('keydown', (e) => {
            if (screen.style.display === 'none') return;
            if (this._rebindAction) {
                this._onRebindKey(e);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.hideOptionsMenu();
            }
        }, true);
        // Clicking anywhere but the listening key cancels a rebind.
        screen.addEventListener('pointerdown', (e) => {
            if (this._rebindAction && !e.target.closest('.opt-keycap.is-listening')) this._cancelRebind();
        }, true);

        const onFocusChange = () => this._onWindowFocusChange();
        window.addEventListener('blur', onFocusChange);
        window.addEventListener('focus', onFocusChange);
        document.addEventListener('visibilitychange', onFocusChange);
        document.addEventListener('fullscreenchange', () => this._syncOptionControl('fullscreen'));
    }

    // pref: preference key (none = not saved); def: default; apply(value) pushes a value into
    // the game; read() replaces "the saved preference" as the current value; store(value) is
    // what gets saved; atBoot: false = the Game reads that preference itself while booting.
    _buildOptionDefs() {
        const game = this.game;
        const D = CONFIG.OPTIONS.DEFAULTS;
        const pref = (key, apply) => ({ pref: key, def: D[key], apply });
        return {
            // Graphics
            fullscreen: {
                def: false, atBoot: false,
                read: () => !!document.fullscreenElement,
                apply: (on) => this._setFullscreen(on),
            },
            displaySize: {
                pref: 'displaySize', def: CONFIG.DISPLAY_SIZE || 'stretched', atBoot: false,
                apply: (v) => { game.displaySize = v; game.resizeCanvas(); },
            },
            renderScale: {
                pref: 'renderScale', def: String(game.sanitizeRenderScale(CONFIG.RENDER_SCALE)), atBoot: false,
                read: () => String(game.renderScale),
                apply: (v) => game.setRenderScale(v),
                store: () => game.renderScale,
            },
            screenShake: pref('screenShake', (v) => { game.screenShakeScale = v / 100; }),
            crtScanlines: pref('crtScanlines', (on) => {
                const crt = document.getElementById('crt-overlay');
                if (crt) crt.style.display = on ? '' : 'none';
            }),
            showFps: pref('showFps', (on) => document.body.classList.toggle('rp-hide-fps', !on)),
            menuWallpaperShuffle: pref('menuWallpaperShuffle', (on) => { this.menuWallpaperShuffleEnabled = on; }),
            // Audio
            masterVolume: pref('masterVolume', (v) => { this._masterVolume = v / 100; this._applyMasterVolume(); }),
            musicVolume: pref('musicVolume', (v) => { if (game.musicManager) game.musicManager.setMusicVolume(v / 100); }),
            sfxVolume: pref('sfxVolume', (v) => { if (game.audioManager) game.audioManager.setSfxVolume(v / 100); }),
            ambienceVolume: pref('ambienceVolume', (v) => { if (game.musicManager) game.musicManager.setAmbientVolume(v / 100); }),
            muteInBackground: pref('muteInBackground', (on) => { this._muteInBackground = on; this._applyMasterVolume(); }),
            // Controls
            invertWheel: pref('invertWheel', (on) => { if (game.inputHandler) game.inputHandler.invertWheel = on; }),
            // Gameplay
            lastObjectiveMode: pref('lastObjectiveMode', (v) => { this.lastObjectiveMode = v; }),
            unitChatter: pref('unitChatter', (on) => { SPEECH_CONFIG.GLOBAL.SPEECH_ENABLED = on && this._speechAllowedByConfig; }),
            pauseOnFocusLoss: pref('pauseOnFocusLoss', (on) => { this._pauseOnFocusLoss = on; }),
        };
    }

    // Fill in and wire the generic controls: .opt-seg (choice buttons), .opt-switch, .opt-slider.
    _buildOptionControls() {
        for (const el of this.optionsMenuScreen.querySelectorAll('[data-option]')) {
            const key = el.dataset.option;
            if (!this._optionDefs[key]) continue;
            (this._optionControls[key] = this._optionControls[key] || []).push(el);
            const labelEl = el.closest('.opt-row') && el.closest('.opt-row').querySelector('.opt-label');
            const label = labelEl ? labelEl.textContent : key;
            if (el.classList.contains('opt-seg')) {
                el.setAttribute('role', 'group');
                el.setAttribute('aria-label', label);
                el.addEventListener('click', (e) => {
                    const btn = e.target.closest('button[data-value]');
                    if (btn) this._setOption(key, btn.dataset.value);
                });
            } else if (el.classList.contains('opt-switch')) {
                el.innerHTML = '<span class="opt-switch-text"></span><span class="opt-switch-track"><span class="opt-switch-thumb"></span></span>';
                el.setAttribute('role', 'switch');
                el.setAttribute('aria-label', label);
                el.addEventListener('click', () => this._setOption(key, !this._getOption(key)));
            } else if (el.classList.contains('opt-slider')) {
                const input = document.createElement('input');
                input.type = 'range';
                input.min = el.dataset.min || '0';
                input.max = el.dataset.max || '100';
                input.step = el.dataset.step || '1';
                input.setAttribute('aria-label', label);
                el.append(input, document.createElement('output'));
                input.addEventListener('input', () => this._setOption(key, Number(input.value)));
                // Let the player hear the new effects level once they let go.
                if (key === 'sfxVolume') {
                    input.addEventListener('change', () => {
                        if (this.game.audioManager) this.game.audioManager.play(CONFIG.OPTIONS.SFX_PREVIEW_SOUND);
                    });
                }
            }
        }
    }

    _getOption(key) {
        const def = this._optionDefs[key];
        return def.read ? def.read() : SaveManager.getPreference(def.pref, def.def);
    }

    _setOption(key, value) {
        const def = this._optionDefs[key];
        if (!def) return;
        def.apply(value);
        if (def.pref) SaveManager.savePreference(def.pref, def.store ? def.store(value) : value);
        this._syncOptionControl(key);
    }

    _syncOptionControl(key) {
        const controls = this._optionControls && this._optionControls[key];
        if (!controls) return;
        const value = this._getOption(key);
        for (const el of controls) {
            if (el.classList.contains('opt-seg')) {
                for (const btn of el.querySelectorAll('button[data-value]')) {
                    const on = btn.dataset.value === String(value);
                    btn.classList.toggle('selected', on);
                    btn.setAttribute('aria-pressed', on);
                }
            } else if (el.classList.contains('opt-switch')) {
                el.setAttribute('aria-checked', !!value);
                el.firstElementChild.textContent = value ? 'On' : 'Off';
            } else if (el.classList.contains('opt-slider')) {
                const input = el.firstElementChild;
                const min = Number(input.min), max = Number(input.max);
                input.value = value;
                input.style.setProperty('--fill', ((Number(value) - min) / ((max - min) || 1)) * 100 + '%');
                el.lastElementChild.textContent = value + (el.dataset.unit || '');
            }
        }
    }

    showOptionsMenu(from = 'menu') {
        const screen = this.optionsMenuScreen;
        if (!screen || !this._optionDefs) return;
        const origins = {
            menu: [this.mainMenuScreen, 'Main Menu'],
            pause: [this.pauseMenuScreen, 'Mission Paused'],
            shootout: [this.shootoutPauseMenuScreen, 'Shootout Paused'],
        };
        const [returnTo, badge] = origins[from] || origins.menu;
        this._optionsReturnTo = returnTo || null;
        if (returnTo) returnTo.style.display = 'none';
        this._optionsContextBadge.textContent = badge;

        this.populateWallpaperSelection();
        for (const key of Object.keys(this._optionControls)) this._syncOptionControl(key);
        this._syncKeyBindings();
        this._switchOptionsTab(this._optionsTab);
        screen.style.display = 'flex';
    }

    /** Close the window, showing the menu that opened it again unless returnToOrigin is false. */
    hideOptionsMenu(returnToOrigin = true) {
        const screen = this.optionsMenuScreen;
        if (!screen || screen.style.display === 'none') return;
        this._cancelRebind();
        this._disarmOptionsReset();
        screen.style.display = 'none';
        if (returnToOrigin && this._optionsReturnTo) this._optionsReturnTo.style.display = 'flex';
        this._optionsReturnTo = null;
    }

    _switchOptionsTab(name) {
        this._cancelRebind();
        this._disarmOptionsReset();
        this._optionsTab = name;
        for (const tab of this._optionsTabs) {
            const on = tab.dataset.tab === name;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-selected', on);
            tab.tabIndex = on ? 0 : -1;
        }
        for (const page of this._optionsPages) page.classList.toggle('active', page.dataset.page === name);
        this._setOptionsInfo(null);
    }

    _activeOptionsPage() {
        return this._optionsPages.find(p => p.dataset.page === this._optionsTab) || this._optionsPages[0];
    }

    // Info strip: a row's description, the page's when row is null, or an explicit message.
    // alert highlights the strip until the pointer moves on to another row.
    _setOptionsInfo(row, title, text, alert = false) {
        this._optionsInfoRow = row;
        if (title === undefined) {
            const src = row || this._activeOptionsPage();
            const label = row && row.querySelector('.opt-label');
            title = src.dataset.title || (label ? label.textContent : '');
            text = src.dataset.desc || '';
        }
        this._optionsInfoTitle.textContent = title;
        this._optionsInfoText.textContent = text;
        this._optionsInfo.classList.toggle('is-alert', alert);
    }

    // First click arms the button ("Confirm Reset"), a second within 3 s resets the open tab.
    _onResetOptionsTab() {
        const btn = this._optionsResetButton;
        if (!this._optionsResetArmed) {
            this._optionsResetArmed = true;
            btn.classList.add('is-armed');
            btn.textContent = 'Confirm Reset';
            this._optionsResetTimer = setTimeout(() => this._disarmOptionsReset(), 3000);
            return;
        }
        this._disarmOptionsReset();
        const page = this._activeOptionsPage();
        const keys = new Set([...page.querySelectorAll('[data-option]')].map(el => el.dataset.option));
        for (const key of keys) {
            const def = this._optionDefs[key];
            if (def && def.pref) this._setOption(key, def.def);
        }
        if (page.dataset.page === 'controls' && this.game.keyBindings) this.game.keyBindings.reset();
        if (page.dataset.page === 'graphics') this.selectWallpaper(CONFIG.DEFAULT_MENU_WALLPAPER);
        this._setOptionsInfo(null, `${page.dataset.title} reset`, 'Every setting on this tab is back to its default.', true);
    }

    _disarmOptionsReset() {
        clearTimeout(this._optionsResetTimer);
        this._optionsResetArmed = false;
        if (this._optionsResetButton) {
            this._optionsResetButton.classList.remove('is-armed');
            this._optionsResetButton.textContent = 'Reset Tab';
        }
    }

    _setFullscreen(on) {
        const root = document.documentElement;
        if (on && !document.fullscreenElement && root.requestFullscreen) {
            root.requestFullscreen().catch(() => this._syncOptionControl('fullscreen'));
        } else if (!on && document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    _applyMasterVolume() {
        const v = (this._muteInBackground && this._inBackground) ? 0 : this._masterVolume;
        if (this.game.audioManager) this.game.audioManager.setGlobalVolume(v);
        if (this.game.musicManager) this.game.musicManager.setMasterVolume(v);
    }

    // Window blurred/hidden or back: drives Mute in Background and Pause on Focus Loss.
    _onWindowFocusChange() {
        const background = document.hidden || !document.hasFocus();
        if (background === this._inBackground) return;
        this._inBackground = background;
        this._applyMasterVolume();
        if (background && this._pauseOnFocusLoss && this.game) {
            if (this.game.gameState === 'RUNNING') this.game.togglePause();
            else if (this.game.gameState === 'SHOOTOUT_PLAYING') this.game.toggleShootoutPause();
        }
    }

    // ---------------------------------------------------------------- key bindings (Controls tab)

    _initKeyBindingOptions() {
        const kb = this.game.keyBindings;
        const page = this.optionsMenuScreen.querySelector('.opt-page[data-page="controls"]');
        if (!kb || !page) return;
        this._bindRows = new Map();     // action -> { row, keycap, reset }

        for (const a of kb.actions) {
            let card = page.querySelector(`.opt-card[data-bind-group="${a.group}"]`);
            if (!card) {
                // A group without a card in the markup gets one at the end of the last column.
                card = document.createElement('div');
                card.className = 'opt-card';
                card.dataset.bindGroup = a.group;
                card.appendChild(document.createElement('h3')).textContent = a.group;
                const cols = page.querySelectorAll('.opt-col');
                cols[cols.length - 1].appendChild(card);
            }
            const row = document.createElement('div');
            row.className = 'opt-row opt-bind-row';
            row.dataset.desc = a.desc;
            row.innerHTML = '<span class="opt-label"></span><span class="opt-bind-keys">' +
                '<button class="opt-bind-reset" title="Reset to default" aria-label="Reset to default">&#x21BA;</button>' +
                '<button class="opt-keycap"></button></span>';
            row.firstElementChild.textContent = a.name;
            const reset = row.querySelector('.opt-bind-reset');
            const keycap = row.querySelector('.opt-keycap');
            keycap.setAttribute('aria-label', 'Rebind ' + a.name);
            keycap.addEventListener('click', () => this._startRebind(a.key));
            reset.addEventListener('click', () => this._applyBinding(a.key, a.code));
            card.appendChild(row);
            this._bindRows.set(a.key, { row, keycap, reset });
        }

        // Mouse and modifier controls can't be rebound; listed for reference.
        const fixed = document.getElementById('optionsFixedControls');
        if (fixed) {
            for (const f of kb.cfg.FIXED) {
                const row = document.createElement('div');
                row.className = 'opt-row opt-bind-row is-fixed';
                row.dataset.desc = f.desc;
                row.innerHTML = '<span class="opt-label"></span><span class="opt-keycap is-fixed"></span>';
                row.firstElementChild.textContent = f.name;
                row.lastElementChild.textContent = f.input;
                fixed.appendChild(row);
            }
        }

        kb.onChange(() => this._syncKeyBindings());
        this._syncKeyBindings();
    }

    _syncKeyBindings() {
        const kb = this.game && this.game.keyBindings;
        if (!kb || !this._bindRows) return;
        for (const [action, { row, keycap, reset }] of this._bindRows) {
            if (action === this._rebindAction) continue;
            const custom = !kb.isDefault(action);
            keycap.classList.remove('is-listening');
            keycap.classList.toggle('is-custom', custom);
            keycap.textContent = kb.label(action);
            reset.classList.toggle('is-visible', custom);
            reset.tabIndex = custom ? 0 : -1;
            row.classList.toggle('is-unbound', !kb.codeFor(action));
        }
    }

    _startRebind(action) {
        this._cancelRebind();
        const entry = this._bindRows.get(action);
        if (!entry) return;
        this._rebindAction = action;
        entry.keycap.classList.add('is-listening');
        entry.keycap.textContent = 'Press a key';
        const name = this.game.keyBindings.getAction(action).name;
        this._setOptionsInfo(entry.row, `Rebind: ${name}`, 'Press the new key now. Esc cancels.', true);
    }

    _cancelRebind() {
        if (!this._rebindAction) return;
        this._rebindAction = null;
        this._syncKeyBindings();
    }

    // keydown while a binding is listening; runs in the capture phase, ahead of the game.
    _onRebindKey(e) {
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return; // wait for the real key
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.repeat) return;
        const action = this._rebindAction;
        const { row, keycap } = this._bindRows.get(action);
        const code = KeyBindings.codeOf(e);
        if (code === 'Escape') {
            this._cancelRebind();
            this._setOptionsInfo(row);
            return;
        }
        if (this.game.keyBindings.isReserved(code)) {
            this._playOnce(keycap, 'is-denied');
            this._setOptionsInfo(row, `${KeyBindings.codeLabel(code)} is reserved`,
                'Esc, Shift, Ctrl, Alt, Tab and a few system keys can\'t be bound. Press another key, or Esc to cancel.', true);
            return;
        }
        this._applyBinding(action, code);
        // Drop focus so the key's own keyup (Space/Enter) can't click the keycap into listening again.
        keycap.blur();
    }

    _applyBinding(action, code) {
        const kb = this.game.keyBindings;
        this._rebindAction = null;
        const swapped = kb.set(action, code);
        this._syncKeyBindings();
        const name = kb.getAction(action).name;
        let text = `${name} is now on ${KeyBindings.codeLabel(code)}.`;
        this._flashBindRow(action);
        if (swapped) {
            this._flashBindRow(swapped);
            const other = kb.getAction(swapped).name;
            text += kb.codeFor(swapped) ? ` ${other} moved to ${kb.label(swapped)}.` : ` ${other} is now unbound.`;
        }
        this._setOptionsInfo(this._bindRows.get(action).row, 'Key bound', text, true);
    }

    _flashBindRow(action) {
        const entry = this._bindRows.get(action);
        if (entry) this._playOnce(entry.row, 'is-flash');
    }

    // Restart a one-shot CSS animation class, and drop it when done so it doesn't replay
    // every time the window is shown again.
    _playOnce(el, cls) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        const done = (e) => {
            if (e.target !== el) return; // a child's animation
            el.classList.remove(cls);
            el.removeEventListener('animationend', done);
        };
        el.addEventListener('animationend', done);
    }

    populateWallpaperSelection() {
        if (!this.wallpaperSelectionGrid || !CONFIG.MENU_WALLPAPERS) return;

        this.wallpaperSelectionGrid.innerHTML = '';

        CONFIG.MENU_WALLPAPERS.forEach(wallpaper => {
            const option = document.createElement('div');
            option.className = 'wallpaper-option';
            if (wallpaper.key === this.currentWallpaperKey) {
                option.classList.add('selected');
            }
            option.style.backgroundImage = `url('${wallpaper.path}')`;

            const nameLabel = document.createElement('div');
            nameLabel.className = 'wallpaper-option-name';
            nameLabel.textContent = wallpaper.name;
            option.appendChild(nameLabel);

            option.addEventListener('click', () => {
                this.selectWallpaper(wallpaper.key);
            });

            this.wallpaperSelectionGrid.appendChild(option);
        });
    }

    selectWallpaper(wallpaperKey) {
        this.applyWallpaper(wallpaperKey, true);
    }

    applyWallpaper(wallpaperKey, savePreference = false) {
        const wallpaper = CONFIG.MENU_WALLPAPERS.find(w => w.key === wallpaperKey);
        if (!wallpaper) return;

        this.currentWallpaperKey = wallpaperKey;
        if (savePreference) {
            SaveManager.savePreference('menuWallpaper', wallpaperKey);
        }

        if (this.mainMenuWallpaper) {
            // Read by the wallpaper's edge-fill layers in style.css, not set as backgroundImage.
            this.mainMenuWallpaper.style.setProperty('--wallpaper-image', `url('${wallpaper.path}')`);
        }

        if (this.game) {
            this.game.preloadedImages[wallpaper.path] = this.game.preloadedImages[wallpaper.path] || new Image();
            if (!this.game.preloadedImages[wallpaper.path].src) {
                const img = new Image();
                img.onload = () => { this.game.preloadedImages[wallpaper.path] = img; };
                img.src = wallpaper.path;
            }
        }

        this.populateWallpaperSelection();
    }

    shuffleWallpaper() {
        if (!CONFIG.MENU_WALLPAPERS || CONFIG.MENU_WALLPAPERS.length === 0) return;
        const otherWallpapers = CONFIG.MENU_WALLPAPERS.filter(w => w.key !== this.currentWallpaperKey);
        if (otherWallpapers.length === 0) return;
        const randomWallpaper = otherWallpapers[Math.floor(Math.random() * otherWallpapers.length)];
        this.applyWallpaper(randomWallpaper.key, false);
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

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'dismiss-recruit-btn';
        dismissBtn.textContent = 'Send Back Home';
        dismissBtn.title = 'Remove this recruit from the roster permanently';
        dismissBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const recruitName = recruit.name || recruit.id;
            const contextKey = 'recruit_dismiss';
            if (this.isDismissSuppressed(contextKey)) {
                this.game.dismissRecruit(recruit.id);
                this.refreshRecruitSelectionLists();
                return;
            }
            const confirmed = await this.showConfirmDialog(
                `Send ${recruitName} back home?\n\nThis will permanently remove them from your roster to make room for new recruits.`,
                contextKey
            );
            if (confirmed && this.game) {
                this.game.dismissRecruit(recruit.id);
                this.refreshRecruitSelectionLists();
            }
        });

        card.appendChild(dismissBtn);
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
                this.showToast((this.uiText.MAX_SQUAD_ALERT || "Max squad size is {MAX_SQUAD_SIZE}.").replace('{MAX_SQUAD_SIZE}', maxSquadSize.toString()), 'warning');
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
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen(); this.hideEndOfPhaseScreen();
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
    /*    const availableRecruitsTitle = document.getElementById('availableRecruitsTitle');
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
//                console.log(`[DEBUG] Added test unit: ${testRecruit.name} with rank ${selectedRank}, XP: ${xpForRank}`);
            });
            debugControls.appendChild(addBtn);

            availableRecruitsTitle.insertAdjacentElement('afterend', debugControls);
        }
    */    // --- END DEBUG CONTROLS ---

        this.preMissionScreen.style.display = 'flex';
        this.setCursor('default');
    }

    // --- NEW: Create unit card with vertical layout (face, details, sprite) ---
    _createPostMissionRecruitCard(recruit, type) {
        const card = document.createElement('div');
        card.className = 'unit-card';

        const isPromoted = recruit.promotedThisMission && type !== 'fallen' && type !== 'new';
        if (isPromoted) {
            card.classList.add('promoted');
        }

        // Sprite Section (top)
        const spriteSection = document.createElement('div');
        spriteSection.className = 'unit-card-sprite-section';

        // For promoted units, create old rank sprite overlay
        let oldRankSpriteDiv = null;
        if (isPromoted && recruit.previousRank) {
            oldRankSpriteDiv = document.createElement('div');
            oldRankSpriteDiv.className = 'card-sprite card-sprite-old-rank';
            
            const spriteBaseName = recruit.spriteBaseName || 'raccoon';
            const oldSpritePath = this._getSpritePathForRank(recruit.previousRank);
            const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
            
            directions.forEach(dir => {
                const spriteKey = `${spriteBaseName}_idle_${dir}`;
                const spriteUrl = this.game?.preloadedImages?.[spriteKey] 
                    ? this.game.preloadedImages[spriteKey].src 
                    : `${oldSpritePath}idle/${spriteBaseName}_idle_${dir}.png`;
                oldRankSpriteDiv.style.setProperty(`--sprite-${dir}`, `url('${spriteUrl}')`);
            });
            spriteSection.appendChild(oldRankSpriteDiv);
        }

        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'card-sprite';

        // Build sprite URLs based on rank + sprite variant
        const spriteBaseName = recruit.spriteBaseName || 'raccoon';
        const spritePath = this._getSpritePathForSprite(recruit.rank, spriteBaseName);
        const directions = ['se', 's', 'sw', 'w', 'nw', 'n', 'ne', 'e', ];
        
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

        // Promotion badge
        if (isPromoted) {
            const promotionBadge = document.createElement('div');
            promotionBadge.className = 'promotion-badge';
            promotionBadge.textContent = `PROMOTED TO ${recruit.rank.toUpperCase()}!`;
            card.appendChild(promotionBadge);
        }

        // Info Row - Dogtag container with name, stats, rank icon, xp
        const infoRow = document.createElement('div');
        infoRow.className = 'unit-card-info-row';

        const dogtagContainer = document.createElement('div');
        dogtagContainer.className = 'unit-card-dogtag';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'card-details';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = recruit.name;
        detailsDiv.appendChild(nameDiv);

        const statsRow = document.createElement('div');
        statsRow.className = 'card-stats-row';

        const rankDiv = document.createElement('div');
        rankDiv.className = 'card-rank';
        rankDiv.textContent = recruit.rank || 'Recruit';
        statsRow.appendChild(rankDiv);

        const rankIconDiv = document.createElement('div');
        rankIconDiv.className = 'card-rank-icon';
        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[recruit.rank]) {
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[recruit.rank]}')`;
        }
        statsRow.appendChild(rankIconDiv);

        detailsDiv.appendChild(statsRow);

        const statusDiv = document.createElement('div');
        if (type === 'fallen') {
            statusDiv.className = 'card-status kia';
            statusDiv.textContent = 'KIA';
        } else {
            statusDiv.className = 'card-xp';
            statusDiv.textContent = `XP: ${recruit.xp}`;
        }
        detailsDiv.appendChild(statusDiv);

        dogtagContainer.appendChild(detailsDiv);
        infoRow.appendChild(dogtagContainer);
        card.appendChild(infoRow);

        if (type === 'fallen') {
            card.classList.add('fallen');
        }

        return card;
    }

    // Helper to get sprite path based on rank (legacy fallback — first variant of the rank)
    _getSpritePathForRank(rank) {
        const variants = (CONFIG.RACCOON_SPRITE_VARIANTS && CONFIG.RACCOON_SPRITE_VARIANTS[rank]) || [];
        if (variants.length > 0) return variants[0].basePath;
        return CONFIG.RACCOON_SPRITE_PATH || 'assets/images/units/raccoon/rifleman/recruit/type1/';
    }

    // Resolve the sprite folder for a specific unit by matching its spriteBaseName against
    // the rank's variants (multi-type system). Falls back to the rank's first variant.
    _getSpritePathForSprite(rank, spriteBaseName) {
        const variants = (CONFIG.RACCOON_SPRITE_VARIANTS && CONFIG.RACCOON_SPRITE_VARIANTS[rank]) || [];
        const match = variants.find(v => v.baseName === spriteBaseName);
        if (match) return match.basePath;
        return this._getSpritePathForRank(rank);
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

        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideRecruitMemorialScreen(); this.hideEndOfPhaseScreen();
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        this.gameOverScreen.style.display = 'flex'; this.setCursor('default');
    }

    showRecruitMemorialScreen() {
        if (!this.recruitMemorialScreen || !this.game || !this.memorialEntriesList) return;
        this.hideMainMenuScreen(); this.hidePostMissionScreen(); this.hidePreMissionScreen(); this.hideGameOverScreen(); this.hideEndOfPhaseScreen();
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
//            console.error('[UI] Fullscreen alert screen not found!');
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
        
//        console.log('[UI] showShootoutAmbushAlert called, scenarioType:', scenarioType, 'backgroundImage:', backgroundImage);
        
        // Get random message from config
        const messages = CONFIG.SHOOTOUT_MODE.AMBUSH_ALERT_MESSAGES[scenarioType];
//        console.log('[UI] messages:', messages);
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
//            console.error('[UI] Ambush result screen not found!');
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
        if (this.objectivesPanel) this.objectivesPanel.style.display = 'block';
        if (this.game && this.game.fpsDisplayElement) this.game.fpsDisplayElement.style.display = 'block';
        this.hideMainMenuScreen(); this.hidePreMissionScreen(); this.hidePostMissionScreen(); this.hideGameOverScreen(); this.hideRecruitMemorialScreen();
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
            this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
            this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
        if (this.game && this.game.ui && this.game.currentFormationType) this.updateFormationButton(this.game.currentFormationType);
        this.updateSquadPanel();
        this.updateObjective();
    }
    hideHUD() {
        if (this.leftHudPanel) this.leftHudPanel.style.display = 'none';
        if (this.objectivesPanel) this.objectivesPanel.style.display = 'none';
        if (this.game && this.game.fpsDisplayElement) this.game.fpsDisplayElement.style.display = 'none';
    }

    // --- In-mission HUD ---------------------------------------------------------------
    // The squad cards and the objective panel are built once (when the squad or the
    // objective list changes) and then refreshed in place: the _hud* setters only touch
    // the DOM when a value actually changed. Game.update calls tickHud() every running
    // frame and it throttles to CONFIG.UI_SETTINGS.HUD.REFRESH_INTERVAL; game events still
    // call updateSquadPanel() / updateObjective() directly for an immediate refresh.

    tickHud(deltaTime) {
        this._hudRefreshTimer = (this._hudRefreshTimer || 0) - deltaTime;
        if (this._hudRefreshTimer > 0) return;
        this._hudRefreshTimer = (this.uiSettings.HUD && this.uiSettings.HUD.REFRESH_INTERVAL) || 0.1;
        this.updateSquadPanel();
        this.updateObjective();
    }

    _hudText(el, value) {
        if (el._hudText !== value) { el._hudText = value; el.textContent = value; }
    }

    _hudWidth(el, fraction) {
        const pct = Math.round(Math.max(0, Math.min(1, fraction || 0)) * 1000) / 10;
        if (el._hudWidth !== pct) { el._hudWidth = pct; el.style.width = pct + '%'; }
    }

    _hudColor(el, color) {
        if (el._hudColor !== color) { el._hudColor = color; el.style.backgroundColor = color; }
    }

    _hudToggle(el, className, on) {
        if (el.classList.contains(className) !== on) el.classList.toggle(className, on);
    }

    updateObjective() {
        const container = this.objectiveTextContainer;
        if (!container) return;
        const params = this.game && this.game.currentMissionParams;
        const objectives = params && params.objectives;

        if (!objectives || objectives.length === 0) {
            const message = objectives
                ? (this.uiText.DEFAULT_OBJECTIVE_TEXT || "Complete the mission!")
                : (this.uiText.UNKNOWN_OBJECTIVE_TEXT || "Unknown Objective");
            if (this._objMessage !== message) {
                this._objMessage = message;
                this._objRows = null;
                this._objSource = null;
                container.innerHTML = '';
                const messageDiv = document.createElement('div');
                messageDiv.className = 'obj-message';
                messageDiv.textContent = message;
                container.appendChild(messageDiv);
            }
            return;
        }

        if (this._objSource !== objectives || this._objParams !== params || this._objCount !== objectives.length) {
            this._buildObjectivePanel(params, objectives);
        }
        const indicator = this.game.lastObjectiveIndicator;
        let orderChanged = false;
        for (const row of this._objRows) {
            const wasDone = row.isDone;
            this._refreshObjectiveRow(row, indicator);
            if (row.isDone !== wasDone) orderChanged = true;
        }
        if (orderChanged) this._orderObjectiveRows();
    }

    // Main objective first, then the open objectives, then completed ones, then extraction:
    // finished rows sink so the ones still to do stay in view when the sidebar is short.
    _orderObjectiveRows() {
        const rows = this._objRows;
        for (const row of rows) if (row.isMain) this._objList.appendChild(row.root);
        for (const row of rows) if (!row.isMain && !row.isExtraction && !row.isDone) this._objList.appendChild(row.root);
        for (const row of rows) if (!row.isMain && !row.isExtraction && row.isDone) this._objList.appendChild(row.root);
        for (const row of rows) if (!row.isMain && row.isExtraction) this._objList.appendChild(row.root);
    }

    _buildObjectivePanel(params, objectives) {
        const container = this.objectiveTextContainer;
        this._objParams = params;
        this._objSource = objectives;
        this._objCount = objectives.length;
        this._objMessage = null;
        this._objHasExtraction = objectives.some(o => o.type === 'EXTRACTION');
        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'obj-header';
        const title = document.createElement('div');
        title.className = 'obj-title';
        title.textContent = (params.baseParams && params.baseParams.name) || this.uiText.UNKNOWN_MISSION_TEXT || '';
        const subtitle = document.createElement('div');
        subtitle.className = 'obj-subtitle';
        const phaseData = this.game.campaignStructure && this.game.campaignStructure[this.game.currentPhaseIndex];
        if (phaseData) {
            let text = this.game._fillTextTemplate(this.uiText.HUD_MISSION_SUBTITLE || "Phase {PHASE} · Mission {MISSION} of {TOTAL}", {
                PHASE: this.game.currentPhaseIndex + 1,
                MISSION: this.game.currentMissionIndex + 1,
                TOTAL: phaseData.missionsInPhase
            });
            if (this.game.currentMissionIndex === phaseData.missionsInPhase - 1) text += ` · ${this.uiText.HUD_MISSION_FINALE || 'Finale'}`;
            subtitle.textContent = text;
        }
        header.append(title, subtitle);
        container.appendChild(header);

        // Every objective is required (checkMissionStatus waits for all of them), so the panel
        // shows no primary/secondary split: the mission's main objective (its first primary)
        // leads, and extraction is always the last step (see _orderObjectiveRows).
        const main = objectives.find(o => o.isPrimary) || objectives[0];

        const list = document.createElement('div');
        list.className = 'obj-list';
        this._objList = list;
        this._objRows = objectives.map(obj => {
            const root = document.createElement('div');
            root.className = 'obj-row';
            root.innerHTML = '<span class="obj-icon"></span>'
                + '<span class="obj-label"><span class="obj-label-text"></span></span>'
                + '<span class="obj-count"></span>'
                + '<div class="obj-bar"><i></i></div>'
                + '<div class="obj-sub"><span class="obj-sub-danger"></span><span class="obj-sub-text"></span></div>';
            if (obj === main) root.classList.add('is-main');
            return {
                obj, root,
                isMain: obj === main,
                isExtraction: obj.type === 'EXTRACTION',
                isDone: false,
                tooltip: null,
                label: root.querySelector('.obj-label-text'),
                count: root.querySelector('.obj-count'),
                fill: root.querySelector('.obj-bar > i'),
                subDanger: root.querySelector('.obj-sub-danger'),
                subText: root.querySelector('.obj-sub-text'),
                targetUnit: null,
                lastColor: null
            };
        });
        this._orderObjectiveRows();
        container.appendChild(list);
    }

    _refreshObjectiveRow(row, indicator) {
        const obj = row.obj;
        const t = this.uiText;
        const cur = obj.currentProgress || 0;
        const total = obj.totalToAchieve || 0;
        let label = '', count = '', fraction = -1, dangerText = '', subText = '', isHpBar = false;
        let state = obj.isComplete ? 'done' : 'active';

        switch (obj.type) {
            case 'EXTERMINATE':
            case 'DESTROY_TARGET':
            case 'INTERACT_INTEL':
            case 'DEACTIVATE_ANTI_AIR_TURRETS':
                label = this.game._fillTextTemplate(t['HUD_OBJ_' + obj.type] || obj.type, { TARGET_NAME_PLURAL: obj.targetNamePlural || 'targets' });
                count = `${cur} / ${total}`;
                fraction = total > 0 ? cur / total : 0;
                break;
            case 'RESCUE_HOSTAGES':
                label = t.HUD_OBJ_RESCUE_HOSTAGES || 'Rescue hostages';
                count = `${cur} / ${total}`;
                fraction = total > 0 ? cur / total : 0;
                if (obj.hostagesKilled > 0) dangerText = this.game._fillTextTemplate(t.HUD_OBJ_HOSTAGES_KIA || '{COUNT} KIA', { COUNT: obj.hostagesKilled });
                // Without an EXTRACTION objective the mission still waits for the rescued hostages
                // to reach the extraction zone, so the row stays live until the mission ends.
                if (obj.isComplete && !this._objHasExtraction) {
                    state = 'active';
                    subText = obj.extractionZoneRevealed
                        ? (t.HUD_OBJ_HOSTAGES_ESCORT || 'Escort them to the extraction zone')
                        : (t.HUD_OBJ_HOSTAGES_ESCORT_LOCKED || 'Extraction opens when the rest are done');
                }
                break;
            case 'ASSASSINATION': {
                const details = obj.targetDetails;
                label = this.game._fillTextTemplate(t.HUD_OBJ_ASSASSINATION || 'Eliminate {TARGET_CALLSIGN}', {
                    TARGET_CALLSIGN: (details && (details.callsign || details.name)) || 'VIP',
                    TARGET_NAME: (details && details.name) || 'VIP'
                });
                if (!obj.isComplete) {
                    if (!obj.targetUnitId) {
                        subText = t.HUD_OBJ_VIP_AWAITING || 'Awaiting target';
                    } else {
                        let unit = row.targetUnit;
                        if (!unit || unit.id !== obj.targetUnitId) {
                            unit = row.targetUnit = (this.game.enemyUnits && this.game.enemyUnits.find(e => e.id === obj.targetUnitId)) || null;
                        }
                        if (unit && unit.isAlive()) {
                            count = this.game._fillTextTemplate(t.HUD_OBJ_VIP_HP || '{HP} HP', { HP: Math.ceil(unit.hp) });
                            fraction = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
                            isHpBar = true;
                        }
                    }
                }
                break;
            }
            case 'RESCUE_TAKEN_HOSTAGE':
                label = this.game._fillTextTemplate(t.HUD_OBJ_RESCUE_TAKEN_HOSTAGE || 'Rescue {NAME}', { NAME: obj.targetRaccoonName || 'comrade' });
                break;
            case 'EXTRACTION':
                label = t.HUD_OBJ_EXTRACTION || 'Extract the squad';
                if (!obj.extractionZoneRevealed) {
                    state = 'locked'; // explained in the row tooltip, to keep the row one line
                } else if (!obj.isComplete) {
                    subText = t.HUD_OBJ_EXTRACTION_GO || 'Get everyone to the extraction zone';
                }
                break;
            default:
                label = this.game._fillTextTemplate(t[obj.descriptionTemplateKey] || `Objective: ${obj.type}`, { CURRENT: cur, TOTAL: total });
        }

        this._hudText(row.label, label);
        this._hudText(row.count, count);
        this._hudToggle(row.root, 'no-bar', fraction < 0);
        if (fraction >= 0) this._hudWidth(row.fill, fraction);
        this._hudToggle(row.root, 'obj-hp', isHpBar);
        this._hudText(row.subDanger, dangerText);
        this._hudText(row.subText, subText);
        this._hudToggle(row.root, 'has-sub', !!(dangerText || subText));
        this._hudToggle(row.root, 'is-done', state === 'done');
        this._hudToggle(row.root, 'is-locked', state === 'locked');
        row.isDone = state === 'done';

        let tooltip = '';
        if (state === 'locked') tooltip = t.HUD_OBJ_EXTRACTION_LOCKED || 'Opens when the rest are done';
        else if (row.isMain) tooltip = t.HUD_OBJ_MAIN_TOOLTIP || 'Main objective';
        if (row.tooltip !== tooltip) { row.tooltip = tooltip; row.root.title = tooltip; }

        const isLast = state === 'active' && !!indicator && indicator.active && indicator.objectiveType === obj.type;
        this._hudToggle(row.root, 'is-last', isLast);
        if (isLast && row.lastColor !== indicator.color) {
            row.lastColor = indicator.color;
            row.root.style.setProperty('--obj-last-color', indicator.color);
        }
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
        if (!this.squadPanel) return;
        const squad = this.game && this.game.deployedSquadRoster;
        if (!squad || squad.length === 0) {
            if (this._squadCards !== null) {
                this._squadCards = null;
                this.squadPanel.innerHTML = `<p>${this.uiText.HUD_NO_SQUAD_DEPLOYED || "No squad deployed."}</p>`;
            }
            return;
        }

        // Rebuild only when the deployed squad changed (new mission / different raccoons).
        const cards = this._squadCards;
        let sameSquad = !!cards;
        let cardIndex = 0;
        for (let i = 0; sameSquad && i < squad.length; i++) {
            if (!squad[i]) continue;
            sameSquad = cardIndex < cards.length && cards[cardIndex++].raccoon === squad[i];
        }
        if (!sameSquad || cardIndex !== cards.length) this._buildSquadCards(squad);

        const selectedUnits = this.game.selectedUnits || [];
        for (const card of this._squadCards) this._refreshSquadCard(card, selectedUnits);
    }

    _buildSquadCards(squad) {
        this.squadPanel.innerHTML = '';
        this._squadCards = [];
        const aimIndicator = CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.GRENADE_AIM_INDICATOR;
        this.squadPanel.style.setProperty('--sm-aim-color', (aimIndicator && aimIndicator.COLOR) || 'orange');

        for (const raccoon of squad) {
            if (!raccoon) continue;
            const root = document.createElement('div');
            root.className = 'squad-member';
            root.dataset.id = raccoon.id;
            root.innerHTML = '<div class="sm-top">'
                +   '<div class="sm-portrait"><div class="sm-xp"><i></i></div></div>'
                +   '<div class="sm-id">'
                +     '<div class="sm-name-row"><span class="sm-name"></span><span class="sm-status"></span></div>'
                +     '<div class="sm-rank"><span class="sm-rank-icon"></span><span class="sm-rank-name"></span></div>'
                +     '<div class="sm-hp"><i></i><span></span></div>'
                +   '</div>'
                + '</div>'
                + '<div class="sm-ammo"><span class="sm-weapon"></span><span class="sm-ammo-count"><b></b><span></span></span></div>'
                + '<div class="sm-mag"><i></i></div>'
                + '<div class="sm-grenades"></div>';
            const card = {
                raccoon, root,
                portrait: root.querySelector('.sm-portrait'),
                xpFill: root.querySelector('.sm-xp > i'),
                name: root.querySelector('.sm-name'),
                status: root.querySelector('.sm-status'),
                rankIcon: root.querySelector('.sm-rank-icon'),
                rankName: root.querySelector('.sm-rank-name'),
                hpFill: root.querySelector('.sm-hp > i'),
                hpText: root.querySelector('.sm-hp > span'),
                weapon: root.querySelector('.sm-weapon'),
                magCount: root.querySelector('.sm-ammo-count > b'),
                reserve: root.querySelector('.sm-ammo-count > span'),
                magFill: root.querySelector('.sm-mag > i'),
                grenades: root.querySelector('.sm-grenades'),
                grenadeKey: null,
                grenadeChips: [],
                xpTitle: null
            };
            if (raccoon.faceImageUrl) card.portrait.style.backgroundImage = `url('${raccoon.faceImageUrl}')`;
            this.squadPanel.appendChild(root);
            this._squadCards.push(card);
        }
    }

    _refreshSquadCard(card, selectedUnits) {
        const r = card.raccoon;
        const t = this.uiText;
        const isKIA = !r.isAlive();
        this._hudToggle(card.root, 'kia', isKIA);
        this._hudToggle(card.root, 'selected', !isKIA && selectedUnits.includes(r));
        this._hudToggle(card.root, 'aiming', !isKIA && !!r.isAimingGrenade);

        // Identity: name, rank (+ icon), XP toward the next rank
        this._hudText(card.name, r.name || r.id);
        const rank = r.rank || 'Recruit';
        if (card.rankName._hudText !== rank) {
            this._hudText(card.rankName, rank);
            const iconFiles = this.uiSettings.RANK_ICON_FILES;
            const iconPath = this.uiSettings.RANK_ICON_PATH;
            card.rankIcon.style.backgroundImage = (iconFiles && iconPath && iconFiles[rank]) ? `url('${iconPath}${iconFiles[rank]}')` : '';
        }
        const xp = r.xp || 0;
        let xpFraction = 1;
        if (r.xpToNextRank !== undefined && r.xpToNextRank !== Infinity) {
            const rankData = CONFIG.RANK_THRESHOLDS && CONFIG.RANK_THRESHOLDS.find(th => th.rankName === rank);
            const floor = rankData ? rankData.xpNeeded : 0;
            xpFraction = (xp - floor) / Math.max(1, r.xpToNextRank - floor);
        }
        this._hudWidth(card.xpFill, xpFraction);
        const xpTitle = (r.xpToNextRank !== undefined && r.xpToNextRank !== Infinity) ? `XP ${xp} / ${r.xpToNextRank}` : `XP ${xp}`;
        if (card.xpTitle !== xpTitle) { card.xpTitle = xpTitle; card.root.title = xpTitle; }

        // Health
        const healthBar = this.uiSettings.HEALTH_BAR || {};
        const hpFraction = isKIA ? 0 : Math.max(0, r.hp / r.maxHp);
        let hpColor = healthBar.HP_COLOR_FULL || '#70A060';
        if (hpFraction < (healthBar.LOW_HP_THRESHOLD_PERCENT || 0.3)) hpColor = healthBar.HP_COLOR_LOW || '#A85050';
        else if (hpFraction < (healthBar.MEDIUM_HP_THRESHOLD_PERCENT || 0.6)) hpColor = healthBar.HP_COLOR_MEDIUM || '#D09040';
        this._hudWidth(card.hpFill, hpFraction);
        this._hudColor(card.hpFill, hpColor);
        this._hudToggle(card.hpFill, 'health-bar-flash', !isKIA && hpFraction <= (healthBar.FLASH_THRESHOLD || 0.25));
        this._hudText(card.hpText, isKIA ? '' : `${Math.ceil(r.hp)} / ${r.maxHp}`);

        // Status tag (reloading is shown in the ammo row instead)
        let status = '';
        if (isKIA) status = t.HUD_STATUS_KIA || 'KIA';
        else if (r.isAimingGrenade) status = t.HUD_STATUS_AIMING || 'AIMING';
        else if (r.isPlayerDirectFiring) status = t.HUD_STATUS_FIRING || 'FIRING';
        else if (r.actionTimer > 0) status = t.HUD_STATUS_STUNNED || 'STUNNED';
        this._hudText(card.status, status);
        if (isKIA) return;

        // Weapon + ammo: the magazine count is the big number, reserve beside it, magazine bar
        // underneath. While reloading, the bar shows reload progress instead.
        const weaponDef = CONFIG.WEAPON_DEFINITIONS[r.currentWeaponName];
        this._hudText(card.weapon, (weaponDef && weaponDef.name) || r.currentWeaponName || '');
        this._hudToggle(card.root, 'special-weapon', !!(weaponDef && !weaponDef.isDefaultWeapon));
        const ammo = r._getCurrentAmmoState ? r._getCurrentAmmoState() : null;
        let magFraction = 0, lowAmmo = false;
        if (r.isReloading) {
            this._hudText(card.magCount, '');
            this._hudText(card.reserve, t.HUD_STATUS_RELOADING || 'RELOADING');
            magFraction = r.reloadDuration > 0 ? 1 - r.reloadTimer / r.reloadDuration : 0;
        } else if (ammo) {
            this._hudText(card.magCount, String(ammo.currentMagazine));
            this._hudText(card.reserve, ` / ${ammo.reserveAmmo === Infinity ? '∞' : ammo.reserveAmmo}`);
            magFraction = ammo.magazineSize > 0 ? ammo.currentMagazine / ammo.magazineSize : 0;
            lowAmmo = magFraction <= ((this.uiSettings.HUD && this.uiSettings.HUD.LOW_AMMO_FRACTION) || 0.25);
        }
        this._hudToggle(card.root, 'reloading', !!r.isReloading);
        this._hudToggle(card.root, 'low-ammo', lowAmmo);
        this._hudWidth(card.magFill, magFraction);

        this._refreshGrenadeChips(card, r);
    }

    // One chip per grenade type the raccoon carries (its rank's loadout, plus any type it
    // holds ammo for), in CONFIG.GRENADE_TYPES order; the type thrown next is outlined.
    _refreshGrenadeChips(card, r) {
        const grenadeTypes = CONFIG.GRENADE_TYPES || {};
        const loadout = (CONFIG.GRENADE_LOADOUT_BY_RANK && CONFIG.GRENADE_LOADOUT_BY_RANK[r.rank]) || {};
        const ammoByType = r.grenadeAmmoByType || {};
        const typeKeys = this._grenadeTypeKeys || (this._grenadeTypeKeys = Object.keys(grenadeTypes));
        let key = '';
        for (const k of typeKeys) if (loadout[k] > 0 || ammoByType[k] > 0) key += k + ',';

        if (key !== card.grenadeKey) {
            card.grenadeKey = key;
            card.grenades.innerHTML = '';
            card.grenadeChips = [];
            for (const k of typeKeys) {
                if (!(loadout[k] > 0 || ammoByType[k] > 0)) continue;
                const def = grenadeTypes[k];
                const chip = document.createElement('span');
                chip.className = 'sm-gren';
                chip.title = def.label || k;
                const icon = document.createElement('span');
                icon.className = 'sm-gren-icon';
                icon.textContent = (def.iconChar || '●') + '︎'; // text presentation, so the colour applies
                if (def.color) icon.style.color = def.color;
                const count = document.createElement('span');
                chip.append(icon, count);
                card.grenades.appendChild(chip);
                card.grenadeChips.push({ typeKey: k, root: chip, count });
            }
            this._hudToggle(card.root, 'no-grenades', card.grenadeChips.length === 0);
        }

        for (const chip of card.grenadeChips) {
            const n = ammoByType[chip.typeKey] || 0;
            this._hudText(chip.count, String(n));
            this._hudToggle(chip.root, 'empty', n <= 0);
            this._hudToggle(chip.root, 'selected', chip.typeKey === r.selectedGrenadeType);
        }
    }

    // Canvas cursor states → CSS classes in style.css (backed by CursorManager's generated cursors).
    static CANVAS_CURSOR_CLASSES = {
        'default': 'cursor-default',
        'attack': 'cursor-attack',
        'crosshair': 'cursor-attack',                 // shootout aiming
        'cell': 'cursor-cell',                        // grenade aiming
        'target-mode-default': 'cursor-target-mode-default',
        'target-enemy-hover': 'cursor-target-mode-enemy',
    };

    setCursor(styleName) {
        const canvas = this.game && this.game.canvas;
        // Called on every mouse move; skip the class churn when nothing changed.
        if (!canvas || styleName === this._canvasCursorStyle) return;
        this._canvasCursorStyle = styleName;

        canvas.classList.remove(...new Set(Object.values(UI.CANVAS_CURSOR_CLASSES)));
        canvas.style.cursor = '';
        const cls = UI.CANVAS_CURSOR_CLASSES[styleName];
        if (cls) {
            canvas.classList.add(cls);
        } else {
            // Any other value is used as a raw CSS cursor.
            canvas.classList.add('cursor-default');
            canvas.style.cursor = styleName;
        }
    }

    // ==================== CURSOR OPTIONS SCREEN ====================

    _initCursorOptions() {
        const cm = this.game && this.game.cursorManager;
        this.cursorOptionsScreen = document.getElementById('cursorOptionsScreen');
        if (!cm || !this.cursorOptionsScreen) return;
        const screen = this.cursorOptionsScreen;
        const cfg = CONFIG.CURSORS;

        // Lives in the Options window, which plays its own click sound.
        document.getElementById('cursorOptionsButton').addEventListener('click', () => this.showCursorOptions(this.optionsMenuScreen));
        this._addSoundToButton(document.getElementById('backFromCursorOptionsButton'), () => this.hideCursorOptions());
        this._addSoundToButton(document.getElementById('cursorResetButton'), () => cm.reset());

        // Generated choices: presets, preview backdrops, colour swatches (+ a custom colour picker).
        const presetGroup = document.getElementById('cursorPresetGroup');
        for (const preset of cfg.PRESETS) {
            const btn = document.createElement('button');
            btn.textContent = preset.name;
            btn.dataset.preset = preset.key;
            presetGroup.appendChild(btn);
        }
        presetGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-preset]');
            if (btn) cm.applyPreset(btn.dataset.preset);
        });

        const stage = document.getElementById('cursorPreviewStage');
        const bgGroup = document.getElementById('cursorPreviewBackgrounds');
        const setBackground = (key) => {
            const bg = cfg.PREVIEW_BACKGROUNDS.find(b => b.key === key) || cfg.PREVIEW_BACKGROUNDS[0];
            stage.style.backgroundImage = `url('${bg.image}')`;
            for (const b of bgGroup.children) b.classList.toggle('selected', b.dataset.value === bg.key);
        };
        for (const bg of cfg.PREVIEW_BACKGROUNDS) {
            const btn = document.createElement('button');
            btn.textContent = bg.name;
            btn.dataset.value = bg.key;
            btn.addEventListener('click', () => setBackground(bg.key));
            bgGroup.appendChild(btn);
        }
        this._setCursorPreviewBackground = setBackground;

        for (const container of screen.querySelectorAll('.cursor-swatches')) {
            for (const color of cfg.COLOR_SWATCHES) {
                const sw = document.createElement('button');
                sw.className = 'cursor-swatch';
                sw.dataset.value = color;
                sw.style.backgroundColor = color;
                sw.title = color;
                container.appendChild(sw);
            }
            const custom = document.createElement('input');
            custom.type = 'color';
            custom.className = 'cursor-swatch-custom';
            custom.title = 'Custom color';
            container.appendChild(custom);
        }

        // Generic binding: every [data-setting] control writes straight into the CursorManager.
        for (const el of screen.querySelectorAll('[data-setting]')) {
            const key = el.dataset.setting;
            if (el.type === 'range') {
                const [min, max] = cfg.LIMITS[key];
                el.min = min;
                el.max = max;
                el.addEventListener('input', () => cm.update({ [key]: Number(el.value) }));
            } else if (el.type === 'checkbox') {
                el.addEventListener('change', () => cm.update({ [key]: el.checked }));
            } else {
                // Choice group / swatch row: buttons carry data-value; the colour input is the custom pick.
                el.addEventListener('click', (e) => {
                    const btn = e.target.closest('button[data-value]');
                    if (btn) cm.update({ [key]: btn.dataset.value });
                });
                const custom = el.querySelector('input[type="color"]');
                if (custom) custom.addEventListener('input', () => cm.update({ [key]: custom.value }));
            }
        }

        // Escape backs out of this screen instead of reaching the game's key handling (e.g. unpausing).
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && screen.style.display !== 'none') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.hideCursorOptions();
            }
        }, true);

        cm.onChange(() => this._syncCursorOptions());
        setBackground(cfg.PREVIEW_BACKGROUNDS[0].key);
        this._syncCursorOptions();
    }

    /** Reflect the current cursor settings in every control and refresh the preview tiles. */
    _syncCursorOptions() {
        const cm = this.game && this.game.cursorManager;
        const screen = this.cursorOptionsScreen;
        if (!cm || !screen) return;
        const s = cm.getSettings();

        for (const el of screen.querySelectorAll('[data-setting]')) {
            const value = s[el.dataset.setting];
            if (el.type === 'range') {
                el.value = value;
                const label = el.parentElement.querySelector('.cursor-option-value');
                if (label) label.textContent = value + (label.dataset.unit || '');
            } else if (el.type === 'checkbox') {
                el.checked = !!value;
            } else {
                let matched = false;
                for (const btn of el.querySelectorAll('button[data-value]')) {
                    const on = btn.dataset.value === value;
                    btn.classList.toggle('selected', on);
                    matched = matched || on;
                }
                const custom = el.querySelector('input[type="color"]');
                if (custom) {
                    custom.value = value;
                    custom.classList.toggle('selected', !matched);
                }
            }
        }

        const activePreset = cm.activePresetKey();
        for (const btn of document.querySelectorAll('#cursorPresetGroup button')) {
            btn.classList.toggle('selected', btn.dataset.preset === activePreset);
        }

        for (const tile of screen.querySelectorAll('.cursor-preview-tile')) {
            const img = tile.querySelector('img');
            const info = cm.images[tile.dataset.kind];
            img.style.visibility = info ? 'visible' : 'hidden';   // 'System' pointer: nothing to draw
            if (info) {
                img.src = info.url;
                img.style.width = info.width + 'px';
                img.style.height = info.height + 'px';
            }
        }
    }

    showCursorOptions(returnTo) {
        if (!this.cursorOptionsScreen) return;
        this._cursorOptionsReturnTo = returnTo || null;
        if (returnTo) returnTo.style.display = 'none';
        this._syncCursorOptions();
        this.cursorOptionsScreen.style.display = 'flex';
    }

    hideCursorOptions() {
        if (!this.cursorOptionsScreen || this.cursorOptionsScreen.style.display === 'none') return;
        this.cursorOptionsScreen.style.display = 'none';
        if (this._cursorOptionsReturnTo) this._cursorOptionsReturnTo.style.display = 'flex';
        this._cursorOptionsReturnTo = null;
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

        if (this.pendingNewCampaignSave) {
            this.pendingNewCampaignSave = false;
            if (this.game) this.game.quitToMainMenu();
            this.currentSaveLoadMode = null;
            return;
        }

        // If we came from pause menu and are in save mode, show pause menu again
        if (this.currentSaveLoadMode === 'save' && this.game && this.game.gameState === 'PAUSED') {
            this.showPauseMenuScreen();
        }
        this.currentSaveLoadMode = null;
        this.pendingNewCampaignSave = false;
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
                const nightIndicator = slot.isNightMission ? '<span class="save-slot-night-indicator" title="Night Mission">🌙</span>' : '';
                slotInfo.innerHTML = `
                    <div class="save-slot-name">${slot.slotName} ${nightIndicator}</div>
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

    async handleSlotClick(slotIndex, isEmpty) {
        if (this.currentSaveLoadMode === 'save') {
            if (!isEmpty) {
                const slots = SaveManager.getSaveSlots();
                const confirmed = await this.showConfirmDialog(
                    `Overwrite save "${slots[slotIndex].slotName}"?`,
                    'save_overwrite'
                );
                if (!confirmed) {
                    return;
                }
            }

            if (SaveManager.saveToSlot(this.game, slotIndex)) {
                this.showToast('Game saved!', 'success');

                if (this.pendingNewCampaignSave) {
                    this.pendingNewCampaignSave = false;
                    this.hideSaveLoadModal();
                    this.game.start();
                } else {
                    this.hideSaveLoadModal();
                }
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
//                console.error('[UI] Import error:', error);
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

        // Play toast SFX
        if (this.game && this.game.audioManager) {
            this.game.audioManager.play('TOAST_NOTIFICATION');
        }

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
     * Show a custom confirmation dialog
     * @param {string} message - The question/message to display
     * @param {string} [contextKey] - Optional key for "Don't show again" persistence
     * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
     */
    showConfirmDialog(message, contextKey) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirmDialogOverlay');
            const msgEl = document.getElementById('confirmDialogMessage');
            const okBtn = document.getElementById('confirmDialogOk');
            const cancelBtn = document.getElementById('confirmDialogCancel');
            const checkbox = document.getElementById('dontShowAgainCheckbox');
            const checkboxLabel = document.getElementById('dontShowAgainLabel');

            if (!overlay || !msgEl || !okBtn || !cancelBtn) {
                resolve(confirm(message));
                return;
            }

            msgEl.textContent = message;

            if (contextKey) {
                checkboxLabel.style.display = 'flex';
                checkbox.checked = SaveManager.getDismissalPreference(contextKey, false);
            } else {
                checkboxLabel.style.display = 'none';
                checkbox.checked = false;
            }

            overlay.style.display = 'flex';

            const cleanup = () => {
                overlay.style.display = 'none';
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                overlay.removeEventListener('click', onOverlayClick);
            };

            const onOk = () => {
                const dontShow = checkbox.checked;
                if (contextKey && dontShow) {
                    SaveManager.setDismissalPreference(contextKey, true);
                }
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onOverlayClick = (e) => {
                if (e.target === overlay) onCancel();
            };

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            overlay.addEventListener('click', onOverlayClick);
        });
    }

    /**
     * Check if a dismissal preference has been suppressed
     * @param {string} contextKey - The dismissal context key
     * @returns {boolean} True if the user selected "Don't show again"
     */
    isDismissSuppressed(contextKey) {
        return SaveManager.getDismissalPreference(contextKey, false);
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
//            console.error('[Auto-Save] Error:', error);
            return true; // Don't block gameplay on error
        }
    }

    showEndOfPhaseDebrief(phaseDebriefData) {
        if (!this.endOfPhaseScreen || !phaseDebriefData) return;
        this.hideMainMenuScreen();
        this.hidePreMissionScreen();
        this.hidePostMissionScreen();
        this.hideGameOverScreen();
        this.hideRecruitMemorialScreen();

        const txt = this.uiText;

        if (this.phaseDebriefTitle) {
            this.phaseDebriefTitle.textContent = txt.PHASE_DEBRIEF_TITLE || 'PHASE COMPLETE';
        }
        if (this.phaseDebriefSubtitle) {
            this.phaseDebriefSubtitle.textContent = `${phaseDebriefData.phaseName} | ${phaseDebriefData.biome || ''}`;
        }

        this._renderPhaseOverviewTab(phaseDebriefData);
        this._renderPhaseMissionsTab(phaseDebriefData);
        this._renderPhaseRosterTab(phaseDebriefData);
        this._renderPhaseHonorRollTab(phaseDebriefData);

        // Always land on the Overview tab when the screen is (re)shown
        this.phaseDebriefTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'overview'));
        this.phaseDebriefTabContents.forEach(tc => tc.classList.toggle('active', tc.id === 'phaseTabOverview'));

        this.phaseDebriefTabs.forEach(tab => {
            // onclick (not addEventListener) so re-showing the screen each phase doesn't stack duplicate handlers
            tab.onclick = () => {
                this.phaseDebriefTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                this.phaseDebriefTabContents.forEach(tc => {
                    tc.classList.toggle('active', tc.id === 'phaseTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
                });
            };
        });

        if (this.viewMemorialFromPhaseBtn) {
            const hasFallen = phaseDebriefData.totalFallenRaccoons && phaseDebriefData.totalFallenRaccoons.length > 0;
            this.viewMemorialFromPhaseBtn.style.display = hasFallen ? 'inline-block' : 'none';
            this.viewMemorialFromPhaseBtn.onclick = () => this.showRecruitMemorialScreen();
        }

        if (this.continueFromPhaseDebriefBtn) {
            const nextPhaseName = phaseDebriefData.nextPhaseName || 'Next Phase';
            this.continueFromPhaseDebriefBtn.textContent = (txt.BUTTON_TEXT_START_PHASE_PREFIX || 'Start ') + nextPhaseName;
            this.continueFromPhaseDebriefBtn.onclick = () => {
                this.hideEndOfPhaseScreen();
                if (this.game) {
                    if (this.game.currentSaveSlot !== -1) {
                        if (SaveManager.autoSave(this.game)) {
                            this.showToast(`Auto-saved to Slot ${this.game.currentSaveSlot + 1}`, 'success');
                        }
                    }
                    this.game.proceedFromPhaseDebriefToNextMission();
                }
            };
        }

        this.endOfPhaseScreen.style.display = 'flex';
        this.setCursor('default');
    }

    _renderPhaseOverviewTab(data) {
        const txt = this.uiText;
        const narrativeEl = this.endOfPhaseScreen.querySelector('.phase-conclusion-narrative');
        if (narrativeEl) {
            narrativeEl.textContent = data.conclusionText || '';
        }

        const statsGridEl = this.endOfPhaseScreen.querySelector('.phase-stats-grid');
        if (statsGridEl) {
            statsGridEl.innerHTML = '';
            const missionResults = data.missionResults || [];
            const missionsWon = missionResults.filter(m => m.isVictory).length;
            const missionsTotal = missionResults.length;
            const newRecruitCount = (data.newRecruitedRaccoons || []).length;
            const promotedCount = (data.promotedRaccoons || []).length;
            const stats = [
                { label: txt.PHASE_DEBRIEF_MISSIONS_WON || 'Missions Won', value: `${missionsWon}/${missionsTotal}`, cls: (missionsTotal > 0 && missionsWon === missionsTotal) ? 'stat-roster-gain' : '' },
                { label: txt.PHASE_DEBRIEF_ENEMIES_ELIMINATED || 'Enemies Eliminated', value: data.totalEnemiesKilled, cls: '' },
                { label: txt.PHASE_DEBRIEF_HOSTAGES_RESCUED || 'Hostages Rescued', value: data.totalHostagesRescued, cls: '' },
                { label: txt.PHASE_DEBRIEF_CASUALTIES || 'Casualties', value: data.casualtyCount, cls: 'stat-casualties' },
                { label: txt.PHASE_DEBRIEF_NEW_RECRUITS || 'New Recruits', value: newRecruitCount, cls: newRecruitCount > 0 ? 'stat-roster-gain' : '' },
                { label: txt.PHASE_DEBRIEF_PROMOTIONS || 'Promotions', value: promotedCount, cls: promotedCount > 0 ? 'stat-roster-gain' : '' },
                { label: txt.PHASE_DEBRIEF_PHASE_DURATION || 'Phase Duration', value: this._formatDuration(data.phaseDuration), cls: '' },
                { label: txt.PHASE_DEBRIEF_ROSTER_START || 'Roster at Start', value: data.startingRosterCount, cls: '' },
                { label: txt.PHASE_DEBRIEF_ROSTER_END || 'Roster at End', value: data.endingRosterCount, cls: data.endingRosterCount >= data.startingRosterCount ? 'stat-roster-gain' : 'stat-roster-loss' },
            ];
            stats.forEach(s => {
                const card = document.createElement('div');
                card.className = 'phase-stat-card' + (s.cls ? ' ' + s.cls : '');
                card.innerHTML = `<span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span>`;
                statsGridEl.appendChild(card);
            });
        }

        const nextPhaseEl = this.endOfPhaseScreen.querySelector('.next-phase-preview');
        if (nextPhaseEl) {
            if (data.nextPhaseName) {
                const introHtml = data.nextPhaseIntro
                    ? `<div class="next-phase-intro">${data.nextPhaseIntro}</div>`
                    : '';
                nextPhaseEl.innerHTML = `
                    <h4>${txt.PHASE_DEBRIEF_NEXT_PHASE_LABEL || 'Next Phase:'}</h4>
                    <div class="next-phase-name">${data.nextPhaseName}</div>
                    <div class="next-phase-biome">${data.nextPhaseBiome || ''}</div>
                    ${introHtml}
                `;
                nextPhaseEl.style.display = 'flex';
                nextPhaseEl.style.flexDirection = 'column';
            } else {
                nextPhaseEl.innerHTML = '';
                nextPhaseEl.style.display = 'none';
            }
        }

        const topPerformerEl = this.endOfPhaseScreen.querySelector('.phase-top-performer');
        if (topPerformerEl) {
            if (data.topKiller && data.topKillerKills > 0) {
                topPerformerEl.innerHTML = `
                    <h4>${txt.PHASE_DEBRIEF_TOP_KILLER || 'Top Killer'}</h4>
                    <div class="performer-name">${data.topKiller.name}</div>
                    <div class="performer-stats">${data.topKillerKills} ${txt.PHASE_DEBRIEF_KILLS || 'kills'} | ${data.topKiller.rank || 'Recruit'}</div>
                `;
                topPerformerEl.style.display = 'flex';
                topPerformerEl.style.flexDirection = 'column';
            } else {
                topPerformerEl.innerHTML = '';
                topPerformerEl.style.display = 'none';
            }
        }

        const promotionsEl = this.endOfPhaseScreen.querySelector('.phase-promotions');
        if (promotionsEl) {
            const promoted = data.promotedRaccoons || [];
            if (promoted.length > 0) {
                const rows = promoted.map(p => `
                    <div class="promotion-row">
                        <span class="promotion-name">${p.name || 'Unknown'}</span>
                        <span class="promotion-ranks">${p.previousRank ? p.previousRank + ' → ' : ''}${p.rank || ''}</span>
                    </div>`).join('');
                promotionsEl.innerHTML = `
                    <h4>${txt.PHASE_DEBRIEF_PROMOTIONS || 'Promotions'}</h4>
                    <div class="promotion-rows">${rows}</div>
                `;
                promotionsEl.style.display = 'flex';
            } else {
                promotionsEl.innerHTML = '';
                promotionsEl.style.display = 'none';
            }
        }
    }

    _renderPhaseMissionsTab(data) {
        const txt = this.uiText;
        const listEl = this.endOfPhaseScreen.querySelector('#phaseTabMissions .mission-results-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        if (!data.missionResults || data.missionResults.length === 0) {
            listEl.innerHTML = '<div class="honor-roll-empty">No mission data available.</div>';
            return;
        }

        data.missionResults.forEach((mission, idx) => {
            const card = document.createElement('div');
            card.className = 'mission-result-card ' + (mission.isVictory ? 'victory' : 'defeat');

            const outcomeText = mission.isVictory ? (txt.PHASE_DEBRIEF_VICTORY || 'VICTORY') : (txt.PHASE_DEBRIEF_DEFEAT || 'DEFEAT');

            let objectivesHtml = '';
            if (mission.objectives && mission.objectives.length > 0) {
                objectivesHtml = '<div class="mission-result-objectives">' +
                    mission.objectives.map(obj => {
                        const objLabel = obj.type ? obj.type.replace(/_/g, ' ') : 'Unknown';
                        return `<span class="mission-result-obj ${obj.isComplete ? 'completed' : 'failed'}">${objLabel}</span>`;
                    }).join('') +
                    '</div>';
            }

            const fallenCount = mission.fallenRaccoons ? mission.fallenRaccoons.length : 0;
            const fallenNames = fallenCount > 0
                ? mission.fallenRaccoons.map(f => f.name || 'Unknown').join(', ')
                : '';
            const fallenHtml = fallenCount > 0
                ? `<span class="mission-result-kia">KIA: ${fallenCount} (${fallenNames})</span>`
                : `<span>KIA: 0</span>`;

            card.innerHTML = `
                <div class="mission-result-header">
                    <span class="mission-result-name">Mission ${idx + 1}: ${mission.name}</span>
                    <span class="mission-result-outcome ${mission.isVictory ? 'victory' : 'defeat'}">${outcomeText}</span>
                </div>
                <div class="mission-result-stats">
                    <span>Enemies: ${mission.enemiesKilled}</span>
                    <span>Time: ${mission.timeTaken}s</span>
                    ${fallenHtml}
                </div>
                ${objectivesHtml}
            `;
            listEl.appendChild(card);
        });
    }

    _renderPhaseRosterTab(data) {
        const txt = this.uiText;
        const unitList = this.endOfPhaseScreen.querySelector('#phaseRosterUnitList');
        const newRecruitsList = this.endOfPhaseScreen.querySelector('#phaseNewRecruitsList');
        const newRecruitsSection = this.endOfPhaseScreen.querySelector('#phaseNewRecruitsList')?.parentElement;

        if (unitList) {
            unitList.innerHTML = '';
            if (data.totalSurvivingRaccoons && data.totalSurvivingRaccoons.length > 0) {
                data.totalSurvivingRaccoons.forEach(r => {
                    unitList.appendChild(this._createPostMissionRecruitCard(r, 'survivor'));
                });
            }
            if (data.totalFallenRaccoons && data.totalFallenRaccoons.length > 0) {
                data.totalFallenRaccoons.forEach(r => {
                    unitList.appendChild(this._createPostMissionRecruitCard(r, 'fallen'));
                });
            }
            if ((!data.totalSurvivingRaccoons || data.totalSurvivingRaccoons.length === 0) &&
                (!data.totalFallenRaccoons || data.totalFallenRaccoons.length === 0)) {
                unitList.innerHTML = '<div class="no-entry">Roster data unavailable.</div>';
            }
        }

        if (newRecruitsList && newRecruitsSection) {
            newRecruitsList.innerHTML = '';
            if (data.newRecruitedRaccoons && data.newRecruitedRaccoons.length > 0) {
                newRecruitsSection.style.display = 'flex';
                data.newRecruitedRaccoons.forEach(r => {
                    newRecruitsList.appendChild(this._createPostMissionRecruitCard(r, 'new'));
                });
            } else {
                newRecruitsSection.style.display = 'none';
            }
        }
    }

    _renderPhaseHonorRollTab(data) {
        const txt = this.uiText;
        const listEl = this.endOfPhaseScreen.querySelector('.honor-roll-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        if (!data.totalFallenRaccoons || data.totalFallenRaccoons.length === 0) {
            listEl.innerHTML = `<div class="honor-roll-empty">${txt.PHASE_DEBRIEF_NO_CASUALTIES || 'No casualties this phase.'}</div>`;
            return;
        }

        data.totalFallenRaccoons.forEach(r => {
            const card = document.createElement('div');
            card.className = 'honor-roll-card';

            const faceDiv = document.createElement('div');
            faceDiv.className = 'honor-roll-face';
            if (r.faceImageUrl) {
                faceDiv.style.backgroundImage = `url('${r.faceImageUrl}')`;
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'honor-roll-info';
            infoDiv.innerHTML = `
                <div class="honor-roll-name">${r.name || 'Unknown'}</div>
                <div class="honor-roll-details">${r.rank || 'Recruit'}${r.missionName ? ' — ' + r.missionName : ''}</div>
            `;

            const killsDiv = document.createElement('div');
            killsDiv.className = 'honor-roll-kills';
            killsDiv.textContent = `${r.killCount || 0} kills`;

            card.appendChild(faceDiv);
            card.appendChild(infoDiv);
            card.appendChild(killsDiv);
            listEl.appendChild(card);
        });
    }

    _createPhaseDebriefRosterCard(r) {
        const card = document.createElement('div');
        card.className = 'unit-card';

        const spriteSection = document.createElement('div');
        spriteSection.className = 'unit-card-sprite-section';

        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'card-sprite';
        const spriteBaseName = r.spriteBaseName || 'raccoon';
        const spritePath = this._getSpritePathForSprite(r.rank, spriteBaseName);
        const directions = ['se', 's', 'sw', 'w', 'nw', 'n', 'ne', 'e'];
        directions.forEach(dir => {
            const spriteKey = `${spriteBaseName}_idle_${dir}`;
            const spriteUrl = this.game?.preloadedImages?.[spriteKey]
                ? this.game.preloadedImages[spriteKey].src
                : `${spritePath}idle/${spriteBaseName}_idle_${dir}.png`;
            spriteDiv.style.setProperty(`--sprite-${dir}`, `url('${spriteUrl}')`);
        });
        spriteSection.appendChild(spriteDiv);
        card.appendChild(spriteSection);

        const infoRow = document.createElement('div');
        infoRow.className = 'unit-card-info-row';

        const dogtagContainer = document.createElement('div');
        dogtagContainer.className = 'unit-card-dogtag';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'card-details';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = r.name;
        detailsDiv.appendChild(nameDiv);

        const statsRow = document.createElement('div');
        statsRow.className = 'card-stats-row';

        const rankDiv = document.createElement('div');
        rankDiv.className = 'card-rank';
        rankDiv.textContent = r.rank || 'Recruit';
        statsRow.appendChild(rankDiv);

        const rankIconDiv = document.createElement('div');
        rankIconDiv.className = 'card-rank-icon';
        const rankIconConfig = CONFIG.UI_SETTINGS?.RANK_ICON_FILES;
        const rankIconPath = CONFIG.UI_SETTINGS?.RANK_ICON_PATH;
        if (rankIconConfig && rankIconPath && rankIconConfig[r.rank]) {
            rankIconDiv.style.backgroundImage = `url('${rankIconPath}${rankIconConfig[r.rank]}')`;
        }
        statsRow.appendChild(rankIconDiv);

        detailsDiv.appendChild(statsRow);

        const xpDiv = document.createElement('div');
        xpDiv.className = 'card-xp';
        xpDiv.textContent = `XP: ${r.xp || 0}`;
        detailsDiv.appendChild(xpDiv);

        dogtagContainer.appendChild(detailsDiv);
        infoRow.appendChild(dogtagContainer);
        card.appendChild(infoRow);

        return card;
    }

    _formatDuration(seconds) {
        if (!seconds && seconds !== 0) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }

    // --- DEBUG PANEL METHODS ---

    updateDebugPanelVisibility() {
        if (!this.debugPanel || !this.game) return;
        this.debugPanel.style.display = this.game.isDebugVisualsActive ? 'flex' : 'none';
        if (this.game.isDebugVisualsActive) {
            this.syncDebugPanelFromConfig();
        }
    }

    syncDebugPanelFromConfig() {
        if (!this.game) return;
        const setChecked = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!value;
        };
        setChecked('dbgNavGridBlocked', CONFIG.DEBUG_DRAW_NAV_GRID_BLOCKED);
        setChecked('dbgNavGridTiles', CONFIG.DEBUG_DRAW_NAV_GRID_TILES);
        setChecked('dbgSpatialGrid', CONFIG.DEBUG_DRAW_SPATIAL_GRID);
        setChecked('dbgObstacleShapes', CONFIG.DEBUG_DRAW_OBSTACLE_COLLISION_SHAPES);
        setChecked('dbgObstacleNames', CONFIG.DEBUG_DRAW_OBSTACLE_NAMES);
        setChecked('dbgPathingBounds', CONFIG.DEBUG_DRAW_UNIT_PATHING_BOUNDS);
        setChecked('dbgBulletSizes', CONFIG.DEBUG_DRAW_BULLET_SIZES);
        setChecked('dbgHutSpawnAreas', CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_SPAWN_AREAS);
        setChecked('dbgHutStatus', CONFIG.ENEMY_SPAWNING?.POSSUM_HUT_SPAWNING?.DEBUG_DRAW_HUT_STATUS_TEXT);
    }
}