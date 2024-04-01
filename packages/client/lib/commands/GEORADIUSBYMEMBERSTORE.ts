import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoUnits,
  GeoRadiusStoreOptions,
  pushGeoRadiusStoreArguments,
} from "./generic-transformers";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./GEORADIUSBYMEMBER";

export function transformArguments(
  key: ValkeyCommandArgument,
  member: string,
  radius: number,
  unit: GeoUnits,
  destination: ValkeyCommandArgument,
  options?: GeoRadiusStoreOptions
): ValkeyCommandArguments {
  return pushGeoRadiusStoreArguments(
    ["GEORADIUSBYMEMBER"],
    key,
    member,
    radius,
    unit,
    destination,
    options
  );
}

export declare function transformReply(): number;
