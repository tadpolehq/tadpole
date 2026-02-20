import { Registry, type Context, type IEvaluator } from './base.js';
import * as access from './access.js';
import * as casts from './casts.js';
import * as dom from './dom.js';
import * as identifiers from './identifiers.js';
import * as ops from './ops.js';
import * as strings from './strings.js';
import * as utils from './utils.js';

Registry.register('$', dom.QuerySelectorParser)
  .register('and', ops.AndParser)
  .register('as_bool', casts.AsBoolParser)
  .register('as_float', casts.AsFloatParser)
  .register('as_int', casts.AsIntParser)
  .register('attr', access.AttrParser)
  .register('child', dom.ChildParser)
  .register('default', utils.DefaultParser)
  .register('deq', ops.DeqParser)
  .register('dne', ops.DneParser)
  .register('eq', ops.EqParser)
  .register('extract', strings.ExtractParser)
  .register('func', utils.FuncParser)
  .register('matches', strings.MatchesParser)
  .register('ne', ops.NeParser)
  .register('not', ops.NotParser)
  .register('or', ops.OrParser)
  .register('prop', access.PropertyParser)
  .register('replace', strings.ReplaceParser)
  .register('root', identifiers.RootParser)
  .register('text', access.InnerTextParser);

export { access, casts, ops, strings, Registry, Context, IEvaluator };

export function reduce(evaluators: IEvaluator[], ctx: Context, input?: string) {
  return evaluators.reduce((input, evaluator) => {
    return evaluator.toJS(input, ctx);
  }, input ?? ctx.rootInput);
}
