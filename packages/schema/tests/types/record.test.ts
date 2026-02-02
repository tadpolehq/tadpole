import { Err } from 'ts-results-es';
import { describe, expect, it } from 'vitest';

import { SchemaError } from '../../src/index';
import { RecordTypeMock, TypeMock } from '../mocks';

describe('RecordTest', () => {
  it('should parse each child node and put it into the record', () => {
    const properties: [string, number][] = [
      ['key1', 1],
      ['key2', 2],
      ['key3', 3],
    ];
    const value = TypeMock();
    const record = RecordTypeMock(value, (n) => n.properties);

    const result = record.parse({ properties }, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(new Map(properties));
    expect(value.parse).toBeCalledTimes(properties.length);
  });

  it('should collect all errors into a record', () => {
    const properties: [string, number][] = [
      ['key1', 1],
      ['key2', 2],
      ['key3', 3],
    ];
    const value = TypeMock(
      () => new Err(new SchemaError({ message: 'error' })),
    );
    const record = RecordTypeMock(value, (n) => n.properties);

    const result = record.parse({ properties }, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().issue).toEqual({
      issues: {
        key1: { message: 'error' },
        key2: { message: 'error' },
        key3: { message: 'error' },
      },
    });
  });

  it('should return an error if input is undefined', () => {
    const value = TypeMock();
    const record = RecordTypeMock(value, () => []);

    const result = record.parse(undefined, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBeDefined();
    expect(value.parse).toBeCalledTimes(0);
  });
});
