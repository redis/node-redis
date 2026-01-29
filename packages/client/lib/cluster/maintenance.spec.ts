import assert from "node:assert";
import diagnostics_channel from "node:diagnostics_channel";

import testUtils from "../test-utils";
import { DiagnosticsEvent } from "../client/enterprise-maintenance-manager";

describe("Cluster Maintenance", () => {
  const MASTERS_COUNT = 3;

  before(() => {
    process.env.REDIS_EMIT_DIAGNOSTICS = "1";
  });

  after(() => {
    delete process.env.REDIS_EMIT_DIAGNOSTICS;
  });

  let diagnosticEvents: DiagnosticsEvent[] = [];

  const onMessage = (message: unknown) => {
    const event = message as DiagnosticsEvent;
    if (["SMIGRATING", "SMIGRATED"].includes(event.type)) {
      diagnosticEvents.push(event);
    }
  };

  beforeEach(() => {
    diagnostics_channel.subscribe("redis.maintenance", onMessage);
    diagnosticEvents = [];
  });

  afterEach(() => {
    diagnostics_channel.unsubscribe("redis.maintenance", onMessage);
  });

  testUtils.testWithProxiedCluster(
    "should handle failover",
    async (cluster, { faultInjectorClient }) => {
      assert.equal(
        diagnosticEvents.length,
        0,
        "should not have received any notifications yet"
      );
      assert.equal(
        cluster.masters.length,
        MASTERS_COUNT,
        `should have ${MASTERS_COUNT} masters at start`
      );

      await faultInjectorClient.triggerAction({
        type: "failover",
        parameters: {
          cluster_index: 0,
        },
      });

      const sMigratingEventCount = diagnosticEvents.filter(
        (event) => event.type === "SMIGRATING"
      ).length;
      assert(
        sMigratingEventCount >= 1,
        "should have received at least one SMIGRATING notification"
      );
      const sMigratedEventCount = diagnosticEvents.filter(
        (event) => event.type === "SMIGRATED"
      ).length;
      assert(
        sMigratedEventCount >= 1,
        "should have received at least one SMIGRATED notification"
      );
      assert.equal(
        cluster.masters.length,
        MASTERS_COUNT - 1,
        `should have ${MASTERS_COUNT - 1} masters after failover`
      );
    },
    {
      numberOfMasters: MASTERS_COUNT,
      clusterConfiguration: {
        defaults: {
          maintNotifications: "enabled",
          maintEndpointType: "auto",
        },
        RESP: 3,
      },
    }
  );
});
