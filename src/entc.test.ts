import { entc } from './entc.js';
import { EntityCtrl } from './EntityCtrl.js';
import { FieldCtrl } from './FieldCtrl.js';

describe('entc', () => {
  test('create no key', () => {
    const ec = entc();
    expect(ec instanceof EntityCtrl).toBe(true);
    expect(ec.key).toBe(undefined);
  });

  test('create standalone field', () => {
    const fc1 = entc.field();
    expect(fc1 instanceof FieldCtrl).toBe(true);
    expect(fc1.parent).toBe(null);
    expect(fc1.field).toBe(undefined);
    expect(fc1.value).toBe(undefined);

    const fc2 = entc.field(0, 'field');
    expect(fc2 instanceof FieldCtrl).toBe(true);
    expect(fc2.parent).toBe(null);
    expect(fc2.field).toBe('field');
    expect(fc2.value).toBe(0);
  });

  test('create with key', () => {
    const ec1 = entc(1);
    const ec2 = entc('2');
    const o = {};
    const ec3 = entc(o);

    expect(entc.get('1')).toBe(undefined);
    expect(entc.get(1)).toBe(ec1);
    expect(entc.get('2')).toBe(ec2);
    expect(entc.get(o)).toBe(ec3);

    expect(entc.keys()).toStrictEqual([1, '2', o]);

    entc.clearCache();
    expect(entc.keys()).toStrictEqual([]);
  });
});
