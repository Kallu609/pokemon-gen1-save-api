import * as fs from 'fs';
import { hex2dec, bytesToString, bcdToNumber,
         reverseBuffer, bytesToNumber, dec2bin, bin2dec, byteToBits } from './helpers';
import { textSpeeds } from './lists/textSpeeds';
import { speciesList } from './lists/species';
import { pokemonTypes } from './lists/types';
import { moves } from './lists/moves';


export default class Save {
  buffer: Buffer;

  playerName:        string;
  rivalName:         string;
  money:             number;
  casinoCoins:       number;
  options:           object;
  badges:            object;
  pikachuFriendship: number;
  currentPCBox:      number;
  timePlayed:        object; // Keys: hour, minute, second
  teamPokemonList:   object;

  constructor(filename: string) {
    this.buffer = fs.readFileSync(filename);

    this.playerName        = this.getPlayerName();
    this.rivalName         = this.getRivalName();
    this.money             = this.getMoney();
    this.casinoCoins       = this.getCasinoCoins();
    this.options           = this.getOptions();
    this.badges            = this.getBadges();
    this.pikachuFriendship = this.getPikachuFriendship();
    this.currentPCBox      = this.getCurrentPCBox();
    this.timePlayed        = this.getTimePlayed();
    this.teamPokemonList   = this.getTeamPokemonList();
  }

  getBytes(offset: string | number, size: number = 1): Buffer {
    offset = (typeof offset == 'string') ? hex2dec(offset) : offset;

    if (size > 0) {
      // Big-endian   Direction: 0x00 --> 0xFF
      const endOffset = offset + size;
      const buffer    = this.buffer.slice(offset, endOffset);

      return buffer;
    } else {    
      // Little-endian   Direction: 0xFF --> 0x00
      const startOffset = offset - Math.abs(size) + 1;
      const endOffset   = startOffset + 2;
      const buffer      = this.buffer.slice(startOffset, endOffset);

      return reverseBuffer(buffer);
    }
  }

  getPlayerName(): string {
    const bytes     = this.getBytes(0x2598, 11);
    const strEnd    = bytes.findIndex(byte => byte === 0x50); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }

  getRivalName(): string {
    const bytes     = this.getBytes(0x25F6, 11);
    const strEnd    = bytes.findIndex(byte => byte === 0x50); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }

  getMoney(): number {
    const bytes = this.getBytes(0x25f3, 3);
    return bcdToNumber(bytes);
  }
  
  getCasinoCoins(): number {
    const bytes = this.getBytes(0x2850, 2);
    return bcdToNumber(bytes);
  }
  
  getOptions(): object {
    const bytes = this.getBytes(0x2601);
    const bin = dec2bin(bytes[0]).padStart(8, '0');

    // TO-DO: sound bits are different for Pokémon Yellow
    // See: https://bulbapedia.bulbagarden.net/wiki/Save_data_structure_in_Generation_I#Options
    return {
      battleEffects: (bin[0] === '1') ? false     : true,
      battleStyle:   (bin[1] === '1') ? 'set'    : 'switch',
      sound:         (bin[3] === '1') ? 'stereo' : 'mono', 
      textSpeed:     textSpeeds[bin.slice(5,8)]
    };
  }

  getBadges(): object {
    const bytes = this.getBytes(0x2602);
    const bin = dec2bin(bytes[0]);

    return {
      boulder: bin[0] === '1',
      cascade: bin[1] === '1',
      thunder: bin[2] === '1',
      rainbow: bin[3] === '1',
      soul:    bin[4] === '1',
      marsh:   bin[5] === '1',
      volcano: bin[6] === '1',
      earth:   bin[7] === '1'
    }
  }

  getPikachuFriendship(): number {
    const bytes = this.getBytes(0x271C);
    return bytes[0];
  }

  getCurrentPCBox(): number {
    const bytes = this.getBytes(0x284C);
    return bytes[0] + 1;
  }

  getTimePlayed(): object {
    // First two bytes are little-endian.
    // In this order: Hour (2 bytes), minute (1 byte), second (1 byte)
    const hourBytes = this.getBytes(0x2CEE, -2);
    const minByte   = this.getBytes(0x2CEF);
    const secByte   = this.getBytes(0x2CF0);

    return {
      hours:   bytesToNumber(hourBytes),
      minutes: minByte[0],
      seconds: secByte[0]
    }
  }

  getTeamPokemonList(): object {
    const startOffset = 0x2F2C;
    const speciesBytes = this.getBytes(startOffset, 7);

    const species = [];
    
    // Get species
    for (let i = 1; i < speciesBytes[0] + 1; i++) {
      species.push(speciesList[speciesBytes[i]]);

      if (speciesBytes[i] == 0xff) {
        break;
      }
    }

    const pokemonStructOffset = startOffset + 0x008;
    const team = [];

    for (let i = 0; i < species.length; i++) {
      const iterationOffset = pokemonStructOffset + 0x008 + 44 * i;

      // .map() doesn't work with buffer so
      // we need to convert (for code readability)
      const getArray = (offset: number, size: number=1): Array<number> => {
        return Array.from(this.getBytes(iterationOffset + offset, size));
      }
      const getNumber = (offset: number, size: number=1): number => {
        return bytesToNumber(this.getBytes(iterationOffset + offset, size));
      }
      
      team.push({
        species:    speciesList[getArray(0x00)[0]],
        currentHP:  getArray(0x03)[0],
        status:     getArray(0x04)[0], // TO-DO: Convert to corresponding status text 
        types:      getArray(0x05, 2).map(x => pokemonTypes[x]),

        moves: [0x08, 0x09, 0x0A, 0x0B].map(moveOffset => {
          const nameByte = getArray(moveOffset)[0];
          const PPByte   = getArray(moveOffset + 0x15)[0];

          if (!moves[nameByte]) {
            return;
          }

          return {
            name:   moves[nameByte],
            PPUps:  bin2dec(byteToBits(PPByte, 0, 2)),
            PP:     bin2dec(byteToBits(PPByte, 2, 8)),
          }
        }),

        trainerID:  getNumber(0x0C, 2),
        experience: getNumber(0x0E, 3),

        stats: {
          attack:   getNumber(0x24, 2),
          defense:  getNumber(0x26, 2),
          speed:    getNumber(0x28, 2),
          special:  getNumber(0x2A, 2),

          EV: {
            hp:       getNumber(0x11, 2),
            attack:   getNumber(0x13, 2),
            defense:  getNumber(0x15, 2),
            speed:    getNumber(0x17, 2),
            special:  getNumber(0x19, 2)
          },

          IV: {
            attack:   bin2dec(byteToBits(getArray(0x1B)[0], 0, 4)),
            defense:  bin2dec(byteToBits(getArray(0x1B)[0], 4, 8)),
            speed:    bin2dec(byteToBits(getArray(0x1C)[0], 0, 4)),
            special:  bin2dec(byteToBits(getArray(0x1C)[0], 4, 8)),
          }
        },

        level:        getArray(0x21)[0],
        maxHP:        getNumber(0x22, 2),
      });
    }
    
    return team;
  }
}