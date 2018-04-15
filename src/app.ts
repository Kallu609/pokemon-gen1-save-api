import Save from './save';

// const save = new Save('./saves/pokemonteam.sav');
const save = new Save('./saves/pokedex.sav');

console.log(`Player: ${save.playerName}
Rival:  ${save.rivalName}
----------------------`);
console.log(save.pocketItemList);