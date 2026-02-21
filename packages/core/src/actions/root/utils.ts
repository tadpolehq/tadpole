import * as ts from '@tadpolehq/schema';
import { Random as _Random } from 'random';
import type { IAction } from '@/actions/base.js';
import type { WithContext } from './base.js';

export const LogLevel = ts.enum(['debug', 'info', 'warn', 'error']);

export const LogSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: ts.properties({
    level: ts.default(LogLevel, 'info'),
  }),
});

export type LogParams = ts.output<typeof LogSchema>;

export const LogParser = ts.into(
  LogSchema,
  (v): IAction<WithContext> => new Log(v),
);

export class Log<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: LogParams) {}

  protected resolveMessage(ctx: TCtx): string {
    return this.params_.args[0].resolve(ctx.$.expressionContext);
  }

  protected logMessage(ctx: TCtx, message: string) {
    ctx.$.log[this.params_.options.level](message);
  }

  async execute(ctx: TCtx): Promise<void> {
    const message = this.resolveMessage(ctx);
    this.logMessage(ctx, message);
  }
}

export const RandomOptions = ts.properties({
  n: ts.expression(ts.default(ts.number(), 1)),
  seed: ts.expression(ts.optional(ts.string())),
  weights: ts.into(
    ts.optional(ts.string().test((v) => /(\s*[0-9]+\s*,?)+(?<!,)/.test(v))),
    (v) => v?.split(',').map((v) => Number(v.trim())),
  ),
});

export function RandomSchema<TCtx>(
  registry: ts.IRegistry<ts.Node, IAction<TCtx>, ts.Type<any, IAction<TCtx>>>,
) {
  return ts.node({
    options: RandomOptions,
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type RandomParams<TCtx> = ts.output<
  ReturnType<typeof RandomSchema<TCtx>>
>;

export function RandomParser<TCtx extends WithContext>(
  registry: ts.IRegistry<
    ts.Node,
    IAction<TCtx>,
    ts.Type<ts.Node, IAction<TCtx>>
  >,
) {
  return ts.into(RandomSchema(registry), (v): IAction<TCtx> => new Random(v));
}

export class Random<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: RandomParams<TCtx>) {}

  protected resolveN(ctx: TCtx) {
    return this.params_.options.n.resolve(ctx.$.expressionContext);
  }

  protected resolveSeed(ctx: TCtx) {
    return this.params_.options.seed.resolve(ctx.$.expressionContext);
  }

  protected calculateWeights(): number[] | null {
    if (!this.params_.options.weights) return null;
    const weights = [this.params_.options.weights[0] || 1];
    for (let i = 1; i < this.params_.execute.length; i++) {
      weights[i] = (this.params_.options.weights[i] || 1) + weights[i - 1]!;
    }

    return weights;
  }

  protected getWeightedIndex(generator: _Random, weights: number[]): number {
    const random = generator.int(0, weights.at(-1)!);
    return weights.findIndex((w) => w > random);
  }

  protected getIndex(generator: _Random) {
    return generator.int(0, this.params_.execute.length - 1);
  }

  protected async executeChildAction(ctx: TCtx, index: number) {
    await this.params_.execute[index]!.execute(ctx);
  }

  async execute(ctx: TCtx) {
    const n = this.resolveN(ctx);
    const seed = this.resolveSeed(ctx);
    const generator = new _Random(seed);
    const weights = this.calculateWeights();

    for (let i = 0; i < n; i++) {
      const index = weights
        ? this.getWeightedIndex(generator, weights)
        : this.getIndex(generator);

      await this.executeChildAction(ctx, index);
    }
  }
}

export const SleepSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type SleepParams = ts.output<typeof SleepSchema>;

export const SleepParser = ts.into(
  SleepSchema,
  (v): IAction<WithContext> => new Sleep(v),
);

export class Sleep<TCtx extends WithContext> implements IAction<TCtx> {
  constructor(protected params_: SleepParams) {}

  protected resolveTime(ctx: TCtx) {
    return this.params_.args[0].resolve(ctx.$.expressionContext);
  }

  protected async performDelay(_ctx: TCtx, time: number) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  async execute(ctx: TCtx) {
    const time = this.resolveTime(ctx);
    ctx.$.log.debug(`Sleeping for ${time}ms`);
    await this.performDelay(ctx, time);
  }
}
