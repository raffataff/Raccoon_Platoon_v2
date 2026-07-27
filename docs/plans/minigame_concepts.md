# Mini-Game Concepts — One Pool Per Objective Type

Design proposals for new mini-games, two per objective type. All extend `MiniGame`,
take tuning from a `CONFIG.MINIGAMES` block, use the passed-in `SeededRandom`, and
scale via `difficulty` (phase index). None reuse the mechanics of the existing four
(maze navigation, wave nulling, lights-out, graph chase).

**Integration note.** Only SHUTDOWN and HACK gates exist today. New objective gates
would hook in at the natural "interaction moment" listed per section, following the
same pattern as `handlePossumAntiAirTurretShutdown()`: the objective step completes
only in the `onComplete` success callback. All remain no-op if `MINIGAMES.ENABLED = false`.

---

## DEACTIVATE_ANTI_AIR_TURRETS — additions to existing SHUTDOWN pool

### 1. Coolant Purge (pipe routing)
- **Fantasy:** Flood the turret's reactor with its own corrosive coolant. Rotate pipe
  segments on a grid to connect the coolant tank to the core before the reboot clock.
- **Loop:** Click (or cursor + Space) rotates a tile 90°. When a continuous path forms,
  coolant visibly flows tile-by-tile and drowns the core — the win animation *is* the flood.
- **Twist:** Pressure builds while you work; any open joint on the partially-connected
  path leaks, costing seconds off the clock. Fast, clean routing is rewarded.
- **Fail:** Reboot clock expires.
- **Scaling:** grid size, decoy dead-end tiles, pressure/leak rate, time limit.

### 2. Gyro Jam (spin-down timing)
- **Fantasy:** The turret's targeting gyro is a spinning flywheel. Fire counter-pulses
  timed to a rotating marker to bleed RPM to zero.
- **Loop:** A marker orbits the flywheel; a "brake window" arc sits at a fixed angle.
  Press Space when the marker is inside the window → RPM drops and the whine pitch falls.
  Mistime → RPM *spikes* and the window shrinks briefly.
- **Feel:** Pure rhythm/timing — the deactivation theme is literal: you're spinning the
  machine down to silence. Great audio hook (falling pitch on every good hit).
- **Fail:** Reboot clock expires before RPM hits 0.
- **Scaling:** marker speed, window arc width, RPM drained per hit, penalty size.

---

## INTERACT_INTEL — additions to existing HACK pool

### 3. Packet Snatch (grabby paws)
- **Fantasy:** Raccoons steal things. Data packets stream along cables crossing the
  screen; snatch the gold intel packets, never touch the red tracer packets.
- **Loop:** Mouse-driven paw cursor. Click/hover-grab gold packets to fill the download
  bar. Grabbing a red tracer (or letting too many golds escape) advances the TRACE bar.
- **Twist:** Late-game packets disguise themselves — gold packets flicker red for a beat
  before committing, punishing greedy grabbing.
- **Fail:** TRACE bar fills before the download completes.
- **Scaling:** packet speed, cable count, tracer ratio, disguise flicker duration.

### 4. Ring Zero (firewall lock)
- **Fantasy:** The console's firewall is concentric rotating rings, each with a gap.
  Align all gaps into one radial channel and fire your intrusion probe through to the core.
- **Loop:** Arrow keys/drag rotate the *selected* ring; Tab/click selects rings. Rings
  drift at different speeds and directions, so alignment is a moving problem. When you
  fire, the probe streaks inward — clipping any ring resets that ring's gap position.
- **Twist:** Limited probes. Waiting for a natural alignment is possible but the lockout
  clock punishes patience — nudging rings actively is the skill.
- **Fail:** Out of probes or lockout timer expires.
- **Scaling:** ring count, drift speeds, gap width, probe count.

---

## DESTROY_TARGET — new DEMOLITION pool (gate: interacting with the target plants the charge)

### 5. Short Fuse (guide the spark)
- **Fantasy:** You've rigged the charge but the fuse network is scavenged junk. Light it
  and steer the live spark through a branching fuse web to the detonator.
- **Loop:** The spark travels continuously (no stopping); at each junction, press the
  Arrow toward the branch you want. Damp sections (dripping pipes overhead) fizzle the
  spark — dead end. Some branches loop back; read the web before you light it: a short
  study phase, then commit.
- **Feel:** The inverse of Circuit Breach — you don't walk the maze, you *route a
  runaway spark* through it in real time.
