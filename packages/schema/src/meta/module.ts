import { Err, type Result } from 'ts-results-es';
import { SchemaError } from '../error.js';
import {
  NodeArgsTupleType,
  NodeType,
  StringType,
  type Node,
  type TypeParseContext,
} from '../types/index.js';
import type { IMetaType } from './base.js';
import { LayoutMetaType } from './layout.js';

export const ModuleMetaParser = new NodeType({
  composition: {
    args: new NodeArgsTupleType({
      members: [new StringType()],
    }),
  },
});

export class ModuleMetaType implements IMetaType<Node> {
  constructor(private layout_: LayoutMetaType) {}

  async parse(
    input: Node,
    ctx: TypeParseContext,
  ): Promise<Result<void, SchemaError>> {
    const parseResult = ModuleMetaParser.parse(input, ctx);
    if (parseResult.isErr()) return new Err(parseResult.error);

    const [name] = parseResult.value.args;
    ctx.namespace.push(name);
    try {
      return await this.layout_.parse(input.children, ctx);
    } finally {
      ctx.namespace.pop();
    }
  }
}
