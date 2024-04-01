import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  SortedSetSide,
  transformZMPopArguments,
  ZMPopOptions,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
  timeout: number,
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  side: SortedSetSide,
  options?: ZMPopOptions
): ValkeyCommandArguments {
  return transformZMPopArguments(
    ["BZMPOP", timeout.toString()],
    keys,
    side,
    options
  );
}

export { transformReply } from "./ZMPOP";
