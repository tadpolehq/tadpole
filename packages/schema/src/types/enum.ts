import { type TypeParams } from './base.js';
import { ExpressionValueType } from './expression.js';

export interface EnumTypeParams<T extends string> extends TypeParams<T> {
  values: T[];
}

export class EnumType<const T extends string> extends ExpressionValueType<T> {
  private values_: string[];

  constructor({ values, ...rest }: EnumTypeParams<T>) {
    super(rest);
    this.values_ = values;
  }

  get values(): string[] {
    return this.values_;
  }

  protected override cast_(value: any): T {
    if (typeof value !== 'string')
      throw new Error(`Expected string, got ${typeof value}`);
    if (this.values_.indexOf(value) === -1)
      throw new Error(
        `Expected value to be one of [${this.values_.join(',')}], got ${value}`,
      );

    return value as T;
  }
}
