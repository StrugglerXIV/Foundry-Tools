export async function applyEffectsToSelectedTokens() {
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("Please select at least one token.");
        return;
    }

    for (const token of canvas.tokens.controlled) {
        const actor = token.actor;
        const sourceActor = actor.isToken ? game.actors.get(actor.id) : actor;
        const newEffects = [];

        const cr = actor.system.details.cr ?? 0;
        const halfCR = Math.ceil(cr / 2);

        // 🔁 Check effects on the correct actor
        const hasEffect = label => sourceActor.effects.some(e => e.label === label);

        // 1. Proficiency Boost
        if (cr > 0 && !hasEffect("Proficiency Boost")) {
            newEffects.push({
                label: "Proficiency Boost",
                icon: "icons/svg/up.svg",
                changes: [
                    {
                        key: "system.attributes.prof",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: halfCR,
                        priority: 20
                    }
                ],
                origin: `Actor.${sourceActor.id}`,
                disabled: false,
                duration: { rounds: 0 },
                flags: { "foundry-tools": { owned: true } }
            });
        }

        // 2. Default + Existing Resistances to -@prof
        let existingDrRaw = actor.system.traits.dr?.value ?? [];
        if (typeof existingDrRaw !== "object") existingDrRaw = [];
        const drList = Array.isArray(existingDrRaw)
            ? existingDrRaw
            : Object.values(existingDrRaw).filter(v => typeof v === "string");
        const dr = new Set(drList);

        // Add defaults
        ["bludgeoning", "slashing", "piercing"].forEach(r => dr.add(r));

        console.log("Final DR set:", [...dr]);


        if (!hasEffect("Custom Resistances") && dr.size > 0) {
            const resChanges = Array.from(dr).map(type => ({
                key: `system.traits.dm.amount.${type}`,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: "-@prof",
                priority: 20
            }));

            newEffects.push({
                label: "Custom Resistances",
                icon: "icons/svg/shield.svg",
                changes: resChanges,
                origin: `Actor.${sourceActor.id}`,
                disabled: false,
                duration: { rounds: 0 },
                flags: { "foundry-tools": { owned: true } }
            });
        }

        // 3. Immunities to -(@prof*2)
        const di = new Set(actor.system.traits.di.value || []);
        if (!hasEffect("Custom Immunities") && di.size > 0) {
            const imuChanges = Array.from(di).map(type => ({
                key: `system.traits.dm.amount.${type}`,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: "-(@prof*2)",
                priority: 20
            }));

            newEffects.push({
                label: "Custom Immunities",
                icon: "icons/svg/shield.svg",
                changes: imuChanges,
                origin: `Actor.${sourceActor.id}`,
                disabled: false,
                duration: { rounds: 0 },
                flags: { "foundry-tools": { owned: true } }
            });
        }

        // 4. Clear native traits
        await actor.update({
            "system.traits.dr.value": [],
            "system.traits.di.value": []
        });

        // 5. Jack of All Trades
        if (!hasEffect("Jack of All Trades")) {
            newEffects.push({
                label: "Jack of All Trades",
                icon: "icons/svg/dice-target.svg",
                changes: [
                    {
                        key: "flags.dnd5e.jackOfAllTrades",
                        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: true,
                        priority: 20
                    }
                ],
                origin: `Actor.${sourceActor.id}`,
                disabled: false,
                duration: { rounds: 0 },
                flags: { "foundry-tools": { owned: true } }
            });
        }

        // 6. Size-Based Damage Bonus
        if (!hasEffect("Size-Based Damage Bonus")) {
            const sizeMap = {
                tiny: 0.5,
                sm: 1,
                med: 1,
                lg: 2,
                huge: 3,
                grg: 4
            };
            const sizeMult = sizeMap[actor.system.traits.size] || 1;
            const numDice = Math.max(1, Math.floor(sizeMult));
            const formula = actor.system.attributes.hp.formula || "1d8";
            const die = formula.match(/d\d+/)?.[0] || "d8";

            newEffects.push({
                label: "Size-Based Damage Bonus",
                icon: "icons/svg/dice-target.svg",
                changes: [
                    {
                        key: "system.bonuses.All-Damage",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: `${numDice}${die}`,
                        priority: 20
                    }
                ],
                origin: `Actor.${sourceActor.id}`,
                disabled: false,
                duration: { rounds: 0 },
                flags: { "foundry-tools": { owned: true } }
            });
        }

        // 7. Apply effects to source actor
        if (newEffects.length > 0) {
            await sourceActor.createEmbeddedDocuments("ActiveEffect", newEffects);
        }

        ui.notifications.info(`${sourceActor.name}: Effects applied successfully.`);
    }

}