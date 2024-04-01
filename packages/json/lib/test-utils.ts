import TestUtils from "@valkey/test-utils";
import ValkeyJSON from ".";

export default new TestUtils({
  dockerImageName: "redislabs/rejson",
  dockerImageVersionArgument: "rejson-version",
  defaultDockerVersion: "2.6.9",
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: ["--loadmodule /usr/lib/redis/modules/rejson.so"],
      clientOptions: {
        modules: {
          json: ValkeyJSON,
        },
      },
    },
  },
};
