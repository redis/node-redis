import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformStringNumberInfinityArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  min: ValkeyCommandArgument | number,
  max: ValkeyCommandArgument | number
): ValkeyCommandArguments {
  return [
    "ZREMRANGEBYLEX",
    key,
    transformStringNumberInfinityArgument(min),
    transformStringNumberInfinityArgument(max),
  ];
}

export declare function transformReply(): number;
