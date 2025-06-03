import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesToMapReply, BlobStringReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

type AclUser = TuplesToMapReply<[
  [BlobStringReply<'flags'>, ArrayReply<BlobStringReply>],
  [BlobStringReply<'passwords'>, ArrayReply<BlobStringReply>],
  [BlobStringReply<'commands'>, BlobStringReply],
  /** changed to BlobStringReply in 7.0 */
  [BlobStringReply<'keys'>, ArrayReply<BlobStringReply> | BlobStringReply],
  /** added in 6.2, changed to BlobStringReply in 7.0 */
  [BlobStringReply<'channels'>, ArrayReply<BlobStringReply> | BlobStringReply],
  /** added in 7.0 */
  [BlobStringReply<'selectors'>, ArrayReply<TuplesToMapReply<[
    [BlobStringReply<'commands'>, BlobStringReply],
    [BlobStringReply<'keys'>, BlobStringReply],
    [BlobStringReply<'channels'>, BlobStringReply]
  ]>>],
]>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns ACL information about a specific user
   * @param parser - The Redis command parser
   * @param username - Username to get information for
   */
  parseCommand(parser: CommandParser, username: RedisArgument) {
    parser.push('ACL', 'GETUSER', username);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<AclUser>>) => ({
      flags: reply[1],
      passwords: reply[3],
      commands: reply[5],
      keys: reply[7],
      channels: reply[9],
      selectors: (reply[11] as unknown as UnwrapReply<typeof reply[11]>)?.map(selector => {
        const inferred = selector as unknown as UnwrapReply<typeof selector>;
        return {
          commands: inferred[1],
          keys: inferred[3],
          channels: inferred[5]
        };
      })
    }),
    3: undefined as unknown as () => AclUser
  }
} as const satisfies Command;
