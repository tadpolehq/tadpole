import type { HTMLElement } from 'node-html-parser';

export interface DocumentParams {
  root: HTMLElement;
}

export class Document {
  private root_: HTMLElement;
  private elementStack_: HTMLElement[];

  constructor({ root }: DocumentParams) {
    this.root_ = root;
    this.elementStack_ = [];
  }

  get root(): HTMLElement {
    return this.root_;
  }

  pushElement(element: HTMLElement) {
    this.elementStack_.push(element);
  }

  popElement(): HTMLElement | undefined {
    return this.elementStack_.pop();
  }
}
