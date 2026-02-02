import { Builder } from './base.js';
import {
  ArrayType,
  DocumentArrayType,
  NodeArgsArrayType,
  NodeChildrenArrayType,
  type ArrayTypeParams,
  type Document,
  type Node,
  type Type,
  type Value,
} from '../types/index.js';

export abstract class ArrayBuilder<
  TIn,
  TItemIn,
  TItemOut,
  TWrapped extends Type<TItemIn, TItemOut>,
  TType extends ArrayType<TIn, TItemIn, TItemOut, TWrapped>,
> extends Builder<TIn, TItemOut[], TType> {
  constructor(private wrapped_: TWrapped) {
    super();
  }

  override get params(): ArrayTypeParams<TItemIn, TItemOut, TWrapped> {
    return {
      wrapped: this.wrapped_,
      ...super.params,
    };
  }

  override clone(): this {
    const clone = super.clone();
    clone.wrapped_ = this.wrapped_;
    return clone;
  }

  every(
    predicate: (value: TItemOut, index: number, array: TItemOut[]) => boolean,
  ) {
    return this.test((value) => value.every(predicate));
  }

  some(
    predicate: (value: TItemOut, index: number, array: TItemOut[]) => boolean,
  ) {
    return this.test((value) => value.some(predicate));
  }

  length(length: number) {
    return this.test((value) => value.length === length);
  }

  max(max: number) {
    return this.test((value) => value.length <= max);
  }

  min(min: number) {
    return this.test((value) => value.length >= min);
  }
}

export class DocumentArrayBuilder<
  TItemOut,
  TWrapped extends Type<Node, TItemOut>,
> extends ArrayBuilder<
  Document,
  Node,
  TItemOut,
  TWrapped,
  DocumentArrayType<TItemOut, TWrapped>
> {
  override build(): DocumentArrayType<TItemOut, TWrapped> {
    return new DocumentArrayType(this.params);
  }
}

export class NodeArgsArrayBuilder<
  TItemOut,
  TWrapped extends Type<Value, TItemOut>,
> extends ArrayBuilder<
  Node,
  Value,
  TItemOut,
  TWrapped,
  NodeArgsArrayType<TItemOut, TWrapped>
> {
  override build(): NodeArgsArrayType<TItemOut, TWrapped> {
    return new NodeArgsArrayType(this.params);
  }
}

export class NodeChildrenArrayBuilder<
  TItemOut,
  TWrapped extends Type<Node, TItemOut>,
> extends ArrayBuilder<
  Node,
  Node,
  TItemOut,
  TWrapped,
  NodeChildrenArrayType<TItemOut, TWrapped>
> {
  override build(): NodeChildrenArrayType<TItemOut, TWrapped> {
    return new NodeChildrenArrayType(this.params);
  }
}
