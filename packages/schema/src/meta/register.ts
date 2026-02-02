import { Err, Ok, type Result } from 'ts-results-es';
import type { Builder } from '../builders/index.js';
import { SchemaError } from '../error.js';
import type { IRegistry } from '../registry.js';
import {
  Node,
  NodeArgsTupleType,
  NodeType,
  StringType,
  Type,
  type TypeParseContext,
} from '../types/index.js';
import { IMetaType } from './base.js';

export class RegisteredType<
  TOut,
  TParser extends Type<Node, TOut>,
> extends Type<Node, TOut> {
  private parser_: TParser;
  private body_: Node[];

  constructor(parser: TParser, body: Node[]) {
    super();
    this.parser_ = parser;
    this.body_ = body;
  }

  protected override parse_(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError> {
    if (value === undefined) return new Err(new SchemaError({ message: '' }));

    ctx.slotStack.pushSlot(value.children);
    try {
      return this.parser_.parse(
        {
          ...value,
          children: this.body_,
        },
        ctx,
      );
    } finally {
      ctx.slotStack.popSlot();
    }
  }
}

export const registerMetaTypeSchema = new NodeType({
  composition: {
    args: new NodeArgsTupleType({ members: [new StringType()] }),
  },
});

export class RegisterMetaType<TOut> implements IMetaType<Node> {
  private parser_: Type<Node, TOut>;

  constructor(
    children: Builder<Node, TOut, Type<Node, TOut>>,
    private registry_: IRegistry<Node, TOut, Type<Node, TOut>>,
  ) {
    this.parser_ = children.build();
  }

  async parse(
    input: Node,
    ctx: TypeParseContext,
  ): Promise<Result<void, SchemaError>> {
    const result = registerMetaTypeSchema.parse(input, ctx);
    if (result.isErr()) return new Err(result.error);

    const [name] = result.value.args;
    const fullName = [...ctx.namespace, name].join('.');
    const type = new RegisteredType<TOut, Type<Node, TOut>>(
      this.parser_,
      input.children,
    );
    this.registry_.register(fullName, type);
    return Ok.EMPTY;
  }
}
