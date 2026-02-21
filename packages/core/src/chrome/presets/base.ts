import * as ts from '@tadpolehq/schema';
import * as cdp from '@/cdp/index.js';

export interface Set {
  browser: ((browser: cdp.Browser) => Promise<void>)[];
  env: Record<string, string>;
  flags: string[];
  session: ((session: cdp.Session) => Promise<void>)[];
}

export interface IPreset {
  build(): Partial<Set>;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IPreset,
  ts.Type<ts.Node, IPreset>
> = new ts.Registry();

export function concat(presets: IPreset[]): Set {
  return presets
    .map((p) => p.build())
    .reduce<Set>(
      (c, s) => {
        return {
          browser: [...c.browser, ...(s.browser ?? [])],
          env: { ...c.env, ...(s.env ?? {}) },
          flags: [...c.flags, ...(s.flags ?? [])],
          session: [...c.session, ...(s.session ?? [])],
        };
      },
      {
        browser: [],
        env: {},
        flags: [],
        session: [],
      },
    );
}
