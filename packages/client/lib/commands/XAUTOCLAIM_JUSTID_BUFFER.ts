export { FIRST_KEY_INDEX, transformArguments } from './XAUTOCLAIM_JUSTID';

interface XAutoClaimJustIdBufferReply {
    nextId: Buffer;
    messages: Array<Buffer>;
}

export function transformReply(reply: [Buffer, Array<Buffer>]): XAutoClaimJustIdBufferReply {
    return {
        nextId: reply[0],
        messages: reply[1]
    };
}
