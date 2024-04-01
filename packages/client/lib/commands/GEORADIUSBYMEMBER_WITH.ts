import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoReplyWith,
  GeoSearchOptions,
  GeoUnits,
} from "./generic-transformers";
import { transformArguments as transformGeoRadiusArguments } from "./GEORADIUSBYMEMBER";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./GEORADIUSBYMEMBER";

export function transformArguments(
  key: ValkeyCommandArgument,
  member: string,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = transformGeoRadiusArguments(
    key,
    member,
    radius,
    unit,
    options
  );

  args.push(...replyWith);

  args.preserve = replyWith;

  return args;
}

export { transformGeoMembersWithReply as transformReply } from "./generic-transformers";
