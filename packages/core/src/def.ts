import * as ts from '@tadpolehq/schema';
import * as actions from './actions/index.js';
import { defaultExpressionParser } from './expr.js';
import type { ILogger } from './logger.js';
import type { Output } from './values.js';

export const DefSchema = ts.children(ts.anyOf(actions.root.Registry));

export type DefParams = ts.output<typeof DefSchema>;

export type DefExecuteParams = {
  log: ILogger;
  expressionParser?: ts.ExpressionParser;
  expressionValues?: Record<string, ts.ExpressionValue>;
};

export const DefParser = ts.into(DefSchema, (v) => new Def(v)).build();

export class Def {
  constructor(private params_: DefParams) {}

  async execute({
    log,
    expressionParser,
    expressionValues,
  }: DefExecuteParams): Promise<Output> {
    const output = new Map();
    const ctx = {
      $: new actions.root.Context({
        log,
        output,
        expressionContext: {
          parser: expressionParser ?? defaultExpressionParser,
          stack: new ts.VariableStack(expressionValues),
        },
      }),
    };
    try {
      for (const action of this.params_) {
        await action.execute(ctx);
      }
    } catch (err) {
      log.error(err);
    }

    return output;
  }
}
