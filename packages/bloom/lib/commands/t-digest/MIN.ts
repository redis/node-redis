import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["TDIGEST.MIN", key];
}

export { transformDoubleReply as transformReply } from ".";
