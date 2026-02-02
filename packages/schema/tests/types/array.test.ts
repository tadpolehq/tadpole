import { Err } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { SchemaError } from '../../src/index';
import { ArrayTypeMock, TypeMock } from '../mocks';

describe('ArrayType', () => {
  it('should parse each item', () => {
    const wrapped = TypeMock();
    const values = [1, 2, 3];
    const array = ArrayTypeMock(wrapped, (n) => n.values);

    const result = array.parse({ values }, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrapOr(null)).toEqual(values);
    expect(wrapped.parse).toBeCalledTimes(values.length);
  });

  it('should collect all errors into a record', () => {
    const wrapped = TypeMock(
      () => new Err(new SchemaError({ message: 'error' })),
    );
    const values = [1, 2, 3];
    const array = ArrayTypeMock(wrapped, (n) => n.values);

    const result = array.parse({ values }, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().issue).toEqual({
      issues: {
        0: { message: 'error' },
        1: { message: 'error' },
        2: { message: 'error' },
      },
    });
  });

  it('should return an error if input is undefined', () => {
    const wrapped = TypeMock();
    const array = ArrayTypeMock(wrapped, () => []);

    const result = array.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(wrapped.parse).toBeCalledTimes(0);
  });
});
