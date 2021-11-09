import { pushVerdictArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisCommandArguments } from '@redis/client/dist/lib/commands';

interface SynUpdateOptions {
    SKIPINITIALSCAN?: true;
}

export function transformArguments(
    index: string,
    groupId: string,
    terms: string | Array<string>,
    options?: SynUpdateOptions
): RedisCommandArguments {
    const args = ['FT.SYNUPDATE', index, groupId];

    if (options?.SKIPINITIALSCAN) {
        args.push('SKIPINITIALSCAN');
    }

    return pushVerdictArguments(args, terms);
}

export declare function transformReply(): 'OK';
