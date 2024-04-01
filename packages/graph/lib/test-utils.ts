import TestUtils from "@valkey/test-utils";
import ValkeyGraph from ".";

export default new TestUtils({
  dockerImageName: "redislabs/redisgraph",
  dockerImageVersionArgument: "redisgraph-version",
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: ["--loadmodule /usr/lib/redis/modules/redisgraph.so"],
      clientOptions: {
        modules: {
          graph: ValkeyGraph,
        },
      },
    },
  },
};
