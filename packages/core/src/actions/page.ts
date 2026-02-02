import * as ts from '@tadpolehq/schema';
import { type IAction } from './base.js';
import type { SessionContext } from '../context.js';

export const TransitionTypeSchema = ts.enum([
  'link',
  'typed',
  'address_bar',
  'auto_bookmark',
  'auto_subframe',
  'manual_subframe',
  'generated',
  'auto_toplevel',
  'form_submit',
  'reload',
  'keyword',
  'keyword_generated',
  'other',
]);

export type TransitionType = ts.output<typeof TransitionTypeSchema>;

export const RefererPolicySchema = ts.enum([
  'noReferrer',
  'noReferrerWhenDowngrade',
  'origin',
  'originWhenCrossOrigin',
  'sameOrigin',
  'strictOrigin',
  'strictOriginWhenCrossOrigin',
  'unsafeUrl',
]);

export type RefererPolicy = ts.output<typeof RefererPolicySchema>;

export const WaitUntilSchema = ts.enum(['load', 'domcontentloaded']);

export type WaitUntil = ts.output<typeof WaitUntilSchema>;

async function waitUntil(
  ctx: SessionContext,
  waitUntil: WaitUntil,
  timeout: number,
) {
  switch (waitUntil) {
    case 'domcontentloaded': {
      ctx.$.log.debug(
        `Waiting for 'Page.domContentEventFired' to fire, will timeout after ${timeout}ms`,
      );
      const res = await ctx.session.waitFor<any>(
        'Page.domContentEventFired',
        timeout,
      );
      ctx.$.log.debug(`Event emitted with params ${JSON.stringify(res)}`);
      break;
    }
    case 'load': {
      ctx.$.log.debug(
        `Waiting for 'Page.loadEventFired' to fire, will timeout after ${timeout}ms`,
      );
      const res = await ctx.session.waitFor<any>(
        'Page.loadEventFired',
        timeout,
      );
      ctx.$.log.debug(`Event emitted with params ${JSON.stringify(res)}`);
      break;
    }
  }
}

export const BasePageGotoSchema = ts.node({
  args: ts.args([ts.string()]),
  options: ts.properties({
    referrer: ts.expression(ts.optional(ts.string())),
    transitionType: ts.expression(ts.optional(TransitionTypeSchema)),
    frameId: ts.expression(ts.optional(ts.string())),
    referrerPolicy: ts.expression(ts.optional(RefererPolicySchema)),
    waitUntil: ts.default(WaitUntilSchema, 'load'),
    timeout: ts.expression(ts.default(ts.number(), 5000)),
  }),
});

export type PageGotoParams = ts.output<typeof BasePageGotoSchema>;

export const PageGotoParser = ts.into(
  BasePageGotoSchema,
  (v): IAction<SessionContext> => new PageGoto(v),
);

export class PageGoto implements IAction<SessionContext> {
  constructor(private params_: PageGotoParams) {}

  async execute(ctx: SessionContext) {
    const [url] = this.params_.args;
    const pageNavigateParams = {
      url,
      referrer: this.params_.options.referrer?.resolve(ctx.$.expressionContext),
      referrerPolicy: this.params_.options.referrerPolicy?.resolve(
        ctx.$.expressionContext,
      ),
      frameId: this.params_.options.frameId?.resolve(ctx.$.expressionContext),
      transitionType: this.params_.options.transitionType?.resolve(
        ctx.$.expressionContext,
      ),
    };
    ctx.$.log.debug(
      `Calling 'Page.navigate' with params ${JSON.stringify(
        pageNavigateParams,
      )}`,
    );
    await ctx.session.send('Page.navigate', pageNavigateParams);
    await waitUntil(
      ctx,
      this.params_.options.waitUntil,
      this.params_.options.timeout?.resolve(ctx.$.expressionContext),
    );
  }
}

export const PageWaitUntilOptionsSchema = ts.properties({
  timeout: ts.expression(ts.default(ts.number(), 5000)),
});

export const BasePageWaitUntilSchema = ts.node({
  args: ts.args([ts.default(WaitUntilSchema, 'load')]),
  options: PageWaitUntilOptionsSchema,
});

export type PageWaitUntilParams = ts.output<typeof BasePageWaitUntilSchema>;

export const PageWaitUntilParser = ts.into(
  BasePageWaitUntilSchema,
  (v): IAction<SessionContext> => new PageWaitUntil(v),
);

export class PageWaitUntil implements IAction<SessionContext> {
  constructor(private params_: PageWaitUntilParams) {}

  async execute(ctx: SessionContext) {
    const [waitUntilOpt] = this.params_.args;
    await waitUntil(
      ctx,
      waitUntilOpt,
      this.params_.options.timeout.resolve(ctx.$.expressionContext),
    );
  }
}
