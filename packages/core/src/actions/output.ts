import * as ts from '@tadpolehq/schema';
import { EvaluatorRegistry, type IAction } from './base.js';
import type { SessionContext } from '../context.js';

export const BaseExtractSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  fields: ts.slot(
    ts.childrenRecord(
      ts.node({ evaluators: ts.children(ts.anyOf(EvaluatorRegistry)) }),
    ),
  ),
});

export type ExtractParams = ts.output<typeof BaseExtractSchema>;

export const ExtractParser = ts.into(
  BaseExtractSchema,
  (v): IAction<SessionContext> => new Extract(v),
);

export class Extract implements IAction<SessionContext> {
  constructor(private params_: ExtractParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    const extractMap = Array.from(this.params_.fields.entries())
      .map(
        ([key, { evaluators }]) =>
          `${key}: ${evaluators.reduce(
            (input, evaluator) =>
              evaluator.toJS(input, ctx.$.expressionContext),
            'e',
          )}`,
      )
      .join(',');
    const functionBody = activeNode.isCollection
      ? `return this.map(e => ({${extractMap}}));`
      : `const e = this; return {${extractMap}};`;
    const functionDeclaration = `function() {${functionBody}}`;
    const result = await ctx.session.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
      { returnByValue: true },
    );
    const path = this.params_.args[0].resolve(ctx.$.expressionContext);
    ctx.$.log.debug(`Updating output at path ${path}`);
    ctx.$.updateOutputAtPath(result.value, path);
  }
}
