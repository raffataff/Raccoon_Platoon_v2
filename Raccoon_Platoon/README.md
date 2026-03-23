# Raccoon Platoon

**Raccoon Platoon** is a squad-based, top-down tactical action game inspired by classics like Cannon Fodder. Lead your team of raccoon soldiers through procedurally generated missions, battle enemy possums, and manage your roster in a campaign with permadeath and persistent progression.

## Features

- **Squad-based tactical gameplay:** Control up to 4 raccoon recruits per mission.
- **Procedurally generated levels:** Unique campaign and mission layouts every playthrough.
- **Permadeath:** Fallen raccoons are lost for the rest of the campaign.
- **Roster management:** Recruit, deploy, and honor your raccoon heroes.
- **Destructible environments:** Interact with and destroy elements in the world.
- **Multiple mission objectives:** Rescue hostages, eliminate enemies, and more.
- **Custom audio and visuals:** Unique sprites, sound effects, and music.

## Getting Started

1. **Clone this repository:**
   ```
   git clone https://github.com/raffataff/Raccoon_Platoon.git
   ```
2. **Open `index.html` in a modern web browser** (Chrome, Firefox, Edge).
3. **For full audio and asset loading, run a local web server** (due to browser security restrictions on file:// URLs):

   ```
   npx serve .
   ```
   or
   ```
   python -m http.server
   ```

## Controls

- **Mouse:** Select and command raccoon units.
- **Keyboard:** (See in-game help or documentation for details.)

## Project Structure

```
index.html
style.css
js/
  audioManager.js
  campaignData.js
  campaignRules.js
  config.js
  flyingBird.js
  input.js
  level.js
  minHeap.js
  ObjectPool.js
  possum.js
  possumBoss1.js
  possumHeavy.js
  raccoon.js
  raccoonHostage.js
  raccoonNames.js
  rng.js
  spatialGrid.js
  ui.js
  unit.js
  utils.js
  weapon.js
assets/
  audio/
  images/
  video/
  ...
```

## Credits

- Game design and code: [Your Name or Team]
- Art and audio: See `assets/` and documentation.

## License

This project is for educational and non-commercial use. See individual asset licenses where applicable.

---

*Raccoon Platoon* — Lead your furry platoon to victory!