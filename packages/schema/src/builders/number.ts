import { Builder } from './base.js';
import { NumberType, type Value } from '../types/index.js';

export class NumberBuilder extends Builder<Value, number, NumberType> {
  override build(): NumberType {
    return new NumberType(this.params);
  }

  lte(other: number): this {
    return this.test((value) => value <= other);
  }

  lt(other: number): this {
    return this.test((value) => value < other);
  }

  gte(other: number): this {
    return this.test((value) => value >= other);
  }

  gt(other: number): this {
    return this.test((value) => value > other);
  }
}
