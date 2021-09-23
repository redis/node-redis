import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyString } from './generic-transformers';

export function transformArguments(username: string, rule: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['ACL', 'SETUSER', username], rule);
}

export const transformReply = transformReplyString;
