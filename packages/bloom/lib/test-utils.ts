import TestUtils from "@valkey/test-utils";
import ValkeyBloomModules from ".";

export default new TestUtils({
  dockerImageName: "redislabs/rebloom",
  dockerImageVersionArgument: "redisbloom-version",
  defaultDockerVersion: "edge",
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: ["--loadmodule /usr/lib/redis/modules/redisbloom.so"],
      clientOptions: {
        modules: ValkeyBloomModules,
      },
    },
  },
};
