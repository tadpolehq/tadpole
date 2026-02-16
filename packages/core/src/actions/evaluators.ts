import * as ts from '@tadpolehq/schema';
import { EvaluatorRegistry, type IEvaluator } from './base.js';
import type { EvaluatorContext } from '../context.js';
import { reduceEvaluators } from '../utils.js';

export const BaseBinaryOpSchema = ts.node({
  rhs: ts.children(ts.anyOf(EvaluatorRegistry)),
});

export type BaseBinaryOpParams = ts.output<typeof BaseBinaryOpSchema>;

export abstract class BaseBinaryOp implements IEvaluator {
  constructor(private params_: BaseBinaryOpParams) {}

  protected abstract get op(): string;

  toJS(input: string, ctx: EvaluatorContext) {
    const rhs = reduceEvaluators(this.params_.rhs, ctx, input);
    return `(${input}) ${this.op} (${rhs})`;
  }
}

export const EqOptions = ts.properties({
  strict: ts.default(ts.boolean(), true),
});

export type EqOptions = ts.output<typeof EqOptions>;

export const BaseDeqSchema = BaseBinaryOpSchema.extend(
  ts.buildrecord({
    options: EqOptions,
  }),
);

export type DeqParams = ts.output<typeof BaseDeqSchema>;

export abstract class BaseDeq extends BaseBinaryOp {
  private options_: EqOptions;

  constructor({ options, ...rest }: DeqParams) {
    super(rest);
    this.options_ = options;
  }

  protected abstract get nonStrict(): string;
  protected abstract get strict(): string;

  protected override get op() {
    return this.options_.strict ? this.strict : this.nonStrict;
  }
}

export const BaseEqSchema = ts.node({
  args: ts.args([ts.expression(ts.union([ts.string(), ts.number()]))]),
  options: EqOptions,
});

export type BaseEqParams = ts.output<typeof BaseEqSchema>;

export abstract class BaseEq implements IEvaluator {
  constructor(private params_: BaseEqParams) {}

  protected abstract get nonStrict(): string;
  protected abstract get strict(): string;

  toJS(input: string, ctx: EvaluatorContext) {
    const value = this.params_.args[0].resolve(ctx.expressionContext);
    const op = this.params_.options.strict ? this.strict : this.nonStrict;
    return `(${input} ${op} ${JSON.stringify(value)})`;
  }
}

export const AndParser = ts.into(
  BaseBinaryOpSchema,
  (v): IEvaluator => new And(v),
);

export class And extends BaseBinaryOp {
  protected override op: string = '&&';
}

export const AsBoolOptionsSchema = ts.properties({
  falsyValues: ts.expression(ts.default(ts.string(), 'false,0,no')),
});

export const BaseAsBoolSchema = ts.node({
  options: AsBoolOptionsSchema,
});

export type AsBoolParams = ts.output<typeof BaseAsBoolSchema>;

export const AsBoolParser = ts.into(
  BaseAsBoolSchema,
  (v): IEvaluator => new AsBool(v),
);

export class AsBool implements IEvaluator {
  constructor(private params_: AsBoolParams) {}

  toJS(input: string, ctx: EvaluatorContext): string {
    const falsyValues = JSON.stringify(
      this.params_.options.falsyValues
        .resolve(ctx.expressionContext)
        .split(',')
        .map((v) => v.trim().toLowerCase()),
    );
    return `(() => {
      const value = ${input};
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string")
        return !${falsyValues}.includes(value.trim().toLowerCase());

      return true;
    })()`;
  }
}

export const BaseAsFloatSchema = ts.node({});

export const AsFloatParser = ts.into(
  BaseAsFloatSchema,
  (): IEvaluator => new AsFloat(),
);

export class AsFloat implements IEvaluator {
  toJS(input: string) {
    return `parseFloat(${input}?.toString().replace(/[^0-9.-]/g, "") ?? NaN)`;
  }
}

