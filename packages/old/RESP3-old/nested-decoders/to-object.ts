import { NestedDecoderInterface } from './abstract';
import { Reply } from '../types';

type Type = Record<string, Reply>;

export class MapToArray implements NestedDecoderInterface<Type> {
    private object: Type;

    private remaining: number;

    constructor(size: number) {
        this.object = {};
        this.remaining = size;
    }

    private key: Reply | undefined;

    push(item: Reply) {
        if (this.key === undefined) {
            this.key = item;
            return;
        }

        this.object[this.key] = item;
        this.key = undefined;
        if (--this.remaining === 0) return this.object;
    }
}
