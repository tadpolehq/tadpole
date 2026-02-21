import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as root from '@/actions/root/index.js';
import type * as cdp from '@/cdp/index.js';
import type * as chrome from '@/chrome/index.js';

export interface Context extends root.WithContext {
  browser: cdp.Browser;
  set: chrome.presets.Set;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IAction<Context>,
  ts.Type<ts.Node, IAction<Context>>
> = new ts.Registry({ parent: root.Registry });
