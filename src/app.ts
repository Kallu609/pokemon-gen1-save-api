import { bytesToString } from './charset';
import { hex2dec, dec2hex } from './helpers';
import Save from './save';

const save = new Save('./src/example-save.sav');
console.log(save.getPlayerName());