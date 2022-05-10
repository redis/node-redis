import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ListSide } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    sourceDirection: ListSide,
    destinationDirection: ListSide,
    timeout: number
): RedisCommandArguments {
    return [
        'BLMOVE',
        source,
        destination,
        sourceDirection,
        destinationDirection,
        timeout.toString()
    ];
}

export declare function transformReply(): RedisCommandArgument | null;
