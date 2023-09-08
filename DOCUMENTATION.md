# Documentation - Pokemon Showdown battle bot library

This library can be used to add automatic battling functionality to any Pokemon Showdown bot coded in javascript or typescript.

In order to install the library into your project, type the following command:

```sh
npm install --save @asanrom/ps-battle-bot-lib
```

In order to use the library, you need to instantiate `PokemonShowdownBattleBot`, specifying its configuration. Here is an example:

```ts
import { DefaultBattleAnalyzerFactory, GenericNPCDecisionAlgorithm, PokemonShowdownBattleBot, TopDamageDecisionAlgorithm, toId, toRoomId } from "@asanrom/ps-battle-bot-lib";

// Instantiate decision algorithms we want to use
const exampleDefaultAlgorithm = new GenericNPCDecisionAlgorithm();
const exampleTopDamageAlgorithm = new TopDamageDecisionAlgorithm();

const battleBot = new PokemonShowdownBattleBot({
    configFunc: battleDetails => {
        if (toId(battleDetails.format).includes("challengecup1v1") || toId(battleDetails.format).includes("challengecup2v2")) {
            // For 1v1 and 2v2 random, the best algorithm is just using the most damaging move
            return {
                algorithm: exampleTopDamageAlgorithm,
                analyzerFactory: DefaultBattleAnalyzerFactory,
            };
        }

        // Default
        return {
            algorithm: exampleDefaultAlgorithm,
            analyzerFactory: DefaultBattleAnalyzerFactory,
        };
    },
    autoSetTimer: true,
    maxBattles: 3
    acceptChallenges: true
    joinAbandonedBattles: true,
    leaveAfterBattleEnds: true,
});

```

Once instantiated, you will need to integrate it with your Pokemon Showdown bot, in order to do that:

 - For each line received from the Pokemon Showdown server, you must call the `receive` method of the bot.
 - Listen for the `send` event of the battle bot, and forward any messages the bot wants to send to the Pokemon Showdown server.

