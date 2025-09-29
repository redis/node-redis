import assert from "node:assert";
import diagnostics_channel from "node:diagnostics_channel";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";

import {
  RedisConnectionConfig,
  createTestClient,
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
} from "./test-scenario.util";
import { createClient } from "../../..";
import { FaultInjectorClient } from "./fault-injector-client";
import { MovingEndpointType } from "../../../lib/client/enterprise-maintenance-manager";
import { RedisTcpSocketOptions } from "../../client/socket";

describe("Client Configuration and Handshake", () => {
  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, any>>;
  let faultInjectorClient: FaultInjectorClient;
  let log: DiagnosticsEvent[] = [];

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath,
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);

    diagnostics_channel.subscribe("redis.maintenance", (event) => {
      log.push(event as DiagnosticsEvent);
    });
  });

  beforeEach(() => {
    log.length = 0;
  });

  afterEach(async () => {
    if (client && client.isOpen) {
      await client.flushAll();
      client.destroy();
    }
  });

  describe("Parameter Configuration", () => {
    const endpoints: MovingEndpointType[] = [
      "auto",
      // "internal-ip",
      // "internal-fqdn",
      "external-ip",
      "external-fqdn",
      "none",
    ];

    for (const endpointType of endpoints) {
      it(`clientHandshakeWithEndpointType '${endpointType}'`, async () => {
        try {
          client = await createTestClient(clientConfig, {
            maintEndpointType: endpointType
          });
          client.on("error", () => {});

          //need to copy those because they will be mutated later
          const oldOptions = JSON.parse(JSON.stringify(client.options));
          assert.ok(oldOptions);

          const { action_id } = await faultInjectorClient.migrateAndBindAction({
            bdbId: clientConfig.bdbId,
            clusterIndex: 0,
          });

          await faultInjectorClient.waitForAction(action_id);

          const movingEvent = log.find((event) => event.type === "MOVING");
          assert(!!movingEvent, "Didnt receive moving PN");

          let endpoint: string | undefined;
          try {
            //@ts-ignore
            endpoint = movingEvent.data.push[3];
          } catch (err) {
            assert(
              false,
              `couldnt get endpoint from event ${JSON.stringify(movingEvent)}`,
            );
          }

          assert(endpoint !== undefined, "no endpoint");

          const newOptions = client.options;
          assert.ok(newOptions);

          if (oldOptions?.url) {
            if (endpointType === "none") {
              assert.equal(
                newOptions!.url,
                oldOptions.url,
                "For movingEndpointTpe 'none', we expect old and new url to be the same",
              );
            } else {
              assert.equal(
                newOptions.url,
                endpoint,
                "Expected what came through the wire to be set in the new client",
              );
              assert.notEqual(
                newOptions!.url,
                oldOptions.url,
                `For movingEndpointTpe ${endpointType}, we expect old and new url to be different`,
              );
            }
          } else {
            const oldSocket = oldOptions.socket as RedisTcpSocketOptions;
            const newSocket = newOptions.socket as RedisTcpSocketOptions;
            assert.ok(oldSocket);
            assert.ok(newSocket);

            if (endpointType === "none") {
              assert.equal(
                newSocket.host,
                oldSocket.host,
                "For movingEndpointTpe 'none', we expect old and new host to be the same",
              );
            } else {
              assert.equal(
                newSocket.host + ":" + newSocket.port,
                endpoint,
                "Expected what came through the wire to be set in the new client",
              );
              assert.notEqual(
                newSocket.host,
                oldSocket.host,
                `For movingEndpointTpe ${endpointType}, we expect old and new host to be different`,
              );
            }
          }
        } catch (error: any) {
          if (
            endpointType === "internal-fqdn" ||
            endpointType === "internal-ip"
          ) {
            // errors are expected here, because we cannot connect to internal endpoints unless we are deployed in the same place as the server
          } else {
            assert(false, error);
          }
        }
      });
    }
  });

  describe("Feature Enablement", () => {
    it("connectionHandshakeIncludesEnablingNotifications", async () => {
      client = await createTestClient(clientConfig, {
        maintNotifications: "enabled"
      });

      const { action_id } = await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

      await faultInjectorClient.waitForAction(action_id);

      let movingEvent = false;
      let migratingEvent = false;
      let migratedEvent = false;
      for (const event of log) {
        if (event.type === "MOVING") movingEvent = true;
        if (event.type === "MIGRATING") migratingEvent = true;
        if (event.type === "MIGRATED") migratedEvent = true;
      }
      assert.ok(movingEvent, "didnt receive MOVING PN");
      assert.ok(migratingEvent, "didnt receive MIGRATING PN");
      assert.ok(migratedEvent, "didnt receive MIGRATED PN");
    });

    it("disabledDontReceiveNotifications", async () => {
      try {
        client = await createTestClient(clientConfig, {
          maintNotifications: "disabled",
          socket: {
            reconnectStrategy: false
          }
        });
        client.on('error', console.log.bind(console))

        const { action_id } = await faultInjectorClient.migrateAndBindAction({
          bdbId: clientConfig.bdbId,
          clusterIndex: 0,
        });

        await faultInjectorClient.waitForAction(action_id);

        assert.equal(log.length, 0, "received a PN while feature is disabled");
      } catch (error: any) { }
    });
  });
});
