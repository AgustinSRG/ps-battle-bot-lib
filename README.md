# Pokemon Showdown battle bot library

[![Node.js CI](https://github.com/AgustinSRG/ps-battle-bot-lib/actions/workflows/node.js.yml/badge.svg)](https://github.com/AgustinSRG/ps-battle-bot-lib/actions/workflows/node.js.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/AgustinSRG/ps-battle-bot-lib/blob/master/LICENSE)

Library for Pokemon Showdown Bots to be able to participate in battles. 

## Installing the library

To install the library in your Pokemon Showdown bot project, use:

```sh
npm install --save @asanrom/ps-battle-bot-lib
```

## Using the library

In order to add battle functionality to your bot, instantiate `PokemonShowdownBattleBot`, call `receive` for each line received from Pokemon Showdown, and listen for the `send` event in order to send decision commands.

[View example](./src/examples/example.ts)

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

## Running the example

If you want to run the example, type:

```
npm start
```

You can configure the bot using environment variables.

You can specify those variables in the `.env` file, in the current working directory.


### Server connection details

| Variable Name | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| SERVER_HOST   | Pokemon showdown server host. Default: `sim3.psim.us`                                |
| SERVER_PORT   | Pokemon showdown server port. Default `443`                                          |
| SERVER_SSL    | Set it to `YES` to use HTTPS. Set it to `NO` to use regular HTTP. Defaults to `YES`. |
| SERVER_ID     | Pokemon showdown server ID. Default: `showdown`                                      |

### Credentials

| Variable Name    | Description                        |
| ---------------- | ---------------------------------- |
| ACCOUNT_NAME     | Pokemon showdown account name.     |
| ACCOUNT_PASSWORD | Pokemon showdown account password. |

### Battle bot configuration

| Variable Name       | Description                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTO_SET_TIMER      | Set it to `YES` for the bot to automatically set up the timer.                                                                                             |
| ACCEPT_CHALLENGES   | Set it to `YES` for the bot to automatically accept or reject challenges.                                                                                  |
| CHALLENGE_WHITELIST | Specify the list of usernames the bot will accept challenges from. If not specified, the bot will accept challenges from any user.                         |
| AUTO_LADDER         | Specify a format name for the bot to search ladder battles automatically.                                                                                  |
| AUTO_LADDER_DELAY   | Milliseconds to wait in order to search for the next ladder battle. By default `10000` (10 seconds)                                                        |
| MAX_BATTLES         | Max number of battles the bot will consider when accepting a challenge, or searching a ladder battle.                                                      |
| TEAMS_PATH          | Path to the teams folder. This folder must contain sub-folder with the names of the formats, containing each one a list of teams contained in `.txt` files |

### Logging

| Variable Name | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| LOG_INFO      | Set to `YES` or `NO` to enable or disable info messages. Enabled by default.   |
| LOG_DEBUG     | Set to `YES` or `NO` to enable or disable debug messages. Disabled by default. |
| LOG_TRACE     | Set to `YES` or `NO` to enable or disable trace messages. Disabled by default. |

### Other configuration

| Variable Name | Description                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| LOG_BATTLES   | Set it to `YES` to log every single battle. Logs will be stored in the `logs` subfolder. |
| LOGS_PATH     | Path to store the battle logs. By default: `logs`                                        |
| ROOMS_JOIN    | List of room to join on connection, spit by commas.                                      |
