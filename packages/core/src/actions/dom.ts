import * as ts from '@tadpolehq/schema';
import { v4 as uuidv4 } from 'uuid';
import {
  EvaluatorRegistry,
  SessionActionRegistry,
  type IAction,
} from './base.js';
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
import { Node } from '../node.js';
import { DOM, Page, Runtime } from '../types/index.js';
import { withPrefix } from '../utils.js';

async function getActiveNode(ctx: SessionContext): Promise<Node> {
  if (ctx.session.activeNode !== null) {
    ctx.$.log.debug(
      `Using context objectId=${ctx.session.activeNode.remoteObjectId}`,
    );
    return ctx.session.activeNode;
  }

  ctx.$.log.debug(
    "No node active in context, calling 'Runtime.evaluate' to fetch 'document'",
  );
  const { result } = await ctx.session.send<{ result: Runtime.RemoteObject }>(
    'Runtime.evaluate',
    {
      expression: 'document',
    },
  );

  if (result.objectId === undefined) {
    // TODO: Better errors
    ctx.$.log.error("'document' objectId is undefined.");
    throw new Error("'document' objectId is undefined.");
  }

  ctx.$.log.debug(`Retrieved objectId=${result.objectId} for document.`);
  return new Node({ remoteObjectId: result.objectId });
}

function clampDelta(
  currentPos: number,
  targetPos: number,
  viewportSize: number,
  contentSize: number,
) {
  const maxScroll = Math.max(0, contentSize - viewportSize);
  const clampedTarget = Math.max(0, Math.min(maxScroll, targetPos));
  return clampedTarget - currentPos;
}

export const createDOMHoverSchema = (prefix?: string) =>
  ts.node({
    move: MouseNaturalMoveOptionsSchema.prefix(withPrefix(prefix, 'move.')),
    scroll: MouseNaturalScrollOptionsSchema.prefix(
      withPrefix(prefix, 'scroll.'),
    ),
  });

export const BaseDOMHoverSchema = createDOMHoverSchema();

export type DOMHoverParams = ts.output<typeof BaseDOMHoverSchema>;

export const DOMHoverParser = ts.into(
  BaseDOMHoverSchema,
  (v): IAction<SessionContext> => new DOMHover(v),
);

export class DOMHover implements IAction<SessionContext> {
  constructor(private params_: DOMHoverParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await getActiveNode(ctx);
    if (activeNode.isCollection)
      throw new Error('hover cannot be called on a node collection.');
    const params = { objectId: activeNode.remoteObjectId };
    ctx.$.log.debug(
      `Calling 'DOM.getBoxModel' with params ${JSON.stringify(params)}`,
    );
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

export const DOMClickOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const createDOMClickSchema = (prefix?: string) =>
  ts.node({
    options: DOMClickOptionsSchema.prefix(prefix),
    hover: createDOMHoverSchema(withPrefix(prefix, 'hover.')),
    mouseClick: MouseClickOptionsSchema.prefix(
      withPrefix(prefix, 'mouseclick.'),
    ),
  });

export const BaseDOMClickSchema = createDOMClickSchema();

export type DOMClickParams = ts.output<typeof BaseDOMClickSchema>;

export const DOMClickParser = ts.into(
  BaseDOMClickSchema,
  (v): IAction<SessionContext> => new DOMClick(v),
);

export class DOMClick implements IAction<SessionContext> {
  private hover_: DOMHover;
  private click_: MouseClick;

  constructor(private params_: DOMClickParams) {
    this.hover_ = new DOMHover({ ...this.params_.hover });
    this.click_ = new MouseClick({ options: this.params_.mouseClick });
  }

  async execute(ctx: SessionContext) {
    await this.hover_.execute(ctx);
    const delay = Math.max(
      0,
      this.params_.options.delay.resolve(ctx.$.expressionContext),
    );
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await this.click_.execute(ctx);
  }
}

export const DOMTypeOptionsSchema = ts.properties({
  delay: ts.expression(ts.default(ts.number(), 0)),
});

export const createDOMTypeSchema = (prefix?: string) =>
  ts.node({
    args: ts.args([ts.expression(ts.string())]),
    options: DOMTypeOptionsSchema.prefix(prefix),
    click: createDOMClickSchema(withPrefix(prefix, 'click.')),
    keyboardType: KeyboardTypeOptionsSchema.prefix(
      withPrefix(prefix, 'keyboardtype.'),
    ),
  });

export const BaseDOMTypeSchema = createDOMTypeSchema();

export type DOMTypeParams = ts.output<typeof BaseDOMTypeSchema>;

export const DOMTypeParser = ts.into(
  BaseDOMTypeSchema,
  (v): IAction<SessionContext> => new DOMType(v),
);

export class DOMType implements IAction<SessionContext> {
  private click_: DOMClick;
  private type_: KeyboardType;

  constructor(private params_: DOMTypeParams) {
    const [text] = this.params_.args;
    this.click_ = new DOMClick({ ...this.params_.click });
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
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await this.type_.execute(ctx);
  }
}

export const BaseDOMExtractSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  fields: ts.slot(
    ts.childrenRecord(
      ts.node({ evaluators: ts.children(ts.anyOf(EvaluatorRegistry)) }),
    ),
  ),
});

