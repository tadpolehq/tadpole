import { ExpressionValueType } from './expression.js';

export class BooleanType extends ExpressionValueType<boolean> {
  protected override cast_(value: any): boolean {
    if (typeof value !== 'boolean')
      throw new Error(`Expected boolean, got ${typeof value}`);

    return value;
  }
}
