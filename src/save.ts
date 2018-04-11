import * as fs from 'fs';
import { hex2dec, dec2hex, bytesToString, bcdToNumber } from './helpers';

export default class Save {
  save: Buffer;

  constructor(filename: string) {
    this.save = fs.readFileSync(filename);
  }

  getBytes(hexBytes: string, size: number): Buffer {
    const startPos = hex2dec(hexBytes);
    const buffer = this.save.slice(startPos, startPos + size);

    return buffer;
  }

  getPlayerName(): string {
    const bytes = this.getBytes('2598', 11);

    return bytesToString(bytes);
  }

  getMoney(): number {
    const bytes = this.getBytes('25f3', 3);
    return bcdToNumber(bytes);
  }
}