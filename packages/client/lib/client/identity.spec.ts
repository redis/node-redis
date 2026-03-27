import { strict as assert } from "node:assert";

import RedisClient from "./index";
import { generateClientId, generateClusterClientId } from "./identity";

describe("client identity", () => {
  it("generateClientId should include endpoint/db prefix and random hash suffix", () => {
    const id = generateClientId("127.0.0.1", 6379, 0);

    assert.match(id, /^127\.0\.0\.1:6379\/0-[0-9a-f]{8}$/);
    assert.ok(id.length <= 128);
  });

  it("generateClientId should truncate long prefixes", () => {
    const longHost = "x".repeat(300);
    const id = generateClientId(longHost, 6379, 0);

    assert.equal(id.length, 128);
    assert.match(id, /\.\.\.-[0-9a-f]{8}$/);
  });

  it("generateClientId should use unknown placeholders for missing values", () => {
    const id = generateClientId(undefined, undefined, undefined);

    assert.ok(id.length <= 128);
    assert.match(id, /^unknown:unknown\/unknown-[0-9a-f]{8}$/);
  });

  it("generateClusterClientId should include nodes and random hash suffix", () => {
    const id = generateClusterClientId([
      { socket: { host: "127.0.0.1", port: 7000 } },
      { socket: { host: "127.0.0.1", port: 7001 } },
    ]);

    assert.ok(id.length <= 128);
    assert.match(id, /^127\.0\.0\.1:7000,127\.0\.0\.1:7001-[0-9a-f]{8}$/);
  });

  it("client with unix socket path should get unknown host/port in identity id", () => {
    const client = RedisClient.create({
      socket: {
        path: "/tmp/redis.sock",
        tls: false,
      },
    });

    assert.match(client._clientId, /^unknown:unknown\/0-[0-9a-f]{8}$/);
  });
});
