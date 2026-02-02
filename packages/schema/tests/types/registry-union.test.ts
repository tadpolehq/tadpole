import { Ok } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { RegistryUnionType, type Node } from '../../src/index';
import { RegistryMock, TypeMock } from '../mocks';

describe('RegistryType', () => {
  it('should parse the selected type', () => {
    const types = {
      key: TypeMock((node) => new Ok(node.values[0])),
      otherKey: TypeMock(),
    };
    const registry = new RegistryUnionType({ registry: RegistryMock(types) });

    const result = registry.parse(
      { name: 'key', values: ['success'] } as Node,
      {} as any,
    );

    expect(result.isOk()).toBe(true);
    expect(types.key.parse).toBeCalledTimes(1);
    expect(types.otherKey.parse).toBeCalledTimes(0);
    expect(result.unwrap()).toBe('success');
  });

  it('should return an error if the name is not registered', () => {
    const types = {
      key: TypeMock(),
    };
    const registry = new RegistryUnionType({ registry: RegistryMock(types) });

    const result = registry.parse({ name: 'doesNotExist' } as Node, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
  });

  it('should return an error if input is undefined', () => {
    const registry = new RegistryUnionType({ registry: RegistryMock({}) });

    const result = registry.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
  });
});
