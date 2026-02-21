import * as ts from '@tadpolehq/schema';
import { Registry, concat, type Context, type IPreset } from './base.js';

export const CommonOptionsSchema = ts.properties({
  passwordStore: ts.default(ts.string(), 'basic'),
});

export const CommonSchema = ts.node({
  options: CommonOptionsSchema,
});

export type CommonParams = ts.output<typeof CommonSchema>;

export const CommonParser = ts.into(
  CommonSchema,
  (v): IPreset => new Common(v),
);

export class Common implements IPreset {
  constructor(private params_: CommonParams) {}

  build() {
    const { options } = this.params_;
    return {
      flags: [
        '--no-first-run',
        '--no-default-browser-check',
        '--mute-audio',
        `--password-store=${options.passwordStore}`,
      ],
    };
  }
}

export const HeadlessMode = ts.enum(['new', 'old']);

export const HeadlessSchema = ts.node({
  args: ts.args([ts.default(HeadlessMode, 'new')]),
});

export type HeadlessParams = ts.output<typeof HeadlessSchema>;

export const HeadlessParser = ts.into(
  HeadlessSchema,
  (v): IPreset => new Headless(v),
);

export class Headless implements IPreset {
  constructor(private params_: HeadlessParams) {}

  build() {
    return {
      flags: [`--headless=${this.params_.args[0]}`],
    };
  }
}

export const EnvSchemaOptions = ts.properties({
  var: ts.default(ts.string(), 'TADPOLE_ENV'),
});

export const EnvSchema = ts.node({
  args: ts.args([ts.string()]),
  load: ts.children(ts.anyOf(Registry)),
  options: EnvSchemaOptions,
});

export type EnvParams = ts.output<typeof EnvSchema>;

export const EnvParser = ts.into(EnvSchema, (v): IPreset => new Env(v));

export class Env implements IPreset {
  constructor(private params_: EnvParams) {}

  build(ctx: Context) {
    const value = process.env[this.params_.options.var] ?? 'default';
    if (value !== this.params_.args[0]) return {};
    return concat(this.params_.load, ctx);
  }
}
