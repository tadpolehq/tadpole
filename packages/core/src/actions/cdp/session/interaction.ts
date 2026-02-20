import * as ts from '@tadpolehq/schema';
import type { IAction } from '@/actions/base.js';
import * as cdp from '@/cdp/index.js';
import { clampDelta, withPrefix } from '@/utils.js';
import type { Context } from './base.js';
import * as keyboard from './keyboard.js';
import * as mouse from './mouse.js';

export const HoverSchema = (prefix?: string) =>
  ts.node({
    move: mouse.NaturalMoveOptionsSchema.prefix(withPrefix(prefix, 'move.')),
    scroll: mouse.NaturalScrollOptionsSchema.prefix(
      withPrefix(prefix, 'scroll.'),
    ),
  });

export type HoverParams = ts.output<ReturnType<typeof HoverSchema>>;

export const HoverParser = ts.into(
  HoverSchema(),
  (v): IAction<Context> => new Hover(v),
);

export class Hover implements IAction<Context> {
  constructor(private params_: HoverParams) {}

  async execute(ctx: Context) {
    const activeNode = await ctx.session.activeNode();
    if (activeNode.isCollection)
      throw new Error('hover cannot be called on a node collection.');

    const params = { objectId: activeNode.remoteObjectId };
    const { model: boxModel } = await ctx.session.send<{
      model: cdp.types.DOM.BoxModel;
    }>('DOM.getBoxModel', params);
    const { cssLayoutViewport, cssContentSize } =
      await ctx.session.send<cdp.types.Page.LayoutMetrics>(
        'Page.getLayoutMetrics',
      );
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
      const mouseScroll = new mouse.NaturalScroll({
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

    const mouseMove = new mouse.NaturalMove({
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

export const ClickSchema = (prefix?: string) =>
  ts.node({
    options: ClickOptionsSchema.prefix(prefix),
    hover: HoverSchema(withPrefix(prefix, 'hover.')),
    mouseClick: mouse.ClickOptionsSchema.prefix(
      withPrefix(prefix, 'mouseclick.'),
    ),
  });

export type ClickParams = ts.output<ReturnType<typeof ClickSchema>>;

export const ClickParser = ts.into(
  ClickSchema(),
  (v): IAction<Context> => new Click(v),
);

export class Click implements IAction<Context> {
  private hover_: Hover;
  private click_: mouse.Click;

  constructor(private params_: ClickParams) {
    this.hover_ = new Hover({ ...this.params_.hover });
    this.click_ = new mouse.Click({ options: this.params_.mouseClick });
  }

  async execute(ctx: Context) {
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

export const TypeSchema = (prefix?: string) =>
  ts.node({
    args: ts.args([ts.expression(ts.string())]),
    options: TypeOptionsSchema.prefix(prefix),
    click: ClickSchema(withPrefix(prefix, 'click.')),
    keyboardType: keyboard.TypeOptionsSchema.prefix(
      withPrefix(prefix, 'keyboardtype.'),
    ),
  });

export type TypeParams = ts.output<ReturnType<typeof TypeSchema>>;

export const TypeParser = ts.into(
  TypeSchema(),
  (v): IAction<Context> => new Type(v),
);

export class Type implements IAction<Context> {
  private click_: Click;
  private type_: keyboard.Type;

  constructor(private params_: TypeParams) {
    const [text] = this.params_.args;
    this.click_ = new Click({ ...this.params_.click });
    this.type_ = new keyboard.Type({
      args: [text],
      options: this.params_.keyboardType,
    });
  }

  async execute(ctx: Context) {
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
