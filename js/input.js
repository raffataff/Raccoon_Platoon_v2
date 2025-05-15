// js/input.js
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
        this.isShiftPressed = false;
        this.isCtrlPressed = false; // Still useful for HUD multi-select
        this.isLeftMouseDown = false;

        this.shiftLmbDownTime = 0;
        this.TAP_THRESHOLD_MS = CONFIG.INPUT_TAP_THRESHOLD_MS || 30; 
        this.isShiftHoldFiring = false;

        // Mouse event screen coordinates at mousedown (for non-Shift, non-Ctrl dragging)
        this.mouseDownScreenX = 0;
        this.mouseDownScreenY = 0;


        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        this.canvas.addEventListener('mouseleave', (event) => this.handleMouseLeave(event));
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (!this.game || this.game.gameState !== 'RUNNING') return;
            if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
            if (this.game.isDragging) { this.game.isDragging = false; this.game.draggedFarEnough = false; }
            const rect = this.canvas.getBoundingClientRect();
            const screenX = event.clientX - rect.left; const screenY = event.clientY - rect.top;
            const worldX = screenX + this.game.cameraX; const worldY = screenY + this.game.cameraY;
            if (typeof this.game.handleRightClickCommand === 'function') { this.game.handleRightClickCommand(worldX, worldY); }
            this.updateMouseCursor();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                if (!this.isShiftPressed) {
                    this.isShiftPressed = true;
                    if (this.isLeftMouseDown && this.game.gameState === 'RUNNING' && this.game.selectedUnits && this.game.selectedUnits.length > 0 && !this.isShiftHoldFiring) {
                        // If LMB is already down when Shift is pressed, this could transition to a hold
                        this.shiftLmbDownTime = performance.now(); // Reset timer for potential hold
                        // Check in mousemove or a game update if it becomes a hold
                    }
                }
                this.updateMouseCursor();
            }
            if (event.key === 'Control' || event.key === 'Meta') { this.isCtrlPressed = true; }

            if (!this.game || this.game.gameState !== 'RUNNING') return;
            if (['Escape', ' ', 'f', 'F', 'g', 'G'].includes(event.key) || event.code === 'Space') event.preventDefault();

            if (event.key === 'Escape') {
                if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
                this.game.deselectAllUnits();
            }
            if (event.code === 'Space') {
                if (this.isShiftHoldFiring) { this.game.handleShiftHoldEnd(); this.isShiftHoldFiring = false; }
                this.game.selectAllPlayerUnits();
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
                    if (this.isShiftHoldFiring) { // If continuous fire was active
                        this.game.handleShiftHoldEnd();
                        this.isShiftHoldFiring = false;
                    }
                }
                this.updateMouseCursor();
            }
            if (event.key === 'Control' || event.key === 'Meta') { this.isCtrlPressed = false; }
        });
    }

    updateMouseCursor() {
        if (!this.game || !this.game.ui || this.game.gameState !== 'RUNNING') {
            if (this.game && this.game.ui) this.game.ui.setCursor('default'); return;
        }
        const isAimingGrenade = this.game.selectedUnits && this.game.selectedUnits.some(u => u instanceof Raccoon && u.isAimingGrenade && u.isAlive());
        if (isAimingGrenade) { this.game.ui.setCursor('cell'); return; }

        if ((this.isShiftPressed || this.isShiftHoldFiring) && this.game.selectedUnits && this.game.selectedUnits.length > 0) {
            this.game.ui.setCursor('attack');
            return;
        }
        let overEnemy = false;
        if (this.game.enemyUnits && this.mousePos) {
            for (const enemy of this.game.enemyUnits) {
                if (enemy.isAlive()) {
                    const eSX = enemy.x - this.game.cameraX; const eSY = enemy.y - this.game.cameraY;
                    if (distance(this.mousePos.screenX, this.mousePos.screenY, eSX, eSY) < enemy.size + 7) { overEnemy = true; break; }
                }
            }
        }
        if (overEnemy) { this.game.ui.setCursor('attack'); } else { this.game.ui.setCursor('default'); }
    }

    handleMouseDown(event) {
        if (!this.game || this.game.gameState !== 'RUNNING') return;
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left; this.mousePos.screenY = event.clientY - rect.top;
        this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX; this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;

        this.mouseDownScreenX = this.mousePos.screenX; // Store mousedown screen coords for simple click logic
        this.mouseDownScreenY = this.mousePos.screenY;

        if (event.button === 0) {
            this.isLeftMouseDown = true;
            this.isShiftHoldFiring = false; // Reset on new mousedown

            if (this.isShiftPressed) {
                this.shiftLmbDownTime = performance.now();
                this.game.isDragging = false; this.game.draggedFarEnough = false;
                // Potential continuous fire begins, but actual firing state set by mousemove or hold duration
            } else {
                this.game.isDragging = true; this.game.draggedFarEnough = false;
                // dragStartX/Y used by Game class, let's use mouseDownScreenX/Y locally for clarity
                this.game.dragStartX = this.mouseDownScreenX;
                this.game.dragStartY = this.mouseDownScreenY;
                this.game.dragCurrentX = this.mouseDownScreenX;
                this.game.dragCurrentY = this.mouseDownScreenY;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseMove(event) {
        if (!this.game) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left; this.mousePos.screenY = event.clientY - rect.top;

        if (this.game.gameState === 'RUNNING') {
            this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
            this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;

            if (this.isShiftPressed && this.isLeftMouseDown && !this.isShiftHoldFiring) {
                // Start continuous fire if held long enough OR mouse moved significantly
                // The DRAG_THRESHOLD check here also helps trigger if mouse is held and wiggled.
                if ((performance.now() - this.shiftLmbDownTime > (this.inputHandler.TAP_THRESHOLD_MS || 150)) ||
                    distance(this.mouseDownScreenX, this.mouseDownScreenY, this.mousePos.screenX, this.mousePos.screenY) > (this.game.DRAG_THRESHOLD || 5) / 2) {
                    this.isShiftHoldFiring = true;
                    this.game.handleShiftHoldStart(this.mousePos.worldX, this.mousePos.worldY);
                }
            }
            // If already in Shift+Hold firing mode, update target
            if (this.isShiftHoldFiring) {
                this.game.updateShiftHoldTarget(this.mousePos.worldX, this.mousePos.worldY);
            }
        }

        if (this.game.isDragging && !this.isShiftPressed && this.game.gameState === 'RUNNING') { // Dragging only if Shift is NOT pressed
            this.game.dragCurrentX = this.mousePos.screenX; this.game.dragCurrentY = this.mousePos.screenY;
            if (!this.game.draggedFarEnough && distance(this.game.dragStartX, this.game.dragStartY, this.game.dragCurrentX, this.game.dragCurrentY) > this.game.DRAG_THRESHOLD) {
                this.game.draggedFarEnough = true;
            }
        }
        this.updateMouseCursor();
    }

    handleMouseUp(event) {
        if (!this.game || this.game.gameState !== 'RUNNING') return;
        event.preventDefault();

        // For actions on mouseup (like Shift+Tap), use the current mouse position
        const currentWorldX = this.mousePos.worldX;
        const currentWorldY = this.mousePos.worldY;

        // For a simple primary click (no modifiers, no drag), use the original mousedown location
        const originalMouseDownWorldX = this.mouseDownScreenX + this.game.cameraX;
        const originalMouseDownWorldY = this.mouseDownScreenY + this.game.cameraY;


        if (event.button === 0) { // Left mouse button released
            const wasMouseDown = this.isLeftMouseDown;
            this.isLeftMouseDown = false;

            if (wasMouseDown) { // Only process if mouse was actually down
                if (this.isShiftHoldFiring) { // If it was a continuous fire session
                    this.game.handleShiftHoldEnd();
                    this.isShiftHoldFiring = false;
                } else if (this.isShiftPressed) { // Shift is (or was) held, but not continuous fire mode = Tap
                    // Fire at current mouse position for Shift+Tap
                    this.game.handleShiftFireAtPointCommand(currentWorldX, currentWorldY);
                } else { // Normal click/drag release (no shift involved at mouseup)
                    if (this.game.isDragging && this.game.draggedFarEnough) {
                        this.game.selectUnitsInDragRectangle();
                    } else {
                        // Use original mousedown location for a simple click
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
}