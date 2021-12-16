export { FIRST_KEY_INDEX, transformArguments } from './BLPOP';

export const BUFFER_MODE = true;

type BLPopBufferReply = null | {
    key: Buffer;
    element: Buffer;
};

export function transformReply(reply: null | [Buffer, Buffer]): BLPopBufferReply {
    if (reply === null) return null;

    return {
        key: reply[0],
        element: reply[1]
    };
}
