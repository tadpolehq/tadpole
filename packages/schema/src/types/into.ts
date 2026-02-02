import { Ok, type Result } from 'ts-results-es';
import { Type, type TypeParams, type TypeParseContext } from './base.js';
import { SchemaError } from '../error.js';

export interface IntoTypeParams<
  TIn,
  TOut,
  TWrapped extends Type<TIn, TOut>,
  TInto,
> extends TypeParams<TInto> {
  wrapped: TWrapped;
  into: (value: TOut) => TInto;
}

export class IntoType<
  TIn,
  TOut,
  TWrapped extends Type<TIn, TOut>,
  TInto,
> extends Type<TIn, TInto> {
  private wrapped_: TWrapped;
  private into_: (value: TOut) => TInto;

  constructor({
    wrapped,
    into,
    ...rest
  }: IntoTypeParams<TIn, TOut, TWrapped, TInto>) {
    super(rest);
    this.wrapped_ = wrapped;
    this.into_ = into;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  override parse_(
    value: TWrapped['input_'] | undefined,
    ctx: TypeParseContext,
  ): Result<TInto, SchemaError> {
    const wrapped = this.wrapped_.parse(value, ctx);
    if (!wrapped.isOk()) return wrapped;
    return new Ok(this.into_(wrapped.value));
  }
}