export type DOMExtractParams = ts.output<typeof BaseDOMExtractSchema>;

export const DOMExtractParser = ts.into(
  BaseDOMExtractSchema,
  (v): IAction<SessionContext> => new DOMExtract(v),
);

export class DOMExtract implements IAction<SessionContext> {
  constructor(private params_: DOMExtractParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await getActiveNode(ctx);

    const extractMap = Array.from(this.params_.fields.entries())
      .map(
        ([key, { evaluators }]) =>
          `${key}: ${evaluators.reduce(
            (input, evaluator) => evaluator.toJS(input),
            'e',
          )}`,
      )
      .join(',');
    const functionBody = activeNode.isCollection
      ? `return Array.from(this).map(e => ({${extractMap}}));`
      : `const e = this; return {${extractMap}};`;
    const functionDeclaration = `function() {${functionBody}}`;
    const params = {
      objectId: activeNode.remoteObjectId,
      functionDeclaration,
      returnByValue: true,
    };

    ctx.$.log.debug(
      `Calling 'Runtime.callFunctionOn' with params=${JSON.stringify(params)}`,
    );
    const { result, exceptionDetails } = await ctx.session.send<{
      result: Runtime.RemoteObject;
      exceptionDetails?: Runtime.ExceptionDetails;
    }>('Runtime.callFunctionOn', params);

    if (exceptionDetails) {
      // TODO: Better error handling
      ctx.$.log.error(
        `Encountered error running JavaScript ${functionDeclaration}: ${exceptionDetails.text}`,
      );
      throw new Error(exceptionDetails.text);
    }

    ctx.$.log.debug(`Extract result: ${JSON.stringify(result.value)}`);
    const [path] = this.params_.args;
    ctx.$.updateOutputAtPath(
      result.value,
      path.resolve(ctx.$.expressionContext),
    );
  }
}

