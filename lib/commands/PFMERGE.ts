import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, source: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['PFMERGE', destination], source);
}

export declare function transformReply(): string;
