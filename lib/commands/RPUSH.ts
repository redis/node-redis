import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, element: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['RPUSH', key], element);
}

export const transformReply = transformReplyNumber;
