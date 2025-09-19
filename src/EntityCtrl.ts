import { everyTruthy } from './utils.js';
import type {
  EntityKey,
  AnyValues,
  Field,
  ValidationEventType,
  ValidationOptions,
} from './types.js';
import { FieldCtrl } from './FieldCtrl.js';

let entityCache: Map<EntityKey, EntityCtrl<any>> | null = null;

/**
 * Container for `FieldCtrl` instances by `field` key.
 * Can be saved in cache by own key.
 */
export class EntityCtrl<VO extends object = AnyValues> {
  readonly key?: EntityKey;
  protected readonly _fields: Map<Field<VO>, FieldCtrl<VO>>;
  validationOptions: ValidationOptions<FieldCtrl<VO>> | null;

  // region Constructor

  constructor(key?: EntityKey) {
    this.key = key;
    this._fields = new Map();
    this.validationOptions = null;

    if (key) {
      entityCache = entityCache || new Map();
      entityCache.set(key, this);
    }
  }

  // region Static

  /**
   * Get form instance from internal store by id.
   * Generic class type because of typescript static method issue.
   * https://github.com/microsoft/TypeScript/issues/5863#issuecomment-169173943
   */
  static get<T extends EntityCtrl<any> = EntityCtrl<any>>(key: EntityKey): T | undefined {
    if (!entityCache) return;
    return entityCache.get(key) as T | undefined;
  }

  /**
   * Gets all registered entity keys in cache.
   */
  static keys(): EntityKey[] {
    if (!entityCache) return [];
    return [...entityCache.keys()];
  }

  /**
   * Removes all entities from cache.
   */
  static clearCache(): void {
    if (!entityCache) return;
    entityCache.clear();
    entityCache = null;
  }

  // region Fields

  /**
   * All fields with `FieldCtrl`
   */
  get fields(): Field<VO>[] {
    return [...this._fields.keys()];
  }

  protected _getFieldsIf(param: string): Field<VO>[] {
    const fields: Field<VO>[] = [];
    for (const fc of this._fields.values()) {
      if (fc[param as keyof FieldCtrl]) fields.push(fc.field);
    }
    return fields;
  }

  /**
   * All fields with `touched > 0`
   */
  get touchedFields(): Field<VO>[] {
    return this._getFieldsIf('touched');
  }

  /**
   * All fields with `changed > 0`
   */
  get changedFields(): Field<VO>[] {
    return this._getFieldsIf('changed');
  }

  /**
   * All fields with `error = true`
   */
  get errorFields(): Field<VO>[] {
    return this._getFieldsIf('error');
  }

  /**
   * All fields with `warning = true`
   */
  get warningFields(): Field<VO>[] {
    return this._getFieldsIf('warning');
  }

  protected get _fieldCtor() {
    return FieldCtrl;
  }

  /**
   * Gets `FieldCtrl` or creates if none found.
   * If `strict` is `true` - does not create if none found.
   */
  field<F extends Field<VO>, S extends boolean = false>(
    field: Field<VO>,
    strict?: S,
  ): S extends true ? FieldCtrl<VO, F> | undefined : FieldCtrl<VO, F> {
    let fc = this._fields.get(field);
    if (!fc && !strict) fc = this.createField(field);
    return fc as FieldCtrl<VO, F>;
  }

  /**
   * Creates `FieldCtrl` for `field`. If there is one - override it.
   */
  createField<F extends Field<VO>>(field: F, defaultValue?: VO[F]): FieldCtrl<VO, F> {
    const fc = new this._fieldCtor(field, this, defaultValue);
    this._fields.set(field, fc as FieldCtrl<VO>);
    return fc;
  }

  /**
   * Checks if there is `FieldCtrl` for `field`.
   */
  hasField(field: Field<VO>): boolean {
    return this._fields.has(field);
  }

  /**
   * Deletes `FieldCtrl` for `field`.
   * Returns `true` if there was one.
   */
  deleteField(field: Field<VO>): boolean {
    return this._fields.delete(field);
  }

  /**
   * Creates `FieldCtrl` for each `field-defaultValue` pair.
   * Overrides existing ones.
   */
  createFields(defaultValues: Partial<VO>): this {
    for (const field in defaultValues) {
      this.createField(field, defaultValues[field]);
    }
    return this;
  }

  /**
   * Deletes `FieldCtrl` for each of `fields`.
   * If no `fields` provided - deletes all existing ones.
   */
  deleteFields(fields?: Field<VO>[]): this {
    if (fields) {
      for (const field of fields) {
        this._fields.delete(field);
      }
    } else {
      this._fields.clear();
    }
    return this;
  }

  // region General

  /**
   * Number of times field values were touched.
   */
  get touched(): number {
    let touched = 0;
    for (const fc of this._fields.values()) {
      if (fc) touched += fc.touched;
    }
    return touched;
  }

