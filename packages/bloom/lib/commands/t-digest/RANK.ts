import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  values: Array<number>
): ValkeyCommandArguments {
  const args = ["TDIGEST.RANK", key];
  for (const item of values) {
    args.push(item.toString());
  }

  return args;
}

export declare function transformReply(): Array<number>;
