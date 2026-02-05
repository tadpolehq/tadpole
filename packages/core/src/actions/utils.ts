import * as ts from '@tadpolehq/schema';
import type { IAction } from './base.js';
import type { BrowserContext } from '../context.js';

export const LogLevel = ts.enum(['debug', 'info', 'warn', 'error']);

export const BaseLogSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: ts.properties({
    level: ts.default(LogLevel, 'info'),
  }),
});

export type LogParams = ts.output<typeof BaseLogSchema>;

export const LogParser = ts.into(
  BaseLogSchema,
  (v): IAction<BrowserContext> => new Log(v),
);

export class Log implements IAction<BrowserContext> {
  constructor(private params_: LogParams) {}

  async execute(ctx: BrowserContext): Promise<void> {
    const message = this.params_.args[0].resolve(ctx.$.expressionContext);
    ctx.$.log[this.params_.options.level](message);
  }
}

export const BaseSleepSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type SleepParams = ts.output<typeof BaseSleepSchema>;

export const SleepParser = ts.into(
  BaseSleepSchema,
  (v): IAction<BrowserContext> => new Sleep(v),
);

export class Sleep implements IAction<BrowserContext> {
  constructor(private params_: SleepParams) {}

  async execute(ctx: BrowserContext) {
    const [time] = this.params_.args;
    ctx.$.log.debug(`Sleeping for ${time}ms`);
    await new Promise((resolve) =>
      setTimeout(resolve, time.resolve(ctx.$.expressionContext)),
    );
  }
}
