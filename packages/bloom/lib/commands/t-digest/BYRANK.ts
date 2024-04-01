import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  ranks: Array<number>
): ValkeyCommandArguments {
  const args = ["TDIGEST.BYRANK", key];
  for (const rank of ranks) {
    args.push(rank.toString());
  }

  return args;
}

export { transformDoublesReply as transformReply } from ".";
