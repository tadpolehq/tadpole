import * as ts from '@tadpolehq/schema';
import axios from 'axios';
import type { IAction } from './base.js';
import type { SessionContext } from '../context.js';
import type { Emulation } from '../types/index.js';

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
  [string, string, Emulation.UserAgentMetadata & Record<string, any>]
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
  ctx: SessionContext,
  userAgent: string,
  platform: string,
  userAgentMetadata: Emulation.UserAgentMetadata & Record<string, any>,
) {
  await ctx.session.send('Network.setUserAgentOverride', {
    userAgent,
    platform,
    userAgentMetadata,
  });
  await ctx.session.send('Network.setExtraHTTPHeaders', {
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

export const ApplyIdentityOptionsSchema = ts.properties({
  limit: ts.expression(ts.default(ts.number(), 10)),
});

export const BaseApplyIdentitySchema = ts.node({
  args: ts.args([ts.expression(PlatformSchema)]),
  options: ApplyIdentityOptionsSchema,
});

export type ApplyIdentityParams = ts.output<typeof BaseApplyIdentitySchema>;

export const ApplyIdentityParser = ts.into(
  BaseApplyIdentitySchema,
  (v): IAction<SessionContext> => new ApplyIdentity(v),
);

export class ApplyIdentity implements IAction<SessionContext> {
  constructor(private params_: ApplyIdentityParams) {}

  async execute(ctx: SessionContext) {
    const [userAgent, platform, userAgentMetadata] = await generateIdentityFor(
      this.params_.args[0].resolve(ctx.$.expressionContext),
      this.params_.options.limit.resolve(ctx.$.expressionContext),
    );
    await applyUAOverride(ctx, userAgent, platform, userAgentMetadata);
  }
}

export const BaseSetDeviceMemorySchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type SetDeviceMemoryParams = ts.output<typeof BaseSetDeviceMemorySchema>;

export const SetDeviceMemoryParser = ts.into(
  BaseSetDeviceMemorySchema,
  (v): IAction<SessionContext> => new SetDeviceMemory(v),
);

export class SetDeviceMemory implements IAction<SessionContext> {
  constructor(private params_: SetDeviceMemoryParams) {}

  async execute(ctx: SessionContext) {
    const deviceMemory = this.params_.args[0].resolve(ctx.$.expressionContext);
    await ctx.session.send('Page.addScriptToEvaluateOnNewDocument', {
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
  }
}

export const BaseSetHardwareConcurrencySchema = ts.node({
  args: ts.args([ts.expression(ts.number())]),
});

export type SetHardwareConcurrencyParams = ts.output<
  typeof BaseSetHardwareConcurrencySchema
>;

export const SetHardwareConcurrencyParser = ts.into(
  BaseSetHardwareConcurrencySchema,
  (v): IAction<SessionContext> => new SetHardwareConcurrency(v),
);

export class SetHardwareConcurrency implements IAction<SessionContext> {
  constructor(private params_: SetHardwareConcurrencyParams) {}

  async execute(ctx: SessionContext) {
    const hardwareConcurrency = this.params_.args[0].resolve(
      ctx.$.expressionContext,
    );
    await ctx.session.send('Emulation.setHardwareConcurrencyOverride', {
      hardwareConcurrency,
    });
  }
}

export const SetViewportOptions = ts.properties({
  width: ts.expression(ts.number()),
  height: ts.expression(ts.number()),
  deviceScaleFactor: ts.expression(ts.default(ts.number(), 1)),
  mobile: ts.expression(ts.default(ts.boolean(), false)),
  screenWidth: ts.expression(ts.optional(ts.number())),
  screenHeight: ts.expression(ts.optional(ts.number())),
});

export const BaseSetViewportSchema = ts.node({
  options: SetViewportOptions,
});

export type SetViewportParams = ts.output<typeof BaseSetViewportSchema>;

export const SetViewportParser = ts.into(
  BaseSetViewportSchema,
  (v): IAction<SessionContext> => new SetViewport(v),
);

export class SetViewport implements IAction<SessionContext> {
  constructor(private params_: SetViewportParams) {}

  async execute(ctx: SessionContext) {
    const width = this.params_.options.width.resolve(ctx.$.expressionContext);
    const height = this.params_.options.height.resolve(ctx.$.expressionContext);
    await ctx.session.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: this.params_.options.deviceScaleFactor.resolve(
        ctx.$.expressionContext,
      ),
      mobile: this.params_.options.mobile.resolve(ctx.$.expressionContext),
      screenWidth:
        this.params_.options.screenWidth.resolve(ctx.$.expressionContext) ??
        width,
      screenHeight:
        this.params_.options.screenHeight.resolve(ctx.$.expressionContext) ??
        height,
    });
  }
}

export const BaseSetWebGLVendorSchema = ts.node({
  args: ts.args([ts.expression(ts.string()), ts.expression(ts.string())]),
});

export type SetWebGLVendorParams = ts.output<typeof BaseSetWebGLVendorSchema>;

export const SetWebGLVendorParser = ts.into(
  BaseSetWebGLVendorSchema,
  (v): IAction<SessionContext> => new SetWebGLVendor(v),
);

export class SetWebGLVendor implements IAction<SessionContext> {
  constructor(private params_: SetWebGLVendorParams) {}

  async execute(ctx: SessionContext) {
    const vendor = this.params_.args[0].resolve(ctx.$.expressionContext);
    const renderer = this.params_.args[1].resolve(ctx.$.expressionContext);
    await ctx.session.send('Page.addScriptToEvaluateOnNewDocument', {
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
  }
}
