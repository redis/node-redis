import { NestedDecoderInterface } from './abstract';
import { Reply } from '../types';

type Type = Set<Reply>;

export class ToArray implements NestedDecoderInterface<Type> {
    private set: Type;

    private remaining: number;

    constructor(size: number) {
        this.set = new Set();
        this.remaining = size;
    }

    push(item: Reply) {
        this.set.add(item);
        if (--this.remaining === 0) return this.set;
    }
}
