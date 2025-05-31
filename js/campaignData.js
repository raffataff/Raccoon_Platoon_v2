const CAMPAIGN_DATA = [
    { // Phase 1
        name: "Phase 1: The Backyard Blitz",
        introduction: "The Possum menace has encroached upon our sacred trash cans! It's time to push them back, starting with the suburbs.",
        missions: [
            {
                name: "Mission 1: Garden Skirmish (Hostage Test)", // Updated name for clarity
                briefing: "Intel reports light Possum activity and captured comrades in a residential backyard. Rescue them and clear out any remaining Possums.",
                worldSizeFactor: 2.0,
                enemyDensityFactor: 0.7, // You can keep enemies or set to 0 for easier hostage testing
                objectiveType: "RESCUE_HOSTAGES", // Changed to RESCUE_HOSTAGES
                numHostagesToSpawn: 2,        // Example: Spawn 2 hostages
                minHostagesToRescueForWin: 2  // Example: Need to rescue at least 2
                // NOTE: If you want an EXTERMINATE objective alongside, we'll need to handle multiple objectives later.
                // For now, we'll focus on making RESCUE_HOSTAGES work as the sole objective.
            },
            {
                name: "Mission 2: Shed Siege",
                briefing: "A fortified shed is believed to be a Possum rally point. It's likely to be more heavily guarded. Secure the area.",
                worldSizeFactor: 2.5,
                enemyDensityFactor: 1.0,
                objectiveType: "EXTERMINATE"
            },
            {
                name: "Mission 3: Junkyard Jaunt",
                briefing: "Scouts have tracked Possums retreating into a nearby junkyard. The terrain is cluttered, perfect for ambushes. Stay sharp.",
                worldSizeFactor: 3.0,
                enemyDensityFactor: 1.2,
                objectiveType: "EXTERMINATE",
            },
            // --- NEW HOSTAGE RESCUE MISSION ---
            {
                name: "Mission 4: Caged Comrades",
                briefing: "We've received word that several of our platoon mates have been captured and are being held in a makeshift Possum prison. Infiltrate, rescue them, and ensure their survival.",
                worldSizeFactor: 2.8,
                enemyDensityFactor: 1.1,
                objectiveType: "RESCUE_HOSTAGES", // New objective type
                numHostagesToSpawn: 3,            // How many hostages for this mission
                minHostagesToRescueForWin: 2      // How many must survive & be rescued
            }
        ],
        conclusion: "Phase 1 complete! The suburbs are a little safer, but the fight is far from over."
    },
    { // Phase 2
        name: "Phase 2: Swamp Stomp",
        introduction: "The Possums have dug into the murky swamps. Time to get our paws dirty and flush them out!",
        missions: [
            {
                name: "Mission 1: Bog Recon",
                briefing: "Navigate the treacherous bog. Enemy presence unknown, proceed with caution. Visibility may be limited.",
                worldSizeFactor: 3.0,
                enemyDensityFactor: 0.8,
                objectiveType: "EXTERMINATE",
            },
            {
                name: "Mission 2: Gator Bait", 
                briefing: "Heavier resistance expected around a key waterway. Secure the crossing.",
                worldSizeFactor: 3.5,
                enemyDensityFactor: 1.3,
                objectiveType: "EXTERMINATE"
            }
        ],
        conclusion: "The swamps are Possum-free... for now. Excellent work, Platoon!"
    }
    // Add more phases here
];

// Make it available to other scripts
// If not using modules, it will be a global variable.
// If using modules, you would export it: export default CAMPAIGN_DATA;