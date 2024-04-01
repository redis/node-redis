import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";
import { CompressionOption, pushCompressionArgument } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  options?: CompressionOption
): ValkeyCommandArguments {
  return pushCompressionArgument(["TDIGEST.CREATE", key], options);
}

export declare function transformReply(): "OK";
