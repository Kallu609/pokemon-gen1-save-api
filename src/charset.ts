import { dec2hex, hex2dec } from "./helpers";

/*
0x49: Used in Pokédex entries to prompt the player to press a button, after which the screen is cleared to make way for the following text.
0x4A: Prints PKMN in English games and が in Japanese games.
0x4B: ?
0x4C: ?
0x4E: Used as a line break in Pokédex entries.
0x4F: Line break (print position moves to the bottom of the text window).
0x50: A string terminator.
0x51: Prompts the player to press a button, after which the text window is cleared to make way for the following text.
0x52: Prints the player's name.
In Pokémon Yellow, the default value is NINTEN in English games and ゲーフリ1 in Japanese games.
0x53: Prints the rival's name.
In Pokémon Yellow, the default value is SONY in English games and クリチャ in Japanese games.
0x54: Prints POKé in English games and ポケモン in Japanese games.
0x55: Prompts the player to press a button, after which the top line of the text window is replaced by the bottom, the bottom line is cleared, and the print position moves to the start of the bottom line.
0x56: Prints …….
0x57: Marks the end of dialogue, without a visual prompt to the player.
0x58: Marks the end of dialogue, with a visual prompt to the player.
0x59: Prints the inactive Pokémon's name in battle. (In specific circumstances, the game may "pretend" that the inactive Pokémon is actually active and vice versa.)
The default value is Enemy in English games and てきの　 in Japanese games.
0x5A: Prints the active Pokémon's name in battle. The default value is empty. (In specific circumstances, the game may "pretend" that the active Pokémon is actually inactive and vice versa.)
0x5B: Prints PC in English games and パソコン in Japanese games.
0x5C: Prints TM in English games and わざマシン in Japanese games.
0x5D: Prints TRAINER in English games and トレーナー in Japanese games.
0x5E: Prints ROCKET in English games and ロケットだん in Japanese games.
0x5F: Used in Pokédex entries to mark the end of the entry, without a visual prompt to the player.
*/

function logCharset(): void {
  // For debug purposes
  for (let index in charset) {
    console.log(`${dec2hex(index)}: ${charset[index]}`)
  }
}

function createCharset() {
  /*
  null      = null char
  undefined = Junk
  */

  // 0x80 - 0xB9
  const charset = [
    null,

    // 0x01 - 0x47   71 bytes of junk
    ... Array(71).fill(undefined),

    // 0x48 - 0x5F   Control characters, doc at top
    // TO-DO: Add handlers for every control character
    ... Array(24).fill('$CONTROL$'),

    // 0x60 - 0x7F   Character leftovers from JAP game version, do not use
    ... Array(32).fill('$JAP$'),

    // 0x80 - 0xBA
    ... 'ABCDEFGHIJKLMNOPQRSTUVWXYZ():;[]abcdefghijklmnopqrstuvwxyzé'.split(''),

    // 0xBB - 0xBF   lol imaginary pokemon characters
    `'d`,
    `'l`,
    `'s`,
    `'t`,
    `'v`,

    // 0xC0 - 0xDF   32 bytes of junk
    ... Array(32).fill(undefined),

    // 0xE0 - 0xE5
    `'`,
    `PK`,
    `MN`,
    `-`,
    `'r`,
    `'m`,

    // 0xE6 - 0xEF
    ... '?!.ァゥェ▷▶▼♂'.split(''),

    // 0xF0   Pokédollar symbol
    `PK$`,

    // 0xF1 - 0xFF
    ... '×./,♀0123456789'.split('')
  ];

  return charset;
}

const charset: Array<string> = createCharset();
export default charset;