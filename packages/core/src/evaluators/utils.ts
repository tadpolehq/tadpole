import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const DefaultSchema = ts.node({
  args: ts.args([ts.expression(ts.union([ts.number(), ts.string()]))]),
});

export type DefaultParams = ts.output<typeof DefaultSchema>;

export const DefaultParser = ts.into(
  DefaultSchema,
  (v): IEvaluator => new Default(v),
);

export class Default implements IEvaluator {
  constructor(private params_: DefaultParams) {}

  toJS(input: string, ctx: Context) {
    const defaultValue = this.params_.args[0].resolve(ctx.expressionContext);
    return `(${input}) || ${JSON.stringify(defaultValue)}`;
  }
}

export const FuncSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type FuncParams = ts.output<typeof FuncSchema>;

export const FuncParser = ts.into(FuncSchema, (v): IEvaluator => new Func(v));

export class Func implements IEvaluator {
  constructor(private params_: FuncParams) {}

  toJS(input: string): string {
    const [func] = this.params_.args;
    return `(${func})(${input})`;
  }
}
