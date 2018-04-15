import * as fs from 'fs';
import { hex2dec, bytesToString, bcdToNumber,
         reverseBuffer, bytesToNumber, dec2bin,
         bin2dec, byteToBits } from './helpers';
import { textSpeeds } from './lists/textSpeeds';
import { speciesList } from './lists/species';
import { pokemonTypes } from './lists/types';
import { moves } from './lists/moves';
import { itemList } from './lists/items';


export default class Save {
  buffer: Buffer;

  playerName:        string;
  rivalName:         string;
  pocketItemList:    Array<object>;
  money:             number;
  casinoCoins:       number;
  options:           object;
  badges:            object;
  pikachuFriendship: number;
  PCItemList:        Array<object>;
  currentPCBox:      number;
  timePlayed:        object; // Keys: hour, minute, second
  teamPokemonList:   object;
  PCBoxList:         object;
  
  constructor(filename: string) {
    this.buffer = fs.readFileSync(filename);

    this.playerName        = this.getPlayerName();
    this.rivalName         = this.getRivalName();
    this.pocketItemList    = this.getPocketItemList();
    this.money             = this.getMoney();
    this.casinoCoins       = this.getCasinoCoins();
    this.options           = this.getOptions();
    this.badges            = this.getBadges();
    this.pikachuFriendship = this.getPikachuFriendship();
    this.PCItemList        = this.getPCItemList();
    this.currentPCBox      = this.getCurrentPCBox();
    this.timePlayed        = this.getTimePlayed();
    this.teamPokemonList   = this.getTeamPokemonList();

    this.PCBoxList = {};

    for (let i = 0; i < 13; i++) {
      if (i === 0) {
        this.PCBoxList['current'] = this.getPCBoxList(i);
      } else {
        this.PCBoxList[i] = this.getPCBoxList(i);
      }
    }
  }

  private getBytes(offset: string | number, size: number = 1): Buffer {
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

  private getTextString(bytes: Buffer): string {
    const strEnd    = bytes.findIndex(byte => byte === 0x50); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }
  
  private getPlayerName(): string {
    return this.getTextString(this.getBytes(0x2598, 11));
  }

  private getRivalName(): string {
    return this.getTextString(this.getBytes(0x25F6, 11));
  }

  private getItemList(startOffset: number): Array<object> {
    const itemCount = this.getBytes(startOffset)[0];
    const items: Array<object> = [];

    if (itemCount === 0) {
      return items;
    }

    for (let i = 0; i < itemCount; i++) {
      let itemBytes = this.getBytes(startOffset += 0x01 + 2 * i, 2)
      items.push({
        name: itemList[itemBytes[0]],
        count: itemBytes[1]
      });
    }

    return items;
  }

  private getPocketItemList(): Array<object> {
    return this.getItemList(0x25C9);
  }

  private getMoney(): number {
    const bytes = this.getBytes(0x25f3, 3);
    return bcdToNumber(bytes);
  }
  
  private getCasinoCoins(): number {
    const bytes = this.getBytes(0x2850, 2);
    return bcdToNumber(bytes);
  }
  
  private getOptions(): object {
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

  private getBadges(): object {
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

  private getPikachuFriendship(): number {
    const bytes = this.getBytes(0x271C);
    return bytes[0];
  }

  private getPCItemList(): Array<object> {
    // TO-DO: Test if works (it should)
    return this.getItemList(0x27E6);
  }

  private getCurrentPCBox(): number {
    const bytes = this.getBytes(0x284C);
    return bytes[0] + 1;
  }

  private getTimePlayed(): object {
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

  private getPokemonList(startOffset: number, isPCBox: boolean): object {
    const pokemonCount = this.getBytes(startOffset)[0];
    const pokemons = [];

    if (pokemonCount == 0xff) {
      return {};
    }

    for (let i = 0; i < pokemonCount; i++) {
      let iterationOffset: number;
      let originalTrainerOffset;
      let nameOffset;

      if (isPCBox) {
        iterationOffset       = startOffset + 0x16 + 33 * i;
        originalTrainerOffset = startOffset + 0x02AA;
        nameOffset            = startOffset + 0x0386;
      } else {
        iterationOffset       = startOffset + 0x08 + 44 * i;
        originalTrainerOffset = startOffset + 0x0110;
        nameOffset            = startOffset + 0x0152;
      }

      // .map() doesn't work with buffer so
      // we need to convert buffer to array
      const getArray = (offset: number, size: number=1): Array<number> => {
        return Array.from(this.getBytes(iterationOffset + offset, size));
      }

      // Combines bytes and returns a number
      const getNumber = (offset: number, size: number=1): number => {
        return bytesToNumber(this.getBytes(iterationOffset + offset, size));
      }
      
      let pokemon = {
        species:   speciesList[getArray(0x00)[0]],
        currentHP: getArray(0x03)[0],
        status:    getArray(0x04)[0], // TO-DO: Convert to corresponding status text 
        types:     getArray(0x05, 2).map(x => pokemonTypes[x]),

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
          EV: {
            hp:      getNumber(0x11, 2),
            attack:  getNumber(0x13, 2),
            defense: getNumber(0x15, 2),
            speed:   getNumber(0x17, 2),
            special: getNumber(0x19, 2)
          },

          IV: {
            attack:  bin2dec(byteToBits(getArray(0x1B)[0], 0, 4)),
            defense: bin2dec(byteToBits(getArray(0x1B)[0], 4, 8)),
            speed:   bin2dec(byteToBits(getArray(0x1C)[0], 0, 4)),
            special: bin2dec(byteToBits(getArray(0x1C)[0], 4, 8)),
          }
        },

        originalTrainer: this.getTextString(this.getBytes(originalTrainerOffset + i * 11, 11)),
        name:            this.getTextString(this.getBytes(nameOffset + i * 11, 11))
      };

      // Full 44 byte pokemon data structure if it's not PC box
      // Additions: Level, Max HP, Attack, Defense, Speed and Special
      if (!isPCBox) {
        pokemon.stats['attack']  = getNumber(0x24, 2);
        pokemon.stats['defense'] = getNumber(0x26, 2);
        pokemon.stats['speed']   = getNumber(0x28, 2);
        pokemon.stats['special'] = getNumber(0x2A, 2);

        pokemon['level'] = getArray(0x21)[0];
        pokemon['maxHP'] = getNumber(0x22, 2);
      }
      
      pokemons.push(pokemon);
    }
    
    return pokemons;
  }

  private getTeamPokemonList(): object {
    return this.getPokemonList(0x2F2C, false);
  }

  private getPCBoxList(PCBoxId: number = 0): object {
    // PCBoxId == 0 for current one
    let offset;
    
    if (PCBoxId === 0) {
      offset = 0x30C0;
    } else if (PCBoxId > 0 && PCBoxId <= 12) {
      offset = 0x4000 + 1122 * (PCBoxId - 1);
    } else {
      return {};
    }

    return this.getPokemonList(offset, true);
  }
}