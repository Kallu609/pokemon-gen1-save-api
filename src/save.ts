import * as fs from 'fs';
import { bufferToArray } from './helpers';

export default class Save {
  save: Buffer;

  constructor(filename: string) {
    this.save = fs.readFileSync(filename);
  }

  getBytes(startPos: number, size: number) {
    let buffer = this.save.slice(startPos, startPos + size);
    let array = bufferToArray(buffer);

    return array;
  }
}