import { Ok } from 'ts-results-es';
import { describe, expect, it, vi } from 'vitest';

import { SlotType } from '../../src/index';
import { SlotStackMock, TypeMock } from '../mocks';

describe('SlotType', () => {
  it('should replace each keyword match with the current slot', () => {
    const slotStack = SlotStackMock({
      currentSlot: [{ name: 'replace' } as any],
    });
    const wrapped = TypeMock();
    const slot = new SlotType({ wrapped, keyword: 'slot' });

    const result = slot.parse(
      {
        children: [
          { name: 'something else' },
          { name: 'slot' },
          { name: 'hello' },
          { name: 'slot' },
        ],
      } as any,
      { slotStack } as any,
    );

    expect(result.isOk()).toBe(true);
    expect(wrapped.parse).toBeCalledWith(
      {
        children: [
          { name: 'something else' },
          { name: 'replace' },
          { name: 'hello' },
          { name: 'replace' },
        ],
      },
      { slotStack },
    );
  });

  it('should fallback to wrapped parser if undefined', () => {
    const slotStack = SlotStackMock();
    const slotStackSpy = vi.spyOn(slotStack, 'currentSlot', 'get');
    const wrapped = TypeMock(() => new Ok(5));
    const slot = new SlotType({ wrapped, keyword: 'slot' });

    const result = slot.parse(undefined, { slotStack } as any);

    expect(result.isOk()).toBe(true);
    expect(slotStackSpy).toBeCalledTimes(0);
    expect(result.unwrap()).toBe(5);
  });
});
