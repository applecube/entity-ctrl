import type { EntityCtrl } from './EntityCtrl.js';
import type {
  Field,
  FieldValidation,
  AnyValues,
  ValidationEventType,
  FieldMessage,
  FieldValidationRule,
  ValidationOptions,
  FieldValue,
  FieldParam,
  FieldRequired,
  FieldParamListener,
  FieldParamListenersInternal,
  FieldListenerParam,
} from './types.js';
import { shallowEqual, everyTruthy } from './utils.js';

export const VALIDATION_DEFAULTS: Required<ValidationOptions> = {
  validateOn: 'demand',
  requiredValidate: ({ value }) =>
    value !== undefined && value !== null && value !== '' && value !== 0,
  requiredMessage: 'Required field',
};

export class FieldCtrl<VO extends object = AnyValues, F extends Field<VO> = Field<VO>> {
  readonly field: F;
  readonly parent?: EntityCtrl<VO> | null;

  defaultValue: FieldValue<VO, F>;
  holdValidation: boolean | ValidationEventType[];
  holdListeners: boolean | FieldParam[];

  protected _value: FieldValue<VO, F>;
  protected _touched: number;
  protected _changed: number;
  protected _error: boolean;
  protected _warning: boolean;
  protected _messages: FieldMessage[] | null;

  protected _validation: FieldValidation<this> | null;
  protected _requiredMessage: FieldMessage | null;
  protected _rulesMessages: (FieldMessage | undefined)[] | null;
  protected _customMessages: FieldMessage[] | null;
  protected _errorOverride: boolean | null;
  protected _warningOverride: boolean | null;

  protected _listeners_any: FieldParamListenersInternal<this, never>;
  protected _listeners_value: FieldParamListenersInternal<this, FieldValue<VO, F>>;
  protected _listeners_touched: FieldParamListenersInternal<this, number>;
  protected _listeners_changed: FieldParamListenersInternal<this, number>;
  protected _listeners_error: FieldParamListenersInternal<this, boolean>;
  protected _listeners_warning: FieldParamListenersInternal<this, boolean>;
  protected _listeners_messages: FieldParamListenersInternal<this, FieldMessage[] | null>;

  constructor(field: F, parent?: EntityCtrl<VO> | null, defaultValue?: VO[F]) {
    this.field = field;
    this.parent = parent;

    this.defaultValue = defaultValue;
    this.holdValidation = false;
    this.holdListeners = false;

    this._value = defaultValue;
    this._touched = 0;
    this._changed = 0;
    this._error = false;
    this._warning = false;
    this._messages = null;

    this._validation = null;
    this._requiredMessage = null;
    this._rulesMessages = null;
    this._customMessages = null;
    this._errorOverride = null;
    this._warningOverride = null;

    this._listeners_any = null;
    this._listeners_value = null;
    this._listeners_touched = null;
    this._listeners_changed = null;
    this._listeners_error = null;
    this._listeners_warning = null;
    this._listeners_messages = null;
  }

  // region Value

  /**
   * Field value.
   */
  get value() {
    return this._value;
  }

  set value(v: FieldValue<VO, F>) {
    const {
      _value: prevValue,
      _changed: prevChanged,
      _error: prevError,
      _warning: prevWarning,
      _messages: prevMessages,
    } = this;

    this._value = v;
    this._changed++;
    this._validate('change', true);

    // dont want to create temporary objects
    this._triggerListeners('value', prevValue);
    this._triggerListeners('changed', prevChanged);
    this._triggerListeners('error', prevError);
    this._triggerListeners('warning', prevWarning);
    this._triggerListeners('messages', prevMessages);
    this._triggerListeners('any');
  }

  touch(value: FieldValue<VO, F>) {
    const {
      _value: prevValue,
      _touched: prevTouched,
      _changed: prevChanged,
      _error: prevError,
      _warning: prevWarning,
      _messages: prevMessages,
    } = this;

    this._value = value;
    this._touched++;
    this._changed++;
    this._validate('touch', true);

    // dont want to create temporary objects
    this._triggerListeners('value', prevValue);
    this._triggerListeners('touched', prevTouched);
    this._triggerListeners('changed', prevChanged);
    this._triggerListeners('error', prevError);
    this._triggerListeners('warning', prevWarning);
    this._triggerListeners('messages', prevMessages);
    this._triggerListeners('any');
  }

