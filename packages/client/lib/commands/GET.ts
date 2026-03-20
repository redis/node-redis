import { CommandParser } from '../client/parser';
import { RESP_TYPES } from '../RESP/decoder';
import { RedisArgument, BlobStringReply, NullReply, Command ,TypeMapping} from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets the value of a key
   * @param parser - The Redis command parser
   * @param key - Key to get the value of
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GET');
    parser.pushKey(key);
  },
  transformReply: (reply: BlobStringReply | NullReply,_,typeMapping?:TypeMapping):string | Buffer | null =>{
    if(reply === null) return null;

    const wantsBuffer = typeMapping?.[RESP_TYPES.BLOB_STRING] ===  Buffer;
    if (wantsBuffer){
      return reply as unknown as Buffer;
    }
    return Buffer.isBuffer(reply) ? reply.toString('utf8'):(reply as unknown as string)
  }
  } as const satisfies Command;
