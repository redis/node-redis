import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

interface XTrimOptions {
  strategyModifier?: "=" | "~";
  LIMIT?: number;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  strategy: "MAXLEN" | "MINID",
  threshold: number,
  options?: XTrimOptions
): ValkeyCommandArguments {
  const args = ["XTRIM", key, strategy];

  if (options?.strategyModifier) {
    args.push(options.strategyModifier);
  }

  args.push(threshold.toString());

  if (options?.LIMIT) {
    args.push("LIMIT", options.LIMIT.toString());
  }

  return args;
}

export declare function transformReply(): number;
