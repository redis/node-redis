import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export function transformArguments(dictionary: string, term: string | Array<string>): RedisCommandArguments {
    return pushVariadicArguments(['FT.DICTDEL', dictionary], term);
}

export declare function transformReply(): number;
