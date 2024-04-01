import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface CursorReadOptions {
  COUNT?: number;
}

export function transformArguments(
  index: ValkeyCommandArgument,
  cursor: number,
  options?: CursorReadOptions
): ValkeyCommandArguments {
  const args = ["FT.CURSOR", "READ", index, cursor.toString()];

  if (options?.COUNT) {
    args.push("COUNT", options.COUNT.toString());
  }

  return args;
}

export { transformReply } from "./AGGREGATE_WITHCURSOR";
