import { ExpressionValueType } from './expression.js';

export class StringType extends ExpressionValueType<string> {
  protected override cast_(value: any): string {
    if (typeof value !== 'string')
      throw new Error(`Expected string, got ${value}`);
    return value;
  }
}
