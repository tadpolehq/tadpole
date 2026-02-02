import { Builder } from './base.js';
import {
  UnionType,
  type ExtractOutputFromType,
  type IExpressionValueType,
  type Type,
  type UnionTypeParams,
  type Value,
} from '../types/index.js';

export class UnionBuilder<
  TTypes extends (Type<Value, any> & IExpressionValueType<any>)[],
> extends Builder<
  Value,
  ExtractOutputFromType<TTypes[number]>,
  UnionType<TTypes>
> {
  constructor(private types_: [...TTypes]) {
    super();
  }

  override get params(): UnionTypeParams<TTypes> {
    return {
      types: this.types_,
      ...super.params,
    };
  }

  override build(): UnionType<TTypes> {
    return new UnionType(this.params);
  }
}
