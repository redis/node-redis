import { Composer } from './interface';

export default class BufferComposer implements Composer<Buffer> {
    #chunks: Array<Buffer> = [];

    write(buffer: Buffer): void {
        this.#chunks.push(buffer);
    }

    end(buffer: Buffer): Buffer {
        this.write(buffer);
        return Buffer.concat(this.#chunks.splice(0));
    }
}
