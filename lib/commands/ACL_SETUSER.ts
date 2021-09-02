import { pushVerdictArguments, transformReplyString } from './generic-transformers';

export function transformArguments(username: string, rule: string | Array<string>): Array<string> {
    return pushVerdictArguments(['ACL', 'SETUSER', username], rule);
}

export const transformReply = transformReplyString;
