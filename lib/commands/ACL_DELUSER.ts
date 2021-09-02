import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export function transformArguments(username: string | Array<string>): Array<string> {
    return pushVerdictArguments(['ACL', 'DELUSER'], username);
}

export const transformReply = transformReplyNumber;
