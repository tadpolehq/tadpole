import { Registry } from './base.js';
import * as cdp from './cdp.js';
import * as defintions from './definitions.js';
import * as emulation from './emulation.js';

Registry.register('common', defintions.CommonParser)
  .register('device_memory', emulation.DeviceMemoryParser)
  .register('env', defintions.EnvParser)
  .register('hardware_concurrency', emulation.HardwareConcurrencyParser)
  .register('headless', defintions.HeadlessParser)
  .register('identity', emulation.IdentityParser)
  .register('viewport', emulation.ViewportParser)
  .register('webgl_vendor', emulation.WebGLVendorParser)
  .registerChild('cdp', cdp.Registry);

export * from './base.js';
export { cdp, defintions, emulation };
