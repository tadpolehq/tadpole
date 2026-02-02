import * as ts from '@tadpolehq/schema';
import { SessionActionRegistry, type IAction } from './base.js';
import type { BrowserContext } from '../context.js';
import { Session } from '../session.js';

export const BaseBrowserNewPageSchema = ts.node({
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type BrowserNewPageParams = ts.output<typeof BaseBrowserNewPageSchema>;

export const BrowserNewPageParser = ts.into(
  BaseBrowserNewPageSchema,
  (v): IAction<BrowserContext> => new BrowserNewPage(v),
);

export class BrowserNewPage implements IAction<BrowserContext> {
  constructor(private params_: BrowserNewPageParams) {}

  async execute(ctx: BrowserContext) {
    ctx.$.log.debug("Calling 'Target.createBrowserContext'");
    const { browserContextId } = await ctx.browser.send<{
      browserContextId: string;
    }>({
      method: 'Target.createBrowserContext',
    });
    ctx.$.log.debug(`Created new browser context with id=${browserContextId}`);

    const createTargetParams = { url: '', browserContextId };
    ctx.$.log.debug(
      `Calling 'Target.createTarget' with params ${JSON.stringify(
        createTargetParams,
      )}`,
    );
    const { targetId } = await ctx.browser.send<{ targetId: string }>({
      method: 'Target.createTarget',
      params: createTargetParams,
    });
    ctx.$.log.debug(`Created new target with id=${targetId}`);

    const attachToTargetParams = {
      targetId,
      flatten: true,
    };
    ctx.$.log.debug(
      `Calling 'Target.attachToTarget' with params ${JSON.stringify(
        attachToTargetParams,
      )}`,
    );
    const { sessionId } = await ctx.browser.send<{ sessionId: string }>({
      method: 'Target.attachToTarget',
      params: attachToTargetParams,
    });
    ctx.$.log.debug(`Created new session with id=${sessionId}`);

    const pageSession = new Session({
      id: sessionId,
      browser: ctx.browser,
    });

    ctx.$.log.debug("Calling 'Page.enable'");
    await pageSession.send('Page.enable');

    const pageCtx = {
      $: ctx.$,
      session: pageSession,
      get browser() {
        return this.session.browser;
      },
    };

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
