import { Builder } from './base.js';
import type { IRegistry } from '../registry.js';
import {
  RegistryUnionType,
  type Node,
  type RegistryUnionTypeParams,
  type Type,
} from '../types/index.js';

export class RegistryUnionBuilder<
  TOut,
  TType extends Type<Node, any>,
> extends Builder<Node, TOut, RegistryUnionType<TOut, TType>> {
  constructor(private registry_: IRegistry<Node, TOut, TType>) {
    super();
  }

  get registry(): IRegistry<Node, TOut, TType> {
    return this.registry_;
  }

  override get params(): RegistryUnionTypeParams<TOut, TType> {
    return {
      registry: this.registry_,
      ...super.params,
    };
  }

  override build(): RegistryUnionType<TOut, TType> {
    return new RegistryUnionType(this.params);
  }
}
