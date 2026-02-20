import { Bezier } from 'bezier-js';
import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import type { Context } from './base.js';

export const MoveSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
});

export type MoveParams = ts.output<typeof MoveSchema>;

export const MoveParser = ts.into(
  MoveSchema,
  (v): IAction<Context> => new Move(v),
);

export class Move implements IAction<Context> {
  constructor(private params_: MoveParams) {}

  async execute(ctx: Context) {
    const [x, y] = this.params_.args;
    const resolvedX = x.resolve(ctx.$.expressionContext);
    const resolvedY = y.resolve(ctx.$.expressionContext);
    await ctx.session.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: resolvedX,
      y: resolvedY,
    });
    ctx.session.mousePosition = { x: resolvedX, y: resolvedY };
  }
}

export const NaturalMoveOptionsSchema = ts.properties({
  curviness: ts.expression(ts.default(ts.number(), 0.5)),
  delay: ts.expression(ts.default(ts.number(), 0)),
  stepPrecision: ts.expression(ts.default(ts.number(), 20)),
  minSteps: ts.expression(ts.default(ts.number(), 10)),
  maxSteps: ts.expression(ts.default(ts.number(), 100)),
});

export const NaturalMoveSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
  options: NaturalMoveOptionsSchema,
});

export type NaturalMoveParams = ts.output<typeof NaturalMoveSchema>;

export const NaturalMoveParser = ts.into(
  NaturalMoveSchema,
  (v): IAction<Context> => new NaturalMove(v),
);

export class NaturalMove implements IAction<Context> {
  constructor(private params_: NaturalMoveParams) {}

  async execute(ctx: Context): Promise<void> {
    const moves = this.generateMoves(ctx);
    for (const move of moves) {
      await move.execute(ctx);
      const delay = Math.max(
        0,
        this.params_.options.delay.resolve(ctx.$.expressionContext),
      );
      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  generateMoves(ctx: Context): Move[] {
    const start = ctx.session.mousePosition;
    const [x, y] = this.params_.args;
    const resolvedX = x.resolve(ctx.$.expressionContext);
    const resolvedY = y.resolve(ctx.$.expressionContext);
    if (resolvedX === start.x && resolvedY === start.y) return [];

    const curviness = this.params_.options.curviness.resolve(
      ctx.$.expressionContext,
    );
    const minSteps = this.params_.options.minSteps.resolve(
      ctx.$.expressionContext,
    );
    const maxSteps = this.params_.options.maxSteps.resolve(
      ctx.$.expressionContext,
    );
    const stepPrecision = this.params_.options.stepPrecision.resolve(
      ctx.$.expressionContext,
    );

    const dx = resolvedX - start.x;
    const dy = resolvedY - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / length;
    const ny = dx / length;

    const arcDirection = Math.random() > 0.5 ? 1 : -1;
    const offset = curviness * length * arcDirection;
    const cOffset = 0.3 + Math.random() * 0.4;

    const curve = new Bezier(
      start,
      {
        x: start.x + dx * cOffset + nx * offset,
        y: start.y + dy * cOffset + ny * offset,
      },
      {
        x: resolvedX,
        y: resolvedY,
      },
    );

    const steps = Math.max(
      minSteps,
      Math.min(maxSteps, Math.floor(length / stepPrecision)),
    );
    const points = curve.getLUT(steps);
    return points.map(
      (point) =>
        new Move({
          args: [
            new ts.ResolvedExpression(Math.max(0, Math.round(point.x))),
            new ts.ResolvedExpression(Math.max(0, Math.round(point.y))),
          ],
        }),
    );
  }
}

export const ScrollSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
});

export type ScrollParams = ts.output<typeof ScrollSchema>;

export const ScrollParser = ts.into(
  ScrollSchema,
  (v): IAction<Context> => new Scroll(v),
);

export class Scroll implements IAction<Context> {
  constructor(private params_: ScrollParams) {}

  async execute(ctx: Context) {
    const [deltaX, deltaY] = this.params_.args;
    await ctx.session.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: ctx.session.mousePosition.x,
      y: ctx.session.mousePosition.y,
      deltaX: deltaX.resolve(ctx.$.expressionContext),
      deltaY: deltaY.resolve(ctx.$.expressionContext),
    });
  }
}

export const NaturalScrollOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
  stepPrecision: ts.expression(ts.default(ts.number(), 10)),
  minSteps: ts.expression(ts.default(ts.number(), 10)),
  maxSteps: ts.expression(ts.default(ts.number(), 100)),
});

export const NaturalScrollSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
  options: NaturalScrollOptionsSchema,
});

export type NaturalScrollParams = ts.output<typeof NaturalScrollSchema>;

export const NaturalScrollParser = ts.into(
  NaturalScrollSchema,
  (v): IAction<Context> => new NaturalScroll(v),
);

export class NaturalScroll implements IAction<Context> {
  constructor(private params_: NaturalScrollParams) {}

