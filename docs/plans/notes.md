# Notes

* when hostages are in phased out period they dont move on command, so remain stuck

* ~~units are jiggling around with the force repulse (i think they keep trying to do to the position thats pushing them away)~~ → fixed: reduced SEPARATION_CHECK_RADIUS from 13x to 6x size, made pushStrength quadratic (so it's gentle at range, strong only on actual overlap), boosted base push 1.5x

* units should display speech bubble saying "I can't pass through there", or "I'm too fat for that...damn" → done: added ON_PATH_BLOCKED speech category, triggers after 3s of being stuck with 50% chance

* units stop on their pathfinding when unable to move in their current direction. They arent rotating and looking for other routes starting from a different direction

* add more possums

* turn rate is now rank-specific (Private 12 → Ghost 45)


* make elite possum ai smarter


* implement classes

* fix shootout failure sequence

* implement ufo abductions

* refactor config into separate files


GOOD LUCK