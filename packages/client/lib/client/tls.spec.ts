import { strict as assert } from "node:assert";
import testUtils, { GLOBAL } from "../test-utils";
import { createClient } from "../..";

describe("TLS", () => {
  describe("Basic TLS connection", () => {
    testUtils.testWithTlsClient(
      "should connect with valid certificates",
      async (tlsClient, { tlsPort }) => {
        // Verify valid TLS connection works
        const pong = await tlsClient.ping();
        assert.equal(pong, "PONG");

        // Verify that connecting with wrong CA fails (proves TLS is enforced)
        const clientWithWrongCA = createClient({
          socket: {
            port: tlsPort,
            tls: true,
            ca: "wrong-ca-certificate",
            reconnectStrategy: false,
          },
        });
        clientWithWrongCA.on("error", () => {});

        await assert.rejects(clientWithWrongCA.connect());
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [6, 0],
      },
    );
  });

  describe("CN-based authentication", () => {
    const CLIENT_CN = "node-redis-test-client";

    testUtils.testWithTlsClient(
      "should authenticate TLS client using certificate CN",
      async (client) => {
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
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [8, 6],
        tls: { clientCertCN: CLIENT_CN },
      },
    );
  });
});
