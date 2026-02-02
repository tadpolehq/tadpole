import { Builder } from './base.js';
import {
  OptionalType,
  type IExpressionValueType,
  type OptionalTypeParams,
  type Type,
  type Value,
} from '../types/index.js';

export class OptionalBuilder<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends Builder<Value, TOut | undefined, OptionalType<TOut, TWrapped>> {
  constructor(private wrapped_: TWrapped) {
    super();
  }

  override get params(): OptionalTypeParams<TOut, TWrapped> {
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

  override build(): OptionalType<TOut, TWrapped> {
    return new OptionalType(this.params);
  }
}
