import type { Result } from 'ts-results-es';
import { SchemaError } from '../error.js';
import type { TypeParseContext } from '../types/base.js';

export interface IMetaType<TIn> {
  parse(value: TIn, ctx: TypeParseContext): Promise<Result<void, SchemaError>>;
}
