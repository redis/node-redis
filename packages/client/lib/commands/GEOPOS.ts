import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  member: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["GEOPOS", key], member);
}

type GeoCoordinatesRawReply = Array<
  [ValkeyCommandArgument, ValkeyCommandArgument] | null
>;

interface GeoCoordinates {
  longitude: ValkeyCommandArgument;
  latitude: ValkeyCommandArgument;
}

export function transformReply(
  reply: GeoCoordinatesRawReply
): Array<GeoCoordinates | null> {
  return reply.map((coordinates) =>
    coordinates === null
      ? null
      : {
          longitude: coordinates[0],
          latitude: coordinates[1],
        }
  );
}
