import * as ts from '@tadpolehq/schema';
import type { IEvaluator } from './base.js';

export const BaseGetAttributeSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type GetAttributeParams = ts.output<typeof BaseGetAttributeSchema>;

export const GetAttributeParser = ts.into(
  BaseGetAttributeSchema,
  (v): IEvaluator => new GetAttribute(v),
);

export class GetAttribute implements IEvaluator {
  constructor(private params_: GetAttributeParams) {}

  toJS(input: string): string {
    const [attr] = this.params_.args;
    return `${input}.getAttribute("${attr}")`;
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
