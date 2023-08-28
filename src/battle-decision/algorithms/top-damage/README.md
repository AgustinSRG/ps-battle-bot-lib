# Top damage decision algorithm

This algorithm simply goes for the move that does the most damage.

It won't use status moves, unless it's the only option.

It will switch to the pokemon that has the move that has the potential of doing the highest damage.

To instantiate it:

```ts
const algorithmInstance = new TopDamageDecisionAlgorithm();
```