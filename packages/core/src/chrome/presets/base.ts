import * as ts from '@tadpolehq/schema';

export interface Set {
  env: Record<string, string>;
  flags: string[];
}

export interface IPreset {
  load(): Partial<Set>;
}

export const Registry: ts.IRegistry<
  ts.Node,
  IPreset,
  ts.Type<ts.Node, IPreset>
> = new ts.Registry();

export function concat(sets: Partial<Set>[]): Set {
  return sets.reduce<Set>((c, s) => {
    return {
      env: {...c.env, ...(s.env ?? {})},
      flags: [...c.flags, ...(s.flags ?? [])],
    }
  }, {
    env: {},
    flags: []
  });
}
