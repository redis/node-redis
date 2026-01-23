import { strict as assert } from "node:assert";
import testUtils, { GLOBAL } from "../test-utils";
import { createClient } from "../..";

describe("TLS", () => {
  describe("Basic TLS connection", () => {
    testUtils.testWithTlsClient(
      "should connect via TLS",
      async (tlsClient) => {
        const nonTlsClient = createClient({
          socket: {
            port: (tlsClient.options.socket as any)?.port,
            tls: true,
          },
        });
        assert.rejects(nonTlsClient.connect());
        nonTlsClient.destroy();

        const pong = await tlsClient.ping();
        assert.equal(pong, "PONG");
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [6, 0], // TLS support
      },
    );
  });
  describe("CN-based authentication", () => {
    const CLIENT_CN = "node-redis-test-client";

    testUtils.testWithTlsClient(
      "should authenticate TLS client using certificate CN",
      async (client) => {
        try {
          // Verify we're connected as default user
          const initialWhoami = await client.aclWhoAmI();
          assert.equal(initialWhoami, "default");

          // Set up ACL user matching the certificate CN
          await client.aclSetUser(CLIENT_CN, [
            "on",
            ">clientpass",
            "allcommands",
            "allkeys",
          ]);

          // Disconnect the client
          client.destroy();

          // Reconnect the client
          await client.connect();

          // Verify the TLS client is authenticated as the CN user
          const whoami = await client.aclWhoAmI();
          assert.equal(whoami, CLIENT_CN);
        } finally {
          client.destroy();
        }
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [8, 6],
        tls: { clientCertCN: CLIENT_CN },
      },
    );
  });
});
