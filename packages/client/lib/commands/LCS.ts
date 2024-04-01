import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key1: ValkeyCommandArgument,
  key2: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["LCS", key1, key2];
}

export declare function transformReply(): string | Buffer;
