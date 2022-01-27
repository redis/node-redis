import { ErrorReply } from '../../errors';
import BufferComposer from './composers/buffer';
import { Composer } from './composers/interface';
import StringComposer from './composers/string';

enum Types {
    SIMPLE_STRING = 43, // +
    ERROR = 45, // -
    INTEGER = 58, // :
    BULK_STRING = 36, // $
    ARRAY = 42 // *
}

const CR = 13, // \r
    LF = 10; // \n

type PrimitiveReply = string | Buffer | number | null;

type ArrayReply = Array<Reply | ErrorReply | ArrayReply>;

type Reply = PrimitiveReply | ArrayReply;

interface RESP2Options {
    reply(reply?: Reply): unknown;
    errorReply(errorReply?: ErrorReply): unknown;
    returnStringsAsBuffers(): boolean;
}

interface ArrayInProcess {
    remaining: number;
    array: ArrayReply;
}

export default class RESP2 {
    #options: RESP2Options;

    constructor(options: RESP2Options) {
        this.#options = options;
    }

    #type?: Types;

    #cursor = 0;

    #stringComposer = new StringComposer();

    #bufferComposer = new BufferComposer();

    #composer: StringComposer | BufferComposer = this.#stringComposer;

    #setComposer(): StringComposer | BufferComposer {
        return this.#composer = this.#options.returnStringsAsBuffers() ?
            this.#bufferComposer :
            this.#stringComposer;
    }

    write(buffer: Buffer): void {
        while (this.#cursor < buffer.length) {
            const initiate = !this.#type;
            if (initiate) {
                this.#type = buffer[this.#cursor++];
            }

            const reply = this.#parseType(
                buffer,
                this.#type!,
                initiate,
                true
            );
            if (reply === undefined) break;

            if (reply instanceof ErrorReply) {
                this.#options.errorReply(reply);
            } else {
                this.#options.reply(reply);
            }
        }

        this.#cursor -= buffer.length;
    }

    #parseType(
        buffer: Buffer,
        type: Types,
        initiate: boolean,
        setComposer: boolean
    ): Reply | ErrorReply | undefined {
        switch (type) {
            case Types.SIMPLE_STRING:
                return this.#parseSimpleString(
                    buffer,
                    setComposer ? this.#setComposer() : this.#composer
                );

            case Types.ERROR:
                return this.#parseError(buffer);

            case Types.INTEGER:
                return this.#parseInteger(buffer);

            case Types.BULK_STRING:
                if (setComposer) this.#setComposer();

                return this.#parseBulkString(buffer);

            case Types.ARRAY:
                return this.#parseArray(buffer, initiate);
        }
    }

    #parseSimpleString<
        T extends Composer<R>,
        R = T extends Composer<infer R> ? R : never
    >(
        buffer: Buffer,
        composer: T
    ): R | undefined {
        if (this.#cursor >= buffer.length) return;

        const crIndex = this.#findCRLF(buffer);
        if (crIndex !== -1) {
            const reply = composer.end(
                buffer.slice(this.#cursor, crIndex)
            );
            this.#cursor = crIndex + 2;
            return reply;
        }

        const toWrite = buffer.slice(this.#cursor);
        composer.write(toWrite);
        this.#cursor = toWrite.length;
    }

    #findCRLF(buffer: Buffer): number {
        for (let i = this.#cursor; i < buffer.length; i++) {
            if (buffer[i] === CR) {
                return i;
            }
        }

        return -1;
    }

    #parseError(buffer: Buffer): ErrorReply | undefined {
        const message = this.#parseSimpleString(buffer, this.#stringComposer);
        if (message !== undefined) {
            return new ErrorReply(message);
        }
    }

    #parseInteger(buffer: Buffer): number | undefined {
        const number = this.#parseSimpleString(buffer, this.#stringComposer);
        if (number !== undefined) {
            return Number(number);
        }
    }

    #bulkStringRemainingLength?: number;

    #parseBulkString(buffer: Buffer): string | Buffer | null | undefined {
        if (this.#cursor >= buffer.length) return;

        if (this.#bulkStringRemainingLength === undefined) {
            const remainingLength = this.#parseInteger(buffer);
            if (remainingLength === undefined) return;
            else if (remainingLength === -1) return null;

            this.#bulkStringRemainingLength = remainingLength;

            if (this.#cursor >= buffer.length) return;
        }

        const end = this.#cursor + this.#bulkStringRemainingLength;
        if (buffer.length > end) {
            const reply = this.#composer.end(
                buffer.slice(this.#cursor, end)
            );
            this.#bulkStringRemainingLength = undefined;
            this.#cursor = end + 2;
            return reply;
        }

        const toWrite = buffer.slice(this.#cursor);
        this.#composer.write(toWrite);
        this.#bulkStringRemainingLength -= toWrite.length;
        this.#cursor = toWrite.length;
    }

    #initiateArray = false;

    #arrays: Array<ArrayInProcess> = [];

    #arrayItemType?: Types;

    #parseArray(buffer: Buffer, initiate: boolean): ArrayReply | null | undefined {
        let arrayInProcess: ArrayInProcess;
        if (initiate || this.#initiateArray) {
            const length = this.#parseInteger(buffer);
            if (length === undefined) {
                this.#initiateArray = true;
                return;
            }

            this.#initiateArray = false;
            this.#arrayItemType = undefined;

            if (length === -1) {
                return null;
            } else if (length === 0) {
                return [];
            }

            this.#arrays.push(arrayInProcess = {
                remaining: length,
                array: new Array(length)
            });
        } else {
            arrayInProcess = this.#arrays[this.#arrays.length - 1];
        }

        while (this.#cursor < buffer.length) {
            const initiate = !this.#arrayItemType;
            if (initiate) {
                this.#arrayItemType = buffer[this.#cursor++];
            }

            const item = this.#parseType(
                buffer,
                this.#arrayItemType!,
                initiate,
                false
            );

            console.log(Types[this.#arrayItemType!], item);

            if (item === undefined) break;

            this.#arrayItemType = undefined;

            const reply = this.#pushArrayReply(item);
            if (reply !== undefined) return reply;
        }
    }

    // #returnArrayReply(reply: ArrayReply | null): ArrayReply | null | undefined {
    //     console.log('#returnArrayReply', this.#arrays.length, reply);
    //     if (!this.#arrays.length) return reply;

    //     return this.#pushArrayReply(reply);
    // }

    #pushArrayReply(reply: Reply | ErrorReply): ArrayReply | undefined {
        let to = this.#arrays[this.#arrays.length - 1];
        to.array[to.array.length - to.remaining] = reply;

        while (--to.remaining === 0) {
            if (this.#arrays.length === 0) {
                return to.array;
            }

            this.#arrays.pop();
            reply = to.array;
            to = this.#arrays[this.#arrays.length - 1];
        }
    }
}

function log(buffer: Buffer): string {
    return buffer.toString()
        .replace(/\r/g, '<CR>')
        .replace(/\n/g, '<LF>');
}