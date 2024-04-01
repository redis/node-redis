import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  GeoSearchFrom,
  GeoSearchBy,
  GeoSearchOptions,
  pushGeoSearchArguments,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  from: GeoSearchFrom,
  by: GeoSearchBy,
  options?: GeoSearchOptions
): ValkeyCommandArguments {
  return pushGeoSearchArguments(["GEOSEARCH"], key, from, by, options);
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
