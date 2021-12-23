import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['GEOPOS', key], member);
}

type GeoCoordinatesRawReply = Array<[RedisCommandArgument, RedisCommandArgument] | null>;

interface GeoCoordinates {
    longitude: RedisCommandArgument;
    latitude: RedisCommandArgument;
}

export function transformReply(reply: GeoCoordinatesRawReply): Array<GeoCoordinates | null> {
    return reply.map(coordinates => coordinates === null ? null : {
        longitude: coordinates[0],
        latitude: coordinates[1]
    });
}
