import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['SINTERSTORE', destination], keys);
}

export const transformReply = transformReplyStringArray;
