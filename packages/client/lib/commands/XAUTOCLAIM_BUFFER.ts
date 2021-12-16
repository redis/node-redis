import { StreamBufferMessagesReply, transformReplyStreamBufferMessages } from './generic-transformers';

export { FIRST_KEY_INDEX, transformArguments } from './XAUTOCLAIM';

export const BUFFER_MODE = true;

interface XAutoClaimReply {
    nextId: Buffer;
    messages: StreamBufferMessagesReply;
}

export function transformReply(reply: [Buffer, Array<any>]): XAutoClaimReply {
    return {
        nextId: reply[0],
        messages: transformReplyStreamBufferMessages(reply[1])
    };
}
