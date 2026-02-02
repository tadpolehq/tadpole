import * as ts from '@tadpolehq/schema';
import { Root } from './root.js';

export * from './actions/index.js';
export { Def, DefSchema, type DefExecuteParams } from './def.js';

export function execute(
  filePath: string,
  loader?: ts.ILoader,
  slotStack?: ts.ISlotStack,
  rootSlot?: ts.Node[],
) {
  slotStack = slotStack ?? new ts.SlotStack();
  if (rootSlot) slotStack?.pushSlot(rootSlot);

  return Root.executeFile(
    filePath,
    loader ?? new ts.Loader('tadpole'),
    slotStack,
  );
}

export { Root };
