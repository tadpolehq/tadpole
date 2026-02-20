import * as ts from '@tadpolehq/schema';
import { Registry, type Context, type IEvaluator } from './base.js';
import { reduce } from './index.js';

export const BinaryOpSchema = ts.node({
  rhs: ts.children(ts.anyOf(Registry)),
});

export type BinaryOpParams = ts.output<typeof BinaryOpSchema>;

export abstract class BinaryOp implements IEvaluator {
  constructor(protected params_: BinaryOpParams) {}

  protected abstract get op(): string;

  toJS(input: string, ctx: Context) {
    const rhs = reduce(this.params_.rhs, ctx, input);
    return `(${input}) ${this.op} (${rhs})`;
  }
}

export const EqualityOptions = ts.properties({
  strict: ts.default(ts.boolean(), true),
});

export type EqualityOptions = ts.output<typeof EqualityOptions>;

export const DEqualityOpSchema = BinaryOpSchema.extend(
  ts.buildrecord({
    options: EqualityOptions,
  }),
);

export type DEqualityOpParams = ts.output<typeof DEqualityOpSchema>;

export abstract class DEqualityOp extends BinaryOp {
  protected options_: EqualityOptions;

  constructor({ options, ...rest }: DEqualityOpParams) {
    super(rest);
    this.options_ = options;
  }

  protected abstract get nonStrict(): string;
  protected abstract get strict(): string;

  protected override get op() {
    return this.options_.strict ? this.strict : this.nonStrict;
  }
}

export const EqualityOpSchema = ts.node({
  args: ts.args([ts.expression(ts.union([ts.string(), ts.number()]))]),
  options: EqualityOptions,
});

export type EqualityOpParams = ts.output<typeof EqualityOpSchema>;

export abstract class EqualityOp implements IEvaluator {
  constructor(protected params_: EqualityOpParams) {}

  protected abstract get nonStrict(): string;
  protected abstract get strict(): string;

  toJS(input: string, ctx: Context) {
    const value = this.params_.args[0].resolve(ctx.expressionContext);
    const op = this.params_.options.strict ? this.strict : this.nonStrict;
    return `(${input} ${op} ${JSON.stringify(value)})`;
  }
}

export const AndParser = ts.into(BinaryOpSchema, (v): IEvaluator => new And(v));

export class And extends BinaryOp {
  protected override op: string = '&&';
}

export const DeqParser = ts.into(
  DEqualityOpSchema,
  (v): IEvaluator => new Deq(v),
);

export class Deq extends DEqualityOp {
  protected override nonStrict: string = '==';
  protected override strict: string = '===';
}

export const DneParser = ts.into(
  DEqualityOpSchema,
  (v): IEvaluator => new Dne(v),
);

export class Dne extends DEqualityOp {
  protected override nonStrict: string = '!=';
  protected override strict: string = '!==';
}

export const EqParser = ts.into(EqualityOpSchema, (v): IEvaluator => new Eq(v));

export class Eq extends EqualityOp {
  protected override nonStrict: string = '==';
  protected override strict: string = '===';
}

export const NeParser = ts.into(EqualityOpSchema, (v): IEvaluator => new Ne(v));

export class Ne extends EqualityOp {
  protected override nonStrict: string = '!=';
  protected override strict: string = '!==';
}

export const NotSchema = ts.node({});

export const NotParser = ts.into(NotSchema, (): IEvaluator => new Not());

export class Not implements IEvaluator {
  toJS(input: string) {
    return `!(${input})`;
  }
}

export const OrParser = ts.into(BinaryOpSchema, (v): IEvaluator => new Or(v));

export class Or extends BinaryOp {
  protected override op: string = '||';
}
