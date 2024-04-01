import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { Timestamp, transformTimestampArgument } from ".";

export const FIRTS_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp
): ValkeyCommandArguments {
  return [
    "TS.DEL",
    key,
    transformTimestampArgument(fromTimestamp),
    transformTimestampArgument(toTimestamp),
  ];
}

export declare function transformReply(): number;
