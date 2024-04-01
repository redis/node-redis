import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

interface XSetIdOptions {
  ENTRIESADDED?: number;
  MAXDELETEDID?: ValkeyCommandArgument;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  lastId: ValkeyCommandArgument,
  options?: XSetIdOptions
): ValkeyCommandArguments {
  const args = ["XSETID", key, lastId];

  if (options?.ENTRIESADDED) {
    args.push("ENTRIESADDED", options.ENTRIESADDED.toString());
  }

  if (options?.MAXDELETEDID) {
    args.push("MAXDELETEDID", options.MAXDELETEDID);
  }

  return args;
}

export declare function transformReply(): "OK";
