import * as ts from '@tadpolehq/schema';
import { v4 as uuidv4 } from 'uuid';
import {
  EvaluatorRegistry,
  SessionActionRegistry,
  type IAction,
} from './base.js';
import type { SessionContext } from '../context.js';
import { Node } from '../node.js';

export const BaseQuerySelectorSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type QuerySelectorParams = ts.output<typeof BaseQuerySelectorSchema>;

export const QuerySelectorParser = ts.into(
  BaseQuerySelectorSchema,
  (v): IAction<SessionContext> => new QuerySelector(v),
);

abstract class BaseQuerySelector implements IAction<SessionContext> {
  constructor(private params_: QuerySelectorParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    if (activeNode.isCollection)
      throw new Error('querySelectors cannot be called on a node collection.');

    const functionDeclaration = `function(selector) { return ${this.functionExpression}; }`;
    const objectGroup = uuidv4();
    const selector = this.params_.args[0].resolve(ctx.$.expressionContext);
    const params = {
      arguments: [
        {
          value: selector,
        },
      ],
      objectGroup,
    };

    const result = await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
      params,
    );

    if (!result.objectId) {
      ctx.$.log.warn(`No element found for selector: ${selector}`);
      return;
    }

    ctx.session.pushNode(
      new Node({
        remoteObjectId: result.objectId,
        isCollection: this.isCollection,
      }),
    );
    try {
      for (const action of this.params_.execute) {
        await action.execute(ctx);
      }
    } finally {
      ctx.session.popActiveNode();
      try {
        await ctx.session.send('Runtime.releaseObjectGroup', { objectGroup });
      } catch {
        ctx.$.log.warn(`Error releasing objectGroup=${objectGroup}`);
      }
    }
  }

  protected abstract get functionExpression(): string;
  protected abstract get isCollection(): boolean;
}

export class QuerySelector extends BaseQuerySelector {
  override get functionExpression() {
    return 'this.querySelector(selector)';
  }

  override get isCollection() {
    return false;
  }
}

export const QuerySelectorAllParser = ts.into(
  BaseQuerySelectorSchema,
  (v): IAction<SessionContext> => new QuerySelectorAll(v),
);

export class QuerySelectorAll extends BaseQuerySelector {
  override get functionExpression() {
    return 'Array.from(this.querySelectorAll(selector))';
  }

  override get isCollection() {
    return true;
  }
}

export const WaitForOptions = ts.properties({
  timeout: ts.expression(ts.default(ts.number(), 5000)),
});

export const BaseWaitForSchema = ts.node({
  options: WaitForOptions,
  predicate: ts.children(ts.anyOf(EvaluatorRegistry)),
});

export type WaitForParams = ts.output<typeof BaseWaitForSchema>;

export const WaitForParser = ts.into(
  BaseWaitForSchema,
  (v): IAction<SessionContext> => new WaitFor(v),
);

export class WaitFor implements IAction<SessionContext> {
  constructor(private params_: WaitForParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    if (activeNode.isCollection)
      throw new Error('waitFor cannot be called on a node collection.');

    const predicate = this.params_.predicate.reduce(
      (input, evaluator) => evaluator.toJS(input, ctx.$.expressionContext),
      'e',
    );
    const timeout = this.params_.options.timeout.resolve(
      ctx.$.expressionContext,
    );
    const functionDeclaration = `
    function() {
      const e = this;
      return new Promise((resolve, reject) => {
        if (${predicate}) return resolve();

        const timeout = setTimeout(() => {
          observer.disconnect();
          reject('Timed out after ${timeout}ms');
        }, ${timeout});
        const observer = new MutationObserver((mutations) => {
          if (${predicate}) {
            clearTimeout(timeout);
            observer.disconnect();
            resolve();
          }
        });

        observer.observe(e, {
          childList: true,
          subtree: true
        })
      });
    }
    `;

    await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
      { awaitPromise: true },
    );
    ctx.$.log.debug(`Predicate ${predicate} satisfied`);
  }
}
