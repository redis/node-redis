import { ClientInfoReply, transformClientInfoReply } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['CLIENT', 'INFO'];
}

export function transformReply(reply: string): ClientInfoReply {
    return transformClientInfoReply(reply);
}
