import * as ts from '@tadpolehq/schema';
import { type IAction } from './base.js';
import type { SessionContext } from '../context.js';
import type { Page } from '../types/index.js';

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

export const WaitUntilEventSchema = ts.enum([
  'load',
  'domcontentloaded',
  'networkIdle',
  'networkAlmostIdle',
]);

export type WaitUntilEvent = ts.output<typeof WaitUntilEventSchema>;

async function waitUntil(
  ctx: SessionContext,
  waitUntil: WaitUntilEvent,
  timeout: number,
) {
  switch (waitUntil) {
    case 'domcontentloaded': {
      await ctx.session.waitFor('Page.domContentEventFired', timeout);
      break;
    }
    case 'load': {
      await ctx.session.waitFor('Page.loadEventFired', timeout);
      break;
    }
    case 'networkAlmostIdle':
    case 'networkIdle': {
      await ctx.session.waitFor<Page.LifecycleEvent>(
        'Page.lifecycleEvent',
        timeout,
        (e) =>
          e.name === waitUntil &&
          e.frameId == ctx.session.mainFrameId &&
          e.loaderId === ctx.session.currentLoaderId,
      );
      break;
    }
  }
}

export const GotoOptions = ts.properties({
  referrer: ts.expression(ts.optional(ts.string())),
  transitionType: ts.expression(ts.optional(TransitionTypeSchema)),
  referrerPolicy: ts.expression(ts.optional(RefererPolicySchema)),
  waitUntil: ts.default(WaitUntilEventSchema, 'load'),
  timeout: ts.expression(ts.default(ts.number(), 5000)),
});

export const BaseGotoSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: GotoOptions,
});

export type GotoParams = ts.output<typeof BaseGotoSchema>;

export const GotoParser = ts.into(
  BaseGotoSchema,
  (v): IAction<SessionContext> => new Goto(v),
);

export class Goto implements IAction<SessionContext> {
  constructor(private params_: GotoParams) {}

  async execute(ctx: SessionContext) {
    const url = this.params_.args[0].resolve(ctx.$.expressionContext);
    const pageNavigateParams = {
      url,
      referrer: this.params_.options.referrer?.resolve(ctx.$.expressionContext),
      referrerPolicy: this.params_.options.referrerPolicy?.resolve(
        ctx.$.expressionContext,
      ),
      transitionType: this.params_.options.transitionType?.resolve(
        ctx.$.expressionContext,
      ),
    };
    const { frameId, loaderId } = await ctx.session.send<{
      frameId: string;
      loaderId?: string;
    }>('Page.navigate', pageNavigateParams);
    await waitUntil(
      ctx,
      this.params_.options.waitUntil,
      this.params_.options.timeout?.resolve(ctx.$.expressionContext),
    );

    if (!ctx.session.mainFrameId) ctx.session.mainFrameId = frameId;

    ctx.session.currentLoaderId = loaderId;
  }
}

export const WaitUntilOptionsSchema = ts.properties({
  timeout: ts.expression(ts.default(ts.number(), 5000)),
});

export const BaseWaitUntilSchema = ts.node({
  args: ts.args([ts.default(WaitUntilEventSchema, 'load')]),
  options: WaitUntilOptionsSchema,
});

export type WaitUntilParams = ts.output<typeof BaseWaitUntilSchema>;

export const WaitUntilParser = ts.into(
  BaseWaitUntilSchema,
  (v): IAction<SessionContext> => new WaitUntil(v),
);

export class WaitUntil implements IAction<SessionContext> {
  constructor(private params_: WaitUntilParams) {}

  async execute(ctx: SessionContext) {
    const [waitUntilOpt] = this.params_.args;
    await waitUntil(
      ctx,
      waitUntilOpt,
      this.params_.options.timeout.resolve(ctx.$.expressionContext),
    );
  }
}
