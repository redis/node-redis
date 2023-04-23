import { Reply } from '../types';

export interface NestedDecoderInterface<T> {
    push(item: Reply): void | undefined | T;
}