  /**
   * Number of times field was touched.
   *
   * Every touch is change, but not every change is touch.
   */
  get touched() {
    return this._touched;
  }

  set touched(t: number) {
    const prev = this._touched;
    this._touched = t;
    this._triggerListeners('touched', prev);
  }

  /**
   * Number of times field was changed.
   */
  get changed() {
    return this._changed;
  }

  set changed(c: number) {
    const prev = this._changed;
    this._changed = c;
    this._triggerListeners('changed', prev);
  }

  // region Error/Warning

  /**
   * `true` if there is at least one message with `type === 'error'`,
   * or if `errorOverride` has been used.
   */
  get error() {
    return this._error;
  }

  /**
   * `true` if there is at least one message with `type === 'warning'`,
   * or if `warningOverride` has been used.
   */
  get warning() {
    return this._warning;
  }

  /**
   * If `boolean` fixes `error` with its value.
   *
   * Turned off if `null`.
   */
  get errorOverride() {
    return this._errorOverride;
  }

  set errorOverride(errorOverride: boolean | null) {
    if (this._errorOverride === errorOverride) return;
    this._errorOverride = errorOverride;
    if (errorOverride === null) {
      this._updateMessages('onlyError');
    } else {
      const prevError = this._error;
      this._error = errorOverride;
      this._triggerListeners('error', prevError);
    }
  }

  /**
   * If `boolean` fixes `warning` with its value.
   *
   * Turned off if `null`.
   */
  get warningOverride() {
    return this._warningOverride;
  }

  set warningOverride(warningOverride: boolean | null) {
    if (this._warningOverride === warningOverride) return;
    this._warningOverride = warningOverride;
    if (warningOverride === null) {
      this._updateMessages('onlyWarning');
    } else {
      const prevWarning = this._warning;
      this._warning = warningOverride;
      this._triggerListeners('warning', prevWarning);
    }
  }

  // region Messages

  /**
   * All field messages (custom and validation: required, rules).
   *
   * Immutable array - there will be new array each time messages change.
   *
   * Messages preserve order
   *
   * 1. required message
   *
   * 2. rules messages in same order as rules array
   *
   * 3. custom messages in added order
   */
  get messages() {
    return this._messages;
  }

  /**
   * Custom messages, additional to potential validation messages.
   */
  get customMessages() {
    return this._customMessages;
  }

  set customMessages(messages: FieldMessage[] | null) {
    this._customMessages = messages;
    this._updateMessages();
  }

  protected _updateMessages(only?: 'onlyError' | 'onlyWarning', skipListeners?: boolean): void {
    const {
      _error: prevError,
      _warning: prevWarning,
      _messages: prevMessages,
      _requiredMessage,
      _rulesMessages,
      _customMessages,
      _errorOverride,
      _warningOverride,
    } = this;

    if (!only) this._messages = null;
    if (only !== 'onlyWarning') this._error = _errorOverride ?? false;
    if (only !== 'onlyError') this._warning = _warningOverride ?? false;

    const processInternalMessage = (message: FieldMessage) => {
      if (!only) {
        this._messages = this._messages || [];
        this._messages.push(message);
      }
      if (only !== 'onlyWarning') {
        this._error = _errorOverride ?? (this._error || message.type === 'error');
      }
      if (only !== 'onlyError') {
        this._warning = _warningOverride ?? (this._warning || message.type === 'warning');
      }
    };

    if (_requiredMessage) processInternalMessage(_requiredMessage);
    if (_rulesMessages) {
      for (const message of _rulesMessages) {
        if (message) processInternalMessage(message);
      }
    }
    if (_customMessages) {
      for (const message of _customMessages) {
        if (message) processInternalMessage(message);
      }
    }

    if (!skipListeners) {
      const errorChanged = this._triggerListeners('error', prevError);
      const warningChanged = this._triggerListeners('warning', prevWarning);
      const messagesChanged = this._triggerListeners('messages', prevMessages);
      if (errorChanged || warningChanged || messagesChanged) {
        this._triggerListeners('any');
      }
    }
  }

  // region Listeners

