import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { GeoCoordinates } from './GEOSEARCH';

export interface GeoMember extends GeoCoordinates {
  member: RedisArgument;
}

export interface GeoAddOptions {
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
  CH?: boolean;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    toAdd: GeoMember | Array<GeoMember>,
    options?: GeoAddOptions
  ) {
    parser.push('GEOADD')
    parser.pushKey(key);

    if (options?.condition) {
      parser.push(options.condition);
    } else if (options?.NX) {
      parser.push('NX');
    } else if (options?.XX) {
      parser.push('XX');
    }

    if (options?.CH) {
      parser.push('CH');
    }

    if (Array.isArray(toAdd)) {
      for (const member of toAdd) {
        pushMember(parser, member);
      }
    } else {
      pushMember(parser, toAdd);
    }

  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushMember(
  parser: CommandParser,
  { longitude, latitude, member }: GeoMember
) {
  parser.push(
    longitude.toString(),
    latitude.toString(),
    member
  );
}
