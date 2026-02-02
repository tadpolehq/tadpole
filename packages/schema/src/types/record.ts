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

export interface RecordTypeParams<
  TItemIn,
  TItemOut,
  TValue extends Type<TItemIn, TItemOut>,
> extends TypeParams<Map<string, TItemOut>> {
  value: TValue;
  prefix?: string;
}

export abstract class RecordType<
  TIn,
  TItemIn,
  TItemOut,
  TValue extends Type<TItemIn, TItemOut>,
> extends Type<TIn, Map<string, TItemOut>> {
  private value_: TValue;
  private prefix_: string | undefined;

  constructor({
    value,
    prefix,
    ...rest
  }: RecordTypeParams<TItemIn, TItemOut, TValue>) {
    super(rest);
    this.value_ = value;
    this.prefix_ = prefix;
  }

  get value(): TValue {
    return this.value_;
  }

  get prefix(): string | undefined {
    return this.prefix_;
  }

  protected override parse_(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<Map<string, TItemOut>, SchemaError> {
    if (value === undefined)
      return new Err(new SchemaError({ message: 'Value cannot be undefined' }));

    const issues: Record<string, Issue> = {};
    const record = new Map();
    let items = this.getItems(value);
    if (this.prefix_ !== undefined)
      items = items
        .filter(([name]) => name.startsWith(this.prefix_!))
        .map(([name, value]) => [name.slice(this.prefix_?.length), value]);

    for (const [name, item] of items) {
      const result = this.value_.parse(item, ctx);
      if (!result.isOk()) {
        issues[name] = result.error.issue;
      } else {
        record.set(name, result.value);
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(
        new SchemaError({
          issues,
        }),
      );

    return new Ok(record);
  }

  protected abstract getItems(value: TIn): [string, TItemIn][];
}

export class DocumentRecordType<
  TItemOut,
  TValue extends Type<Node, TItemOut>,
> extends RecordType<Document, Node, TItemOut, TValue> {
  protected override getItems(value: Document): [string, Node][] {
    return value.map((n) => [n.name, n]);
  }
}

export class NodeChildrenRecordType<
  TItemOut,
  TValue extends Type<Node, TItemOut>,
> extends RecordType<Node, Node, TItemOut, TValue> {
  protected override getItems(value: Node): [string, Node][] {
    return value.children.map((n) => [n.name, n]);
  }
}

export class NodePropertiesRecordType<
  TItemOut,
  TValue extends Type<Value, any>,
> extends RecordType<Node, Value, TItemOut, TValue> {
  protected override getItems(value: Node): [string, Value][] {
    return Object.entries(value.properties).map(([name, prop]) => [name, prop]);
  }
}
