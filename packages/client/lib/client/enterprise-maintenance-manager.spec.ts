import assert from "node:assert";
import { createClient } from "../../";
import EnterpriseMaintenanceManager from "./enterprise-maintenance-manager";

describe("EnterpriseMaintenanceManager does not prevent proper options parsing", () => {
  it("should not throw when initializing without options", async () => {
    const client = createClient();
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });

  it("should not throw when initializing without url/socket and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });
  it("should not throw when initializing with url and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
      url: "redis://localhost:6379",
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });

  it("should not throw when initializing with socket and with maint", async () => {
    const client = createClient({
      maintNotifications: "enabled",
      RESP: 3,
      socket: {
        host: "localhost",
        port: 6379,
      },
    });
    assert.doesNotThrow(async () => {
      //Expected to reject because there is no url or socket provided and there is no running server on localhost
      await assert.rejects(client.connect);
    });
  });
});

/**
 * Tests for parseSMigratedPush function.
 *
 * RESP Protocol Data Format for SMIGRATED push notifications:
 * - The RESP decoder uses PUSH_TYPE_MAPPING which specifies Buffer for BLOB_STRING
 * - push[0]: Buffer containing "SMIGRATED" (blob string -> Buffer)
 * - push[1]: number (the sequence ID, decoded as JavaScript number)
 * - push[2]: Array of triplet arrays, where each triplet contains:
 *   - Buffer (source endpoint, e.g., "127.0.0.1:6379")
 *   - Buffer (destination endpoint, e.g., "127.0.0.2:6380")
 *   - Buffer (slots string, e.g., "123,456,789-1000")
 *
 * The parseSMigratedPush function uses String() to convert Buffer inputs,
 * so it handles both Buffer and string inputs correctly.
 */
describe("EnterpriseMaintenanceManager.parseSMigratedPush", () => {
  // Helper to create RESP-like push data with Buffer strings (matching actual decoder output)
  function createPush(seqId: number, triplets: [string, string, string][]): any[] {
    return [
      Buffer.from("SMIGRATED"),
      seqId,
      triplets.map(([src, dest, slots]) => [
        Buffer.from(src),
        Buffer.from(dest),
        Buffer.from(slots)
      ])
    ];
  }

  it("should parse a simple SMIGRATED push with single slot", () => {
    const push = createPush(15, [["127.0.0.1:6379", "127.0.0.2:6380", "123"]]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 15);
    assert.strictEqual(result.entries.length, 1);
    assert.deepStrictEqual(result.entries[0].source, { host: "127.0.0.1", port: 6379 });
    assert.strictEqual(result.entries[0].destinations.length, 1);
    assert.deepStrictEqual(result.entries[0].destinations[0].addr, { host: "127.0.0.2", port: 6380 });
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [123]);
  });

  it("should parse a SMIGRATED push with slot range", () => {
    const push = createPush(20, [["127.0.0.1:6379", "127.0.0.2:6380", "100-200"]]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 20);
    assert.strictEqual(result.entries.length, 1);
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [[100, 200]]);
  });

  it("should parse a SMIGRATED push with mixed slots and ranges", () => {
    const push = createPush(25, [["127.0.0.1:6379", "127.0.0.2:6380", "123,456,789-1000"]]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 25);
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [123, 456, [789, 1000]]);
  });

  it("should parse a SMIGRATED push with multiple triplets from same source", () => {
    const push = createPush(30, [
      ["127.0.0.1:6379", "127.0.0.2:6380", "100-200"],
      ["127.0.0.1:6379", "127.0.0.3:6381", "300-400"]
    ]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 30);
    assert.strictEqual(result.entries.length, 1);
    assert.deepStrictEqual(result.entries[0].source, { host: "127.0.0.1", port: 6379 });
    assert.strictEqual(result.entries[0].destinations.length, 2);
    assert.deepStrictEqual(result.entries[0].destinations[0].addr, { host: "127.0.0.2", port: 6380 });
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [[100, 200]]);
    assert.deepStrictEqual(result.entries[0].destinations[1].addr, { host: "127.0.0.3", port: 6381 });
    assert.deepStrictEqual(result.entries[0].destinations[1].slots, [[300, 400]]);
  });

  it("should parse a SMIGRATED push with multiple triplets to same destination (merges slots)", () => {
    const push = createPush(35, [
      ["127.0.0.1:6379", "127.0.0.2:6380", "100-200"],
      ["127.0.0.1:6379", "127.0.0.2:6380", "300,400"]
    ]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 35);
    assert.strictEqual(result.entries.length, 1);
    assert.strictEqual(result.entries[0].destinations.length, 1);
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [[100, 200], 300, 400]);
  });

  it("should parse a SMIGRATED push with multiple sources", () => {
    const push = createPush(40, [
      ["127.0.0.1:6379", "127.0.0.2:6380", "100-200"],
      ["127.0.0.3:6381", "127.0.0.4:6382", "300-400"]
    ]);

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 40);
    assert.strictEqual(result.entries.length, 2);

    const entry1 = result.entries.find(e => e.source.host === "127.0.0.1");
    const entry2 = result.entries.find(e => e.source.host === "127.0.0.3");

    assert.ok(entry1);
    assert.ok(entry2);
    assert.deepStrictEqual(entry1.source, { host: "127.0.0.1", port: 6379 });
    assert.deepStrictEqual(entry2.source, { host: "127.0.0.3", port: 6381 });
  });

  it("should handle string inputs for backwards compatibility", () => {
    // While the RESP decoder produces Buffers, the function should also handle
    // string inputs gracefully (e.g., for testing or alternative input sources)
    const push = [
      "SMIGRATED",
      45,
      [
        ["127.0.0.1:6379", "127.0.0.2:6380", "123,456"]
      ]
    ];

    const result = EnterpriseMaintenanceManager.parseSMigratedPush(push);

    assert.strictEqual(result.seqId, 45);
    assert.strictEqual(result.entries.length, 1);
    assert.deepStrictEqual(result.entries[0].source, { host: "127.0.0.1", port: 6379 });
    assert.deepStrictEqual(result.entries[0].destinations[0].slots, [123, 456]);
  });
});
