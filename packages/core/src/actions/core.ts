import * as ts from '@tadpolehq/schema';
import type { IAction } from './base.js';
import type { RootContext } from '../context.js';

export function BaseParallelSchema<TCtx>(
  registry: ts.IRegistry<ts.Node, any, ts.Type<any, IAction<TCtx>>>,
) {
  return ts.node({
    execute: ts.slot(ts.children(ts.anyOf(registry))),
  });
}

export type ParallelParams<TCtx> = ts.output<
  ReturnType<typeof BaseParallelSchema<TCtx>>
>;

export function ParallelParser<TCtx>(
  registry: ts.IRegistry<ts.Node, any, ts.Type<any, IAction<TCtx>>>,
) {
  return ts.into(
    BaseParallelSchema(registry),
    (v): IAction<TCtx> => new Parallel(v),
  );
}

export class Parallel<TCtx> implements IAction<TCtx> {
  constructor(private params_: ParallelParams<TCtx>) {}

  async execute(ctx: TCtx) {
    await Promise.all(
      this.params_.execute.map((action) => action.execute(ctx)),
    );
  }
}

export const BaseSleepSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type SleepParams = ts.output<typeof BaseSleepSchema>;

export const SleepParser = <TCtx extends { $: RootContext }>() =>
  ts.into(BaseSleepSchema, (v): IAction<TCtx> => new Sleep(v));

export class Sleep<TCtx extends { $: RootContext }> implements IAction<TCtx> {
  constructor(private params_: SleepParams) {}

  async execute(ctx: TCtx) {
    const [time] = this.params_.args;
    ctx.$.log.debug(`Sleeping for ${time}ms`);
    await new Promise((resolve) =>
      setTimeout(resolve, time.resolve(ctx.$.expressionContext)),
    );
  }
}
