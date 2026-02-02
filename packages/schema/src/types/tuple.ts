import { Err, Ok, type Result } from 'ts-results-es';
import {
  Type,
  type Document,
  type ExtractOutputFromTypes,
  type Node,
  type TypeParams,
  type TypeParseContext,
  type Value,
} from './base.js';
import { SchemaError, type Issue } from '../error.js';

export interface TupleTypeParams<
  TMemberIn,
  TMembers extends Type<TMemberIn, any>[],
> extends TypeParams<ExtractOutputFromTypes<TMembers>> {
  members: [...TMembers];
}

export abstract class TupleType<
  TIn,
  TMemberIn,
  TMembers extends Type<TMemberIn, any>[],
> extends Type<TIn, ExtractOutputFromTypes<TMembers>> {
  private members_: TMembers;

  constructor({ members, ...rest }: TupleTypeParams<TMemberIn, TMembers>) {
    super(rest);
    this.members_ = members;
  }

  get members(): TMembers {
    return this.members_;
  }

  protected override parse_(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<ExtractOutputFromTypes<TMembers>, SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const issues: Record<number, Issue> = {};
    const items = this.getItems(value);
    const results = [];
    for (const [i, member] of this.members_.entries()) {
      const item = items[i];
      const result = member.parse(item, ctx);
      if (result.isOk()) {
        results.push(result.value);
      } else {
        issues[i] = result.error.issue;
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(new SchemaError({ issues }));

    return new Ok(results as ExtractOutputFromTypes<TMembers>);
  }

  protected abstract getItems(value: TIn): TMemberIn[];
}

export class DocumentTupleType<
  TMembers extends Type<Node, any>[],
> extends TupleType<Document, Node, TMembers> {
  protected override getItems(value: Document): Node[] {
    return value;
  }
}

export class NodeArgsTupleType<
  TMembers extends Type<Value, any>[],
> extends TupleType<Node, Value, TMembers> {
  protected override getItems(value: Node): Value[] {
    return value.values;
  }
}

export class NodeChildrenTupleType<
  TMembers extends Type<Node, any>[],
> extends TupleType<Node, Node, TMembers> {
  protected override getItems(value: Node): Node[] {
    return value.children;
  }
}
