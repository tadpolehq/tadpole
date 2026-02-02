import { Err, Ok, type Result } from 'ts-results-es';
import {
  Type,
  type ExtractOutputFromTypes,
  type Node,
  type TypeParams,
  type TypeParseContext,
} from './base.js';
import { SchemaError, type Issue } from '../error.js';

export interface NodeTypeParams<
  TMap extends Record<string, Type<Node, any>>,
> extends TypeParams<ExtractOutputFromTypes<TMap>> {
  composition: TMap;
}

export class NodeType<
  TMap extends Record<string, Type<Node, any>>,
> extends Type<Node, ExtractOutputFromTypes<TMap>> {
  private composition_: TMap;

  constructor({ composition, ...rest }: NodeTypeParams<TMap>) {
    super(rest);
    this.composition_ = composition;
  }

  get composition(): TMap {
    return this.composition_;
  }

  protected override parse_(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Result<ExtractOutputFromTypes<TMap>, SchemaError> {
    const results: Record<string, any> = {};
    const issues: Record<string, Issue> = {};
    for (const [key, node] of Object.entries(this.composition_)) {
      const result = node.parse(value, ctx);
      if (result.isOk()) {
        results[key] = result.value;
      } else {
        issues[key] = result.error.issue;
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(
        new SchemaError({
          issues,
        }),
      );

    return new Ok(results as ExtractOutputFromTypes<TMap>);
  }
}
