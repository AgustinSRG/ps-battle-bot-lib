# Random decision algorithm

This is the simplest decision algorithm. It simply randomly chooses between all possible decisions.

To instantiate it:

```ts
const algorithmInstance = new RandomDecisionAlgorithm(config);
```

The config object has the following properties:

| Property Name  | Description                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `switchChance` | Probability to choose a switch decision over a move decision. Goes from 0 to 1. By default is 0. |

Example:

```ts
const algorithmInstance = new RandomDecisionAlgorithm({
    switchChance: 0.2,
});
```
