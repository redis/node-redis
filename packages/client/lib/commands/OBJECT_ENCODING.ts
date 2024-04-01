import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["OBJECT", "ENCODING", key];
}

export declare function transformReply(): string | null;
