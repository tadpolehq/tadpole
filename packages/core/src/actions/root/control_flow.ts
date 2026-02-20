import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as evaluators from '@/evaluators/index.js';
import type { WithContext } from './base.js';

export const DoOptions = ts.properties({
  if: ts.expression(ts.optional(ts.boolean())),
  n: ts.expression(ts.optional(ts.number())),
});

export function DoSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.node({
    options: DoOptions,
    execute: ts.children(ts.anyOf(registry)),
  });
}

export type DoParams<TCtx> = ts.output<ReturnType<typeof DoSchema<TCtx>>>;

export class Do<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: DoParams<TCtx>) {}

  protected resolveIf(ctx: TCtx): boolean {
    return this.params_.options.if.resolve(ctx.$.expressionContext) ?? false;
  }

  protected resolveN(ctx: TCtx): number {
    return this.params_.options.n.resolve(ctx.$.expressionContext) || 1;
  }

  protected async executeChildrenActions(ctx: TCtx) {
    for (const action of this.params_.execute) {
      await action.execute(ctx);
    }
  }

  async execute(ctx: TCtx) {
    const condition = this.resolveIf(ctx);
    if (!condition) return;

    const n = this.resolveN(ctx);
    for (let i = 0; i < n; i++) {
      await this.executeChildrenActions(ctx);
    }
  }
}

export function FilterSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.childrenStruct({
    if: ts.children(ts.anyOf(evaluators.Registry)),
    do: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type FilterParams<TCtx> = ts.output<
  ReturnType<typeof FilterSchema<TCtx>>
>;

export abstract class Filter<
  TNodeCollection,
  TCtx extends WithContext,
> implements IAction<TCtx> {
  constructor(protected params_: FilterParams<TCtx>) {}

  protected abstract applyFilter(
    ctx: TCtx,
    predicate: string,
  ): Promise<TNodeCollection>;
  protected abstract enter(
    ctx: TCtx,
    nodeCollection: TNodeCollection,
  ): Promise<void>;
  protected abstract exit(
    ctx: TCtx,
    nodeCollection: TNodeCollection,
  ): Promise<void>;

  protected async executeDoActions(ctx: TCtx) {
    for (const action of this.params_.do) {
      await action.execute(ctx);
    }
  }

  protected createPredicate(ctx: TCtx) {
    return evaluators.reduce(this.params_.if, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
  }

  async execute(ctx: TCtx) {
    const predicate = this.createPredicate(ctx);
    const filteredNodeCollection = await this.applyFilter(ctx, predicate);
    try {
      await this.enter(ctx, filteredNodeCollection);
      await this.executeDoActions(ctx);
    } finally {
      await this.exit(ctx, filteredNodeCollection);
    }
  }
}

export function ForEachSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.node({
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type ForEachParams = ts.output<ReturnType<typeof ForEachSchema>>;

export abstract class ForEach<
  TNode,
  TCtx extends WithContext,
> implements IAction<TCtx> {
  constructor(protected params_: ForEachParams) {}

  protected abstract getChildren(ctx: TCtx): AsyncGenerator<TNode>;
  protected abstract enter(ctx: TCtx, node: TNode): Promise<void>;
  protected abstract exit(ctx: TCtx, node: TNode): Promise<void>;

  protected async executeChildrenActions(ctx: TCtx) {
    for (const action of this.params_.execute) {
      await action.execute(ctx);
    }
  }

  async execute(ctx: TCtx) {
    for await (const node of this.getChildren(ctx)) {
      try {
        await this.enter(ctx, node);
        await this.executeChildrenActions(ctx);
      } finally {
        await this.exit(ctx, node);
      }
    }
  }
}

export const LoopOptions = ts.properties({
  some: ts.default(ts.boolean(), false),
});

export function LoopSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.node({
    options: LoopOptions,
    body: ts.childrenStruct({
      do: ts.slot(ts.children(ts.anyOf(registry))),
      while: ts.children(ts.anyOf(evaluators.Registry)),
      next: ts.children(ts.anyOf(registry)),
    }),
  });
}

export type LoopParams<TCtx> = ts.output<ReturnType<typeof LoopSchema<TCtx>>>;

export abstract class Loop<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: LoopParams<TCtx>) {}

  protected abstract executePredicate(
    ctx: TCtx,
    predicate: string,
  ): Promise<Boolean>;

  protected async executeDoBlock(ctx: TCtx) {
    for (const action of this.params_.body.do) {
      await action.execute(ctx);
    }
  }

  protected async executeNextBlock(ctx: TCtx) {
    for (const action of this.params_.body.next) {
      await action.execute(ctx);
    }
  }

  protected createPredicate(ctx: TCtx) {
    return evaluators.reduce(this.params_.body.while, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
  }

  async execute(ctx: TCtx) {
    const predicate = this.createPredicate(ctx);
    while (true) {
      await this.executeDoBlock(ctx);
      const result = await this.executePredicate(ctx, predicate);
      if (!result) break;
      await this.executeNextBlock(ctx);
    }
  }
}

export function MaybeSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.slot(ts.children(ts.anyOf(registry)));
}

export type MaybeParams = ts.output<ReturnType<typeof MaybeSchema>>;

export class Maybe<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(private actions_: MaybeParams) {}

  protected async executeChildrenActions(ctx: TCtx) {
    for (const action of this.actions_) {
      await action.execute(ctx);
    }
  }

  async execute(ctx: TCtx) {
    try {
      await this.executeChildrenActions(ctx);
    } catch (err) {
      ctx.$.log.debug(`Continuing with exception: ${err}`);
    }
  }
}

export const BaseOnceSchema = ts.node({
  options: ts.properties({
    some: ts.default(ts.boolean(), false),
  }),
  body: ts.childrenStruct({
    if: ts.children(ts.anyOf(EvaluatorRegistry)),
    do: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
  }),
});

export type OnceParams = ts.output<typeof BaseOnceSchema>;

export const OnceParser = ts.into(
  BaseOnceSchema,
  (v): IAction<SessionContext> => new Once(v),
);

export class Once implements IAction<SessionContext> {
  constructor(private params_: OnceParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    const predicate = reduceEvaluators(this.params_.body.if, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
    const functionBody = activeNode.isCollection
      ? `return this.${this.params_.options.some ? 'some' : 'every'}(e => ${predicate});`
      : `const e = this; return !!(${predicate});`;
    const functionDeclaration = `function() { ${functionBody} }`;
    const params = {
      returnByValue: true,
    };
    const result = await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
      params,
    );
    if (result.value) {
      for (const action of this.params_.body.do) {
        await action.execute(ctx);
      }
    }
  }
}

export function ParallelSchema<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.node({
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type ParallelParams<TCtx> = ts.output<
  ReturnType<typeof ParallelSchema<TCtx>>
>;

export function ParallelParser<TCtx extends WithContext>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.into(
    ParallelSchema(registry),
    (v): IAction<TCtx> => new Parallel(v),
  );
}

export class Parallel<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: ParallelParams<TCtx>) {}

  mapActions(ctx: TCtx): Promise<void>[] {
    return this.params_.execute.map((action) => action.execute(ctx));
  }

  async execute(ctx: TCtx) {
    const actions = this.mapActions(ctx);
    ctx.$.log.debug(`Executing ${actions.length} in parallel`);
    await Promise.all(actions);
  }
}
