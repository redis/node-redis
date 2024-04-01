import { ValkeyCommandArgument } from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  index: ValkeyCommandArgument,
  cursorId: number
) {
  return ["FT.CURSOR", "DEL", index, cursorId.toString()];
}

export declare function transformReply(): "OK";
