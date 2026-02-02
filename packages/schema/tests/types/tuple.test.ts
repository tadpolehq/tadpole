import { Err } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { TupleTypeMock, TypeMock } from '../mocks';
import { SchemaError } from '../../src';

describe('TupleTest', () => {
  it('should parse each member type and return a tuple', () => {
    const members = [TypeMock(), TypeMock(), TypeMock()];
    const tuple = TupleTypeMock(members, (n) => n.values);

    const result = tuple.parse({ values: [1, 2, 3] } as any, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
    expect(members[0].parse).toBeCalledWith(1, expect.anything());
    expect(members[1].parse).toBeCalledWith(2, expect.anything());
    expect(members[2].parse).toBeCalledWith(3, expect.anything());
  });

  it('should collect all errors into a record', () => {
    const members = [
      TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
      TypeMock(),
      TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
    ];
    const tuple = TupleTypeMock(members, (n) => n.values);

    const result = tuple.parse({ values: [1, 2, 3] } as any, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().issue).toEqual({
      issues: {
        0: { message: 'error' },
        2: { message: 'error' },
      },
    });
    expect(members[0].parse).toBeCalledTimes(1);
    expect(members[1].parse).toBeCalledTimes(1);
    expect(members[2].parse).toBeCalledTimes(1);
  });

  it('should return an error if input is undefined', () => {
    const members = [TypeMock()];
    const tuple = TupleTypeMock(members, () => []);

    const result = tuple.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(members[0].parse).toBeCalledTimes(0);
  });
});