  async execute(ctx: Context) {
    const scrolls = this.generateScrolls(ctx);
    for (const scroll of scrolls) {
      await scroll.execute(ctx);
      const delay = Math.max(
        0,
        this.params_.options.delay.resolve(ctx.$.expressionContext),
      );
      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  generateScrolls(ctx: Context): Scroll[] {
    const endDeltaX = this.params_.args[0].resolve(ctx.$.expressionContext);
    const endDeltaY = this.params_.args[1].resolve(ctx.$.expressionContext);
    const scrolls = [];
    let ratio,
      prevRatio = 0;

    const minSteps = this.params_.options.minSteps.resolve(
      ctx.$.expressionContext,
    );
    const maxSteps = this.params_.options.maxSteps.resolve(
      ctx.$.expressionContext,
    );
    const stepPrecision = this.params_.options.stepPrecision.resolve(
      ctx.$.expressionContext,
    );
    const length = Math.sqrt(endDeltaX * endDeltaX + endDeltaY * endDeltaY);
    const steps = Math.max(
      minSteps,
      Math.min(maxSteps, Math.floor(length / stepPrecision)),
    );
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      ratio = 1 - Math.pow(1 - t, 3);

      const deltaX = endDeltaX * (ratio - prevRatio);
      const deltaY = endDeltaY * (ratio - prevRatio);

      const scroll = new Scroll({
        args: [
          new ts.ResolvedExpression(deltaX),
          new ts.ResolvedExpression(deltaY),
        ],
      });
      scrolls.push(scroll);

      prevRatio = ratio;
    }

    return scrolls;
  }
}

export const ButtonSchema = ts.enum([
  'none',
  'left',
  'middle',
  'right',
  'back',
  'forward',
]);

export type Button = ts.output<typeof ButtonSchema>;

export const PressOptionsSchema = ts.properties({
  button: ts.default(ButtonSchema, 'left'),
  clickCount: ts.expression(ts.default(ts.number(), 1)),
});

export const PressSchema = ts.node({
  options: PressOptionsSchema,
});

export type PressParams = ts.output<typeof PressSchema>;

export const PressParser = ts.into(
  PressSchema,
  (v): IAction<Context> => new Press(v),
);

export class Press implements IAction<Context> {
  constructor(private params_: PressParams) {}

  async execute(ctx: Context) {
    await ctx.session.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...ctx.session.mousePosition,
      button: this.params_.options.button,
      clickCount: this.params_.options.clickCount.resolve(
        ctx.$.expressionContext,
      ),
    });
  }
}

export const ReleaseSchemaOptions = ts.properties({
  button: ts.default(ButtonSchema, 'left'),
  clickCount: ts.expression(ts.default(ts.number(), 1)),
});

export const ReleaseSchema = ts.node({
  options: ReleaseSchemaOptions,
});

export type ReleaseParams = ts.output<typeof ReleaseSchema>;

export const ReleaseParser = ts.into(
  ReleaseSchema,
  (v): IAction<Context> => new Release(v),
);

export class Release implements IAction<Context> {
  constructor(private params_: ReleaseParams) {}

  async execute(ctx: Context) {
    await ctx.session.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...ctx.session.mousePosition,
      button: this.params_.options.button,
      clickCount: this.params_.options.clickCount.resolve(
        ctx.$.expressionContext,
      ),
    });
  }
}

export const ClickOptionsSchema = ts.properties({
  button: ts.default(ButtonSchema, 'left'),
  times: ts.expression(ts.default(ts.number(), 1)),
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const ClickSchema = ts.node({
  options: ClickOptionsSchema,
});

export type ClickParams = ts.output<typeof ClickSchema>;

export const ClickParser = ts.into(
  ClickSchema,
  (v): IAction<Context> => new Click(v),
);

export class Click implements IAction<Context> {
  constructor(private params_: ClickParams) {}

  async execute(ctx: Context) {
    const times = this.params_.options.times.resolve(ctx.$.expressionContext);
    for (let i = 1; i <= times; i++) {
      await new Press({
        options: {
          button: this.params_.options.button,
          clickCount: new ts.ResolvedExpression(i),
        },
      }).execute(ctx);
      const delay = Math.max(
        0,
        this.params_.options.delay.resolve(ctx.$.expressionContext),
      );
      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      await new Release({
        options: {
          button: this.params_.options.button,
          clickCount: new ts.ResolvedExpression(i),
        },
      }).execute(ctx);
    }
  }
}

export const Registry: ts.Registry<
  ts.Node,
  IAction<Context>,
  ts.Type<ts.Node, IAction<Context>>
> = new ts.Registry();

Registry.register('click', ClickParser)
  .register('natural_move', NaturalMoveParser)
  .register('natural_scroll', NaturalScrollParser)
  .register('move', MoveParser)
  .register('press', PressParser)
  .register('release', ReleaseParser)
  .register('scroll', ScrollParser);
