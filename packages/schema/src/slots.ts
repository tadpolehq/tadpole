import type { Document } from './types/index.js';

export interface ISlotStack {
  get currentSlot(): Document | undefined;
  pushSlot(slot: Document): void;
  popSlot(): void;
}

export class SlotStack implements ISlotStack {
  private stack_: Document[];

  constructor() {
    this.stack_ = [];
  }

  get currentSlot(): Document | undefined {
    return this.stack_.at(-1);
  }

  pushSlot(slot: Document) {
    this.stack_.push(slot);
  }

  popSlot() {
    this.stack_.pop();
  }
}
