import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(key: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['WATCH'], key);
}

export declare function transformReply(): string;
