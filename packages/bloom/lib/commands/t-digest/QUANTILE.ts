import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  quantiles: Array<number>
): ValkeyCommandArguments {
  const args = ["TDIGEST.QUANTILE", key];

  for (const quantile of quantiles) {
    args.push(quantile.toString());
  }

  return args;
}

export { transformDoublesReply as transformReply } from ".";
