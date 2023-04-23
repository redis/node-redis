import { NestedDecoderInterface } from './abstract';
import { Reply } from '../types';

type Type = Array<[Reply, Reply]>;

export class MapToArray implements NestedDecoderInterface<Type> {
    private array: Type;

    private remaining: number;

    constructor(size: number) {
        this.array = new Array(size);
        this.remaining = size;
    }

    private key: Reply | undefined;

    push(item: Reply) {
        if (this.key === undefined) {
            this.key = item;
            return;
        }

        this.array[this.array.length - this.remaining--] = [this.key, item];
        this.key = undefined;
        if (this.remaining === 0) return this.array;
    }
}
