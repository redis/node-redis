import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { ListSide } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  source: ValkeyCommandArgument,
  destination: ValkeyCommandArgument,
  sourceDirection: ListSide,
  destinationDirection: ListSide,
  timeout: number
): ValkeyCommandArguments {
  return [
    "BLMOVE",
    source,
    destination,
    sourceDirection,
    destinationDirection,
    timeout.toString(),
  ];
}

export declare function transformReply(): ValkeyCommandArgument | null;
