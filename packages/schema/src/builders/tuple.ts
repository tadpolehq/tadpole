import { Builder } from './base.js';
import {
  TupleType,
  DocumentTupleType,
  NodeArgsTupleType,
  NodeChildrenTupleType,
  type Document,
  type ExtractOutputFromTypes,
  type Node,
  type TupleTypeParams,
  type Type,
  type Value,
} from '../types/index.js';

export abstract class TupleBuilder<
  TIn,
  TMemberIn,
  TMembers extends Type<TMemberIn, any>[],
  TType extends TupleType<TIn, TMemberIn, TMembers>,
> extends Builder<TIn, ExtractOutputFromTypes<TMembers>, TType> {
  private members_: TMembers;

  constructor(members: [...TMembers]) {
    super();
    this.members_ = members;
  }

  get members(): TMembers {
    return this.members_;
  }

  override get params(): TupleTypeParams<TMemberIn, TMembers> {
    return {
      members: this.members_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.members_ = [...this.members_] as TMembers;
    return clone;
  }
}

export class DocumentTupleBuilder<
  TMembers extends Type<Node, any>[],
> extends TupleBuilder<Document, Node, TMembers, DocumentTupleType<TMembers>> {
  override build(): DocumentTupleType<TMembers> {
    return new DocumentTupleType(this.params);
  }
}

export class NodeArgsTupleBuilder<
  TMembers extends Type<Value, any>[],
> extends TupleBuilder<Node, Value, TMembers, NodeArgsTupleType<TMembers>> {
  override build(): NodeArgsTupleType<TMembers> {
    return new NodeArgsTupleType(this.params);
  }
}

export class NodeChildrenTupleBuilder<
  TMembers extends Type<Node, any>[],
> extends TupleBuilder<Node, Node, TMembers, NodeChildrenTupleType<TMembers>> {
  override build(): NodeChildrenTupleType<TMembers> {
    return new NodeChildrenTupleType(this.params);
  }
}
