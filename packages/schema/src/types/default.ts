import { Type, type TypeParams, type Value } from './base.js';
import { ExpressionValueType, IExpressionValueType } from './expression.js';

export interface DefaultTypeParams<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends TypeParams<TOut> {
  wrapped: TWrapped;
  defaultValue: TOut;
}

export class DefaultType<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends ExpressionValueType<TOut> {
  private wrapped_: TWrapped;
  private defaultValue_: any;

  constructor({
    wrapped,
    defaultValue,
    ...rest
  }: DefaultTypeParams<TOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
    this.defaultValue_ = defaultValue;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  get defaultValue(): any {
    return this.defaultValue_;
  }

  protected override cast_(value: any): TOut {
    if (value === undefined) return this.defaultValue_;
    return this.wrapped_.cast(value);
  }
}
