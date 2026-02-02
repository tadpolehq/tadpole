import { Err } from 'ts-results-es';
import { describe, expect, it, vi } from 'vitest';

import { IntoType, SchemaError } from '../../src/index';
import { TypeMock } from '../mocks';

describe('IntoType', () => {
  it('should return the value returned by the supplied into function', () => {
    const type = new IntoType({
      wrapped: TypeMock(),
      into: (val: number) => val + 5,
    });

    const result = type.parse(5, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(10);
  });

  it('should return the error produced by the wrapped type', () => {
    const wrapped = TypeMock(
      () => new Err(new SchemaError({ message: 'error' })),
    );
    const into = vi.fn();
    const type = new IntoType({
      wrapped,
      into,
    });

    const result = type.parse({}, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBe('error');
    expect(into).toBeCalledTimes(0);
  });
});
