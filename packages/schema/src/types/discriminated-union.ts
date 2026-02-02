import { Err, type Result } from 'ts-results-es';
import {
  Type,
  type Node,
  type TypeParams,
  type TypeParseContext,
} from './base.js';
import { SchemaError } from '../error.js';

export interface DiscriminatedUnionTypeParams<
  TOut,
  TMapping extends Record<string, Type<Node, TOut>>,
> extends TypeParams<TOut> {
  mapping: TMapping;
}

export class DiscriminatedUnionType<
  TOut,
  TMapping extends Record<string, Type<Node, TOut>>,
> extends Type<Node, TOut> {
  private mapping_: TMapping;

  constructor({
    mapping,
    ...rest
  }: DiscriminatedUnionTypeParams<TOut, TMapping>) {
    super(rest);
    this.mapping_ = mapping;
  }

  get mapping(): TMapping {
    return this.mapping_;
  }

  protected override parse_(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const schema = this.mapping_[value.name];
    if (schema === undefined)
      return new Err(
        new SchemaError({
          message: `Invalid type: ${value.name}`,
        }),
      );

    return schema.parse(value, ctx);
  }
}
