import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVerdictArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    destKey: RedisCommandArgument,
    srcKeys: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(
        ['TS.MERGE', destKey],
        srcKeys
    );
}

export declare function transformReply(): 'OK';
