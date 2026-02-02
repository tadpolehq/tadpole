import { Type, type TypeParams, type Value } from './base.js';
import {
  ExpressionValueType,
  type IExpressionValueType,
} from './expression.js';

export interface NullableTypeParams<
  TOut,
  TWrapped extends Type<Value, TOut>,
> extends TypeParams<TOut | null> {
  wrapped: TWrapped;
}

export class NullableType<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends ExpressionValueType<TOut | null> {
  private wrapped_: TWrapped;

  constructor({ wrapped, ...rest }: NullableTypeParams<TOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  protected override cast_(value: any): TOut | null {
    if (value === null) return null;
    return this.wrapped_.cast(value);
  }
}
