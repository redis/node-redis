import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export interface LPosOptions {
  RANK?: number;
  MAXLEN?: number;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  element: ValkeyCommandArgument,
  options?: LPosOptions
): ValkeyCommandArguments {
  const args = ["LPOS", key, element];

  if (typeof options?.RANK === "number") {
    args.push("RANK", options.RANK.toString());
  }

  if (typeof options?.MAXLEN === "number") {
    args.push("MAXLEN", options.MAXLEN.toString());
  }

  return args;
}

export declare function transformReply(): number | null;