Here is an example using the [ps-battle-bot](https://github.com/AgustinSRG/ps-bot-lib) library:


```ts
import { PokemonShowdownBot } from "@asanrom/ps-bot-lib";

// Create Pokemon Showdown bot
const bot = new PokemonShowdownBot({
    host: process.env.SERVER_HOST || 'sim3.psim.us',
    port: parseInt(process.env.SERVER_PORT || '443', 10),
    secure: process.env.SERVER_SSL !== 'NO',
    serverId: process.env.SERVER_ID || 'showdown',
});

bot.on("line", (room, line, spl, isInit) => {
    // Send to the battle bot all the received lines
    battleBot.receive(room, line, spl, isInit);
});

battleBot.on("send", (room, msg) => {
    // When the battle bot wants to send a message, send it to the server
    bot.sendTo(room, msg);
});

// Connect to the server
bot.connect();
```

## Configuration

When calling the `PokemonShowdownBattleBot` constructor, you are required to provide a configuration object.

### Required configuration properties

The only required parameter is `configFunc`, being a function to decide witch [battle analyzer](#battle-analyzers) and [decision algorithm](#decision-algorithms) to use based on the battle **format**, **generation** and **game type**.

```ts
const battleBot = new PokemonShowdownBattleBot({
    configFunc: battleDetails => {
        if (toId(battleDetails.format).includes("challengecup1v1") || toId(battleDetails.format).includes("challengecup2v2")) {
            // For 1v1 and 2v2 random, the best algorithm is just using the most damaging move
            return {
                algorithm: exampleTopDamageAlgorithm,
                analyzerFactory: DefaultBattleAnalyzerFactory,
            };
        }

        // Default
        return {
            algorithm: exampleDefaultAlgorithm,
            analyzerFactory: DefaultBattleAnalyzerFactory,
        };
    },
});
    
```

### Optional configuration properties

| Property name          | Type                                                         | Description                                                                                                                                                                    | Default value |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `autoSetTimer`         | `boolean`                                                    | True to automatically turn on the timer when stating a battle                                                                                                                  | `false`       |
| `teams`                | `Map<string, PokemonTeam[]>`                                 | Map each format ID with a list of teams the bot can use. The bot will randomly choose between the available options                                                            | `null`        |
| `acceptChallenges`     | `boolean`                                                    | True to automatically accept incoming challenges, if possible.                                                                                                                 | `false`       |
| `acceptChallengeFunc`  | `(user: string, format: string, rules: string[]) => boolean` | Function to decide whenever accept of reject a challenge, based on the user, the format and the custom rules                                                                   | `null`        |
| `autoLadder`           | `string`                                                     | Specify a format to automatically search for ladder battles.                                                                                                                   | `""`          |
| `autoLadderCheckDelay` | `number`                                                     | Delay, in milliseconds, to wait before searching for the next ladder battle, to prevent command spam.                                                                          | `10000`       |
| `maxBattles`           | `number`                                                     | Number of battles the bot will consider too many. If reached, the bot will no longer attempt to search for ladder battles or accept any challenges. Set it to `0` for no limit | `0`           |
| `joinAbandonedBattles` | `boolean`                                                    | True to join active battles if not already joined. This is very useful to rejoin battles after reconnection.                                                                   | `true`        |
| `leaveAfterBattleEnds` | `boolean`                                                    | True to automatically leave battles after that have ended.                                                                                                                     | `true`        |

### Parsing pokemon teams

In order to use the `teams` option, you will need to provide a list of parsed teams. In order to parse then, you can use the `parsePokemonTeam` function.

Example:

```ts

import { parsePokemonTeam } from "@asanrom/ps-battle-bot-lib";

const team = parsePokemonTeam("Excadrill @ Focus Sash  \nAbility: Mold Breaker  \nEVs: 252 Atk / 252 Spe  \nJolly Nature  \n- Stealth Rock  \n- Toxic  \n- Earthquake  \n- Rapid Spin  \n\nVictini @ Normalium Z  \nAbility: Victory Star  
\nEVs: 252 SpA / 4 SpD / 252 Spe  \nTimid Nature  \nIVs: 0 Atk  \n- Celebrate  \n- Searing Shot  \n- Stored Power  \n- Focus Blast  \n\nTapu Lele @ Choice Specs  \nAbility: Psychic Surge  \nEVs: 252 SpA / 
4 SpD / 252 Spe  \nTimid Nature  \nIVs: 0 Atk  \n- Psychic  \n- Moonblast  \n- Hidden Power [Fire]  \n- Psyshock  \n\nKartana @ Choice Scarf  \nAbility: Beast Boost  \nEVs: 252 Atk / 4 SpD / 252 Spe  \nJolly Nature  \n- Leaf Blade  \n- Smart Strike  \n- Sacred Sword  \n- Aerial Ace  \n\nGyarados @ Gyaradosite  \nAbility: Intimidate  \nEVs: 252 Atk / 4 SpD / 252 Spe  \nJolly Nature  \n- Dragon Dance  \n- Crunch  \n- Waterfall  \n- Taunt  \n\nMimikyu @ Life Orb  \nAbility: Disguise  \nEVs: 252 Atk / 4 SpD / 252 Spe  \nAdamant Nature  \n- Swords Dance  \n- Play Rough  \n- Shadow Claw  \n- Shadow Sneak  \n\n");
```
## Methods

### Method: receive(room, line, splittedLine, initialMsg)

Call this method to receive a line message from Pokemon Showdown. The received messages are required for the bot to be able to receive information, required to battle.

Parameters:

 - `room` - ID of the room where the message was received
 - `line` - The raw line message
 - `splittedLine` - Line splitted by `|`. The initial `|` is skipped, so `splittedLine[0]` is the message type.
 - `initialMsg` - True if the line was received as an initial room message. This can be used to distinguish historical messages from real time ones.

```ts
bot.on("line", (room, line, spl, isInit) => {
    // Send to the battle bot all the received lines
    battleBot.receive(room, line, spl, isInit);
});
```

### Method: clear()

Clears any pending state of the bot. Resetting it to its default state. It should be called on disconnection.

```ts
bot.on("disconnected", err => {
    // Clear battle bot
    battleBot.clear();
});
```

### Method: destroy()

Releases any resources and also clears all listeners. After called, the battle bot object becomes unusable.

```ts
battleBot.destroy();
```

## Events

### Event: 'error'

The `error` event is emitted when an error happens. Listen for this event to log any errors.

Parameters:

 - `err` - The error thrown.

```ts
battleBot.on("error", err => {
    console.error(err);
});
```

### Event: 'send'

The `send` event is emitted when the battle bot wishes to send a message to the Pokemon Showdown server, to make a decision in battle, or accept a challenge for example.

Parameters:

 - `room` - ID of the room where the message should be sent
 - `message` - The message to send

```ts
battleBot.on("send", (room, message) => {
    // When the battle bot wants to send a message, send it to the server
    bot.sendTo(room, msg);
});
```

### Event: 'debug'

The `debug` event is emitted when the analyzer or the battle algorithm wants to provide debug information.

Parameters:

 - `room` - ID of the battle room
 - `msg` - The debug message

```ts
battleBot.on("debug", (battle, msg) => {
    console.log(`[BATTLE-BOT-DEBUG] [${battle}] ${msg}`);
});
```

### Event: 'start'

The `start` event is emitted when a battle starts.

Parameters:

 - `room` - ID of the battle room

```ts
battleBot.on("start", battle => {
    bot.sendTo(battle, "Hi, i'm a battle bot!");
});
```

### Event: 'end'

The `end` event is emitted when a battle ends.

Parameters:

 - `room` - ID of the battle room

```ts
battleBot.on("end", battle => {
    bot.leaveRoom(battle, true);
});
```

### Event: 'win'

The `win` event is emitted when the bot wins a battle

Parameters:

 - `room` - ID of the battle room

```ts
battleBot.on("win", battle => {
    bot.sendTo(battle, "GG, better luck next time!");
});
```

### Event: 'lose'

The `lose` event is emitted when the bot loses a battle

Parameters:

 - `room` - ID of the battle room

```ts
battleBot.on("lose", battle => {
    bot.sendTo(battle, "gg, well played!");
});
```

### Event: 'tie'

The `tie` event is emitted when a battle ends in a tie.

Parameters:

 - `room` - ID of the battle room

```ts
battleBot.on("tie", battle => {
    bot.sendTo(battle, "rematch?");
});
```

## Battle analyzers

The battle analyzers are used to keep track of the battle status from the battle events.

You can implement you own implementing the [BattleAnalyzer](./src/battle-analyzer/index.ts) interface.

You can also use the default analyzer provided by this library: [DefaultBattleAnalyzer](./src/battle-analyzer/default/index.ts).

## Decision algorithms

Decision algorithms are used to make a decision given a battle scenario.

This library provides the following built-in algorithms:

| Algorithm                                                                    | Description                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [GenericNPCDecisionAlgorithm](./src/battle-decision/algorithms/generic-npc/) | This algorithm is meant to emulate a NPC from a game, being able to play any format, generation or game type. It's able to switch and use both status moves and damage moves. It's way worse than an average player and can be very predictable, but it's a good default if you do not care about win ratios |
| [LegacyDecisionAlgorithm](./src/battle-decision/algorithms/legacy/)          | A legacy algorithm based on the one used in Showdown-Chatbot. It can be used as an alternative to `GenericNPCDecisionAlgorithm`                                                                                                                                                                              |
| [TopDamageDecisionAlgorithm](./src/battle-decision/algorithms/top-damage/)   | This algorithm just calculates the damage dealt by moves and used the one that deals the most damage. It will not switch unless it's the only option. It very predictable, but surprisingly good in some formats, like Challenge Cup 1v1.                                                                    |
| [RandomDecisionAlgorithm](./src/battle-decision/algorithms/random/)          | This algorithm just randomly makes a decision, similar to wild Pokemon in the games.                                                                                                                                                                                                                         |

In order to implement you own algorithm, you must implement the [DecisionAlgorithm](./src/battle-decision/algorithm.ts) interface.

To make things easier, you can take advantage of the [DecisionMaker](./src/battle-decision/decision-make.ts) interface and the `makeDecisionsSimple`, that will make a list of all possible decisions and let you decide individually for each slot.

Here is an example of a decision algorithm:

```ts
// Random decision algorithm

"use strict";

import { randomlyChoose } from "../../../utils/random";
import { SwitchSubDecision, MoveSubDecision, ShiftSubDecision, ActiveSubDecision } from "../../active-decision";
import { DecisionAlgorithm } from "../../algorithm";
import { DecisionMakeContext, DecisionSlot } from "../../context";
import { BattleDecision } from "../../decision";
import { DecisionMaker, makeDecisionsSimple } from "../../decision-make";
import { ReviveSubDecision } from "../../force-switch-decision";
import { TeamDecision } from "../../team-decision";

/**
 * Random decision algorithm configuration
 */
export interface RandomDecisionAlgorithmConfig {
    /**
     * Switch chance (0 - 1)
     */
    switchChance?: number;
}

/**
 * Random decision algorithm
 */
export class RandomDecisionAlgorithm implements DecisionAlgorithm, DecisionMaker {
    /**
     * Switch chance (0 - 1)
     */
    public switchChance: number;

    /**
     * Instantiates the algorithm
     * @param config Configuration
     */
    constructor(config?: RandomDecisionAlgorithmConfig) {
        this.switchChance = 0;

        if (config) {
            this.switchChance = config.switchChance || 0;
        }
    }

    public async chooseTeam(context: DecisionMakeContext, availableTeamDecisions: TeamDecision[]): Promise<TeamDecision> {
        return randomlyChoose(availableTeamDecisions);
    }

    public async chooseForceSwitch(context: DecisionMakeContext, activeSlot: DecisionSlot, availableSwitchDecisions: SwitchSubDecision[]): Promise<SwitchSubDecision> {
        return randomlyChoose(availableSwitchDecisions);
    }

    public async chooseRevival(context: DecisionMakeContext, availableRevivals: ReviveSubDecision[]): Promise<ReviveSubDecision> {
        return randomlyChoose(availableRevivals);
    }

    public async chooseActive(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[]): Promise<ActiveSubDecision> {
        if (availableSwitchDecisions.length > 0 && Math.random() < this.switchChance) {
            // Switch
            return randomlyChoose(availableSwitchDecisions);
        } else {
            return randomlyChoose(availableMoveDecisions);
        }
    }

    public async decide(context: DecisionMakeContext): Promise<BattleDecision> {
        return makeDecisionsSimple(context, this);
    }
}
```