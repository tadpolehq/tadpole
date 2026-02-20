import * as ts from '@tadpolehq/schema';
import type { Context, IEvaluator } from './base.js';

export const ExtractSchema = ts.node({
  args: ts.args([ts.expression(ts.regex)]),
  options: ts.properties({
    index: ts.default(ts.number(), 1),
    caseSensitive: ts.default(ts.boolean(), true),
  }),
});

export type ExtractParams = ts.output<typeof ExtractSchema>;

export const ExtractParser = ts.into(
  ExtractSchema,
  (v): IEvaluator => new Extract(v),
);

export class Extract implements IEvaluator {
  constructor(private params_: ExtractParams) {}

  toJS(input: string, ctx: Context) {
    const regex = this.params_.args[0].resolve(ctx.expressionContext);
    const index = this.params_.options.index;
    const flags = this.params_.options.caseSensitive ? '' : 'i';
    return `new RegExp(${JSON.stringify(regex)}, ${JSON.stringify(flags)}).exec(${input})?.[${index}]`;
  }
}

export const MatchesSchema = ts.node({
  args: ts.args([ts.expression(ts.regex)]),
  options: ts.properties({
    caseSensitive: ts.default(ts.boolean(), true),
  }),
});

export type MatchesParams = ts.output<typeof MatchesSchema>;

export const MatchesParser = ts.into(
  MatchesSchema,
  (v): IEvaluator => new Matches(v),
);

export class Matches implements IEvaluator {
  constructor(private params_: MatchesParams) {}

  toJS(input: string, ctx: Context) {
    const regex = this.params_.args[0].resolve(ctx.expressionContext);
    const flags = this.params_.options.caseSensitive ? '' : 'i';
    return `new RegExp(${JSON.stringify(regex)}, ${JSON.stringify(flags)}).test(${input})`;
  }
}

export const ReplaceOptionsSchema = ts.properties({
  all: ts.default(ts.boolean(), false),
  regex: ts.default(ts.boolean(), false),
  caseSensitive: ts.default(ts.boolean(), true),
});

export const ReplaceSchema = ts.node({
  args: ts.args([ts.expression(ts.regex), ts.expression(ts.string())]),
  options: ReplaceOptionsSchema,
});

export type ReplaceParams = ts.output<typeof ReplaceSchema>;

export const ReplaceParser = ts.into(
  ReplaceSchema,
  (v): IEvaluator => new Replace(v),
);

export class Replace implements IEvaluator {
  constructor(private params_: ReplaceParams) {}

  toJS(input: string, ctx: Context) {
    let pattern = this.params_.args[0].resolve(ctx.expressionContext);
    const replacement = JSON.stringify(
      this.params_.args[1].resolve(ctx.expressionContext),
    );
    const method = this.params_.options.all ? 'replaceAll' : 'replace';

    if (this.params_.options.regex) {
      const flags = [];
      if (!this.params_.options.caseSensitive) flags.push('i');
      if (this.params_.options.all) flags.push('g');
      pattern = `new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(flags.join(''))})`;
    } else {
      pattern = JSON.stringify(pattern);
    }

    return `${input}?.toString().${method}(${pattern}, ${replacement})`;
  }
}
