import type {
  Document as _KDLDocument,
  Node as _KDLNode,
  Value as _KDLValue,
} from 'kdljs';
import { Err, Ok, type Result } from 'ts-results-es';
import { SchemaError } from '../error.js';
import type { ILoader } from '../loader.js';
import type { ISlotStack } from '../slots.js';

export type Document = _KDLDocument;
export type Node = _KDLNode;
export type Value = _KDLValue;

export interface TypeParseContext {
  loader: ILoader;
  filePath: string;
  namespace: string[];
  slotStack: ISlotStack;
}

export type ValidatorFunction<T> = (value: T) => boolean;

export type Validator<T> = {
  func: ValidatorFunction<T>;
  message: string;
};

export interface TypeParams<TOut> {
  validators?: Validator<TOut>[];
}

export abstract class Type<TIn, TOut> {
  declare readonly input_: TIn;
  declare readonly output_: TOut;

  private validators_: Validator<TOut>[];

  constructor({ validators }: TypeParams<TOut> = {}) {
    this.validators_ = validators || [];
  }

  protected abstract parse_(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError>;

  protected validate_(value: TOut): Result<void, string> {
    for (const validator of this.validators_) {
      if (!validator.func(value)) {
        return new Err(validator.message);
      }
    }

    return Ok.EMPTY;
  }

  parse(
    value: TIn | undefined,
    ctx: TypeParseContext,
  ): Result<TOut, SchemaError> {
    return this.parse_(value, ctx).andThen((parsedValue) =>
      this.validate_(parsedValue)
        .map(() => parsedValue)
        .mapErr((e) => new SchemaError({ message: e })),
    );
  }
}

export type ExtractOutputFromTypes<T> = {
  [K in keyof T]: T[K] extends Type<any, infer U> ? U : never;
};
export type ExtractOutputFromType<T> =
  T extends Type<any, infer TOut> ? TOut : never;
