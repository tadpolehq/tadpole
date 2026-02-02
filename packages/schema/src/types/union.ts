import {
  Type,
  type ExtractOutputFromType,
  type TypeParams,
  type Value,
} from './base.js';
import {
  ExpressionValueType,
  type IExpressionValueType,
} from './expression.js';

export interface UnionTypeParams<
  TTypes extends (Type<Value, any> & IExpressionValueType<any>)[],
> extends TypeParams<ExtractOutputFromType<TTypes[number]>> {
  types: [...TTypes];
}

export class UnionType<
  TTypes extends (Type<Value, any> & IExpressionValueType<any>)[],
> extends ExpressionValueType<ExtractOutputFromType<TTypes[number]>> {
  private types_: TTypes;

  constructor({ types, ...rest }: UnionTypeParams<TTypes>) {
    super(rest);
    this.types_ = types;
  }

  get types(): TTypes {
    return this.types_;
  }

  protected override cast_(value: any): ExtractOutputFromType<TTypes[number]> {
    for (const type of this.types_) {
      try {
        return type.cast(value);
      } catch {
        continue;
      }
    }

    throw new Error(`${value} does not match any of the union types.`);
  }
}
