import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import {
  Timestamp,
  MRangeWithLabelsOptions,
  pushMRangeWithLabelsArguments,
  Filter,
} from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  filters: Filter,
  options?: MRangeWithLabelsOptions
): ValkeyCommandArguments {
  return pushMRangeWithLabelsArguments(
    ["TS.MREVRANGE"],
    fromTimestamp,
    toTimestamp,
    filters,
    options
  );
}

export { transformMRangeWithLabelsReply as transformReply } from ".";
