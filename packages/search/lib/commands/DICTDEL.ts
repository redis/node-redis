import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { pushVerdictArguments } from '@node-redis/client/dist/lib/commands/generic-transformers';

export function transformArguments(dictionary: string, term: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['FT.DICTDEL', dictionary], term);
}

export declare function transformReply(): number;
