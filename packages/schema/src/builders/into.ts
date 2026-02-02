import { Builder } from './base.js';
import { IntoType, type IntoTypeParams, type Type } from '../types/index.js';

export class IntoBuilder<
  TIn,
  TOut,
  TWrapped extends Type<TIn, TOut>,
  TInto,
> extends Builder<TIn, TInto, IntoType<TIn, TOut, TWrapped, TInto>> {
  constructor(
    private wrapped_: TWrapped,
    private into_: (value: TOut) => TInto,
  ) {
    super();
  }

  override get params(): IntoTypeParams<TIn, TOut, TWrapped, TInto> {
    return {
      wrapped: this.wrapped_,
      into: this.into_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.wrapped_ = this.wrapped_;
    clone.into_ = this.into_;
    return clone;
  }

  override build(): IntoType<TIn, TOut, TWrapped, TInto> {
    return new IntoType(this.params);
  }
}
