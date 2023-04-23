import { NestedDecoderInterface } from './abstract';
import { Reply } from '../types';

type Type = Map<Reply, Reply>;

export class MapToArray implements NestedDecoderInterface<Type> {
    private map: Type;

    private remaining: number;

    constructor(size: number) {
        this.map = new Map();
        this.remaining = size;
    }

    private key: Reply | undefined;

    push(item: Reply) {
        if (this.key === undefined) {
            this.key = item;
            return;
        }

        this.map.set(this.key, item);
        this.key = undefined;
        if (--this.remaining === 0) return this.map;
    }
}
