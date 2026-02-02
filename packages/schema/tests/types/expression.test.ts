import { describe, expect, it } from 'vitest';

import {
  ExpressionType,
  Expression,
  ResolvedExpression,
} from '../../src/index';
import {
  ExpressionTypeMock,
  ExpressionContextMock,
  VariableStackMock,
} from '../mocks';

describe('ExpressionType', () => {
  it('should return a deferred expression if input uses expression syntax', () => {
    const wrapped = ExpressionTypeMock();
    const type = new ExpressionType({ wrapped });

    const variableStack = VariableStackMock({
      var: 5,
    });
    const expressionContext = ExpressionContextMock(variableStack);

    const input = '=var + 5';
    const result = type.parse(input, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBeInstanceOf(Expression);
    expect(result.unwrap().resolve(expressionContext)).toEqual(10);
    expect(variableStack.flatten).toBeCalledTimes(1);
    expect(wrapped.cast).toBeCalled();
  });

  it('should return a resolved expression if input does not use using expression syntax', () => {
    const wrapped = ExpressionTypeMock();
    const type = new ExpressionType({ wrapped });

    const variableStack = VariableStackMock();
    const expressionContext = ExpressionContextMock(variableStack);

    const input = 5;
    const result = type.parse(input, {} as any);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBeInstanceOf(ResolvedExpression);
    expect(result.unwrap().resolve(expressionContext)).toBe(input);
  });

  it('should return an error if input is invalid', () => {
    const wrapped = ExpressionTypeMock(() => {
      throw new Error('error');
    });
    const type = new ExpressionType({ wrapped });

    const result = type.parse(5, {} as any);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toEqual('error');
  });
});
