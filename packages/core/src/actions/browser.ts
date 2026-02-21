import axios from 'axios';
import path from 'node:path';
import * as ts from '@tadpolehq/schema';
import * as cdp from '@/cdp/index.js';
import * as chrome from '@/chrome/index.js';
import type { IAction } from './base.js';
import * as cdp_actions from './cdp/index.js';
import * as root from './root/index.js';

export const BrowserOptionsSchema = ts.properties({
  launch: ts.default(ts.boolean(), true),
  remoteDebuggingPort: ts.expression(ts.default(ts.number(), 9222)),
  remoteDebuggingHost: ts.expression(ts.default(ts.string(), 'localhost')),
  pathToExec: ts.optional(ts.string()),
  userDataDir: ts.default(
    ts.string(),
    path.join(process.cwd(), '.tadpole', 'profile'),
  ),
});

export const BrowserSchema = ts.node({
  options: BrowserOptionsSchema,
  body: ts.childrenStruct({
    options: ts.children(ts.anyOf(chrome.presets.Registry)),
    run: ts.children(ts.anyOf(cdp_actions.browser.Registry)),
  }),
});

export type BrowserParams = ts.output<typeof BrowserSchema>;

export const BrowserParser = ts.into(
  BrowserSchema,
  (v): IAction<root.WithContext> => new Browser(v),
);

export class Browser implements IAction<root.WithContext> {
  constructor(private params_: BrowserParams) {}

  async execute(ctx: root.WithContext) {
    let process = null;
    const set = chrome.presets.concat(this.params_.body.options);
    const remoteDebuggingPort =
      this.params_.options.remoteDebuggingPort.resolve(ctx.$.expressionContext);
    const remoteDebuggingHost =
      this.params_.options.remoteDebuggingHost.resolve(ctx.$.expressionContext);
    if (this.params_.options.launch) {
      let pathToExec: string | undefined = this.params_.options.pathToExec;
      if (!pathToExec) pathToExec = await chrome.Process.findPath();

      if (!pathToExec) throw new Error(`Could not find chrome executable`);

      process = new chrome.Process({
        pathToExec,
        remoteDebuggingPort,
        userDataDir: this.params_.options.userDataDir,
        flags: set.flags,
        env: set.env,
      });
      await process.launch();
    }

    try {
      const { webSocketDebuggerUrl } = (
        await axios.get<{ webSocketDebuggerUrl: string }>(
          `http://${remoteDebuggingHost}:${remoteDebuggingPort}/json/version`,
        )
      ).data;
      const browser = new cdp.Browser({ webSocketDebuggerUrl, log: ctx.$.log });
      await browser.connect();

      for (const setup of set.browser) {
        await setup(browser);
      }

      const browserContext: cdp_actions.browser.Context = {
        $: ctx.$,
        browser,
      };
      for (const action of this.params_.body.run) {
        await action.execute(browserContext);
      }
    } finally {
      await process?.stop();
    }
  }
}
