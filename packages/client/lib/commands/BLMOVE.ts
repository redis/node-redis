import { RedisCommandArgument, RedisCommandArguments } from '.';
import { LMoveSide } from './LMOVE';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    sourceDirection: LMoveSide,
    destinationDirection: LMoveSide,
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
