import { Builder } from './base.js';
import {
  DefaultType,
  type DefaultTypeParams,
  type IExpressionValueType,
  type Type,
  type Value,
} from '../types/index.js';

export class DefaultBuilder<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends Builder<Value, TOut, DefaultType<TOut, TWrapped>> {
  constructor(
    private wrapped_: TWrapped,
    private defaultValue_: TOut,
  ) {
    super();
  }

  override get params(): DefaultTypeParams<TOut, TWrapped> {
    return {
      wrapped: this.wrapped_,
      defaultValue: this.defaultValue_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.wrapped_ = this.wrapped_;
    clone.defaultValue_ = this.defaultValue_;
    return clone;
  }

  override build(): DefaultType<TOut, TWrapped> {
    return new DefaultType(this.params);
  }
}
