// js/raccoonNames.js

const RACCOON_NAMES = [
    // Classic / Mischievous
    "Bandit", "Rascal", "Scamp", "Shadow", "Slinky", "Prowler", "Ghost", "Ninja",
    "Zorro", "Domino", "Masky", "Ringo", "Patches", "Smudge", "Inky", "Soot",
    "Trouble", "Mischief", "Jester", "Trickster", "Pickles", "Waffles", "Nugget",
    "Gizmo", "Gadget", "Widget", "Bolt", "Zipper", "Zoom", "Dash", "Rocket",

    // Nature / "Tough" Sounding
    "Rocky", "Stoney", "Grit", "Flint", "Slate", "Boulder", "Ridge", "Forrest",
    "Timber", "Branch", "Root", "Bushy", "Briar", "Thorn", "Fang", "Claw",
    "Growler", "Snapper", "Striker", "Hunter", "Tracker", "Scout", "Ranger",
    "Grizzly", "Kodiak", "Bruin", "Wolf", "Badger", "Viper", "Cobra", "Hawk",

    // Food / Cute / Quirky
    "Peanut", "Oreo", "Cookie", "Muffin", "Biscuit", "Mocha", "Latte", "Espresso",
    "Pepper", "Basil", "Saffron", "Cinnamon", "Nutmeg", "Clove", "Sprout",
    "Pippin", "Nibbles", "Squeaky", "Whiskers", "Paws", "Snout", "Twitch",
    "Waddles", "Fuzzy", "Dusty", "Rusty", "Cody", "Cooper", "Chester", "Dexter",
    "Finn", "Leo", "Milo", "Oscar", "Otis", "Percy", "Roscoe", "Rufus", "Toby",

    // Military / Tactical (Playful)
    "Sarge", "Cap'n", "Rookie", "Grunt", "Trooper", "Commando", "Major", "General",
    "Sparks", "Doc", "Wheels", "Radar", "Echo", "Alpha", "Bravo", "Charlie",
    "Delta", "Foxtrot", "Whiskey", "Tango", "Zero", "Ace", "Maverick", "Viper",
    "Blaze", "Bullet", "Cannon", "Tank", "Bomber", "Recon", "Stealth", "Striker",
    "Cipher", "Hex", "Glitch", "Static", "Vector", "Gauge", "Digit", "Patch", "DerGeissler",
    "Gunslinger",

    // Slightly More Unique / Characterful
    "Barnaby", "Figaro", "Jasper", "Lysander", "Mortimer", "Nikolai", "Orville",
    "Phineas", "Quincy", "Reginald", "Silas", "Theodore", "Ulysses", "Vincent",
    "Wilbur", "Beau", "Cornelius", "Ferdinand", "Horatio", "Ignatius",
    "Jebediah", "Kingsley", "Leopold", "Monty", "Nathaniel", "Octavius",
    "Peregrine", "Remington", "Sterling", "Thaddeus", "Algernon", "Bart",
    "Chauncey", "Digby", "Ebenezer", "Fitz", "Gideon", "Humphrey",

    // Female-Sounding (Optional, or just mix them all)
    "Luna", "Bella", "Daisy", "Lucy", "Sadie", "Sophie", "Chloe", "Zoe", "Ruby",
    "Piper", "Willow", "Hazel", "Stella", "Nova", "Scarlett", "Penelope", "Cleo",
    "Fiona", "Juniper", "Olive", "Poppy", "Violet", "Astrid", "Freya", "Iris",
    "Maeve", "Seraphina", "Athena", "Calliope", "Diana", "Guinevere", "Isolde", "Xianah"
];

function getRandomRaccoonName(existingNames = [], rng = Math) { // Accept RNG, default to Math.random
    if (RACCOON_NAMES.length === 0) return "Recruit"; 

    let attempts = 0;
    const maxAttempts = RACCOON_NAMES.length * 2; 
    let name;

    do {
        name = RACCOON_NAMES[Math.floor(rng.next() * RACCOON_NAMES.length)]; // Use rng.next()
        attempts++;
    } while (existingNames.includes(name) && attempts < maxAttempts && existingNames.length < RACCOON_NAMES.length);
    
    return name;
}