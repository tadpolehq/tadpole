import { Err, Ok } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { NodeType, SchemaError } from '../../src/index';
import { TypeMock } from '../mocks';

describe('NodeType', () => {
  it('should return a record with the correct field composition', () => {
    const composition = {
      field1: TypeMock(() => new Ok(1)),
      field2: TypeMock(() => new Ok(2)),
      field3: TypeMock(() => new Ok(3)),
    };
    const type = new NodeType({ composition });

    const result = type.parse({} as any, {} as any);

    expect(result.isOk()).toBe(true);
    expect(composition.field1.parse).toBeCalledTimes(1);
    expect(composition.field2.parse).toBeCalledTimes(1);
    expect(composition.field3.parse).toBeCalledTimes(1);
    expect(result.unwrap()).toEqual({
      field1: 1,
      field2: 2,
      field3: 3,
    });
  });

  it('should collect errors from multiple failing fields', () => {
    const composition = {
      field1: TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
      field2: TypeMock(() => new Ok(2)),
      field3: TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
    };
    const type = new NodeType({ composition });

    const result = type.parse({} as any, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().issue).toEqual({
      issues: {
        field1: {
          message: 'error',
        },
        field3: {
          message: 'error',
        },
      },
    });
  });
});