- **Fail:** Spark fizzles in a damp section or the patrol timer (possum silhouettes
  approaching in the background) expires.
- **Scaling:** web complexity, spark speed, damp-section count, study-phase length.

### 6. Dead Man's Dial (arming needle)
- **Fantasy:** A scavenged detonator with a temperamental priming dial. Stop the sweeping
  needle inside the red arc three times to arm the charge.
- **Loop:** Needle sweeps back and forth; Space stops it. Each successful prime shrinks
  the arc and speeds the needle. A miss doesn't just lose time — the needle *rebounds
  wildly* for a beat and one prime light unlatches.
- **Feel:** Classic three-stage skill check, very readable, very tense; ideal as the
  "fast" game in the pool against Short Fuse's "puzzle" game.
- **Fail:** Patrol timer expires before three primes latch.
- **Scaling:** needle speed, arc width, arc-shrink per stage, rebound penalty.

---

## RESCUE_HOSTAGES — new LOCKPICK pool (gate: opening the cage)

### 7. Nimble Paws (pin tumbler)
- **Fantasy:** Raccoon paws were *made* for this. A side-view padlock cylinder; set each
  pin at its shear line by feel.
- **Loop:** Hold Space/mouse to raise the current pin; a subtle wobble intensifies near
  the sweet spot. Release inside the tolerance band → pin sets with a click. Overshoot →
  ALL set pins drop (tension slip) and a noise ping widens the guard-alert ring on a
  side meter.
- **Fail:** Alert meter fills (guards notice) before all pins set.
- **Scaling:** pin count, tolerance band width, wobble subtlety, alert gain per slip.

### 8. Net Work (untangle the snare)
- **Fantasy:** The hostages are wrapped in a tangled cargo net. You can only cut a rope
  where no other rope crosses it — untangle the mess so every rope runs clean, then snip.
- **Loop:** A planarity puzzle: drag knot-nodes around the canvas until no two rope
  edges intersect. Crossing ropes glow taut/red; clean ropes slacken green. When zero
  crossings remain, a quick paw-slash animation frees the hostages.
- **Feel:** Calm, tactile, zero-twitch — a deliberate contrast to combat outside, and a
  different muscle from every other game in the roster.
- **Fail:** Patrol timer expires (a possum warden's flashlight sweeps closer with each
  passing third of the clock).
- **Scaling:** node/edge count, initial tangle depth, time limit.

---

## ASSASSINATION — new KILLSHOT pool (gate: first engagement with the target while undetected; failure alerts the target instead of failing the mission)

### 9. One Breath (scope discipline)
- **Fantasy:** One raccoon, one bullet. A scope view; the boss moves between cover
  windows across a compound.
- **Loop:** The crosshair drifts in a figure-8 sway. Hold Shift to hold breath — sway
  dampens hard but the breath meter drains and recovers slowly. The target pauses,
  exposed, in windows for a few seconds at a time. A steadiness ring shrinks around the
  crosshair while calm; fire (click) when it's inside the target.
- **Twist:** You have ONE round chambered plus one fumbled reload (long, noisy). A miss
  near the target starts panic — his exposure windows get shorter.
- **Fail:** Target reaches his bunker (end of his patrol route) → he's alerted; the
  objective falls back to a straight fight against a now-guarded boss.
- **Scaling:** sway amplitude, breath meter size, window duration, route length.

### 10. Last Supper (shell game)
- **Fantasy:** The boss's grub bowl is on the mess table with the lookalikes' bowls.
  The kitchen possum shuffles trays. Poison the right one.
- **Loop:** The target's bowl is marked, then face-down shuffling begins — swap speed
  and count scale up. Click the bowl to dose it. Correct → cutscene beat: the boss
  keels over mid-meal, objective complete without a shot fired.
- **Twist:** Mid-shuffle, a waiter possum occasionally walks *through* the scene,
  briefly occluding the table — track through the blackout.
- **Fail:** Wrong bowl → a guard eats it, alarm raised, target alerted (fight fallback,
  as above).
- **Scaling:** bowl count, swap speed/count, occlusion frequency.

---

## EXTERMINATE — new FLUSH pool (gate: when the last N enemies go to ground, survivors hide in burrows; the game reveals them)

### 11. Heat Seeker (thermal sweep)
- **Fantasy:** The stragglers have gone underground. Sweep a thermal scanner over the
  burrow field and pinpoint them with limited scan pulses.
