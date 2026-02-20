import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as root from '@/actions/root/index.js';
import type * as cdp from '@/cdp/index.js';

export interface Context extends root.WithContext {
  browser: cdp.Browser;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IAction<Context>,
  ts.Type<ts.Node, IAction<Context>>
> = new ts.Registry();
