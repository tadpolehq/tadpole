import * as ts from '@tadpolehq/schema';
import * as actions from './actions/index.js';
import * as evaluators from './evaluators/index.js';
import { DefSchema } from './def.js';

export const ValueTypeSchema = ts.expression(
  ts.union([ts.string(), ts.number()]),
);
export const createActionSchema = <TOut>(
  registry: ts.IRegistry<ts.Node, TOut, ts.Type<ts.Node, TOut>>,
) =>
  ts.node({
    kwargs: ts.propertiesRecord(ValueTypeSchema),
    actions: ts.children(ts.anyOf(registry)),
  });
export type ActionParams<TOut> = ts.output<
  ReturnType<typeof createActionSchema<TOut>>
>;

export class ActionWrapper<
  TCtx extends actions.root.WithContext,
  TOut extends actions.IAction<TCtx>,
> implements actions.IAction<TCtx> {
  constructor(private params_: ActionParams<TOut>) {}

  async execute(ctx: TCtx) {
    ctx.$.expressionContext.stack.pushFrame();
    for (const [name, arg] of this.params_.kwargs.entries()) {
      ctx.$.expressionContext.stack.currentFrame.set(
        name,
        arg.resolve(ctx.$.expressionContext),
      );
    }
    try {
      for (const action of this.params_.actions) {
        await action.execute(ctx);
      }
    } finally {
      ctx.$.expressionContext.stack.popFrame();
    }
  }
}

export const BaseEvaluatorSchema = ts.node({});

export class EvaluatorWrapper implements evaluators.IEvaluator {
  constructor(private evaluators_: evaluators.IEvaluator[]) {}

  toJS(input: string, ctx: evaluators.Context): string {
    let result = input;
    for (const evaluator of this.evaluators_) {
      result = evaluator.toJS(result, ctx);
    }
    return result;
  }
}

const layout = new Map<string, ts.IMetaType<ts.Node>>([
  [
    'import',
    ts.meta.import(
      (document, ctx): Promise<ts.ProcessResult> => Root.process(document, ctx),
    ),
  ],
  [
    'module',
    ts.meta.module(
      ts.meta.layout(
        new Map<string, ts.IMetaType<ts.Node>>([
          [
            'evaluator',
            ts.meta.register(
              ts.into(
                ts.children(ts.anyOf(evaluators.Registry)),
                (v): evaluators.IEvaluator => new EvaluatorWrapper(v),
              ),
              evaluators.Registry,
            ),
          ],
          [
            'action',
            ts.meta.register(
              ts.into(
                createActionSchema(actions.cdp.session.Registry),
                (v): actions.IAction<actions.cdp.session.Context> =>
                  new ActionWrapper(v),
              ),
              actions.cdp.session.Registry,
            ),
          ],
          [
            'browser_action',
            ts.meta.register(
              ts.into(
                createActionSchema(actions.cdp.browser.Registry),
                (v): actions.IAction<actions.cdp.browser.Context> =>
                  new ActionWrapper(v),
              ),
              actions.cdp.browser.Registry,
            ),
          ],
        ]),
      ),
    ),
  ],
]);

export const Root = ts.root({
  meta: ts.meta.layout(layout),
  main: DefSchema,
});
