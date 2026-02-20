import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import type { Context } from './base.js';

export type KeyDefinition = {
  key: string;
  code: string;
  shiftedKey?: string;
};

export const keyDefinitions: { [key: string]: KeyDefinition } = {
  a: { key: 'a', code: 'KeyA', shiftedKey: 'A' },
  b: { key: 'b', code: 'KeyB', shiftedKey: 'B' },
  c: { key: 'c', code: 'KeyC', shiftedKey: 'C' },
  d: { key: 'd', code: 'KeyD', shiftedKey: 'D' },
  e: { key: 'e', code: 'KeyE', shiftedKey: 'E' },
  f: { key: 'f', code: 'KeyF', shiftedKey: 'F' },
  g: { key: 'g', code: 'KeyG', shiftedKey: 'G' },
  h: { key: 'h', code: 'KeyH', shiftedKey: 'H' },
  i: { key: 'i', code: 'KeyI', shiftedKey: 'I' },
  j: { key: 'j', code: 'KeyJ', shiftedKey: 'J' },
  k: { key: 'k', code: 'KeyK', shiftedKey: 'K' },
  l: { key: 'l', code: 'KeyL', shiftedKey: 'L' },
  m: { key: 'm', code: 'KeyM', shiftedKey: 'M' },
  n: { key: 'n', code: 'KeyN', shiftedKey: 'N' },
  o: { key: 'o', code: 'KeyO', shiftedKey: 'O' },
  p: { key: 'p', code: 'KeyP', shiftedKey: 'P' },
  q: { key: 'q', code: 'KeyQ', shiftedKey: 'Q' },
  r: { key: 'r', code: 'KeyR', shiftedKey: 'R' },
  s: { key: 's', code: 'KeyS', shiftedKey: 'S' },
  t: { key: 't', code: 'KeyT', shiftedKey: 'T' },
  u: { key: 'u', code: 'KeyU', shiftedKey: 'U' },
  v: { key: 'v', code: 'KeyV', shiftedKey: 'V' },
  w: { key: 'w', code: 'KeyW', shiftedKey: 'W' },
  x: { key: 'x', code: 'KeyX', shiftedKey: 'X' },
  y: { key: 'y', code: 'KeyY', shiftedKey: 'Y' },
  z: { key: 'z', code: 'KeyZ', shiftedKey: 'Z' },
  A: { key: 'A', code: 'KeyA' },
  B: { key: 'B', code: 'KeyB' },
  C: { key: 'C', code: 'KeyC' },
  D: { key: 'D', code: 'KeyD' },
  E: { key: 'E', code: 'KeyE' },
  F: { key: 'F', code: 'KeyF' },
  G: { key: 'G', code: 'KeyG' },
  H: { key: 'H', code: 'KeyH' },
  I: { key: 'I', code: 'KeyI' },
  J: { key: 'J', code: 'KeyJ' },
  K: { key: 'K', code: 'KeyK' },
  L: { key: 'L', code: 'KeyL' },
  M: { key: 'M', code: 'KeyM' },
  N: { key: 'N', code: 'KeyN' },
  O: { key: 'O', code: 'KeyO' },
  P: { key: 'P', code: 'KeyP' },
  Q: { key: 'Q', code: 'KeyQ' },
  R: { key: 'R', code: 'KeyR' },
  S: { key: 'S', code: 'KeyS' },
  T: { key: 'T', code: 'KeyT' },
  U: { key: 'U', code: 'KeyU' },
  V: { key: 'V', code: 'KeyV' },
  W: { key: 'W', code: 'KeyW' },
  X: { key: 'X', code: 'KeyX' },
  Y: { key: 'Y', code: 'KeyY' },
  Z: { key: 'Z', code: 'KeyZ' },
  '0': { key: '0', code: 'Digit0', shiftedKey: ')' },
  '1': { key: '1', code: 'Digit1', shiftedKey: '!' },
  '2': { key: '2', code: 'Digit2', shiftedKey: '@' },
  '3': { key: '3', code: 'Digit3', shiftedKey: '#' },
  '4': { key: '4', code: 'Digit4', shiftedKey: '$' },
  '5': { key: '5', code: 'Digit5', shiftedKey: '%' },
  '6': { key: '6', code: 'Digit6', shiftedKey: '^' },
  '7': { key: '7', code: 'Digit7', shiftedKey: '&' },
  '8': { key: '8', code: 'Digit8', shiftedKey: '*' },
  '9': { key: '9', code: 'Digit9', shiftedKey: '(' },
  ')': { key: ')', code: 'Digit0' },
  '!': { key: '!', code: 'Digit1' },
  '@': { key: '@', code: 'Digit2' },
  '#': { key: '#', code: 'Digit3' },
  $: { key: '$', code: 'Digit4' },
  '%': { key: '%', code: 'Digit5' },
  '^': { key: '^', code: 'Digit6' },
  '&': { key: '&', code: 'Digit7' },
  '*': { key: '*', code: 'Digit8' },
  '(': { key: '(', code: 'Digit9' },
  '`': { key: '`', code: 'Backquote', shiftedKey: '~' },
  '-': { key: '-', code: 'Minus', shiftedKey: '_' },
  '=': { key: '=', code: 'Equal', shiftedKey: '+' },
  '[': { key: '[', code: 'BracketLeft', shiftedKey: '{' },
  ']': { key: ']', code: 'BracketRight', shiftedKey: '}' },
  '\\': { key: '\\', code: 'Backslash', shiftedKey: '|' },
  ';': { key: ';', code: 'Semicolon', shiftedKey: ':' },
  "'": { key: "'", code: 'Quote', shiftedKey: "'" },
  ',': { key: ',', code: 'Comma', shiftedKey: '<' },
  '.': { key: '.', code: 'Period', shiftedKey: '>' },
  '/': { key: '/', code: 'Slash', shiftedKey: '?' },
  '~': { key: '~', code: 'Backquote' },
  _: { key: '_', code: 'Minus' },
  '+': { key: '+', code: 'Equal' },
  '{': { key: '{', code: 'BracketLeft' },
  '}': { key: '}', code: 'BracketRight' },
  '|': { key: '|', code: 'Backslash' },
  ':': { key: ':', code: 'Semicolon' },
  '"': { key: '"', code: 'Quote' },
  '<': { key: '<', code: 'Comma' },
  '>': { key: '>', code: 'Period' },
  '?': { key: '?', code: 'Slash' },
  Enter: { key: 'Enter', code: 'Enter' },
  Escape: { key: 'Escape', code: 'Escape' },
  Tab: { key: 'Tab', code: 'Tab' },
  ' ': { key: ' ', code: 'Space' },
  Backspace: { key: 'Backspace', code: 'Backspace' },
  Delete: { key: 'Delete', code: 'Delete' },
  Insert: { key: 'Insert', code: 'Insert' },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp' },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown' },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft' },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight' },
  Home: { key: 'Home', code: 'Home' },
  End: { key: 'End', code: 'End' },
  PageUp: { key: 'PageUp', code: 'PageUp' },
  PageDown: { key: 'PageDown', code: 'PageDown' },
  F1: { key: 'F1', code: 'F1' },
  F2: { key: 'F2', code: 'F2' },
  F3: { key: 'F3', code: 'F3' },
  F4: { key: 'F4', code: 'F4' },
  F5: { key: 'F5', code: 'F5' },
  F6: { key: 'F6', code: 'F6' },
  F7: { key: 'F7', code: 'F7' },
  F8: { key: 'F8', code: 'F8' },
  F9: { key: 'F9', code: 'F9' },
  F10: { key: 'F10', code: 'F10' },
  F11: { key: 'F11', code: 'F11' },
  F12: { key: 'F12', code: 'F12' },
} as const;

