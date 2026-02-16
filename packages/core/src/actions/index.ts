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
import * as stealth from './stealth.js';
import * as utils from './utils.js';

BrowserActionRegistry.register('new_page', browser.NewPageParser)
  .register('log', utils.LogParser)
  .register('parallel', control_flow.ParallelParser(BrowserActionRegistry))
  .register('random', utils.RandomParser(BrowserActionRegistry))
  .register('sleep', utils.SleepParser);

EvaluatorRegistry.register('$', evaluators.QuerySelectorParser)
  .register('and', evaluators.AndParser)
  .register('as_bool', evaluators.AsBoolParser)
  .register('as_float', evaluators.AsFloatParser)
  .register('as_int', evaluators.AsIntParser)
  .register('attr', evaluators.AttrParser)
  .register('child', evaluators.ChildParser)
  .register('default', evaluators.DefaultParser)
  .register('deq', evaluators.DeqParser)
  .register('dne', evaluators.DneParser)
  .register('eq', evaluators.EqParser)
  .register('extract', evaluators.ExtractParser)
  .register('func', evaluators.FuncParser)
  .register('matches', evaluators.MatchesParser)
  .register('ne', evaluators.NeParser)
  .register('not', evaluators.NotParser)
  .register('or', evaluators.OrParser)
  .register('prop', evaluators.PropertyParser)
  .register('root', evaluators.RootParser)
  .register('text', evaluators.InnerTextParser);

SessionActionRegistry.register('$', dom.QuerySelectorParser)
  .register('$$', dom.QuerySelectorAllParser)
  .register('apply_identity', stealth.ApplyIdentityParser)
  .register('click', interaction.ClickParser)
  .register('do', control_flow.DoParser)
  .register('extract', output.ExtractParser)
  .register('filter', control_flow.FilterParser)
  .register('for_each', control_flow.ForEachParser)
  .register('hover', interaction.HoverParser)
  .register('goto', page.GotoParser)
  .register('loop', control_flow.LoopParser)
  .register('maybe', control_flow.MaybeParser)
  .register('once', control_flow.OnceParser)
  .register('parallel', control_flow.ParallelParser(SessionActionRegistry))
  .register('random', utils.RandomParser(SessionActionRegistry))
  .register('screenshot', utils.ScreenshotParser)
  .register('set_device_memory', stealth.SetDeviceMemoryParser)
  .register('set_hardware_concurrency', stealth.SetHardwareConcurrencyParser)
  .register('set_viewport', stealth.SetViewportParser)
  .register('set_webgl_vendor', stealth.SetWebGLVendorParser)
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
