export interface ValidationEventTypes {
  touch: true;
  change: true;
  demand: true;
}

export interface FieldMessageTypes {
  error: true;
  warning: true;
  success: true;
  info: true;
}

export interface FieldParams<V = any> {
  value: V;
  touched: number;
  changed: number;
  error: boolean;
  warning: boolean;
  messages: FieldMessage[] | null;
}

export type EntityKey = unknown;

export type FieldMessageType = keyof FieldMessageTypes;

export type ValidationEventType = keyof ValidationEventTypes;

export type FieldParam = keyof FieldParams;

export type AnyValues = Record<string, any>;

export type FieldValue<VO extends object = AnyValues, F extends Field<VO> = Field<VO>> =
  | VO[F]
  | undefined;

export type Field<VO extends object = AnyValues> = keyof VO;

export interface FieldMessage {
  /**
   * User readable message text.
   */
  message?: string;
  /**
   * Message type.
   */
  type?: FieldMessageType;
}

export type FieldValidate<FC = any> = (fc: FC) => boolean | Promise<boolean>;

export interface FieldValidationRule<FC = any> extends FieldMessage {
  /**
   * `Rule` validate function. Can be async.
   *
   * If returns `true` or promise resolved as `true` - validation passed.
   * If it throws error or promise rejects -
   * error is silently caught and validation is considered as failed.
   *
   * If validation fails - `fieldState.messages` will have `{ message, type }`.
   * If validation succeeds - there will be no message.
   * If `typeIfPassed` provided - there will be message on validation success with this type.
   *
   * Second argument can be form values, depends on `needMoreValues` `Rule` param.
   */
  validate?: FieldValidate<FC>;
  /**
   * Message type if validation succeeds.
   * If not provided - there will be no message on validation success.
   */
  typeIfPassed?: FieldMessageType;
  /**
   * Event name on which validate function of this rule will be triggered.
   */
  validateOn?: ValidationEventType;
}

export type FieldRequired<FC = any> = boolean | string | FieldValidationRule<FC>;

export interface FieldValidation<FC = any> extends ValidationOptions<FC> {
  /**
   * Array of validation settings.
   * Each item is for specific message with its type and validate function.
   */
  rules?: FieldValidationRule<FC>[];
  /**
   * Required rule is made separate as its most used one and often provided as boolean.
   *
   * If `true` - default `requiredMessage` and `requiredValidate` with `type='error'` will be used.
   *
   * If `string` - same as `true` but with `requiredMessage` as this string.
   *
   * `Rule` object can be passed to override more things.
   * If some settings are missing - for example validate function - default `requiredValidate` will be used.
   */
  required?: FieldRequired<FC>;
}

export interface ValidationOptions<FC = any> {
  /**
   * Event on which validation rules including required will trigger.
   * Applies to all rules if there is no override in a rule.
   */
  validateOn?: ValidationEventType;
  /**
   * Overrides default required validate function.
   */
  requiredValidate?: FieldValidate<FC>;
  /**
   * Overrides default required message.
   */
  requiredMessage?: string;
}

export type FieldListenerParam = FieldParam | 'any';

export type FieldParamListener<FC = any, V = any> = (
  fc: FC,
  param: FieldListenerParam,
  prev: V,
) => void;

export type FieldParamListenersInternal<FC = any, V = any> =
  | Set<FieldParamListener<FC, V>>
  | FieldParamListener<FC, V>
  | null;
