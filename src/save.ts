import * as fs from 'fs';
import {
  hex2dec,
  bytesToString,
  bcdToNumber,
  reverseBuffer,
  bytesToNumber,
  dec2bin,
  bin2dec,
  byteToBits,
} from './helpers';
import { textSpeeds } from './lists/textSpeeds';
import { speciesList } from './lists/species';
import { pokemonTypes } from './lists/types';
import { moves } from './lists/moves';
import { itemList } from './lists/items';
import {
  IPokedexItem,
  IItemList,
  IOptions,
  IBadges,
  ITimePlayed,
  IPCBoxList,
  IPokemonList,
} from './types';
import { pokemonList } from './lists/pokemons';

export default class Save {
  buffer: Buffer;
  PCBoxList: IPCBoxList;

  constructor(filename: string) {
    this.buffer = fs.readFileSync(filename);
    this.PCBoxList = {};
    this.PCBoxList.current = this.getPCBoxList();

    for (let i = 1; i < 13; i++) {
      this.PCBoxList[i] = this.getPCBoxList(i);
    }
  }

  private getBytes(offset: string | number, size: number = 1): Buffer {
    offset = typeof offset == 'string' ? hex2dec(offset) : offset;

    if (size > 0) {
      // Big-endian   Direction: 0x00 --> 0xFF
      const endOffset = offset + size;
      const buffer = this.buffer.slice(offset, endOffset);

      return buffer;
    } else {
      // Little-endian   Direction: 0xFF --> 0x00
      const startOffset = offset - Math.abs(size) + 1;
      const endOffset = startOffset + 2;
      const buffer = this.buffer.slice(startOffset, endOffset);

      return reverseBuffer(buffer);
    }
  }

  private getTextString(bytes: Buffer): string {
    const strEnd = bytes.findIndex(byte => byte === 0x50); // 0x50 is string terminator
    const nameBytes = bytes.slice(0, strEnd);

    return bytesToString(nameBytes);
  }

  get playerName(): string {
    return this.getTextString(this.getBytes(0x2598, 11));
  }

  get rivalName(): string {
    return this.getTextString(this.getBytes(0x25f6, 11));
  }

  get pokedex(): Array<IPokedexItem> {
    const pokedex: Array<IPokedexItem> = [];

    for (let i = 0; i < 19; i++) {
      const binOwned = dec2bin(this.getBytes(0x25a3 + i)[0]).padStart(8, '0');
      const binSeen = dec2bin(this.getBytes(0x25b6 + i)[0]).padStart(8, '0');

      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j + 1;
        const species = pokemonList[index];
        const owned = !!+binOwned[7 - j];
        const seen = !!+binSeen[7 - j];

        if (index === 152) {
          break;
        }

        pokedex.push({
          index,
          species,
          owned,
          seen,
        });
      }
    }

