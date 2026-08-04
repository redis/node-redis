import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, ArrayReply, Command, NullReply } from '../RESP/types';

export default {
  // The server metadata makes VRANDMEMBER look cacheable (readonly + keyed)
  // because, unlike its siblings (SRANDMEMBER/HRANDFIELD/ZRANDMEMBER), it is
  // not tagged with the `nondeterministic_output` tip yet. Caching a random
  // pick would freeze it until the key changes — override until the server
  // tags it.
  CACHEABLE: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count?: number) {
    parser.push('VRANDMEMBER');
    parser.pushKey(key);
    
    if (count !== undefined) {
      parser.push(count.toString());
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply | ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
