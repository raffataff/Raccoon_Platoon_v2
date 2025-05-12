// js/ui.js
class UI {
    // ... (constructor and other methods as before) ...
    constructor(game) {
        this.game = game;
        this.preMissionScreen = document.getElementById('preMissionScreen');
        this.postMissionScreen = document.getElementById('postMissionScreen');
        this.hud = document.getElementById('hud');
        this.squadPanel = document.getElementById('hud-squad');
        this.objectiveText = document.getElementById('objectiveText'); 
        this.missionOutcomeText = document.getElementById('missionOutcome'); 
        
        this.preMissionPhaseTitle = document.getElementById('preMissionPhaseTitle');
        this.preMissionTitle = document.getElementById('preMissionTitle');
        this.preMissionBriefing = document.getElementById('preMissionBriefing');
        
        this.toggleFormationButton = document.getElementById('toggleFormationButton');
        this.formationSpacingSlider = document.getElementById('formationSpacingSlider');
        this.spacingValueDisplay = document.getElementById('spacingValueDisplay');

        const startBtn = document.getElementById('startMissionButton');
        if (startBtn) startBtn.addEventListener('click', () => {
            if (this.game) this.game.startMission();
        });
        
        const retryBtn = document.getElementById('retryMissionButton');
        if (retryBtn) retryBtn.addEventListener('click', () => {
            if (this.game) { // No need to reload data, just restart current mission setup
                 this.game.startMission(); 
            }
        });
        
        const nextMissionButton = document.getElementById('nextMissionButton'); 
        if (nextMissionButton) {
            nextMissionButton.addEventListener('click', () => {
                if (this.game) {
                    this.game.proceedToNextLogicalStep(); // Game handles logic for next mission/phase/end
                }
            });
        }


        if (this.toggleFormationButton && this.game) {
            this.toggleFormationButton.addEventListener('click', () => {
                this.game.toggleFormation();
            });
        }

        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game) {
            const initialSpacing = (this.game && this.game.formationSpacingMultiplier !== undefined) ? this.game.formationSpacingMultiplier : 3.5;
            this.formationSpacingSlider.value = initialSpacing.toString();
            if (this.spacingValueDisplay) this.spacingValueDisplay.textContent = initialSpacing.toFixed(1);


            this.formationSpacingSlider.addEventListener('input', () => {
                const newMultiplier = parseFloat(this.formationSpacingSlider.value);
                if(this.game) this.game.setFormationSpacing(newMultiplier); 
                if(this.spacingValueDisplay) this.spacingValueDisplay.textContent = newMultiplier.toFixed(1);
            });
        }
    }

    showPreMissionScreen(phaseData, missionData) {
        if (!this.preMissionScreen) return; 

        if (!phaseData || !missionData) {
            if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = "Campaign Error";
            if(this.preMissionTitle) this.preMissionTitle.textContent = "Error Loading Mission";
            if(this.preMissionBriefing) this.preMissionBriefing.textContent = "Could not load mission details.";
            this.preMissionScreen.style.display = 'block';
            if(this.postMissionScreen) this.postMissionScreen.style.display = 'none';
            if(this.hud) this.hud.style.display = 'none';
            this.setCursor('default');
            return;
        }

        if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = phaseData.name;
        if(this.preMissionTitle) this.preMissionTitle.textContent = missionData.name;
        if(this.preMissionBriefing) this.preMissionBriefing.textContent = missionData.briefing;
        
        this.preMissionScreen.style.display = 'block';
        if(this.postMissionScreen) this.postMissionScreen.style.display = 'none';
        if(this.hud) this.hud.style.display = 'none';
        this.setCursor('default');
    }

    // --- MODIFIED: showPostMissionScreen to use debriefData ---
    showPostMissionScreen(debriefData) {
        if (!this.postMissionScreen || !debriefData) {
            console.error("PostMissionScreen or debriefData missing!");
            return;
        }

        const { isVictory, phaseData, missionData, survivingRaccoons, fallenRaccoons, enemiesKilled, timeTaken, campaignComplete } = debriefData;

        if(this.missionOutcomeText) this.missionOutcomeText.textContent = isVictory ? "MISSION SUCCESSFUL!" : "MISSION FAILED!";
        
        const postMissionInfoEl = document.getElementById('postMissionInfo');
        if(postMissionInfoEl && phaseData && missionData) {
            postMissionInfoEl.textContent = `${phaseData.name} - ${missionData.name}`;
        }

        // Populate Stats
        const statTimeTakenEl = document.getElementById('statTimeTaken');
        if (statTimeTakenEl) statTimeTakenEl.textContent = timeTaken + "s";
        const statEnemiesKilledEl = document.getElementById('statEnemiesKilled');
        if (statEnemiesKilledEl) statEnemiesKilledEl.textContent = enemiesKilled;

        // Populate Survivor List
        const survivorListEl = document.getElementById('survivorList');
        if (survivorListEl) {
            survivorListEl.innerHTML = ''; // Clear previous
            if (survivingRaccoons && survivingRaccoons.length > 0) {
                survivingRaccoons.forEach(r => {
                    const li = document.createElement('li');
                    li.textContent = `${r.id} - Rank: ${r.rank}, XP: ${r.xp}`;
                    survivorListEl.appendChild(li);
                });
            } else if (isVictory) {
                 const li = document.createElement('li');
                 li.textContent = "No Raccoons survived...";
                 survivorListEl.appendChild(li);
            }
        }
        
        // Populate Fallen List
        const fallenListEl = document.getElementById('fallenList');
        if (fallenListEl) {
            fallenListEl.innerHTML = ''; // Clear previous
            if (fallenRaccoons && fallenRaccoons.length > 0) {
                fallenRaccoons.forEach(r => {
                    const li = document.createElement('li');
                    li.textContent = `${r.id} - Rank: ${r.rank}`;
                    fallenListEl.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = "No casualties this mission!";
                fallenListEl.appendChild(li);
            }
        }


        const nextMissionBtn = document.getElementById('nextMissionButton');
        const retryMissionBtn = document.getElementById('retryMissionButton');

        if (campaignComplete && isVictory) { // Special case for end of campaign
            if (nextMissionBtn) {
                nextMissionBtn.textContent = "Campaign Complete! (Menu)";
                nextMissionBtn.style.display = 'inline-block';
                // nextMissionBtn.onclick = () => { /* Go to main menu - future */ console.log("Return to Main Menu"); };
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else if (isVictory) {
            if (nextMissionBtn) {
                nextMissionBtn.style.display = 'inline-block';
                const nextPhaseIndex = this.game.currentPhaseIndex; // This is already advanced if phase was complete
                const nextMissionIndex = this.game.currentMissionIndex; // This is 0 if new phase
                
                if (this.game.campaignData[nextPhaseIndex] && this.game.campaignData[nextPhaseIndex].missions[nextMissionIndex]) {
                     if (nextMissionIndex === 0) { // Starting a new phase
                        nextMissionBtn.textContent = `Start ${this.game.campaignData[nextPhaseIndex].name}`;
                     } else {
                        nextMissionBtn.textContent = "Next Mission";
                     }
                } else { // Should be caught by campaignComplete logic earlier
                    nextMissionBtn.textContent = "No More Missions"; 
                    nextMissionBtn.disabled = true;
                }
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none'; 
        } else { // Mission Failed
            if (nextMissionBtn) nextMissionBtn.style.display = 'none';      
            if (retryMissionBtn) retryMissionBtn.style.display = 'inline-block'; 
        }
        
        this.postMissionScreen.style.display = 'block';
        if(this.hud) this.hud.style.display = 'none'; 
        this.setCursor('default');
    }
    // ... (rest of UI methods)
    hidePreMissionScreen() {
        if(this.preMissionScreen) this.preMissionScreen.style.display = 'none';
    }
    showHUD() {
        if(this.hud) this.hud.style.display = 'flex'; 
        this.hidePreMissionScreen();
        if(this.postMissionScreen) this.postMissionScreen.style.display = 'none'; 
        
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
             this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
             this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
         if(this.game && this.game.ui && this.game.currentFormationType) this.game.ui.updateFormationButton(this.game.currentFormationType); 
    }

    hideHUD() {
        if (this.hud) { 
            this.hud.style.display = 'none';
        }
    }
    
    updateObjective(text) { 
        if(this.objectiveText && this.game && this.game.currentMissionParams) {
            this.objectiveText.textContent = this.game.currentMissionParams.name || "Defeat Possums";
        } else if (this.objectiveText) {
            this.objectiveText.textContent = text || "Unknown Objective";
        }
    }

    updateFormationButton(formationType) {
        if (this.toggleFormationButton) {
            this.toggleFormationButton.textContent = `Formation: ${formationType.charAt(0).toUpperCase() + formationType.slice(1).toLowerCase()}`;
        }
    }

    updateSquadPanel() {
        if (!this.game || !this.game.playerSquad || !this.squadPanel) return; 

        this.squadPanel.innerHTML = ''; 
        this.game.playerSquad.forEach((raccoon) => {
            if (!raccoon) return; 
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('squad-member');
            if (this.game.selectedUnits.includes(raccoon)) {
                memberDiv.classList.add('selected');
            }
            
            if (raccoon.faceImageUrl) {
                memberDiv.style.backgroundImage = `url('${raccoon.faceImageUrl}')`;
            }
            
            if (raccoon.isAimingGrenade) { 
                memberDiv.style.borderColor = '#D09040'; 
            }
            
            const isKIA = !raccoon.isAlive();
            const statusText = isKIA ? 'KIA' : (raccoon.actionTimer > 0 ? 'Busy' : (raccoon.isAimingGrenade ? 'Aiming' : 'Active'));
            const statusClass = isKIA ? 'status-kia' : '';
            const hpPercent = isKIA ? 0 : (raccoon.hp / raccoon.maxHp) * 100;
            let hpColor = '#70A060'; 
            if (hpPercent < 30) {
                hpColor = '#A85050'; 
            } else if (hpPercent < 60) {
                hpColor = '#D09040'; 
            }

            const infoOverlay = document.createElement('div'); 
            infoOverlay.classList.add('squad-member-info-overlay');
            infoOverlay.innerHTML = `
                <div><span class.label">ID:</span> <span class="value">${raccoon.id}</span></div>
                <div><span class="label">Rank:</span> <span class="value">${raccoon.rank || 'Recruit'}</span></div>
                <div><span class="label">HP:</span> <span class="value">${Math.max(0, Math.round(raccoon.hp))} / ${raccoon.maxHp}</span></div>
                <div><span class="label">Grenades:</span> <span class="value">${raccoon.grenadeAmmo !== undefined ? raccoon.grenadeAmmo : 'N/A'}</span></div> 
                <div><span class="label">Status:</span> <span class="value ${statusClass}">${statusText}</span></div>
                <div><span class="label">XP:</span> <span class="value">${raccoon.xp !== undefined ? raccoon.xp : 0}</span></div>
                <div class="health-bar-container">
                    <div class="health-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
                </div>
            `;
            
            infoOverlay.addEventListener('click', (e) => {
                e.stopPropagation(); 
                 if (raccoon.isAlive()) { 
                    const isCtrlPressed = e.ctrlKey || e.metaKey; 

                    if (isCtrlPressed) { 
                        if (this.game.selectedUnits.includes(raccoon)) {
                            this.game.selectedUnits = this.game.selectedUnits.filter(u => u !== raccoon); 
                        } else {
                            this.game.selectedUnits.push(raccoon); 
                        }
                    } else if (e.shiftKey) { 
                        if (!this.game.selectedUnits.includes(raccoon)) {
                            this.game.selectedUnits.push(raccoon);
                        }
                    }
                    else { 
                        this.game.selectedUnits = [raccoon];
                    }
                    
                    this.updateSquadPanel(); 
                    if (this.game.inputHandler) this.game.inputHandler.updateMouseCursor();
                }
            });

            memberDiv.appendChild(infoOverlay);
            this.squadPanel.appendChild(memberDiv);
        });
    }

    setCursor(styleName) { 
        if (this.game && this.game.canvas) {
            this.game.canvas.classList.remove('cursor-default', 'cursor-attack', 'cursor-cell');
            this.game.canvas.style.cursor = ''; 

            if (styleName === 'attack') {
                this.game.canvas.classList.add('cursor-attack');
            } else if (styleName === 'cell') {
                this.game.canvas.classList.add('cursor-cell');
            } else { 
                this.game.canvas.classList.add('cursor-default');
                if (styleName !== 'default' && styleName !== 'attack' && styleName !== 'cell') {
                     this.game.canvas.style.cursor = styleName; 
                } else if (styleName === 'default') {
                     this.game.canvas.style.cursor = 'default'; 
                }
            }
        }
    }
}