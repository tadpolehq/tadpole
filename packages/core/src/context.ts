import type { ExpressionContext } from '@tadpolehq/schema';
import type { Browser } from './browser.js';
import type { ILogger } from './logger.js';
import type { Session } from './session.js';
import type { Output, Value } from './values.js';

export type RootContextParams = {
  log: ILogger;
  output: Output;
  expressionContext: ExpressionContext;
};

export class RootContext {
  private log_: ILogger;
  private output_: Output;
  private expressionContext_: ExpressionContext;

  constructor({ log, output, expressionContext }: RootContextParams) {
    this.log_ = log;
    this.output_ = output;
    this.expressionContext_ = expressionContext;
  }

  get log(): ILogger {
    return this.log_;
  }

  get output(): Output {
    return this.output_;
  }

  get expressionContext(): ExpressionContext {
    return this.expressionContext_;
  }

  updateOutputAtPath(value: Value, path: string) {
    const parts = path.split('.');
    let current = this.output;
    for (let i = 0; i < parts.length; i++) {
      let key = parts[i]!;
      const isArray = key.endsWith('[]');
      if (isArray) key = key.slice(0, -2);

      if (i === parts.length - 1) {
        if (isArray) {
          if (!current.has(key)) current.set(key, []);
          const arr = current.get(key);
          if (!Array.isArray(arr))
            throw new Error(`Path mismatch: ${key} is not an array`);

          if (Array.isArray(value)) {
            arr.push(...value);
          } else {
            arr.push(value);
          }
        } else {
          current.set(key, value);
        }
      } else {
        if (current.has(key)) {
          const value = current.get(key);
          if (isArray) {
            if (!Array.isArray(value))
              throw new Error(`Path mismatch: ${key} is not an array`);

            current = new Map();
            value.push(current);
          } else if (value instanceof Map) {
            current = value;
          } else {
            throw new Error(`Path mismatch: ${key} is not a map`);
          }
        } else if (isArray) {
          const newCurrent = new Map();
          current.set(key, [newCurrent]);
          current = newCurrent;
        } else {
          const newCurrent = new Map();
          current.set(key, newCurrent);
          current = newCurrent;
        }
      }
    }
  }
}

export interface BrowserContext {
  $: RootContext;
  browser: Browser;
}

export interface SessionContext extends BrowserContext {
  session: Session;
}

export interface EvaluatorContext {
  rootInput: string;
  expressionContext: ExpressionContext;
}
