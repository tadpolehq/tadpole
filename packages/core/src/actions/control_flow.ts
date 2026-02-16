import * as ts from '@tadpolehq/schema';
import {
  EvaluatorRegistry,
  SessionActionRegistry,
  type IAction,
} from './base.js';
import type { SessionContext } from '../context.js';
import { Node } from '../node.js';
import { Runtime } from '../types/index.js';
import { reduceEvaluators } from '../utils.js';

export const DoOptions = ts.properties({
  if: ts.expression(ts.optional(ts.boolean())),
  n: ts.expression(ts.optional(ts.number())),
});

export const BaseDoSchema = ts.node({
  options: DoOptions,
  execute: ts.children(ts.anyOf(SessionActionRegistry)),
});

export type DoParams = ts.output<typeof BaseDoSchema>;

export const DoParser = ts.into(
  BaseDoSchema,
  (v): IAction<SessionContext> => new Do(v),
);

export class Do implements IAction<SessionContext> {
  constructor(private params_: DoParams) {}

  async execute(ctx: SessionContext) {
    const condition = this.params_.options.if.resolve(ctx.$.expressionContext);
    if (condition !== undefined && condition === false) return;

    const n = this.params_.options.n.resolve(ctx.$.expressionContext) || 1;
    for (let i = 0; i < n; i++) {
      for (const action of this.params_.execute) {
        await action.execute(ctx);
      }
    }
  }
}

export const BaseFilterSchema = ts.childrenStruct({
  if: ts.children(ts.anyOf(EvaluatorRegistry)),
  do: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type FilterParams = ts.output<typeof BaseFilterSchema>;

export const FilterParser = ts.into(
  BaseFilterSchema,
  (v): IAction<SessionContext> => new Filter(v),
);

export class Filter implements IAction<SessionContext> {
  constructor(private params_: FilterParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    if (!activeNode.isCollection)
      throw new Error('filter can only be called on a node collection');

    const predicate = reduceEvaluators(this.params_.if, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
    const functionDeclaration = `function() { return this.filter(e => ${predicate}); }`;
    const result = await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
    );

    ctx.session.pushNode(
      new Node({
        remoteObjectId: result.objectId!,
        isCollection: true,
      }),
    );
    try {
      for (const action of this.params_.do) {
        await action.execute(ctx);
      }
    } finally {
      ctx.session.popActiveNode();
      try {
        await ctx.session.send('Runtime.releaseObject', {
          objectId: result.objectId,
        });
      } catch (err) {
        ctx.$.log.warn(`Error releasing objectId=${result.objectId}: ${err}`);
      }
    }
  }
}

export const BaseForEachSchema = ts.node({
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type ForEachParams = ts.output<typeof BaseForEachSchema>;

export const ForEachParser = ts.into(
  BaseForEachSchema,
  (v): IAction<SessionContext> => new ForEach(v),
);

export class ForEach implements IAction<SessionContext> {
  constructor(private params_: ForEachParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    if (!activeNode.isCollection)
      throw new Error('forEach can only be called on a node collection');

    const params = {
      objectId: activeNode.remoteObjectId,
      ownProperties: true,
    };
    const { result } = await ctx.session.send<{
      result: Runtime.PropertyDescriptor[];
    }>('Runtime.getProperties', params);
    for (const prop of result) {
      if (isNaN(Number(prop.name))) continue;

      if (!prop.value?.objectId) continue;

      ctx.session.pushNode(new Node({ remoteObjectId: prop.value.objectId }));
      try {
        for (const action of this.params_.execute) {
          await action.execute(ctx);
        }
      } finally {
        ctx.session.popActiveNode();
      }
    }
  }
}

export const BaseLoopSchema = ts.node({
  options: ts.properties({
    some: ts.default(ts.boolean(), false),
  }),
  body: ts.childrenStruct({
    do: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
    while: ts.children(ts.anyOf(EvaluatorRegistry)),
    next: ts.children(ts.anyOf(SessionActionRegistry)),
  }),
});

export type LoopParams = ts.output<typeof BaseLoopSchema>;

export const LoopParser = ts.into(
  BaseLoopSchema,
  (v): IAction<SessionContext> => new Loop(v),
);

export class Loop implements IAction<SessionContext> {
  constructor(private params_: LoopParams) {}

  async execute(ctx: SessionContext) {
    const predicate = reduceEvaluators(this.params_.body.while, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
    while (true) {
      for (const action of this.params_.body.do) {
        await action.execute(ctx);
      }

      const activeNode = await ctx.session.activeNode();
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
      if (!result.value) break;

      for (const action of this.params_.body.next) {
        await action.execute(ctx);
      }
    }
  }
}

export const BaseMaybeSchema = ts.slot(
  ts.children(ts.anyOf(SessionActionRegistry)),
);

export type MaybeParams = ts.output<typeof BaseMaybeSchema>;

export const MaybeParser = ts.into(
  BaseMaybeSchema,
  (v): IAction<SessionContext> => new Maybe(v),
);

export class Maybe implements IAction<SessionContext> {
  constructor(private actions_: MaybeParams) {}

  async execute(ctx: SessionContext) {
    try {
      for (const action of this.actions_) {
        await action.execute(ctx);
      }
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

export function BaseParallelSchema<TCtx>(
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
  ReturnType<typeof BaseParallelSchema<TCtx>>
>;

export function ParallelParser<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.into(
    BaseParallelSchema(registry),
    (v): IAction<TCtx> => new Parallel(v),
  );
}

export class Parallel<TCtx> implements IAction<TCtx> {
  constructor(private params_: ParallelParams<TCtx>) {}

  async execute(ctx: TCtx) {
    await Promise.all(
      this.params_.execute.map((action) => action.execute(ctx)),
    );
  }
}
