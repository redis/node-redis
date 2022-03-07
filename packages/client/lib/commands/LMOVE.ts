import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export type LMoveSide = 'LEFT' | 'RIGHT';

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    sourceSide: LMoveSide,
    destinationSide: LMoveSide
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
