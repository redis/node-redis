import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoSearchOptions,
  GeoCoordinates,
  pushGeoRadiusArguments,
  GeoUnits,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  coordinates: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
): ValkeyCommandArguments {
  return pushGeoRadiusArguments(
    ["GEORADIUS"],
    key,
    coordinates,
    radius,
    unit,
    options
  );
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
