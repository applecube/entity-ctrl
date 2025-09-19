import { EntityCtrl } from './EntityCtrl.js';
import { FieldCtrl } from './FieldCtrl.js';

describe('Base', () => {
  test('create', () => {
    const ec = new EntityCtrl();

    expect(ec.key).toBe(undefined);
    expect(ec.touched).toBe(0);
    expect(ec.changed).toBe(0);
    expect(ec.error).toBe(false);
    expect(ec.warning).toBe(false);

    expect(ec.fields).toStrictEqual([]);
    expect(ec.touchedFields).toStrictEqual([]);
    expect(ec.changedFields).toStrictEqual([]);
    expect(ec.errorFields).toStrictEqual([]);
    expect(ec.warningFields).toStrictEqual([]);

    expect(ec.getValues()).toStrictEqual({});
    expect(ec.getDefaultValues()).toStrictEqual({});
  });

  test('create with key, static methods', () => {
    const ec1 = new EntityCtrl(1);
    const ec2 = new EntityCtrl('2');

    const o = {};
    const ec3 = new EntityCtrl(o);

    expect(EntityCtrl.get(1)).toBe(ec1);
    expect(EntityCtrl.get('2')).toBe(ec2);
    expect(EntityCtrl.get(o)).toBe(ec3);

    ec1.destroy();

    expect(EntityCtrl.get(1)).toBe(undefined);
    expect(EntityCtrl.get('2')).toBe(ec2);
    expect(EntityCtrl.get(o)).toBe(ec3);

    expect(EntityCtrl.keys()).toStrictEqual(['2', o]);

    EntityCtrl.clearCache();
    expect(EntityCtrl.keys()).toStrictEqual([]);

    expect(EntityCtrl.get(1)).toBe(undefined);
    expect(EntityCtrl.get('2')).toBe(undefined);
    expect(EntityCtrl.get(o)).toBe(undefined);
  });
});

describe('Fields', () => {
  test('create', () => {
    const ec = new EntityCtrl();
    const fc1 = ec.createField('a', 0);
    const fc2 = ec.createField('b');

    expect(fc1 instanceof FieldCtrl).toBe(true);
    expect(fc1.value).toBe(0);
    expect(fc2.value).toBe(undefined);
  });
});
