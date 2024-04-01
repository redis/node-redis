import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoCoordinates,
  GeoUnits,
  GeoRadiusStoreOptions,
  pushGeoRadiusStoreArguments,
} from "./generic-transformers";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./GEORADIUS";

export function transformArguments(
  key: ValkeyCommandArgument,
  coordinates: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  destination: ValkeyCommandArgument,
  options?: GeoRadiusStoreOptions
): ValkeyCommandArguments {
  return pushGeoRadiusStoreArguments(
    ["GEORADIUS"],
    key,
    coordinates,
    radius,
    unit,
    destination,
    options
  );
}

export declare function transformReply(): number;
