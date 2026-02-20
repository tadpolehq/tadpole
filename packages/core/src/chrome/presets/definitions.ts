import * as ts from '@tadpolehq/schema';
import { Registry, concat, type IPreset } from './base.js';

export const CommonPresetOptionsSchema = ts.properties({
  'passwordStore': ts.default(ts.string(), 'mock'), 
});

export const CommonPresetSchema = ts.node({
  options: CommonPresetOptionsSchema,
});

export type CommonPresetParams = ts.output<typeof CommonPresetSchema>;

export class CommonPreset implements IPreset {
  constructor(private params_: CommonPresetParams) {}

  load() {
    const { options } = this.params_;
    return {
      flags: [
        '--no-first-run',
        '--no-default-browser-check',
        `--password-store=${options.passwordStore}`,
      ]
    }
  }
}

export class HeadlessPreset implements IPreset {
  load() {
    return {}
  }
}

export class StealthPreset implements IPreset {
  load() {
    return {}
  }
}

export class LowResourcePreset implements IPreset {
  load() {
    return {}
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

export class Env implements IPreset {
  constructor(private params_: EnvParams) {}

  load() {
    const value = process.env[this.params_.options.var] ?? 'default';
    if (value !== this.params_.args[0]) return {};
    return concat(this.params_.load.map(p => p.load()));
  }
}
