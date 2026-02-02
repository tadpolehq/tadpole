import {
  BrowserActionRegistry,
  EvaluatorRegistry,
  SessionActionRegistry,
} from './base.js';
import * as browser from './browser.js';
import * as core from './core.js';
import * as dom from './dom.js';
import * as evaluators from './evaluators.js';
import * as keyboard from './keyboard.js';
import * as mouse from './mouse.js';
import * as page from './page.js';

BrowserActionRegistry.register('new_page', browser.BrowserNewPageParser)
  .register('parallel', core.ParallelParser(BrowserActionRegistry))
  .register('sleep', core.SleepParser());

EvaluatorRegistry.register('$', evaluators.QuerySelectorParser)
  .register('attr', evaluators.GetAttributeParser)
  .register('func', evaluators.FuncParser)
  .register('text', evaluators.InnerTextParser);

SessionActionRegistry.register('$', dom.DOMQuerySelectorParser)
  .register('$$', dom.DOMQuerySelectorAllParser)
  .register('click', dom.DOMClickParser)
  .register('for_each', dom.DOMForEachParser)
  .register('extract', dom.DOMExtractParser)
  .register('hover', dom.DOMHoverParser)
  .register('goto', page.PageGotoParser)
  .register('type', dom.DOMTypeParser)
  .register('sleep', core.SleepParser())
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
