import * as ts from '@tadpolehq/schema';
import axios from 'axios';
import * as cdp from '@/cdp/index.js';
import type { Context, IPreset } from './base.js';

export interface ChromeRelease {
  milestone: number;
  version: string;
}

export async function getRandomChromeRelease(
  platform: string,
  limit: number,
): Promise<ChromeRelease> {
  const releasesUrl = `https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=${platform}&num=${limit}`;
  const { data } = await axios.get<[ChromeRelease]>(releasesUrl);
  return data[Math.floor(Math.random() * data.length)]!;
}

export const GREASE_BRANDS: string[] = ['Not(A:Brand', 'Not;A=Brand'];

export interface Brand {
  name: string;
  version: string;
  fullVersion: string;
}

export function getRandomGreaseBrand(majorVersion: string): Brand {
  const version = Math.random() > 0.5 ? majorVersion : '99';
  return {
    name: GREASE_BRANDS[Math.floor(Math.random() * GREASE_BRANDS.length)]!,
    version,
    fullVersion: `${version}.0.0.0`,
  };
}

export const PlatformSchema = ts.enum(['windows', 'mac', 'linux']);
export type Platform = ts.output<typeof PlatformSchema>;

export async function generateIdentityFor(
  forPlatform: Platform,
  limit: number,
): Promise<
  [string, string, cdp.types.Emulation.UserAgentMetadata & Record<string, any>]
> {
  let lookupPlatform: string,
    platform: string,
    navPlatform: string,
    platformVersion: string,
    architecture: string,
    uaOSSection: string;
  switch (forPlatform) {
    case 'windows':
      navPlatform = 'Win32';
      lookupPlatform = platform = 'Windows';
      platformVersion = '13.0.0';
      architecture = 'x86';
      uaOSSection = 'Windows NT 10.0; Win64; x64';
      break;
    case 'mac':
      navPlatform = 'MacIntel';
      platform = 'macOS';
      lookupPlatform = 'Mac';
      platformVersion = '15.7.3';
      architecture = 'arm';
      uaOSSection = 'Macintosh; Intel Mac OS X 10_15_7';
      break;
    case 'linux':
      navPlatform = 'Linux x86_64';
      lookupPlatform = platform = 'Linux';
      platformVersion = '';
      architecture = 'x86';
      uaOSSection = 'X11; Linux x86_64';
      break;
  }

  const { version, milestone } = await getRandomChromeRelease(
    lookupPlatform,
    limit,
  );
  const majorVersion = milestone.toString();

  const userAgent = `Mozilla/5.0 (${uaOSSection}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${majorVersion}.0.0.0 Safari/537.36`;

  const brandNames = [
    getRandomGreaseBrand(majorVersion),
    {
      name: 'Chromium',
      version: majorVersion,
      fullVersion: version,
    },
    {
      name: 'Google Chrome',
      version: majorVersion,
      fullVersion: version,
    },
  ].sort(() => Math.random() - 0.5);

  return [
    userAgent,
    navPlatform,
    {
      brands: brandNames.map((b) => ({ brand: b.name, version: b.version })),
      fullVersionList: brandNames.map((b) => ({
        brand: b.name,
        version: b.fullVersion,
      })),
      platform,
      platformVersion,
      architecture,
      bitness: '64',
      model: '',
      mobile: false,
    },
  ];
}

export async function applyUAOverride(
  session: cdp.Session,
  userAgent: string,
  platform: string,
  userAgentMetadata: cdp.types.Emulation.UserAgentMetadata &
    Record<string, any>,
) {
  await session.send('Network.setUserAgentOverride', {
    userAgent,
    platform,
    userAgentMetadata,
  });
  await session.send('Network.setExtraHTTPHeaders', {
    headers: {
      'Sec-CH-UA': userAgentMetadata.brands
        .map((b) => `"${b.brand}";v="${b.version}"`)
        .join(', '),
      'Sec-CH-UA-Platform': `"${userAgentMetadata.platform}"`,
      'Sec-CH-UA-Mobile': userAgentMetadata.mobile ? '?1' : '?0',
      'Sec-CH-UA-Full-Version-List': userAgentMetadata.fullVersionList
        .map((b) => `"${b.brand}";v="${b.version}"`)
        .join(', '),
      'Sec-CH-UA-Arch': `"${userAgentMetadata.architecture}"`,
      'Sec-CH-UA-Bitness': `"${userAgentMetadata.bitness ?? '64'}"`,
      'Sec-CH-UA-Platform-Version': `"${userAgentMetadata.platformVersion}"`,
    },
  });
}

export const DeviceMemorySchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type DeviceMemoryParams = ts.output<typeof DeviceMemorySchema>;

export const DeviceMemoryParser = ts.into(
  DeviceMemorySchema,
  (v): IPreset => new DeviceMemory(v),
);

export class DeviceMemory implements IPreset {
  constructor(private params_: DeviceMemoryParams) {}

