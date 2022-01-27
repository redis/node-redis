interface RESPDecoderOptions {
    returnError(err: unknown): void;
    returnReply(reply: unknown): void;
    returnBuffers(): boolean;
}

export abstract class RESPDecoder {
    constructor(protected options?: RESPDecoderOptions) {}

    abstract decode(buffer: Buffer): void;
}
