import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyString } from './generic-transformers';

export function transformArguments(key: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['WATCH'], key);
}

export const transformReply = transformReplyString;