export enum Modifier {
  None = 0,
  Alt = 1 << 0,
  Ctrl = 1 << 1,
  Command = 1 << 2,
  Shift = 1 << 3,
}

function getKeyDefinition(key: string, modifiers: Modifier): KeyDefinition {
  const shiftOnly = modifiers === Modifier.Shift;
  let keyDefinition = keyDefinitions[key];
  if (!keyDefinition) throw new Error(`Key ${key} is not valid`);
  if (shiftOnly && keyDefinition.shiftedKey)
    keyDefinition = keyDefinitions[keyDefinition.shiftedKey]!;
  return keyDefinition;
}

export const ModifierSchema = ts.into(
  ts.properties({
    alt: ts.default(ts.boolean(), false),
    ctrl: ts.default(ts.boolean(), false),
    command: ts.default(ts.boolean(), false),
    shift: ts.default(ts.boolean(), false),
  }),
  (v): Modifier => {
    let modifier: Modifier = Modifier.None;
    if (v.alt) modifier |= Modifier.Alt;
    if (v.ctrl) modifier |= Modifier.Ctrl;
    if (v.command) modifier |= Modifier.Command;
    if (v.shift) modifier |= Modifier.Shift;
    return modifier;
  },
);

// TODO: Get this to use a string union
export const KeySchema = ts.enum(Object.keys(keyDefinitions));

