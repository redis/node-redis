import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVerdictArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface MergeStoreOptions {
    COMPRESSION?: number;
}

export function transformArguments(
    destKey: RedisCommandArgument,
    srcKeys: RedisCommandArgument | Array<RedisCommandArgument>,
    options?: MergeStoreOptions
): RedisCommandArguments {
    let args = [
        'TS.MERGESTORE',
        destKey,
    ];

    args = pushVerdictArgument(args, srcKeys);

    if (options?.COMPRESSION) {
        args.push('COMPRESSION', options.COMPRESSION.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
