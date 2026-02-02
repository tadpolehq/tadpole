import { Builder } from './base.js';
import { BooleanType, type Value } from '../types/index.js';

export class BooleanBuilder extends Builder<Value, boolean, BooleanType> {
  override build(): BooleanType {
    return new BooleanType(this.params);
  }
}
