import * as control_flow from './control_flow.js';
import * as pages from './pages.js';
import { Registry } from './base.js';
import * as utils from './utils.js';

Registry.register('new', pages.NewParser)
  .register('parallel', control_flow.ParallelParser)
  .register('random', utils.RandomParser);

export type { Context } from './base.js';
export { pages, utils, Registry };
