import * as ts from '@tadpolehq/schema';
import * as cdp_actions from '@/actions/cdp/index.js';
import type { Context, IPreset } from './base.js';

export const CdpSchema = ts.node({
  args: ts.args([ts.string()]),
  params: ts.propertiesRecord(
    ts.expression(
      ts.optional(ts.union([ts.string(), ts.boolean(), ts.number()])),
    ),
  ),
});

export type CdpParams = ts.output<typeof CdpSchema>;

export type CdpCallContext = 'browser' | 'session';

export abstract class Cdp<TCtx> implements IPreset {
  constructor(protected params_: CdpParams) {}

  protected abstract get callContext(): CdpCallContext;
  protected abstract buildSend(
    method: string,
    params: Record<string, any>,
  ): (ctx: TCtx) => Promise<void>;

  protected buildParams(ctx: Context): Record<string, any> {
    return Array.from(this.params_.params.entries()).reduce(
      (v, [key, val]) => {
        v[key] = val.resolve(ctx.expressionContext);
        return v;
      },
      {} as Record<string, any>,
    );
  }

  build(ctx: Context) {
    const method = this.params_.args[0];
    const params = this.buildParams(ctx);
    return { [this.callContext]: this.buildSend(method, params) };
  }
}

export const BrowserCdpParser = ts.into(
  CdpSchema,
  (v): IPreset => new BrowserCdp(v),
);

export class BrowserCdp extends Cdp<cdp_actions.browser.Context> {
  protected override callContext: CdpCallContext = 'browser';

  protected override buildSend(method: string, params: Record<string, any>) {
    return async (ctx: cdp_actions.browser.Context) => {
      await ctx.browser.send({ method, params });
    };
  }
}

export const SessionCdpParser = ts.into(
  CdpSchema,
  (v): IPreset => new SessionCdp(v),
);

export class SessionCdp extends Cdp<cdp_actions.session.Context> {
  protected override callContext: CdpCallContext = 'session';

  protected override buildSend(method: string, params: Record<string, any>) {
    return async (ctx: cdp_actions.session.Context) => {
      await ctx.session.send(method, params);
    };
  }
}

export const Registry: ts.IRegistry<
  ts.Node,
  IPreset,
  ts.Type<ts.Node, IPreset>
> = new ts.Registry();
