import { RedisCommandArguments } from '.';
import { transformLMPopArguments, LMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
    keys: string | Array<string>,
    options: LMPopOptions
): RedisCommandArguments {
    return transformLMPopArguments(['LMPOP'], keys, options);
}

type LMPopReply = null | [
    key: string, 
    elements: Array<String>
];

export declare function transformReply(): LMPopReply;
