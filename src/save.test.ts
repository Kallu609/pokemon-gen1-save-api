import Save from './save';

const save = new Save('./saves/test.sav');

test('test player name', () => {
  expect(save.playerName).toBe('ROG');
});

test('test rival name', () => {
  expect(save.rivalName).toBe('GARY');
});

test('test pokedex', () => {
  expect(save.pokedex[0]).toEqual({
    index: 1,
    species: 'Bulbasaur',
    owned: true,
    seen: true,
  });

  expect(save.pokedex[75]).toEqual({
    index: 76,
    species: 'Golem',
    owned: true,
    seen: true,
  });

  expect(save.pokedex[150]).toEqual({
    index: 151,
    species: 'Mew',
    owned: true,
    seen: true,
  });
});

test('test money', () => {
  expect(save.money).toBe(46343);
});

test('test pc item list', () => {
  expect(save.PCItemList).toEqual([
    { count: 1, name: 'Potion' },
    { count: 34, name: 'Awakening' },
  ]);
});

test('test pocket item list', () => {
  expect(save.pocketItemList).toEqual([
    { name: 'Town Map', count: 1 },
    { name: 'TM34', count: 1 },
    { name: 'TM11', count: 1 },
    { name: 'Nugget', count: 1 },
    { name: 'S.S. Ticket', count: 1 },
    { name: 'Bike Voucher', count: 2 },
    { name: 'Bicycle', count: 4 },
  ]);
});

console.log(save.PCBoxList);
