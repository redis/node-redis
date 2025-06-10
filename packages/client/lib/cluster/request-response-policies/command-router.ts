// import { RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from "../../RESP/types";
// import { ShardNode } from "../cluster-slots";
// import type { Either } from './types';

// export interface CommandRouter<
// M extends RedisModules,
// F extends RedisFunctions,
// S extends RedisScripts,
// RESP extends RespVersions,
// TYPE_MAPPING extends TypeMapping> {
//   routeCommand(
//     command: string,
//     policy: RequestPolicy,
//   ): Either<ShardNode<M, F, S, RESP, TYPE_MAPPING>, 'no-available-nodes' | 'routing-failed'>;
// }