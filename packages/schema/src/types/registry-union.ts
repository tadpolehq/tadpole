import { Err, type Result } from 'ts-results-es';
import { SchemaError } from '../error.js';
import {
  Type,
  type Node,
  type TypeParams,
  type TypeParseContext,
} from './base.js';
import type { IRegistry } from '../registry.js';

export interface RegistryUnionTypeParams<
  TOut,
  TType extends Type<Node, TOut>,
> extends TypeParams<TOut> {
  registry: IRegistry<Node, TOut, TType>;
}

export class RegistryUnionType<
  TOut,
  TType extends Type<Node, TOut>,
> extends Type<Node, TOut> {
  private registry_: IRegistry<Node, TOut, TType>;

  constructor({ registry, ...rest }: RegistryUnionTypeParams<TOut, TType>) {
    super(rest);
    this.registry_ = registry;
  }

  protected override parse_(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const schema = this.registry_.get(value.name);
    if (schema === undefined)
      return new Err(
        new SchemaError({
          message: `${value.name} is not a registered schema`,
        }),
      );

    return schema.parse(value, ctx);
  }
}
