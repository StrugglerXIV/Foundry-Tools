Hooks.once("ready", () => {
  console.log("Creature Auto Effects | Rollup build succeeded.");
});

// buttons 

import { applyEffectsToSelectedTokens } from './effects/autoEffects.js';

Hooks.once("ready", () => {
  console.log("Creature Auto Effects | Ready");

  game.creatureAutoEffects = {
    applyEffectsToSelectedTokens
  };
});

Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;

  tokenControls.tools.push({
    name: "apply-creature-effects",
    title: "Apply Creature Effects",
    icon: "fas fa-magic", // You can change this
    visible: game.user.isGM,
    onClick: () => game.creatureAutoEffects.applyEffectsToSelectedTokens(),
    button: true
  });
});
