import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const ChildSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type ChildParams = ts.output<typeof ChildSchema>;

export const ChildParser = ts.into(
  ChildSchema,
  (v): IEvaluator => new Child(v),
);

export class Child implements IEvaluator {
  constructor(private params_: ChildParams) {}

  toJS(input: string, ctx: Context): string {
    const index = this.params_.args[0].resolve(ctx.expressionContext);
    return `Array.from(${input}?.children || []).at(${index})`;
  }
}

export const QuerySelectorSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
});

export type QuerySelectorParams = ts.output<typeof QuerySelectorSchema>;

export const QuerySelectorParser = ts.into(
  QuerySelectorSchema,
  (v): IEvaluator => new QuerySelector(v),
);

export class QuerySelector implements IEvaluator {
  constructor(private params_: QuerySelectorParams) {}

  toJS(input: string, ctx: Context): string {
    const selector = this.params_.args[0].resolve(ctx.expressionContext);
    return `${input}?.querySelector("${selector}")`;
  }
}
