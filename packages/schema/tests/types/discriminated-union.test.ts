import { Ok } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { DiscriminatedUnionType, type Node } from '../../src/index';
import { TypeMock } from '../mocks';

describe('DiscriminatedUnionType', () => {
  it('should parse the selected type', () => {
    const mapping: Record<string, any> = {
      first: TypeMock(),
      second: TypeMock((node) => new Ok(node.values[0])),
      third: TypeMock(),
    };
    const type = new DiscriminatedUnionType({ mapping });

    const result = type.parse(
      { name: 'second', values: ['success'] } as Node,
      {} as any,
    );

    expect(result.isOk()).toBe(true);
    expect(mapping['second'].parse).toBeCalledTimes(1);
    expect(mapping['first'].parse).toBeCalledTimes(0);
    expect(mapping['third'].parse).toBeCalledTimes(0);
    expect(result.unwrapOr(undefined)).toEqual('success');
  });

  it('should return an error if the name is not a valid choice', () => {
    const mapping: Record<string, any> = {
      exists: TypeMock(),
    };
    const type = new DiscriminatedUnionType({ mapping });

    const result = type.parse({ name: 'doesNotExist' } as Node, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(mapping['exists'].parse).toBeCalledTimes(0);
  });

  it('should return an error if input is undefined', () => {
    const mapping = {};
    const type = new DiscriminatedUnionType({ mapping });

    const result = type.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
  });
});
