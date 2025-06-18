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


        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        this.canvas.addEventListener('mouseleave', (event) => this.handleMouseLeave(event));
        this.canvas.addEventListener('contextmenu', (event) => {
            if (this.game && this.game.gameState === 'RUNNING') {
                event.preventDefault();
                if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                if (this.isCtrlDragSelecting) { this.isCtrlDragSelecting = false; this.game.isDragging = false; this.game.draggedFarEnough = false;}


                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;

                const screenX = (event.clientX - rect.left) * scaleX;
                const screenY = (event.clientY - rect.top) * scaleY;
                const worldX = screenX + this.game.cameraX;
                const worldY = screenY + this.game.cameraY;

                if (typeof this.game.handleRightClickCommand === 'function') {
                    this.game.handleRightClickCommand(worldX, worldY);
                }
                this.updateMouseCursor();
            }
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
                    if (this.isLeftMouseDown && this.isLMBHoldFiringActionActive) {
                        this.game.handleLMBFireActionEnd();
                        this.isLMBHoldFiringActionActive = false;
                    }
                    this.updateMouseCursor();
                }
            }

            if (!this.game || this.game.gameState !== 'RUNNING') {
                 if (event.key === 'Escape' && (this.game.gameState === 'PRE_MISSION_SELECT' || this.game.gameState === 'POST_MISSION_DEBRIEF' || this.game.gameState === 'RECRUIT_MEMORIAL')) {
                    this.game.quitToMainMenu();
                } else if (event.key === 'Escape' && this.game.gameState === 'PAUSED') {
                     this.game.togglePause();
                }
                return;
            }

            const gameKeys = ['f', 'g', 'h', ' ', 'escape', 'u', '1', '2', '3', '4']; // Added number keys
            const activeEl = document.activeElement;
            const isInputFieldActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            if (gameKeys.includes(event.key.toLowerCase()) && !isInputFieldActive) {
                event.preventDefault();
            }


            if (event.key === 'Escape') {
                if (this.game.gameState === 'RUNNING') {
                    if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                    if (this.isCtrlDragSelecting) { this.isCtrlDragSelecting = false; this.game.isDragging = false; this.game.draggedFarEnough = false; }
                    
                    const aimingRaccoon = this.game.selectedUnits && this.game.selectedUnits.find(u => u instanceof Raccoon && u.isAimingGrenade);
                    if (aimingRaccoon) {
                        aimingRaccoon.cancelGrenadeAim();
                    } else if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                        this.game.deselectAllUnits();
                    } else {
                        this.game.togglePause();
                    }
                    this.updateMouseCursor();
                }
            }

            if (event.code === 'Space' && !isInputFieldActive) {
                if (this.isLMBHoldFiringActionActive) { this.game.handleLMBFireActionEnd(); this.isLMBHoldFiringActionActive = false; }
                this.game.selectAllPlayerUnits();
            }
            if ((event.key === 'f' || event.key === 'F') && !isInputFieldActive) {
                 if (this.game.toggleFormation) this.game.toggleFormation();
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
                    } else { 
                        rescuedHostages.forEach(h => {
                            h.isHoldingPosition = false;
                        });
                    }
                }
            }
            if ((event.key === 'u' || event.key === 'U') && !isInputFieldActive) {
                if (this.game.selectedUnits && this.game.selectedUnits.length > 0) {
                    console.log("'U' key pressed. Forcing phase out for selected units.");
                    this.game.selectedUnits.forEach(unit => {
                        if ((unit instanceof Raccoon || (unit instanceof RaccoonHostage && unit.isRescued)) && unit.isAlive()) {
                            if (typeof unit.forcePhaseOut === 'function') {
                                unit.forcePhaseOut(1.0); // Phase for 1 second
                            }
                        }
                    });
                }
            }
            
            // --- NEW: Handle squad member selection via number keys ---
            const keyNumber = parseInt(event.key, 10);
            if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9 && !isInputFieldActive) { // Support up to 9 units
                // Check if the game and deployed squad exist
                if (this.game.deployedSquadRoster && this.game.deployedSquadRoster.length >= keyNumber) {
                    const targetUnit = this.game.deployedSquadRoster[keyNumber - 1];
                    
                    // Check if the target unit is valid and alive
                    if (targetUnit && targetUnit.isAlive()) {
                        // Cancel any pending actions on the currently selected units
                        if (this.game.selectedUnits) {
                            this.game.selectedUnits.forEach(unit => {
                                if (unit instanceof Raccoon && unit.isAimingGrenade) {
                                    unit.cancelGrenadeAim();
                                }
                            });
                        }
                        
                        // Replace the current selection with the new unit
                        this.game.selectedUnits = [targetUnit];
                        
                        // Update UI to reflect the new selection
                        this.game.ui.updateSquadPanel();
                        this.updateMouseCursor();
                    }
                }
            }
            // --- END NEW ---
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
            } else if (event.key === 'Control' || event.key === 'Meta') {
                this.isCtrlPressed = false;
                if (this.isCtrlDragSelecting) {
                    if(this.game.draggedFarEnough) this.game.selectUnitsInCtrlDragRectangle();
                    this.isCtrlDragSelecting = false;
                    this.game.isDragging = false;
                    this.game.draggedFarEnough = false;
                }
            }
            this.updateMouseCursor();
        });
    }

    _updateMousePositions(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseXRelative = event.clientX - rect.left;
        const mouseYRelative = event.clientY - rect.top;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.mousePos.screenX = mouseXRelative * scaleX;
        this.mousePos.screenY = mouseYRelative * scaleY;

        if (this.game && this.game.gameState === 'RUNNING') {
            this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
            this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;
        } else {
            this.mousePos.worldX = this.mousePos.screenX;
            this.mousePos.worldY = this.mousePos.screenY;
        }
    }


    handleMouseDown(event) {
        if (!this.game || this.game.gameState !== 'RUNNING') return;
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
        if (!this.game) return;
        this._updateMousePositions(event);

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
        if (!this.game || this.game.gameState !== 'RUNNING') return;

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
            if(this.game.isDragging && !this.isCtrlPressed) { 
                this.game.isDragging = false;
                this.game.draggedFarEnough = false;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseLeave(event) {
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
        if (!this.game || !this.game.ui ) {
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