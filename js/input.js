// js/input.js
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 }; 
        this.isShiftPressed = false; 

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

            this.game.handleMapClick(worldX, worldY, true); 
            this.updateMouseCursor(); 
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = true;
            }
            if (!this.game || this.game.gameState !== 'RUNNING') return;

            if (event.key === 'Escape') {
                event.preventDefault();
                this.game.deselectAllUnits(); // This should trigger updateMouseCursor via its own logic
            }

            if (event.code === 'Space') {
                event.preventDefault(); 
                this.game.selectAllPlayerUnits(); // This should also trigger updateMouseCursor
            }
            
            if (event.key === 'f' || event.key === 'F') {
                event.preventDefault();
                if (this.game.toggleFormation) this.game.toggleFormation(); 
                // toggleFormation does not directly affect cursor, so no updateMouseCursor needed here
            }

            if (event.key === 'g' || event.key === 'G') { 
                event.preventDefault();
                // console.log("[InputHandler keydown] 'G' pressed.");
                let anySelectedRaccoonWasAiming = false;
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
                if (this.game.ui) this.game.ui.updateSquadPanel();
                this.updateMouseCursor(); 
            }
        });
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });
    }

    updateMouseCursor() {
        // console.log("[InputHandler.updateMouseCursor] Called.");
        if (!this.game || !this.game.ui || this.game.gameState !== 'RUNNING') {
            // console.log("    Bailing: game/ui not ready or not running.");
            if (this.game && this.game.ui) this.game.ui.setCursor('default');
            return;
        }

        const isAimingGrenade = this.game.selectedUnits.some(
            unit => unit instanceof Raccoon && unit.isAimingGrenade && unit.isAlive()
        );

        if (isAimingGrenade) {
            // console.log("    Setting cursor to 'cell' (grenade aim).");
            this.game.ui.setCursor('cell'); 
            return;
        }

        let overShootableTarget = false;

        if (this.game.enemyUnits && this.mousePos) { 
            for (const enemy of this.game.enemyUnits) {
                if (enemy.isAlive()) {
                    const enemyScreenX = enemy.x - this.game.cameraX;
                    const enemyScreenY = enemy.y - this.game.cameraY;
                    if (distance(this.mousePos.screenX, this.mousePos.screenY, enemyScreenX, enemyScreenY) < enemy.size + 5) {
                         overShootableTarget = true;
                         break;
                    }
                }
            }
        }

        if (!overShootableTarget && this.game.level && this.game.level.obstacles && this.mousePos) {
            for (const obs of this.game.level.obstacles) {
                if (obs.destructible && obs.type === 'explosive_barrel' && !obs.isDestroyed) {
                    const obsScreenX = obs.x - this.game.cameraX;
                    const obsScreenY = obs.y - this.game.cameraY;
                    if (this.mousePos.screenX >= obsScreenX &&
                        this.mousePos.screenX <= obsScreenX + obs.width &&
                        this.mousePos.screenY >= obsScreenY &&
                        this.mousePos.screenY <= obsScreenY + obs.height) {
                        overShootableTarget = true;
                        break;
                    }
                }
            }
        }

        if (overShootableTarget) {
            // console.log("    Setting cursor to 'attack'.");
            this.game.ui.setCursor('attack'); 
        } else {
            // console.log("    Setting cursor to 'default'.");
            this.game.ui.setCursor('default');
        }
    }

    handleMouseDown(event) {
        if (!this.game ||this.game.gameState !== 'RUNNING') return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left;
        this.mousePos.screenY = event.clientY - rect.top;
        this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
        this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;

        if (event.button === 0) { 
            this.game.isDragging = true;
            this.game.draggedFarEnough = false; 
            this.game.dragStartX = this.mousePos.screenX;
            this.game.dragStartY = this.mousePos.screenY;
            this.game.dragCurrentX = this.mousePos.screenX; 
            this.game.dragCurrentY = this.mousePos.screenY;
        }
    }

    handleMouseMove(event) {
        if (!this.game) return; // Guard against game not being initialized
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.screenX = event.clientX - rect.left;
        this.mousePos.screenY = event.clientY - rect.top;
        // Only update worldX/Y if camera exists (i.e., game is running)
        if (this.game.gameState === 'RUNNING') {
            this.mousePos.worldX = this.mousePos.screenX + this.game.cameraX;
            this.mousePos.worldY = this.mousePos.screenY + this.game.cameraY;
        }


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
        
        const clickWorldX = this.game.dragStartX + this.game.cameraX; 
        const clickWorldY = this.game.dragStartY + this.game.cameraY;

        if (event.button === 0) { 
            if (this.game.isDragging) { 
                if (this.game.draggedFarEnough) {
                    this.game.selectUnitsInDragRectangle(); 
                } else {
                    this.game.handleMapClick(clickWorldX, clickWorldY, false); 
                }
            }
            this.game.isDragging = false;
            this.game.draggedFarEnough = false;
        }
        this.updateMouseCursor(); 
    }
    
    handleMouseLeave(event) {
        if (!this.game) return;
        if (this.game.isDragging) {
            this.game.isDragging = false;
            this.game.draggedFarEnough = false;
        }
        if (this.game.ui) this.game.ui.setCursor('default'); 
    }
}