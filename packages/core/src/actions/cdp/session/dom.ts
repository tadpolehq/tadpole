import * as ts from '@tadpolehq/schema';
import { v4 as uuidv4 } from 'uuid';
import type { IAction } from '@/actions/base.js';
import * as cdp from '@/cdp/index.js';
import * as evaluators from '@/evaluators/index.js';
import { Registry, type Context } from './base.js';

export const SelectSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  execute: ts.slot(ts.children(ts.anyOf(Registry))),
});

export type SelectParams = ts.output<typeof SelectSchema>;

abstract class Select implements IAction<Context> {
  constructor(private params_: SelectParams) {}

  async execute(ctx: Context) {
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
      new cdp.Node({
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

export const SelectFirstParser = ts.into(
  SelectSchema,
  (v): IAction<Context> => new SelectFirst(v),
);

export class SelectFirst extends Select {
  override get functionExpression() {
    return 'this.querySelector(selector)';
  }

  override get isCollection() {
    return false;
  }
}

export const SelectAllParser = ts.into(
  SelectSchema,
  (v): IAction<Context> => new SelectAll(v),
);

export class SelectAll extends Select {
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

export const WaitForSchema = ts.node({
  options: WaitForOptions,
  predicate: ts.children(ts.anyOf(evaluators.Registry)),
});

export type WaitForParams = ts.output<typeof WaitForSchema>;

export const WaitForParser = ts.into(
  WaitForSchema,
  (v): IAction<Context> => new WaitFor(v),
);

export class WaitFor implements IAction<Context> {
  constructor(private params_: WaitForParams) {}

  async execute(ctx: Context) {
    const activeNode = await ctx.session.activeNode();
    if (activeNode.isCollection)
      throw new Error('waitFor cannot be called on a node collection.');

    const predicate = evaluators.reduce(this.params_.predicate, {
      rootInput: 'e',
      expressionContext: ctx.$.expressionContext,
    });
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
          attributes: true,
          characterData: true,
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