  /**
   * Adds `listener` to `param` changes.
   */
  addListener<P extends FieldListenerParam>(
    param: P,
    listener: FieldParamListener<this, (this & { any: never })[P]>,
  ): void {
    const key = `_listeners_${param}` as '_listeners_changed';
    const l = listener as FieldParamListener<this, number>;
    const ls = this[key];

    if (!ls) {
      // if no listeners - set plain listener
      this[key] = l;
    } else if (ls instanceof Set) {
      // if there is Set of listeners - add to it
      ls.add(l);
    } else {
      // if there is plain listener - create Set with old listener and new listener
      const set = new Set<FieldParamListener<this, number>>();
      set.add(ls);
      set.add(l);
      this[key] = set;
    }
  }

  /**
   * Removes `listener` to `param` changes.
   *
   * Returns `true` if `listener` was registered for `param`.
   */
  removeListener<P extends FieldListenerParam>(
    param: P,
    listener: FieldParamListener<this, (this & { any: never })[P]>,
  ): boolean {
    const key = `_listeners_${param}` as '_listeners_changed';
    const l = listener as FieldParamListener<this, number>;
    const ls = this[key];

    // if no listeners - dont do anything
    if (!ls) return false;

    // if Set - try to delete, if deleted and Set of 0-1 listeners - remove Set wrapping
    if (ls instanceof Set) {
      const deleted = ls.delete(l);
      if (deleted && ls.size < 2) {
        this[key] = ls.keys().next().value || null;
      }
      return deleted;
    }

    // if plain listener - remove if equal
    if (ls === listener) {
      this[key] = null;
      return true;
    }

    return false;
  }

  /**
   * Triggers param listeners if
   * - param changed
   * - listeners for that param exist
   * - `holdListeners` allows
   *
   * Returns `true` if param changed or `'any'`
   */
  protected _triggerListeners(param: FieldListenerParam, prev?: any): boolean {
    if (param !== 'any') {
      const current = this[`_${param}`];
      if (Object.is(current, prev)) return false;
    }

    const paramListeners = this[`_listeners_${param}`] as FieldParamListenersInternal<
      this,
      any
    > | null;
    if (!paramListeners) return true;

    const holdListeners = this.holdListeners;
    const holdParamListeners =
      holdListeners && (holdListeners === true || holdListeners.includes(param as FieldParam));
    if (holdParamListeners) return true;

    if (paramListeners instanceof Set) {
      for (const listener of paramListeners) {
        listener(this, param, prev);
      }
    } else {
      paramListeners(this, param, prev);
    }

    return true;
  }

  // region Clear

  /**
   * Clears validation result.
   *
   * (`customMessages`, `errorOverride`, `warningOverride` will be kept intact)
   */
  clearValidated() {
    if (this._requiredMessage === null && this._rulesMessages === null) return;

    this._requiredMessage = null;
    this._rulesMessages = null;
    this._updateMessages();
  }

  /**
   * Clears `error`, `warning`, `messages`.
   *
   * (`customMessages`, `errorOverride`, `warningOverride` will be cleared)
   */
  clear() {
    this._requiredMessage = null;
    this._rulesMessages = null;
    this._customMessages = null;
    this._errorOverride = null;
    this._warningOverride = null;
    this._updateMessages();
  }

  /**
   * Sets `value` to `defaultValue`.
   * Clears everything except validation settings and listeners.
   */
  reset() {
    const prevValue = this._value;
    const prevTouched = this._touched;
    const prevChanged = this._changed;

    this._value = this.defaultValue;
    this._touched = 0;
    this._changed = 0;

    this.clear();

    this._triggerListeners('value', prevValue);
    this._triggerListeners('touched', prevTouched);
    this._triggerListeners('changed', prevChanged);
  }

  // region Validation

  /**
   * Shortcut to `validation.required`.
   */
  get required() {
    return this._validation?.required ?? false;
  }

  set required(r: FieldRequired<this>) {
    if (r === false && !this._validation) return;

    const validation = (this._validation = this._validation || {});
    if (validation.required === r) return;
    validation.required = r;

    if (this._requiredMessage) {
      this._requiredMessage = null;
      this._updateMessages();
    }
  }

  /**
   * Field validation settings.
   */
  get validation() {
    return this._cloneValidation(this._validation);
  }

  set validation(validation: FieldValidation<this> | null) {
    this._validation = this._cloneValidation(validation);
    this.clearValidated();
  }

