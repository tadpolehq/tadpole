import {
  BrowserActionRegistry,
  EvaluatorRegistry,
  SessionActionRegistry,
} from './base.js';
import * as browser from './browser.js';
import * as control_flow from './control_flow.js';
import * as core from './core.js';
import * as dom from './dom.js';
import * as evaluators from './evaluators.js';
import * as interaction from './interaction.js';
import * as keyboard from './keyboard.js';
import * as mouse from './mouse.js';
import * as output from './output.js';
import * as page from './page.js';

BrowserActionRegistry.register('new_page', browser.BrowserNewPageParser)
  .register('parallel', core.ParallelParser(BrowserActionRegistry))
  .register('sleep', core.SleepParser());

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
  .register('goto', page.PageGotoParser)
  .register('loop', control_flow.LoopParser)
  .register('maybe', control_flow.MaybeParser)
  .register('parallel', core.ParallelParser(SessionActionRegistry))
  .register('type', interaction.TypeParser)
  .register('sleep', core.SleepParser())
  .register('wait_for', dom.WaitForParser)
  .register('wait_until', page.PageWaitUntilParser)
  .registerChild('keyboard', keyboard.KeyboardRegistry)
  .registerChild('mouse', mouse.MouseRegistry);

export type { IAction, IEvaluator } from './base.js';

export {
  browser,
  core,
  dom,
  keyboard,
  mouse,
  page,
  BrowserActionRegistry,
  EvaluatorRegistry,
  SessionActionRegistry,
};
