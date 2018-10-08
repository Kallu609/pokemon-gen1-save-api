export interface IPokedexItem {
  index: number;
  species: string;
  owned: boolean;
  seen: boolean;
}

export type IItemList = Array<{
  name: string;
  count: number;
}>;

export interface IOptions {
  battleEffects: boolean;
  battleStyle: 'set' | 'switch';
  sound: 'stereo' | 'mono';
  textSpeed: 'slow' | 'normal' | 'fast';
}

type IBadge =
  | 'boulder'
  | 'cascade'
  | 'thunder'
  | 'rainbow'
  | 'soul'
  | 'marsh'
  | 'volcano'
  | 'earth';

export type IBadges = { [key in IBadge]: boolean };

export interface ITimePlayed {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface IPokemon {
  // todo
}

export type IPokemonList = Array<any>;

export type IPCBoxList = {
  [key: string]: IPokemonList;
};