export const BaseDOMForEachSchema = ts.node({
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type DOMForEachParams = ts.output<typeof BaseDOMForEachSchema>;

export const DOMForEachParser = ts.into(
  BaseDOMForEachSchema,
  (v): IAction<SessionContext> => new DOMForEach(v),
);

export class DOMForEach implements IAction<SessionContext> {
  constructor(private params_: DOMForEachParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await getActiveNode(ctx);
    if (!activeNode.isCollection)
      throw new Error('forEach can only be called on a node collection');

    const params = {
      objectId: activeNode.remoteObjectId,
      ownProperties: true,
    };
    ctx.$.log.debug(
      `Calling 'Runtime.getProperties' with params=${JSON.stringify(params)}`,
    );
    const { result } = await ctx.session.send<{
      result: Runtime.PropertyDescriptor[];
    }>('Runtime.getProperties', params);

    for (const prop of result) {
      if (isNaN(Number(prop.name))) continue;

      if (!prop.value?.objectId) continue;

      ctx.session.pushNode(new Node({ remoteObjectId: prop.value.objectId }));
      try {
        for (const action of this.params_.execute) {
          await action.execute(ctx);
        }
      } finally {
        ctx.session.popActiveNode();
      }
    }
  }
}

export const BaseDOMQuerySelectorSchema = ts.node({
  args: ts.args([ts.expression(ts.string())]),
  execute: ts.slot(ts.children(ts.anyOf(SessionActionRegistry))),
});

export type DOMQuerySelectorParams = ts.output<
  typeof BaseDOMQuerySelectorSchema
>;

export const DOMQuerySelectorParser = ts.into(
  BaseDOMQuerySelectorSchema,
  (v): IAction<SessionContext> => new DOMQuerySelector(v),
);

abstract class BaseDOMQuerySelector implements IAction<SessionContext> {
  constructor(private params_: DOMQuerySelectorParams) {}

  async execute(ctx: SessionContext) {
    const activeNode = await getActiveNode(ctx);
    if (activeNode.isCollection)
      throw new Error('querySelectors cannot be called on a node collection.');
    const functionDeclaration = `function(selector) { return ${this.functionExpression}; }`;
    const objectGroup = uuidv4();
    const [selector] = this.params_.args;
    const params = {
      objectId: activeNode.remoteObjectId,
      functionDeclaration,
      arguments: [
        {
          value: selector.resolve(ctx.$.expressionContext),
        },
      ],
      objectGroup,
    };

    ctx.$.log.debug(
      `Calling 'Runtime.callFunctionOn' with params=${JSON.stringify(params)}`,
    );
    const { result, exceptionDetails } = await ctx.session.send<{
      result: Runtime.RemoteObject;
      exceptionDetails?: Runtime.ExceptionDetails;
    }>('Runtime.callFunctionOn', params);

    if (exceptionDetails) {
      // TODO: Better error handling
      ctx.$.log.error(
        `Encountered error running JavaScript ${functionDeclaration}: ${exceptionDetails.text}`,
      );
      throw new Error(exceptionDetails.text);
    }

    if (!result.objectId) {
      ctx.$.log.warn(`No element found for selector: ${selector}`);
      return;
    }

    ctx.$.log.debug(
      `Retrieved remoteObject(objectId=${result.objectId}) for selector=${selector}`,
    );
    ctx.session.pushNode(
      new Node({
        remoteObjectId: result.objectId,
        isCollection: this.isCollection,
      }),
    );
    try {
      for (const action of this.params_.execute) {
        await action.execute(ctx);
      }
    } finally {
      ctx.session.popActiveNode();
      try {
        await ctx.session.send('Runtime.releaseObjectGroup', { objectGroup });
      } catch {
        ctx.$.log.warn(`Error releasing objectGroup=${objectGroup}`);
      }
    }
  }

  protected abstract get functionExpression(): string;
  protected abstract get isCollection(): boolean;
}

export class DOMQuerySelector extends BaseDOMQuerySelector {
  override get functionExpression() {
    return 'this.querySelector(selector)';
  }

  override get isCollection() {
    return false;
  }
}

export const DOMQuerySelectorAllParser = ts.into(
  BaseDOMQuerySelectorSchema,
  (v): IAction<SessionContext> => new DOMQuerySelectorAll(v),
);

export class DOMQuerySelectorAll extends BaseDOMQuerySelector {
  override get functionExpression() {
    return 'this.querySelectorAll(selector)';
  }

  override get isCollection() {
    return true;
  }
}
