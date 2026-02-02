import { Builder } from './base.js';
import {
  SlotType,
  type Node,
  type SlotTypeParams,
  type Type,
} from '../types/index.js';

export class SlotBuilder<
  TOut,
  TWrapped extends Type<Node, TOut>,
> extends Builder<Node, TOut, SlotType<TOut, TWrapped>> {
  private wrapped_: TWrapped;
  private keyword_: string;

  constructor(wrapped: TWrapped) {
    super();
    this.wrapped_ = wrapped;
    this.keyword_ = 'slot';
  }

  override get params(): SlotTypeParams<TOut, TWrapped> {
    return {
      wrapped: this.wrapped_,
      keyword: this.keyword_,
      ...super.params,
    };
  }

  keyword(val: string): this {
    this.keyword_ = val;
    return this;
  }

  override build(): SlotType<TOut, TWrapped> {
    return new SlotType(this.params);
  }
}
