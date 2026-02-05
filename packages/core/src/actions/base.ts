import {
  Registry,
  type IRegistry,
  type ExpressionContext,
  type Node,
  type Type,
} from '@tadpolehq/schema';
import type { BrowserContext, SessionContext } from '../context.js';

/**
 * Interface for actions.
 */
export interface IAction<TCtx> {
  /**
   * Executes the action with the provided context.
   * @param ctx The action context.
   */
  execute(ctx: TCtx): Promise<void>;
}

export interface IEvaluator {
  toJS(input: string, ctx: ExpressionContext): string;
}

export const BrowserActionRegistry: IRegistry<
  Node,
  IAction<BrowserContext>,
  Type<Node, IAction<BrowserContext>>
> = new Registry();
export const SessionActionRegistry: IRegistry<
  Node,
  IAction<SessionContext>,
  Type<Node, IAction<SessionContext>>
> = new Registry({ parent: BrowserActionRegistry });
export const EvaluatorRegistry: IRegistry<
  Node,
  IEvaluator,
  Type<Node, IEvaluator>
> = new Registry();
