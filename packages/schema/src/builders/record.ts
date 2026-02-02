import { Builder } from './base.js';
import {
  DocumentRecordType,
  NodeChildrenRecordType,
  NodePropertiesRecordType,
  RecordType,
  type Document,
  type Node,
  type RecordTypeParams,
  type Type,
  type Value,
} from '../types/index.js';

export abstract class RecordBuilder<
  TIn,
  TItemIn,
  TItemOut,
  TValue extends Type<TItemIn, TItemOut>,
  TType extends RecordType<TIn, TItemIn, TItemOut, TValue>,
> extends Builder<TIn, Map<string, TItemOut>, TType> {
  private prefix_: string | undefined;

  constructor(private value_: TValue) {
    super();
  }

  override get params(): RecordTypeParams<TItemIn, TItemOut, TValue> {
    return {
      value: this.value_,
      prefix: this.prefix_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.value_ = this.value_;
    return clone;
  }

  prefix(prefix: string | undefined): this {
    const clone = this.clone();
    clone.prefix_ = prefix;
    return clone;
  }
}

export class DocumentRecordBuilder<
  TItemOut,
  TValue extends Type<Node, TItemOut>,
> extends RecordBuilder<
  Document,
  Node,
  TItemOut,
  TValue,
  DocumentRecordType<TItemOut, TValue>
> {
  override build(): DocumentRecordType<TItemOut, TValue> {
    return new DocumentRecordType(this.params);
  }
}

export class NodeChildrenRecordBuilder<
  TItemOut,
  TValue extends Type<Node, TItemOut>,
> extends RecordBuilder<
  Node,
  Node,
  TItemOut,
  TValue,
  NodeChildrenRecordType<TItemOut, TValue>
> {
  override build(): NodeChildrenRecordType<TItemOut, TValue> {
    return new NodeChildrenRecordType(this.params);
  }
}

export class NodePropertiesRecordBuilder<
  TItemOut,
  TValue extends Type<Value, TItemOut>,
> extends RecordBuilder<
  Node,
  Value,
  TItemOut,
  TValue,
  NodePropertiesRecordType<TItemOut, TValue>
> {
  override build(): NodePropertiesRecordType<TItemOut, TValue> {
    return new NodePropertiesRecordType(this.params);
  }
}
