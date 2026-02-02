import { Err, Ok } from 'ts-results-es';
import { vi } from 'vitest';

import {
  ArrayType,
  ExpressionParser,
  RecordType,
  SchemaError,
  StructType,
  TupleType,
  Type,
  type ExpressionContext,
  type ExpressionValue,
  type IExpressionValueType,
  type IRegistry,
  type ISlotStack,
  type IVariableStack,
  type Validator,
} from '../src/index';

class MockType extends Type<any, any> {
  public override parse = vi.fn();
  protected override parse_ = vi.fn();
}

class MockExpressionType
  extends Type<any, any>
  implements IExpressionValueType<any>
{
  public cast = vi.fn();
  public override parse = vi.fn().mockImplementation((val, ctx) => {
    try {
      return new Ok(this.cast(val, ctx));
    } catch (err) {
      return new Err(new SchemaError({ message: (err as Error).message }));
    }
  });
  protected override parse_ = vi.fn();
}

export const TypeMock = (
  outputFn?: (val: any) => any,
  validators?: Validator<any>[],
): Type<any, any> => {
  const mock = new MockType({
    validators,
  });
  mock.parse.mockImplementation(outputFn || ((val) => new Ok(val)));
  return mock;
};

export const ExpressionTypeMock = (
  outputFn?: (val: any) => any,
  validators?: Validator<any>[],
): Type<any, any> & IExpressionValueType<any> => {
  const mock = new MockExpressionType({
    validators,
  });
  mock.cast.mockImplementation(outputFn || ((val) => val));
  return mock;
};

export const VariableStackMock = (
  variables: Record<string, ExpressionValue> = {},
  overrides: Partial<IVariableStack> = {},
): IVariableStack => {
  return {
    globals: {} as any,
    currentFrame: {} as any,
    flatten: vi.fn().mockReturnValue(variables),
    get: vi.fn((name: string): ExpressionValue | undefined => variables[name]),
    pushFrame: vi.fn(),
    popFrame: vi.fn(),
    ...overrides,
  };
};

export const ExpressionContextMock = (
  stack: IVariableStack,
): ExpressionContext => ({
  parser: new ExpressionParser(),
  stack,
});

class MockArrayType extends ArrayType<any, any, any, any> {
  public override getItems = vi.fn();
}

export const ArrayTypeMock = (wrapped: any, getItems: (val: any) => any[]) => {
  const array = new MockArrayType({ wrapped });
  array.getItems.mockImplementation(getItems);
  return array;
};

class MockRecordType extends RecordType<any, any, any, any> {
  public override getItems = vi.fn();
}

export const RecordTypeMock = (
  value: any,
  getItems: (val: any) => [string, any][],
) => {
  const record = new MockRecordType({ value });
  record.getItems.mockImplementation(getItems);
  return record;
};

class MockStructType extends StructType<any, any, any> {
  public override getItems = vi.fn();
}

export const StructTypeMock = (
  members: Record<string, any>,
  getItems: (v: any) => Record<string, any>,
  prefix?: string,
) => {
  const struct = new MockStructType({ members, prefix });
  struct.getItems.mockImplementation(getItems);
  return struct;
};

class MockTupleType extends TupleType<any, any, any> {
  public override getItems = vi.fn();
}

export const TupleTypeMock = (members: any[], getItems: (v: any) => any[]) => {
  const tuple = new MockTupleType({ members });
  tuple.getItems.mockImplementation(getItems);
  return tuple;
};

export const RegistryMock = (
  types: Record<string, any>,
  overrides: Partial<IRegistry<any, any, any>> = {},
): IRegistry<any, any, any> => {
  return {
    get: vi.fn((name: string): any => types[name]),
    register: vi.fn(),
    registerChild: vi.fn(),
    ...overrides,
  };
};

export const SlotStackMock = (
  overrides: Partial<ISlotStack> = {},
): ISlotStack => {
  return {
    currentSlot: {} as any,
    pushSlot: vi.fn(),
    popSlot: vi.fn(),
    ...overrides,
  };
};
