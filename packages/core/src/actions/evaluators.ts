import * as ts from '@tadpolehq/schema';
import type { IEvaluator } from './base.js';

export const BaseAsBooleanSchema = ts.node({
  properties: ts.properties({
    inverted: ts.default(ts.boolean(), false),
  }),
});

export type AsBooleanParams = ts.output<typeof BaseAsBooleanSchema>;

export const AsBooleanParser = ts.into(
  BaseAsBooleanSchema,
  (v): IEvaluator => new AsBoolean(v),
);

export class AsBoolean implements IEvaluator {
  constructor(private params_: AsBooleanParams) {}

  toJS(input: string): string {
    return this.params_.properties.inverted ? `!(${input})` : `!!(${input})`;
  }
}

export const BaseAttrSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type AttrParams = ts.output<typeof BaseAttrSchema>;

export const AttrParser = ts.into(
  BaseAttrSchema,
  (v): IEvaluator => new Attr(v),
);

export class Attr implements IEvaluator {
  constructor(private params_: AttrParams) {}

  toJS(input: string): string {
    const [attr] = this.params_.args;
    return `${input}.getAttribute("${attr}")`;
  }
}

export const BaseChildSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type ChildParams = ts.output<typeof BaseChildSchema>;

export const ChildParser = ts.into(
  BaseChildSchema,
  (v): IEvaluator => new Child(v),
);

export class Child implements IEvaluator {
  constructor(private params_: ChildParams) {}

  toJS(input: string, ctx: ts.ExpressionContext): string {
    const index = this.params_.args[0].resolve(ctx);
    return `Array.from(${input}.children).at(${index})`;
  }
}

export const BaseFuncSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type FuncParams = ts.output<typeof BaseFuncSchema>;

export const FuncParser = ts.into(
  BaseFuncSchema,
  (v): IEvaluator => new Func(v),
);

export class Func implements IEvaluator {
  constructor(private params_: FuncParams) {}

  toJS(input: string): string {
    const [func] = this.params_.args;
    return `(${func})(${input})`;
  }
}

export const BaseInnerTextSchema = ts.node({});

export const InnerTextParser = ts.into(
  BaseInnerTextSchema,
  (): IEvaluator => new InnerText(),
);

export class InnerText implements IEvaluator {
  constructor() {}

  toJS(input: string): string {
    return `${input}.innerText`;
  }
}

export const BaseQuerySelectorSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type QuerySelectorParams = ts.output<typeof BaseQuerySelectorSchema>;

export const QuerySelectorParser = ts.into(
  BaseQuerySelectorSchema,
  (v): IEvaluator => new QuerySelector(v),
);

export class QuerySelector implements IEvaluator {
  constructor(private params_: QuerySelectorParams) {}

  toJS(input: string): string {
    const [selector] = this.params_.args;
    return `${input}.querySelector("${selector}")`;
  }
}
