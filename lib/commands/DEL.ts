import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(keys: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['DEL'], keys);
}

export declare function transformReply(): number;
