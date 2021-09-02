declare module 'redis-parser' {
    interface RedisParserCallbacks {
        returnReply(reply: unknown): void;
        returnError(err: Error): void;
        returnFatalError?(err: Error): void;
    }

    export default class RedisParser {
        constructor(callbacks: RedisParserCallbacks);

        execute(buffer: Buffer): void;
    }
}
