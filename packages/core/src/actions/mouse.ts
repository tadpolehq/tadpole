import { Bezier } from 'bezier-js';
import * as ts from '@tadpolehq/schema';
import type { IAction } from './base.js';
import type { SessionContext } from '../context.js';

export const BaseMouseMoveSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
});

export type MouseMoveParams = ts.output<typeof BaseMouseMoveSchema>;

export const MouseMoveParser = ts.into(
  BaseMouseMoveSchema,
  (v): IAction<SessionContext> => new MouseMove(v),
);

export class MouseMove implements IAction<SessionContext> {
  constructor(private params_: MouseMoveParams) {}

  async execute(ctx: SessionContext) {
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

export const MouseNaturalMoveOptionsSchema = ts.properties({
  curviness: ts.expression(ts.default(ts.number(), 0.5)),
  delay: ts.expression(ts.default(ts.number(), 0)),
  stepPrecision: ts.expression(ts.default(ts.number(), 20)),
  minSteps: ts.expression(ts.default(ts.number(), 10)),
  maxSteps: ts.expression(ts.default(ts.number(), 100)),
});

export const BaseMouseNaturalMoveSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
  options: MouseNaturalMoveOptionsSchema,
});

export type MouseNaturalMoveParams = ts.output<
  typeof BaseMouseNaturalMoveSchema
>;

export const MouseNaturalMoveParser = ts.into(
  BaseMouseNaturalMoveSchema,
  (v): IAction<SessionContext> => new MouseNaturalMove(v),
);

export class MouseNaturalMove implements IAction<SessionContext> {
  constructor(private params_: MouseNaturalMoveParams) {}

  async execute(ctx: SessionContext): Promise<void> {
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

  generateMoves(ctx: SessionContext): MouseMove[] {
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
        new MouseMove({
          args: [
            new ts.ResolvedExpression(Math.max(0, Math.round(point.x))),
            new ts.ResolvedExpression(Math.max(0, Math.round(point.y))),
          ],
        }),
    );
  }
}

export const BaseMouseScrollSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
});

export type MouseScrollParams = ts.output<typeof BaseMouseScrollSchema>;

export const MouseScrollParser = ts.into(
  BaseMouseScrollSchema,
  (v): IAction<SessionContext> => new MouseScroll(v),
);

export class MouseScroll implements IAction<SessionContext> {
  constructor(private params_: MouseScrollParams) {}

  async execute(ctx: SessionContext) {
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

export const MouseNaturalScrollOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
  stepPrecision: ts.expression(ts.default(ts.number(), 10)),
  minSteps: ts.expression(ts.default(ts.number(), 10)),
  maxSteps: ts.expression(ts.default(ts.number(), 100)),
});

export const BaseMouseNaturalScrollSchema = ts.node({
  args: ts.args([ts.expression(ts.number()), ts.expression(ts.number())]),
  options: MouseNaturalScrollOptionsSchema,
});

export type MouseNaturalScrollParams = ts.output<
  typeof BaseMouseNaturalScrollSchema
>;

export const MouseNaturalScrollParser = ts.into(
  BaseMouseNaturalScrollSchema,
  (v): IAction<SessionContext> => new MouseScroll(v),
);

export class MouseNaturalScroll implements IAction<SessionContext> {
  constructor(private params_: MouseNaturalScrollParams) {}

  async execute(ctx: SessionContext) {
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

  generateScrolls(ctx: SessionContext) {
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

      const scroll = new MouseScroll({
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

export const MouseButtonSchema = ts.enum([
  'none',
  'left',
  'middle',
  'right',
  'back',
  'forward',
]);

export type MouseButton = ts.output<typeof MouseButtonSchema>;

export const MousePressOptionsSchema = ts.properties({
  button: ts.default(MouseButtonSchema, 'left'),
  clickCount: ts.expression(ts.default(ts.number(), 1)),
});

export const BaseMousePressSchema = ts.node({
  options: MousePressOptionsSchema,
});

export type MousePressParams = ts.output<typeof BaseMousePressSchema>;

export const MousePressParser = ts.into(
  BaseMousePressSchema,
  (v): IAction<SessionContext> => new MousePress(v),
);

export class MousePress implements IAction<SessionContext> {
  constructor(private params_: MousePressParams) {}

  async execute(ctx: SessionContext) {
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

export const MouseReleaseSchemaOptions = ts.properties({
  button: ts.default(MouseButtonSchema, 'left'),
  clickCount: ts.expression(ts.default(ts.number(), 1)),
});

export const BaseMouseReleaseSchema = ts.node({
  options: MouseReleaseSchemaOptions,
});

export type MouseReleaseParams = ts.output<typeof BaseMouseReleaseSchema>;

export const MouseReleaseParser = ts.into(
  BaseMouseReleaseSchema,
  (v): IAction<SessionContext> => new MouseRelease(v),
);

export class MouseRelease implements IAction<SessionContext> {
  constructor(private params_: MouseReleaseParams) {}

  async execute(ctx: SessionContext) {
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

export const MouseClickOptionsSchema = ts.properties({
  button: ts.default(MouseButtonSchema, 'left'),
  times: ts.expression(ts.default(ts.number(), 1)),
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const BaseMouseClickSchema = ts.node({
  options: MouseClickOptionsSchema,
});

export type MouseClickParams = ts.output<typeof BaseMouseClickSchema>;

export const MouseClickParser = ts.into(
  BaseMouseClickSchema,
  (v): IAction<SessionContext> => new MouseClick(v),
);

export class MouseClick implements IAction<SessionContext> {
  constructor(private params_: MouseClickParams) {}

  async execute(ctx: SessionContext) {
    const times = this.params_.options.times.resolve(ctx.$.expressionContext);
    for (let i = 1; i <= times; i++) {
      await new MousePress({
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
      await new MouseRelease({
        options: {
          button: this.params_.options.button,
          clickCount: new ts.ResolvedExpression(i),
        },
      }).execute(ctx);
    }
  }
}

export const MouseRegistry: ts.Registry<
  ts.Node,
  IAction<SessionContext>,
  ts.Type<ts.Node, IAction<SessionContext>>
> = new ts.Registry();

MouseRegistry.register('click', MouseClickParser)
  .register('natural_move', MouseNaturalMoveParser)
  .register('natural_scroll', MouseNaturalScrollParser)
  .register('move', MouseMoveParser)
  .register('press', MousePressParser)
  .register('release', MouseReleaseParser)
  .register('scroll', MouseScrollParser);
