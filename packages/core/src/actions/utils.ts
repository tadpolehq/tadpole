import * as ts from '@tadpolehq/schema';
import { writeFile } from 'node:fs/promises';
import type { IAction } from './base.js';
import type { BrowserContext, SessionContext } from '../context.js';
import type { Page } from '../types/index.js';

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

export function BaseRandomSchema<TCtx>(
  registry: ts.IRegistry<ts.Node, IAction<TCtx>, ts.Type<any, IAction<TCtx>>>,
) {
  return ts.node({
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type RandomParams<TCtx> = ts.output<
  ReturnType<typeof BaseRandomSchema<TCtx>>
>;

export function RandomParser<TCtx>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.into(
    BaseRandomSchema(registry),
    (v): IAction<TCtx> => new Random(v),
  );
}

export class Random<TCtx> implements IAction<TCtx> {
  constructor(private params_: RandomParams<TCtx>) {}

  async execute(ctx: TCtx) {
    const action =
      this.params_.execute[
        Math.floor(Math.random() * this.params_.execute.length)
      ]!;
    await action.execute(ctx);
  }
}

export const BaseViewportSchema = ts.properties({
  x: ts.optional(ts.number()),
  y: ts.optional(ts.number()),
  width: ts.optional(ts.number()),
  height: ts.optional(ts.number()),
  scale: ts.optional(ts.number()),
});

export const createViewportSchema = (prefix?: string) =>
  ts.into(
    BaseViewportSchema.prefix(prefix),
    (v): (Page.Viewport & Record<string, ts.Value>) | undefined => {
      const hasValues = Object.values(v).some((val) => val !== undefined);
      if (hasValues) {
        return {
          x: v.x ?? 0,
          y: v.y ?? 0,
          width: v.width ?? 1280,
          height: v.height ?? 720,
          scale: v.scale ?? 1,
        };
      }
      return undefined;
    },
  );

export const ScreenshotFormat = ts.enum(['jpeg', 'png', 'webp']);

export const ScreenshotOptionsSchema = ts.properties({
  format: ts.default(ScreenshotFormat, 'png'),
  quality: ts.optional(ts.number().gte(0).lte(100)),
});

export const BaseScreenshotSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: ScreenshotOptionsSchema,
  clip: createViewportSchema('clip.'),
});

export type ScreenshotParams = ts.output<typeof BaseScreenshotSchema>;

export const ScreenshotParser = ts.into(
  BaseScreenshotSchema,
  (v): IAction<SessionContext> => new Screenshot(v),
);

export class Screenshot implements IAction<SessionContext> {
  constructor(private params_: ScreenshotParams) {}

  async execute(ctx: SessionContext): Promise<void> {
    let savePath = this.params_.args[0].resolve(ctx.$.expressionContext);
    if (!savePath.endsWith(this.params_.options.format)) {
      savePath = `${savePath}.${this.params_.options.format}`;
    }

    const params = {
      format: this.params_.options.format,
      quality: this.params_.options.quality,
      clip: this.params_.clip,
    };
    const { data } = await ctx.session.send<{ data: string }>(
      'Page.captureScreenshot',
      params,
    );
    await writeFile(savePath, Buffer.from(data, 'base64'));
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
