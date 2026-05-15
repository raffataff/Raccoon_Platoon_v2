// js/speechConfig.js
const SPEECH_CONFIG = {

    RANK_HIERARCHY: ["Recruit", "Private", "Corporal", "Sergeant", "Elite", "Ghost"],

    POSSUM_TYPE_HIERARCHY: {
        "PossumGrunt": 1,
        "PossumSniper": 2,
        "PossumHeavy": 2,
        "PossumRevolver": 3,
        "PossumElite": 4,
        "PossumBoss1": 5
    },

    PROXIMITY_MATRIX: {
        RACCOON: {
            RACCOON: {
                SAME_RANK: {
                    speaker: [
                        "Hey, partner!", "Squad buddy!", "Right beside you!",
                        "We got this!", "Stick together!", "On your six!",
                        "Flanking up!", "Rally here!", "Good to see you!",
                        "Side by side!", "Together!", "Locked and loaded!"
                    ],
                    target: [
                        "Yo!", "Right here, chief!", "Got your back!",
                        "Let's go!", "Together!", "I'm with you!",
                        "Side by side!", "Locked and loaded!", "Here!",
                        "Let's do this!", "Ready!", "Present!"
                    ]
                },
                HIGHER_TO_LOWER: {
                    speaker: [
                        "Stay sharp, recruit.", "Keep up, private.",
                        "Watch your sector.", "Stay in formation.",
                        "You're doing fine, carry on.", "Eyes open, soldier.",
                        "Don't fall behind.", "Maintain spacing.",
                        "Watch your six.", "Stay frosty.", "Scratch 'n sniff"
                    ],
                    target: [
                        "Yes sir!", "On it!", "Roger that!",
                        "Understood!", "Right away!", "Copy that!",
                        "Moving!", "Yes ma'am!", "Wilco!",
                        "You got it, sir!", "Acknowledged!"
                    ]
                },
                LOWER_TO_HIGHER: {
                    speaker: [
                        "Sergeant!", "Orders?", "Reporting in!",
                        "Ready for orders, sir!", "What's the plan, chief?",
                        "Standing by!", "At your command!",
                        "Sergeant, status update?", "Ready when you are!"
                    ],
                    target: [
                        "At ease.", "Carry on, private.",
                        "Good to see you.", "Stay focused.",
                        "We move on my command.", "Keep your head down.",
                        "Well done.", "Stay sharp."
                    ]
                },
                GHOST_to_ANY: {
                    speaker: [
                        "...", "*nods silently*", "*barely visible*",
                        "...", "*tactical silence*", "..."
                    ],
                    target: [
                        "The Ghost... legendary.",
                        "Is that... the Ghost?!",
                        "I heard the Ghost never speaks.",
                        "Wow. The actual Ghost.",
                        "Don't blow this for us, Ghost.",
                        "The legend himself... here!"
                    ]
                },
                ANY_to_GHOST: {
                    speaker: [
                        "Ghost! It's an honor!", "The Ghost is here?!",
                        "I can't believe it's you!", "An honor, Ghost!",
                        "The legend himself!", "Ghost! You're real!",
                        "The Ghost ...I heard you're unkillable!"
                    ],
                    target: [
                        "...", "*nods*", "Stay focused, soldier.",
                        "...", "*fades slightly*", "Carry on."
                    ]
                },
                ELITE_to_SERGEANT: {
                    speaker: [
                        "Sergeant, your squad is ready.",
                        "Good leadership out there.",
                        "Your squad fights well.", "Sergeant. Status green.",
                        "Coordinated and ready.", "Elite squad reporting."
                    ],
                    target: [
                        "Good work, Elite.", "Appreciate it.",
                        "Your squad too.", "Stay sharp.",
                        "Well coordinated.", "Good to have you."
                    ]
                },
                RECRUIT_to_RECRUIT: {
                    speaker: [
                        "You new too?", "First mission?",
                        "I'm kinda nervous...", "You know what you're doing?",
                        "We got this... right?", "You scared?",
                        "Think we'll be okay?", "Just follow my lead. Wait—"
                    ],
                    target: [
                        "Just as new as you!", "Terrified honestly.",
                        "Fake it till you make it!", "No idea what's happening.",
                        "We're gonna die ...just kidding. Maybe.",
                        "I'm right there with you!", "Nervous? Me too.",
                        "Just don't trip over your own tail!"
                    ]
                }
            },
            HOSTAGE: {
                DEFAULT: {
                    speaker: [
                        "We're here to rescue you.", "Stay low, we got you.",
                        "Friendly! Don't panic.", "Raccoon Platoon, extracting you.",
                        "You're safe now. Mostly.", "Come with us if you want to live.",
                        "We came a long way for you.", "Stay behind us.",
                        "We got you. Let's move.", "Rescue's here!"
                    ],
                    target: [
                        "Oh thank god!", "Hurry, please!",
                        "You're really here!", "I knew someone would come!",
                        "Let's get out of here!", "Oh thank goodness!",
                        "Please tell me you have snacks.", "I'm never leaving base again!",
                        "You smell worse than the possums but that's ok!", "Time to extract!"
                    ]
                }
            }
        },
        HOSTAGE: {
            HOSTAGE: {
                DEFAULT: {
                    speaker: [
                        "Another survivor!", "You made it too!",
                        "Hey, buddy!", "We're getting out of here!",
                        "Thought I was the only one!", "A friend! Oh thank god!",
                        "Don't worry, help is coming.", "We stick together.",
                        "Over here! A friendly!", "We're not alone!"
                    ],
                    target: [
                        "Thank god, a friend!", "We're getting out of here!",
                        "I'm so glad to see you!", "Together we can make it!",
                        "You too? These possums are terrible.", "Let's rally up.",
                        "I knew we weren't alive— I mean, not alone!",
                        "Stick together!", "A survivor! Oh thank goodness!"
                    ]
                }
            },
            RACCOON: {
                DEFAULT: {
                    speaker: [
                        "Over here! Please!", "You came! You actually came!",
                        "Raccoons! Friendly!", "Please help us!",
                        "I'm over here!", "Don't shoot, I'm friendly!",
                        "Thank god! Rescuers!", "Please hurry!",
                        "I see friendlies!", "Help! Over here!"
                    ],
                    target: [
                        "We see you, hold on.", "Friendly incoming.",
                        "We're coming.", "Stay where you are.",
                        "Hold tight, we're here.", "Rescue on the way.",
                        "Stay low, we got you.", "We're here for you."
                    ]
                }
            }
        },
        POSSUM: {
            POSSUM: {
                SAME_TYPE: {
                    speaker: [
                        "Squeak squeak!", "Brother!", "Chitter chitter!",
                        "Together!", "Squeak yap!", "Side by side!",
                        "Fellow possum!", "Squeak!", "Chitter!",
                        "Same squad!", "Together we squeak!"
                    ],
                    target: [
                        "Chitter chitter!", "Together!", "Squeak!",
                        "Brother!", "Side by side!", "Squeak squeak!",
                        "Right here!", "Chitter!", "Squeak yap!",
                        "Together!", "Fellow possum!"
                    ]
                },
                GRUNT_TO_ELITE: {
                    speaker: [
                        "Elite! Lead the way!", "Squeak sir!",
                        "The Elite is here!", "Following your lead, sir!",
                        "Elite on site!", "Ready to follow!",
                        "The Elite! We're saved!", "Lead on, sir!"
                    ],
                    target: [
                        "Follow me, grunt.", "Stay in formation.",
                        "Hold the line.", "Watch your sector.",
                        "Move out.", "Maintain spacing.",
                        "Into position.", "Stay sharp, grunt."
                    ]
                },
                ELITE_TO_GRUNT: {
                    speaker: [
                        "You! Flank left!", "Move it, grunt!",
                        "Hold this position!", "Stop chittering and shoot!",
                        "Into formation!", "You there! Move!",
                        "Secure that sector!", "Stop lollygagging!"
                    ],
                    target: [
                        "Yes, Elite!", "On it, sir!", "Moving!",
                        "Right away!", "Squeak!", "Immediately!",
                        "Yes sir!", "Moving out!"
                    ]
                },
                GRUNT_TO_BOSS: {
                    speaker: [
                        "The boss is here!", "Squeak squeak!",
                        "Boss on site!", "All hail!",
                        "The big one!", "Boss! We're saved!",
                        "The boss himself!", "Squeak! Authority!"
                    ],
                    target: [
                        "All units, hold the line.", "Intruders everywhere.",
                        "No mercy.", "Crush them.", "Show no weakness.",
                        "Hold formation.", "They shall not pass.",
                        "All units, converge."
                    ]
                },
                ANY_TO_SNIPER: {
                    speaker: [
                        "Sniper! Cover us!", "Eyes up, sniper!",
                        "Got a sniper on our side!", "Sniper, we need eyes!",
                        "Sniper on overwatch!", "Long eyes, we need you!"
                    ],
                    target: [
                        "I see them.", "*scope glint*",
                        "Target acquired.", "I have the shot.",
                        "They won't see it coming.", "Watching.",
                        "Scoped and loaded."
                    ]
                },
                ANY_TO_HEAVY: {
                    speaker: [
                        "Heavy's here! We're safe!", "Big guy on deck!",
                        "The Heavy!", "Now we're talking!",
                        "Heavy support!", "The big one's here!",
                        "Heavy! Draw their fire!"
                    ],
                    target: [
                        "Heavy is ready.", "*rattles armor*",
                        "Nothing gets through me.", "I am the wall.",
                        "Bring it on.", "Heavy and loaded.",
                        "I'll hold the line."
                    ]
                },
                GRUNT_TO_HEAVY: {
                    speaker: [
                        "Save some for me, Heavy!", "Heavy, you're my hero!",
                        "Big guy's got our back!", "Heavy! You're huge!",
                        "The Heavy! We're unstoppable!"
                    ],
                    target: [
                        "Stay behind me.", "I'll draw their fire.",
                        "Nothing personal, just lead.", "Cover me while I reload.",
                        "I got you, little guy."
                    ]
                },
                SNIPER_TO_GRUNT: {
                    speaker: [
                        "Stay out of my sightline, grunt.",
                        "I work alone.", "Don't block my shot.",
                        "Move. Now.", "You're in my lane."
                    ],
                    target: [
                        "Yes, sniper!", "Moving!", "Sorry!",
                        "Right away!", "Out of your way!"
                    ]
                },
                HIGHER_TO_LOWER: {
                    speaker: [
                        "Hold position, grunt.", "Stay in formation.",
                        "Watch your sector.", "Maintain discipline.",
                        "Into line!", "Hold!"
                    ],
                    target: [
                        "Yes sir!", "On it!", "Moving!",
                        "Understood!", "Squeak!", "Right away!"
                    ]
                },
                LOWER_TO_HIGHER: {
                    speaker: [
                        "Sir! Reporting!", "Orders, sir?",
                        "Ready for command!", "Following your lead!",
                        "Squeak sir!", "At your service!"
                    ],
                    target: [
                        "Carry on.", "Stay focused.",
                        "Good.", "Maintain position.",
                        "Well done, grunt."
                    ]
                }
            }
        }
    },

    RACCOON: {
        ON_DAMAGE: [
            "Ouch!", "That stings!", "Gah!", "Ow ow ow!",
            "I felt that!", "Son of a—!", "Not cool!", "My everything!",
            "Goddammit!", "That's gonna bruise!", "Eat lead, why don't ya!",
            "I'm hit!", "Bastards!", "Oh come on!", "Watch it!"
        ],
        ON_KILL: [
            "Got one!", "Down he goes!", "Scratch one possum!",
            "How do you like that?!", "Eat dirt!", "Serves you right!",
            "Headshot! ...probably", "That's for my buddy!", "Cleaned his clock!",
            "Tag! You're it... permanently", "Rest in pieces, trash panda!",
            "Consider yourself possum-skipped", "And stay down!"
        ],
        ON_PICKUP_ITEM: [
            "Sweet!", "Oh yeah!", "Mine now!", "Bingo!",
            "Just what I needed!", "Score!", "Oh hell yes!",
            "Picked up a thing!", "Add it to the pile!", "Treasure!",
            "Candy from a baby ...not"
        ],
        ON_PICKUP_AMMO: [
            "Ammo!", "More bullets!", "Magazine money!", "Locked and loaded!",
            "Feeding time for my gun!", "The coyote genuflects before no man ...but he does need ammo!",
            "Behold, shall tachyons precede bullets?!", "Never Enough Bullets!"
        ],
        ON_PICKUP_HEALTH: [
            "Heals!", "Fresh!", "Good as new!", "Medic!",
            "I feel better already!", "Vitamin R!", "Rub some dirt on it!",
            "Patch me up!", "Healz plz ...got 'em!", "Where was this 10 minutes ago?!"
        ],
        ON_PICKUP_GRENADE: [
            "Boom stick!", "Frag out!", "Present for ya!", "Pin's out, say your prayers!",
            "Explosive ordnance!", "One grenade, no waiting!", "Special delivery!",
            "Pull pin, throw later!", "I love the smell of napalm ...wait wrong weapon!"
        ],
        ON_PICKUP_WEAPON: [
            "Now we're talking!", "Oh snap!", "Upgraded!", "Pew pew time!",
            "I call shotgun! ...literally", "Dibs!", "This is MY boomstick!",
            "Oh baby!", "For the Emperor! ...wait wrong franchise", "Shiny!",
            "Mommy wants a new gun ...got it!"
        ],
        ON_PROXIMITY_ALLY: [
            "Hey buddy!", "Stay close!", "On your six!", "Flanking left!",
            "I got your back!", "Squad up!", "Don't leave me hanging!",
            "Stick together!", "Where ya going, chief?", "Huddle up!",
            "Yo, over here!", "Right behind ya!", "Me too!"
        ],
        ON_RESCUE: [
            "I'm free!", "Let's get out of here!", "You came!",
            "About time, jeez!", "Thought I was a goner!", "Take me with you!",
            "That was NOT on my bingo card!", "Aight, let's bounce!",
            "You're my hero!", "I owe you one!", "Don't leave me again —how about never again!"
        ],
        ON_PROMOTION: [
            "Rank up!", "Moving up!", "Promotion time!", "Level up!",
            "I'm important now!", "Senior raccoon on deck!", "Coming for YOU Starmer!",
            "Making rank!", "Promoted!", "Another bar on the chest!",
            "They said I couldn't... THEY WERE WRONG"
        ],
        ON_DEATH_ALLY: [
            "Nooo!", "Fallen brother!", "They got one of ours!",
            "Oh no...", "Not cool!", "That was someone's buddy!",
            "Requiem for a raccoon...", "Gone but not avenged! Yet!"
        ],
        IDLE_CHATTER: [
            "What's the plan?", "I'm bored...", "Nice day for a firefight...",
            "Think the possums have snacks?", "My trigger finger is itching...",
            "What do possums even eat?", "I should've taken out a loan ...",
            "How much further?", "I swear I heard something...",
            "You ever wonder why we're here?", "Quiet out here...",
            "I could use a nap...", "Anyone got a snack?",
            "Think the possums recycle?", "This is fine...",
            "I am in Danger", "Rasputin was just doing his best, probably"
        ],
        ON_ALERT: [
            "Contact!", "Enemy!", "Heads up!", "We've got company!",
            "Possums, possums, possums!", "They're here!", "In coming!",
            "Freeze!", "On your guard!", "Eyes open!", "Movement!"
        ],
        ON_LOW_HP: [
            "Not gonna make it...", "I'm hit bad!", "Medic!",
            "This is not great...", "I've had better days...",
            "Someone patch me up!", "Critical condition here!",
            "Dying is NOT in the job description!", "I can see the light ..."
        ],
        ON_START_FIRING: [
            "Engaging!", "Open fire!", "Roll out the guns!",
            "Let's dance!", "I got 'em!", "Light 'em up!",
            "It's on now!", "Time to shred!", "Bullets away!",
            "Targeting now!", "Acquire, then eliminate!"
        ],
        ON_RELOAD: [
            "Reloading!", "Cover me!", "Swapping mags!",
            "Fresh load!", "Gotta reload!", "New magazine, who dis?",
            "Give me a sec!", "Reloading!", "Keep them off me!",
            "Loading... please wait"
        ],
        ON_GRENADE: [
            "Fire in the hole!", "Grenade!", "Frag out!",
            "Pull pin, count to three ...who am I kidding!", "Lob it!",
            "Here's an early Christmas present!", "One present, coming up!",
            "Frag delicieux!", "Abra cadabra boom!", "Explosive fisticuffs!"
        ]
    },

    POSSUM: {
        ON_DAMAGE: [
            "Squeak!", "Ngh!", "Hiss!", "Chitter chitter!",
            "Rude!", "Hey!", "Ow!", "Hssss!",
            "Was that necessary?!", "Oww!", "Blerg!", "Nyaa!",
            "Why you little—!"
        ],
        ON_KILL: [
            "Haha!", "Serves you right!", "Scratch one raccoon!",
            "Night night!", "And stay down!", "Too easy!",
            "Piece of cake!", "Hiss haha!", "What are YOU gonna do about it?",
            "! would recommend more HP!"
        ],
        ON_PROXIMITY_ALLY: [
            "Squeak squeak!", "Over here!", "Yo!", "Hey buddy!",
            "Chitter chatter!", "Squeak?", "Fellow possum!",
            "Squeak yap!", "Together we squeak!", "Psst, got any trash?"
        ],
        ON_ALERT: [
            "Intruders!", "What's that!", "Did you see that!",
            "Raccoons!", "Alert!", "Suspicious!",
            "Hmm?", "What was that noise?", "Stupid alert!",
            "Over there!", "Eyes up!"
        ],
        ON_START_FIRING: [
            "Die!", "Get them!", "Take this!",
            "Hiss hiss bang bang!", "No mercy!", "Eat lead!",
            "Surprise!", "Boom!", "Ratatatat!",
            "For the trash kingdom!", "Pew pew ... wait, SQUEAK pew pew!"
        ],
        ON_DEATH_ALLY: [
            "Brother!", "No!", "Squeak no!",
            "They'll pay for that!", "Not cool!", "You'll regret that!",
            "WAHH!", "Come on man!"
        ],
        IDLE_CHATTER: [
            "*sniff sniff*", "Squeak?", "Zzz...",
            "Wonder what's in the trash today...", "*scratches ear*",
            "Anyone got snacks?", "*licks paw*",
            "Hmm hmm hmm...", "*ears perk up*",
            "Think there's a bin around here?", "*tail swish*",
            "Is it lunchtime yet?", "*yawns*",
            "Squeak squeak ...nothing", "Patience is a virtue ...I think"
        ],
        ON_LOW_HP: [
            "I'm done for...", "Retreat!", "This ain't worth it!",
            "Strategic withdrawal!", "Squeak!", "I'm out!",
            "Every possum for themselves!", "Brb dying...",
            "Can I go home now?"
        ],
        ON_CHASE: [
            "You can't run!", "There!", "Get back here!",
            "Nice try!", "Hiss!", "Almost got 'em!",
            "Keep running if you want! No... actually STOP!", "After them!",
            "Squeaky pursuit!", "Fresh meat —wait, fresh raccoon!"
        ]
    },

    HOSTAGE: {
        ON_DAMAGE: [
            "Ow! Help!", "I'm hit!", "Not me too!",
            "Why?!", "I'm trying to be rescued here!", "This is the WORST",
            "Of all the hostages...", "Can someone get these guys?!",
            "I'm not even armed!", "Unbelievable!"
        ],
        ON_PROXIMITY_ALLY: [
            "Hey, buddy!", "Over here!", "A friend!",
            "Another friendly!", "Tell me you're here to help!",
            "*whimper of joy*", "Rally point!", "Stick together!",
            "Coast is clear, right?", "Four more on the way?"
        ],
        ON_RESCUE: [
            "You came!", "Let's get out here!", "I knew someone would come!",
            "Freedom!", "Thanks!", "Oh thank goodness!",
            "Let's GO GO GO!", "I'm never volunteering for recon again!",
            "You guys smell worse than the possums but that's ok!", "Time to extract!"
        ],
        IDLE_CHATTER: [
            "*whimpering*", "Anyone there?", "I don't wanna die here...",
            "Help!", "Over here!", "Psst!", "Save me!",
            "I've got 5 kits to feed!", "I'm kinda a big deal...",
            "I really need to pee!", "I'm too young to die!",
            "Got a snack? I'm starving!", "I'm not great at this whole hostage thing...",
            "I am not the raccoon you're looking for...", "Damn, you stink, possum scum!",
            "We can be friends... not!", "Is it over yet?",
            "I should've called in sick today...", "The food here is TERRIBLE",
            "How long have I been here?", "Someone had better write a report about this!",
            "I'm going to need so much therapy after this..."
        ],
        ON_LOW_HP: [
            "I'm not gonna make it...", "Tell my family...",
            "It was nice knowing ...nobody...", "I'm done...",
            "At least I tried...", "This is it...",
            "Don't let me die a hostage!", "One last squeak..."
        ]
    },

    GLOBAL: {
        SPEECH_ENABLED: true,
        BASE_CHANCE: 0.30,
        COOLDOWN_MIN: 3.0,
        COOLDOWN_MAX: 8.0,
        PROXIMITY_RANGE: 80,
        PROXIMITY_TARGET_RESPONSE_CHANCE: 0.30,
        PROXIMITY_TARGET_DELAY: 0.6,
        IDLE_CHATTER_INTERVAL_MIN: 15.0,
        IDLE_CHATTER_INTERVAL_MAX: 30.0,
        IDLE_CHATTER_CHANCE: 0.15,
        FURBY_COOLDOWN: 10.0,
        BUBBLE_LIFETIME: 2.5,
        BUBBLE_FONT: "bold 14px 'Consolas', 'Lucida Console', monospace",
        BUBBLE_COLOR_RACCOON: "#FFFFFF",
        BUBBLE_COLOR_POSSUM: "#FFCCAA",
        BUBBLE_COLOR_HOSTAGE: "#FFFF88",
        BUBBLE_Y_OFFSET: -50,
        BUBBLE_MAX_WIDTH: 180,
        BUBBLE_PADDING: 8,
        BUBBLE_BG_ALPHA: 0.75,
        BUBBLE_FADE_START: 0.7
    }
};
