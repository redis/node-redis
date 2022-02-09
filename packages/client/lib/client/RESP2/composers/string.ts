import { StringDecoder } from 'string_decoder';
import { Composer } from './interface';

export default class StringComposer implements Composer<string> {
    #decoder = new StringDecoder();

    #string = '';

    write(buffer: Buffer): void {
        this.#string += this.#decoder.write(buffer);
    }

    end(buffer: Buffer): string {
        const string = this.#string + this.#decoder.end(buffer);
        this.#string = '';
        return string;
    }
}
