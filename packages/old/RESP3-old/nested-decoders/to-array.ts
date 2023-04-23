import { NestedDecoderInterface } from './abstract';
import { Reply } from '../types';

type Type = Array<Reply>;

export class ToArray implements NestedDecoderInterface<Type> {
    private array: Type;

    private remaining: number;

    constructor(size: number) {
        this.array = new Array(size);
        this.remaining = size;
    }

    push(item: Reply) {
        this.array[this.array.length - this.remaining--] = item;
        if (this.remaining === 0) return this.array;
    }
}
