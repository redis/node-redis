import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

interface ZUnionOptions {
  WEIGHTS?: Array<number>;
  AGGREGATE?: "SUM" | "MIN" | "MAX";
}

export function transformArguments(
  destination: ValkeyCommandArgument,
  keys: Array<ValkeyCommandArgument> | ValkeyCommandArgument,
  options?: ZUnionOptions
): ValkeyCommandArguments {
  const args = pushVerdictArgument(["ZUNIONSTORE", destination], keys);

  if (options?.WEIGHTS) {
    args.push("WEIGHTS", ...options.WEIGHTS.map((weight) => weight.toString()));
  }

  if (options?.AGGREGATE) {
    args.push("AGGREGATE", options.AGGREGATE);
  }

  return args;
}

export declare function transformReply(): number;
