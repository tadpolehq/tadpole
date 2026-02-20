export type { IAction } from './base.js';
export * as cdp from './cdp/index.js';
export * as root from './root/index.js';

SessionActionRegistry.register('do', control_flow.DoParser)

  .register('filter', control_flow.FilterParser)
  .register('for_each', control_flow.ForEachParser)

  .register('loop', control_flow.LoopParser)
  .register('maybe', control_flow.MaybeParser)
  .register('once', control_flow.OnceParser)
  .register('parallel', control_flow.ParallelParser(SessionActionRegistry));
