import type {
  Type,
  TypeParams,
  Validator,
  ValidatorFunction,
} from '../types/index.js';

export abstract class Builder<TIn, TOut, TType extends Type<TIn, TOut>> {
  declare readonly input_: TIn;
  declare readonly output_: TOut;
  declare readonly type_: TType;

  protected validators_: Validator<TOut>[];

  constructor() {
    this.validators_ = [];
  }

  abstract build(): TType;

  get params(): TypeParams<TOut> {
    return {
      validators: this.validators_,
    };
  }

  clone(): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    clone.validators_ = [...this.validators_];
    return clone;
  }

  test(func: ValidatorFunction<TOut>, message?: string): this {
    const clone = this.clone();
    clone.validators_.push({
      func,
      message: message ?? `Error validating: ${func.toString()}`,
    });
    return this;
  }

  oneOf(values: TOut[], equal?: (value: TOut, other: TOut) => boolean) {
    return this.test(
      equal
        ? (value) => values.findIndex((other) => equal(value, other)) !== -1
        : (value) => values.indexOf(value) !== -1,
    );
  }
}

export type ExtractTypesFromBuilders<T> = {
  [K in keyof T]: T[K] extends Builder<any, any, infer U> ? U : never;
};

export type output<T extends Builder<any, any, Type<any, any>>> =
  T['type_']['output_'];
