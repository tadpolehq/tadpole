import type { Result } from 'ts-results-es';
import { Type, TypeParams, type Node, type TypeParseContext } from './base.js';
import { SchemaError } from '../error.js';

export interface SlotTypeParams<
  TOut,
  TWrapped extends Type<Node, TOut>,
> extends TypeParams<TOut> {
  wrapped: TWrapped;
  keyword: string;
}

export class SlotType<TOut, TWrapped extends Type<Node, TOut>> extends Type<
  Node,
  TOut
> {
  private wrapped_: TWrapped;
  private keyword_: string;

  constructor({ wrapped, keyword, ...rest }: SlotTypeParams<TOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
    this.keyword_ = keyword;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  get keyword(): string {
    return this.keyword_;
  }

  protected override parse_(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError> {
    if (value === undefined) return this.wrapped_.parse(value, ctx);

    const slot = ctx.slotStack.currentSlot;
    return this.wrapped_.parse(
      {
        ...value,
        children:
          slot !== undefined
            ? value.children.flatMap((c) =>
                c.name === this.keyword_ ? slot : c,
              )
            : value.children,
      },
      ctx,
    );
  }
}
