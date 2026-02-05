import axios from 'axios';
import * as ts from '@tadpolehq/schema';
import * as actions from './actions/index.js';
import { Browser } from './browser.js';
import { RootContext } from './context.js';
import { defaultExpressionParser } from './expr.js';
import type { ILogger } from './logger.js';
import type { Output } from './values.js';

export const BaseDefSchema = ts.children(
  ts.anyOf(actions.BrowserActionRegistry),
);

export type DefParams = ts.output<typeof BaseDefSchema>;

export type DefExecuteParams = {
  host?: string;
  port?: number;
  log: ILogger;
  expressionParser?: ts.ExpressionParser;
  expressionValues?: Record<string, ts.ExpressionValue>;
};

export type BrowserMetadata = {
  Browser: string;
  'Protocol-Version': string;
  'User-Agent': string;
  'V8-Version': string;
  'Webkit-Version': string;
  webSocketDebuggerUrl: string;
};

export const DefSchema = ts.into(BaseDefSchema, (v) => new Def(v)).build();

export class Def {
  constructor(private params_: DefParams) {}

  async execute({
    host = 'localhost',
    port = 9222,
    log,
    expressionParser,
    expressionValues,
  }: DefExecuteParams): Promise<Output> {
    const browserMetadata = (
      await axios.get<BrowserMetadata>(`http://${host}:${port}/json/version`)
    ).data;
    const browser = new Browser({
      userAgent: browserMetadata['User-Agent'],
      webSocketDebuggerUrl: browserMetadata.webSocketDebuggerUrl,
      log,
    });
    await browser.connect();

    const output = new Map();
    const ctx = {
      $: new RootContext({
        log,
        output,
        expressionContext: {
          parser: expressionParser ?? defaultExpressionParser,
          stack: new ts.VariableStack(expressionValues),
        },
      }),
      browser,
    };
    try {
      for (const action of this.params_) {
        await action.execute(ctx);
      }
    } catch (err) {
      log.error(err);
    } finally {
      await browser.close();
    }

    return output;
  }
}