    return pokedex;
  }

  private getItemListAtOffset(startOffset: number): IItemList {
    const itemCount = this.getBytes(startOffset)[0];
    const items: IItemList = [];

    for (let i = 0; i < itemCount; i++) {
      const itemBytes = this.getBytes(startOffset + 0x01 + 2 * i, 2);

      items.push({
        name: itemList[itemBytes[0]],
        count: itemBytes[1],
      });
    }

    return items;
  }

  get pocketItemList(): IItemList {
    return this.getItemListAtOffset(0x25c9);
  }

  get PCItemList(): IItemList {
    // TODO: Test if works (it should)
    return this.getItemListAtOffset(0x27e6);
  }

  get money(): number {
    const bytes = this.getBytes(0x25f3, 3);
    return bcdToNumber(bytes);
  }

  get casinoCoins(): number {
    const bytes = this.getBytes(0x2850, 2);
    return bcdToNumber(bytes);
  }

  get options(): IOptions {
    const bytes = this.getBytes(0x2601);
    const bin = dec2bin(bytes[0]).padStart(8, '0');

    // TO-DO: sound bits are different for Pokémon Yellow
    // See: https://bulbapedia.bulbagarden.net/wiki/Save_data_structure_in_Generation_I#Options
    return {
      battleEffects: bin[0] === '1' ? false : true,
      battleStyle: bin[1] === '1' ? 'set' : 'switch',
      sound: bin[3] === '1' ? 'stereo' : 'mono',
      textSpeed: textSpeeds[bin.slice(5, 8)],
    };
  }

  get badges(): IBadges {
    const bytes = this.getBytes(0x2602);
    const bin = dec2bin(bytes[0]);

    return {
      boulder: bin[0] === '1',
      cascade: bin[1] === '1',
      thunder: bin[2] === '1',
      rainbow: bin[3] === '1',
      soul: bin[4] === '1',
      marsh: bin[5] === '1',
      volcano: bin[6] === '1',
      earth: bin[7] === '1',
    };
  }

  get pikachuFriendship(): number {
    const bytes = this.getBytes(0x271c);
    return bytes[0];
  }

  get currentPCBox(): number {
    const bytes = this.getBytes(0x284c);
    return bytes[0] + 1;
  }

  get timePlayed(): ITimePlayed {
    // First two bytes are little-endian.
    // In this order: Hour (2 bytes), minute (1 byte), second (1 byte)
    const hourBytes = this.getBytes(0x2cee, -2);
    const minByte = this.getBytes(0x2cef);
    const secByte = this.getBytes(0x2cf0);

    return {
      hours: bytesToNumber(hourBytes),
      minutes: minByte[0],
      seconds: secByte[0],
    };
  }

  private getPokemonList(startOffset: number, isPCBox: boolean): IPokemonList {
    const pokemonCount = this.getBytes(startOffset)[0];
    const pokemons = [];

    if (pokemonCount == 0xff) {
      return [];
    }

    for (let i = 0; i < pokemonCount; i++) {
      let iterationOffset: number;
      let originalTrainerOffset;
      let nameOffset;

      if (isPCBox) {
        iterationOffset = startOffset + 0x16 + 33 * i;
        originalTrainerOffset = startOffset + 0x02aa;
        nameOffset = startOffset + 0x0386;
      } else {
        iterationOffset = startOffset + 0x08 + 44 * i;
        originalTrainerOffset = startOffset + 0x0110;
        nameOffset = startOffset + 0x0152;
      }

      // .map() doesn't work with buffer so
      // we need to convert buffer to array
      const getArray = (offset: number, size: number = 1): Array<number> => {
        return Array.from(this.getBytes(iterationOffset + offset, size));
      };

      // Combines bytes and returns a number
      const getNumber = (offset: number, size: number = 1): number => {
        return bytesToNumber(this.getBytes(iterationOffset + offset, size));
      };

      let pokemon = {
        species: speciesList[getArray(0x00)[0]],
        currentHP: getArray(0x03)[0],
        status: getArray(0x04)[0], // TO-DO: Convert to corresponding status text
        types: getArray(0x05, 2).map(x => pokemonTypes[x]),

        moves: [0x08, 0x09, 0x0a, 0x0b].map(moveOffset => {
          const nameByte = getArray(moveOffset)[0];
          const PPByte = getArray(moveOffset + 0x15)[0];

          if (!moves[nameByte]) {
            return;
          }

          return {
            name: moves[nameByte],
            PPUps: bin2dec(byteToBits(PPByte, 0, 2)),
            PP: bin2dec(byteToBits(PPByte, 2, 8)),
          };
        }),

        trainerID: getNumber(0x0c, 2),
        experience: getNumber(0x0e, 3),

        stats: {
          EV: {
            hp: getNumber(0x11, 2),
            attack: getNumber(0x13, 2),
            defense: getNumber(0x15, 2),
            speed: getNumber(0x17, 2),
            special: getNumber(0x19, 2),
          },

          IV: {
            attack: bin2dec(byteToBits(getArray(0x1b)[0], 0, 4)),
            defense: bin2dec(byteToBits(getArray(0x1b)[0], 4, 8)),
            speed: bin2dec(byteToBits(getArray(0x1c)[0], 0, 4)),
            special: bin2dec(byteToBits(getArray(0x1c)[0], 4, 8)),
          },
        },

        originalTrainer: this.getTextString(
          this.getBytes(originalTrainerOffset + i * 11, 11)
        ),
        name: this.getTextString(this.getBytes(nameOffset + i * 11, 11)),
      };

      // Full 44 byte pokemon data structure if it's not PC box
      // Additions: Level, Max HP, Attack, Defense, Speed and Special
      if (!isPCBox) {
        pokemon.stats['attack'] = getNumber(0x24, 2);
        pokemon.stats['defense'] = getNumber(0x26, 2);
        pokemon.stats['speed'] = getNumber(0x28, 2);
        pokemon.stats['special'] = getNumber(0x2a, 2);

        pokemon['level'] = getArray(0x21)[0];
        pokemon['maxHP'] = getNumber(0x22, 2);
      }

      pokemons.push(pokemon);
    }

    return pokemons;
  }

  get teamPokemonList(): object {
    return this.getPokemonList(0x2f2c, false);
  }

  getPCBoxList(PCBoxId?: number): IPokemonList {
    if (!PCBoxId) {
      return this.getPokemonList(0x30c0, true);
    }

    if (PCBoxId > 0 && PCBoxId <= 12) {
      return this.getPokemonList(0x4000 + 1122 * (PCBoxId - 1), true);
    }

    return [];
  }
}
