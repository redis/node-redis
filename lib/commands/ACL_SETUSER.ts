import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(username: string, rule: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['ACL', 'SETUSER', username], rule);
}

export declare function transformReply(): string;
