import { Err, Ok, type Result } from 'ts-results-es';
import { SchemaError, type Issue } from '../error.js';
import type { Document, Node, TypeParseContext } from '../types/index.js';
import type { IMetaType } from './base.js';

export class LayoutMetaType implements IMetaType<Document> {
  constructor(private layout_: Map<string, IMetaType<Node>>) {}

  get layout(): Map<string, IMetaType<Node>> {
    return this.layout_;
  }

  extend(name: string, type: IMetaType<Node>): this {
    if (this.layout_.has(name))
      throw new Error(`${name} is already defined in the layout`);

    this.layout_.set(name, type);
    return this;
  }

  async parse(
    input: Document,
    ctx: TypeParseContext,
  ): Promise<Result<void, SchemaError>> {
    const issues: Record<number, Issue> = {};
    const children = input.reduce(
      (o, n) => {
        if (!o.has(n.name)) o.set(n.name, []);
        o.get(n.name)!.push(n);
        return o;
      },
      new Map() as Map<string, Node[]>,
    );
    let i = 0;
    for (const [name, type] of this.layout_.entries()) {
      const nodes = children.get(name);
      if (nodes === undefined) continue;

      for (const child of nodes) {
        const result = await type.parse(child, ctx);
        if (result.isErr()) {
          issues[i] = result.error.issue;
        }
        i += 1;
      }
    }

    if (Object.keys(issues).length > 0)
      return new Err(new SchemaError({ issues }));

    return Ok.EMPTY;
  }
}
