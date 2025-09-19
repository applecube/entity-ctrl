import { EntityCtrl } from './EntityCtrl.js';
import { FieldCtrl } from './FieldCtrl.js';
import type { EntityKey, AnyValues } from './types.js';

interface EntityCtrlFunction {
  <VO extends object = AnyValues>(key?: EntityKey): EntityCtrl<VO>;

  field: <V = any>(defaultValue?: V, field?: any) => FieldCtrl<{ standalone: V }, 'standalone'>;

  get: <VO extends object = AnyValues>(key: EntityKey) => EntityCtrl<VO> | undefined;

  keys: () => EntityKey[];

  clearCache: () => void;
}

export const entc: EntityCtrlFunction = (key) => new EntityCtrl<any>(key);

entc.field = (defaultValue, field) => new FieldCtrl(field ?? 'standalone', null, defaultValue);

entc.get = (key: EntityKey) => EntityCtrl.get(key);

entc.keys = () => EntityCtrl.keys();

entc.clearCache = () => EntityCtrl.clearCache();
