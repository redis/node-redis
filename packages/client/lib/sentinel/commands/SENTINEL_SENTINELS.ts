import { CommandParser } from '../../client/parser';
import { RedisArgument, ArrayReply, MapReply, BlobStringReply, Command, TypeMapping, UnwrapReply } from '../../RESP/types';
import { transformTuplesReply } from '../../commands/generic-transformers';

export default {
  /**
   * Returns a list of Sentinel instances for the specified master.
   * @param parser - The Redis command parser.
   * @param dbname - Name of the master.
   */
  parseCommand(parser: CommandParser, dbname: RedisArgument) {
    parser.push('SENTINEL', 'SENTINELS', dbname);
  },
  transformReply: {
    2: (reply: ArrayReply<ArrayReply<BlobStringReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      const inferred = reply as unknown as UnwrapReply<typeof reply>;
      const initial: Array<MapReply<BlobStringReply, BlobStringReply>> = [];
      
      return inferred.reduce(
        (sentinels: Array<MapReply<BlobStringReply, BlobStringReply>>, x: ArrayReply<BlobStringReply>) => {
          sentinels.push(transformTuplesReply(x, undefined, typeMapping)); 
          return sentinels;
        }, 
        initial
      );
    },
    3: undefined as unknown as () => ArrayReply<MapReply<BlobStringReply, BlobStringReply>>
  }
} as const satisfies Command;
