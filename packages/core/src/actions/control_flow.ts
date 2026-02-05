import * as ts from '@tadpolehq/schema';
import {
  EvaluatorRegistry,
  SessionActionRegistry,
  type IAction,
} from './base.js';
import type { SessionContext } from '../context.js';
import { Node } from '../node.js';
import { Runtime } from '../types/index.js';

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

    const predicate = this.params_.if.reduce(
      (input, evaluator) => evaluator.toJS(input, ctx.$.expressionContext),
      'e',
    );
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
        ctx.$.log.warn(`Error releasing objectId=${result.objectId}`);
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

export const BaseLoopSchema = ts.childrenStruct({
  while: ts.children(ts.anyOf(EvaluatorRegistry)),
  do: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type LoopParams = ts.output<typeof BaseLoopSchema>;

export const LoopParser = ts.into(
  BaseLoopSchema,
  (v): IAction<SessionContext> => new Loop(v),
);

export class Loop implements IAction<SessionContext> {
  constructor(private params_: LoopParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    const predicate = this.params_.while.reduce(
      (input, evaluator) => evaluator.toJS(input, ctx.$.expressionContext),
      'e',
    );
    const functionBody = activeNode.isCollection
      ? `return this.all(e => ${predicate});`
      : `const e = this; return ${predicate});`;
    const functionDeclaration = `function() { ${functionBody} }`;
    const params = {
      returnByValue: true,
    };
    while (true) {
      const result = await ctx.session.callFunctionOn(
        functionDeclaration,
        activeNode.remoteObjectId,
        params,
      );
      if (!result.value) break;

      for (const action of this.params_.do) {
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

export function BaseParallelSchema<TCtx>(
  registry: ts.IRegistry<ts.Node, any, ts.Type<any, IAction<TCtx>>>,
) {
  return ts.node({
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type ParallelParams<TCtx> = ts.output<
  ReturnType<typeof BaseParallelSchema<TCtx>>
>;

export function ParallelParser<TCtx>(
  registry: ts.IRegistry<ts.Node, any, ts.Type<any, IAction<TCtx>>>,
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
