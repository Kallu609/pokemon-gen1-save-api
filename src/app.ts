import { bytesToString } from './charset';
import { hex2dec, dec2hex } from './helpers';
import Save from './save';

function getPlayerName() {
  let bytes = save.getBytes(hex2dec('2598'), 11);
  return bytesToString(bytes);
}

let save = new Save('./src/example-save.sav');
console.log(getPlayerName());