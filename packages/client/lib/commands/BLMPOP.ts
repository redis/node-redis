import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  transformLMPopArguments,
  LMPopOptions,
  ListSide,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
  timeout: number,
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  side: ListSide,
  options?: LMPopOptions
): ValkeyCommandArguments {
  return transformLMPopArguments(
    ["BLMPOP", timeout.toString()],
    keys,
    side,
    options
  );
}

export { transformReply } from "./LMPOP";