  protected _getValidationDefault<P extends keyof ValidationOptions>(
    param: P,
  ): NonNullable<ValidationOptions[P]> {
    return this.parent?.validationOptions?.[param] || VALIDATION_DEFAULTS[param];
  }

  protected _cloneValidation(
    validation: FieldValidation<this> | null,
  ): FieldValidation<this> | null {
    if (validation === null) return null;

    const copy: FieldValidation<this> = {
      ...validation,
    };

    const rules = validation.rules;
    if (rules) {
      const copyRules = [];
      for (const rule of rules) {
        copyRules.push({ ...rule });
      }
      copy.rules = copyRules;
    }

    return copy;
  }

  // region Validate

  /**
   * Triggers field validation.
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
  validate(eventType?: ValidationEventType): boolean | Promise<boolean> {
    return this._validate(eventType);
  }

  protected _validate(
    eventType?: ValidationEventType,
    skipSyncListeners?: boolean,
  ): boolean | Promise<boolean> {
    const validation = this._validation;
    if (!validation) return true;

    const holdValidation = this.holdValidation;
    const holdForSure =
      holdValidation &&
      (holdValidation === true || (eventType && holdValidation.includes(eventType)));
    if (holdForSure) return true;

    const rulesMessages = (this._rulesMessages = this._rulesMessages || []);

    let promisified = false;
    let needUpdate = false;
    const results: (boolean | Promise<boolean>)[] = [];

    const validateRule = (rule: FieldValidationRule<this>, index: number | 'required') => {
      const ruleValidateOn =
        rule.validateOn || validation.validateOn || this._getValidationDefault('validateOn');

      const shouldValidate = eventType
        ? ruleValidateOn === eventType || (eventType === 'touch' && ruleValidateOn === 'change')
        : Array.isArray(holdValidation)
          ? !holdValidation.includes(ruleValidateOn)
          : true;

      if (!shouldValidate) return;

      let passedMaybePromise: boolean | Promise<boolean> = false;

      try {
        if (rule.validate) {
          passedMaybePromise = rule.validate(this);
        }
      } catch {
        // no-op
      }

      const processPassed = (passed: boolean) => {
        const msgType = passed ? rule.typeIfPassed : rule.type || 'error';

        if (msgType) {
          const message = {
            message: rule.message,
            type: msgType,
          };

          if (index === 'required') {
            if (!shallowEqual(this._requiredMessage, message)) {
              this._requiredMessage = message;
              needUpdate = true;
            }
          } else {
            if (!shallowEqual(rulesMessages[index], message)) {
              rulesMessages[index] = message;
              needUpdate = true;
            }
          }
        } else {
          if (index === 'required') {
            if (this._requiredMessage) {
              this._requiredMessage = null;
              needUpdate = true;
            }
          } else {
            if (rulesMessages[index]) {
              delete rulesMessages[index];
              needUpdate = true;
            }
          }
        }

        // to be sure
        return Boolean(passed);
      };

      let result;
      if (passedMaybePromise instanceof Promise) {
        promisified = true;
        result = passedMaybePromise.catch(() => false).then(processPassed);
      } else {
        result = processPassed(passedMaybePromise);
      }

      results.push(result);
    };

    // required validation
    if (validation.required) {
      const required = validation.required;

      const requiredRule =
        typeof required === 'object' ? required : ({ type: 'error' } as FieldValidationRule<this>);

      if (typeof required !== 'object') {
        requiredRule.validate =
          validation.requiredValidate || this._getValidationDefault('requiredValidate');
        requiredRule.message =
          typeof required === 'string' ? required : this._getValidationDefault('requiredMessage');
      }

      validateRule(requiredRule, 'required');
    }

    // rules validation
    // more optimal this way instead of forEach
    const rules = validation.rules;
    if (rules) {
      const len = rules.length;
      for (let i = 0; i < len; i++) {
        const rule = rules[i];
        if (rule) validateRule(rule, i);
      }
    }

    // todo dependents

    if (promisified) {
      const processBools = needUpdate
        ? (bools: boolean[]) => {
            this._updateMessages();
            return everyTruthy(bools);
          }
        : everyTruthy;

      return Promise.all(results).then(processBools);
    }

    if (needUpdate) this._updateMessages(undefined, skipSyncListeners);
    return everyTruthy(results as boolean[]);
  }
}
