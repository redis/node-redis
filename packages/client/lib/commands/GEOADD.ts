import { RedisArgument, CommandArguments, NumberReply, Command } from '../RESP/types';
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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    toAdd: GeoMember | Array<GeoMember>,
    options?: GeoAddOptions
  ) {
    const args = ['GEOADD', key];

    if (options?.condition) {
      args.push(options.condition);
    } else if (options?.NX) {
      args.push('NX');
    } else if (options?.XX) {
      args.push('XX');
    }

    if (options?.CH) {
      args.push('CH');
    }

    if (Array.isArray(toAdd)) {
      for (const member of toAdd) {
        pushMember(args, member);
      }
    } else {
      pushMember(args, toAdd);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushMember(
  args: CommandArguments,
  { longitude, latitude, member }: GeoMember
) {
  args.push(
    longitude.toString(),
    latitude.toString(),
    member
  );
}
