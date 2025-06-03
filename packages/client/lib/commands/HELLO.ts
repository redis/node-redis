import { CommandParser } from '../client/parser';
import { RedisArgument, RespVersions, TuplesToMapReply, BlobStringReply, NumberReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export interface HelloOptions {
  protover?: RespVersions;
  AUTH?: {
    username: RedisArgument;
    password: RedisArgument;
  };
  SETNAME?: string;
}

export type HelloReply = TuplesToMapReply<[
  [BlobStringReply<'server'>, BlobStringReply],
  [BlobStringReply<'version'>, BlobStringReply],
  [BlobStringReply<'proto'>, NumberReply<RespVersions>],
  [BlobStringReply<'id'>, NumberReply],
  [BlobStringReply<'mode'>, BlobStringReply],
  [BlobStringReply<'role'>, BlobStringReply],
  [BlobStringReply<'modules'>, ArrayReply<BlobStringReply>]
]>;

export default {
  /**
   * Handshakes with the Redis server and switches to the specified protocol version
   * @param parser - The Redis command parser
   * @param protover - Protocol version to use
   * @param options - Additional options for authentication and connection naming
   */
  parseCommand(parser: CommandParser, protover?: RespVersions, options?: HelloOptions) {
    parser.push('HELLO');

    if (protover) {
      parser.push(protover.toString());

      if (options?.AUTH) {
        parser.push(
          'AUTH',
          options.AUTH.username,
          options.AUTH.password
        );
      }
  
      if (options?.SETNAME) {
        parser.push(
          'SETNAME',
          options.SETNAME
        );
      }
    }
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<HelloReply>>) => ({
      server: reply[1],
      version: reply[3],
      proto: reply[5],
      id: reply[7],
      mode: reply[9],
      role: reply[11],
      modules: reply[13]
    }),
    3: undefined as unknown as () => HelloReply
  }
} as const satisfies Command;
