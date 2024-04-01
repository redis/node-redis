import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { ScanOptions, pushScanArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  cursor: number,
  options?: ScanOptions
): ValkeyCommandArguments {
  return pushScanArguments(["SSCAN", key], cursor, options);
}

type SScanRawReply = [string, Array<ValkeyCommandArgument>];

interface SScanReply {
  cursor: number;
  members: Array<ValkeyCommandArgument>;
}

export function transformReply([cursor, members]: SScanRawReply): SScanReply {
  return {
    cursor: Number(cursor),
    members,
  };
}
