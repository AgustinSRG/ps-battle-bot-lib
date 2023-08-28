// Sync active with side

"use strict";

import { BattleActivePokemon, BattlePlayer } from "../../battle-data";
import { clone } from "../../utils/clone";

/**
 * Sync active with the corresponding side pokemon
 * @param player The player
 * @param active The active pokemon
 */
export function syncActiveWithSide(player: BattlePlayer, active: BattleActivePokemon) {
    const sidePoke = player.team[active.index];

    if (!sidePoke) {
        return;
    }

    sidePoke.ident.name = active.ident.name;

    sidePoke.details = clone(active.details);

    sidePoke.condition = clone(active.condition);

    sidePoke.stats = clone(active.stats);

    sidePoke.moves = clone(active.moves);

    sidePoke.item = clone(active.item);

    sidePoke.ability = clone(active.ability);

    sidePoke.timesHit = active.timesHit;

    sidePoke.totalBurnedSleepTurns = active.totalBurnedSleepTurns;

    sidePoke.sleptByRest = active.sleptByRest;
}
