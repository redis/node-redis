import { Transform, TransformCallback } from 'stream';
import { ErrorReply } from '../../errors';
import { Composer } from './composers/interface';
import BufferComposer from './composers/buffer';
import StringComposer from './composers/string';

enum Types {
    SIMPLE_STRING = 43, // +
    ERROR = 45, // -
    INTEGER = 58, // :
    BULK_STRING = 36, // $
    ARRAY = 42 // *
}

const CR = 13; // \r

export type Reply = string | Buffer | ErrorReply | number | null | Array<Reply>;

type ArrayReply = Array<Reply> | null;

export type ReturnStringsAsBuffers = () => boolean;

interface RESP2Options {
    returnStringsAsBuffers: ReturnStringsAsBuffers
}

interface ArrayInProcess {
    array: Array<Reply>;
    pushCounter: number;
}

export default class RESP2Decoder extends Transform {
    #options: RESP2Options;

    constructor(options: RESP2Options) {
        super({ readableObjectMode: true });

        this.#options = options;
    }

    #cursor = 0;

    #type?: Types;

    #bufferComposer = new BufferComposer();

    #stringComposer = new StringComposer();

    #composer: BufferComposer | StringComposer = this.#stringComposer;

    _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        while (this.#cursor < chunk.length) {
            if (!this.#type) {
                this.#composer = this.#options.returnStringsAsBuffers() ?
                    this.#bufferComposer :
                    this.#stringComposer;

                this.#type = chunk[this.#cursor];
                if (++this.#cursor >= chunk.length) break;
            }

            const reply = this.#parseType(chunk, this.#type);
            if (reply === undefined) break;

            this.#type = undefined;
            this.emit('data', reply);
        }

        this.#cursor -= chunk.length;
        callback();
    }

    #parseType(chunk: Buffer, type: Types, arraysToKeep?: number): Reply | undefined {
        switch (type) {
            case Types.SIMPLE_STRING:
                return this.#parseSimpleString(chunk, this.#composer);

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

    #parseSimpleString<
        C extends Composer<T>,
        T = C extends Composer<infer TT> ? TT : never
    >(
        chunk: Buffer,
        composer: C
    ): T | undefined {
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
            if (chunk[i] === CR) {
                return i;
            }
        }

        return -1;
    }

    #parseError(chunk: Buffer): ErrorReply | undefined {
        const message = this.#parseSimpleString(chunk, this.#stringComposer);
        if (message !== undefined) {
            return new ErrorReply(message);
        }
    }

    #parseInteger(chunk: Buffer): number | undefined {
        const number = this.#parseSimpleString(chunk, this.#stringComposer);
        if (number !== undefined) {
            return Number(number);
        }
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
            const reply = this.#composer.end(
                chunk.slice(this.#cursor, end)
            );
            this.#bulkStringRemainingLength = undefined;
            this.#cursor = end + 2;
            return reply;
        }

        const toWrite = chunk.slice(this.#cursor);
        this.#composer.write(toWrite);
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
