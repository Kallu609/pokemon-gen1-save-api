import Save from './save';
import { byteToBits } from './helpers';
import { Buffer } from 'buffer';

// const save = new Save('./saves/pokemonteam.sav');
const save = new Save('./saves/items2.sav');

console.log(`Player: ${save.playerName}
Rival:  ${save.rivalName}
----------------------`);
console.log(save.pocketItemList);