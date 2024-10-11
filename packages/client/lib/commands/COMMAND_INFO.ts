import { ArrayReply, Command, UnwrapReply } from '../RESP/types';
import { CommandRawReply, CommandReply, transformCommandReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(commands: Array<string>) {
    return ['COMMAND', 'INFO', ...commands];
  },
  // TODO: This works, as we don't currently handle any of the items returned as a map
  transformReply(reply: UnwrapReply<ArrayReply<CommandRawReply>>): Array<CommandReply | null> {
    return reply.map(command => command ? transformCommandReply(command) : null);
  }
} as const satisfies Command;