- **Loop:** A grid overlays a dirt cross-section. Each scan pulse returns a heat reading
  (hot/warm/cold rings) by distance to the nearest hider — triangulate with as few
  pulses as possible. Mark a cell to commit; correct marks flush a possum, wrong marks
  waste a pulse.
- **Feel:** Battleship-meets-Minesweeper deduction; the only pure-logic game in the roster.
- **Fail:** Out of pulses with hiders remaining → survivors tunnel out (respawn at map
  edge as a final wave instead — failure creates a fight, not a wall).
- **Scaling:** grid size, hider count, pulse budget, reading granularity.

### 12. Smoke 'Em Out (vent coverage)
- **Fantasy:** The burrow is a tunnel network with vent shafts. You have K smoke bombs;
  drop them into vents so the smoke reaches every chamber.
- **Loop:** The tunnel map renders as a node graph. Smoke from a vent spreads D edges
  outward (shown live as grey fill when you hover a vent — preview before committing).
  Choose your K vents; press IGNITE. Full coverage → possums stream out coughing into
  your squad's gunline (auto-resolves the objective).
- **Feel:** A coverage/dominating-set puzzle — plan-then-commit, no timer pressure until
  a soft "possums getting suspicious" clock on high difficulty.
- **Fail:** Chambers left unsmoked → same tunnel-out fallback as Heat Seeker.
- **Scaling:** graph size, bomb budget K, spread depth D, suspicion clock on/off.

---

## EXTRACTION — new EVAC pool (gate: calling the extraction chopper at the extraction zone)

### 13. Smoke Signal (pressure band)
- **Fantasy:** The radio's dead. Old-school it: a scavenged bellows and a green smoke
  canister. Keep the smoke column inside the visibility band so the pilot spots you.
- **Loop:** Tap/hold Space to pump; pressure decays constantly and wind gusts (telegraphed
  by rustling grass) shove it. Keep the needle inside the band to fill the SPOTTED bar;
  leaving the band drains it. The chopper sprite grows on the horizon as the bar fills.
- **Feel:** A sustain/regulation mechanic — nothing else in the roster asks you to *hold*
  a system in equilibrium under disturbance except NullWave, and this is physical/panicky
  where NullWave is precise/technical.
- **Fail:** An incoming possum patrol timer — signal before they arrive or fight one more
  wave before retrying.
- **Scaling:** decay rate, band width, gust frequency/strength, SPOTTED bar size.

### 14. Clear the LZ (junk drag)
- **Fantasy:** The only flat ground is covered in junk (biome-flavored: palm debris,
  scrap fridges, tires). The chopper won't set down until the LZ circle is clean.
- **Loop:** Click-drag debris pieces out of the circle before the chopper's inbound
  timer. Small pieces flick away fast; heavy pieces (fridge, engine block) drag slowly
  and need a clear path. Rotor wash starts early, blowing light debris you've cleared
  *back toward* the circle — clear heavy-first is the learned strategy.
- **Feel:** Pure tactile busywork under pressure, very raccoon: frantically hauling trash.
  Debris sprites can reuse existing biome obstacle art.
- **Fail:** Timer expires with debris in the circle → chopper waves off, one more enemy
  wave spawns, then it re-attempts.
- **Scaling:** debris count/weight mix, circle size, timer, rotor-wash strength.

---

## Roster balance check

| Mechanic muscle | Games |
|---|---|
| Routing/planning | Coolant Purge, Short Fuse, Smoke 'Em Out |
| Timing/rhythm | Gyro Jam, Dead Man's Dial |
| Tracking/dexterity | Packet Snatch, Last Supper, Clear the LZ |
| Precision/steadiness | Ring Zero, One Breath, Nimble Paws |
| Deduction | Heat Seeker |
| Spatial untangling | Net Work |
| Regulation/sustain | Smoke Signal |

Each pool pairs one "twitch" game with one "think" game, so `launchFromPool`'s
per-objective determinism gives varied pacing across a mission.

## Design principles carried over from the live games

- Soft-fail where possible: ASSASSINATION/EXTERMINATE/EXTRACTION failures create a
  *combat consequence*, not a retry wall — keeps campaign momentum.
- Win/fail animations embody the fantasy (drain, flood, keel-over, chopper landing).
- All layouts from the seeded RNG; same challenge type per objective via pool selector.
- Canvas-only rendering, fixed small entity counts, no per-frame allocations — every
  concept is a handful of rects/arcs/lines, well within Steam perf budget.
