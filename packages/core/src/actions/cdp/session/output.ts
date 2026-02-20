import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as evaluators from '@/evaluators/index.js';
import type { Context } from './base.js';

export const ExtractSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  fields: ts.slot(
    ts.childrenRecord(ts.children(ts.anyOf(evaluators.Registry))),
  ),
});

export type ExtractParams = ts.output<typeof ExtractSchema>;

export const ExtractParser = ts.into(
  ExtractSchema,
  (v): IAction<Context> => new Extract(v),
);

export class Extract implements IAction<Context> {
  constructor(private params_: ExtractParams) {}

  async execute(ctx: Context) {
    const activeNode = await ctx.session.activeNode();
    const extractMap = Array.from(this.params_.fields.entries())
      .map(
        ([key, val]) =>
          `${key}: ${evaluators.reduce(val, { rootInput: 'e', expressionContext: ctx.$.expressionContext })}`,
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
