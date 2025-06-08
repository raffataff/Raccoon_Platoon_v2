// js/campaignRules.js
const CAMPAIGN_RULES = {
    PLAYER_STARTING_SEED: Date.now(),
    CAMPAIGN_LENGTH_PHASES_RANGE: [3, 5], // Campaign will have 3 to 5 phases

    // --- Base Values and Scaling ---
    // These parameters will be calculated at the start of each mission based on the current phase.
    // Formula: finalValue = (initial + (perPhaseIncrement * currentPhaseIndex)) capped by max.
    // Then: finalValue *= (1 + rng.nextFloat(-randomnessFactor, randomnessFactor))
    // If roundToInt is true, the result is rounded.
    BASE_PARAMETERS: {
        worldSizeFactor:    { initial: 1.8,  perPhaseIncrement: 0.35, max: 5.0, randomnessFactor: 0.15 },
        enemyDensityFactor: { initial: 1.1, perPhaseIncrement: 0.25, max: 2.5, randomnessFactor: 0.2 },
        heavyChance:        { initial: 0.08, perPhaseIncrement: 0.09, max: 0.65, randomnessFactor: 0.05 },
        // Future: sniperChance, grenadierChance etc. would go here
        numDestroyTargets:  { initial: 1,    perPhaseIncrement: 0.4,  max: 4, roundToInt: true, randomnessFactor: 0 },
        numHostagesToSpawn: { initial: 1,    perPhaseIncrement: 0.6,  max: 5, roundToInt: true, randomnessFactor: 0.1 },
        minHostagesToRescue:{ initial: 1,    perPhaseIncrement: 0.3,  max: 3, roundToInt: true, relativeToSpawnedMaxFactor: 0.75 }
    },

    // --- Pools of Options ---
    BIOME_POOL: [
        // `unlocksPhase`: Phase index (0-based) when this biome can start appearing.
        // `weight`: Relative chance of this biome being selected once unlocked.
        { name: "FOREST",       weight: 4, unlocksPhase: 0, description: "a dense, overgrown jungle region", themeAdjectives: ["Verdant", "Whispering", "Wild", "Primal", "Canopy"] },
        { name: "JUNKYARD",     weight: 3, unlocksPhase: 0, description: "a sprawling, rusted-out scrap-city", themeAdjectives: ["Scrapheap", "Rusty", "Toxic", "Forgotten", "Makeshift"] },
        { name: "SWAMP",        weight: 3, unlocksPhase: 1, description: "a murky, treacherous wetland", themeAdjectives: ["Murky", "Fetid", "Gator's", "Sunken", "Misty"] },
        { name: "URBAN_DECAY",  weight: 2, unlocksPhase: 2, description: "a ruined, concrete wasteland", themeAdjectives: ["Ruined", "Collapsed", "Concrete", "Ghost", "Shattered"] },
        // { name: "DESERT_SCRAP", weight: 2, unlocksPhase: 2, description: "a sun-baked desert filled with wreckage", themeAdjectives: ["Desert", "Sunken", "Dusty", "Barren", "Scorched"] },
        // { name: "VOLCANIC_WASTE", weight: 1, unlocksPhase: 3, description: "an ash-choked volcanic wasteland", themeAdjectives: ["Volcanic", "Ashen", "Fiery", "Obsidian", "Burning"] },
    ],

    OBJECTIVE_POOL: [
        { type: "EXTERMINATE",      weight: 5, unlocksPhase: 0, description: "eliminate all hostile Possums in the area" },
        { type: "DESTROY_TARGET",   weight: 4, unlocksPhase: 0, description: "destroy key enemy {targetNamePlural}" },
        { type: "RESCUE_HOSTAGES",  weight: 7, unlocksPhase: 0, description: "rescue {numHostages} captured comrade(s)" },
        // { type: "ASSASSINATION",    weight: 2, unlocksPhase: 2, description: "eliminate a high-value Possum target, '{targetCallsign}'" },
        // { type: "DEFEND_AREA",      weight: 2, unlocksPhase: 2, description: "hold the {defendLocationNoun} against enemy assault for {defendTimeMinutes} minutes"},
        // { type: "CAPTURE_INTEL",    weight: 1, unlocksPhase: 1, description: "secure enemy intelligence from the {intelLocationNoun}"},
    ],

    DESTROY_TARGET_TYPE_POOL: [
        { type: "possum_hut",                weight: 4, unlocksPhase: 0, nameSingular: "Possum Hut", namePlural: "Possum Huts" },
        { type: "possum_relay_tower",       weight: 3, unlocksPhase: 1, nameSingular: "Possum Relay Tower", namePlural: "Possum Relay Towers" },
    //    { type: "explosive_barrel_cluster",  weight: 3, unlocksPhase: 0, nameSingular: "Explosive Barrel Cluster", namePlural: "Explosive Barrel Clusters" },
    //    { type: "makeshift_barricade_large", weight: 2, unlocksPhase: 1, nameSingular: "Large Makeshift Barricade", namePlural: "Large Makeshift Barricades" }, // Example new target
        // { type: "comms_tower",               weight: 2, unlocksPhase: 1, nameSingular: "Comms Tower", namePlural: "Comms Towers" },
        // { type: "fuel_depot",                weight: 1, unlocksPhase: 2, nameSingular: "Fuel Depot", namePlural: "Fuel Depots" },
        // { type: "weapon_cache",              weight: 1, unlocksPhase: 2, nameSingular: "Weapon Cache", namePlural: "Weapon Caches" },
    ],

    // --- Phase Generation Text ---
    PHASE_GENERATION: {
        MISSIONS_PER_PHASE_RANGE: [2, 4], // Min/Max missions per phase
        NAME_PARTS: { // For Phase Names like "Operation Jungle Fury"
            PREFIXES: ["Operation", "Task Force", "Project", "Campaign", "Initiative", "Directive", "Protocol", "Vanguard", "Spearhead", "Crusade"],
            // THEMES are now derived from the chosen Biome's `themeAdjectives`
            DESCRIPTORS: ["Fury", "Dawn", "Viper", "Thunder", "Silence", "Ghost", "Resolve", "Echo", "Retribution", "Genesis", "Last Stand", "Steel Rain", "Broken Fang", "Avalanche", "Quake"]
        },
        INTRODUCTION_TEMPLATES: [
            "Intel reports a significant Possum buildup in the {biomeDescription}. Your objective for Phase {phaseNum}, '{phaseName}', is to {phaseObjectiveSummary}. High command expects results, Platoon.",
            "Phase {phaseNum}, '{phaseName}', commences. We've tracked the enemy to {biomeDescription}. Your primary goal: {phaseObjectiveSummary}. Show them no mercy.",
            "The fight continues into Phase {phaseNum}: '{phaseName}'. Possum forces are entrenched in {biomeDescription}. We need you to {phaseObjectiveSummary}. Failure is not an option.",
            "Alright, Platoon, listen up! Phase {phaseNum} is '{phaseName}'. The brass wants us to hit 'em hard in {biomeDescription} and {phaseObjectiveSummary}. Let's move out!",
            "New orders for Phase {phaseNum}, '{phaseName}'. Satellite imagery confirms heavy Possum activity in {biomeDescription}. Your mission: {phaseObjectiveSummary}. Good luck out there, you'll need it."
        ],
        CONCLUSION_TEMPLATES: [
            "Excellent work on Phase {phaseNum}, '{phaseName}'. {biomeDescription} is temporarily pacified. Stand by for further orders. {casualtyReport}.",
            "Phase {phaseNum}, '{phaseName}', is complete. {casualtyReport}. The theatre of operations in {biomeDescription} is now {outcomeAdjective}. Re-arm and resupply.",
            "With Phase {phaseNum}, '{phaseName}', concluded, Possum influence in {biomeDescription} has been {outcomeVerb}. Prepare for the next front. {casualtyReport}.",
            "That's a wrap on Phase {phaseNum}, '{phaseName}'. You stirred up a real hornet's nest in {biomeDescription}. It's {outcomeAdjective}, but the job's done. {casualtyReport}.",
            "Target objectives for Phase {phaseNum}, '{phaseName}', achieved. {biomeDescription} is {outcomeVerb}. Medals for some, memorial for others. {casualtyReport}."
        ],
        OBJECTIVE_SUMMARIES_POOL: [
            "disrupt their supply lines and logistics networks", "eliminate key enemy leadership and command structures in the region",
            "secure the area and establish a forward operating base", "rescue captured assets and gather critical intelligence",
            "destroy critical enemy infrastructure and sow widespread chaos", "conduct a major offensive operation to break their lines",
            "perform a series of surgical strikes on Possum dens and rally points", "pacify the sector and deny enemy movement",
            "recover vital lost equipment before it falls into Possum paws"
        ],
        CASUALTY_REPORTS_POOL: [
            "Casualties were minimal, outstanding work!", "We took some hits, but losses were acceptable given the circumstances.",
            "Losses were heavy, a grim reminder of the stakes.", "Significant casualties reported, but the mission was a success.",
            "The price was high, but the Possums paid dearer. Many brave Raccoons fell today."
        ],
        OUTCOME_ADJECTIVES_POOL: ["clear for now", "still contested", "relatively stabilized", "highly volatile", "a smoking ruin", "temporarily secured", "under our control"],
        OUTCOME_VERBS_POOL: ["significantly weakened", "thoroughly disrupted", "partially shattered", "momentarily contained", "utterly decimated", "pushed back", "neutralized"]
    },

    // --- Mission Name and Briefing Parts ---
    MISSION_NAME_PARTS: {
        // Adjectives can be combined with biome-specific nouns or objective types for mission names
        ADJECTIVES: ["Alpha", "Bravo", "Charlie", "Delta", "Urgent", "Critical", "Swift", "Silent", "Iron", "Steel", "Final", "Dirty", "Bloody", "Hidden", "Forgotten", "Last"],
        NOUNS_GENERAL: ["Strike", "Patrol", "Offensive", "Incursion", "Recon", "Sweep", "Siege", "Breakthrough", "Gambit", "Raid", "Extraction", "Assault", "Stand", "Push", "Hunt"],
        // Location nouns might be better suited for briefing text, but can sometimes fit mission names
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
            FOREST: ["dense", "ancient", "sun-dappled", "misty", "overgrown", "impenetrable", "shadowy", "primeval"],
            JUNKYARD: ["sprawling", "rusting", "treacherous", "cluttered", "metallic", "toxic", "labyrinthine", "forgotten"],
            SWAMP: ["murky", "fetid", "stagnant", "treacherous", "gator-infested", "mist-shrouded", "suffocating", "malarial"],
            URBAN_DECAY: ["ruined", "war-torn", "abandoned", "crumbling", "concrete", "ghost-ridden", "skeletal", "desolate"],
            // DESERT_SCRAP: ["scorched", "barren", "sun-blasted", "shifting", "isolated", "canyon-carved", "dust-choked"],
            // VOLCANIC_WASTE: ["ash-covered", "smoldering", "obsidian", "fiery", "unstable", "geothermal", "blasted"],
        },
        LOCATION_NOUNS: { // Specific locations within a biome for briefing flavor
            FOREST: ["clearing", "thicket", "outpost", "logging camp", "riverbend", "hidden grove", "ancient ruin", "waterfall base"],
            JUNKYARD: ["scrap pile", "main yard", "crusher zone", "storage sector", "derelict maze", "vehicle graveyard", "collapsed overpass", "chemical spill"],
            SWAMP: ["bog", "mire", "flooded village", "gator nest", "hidden islet", "mangrove cluster", "sunken shrine", "rickety boardwalk"],
            URBAN_DECAY: ["ruined square", "collapsed structure", "abandoned factory", "sewer entrance", "rooftop network", "bombed-out street", "subway station", "fortified checkpoint"],
            // DESERT_SCRAP: ["dry riverbed", "abandoned mine", "wrecked convoy site", "sand dune field", "rocky outcrop", "forgotten oasis", "hermit's shack"],
            // VOLCANIC_WASTE: ["lava tube entrance", "ash plain", "obsidian field", "geyser cluster", "magma fissure", "sulfur vent", "shattered peak"],
        },
        ENEMY_COMPOSITION_HINTS: [
            "mostly grunts with light support", "a mix of grunts and several heavy units", "heavies providing suppressing fire from fortified positions",
            "dug-in riflemen with overlapping fields of fire", "patrols with heavy support and possible spotters", "well-armed possums, likely veterans",
            "entrenched enemy positions with good cover", "multiple enemy squads coordinating their defense", "a strong defensive line, possibly with makeshift traps",
            "elite Possum units leading the charge", "a desperate last stand with whatever they can find"
        ],
        // Placeholders for future objective types, to be filled by Game.js
        // ASSASSINATION_TARGET_CALLSIGNS: ["Big Boss Possum", "General Waste", "Scrappy Jack", "Mama Mange", "One-Eye Willy", "The Trash King"],
        // DEFEND_LOCATION_NOUNS: ["key bridge", "makeshift comms relay", "supply drop", "fallen comrade", "evac point", "field hospital"],
        // INTEL_LOCATION_NOUNS: ["enemy command tent", "crashed recon drone", "captured informant's last known position", "abandoned research site", "smuggler's cache"]
    }
};