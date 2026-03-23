# Notes

collision boxes need to flip when object sprite is flipped

ambient tracks should play when video starts and continue into gameplay

separate bullet colors for each unit type, raccoon and possum

extraction ambush logic should run only when units are in extraction zone, and not before:
  ** so raccoons complete all objective > extraction zone is visible > raccoons enter zone > chance for ambush is run > if no ambush then proceed with end of mission logic > if ambush is yes then proceed to ambush shootout.