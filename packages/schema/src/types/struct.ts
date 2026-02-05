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

export interface StructTypeParams<
  TMemberIn,
  TMembers extends Record<string, Type<TMemberIn, any>>,
> extends TypeParams<ExtractOutputFromTypes<TMembers>> {
  members: TMembers;
  prefix?: string;
}

export abstract class StructType<
  TIn,
  TMemberIn,
  TMembers extends Record<string, Type<TMemberIn, any>>,
> extends Type<TIn, ExtractOutputFromTypes<TMembers>> {
  private members_: TMembers;
  private prefix_: string | undefined;

  constructor({
    members,
    prefix,
    ...rest
  }: StructTypeParams<TMemberIn, TMembers>) {
    super(rest);
    this.members_ = members;
    this.prefix_ = prefix;
  }

  get members(): TMembers {
    return this.members_;
  }

  get prefix(): string | undefined {
    return this.prefix_;
  }

  protected override parse_(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<ExtractOutputFromTypes<TMembers>, SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const issues: Record<string, Issue> = {};
    const obj: Record<string, any> = {};
    const items = this.getItems(value);
    for (const [name, member] of Object.entries(this.members_)) {
      const inputName = this.prefix_ ? `${this.prefix_}${name}` : name;
      const value = items[inputName];
      const result = member.parse(value, ctx);
      if (result.isOk()) {
        obj[name] = result.value;
      } else {
        issues[name] = result.error.issue;
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(
        new SchemaError({
          issues,
        }),
      );

    return new Ok(obj as ExtractOutputFromTypes<TMembers>);
  }

  protected abstract getItems(value: TIn): Record<string, TMemberIn>;
}

export class DocumentStructType<
  TMembers extends Record<string, Type<Node, any>>,
> extends StructType<Document, Node, TMembers> {
  protected override getItems(value: Document): Record<string, Node> {
    return value.reduce(
      (items, node) => {
        items[node.name] = node;
        return items;
      },
      {} as Record<string, Node>,
    );
  }
}

export class NodeChildrenStructType<
  TMembers extends Record<string, Type<Node, any>>,
> extends StructType<Node, Node, TMembers> {
  protected override getItems(value: Node): Record<string, Node> {
    return value.children.reduce(
      (items, node) => {
        items[node.name] = node;
        return items;
      },
      {} as Record<string, Node>,
    );
  }
}

export class NodePropertiesStructType<
  TMembers extends Record<string, Type<Value, any>>,
> extends StructType<Node, Value, TMembers> {
  protected override getItems(value: Node): Record<string, Value> {
    return Object.entries(value.properties).reduce(
      (items, [name, val]) => {
        items[name] = val;
        return items;
      },
      {} as Record<string, Value>,
    );
  }
}
