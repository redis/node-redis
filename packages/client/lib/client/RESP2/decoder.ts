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

export default class RESP2Decoder {
    #options: RESP2Options;

    constructor(options: RESP2Options) {
        this.#options = options;
    }

    #cursor = 0;

    #type?: Types;

    #bufferComposer = new BufferComposer();

    #stringComposer = new StringComposer();

    #currentStringComposer: BufferComposer | StringComposer = this.#stringComposer;

    write(chunk: Buffer): void {
        while (this.#cursor < chunk.length) {
            if (!this.#type) {
                this.#currentStringComposer = this.#options.returnStringsAsBuffers() ?
                    this.#bufferComposer :
                    this.#stringComposer;

                this.#type = chunk[this.#cursor];
                if (++this.#cursor >= chunk.length) break;
            }

            const reply = this.#parseType(chunk, this.#type);
            if (reply === undefined) break;

            this.#type = undefined;
            this.#options.onReply(reply);
        }

        this.#cursor -= chunk.length;
    }

    #parseType(chunk: Buffer, type: Types, arraysToKeep?: number): Reply | undefined {
        switch (type) {
            case Types.SIMPLE_STRING:
                return this.#parseSimpleString(chunk);

            case Types.ERROR:
                return this.#parseError(chunk);

            case Types.INTEGER:
                return this.#parseInteger(chunk);

            case Types.BULK_STRING:
                return this.#parseBulkString(chunk);

            case Types.ARRAY:
                return this.#parseArray(chunk, arraysToKeep);
        }
    }

    #compose<
        C extends Composer<T>,
        T = C extends Composer<infer TT> ? TT : never
    >(
        chunk: Buffer,
        composer: C
    ) {
        const crIndex = this.#findCRLF(chunk);
        if (crIndex !== -1) {
            const reply = composer.end(
                chunk.slice(this.#cursor, crIndex)
            );
            this.#cursor = crIndex + 2;
            return reply;
        }

        const toWrite = chunk.slice(this.#cursor);
        composer.write(toWrite);
        this.#cursor = chunk.length;
    }

    #findCRLF(chunk: Buffer): number {
        for (let i = this.#cursor; i < chunk.length; i++) {
            if (chunk[i] === ASCII.CR) {
                return i;
            }
        }

        return -1;
    }

    #parseSimpleString(chunk: Buffer): string | Buffer | undefined {
        return this.#compose(chunk, this.#currentStringComposer);
    }

    #parseError(chunk: Buffer): ErrorReply | undefined {
        const message = this.#compose(chunk, this.#stringComposer);
        if (message !== undefined) {
            return new ErrorReply(message);
        }
    }

    #integer = 0;

    #isNegativeInteger?: boolean;

    #parseInteger(chunk: Buffer): number | undefined {
        if (this.#isNegativeInteger === undefined) {
            this.#isNegativeInteger = chunk[this.#cursor] === ASCII.MINUS;
            if (this.#isNegativeInteger) {
                if (++this.#cursor === chunk.length) return;
            }
        }

        do {
            const byte = chunk[this.#cursor];
            if (byte === ASCII.CR) {
                const integer = this.#isNegativeInteger ? -this.#integer : this.#integer;
                this.#integer = 0;
                this.#isNegativeInteger = undefined;
                this.#cursor += 2;
                return integer;
            }

            this.#integer = this.#integer * 10 + byte - ASCII.ZERO;
        } while (++this.#cursor < chunk.length);
    }

    #bulkStringRemainingLength?: number;

    #parseBulkString(chunk: Buffer): string | Buffer | null | undefined {
        if (this.#bulkStringRemainingLength === undefined) {
            const length = this.#parseInteger(chunk);
            if (length === undefined) return;
            else if (length === -1) return null;

            this.#bulkStringRemainingLength = length;

            if (this.#cursor >= chunk.length) return;
        }

        const end = this.#cursor + this.#bulkStringRemainingLength;
        if (chunk.length >= end) {
            const reply = this.#currentStringComposer.end(
                chunk.slice(this.#cursor, end)
            );
            this.#bulkStringRemainingLength = undefined;
            this.#cursor = end + 2;
            return reply;
        }

        const toWrite = chunk.slice(this.#cursor);
        this.#currentStringComposer.write(toWrite);
        this.#bulkStringRemainingLength -= toWrite.length;
        this.#cursor = chunk.length;
    }

    #arraysInProcess: Array<ArrayInProcess> = [];

    #initializeArray = false;

    #arrayItemType?: Types;

    #parseArray(chunk: Buffer, arraysToKeep = 0): ArrayReply | undefined {
        if (this.#initializeArray || this.#arraysInProcess.length === arraysToKeep) {
            const length = this.#parseInteger(chunk);
            if (length === undefined) {
                this.#initializeArray = true;
                return undefined;
            }

            this.#initializeArray = false;
            this.#arrayItemType = undefined;

            if (length === -1) {
                return this.#returnArrayReply(null, arraysToKeep);
            } else if (length === 0) {
                return this.#returnArrayReply([], arraysToKeep);
            }

            this.#arraysInProcess.push({
                array: new Array(length),
                pushCounter: 0
            });
        }

        while (this.#cursor < chunk.length) {
            if (!this.#arrayItemType) {
                this.#arrayItemType = chunk[this.#cursor];

                if (++this.#cursor >= chunk.length) break;
            }

            const item = this.#parseType(
                chunk,
                this.#arrayItemType,
                arraysToKeep + 1
            );
            if (item === undefined) break;

            this.#arrayItemType = undefined;

            const reply = this.#pushArrayItem(item, arraysToKeep);
            if (reply !== undefined) return reply;
        }
    }

    #returnArrayReply(reply: ArrayReply, arraysToKeep: number): ArrayReply | undefined {
        if (this.#arraysInProcess.length <= arraysToKeep) return reply;

        return this.#pushArrayItem(reply, arraysToKeep);
    }

    #pushArrayItem(item: Reply, arraysToKeep: number): ArrayReply | undefined {
        const to = this.#arraysInProcess[this.#arraysInProcess.length - 1]!;
        to.array[to.pushCounter] = item;
        if (++to.pushCounter === to.array.length) {
            return this.#returnArrayReply(
                this.#arraysInProcess.pop()!.array,
                arraysToKeep
            );
        }
    }
}
