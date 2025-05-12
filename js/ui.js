// js/ui.js
class UI {
    constructor(game) {
        this.game = game;
        this.preMissionScreen = document.getElementById('preMissionScreen');
        this.postMissionScreen = document.getElementById('postMissionScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen'); 
        this.hud = document.getElementById('hud');
        this.squadPanel = document.getElementById('hud-squad');
        this.objectiveText = document.getElementById('objectiveText'); 
        this.missionOutcomeText = document.getElementById('missionOutcome'); 
        
        this.preMissionPhaseTitle = document.getElementById('preMissionPhaseTitle');
        this.preMissionTitle = document.getElementById('preMissionTitle');
        this.preMissionBriefing = document.getElementById('preMissionBriefing');
        this.availableRecruitsList = document.getElementById('availableRecruitsList');
        this.deployedSquadList = document.getElementById('deployedSquadList');
        
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.restartCampaignButton = document.getElementById('restartCampaignButton');
        
        this.toggleFormationButton = document.getElementById('toggleFormationButton');
        this.formationSpacingSlider = document.getElementById('formationSpacingSlider');
        this.spacingValueDisplay = document.getElementById('spacingValueDisplay');

        const startBtn = document.getElementById('startMissionButton');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.game) {
                    if (this.game.tempSelectedForDeployment && this.game.tempSelectedForDeployment.length > 0 &&
                        this.game.tempSelectedForDeployment.length <= (CONFIG.MAX_SQUAD_SIZE_MVP || 4) ) { // Added max check
                        this.game.confirmSquadAndStartMission(this.game.tempSelectedForDeployment);
                    } else if (this.game.tempSelectedForDeployment && this.game.tempSelectedForDeployment.length > (CONFIG.MAX_SQUAD_SIZE_MVP || 4)) {
                        alert(`Max squad size is ${CONFIG.MAX_SQUAD_SIZE_MVP || 4}. Please deselect some recruits.`);
                    }
                     else { 
                        alert("Select at least one Raccoon for the mission!");
                    }
                }
            });
        }
        
        const retryBtn = document.getElementById('retryMissionButton');
        if (retryBtn) retryBtn.addEventListener('click', () => {
            if (this.game) { 
                if (this.game.loadMissionData(this.game.currentPhaseIndex, this.game.currentMissionIndex)) {
                    this.showPreMissionScreen_RecruitSelect(
                        this.game.campaignData[this.game.currentPhaseIndex],
                        this.game.currentMissionParams,
                        this.game.getAvailableRecruits()
                    );
                } else { 
                    this.showGameOverScreen("Error reloading mission.");
                }
            }
        });
        
        const nextMissionButton = document.getElementById('nextMissionButton'); 
        if (nextMissionButton) {
            nextMissionButton.addEventListener('click', () => {
                if (this.game) {
                    this.game.proceedToNextLogicalStep(); 
                }
            });
        }

        if (this.restartCampaignButton) {
            this.restartCampaignButton.addEventListener('click', () => {
                if (this.game) {
                    // console.log("Restart Campaign button clicked");
                    this.game.initializeNewCampaign(); 
                    this.game.start(); 
                }
            });
        }


        if (this.toggleFormationButton && this.game) {
            this.toggleFormationButton.addEventListener('click', () => {
                if (this.game && typeof this.game.toggleFormation === 'function') {
                    this.game.toggleFormation();
                }
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

    showGameOverScreen(message, isCampaignVictory = false) {
        if (!this.gameOverScreen) return;

        if (this.gameOverTitle) this.gameOverTitle.textContent = isCampaignVictory ? "CAMPAIGN COMPLETE!" : "GAME OVER";
        if (this.gameOverMessage) this.gameOverMessage.textContent = message;

        if (this.preMissionScreen) this.preMissionScreen.style.display = 'none';
        if (this.postMissionScreen) this.postMissionScreen.style.display = 'none';
        if (this.hud) this.hud.style.display = 'none';
        this.gameOverScreen.style.display = 'block';
        this.setCursor('default');
    }

    showPreMissionScreen_RecruitSelect(phaseData, missionData, availableRecruits) {
        if (!this.preMissionScreen || !this.availableRecruitsList || !this.deployedSquadList) {
             console.error("PreMissionScreen recruit select elements not found!"); return; 
        }
        // Hide other full-screen panels
        if(this.postMissionScreen) this.postMissionScreen.style.display = 'none';
        if(this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        if(this.hud) this.hud.style.display = 'none';


        if (!phaseData || !missionData) {
            if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = "Campaign Error";
            if(this.preMissionTitle) this.preMissionTitle.textContent = "Error Loading Mission";
            if(this.preMissionBriefing) this.preMissionBriefing.textContent = "Could not load mission details.";
            this.preMissionScreen.style.display = 'block';
            this.setCursor('default');
            return;
        }

        if(this.preMissionPhaseTitle) this.preMissionPhaseTitle.textContent = phaseData.name;
        if(this.preMissionTitle) this.preMissionTitle.textContent = missionData.name;
        if(this.preMissionBriefing) this.preMissionBriefing.textContent = missionData.briefing;

        this.availableRecruitsList.innerHTML = '';
        if (this.game) this.game.tempSelectedForDeployment = []; 

        (availableRecruits || []).forEach(r => { 
            const li = document.createElement('li');
            li.textContent = `${r.id} - ${r.rank} (XP: ${r.xp}) HP: ${r.hp}/${r.maxHp}`;
            li.dataset.raccoonId = r.id; 
            li.style.cursor = 'pointer'; // Make it look clickable
            li.style.padding = '3px';
             li.style.marginBottom = '2px';
            li.style.backgroundColor = 'rgba(255,255,255,0.05)';


            if (this.game && this.game.tempSelectedForDeployment.find(depR => depR.id === r.id)) {
                li.classList.add('selected-for-deploy');
                li.style.backgroundColor = 'rgba(120, 150, 100, 0.3)'; // Highlight color
            }

            li.addEventListener('click', () => {
                if (!this.game) return;
                const alreadySelectedIdx = this.game.tempSelectedForDeployment.findIndex(depR => depR.id === r.id);

                if (alreadySelectedIdx > -1) { 
                    this.game.tempSelectedForDeployment.splice(alreadySelectedIdx, 1);
                    li.classList.remove('selected-for-deploy');
                    li.style.backgroundColor = 'rgba(255,255,255,0.05)';
                } else { 
                    if (this.game.tempSelectedForDeployment.length < (CONFIG.MAX_SQUAD_SIZE_MVP || 4) ) {
                        this.game.tempSelectedForDeployment.push(r);
                        li.classList.add('selected-for-deploy');
                        li.style.backgroundColor = 'rgba(120, 150, 100, 0.3)';
                    } else {
                        alert(`Max squad size of ${CONFIG.MAX_SQUAD_SIZE_MVP || 4} reached.`);
                    }
                }
                this.updateDeployedSquadListUI(); 
            });
            this.availableRecruitsList.appendChild(li);
        });
        
        this.updateDeployedSquadListUI(); 

        this.preMissionScreen.style.display = 'block';
        this.setCursor('default');
    }

    updateDeployedSquadListUI() {
        if (!this.deployedSquadList || !this.game) return;
        this.deployedSquadList.innerHTML = '<h4>Selected for Mission:</h4>';
        const maxSquadSizeEl = document.getElementById('maxSquadSizeDisplay');
        if(maxSquadSizeEl) maxSquadSizeEl.textContent = (CONFIG.MAX_SQUAD_SIZE_MVP || 4).toString();


        if (this.game.tempSelectedForDeployment && this.game.tempSelectedForDeployment.length > 0) {
            this.game.tempSelectedForDeployment.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.id} - ${r.rank}`;
                this.deployedSquadList.appendChild(li);
            });
        } else {
            const p = document.createElement('p'); 
            p.textContent = "None selected.";
            this.deployedSquadList.appendChild(p);
        }
         const startBtn = document.getElementById('startMissionButton');
        if(startBtn) startBtn.disabled = !(this.game.tempSelectedForDeployment && this.game.tempSelectedForDeployment.length > 0);
    }

    // THIS METHOD HIDES THE PRE-MISSION (RECRUIT SELECT) SCREEN
    hidePreMissionScreen() {
        if(this.preMissionScreen) this.preMissionScreen.style.display = 'none';
    }

    showPostMissionScreen_Debrief(debriefData) {
        if (!this.postMissionScreen || !debriefData) {
            console.error("PostMissionScreen or debriefData missing for debrief!");
            return;
        }
        if(this.preMissionScreen) this.preMissionScreen.style.display = 'none';
        if(this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        if(this.hud) this.hud.style.display = 'none';


        const { isVictory, phaseData, missionData, survivingRaccoons, fallenRaccoons, enemiesKilled, timeTaken, campaignComplete } = debriefData;

        if(this.missionOutcomeText) this.missionOutcomeText.textContent = isVictory ? "MISSION SUCCESSFUL!" : "MISSION FAILED!";
        
        const postMissionInfoEl = document.getElementById('postMissionInfo');
        if(postMissionInfoEl && phaseData && missionData) {
            postMissionInfoEl.textContent = `${phaseData.name || ""} - ${missionData.name || ""}`;
        }

        const statTimeTakenEl = document.getElementById('statTimeTaken');
        if (statTimeTakenEl) statTimeTakenEl.textContent = timeTaken + "s";
        const statEnemiesKilledEl = document.getElementById('statEnemiesKilled');
        if (statEnemiesKilledEl) statEnemiesKilledEl.textContent = enemiesKilled;

        const survivorListEl = document.getElementById('survivorList');
        if (survivorListEl) {
            survivorListEl.innerHTML = ''; 
            if (survivingRaccoons && survivingRaccoons.length > 0) {
                survivingRaccoons.forEach(r => {
                    const li = document.createElement('li');
                    li.textContent = `${r.id} - Rank: ${r.rank}, XP: ${r.xp}${r.hp <=0 ? ' (KIA - ERROR IN LOGIC)' : ''}`; 
                    survivorListEl.appendChild(li);
                });
            } else if (isVictory) { // Victory but no survivors (e.g. all died but objective met some other way)
                 const li = document.createElement('li');
                 li.textContent = "Mission accomplished, but at great cost. No Raccoons returned.";
                 survivorListEl.appendChild(li);
            } else { // Defeat and no survivors
                 const li = document.createElement('li');
                 li.textContent = "All deployed Raccoons KIA.";
                 survivorListEl.appendChild(li);
            }
        }
        
        const fallenListEl = document.getElementById('fallenList');
        if (fallenListEl) {
            fallenListEl.innerHTML = ''; 
            if (fallenRaccoons && fallenRaccoons.length > 0) {
                fallenRaccoons.forEach(r => {
                    const li = document.createElement('li');
                    li.textContent = `${r.id} - (Rank: ${r.rank})`;
                    fallenListEl.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = "No casualties this mission! Hoo-ah!";
                fallenListEl.appendChild(li);
            }
        }

        const nextMissionBtn = document.getElementById('nextMissionButton');
        const retryMissionBtn = document.getElementById('retryMissionButton');

        if (campaignComplete && isVictory) { 
            if (nextMissionBtn) {
                nextMissionBtn.textContent = "Campaign Complete! (Restart)"; // Changed text
                nextMissionBtn.style.display = 'inline-block';
                nextMissionBtn.onclick = () => { 
                    if(this.game) {
                        this.game.initializeNewCampaign(); 
                        this.game.start(); 
                    }
                };
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none';
        } else if (isVictory) {
            if (nextMissionBtn) {
                nextMissionBtn.style.display = 'inline-block';
                nextMissionBtn.disabled = false; 
                nextMissionBtn.onclick = null;  // Clear old specific handler
                // Re-add general handler for proceeding (already in constructor, but this ensures it's there)
                nextMissionBtn.onclick = () => { if (this.game) this.game.proceedToNextLogicalStep(); };


                 const nextPIdx = this.game.currentPhaseIndex; 
                 const nextMIdx = this.game.currentMissionIndex;
                
                if (this.game.campaignData && this.game.campaignData[nextPIdx] && this.game.campaignData[nextPIdx].missions[nextMIdx]) {
                    // To correctly determine if it's a new phase, we compare the phase of the *just completed* mission
                    // with the phase of the *upcoming* mission.
                    // debriefData.phaseData refers to the phase of the mission just ended.
                    // this.game.campaignData[nextPIdx] refers to the phase of the next mission.
                     if (this.game.campaignData[nextPIdx] !== debriefData.phaseData) { 
                        nextMissionBtn.textContent = `Start ${this.game.campaignData[nextPIdx].name}`;
                     } else {
                        nextMissionBtn.textContent = "Next Mission";
                     }
                } else { 
                    nextMissionBtn.textContent = "Campaign Complete!"; 
                }
            }
            if (retryMissionBtn) retryMissionBtn.style.display = 'none'; 
        } else { 
            if (nextMissionBtn) nextMissionBtn.style.display = 'none';      
            if (retryMissionBtn) retryMissionBtn.style.display = 'inline-block'; 
        }
        
        this.postMissionScreen.style.display = 'block';
        if(this.hud) this.hud.style.display = 'none'; 
        this.setCursor('default');
    }
    
    showHUD() {
        if(this.hud) this.hud.style.display = 'flex'; 
        if(this.preMissionScreen) this.preMissionScreen.style.display = 'none'; // Hide pre-mission
        if(this.postMissionScreen) this.postMissionScreen.style.display = 'none'; 
        if(this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        
        if (this.formationSpacingSlider && this.spacingValueDisplay && this.game && this.game.formationSpacingMultiplier !== undefined) {
             this.formationSpacingSlider.value = this.game.formationSpacingMultiplier.toString();
             this.spacingValueDisplay.textContent = this.game.formationSpacingMultiplier.toFixed(1);
        }
         if(this.game && this.game.ui && this.game.currentFormationType) { 
            this.updateFormationButton(this.game.currentFormationType); 
         }
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
        if (this.toggleFormationButton && formationType) { 
            this.toggleFormationButton.textContent = `Formation: ${formationType.charAt(0).toUpperCase() + formationType.slice(1).toLowerCase()}`;
        }
    }

    updateSquadPanel(squadToDisplay) { 
        const displaySquad = squadToDisplay || (this.game ? this.game.deployedSquadRoster : []) || [];

        if (!this.game || !this.squadPanel) return; 

        this.squadPanel.innerHTML = ''; 
        displaySquad.forEach((raccoon) => {
            if (!raccoon) return; 
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('squad-member');
            if (this.game.selectedUnits && this.game.selectedUnits.includes(raccoon)) {
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
                <div><span class="label">ID:</span> <span class="value">${raccoon.id}</span></div>
                <div><span class="label">Rank:</span> <span class="value">${raccoon.rank || 'Recruit'}</span></div>
                <div><span class="label">HP:</span> <span class="value">${Math.max(0, Math.round(raccoon.hp))} / ${raccoon.maxHp}</span></div>
                <div class="health-bar-container">
                    <div class="health-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
                </div>
                <div><span class="label">Grenades:</span> <span class="value">${raccoon.grenadeAmmo !== undefined ? raccoon.grenadeAmmo : 'N/A'}</span></div> 
                <div><span class="label">Status:</span> <span class="value ${statusClass}">${statusText}</span></div>
                <div><span class="label">XP:</span> <span class="value">${raccoon.xp !== undefined ? raccoon.xp : 0}</span></div>
            `;
            
            infoOverlay.addEventListener('click', (e) => {
                e.stopPropagation(); 
                 if (raccoon.isAlive() && this.game) {  
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
                    
                    this.updateSquadPanel(this.game.deployedSquadRoster);  
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