import { ErrorReply } from '../../errors';
import { Composer } from './composers/interface';
import BufferComposer from './composers/buffer';
import StringComposer from './composers/string';

// RESP2 specification
// https://redis.io/topics/protocol

enum Types {
    SIMPLE_STRING = 43, // +
    ERROR = 45, // -
    INTEGER = 58, // :
    BULK_STRING = 36, // $
    ARRAY = 42 // *
}

enum ASCII {
    CR = 13, // \r
    ZERO = 48,
    MINUS = 45
}

export type Reply = string | Buffer | ErrorReply | number | null | Array<Reply>;

type ArrayReply = Array<Reply> | null;

export type ReturnStringsAsBuffers = () => boolean;

interface RESP2Options {
    returnStringsAsBuffers: ReturnStringsAsBuffers;
    onReply(reply: Reply): unknown;
}

interface ArrayInProcess {
    array: Array<Reply>;
    pushCounter: number;
}

// Using TypeScript `private` and not the build-in `#` to avoid __classPrivateFieldGet and __classPrivateFieldSet

export default class RESP2Decoder {
    constructor(private options: RESP2Options) {}

    private cursor = 0;

    private type?: Types;

    private bufferComposer = new BufferComposer();

    private stringComposer = new StringComposer();

    private currentStringComposer: BufferComposer | StringComposer = this.stringComposer;

    reset() {
        this.cursor = 0;
        this.type = undefined;
        this.bufferComposer.reset();
        this.stringComposer.reset();
        this.currentStringComposer = this.stringComposer;
    }

    write(chunk: Buffer): void {
        while (this.cursor < chunk.length) {
            if (!this.type) {
                this.currentStringComposer = this.options.returnStringsAsBuffers() ?
                    this.bufferComposer :
                    this.stringComposer;

                this.type = chunk[this.cursor];
                if (++this.cursor >= chunk.length) break;
            }

            const reply = this.parseType(chunk, this.type);
            if (reply === undefined) break;

            this.type = undefined;
            this.options.onReply(reply);
        }

        this.cursor -= chunk.length;
    }

    private parseType(chunk: Buffer, type: Types, arraysToKeep?: number): Reply | undefined {
        switch (type) {
            case Types.SIMPLE_STRING:
                return this.parseSimpleString(chunk);

            case Types.ERROR:
                return this.parseError(chunk);

            case Types.INTEGER:
                return this.parseInteger(chunk);

            case Types.BULK_STRING:
                return this.parseBulkString(chunk);

            case Types.ARRAY:
                return this.parseArray(chunk, arraysToKeep);
        }
    }

    private compose<
        C extends Composer<T>,
        T = C extends Composer<infer TT> ? TT : never
    >(
        chunk: Buffer,
        composer: C
    ): T | undefined {
        for (let i = this.cursor; i < chunk.length; i++) {
            if (chunk[i] === ASCII.CR) {
                const reply = composer.end(
                    chunk.subarray(this.cursor, i)
                );
                this.cursor = i + 2;
                return reply;
            }
        }

        const toWrite = chunk.subarray(this.cursor);
        composer.write(toWrite);
        this.cursor = chunk.length;
    }

    private parseSimpleString(chunk: Buffer): string | Buffer | undefined {
        return this.compose(chunk, this.currentStringComposer);
    }

    private parseError(chunk: Buffer): ErrorReply | undefined {
        const message = this.compose(chunk, this.stringComposer);
        if (message !== undefined) {
            return new ErrorReply(message);
        }
    }

    private integer = 0;

    private isNegativeInteger?: boolean;

    private parseInteger(chunk: Buffer): number | undefined {
        if (this.isNegativeInteger === undefined) {
            this.isNegativeInteger = chunk[this.cursor] === ASCII.MINUS;
            if (this.isNegativeInteger && ++this.cursor === chunk.length) return;
        }

        do {
            const byte = chunk[this.cursor];
            if (byte === ASCII.CR) {
                const integer = this.isNegativeInteger ? -this.integer : this.integer;
                this.integer = 0;
                this.isNegativeInteger = undefined;
                this.cursor += 2;
                return integer;
            }

            this.integer = this.integer * 10 + byte - ASCII.ZERO;
        } while (++this.cursor < chunk.length);
    }

    private bulkStringRemainingLength?: number;

    private parseBulkString(chunk: Buffer): string | Buffer | null | undefined {
        if (this.bulkStringRemainingLength === undefined) {
            const length = this.parseInteger(chunk);
            if (length === undefined) return;
            if (length === -1) return null;

            this.bulkStringRemainingLength = length;

            if (this.cursor >= chunk.length) return;
        }

        const end = this.cursor + this.bulkStringRemainingLength;
        if (chunk.length >= end) {
            const reply = this.currentStringComposer.end(
                chunk.subarray(this.cursor, end)
            );
            this.bulkStringRemainingLength = undefined;
            this.cursor = end + 2;
            return reply;
        }

        const toWrite = chunk.subarray(this.cursor);
        this.currentStringComposer.write(toWrite);
        this.bulkStringRemainingLength -= toWrite.length;
        this.cursor = chunk.length;
    }

    private arraysInProcess: Array<ArrayInProcess> = [];

    private initializeArray = false;

    private arrayItemType?: Types;

    private parseArray(chunk: Buffer, arraysToKeep = 0): ArrayReply | undefined {
        if (this.initializeArray || this.arraysInProcess.length === arraysToKeep) {
            const length = this.parseInteger(chunk);
            if (length === undefined) {
                this.initializeArray = true;
                return undefined;
            }

            this.initializeArray = false;
            this.arrayItemType = undefined;

            if (length === -1) {
                return this.returnArrayReply(null, arraysToKeep, chunk);
            } else if (length === 0) {
                return this.returnArrayReply([], arraysToKeep, chunk);
            }

            this.arraysInProcess.push({
                array: new Array(length),
                pushCounter: 0
            });
        }

        while (this.cursor < chunk.length) {
            if (!this.arrayItemType) {
                this.arrayItemType = chunk[this.cursor];

                if (++this.cursor >= chunk.length) break;
            }

            const item = this.parseType(
                chunk,
                this.arrayItemType,
                arraysToKeep + 1
            );
            if (item === undefined) break;

            this.arrayItemType = undefined;

            const reply = this.pushArrayItem(item, arraysToKeep);
            if (reply !== undefined) return reply;
        }
    }

    private returnArrayReply(reply: ArrayReply, arraysToKeep: number, chunk?: Buffer): ArrayReply | undefined {
        if (this.arraysInProcess.length <= arraysToKeep) return reply;

        return this.pushArrayItem(reply, arraysToKeep, chunk);
    }

    private pushArrayItem(item: Reply, arraysToKeep: number, chunk?: Buffer): ArrayReply | undefined {
        const to = this.arraysInProcess[this.arraysInProcess.length - 1]!;
        to.array[to.pushCounter] = item;
        if (++to.pushCounter === to.array.length) {
            return this.returnArrayReply(
                this.arraysInProcess.pop()!.array,
                arraysToKeep,
                chunk
            );
        } else if (chunk && chunk.length > this.cursor) {
            return this.parseArray(chunk, arraysToKeep);
        }
    }
}
