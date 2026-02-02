import { Err } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { SchemaError } from '../../src/index';
import { StructTypeMock, TypeMock } from '../mocks';

describe('StructType', () => {
  it('should parse each type defined in members', () => {
    const members = {
      member1: TypeMock(),
      member2: TypeMock(),
      member3: TypeMock(),
    };
    const properties = {
      member1: 1,
      member2: 2,
      member3: 3,
    };
    const struct = StructTypeMock(members, (n) => n.properties);

    const result = struct.parse({ properties }, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({
      member1: 1,
      member2: 2,
      member3: 3,
    });
    expect(members.member1.parse).toBeCalledWith(1, expect.anything());
    expect(members.member2.parse).toBeCalledWith(2, expect.anything());
    expect(members.member3.parse).toBeCalledWith(3, expect.anything());
  });

  it('should collect all errors into a record', () => {
    const members = {
      member1: TypeMock(),
      member2: TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
      member3: TypeMock(() => new Err(new SchemaError({ message: 'error' }))),
    };
    const struct = StructTypeMock(members, () => ({}));

    const result = struct.parse({}, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().issue).toEqual({
      issues: {
        member2: { message: 'error' },
        member3: { message: 'error' },
      },
    });
    expect(members.member1.parse).toBeCalledTimes(1);
    expect(members.member2.parse).toBeCalledTimes(1);
    expect(members.member3.parse).toBeCalledTimes(1);
  });

  it('should return an error if input is undefined', () => {
    const members = { member: TypeMock() };
    const struct = StructTypeMock({}, () => ({}));

    const result = struct.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(members.member.parse).toBeCalledTimes(0);
  });
});
