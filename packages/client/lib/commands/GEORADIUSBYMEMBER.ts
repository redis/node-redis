import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoSearchOptions,
  pushGeoRadiusArguments,
  GeoUnits,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  member: string,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
): ValkeyCommandArguments {
  return pushGeoRadiusArguments(
    ["GEORADIUSBYMEMBER"],
    key,
    member,
    radius,
    unit,
    options
  );
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
