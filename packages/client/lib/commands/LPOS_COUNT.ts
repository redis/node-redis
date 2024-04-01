import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { LPosOptions } from "./LPOS";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./LPOS";

export function transformArguments(
  key: ValkeyCommandArgument,
  element: ValkeyCommandArgument,
  count: number,
  options?: LPosOptions
): ValkeyCommandArguments {
  const args = ["LPOS", key, element];

  if (typeof options?.RANK === "number") {
    args.push("RANK", options.RANK.toString());
  }

  args.push("COUNT", count.toString());

  if (typeof options?.MAXLEN === "number") {
    args.push("MAXLEN", options.MAXLEN.toString());
  }

  return args;
}

export declare function transformReply(): Array<number>;
