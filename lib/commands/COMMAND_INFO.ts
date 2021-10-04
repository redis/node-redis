import { TransformArgumentsReply } from '.';
import { CommandRawReply, CommandReply, transformCommandReply } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(commands: Array<string>): TransformArgumentsReply {
    return ['COMMAND', 'INFO', ...commands];
}

export function transformReply(reply: Array<CommandRawReply | null>): Array<CommandReply | null> {
    return reply.map(command => command ? transformCommandReply(command) : null);
}
