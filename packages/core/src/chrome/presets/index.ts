import { Registry } from './base.js';
import * as defintions from './definitions.js';

Registry.register('common', defintions.CommonParser).register(
  'env',
  defintions.EnvParser,
);

export * from './base.js';
export { defintions };