export const BaseAsIntSchema = ts.node({
  options: ts.properties({
    radix: ts.default(ts.number(), 10),
  }),
});

export type AsIntParams = ts.output<typeof BaseAsIntSchema>;

export const AsIntParser = ts.into(
  BaseAsIntSchema,
  (v): IEvaluator => new AsInt(v),
);

export class AsInt implements IEvaluator {
  constructor(private params_: AsIntParams) {}

  toJS(input: string) {
    const radix = this.params_.options.radix;
    return `parseInt(${input}?.toString().replace(/[^0-9-]/g, "") ?? NaN, ${radix})`;
  }
}

export const BaseAttrSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type AttrParams = ts.output<typeof BaseAttrSchema>;

export const AttrParser = ts.into(
  BaseAttrSchema,
  (v): IEvaluator => new Attr(v),
);

export class Attr implements IEvaluator {
  constructor(private params_: AttrParams) {}

  toJS(input: string): string {
    const [attr] = this.params_.args;
    return `${input}?.getAttribute("${attr}")`;
  }
}

export const BaseChildSchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type ChildParams = ts.output<typeof BaseChildSchema>;

export const ChildParser = ts.into(
  BaseChildSchema,
  (v): IEvaluator => new Child(v),
);

export class Child implements IEvaluator {
  constructor(private params_: ChildParams) {}

  toJS(input: string, ctx: EvaluatorContext): string {
    const index = this.params_.args[0].resolve(ctx.expressionContext);
    return `Array.from(${input}?.children || []).at(${index})`;
  }
}

export const BaseDefaultSchema = ts.node({
  args: ts.args([ts.expression(ts.union([ts.number(), ts.string()]))]),
});

export type DefaultParams = ts.output<typeof BaseDefaultSchema>;

export const DefaultParser = ts.into(
  BaseDefaultSchema,
  (v): IEvaluator => new Default(v),
);

export class Default implements IEvaluator {
  constructor(private params_: DefaultParams) {}

  toJS(input: string, ctx: EvaluatorContext) {
    const defaultValue = this.params_.args[0].resolve(ctx.expressionContext);
    return `(${input}) || ${JSON.stringify(defaultValue)}`;
  }
}

export const DeqParser = ts.into(BaseDeqSchema, (v): IEvaluator => new Deq(v));

export class Deq extends BaseDeq {
  protected override nonStrict: string = '==';
  protected override strict: string = '===';
}

export const DneParser = ts.into(BaseDeqSchema, (v): IEvaluator => new Dne(v));

export class Dne extends BaseDeq {
  protected override nonStrict: string = '!=';
  protected override strict: string = '!==';
}

export const EqParser = ts.into(BaseEqSchema, (v): IEvaluator => new Eq(v));

export class Eq extends BaseEq {
  protected override nonStrict: string = '==';
  protected override strict: string = '===';
}

export const BaseExtractSchema = ts.node({
  args: ts.args([ts.expression(ts.regex)]),
  options: ts.properties({
    index: ts.default(ts.number(), 1),
    caseSensitive: ts.default(ts.boolean(), true),
  }),
});

export type ExtractParams = ts.output<typeof BaseExtractSchema>;

export const ExtractParser = ts.into(
  BaseExtractSchema,
  (v): IEvaluator => new Extract(v),
);

export class Extract implements IEvaluator {
  constructor(private params_: ExtractParams) {}

  toJS(input: string, ctx: EvaluatorContext) {
    const regex = this.params_.args[0].resolve(ctx.expressionContext);
    const index = this.params_.options.index;
    const flags = this.params_.options.caseSensitive ? '' : 'i';
    return `new RegExp(${JSON.stringify(regex)}, ${JSON.stringify(flags)}).exec(${input})?.[${index}]`;
  }
}

export const BaseFuncSchema = ts.node({
  args: ts.args([ts.string()]),
});

export type FuncParams = ts.output<typeof BaseFuncSchema>;

export const FuncParser = ts.into(
  BaseFuncSchema,
  (v): IEvaluator => new Func(v),
);

