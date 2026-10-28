class InputHandler {
    // Rebindable actions that address a slot by index (CONFIG.KEY_BINDINGS.ACTIONS).
    static SELECT_UNIT_ACTIONS = ['SELECT_UNIT_1', 'SELECT_UNIT_2', 'SELECT_UNIT_3', 'SELECT_UNIT_4'];
    static SQUAD_GROUP_ACTIONS = ['SQUAD_GROUP_1', 'SQUAD_GROUP_2', 'SQUAD_GROUP_3', 'SQUAD_GROUP_4', 'SQUAD_GROUP_5', 'SQUAD_GROUP_6'];

    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
        this.invertWheel = false; // Options → Controls (applied by UI)

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
                const scrollDelta = (event.deltaY > 0 ? -0.2 : 0.2) * (this.invertWheel ? -1 : 1);
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


                    // Logical (CSS px) canvas coords — canvas.width/height is the HiDPI backing store.
                    const viewPos = this.game.clientToView(event.clientX, event.clientY);
                    const screenX = viewPos.x;
                    const screenY = viewPos.y;
                    const zoom = this.game.cameraZoom || 1.0;
                    const canvasWidth = this.game.viewWidth;
                    const canvasHeight = this.game.viewHeight;
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

            const activeEl = document.activeElement;
            const isInputFieldActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            // Rebindable keys resolve through game.keyBindings (Options → Controls).
            const action = this.game.keyBindings ? this.game.keyBindings.actionFor(event) : null;

            if ((action || event.key === 'Escape') && !isInputFieldActive) {
                event.preventDefault();
            }


            if (event.key === 'Escape') {
                if (this.game.gameState === 'RUNNING') {
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    if (this.isCtrlDragSelecting) { this.isCtrlDragSelecting = false; this.game.isDragging = false; this.game.draggedFarEnough = false; }

                    if (this.game.grenadeRadialMenu && this.game.grenadeRadialMenu.isActive) {
                        this.game.isGrenadeMenuKeyHeld = false;
                        this.game._grenadeMenuPendingSince = null;
                        this.game.grenadeRadialMenu.deactivate();
                    } else if (this.game.scentRadialMenu && this.game.scentRadialMenu.isActive) {
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

            if (!action || isInputFieldActive) return;
            switch (action) {
                case 'SELECT_ALL':
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    this.game.selectAllPlayerUnits();
                    break;
                case 'TOGGLE_FORMATION':
                    if (this.game.toggleFormation) this.game.toggleFormation();
                    break;
                case 'CALL_BACKUP':
                    if (this.game.handleAutoBackupCommand) this.game.handleAutoBackupCommand();
                    break;
                case 'GRENADE':
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    // Hold-to-open grenade radial menu; quick tap = aim last-selected type.
                    // Guard against keydown auto-repeat while held.
                    if (!this.game.isGrenadeMenuKeyHeld) {
                        this.game.isGrenadeMenuKeyHeld = true;
                        if (this.game.handleGrenadeMenuKeyDown) {
                            this.game.handleGrenadeMenuKeyDown();
                        }
                    }
                    break;
                case 'RELOAD':
                    this._reloadSelectedUnits();
                    break;
                case 'INTERACT':
                    // Intel console hack, possum turret shutdown, anti-air turret shutdown.
                    if (this.game.handleIntelConsoleInteraction) this.game.handleIntelConsoleInteraction();
                    if (this.game.handlePossumTurretShutdown) this.game.handlePossumTurretShutdown();
                    if (this.game.handlePossumAntiAirTurretShutdown) this.game.handlePossumAntiAirTurretShutdown();
                    break;
                case 'SCENT_MARKER':
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    if (!this.game.isScentMenuKeyHeld) {
                        this.game.isScentMenuKeyHeld = true;
                        if (this.game.handleScentMenuKeyDown) {
                            this.game.handleScentMenuKeyDown();
                        }
                    }
                    break;
                case 'HOSTAGE_ORDER':
                    this._toggleHostageHold();
                    break;
                case 'PHASE_OUT':
                    this._forcePhaseOut();
                    break;
                case 'DEBUG_VISUALS':
                    if (typeof this.game.toggleDebugVisuals === 'function') this.game.toggleDebugVisuals();
                    break;
                default: {
                    const unitIndex = InputHandler.SELECT_UNIT_ACTIONS.indexOf(action);
                    if (unitIndex >= 0) {
                        this._selectSquadMember(unitIndex);
                        break;
                    }
                    const groupIndex = InputHandler.SQUAD_GROUP_ACTIONS.indexOf(action);
                    if (groupIndex >= 0) this._useSquadGroup(groupIndex);
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
            } else {
                const action = this.game && this.game.keyBindings ? this.game.keyBindings.actionFor(event) : null;
                if (action === 'SCENT_MARKER') {
                    this.game.isScentMenuKeyHeld = false;
                    if (this.game.handleScentMenuKeyUp) {
                        this.game.handleScentMenuKeyUp();
                    }
                } else if (action === 'GRENADE') {
                    this.game.isGrenadeMenuKeyHeld = false;
                    if (this.game.handleGrenadeMenuKeyUp) {
                        this.game.handleGrenadeMenuKeyUp();
                    }
                }
            }
            this.updateMouseCursor();
        });
    }

    _reloadSelectedUnits() {
        if (!this.game.selectedUnits) return;
        this.game.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAlive() && !unit.isReloading) {
                const ammoState = unit._getCurrentAmmoState();
                if (ammoState.reserveAmmo > 0 && ammoState.currentMagazine < ammoState.magazineSize) {
                    unit.startReload();
                }
            }
        });
    }

    _toggleHostageHold() {
        const rescuedHostages = this.game.hostageUnits.filter(h => h.isRescued && h.isAlive());
        if (rescuedHostages.length === 0) return;
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

    // Squad (or, with Ctrl, every enemy) ghosts through obstacles for a second.
    _forcePhaseOut() {
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
                        if (!(unit instanceof RaccoonHostage && !unit.isRescued)) {
                            unit.forcePhaseOut(1.0);
                        }
                    }
                });
            }
        }
    }

    _cancelSelectedGrenadeAims() {
        if (!this.game.selectedUnits) return;
        this.game.selectedUnits.forEach(unit => {
            if (unit instanceof Raccoon && unit.isAimingGrenade) {
                unit.cancelGrenadeAim();
            }
        });
    }

    // Select one squad member by roster slot (SELECT_UNIT_n, 0-based index).
    _selectSquadMember(index) {
        const roster = this.game.deployedSquadRoster;
        const targetUnit = roster && roster[index];
        if (!targetUnit || !targetUnit.isAlive()) return;
        this._cancelSelectedGrenadeAims();
        this.game.selectedUnits = [targetUnit];
        this.game.ui.updateSquadPanel();
        this.updateMouseCursor();
    }

    // SQUAD_GROUP_n: Ctrl saves the current selection as the group, otherwise recall it.
    _useSquadGroup(groupIndex) {
        if (this.isCtrlPressed) {
            if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                this.game.squadGroups[groupIndex] = [...this.game.selectedUnits];
            }
            return;
        }
        const group = this.game.squadGroups[groupIndex];
        if (!group) return;
        const aliveUnits = group.filter(u => u.isAlive());
        if (aliveUnits.length === 0) return;
        this._cancelSelectedGrenadeAims();
        this.game.selectedUnits = aliveUnits;
        this.game.ui.updateSquadPanel();
        this.updateMouseCursor();
    }

    _updateMousePositions(event) {
        // Logical (CSS px) canvas coords — canvas.width/height is the HiDPI backing store.
        const viewPos = this.game.clientToView(event.clientX, event.clientY);
        this.mousePos.screenX = viewPos.x;
        this.mousePos.screenY = viewPos.y;

        if (this.game && this.game.gameState === 'RUNNING') {
            const zoom = this.game.cameraZoom || 1.0;
            const canvasWidth = this.game.viewWidth;
            const canvasHeight = this.game.viewHeight;
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
        const shootout = this.game.shootoutController;
        if ((this.game.gameState === 'SHOOTOUT_PLAYING' || this.game.gameState === 'SHOOTOUT_AMBUSH') &&
            shootout && shootout.isRoundActive && !shootout.isDevMode) {
            this.game.ui.setCursor('crosshair');
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