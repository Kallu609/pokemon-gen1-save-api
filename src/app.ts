import Save from './save';
import { byteToBits } from './helpers';

// const save = new Save('./saves/pokemonteam.sav');
const save = new Save('./saves/pokemonteam.sav');

console.log(`Player: ${save.playerName}
Rival:  ${save.rivalName}
----------------------`);

console.log(save)