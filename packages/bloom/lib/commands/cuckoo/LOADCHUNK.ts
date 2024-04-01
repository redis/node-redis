import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  iterator: number,
  chunk: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["CF.LOADCHUNK", key, iterator.toString(), chunk];
}

export declare function transformReply(): "OK";
