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

| Property name | Type | Description | Default value |
| -- | -- | -- | -- |
| `autoSetTimer` | `boolean` | True to automatically turn on the timer when stating a battle | `false` |
| `teams` | `Map<string, PokemonTeam[]>` | Map each format ID with a list of teams the bot can use. The bot will randomly choose between the available options | `null` |
| `acceptChallenges` | `boolean` | True to automatically accept incoming challenges, if possible. | `false` |
| `acceptChallengeFunc` | `(user: string, format: string, rules: string[]) => boolean` | Function to decide whenever accept of reject a challenge, based on the user, the format and the custom rules | `null` |
| `autoLadder` | `string` | Specify a format to automatically search for ladder battles. | `""` |
| `autoLadderCheckDelay` | `number` | Delay, in milliseconds, to wait before searching for the next ladder battle, to prevent command spam. | `10000` |
| `maxBattles` | `number` | Number of battles the bot will consider too many. If reached, the bot will no longer attempt to search for ladder battles or accept any challenges. Set it to `0` for no limit | `0` |
| `joinAbandonedBattles` | `boolean` | True to join active battles if not already joined. This is very useful to rejoin battles after reconnection. | `true` |
| `leaveAfterBattleEnds` | `boolean` | True to automatically leave battles after that have ended. | `true` |

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

## Events


## Battle analyzers


## Decision algorithms
