
import Save from './save';

const save = new Save('./src/saves/timeplayed.sav');

console.log('Player: ' + save.playerName);
console.log('Rival:  ' + save.rivalName);

console.log('----------------');

console.log('Casino coins: ' + save.casinoCoins);
console.log('Time played: ');
console.log(save.timePlayed);