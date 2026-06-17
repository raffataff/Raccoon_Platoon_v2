class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };

        this.isShiftPressed = false;
        this.isCtrlPressed = false;
        this.isLeftMouseDown = false;

        this.lmbDownTime = 0;
        this.TAP_THRESHOLD_MS = CONFIG.INPUT_TAP_THRESHOLD_MS || 150;
        this.isLMBHoldFiringActionActive = false;

        this.isCtrlDragSelecting = false;
        this.ctrlDragStartScreenX = 0;
        this.ctrlDragStartScreenY = 0;
        
        // Dev mode drag state for shootout spawn editing
        this.isDraggingSpawnPoint = false;

        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        this.canvas.addEventListener('mouseleave', (event) => this.handleMouseLeave(event));
        this.canvas.addEventListener('wheel', (event) => {
            if (this.game && this.game.gameState === 'RUNNING') {
                event.preventDefault();
                const scrollDelta = event.deltaY > 0 ? -0.2 : 0.2;
                const currentSpacing = this.game.formationSpacingMultiplier || CONFIG.INITIAL_FORMATION_SPACING || 1.5;
                const newSpacing = Math.max(1.5, Math.min(6.0, currentSpacing + scrollDelta));
                this.game.setFormationSpacing(newSpacing);
                if (this.game.ui && this.game.ui.formationSpacingSlider) {
                    this.game.ui.formationSpacingSlider.value = newSpacing.toString();
                }
                if (this.game.ui && this.game.ui.spacingValueDisplay) {
                    this.game.ui.spacingValueDisplay.textContent = newSpacing.toFixed(1);
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('contextmenu', (event) => {
            // --- MODIFIED: Added mission ending states to the condition ---
            const isGameplayActive = this.game && (
                this.game.gameState === 'RUNNING' ||
                this.game.gameState === 'MISSION_ENDING_VICTORY' ||
                this.game.gameState === 'MISSION_ENDING_DEFEAT'
            );

            if (isGameplayActive) {
                event.preventDefault();

                // Only execute right-click commands if in the 'RUNNING' state
                if (this.game.gameState === 'RUNNING') {
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    if (this.isCtrlDragSelecting) { this.isCtrlDragSelecting = false; this.game.isDragging = false; this.game.draggedFarEnough = false; }


                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = this.canvas.width / rect.width;
                    const scaleY = this.canvas.height / rect.height;

                    const screenX = (event.clientX - rect.left) * scaleX;
                    const screenY = (event.clientY - rect.top) * scaleY;
                    const zoom = this.game.cameraZoom || 1.0;
                    const canvasWidth = this.canvas.width;
                    const canvasHeight = this.canvas.height;
                    const worldX = this.game.cameraX + (screenX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
                    const worldY = this.game.cameraY + (screenY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);

                    if (typeof this.game.handleRightClickCommand === 'function') {
                        this.game.handleRightClickCommand(worldX, worldY);
                    }
                    this.updateMouseCursor();
                }
            }
            // --- END MODIFIED ---
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                if (!this.isShiftPressed) {
                    this.isShiftPressed = true;
                    if (this.isLeftMouseDown && this.isLMBHoldFiringActionActive) {
                        this.game.handleLMBFireActionEnd();
                        this.isLMBHoldFiringActionActive = false;
                    }
                    this.updateMouseCursor();
                }
            } else if (event.key === 'Control' || event.key === 'Meta') {
                if (!this.isCtrlPressed) {
                    this.isCtrlPressed = true;
                    console.log('[DEBUG] Ctrl pressed, isCtrlPressed:', this.isCtrlPressed);
                    if (this.isLeftMouseDown && this.isLMBHoldFiringActionActive) {
                        this.game.handleLMBFireActionEnd();
                        this.isLMBHoldFiringActionActive = false;
                    }
                    this.updateMouseCursor();
                }
            }

            if (!this.game || (this.game.gameState !== 'RUNNING' && this.game.gameState !== 'SHOOTOUT_PLAYING' && this.game.gameState !== 'SHOOTOUT_PAUSED' && this.game.gameState !== 'SHOOTOUT_PRE_GAME' && this.game.gameState !== 'SHOOTOUT_AMBUSH')) {
                if (event.key === 'Escape' && (this.game.gameState === 'PRE_MISSION_SELECT' || this.game.gameState === 'POST_MISSION_DEBRIEF' || this.game.gameState === 'RECRUIT_MEMORIAL' || this.game.gameState === 'END_OF_PHASE_DEBRIEF')) {
                    this.game.quitToMainMenu();
                } else if (event.key === 'Escape' && this.game.gameState === 'PAUSED') {
                    this.game.togglePause();
                }
                return;
            }

            const gameKeys = ['f', 'g', 'h', 't', ' ', 'escape', 'u', 'p', 'r', 'e', 'q', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
            const activeEl = document.activeElement;
            const isInputFieldActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            if (gameKeys.includes(event.key.toLowerCase()) && !isInputFieldActive) {
                event.preventDefault();
            }


            if (event.key === 'Escape') {
                if (this.game.gameState === 'RUNNING') {
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    if (this.isCtrlDragSelecting) { this.isCtrlDragSelecting = false; this.game.isDragging = false; this.game.draggedFarEnough = false; }

                    if (this.game.scentRadialMenu && this.game.scentRadialMenu.isActive) {
                        this.game.isScentMenuKeyHeld = false;
                        this.game.scentRadialMenu.deactivate();
                    } else {
                        const aimingRaccoon = this.game.selectedUnits && this.game.selectedUnits.find(u => u instanceof Raccoon && u.isAimingGrenade);
                        if (aimingRaccoon) {
                            aimingRaccoon.cancelGrenadeAim();
                        } else if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                            this.game.deselectAllUnits();
                        } else {
                            this.game.togglePause();
                        }
                    }
                    this.updateMouseCursor();
                } else if (this.game.gameState === 'SHOOTOUT_PLAYING') {
                    // Handle Escape in Shootout mode - pause the game
                    this.game.toggleShootoutPause();
                }
            }

            if (event.code === 'Space' && !isInputFieldActive) {
                if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                this.game.selectAllPlayerUnits();
            }
            if ((event.key === 'f' || event.key === 'F') && !isInputFieldActive) {
                if (this.game.toggleFormation) this.game.toggleFormation();
            }
            if ((event.key === 't' || event.key === 'T') && !isInputFieldActive) {
                if (this.game.handleAutoBackupCommand) this.game.handleAutoBackupCommand();
            }
            if ((event.key === 'g' || event.key === 'G') && !isInputFieldActive) {
                if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                let anyAiming = this.game.selectedUnits && this.game.selectedUnits.some(u => u instanceof Raccoon && u.isAimingGrenade);
                if (this.game.selectedUnits) this.game.selectedUnits.forEach(unit => {
                    if (unit instanceof Raccoon && unit.isAlive()) { if (anyAiming) unit.cancelGrenadeAim(); else if (unit.grenadeAmmo > 0) unit.startGrenadeAim(); }
                });
                if (this.game.ui) this.game.ui.updateSquadPanel();
                this.updateMouseCursor();
            }
            if ((event.key === 'r' || event.key === 'R') && !isInputFieldActive) {
                // Manual reload for selected raccoons
                if (this.game.selectedUnits) {
                    this.game.selectedUnits.forEach(unit => {
                        if (unit instanceof Raccoon && unit.isAlive() && !unit.isReloading) {
                            const ammoState = unit._getCurrentAmmoState();
                            if (ammoState.reserveAmmo > 0 && ammoState.currentMagazine < ammoState.magazineSize) {
                                unit.startReload();
                            }
                        }
                    });
                }
            }
            if ((event.key === 'e' || event.key === 'E') && !isInputFieldActive) {
                // Intel console interaction
                if (this.game.handleIntelConsoleInteraction) {
                    this.game.handleIntelConsoleInteraction();
                }
                // Possum turret shutdown
                if (this.game.handlePossumTurretShutdown) {
                    this.game.handlePossumTurretShutdown();
                }
            }
            if ((event.key === 'q' || event.key === 'Q') && !isInputFieldActive) {
                if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                if (!this.game.isScentMenuKeyHeld) {
                    this.game.isScentMenuKeyHeld = true;
                    if (this.game.handleScentMenuKeyDown) {
                        this.game.handleScentMenuKeyDown();
                    }
                }
            }
            if ((event.key === 'h' || event.key === 'H') && !isInputFieldActive) {
                const rescuedHostages = this.game.hostageUnits.filter(h => h.isRescued && h.isAlive());
                if (rescuedHostages.length > 0) {
                    const anyHostageFollowing = rescuedHostages.some(h => !h.isHoldingPosition);

                    if (anyHostageFollowing) {
                        rescuedHostages.forEach(h => {
                            h.isHoldingPosition = true;
                            h.isMoving = false;
                            h.currentPath = [];
                        });
                        this.game.trySpeech(rescuedHostages[0], 'ON_HOLD', undefined, true);
                        const raccoons = this.game.getLivingPlayerControlledUnits();
                        if (raccoons && raccoons.length > 0) {
                            const speaker = raccoons[Math.floor(Math.random() * raccoons.length)];
                            this.game.trySpeech(speaker, 'ON_ORDER_HOLD', undefined, true);
                        }
                    } else {
                        rescuedHostages.forEach(h => {
                            h.isHoldingPosition = false;
                        });
                        this.game.trySpeech(rescuedHostages[0], 'ON_FOLLOW', undefined, true);
                        const raccoons = this.game.getLivingPlayerControlledUnits();
                        if (raccoons && raccoons.length > 0) {
                            const speaker = raccoons[Math.floor(Math.random() * raccoons.length)];
                            this.game.trySpeech(speaker, 'ON_ORDER_FOLLOW', undefined, true);
                        }
                    }
                }
            }

            if ((event.key === 'u' || event.key === 'U') && !isInputFieldActive) {
                if (this.isCtrlPressed) {
                    const enemyUnits = this.game.enemyUnits;
                    if (enemyUnits && enemyUnits.length > 0) {
                        enemyUnits.forEach(unit => {
                            if (unit.isAlive() && typeof unit.forcePhaseOut === 'function') {
                                unit.forcePhaseOut(1.0);
                            }
                        });
                    }
                } else {
                    const playerUnits = this.game.getLivingPlayerControlledUnits();
                    if (playerUnits && playerUnits.length > 0) {
                        playerUnits.forEach(unit => {
                            if (unit.isAlive() && typeof unit.forcePhaseOut === 'function') {
                                if (unit instanceof RaccoonHostage && !unit.isRescued) {
                                } else {
                                    unit.forcePhaseOut(1.0);
                                }
                            }
                        });
                    }
                }
            }

            if ((event.key === 'p' || event.key === 'P') && !isInputFieldActive) {
                if (this.game && typeof this.game.toggleDebugVisuals === 'function') {
                    this.game.toggleDebugVisuals();
                }
            }

            const keyNumber = parseInt(event.key, 10);
            if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9 && !isInputFieldActive) {
                console.log('[DEBUG] Number key:', keyNumber, 'Ctrl pressed:', this.isCtrlPressed, 'selectedUnits:', this.game.selectedUnits?.length);
                if (this.isCtrlPressed && keyNumber >= 5) {
                    if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                        const groupIndex = keyNumber - 5;
                        this.game.squadGroups[groupIndex] = [...this.game.selectedUnits];
                        console.log('[DEBUG] Saved squad group', groupIndex, 'with', this.game.squadGroups[groupIndex].length, 'units');
                    }
                } else if (!this.isCtrlPressed && keyNumber >= 5) {
                    const groupIndex = keyNumber - 5;
                    if (this.game.squadGroups[groupIndex]) {
                        const aliveUnits = this.game.squadGroups[groupIndex].filter(u => u.isAlive());
                        if (aliveUnits.length > 0) {
                            if (this.game.selectedUnits) {
                                this.game.selectedUnits.forEach(unit => {
                                    if (unit instanceof Raccoon && unit.isAimingGrenade) {
                                        unit.cancelGrenadeAim();
                                    }
                                });
                            }
                            this.game.selectedUnits = aliveUnits;
                            this.game.ui.updateSquadPanel();
                            this.updateMouseCursor();
                            console.log('[DEBUG] Recalled squad group', groupIndex, 'with', aliveUnits.length, 'units');
                        }
                    }
                } else {
                    if (this.game.deployedSquadRoster && this.game.deployedSquadRoster.length >= keyNumber) {
                        const targetUnit = this.game.deployedSquadRoster[keyNumber - 1];

                        if (targetUnit && targetUnit.isAlive()) {
                            if (this.game.selectedUnits) {
                                this.game.selectedUnits.forEach(unit => {
                                    if (unit instanceof Raccoon && unit.isAimingGrenade) {
                                        unit.cancelGrenadeAim();
                                    }
                                });
                            }

                            this.game.selectedUnits = [targetUnit];

                            this.game.ui.updateSquadPanel();
                            this.updateMouseCursor();
                        }
                    }
                }
            }

            if (!isNaN(keyNumber) && keyNumber === 0 && !isInputFieldActive && !this.isCtrlPressed) {
                console.log('[DEBUG] Recall squad group 5 (key 0), Ctrl:', this.isCtrlPressed);
                const groupIndex = 5;
                if (this.game.squadGroups[groupIndex]) {
                    const aliveUnits = this.game.squadGroups[groupIndex].filter(u => u.isAlive());
                    if (aliveUnits.length > 0) {
                        if (this.game.selectedUnits) {
                            this.game.selectedUnits.forEach(unit => {
                                if (unit instanceof Raccoon && unit.isAimingGrenade) {
                                    unit.cancelGrenadeAim();
                                }
                            });
                        }
                        this.game.selectedUnits = aliveUnits;
                        this.game.ui.updateSquadPanel();
                        this.updateMouseCursor();
                        console.log('[DEBUG] Recalled squad group 5 with', aliveUnits.length, 'units');
                    }
                }
            }

            if (!isNaN(keyNumber) && keyNumber === 0 && this.isCtrlPressed && !isInputFieldActive) {
                console.log('[DEBUG] Save squad group 5 (key 0), Ctrl:', this.isCtrlPressed, 'selectedUnits:', this.game.selectedUnits?.length);
                if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                    const groupIndex = 5;
                    this.game.squadGroups[groupIndex] = [...this.game.selectedUnits];
                    console.log('[DEBUG] Saved squad group 5 with', this.game.squadGroups[groupIndex].length, 'units');
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
            } else if (event.key === 'Control' || event.key === 'Meta') {
                console.log('[DEBUG] Ctrl released, isCtrlPressed:', this.isCtrlPressed);
                this.isCtrlPressed = false;
                if (this.isCtrlDragSelecting) {
                    if (this.game.draggedFarEnough) this.game.selectUnitsInCtrlDragRectangle();
                    this.isCtrlDragSelecting = false;
                    this.game.isDragging = false;
                    this.game.draggedFarEnough = false;
                }
            } else if (event.key === 'q' || event.key === 'Q') {
                this.game.isScentMenuKeyHeld = false;
                if (this.game.handleScentMenuKeyUp) {
                    this.game.handleScentMenuKeyUp();
                }
            }
            this.updateMouseCursor();
        });
    }

    _updateMousePositions(event) {
        /* ... (Unchanged from previous complete version) ... */
        const rect = this.canvas.getBoundingClientRect();
        const mouseXRelative = event.clientX - rect.left;
        const mouseYRelative = event.clientY - rect.top;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.mousePos.screenX = mouseXRelative * scaleX;
        this.mousePos.screenY = mouseYRelative * scaleY;

        if (this.game && this.game.gameState === 'RUNNING') {
            const zoom = this.game.cameraZoom || 1.0;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            this.mousePos.worldX = this.game.cameraX + (this.mousePos.screenX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
            this.mousePos.worldY = this.game.cameraY + (this.mousePos.screenY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);
        } else {
            this.mousePos.worldX = this.mousePos.screenX;
            this.mousePos.worldY = this.mousePos.screenY;
        }
    }


    handleMouseDown(event) {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.game) return;
        
        // Handle Shootout Mode input (both PLAYING and PRE_GAME for dev mode)
        if (this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_PAUSED' || this.game.gameState === 'SHOOTOUT_AMBUSH') {
            event.preventDefault();
            this._updateMousePositions(event);
            
            // Only handle mouse for PAUSED state - just return to not process mouse events while paused
            if (this.game.gameState === 'SHOOTOUT_PAUSED') {
                return;
            }
            
            // Check if in dev mode for drag editing (works in both PRE_GAME and PLAYING states)
            if (this.game.shootoutController && this.game.shootoutController.isDevMode) {
                if (event.button === 0) { // Left Mouse Button
                    const handled = this.game.shootoutController.handleDevModeMouseDown(
                        this.mousePos.screenX, this.mousePos.screenY
                    );
                    if (handled) {
                        this.isDraggingSpawnPoint = true;
                        return;
                    }
                }
            }
            
            // Handle fire in PLAYING and AMBUSH states
            if ((this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_AMBUSH') && event.button === 0 && this.game.shootoutController) {
                this.game.shootoutController.handleFire();
            }
            return;
        }
        
        if (this.game.gameState !== 'RUNNING') return;
        event.preventDefault();
        this._updateMousePositions(event);

        if (event.button === 0) { // Left Mouse Button
            this.isLeftMouseDown = true;
            this.lmbDownTime = performance.now();
            this.isLMBHoldFiringActionActive = false;

            const aimingRaccoons = this.game.selectedUnits ? this.game.selectedUnits.filter(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive()) : [];
            if (aimingRaccoons.length > 0) {
                this.game.handleGrenadeThrowConfirm(this.mousePos.worldX, this.mousePos.worldY);
            } else if (this.isCtrlPressed) {
                this.isCtrlDragSelecting = true;
                this.game.isDragging = true;
                this.game.draggedFarEnough = false;
                this.game.dragStartX = this.mousePos.screenX;
                this.game.dragStartY = this.mousePos.screenY;
                this.game.dragCurrentX = this.game.dragStartX;
                this.game.dragCurrentY = this.game.dragStartY;
            } else if (this.isShiftPressed) {
                const enemyUnit = this.getEnemyUnitUnderCursor(this.mousePos.worldX, this.mousePos.worldY);
                if (enemyUnit) {
                    this.game.handleSetManualTargetCommand(enemyUnit);
                }
            } else {
                this.game.handleLMBFireActionStart(this.mousePos.worldX, this.mousePos.worldY);
            }
        }
        this.updateMouseCursor();
    }

    handleMouseMove(event) {
        /* ... (Unchanged from previous version) ... */
        if (!this.game) return;
        this._updateMousePositions(event);

        // Handle Shootout Mode crosshair tracking (both PLAYING and PRE_GAME for dev mode)
        if (this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_AMBUSH') {
            // Handle dev mode dragging (works in both states)
            if (this.game.shootoutController && this.game.shootoutController.isDevMode) {
                if (this.isDraggingSpawnPoint) {
                    this.game.shootoutController.handleDevModeMouseMove(
                        this.mousePos.screenX, this.mousePos.screenY
                    );
                    return;
                }
            }
            
            // Update crosshair in PLAYING and AMBUSH states
            if ((this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_AMBUSH') && this.game.shootoutController) {
                this.game.shootoutController.handleMouseMove(this.mousePos.screenX, this.mousePos.screenY);
            }
            return;
        }

        if (this.game.gameState === 'RUNNING') {
            const aimingRaccoon = this.game.selectedUnits && this.game.selectedUnits.find(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
            if (aimingRaccoon) {
            } else if (this.isCtrlPressed && this.isLeftMouseDown && this.isCtrlDragSelecting) {
                this.game.dragCurrentX = this.mousePos.screenX;
                this.game.dragCurrentY = this.mousePos.screenY;
                if (!this.game.draggedFarEnough &&
                    distance(this.game.dragStartX, this.game.dragStartY, this.game.dragCurrentX, this.game.dragCurrentY) > this.game.DRAG_THRESHOLD) {
                    this.game.draggedFarEnough = true;
                }
            } else if (this.isLeftMouseDown && !this.isShiftPressed && !this.isCtrlPressed) {
                if (!this.isLMBHoldFiringActionActive && (performance.now() - this.lmbDownTime > this.TAP_THRESHOLD_MS)) {
                    this.isLMBHoldFiringActionActive = true;
                    this.game.updateLMBFireActionTarget(this.mousePos.worldX, this.mousePos.worldY);
                } else if (this.isLMBHoldFiringActionActive) {
                    this.game.updateLMBFireActionTarget(this.mousePos.worldX, this.mousePos.worldY);
                }
            }
        }
        this.updateMouseCursor();
    }

    handleMouseUp(event) {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.game) return;
        
        // Handle dev mode dragging for shootout mode (both PLAYING and PRE_GAME states)
        if ((this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_PRE_GAME' || this.game.gameState === 'SHOOTOUT_AMBUSH') && event.button === 0) {
            if (this.isDraggingSpawnPoint && this.game.shootoutController) {
                this.game.shootoutController.handleDevModeMouseUp();
                this.isDraggingSpawnPoint = false;
                return;
            }
        }
        
        if (this.game.gameState !== 'RUNNING') return;

        if (event.button === 0) { // Left Mouse Button
            const wasLMBDown = this.isLeftMouseDown;
            this.isLeftMouseDown = false;

            if (wasLMBDown) {
                const aimingRaccoon = this.game.selectedUnits && this.game.selectedUnits.find(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
                if (aimingRaccoon) {
                } else if (this.isCtrlPressed && this.isCtrlDragSelecting) {
                    if (this.game.draggedFarEnough) {
                        this.game.selectUnitsInCtrlDragRectangle();
                    }
                } else if (this.isShiftPressed) {
                } else {
                    this.game.handleLMBFireActionEnd();
                }
            }
            this.isLMBHoldFiringActionActive = false;
            this.isCtrlDragSelecting = false;
            if (this.game.isDragging && !this.isCtrlPressed) {
                this.game.isDragging = false;
                this.game.draggedFarEnough = false;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseLeave(event) {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.game) return;
        if (this.isLeftMouseDown && this.game.gameState === 'RUNNING') {
            if (this.isLMBHoldFiringActionActive && !this.isShiftPressed && !this.isCtrlPressed) {
                this.game.handleLMBFireActionEnd();
                this.isLMBHoldFiringActionActive = false;
            }
            if (this.isCtrlDragSelecting) {
                this.isCtrlDragSelecting = false;
                this.game.isDragging = false;
                this.game.draggedFarEnough = false;
            }
            this.isLeftMouseDown = false;
        }
        this.updateMouseCursor();
    }

    getEnemyUnitUnderCursor(worldX, worldY) {
        /* ... (Unchanged from previous complete version) ... */
        if (this.game && this.game.enemyUnits) {
            for (const enemy of this.game.enemyUnits) {
                if (enemy.isAlive() && distance(worldX, worldY, enemy.x, enemy.y) < enemy.size + 7) {
                    return enemy;
                }
            }
        }
        return null;
    }

    updateMouseCursor() {
        /* ... (Unchanged from previous complete version) ... */
        if (!this.game || !this.game.ui) {
            if (this.game && this.game.ui) this.game.ui.setCursor('default');
            return;
        }
        if (this.game.gameState !== 'RUNNING' && this.game.gameState !== 'PAUSED') {
            this.game.ui.setCursor('default');
            return;
        }
        if (this.game.gameState === 'PAUSED') {
            this.game.ui.setCursor('default');
            return;
        }


        const isAimingGrenade = this.game.selectedUnits && this.game.selectedUnits.some(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
        if (isAimingGrenade) {
            this.game.ui.setCursor('cell');
            return;
        }

        if (this.isShiftPressed) {
            const enemyUnderCursor = this.getEnemyUnitUnderCursor(this.mousePos.worldX, this.mousePos.worldY);
            if (enemyUnderCursor) {
                this.game.ui.setCursor('target-enemy-hover');
            } else {
                this.game.ui.setCursor('target-mode-default');
            }
        } else if (this.isLeftMouseDown && !this.isCtrlPressed) {
            this.game.ui.setCursor('attack');
        } else {
            this.game.ui.setCursor('default');
        }
    }
}