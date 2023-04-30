// import { RedisCommandArgument, RedisCommandArguments } from '.';
// import { SortedSetSide, transformZMPopArguments, ZMPopOptions } from './generic-transformers';

// export const FIRST_KEY_INDEX = 3;

// export function transformArguments(
//     timeout: number,
//     keys: RedisCommandArgument | Array<RedisCommandArgument>,
//     side: SortedSetSide,
//     options?: ZMPopOptions
// ): RedisCommandArguments {
//     return transformZMPopArguments(
//         ['BZMPOP', timeout.toString()],
//         keys,
//         side,
//         options
//     );
// }

// export { transformReply } from './ZMPOP';


// import { Command } from '../RESP/types';
// import ZMPOP from './ZMPOP';

// export default {
//   FIRST_KEY_INDEX: 3,
//   IS_READ_ONLY: false,
//   transformArguments() {
//     return ['BZMPOP'];
//   },
//   transformReply: ZMPOP.transformReply
// } as const satisfies Command;

