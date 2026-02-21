import { Registry } from './root/index.js';
import { BrowserParser } from './browser.js';

Registry.register('browser', BrowserParser);

export type { IAction } from './base.js';
export * as cdp from './cdp/index.js';
export * as root from './root/index.js';
