import { Err, Ok, type Result } from 'ts-results-es';
import {
  Type,
  type TypeParams,
  type TypeParseContext,
  type Value,
} from './base.js';
import { SchemaError } from '../error.js';
import type { ExpressionContext } from '../expressions.js';

export interface IExpression<TOut> {
  resolve(ctx: ExpressionContext): TOut;
}

export interface IExpressionValueType<TOut> {
  cast(value: any): TOut;
}

export class ResolvedExpression<TOut> implements IExpression<TOut> {
  constructor(private result_: TOut) {}

  resolve(): TOut {
    return this.result_;
  }
}

export abstract class ExpressionValueType<TOut>
  extends Type<Value, TOut>
  implements IExpressionValueType<TOut>
{
  protected override parse_(
    value: Value | undefined,
  ): Result<TOut, SchemaError> {
    try {
      return new Ok(this.cast_(value));
    } catch (err) {
      return new Err(new SchemaError({ message: (err as Error).message }));
    }
  }

  protected abstract cast_(value: any): TOut;

  cast(value: any): TOut {
    const casted = this.cast_(value);
    const validationResult = this.validate_(casted);
    if (validationResult.isErr())
      throw new Error(`Validation Error: ${validationResult.error}`);
    return casted;
  }
}

export class Expression<
  TOut,
  TWrapped extends IExpressionValueType<TOut>,
> implements IExpression<TOut> {
  constructor(
    private expr_: string,
    private type_: TWrapped,
  ) {}

  resolve(ctx: ExpressionContext): TOut {
    const expr = ctx.parser.parse(this.expr_);
    const value = expr.evaluate(ctx.stack.flatten());
    return this.type_.cast(value);
  }
}

export interface ExpressionTypeParams<
  TOut,
  TWrapped extends Type<Value, TOut>,
> extends TypeParams<IExpression<TOut>> {
  wrapped: TWrapped;
}

export class ExpressionType<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
> extends Type<Value, IExpression<TOut>> {
  private wrapped_: TWrapped;

  constructor({ wrapped, ...rest }: ExpressionTypeParams<TOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  protected override parse_(
    value: Value | undefined,
    ctx: TypeParseContext,
  ): Result<IExpression<TOut>, SchemaError> {
    if (typeof value === 'string') {
      const match = value.match(/^=(.*)$/);
      if (match !== null) {
        return new Ok(new Expression(match[1]!, this.wrapped_));
      }
    }

    const result = this.wrapped_.parse(value, ctx);
    if (result.isOk()) {
      return new Ok(new ResolvedExpression(result.value));
    }

    return new Err(result.error);
  }
}