export const DownSchema = ts.node({
  args: ts.args([ts.expression(KeySchema)]),
  modifiers: ModifierSchema,
});

export type DownParams = ts.output<typeof DownSchema>;

export const DownParser = ts.into(
  DownSchema,
  (v): IAction<Context> => new Down(v),
);

export class Down implements IAction<Context> {
  constructor(private params_: DownParams) {}

  async execute(ctx: Context) {
    const keyDefinition = getKeyDefinition(
      this.params_.args[0].resolve(ctx.$.expressionContext),
      this.params_.modifiers,
    );
    const isChar = keyDefinition.key.length === 1;
    const text = isChar ? keyDefinition.key : undefined;

    await ctx.session.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      modifiers: this.params_.modifiers,
      code: keyDefinition.code,
      key: keyDefinition.key,
      text,
    });

    if (isChar) {
      await ctx.session.send('Input.dispatchKeyEvent', {
        type: 'char',
        modifiers: this.params_.modifiers,
        text,
      });
    }
  }
}

export const UpSchema = ts.node({
  args: ts.args([ts.expression(KeySchema)]),
  modifiers: ModifierSchema,
});

export type UpParams = ts.output<typeof UpSchema>;

export const UpParser = ts.into(UpSchema, (v): IAction<Context> => new Up(v));

export class Up implements IAction<Context> {
  constructor(private params_: UpParams) {}

  async execute(ctx: Context) {
    const keyDefinition = getKeyDefinition(
      this.params_.args[0].resolve(ctx.$.expressionContext),
      this.params_.modifiers,
    );
    await ctx.session.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this.params_.modifiers,
      code: keyDefinition.code,
      key: keyDefinition.key,
    });
  }
}

export const PressOptions = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const PressSchema = ts.node({
  args: ts.args([ts.expression(KeySchema)]),
  modifiers: ModifierSchema,
  options: PressOptions,
});

export type PressParams = ts.output<typeof PressSchema>;

export const PressParser = ts.into(
  PressSchema,
  (v): IAction<Context> => new Press(v),
);

export class Press implements IAction<Context> {
  private down_: Down;
  private up_: Up;

  constructor(private params_: PressParams) {
    const [key] = this.params_.args;
    this.down_ = new Down({
      args: [key],
      modifiers: this.params_.modifiers,
    });
    this.up_ = new Up({
      args: [key],
      modifiers: this.params_.modifiers,
    });
  }

  async execute(ctx: Context) {
    ctx.$.log.debug(`Pressing character: ${this.params_.args[0]}`);
    await this.down_.execute(ctx);
    const delay = Math.max(
      0,
      this.params_.options.delay.resolve(ctx.$.expressionContext),
    );
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await this.up_.execute(ctx);
  }
}

export const TypeOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const TypeSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  options: TypeOptionsSchema,
});

export type TypeParams = ts.output<typeof TypeSchema>;

export const TypeParser = ts.into(
  TypeSchema,
  (v): IAction<Context> => new Type(v),
);

export class Type implements IAction<Context> {
  constructor(private params_: TypeParams) {}

  async execute(ctx: Context) {
    const [text] = this.params_.args;
    const presses = text
      .resolve(ctx.$.expressionContext)
      .split('')
      .map(
        (ch) =>
          new Press({
            args: [new ts.ResolvedExpression(ch)],
            modifiers: 0,
            options: {
              delay: this.params_.options.delay,
            },
          }),
      );
    for (const press of presses) {
      await press.execute(ctx);
    }
  }
}

export const Registry: ts.Registry<
  ts.Node,
  IAction<Context>,
  ts.Type<ts.Node, IAction<Context>>
> = new ts.Registry();

Registry.register('down', DownParser)
  .register('press', PressParser)
  .register('type', TypeParser)
  .register('up', UpParser);
