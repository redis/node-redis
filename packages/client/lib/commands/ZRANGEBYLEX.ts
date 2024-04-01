import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformStringNumberInfinityArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export interface ZRangeByLexOptions {
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export function transformArguments(
  key: ValkeyCommandArgument,
  min: ValkeyCommandArgument,
  max: ValkeyCommandArgument,
  options?: ZRangeByLexOptions
): ValkeyCommandArguments {
  const args = [
    "ZRANGEBYLEX",
    key,
    transformStringNumberInfinityArgument(min),
    transformStringNumberInfinityArgument(max),
  ];

  if (options?.LIMIT) {
    args.push(
      "LIMIT",
      options.LIMIT.offset.toString(),
      options.LIMIT.count.toString()
    );
  }

  return args;
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