  /**
   * Number of times field values were changed.
   */
  get changed(): number {
    let changed = 0;
    for (const fc of this._fields.values()) {
      if (fc) changed += fc.changed;
    }
    return changed;
  }

  /**
   * Returns `true` if at least one field has error.
   */
  get error(): boolean {
    for (const fc of this._fields.values()) {
      if (fc?.error) return true;
    }
    return false;
  }

  /**
   * Returns `true` if at least one field has warning.
   */
  get warning(): boolean {
    for (const fc of this._fields.values()) {
      if (fc?.warning) return true;
    }
    return false;
  }

  /**
   * Performs `clear` for each field.
   */
  clear(): this {
    for (const fc of this._fields.values()) {
      if (fc) fc.clear();
    }
    return this;
  }

  /**
   * Performs `reset` for each field.
   */
  reset(): this {
    for (const fc of this._fields.values()) {
      if (fc) fc.reset();
    }
    return this;
  }

  /**
   * Delete all fields and remove self from cache.
   */
  destroy(): boolean {
    this._fields.clear();
    const key = this.key;
    if (!entityCache || !key) return false;
    const deleted = entityCache.delete(this.key);
    if (!entityCache.size) entityCache = null;
    return deleted;
  }

  // region Values

  /**
   * Gets `param` for each of `fields`.
   * Ignores non-existent fields.
   * If `fields` are not provided - gets for all existing fields.
   */
  protected _getFieldsParam(
    param: string,
    fields?: readonly Field<VO>[],
  ): Partial<Record<Field<VO>, any>> {
    const result = {} as Partial<Record<Field<VO>, any>>;
    const fieldsMap = this._fields;

    for (const field of fields || fieldsMap.keys()) {
      const fc = fieldsMap.get(field);
      if (!fc) continue;
      result[field] = fc[param as 'value'];
    }

    return result;
  }

  /**
   * Gets `value` for each of `fields`.
   * Ignores non-existent fields.
   * If `fields` are not provided - gets for all existing fields.
   */
  getValues<FA extends readonly Field<VO>[] = readonly Field<VO>[]>(
    fields?: FA,
  ): typeof fields extends undefined ? Partial<VO> : Partial<Pick<VO, FA[number]>> {
    return this._getFieldsParam('value', fields);
  }

  /**
   * Gets `defaultValue` for each of `fields`.
   * Ignores non-existent fields.
   * If `fields` are not provided - gets for all existing fields.
   */
  getDefaultValues<FA extends readonly Field<VO>[] = readonly Field<VO>[]>(
    fields?: FA,
  ): typeof fields extends undefined ? Partial<VO> : Partial<Pick<VO, FA[number]>> {
    return this._getFieldsParam('defaultValue', fields);
  }

  /**
   * Sets `param` for each field.
   *
   * Creates `FieldCtrl` if there is none.
   * If `strict` is `true` - does not create and sets only to existing ones.
   */
  protected _setFieldsParam(
    param: string,
    params: Partial<Record<Field<VO>, any>>,
    strict?: boolean,
  ): this {
    for (const field in params) {
      const fc = this.field(field, strict);
      if (!fc) continue;
      fc[param as 'value'] = params[field];
    }
    return this;
  }

  /**
   * Sets `value` for each field.
   *
   * Creates `FieldCtrl` if there is none.
   * If `strict` is `true` - does not create and sets only to existing ones.
   */
  setValues(values: Partial<VO>, strict?: boolean): this {
    return this._setFieldsParam('value', values, strict);
  }

  /**
   * Sets `defaultValue` for each field.
   *
   * Creates `FieldCtrl` if there is none.
   * If `strict` is `true` - does not create and sets only to existing ones.
   */
  setDefaultValues(defaultValues: Partial<VO>, strict?: boolean): this {
    return this._setFieldsParam('defaultValue', defaultValues, strict);
  }

  // region Validate

  /**
   * Triggers fields validation.
   *
   * If `fields` is not provided - trigger validation for all fields.
   *
   * Pass `eventType` to trigger rules with same `validateOn`
   * (`touch` will also trigger `change`).
   * If not provided every rule will be triggered ignoring `validateOn`.
   *
   * Returns `Promise` only if encounters async `validate` function.
   *
   * If any `validate` function throws an error be it sync or async -
   * catches error and considers it not passed (as if it returned `false`).
   */
  validate(
    fields?: Iterable<Field<VO>>,
    eventType?: ValidationEventType,
  ): boolean | Promise<boolean> {
    let promisified = false;
    const allResults = [];

    for (const field of fields || this._fields.keys()) {
      const fc = this._fields.get(field);
      if (!fc) continue;

      const passedMaybePromise = fc.validate(eventType);
      if (passedMaybePromise instanceof Promise) promisified = true;
      allResults.push(passedMaybePromise);
    }

    return promisified ? Promise.all(allResults).then(everyTruthy) : everyTruthy(allResults);
  }
}
