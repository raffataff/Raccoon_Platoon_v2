const MANUAL_CONTENT = [
    {
        id: "manual-overview",
        tabTitle: "OVERVIEW",
        sections: [
            {
                type: "header",
                content: "MISSION BRIEFING"
            },
            {
                type: "paragraph",
                content: "Welcome, Commander. Raccoon Platoon is a tactical squad-based survival game. Your goal is to guide your squad through hostile territory, completing objectives while minimizing casualties."
            },
            {
                type: "header",
                content: "MISSION TYPES"
            },
            {
                type: "list",
                items: [
                    { label: "ELIMINATE", color: "#ff9999", text: "Neutralize all possum scum in the sector." },
                    { label: "DESTROY", color: "#ffcc99", text: "Demolish enemy infrastructure (Huts, Radio Towers). Just be careful when 'disturbing the hornet's nest'." },
                    { label: "RESCUE", color: "#99ccff", text: "Locate and secure hostage units. Bring them to safety. Rescued hostages join the available recruits." }
                ]
            },
            {
                type: "header",
                content: "UI OVERVIEW"
            },
            {
                type: "list",
                items: [
                    { label: "Health Bars", text: "Green is HP. If it hits 0, the recruit is lost." },
                    { label: "Ammo", text: "Infinite for primary weapons." },
                    { label: "Grenades", text: "Limited stock per mission. Use wisely." }
                ]
            }
        ]
    },
    {
        id: "manual-controls",
        tabTitle: "CONTROLS",
        sections: [
            {
                type: "header",
                content: "FIELD CONTROLS"
            },
            {
                type: "controls",
                items: [
                    { key: "RMB Click", desc: "Move Unit" },
                    { key: "LMB Click/Hold", desc: "Shoot" },
                    { key: "CTRL + LMB Drag", desc: "Box Select Multiple Units" },
                    { key: "SPACE", desc: "Select ALL Squad Members" },
                    { key: "1 - 4", desc: "Select Specific Squad Member" },
                    { key: "5 - 0", desc: "Recall Saved Squad Group" },
                    { key: "CTRL + 5 - 0", desc: "Save Current Selection as Squad Group" },
                    { key: "SHIFT + LMB", desc: "Set Manual Target Lock (Focus Fire)" },
                    { key: "F", desc: "Toggle Formation" },
                    { key: "G", desc: "Throw Grenade (Aim & Click)" },
                    { key: "H", desc: "Toggle Hostage Hold/Follow" },
                    { key: "T", desc: "Call for Backup" },
                    { key: "ESC", desc: "Pause / Cancel Action" }
                ]
            }
        ]
    },
    {
        id: "manual-tactics",
        tabTitle: "TACTICS",
        sections: [
            {
                type: "header",
                content: "COMBAT TACTICS"
            },
            {
                type: "header-small",
                content: "FORMATIONS (Key: F)"
            },
            {
                type: "paragraph",
                content: "Switching formations adapts your squad's spacing and firing lines. Use spread formations against explosives and tight formations for concentrated fire."
            },
            {
                type: "header-small",
                content: "GRENADES (Key: G)"
            },
            {
                type: "paragraph",
                content: "Explosives deal massive area damage and destroy structures. Friendly fire is ON. Exercise caution."
            },
            {
                type: "header-small",
                content: "TARGET LOCK (Key: SHIFT + LMB)"
            },
            {
                type: "paragraph",
                content: "Force your squad to focus fire on a high-priority target (like a Heavy or Sniper) regardless of distance."
            },
            {
                type: "header-small",
                content: "HOSTAGE RESCUE (Key: H)"
            },
            {
                type: "paragraph",
                content: "Rescued hostages will follow your squad by default. Press 'H' to command them to Hold Position/Follow. Keep them safe until extraction!"
            },
            {
                type: "header-small",
                content: "CALL FOR BACKUP (Key: T)"
            },
            {
                type: "paragraph",
                content: "Call for backup to reinforce your position, teammates are not selected."
            },
        ]
    },
    {
        id: "manual-personnel",
        tabTitle: "PERSONNEL",
        sections: [
            {
                type: "header",
                content: "SQUAD MANAGEMENT"
            },
            {
                type: "header-small",
                content: "RANK & XP"
            },
            {
                type: "paragraph",
                content: "Recruits earn XP for kills and objective completion. Promotions grant increased Accuracy, Higher Max HP, and more Grenade capacity."
            },
            {
                type: "header-small",
                content: "PERMADEATH",
                style: "color: var(--brand-danger);"
            },
            {
                type: "paragraph",
                content: "If a Raccoon falls in battle, they are gone forever. Protect your veterans."
            },
            {
                type: "header-small",
                content: "MEMORIAL"
            },
            {
                type: "paragraph",
                content: "Visit the Recruit Memorial from the Main Menu to honor the fallen."
            }
        ]
    },
    {
        id: "manual-enemies",
        tabTitle: "ENEMIES",
        sections: [
            {
                type: "header",
                content: "POSSUM THREATS"
            },
            {
                type: "enemy-list",
                items: [
                    {
                        name: "Possum Grunt",
                        image: "assets/images/units/possum_grunt/idle/possum_grunt_idle_se.png",
                        description: "Standard infantry. Aggressive but basic. They patrol in groups and will chase you if spotted."
                    },
                    {
                        name: "Possum Heavy",
                        image: "assets/images/units/possum_heavy/idle/possum_heavy_idle_se.png",
                        description: "Durable and dangerous. Armed with heavy machine guns. They are slower but can soak up a lot of damage."
                    },
                    {
                        name: "Possum Sniper",
                        image: "assets/images/units/possum_sniper/idle/possum_sniper_idle_se.png",
                        description: "Long-range specialists. They aim for a few seconds (visible via laser) before firing a devastating shot. Eliminate them early!"
                    },
                    {
                        name: "Possum Elite",
                        image: "assets/images/units/possum_elite/type2/idle/possum_elite_idle_se.png",
                        description: "Highly trained and intelligent, wielding an advanced machine gun that doesn't need reloading. Rumour has it they were genetically modified with rats... Stay on your toes!"
                    },
                    {
                        name: "Grand Sentry Talon (Assassination Target)",
                        image: "assets/images/units/possum_eliteGuard/idle/possum_eliteGuard_idle_se.png",
                        description: "A highly-ranked possum commander clad in elite copper plating. He wields an advanced unknown-technology energy weapon that fires devastating cyan projectiles. Highly intelligent and lethal — treat with extreme caution."
                    },
                    {
                        name: "The Gunslinger (Boss)",
                        image: "assets/images/units/possum_revolver/idle/possum_revolver_idle_se.png",
                        description: "Fast-moving elite with advanced assault rifles. He strafes while shooting and reloads quickly. High priority target."
                    },
                    {
                        name: "General Scratchus (Boss)",
                        image: "assets/images/units/possum_boss_1/idle/possum_boss_1_idle_se.png",
                        description: "The commander of the possum forces. Cycles between grenade volleys and heavy MG fire. Watch out for his death explosion!"
                    },
                    {
                        name: "Ironhide Igor (Boss)",
                        image: "assets/images/units/possum_boss_3/idle/possum_boss_3_idle_se.png",
                        description: "A heavily armored brute wielding a deadly minigun. He mows down anything in his path. Keep your distance and watch for his escort!"
                    },
                    {
                        name: "Professor Flatbottom (Boss)",
                        image: "assets/images/units/possum_boss_4/idle/possum_boss_4_idle_se.png",
                        description: "A hovering possum mastermind in a levitating chair armed with an advanced rail gun. His charged shots pierce through multiple targets. While deadly at range, his hover chair makes him mobile — don't let him get the drop on you!"
                    },
                    
                ]
            }
        ]
    }
];
