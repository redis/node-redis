import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ListSide } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    sourceSide: ListSide,
    destinationSide: ListSide
): RedisCommandArguments {
    return [
        'LMOVE',
        source,
        destination,
        sourceSide,
        destinationSide,
    ];
}

export declare function transformReply(): RedisCommandArgument | null;
