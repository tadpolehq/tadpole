import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const RootSchema = ts.node({});

export const RootParser = ts.into(RootSchema, () => new Root());

export class Root implements IEvaluator {
  toJS(_input: string, ctx: Context) {
    return ctx.rootInput;
  }
}
