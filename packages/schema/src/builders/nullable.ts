import { Builder } from './base.js';
import {
  NullableType,
  type IExpressionValueType,
  type NullableTypeParams,
  type Type,
  type Value,
} from '../types/index.js';

export class NullableBuilder<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends Builder<Value, TOut | null, NullableType<TOut, TWrapped>> {
  constructor(private wrapped_: TWrapped) {
    super();
  }

  override get params(): NullableTypeParams<TOut, TWrapped> {
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

  override build(): NullableType<TOut, TWrapped> {
    return new NullableType(this.params);
  }
}
