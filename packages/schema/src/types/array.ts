import { Err, Ok, type Result } from 'ts-results-es';
import {
  Type,
  type Document,
  type Node,
  type TypeParams,
  type TypeParseContext,
  type Value,
} from './base.js';
import { SchemaError, type Issue } from '../error.js';

export interface ArrayTypeParams<
  TItemIn,
  TItemOut,
  TWrapped extends Type<TItemIn, TItemOut>,
> extends TypeParams<TItemOut[]> {
  wrapped: TWrapped;
}

export abstract class ArrayType<
  TIn,
  TItemIn,
  TItemOut,
  TWrapped extends Type<TItemIn, TItemOut>,
> extends Type<TIn, TItemOut[]> {
  private wrapped_: TWrapped;

  constructor({
    wrapped,
    ...rest
  }: ArrayTypeParams<TItemIn, TItemOut, TWrapped>) {
    super(rest);
    this.wrapped_ = wrapped;
  }

  get wrapped(): TWrapped {
    return this.wrapped_;
  }

  protected override parse_(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<TItemOut[], SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const issues: Record<number, Issue> = {};
    const values = [];
    for (const [i, item] of this.getItems(value).entries()) {
      const result = this.wrapped_.parse(item, ctx);
      if (result.isOk()) {
        values.push(result.value);
      } else {
        issues[i] = result.error.issue;
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(
        new SchemaError({
          issues,
        }),
      );

    return new Ok(values);
  }

  protected abstract getItems(value: TIn): TItemIn[];
}

export class DocumentArrayType<
  TItemOut,
  TWrapped extends Type<Node, TItemOut>,
> extends ArrayType<Document, Node, TItemOut, TWrapped> {
  protected override getItems(value: Document): Node[] {
    return value;
  }
}

export class NodeArgsArrayType<
  TItemOut,
  TWrapped extends Type<Value, TItemOut>,
> extends ArrayType<Node, Value, TItemOut, TWrapped> {
  protected override getItems(value: Node): Value[] {
    return value.values;
  }
}

export class NodeChildrenArrayType<
  TItemOut,
  TWrapped extends Type<Node, TItemOut>,
> extends ArrayType<Node, Node, TItemOut, TWrapped> {
  protected override getItems(value: Node): Node[] {
    return value.children;
  }
}