  build(ctx: Context) {
    const deviceMemory = this.params_.args[0].resolve(ctx.expressionContext);
    return {
      session: [
        async (session: cdp.Session) => {
          await session.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
            (function() {
              const getter = function() { return ${deviceMemory}; };
              Object.defineProperty(Object.getPrototypeOf(navigator), 'deviceMemory', {
                get: getter,
                configurable: true,
                enumerable: true
              });
            })();
            `,
          });
        },
      ],
    };
  }
}

export const HardwareConcurrencySchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type HardwareConcurrencyParams = ts.output<
  typeof HardwareConcurrencySchema
>;

export const HardwareConcurrencyParser = ts.into(
  HardwareConcurrencySchema,
  (v): IPreset => new HardwareConcurrency(v),
);

export class HardwareConcurrency implements IPreset {
  constructor(private params_: HardwareConcurrencyParams) {}

  build(ctx: Context) {
    const hardwareConcurrency = this.params_.args[0].resolve(
      ctx.expressionContext,
    );
    return {
      session: [
        async (session: cdp.Session) => {
          await session.send('Emulation.setHardwareConcurrencyOverride', {
            hardwareConcurrency,
          });
        },
      ],
    };
  }
}

export const IdentityOptionsSchema = ts.properties({
  limit: ts.expression(ts.default(ts.number(), 3)),
});

export const IdentitySchema = ts.node({
  args: ts.args([ts.expression(PlatformSchema)]),
  options: IdentityOptionsSchema,
});

export type IdentityParams = ts.output<typeof IdentitySchema>;

export const IdentityParser = ts.into(
  IdentitySchema,
  (v): IPreset => new Identity(v),
);

export class Identity implements IPreset {
  constructor(private params_: IdentityParams) {}

  build(ctx: Context) {
    const forPlatform = this.params_.args[0].resolve(ctx.expressionContext);
    const limit = this.params_.options.limit.resolve(ctx.expressionContext);
    let cachedIdentity: any = null;
    return {
      session: [
        async (session: cdp.Session) => {
          if (!cachedIdentity)
            cachedIdentity = await generateIdentityFor(forPlatform, limit);
          const [userAgent, platform, userAgentMetadata] = cachedIdentity;
          await applyUAOverride(
            session,
            userAgent,
            platform,
            userAgentMetadata,
          );
        },
      ],
    };
  }
}

export const ViewportOptionsSchema = ts.properties({
  deviceScaleFactor: ts.expression(ts.default(ts.number(), 1)),
  mobile: ts.expression(ts.default(ts.boolean(), false)),
  screenWidth: ts.expression(ts.optional(ts.number())),
  screenHeight: ts.expression(ts.optional(ts.number())),
});

export const ViewportSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
  options: ViewportOptionsSchema,
});

export type ViewportParams = ts.output<typeof ViewportSchema>;

export const ViewportParser = ts.into(
  ViewportSchema,
  (v): IPreset => new Viewport(v),
);

export class Viewport implements IPreset {
  constructor(private params_: ViewportParams) {}

  build(ctx: Context) {
    const width = this.params_.args[0].resolve(ctx.expressionContext);
    const height = this.params_.args[1].resolve(ctx.expressionContext);
    const deviceScaleFactor = this.params_.options.deviceScaleFactor.resolve(
      ctx.expressionContext,
    );
    const mobile = this.params_.options.mobile.resolve(ctx.expressionContext);
    const screenWidth =
      this.params_.options.screenWidth.resolve(ctx.expressionContext) ?? width;
    const screenHeight =
      this.params_.options.screenHeight.resolve(ctx.expressionContext) ??
      height;
    return {
      session: [
        async (session: cdp.Session) => {
          await session.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor,
            mobile,
            screenWidth,
            screenHeight,
          });
        },
      ],
    };
  }
}

export const WebGLVendorSchema = ts.node({
  args: ts.args([ts.expression(ts.string()), ts.expression(ts.string())]),
});

export type WebGLVendorParams = ts.output<typeof WebGLVendorSchema>;

export const WebGLVendorParser = ts.into(
  WebGLVendorSchema,
  (v): IPreset => new WebGLVendor(v),
);

export class WebGLVendor implements IPreset {
  constructor(private params_: WebGLVendorParams) {}

  build(ctx: Context) {
    const vendor = this.params_.args[0].resolve(ctx.expressionContext);
    const renderer = this.params_.args[1].resolve(ctx.expressionContext);
    return {
      session: [
        async (session: cdp.Session) => {
          await session.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
            (function() {
              const wrapped = WebGLRenderingContext.prototype.getParameter;
              function getParameter(param) {
                if (param === 37445) return "${vendor}";
                if (param === 37446) return "${renderer}";
                return wrapped.apply(this, arguments);
              }

              Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
                value: getParameter,
                configurable: true,
                enumerable: true,
                writable: true
              });

              Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
                value: getParameter,
                configurable: true,
                enumerable: true,
                writable: true
              });
            })();
            `,
          });
        },
      ],
    };
  }
}
