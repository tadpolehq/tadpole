import { Type, type TypeParams, type Value } from './base.js';
import {
  ExpressionValueType,
  type IExpressionValueType,
} from './expression.js';

export interface OptionalTypeParams<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends TypeParams<TOut | undefined> {
  wrapped: TWrapped;
}

export class OptionalType<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends ExpressionValueType<TOut | undefined> {
  private wrapped_: TWrapped;

  constructor({ wrapped, ...rest }: OptionalTypeParams<TOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  protected override cast_(value: any): TOut | undefined {
    if (value === undefined) return undefined;
    return this.wrapped_.cast(value);
  }
}