export class Func implements IEvaluator {
  constructor(private params_: FuncParams) {}

  toJS(input: string): string {
    const [func] = this.params_.args;
    return `(${func})(${input})`;
  }
}

export const BaseInnerTextSchema = ts.node({});

export const InnerTextParser = ts.into(
  BaseInnerTextSchema,
  (): IEvaluator => new InnerText(),
);

export class InnerText implements IEvaluator {
  constructor() {}

  toJS(input: string): string {
    return `${input}?.innerText`;
  }
}

export const BaseMatchesSchema = ts.node({
  args: ts.args([ts.expression(ts.regex)]),
  options: ts.properties({
    caseSensitive: ts.default(ts.boolean(), true),
  }),
});

export type MatchesParams = ts.output<typeof BaseMatchesSchema>;

export const MatchesParser = ts.into(
  BaseMatchesSchema,
  (v): IEvaluator => new Matches(v),
);

export class Matches implements IEvaluator {
  constructor(private params_: MatchesParams) {}

  toJS(input: string, ctx: EvaluatorContext) {
    const regex = this.params_.args[0].resolve(ctx.expressionContext);
    const flags = this.params_.options.caseSensitive ? '' : 'i';
    return `new RegExp(${JSON.stringify(regex)}, ${JSON.stringify(flags)}).test(${input})`;
  }
}

export const NeParser = ts.into(BaseEqSchema, (v): IEvaluator => new Ne(v));

export class Ne extends BaseEq {
  protected override nonStrict: string = '!=';
  protected override strict: string = '!==';
}

export const BaseNotSchema = ts.node({});

export const NotParser = ts.into(BaseNotSchema, (): IEvaluator => new Not());

export class Not implements IEvaluator {
  toJS(input: string) {
    return `!${input}`;
  }
}

export const OrParser = ts.into(
  BaseBinaryOpSchema,
  (v): IEvaluator => new Or(v),
);

export class Or extends BaseBinaryOp {
  protected override op: string = '||';
}

export const BasePropertySchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
});

export type PropertyParams = ts.output<typeof BasePropertySchema>;

export const PropertyParser = ts.into(
  BasePropertySchema,
  (v): IEvaluator => new Property(v),
);

export class Property implements IEvaluator {
  constructor(private params_: PropertyParams) {}

  toJS(input: string, ctx: EvaluatorContext): string {
    const name = this.params_.args[0].resolve(ctx.expressionContext);
    return `${input}?.["${name}"]`;
  }
}

export const BaseQuerySelectorSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
});

export type QuerySelectorParams = ts.output<typeof BaseQuerySelectorSchema>;

export const QuerySelectorParser = ts.into(
  BaseQuerySelectorSchema,
  (v): IEvaluator => new QuerySelector(v),
);

export class QuerySelector implements IEvaluator {
  constructor(private params_: QuerySelectorParams) {}

  toJS(input: string, ctx: EvaluatorContext): string {
    const selector = this.params_.args[0].resolve(ctx.expressionContext);
    return `${input}?.querySelector("${selector}")`;
  }
}

export const ReplaceOptionsSchema = ts.properties({
  all: ts.default(ts.boolean(), false),
  regex: ts.default(ts.boolean(), false),
  caseSensitive: ts.default(ts.boolean(), true),
});

export const BaseReplaceSchema = ts.node({
  args: ts.args([ts.expression(ts.regex), ts.expression(ts.string())]),
  options: ReplaceOptionsSchema,
});

export type ReplaceParams = ts.output<typeof BaseReplaceSchema>;

export class Replace implements IEvaluator {
  constructor(private params_: ReplaceParams) {}

  toJS(input: string, ctx: EvaluatorContext) {
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

export const BaseRootSchema = ts.node({});

export const RootParser = ts.into(BaseRootSchema, () => new Root());

export class Root implements IEvaluator {
  toJS(_input: string, ctx: EvaluatorContext) {
    return ctx.rootInput;
  }
}
