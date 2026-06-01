// js/campaignRules.js
const CAMPAIGN_RULES = {
    // PLAYER_STARTING_SEED: Date.now(),
    CAMPAIGN_LENGTH_PHASES_RANGE: [20, 50], // Campaign will have between 20 and 50 phases.

    // --- Base Values and Scaling ---
    BASE_PARAMETERS: {
        worldWidthFactor: { initial: 1.2, perPhaseIncrement: 0.15, max: 8.0, randomnessFactor: 0.2 }, // High randomness 
        worldHeightFactor: { initial: 1.1, perPhaseIncrement: 0.15, max: 8.0, randomnessFactor: 0.2 }, // High randomness
        obstacleCountPhaseIncrement: { initial: 1.0, perPhaseIncrement: 0.15, max: 8.0, randomnessFactor: 0.2  }, 
        enemyDensityFactor: { initial: 1.0, perPhaseGrowthFactor: 0.15, max: 5.0, randomnessFactor: 0.2 }, // 20% growth per phase
        heavyChance: { initial: 0.1, perPhaseGrowthFactor: 0.1, max: 0.45, randomnessFactor: 0.05, unlocksPhase: 1 },
        sniperChance: { initial: 0.05, perPhaseGrowthFactor: 0.08, max: 0.45, randomnessFactor: 0.05, unlocksPhase: 3 },
        eliteChance: { initial: 0.05, perPhaseGrowthFactor: 0.07, max: 0.45, randomnessFactor: 0.05, unlocksPhase: 4 },
        numDestroyTargets: { initial: 1, perPhaseIncrement: 0.2, max: 4, roundToInt: true, randomnessFactor: 0 }, // For a single "DESTROY_TARGET" objective instance
        numHostagesToSpawn: { initial: 1, perPhaseIncrement: 0.2, max: 4, roundToInt: true, randomnessFactor: 0.1 },
        minHostagesToRescue: { initial: 1, perPhaseIncrement: 0.3, max: 4, roundToInt: true, relativeToSpawnedMaxFactor: 0.75 },
        numIntelConsoles: { initial: 1, perPhaseIncrement: 0.3, max: 3, roundToInt: true },
        intelHackTimeBase: { initial: [10, 20], perPhaseBonus: [2, 4] },
        intelSpawnChance: { initial: 0.3, perPhaseGrowthFactor: 0.1, max: 0.8 },
        intelSpawnCountMin: { initial: 1, perPhaseIncrement: 0.2, max: 1 },
        intelSpawnCountMax: { initial: 1, perPhaseIncrement: 0.5, max: 4 },
        intelSpawnInterval: { initial: 3.0, perPhaseDecrement: 0.2, min: 1.0 },
        intelSpawnTotalLimit: { initial: 3, perPhaseIncrement: 1, max: 10 },
        numPrimaryObjectivesRange: [1, 1], // Likely always 1 primary
        numSecondaryObjectives: {
            baseRange: [0, 0],          // At Phase 0, select between 0 and 1 secondary objectives.
            incrementPerPhase: 0.5,     // Add 0.5 to both min and max of the range per phase.
            maxRange: [2, 4]            // The range will not exceed a max of [1, 4].
        },
    },

    // --- Pools of Options ---
    BIOME_POOL: [
        { name: "TROPICAL", weight: 4, unlocksPhase: 0, description: "dense, overgrown jungle region", themeAdjectives: ["Verdant", "Whispering", "Wild", "Primal", "Canopy"] },
        { name: "TEMPERATE", weight: 4, unlocksPhase: 2, description: "temperate forest", themeAdjectives: ["Autumn", "Golden", "Crisp", "Wooded", "Serene"] },
    /*    { name: "JUNKYARD", weight: 3, unlocksPhase: 0, description: "a sprawling, rusted-out scrap-city", themeAdjectives: ["Scrapheap", "Rusty", "Toxic", "Forgotten", "Makeshift"] },
        { name: "SWAMP", weight: 3, unlocksPhase: 1, description: "a murky, treacherous wetland", themeAdjectives: ["Murky", "Fetid", "Gator's", "Sunken", "Misty"] },
        { name: "URBAN_DECAY", weight: 2, unlocksPhase: 2, description: "a ruined, concrete wasteland", themeAdjectives: ["Ruined", "Collapsed", "Concrete", "Ghost", "Shattered"] },
    */   ],

    OBJECTIVE_POOL: [
        // --- MODIFIED OBJECTIVE STRUCTURE ---
        // type: Unique identifier for the objective logic.
        // weight: Relative chance of this objective being selected.
        // unlocksPhase: Phase index (0-based) when this can appear.
        // descriptionTemplateKey: Key in CONFIG.UI_TEXT_STRINGS for the base description (e.g., "Destroy {targetNamePlural}").
        // completionCondition: String key for how Game.js checks completion.
        // isPrimary: (boolean, optional, default true) Can this be a primary mission goal?
        // canCoexistWith: (array of strings, optional) List of objective 'type's it can appear with. If null/undefined, assumes broad compatibility.
        // maxInstancesPerMission: (number, optional, default 1) How many of *this type* can be in one mission.
        // targetTypeKey: (string, optional) For "DESTROY_TARGET", links to CONFIG.OBSTACLE_DEFINITIONS type.
        // isPhaseFinaleCandidate: (boolean, optional, default false) Can this objective be chosen for an end-of-phase mission?
        // isBossObjective: (boolean, optional, default false) Does this objective involve a boss? (For future use)

        {
            type: "EXTERMINATE",
            weight: 5, // High weight if it can also be a standalone primary
            unlocksPhase: 0,
            descriptionTemplateKey: "OBJECTIVE_EXTERMINATE_TEXT", // e.g., "Eliminate Possums: {CURRENT}/{TOTAL}"
            completionCondition: "ALL_ENEMIES_ELIMINATED",
            isPrimary: true, // Can be a primary objective on its own
            canCoexistWith: ["DESTROY_TARGET", "RESCUE_HOSTAGES", "ASSASSINATION", "INTERACT_INTEL"], // Can be secondary to these
            maxInstancesPerMission: 1
        },
        {
            type: "DESTROY_TARGET",
            weight: 3,
            unlocksPhase: 1,
            descriptionTemplateKey: "OBJECTIVE_DESTROY_TARGET_GENERIC_TEXT", // e.g., "Destroy {targetNamePlural}: {CURRENT}/{TOTAL}"
            completionCondition: "ALL_TARGET_TYPE_DESTROYED",
            isPrimary: true,
            canCoexistWith: ["RESCUE_HOSTAGES", "ASSASSINATION", "EXTERMINATE", "INTERACT_INTEL"], // Can be secondary to these
            // targetTypeKey is not here, it's defined in DESTROY_TARGET_TYPE_POOL. This entry is generic.
            // maxInstancesPerMission for "DESTROY_TARGET" itself might be high (e.g., 3) to allow
            // "Destroy Huts" AND "Destroy Towers" in one mission. The specific target types below
            // will have their own maxInstances.
            maxInstancesPerMission: 2, // Max distinct "destroy X" objectives in one mission
            isPhaseFinaleCandidate: true
        },
        {
            type: "RESCUE_HOSTAGES",
            weight: 3,
            unlocksPhase: 2,
            descriptionTemplateKey: "OBJECTIVE_RESCUE_HOSTAGES_TEXT", // e.g., "Rescue Hostages: {CURRENT_RESCUED}/{TOTAL_TO_RESCUE} (Evacuated: {CURRENT_EVACUATED})"
            completionCondition: "MIN_HOSTAGES_RESCUED_AND_EVACUATED",
            isPrimary: true,
            canCoexistWith: ["EXTERMINATE", "DESTROY_TARGET", "ASSASSINATION", "INTERACT_INTEL", "EXTRACTION"],
            maxInstancesPerMission: 1
        },
        {
            type: "ASSASSINATION",
            weight: 0.1, // Keep this relatively low if it's mainly for phase finales
            unlocksPhase: 3, // Or 0 if you want non-boss assassinations earlier
            descriptionTemplateKey: "OBJECTIVE_ASSASSINATE_TEXT", // e.g., "Eliminate VIP: {TARGET_CALLSIGN}"
            completionCondition: "VIP_ELIMINATED",
            isPrimary: true,
            canCoexistWith: ["EXTERMINATE", "DESTROY_TARGET", "RESCUE_HOSTAGES", "INTERACT_INTEL"], // Can it co-exist with other objectives? Maybe just EXTERMINATE as a secondary.
            maxInstancesPerMission: 1,
            isPhaseFinaleCandidate: true, // GOOD!
            // isBossObjective: true // This can be inferred if the chosen target from ASSASSINATION_TARGET_POOL has isBoss: true
            // No need for targetTypeKey here, as that's for DESTROY_TARGET
        },
        {
            type: "INTERACT_INTEL",
            weight: 2,
            unlocksPhase: 4,
            descriptionTemplateKey: "OBJECTIVE_INTERACT_INTEL_TEXT",
            completionCondition: "ALL_INTEL_CONSOLES_CAPTURED",
            isPrimary: false,
            canCoexistWith: ["EXTERMINATE", "DESTROY_TARGET", "RESCUE_HOSTAGES", "ASSASSINATION"],
            maxInstancesPerMission: 1,
            targetTypeKeyPrefix: "intel_console"
        },
        // NEW: Extraction objective for phase finales
        {
            type: "EXTRACTION",
            weight: 0, // Not randomly selected - always added for phase finales
            unlocksPhase: 0,
            descriptionTemplateKey: "OBJECTIVE_EXTRACTION_TEXT",
            completionCondition: "ALL_RACCOONS_EXTRACTED",
            isPrimary: false, // Added automatically, not counted as primary
            canCoexistWith: ["EXTERMINATE", "DESTROY_TARGET", "ASSASSINATION", "RESCUE_HOSTAGES", "INTERACT_INTEL"],
            maxInstancesPerMission: 1,
            isPhaseFinaleOnly: true // Custom flag - only added for phase finales
        }
    ],

    // This pool now defines specific *types* of targets for the generic "DESTROY_TARGET" objective
    DESTROY_TARGET_TYPE_POOL: [
        // targetTypeKeyPrefix: Matches 'type' prefix in CONFIG.OBSTACLE_DEFINITIONS.
        // nameSingular/Plural: For UI text.
        // weight: Chance of this specific target type being chosen for a "DESTROY_TARGET" objective.
        // unlocksPhase: When this target type becomes available.
        // maxInstancesPerMission: How many of THIS SPECIFIC target type (e.g., huts) can be part of one "DESTROY_TARGET" objective.
        //                         e.g., "Destroy 3 Possum Huts". The '3' comes from BASE_PARAMETERS.numDestroyTargets.
        //                         This maxInstancesPerMission here means you wouldn't have "Destroy Huts" and "Destroy More Huts"
        //                         as two separate line items on the objective list for the same mission.
        {
            targetTypeKeyPrefix: "possum_hut",
            nameSingular: "Possum Hut", namePlural: "Possum Huts",
            weight: 4, unlocksPhase: 1,
            maxInstancesPerMission: 1
        },
        {
            targetTypeKeyPrefix: "possum_barracks",
            nameSingular: "Possum Barracks", namePlural: "Possum Barracks",
            weight: 3, unlocksPhase: 2,
            maxInstancesPerMission: 1
        },
        {
            targetTypeKeyPrefix: "possum_relay_tower",
            nameSingular: "Possum Relay Tower", namePlural: "Possum Relay Towers",
            weight: 1, unlocksPhase: 3,
            maxInstancesPerMission: 1
        },
    ],

    // --- Assasination Targets ---
    ASSASSINATION_TARGET_POOL: [
        // Each entry is a potential assassination target.
        // name: The name of the target.
        // callsign: The callsign used in mission briefings.
        // description: A brief description of the target.
        // weight: Relative chance of this target being chosen.
        // unlocksPhase: The phase when this target becomes available.
        // isBoss: (boolean, optional, default false) Is this a boss-level target?
        {
            assassinationTypeKey: "possum_revolver_boss",
            name: "Six-Shooter Sid", callsign: "Sidewinder",
            description: "A notoriously fast and mobile gunslinger.",
            weight: 0, unlocksPhase: 3, isBoss: true
        },
        {
            assassinationTypeKey: "possum_eliteGuard",
            name: "Grand Sentry Talon", callsign: "Arsenal",
            description: "A highly-ranked possum commander clad in elite copper plating, wielding an advanced energy weapon of unknown origin. Extremely intelligent and deadly.",
            weight: 3, unlocksPhase: 4, isBoss: false // Elite Guard is a mini-boss, not a main boss. Can appear as an assassination target in regular missions, but more likely in later phases.
        },
        {
            assassinationTypeKey: "possum_boss_1",
            name: "Maddog Whiskers", callsign: "Whiskers",
            description: "A cunning strategist known for his brutal tactics.",
            weight: 0, unlocksPhase: 5, isBoss: true
        },
        {
            assassinationTypeKey: "possum_boss_3",
            name: "Ironhide Igor", callsign: "Ironhide",
            description: "A heavily armored nutter with a minigun. Slow but relentless.",
            weight: 3, unlocksPhase: 6, isBoss: true
        },
        {
            assassinationTypeKey: "possum_boss_4",
            name: "Professor Talon", callsign: "Overmind",
            description: "A menacing possum mastermind who hovers above the battlefield in a levitating chair, wielding a devastating charged rail gun. Deadly accurate and cunning — he can fire piercing charged shots that cut through multiple targets.",
            weight: 3, unlocksPhase: 7, isBoss: true
        },
        {
            assassinationTypeKey: "possum_revolver_boss",
            name: "Captain Fuzzy", callsign: "Fuzzy",
            description: "An experienced fighter with a history of leading successful raids.",
            weight: 0, unlocksPhase: 7, isBoss: true
        },
        

    ],

    // --- Phase Generation Text ---
    PHASE_GENERATION: {
        missionsPerPhase: {
            baseRange: [3, 4],          // At Phase 0, it will be exactly 3 missions.
            incrementPerPhase: 0.4,     // Add 0.5 to both min and max of the range per phase.
            maxRange: [4, 6]            // The range will not exceed a max of [4, 8].
        },
        NAME_PARTS: {
            PREFIXES: ["Operation", "Task Force", "Project", "Campaign", "Initiative", "Directive", "Protocol", "Vanguard", "Spearhead", "Crusade"],
            DESCRIPTORS: ["Fury", "Dawn", "Viper", "Thunder", "Silence", "Ghost", "Resolve", "Echo", "Retribution", "Genesis", "Last Stand", "Steel Rain", "Broken Fang", "Avalanche", "Quake"]
        },
        INTRODUCTION_TEMPLATES: [
            "Phase {phaseNum} begins, Platoon. '{phaseName}' is our next objective. The Possum scum have entrenched themselves in {biomeDescription}. Your mission: {phaseObjectiveSummary}.",
            "Attention, Platoon! Phase {phaseNum} is upon us. '{phaseName}' is the name of the game. The enemy has fortified positions in {biomeDescription}. Your task: {phaseObjectiveSummary}.",
            "Platoon, we are entering Phase {phaseNum}. The operation is codenamed '{phaseName}'. Possum forces are heavily entrenched in {biomeDescription}. Your orders: {phaseObjectiveSummary}.",
            "Platoon, brace yourselves! Phase {phaseNum} is here. The operation, '{phaseName}', will take us into {biomeDescription}. Your objective: {phaseObjectiveSummary}. Prepare for heavy resistance.",
            "Intel reports a significant Possum buildup in the {biomeDescription}. Your objective for Phase {phaseNum}, '{phaseName}', is to {phaseObjectiveSummary}. High command expects results, Platoon.",
            "Phase {phaseNum}, '{phaseName}', commences. We've tracked the enemy to {biomeDescription}. Your primary goal: {phaseObjectiveSummary}. Show them no mercy.",
            "The fight continues into Phase {phaseNum}: '{phaseName}'. Possum forces are entrenched in {biomeDescription}. We need you to {phaseObjectiveSummary}. Failure is not an option.",
            "Alright, Platoon, listen up! Phase {phaseNum} is '{phaseName}'. The brass wants us to hit 'em hard in {biomeDescription} and {phaseObjectiveSummary}. Let's move out!",
            "New orders for Phase {phaseNum}, '{phaseName}'. Satellite imagery confirms heavy Possum activity in {biomeDescription}. Your mission: {phaseObjectiveSummary}. Good luck out there, you'll need it."
        ],
        CONCLUSION_TEMPLATES: [
            "Phase {phaseNum}, '{phaseName}', is complete. {missionCount} of {totalMissions} missions succeeded. {enemiesKilled} Possums eliminated. {casualtyReport}. Re-arm and resupply.",
            "Mission accomplished, Platoon. Phase {phaseNum}, '{phaseName}', saw {enemiesKilled} enemy kills and {casualtyCount} casualties among our ranks. {casualtyReport}.",
            "Phase {phaseNum} concluded. '{phaseName}' objectives achieved across {totalMissions} operations, neutralizing {enemiesKilled} hostiles. {casualtyReport}.",
            "Phase {phaseNum}, '{phaseName}': {enemiesKilled} Possums down, {hostagesRescued}assets recovered. {casualtyReport}. Prepare for the next phase.",
            "Report for Phase {phaseNum}: {totalMissions} missions, {enemiesKilled} kills, {casualtyCount} KIA. {casualtyReport}. The fight continues.",
            "That's a wrap on Phase {phaseNum}, '{phaseName}'. {enemiesKilled} hostiles neutralized in {biomeDescription}. {casualtyReport}.",
        ],
        OBJECTIVE_SUMMARIES_POOL: [
            "eliminate all Possum forces in the area", "destroy key Possum infrastructure and supply lines",
            "rescue all captured Raccoon assets and hostages", "assassinate the Possum leader in the sector",
            "disrupt their supply lines and logistics networks", "eliminate key enemy leadership and command structures in the region",
            "secure the area and establish a forward operating base", "rescue captured assets and gather critical intelligence",
            "destroy critical enemy infrastructure and sow widespread chaos", "conduct a major offensive operation to break their lines",
            "perform a series of surgical strikes on Possum dens and rally points", "pacify the sector and deny enemy movement",
            "recover vital lost equipment before it falls into Possum paws"
        ],
        CASUALTY_REPORTS_POOL: [
            "Casualties were light, we can rebuild.", "Minimal losses, the Possums are reeling.",
            "We took some hits, but the mission was a success.", "Losses were acceptable, we achieved our objectives.",
            "Casualties were minimal, outstanding work!", "We took some hits, but losses were acceptable given the circumstances.",
            "Losses were heavy, a grim reminder of the stakes.", "Significant casualties reported, but the mission was a success.",
            "The price was high, but the Possums paid dearer. Many brave Raccoons fell today."
        ],
        OUTCOME_ADJECTIVES_POOL: ["clear for now", "still contested", "relatively stabilized", "highly volatile", "a smoking ruin", "temporarily secured", "under our control"],
        OUTCOME_VERBS_POOL: ["significantly weakened", "thoroughly disrupted", "partially shattered", "momentarily contained", "utterly decimated", "pushed back", "neutralized"]
    },

    // --- Mission Name and Briefing Parts ---
    MISSION_NAME_PARTS: {
        ADJECTIVES: ["Alpha", "Bravo", "Charlie", "Delta", "Urgent", "Critical", "Swift", "Silent", "Iron", "Steel", "Final", "Dirty", "Bloody", "Hidden", "Forgotten", "Last"],
        NOUNS_GENERAL: ["Strike", "Patrol", "Offensive", "Incursion", "Recon", "Sweep", "Siege", "Breakthrough", "Gambit", "Raid", "Extraction", "Assault", "Stand", "Push", "Hunt"],
        LOCATIONS_GENERAL: ["Point", "Ridge", "Valley", "Crossing", "Outpost", "Sector", "Zone", "Complex", "Perimeter", "Pass", "Junction", "Depot", "Bridgehead", "Quarry", "Gulch"]
    },
    MISSION_BRIEFING_TEMPLATES: [
        "Intel reports {enemyAdjective} Possum activity near {locationNoun} in the {biomeAdjective} {biomeNoun}. Your primary objective is to {objectiveDescription}. Expect {enemyCompositionHint} and possible traps.",
        "Operation {missionName}: We need you to move on {locationNoun} within the {biomeAdjective} {biomeNoun}. {objectiveDescription}. Current enemy assessment suggests {enemyAdjective} resistance, likely {enemyCompositionHint}. Stay sharp.",
        "High command has greenlit an operation at {locationNoun}, deep in the {biomeAdjective} {biomeNoun}. Task is to {objectiveDescription}. Be advised, {enemyCompositionHint} are confirmed in the area. Resistance will be {enemyAdjective}. No backup available.",
        "Recon teams have identified {locationNoun} in the {biomeAdjective} {biomeNoun} as a key enemy position. You are to {objectiveDescription}. Proceed with caution; {enemyCompositionHint} are present and considered {enemyAdjective}. Make 'em pay.",
        "This is a priority alert: {objectiveDescription} at {locationNoun} in the {biomeAdjective} {biomeNoun}. Enemy forces are {enemyAdjective} and include {enemyCompositionHint}. Get it done, Platoon."
    ],
    BRIEFING_PARTS: {
        ENEMY_ADJECTIVES: ["light", "moderate", "heavy", "significant", "entrenched", "scattered", "unconfirmed", "dug-in", "roaming", "well-equipped", "elite", "veteran", "desperate", "fanatical"],
        BIOME_ADJECTIVES: {
            TROPICAL: ["dense", "ancient", "sun-dappled", "misty", "overgrown", "impenetrable", "shadowy", "primeval"],
            TEMPERATE: ["golden", "autumn", "crisp", "woodland", "rural", "harvest", "amber", "barren"],
            JUNKYARD: ["sprawling", "rusting", "treacherous", "cluttered", "metallic", "toxic", "labyrinthine", "forgotten"],
            SWAMP: ["murky", "fetid", "stagnant", "treacherous", "gator-infested", "mist-shrouded", "suffocating", "malarial"],
            URBAN_DECAY: ["ruined", "war-torn", "abandoned", "crumbling", "concrete", "ghost-ridden", "skeletal", "desolate"],
        },
        LOCATION_NOUNS: {
            TROPICAL: ["clearing", "thicket", "outpost", "logging camp", "riverbend", "hidden grove", "ancient ruin", "waterfall base"],
            TEMPERATE: ["clearing", "grove", "meadow", "orchard", "hilltop", "woodland path", "old farmstead", "stone wall"],
            JUNKYARD: ["scrap pile", "main yard", "crusher zone", "storage sector", "derelict maze", "vehicle graveyard", "collapsed overpass", "chemical spill"],
            SWAMP: ["bog", "mire", "flooded village", "gator nest", "hidden islet", "mangrove cluster", "sunken shrine", "rickety boardwalk"],
            URBAN_DECAY: ["ruined square", "collapsed structure", "abandoned factory", "sewer entrance", "rooftop network", "bombed-out street", "subway station", "fortified checkpoint"],
        },
        ENEMY_COMPOSITION_HINTS: [
            "mostly stupid grunts with light support", "a mix of brain-dead grunts and several heavy units", "dumb heavies providing suppressing fire from fortified positions",
            "dug-in riflemen with overlapping fields of fire", "patrols with heavy support and possible spotters", "well-armed possums, likely veterans",
            "entrenched enemy positions with good cover", "multiple enemy squads coordinating their defense", "a strong defensive line, possibly with makeshift traps",
            "elite Possum units leading the charge", "a desperate last stand with whatever they can find"
        ],
        NIGHT_BRIEFING_PREFIXES: [
            "Under cover of darkness,",
            "Intel confirms a night window.",
            "Command has authorized a nocturnal strike.",
            "Satellite imagery is blind at night — you're going in dark.",
            "Night vision is not available. Trust your instincts.",
            "This one goes down after sundown.",
            "Zero illumination. Zero backup.",
        ],
        NIGHT_BRIEFING_SUFFIXES: [
            "Visibility will be severely limited. Stay tight.",
            "Watch your flanks — the dark works both ways.",
            "Move fast. The enemy knows these shadows too.",
            "Stealth is your only advantage. Use it.",
            "Expect the unexpected. Night changes everything.",
            "Keep your squad close. Stragglers don't come back.",
            "The darkness is your cover. Don't waste it.",
        ],
    }
};