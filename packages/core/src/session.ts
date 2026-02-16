import type { Browser } from './browser.js';
import { ILogger } from './logger.js';
import { Node } from './node.js';
import type { Runtime } from './types/index.js';
import type { Value } from './values.js';

export interface SessionParams {
  id: string;
  browser: Browser;
  logger: ILogger;
}

export interface MousePosition {
  x: number;
  y: number;
}

export class Session {
  private id_: string;
  private browser_: Browser;
  private documentNode_: Node | null;
  private nodeStack_: Node[];
  private mousePosition_: MousePosition;
  private logger_: ILogger;
  private mainFrameId_?: string;
  private currentLoaderId_?: string;

  constructor({ id, browser, logger }: SessionParams) {
    this.id_ = id;
    this.browser_ = browser;
    this.documentNode_ = null;
    this.nodeStack_ = [];
    this.mousePosition_ = { x: 0, y: 0 };
    this.logger_ = logger;
  }

  get id(): string {
    return this.id_;
  }

  get browser(): Browser {
    return this.browser_;
  }

  get documentNode(): Node | null {
    return this.documentNode_;
  }

  get mainFrameId(): string | undefined {
    return this.mainFrameId_;
  }

  set mainFrameId(frameId: string) {
    this.mainFrameId_ = frameId;
  }

  get currentLoaderId(): string | undefined {
    return this.currentLoaderId_;
  }

  set currentLoaderId(loaderId: string | undefined) {
    this.currentLoaderId_ = loaderId;
  }

  send<T>(method: string, params?: Record<string, Value>): Promise<T> {
    return this.browser_.send<T>({
      method,
      params,
      sessionId: this.id_,
    });
  }

  waitFor<T>(
    eventName: string,
    timeout: number,
    predicate?: (data: T) => boolean,
  ): Promise<T> {
    return this.browser_.waitFor(
      `${eventName}.${this.id_}`,
      timeout,
      predicate,
    );
  }

  on<T>(eventName: string, handler: (data: T) => void): () => void {
    return this.browser_.on(`${eventName}.${this.id_}`, handler);
  }

  get mousePosition(): MousePosition {
    return this.mousePosition_;
  }

  set mousePosition(newPosition: MousePosition) {
    this.mousePosition_ = newPosition;
  }

  private get activeNode_(): Node | null {
    return this.nodeStack_.at(-1) ?? this.documentNode_;
  }

  pushNode(node: Node) {
    this.nodeStack_.push(node);
  }

  popActiveNode(): Node | undefined {
    return this.nodeStack_.pop();
  }

  clearDocumentNode() {
    this.documentNode_ = null;
  }

  async activeNode(): Promise<Node> {
    const node = this.activeNode_;
    if (node !== null) {
      this.logger_.debug(`Using context objectId=${node.remoteObjectId}`);
      return node;
    }

    this.logger_.debug(
      "No node active in context, calling 'Runtime.evaluate' to fetch 'document'",
    );
    const { result } = await this.send<{ result: Runtime.RemoteObject }>(
      'Runtime.evaluate',
      {
        expression: 'document',
      },
    );

    this.documentNode_ = new Node({ remoteObjectId: result.objectId! });
    return this.documentNode_;
  }

  async callFunctionOn(
    functionDeclaration: string,
    objectId: Runtime.RemoteObjectId,
    params?: Record<string, Value>,
  ): Promise<Runtime.RemoteObject> {
    params = { ...params, objectId, functionDeclaration };
    const { result, exceptionDetails } = await this.send<{
      result: Runtime.RemoteObject;
      exceptionDetails?: Runtime.ExceptionDetails;
    }>('Runtime.callFunctionOn', params);

    if (exceptionDetails) {
      throw new Error(
        `Encountered error running JavaScript ${functionDeclaration}: ${exceptionDetails.text}`,
      );
    }

    return result;
  }

  async callFunctionOnActiveNode(
    functionDeclaration: string,
    params?: Record<string, Value>,
  ): Promise<Runtime.RemoteObject> {
    const activeNode = await this.activeNode();
    return await this.callFunctionOn(
      functionDeclaration,
      activeNode.remoteObjectId,
      params,
    );
  }
}
