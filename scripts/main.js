async function applyEffectsToSelectedTokens() {
  console.log("Applying creature effects...");
  // Your macro logic goes here

  // Ensure at least one token is selected
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select at least one token.");
    console.log("No tokens selected.");
    return;
}

// Iterate through each selected token
for (const token of canvas.tokens.controlled) {
    const actor = token.actor;
    const isTokenActor = actor.isToken; // Check if this actor is token-specific
    const sourceActor = isTokenActor ? game.actors.get(actor.id) : actor;

    // Get creature's Challenge Rating (CR) as a flat number
    const creatureCR = actor.system.details.cr ?? 0; // Default to 0 if CR is missing
    const halfCR = Math.ceil(creatureCR / 2) ?? 0;

    // Check current resistances and immunities
    const currentResistances = actor.system.traits.dr.value || [];
    const currentImmunities = actor.system.traits.di.value || [];
    const prevResistances = [...currentResistances]; // Copy to prevent mutation
    const prevImmunities = [...currentImmunities];

    // Define the new effects array
    const newEffects = [];

    // Check if an effect named "Proficiency Boost" already exists
    const profBoostValidator = "Proficiency Boost";
    const hasProficiencyBoost = actor.effects.find(e => e.label === profBoostValidator);

    // Check if an effect named "Custom Resistances" already exists
    const resBoostValidator = "Custom Resistances";
    const hasRes = actor.effects.find(e => e.label === resBoostValidator);

    // Check if an effect named "Custom Immunities" already exists
    const imunityValidator = "Custom Immunities";
    const hasImu = actor.effects.find(e => e.label === imunityValidator);

    // Check if an effect named "Jack of All Trades" already exists
    const joatValidator = "Jack of All Trades";
    const hasJoat = actor.effects.find(e => e.label === joatValidator);

    // **Apply Proficiency Bonus Increase (CR)**
    if (actor.system.attributes.prof && creatureCR > 0 && !hasProficiencyBoost) {
        console.log(`Increasing Proficiency for ${sourceActor.name} by ${creatureCR}...`);
        newEffects.push({
            label: "Proficiency Boost",
            icon: "icons/svg/up.svg",
            changes: [{
                    key: "system.attributes.prof",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: halfCR, // Flat number
                    priority: 20,
                },
            ],
            origin: `Actor.${sourceActor.id}`,
            disabled: false,
            duration: {
                rounds: 0
            },
        });
    }

    // **Apply Resistance Effects**
    if (prevResistances.length > 0 && !hasRes) {
        console.log(`Adding Resistance Effects for ${sourceActor.name}...`);
        const resistanceChanges = prevResistances.map(type => {
            console.log(`Mapping Resistance: ${type}`);
            return {
                key: `system.traits.dm.amount.${type}`,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: `- @prof`,
                priority: 20,
            };
        });

        newEffects.push({
            label: "Custom Resistances",
            icon: "icons/svg/shield.svg",
            changes: resistanceChanges,
            origin: `Actor.${sourceActor.id}`,
            disabled: false,
            duration: {
                rounds: 0
            },
        });
    } else {
        console.log(`No Resistances to Add for ${sourceActor.name}.`);
    }

    // **Apply Immunity Effects**
    if (prevImmunities.length > 0 && !hasImu) {
        console.log(`Adding Immunity Effects for ${sourceActor.name}...`);
        const immunityChanges = prevImmunities.map(type => {
            console.log(`Mapping Immunity: ${type}`);

            // Calculate the values based on the actor's details
            sourceActor.system.details.cr || 0; // Fallback to 0 if undefined
            sourceActor.system.prof || 0; // Fallback to 0 if undefined

            return {
                key: `system.traits.dm.amount.${type}`,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: `- (@prof*2)`, // Use the calculated values
                priority: 20,
            };
        });

        // Add the new immunity effects to the newEffects array
        newEffects.push({
            label: "Custom Immunities",
            icon: "icons/svg/shield.svg",
            changes: immunityChanges,
            origin: `Actor.${sourceActor.id}`,
            disabled: false,
            duration: {
                rounds: 0
            }, // Duration of 0 rounds means indefinite
        });
    } else {
        console.log(`No Immunities to Add for ${sourceActor.name}.`);
    }

    // **Apply Jack of All Trades to all skills**
    if (!hasJoat) {
        console.log(`Adding Jack of All Trades to ${sourceActor.name}...`);
        const skillKeys = [
            'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'itm', 'inv', 'med',
            'nat', 'prc', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
        ];

        const joatChanges = skillKeys.map(skill => {
            return {
                key: `system.skills.${skill}.bonuses.check`,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: `floor(@prof/2)`,
                priority: 20
            };
        });

        newEffects.push({
            label: "Jack of All Trades",
            icon: "icons/svg/dice-target.svg",
            changes: joatChanges,
            origin: `Actor.${sourceActor.id}`,
            disabled: false,
            duration: {
                rounds: 0
            }
        });
    }
	
  // Check if an effect named "Size-Based Damage Bonus" already exists
  const sizeDamageValidator = "Size-Based Damage Bonus";
  const hasSizeDamage = actor.effects.find(e => e.label === sizeDamageValidator);

  // **Apply Size-Based Damage Bonus**
  if (!hasSizeDamage) {
    console.log(`Adding Size-Based Damage Bonus to ${sourceActor.name}...`);
    
    // Get actor's size and extract hit die type from HP formula
    const actorSize = actor.system.traits.size;
    const hpFormula = actor.system.attributes.hp.formula || "1d8"; // Default to 1d8 if missing
    
    // Extract the die type (e.g., "12d8" -> "d8")
    const dieType = hpFormula.match(/d\d+/)?.[0] || "d8";
    
    // Calculate number of dice based on size (Medium = 1, Large = 2, Huge = 3, etc.)
    const sizeMultiplier = {
      "tiny": 0.5,
      "sm": 1,
      "med": 1,
      "lg": 2,
      "huge": 3,
      "grg": 4
    }[actorSize] || 1;
    
    // Round up for Tiny creatures (0.5 becomes 1)
    const numberOfDice = Math.max(1, Math.floor(sizeMultiplier));
    
    // Format the bonus damage (e.g., "1d8", "2d10", etc.)
    const bonusDamage = `${numberOfDice}${dieType}`;
    
    newEffects.push({
      label: "Size-Based Damage Bonus",
      icon: "icons/svg/dice-target.svg",
      changes: [
        {
          key: "system.bonuses.All-Damage",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: `${bonusDamage}`,
          priority: 20
        }
      ],
      origin: `Actor.${sourceActor.id}`,
      disabled: false,
      duration: { rounds: 0 }
    });
  }

    // Clear Resistances and Immunities for the token's actor
    await actor.update({
        "system.traits.dr.value": [],
        "system.traits.di.value": [],
    });

    // Apply all effects
    for (const effect of newEffects) {
        await sourceActor.createEmbeddedDocuments("ActiveEffect", [effect]);
    }

    console.log(`Updated resistances, immunities, proficiency, and damage for ${sourceActor.name}.`);
}

// Notify the user
ui.notifications.info("Resistances, immunities, proficiency, and damage updated for all selected tokens.");
}

Hooks.once("ready", () => {
  console.log("Creature Auto Effects | Rollup build succeeded.");
});

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
//# sourceMappingURL=main.js.map
