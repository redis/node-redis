import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { ListSide } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  source: ValkeyCommandArgument,
  destination: ValkeyCommandArgument,
  sourceSide: ListSide,
  destinationSide: ListSide
): ValkeyCommandArguments {
  return ["LMOVE", source, destination, sourceSide, destinationSide];
}

export declare function transformReply(): ValkeyCommandArgument | null;
