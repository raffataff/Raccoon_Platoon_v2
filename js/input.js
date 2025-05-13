// js/input.js
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 }; 
        this.isShiftPressed = false; 
        this.isCtrlPressed = false;

        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        this.canvas.addEventListener('mouseleave', (event) => this.handleMouseLeave(event)); 

        this.canvas.addEventListener('contextmenu', (event) => { 
            event.preventDefault(); 
            if (!this.game || this.game.gameState !== 'RUNNING') return;
            
            if (this.game.isDragging) { 
                this.game.isDragging = false;
                this.game.draggedFarEnough = false;
            }

            const rect = this.canvas.getBoundingClientRect();
            const screenX = event.clientX - rect.left;
            const screenY = event.clientY - rect.top;
            const worldX = screenX + this.game.cameraX;
            const worldY = screenY + this.game.cameraY;

            if (typeof this.game.handleRightClickCommand === 'function') {
                this.game.handleRightClickCommand(worldX, worldY); 
            }
            this.updateMouseCursor(); 
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = true;
                this.updateMouseCursor(); 
            }
            if (event.key === 'Control' || event.key === 'Meta') {
                this.isCtrlPressed = true;
            }

            if (!this.game || this.game.gameState !== 'RUNNING') return;

            if (['Escape', ' ', 'f', 'F', 'g', 'G'].includes(event.key) || event.code === 'Space') {
                event.preventDefault();
            }

            if (event.key === 'Escape') {
                this.game.deselectAllUnits(); 
            }
            if (event.code === 'Space') {
                this.game.selectAllPlayerUnits(); 
            }
            if (event.key === 'f' || event.key === 'F') {
                if (this.game.toggleFormation) this.game.toggleFormation(); 
            }
            if (event.key === 'g' || event.key === 'G') { 
                let anySelectedRaccoonWasAiming = false;
                if (this.game.selectedUnits) { 
                    this.game.selectedUnits.forEach(unit => {
                        if (unit instanceof Raccoon && unit.isAimingGrenade) {
                            anySelectedRaccoonWasAiming = true;
                        }
                    });
                    this.game.selectedUnits.forEach(unit => {
                        if (unit instanceof Raccoon && unit.isAlive()) {
                            if (anySelectedRaccoonWasAiming) { 
                               unit.cancelGrenadeAim();
                            } else if (unit.grenadeAmmo > 0) { 
                               unit.startGrenadeAim();
                            }
                        }
                    });
                }
                if (this.game.ui) this.game.ui.updateSquadPanel(this.game.deployedSquadRoster);
                this.updateMouseCursor(); 
            }
        });
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
                this.updateMouseCursor(); 
            }
            if (event.key === 'Control' || event.key === 'Meta') {
                this.isCtrlPressed = false;
            }
        });
    }

    updateMouseCursor() {
        // ... (This method was correct from previous version that showed attack cursor on shift)
        if (!this.game || !this.game.ui || this.game.gameState !== 'RUNNING') {
            if (this.game && this.game.ui) this.game.ui.setCursor('default');
            return;
        }

        const isAimingGrenade = this.game.selectedUnits && this.game.selectedUnits.some(
            unit => unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive()
        );

        if (isAimingGrenade) {
            this.game.ui.setCursor('cell'); 
            return;
        }

        // If Shift is pressed and units are selected, it's always an attack cursor
        if (this.isShiftPressed && this.game.selectedUnits && this.game.selectedUnits.length > 0) {
            this.game.ui.setCursor('attack');
            return;
        }

        // If Shift is NOT pressed, check for hover over targetable ENTITIES (enemies only now for red line)
        let overEnemy = false;
        if (this.game.enemyUnits && this.mousePos) { 
            for (const enemy of this.game.enemyUnits) {
                if (enemy.isAlive()) {
                    const enemyScreenX = enemy.x - this.game.cameraX;
                    const enemyScreenY = enemy.y - this.game.cameraY;
                    if (distance(this.mousePos.screenX, this.mousePos.screenY, enemyScreenX, enemyScreenY) < enemy.size + 7) { 
                         overEnemy = true;
                         break;
                    }
                }
            }
        }
        // Barrels will show default cursor unless Shift is held (then they get 'attack' cursor)

        if (overEnemy) { 
            this.game.ui.setCursor('attack'); // Use red crosshair for direct targeting hover of enemies
        } else {
            this.game.ui.setCursor('default');
        }
    }

    handleMouseDown(event) {
        if (!this.game || this.game.gameState !== 'RUNNING') return;
        event.preventDefault(); 

        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left;
        this.mousePos.screenY = event.clientY - rect.top;
        this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
        this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;

        if (event.button === 0) { // Left mouse button
            if (this.isShiftPressed) {
                // If Shift is down, we DO NOT initiate a drag for selection.
                // The action will happen on mouseup (Shift+FireAtPoint).
                this.game.isDragging = false;
                this.game.draggedFarEnough = false;
            } else {
                // No Shift, so this could be the start of a drag selection or a simple click.
                this.game.isDragging = true;
                this.game.draggedFarEnough = false; 
                this.game.dragStartX = this.mousePos.screenX; 
                this.game.dragStartY = this.mousePos.screenY;
                this.game.dragCurrentX = this.mousePos.screenX; 
                this.game.dragCurrentY = this.mousePos.screenY;
            }
        }
    }

    handleMouseMove(event) {
        // ... (mousemove logic for updating mousePos and dragCurrentX/Y if isDragging) ...
        if (!this.game) return; 
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left;
        this.mousePos.screenY = event.clientY - rect.top;
        if (this.game.gameState === 'RUNNING') {
            this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
            this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;
        }

        // Only update drag variables if a drag was initiated (i.e., shift was NOT pressed on mousedown)
        if (this.game.isDragging && this.game.gameState === 'RUNNING') { 
            this.game.dragCurrentX = this.mousePos.screenX; 
            this.game.dragCurrentY = this.mousePos.screenY;
            if (!this.game.draggedFarEnough) { 
                const distDragged = distance(this.game.dragStartX, this.game.dragStartY, this.game.dragCurrentX, this.game.dragCurrentY);
                if (distDragged > this.game.DRAG_THRESHOLD) {
                    this.game.draggedFarEnough = true;
                }
            }
        }
        this.updateMouseCursor(); 
    }

    handleMouseUp(event) {
        if (!this.game || this.game.gameState !== 'RUNNING') return;
        event.preventDefault(); 
        
        // Use the mousedown point as the click origin for non-drag actions
        const clickWorldX = this.game.dragStartX + this.game.cameraX; 
        const clickWorldY = this.game.dragStartY + this.game.cameraY;

        if (event.button === 0) { // Left mouse button released
            if (this.isShiftPressed) {
                // Shift was held: ALWAYS a "Fire At Point" command, regardless of minor mouse movement.
              // console.log("[InputHandler mouseup] Shift is pressed. Issuing ShiftFireAtPointCommand.");
                if (typeof this.game.handleShiftFireAtPointCommand === 'function') {
                    // Use current mouse position for fire-at-point, as player might have aimed while holding shift
                    this.game.handleShiftFireAtPointCommand(this.mousePos.worldX, this.mousePos.worldY);
                }
            } else { // Shift was NOT held
                if (this.game.isDragging && this.game.draggedFarEnough) { 
                  // console.log("[InputHandler mouseup] Processing as DRAG selection (No Shift).");
                    if (typeof this.game.selectUnitsInDragRectangle === 'function') {
                         this.game.selectUnitsInDragRectangle(); 
                    }
                } else { // Simple click (No Shift)
                  // console.log("[InputHandler mouseup] Processing as CLICK selection/targeting (No Shift).");
                    if (typeof this.game.handlePrimaryLeftClick === 'function') {
                        this.game.handlePrimaryLeftClick(clickWorldX, clickWorldY); 
                    }
                }
            }
            // Reset dragging state for all left mouse ups
            this.game.isDragging = false;
            this.game.draggedFarEnough = false;
        }
        this.updateMouseCursor(); 
    }
    
    handleMouseLeave(event) {
        // ... (same)
        if (!this.game) return;
        if (this.game.isDragging) {
            this.game.isDragging = false;
            this.game.draggedFarEnough = false;
        }
        if (this.game.ui) this.game.ui.setCursor('default'); 
    }
}