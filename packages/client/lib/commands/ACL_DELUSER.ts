import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(username: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['ACL', 'DELUSER'], username);
}

export declare const transformReply: (reply: number) => number;
