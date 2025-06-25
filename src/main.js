import { applyEffectsToSelectedTokens } from './effects/autoEffects.js';

Hooks.once("ready", () => {
  console.log("Creature Auto Effects | Ready");

  game.creatureAutoEffects = {
    applyEffectsToSelectedTokens
  };

  // Another comment
  // Add control button here too
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find(c => c.name === "token");
    if (!tokenControls || !game.user.isGM) return;

    tokenControls.tools.push({
      name: "apply-creature-effects",
      title: "Apply Creature Effects",
      icon: "fas fa-magic",
      visible: true,
      onClick: () => game.creatureAutoEffects.applyEffectsToSelectedTokens(),
      button: true
    });
  });
});
