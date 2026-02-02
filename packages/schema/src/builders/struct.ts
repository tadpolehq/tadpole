import { Builder } from './base.js';
import {
  StructType,
  DocumentStructType,
  NodeChildrenStructType,
  NodePropertiesStructType,
  type Document,
  type ExtractOutputFromTypes,
  type Node,
  type StructTypeParams,
  type Type,
  type Value,
} from '../types/index.js';

export abstract class StructBuilder<
  TIn,
  TMemberIn,
  TMembers extends Record<string, Type<TMemberIn, any>>,
  TType extends StructType<TIn, TMemberIn, TMembers>,
> extends Builder<TIn, ExtractOutputFromTypes<TMembers>, TType> {
  private prefix_: string | undefined;

  constructor(private members_: TMembers) {
    super();
  }

  override get params(): StructTypeParams<TMemberIn, TMembers> {
    return {
      members: this.members_,
      prefix: this.prefix_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.members_ = { ...this.members_ };
    clone.prefix_ = this.prefix_;
    return clone;
  }

  prefix(prefix: string | undefined): this {
    const clone = this.clone();
    clone.prefix_ = prefix;
    return clone;
  }
}

export class DocumentStructBuilder<
  TMembers extends Record<string, Type<Node, any>>,
> extends StructBuilder<
  Document,
  Node,
  TMembers,
  DocumentStructType<TMembers>
> {
  override build(): DocumentStructType<TMembers> {
    return new DocumentStructType(this.params);
  }
}

export class NodeChildrenStructBuilder<
  TMembers extends Record<string, Type<Node, any>>,
> extends StructBuilder<
  Node,
  Node,
  TMembers,
  NodeChildrenStructType<TMembers>
> {
  override build(): NodeChildrenStructType<TMembers> {
    return new NodeChildrenStructType(this.params);
  }
}

export class NodePropertiesStructBuilder<
  TMembers extends Record<string, Type<Value, any>>,
> extends StructBuilder<
  Node,
  Value,
  TMembers,
  NodePropertiesStructType<TMembers>
> {
  override build(): NodePropertiesStructType<TMembers> {
    return new NodePropertiesStructType(this.params);
  }
}
