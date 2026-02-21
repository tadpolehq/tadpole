import * as ts from '@tadpolehq/schema';
import { writeFile } from 'node:fs/promises';
import type { IAction } from '@/actions/base.js';
import * as root from '@/actions/root/index.js';
import * as cdp from '@/cdp/index.js';
import { Registry, type Context } from './base.js';

export const RandomParser = root.utils.RandomParser(Registry);

export const ViewportSchema = ts.properties({
  x: ts.optional(ts.number()),
  y: ts.optional(ts.number()),
  width: ts.optional(ts.number()),
  height: ts.optional(ts.number()),
  scale: ts.optional(ts.number()),
});

export const ViewportParser = (prefix?: string) =>
  ts.into(
    ViewportSchema.prefix(prefix),
    (v): (cdp.types.Page.Viewport & Record<string, ts.Value>) | undefined => {
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

export const ScreenshotSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: ScreenshotOptionsSchema,
  clip: ViewportParser('clip.'),
});

export type ScreenshotParams = ts.output<typeof ScreenshotSchema>;

export const ScreenshotParser = ts.into(
  ScreenshotSchema,
  (v): IAction<Context> => new Screenshot(v),
);

export class Screenshot implements IAction<Context> {
  constructor(private params_: ScreenshotParams) {}

  async execute(ctx: Context): Promise<void> {
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
