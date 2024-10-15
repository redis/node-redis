import { ArrayReply, Command, UnwrapReply } from '../RESP/types';
import { CommandRawReply, CommandReply, transformCommandReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return ['COMMAND'];
  },
  // TODO: This works, as we don't currently handle any of the items returned as a map
  transformReply(reply: UnwrapReply<ArrayReply<CommandRawReply>>): Array<CommandReply> {
    return reply.map(transformCommandReply);
  }
} as const satisfies Command;