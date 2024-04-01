import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { GeoUnits } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  member1: ValkeyCommandArgument,
  member2: ValkeyCommandArgument,
  unit?: GeoUnits
): ValkeyCommandArguments {
  const args = ["GEODIST", key, member1, member2];

  if (unit) {
    args.push(unit);
  }

  return args;
}

export function transformReply(
  reply: ValkeyCommandArgument | null
): number | null {
  return reply === null ? null : Number(reply);
}
