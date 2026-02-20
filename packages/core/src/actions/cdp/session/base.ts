import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as browser from '@/actions/cdp/browser/index.js';
import * as cdp from '@/cdp/index.js';

export interface Context extends browser.Context {
  session: cdp.Session;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IAction<Context>,
  ts.Type<ts.Node, IAction<Context>>
> = new ts.Registry({ parent: browser.Registry });
