# Pokemon Showdown battle bot library

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/AgustinSRG/ps-battle-bot-lib/blob/master/LICENSE)

Library for Pokemon Showdown Bots to be able to participate in battles. 

## Installing the library

To install the library in your Pokemon Showdown bot project, use:

```sh
npm install --save @asanrom/ps-battle-bot-lib
```

## Using the library

In order to add battle functionality to your bot, instantiate `PokemonShowdownBattleBot`, call `receive` for each line received from Pokemon Showdown, and listen for the `send` event in order to send decision commands.

Example:

```ts
import { PokemonShowdownBattleBot, DefaultBattleAnalyzerFactory, GenericNPCDecisionAlgorithm, TopDamageDecisionAlgorithm, toId } from "@asanrom/ps-battle-bot-lib";

// Instantiate decision algorithms we want to use
const exampleDefaultAlgorithm = new GenericNPCDecisionAlgorithm();
const exampleTopDamageAlgorithm = new TopDamageDecisionAlgorithm();

// This depends on your bot implementation
const pokemonShowdownBot = createPokemonShowdownBotSomehow();

// Instantiate the battle bot
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
    maxBattles: 3,
    acceptChallenges: true,
    joinAbandonedBattles: true,
    leaveAfterBattleEnds: true,
});

// For each line received, send it to the battle bot
pokemonShowdownBot.on("line", (room, line) => {
    battleBot.receive(room, line, line.split("|").slice(1), false);
});

// If the bot disconnects, call 'clear' to remove all battles
pokemonShowdownBot.on("disconnected", () => {
    battleBot.clear();
});

// Listen for the 'send' event. Make the bot send those messages to Pokemon Showdown.
battleBot.on("send", (room, msg) => {
    pokemonShowdownBot.send(room, msg);
});

// Battle started event
battleBot.on("start", room => {
    pokemonShowdownBot.send(room, "Good luck and have fun!");
});

// The bot won
battleBot.on("win", room => {
    pokemonShowdownBot.send(room, "GG i won");
});

// The bot lost
battleBot.on("lose", room => {
    pokemonShowdownBot.send(room, "gg wp i lost");
});

```

## Documentation

Check the [documentation](./DOCUMENTATION.md) for detailed specifications for configuration and available algorithms.

You can also check the [auto generated documentation](https://agustinsrg.github.io/ps-battle-bot-lib/).

## Building

In order to build this library, you need:

 - [NodeJS](https://nodejs.org/en), latest stable version.

Run the following command to install dependencies:

```sh
npm install
```

Run the following command to build the typescript into javascript:

```sh
npm run build
```