import { CommandParser } from '../client/parser';
import { BlobStringReply, NumberReply, ArrayReply, TuplesReply, UnwrapReply, Command } from '../RESP/types';

/**
 * Role information returned for a Redis master
 */
type MasterRole = [
  role: BlobStringReply<'master'>,
  replicationOffest: NumberReply,
  replicas: ArrayReply<TuplesReply<[host: BlobStringReply, port: BlobStringReply, replicationOffest: BlobStringReply]>>
];

/**
 * Role information returned for a Redis slave
 */
type SlaveRole = [
  role: BlobStringReply<'slave'>,
  masterHost: BlobStringReply,
  masterPort: NumberReply,
  state: BlobStringReply<'connect' | 'connecting' | 'sync' | 'connected'>,
  dataReceived: NumberReply
];

/**
 * Role information returned for a Redis sentinel
 */
type SentinelRole = [
  role: BlobStringReply<'sentinel'>,
  masterNames: ArrayReply<BlobStringReply>
];

/**
 * Combined role type for Redis instance role information
 */
type Role = TuplesReply<MasterRole | SlaveRole | SentinelRole>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the ROLE command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/role/
   */
  parseCommand(parser: CommandParser) {
    parser.push('ROLE');
  },
  /**
   * Transforms the ROLE reply into a structured object
   * 
   * @param reply - The raw reply from Redis
   * @returns Structured object representing role information
   */
  transformReply(reply: UnwrapReply<Role>) {
    switch (reply[0] as unknown as UnwrapReply<typeof reply[0]>) {
      case 'master': {
        const [role, replicationOffest, replicas] = reply as MasterRole;
        return {
          role,
          replicationOffest,
          replicas: (replicas as unknown as UnwrapReply<typeof replicas>).map(replica => {
            const [host, port, replicationOffest] = replica as unknown as UnwrapReply<typeof replica>;
            return {
              host,
              port: Number(port),
              replicationOffest: Number(replicationOffest)
            };
          })
        };
      }

      case 'slave': {
        const [role, masterHost, masterPort, state, dataReceived] = reply as SlaveRole;
        return {
          role,
          master: {
            host: masterHost,
            port: masterPort
          },
          state,
          dataReceived,
        };
      }

      case 'sentinel': {
        const [role, masterNames] = reply as SentinelRole;
        return {
          role,
          masterNames
        };
      }
    }
  }
} as const satisfies Command;
