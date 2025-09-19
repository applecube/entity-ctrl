/**
 * Simple util to check if all items of the list are truthy (not falsy).
 *
 * @example
 * everyTruthy([]) => true
 * everyTruthy([true, true, true]) => true
 * everyTruthy([true, false, true]) => false
 * everyTruthy([1, {}, 'asd']) => true
 * everyTruthy([1, 0, {}]) => false
 */
export const everyTruthy = <I = unknown>(list: I[]): boolean => {
  const len = list.length;
  for (let i = 0; i < len; i++) {
    if (!list[i]) return false;
  }
  return true;
};

type ShallowEqualArg = Record<string, any> | null | undefined;

/**
 * Checks shallow equality of two objects.
 *
 * @example
 * shallowEqual({}, {}) => true
 * shallowEqual({}, undefined) => false
 * shallowEqual({ a: 5 }, { a: 5 }) => true
 * shallowEqual({ a: 5 }, { a: 5, b: 4 }) => false
 * shallowEqual({ a: 5, b: [] }, { a: 5, b: [] }) => false
 */
export const shallowEqual = (o1: ShallowEqualArg, o2: ShallowEqualArg) => {
  if (o1 === o2) return true;
  if (!o1 || !o2) return false;

  const keys1 = Object.keys(o1);
  const keys2 = Object.keys(o2);

  const len = keys1.length;
  if (keys2.length !== len) return false;

  for (let i = 0; i < len; i++) {
    const key = keys1[i] as string;

    if (o1[key] !== o2[key] || !Object.prototype.hasOwnProperty.call(o2, key)) {
      return false;
    }
  }

  return true;
};
