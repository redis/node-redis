import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";
import { pushQueryArguments, QueryOptionsBackwardCompatible } from ".";

export { FIRST_KEY_INDEX } from "./QUERY";

export const IS_READ_ONLY = true;

export function transformArguments(
  graph: ValkeyCommandArgument,
  query: ValkeyCommandArgument,
  options?: QueryOptionsBackwardCompatible,
  compact?: boolean
): ValkeyCommandArguments {
  return pushQueryArguments(["GRAPH.RO_QUERY"], graph, query, options, compact);
}

export { transformReply } from "./QUERY";
