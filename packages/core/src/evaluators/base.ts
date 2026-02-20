import * as ts from '@tadpolehq/schema';

export interface Context {
  rootInput: string;
  expressionContext: ts.ExpressionContext;
}

export interface IEvaluator {
  toJS(input: string, ctx: Context): string;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IEvaluator,
  ts.Type<ts.Node, IEvaluator>
> = new ts.Registry();
