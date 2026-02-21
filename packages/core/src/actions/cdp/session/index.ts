import { Registry } from './base.js';
import * as control_flow from './control_flow.js';
import * as dom from './dom.js';
import * as interaction from './interaction.js';
import * as keyboard from './keyboard.js';
import * as mouse from './mouse.js';
import * as output from './output.js';
import * as page from './page.js';
import * as stealth from './stealth.js';
import * as utils from './utils.js';

Registry.register('$', dom.SelectFirstParser)
  .register('$$', dom.SelectAllParser)
  .register('apply_identity', stealth.ApplyIdentityParser)
  .register('click', interaction.ClickParser)
  .register('do', control_flow.DoParser)
  .register('extract', output.ExtractParser)
  .register('filter', control_flow.FilterParser)
  .register('for_each', control_flow.ForEachParser)
  .register('goto', page.GotoParser)
  .register('hover', interaction.HoverParser)
  .register('loop', control_flow.LoopParser)
  .register('maybe', control_flow.MaybeParser)
  .register('once', control_flow.OnceParser)
  .register('parallel', control_flow.ParallelParser)
  .register('random', utils.RandomParser)
  .register('screenshot', utils.ScreenshotParser)
  .register('set_device_memory', stealth.SetDeviceMemoryParser)
  .register('set_hardware_concurrency', stealth.SetHardwareConcurrencyParser)
  .register('set_viewport', stealth.SetViewportParser)
  .register('set_webgl_vendor', stealth.SetWebGLVendorParser)
  .register('type', interaction.TypeParser)
  .register('wait_for', dom.WaitForParser)
  .register('wait_until', page.WaitUntilParser)
  .registerChild('keyboard', keyboard.Registry)
  .registerChild('mouse', mouse.Registry);

export type { Context } from './base.js';
export {
  control_flow,
  dom,
  interaction,
  keyboard,
  mouse,
  page,
  stealth,
  utils,
  Registry,
};
