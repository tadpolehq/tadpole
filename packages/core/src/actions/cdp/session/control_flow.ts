import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as root from '@/actions/root/index.js';
import * as cdp from '@/cdp/index.js';
import { Context, Registry } from './base.js';

export const DoParser = ts.into(
  root.control_flow.DoSchema(Registry),
  (v): IAction<Context> => new root.control_flow.Do(v),
);

export const FilterParser = ts.into(
  root.control_flow.FilterSchema(Registry),
  (v): IAction<Context> => new Filter(v),
);

export class Filter extends root.control_flow.Filter<cdp.Node, Context> {
  override async applyFilter(ctx: Context, predicate: string) {
    const activeNode = await ctx.session.activeNode();
    if (!activeNode.isCollection)
      throw new Error('filter can only be called on a node collection');

    const functionDeclaration = `function() { return this.filter(e => ${predicate}); }`;
    const result = await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
    );
    return new cdp.Node({
      remoteObjectId: result.objectId!,
      isCollection: true,
    });
  }

  override async enter(ctx: Context, node: cdp.Node) {
    ctx.session.pushNode(node);
  }

  override async exit(ctx: Context, node: cdp.Node) {
    ctx.session.popActiveNode();
    try {
      await ctx.session.send('Runtime.releaseObject', {
        objectId: node.remoteObjectId,
      });
    } catch (err) {
      ctx.$.log.warn(`Error releasing objectId=${node.remoteObjectId}: ${err}`);
    }
  }
}

export const ForEachParser = ts.into(
  root.control_flow.ForEachSchema(Registry),
  (v): IAction<Context> => new ForEach(v),
);

export class ForEach extends root.control_flow.ForEach<cdp.Node, Context> {
  protected override async *getChildren(ctx: Context) {
    const activeNode = await ctx.session.activeNode();
    if (!activeNode.isCollection)
      throw new Error('forEach can only be called on a node collection');

    const params = {
      objectId: activeNode.remoteObjectId,
      ownProperties: true,
    };
    const { result } = await ctx.session.send<{
      result: cdp.types.Runtime.PropertyDescriptor[];
    }>('Runtime.getProperties', params);
    for (const prop of result) {
      if (isNaN(Number(prop.name))) continue;
      if (!prop.value?.objectId) continue;

      yield new cdp.Node({
        remoteObjectId: prop.value!.objectId!,
      });
    }
  }

  protected override async enter(ctx: Context, node: cdp.Node) {
    ctx.session.pushNode(node);
  }

  protected override async exit(ctx: Context) {
    ctx.session.popActiveNode();
  }
}

export const LoopParser = ts.into(
  root.control_flow.LoopSchema(Registry),
  (v): IAction<Context> => new Loop(v),
);

export class Loop extends root.control_flow.Loop<Context> {
  protected override async executePredicate(ctx: Context, predicate: string) {
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
    return result.value;
  }
}

export const MaybeParser = ts.into(
  root.control_flow.MaybeSchema(Registry),
  (v): IAction<Context> => new root.control_flow.Maybe(v),
);

export const ParallelParser = root.control_flow.ParallelParser(Registry);
