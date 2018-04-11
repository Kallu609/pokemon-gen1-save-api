import * as fs from 'fs';
import { hex2dec, dec2hex, bytesToString, bcdToNumber,
         reverseBuffer, bytesToNumber } from './helpers';


export default class Save {
  save: Buffer;

  playerName:  string;
  rivalName:   string;
  money:       number;
  casinoCoins: number;
  options:     object;
  pikachuFriendship: number;
  timePlayed:  object; // Keys: hour, minute, second

  constructor(filename: string) {
    this.save = fs.readFileSync(filename);

    this.playerName  = this.getPlayerName();
    this.rivalName   = this.getRivalName();
    this.money       = this.getMoney();
    this.casinoCoins = this.getCasinoCoins();
    this.options     = this.getOptions();
    this.pikachuFriendship = this.getPikachuFriendship();
    this.timePlayed  = this.getTimePlayed();
  }

  getBytes(offset: string, size: number = 1): Buffer {
    if (size > 0) {
      // Big-endian   Direction: 0x00 --> 0xFF
      const startPos = hex2dec(offset);
      const endPos = startPos + size;
      const buffer = this.save.slice(startPos, endPos);

      return buffer;
    } else {    
      // Little-endian   Direction: 0xFF --> 0x00
      const startPos = hex2dec(offset) - Math.abs(size) + 1;
      const endPos = startPos + 2;
      const buffer = this.save.slice(startPos, endPos);

      return reverseBuffer(buffer);
    }
  }

  getPlayerName(): string {
    const bytes = this.getBytes('2598', 11);
    const strEnd = bytes.findIndex(byte => dec2hex(byte) === '50'); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }

  getRivalName(): string {
    const bytes = this.getBytes('25F6', 11);
    const strEnd = bytes.findIndex(byte => dec2hex(byte) === '50'); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }

  getMoney(): number {
    const bytes = this.getBytes('25f3', 3);
    return bcdToNumber(bytes);
  }
  
  getCasinoCoins(): number {
    const bytes = this.getBytes('2850', 2);
    return bcdToNumber(bytes);
  }
  
  getOptions(): object {
    const bytes = this.getBytes('2601');

    // TO-DO: Write helper to convert hex/dec to binary
    const bin = String('00000000' + bytes[0].toString(2)).slice(-8);

    // TO-DO: sound bits is different for Pokémon Yellow
    // See: https://bulbapedia.bulbagarden.net/wiki/Save_data_structure_in_Generation_I#Options

    const textSpeeds = {
      '001': 'fast',
      '011': 'normal',
      '101': 'slow',
    }

    return {
      battleEffects: (bin[0]) ? true     : false,
      battleStyle:   (bin[1]) ? 'set'    : 'switch',
      sound:         (bin[3]) ? 'stereo' : 'mono', 
      textSpeed:     textSpeeds[bin.slice(5,8)]
    };
  }

  getPikachuFriendship(): number {
    const bytes = this.getBytes('271C');
    return bytes[0];
  }

  getTimePlayed(): object {
    // First two bytes are little-endian.
    // In this order: Hour (2 bytes), minute (1 byte), second (1 byte)
    const hourBytes = this.getBytes('2CEE', -2);
    const minByte = this.getBytes('2CEF');
    const secByte = this.getBytes('2CF0');

    return {
      hours: bytesToNumber(hourBytes),
      minutes: minByte[0],
      seconds: secByte[0]
    }
  }
}