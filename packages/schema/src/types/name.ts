import { Err, Ok, type Result } from 'ts-results-es';
import { Type, type Node } from './base.js';
import { SchemaError } from '../error.js';

export class NameType extends Type<Node, string> {
  protected override parse_(
    value: Node | undefined,
  ): Result<string, SchemaError> {
    if (value === undefined) return new Err(new SchemaError({ message: '' }));
    return new Ok(value.name);
  }
}
