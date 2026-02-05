import * as ts from '@tadpolehq/schema';
import { SessionActionRegistry, type IAction } from './base.js';
import { Goto, GotoOptions } from './page.js';
import type { BrowserContext } from '../context.js';
import { Session } from '../session.js';

export const BaseNewPageSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: GotoOptions,
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type NewPageParams = ts.output<typeof BaseNewPageSchema>;

export const NewPageParser = ts.into(
  BaseNewPageSchema,
  (v): IAction<BrowserContext> => new NewPage(v),
);

export class NewPage implements IAction<BrowserContext> {
  private goto_: Goto;

  constructor(private params_: NewPageParams) {
    this.goto_ = new Goto({
      args: this.params_.args,
      options: this.params_.options,
    });
  }

  async execute(ctx: BrowserContext) {
    const { browserContextId } = await ctx.browser.send<{
      browserContextId: string;
    }>({
      method: 'Target.createBrowserContext',
    });
    const createTargetParams = { url: '', browserContextId };
    const { targetId } = await ctx.browser.send<{ targetId: string }>({
      method: 'Target.createTarget',
      params: createTargetParams,
    });
    const attachToTargetParams = {
      targetId,
      flatten: true,
    };
    const { sessionId } = await ctx.browser.send<{ sessionId: string }>({
      method: 'Target.attachToTarget',
      params: attachToTargetParams,
    });
    const pageSession = new Session({
      id: sessionId,
      browser: ctx.browser,
      logger: ctx.$.log.child({ sessionId }),
    });

    await pageSession.send('Page.enable');
    await pageSession.send('Page.setLifecycleEventsEnabled', { enabled: true });

    const pageCtx = {
      $: ctx.$,
      session: pageSession,
      get browser() {
        return this.session.browser;
      },
    };

    await this.goto_.execute(pageCtx);

    try {
      for (const action of this.params_.execute) {
        await action.execute(pageCtx);
      }
    } finally {
      const disposeBrowserContextParams = { browserContextId };
      ctx.$.log.debug(
        `Calling 'Target.disposeBrowserContext' with params=${JSON.stringify(disposeBrowserContextParams)}`,
      );
      try {
        await ctx.browser.send({
          method: 'Target.disposeBrowserContext',
          params: disposeBrowserContextParams,
        });
      } catch {
        ctx.$.log.warn(`Error disposing browserContextId=${browserContextId}`);
      }
    }
  }
}
