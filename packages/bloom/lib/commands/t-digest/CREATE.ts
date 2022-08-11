import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    compression?: number
): RedisCommandArguments {
    const args = [
        'TDIGEST.CREATE',
        key
    ];

    if (compression) {
        args.push(compression.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
