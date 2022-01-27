import { StringDecoder } from 'string_decoder';
import { Composer } from './interface';

export default class StringComposer implements Composer<string> {
    #decoder = new StringDecoder();

    #chunks: Array<string> = [];

    write(buffer: Buffer): void {
        this.#chunks.push(
            this.#decoder.write(buffer)
        );
    }

    end(buffer: Buffer): string {
        return this.#chunks.splice(0).join('') + this.#decoder.end(buffer);
    }
}
