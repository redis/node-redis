import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export function transformArguments(username: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['ACL', 'DELUSER'], username);
}

export const transformReply = transformReplyNumber;
