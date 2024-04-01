import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  lowCutPercentile: number,
  highCutPercentile: number
): ValkeyCommandArguments {
  return [
    "TDIGEST.TRIMMED_MEAN",
    key,
    lowCutPercentile.toString(),
    highCutPercentile.toString(),
  ];
}

export { transformDoubleReply as transformReply } from ".";
