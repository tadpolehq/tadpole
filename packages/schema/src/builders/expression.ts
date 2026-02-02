import { Builder } from './base.js';
import {
  ExpressionType,
  type ExpressionTypeParams,
  type IExpression,
  type IExpressionValueType,
  type Type,
  type Value,
} from '../types/index.js';

export class ExpressionBuilder<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends Builder<Value, IExpression<TOut>, ExpressionType<TOut, TWrapped>> {
  constructor(private wrapped_: TWrapped) {
    super();
  }

  override get params(): ExpressionTypeParams<TOut, TWrapped> {
    return {
      wrapped: this.wrapped_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.wrapped_ = this.wrapped_;
    return clone;
  }

  override build(): ExpressionType<TOut, TWrapped> {
    return new ExpressionType(this.params);
  }
}
