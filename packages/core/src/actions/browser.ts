import * as ts from '@tadpolehq/schema';
import { SessionActionRegistry, type IAction } from './base.js';
import type { BrowserContext } from '../context.js';
import { Session } from '../session.js';
import type { Page } from '../types/index.js';

export const BaseNewPageSchema = ts.node({
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type NewPageParams = ts.output<typeof BaseNewPageSchema>;

export const NewPageParser = ts.into(
  BaseNewPageSchema,
  (v): IAction<BrowserContext> => new NewPage(v),
);

export class NewPage implements IAction<BrowserContext> {
  constructor(private params_: NewPageParams) {}

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

    await pageSession.send('Network.enable');
    await pageSession.send('Page.enable');
    await pageSession.send('Page.setLifecycleEventsEnabled', { enabled: true });

    const cleanupFrameListener = pageSession.on<{ frame: Page.Frame }>(
      'Page.frameNavigated',
      ({ frame }) => {
        if (frame.id === pageSession.mainFrameId) {
          pageSession.currentLoaderId = frame.loaderId;
          pageSession.clearDocumentNode();
        }
      },
    );

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
      cleanupFrameListener();
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
