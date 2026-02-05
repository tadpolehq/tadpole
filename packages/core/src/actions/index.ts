import {
  BrowserActionRegistry,
  EvaluatorRegistry,
  SessionActionRegistry,
} from './base.js';
import * as browser from './browser.js';
import * as control_flow from './control_flow.js';
import * as dom from './dom.js';
import * as evaluators from './evaluators.js';
import * as interaction from './interaction.js';
import * as keyboard from './keyboard.js';
import * as mouse from './mouse.js';
import * as output from './output.js';
import * as page from './page.js';
import * as utils from './utils.js';

BrowserActionRegistry.register('new_page', browser.NewPageParser)
  .register('log', utils.LogParser)
  .register('parallel', control_flow.ParallelParser(BrowserActionRegistry))
  .register('sleep', utils.SleepParser);

EvaluatorRegistry.register('$', evaluators.QuerySelectorParser)
  .register('as_boolean', evaluators.AsBooleanParser)
  .register('attr', evaluators.AttrParser)
  .register('child', evaluators.ChildParser)
  .register('func', evaluators.FuncParser)
  .register('text', evaluators.InnerTextParser);

SessionActionRegistry.register('$', dom.QuerySelectorParser)
  .register('$$', dom.QuerySelectorAllParser)
  .register('click', interaction.ClickParser)
  .register('extract', output.ExtractParser)
  .register('filter', control_flow.FilterParser)
  .register('for_each', control_flow.ForEachParser)
  .register('hover', interaction.HoverParser)
  .register('goto', page.GotoParser)
  .register('loop', control_flow.LoopParser)
  .register('maybe', control_flow.MaybeParser)
  .register('parallel', control_flow.ParallelParser(SessionActionRegistry))
  .register('type', interaction.TypeParser)
  .register('wait_for', dom.WaitForParser)
  .register('wait_until', page.WaitUntilParser)
  .registerChild('keyboard', keyboard.KeyboardRegistry)
  .registerChild('mouse', mouse.MouseRegistry);

export type { IAction, IEvaluator } from './base.js';

export {
  browser,
  control_flow,
  dom,
  evaluators,
  interaction,
  keyboard,
  mouse,
  output,
  page,
  utils,
  BrowserActionRegistry,
  EvaluatorRegistry,
  SessionActionRegistry,
};
