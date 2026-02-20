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
