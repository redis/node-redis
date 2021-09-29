import { TransformArgumentsReply } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(username: string, rule: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['ACL', 'SETUSER', username], rule);
}

export declare function transformReply(): string;
