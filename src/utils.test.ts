import { everyTruthy, shallowEqual } from './utils.js';

test('everyTruthy', () => {
  expect(everyTruthy([])).toBe(true);
  expect(everyTruthy([1, true, 3])).toBe(true);
  expect(everyTruthy([1, true, false])).toBe(false);
  expect(everyTruthy([1, null, {}, []])).toBe(false);
  expect(everyTruthy(['sdf', {}, []])).toBe(true);

  const holedArray = [];
  holedArray[0] = {};
  holedArray[1] = 90;
  holedArray[10] = [];
  expect(everyTruthy(holedArray)).toBe(false);
  expect(everyTruthy(Array(4))).toBe(false);
});

test('shallowEqual', () => {
  expect(shallowEqual({}, {})).toBe(true);
  expect(shallowEqual({}, undefined)).toBe(false);
  expect(shallowEqual({ a: 5 }, { a: 5 })).toBe(true);
  expect(shallowEqual({ a: 5 }, { a: 5, b: 4 })).toBe(false);
  expect(shallowEqual({ a: 5, b: [] }, { a: 5, b: [] })).toBe(false);

  const o = { a: 5 };
  expect(shallowEqual(o, o)).toBe(true);
  expect(shallowEqual({ a: 'dfg', o }, { a: 'dfg', o })).toBe(true);
  expect(shallowEqual({ a: 'dfg', o, d: [], c: 5 }, { a: 'dfg', o, d: [], c: 5 })).toBe(false);
});
