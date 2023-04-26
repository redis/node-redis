// import { RedisCommandArgument, RedisCommandArguments } from '.';
// import { pushVariadicArguments, transformDoubleReply, ZMember } from './generic-transformers';

// export const FIRST_KEY_INDEX = 1;

// export function transformArguments(
//     key: RedisCommandArgument | Array<RedisCommandArgument>,
//     timeout: number
// ): RedisCommandArguments {
//     const args = pushVariadicArguments(['BZPOPMAX'], key);

//     args.push(timeout.toString());

//     return args;
// }

// type ZMemberRawReply = [key: RedisCommandArgument, value: RedisCommandArgument, score: RedisCommandArgument] | null;

// type BZPopMaxReply = (ZMember & { key: RedisCommandArgument }) | null;

// export function transformReply(reply: ZMemberRawReply): BZPopMaxReply | null {
//     if (!reply) return null;

//     return {
//         key: reply[0],
//         value: reply[1],
//         score: transformDoubleReply(reply[2])
//     };
// }
