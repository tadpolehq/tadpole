import { Builder } from './base.js';
import {
  DiscriminatedUnionType,
  type DiscriminatedUnionTypeParams,
  type Node,
  type Type,
} from '../types/index.js';

export class DiscriminatedUnionBuilder<
  TOut,
  TMapping extends Record<string, Type<Node, TOut>>,
> extends Builder<Node, TOut, DiscriminatedUnionType<TOut, TMapping>> {
  constructor(private mapping_: TMapping) {
    super();
  }

  override get params(): DiscriminatedUnionTypeParams<TOut, TMapping> {
    return {
      mapping: this.mapping_,
      ...super.params,
    };
  }

  override clone(): this {
    const copy = super.clone();
    copy.mapping_ = { ...this.mapping_ };
    return copy;
  }

  override build(): DiscriminatedUnionType<TOut, TMapping> {
    return new DiscriminatedUnionType(this.params);
  }

  extend<TExtension extends Record<string, Type<Node, TOut>>>(
    types: TExtension,
  ): DiscriminatedUnionBuilder<TOut, TMapping & TExtension> {
    const clone = this.clone();
    Object.assign(clone.mapping_, types);
    return clone as any;
  }
}
