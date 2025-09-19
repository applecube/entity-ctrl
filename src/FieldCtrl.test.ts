import { FieldCtrl } from './FieldCtrl.js';
import type { FieldMessage } from './types.js';

describe('Base', () => {
  test('create', () => {
    const fc = new FieldCtrl('a', null, 2);
    expect(fc.field).toBe('a');
    expect(fc.parent).toBe(null);
    expect(fc.value).toBe(2);
    expect(fc.touched).toBe(0);
    expect(fc.changed).toBe(0);
    expect(fc.error).toBe(false);
    expect(fc.warning).toBe(false);
    expect(fc.messages).toBe(null);
    expect(fc.customMessages).toBe(null);
    expect(fc.errorOverride).toBe(null);
    expect(fc.warningOverride).toBe(null);
  });

  test('change value, touched, changed', () => {
    const fc = new FieldCtrl('a', null, 2);

    fc.value = 5;
    expect(fc.value).toBe(5);
    expect(fc.touched).toBe(0);
    expect(fc.changed).toBe(1);

    fc.touch(7);
    expect(fc.value).toBe(7);
    expect(fc.touched).toBe(1);
    expect(fc.changed).toBe(2);

    fc.value = 'asd';
    expect(fc.value).toBe('asd');
    expect(fc.touched).toBe(1);
    expect(fc.changed).toBe(3);

    fc.touched++;
    expect(fc.touched).toBe(2);
    expect(fc.changed).toBe(3);

    fc.changed++;
    expect(fc.touched).toBe(2);
    expect(fc.changed).toBe(4);

    fc.changed = 10;
    expect(fc.changed).toBe(10);
  });
});

describe('Messages, error/warning', () => {
  const reqMsg: FieldMessage = { message: 'Required field', type: 'error' } as const;
  const infoMsg: FieldMessage = { message: 'I', type: 'info' } as const;
  const warnMsg: FieldMessage = { message: 'W', type: 'warning' } as const;
  const errMsg: FieldMessage = { message: 'E', type: 'error' } as const;

  test('required validation, custom messages', () => {
    const fc = new FieldCtrl('a', null, 2);
    fc.validation = {
      required: true,
    };

    fc.value = 0;
    expect(fc.messages).toStrictEqual([reqMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = [infoMsg];
    expect(fc.messages).toStrictEqual([reqMsg, infoMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = [...fc.customMessages, warnMsg];
    expect(fc.messages).toStrictEqual([reqMsg, infoMsg, warnMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(true);

    fc.value = 1;
    expect(fc.messages).toStrictEqual([infoMsg, warnMsg]);
    expect(fc.error).toBe(false);
    expect(fc.warning).toBe(true);

    fc.customMessages = [errMsg];
    expect(fc.messages).toStrictEqual([errMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = [...fc.customMessages, infoMsg];
    fc.value = 0;
    expect(fc.messages).toStrictEqual([reqMsg, errMsg, infoMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = null;
    expect(fc.messages).toStrictEqual([reqMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = [reqMsg, reqMsg];
    expect(fc.messages).toStrictEqual([reqMsg, reqMsg, reqMsg]);
    expect(fc.error).toBe(true);
    expect(fc.warning).toBe(false);

    fc.customMessages = [warnMsg];
    fc.validation = null;
    expect(fc.messages).toStrictEqual([warnMsg]);
    expect(fc.error).toBe(false);
    expect(fc.warning).toBe(true);
  });

  test('errorOverride', () => {
    const fc = new FieldCtrl('a', null, 2);

    fc.required = true;
    expect(fc.validation).toStrictEqual({
      required: true,
    });

    fc.value = 0;
    expect(fc.error).toBe(true);

    fc.errorOverride = false;
    expect(fc.error).toBe(false);

    fc.value = 1;
    expect(fc.error).toBe(false);

    fc.value = 0;
    expect(fc.error).toBe(false);

    fc.customMessages = [errMsg];
    expect(fc.error).toBe(false);

    fc.errorOverride = null;
    expect(fc.error).toBe(true);

    fc.errorOverride = true;
    expect(fc.error).toBe(true);

    fc.value = 1;
    fc.customMessages = null;
    expect(fc.messages).toBe(null);
    expect(fc.error).toBe(true);

    fc.errorOverride = null;
    expect(fc.error).toBe(false);
  });

  test('warningOverride', () => {
    const fc = new FieldCtrl('a', null, 2);

    expect(fc.warning).toBe(false);
  });
});
