import { Builder } from './base.js';
import { EnumType, type EnumTypeParams, type Value } from '../types/index.js';

export class EnumBuilder<const T extends string> extends Builder<
  Value,
  T,
  EnumType<T>
> {
  constructor(private values_: T[]) {
    super();
  }

  override get params(): EnumTypeParams<T> {
    return {
      values: this.values_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.values_ = [...this.values_];
    return clone;
  }

  override build(): EnumType<T> {
    return new EnumType(this.params);
  }
}
