// js/input.js
// complete
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
        this.isShiftPressed = false;
        this.isCtrlPressed = false;
        this.isLeftMouseDown = false;

        this.shiftLmbDownTime = 0;
        this.TAP_THRESHOLD_MS = CONFIG.INPUT_TAP_THRESHOLD_MS || 30;
        this.isShiftHoldFiring = false;

        // SCALED screen coordinates at mousedown
        this.mouseDownScreenX = 0;
        this.mouseDownScreenY = 0;

        // Unscaled screen coordinates for visual drag box drawing
        this.visualDragStartUnscaledX = 0;
        this.visualDragStartUnscaledY = 0;


        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        this.canvas.addEventListener('mouseleave', (event) => this.handleMouseLeave(event));
        this.canvas.addEventListener('contextmenu', (event) => {
            // Always prevent default for canvas context menu if game is running
            if (this.game && this.game.gameState === 'RUNNING') {
                event.preventDefault();
                if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
                if (this.game.isDragging) { this.game.isDragging = false; this.game.draggedFarEnough = false; }

                // _updateMousePositions IS NOT NEEDED HERE because right-click is a single point event.
                // We get coords directly.
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
            // If not in 'RUNNING' state, allow default context menu for browser dev tools etc.
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                if (!this.isShiftPressed) {
                    this.isShiftPressed = true;
                    if (this.isLeftMouseDown && this.game.gameState === 'RUNNING' && this.game.selectedUnits && this.game.selectedUnits.length > 0 && !this.isShiftHoldFiring) {
                        this.shiftLmbDownTime = performance.now();
                    }
                }
                this.updateMouseCursor();
            }
            if (event.key === 'Control' || event.key === 'Meta') { this.isCtrlPressed = true; }

            if (!this.game || this.game.gameState !== 'RUNNING') return; // Gameplay keybinds only in RUNNING
            if (['Escape', 'f', 'F', 'g', 'G'].includes(event.key) || event.code === 'Space') { // Allow space if not input field focused
                const activeEl = document.activeElement;
                if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
                    event.preventDefault();
                }
            }


        //    if (event.key === 'Escape') {
        //        if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
        //        this.game.deselectAllUnits();
        //    }
            if (event.key === 'Escape') {
                if (this.game.gameState === 'RUNNING' || this.game.gameState === 'PAUSED') {
                    event.preventDefault(); // Prevent default browser behavior for Esc
                    this.game.togglePause();
                } else if (this.game.gameState === 'PRE_MISSION_SELECT' || this.game.gameState === 'POST_MISSION_DEBRIEF') {
                    // Optional: Esc to go back to main menu from these screens
                    // this.game.quitToMainMenu();
                }
            }
            
            if (event.code === 'Space') {
                 const activeEl = document.activeElement;
                if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
                    if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
                    this.game.selectAllPlayerUnits();
                }
            }
            if (event.key === 'f' || event.key === 'F') { if (this.game.toggleFormation) this.game.toggleFormation(); }
            if (event.key === 'g' || event.key === 'G') {
                if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
                let anyAiming = this.game.selectedUnits && this.game.selectedUnits.some(u => u instanceof Raccoon && u.isAimingGrenade);
                if (this.game.selectedUnits) this.game.selectedUnits.forEach(unit => {
                    if (unit instanceof Raccoon && unit.isAlive()) { if (anyAiming) unit.cancelGrenadeAim(); else if (unit.grenadeAmmo > 0) unit.startGrenadeAim(); }
                });
                if (this.game.ui) this.game.ui.updateSquadPanel();
                this.updateMouseCursor();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                if (this.isShiftPressed) {
                    this.isShiftPressed = false;
                    if (this.isShiftHoldFiring) {
                        this.game.handleShiftHoldEnd();
                        this.isShiftHoldFiring = false;
                    }
                }
                this.updateMouseCursor();
            }
            if (event.key === 'Control' || event.key === 'Meta') { this.isCtrlPressed = false; }
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
        } else { // For UI screens, world coords are same as screen
            this.mousePos.worldX = this.mousePos.screenX;
            this.mousePos.worldY = this.mousePos.screenY;
        }
    }


    handleMouseDown(event) {
        // Allow mousedown for UI interactions on non-running screens if needed by game logic later
        // For now, most UI is button elements handled by ui.js
        if (!this.game) return;
        // if (this.game.gameState !== 'RUNNING') return; // Keep this to restrict gameplay mouse actions

        this._updateMousePositions(event); // Update all mousePos, including scaled screenX/Y

        // Store the SCALED screen coordinates for initiating actions like click
        this.mouseDownScreenX = this.mousePos.screenX;
        this.mouseDownScreenY = this.mousePos.screenY;

        // For visual drag box, store unscaled relative to canvas element
        const rect = this.canvas.getBoundingClientRect();
        this.visualDragStartUnscaledX = event.clientX - rect.left;
        this.visualDragStartUnscaledY = event.clientY - rect.top;


        if (event.button === 0) { // Left mouse button
            if (this.game.gameState !== 'RUNNING') return; // Gameplay actions only in RUNNING state
            event.preventDefault(); // Prevent default for gameplay interactions

            this.isLeftMouseDown = true;
            this.isShiftHoldFiring = false;

            if (this.isShiftPressed) {
                this.shiftLmbDownTime = performance.now();
                this.game.isDragging = false; this.game.draggedFarEnough = false;
            } else {
                this.game.isDragging = true; this.game.draggedFarEnough = false;
                // Game's dragStart/Current are for the visual box, use unscaled.
                this.game.dragStartX = this.visualDragStartUnscaledX;
                this.game.dragStartY = this.visualDragStartUnscaledY;
                this.game.dragCurrentX = this.game.dragStartX;
                this.game.dragCurrentY = this.game.dragStartY;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseMove(event) {
        if (!this.game) return;
        this._updateMousePositions(event);

        if (this.game.gameState === 'RUNNING') {
            if (this.isShiftPressed && this.isLeftMouseDown && !this.isShiftHoldFiring) {
                const rect = this.canvas.getBoundingClientRect(); // Needed for unscaled mouse pos
                const unscaledMouseX = event.clientX - rect.left;
                const unscaledMouseY = event.clientY - rect.top;

                if ((performance.now() - this.shiftLmbDownTime > (this.TAP_THRESHOLD_MS || 150)) ||
                    distance(this.visualDragStartUnscaledX, this.visualDragStartUnscaledY, unscaledMouseX, unscaledMouseY) > (this.game.DRAG_THRESHOLD || 5) / 2) {
                    this.isShiftHoldFiring = true;
                    this.game.handleShiftHoldStart(this.mousePos.worldX, this.mousePos.worldY);
                }
            }
            if (this.isShiftHoldFiring) {
                this.game.updateShiftHoldTarget(this.mousePos.worldX, this.mousePos.worldY);
            }
        }

        if (this.game.isDragging && !this.isShiftPressed && this.game.gameState === 'RUNNING') {
            const rect = this.canvas.getBoundingClientRect();
            this.game.dragCurrentX = event.clientX - rect.left;
            this.game.dragCurrentY = event.clientY - rect.top;
            if (!this.game.draggedFarEnough &&
                distance(this.game.dragStartX, this.game.dragStartY, this.game.dragCurrentX, this.game.dragCurrentY) > this.game.DRAG_THRESHOLD) {
                this.game.draggedFarEnough = true;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseUp(event) {
        if (!this.game) return;
        // _updateMousePositions would have been called by mousemove or mousedown.
        // this.mousePos is current.

        // SCALED original mousedown coordinates for click logic
        const originalMouseDownWorldX = this.mouseDownScreenX + (this.game.gameState === 'RUNNING' ? this.game.cameraX : 0);
        const originalMouseDownWorldY = this.mouseDownScreenY + (this.game.gameState === 'RUNNING' ? this.game.cameraY : 0);

        if (event.button === 0) { // Left mouse button released
            if (this.game.gameState !== 'RUNNING') return; // Gameplay actions only in RUNNING state
            event.preventDefault(); // Prevent default for gameplay interactions

            const wasMouseDown = this.isLeftMouseDown;
            this.isLeftMouseDown = false;

            if (wasMouseDown) {
                if (this.isShiftHoldFiring) {
                    this.game.handleShiftHoldEnd();
                    this.isShiftHoldFiring = false;
                } else if (this.isShiftPressed) {
                    this.game.handleShiftFireAtPointCommand(this.mousePos.worldX, this.mousePos.worldY);
                } else {
                    if (this.game.isDragging && this.game.draggedFarEnough) {
                        this.game.selectUnitsInDragRectangle(); // This method in game.js needs to handle scaling of dragStart/Current
                    } else {
                        this.game.handlePrimaryLeftClick(originalMouseDownWorldX, originalMouseDownWorldY);
                    }
                }
            }
            this.game.isDragging = false; this.game.draggedFarEnough = false;
        }
        this.updateMouseCursor();
    }

    handleMouseLeave(event) {
        if (!this.game) return;
        if (this.isLeftMouseDown && this.game.gameState === 'RUNNING') {
            if (this.isShiftHoldFiring) {
                this.game.handleShiftHoldEnd();
                this.isShiftHoldFiring = false;
            }
            this.isLeftMouseDown = false;
        }
        if (this.game.isDragging) { this.game.isDragging = false; this.game.draggedFarEnough = false; }
        if (this.game.ui) this.game.ui.setCursor('default');
    }

    updateMouseCursor() {
        if (!this.game || !this.game.ui ) { // Removed gameState check here, cursor should update on other screens too
            if (this.game && this.game.ui) this.game.ui.setCursor('default');
            return;
        }
        if (this.game.gameState !== 'RUNNING') { // If not running, default cursor
             this.game.ui.setCursor('default');
             return;
        }

        const isAimingGrenade = this.game.selectedUnits && this.game.selectedUnits.some(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
        if (isAimingGrenade) { this.game.ui.setCursor('cell'); return; }

        if ((this.isShiftPressed || this.isShiftHoldFiring) && this.game.selectedUnits && this.game.selectedUnits.length > 0) {
            this.game.ui.setCursor('attack');
            return;
        }
        let overEnemy = false;
        if (this.game.enemyUnits && this.mousePos && this.mousePos.screenX !== undefined) {
            for (const enemy of this.game.enemyUnits) {
                if (enemy.isAlive()) {
                    const enemyScreenX = enemy.x - this.game.cameraX;
                    const enemyScreenY = enemy.y - this.game.cameraY;
                    if (distance(this.mousePos.screenX, this.mousePos.screenY, enemyScreenX, enemyScreenY) < enemy.size + 7) {
                         overEnemy = true; break;
                    }
                }
            }
        }
        if (overEnemy) { this.game.ui.setCursor('attack'); } else { this.game.ui.setCursor('default'); }
    }
}