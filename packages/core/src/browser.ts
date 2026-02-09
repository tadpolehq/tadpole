import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import type { ILogger } from './logger.js';

type Callback = {
  onsuccess: (res: any) => void;
  onerror: (error: any) => void;
};

export type JSONRPCParams = {
  method: string;
  params?: Record<string, any>;
  sessionId?: string | null;
};

export type BrowserParams = {
  webSocketDebuggerUrl: string;
  log: ILogger;
};

export class Browser {
  private webSocketDebuggerUrl_: string;
  private ws_: WebSocket | null;
  private methodId_: number;
  private callbacks_: Map<number, Callback>;
  private eventEmitter_: EventEmitter;
  private log_: ILogger;

  constructor({ webSocketDebuggerUrl, log }: BrowserParams) {
    this.webSocketDebuggerUrl_ = webSocketDebuggerUrl;
    this.ws_ = null;
    this.methodId_ = 1;
    this.callbacks_ = new Map();
    this.eventEmitter_ = new EventEmitter();
    this.log_ = log;
  }

  async connect(): Promise<void> {
    if (this.ws_ !== null) return;
    return new Promise((resolve, reject) => {
      this.ws_ = new WebSocket(this.webSocketDebuggerUrl_);
      this.ws_.once('open', () => resolve());
      this.ws_.once('error', (e) => {
        this.ws_ = null;
        reject(e);
      });
      this.ws_.on('message', this.onMessage_.bind(this));
    });
  }

  async close(timeout: number = 5000): Promise<void> {
    const ws = this.ws_;
    if (ws === null) return;

    this.ws_ = null;
    return new Promise((resolve) => {
      const timeoutObj = setTimeout(() => {
        ws.terminate();
        resolve();
      }, timeout);
      ws.once('close', () => {
        clearTimeout(timeoutObj);
        resolve();
      });
      ws.close();
    });
  }

  send<T>({ method, params, sessionId = null }: JSONRPCParams): Promise<T> {
    if (this.ws_ === null) throw new Error('Websocket is not open.');

    const id = this.methodId_++;
    const data = JSON.stringify({
      id,
      method,
      params: params ?? {},
      sessionId: sessionId ?? undefined,
    });
    this.log_.debug(`Sending message with data=${data}`);
    return new Promise((fufill, reject) => {
      this.ws_!.send(data, (err) => {
        if (err) {
          reject(new Error(`Error sending message: ${err.message}`));
        } else {
          this.callbacks_.set(id, {
            onsuccess: (data) => fufill(data as T),
            onerror: reject,
          });
        }
      });
    });
  }

  waitFor<T>(
    eventName: string,
    timeout: number,
    predicate?: (data: T) => boolean,
  ): Promise<T> {
    this.log_.debug(
      `Waiting for '${eventName}' to fire, will timeout after ${timeout}ms`,
    );
    return new Promise((resolve, reject) => {
      const handler = (data: T) => {
        if (predicate && !predicate(data)) {
          this.log_.debug(
            `Event received for ${eventName}, but predicate returned false.`,
          );
          return;
        }

        clearTimeout(timeoutId);
        this.eventEmitter_.removeListener(eventName, handler);
        this.log_.debug(
          `Event emitted for ${eventName} with params ${JSON.stringify(data)}`,
        );
        resolve(data);
      };

      this.eventEmitter_.on(eventName, handler);

      const timeoutId = setTimeout(() => {
        this.eventEmitter_.removeListener(eventName, handler);
        reject(new Error(`Timed out waiting for event: ${eventName}`));
      }, timeout);
    });
  }

  on<T>(eventName: string, handler: (data: T) => void): () => void {
    this.eventEmitter_.on(eventName, handler);
    return () => this.eventEmitter_.off(eventName, handler);
  }

  private onMessage_(data: Buffer) {
    const res = JSON.parse(data.toString());

    if (res.id) {
      if (!this.callbacks_.has(res.id)) return;

      const callback = this.callbacks_.get(res.id)!;

      if (res.error) {
        callback.onerror(res.error);
      } else {
        this.log_.debug(
          `Message id=${res.id} received response: ${JSON.stringify(res)}`,
        );
        callback.onsuccess(res.result);
      }

      this.callbacks_.delete(res.id);
    } else if (res.method) {
      const { method, params, sessionId } = res;
      this.eventEmitter_.emit(`${method}.${sessionId}`, params);
    }
  }
}
