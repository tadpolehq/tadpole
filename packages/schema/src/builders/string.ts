import { Builder } from './base.js';
import { StringType, type Value } from '../types/index.js';

export class StringBuilder extends Builder<Value, string, StringType> {
  override build(): StringType {
    return new StringType(this.params);
  }

  length(length: number) {
    return this.test((value) => value.length === length);
  }

  max(max: number) {
    return this.test((value) => value.length <= max);
  }

  min(min: number) {
    return this.test((value) => value.length >= min);
  }

  matches(regex: RegExp) {
    return this.test((value) => regex.test(value));
  }
}
