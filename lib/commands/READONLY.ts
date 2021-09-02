import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['READONLY'];
}

export const transformReply = transformReplyString;
