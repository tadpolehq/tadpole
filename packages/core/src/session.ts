import type { Browser } from './browser.js';
import type { Node } from './node.js';
import type { Value } from './values.js';

export interface SessionParams {
  id: string;
  browser: Browser;
}

export interface MousePosition {
  x: number;
  y: number;
}

export class Session {
  private id_: string;
  private browser_: Browser;
  private nodeStack_: Node[];
  private mousePosition_: MousePosition;

  constructor({ id, browser }: SessionParams) {
    this.id_ = id;
    this.browser_ = browser;
    this.nodeStack_ = [];
    this.mousePosition_ = { x: 0, y: 0 };
  }

  get id(): string {
    return this.id_;
  }

  get browser(): Browser {
    return this.browser_;
  }

  send<T>(method: string, params?: Record<string, Value>): Promise<T> {
    return this.browser_.send<T>({
      method,
      params,
      sessionId: this.id_,
    });
  }

  waitFor<T>(eventName: string, timeout: number): Promise<T> {
    return this.browser_.waitFor(`${eventName}.${this.id_}`, timeout);
  }

  get mousePosition(): MousePosition {
    return this.mousePosition_;
  }

  set mousePosition(newPosition: MousePosition) {
    this.mousePosition_ = newPosition;
  }

  get activeNode(): Node | null {
    return this.nodeStack_.at(-1) ?? null;
  }

  pushNode(node: Node) {
    this.nodeStack_.push(node);
  }

  popActiveNode(): Node | undefined {
    return this.nodeStack_.pop();
  }
}
