import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { ScanOptions, pushScanArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  cursor: number,
  options?: ScanOptions
): ValkeyCommandArguments {
  return pushScanArguments(["HSCAN", key], cursor, options);
}

type HScanRawReply = [ValkeyCommandArgument, Array<ValkeyCommandArgument>];

export interface HScanTuple {
  field: ValkeyCommandArgument;
  value: ValkeyCommandArgument;
}

interface HScanReply {
  cursor: number;
  tuples: Array<HScanTuple>;
}

export function transformReply([cursor, rawTuples]: HScanRawReply): HScanReply {
  const parsedTuples = [];
  for (let i = 0; i < rawTuples.length; i += 2) {
    parsedTuples.push({
      field: rawTuples[i],
      value: rawTuples[i + 1],
    });
  }

  return {
    cursor: Number(cursor),
    tuples: parsedTuples,
  };
}
