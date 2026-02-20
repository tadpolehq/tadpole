import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const AttrSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type AttrParams = ts.output<typeof AttrSchema>;

export const AttrParser = ts.into(AttrSchema, (v): IEvaluator => new Attr(v));

export class Attr implements IEvaluator {
  constructor(private params_: AttrParams) {}

  toJS(input: string): string {
    const [attr] = this.params_.args;
    return `${input}?.getAttribute("${attr}")`;
  }
}

export const InnerTextSchema = ts.node({});

export const InnerTextParser = ts.into(
  InnerTextSchema,
  (): IEvaluator => new InnerText(),
);

export class InnerText implements IEvaluator {
  constructor() {}

  toJS(input: string): string {
    return `${input}?.innerText`;
  }
}

export const PropertySchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
});

export type PropertyParams = ts.output<typeof PropertySchema>;

export const PropertyParser = ts.into(
  PropertySchema,
  (v): IEvaluator => new Property(v),
);

export class Property implements IEvaluator {
  constructor(private params_: PropertyParams) {}

  toJS(input: string, ctx: Context): string {
    const name = this.params_.args[0].resolve(ctx.expressionContext);
    return `${input}?.["${name}"]`;
  }
}
