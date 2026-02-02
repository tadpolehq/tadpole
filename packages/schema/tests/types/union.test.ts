import { describe, expect, it } from 'vitest';

import { UnionType } from '../../src/index';
import { ExpressionTypeMock } from '../mocks';

describe('UnionType', () => {
  it('should return the first successful cast', () => {
    const types = [
      ExpressionTypeMock(() => {
        throw new Error('error');
      }),
      ExpressionTypeMock(),
      ExpressionTypeMock(),
    ];
    const union = new UnionType({ types });

    const result = union.parse(5, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(5);
    expect(types[0].cast).toBeCalledWith(5);
    expect(types[1].cast).toBeCalledWith(5);
    expect(types[2].cast).toBeCalledTimes(0);
  });

  it('should return an error if no casts are successfull', () => {
    const types = [
      ExpressionTypeMock(() => {
        throw new Error('error');
      }),
      ExpressionTypeMock(() => {
        throw new Error('error');
      }),
    ];
    const union = new UnionType({ types });

    const result = union.parse(5, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(types[0].cast).toBeCalledWith(5);
    expect(types[1].cast).toBeCalledWith(5);
  });
});
