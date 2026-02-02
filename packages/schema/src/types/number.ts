import { ExpressionValueType } from './expression.js';

export class NumberType extends ExpressionValueType<number> {
  protected override cast_(value: any): number {
    if (typeof value !== 'number')
      throw new Error(`Expected number, got ${value}`);

    return value;
  }
}
