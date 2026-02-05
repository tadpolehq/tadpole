import * as ts from '@tadpolehq/schema';
import type { IAction } from './base.js';
import { KeyboardType, KeyboardTypeOptionsSchema } from './keyboard.js';
import {
  MouseClick,
  MouseClickOptionsSchema,
  MouseNaturalMove,
  MouseNaturalMoveOptionsSchema,
  MouseNaturalScroll,
  MouseNaturalScrollOptionsSchema,
} from './mouse.js';
import type { SessionContext } from '../context.js';
import { DOM, Page } from '../types/index.js';
import { clampDelta, withPrefix } from '../utils.js';

export const createHoverSchema = (prefix?: string) =>
  ts.node({
    move: MouseNaturalMoveOptionsSchema.prefix(withPrefix(prefix, 'move.')),
    scroll: MouseNaturalScrollOptionsSchema.prefix(
      withPrefix(prefix, 'scroll.'),
    ),
  });

export const BaseHoverSchema = createHoverSchema();

export type HoverParams = ts.output<typeof BaseHoverSchema>;

export const HoverParser = ts.into(
  BaseHoverSchema,
  (v): IAction<SessionContext> => new Hover(v),
);

export class Hover implements IAction<SessionContext> {
  constructor(private params_: HoverParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await ctx.session.activeNode();
    if (activeNode.isCollection)
      throw new Error('hover cannot be called on a node collection.');

    const params = { objectId: activeNode.remoteObjectId };
    const { model: boxModel } = await ctx.session.send<{ model: DOM.BoxModel }>(
      'DOM.getBoxModel',
      params,
    );
    const { cssLayoutViewport, cssContentSize } =
      await ctx.session.send<Page.LayoutMetrics>('Page.getLayoutMetrics');
    const nodeX =
      cssLayoutViewport.pageX +
      boxModel.content[0] +
      boxModel.width * (0.3 + Math.random() * 0.4);
    const nodeY =
      cssLayoutViewport.pageY +
      boxModel.content[1] +
      boxModel.height * (0.3 + Math.random() * 0.4);
    ctx.$.log.debug(
      `Calculated position for objectId=${activeNode} (x = ${nodeX}, y = ${nodeY})`,
    );

    const targetX =
      nodeX - cssLayoutViewport.clientWidth * (0.3 + Math.random() * 0.4);
    const targetY =
      nodeY - cssLayoutViewport.clientHeight * (0.3 + Math.random() * 0.4);

    const deltaX = clampDelta(
      cssLayoutViewport.pageX,
      targetX,
      cssLayoutViewport.clientWidth,
      cssContentSize.width,
    );
    const deltaY = clampDelta(
      cssLayoutViewport.pageY,
      targetY,
      cssLayoutViewport.clientHeight,
      cssContentSize.height,
    );

    ctx.$.log.debug(
      `Calculated delta for moving node into view: (x = ${deltaX}, y = ${deltaY})`,
    );
    // TODO: Allow changing of min diff to trigger scroll
    let viewportX, viewportY;
    if (Math.abs(deltaX) >= 100 || Math.abs(deltaY) >= 100) {
      const mouseScroll = new MouseNaturalScroll({
        args: [
          new ts.ResolvedExpression(deltaX),
          new ts.ResolvedExpression(deltaY),
        ],
        options: this.params_.scroll,
      });
      await mouseScroll.execute(ctx);
      viewportX = nodeX - (cssLayoutViewport.pageX + deltaX);
      viewportY = nodeY - (cssLayoutViewport.pageY + deltaY);
    } else {
      viewportX = nodeX - cssLayoutViewport.pageX;
      viewportY = nodeY - cssLayoutViewport.pageY;
    }

    const mouseMove = new MouseNaturalMove({
      args: [
        new ts.ResolvedExpression(viewportX),
        new ts.ResolvedExpression(viewportY),
      ],
      options: this.params_.move,
    });
    await mouseMove.execute(ctx);
  }
}

export const ClickOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const createClickSchema = (prefix?: string) =>
  ts.node({
    options: ClickOptionsSchema.prefix(prefix),
    hover: createHoverSchema(withPrefix(prefix, 'hover.')),
    mouseClick: MouseClickOptionsSchema.prefix(
      withPrefix(prefix, 'mouseclick.'),
    ),
  });

export const BaseClickSchema = createClickSchema();

export type ClickParams = ts.output<typeof BaseClickSchema>;

export const ClickParser = ts.into(
  BaseClickSchema,
  (v): IAction<SessionContext> => new Click(v),
);

export class Click implements IAction<SessionContext> {
  private hover_: Hover;
  private click_: MouseClick;

  constructor(private params_: ClickParams) {
    this.hover_ = new Hover({ ...this.params_.hover });
    this.click_ = new MouseClick({ options: this.params_.mouseClick });
  }

  async execute(ctx: SessionContext) {
    await this.hover_.execute(ctx);
    const delay = Math.max(
      0,
      this.params_.options.delay.resolve(ctx.$.expressionContext),
    );
    if (delay) {
      ctx.$.log.debug(`Sleeping for ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await this.click_.execute(ctx);
  }
}

export const TypeOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const createTypeSchema = (prefix?: string) =>
  ts.node({
    args: ts.args([ts.expression(ts.string())]),
    options: TypeOptionsSchema.prefix(prefix),
    click: createClickSchema(withPrefix(prefix, 'click.')),
    keyboardType: KeyboardTypeOptionsSchema.prefix(
      withPrefix(prefix, 'keyboardtype.'),
    ),
  });

export const BaseTypeSchema = createTypeSchema();

export type TypeParams = ts.output<typeof BaseTypeSchema>;

export const TypeParser = ts.into(
  BaseTypeSchema,
  (v): IAction<SessionContext> => new Type(v),
);

export class Type implements IAction<SessionContext> {
  private click_: Click;
  private type_: KeyboardType;

  constructor(private params_: TypeParams) {
    const [text] = this.params_.args;
    this.click_ = new Click({ ...this.params_.click });
    this.type_ = new KeyboardType({
      args: [text],
      options: this.params_.keyboardType,
    });
  }

  async execute(ctx: SessionContext) {
    await this.click_.execute(ctx);
    const delay = Math.max(
      0,
      this.params_.options.delay.resolve(ctx.$.expressionContext),
    );
    if (delay) {
      ctx.$.log.debug(`Sleeping for ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await this.type_.execute(ctx);
  }
}
