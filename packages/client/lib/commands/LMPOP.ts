import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  transformLMPopArguments,
  LMPopOptions,
  ListSide,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  side: ListSide,
  options?: LMPopOptions
): ValkeyCommandArguments {
  return transformLMPopArguments(["LMPOP"], keys, side, options);
}

export declare function transformReply():
  | null
  | [key: string, elements: Array<string>];
