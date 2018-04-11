import * as fs from 'fs';
import { hex2dec, dec2hex, bytesToString, bcdToNumber,
         reverseBuffer, bytesToNumber } from './helpers';


export default class Save {
  save: Buffer;

  playerName: string;
  rivalName: string;
  money: number;
  casinoCoins: number;
  timePlayed: {}; // Keys: hour, minute, second

  constructor(filename: string) {
    this.save = fs.readFileSync(filename);

    this.playerName  = this.getPlayerName();
    this.rivalName   = this.getRivalName();
    this.money       = this.getMoney();
    this.casinoCoins = this.getCasinoCoins();
    this.timePlayed  = this.getTimePlayed();
  }

  getBytes(offset: string, size?: number): Buffer {
    let buffer;

    if (!size) {
      size = 1;
    }

    // Big-endian
    if (size > 0) {
      const startPos = hex2dec(offset);
      const endPos = startPos + size;
      buffer = this.save.slice(startPos, endPos);
    }
    // Little-endian
    else {
      const startPos = hex2dec(offset) - Math.abs(size) + 1;
      const endPos = startPos + 2;
      buffer = this.save.slice(startPos, endPos);
      buffer = reverseBuffer(buffer);
    }

    return buffer;
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
  
  getTimePlayed(): {} {
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