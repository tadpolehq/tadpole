import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const AsBoolOptionsSchema = ts.properties({
  falsyValues: ts.expression(ts.default(ts.string(), 'false,0,no')),
});

export const AsBoolSchema = ts.node({
  options: AsBoolOptionsSchema,
});

export type AsBoolParams = ts.output<typeof AsBoolSchema>;

export const AsBoolParser = ts.into(
  AsBoolSchema,
  (v): IEvaluator => new AsBool(v),
);

export class AsBool implements IEvaluator {
  constructor(private params_: AsBoolParams) {}

  toJS(input: string, ctx: Context): string {
    const falsyValues = JSON.stringify(
      this.params_.options.falsyValues
        .resolve(ctx.expressionContext)
        .split(',')
        .map((v) => v.trim().toLowerCase()),
    );
    return `(() => {
      const value = ${input};
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string")
        return !${falsyValues}.includes(value.trim().toLowerCase());

      return true;
    })()`;
  }
}

export const AsFloatSchema = ts.node({});

export const AsFloatParser = ts.into(
  AsFloatSchema,
  (): IEvaluator => new AsFloat(),
);

export class AsFloat implements IEvaluator {
  toJS(input: string) {
    return `parseFloat(${input}?.toString().replace(/[^0-9.-]/g, "") ?? NaN)`;
  }
}

export const AsIntSchema = ts.node({
  options: ts.properties({
    radix: ts.default(ts.number(), 10),
  }),
});

export type AsIntParams = ts.output<typeof AsIntSchema>;

export const AsIntParser = ts.into(
  AsIntSchema,
  (v): IEvaluator => new AsInt(v),
);

export class AsInt implements IEvaluator {
  constructor(private params_: AsIntParams) {}

  toJS(input: string) {
    const radix = this.params_.options.radix;
    return `parseInt(${input}?.toString().replace(/[^0-9-]/g, "") ?? NaN, ${radix})`;
  }
}
